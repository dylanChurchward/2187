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
// Create main game board 
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
// Create tile locations, 9x9 grid 
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

const style = new PIXI.TextStyle({ // to style text, we create one of these puppies
    fontFamily: 'Montserrat', // can basically do whatever we would with CSS
    fontSize: 25,
    fill: '0xF6F3F2',
});

// Game board tile object
function Tile(x, y, value) {
    this.value = value; // numerical value displayed on the tile 
    this.westNeighbor = null; // adjacent tiles
    this.northNeighbor = null;
    this.eastNeighbor = null;
    this.southNeighbor = null;
    this.x = x;
    this.y = y;

    // move the tile in the appropriate direction on the game board
    this.slide = function(direction) { 
        if (direction == 'west' && this.x > 0) {
            while(this.westNeighbor == null && this.x > 0) {
                // update neighbors as we go 
                board[this.x - 1][this.y] = this;
                board[this.x][this.y] = null;
                this.x -= 1;
            }
        }
        this.draw(); 
    };

    // draw the tile 
    this.draw = function() {
        const rectangle = new Graphics(); // refactor to global rectangle? 
        rectangle.beginFill(0x4287f5) 
        .drawRoundedRect(
            offsetX + (tilePadding * (this.x + 1)) + (tileSize * this.x), 
            offsetY + (tilePadding * (this.y + 1)) + (tileSize * this.y), 
            tileSize, 
            tileSize,
            cornerAngle
            ) 
        .endFill(); 
        app.stage.addChild(rectangle); 

        const myText = new PIXI.Text('6', style); // global style object at this point. refactor? 
        app.stage.addChild(myText); 
        myText.position.set(
            offsetX + (tilePadding * (this.x + 1)) + (tileSize * this.x) + (tileSize / 2),
            offsetY + (tilePadding * (this.y + 1)) + (tileSize * this.y) + (tileSize / 2))
        myText.anchor.x = 0.5;
        myText.anchor.y = 0.5;
        app.stage.addChild(myText);
    };
}


// just for testing
var t = new Tile(0,0,9);
board[5][5] = t;
t.draw();
console.log(board);


