// dependencies: npm install pixi.js

const Application = PIXI.Application; 

// general "canvas" creation with parameters
const app = new Application({ 
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: 0xecede4,
    antialias: true
}); 

// make "canvas" position static
app.renderer.view.style.position = 'absolute';

// add canvas to main document
document.body.appendChild(app.view);

// Graphics object used for drawing pretty much everything
const Graphics = PIXI.Graphics;

// Create main rectangle
const rectangle = new Graphics(); 
rectangle.beginFill(0xAA33BB) 
.lineStyle(4, 0xFFEA00, 1) 
.drawRect(200, 200, 100, 120) 
.endFill(); 
app.stage.addChild(rectangle); 

