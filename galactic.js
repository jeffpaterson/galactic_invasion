//***********************
//* By Jeff Paterson, March 2016, based primarily on
//* Steven Lambert's Galaxian-clone canvas game tutorial series
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
  this.enemy = new Image();
  this.enemyBullet = new Image();
  
  //ensure all images have loaded prior to game start
  var numImages = 5;
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
    this.enemy.onload = function() {
      imageLoaded();
    };
    this.enemyBullet.onload = function() {
      imageLoaded();
    };

  // set images src
  this.background.src = "imgs/bg.png";
  this.spaceship.src = "imgs/ship.png";
  this.bullet.src = "imgs/bullet.png";
  this.enemy.src = "imgs/enemy.png";
  this.enemyBullet.src = "imgs/bullet_enemy.png";
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
  this.collidableWith = "";
  this.isColliding = false;
  this.type = "";

  // define abstract function to be impemented
  // in child functions
  this.draw = function() {
    // abstract object, don't create object from it
  };
  this.move = function() {
  };
  this.isCollidableWith = function(object) {
    return (this.collidableWith === object.type);
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

function Bullet(object) {
  this.alive = false; //is true if bullet is in use
  var self = object;

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
  this.context.clearRect(this.x-1, this.y-1, this.width+2, this.height+2);
  this.y -= this.speed;
  
  if (this.isColliding) {
    return true;
  }
  else if (self === "bullet" && this.y <= 0 - this.height) {
    return true;
  }
  else if (self === "enemyBullet" && this.y >= this.canvasHeight) {
    return true;
  }
  else {
    if (self === "bullet") {
      this.context.drawImage(imageRepository.bullet, this.x, this.y);
    }
    else if (self === "enemyBullet") {
      this.context.drawImage(imageRepository.enemyBullet, this.x, this.y); 
    }
    return false;
  }
};

// resets the bullet values

  this.clear = function() {
    this.x = 0;
    this.y = 0;
    this.speed = 0;
    this.alive =false;
    this.isColliding = false;
  };
}

Bullet.prototype = new Drawable();


// requestAnimFrame shim layer by Paul Irish
// Finds the first API that works to optimize
// the animation loop, otherwise defaults to 
// setTimeout().
// QuadTree object
// The qadrant indexes are numbered as below
//    |
//  1 | 0
//---------
//  2 | 3
//    |
//
function QuadTree(boundBox, lvl) {
  var maxObjects = 10;
  this.bounds = boundBox || {
    x: 0,
    y: 0,
    width: 0,
    height: 0
  };
  var objects = [];
  this.nodes = [];
  var level = lvl || 0;
  var maxLevels = 5;

  // Clears the quadTree and all nodes of objects
  this.clear = function() {
    objects = [];
    for (var i=0; i < this.nodes.length; i++) {
      this.nodes[i].clear();
    }
    this.nodes = [];
  };
  
  // Get all objects in the QuadTree
this.getAllObjects = function(returnedObjects) {
  
  for (var i = 0; i < this.nodes.length; i++) {
    this.nodes[i].getAllObjects(returnedObjects);
  }
  for (var i = 0, len = objects.length; i < len; i++) {
    returnedObjects.push(objects[i]);
  }
  return returnedObjects;
  };

this.findObjects = function(returnedObjects, obj) {
  if (typeof obj === "undefined") {
    return;
  }

  var index = this.getIndex(obj);
  if (index != -1 && this.nodes.length) {
    this.nodes[index].findObjects(returnedObjects, obj);
  }
  for (var i = 0, len = objects.length; i < len; i++) {
    returnedObjects.push(objects[i]);
  }
  return returnedObjects;
};

// Insert the object into the quadTree. If the tree 
// excedes the capacity, it will split and add all
// objects to their corresponding nodes
this.insert = function(obj) {

  if (typeof obj === "undefined") {
    return;
  }
  if (obj instanceof Array) {
    for (var i = 0, len = obj.length; i < len; i++) {
      this.insert(obj[i]);
    }
    return;
  }
  if (this.nodes.length) {
    var index = this.getIndex(obj);
    // Only add the ojbetct to the subnode if it can fit 
    // completely within one
    if (index != -1) {
      this.nodes[index].insert(obj);
      return;
    }
  }
  objects.push(obj);
  // Prevent infinite splitting
  if (objects.length > maxObjects && level < maxLevels) {
    // Next line cannot be triple =
    if (this.nodes[0] == null) {
      this.split();
    }

    var i = 0;
    while (i < objects.length) {
      var index = this.getIndex(objects[i]);
      if (index != -1) {
        this.nodes[index].insert((objects.splice(i,1))[0]);
      }
      else {
        i++;
      }
    }
  }
};

// Determine which node the object belongs to. -1 means 
// object cannot completely fit within a node and is part 
// of the current node
this.getIndex = function(obj) {
  var index = -1;
  var verticalMidpoint = this.bounds.x + this.bounds.width / 2;
  var horizontalMidpoint = this.bounds.y + this.bounds.height / 2;
  // Object can fit completely within the top quadrant
  var topQuadrant = (obj.y < horizontalMidpoint && obj.y + obj.height < horizontalMidpoint);
  // Object can fit completely with the bottom quadrant 
  var bottomQuadrant = (obj.y > horizontalMidpoint);
  // Object can fit compltely within the left quadrants 
  if (obj.x < verticalMidpoint &&
      obj.x + obj.width < verticalMidpoint) {
    if (topQuadrant) {
      index = 1;
    }
    else if (bottomQuadrant) {
      index = 2;
    }
  }
  // Object can fit completely within the right quadrants 
  else if (obj.x > verticalMidpoint) {
    if (topQuadrant) {
      index = 0;
    }
    else if (bottomQuadrant) {
      index = 3;
    }
  }
  return index;
};

// Splits the node into 4 subnodes 
this.split = function() {
  // bitwise or HTML5 
  var subWidth = (this.bounds.width / 2) | 0;
  var subHeight = (this.bounds.height / 2) | 0;

    this.nodes[0] = new QuadTree({
      x: this.bounds.x + subWidth,
      y: this.bounds.y,
      width: subWidth,
      height: subHeight
    }, level + 1);
    this.nodes[1] = new QuadTree({
      x: this.bounds.x,
      y: this.bounds.y,
      width: subWidth,
      height: subHeight
    }, level + 1);
    this.nodes[2] = new QuadTree({
      x: this.bounds.x,
      y: this.bounds.y + subHeight,
      width: subWidth,
      height: subHeight
    }, level +1);
    this.nodes[3] = new QuadTree({
      x: this.bounds.x + subWidth,
      y: this.bounds.y + subHeight,
      width: subWidth,
      height: subHeight
    }, level + 1);
  };
}



// Custom Pool object. Holds Bullet objects to be managed
// to prevent garbage collection

function Pool(maxSize) {
  var size = maxSize; //Max bullets allowed in pool
  var pool = [];
  
  this.getPool = function() {
    var obj = [];
    for (var i = 0; i < size; i++) {
      if (pool[i].alive) {
        obj.push(pool[i]);
      }
    }
    return obj;
  };

  // Populate pool array with Bullet objects
  this.init = function(object) {
    if (object == "bullet") {
      for (var i = 0 ; i < size; i++) {
        // init the object
        var bullet = new Bullet("bullet");
        bullet.init(0,0, imageRepository.bullet.width,
          imageRepository.bullet.height);
        bullet.collidableWith = "enemy";
        bullet.type = "bullet";
        pool[i] = bullet;
      }
    }
    else if (object == "enemy") {
      for (var i = 0 ; i < size ; i++) {
        var enemy = new Enemy();
        enemy.init(0,0, imageRepository.enemy.width,
          imageRepository.enemy.height);
        pool[i] = enemy;
      }
    }
    else if (object == "enemyBullet") {
      for (var i = 0 ; i < size ; i++) {
        var bullet = new Bullet("enemyBullet");
        bullet.init(0,0, imageRepository.enemyBullet.width,
          imageRepository.enemyBullet.height);
        bullet.collidableWith = "ship";
        bullet.type = "enemyBullet";
        pool[i] = bullet;
      }
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
  if(!pool[size - 1].alive && !pool[size - 2].alive) {
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
  this.bulletPool.init("bullet");
  
  var fireRate = 15;
  var counter = 0;

  this.collidableWith = "enemyBullet";
  this.type = "ship";

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
        if (!this.isColliding) {
        this.draw();
      }
    }
      
      if (KEY_STATUS.space && counter >= fireRate && !this.isColliding) {
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

// Creates the Enemy ship object
function Enemy() {
  var percentFire = 0.01;
  var chance = 0;
  this.alive = false;
  this.collidableWith = "bullet";
  this.type = "enemy";

  // Set the enemy values
  this.spawn = function(x, y, speed) {
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.speedX = 0;
    this.speedY = speed;
    this.alive = true;
    this.leftEdge = this.x - 90;
    this.rightEdge = this.x + 90;
    this.bottomEdge = this.y + 140;
  };

  // Move the enemy
  this.draw = function() {
    this.context.clearRect(this.x-1, this.y, this.width+1, this.height);
    this.x += this.speedX;
    this.y += this.speedY;
    if (this.x <= this.leftEdge) {
      this.speedX = this.speed;
    }
    else if (this.x >= this.rightEdge + this.width) {
      this.speedX = -this.speed;
    }
    else if (this.y >= this.bottomEdge) {
      this.speed = 1.5;
      this.speedY  = 0;
      this.y -= 5;
      this.speedX = -this.speed;
    }
    if (!this.isColliding) { 
      this.context.drawImage(imageRepository.enemy, this.x, this.y);
      // Enemy has a chance to shoot every movement
      chance = Math.floor(Math.random()*101);
      if (chance/100 < percentFire) {
        this.fire();
      }
      return false;
    }
    else {
      return true;
    }
  };

  // Fires a bullet
  this.fire = function() {
    game.enemyBulletPool.get(this.x+this.width/2, this.y+this.height, -2.5);
  };
  // Resets the enemy values
  this.clear = function() {
    this.x = 0;
    this.y = 0;
    this.speed = 0;
    this.speedX = 0;
    this.speedY = 0;
    this.alive = false;
    this.isColliding = false;
    };
}
Enemy.prototype = new Drawable();

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

      Enemy.prototype.context = this.mainContext;
      Enemy.prototype.canvasWidth = this.mainCanvas.width;
      Enemy.prototype.canvasHeight = this.mainCanvas.height;
      
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

      // Init the enemy pool object
      this.enemyPool = new Pool(30);
      this.enemyPool.init("enemy");
      var height = imageRepository.enemy.height;
      var width = imageRepository.enemy.width;
      var x = 100;
      var y = -height;
      var spacer = y * 1.5;
      for (var i = 1; i <= 18; i++) {
        this.enemyPool.get(x,y,2);
        x += width + 25;
        if (i % 6 === 0) {
          x = 100;
          y += spacer;
        }
      }
     this.enemyBulletPool = new Pool(50);
     this.enemyBulletPool.init("enemyBullet");
      
      // Start QuadTree
      this.quadTree = new QuadTree({x:0,y:0,width:this.mainCanvas.width,height:this.mainCanvas.height});
      
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
  // Insert objects into quadTree
  game.quadTree.clear();
  game.quadTree.insert(game.ship);
  game.quadTree.insert(game.ship.bulletPool.getPool());
  game.quadTree.insert(game.enemyPool.getPool());
  game.quadTree.insert(game.enemyBulletPool.getPool());
  
  detectCollision();

  // Animate game objects
  requestAnimFrame( animate );
  game.background.draw();
  game.ship.move();
  game.ship.bulletPool.animate();
  game.enemyPool.animate();
  game.enemyBulletPool.animate();
}

// Collision detection algorithm. Ensures that any objects that
// collide in the frame are not redrawn
function detectCollision() {
  var objects = [];
  game.quadTree.getAllObjects(objects);

  for (var x = 0, len = objects.length; x < len; x++) {
    game.quadTree.findObjects(obj = [], objects[x]);

    for (var y = 0, length = obj.length; y < length; y++) {

      // algorithm
      if (objects[x].collidableWith === obj[y].type &&
        (objects[x].x < obj[y].x + obj[y].width &&
           objects[x].x + objects[x].width > obj[y].x &&
         objects[x].y < obj[y].y + obj[y].height &&
         objects[x].y + objects[x].height > obj[y].y)) {
        objects[x].isColliding = true;
        obj[y].isColliding = true;
      }
    }
  }
};

// Map keycodes that will be pressed. Original code by Doug McInnes
KEY_CODES = {
  32: 'space',
  37: 'left',
  38: 'up',
  39: 'right',
  40: 'down',
}

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
}



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


