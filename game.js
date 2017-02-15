"use strict";



var squares;
var undoStack = [];
var frameCount = 0;
var clickDelay = 10;
var maxSimSquares = 2;
var gameWon = false;

var numSquaresPerRow = 4;


var padding = 5;
var COLORS = {
    RED: "#900000",
    BLUE: "#3333FF",
    GREEN: "lightgreen",
    GREY: "#484848"
};


//used to get the "opposite" of a color
var inverseColors = [];
inverseColors[COLORS.RED] = COLORS.BLUE;
inverseColors[COLORS.BLUE] = COLORS.RED;




var gArea = {
    canvas: document.getElementById("gameCV"),
    mouse: {
        x: null,
        y: null,
        isClicked: false
    },
    start: function () {
        this.context = this.canvas.getContext("2d");
        this.interval = setInterval(update, 10);
        this.canvas.addEventListener("mousemove", (evt) => {
            var rect = this.canvas.getBoundingClientRect();
            this.mouse.x = evt.clientX - rect.left;
            this.mouse.y = evt.clientY - rect.top;
        });


        //fixes the highlighting page issue
        document.getElementById('gameCV').onmousedown = function(){
            return false;
        };


        this.canvas.addEventListener("mousedown", checkForMouseClick);

        squares = generateSquareArray(numSquaresPerRow, numSquaresPerRow);
        get_starting_layout();



    },
    clear: function () {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
};




function update() {
    frameCount++;
    gArea.clear();
    drawSquareArray(squares);
    validate_and_update();
    debug();

}


function Square(xIndex, yIndex, color) {

    this.x = xIndex * gArea.canvas.width / numSquaresPerRow + (.5 * padding);
    this.y = yIndex * gArea.canvas.width / numSquaresPerRow + (.5 * padding);

    this.width = (gArea.canvas.width / numSquaresPerRow) - padding;
    this.height = (gArea.canvas.height / numSquaresPerRow) - padding;
    this.color = color;
    this.clicked = false;
    this.lastClickedFrameCount = -999;


    this.draw = function () {
        gArea.context.fillStyle = this.color;
        gArea.context.fillRect(this.x, this.y, this.width, this.height);
    };

    this.isPointInside = function (x, y) {
        return (x > this.x && x < this.x + this.width && y > this.y && y < this.y + this.height);
    };


    //xIndex and yIndex have to get passed here in order to propery update the undostack
    this.swapColor = function (xIndex, yIndex) {
        if (frameCount - this.lastClickedFrameCount > clickDelay) {
            //to detect change for undo stack
            var startingColor = this.color;

            this.clicked = true;
            if (this.color == COLORS.GREY) {
                this.color = COLORS.RED;
                this.highlighted = false;
            } else if (this.color == COLORS.RED) {
                this.color = COLORS.BLUE;
            } else if (this.color == COLORS.BLUE) {
                this.color = COLORS.GREY;
                this.clicked = false;
            }

            if (this.color != startingColor)
            {
                undoStack.push({x : xIndex, y : yIndex, oldColor: startingColor});
                console.log(undoStack);
            }
        }
    };

}


function generateSquareArray(rows, cols) {
    var squaresArray = [];
    for (var i = 0; i < rows; i++) {
        var rowArray = [];
        for (var j = 0; j < cols; j++) {
            rowArray.push(new Square(i, j, COLORS.GREY));
        }
        squaresArray.push(rowArray);
    }
    return squaresArray;
}

function drawSquareArray(sqArray) {
    for (var i = 0; i < sqArray.length; i++) {
        for (var j = 0; j < sqArray[i].length; j++) {
            sqArray[i][j].draw();
        }
    }
}


function checkForMouseClick(evt) {
    for (var i = 0; i < squares.length; i++) {
        for (var j = 0; j < squares[i].length; j++) {
            if (squares[i][j].isPointInside(gArea.mouse.x, gArea.mouse.y)) {
                squares[i][j].swapColor(i,j);
            }
        }
    }
}

function debug() {
    document.getElementById("isClicked").innerHTML = squares[0][0].clicked;
    document.getElementById("color").innerHTML = squares[0][0].color;
}


function rand_range(min, max)
{
    //INCLUSIVE
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function loadSquaresFromJson(squaresList, color)
{
    for (var i = 0; i < squaresList.length; i++)
    {
        var thisXY = squaresList[i];

        squares[thisXY[0]][thisXY[1]].color = color;
    }
}

function validate_and_update() {

    //are there no three adjacent (not diagnal) blocks of the same color?
    //this should return opposite of what it returns now for clairty
    var noThreeSm = three_neighbors_of_same_color_validated(squares);
    document.getElementById("threeSame").innerHTML = noThreeSm;

    //does every row and col have equal amount of red / blue and 0 grey?
    var rowColBal = validate_rows_and_cols_are_balanced(squares);
    document.getElementById("rowColBal").innerHTML = rowColBal;

    var noDupeColRows = validate_no_duplicate_rows_or_cols(squares);
    document.getElementById("noDupeColRows").innerHTML = noDupeColRows;

    if (noThreeSm && rowColBal && noDupeColRows && !gameWon)
    {

        $("#win").fadeIn(900).slideUp(5000);
        gameWon = true;
        setTimeout(function ()
        {
            squares = generateSquareArray(numSquaresPerRow, numSquaresPerRow);
            get_starting_layout();
            gameWon = false;
        }, 5000);
    }
}


function three_neighbors_of_same_color_validated(squareArr) {
    for (var y = 0; y < squareArr[0].length; y++) {
        for (var x = 0; x < squareArr.length - maxSimSquares; x++) {

            //check for 2 of same color to the right
            if (squareArr[x][y].color == squareArr[x + 1][y].color &&
                squareArr[x][y].color == squareArr[x + 2][y].color &&
                squareArr[x][y].color != COLORS.GREY) {
                return false;
            }

            //check for 2 of same color below. similar to above code
            if (squareArr[y][x].color == squareArr[y][x + 1].color &&
                squareArr[y][x].color == squareArr[y][x + 2].color &&
                squareArr[y][x].color != COLORS.GREY) {
                return false;
            }
        }
    }
    return true;
}


function get_col_at_index(ind, squareArr) {
    return squareArr[ind];
}

function get_row_at_index(ind, squareArr) {
    var returnArr = [];
    for (var i = 0; i < squareArr.length; i++) {
        returnArr.push(squareArr[i][ind]);
    }
    return returnArr;
}

function color_arr(sqArr) {
    return sqArr.map(function (el) {
        return el.color;
    });
}

function count(needle, haystack) {
    return haystack.filter(function (element) {
        return element == needle;
    }).length;
}

function validate_rows_and_cols_are_balanced(squareArr) {
    for (var i = 0; i < squareArr.length; i++) {
        var row = get_row_at_index(i, squareArr);
        var col = get_col_at_index(i, squareArr);

        var row_colors = color_arr(row);
        var col_colors = color_arr(col);

        if (count(COLORS.GREY, row_colors) != 0 ||
            (count(COLORS.RED, row_colors) != count(COLORS.BLUE, row_colors))) {
            return false;
        }

        if (count(COLORS.GREY, col_colors) != 0 ||
            (count(COLORS.RED, col_colors) != count(COLORS.BLUE, col_colors))) {
            return false;
        }
    }
    return true;
}

function validate_no_duplicate_rows_or_cols(squareArr) {

    for (var i = 0; i < squareArr.length; i++) {
        var row = get_row_at_index(i, squareArr);
        var col = get_col_at_index(i, squareArr);

        var row_colors = color_arr(row);
        var col_colors = color_arr(col);

        for (var j = 0; j < squareArr[i].length; j++) {

            var row2 = get_row_at_index(j, squareArr);
            var col2 = get_col_at_index(j, squareArr);

            var row2_colors = color_arr(row2);
            var col2_colors = color_arr(col2);

            //dont compare row/col to itself
            if (i == j) {
                continue;
            }

            if (arr_eq(row_colors, row2_colors)) {
                return false;
            }

            if (arr_eq(col_colors, col2_colors)) {
                return false;
            }
        }
    }
    return true
}

function arr_eq(arr1, arr2) {
    for (var i = 0; i < arr1.length; i++) {
        if (arr1[i] != arr2[i]) {
            return false;
        }
    }
    return true;
}

function get_starting_layout() {

    //i actually did write some code to generate these on the fly but it ended up being over 600 lines and
    //quite slow for grids bigger than 6x6. I don't think it's worth it to include it. So I can use that code to
    //generate me layouts and then just paste them in here

    var layouts = [];
    layouts[0] = {
        blueSquares : [
            [0,0],
            [3,1]
        ],
        redSquares : [
            [0,3],
            [1,1],
            [1,3]
        ]
    };

    layouts[1] = {
        blueSquares : [
            [3,2],
        ],
        redSquares : [
            [2,0],
            [0,3],
            [2,3],
        ]
    };

    layouts[2] = {
        blueSquares : [
            [3,0],
            [2,2],
            [2,3],
            [1,3],
        ],
        redSquares : [
            [0,2],
        ]
    };

    layouts[3] = {
        blueSquares : [
            [0,1],
            [0,3],
            [1,3],
        ],
        redSquares : [
            [2,2],
        ]
    };

    layouts[4] = {
        blueSquares : [
            [2,1],
        ],
        redSquares : [
            [3,0],
            [2,2],
            [0,2],
            [0,3],
        ]
    };


    var layout = layouts[rand_range(0, layouts.length-1)];
    loadSquaresFromJson(layout.blueSquares, COLORS.BLUE);
    loadSquaresFromJson(layout.redSquares, COLORS.RED);

}




function pprint_squares(squaresToPrint)
{

    var colorConvert = {};
    colorConvert[COLORS.RED] = "0";
    colorConvert[COLORS.BLUE] = "1";
    colorConvert[COLORS.GREY] = ".";
    colorConvert["X"] = "X"; //for testing

    for (var y = 0; y < squaresToPrint[0].length; y++)
    {
        var rowVals = [];
        for (var x = 0; x < squaresToPrint.length; x++)
        {
            rowVals.push(colorConvert[squaresToPrint[x][y].color]);
        }

        console.log(rowVals.join(" | "));
    }
}

function debug_print_squares(squaresToPrint)
{
    for (var x = 0; x < squaresToPrint.length; x++)
    {
        for (var y = 0; y < squaresToPrint.length; y++)
        {
            if (squares[x][y].color == COLORS.GREY)
            {
                continue;
            }

            var colTransForm = {};
            colTransForm[COLORS.RED] = "COLORS.RED";
            colTransForm[COLORS.BLUE] = "COLORS.BLUE";
            console.log("squares[" + x + "][" + y + "].color = " + colTransForm[squares[x][y].color]);
        }
    }
}

function undo() {
    if (undoStack.length > 0)
    {
        var undoMove = undoStack.pop();

        squares[undoMove.x][undoMove.y].color = undoMove.oldColor;
    }
}


function newGame()
{
    gameWon = false;
    squares = generateSquareArray(numSquaresPerRow, numSquaresPerRow);
    undoStack = [];
    get_starting_layout();
}


document.getElementById("undoBtn").onclick = function (){
    undo();
};

document.getElementById("newGameBtn").onclick = function (){
  newGame();
};

gArea.start();
