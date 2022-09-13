// dependencies: npm install pixi.js

const Application = PIXI.Application; 

// general stage creation with parameters
const app = new Application({ 
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: 0xF6F3F2,
    antialias: true
}); 
const colorMap = new Map();
colorMap.set(3, 0x4287f5);
colorMap.set(9, 0x68cc7f);
colorMap.set(27, 0xDC58B5);
colorMap.set(81, 0xDCC558);
colorMap.set(243, 0xEE4040);
colorMap.set(729, 0xDC8958);
colorMap.set(2187, 0x3abdb0);

var score = 0;

// make "canvas" position static
app.renderer.view.style.position = 'absolute';

// add canvas to main document
document.body.appendChild(app.view);

// Graphics object used for drawing pretty much everything
const Graphics = PIXI.Graphics;

// number of tiles horizontally and vertically 
var tileCount = 4;

// used to turn gameplay off while tiles are moving and loading
var canPlay = true; 

// dimensions for drawing the main game play area
var boardDimensions = window.innerHeight * 0.85;
var offsetX = (window.innerWidth - boardDimensions) / 2;
var offsetY = window.innerHeight * 0.075;
var cornerAngle = 5;

// Draw the game board
const rectangle = new Graphics(); 
rectangle.beginFill(0xA8A5A5) 
.drawRoundedRect(
    offsetX, 
    offsetY, 
    boardDimensions, 
    boardDimensions,
    cornerAngle) 
.endFill(); 
app.stage.addChild(rectangle); 

// tile grid dimensions
var tileSize = (boardDimensions * .8) / tileCount;
var tilePadding = (boardDimensions * .2) / (tileCount + 1);

// Draw tile slots on the board
for (let i = 0; i < tileCount; i++) {
    for (let j = 0; j < tileCount; j++) {
        const rectangle = new Graphics(); 
        rectangle.beginFill(0xEEDADA) 
        .drawRoundedRect(
            offsetX + (tilePadding * (i + 1)) + (tileSize * i), 
            offsetY + (tilePadding * (j + 1)) + (tileSize * j), 
            tileSize, 
            tileSize,
            cornerAngle) 
        .endFill(); 
        app.stage.addChild(rectangle);
    }
}

// Create 2-D array to represent the game board. Initially set all cells to null 
var board = [];
for (var i = 0; i < tileCount; i++) {
    board[i] = [];
    for (var j = 0; j < tileCount; j++) {
        board[i][j] = null;
    }
}

// Arrays used to store important information about the state of the board and it's tiles 
var availableSpaces;
var canMoveLeft;
var canMoveRight;
var canMoveUp;
var canMoveDown;

function assessTheBoard() {
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
                }
                if (i < tileCount - 1 && board[i][j].right == null) {
                    canMoveRight.push(board[i][j]);
                }
                if (j < tileCount - 1 && board[i][j].down == null) {
                    canMoveDown.push(board[i][j]);
                }
                if (j > 0 && board[i][j].up == null) {
                    canMoveUp.push(board[i][j]);
                }
            }
        }
    }
}

// Text style used for numbers on the tiles 
const style = new PIXI.TextStyle({ 
    fontFamily: 'Montserrat', 
    fontSize: 25,
    fill: '0xF6F3F2',
});

// Tiles! 
// Create a self contained tile objects exist alone, but interacts with its neighbors
// when the need arises. Contains the logic necessary to be a well behaved tile
// and interact with other tiles. Additionally, drawing and animating will be handled individually
// by each tile. 
function Tile(x, y, value, id) {
    this.collapsed = false; 
    this.id = id;
    board[x][y] = this;
    this.value = value; // numerical value displayed on the tile 
    this.x = x; // location on the game board 
    this.y = y;

    this.execute = function() {
        app.stage.removeChild(myContainer);
    }

    // Record surrounding neighboring tiles as left, right, up, and down. If neighbors exist,
    // update neighbor's neighbors to include this tile. 
    this.updateNeighbors = function() {
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
            this.down = board[this.x][this.y + 1]
            if (this.down != null) {
                this.down.up = this; 
            }
        }
    }

    this.updateNeighbors();

    // Each tile has a container that holds the drawing of the tile and its current value 
    const myContainer = new PIXI.Container();

    // Create and draw the rectangle/main shape of the tile 
    const myRectangle = new Graphics(); 
    myRectangle.beginFill(colorMap.get(this.value))
    .drawRoundedRect(
        0,0,
        tileSize,
        tileSize,
        cornerAngle)
    .endFill(); 

    // Create text to display numerical value of this tile
    const myText = new PIXI.Text(value, style); 
        app.stage.addChild(myText); 
        myText.position.set(
            (tileSize / 2),
            (tileSize / 2))
        myText.anchor.x = 0.5;
        myText.anchor.y = 0.5;

    // Add elements to container, then add container to main stage 
    myContainer.addChild(myRectangle);
    myContainer.addChild(myText);
    // Position is calculated from within the bounds of the container of the main game board 
    myContainer.position.set(
        offsetX + (tilePadding * (this.x + 1)) + (tileSize * this.x),
        offsetY + (tilePadding * (this.y + 1)) + (tileSize * this.y));
    app.stage.addChild(myContainer);

    // Animates the creation of the tile
    this.spawnAnimation = function() {
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
    }

    this.spawnAnimation();

    // Check neighboring tile's value. If this tile and the neighboring tile share the same value,
    // this tile and the neighboring tile collapse into a single tile, with a new value.
    // The new value is the original value multiplied by three. 
    this.checkForCollapse = function (theDirection) {
        // Called when 'move right' is called. Check neighbor to the left 
        if (theDirection == 'right' && this.left != null && this.left.value == this.value) {
            this.value = this.value * 3;
            myText.text = this.value;

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
            score += this.value;
            this.collapsed = true;

        }
        if (theDirection == 'right' && this.left != null) {
            this.left.checkForCollapse('right');
        }

        if (theDirection == 'left' && this.right != null && this.right.value == this.value) {
            this.value = this.value * 3;
            myText.text = this.value;

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
            score += this.value;
            this.collapsed = true;


        }
        if (theDirection == 'left' && this.right != null) {
            this.right.checkForCollapse('left');
        }

        if (theDirection == 'down' && this.up != null && this.up.value == this.value) {
            this.value = this.value * 3;
            myText.text = this.value;

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
            score += this.value;
            this.collapsed = true;


        }
        if (theDirection == 'down' && this.up != null) {
            this.up.checkForCollapse('down');
        }

        if (theDirection == 'up' && this.down != null && this.down.value == this.value) {
            this.value = this.value * 3;
            myText.text = this.value;

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
            score += this.value;
            this.collapsed = true;


        }
        if (theDirection == 'up' && this.down != null) {
            this.down.checkForCollapse('up');
        }

        myRectangle.beginFill(colorMap.get(this.value))
            .drawRoundedRect(
            0,0,
            tileSize,
            tileSize,
            cornerAngle)
            .endFill(); 
        
        if (this.value == 6561) {
            window.alert("Good work, you win!")
        }

    }

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
                var myDestination = offsetX + (tilePadding * ((this.x + 1) + 1)) + (tileSize * (this.x + 1));

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
                var myDestination = offsetX + (tilePadding * ((this.x - 1) + 1)) + (tileSize * (this.x - 1));

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
                    // console.log("my id is: " + this.id + ", and my x coordinate is: " + this.x)
                    this.move('left');
                } 

                this.updateNeighbors();

            }
        } else if (theDirection == 'down') {
            if (this.y + 1 < tileCount && board[this.x][this.y + 1] == null) {
                var myDestination = offsetY + (tilePadding * ((this.y + 1) + 1)) + (tileSize * (this.y + 1));

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
                var myDestination = offsetY + (tilePadding * ((this.y - 1) + 1)) + (tileSize * (this.y - 1));

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
    }
}

// Creates randomly placed new tiles every turn, based on available spaces.
// New tiles always have a value or 3 or 9. Can create 1, 2, or 3 new tiles. 
function randomTiles(count) {
    const initialTileValues = [3, 9];
    assessTheBoard();
    var value = initialTileValues[Math.floor(Math.random() * 2)];

    if (availableSpaces.length > 0) {
        var index = Math.floor(Math.random() * availableSpaces.length);
        var newTileCoords = availableSpaces[index];
        board[newTileCoords.x][newTileCoords.y] = new Tile(newTileCoords.x, newTileCoords.y, value);
        availableSpaces.splice(index, 1);

        if (count < 1 && Math.floor(Math.random() * 4) == 1) { 
            randomTiles(count + 1);                             
        }
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
        setTimeout(function() {
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
        setTimeout(function() {
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
        setTimeout(function() {
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
        setTimeout(function() {
            for (var i = 0; i < tileCount; i++) {
                if (board[i][tileCount - 1] != null) {
                    board[i][tileCount - 1].checkForCollapse('down');
                }
            }
        }, collapseDelay);
    }
}

// Listens for key events, mainly the arrow keys. Tells the program to slide the tiles 
// accordingly. Has a delay built in to avoid rapid button pressing. Also, calls for
// additional random tiles after each move done by the player. 
document.addEventListener('keydown', function (e) {
    if (canPlay == true) {
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
        setTimeout(function () {
            randomTiles(0);
        }, 250);
        setTimeout(function () {
            canPlay = true;
        }, 600);
    }
})

// Gets the game started with a random tile or two. 
randomTiles();




