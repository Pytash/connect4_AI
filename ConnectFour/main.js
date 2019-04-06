

//game parameters
const DELAY_COMP = 0.5; //seconds for the computer to take its turn
const GRID_CIRCLE = 0.7; //disc size
const GRID_COLS = 7; //number of columns
const GRID_ROWS = 6; //number of rows
const MARGIN = 0.02; //margin as a fraction of the shortest screen dimension

//colors
const COLOR_BACKGROUND = "white";
const COLOR_COMPUTER = "red";
const COLOR_COMPUTER_DARK = "darkred";
const COLOR_FRAME = "dodgerblue";
const COLOR_FRAME_BUTT = "royalblue";
const COLOR_PLAYER = "yellow";
const COLOR_PLAYER_DARK = "green";
const COLOR_TIE = "darkgrey";
const COLOR_TIE_DRK = "black";
const COLOR_WIN = "black";

//text
const TEXT_COMPUTER = "Computer";
const TEXT_PLAYER = "Player";
const TEXT_TIE = "Draw";
const TEXT_WIN = "Wins";


//classes
class Cell {
    constructor(left, top, width, height, row, col) {
        this.bot = top + height;
        this.left = left;
        this.right = left + width;
        this.top = top;
        this.w = width;
        this.h = height;
        this.row = row;
        this.col = col;
        this.cx = left + width / 2;
        this.cy = top + height / 2;
        this.r = width * GRID_CIRCLE / 2;
        this.highlight = null;
        this.owner = null;
        this.winner = false;
        
    }

    // makes certain that the disc is in the correct location
    contains(x, y) {
        return x > this.left && x < this.right && y > this.top && y < this.bot;
    }

    //draw the circle or hole
    draw(/** @type {CanvasRenderingContext2D} */ctx) {
        //owner color
        let color = this.owner == null ? COLOR_BACKGROUND : this.owner ? COLOR_PLAYER : COLOR_COMPUTER;

        //draw the circle
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(this.cx, this.cy, this.r, 0, Math.PI * 2);
        ctx.fill();

        //draw highlighting
        if (this.winner || this.highlight != null) {
            // color
            color = this.winner ? COLOR_WIN : this.highlight ? COLOR_PLAYER : COLOR_COMPUTER;

            //draw a circle around the perimeter
            ctx.lineWidth = this.r / 4;
            ctx.strokeStyle = color;
            ctx.beginPath();
            ctx.arc(this.cx, this.cy, this.r, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
}

//setup of canvas
var canv = document.createElement("canvas");
document.body.appendChild(canv);
var ctx = canv.getContext("2d");

//game variables
var gameOver, gameTied, grid = [], playersTurn, timeComp;


//dimensions
var height, width, margin;
setDimensions();

//event listener
canv.addEventListener("click", click);
canv.addEventListener("mousemove", highlightGrid);
window.addEventListener("resize", setDimensions);

//game loop
var timeDelta, timeLast;
requestAnimationFrame(loop);

function loop(timeNow) {
    //initialize timeLast
    if (!timeLast) {
        timeLast = timeNow;
    }

    //calculate time difference
    timeDelta = (timeNow - timeLast) / 1000;
    timeLast = timeNow;

    //update
    goComputer(timeDelta);

    //draws the background, grid, and text when game over
    drawBackground();
    drawGrid();
    drawText();

    //call the next frame
    requestAnimationFrame(loop);
}

function checkWin(row, col) {
    //get all the cells from each direction
    let diagL = [], diagR = [], horiz = [], vert = [];
    for (let i = 0; i < GRID_ROWS; i++) {
        for (let j = 0; j < GRID_COLS; j++) {
            //horizontal cells
            if (i == row) {
                horiz.push(grid[i][j]);
            }

            //vertical cells
            if (j == col) {
                vert.push(grid[i][j]);
            }

            //top left to bottom right
            if (i - j == row - col) {
                diagL.push(grid[i][j]);
            }

             //top right to bottom left
             if (i + j == row + col) {
                diagR.push(grid[i][j]);
            }
        }
    }

    //if any have four in a row, return a win
    return connect4(diagL) || connect4(diagR) || connect4(horiz) || connect4(vert);
}

function connect4(cells = []) {
    let count = 0, lastOwner = null;
    let winningCells = [];
    for (let i = 0; i < cells.length; i++) {
        //no owner, reset the count
        if (cells[i].owner == null) {
            count = 0;
            winningCells = [];
        }

        // same owner, add to the count
        else if (cells[i].owner == lastOwner) {
            count++;
            winningCells.push(cells[i]);
        }

        //new owner, new count
        else {
            count = 1;
            winningCells = [];
            winningCells.push(cells[i]);
        }

        //set the lastOwner
        lastOwner = cells[i].owner;

        //four in a row is a win
        if (count == 4) {
            for (let cell of winningCells) {
                cell.winner = true;
            }
            return true;
        }
    }
    return false;
}

function click(e) {
    if (gameOver) {
        newGame();
        return;
    }

    //when it is not the player's turn return so the player does not click a circle
    if (!playersTurn) {
        return;
    }

    selectCell();
}

// creates the game's grid
function createGrid()  {
    grid = [];

    //setup cell size and margins
    let cell, marginX, marginY;

    //portrait
    if ((width - margin * 2) * GRID_ROWS / GRID_COLS < height - margin * 2) {
        cell = (width - margin * 2) / GRID_COLS;
        marginX = margin;
        marginY = (height - cell * GRID_ROWS) / 2;
    }
    //landscape
    else {
        cell = (height - margin * 2) / GRID_ROWS;
        marginX = (width - cell * GRID_COLS) / 2;
        marginY = margin;
    }

    //populate the grid
    for (let i = 0; i < GRID_ROWS; i++) {
        grid[i] = [];
        for (let j = 0; j < GRID_COLS; j++) {
            let left = marginX + j * cell;
            let top = marginY + i * cell;
            grid[i][j] = new Cell(left, top, cell, cell, i, j);
        }
    }
}

// draws the background of the canvas
function drawBackground() {
    ctx.fillStyle = COLOR_BACKGROUND;
    ctx.fillRect(0, 0, width, height);
}

function drawGrid() {
    //frame and bottom
    let cell = grid[0][0];
    let fh = cell.h * GRID_ROWS;
    let fw = cell.w * GRID_COLS;
    ctx.fillStyle = COLOR_FRAME;
    ctx.fillRect(cell.left, cell.top, fw, fh);
    ctx.fillStyle = COLOR_FRAME_BUTT;
    ctx.fillRect(cell.left - margin / 2, cell.top + fh - margin / 2, fw + margin, margin);

    //cells
    for (let row of grid) {
        for (let cell of row) {
            cell.draw(ctx);
        }
    }
}

// draws the text depending on game's outcome
function drawText() {
    if (!gameOver) {
        return;
    }

    //setup text parameters
    let size = grid[0][0].h;
    ctx.fillStyle = gameTied ? COLOR_TIE : playersTurn ? COLOR_PLAYER : COLOR_COMPUTER;
    ctx.font = size + "px dejavu sans mono";
    ctx.lineJoin = "round";
    ctx.lineWidth = size / 10;
    ctx.strokeStyle = gameTied ? COLOR_TIE_DRK : playersTurn ? COLOR_PLAYER_DARK : COLOR_COMPUTER_DARK;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    //draw the text
    let offset = size * 0.55;
    let text = gameTied ? TEXT_TIE : playersTurn ? TEXT_PLAYER : TEXT_COMPUTER;
    if (gameTied) {
        ctx.strokeText(text, width / 2, height / 2);
        ctx.fillText(text, width / 2, height / 2);
    } else {
        ctx.strokeText(text, width / 2, height / 2 - offset);
        ctx.fillText(text, width / 2, height / 2 - offset);
        ctx.strokeText(TEXT_WIN, width / 2, height / 2 + offset);
        ctx.fillText(TEXT_WIN, width / 2, height / 2 + offset);

    }
}

function goComputer(delta) {
    if (playersTurn || gameOver) {
        return;
    }

    // count down till the computer makes its selection
    if (timeComp > 0) {
        timeComp -= delta;
        if (timeComp <= 0) {
            selectCell();
        }
        return;
    }

    // set up the priorities array
    let priorities = [];
    priorities[0] = []; // computer wins
    priorities[1] = []; // block the player from winning
    priorities[2] = []; // random move
    priorities[3] = []; // gives away win, happens if player can win in two different places

    // loop through each column
    let cell;
    for (let i = 0; i < GRID_COLS; i++) {
        cell = highlightCell(grid[0][i].cx, grid[0][i].cy);

        // column full, go to the next column
        if (cell == null) {
            continue;
        }

        // first priority, computer wins
        cell.owner = playersTurn;
        if (checkWin(cell.row, cell.col)) {
            priorities[0].push(i);
        } else {
        
            // second priority, block the player
            cell.owner = !playersTurn;
            if (checkWin(cell.row, cell.col)) {
                priorities[1].push(i);
            } else {
                cell.owner = playersTurn;

                // check the cell above
                if (cell.row > 0) {
                    grid[cell.row - 1][cell.col].owner = !playersTurn;

                    // last priority, let player win
                    if (checkWin(cell.row - 1, cell.col)) {
                        priorities[3].push(i);
                    }

                    // third priority, no significance
                    else {
                        priorities[2].push(i);
                    }

                    // deselect cell above
                    grid[cell.row - 1][cell.col].owner = null;
                }

                // no row above, third priority, no significance
                else {
                    priorities[2].push(i);
                }
            }
        }

        // cancel highlight and selection
        cell.highlight = null;
        cell.owner = null;
    }

    // clear the winning cells
    for (let row of grid) {
        for (let cell of row) {
            cell.winner = false;
        }
    }

    // randomly select a column in priority order
    let col;
    if (priorities[0].length > 0) {
        col = priorities[0][Math.floor(Math.random() * priorities[0].length)];
    } else if (priorities[1].length > 0) {
        col = priorities[1][Math.floor(Math.random() * priorities[1].length)];
    } else if (priorities[2].length > 0) {
        col = priorities[2][Math.floor(Math.random() * priorities[2].length)];
    } else if (priorities[3].length > 0) {
        col = priorities[3][Math.floor(Math.random() * priorities[3].length)];
    }

    // highlight the selected cell
    highlightCell(grid[0][col].cx, grid[0][col].cy);

    // set the delay
    timeComp = DELAY_COMP;
}

function highlightCell(x, y) {
    let col = null;
    for (let row of grid) {
        for (let cell of row) {
            //clear existing highlighting
            cell.highlight = null;

            //get the column
            if (cell.contains(x, y)) {
                col = cell.col;
            }
        }
    }
    if (col == null) {
        return;
    }

    //highlight the first unoccupied cell
    for (let i = GRID_ROWS - 1; i >= 0; i--) {
        if (grid[i][col].owner == null) {
            grid[i][col].highlight = playersTurn;
            return grid[i][col];
        }
    }
    return null;
}

// determines whether to highlight the cell if it is player's turn
function highlightGrid(e) {
    //if it is the computer's turn or the game is over do not highlight
    if (!playersTurn || gameOver) {
        return;
    }
    highlightCell(e.clientX, e.clientY);
}

// starts new game
function newGame() {
    // randomizes whether the user or the computer plays first
    playersTurn = Math.random() < 0.5;
    gameOver = false;
    gameTied = false;
    createGrid();
}

// highlights the selected cell
function selectCell() {
    let highlighting = false;
    OUTER: for (let row of grid) {
        for (let cell of row) {
            if (cell.highlight != null) {
                highlighting = true;
                cell.highlight = null;
                cell.owner = playersTurn;
                if (checkWin(cell.row, cell.col)) {
                    gameOver = true;
                }
                break OUTER;
            }
        }
    }

    //do not allow selection if no highlighting
    if (!highlighting) {
        return;
    }

    //checks for a tied game
    if (!gameOver) {
        gameTied = true;
        OUTER: for (let row of grid) {
            for (let cell of row) {
                if (cell.owner == null) {
                    gameTied = false;
                    break OUTER;
                }
            }
        }

        if (gameTied) {
            gameOver = true;
        }
    }

    //switch the player if the game is not over
    if (!gameOver) {
        playersTurn = !playersTurn;
    }
}

// sets the dimensions of the game
function setDimensions() {
    height = window.innerHeight;
    width = window.innerWidth;
    canv.height = height;
    canv.width = width;
    margin = MARGIN * Math.min(height, width);
    newGame();
}