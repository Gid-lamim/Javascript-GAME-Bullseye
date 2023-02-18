//addEventListener('load' --> when the page loads
window.addEventListener("load", function () {
  const canvas = document.getElementById("canvas1");
  const ctx = canvas.getContext("2d");

  //set canvas size
  canvas.width = 1280;
  canvas.height = 720;

  ctx.fillStyle = "white";
  ctx.lineWidth = 3;
  ctx.strokeStyle = "white";

  //object player
  class Player {
    constructor(game) {
      //transform the parameter into a property of this class.
      this.game = game;
      //coordinates for the collision circle
      this.collisionX = this.game.width * 0.5;
      this.collisionY = this.game.height * 0.5;
      this.collisionRadius = 30;

      //speed of the player
      this.distanceX = 0;
      this.distanceY = 0;
      this.speedX = 0;
      this.speedY = 0;
      this.speedModifier = 10;
    }

    //this method will draw the player
    draw(context) {
      //beginPath tells Javascript to begin drawing a new shape
      context.beginPath();
      //arc needs 5 arguments: x, y, radius, start angle(rad), end angle
      context.arc(
        this.collisionX,
        this.collisionY,
        this.collisionRadius,
        0,
        Math.PI * 2
      );
      context.save();
      context.globalAlpha = 0.5;
      context.fill();
      context.restore();
      context.stroke();

      //create a line to show the movement of the player
      context.beginPath();
      context.moveTo(this.collisionX, this.collisionY);
      context.lineTo(this.game.mouse.x, this.game.mouse.y);
      context.stroke();
    }

    //update will cause the player to move
    update() {
      //set the player speed
      this.distanceX = this.game.mouse.x - this.collisionX;
      this.distanceY = this.game.mouse.y - this.collisionY;
      //we have to keep a constant speed
      const distanceXY = Math.hypot(this.distanceX, this.distanceY);
      if (distanceXY > this.speedModifier) {
        this.speedX = this.distanceX / distanceXY || 0;
        this.speedY = this.distanceY / distanceXY || 0;
      } else {
        this.speedX = this.distanceX / this.speedModifier;
        this.speedY = this.distanceY / this.speedModifier;
      }

      //create player movement
      this.collisionX += this.speedX * this.speedModifier;
      this.collisionY += this.speedY * this.speedModifier;
    }
  }

  class Obstacle {
    constructor(game) {
      this.game = game;
      this.collisionRadius = 40;

      //obstacle frame
      this.frameXstart = this.collisionRadius;
      this.frameYstart = 300; //top margin
      this.frameXend = this.game.width - this.frameXstart * 2;
      this.frameYend =
        this.game.height - this.frameYstart - this.collisionRadius;

      //collision circle random coordinates inside the obstacle rendering frame
      this.collisionX = this.frameXstart + Math.random() * this.frameXend;
      this.collisionY = this.frameYstart + Math.random() * this.frameYend;

      //spriteSheet
      this.image = document.getElementById("obstacles");
      this.spriteWidth = 250;
      this.spriteHeight = 250;

      //random sprite sheet
      /*the obstacle sprite sheet contains 12 different obstacles. 
        4 X 3
      we need to randomly pick one of them each time we render an obstacle.
      */

      this.cropAtX = Math.round(Math.random() * 3) * 250;
      this.cropAtY = Math.round(Math.random() * 2) * 250;
      this.spriteX = this.collisionX - 0.5 * this.spriteWidth;
      this.spriteY = this.collisionY - this.spriteWidth + this.collisionRadius;

      console.log(this.cropAtX);
      console.log(this.cropAtY);

      //random sprite sheet
      //the obstacle sprite sheet contains 12 different obstacles. we need to randomly pick one of them each time we render an obstacle.
    }

    draw(context) {
      /*drawImage needs at least 3 arguments: the image, the x coordinate and the y coordinate
      we can also add the width and the height

      to crop the image to get only the obstacle we need, we need to add 4 arguments:
        the start x and y
        the end x and y


      drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
      
      https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage
      */
      context.drawImage(
        this.image,
        this.cropAtX,
        this.cropAtY,
        this.spriteWidth,
        this.spriteHeight,
        this.spriteX,
        this.spriteY,
        this.spriteWidth,
        this.spriteHeight
      );

      //beginPath tells Javascript to begin drawing a new shape
      context.beginPath();
      //arc needs 5 arguments: x, y, radius, start angle(rad), end angle
      context.arc(
        this.collisionX,
        this.collisionY,
        this.collisionRadius,
        0,
        Math.PI * 2
      );
      context.save();
      context.globalAlpha = 0.5;
      context.fill();
      context.restore();
      context.stroke();
    }

    obstacleType() {
      const column = this.cropAtX / this.spriteWidth + 1;
      const row = this.cropAtY / this.spriteHeight;
      const obstacleType = row * 4 + column;

      console.log("row: " + row);
      console.log("column " + column);
      return obstacleType;
    }
  }

  //the class Game will handle all the game logics
  class Game {
    constructor(canvas) {
      //let's convert canvas into a class property
      this.canvas = canvas;
      this.width = this.canvas.width;
      this.height = this.canvas.height;
      //create a player automatically when we create a game
      this.player = new Player(this);
      this.numberOfObstacles = 10;
      this.obstacles = [];
      this.mouse = {
        x: this.width * 0.5,
        y: this.height * 0.5,
        pressed: false,
      };

      //event listeners
      canvas.addEventListener("mousedown", (e) => {
        this.mouse.x = e.offsetX;
        this.mouse.y = e.offsetY;
        this.mouse.pressed = true;
      });
      canvas.addEventListener("mouseup", (e) => {
        this.mouse.x = e.offsetX;
        this.mouse.y = e.offsetY;
        this.mouse.pressed = false;
      });
      canvas.addEventListener("mousemove", (e) => {
        if (this.mouse.pressed) {
          this.mouse.x = e.offsetX;
          this.mouse.y = e.offsetY;
        }
      });
    }

    //the Render method will draw the player
    render(context) {
      //this method will be called over and over again by animate.
      this.player.draw(context);
      this.player.update();
      this.obstacles.forEach((obstacle) => obstacle.draw(context));
    }

    init() {
      //render the obstacles
      let attempts = 0;
      while (
        attempts < this.numberOfObstacles * 4 &&
        this.obstacles.length < this.numberOfObstacles
      ) {
        /*We don't want any overlapping obstacles. let's use brute force to check for empty spaces. That means we're gonna try until we find an empty space*/
        const newObstacle = new Obstacle(this);
        //create the first obstacle
        if (!this.obstacles.length) {
          this.obstacles.push(newObstacle);
        } else {
          //for the others, we need to check for empty spaces
          let emptySpace = true;
          this.obstacles.forEach((obstacle) => {
            //check if the space has been taken already
            const distanceY = Math.abs(
              newObstacle.collisionX - obstacle.collisionX
            );
            const distanceX = Math.abs(
              newObstacle.collisionY - obstacle.collisionY
            );
            //get the distance between the new obstacle and an obstacle that is already in the array.
            const distanceXY = Math.hypot(distanceY, distanceX);
            const distanceBuffer = 100;
            const allowedDistance =
              obstacle.collisionRadius * 2 + distanceBuffer;
            //check the distance between the new obstacle and an obstacle that is already in the array is far enough if it's not, the space is not empty
            if (distanceXY < allowedDistance) {
              emptySpace = false;
            }
          });
          //if it's ok, push the new obstacle into the array
          if (emptySpace) {
            this.obstacles.push(newObstacle);
          }

          attempts++;
        }
      }
    }
  }

  //instantiate the Game class
  const game = new Game(canvas);
  game.init();
  console.log(game);

  // we need a loop to animate our game
  function animate() {
    /*comment - cleaRect
    The CanvasRenderingContext2D.clearRect() method of the Canvas 2D API 
    erases the pixels in a rectangular area by setting them to transparent black. 

    Note: Be aware that clearRect() may cause unintended side effects 
    if you're not using paths properly. Make sure to call beginPath() 
    before starting to draw new items after calling clearRect(). 

    Syntax

    clearRect(x, y, width, height)

    (x, y, width, height) to create a rectangle
    */
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    game.render(ctx);
    /*Comment - requestAnimationFrame
    requestAnimationFrame(function)  this method will tell the browser to repeat the function to create an animation.
    here, it's reapeating the parent function*/
    window.requestAnimationFrame(animate);
  }

  //call animate to start the animation
  animate();
});
