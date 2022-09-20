// dependencies: npm install pixi.js

const Application = PIXI.Application;

// general stage creation with parameters
const app = new Application({
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: 0xF6F3F2,
    antialias: true
});

// Map used for the different colors associated with different valued tiles
const colorMap = new Map();
colorMap.set(3, 0x4287f5);
colorMap.set(9, 0x68cc7f);
colorMap.set(27, 0xDC58B5);
colorMap.set(81, 0xDCC558);
colorMap.set(243, 0xEE4040);
colorMap.set(729, 0xDC8958);
colorMap.set(2187, 0x3abdb0);

var totalScore;
var isPlayable;

// make "canvas" position static
app.renderer.view.style.position = 'absolute';

// add canvas to main document
document.body.appendChild(app.view);

// Graphics object used for drawing pretty much everything
const Graphics = PIXI.Graphics;

// number of tiles horizontally and vertically 
var tileCount = 4;
var scoreCardCount = 10;

// used to turn gameplay off while tiles are moving and loading
var canPlay;
var gameOver;

var availableSpaces; // collection of empty spaces on the board
var canMoveLeft; // collections of tiles that can move left, right, up, down
var canMoveRight;
var canMoveUp;
var canMoveDown;
var scoreBoxes; // collection of score boxes
var board; // representation of the game board. Contains null or a Tile in each index 

// Dimensions of the game board and the score board areas 
var boardDimensions = window.innerHeight * 0.85;
var scoreBoardWidth = boardDimensions / 2;
var scoreBoardHeight = boardDimensions;

// Dimensions for the tile grid within the game board 
var tileSize = (boardDimensions * .8) / tileCount;
var tilePadding = (boardDimensions * .2) / (tileCount + 1);

// Dimensions for score card boxes within score board area 
var scoreBoxesHeight = (scoreBoardHeight * 0.8) / scoreCardCount;
var scoreBoxesPadding = (scoreBoardHeight * 0.2) / (scoreCardCount + 1);
var scoreBoxesWidth = scoreBoardWidth - (2 * scoreBoxesPadding);

// Offset lengths for the game board and score board areas 
var boardOffsetX = (window.innerWidth - boardDimensions + scoreBoardWidth + tilePadding) / 2;
var boardOffsetY = window.innerHeight * 0.075;
var scoreBoardOffsetX = (window.innerWidth - (boardDimensions + scoreBoardWidth + tilePadding)) / 2;
var scoreBoardOffsetY = boardOffsetY;

// Corner angle used for rounded rectangles 
var cornerAngle = 5;

// Text style used for numbers on the tiles 
const style = new PIXI.TextStyle({
    fontFamily: 'Montserrat',
    fontSize: 25,
    fill: '0xF6F3F2',
});

// Draw the score board
const scoreBoardRectangle = new Graphics();
scoreBoardRectangle.beginFill(0xA8A5A5)
    .drawRoundedRect(
        scoreBoardOffsetX,
        scoreBoardOffsetY,
        scoreBoardWidth,
        scoreBoardHeight,
        cornerAngle)
    .endFill();
app.stage.addChild(scoreBoardRectangle);

// Draw the game board
const gameRectangle = new Graphics();
gameRectangle.beginFill(0xA8A5A5)
    .drawRoundedRect(
        boardOffsetX,
        boardOffsetY,
        boardDimensions,
        boardDimensions,
        cornerAngle)
    .endFill();
app.stage.addChild(gameRectangle);

// Draw tile slots on the board
for (let i = 0; i < tileCount; i++) {
    for (let j = 0; j < tileCount; j++) {
        const rectangle = new Graphics();
        rectangle.beginFill(0xEEDADA)
            .drawRoundedRect(
                boardOffsetX + (tilePadding * (i + 1)) + (tileSize * i),
                boardOffsetY + (tilePadding * (j + 1)) + (tileSize * j),
                tileSize,
                tileSize,
                cornerAngle)
            .endFill();
        app.stage.addChild(rectangle);
    }
}

// when the game is over, trigger the user information collection 
function gameFinished() {
    scoreBoxes[0].setButton();
    canPlay = false;
    gameOver = true;
}

// Add a new entry to the leader board database 
async function putLeaderboard(thePlayer, theScore) {
    const url = `https://server-for-projects.herokuapp.com/putLeaderboard/` + thePlayer + `/` + theScore;

    const response = await fetch(url, {
        method: 'GET'
    });

    const scores = await response.json();
}

// Retrieve list of top 8 entries (sorted by score) from the leader board database 
async function updateLeaderboard() {
    const url = `https://server-for-projects.herokuapp.com/getLeaderboard/10`;

    const response = await fetch(url, {
        method: 'GET'
    });

    const scores = await response.json();

    for (var i = 2; i < scoreBoxes.length; i++) {

        if (scores[i - 2] != null) {
            scoreBoxes[i].setText(scores[i - 2].playername);
            scoreBoxes[i].setScore(scores[i - 2].score);
        }
    }
}

// Iterate through tiles on the board, and create arrays that contain tiles which currently
// have the ability to move in each direction. 
function assessTheBoard() {
    isPlayable = false;
    availableSpaces = [];
    canMoveLeft = [];
    canMoveRight = [];
    canMoveUp = [];
    canMoveDown = [];

    for (var i = 0; i < tileCount; i++) {
        for (var j = 0; j < tileCount; j++) {
            if (board[i][j] == null) {
                availableSpaces.push({ //  find all available spots
                    x: i,
                    y: j
                })
            } else {

                board[i][j].updateNeighbors();

                if (i > 0 && board[i][j].left == null) { // find which tiles can move in each direction 
                    canMoveLeft.push(board[i][j]);
                } else if (isPlayable == false && i > 0 && board[i][j].left.value == board[i][j].value) {
                    isPlayable = true;
                }

                if (i < tileCount - 1 && board[i][j].right == null) {
                    canMoveRight.push(board[i][j]);
                } else if (isPlayable == false && i < tileCount - 1 && board[i][j].right.value == board[i][j].value) {
                    isPlayable = true;
                }

                if (j < tileCount - 1 && board[i][j].down == null) {
                    canMoveDown.push(board[i][j]);
                } else if (isPlayable == false && j < tileCount - 1 && board[i][j].down.value == board[i][j].value) {
                    isPlayable = true;
                }

                if (j > 0 && board[i][j].up == null) {
                    canMoveUp.push(board[i][j]);
                } else if (isPlayable == false && j > 0 && board[i][j].up.value == board[i][j].value) {
                    isPlayable = true;
                }
            }
        }
    }

}

// Score box rectangles used for displaying the player's current score as well as
// the leader board scores. 
function ScoreBox(thePosition, theScore, theText) {
    const myContainer = new PIXI.Container();
    myScoreNum = theScore;
    myInputBar = '|';
    myText = theText;

    // Create and draw the rectangle/main shape of the score box  
    const myRectangle = new Graphics();
    myRectangle.beginFill(colorMap.get(9))
        .drawRoundedRect(
            0, 0,
            scoreBoxesWidth,
            scoreBoxesHeight,
            cornerAngle)
        .endFill();

    // Text displayed on the score box 
    const myDisplayText = new PIXI.Text(theText, style);
    myDisplayText.position.set(
        ((scoreBoxesWidth / 18)),
        (scoreBoxesHeight / 2))
    myDisplayText.anchor.x = 0;
    myDisplayText.anchor.y = 0.5;

    // Score displayed on the score box 
    const myScore = new PIXI.Text(theScore, style);
    myScore.position.set(
        (scoreBoxesWidth - (scoreBoxesWidth / 18)),
        (scoreBoxesHeight / 2))
    myScore.anchor.x = 1;
    myScore.anchor.y = 0.5;

    // Add elements to container, then add container to main stage 
    myContainer.addChild(myRectangle);
    myContainer.addChild(myDisplayText);
    myContainer.addChild(myScore);
    // Position is calculated from within the bounds of the container of the main score board area 
    myContainer.position.set(
        scoreBoardOffsetX + scoreBoxesPadding,
        scoreBoardOffsetY + (thePosition * scoreBoxesHeight) + ((thePosition + 1) * (scoreBoxesPadding))),
        app.stage.addChild(myContainer);

    this.setText = function (theText) {
        myText = theText;
        myDisplayText.text = myText;
    }

    this.addText = function (theText) {
        myText += theText;
        myDisplayText.text = myText;
    }

    this.setScore = function (theScore) {
        myScore.text = theScore;
    }

    this.setColor = function (theColor) {
        myRectangle.beginFill(theColor)
            .drawRoundedRect(
                0, 0,
                scoreBoxesWidth,
                scoreBoxesHeight,
                cornerAngle)
            .endFill();
    }

    this.setButton = function () {
        myContainer.interactive = true;
        myContainer.buttonMode = true;
        var alternate = true;
        var refreshRate = 500;
        this.setText("Enter Name Here");

        myColorInterval = setInterval(frame, refreshRate);
        myText = '';

        function frame() {
            if (alternate == true) {
                alternate = false;
                scoreBoxes[0].setColor(colorMap.get(243))
            } else {
                alternate = true;
                scoreBoxes[0].setColor(colorMap.get(81))
            }
        }

        myContainer.on('pointerdown', function () {
            listen();
            clearInterval(myColorInterval);
            myTypingInterval = setInterval(frame, refreshRate);
            myText = '';

            function frame() {
                if (alternate == true) {
                    alternate = false;
                    myDisplayText.text = myText + myInputBar;
                } else {
                    alternate = true;
                    myDisplayText.text = myText;
                }
            }
        })

        this.getTextLength = function () {
            return myText.length;
        }

        this.getScore = function () {
            return myScoreNum;
        }

        this.getText = function () {
            return myText;
        }

        this.backspace = function () {
            myText = myText.slice(0, -1);
        }
    }
}

// Tiles! 
// Create a self contained tile objects which exists alone, but interacts with its neighbors
// Contains the logic necessary to be a well behaved tile
// and interact with other tiles. Additionally, drawing and animating is handled individually
// by each tile. 
class Tile {
    constructor(x, y, value) {
        this.collapsed = false;
        board[x][y] = this;
        this.value = value; // numerical value displayed on the tile 
        this.x = x; // location on the game board 
        this.y = y;

        this.execute = function () {
            app.stage.removeChild(myContainer);
        };

        // Record surrounding neighboring tiles as left, right, up, and down. If neighbors exist,
        // update neighbor's neighbors to include this tile. 
        this.updateNeighbors = function () {
            if (this.x - 1 >= 0) {
                this.left = board[this.x - 1][this.y];
                if (this.left != null) {
                    this.left.right = this;
                }
            }
            if (this.x + 1 < tileCount) {
                this.right = board[this.x + 1][this.y];
                if (this.right != null) {
                    this.right.left = this;
                }
            }
            if (this.y - 1 >= 0) {
                this.up = board[this.x][this.y - 1];
                if (this.up != null) {
                    this.up.down = this;
                }
            }
            if (this.y + 1 < tileCount) {
                this.down = board[this.x][this.y + 1];
                if (this.down != null) {
                    this.down.up = this;
                }
            }
        };

        this.updateNeighbors();

        // Each tile has a container that holds the drawing of the tile and its current value 
        const myContainer = new PIXI.Container();

        // Create and draw the rectangle/main shape of the tile 
        const myRectangle = new Graphics();
        myRectangle.beginFill(colorMap.get(this.value))
            .drawRoundedRect(
                0, 0,
                tileSize,
                tileSize,
                cornerAngle)
            .endFill();

        // Create text to display numerical value of this tile
        const myText = new PIXI.Text(value, style);
        myText.position.set(
            (tileSize / 2),
            (tileSize / 2));
        myText.anchor.x = 0.5;
        myText.anchor.y = 0.5;

        // Add elements to container, then add container to main stage 
        myContainer.addChild(myRectangle);
        myContainer.addChild(myText);
        // Position is calculated from within the bounds of the container of the main game board 
        myContainer.position.set(
            boardOffsetX + (tilePadding * (this.x + 1)) + (tileSize * this.x),
            boardOffsetY + (tilePadding * (this.y + 1)) + (tileSize * this.y));
        app.stage.addChild(myContainer);

        // Animates the creation of the tile
        this.spawnAnimation = function () {
            let mySpawnInterval = null;
            var myRefreshRate = 10;
            var myGrowthRate = tileSize * 0.05;
            var myOffsetRate = myGrowthRate / 2;
            myRectangle.width = tileSize * 0.5;
            myRectangle.height = myRectangle.width;

            var x = myContainer.x;
            var y = myContainer.y;

            myContainer.x = myContainer.x + (tileSize * 0.25);
            myContainer.y = myContainer.y + (tileSize * 0.25);

            mySpawnInterval = setInterval(frame, myRefreshRate);

            function frame() {
                if (myRectangle.width + myGrowthRate < tileSize) {
                    myRectangle.width += myGrowthRate;
                    myRectangle.height = myRectangle.width;
                    myContainer.x -= myOffsetRate;
                    myContainer.y -= myOffsetRate;
                } else {
                    myRectangle.width = tileSize;
                    myRectangle.height = myRectangle.width;
                    myContainer.x = x;
                    myContainer.y = y;
                    clearInterval(mySpawnInterval);
                }
            }
        };

        this.spawnAnimation();

        // Check neighboring tile's value. If this tile and the neighboring tile share the same value,
        // this tile and the neighboring tile collapse into a single tile, with a new value.
        // The new value is the original value multiplied by three. 
        this.checkForCollapse = function (theDirection) {
            // Called when 'move right' is called. Check neighbor to the left 
            if (theDirection == 'right' && this.left != null && this.left.value == this.value) {
                this.value = this.value * 3;
                myText.text = this.value;
                totalScore += this.value;
                scoreBoxes[0].setScore(totalScore);


                if (this.left.left != null) { // cut out the middle man 
                    this.left = this.left.left;
                    this.left.right = this;
                } else {
                    this.left = null;
                }
                board[this.x - 1][this.y].execute();
                board[this.x - 1][this.y] = null;
                if (this.left != null) {
                    this.left.move('right');
                }
                this.collapsed = true;

            }
            if (theDirection == 'right' && this.left != null) {
                this.left.checkForCollapse('right');
            }

            if (theDirection == 'left' && this.right != null && this.right.value == this.value) {
                this.value = this.value * 3;
                myText.text = this.value;
                totalScore += this.value;
                scoreBoxes[0].setScore(totalScore);


                if (this.right.right != null) {
                    this.right = this.right.right;
                    this.right.left = this;
                } else {
                    this.right = null;
                }
                board[this.x + 1][this.y].execute();
                board[this.x + 1][this.y] = null;
                if (this.right != null) {
                    this.right.move('left');
                }
                this.collapsed = true;

            }
            if (theDirection == 'left' && this.right != null) {
                this.right.checkForCollapse('left');
            }

            if (theDirection == 'down' && this.up != null && this.up.value == this.value) {
                this.value = this.value * 3;
                myText.text = this.value;
                totalScore += this.value;
                scoreBoxes[0].setScore(totalScore);


                if (this.up.up != null) {
                    this.up = this.up.up;
                    this.up.down = this;
                } else {
                    this.up = null;
                }
                board[this.x][this.y - 1].execute();
                board[this.x][this.y - 1] = null;
                if (this.up != null) {
                    this.up.move('down');
                }
                this.collapsed = true;


            }
            if (theDirection == 'down' && this.up != null) {
                this.up.checkForCollapse('down');
            }

            if (theDirection == 'up' && this.down != null && this.down.value == this.value) {
                this.value = this.value * 3;
                myText.text = this.value;
                totalScore += this.value;
                scoreBoxes[0].setScore(totalScore);


                if (this.down.down != null) {
                    this.down = this.down.down;
                    this.down.up = this;
                } else {
                    this.down = null;
                }
                board[this.x][this.y + 1].execute();
                board[this.x][this.y + 1] = null;
                if (this.down != null) {
                    this.down.move('up');
                }
                this.collapsed = true;


            }
            if (theDirection == 'up' && this.down != null) {
                this.down.checkForCollapse('up');
            }

            myRectangle.beginFill(colorMap.get(this.value))
                .drawRoundedRect(
                    0, 0,
                    tileSize,
                    tileSize,
                    cornerAngle)
                .endFill();

            if (this.value == 6561) {
                gameFinished();
            }
        };

        // Move tile in theDirection, if possible. Notify neighbor to the direction opposite of theDirection
        // that they should move as well. Creates a chain reaction, moving all tiles within a given
        // row or column in theDirection. 
        this.move = function (theDirection) {
            var myTileSpeed = 4;
            var myRefreshRate = 1;
            let myInterval = null;
            clearInterval(myInterval);

            // Slide to the right
            if (theDirection == 'right') {
                if (this.x + 1 < tileCount && board[this.x + 1][this.y] == null) {
                    var myDestination = boardOffsetX + (tilePadding * ((this.x + 1) + 1)) + (tileSize * (this.x + 1));

                    board[this.x][this.y] = null;
                    this.x = this.x + 1;
                    board[this.x][this.y] = this;

                    myInterval = setInterval(frame, myRefreshRate);

                    function frame() {
                        if (myContainer.x + myTileSpeed < myDestination) {
                            myContainer.x += myTileSpeed;
                        } else {
                            myContainer.x = myDestination;
                            clearInterval(myInterval);
                        }
                    }

                    // make sure your neighbor to the left follows you 
                    if (this.left != null) {
                        this.left.move('right');
                    }

                    // if there is another space to the right, move again
                    if (this.x + 1 < tileCount) {
                        this.move('right');
                    }

                    this.updateNeighbors();
                }
            } else if (theDirection == 'left') {
                if (this.x - 1 >= 0 && board[this.x - 1][this.y] == null) {
                    var myDestination = boardOffsetX + (tilePadding * ((this.x - 1) + 1)) + (tileSize * (this.x - 1));

                    board[this.x][this.y] = null;
                    this.x = this.x - 1;
                    board[this.x][this.y] = this;

                    myInterval = setInterval(frame, myRefreshRate);

                    function frame() {
                        if (myContainer.x - myTileSpeed > myDestination) {
                            myContainer.x -= myTileSpeed;
                        } else {
                            myContainer.x = myDestination;
                            clearInterval(myInterval);
                        }
                    }

                    if (this.right != null) {
                        this.right.move('left');
                    }

                    if (this.x - 1 >= 0) {
                        this.move('left');
                    }

                    this.updateNeighbors();

                }
            } else if (theDirection == 'down') {
                if (this.y + 1 < tileCount && board[this.x][this.y + 1] == null) {
                    var myDestination = boardOffsetY + (tilePadding * ((this.y + 1) + 1)) + (tileSize * (this.y + 1));

                    board[this.x][this.y] = null;
                    this.y = this.y + 1;
                    board[this.x][this.y] = this;

                    myInterval = setInterval(frame, myRefreshRate);

                    function frame() {
                        if (myContainer.y + myTileSpeed < myDestination) {
                            myContainer.y += myTileSpeed;
                        } else {
                            myContainer.y = myDestination;
                            clearInterval(myInterval);
                        }
                    }

                    if (this.up != null) {
                        this.up.move('down');
                    }

                    if (this.y + 1 < tileCount) {
                        this.move('down');
                    }

                    this.updateNeighbors();

                }

            } else if (theDirection == 'up') {
                if (this.y - 1 >= 0 && board[this.x][this.y - 1] == null) {
                    var myDestination = boardOffsetY + (tilePadding * ((this.y - 1) + 1)) + (tileSize * (this.y - 1));

                    board[this.x][this.y] = null;
                    this.y = this.y - 1;
                    board[this.x][this.y] = this;

                    myInterval = setInterval(frame, myRefreshRate);

                    function frame() {
                        if (myContainer.y - myTileSpeed > myDestination) {
                            myContainer.y -= myTileSpeed;
                        } else {
                            myContainer.y = myDestination;
                            clearInterval(myInterval);
                        }
                    }

                    if (this.down != null) {
                        this.down.move('up');
                    }

                    if (this.y + 1 < tileCount) {
                        this.move('up');
                    }

                    this.updateNeighbors();

                }
            }
        };
    }
}

// Creates randomly placed new tiles every turn, based on available spaces.
// New tiles always have a value or 3 or 9. Can create 1 or 2 new tiles. 
function randomTiles(count) {
    const initialTileValues = [3, 9];
    assessTheBoard();
    var value = initialTileValues[Math.floor(Math.random() * 2)];

    if (availableSpaces.length > 0) {
        var index = Math.floor(Math.random() * availableSpaces.length);
        var newTileCoords = availableSpaces[index];
        board[newTileCoords.x][newTileCoords.y] = new Tile(newTileCoords.x, newTileCoords.y, value);
        availableSpaces.splice(index, 1);

        if (count < 1 && Math.floor(Math.random() * 10) == 1) {
            randomTiles(count + 1);
        }
    } else if (isPlayable == false) {
        gameFinished();
    }
}


// Uses collections of tiles collected by assessBoard to move all movable tiles
// on the board in the given direction. 
function slideAll(direction) {
    var collapseDelay = 25;
    if (direction == 'left') {
        for (var i = 0; i < canMoveLeft.length; i++) {
            canMoveLeft[i].move('left');
        }
        setTimeout(function () {
            for (var i = 0; i < tileCount; i++) {
                if (board[0][i] != null) {
                    board[0][i].checkForCollapse('left');
                }
            }
        }, collapseDelay);
    }

    if (direction == 'right') {
        for (var i = 0; i < canMoveRight.length; i++) {
            canMoveRight[i].move('right');
        }
        setTimeout(function () {
            for (var i = 0; i < tileCount; i++) {
                if (board[tileCount - 1][i] != null) {
                    board[tileCount - 1][i].checkForCollapse('right');
                }
            }
        }, collapseDelay);
    }

    if (direction == 'up') {
        for (var i = 0; i < canMoveUp.length; i++) {
            canMoveUp[i].move('up');
        }
        setTimeout(function () {
            for (var i = 0; i < tileCount; i++) {
                if (board[i][0] != null) {
                    board[i][0].checkForCollapse('up');
                }
            }
        }, collapseDelay);
    }

    if (direction == 'down') {
        for (var i = 0; i < canMoveDown.length; i++) {
            canMoveDown[i].move('down');
        }
        setTimeout(function () {
            for (var i = 0; i < tileCount; i++) {
                if (board[i][tileCount - 1] != null) {
                    board[i][tileCount - 1].checkForCollapse('down');
                }
            }
        }, collapseDelay);
    }
}

// Adds an event listener to the document, which allows the user
// to add their name to their score in order to add a new record
// to the leader board data base. Only accepts alphabetical, backspace,
// and enter inputs. 
function listen(remove) {
    document.addEventListener('keydown', type);
    function type(e) {
        if ((/[a-zA-Z]/).test(e.key) && e.key.length == 1 && scoreBoxes[0].getTextLength() < 14) {
            scoreBoxes[0].addText(e.key)
        } else if (e.key === 'Backspace') {
            scoreBoxes[0].backspace();
        } else if (e.key === 'Enter') {
            document.removeEventListener('keydown', type);
            startGame();
        }
    }
}

// Listens for key events, mainly the arrow keys. Tells the program to slide the tiles 
// accordingly. Has a delay built in to avoid rapid button pressing. Also, calls for
// additional random tiles to be created after each move done by the player. 
document.addEventListener('keydown', function (e) {
    if (canPlay == true
        && gameOver != true
        && (e.key === 'ArrowRight'
            || e.key === 'ArrowLeft'
            || e.key === 'ArrowUp'
            || e.key === 'ArrowDown')) {

        canPlay = false;
        assessTheBoard();

        if (e.key === 'ArrowRight') {
            slideAll('right');
        } else if (e.key === 'ArrowLeft') {
            slideAll('left');
        } else if (e.key === 'ArrowUp') {
            slideAll('up');
        } else if (e.key === 'ArrowDown') {
            slideAll('down');
        }

        assessTheBoard();

        setTimeout(function () {
            randomTiles(0);
        }, 250);
        setTimeout(function () {
            canPlay = true;
        }, 600);

    }
})

// Called when the page is loaded, and after a game is finished. Initializes
// the game state. 
function startGame() {
    if (scoreBoxes != null) {
        putLeaderboard(scoreBoxes[0].getText(), totalScore);
        for (var i = 0; i < board.length; i++) {
            for (var j = 0; j < board.length; j++) {
                if (board[i][j] != null) {
                    board[i][j].execute();
                }
            }
        }
    }

    scoreBoxes = [];
    board = [];
    canPlay = true;
    isPlayable = true; 
    gameOver = false;
    totalScore = 0;

    // Draw score board boxes on the score board 
    for (let i = 0; i < scoreCardCount; i++) {
        var scoreBox = new ScoreBox(i);
        scoreBoxes.push(scoreBox);
    }

    scoreBoxes[0].setText("Score: ")
    scoreBoxes[0].setScore(0)
    scoreBoxes[0].setColor(colorMap.get(27))
    scoreBoxes[1].setText("High Scores")
    scoreBoxes[1].setScore()
    scoreBoxes[1].setColor(colorMap.get(2187))

    updateLeaderboard()

    for (var i = 0; i < tileCount; i++) {
        board[i] = [];
        for (var j = 0; j < tileCount; j++) {
            board[i][j] = null;
        }
    }

    randomTiles();
}

// Called when the page is loaded, initializes the game state
startGame();





