// Define an object to hold all images for the game.
// This object type is known as a singleton

var imageRepository = new function() {
  // define images
  this.empty = null;
  this.background = new Image();
  // set images src
  this.background.src = "imgs/bg.png";
};

// create the Drawable object which will be the 
// base class for all drawable objects. Set up 
// default variables that all child objects will
// inherit, as well as default functions.

function Drawable() {
  this.init =function(x,y) {
    // default variables
    this.x=x;
    this.y=y;
  };
  this.speed = 0;
  this.canvasWidth = 0;
  this.canvasHeight = 0;

  // define abstract function to be impemented
  // in child functions
  this.draw = function() {
    // abstract object, don't create object from it
  };
}

// creates the Background object which will become
// a child of the Drawable object. The background
// is drawn on the "background" canvas and 
// creates the illusion of moving

function Background() {
  this.speed = 1; 
  // defines speed of background panning
  this.draw = function() {
    this.y += this.speed;
    this.context.drawImage(imageRepository.background, this.x, this.y);
    // draw another image at the top edge of the first image
    this.context.drawImage(imageRepository.background, this.x, this.y - this.canvasHeight);
    // reset if imaged panned off screen
    if (this.y >= this.canvasHeight)
      this.y = 0;
  };
}
// set Background to inherit properties from Drawable
Background.prototype = new Drawable();

// creates the Game object which will hold all objects
// and data for the game

function Game() {
// gets canvas info and context and sets up all 
// game objects.
// Returns true if the canvas is supported and 
// false if it is not. This will stop animation
// from constantly running on old browsers
this.init = function() {
  // get the canvas element
  this.bgCanvas=document.getElementById('background');
  // test is see if canvas is supported
  if (this.bgCanvas.getContext) {
    this.bgContext = this.bgCanvas.getContext('2d');
  // initialize objects to contain their context and canvas info
Background.prototype.context = this.bgContext;
Background.prototype.canvasWidth = this.bgCanvas.width;
Background.prototype.canvasHeight = this.bgCanvas.height;
// init the background object
this.background = new Background();
this.background.init(0,0); // Set draw point 0,0
return true;
} else {
  return false;

  }
};
 
 // start animation loop
 this.start = function() {
  animate();
 };
}

// the animation loop. Calls the requestAnimationFrame
// shim to optimize the game loop and draws all game
// objects. This function must be a global function
// and cannot be within an object

function animate() {
  requestAnimFrame (animate);
  game.background.draw();
}

// requestAnimFrame shim layer by Paul Irish
// Finds the first API that works to optimize
// the animation loop, otherwise defaults to 
// setTimeout().

window.requestAnimFrame = (function() {
  return window.requestAnimationFrame   ||
    window.webkitRequestAnimationFrame  ||
    window.mozRequestAnimationFrame     ||
    window.oRequestAnimationFrame       ||
    window.msRequestAnimationFrame      ||
    function(callback, element) {//function , DOM element
      window.setTimeout(callback, 1000 / 60);
    };
})();

// Init the game and start

var game = new Game();

function init() {
  if(game.init())
    game.start();
}
