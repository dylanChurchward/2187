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
function Tile(x, y, value, id) {
    this.id = id;
    board[x][y] = this;
    this.value = value; // numerical value displayed on the tile 
    this.x = x; // location on the game board 
    this.y = y;

    this.execute = function() {
        app.stage.removeChild(myContainer);
    }

    if (x - 1 >= 0) this.left = board[x - 1][y];
    if (y - 1 >= 0) this.up = board[x][y - 1];
    if (x + 1 < tileCount) this.right = board[x + 1][y];
    if (y + 1 < tileCount) this.down = board[x][y + 1];

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

    // Create text to display numerical value of this tile
    const myText = new PIXI.Text(value, style); // global style object at this point. refactor? 
        app.stage.addChild(myText); 
        myText.position.set(
            (tileSize / 2),
            (tileSize / 2))
        myText.anchor.x = 0.5;
        myText.anchor.y = 0.5;

    // Add elements to container, then container to main stage 
    myContainer.addChild(myRectangle);
    myContainer.addChild(myText);
    // Position is calculated relative to the containers location within the bounds
    // of the main gameboard
    myContainer.position.set(
        offsetX + (tilePadding * (this.x + 1)) + (tileSize * this.x),
        offsetY + (tilePadding * (this.y + 1)) + (tileSize * this.y));
    app.stage.addChild(myContainer);
    
    // Check to the left for combining tiles 
    this.checkForCollapse = function () {
        // See if neighbor to the left wants to combine powers 
        if (this.left.value == this.value) {
            this.value = this.value * 3; 
            myText.text = this.value;
            console.log("my id is: " + this.id + ", and my value is: " + myText.text + ", and my coordinate is: " + this.x)

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
                this.left.checkForCollapse();
            }
        }
        
    }

    this.move = function(direction) {
        this.powerMove(direction);
    }

    // currently moves the squares to the right to location specified by destination
    this.powerMove = function (theDirection) {
        var myTileSpeed = 4;
        var myRefreshRate = 5;
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
                    this.powerMove('right');
                } 

            }

            // if (this.x + 1 == tileCount && reachedEnd == false) {
            //     reachedEnd = true;
            // console.log("my ID: " + this.id + ", my value is: " + this.value + ", my x coord is: " + this.x)
            //     this.checkForCollapse();
            // }


            // Check up on your neighbors 
            if (this.x - 1 >= 0) this.left = board[this.x - 1][this.y];
            if (this.y - 1 >= 0) this.up = board[this.x][this.y - 1];
            if (this.x + 1 < tileCount) this.right = board[this.x + 1][this.y];
            if (this.y + 1 < tileCount) this.down = board[this.x][this.y + 1];

        }
        

        // } else if (theDirection == 'down' && board[theX][theY + 1] == null) {
       
        // } else if (theY - 1 >= 0 && theDirection == 'left' && board[theX - 1][theY] == null) {
     
        // } else if (theDirection == 'up' && board[theX][theY - 1] == null) {
       
        // }
    }
}

document.addEventListener('keydown', function(e) {
    if (e.key ==='ArrowRight') {
        z.move('right');
        z.checkForCollapse();
        // v = new Tile(0,0,3, 10);
        // h = new Tile(2,0,3, 30);
    } else if (e.key === 'ArrowLeft') {
        console.log(board)
    
    } else if (e.key === 'ArrowUp') {
        x =new Tile(0,0,76, 800);
    } 
    else if (e.key === 'ArrowDown') {
        x.move('right');
    }
})


// just for testing
var x;
var v = new Tile(0,0,3, 10);
var q = new Tile(1,0,3, 20);
var h = new Tile(2,0,3, 30);
var z = new Tile(3,0,3, 40);



// u.move('up');
// u.move('down');
// u.move('left');
// u.move('right');


// board[0][0] = t;
// t.draw();
console.log(board);


