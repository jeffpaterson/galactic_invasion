//***********************
//* By Jeff Paterson, based on
//* Straker's Galaxian-clone canvas game tutorial
//***********************

// Init the game and start

var game = new Game();

function init() {
  if(game.init())
    game.start();
}

// Define an object to hold all images for the game.
// This object type is known as a singleton

var imageRepository = new function() {
  // define images
  this.background = new Image();
  this.spaceship = new Image();
  this.bullet = new Image();
  
  //ensure all images have loaded prior to game start
  var numImages = 3;
  var numLoaded = 0;

  function imageLoaded() {
    numLoaded++;
    if (numLoaded === numImages) {
      window.init();
    }
  }

    this.background.onload = function() {
      imageLoaded();
    };
    this.spaceship.onload = function() {
      imageLoaded();
    };
    this.bullet.onload = function() {
      imageLoaded();
    };

  // set images src
  this.background.src = "imgs/bg.png";
  this.spaceship.src = "imgs/ship.png";
  this.bullet.src = "imgs/bullet.png";
}();

// create the Drawable object which will be the 
// base class for all drawable objects. Set up 
// default variables that all child objects will
// inherit, as well as default functions.

function Drawable() {
  this.init =function(x, y, width, height) {
    // default variables
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  };
  
  this.speed = 0;
  this.canvasWidth = 0;
  this.canvasHeight = 0;

  // define abstract function to be impemented
  // in child functions
  this.draw = function() {
    // abstract object, don't create object from it
  };
  this.move = function() {
  };
}

// creates the Background object which will become
// a child of the Drawable object. The background
// is drawn on the "background" canvas and 
// creates the illusion of moving

function Background() {
  this.speed = 1; 
  // defines speed of background panning
 
  // Implement abstract function
  this.draw = function() {
    // Pan background
    this.y += this.speed;
    this.context.drawImage(imageRepository.background, this.x, this.y);
    // draw another image at the top edge of the first image
    this.context.drawImage(imageRepository.background, this.x, this.y - this.canvasHeight);
    // reset if background image panned off screen
    if (this.y >= this.canvasHeight)
      this.y = 0;
  };
}
// set Background to inherit properties from Drawable
Background.prototype = new Drawable();

// creates the Bullet object which ths ship fires. The
// bullets are drawn on the main cnavas.

function Bullet() {
  this.alive = false; //is true if bullet is in use
    // sets the bullet values
  this.spawn = function(x, y, speed) {
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.alive = true;
  };

// uses a "dirty rectangle" to erase the bullet and 
// moves it. Returns true if the bullet moved of the
// screen, indicates that the bullet is ready to be
// cleared by the pool, otherwise draws the bullet.
this.draw = function() {
  this.context.clearRect(this.x, this.y, this.width, this.height);
  this.y -= this.speed;
  if (this.y <= 0 - this.height) {
    return true;
  }
  else {
    this.context.drawImage(imageRepository.bullet, this.x, this.y);
  }
};

// resets the bullet values

  this.clear = function() {
    this.x = 0;
    this.y = 0;
    this.speed = 0;
    this.alive =false;
  };
}

Bullet.prototype = new Drawable();

// Custom Pool object. Holds Bullet objects to be managed
// to prevent garbage collection

function Pool(maxSize) {
  var size = maxSize; //Max bullets allowed in pool
  var pool = [];
  // Populate pool array with Bullet objects
  this.init = function() {
    for (var i = 0 ; i < size; i++) {
      // init the bullet object
      var bullet = new Bullet();
      bullet.init(0,0, imageRepository.bullet.width,
        imageRepository.bullet.height);
      pool[i] = bullet;
    }
};


// Grabs the last item in the list and inits it and
// pushes it to the front of the array

this.get = function(x ,y, speed) {
  if(!pool[size - 1].alive) {
    pool[size - 1].spawn(x, y, speed);
    pool.unshift(pool.pop());
  }
};

// used for the ship to be able to get two bullets
// at once. If only the get() function is used twice,
// the ship is able to fire and only have 1 bullet
// spawn instead of two

this.getTwo = function(x1, y1, speed1, x2, y2, speed2) {
  if(!pool[size - 1].alive &&
    !pool[size - 2].alive) {
    this.get(x1, y1, speed1);
    this.get(x2, y2, speed2);
  }
};

  // draws any in use Bullets. if a bullet goes off the screen,
  // clears it and pushes it to teh front of the array
  this.animate = function() {
    for (var i = 0 ; i < size; i++) {
      // only draw until we find a bullet that is not alive
      if (pool[i].alive) {
        if (pool[i].draw()) {
          pool[i].clear();
          pool.push((pool.splice(i,1))[0]);
        }
      }
      else
        break;
    }
  };
}

// Create the Ship object that the player controls.
// The ship is drawn on the "ship" canvas and uses
// dirty rectangles to move around the screen.
function Ship() {
  this.speed = 3;
  this.bulletPool = new Pool(30);
  this.bulletPool.init();
  
  var fireRate = 15;
  var counter = 0;

  this.draw = function() {
    this.context.drawImage(imageRepository.spaceship, this.x, this.y);
  };
  
  this.move = function() {
    counter++;
    // determine if the action is a move action
    if (KEY_STATUS.left || KEY_STATUS.right ||
      KEY_STATUS.down || KEY_STATUS.up) {
      //   The ship moved, so erase current image, so that
      // it can be redrawn at it's new location
      
      this.context.clearRect(this.x, this.y, this.width, this.height);
      // Update x and y according to the direction moved,
      // and redraw the ship. Change the else if's to the if
      // statements to have diagonal movement.
           
      if (KEY_STATUS.left) {
          this.x -= this.speed;
          if (this.x <= 0) //keep player's ship on screen
            this.x = 0;
      } 
        else if (KEY_STATUS.right) {
            this.x += this.speed;
            if (this.x >= this.canvasWidth - this.width)
                this.x = this.canvasWidth - this.width;
        } 
        else if (KEY_STATUS.up) {
          this.y -= this.speed;
          if (this.y <= this.canvasHeight/4*3)
              this.y = this.canvasHeight/4*3;
        } 
        else if (KEY_STATUS.down) {
          this.y += this.speed;
          if (this.y >= this.canvasHeight - this.height)
              this.y = this.canvasHeight - this.height;
        }

        // Finish the process by redrawing the ship
        this.draw();
    }
      
      if (KEY_STATUS.space && counter >= fireRate) {
        this.fire();
        counter = 0;
    }
  };

  // Fires two bullets
  this.fire = function() {
    this.bulletPool.getTwo(this.x+6, this.y, 3, 
                            this.x+33, this.y, 3);
    };
}
Ship.prototype = new Drawable();

// Creates the Game object which will hold all objects and data
function Game() {
  // Gets canvas info and context and sets up all game objects.
  // Returns true if the canvas is supported and false if it is not.
  // This stops the animation  from running on browsers that don't support it.

  this.init = function() {
    // Get the canvas elements
  this.bgCanvas = document.getElementById('background');
  this.shipCanvas = document.getElementById('ship');
  this.mainCanvas = document.getElementById('main');
  
  // Test if canvas is supported. Only need to check one canvasHeight
  if (this.bgCanvas.getContext) {
    this.bgContext = this.bgCanvas.getContext('2d');
    this.shipContext = this.shipCanvas.getContext('2d');
    this.mainContext = this.mainCanvas.getContext('2d');
  
    // Init objects to contain their context and canvas info
    Background.prototype.context = this.bgContext;
    Background.prototype.canvasWidth = this.bgCanvas.width;
    Background.prototype.canvasHeight = this.bgCanvas.height;

    Ship.prototype.context = this.shipContext;
    Ship.prototype.canvasWidth = this.shipCanvas.width;
    Ship.prototype.canvasHeight = this.shipCanvas.height;

    Bullet.prototype.context = this.mainContext;
    Bullet.prototype.canvasWidth = this.mainCanvas.width;
    Bullet.prototype.canvasHeight = this.mainCanvas.height;
    
    // Init the backgroung object
    this.background = new Background();
    this.background.init(0,0); //Set draw point at 0,0
    
    // Init the ship object
    this.ship = new Ship();
    
    // Set the ship to start near the bottom middle of the canvas.
    var shipStartX = this.shipCanvas.width/2 - imageRepository.spaceship.width;
    var shipStartY = this.shipCanvas.height/4*3 + imageRepository.spaceship.height*2;
    this.ship.init(shipStartX, shipStartY, imageRepository.spaceship.width, 
                  imageRepository.spaceship.height);
   
    return true;
    } else {
      return false;
    }
  };

  // Start animation loop
  this.start = function() {
    this.ship.draw();
    animate();
  };
}

// The animation loop. Calls the requestAnimationFrame shim to 
// optimize the game loop and draws all game objects. This
// function must be a global function and cannot be within an object.
function animate() {
  requestAnimFrame( animate );
  game.background.draw();
  game.ship.move();
  game.ship.bulletPool.animate();
}



// Map keycodes that will be pressed. Original code by Doug McInnes
KEY_CODES = {
  32: 'space',
  37: 'left',
  38: 'up',
  39: 'right',
  40: 'down',
};

// Creates the array to hold the keycodes, and sets all their
// values to false. Checking t/f is the quickest way to check key
// status of a press and which one was pressed when determining
// when to move and in which direction
KEY_STATUS = {};
for (code in KEY_CODES) {
  KEY_STATUS[KEY_CODES[code]] = false;
}

// Sets up the document to listen to onkeydown events.
// wWhen a key is pressed, it sets the appropraite direction
// to true to let us know which key it was.
document.onkeydown = function(e) {
 
 // Firefox and Opera use charCode instead of keyCode to
 // return which key was pressed
var keyCode = (e.keyCode) ? e.keyCode : e.charCode;
  if (KEY_CODES[keyCode]) {
    e.preventDefault();
    KEY_STATUS[KEY_CODES[keyCode]] = true;
  }
};

  // Sets up the document to listen to ownkeyup events (fired when
  //   any key on the keyboard is released). When a key is released,
  // it sets the appropraite direction to false to let us know
  // which key it was.
document.onkeyup = function(e) {
  var keyCode = (e.keyCode) ? e.keyCode : e.charCode;
  if (KEY_CODES[keyCode]) {
    e.preventDefault();
    KEY_STATUS[KEY_CODES[keyCode]] = false;
  }
};

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