// dependencies: npm install pixi.js

const Application = PIXI.Application; 

// general "canvas" creation with parameters
const app = new Application({ 
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: 0xF6F3F2,
    antialias: true
}); 

// make "canvas" position static
app.renderer.view.style.position = 'absolute';

// add canvas to main document
document.body.appendChild(app.view);

// Graphics object used for drawing pretty much everything
const Graphics = PIXI.Graphics;

// number of tiles horizontally and vertically 
var tileCount = 9;


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
var tileSize = (boardDimensions * .8) / 9;
var tilePadding = (boardDimensions * .2) / 10;

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

// Text style used for numbers on the tiles 
const style = new PIXI.TextStyle({ 
    fontFamily: 'Montserrat', 
    fontSize: 25,
    fill: '0xF6F3F2',
});

// Tiles! 
// Idea: Make self contained tile objects that can exist alone, but interact with their neighbors
// when the need arises. Each tile will contain the logic necessary to be a well behaved tile
// and interact with other tiles. Additionally, drawing and animating will be handled individually
// by each tile. 
function Tile(x, y, value) {
    board[x][y] = this;
    this.value = value; // numerical value displayed on the tile 
    this.left = null; // adjacent tiles
    this.above = null;
    this.right = null;
    this.below = null;
    this.x = x; // location on the game board 
    this.y = y;

    // Each tile has a container that holds the drawing of the tile and its current value 
    const myContainer = new PIXI.Container();

    // Create and draw the rectangle/main shape of the tile 
    const myRectangle = new Graphics(); 
    myRectangle.beginFill(0x4287f5)
    .drawRoundedRect(
        0,0,
        tileSize,
        tileSize,
        cornerAngle)
    .endFill(); 

    // offsetX + (tilePadding * (this.x + 1)) + (tileSize * this.x),
    //     offsetY + (tilePadding * (this.y + 1)) + (tileSize * this.y),

    // Create text to display numerical value of this tile
    const myText = new PIXI.Text(value, style); // global style object at this point. refactor? 
        app.stage.addChild(myText); 
        myText.position.set(
            (tileSize / 2),
            (tileSize / 2))
        myText.anchor.x = 0.5;
        myText.anchor.y = 0.5;

        // offsetX + (tilePadding * (this.x + 1)) + (tileSize * this.x) + (tileSize / 2),
        //     offsetY + (tilePadding * (this.y + 1)) + (tileSize * this.y) + (tileSize / 2))

    // Add elements to container, then container to main stage 
    myContainer.addChild(myRectangle);
    myContainer.addChild(myText);
    // Position is calculated relative to the containers location within the bounds
    // of the main gameboard
    myContainer.position.set(
        offsetX + (tilePadding * (this.x + 1)) + (tileSize * this.x),
        offsetY + (tilePadding * (this.y + 1)) + (tileSize * this.y));
    app.stage.addChild(myContainer);

    this.move = function(direction) {
        this.powerMove(this.x, this.y, direction);
    }

    // currently moves the squares to the right to location specified by destination
    this.powerMove = function (x, y, direction) {
        if (direction == 'right' && board[x + 1][y] == null) {
            board[x][y] = null;
            var speed = 5;
            let id = null;
            clearInterval(id);
            id = setInterval(frame, speed);
            function frame() {
                var destInPixels = offsetX + (tilePadding * ((x + 1) + 1)) + (tileSize * (x + 1));
                if (myContainer.x + speed < destInPixels) {
                    myContainer.x += speed;
                } else {
                    myContainer.x = destInPixels;
                    clearInterval(id);
                }
            }
            x = x + 1;
            if (x + 2 < tileCount) {
                this.powerMove(x + 1, y, 'right');
            } else {
                board[x + 1][y] = this;
            }
        } else if (direction == 'down' && board[x][y + 1] == null) {
            board[x][y] = null;
            var speed = 5;
            let id = null;
            clearInterval(id);
            id = setInterval(frame, speed);
            function frame() {
                var destInPixels = offsetY + (tilePadding * ((y + 1) + 1)) + (tileSize * (y + 1));
                if (myContainer.y + speed < destInPixels) {
                    myContainer.y += speed;
                } else {
                    myContainer.y = destInPixels;
                    clearInterval(id);
                }
            }
            y = y + 1;
            if (y + 2 < tileCount) {
                this.powerMove(x, y + 1, 'down');
            } else {
                board[x][y + 1] = this;
            }
        } else if (direction == 'left' && board[x - 1][y] == null) {
            board[x][y] = null;
            var speed = -5;
            let id = null;
            clearInterval(id);
            id = setInterval(frame, 5);
            function frame() {
                var destInPixels = offsetX + (tilePadding * ((x - 1) + 1)) + (tileSize * (x - 1));
                if (myContainer.x + speed > destInPixels) {
                    myContainer.x += speed;
                } else {
                    myContainer.x = destInPixels;
                    clearInterval(id);
                }
            }
            x = x - 1;
            if (x - 2 > 0) {
                this.powerMove(x - 1, y, 'left');
            } else {
                board[x - 1][y] = this;
            }
        } else if (direction == 'up' && board[x][y - 1] == null) {
            board[x][y] = null;
            var speed = -5;
            let id = null;
            clearInterval(id);
            id = setInterval(frame, 5);
            function frame() {
                var destInPixels = offsetY + (tilePadding * ((y - 1) + 1)) + (tileSize * (y - 1));
                if (myContainer.y + speed > destInPixels) {
                    myContainer.y += speed;
                } else {
                    myContainer.y = destInPixels;
                    clearInterval(id);
                }
            }
            y = y - 1;
            if (y - 2 > 0) {
                this.powerMove(x, y - 1, 'up');
            } else {
                board[x][y - 1] = this;
            }
        }
    }
}

document.addEventListener('keydown', function(e) {
    if (e.key ==='ArrowRight') {
        u.move('right');
    } else if (e.key === 'ArrowLeft') {
        u.move('left');
    } else if (e.key === 'ArrowUp') {
        u.move('up');
    } else if (e.key === 'ArrowDown') {
        u.move('down');
    }
})


// just for testing
var u = new Tile(4,4,1);

// u.move('up');
// u.move('down');
// u.move('left');
u.move('right');


// board[0][0] = t;
// t.draw();
console.log(board);


