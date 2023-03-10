//addEventListener('load' --> when the page loads
window.addEventListener("load", function () {
  const canvas = document.getElementById("canvas1");
  const ctx = canvas.getContext("2d");

  //FPS correction
  const fps = 120;
  let timer = 0;
  const interval = 1000 / fps; //1000 milliseconds divided by 20 fps

  //set canvas size
  canvas.width = 1280;
  canvas.height = 720;

  ctx.fillStyle = "white";
  ctx.lineWidth = 3;
  ctx.strokeStyle = "black";
  const font = "Bangers";
  ctx.font = `40px ${font}`;

  //object player
  class Player {
    constructor(game) {
      //transform the parameter into a property of this class.
      this.game = game;

      //coordinates for the collision circle
      this.collisionX = this.game.width * 0.5; //initial position
      this.collisionY = this.game.height * 0.5; //initial position
      this.collisionRadius = 30;

      //player's movement upper limit
      this.upperLimit = 270;

      //speed of the player
      this.distanceX = 0;
      this.distanceY = 0;
      this.speedX = 0;
      this.speedY = 0;
      this.speedModifier = 5;

      //spriteSheet
      this.image = document.getElementById("bull");
      this.image.style.zIndex = "990";
      this.spriteWidth = 255;
      this.spriteHeight = 256;
      this.spriteSheetWidth = this.image.naturalWidth; // size of the entire sprite sheet X
      this.spriteSheetHeight = this.image.naturalHeight; // size of the entire sprite sheet Y
      this.columns = this.spriteSheetWidth / this.spriteWidth;
      this.rows = this.spriteSheetHeight / this.spriteHeight;
      //animate the player sprite sheet
      this.column = 0;
      //image crop selector
      this.cropAtX = this.column * this.spriteWidth;
      this.cropAtY = 0;
      //image position
      this.spriteX;
      this.spriteY;
      this.negative = false;
      this.angleOfTravel = 180;
    }

    //this method will draw the player
    draw(context) {
      /*drawImage needs at least 3 arguments: the image, the x coordinate and the y coordinate
      we can also add the width and the height

      to crop the image to get only the obstacle we need, we need to add 4 arguments:
        the start x and y
        the end x and y


      drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
      
      https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage
      */
      //image position

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

      //create a line to show the movement of the player
      context.beginPath();
      context.moveTo(this.collisionX, this.collisionY);
      context.lineTo(this.game.mouse.x, this.game.mouse.y);
      context.stroke();
    }

    spriteSheetCropper() {
      //finding the angle
      const distanceX = this.game.mouse.x - this.collisionX;
      const distanceY = this.game.mouse.y - this.collisionY;
      const distanceXY = Math.hypot(distanceX, distanceY);
      /* to find the angle we need a little bit of calculations
      
      S=O/H C=A/H T=O/A
      the tangent is the relationship between the adjacent and the opposite sides of the triangle
      the inverse tangent will give us the angle in radians

      https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/atan
      */

      const sin = distanceX / distanceXY;
      const cos = distanceY / distanceXY;
      if (distanceXY) {
        //sin greater than zero = angle between 0 180
        if (sin < 0) {
          this.angleOfTravel = Math.acos(cos) + Math.PI;
        } else {
          this.angleOfTravel = Math.acos(cos * -1);
        }
      }

      //choose direction
      const row = Math.floor((this.angleOfTravel * 9) / (2 * Math.PI));
      this.cropAtY = row < 8 ? this.spriteHeight * row : 0;

      //animate the image along its X axis
      if (this.column > this.columns - 2) {
        this.negative = true;
      } else if (this.column <= 0) {
        this.negative = false;
      }
      if (this.negative) {
        this.column--;
      } else {
        this.column++;
      }
      this.cropAtX = this.column * 255;
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

      this.collisionX += this.speedX * this.speedModifier;

      if (this.collisionY > this.upperLimit || this.speedY > 0) {
        this.collisionY += this.speedY * this.speedModifier;
      }

      //sprite sheet animation
      this.spriteSheetCropper();

      //sprite image position relative to the player
      this.spriteX = this.collisionX - 0.5 * this.spriteWidth;
      this.spriteY = this.collisionY - this.spriteWidth + this.collisionRadius;

      //as the player moves, we need to check for collision with the obstacles
      this.game.obstacles.forEach((obstacle) => {
        //let's use object deestructuring to get the values from  checkCollision()
        /*basically here, I'm asking javascript to create 5 variables
        
          const obj = { a: 1, b: 2 };
          const { a, b } = obj;

           is equivalent to:
           const a = obj.a;
           const b = obj.b;
        */
        let { collision, sumOfRadii, distanceXY, distanceX, distanceY } =
          this.game.checkCollision(this, obstacle);

        if (collision) {
          /*to avoid the player to move into the obstacle, 
          the player will be always pushed away from the obstacle by 1 pixel

          collisionX and collisionY are the players coordinates at X and Y

          unit_x will cause to move the player left or right whether it's negative or positive
          unit_y will cause to move the player up or down whether it's negative or positive

          sumOfRadii makes sure the player and obstacle don't overlap
        
          */
          const unit_x = distanceX / distanceXY;
          const unit_y = distanceY / distanceXY;
          this.collisionX = obstacle.collisionX + (sumOfRadii + 1) * unit_x;
          this.collisionY = obstacle.collisionY + (sumOfRadii + 1) * unit_y;
        }
      });
    }
  }

  class Obstacle {
    constructor(game) {
      this.game = game;
      this.collisionRadius = 40;

      //obstacle frame inside the canvas
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
      this.image.style.zIndex = "-100";

      this.spriteWidth = 250;
      this.spriteHeight = 250;
      this.spriteSheetWidth = this.image.naturalWidth;
      this.spriteSheetHeight = this.image.naturalHeight;
      this.columns = this.spriteSheetWidth / this.spriteWidth;
      this.rows = this.spriteSheetHeight / this.spriteHeight;

      //random sprite sheet obstacle
      /*the obstacle sprite sheet contains 12 different obstacles. 
        4 X 3
        but I can also add more obstacle types
      we need to randomly pick one of them each time we render an obstacle.
      */

      this.cropAtX = Math.floor(Math.random() * this.columns) * 250;
      this.cropAtY = Math.floor(Math.random() * this.rows) * 250;
      this.spriteX = this.collisionX - 0.5 * this.spriteWidth;
      this.spriteY = this.collisionY - this.spriteWidth + this.collisionRadius;

      this.obstacleType = this.obstacleType();
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
      this.game.drawCollisionCircle(this, context);
    }

    obstacleType() {
      //this method returns which type of obstacle it is
      const column = this.cropAtX / this.spriteWidth + 1;
      const row = this.cropAtY / this.spriteHeight;
      const obstacleType = row * 4 + column;

      return obstacleType;
    }

    update() {}
  }

  class Egg {
    constructor(game) {
      this.game = game;
      this.collisionRadius = 45;
      this.eggIncubationTimer = 0;

      //frame inside the canvas
      this.frameXstart = this.collisionRadius;
      this.frameYstart = 300; //top margin for the eggs
      this.frameXend = this.game.width - this.collisionRadius;
      this.frameYend =
        this.game.height - this.frameYstart - this.collisionRadius;

      //collision circle random coordinates inside the obstacle rendering frame
      this.collisionX = this.frameXstart + Math.random() * this.frameXend;
      this.collisionY = this.frameYstart + Math.random() * this.frameYend;

      //Egg image and position
      this.image = document.getElementById("egg");
      this.spriteWidth = this.image.naturalWidth;
      this.spriteHeight = this.image.naturalHeight;
      this.spriteX = this.collisionX - this.spriteWidth * 0.5;
      this.spriteY = this.collisionY - this.spriteHeight + this.collisionRadius;
    }

    draw(context) {
      // update the position
      this.spriteX = this.collisionX - this.spriteWidth * 0.5;
      this.spriteY = this.collisionY - this.spriteHeight + this.collisionRadius;
      //draw image
      context.drawImage(this.image, this.spriteX, this.spriteY);

      //draw number on top of the egg
      const timerPosX = this.collisionX - this.spriteWidth * 0.5;
      const timerPosY =
        this.collisionY - this.spriteHeight + this.collisionRadius;

      const countDownTimer =
        this.game.eggIncubationTime - this.eggIncubationTimer;
      context.save();
      context.textAlign = "center";
      context.font = `40px ${font}`;
      context.fillText(
        countDownTimer.toFixed(0),
        this.spriteX + 50,
        this.spriteY
      );
      context.restore();
      this.game.drawCollisionCircle(this, context);
    }

    update() {
      this.eggIncubationTimer += this.game.deltaTime;

      //to help us, we will create an array to contain all the objects that the egg may collide with.
      // the spread operator (...) will help us to do that
      let collisionObjects = [
        this.game.player,
        ...this.game.eggs,
        ...this.game.obstacles,
        ...this.game.enemies,
      ];
      collisionObjects.forEach((object) => {
        let { collision, sumOfRadii, distanceXY, distanceX, distanceY } =
          this.game.checkCollision(object, this);
        if (collision && object !== this) {
          const unit_x = distanceX / distanceXY;
          const unit_y = distanceY / distanceXY;
          if (
            this.collisionX > this.collisionRadius &&
            this.collisionX < this.frameXend
          ) {
            this.collisionX = object.collisionX - (sumOfRadii + 1) * unit_x;
          }
          if (
            this.collisionY > this.frameYstart &&
            this.collisionY < this.game.height
          ) {
            this.collisionY = object.collisionY - (sumOfRadii + 1) * unit_y;
          }
        }
      });
    }
  }

  class Enemy {
    constructor(game) {
      this.game = game;
      this.collisionRadius = 45;

      //frame inside the canvas
      this.frameXstart = this.collisionRadius;
      this.frameYstart = 300; //top margin for the enemies
      this.frameXend = this.game.width - this.collisionRadius;
      this.frameYend =
        this.game.height - this.frameYstart - this.collisionRadius;

      //collision circle random coordinates inside the obstacle rendering frame
      this.collisionX = this.game.width + 100;
      this.collisionY = this.frameYstart + Math.random() * this.frameYend;

      //target position - where the have to go to
      this.targetX = -2 * this.collisionRadius;
      this.targetY = this.frameYstart + Math.random() * this.frameYend;
      this.speedModifier = this.game.enemySpeed;

      //enemies sprite sheet
      this.image = document.getElementById("toads");
      this.numberOfSprites = 4;
      this.spriteHeight = this.image.naturalHeight / this.numberOfSprites;
      this.spriteWidth = this.image.naturalWidth;
      this.cropAt =
        this.spriteHeight * Math.floor(this.numberOfSprites * Math.random());
    }

    draw(context) {
      // update the position
      this.spriteX = this.collisionX - this.spriteWidth * 0.5;
      this.spriteY = this.collisionY - this.spriteHeight + this.collisionRadius;
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
        0,
        this.cropAt,
        this.spriteWidth,
        this.spriteHeight,
        this.spriteX,
        this.spriteY,
        this.spriteWidth,
        this.spriteHeight
      );
      this.game.drawCollisionCircle(this, context);
    }

    update() {
      //this array will contain all the objects that will be able to push the enemies

      let collisionObjects = [
        this.game.player,
        ...this.game.obstacles,
        ...this.game.enemies,
      ];

      collisionObjects.forEach((object) => {
        let { collision, sumOfRadii, distanceXY, distanceX, distanceY } =
          this.game.checkCollision(object, this);

        if (collision && object != this) {
          const unit_x = distanceX / distanceXY;
          const unit_y = distanceY / distanceXY;

          this.collisionX = object.collisionX - (sumOfRadii + 1) * unit_x;
          this.collisionY = object.collisionY - (sumOfRadii + 1) * unit_y;
        } else {
          this.distanceX = this.targetX - this.collisionX;
          this.distanceY = this.targetY - this.collisionY;

          //set the enemy speed
          //we have to keep a constant speed
          const dXY = Math.hypot(this.distanceX, this.distanceY);
          if (dXY > this.speedModifier) {
            this.speedX = this.distanceX / dXY || 0;
            this.speedY = this.distanceY / dXY || 0;
          } else {
            this.speedX = this.distanceX / this.speedModifier;
            this.speedY = this.distanceY / this.speedModifier;
          }
        }
      });
      this.collisionX += this.speedX * this.speedModifier;

      if (this.collisionY > this.upperLimit || this.speedY > 0) {
        this.collisionY = this.collisionY + this.speedY * this.speedModifier;
      }
    }
  }

  class Larva {
    constructor(game, egg) {
      this.game = game;
      this.egg = egg;
      this.collisionRadius = 40;
      this.speedModifier = 0.5;
      this.larvaLife = 0;
      this.adultAfter = this.game.adultAfter;
      this.adult = false;

      //obstacle frame inside the canvas
      this.frameXstart = this.collisionRadius;
      this.frameYstart = 300; //top margin
      this.frameXend = this.game.width - this.frameXstart * 2;
      this.frameYend =
        this.game.height - this.frameYstart - this.collisionRadius;

      //the collision circle position will match that of the related egg. it will spawn where the eggs was.
      this.collisionX = this.egg.collisionX;
      this.collisionY = this.egg.collisionY;

      //sprite image
      this.image = document.getElementById("larva");
      this.numberOfSprites = 2;
      this.spriteHeight = this.image.naturalHeight / this.numberOfSprites;
      this.spriteWidth = this.image.naturalWidth;

      //this will be toggled true if it gets eaten by the enemy
      this.eaten = false;
    }

    draw(context) {
      this.spriteX = this.collisionX - this.spriteWidth * 0.5;
      this.spriteY = this.collisionY - this.spriteHeight * 0.75;
      this.cropAt = this.spriteHeight * (this.adult ? 1 : 0);

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
        0,
        this.cropAt,
        this.spriteWidth,
        this.spriteHeight,
        this.spriteX,
        this.spriteY,
        this.spriteWidth,
        this.spriteHeight
      );
      //context.drawImage(image);
      this.game.drawCollisionCircle(this, context);
    }

    update() {
      const collisionObjects = [
        this.game.player,
        ...this.game.obstacles,
        ...this.game.eggs,
        ...this.game.larvae,
      ];
      const enemies = this.game.enemies;

      collisionObjects.forEach((object) => {
        let { collision, sumOfRadii, distanceXY, distanceX, distanceY } =
          this.game.checkCollision(object, this);

        if (collision && object != this) {
          const unit_x = distanceX / distanceXY;
          const unit_y = distanceY / distanceXY;

          this.collisionX = object.collisionX - sumOfRadii * unit_x;
          this.collisionY = object.collisionY - sumOfRadii * unit_y;
        }
      });

      this.collisionY = this.collisionY - this.speedModifier;

      //larva interaction with enemies
      enemies.forEach((enemy) => {
        const { collision } = this.game.checkCollision(enemy, this);

        if (collision) {
          this.eaten = true;
          this.game.eatenLarvae++;
        }
      });

      //the older the larva lives, the more points it will give
      this.larvaLife += this.game.deltaTime;

      if (this.larvaLife > this.adultAfter) {
        this.adult = true;
      }
    }
  }

  class Particle {
    constructor(game, larva, color) {
      this.game = game;
      this.collisionX = larva.collisionX;
      this.collisionY = larva.collisionY;
      this.color = color;
      this.radius = Math.floor(Math.random() * 10 + 3);
      this.speedX = Math.random() * 6 - 3;
      this.speedY = Math.random() * 2 + 0.5;
      this.angle = 0;
      this.va = Math.random() * 0.1 + 0.01;
    }

    draw(context) {
      context.save();
      context.fillStyle = this.color;
      context.beginPath();
      context.arc(
        this.collisionX,
        this.collisionY,
        this.radius,
        0,
        Math.PI * 2
      );
      context.fill();
      context.stroke();
      context.restore();
    }
  }

  class Firefly extends Particle {
    update() {
      this.angle += this.va;
      this.collisionX -= this.speedX * Math.cos(this.angle);
      this.collisionY -= this.speedY * Math.sin(this.angle);
      if (this.radius > 0.1) {
        this.radius -= 0.05;
      }
    }
  }

  class Spark extends Particle {
    constructor(game, larva, color) {
      super(game, larva, color);
      this.speedX = Math.random() * 6 - 3;
      this.speedY = Math.random() * 6 - 3;
    }

    update() {
      this.collisionX += this.speedX;
      this.collisionY += this.speedY;

      if (this.radius > 0.1) {
        this.radius -= 0.1;
      }
    }
  }

  //the class Game will handle all the game logics
  class Game {
    constructor(canvas) {
      //let's convert canvas into a class property
      this.canvas = canvas;
      this.width = this.canvas.width;
      this.height = this.canvas.height;
      this.deltaTime = 0;
      this.gameOver = false;
      this.gameWin = false;
      this.pressedKey = "";

      //this array will contain all the objects of the game later
      this.objects = [];

      //create a player automatically when we create a game
      this.player = new Player(this);

      this.displayCollisionCircle = false;

      //obstacle properties
      this.numberOfObstacles = 10;
      this.obstacles = [];
      this.spaceBetweenObstacles = 100;

      //eggs
      this.eggs = new Egg(this);
      this.eggs = [];
      this.totalEggs = 50;
      this.spawnedEggs = 0;
      this.maxNumberOfEggs = 5; //at once
      this.eggSpawnInterval = 2;
      this.eggSpawnTimer = 0;
      this.eggIncubationTime = 10;

      //larvae
      this.larvae = [];
      this.adultAfter = 7;
      this.larvaUpperLimit = 220;
      this.eatenLarvae = 0;
      this.savedLarvae = 0;
      this.adultLarvaScore = 50;
      this.youngLarvaScore = 20;

      //Enemies
      this.enemies = [];
      this.maxNumberOfEnemies = 5;
      this.enemySpawnInterval = 3;
      this.enemySpawnTimer = 0;
      this.enemySpeed = 0;

      //particles
      this.particles = [];
      this.firefliesColor = "#05da14";
      this.sparksColor = "white";

      //player score
      this.score = 0;
      this.runningTime;

      //display tips
      this.tips = [
        "Older hatchlings will give you more points.",
        "To save the hatchlings, push the enemies around",
        "To win the game, save most of the hatchlings",
        "Half of these tips are useful",
        "The moon affects the tides",
        "Add toothpaste to your food, and you'll save on brushing time",
      ];

      this.tip = this.tips[Math.floor(Math.random() * this.tips.length)];

      //mouse position
      this.mouse = {
        x: this.width * 0.5,
        y: this.height * 0.5,
        pressed: false,
      };

      //mouse position
      this.keys = {
        keyRpressed: "",
        keyCpressed: "",
      };

      //initial time
      this.initialTime = Date.now();
      this.runningTime = 0;

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

      document.addEventListener("keydown", (event) => {
        this.pressedKey = event.key;
      });
      document.addEventListener("keyup", (event) => {
        this.pressedKey = "";
      });
    }

    //collision detector
    checkCollision(circleA, circleB, bufferDistance) {
      //for this methiod to be reusable, all objects must have the same properties
      const distanceX = circleA.collisionX - circleB.collisionX;
      const distanceY = circleA.collisionY - circleB.collisionY;
      //get the distance between the circleA and circleB.
      const distanceXY = Math.hypot(distanceY, distanceX);
      //check for collision
      const sumOfRadii = circleA.collisionRadius + circleB.collisionRadius;
      const minDistance = sumOfRadii + (bufferDistance ? bufferDistance : 0);
      const collision = distanceXY - minDistance < 0;

      return {
        collision: collision,
        sumOfRadii: sumOfRadii,
        distanceXY: distanceXY,
        distanceX: distanceX,
        distanceY: distanceY,
      };
    }

    drawCollisionCircle(object, context) {
      //draw collision circle
      if (this.displayCollisionCircle) {
        context.beginPath();
        context.arc(
          object.collisionX,
          object.collisionY,
          object.collisionRadius,
          0,
          2 * Math.PI
        );

        context.save();
        context.globalAlpha = 0.5;
        context.fill();
        context.restore();
        context.stroke();
      }
    }

    //the Render method will draw the player
    render(context, deltaTime) {
      this.deltaTime = deltaTime * 0.001;

      //populate the objects array
      //if the game is over, the player will not be rendered
      if (!this.gameOver) {
        this.objects = [
          ...this.obstacles,
          ...this.enemies,
          ...this.particles,
          ...this.larvae,
          ...this.eggs,
          this.player,
        ];
      } else {
        this.objects = [
          ...this.obstacles,
          ...this.enemies,
          ...this.particles,
          ...this.larvae,
          ...this.eggs,
        ];
      }

      let sortedObjects = this.objects.sort((a, b) => {
        return Math.floor(a.collisionY) - Math.floor(b.collisionY);
      });
      sortedObjects.forEach((object) => {
        object.update();
        object.draw(context);
      });

      /*for (let y = 0; y <= this.height; y++) {
        this.objects.forEach((object) => {
          if (Math.floor(object.collisionY) === y) {
            object.draw(context);
          }
        });
      }
      this.objects.forEach((object) => {
        object.update();
      });*/

      //spawn enemies
      this.spawnEnemies();

      //hatch the eggs
      this.hatchEgg();

      this.updateLarvae();

      //add the eggs
      this.addEggs();

      //remove unwanted objects
      this.removeObjects();

      //measure the total running time
      this.runningTime += this.deltaTime;

      //render the dashboard
      this.renderDashboard(context);

      //display win/lose message
      const total = this.eatenLarvae + this.savedLarvae;
      if (this.eatenLarvae >= this.totalEggs / 2) {
        this.gameOver = true;
        this.gameWin = false;
        this.displayMessage(context);
      } else if (total >= this.totalEggs) {
        this.gameOver = true;
        this.gameWin = true;
        this.displayMessage(context);
      }
    }

    addEggs() {
      const newEgg = new Egg(this);
      let collisionWithObstacle = false;
      let collisionWithEgg = false;

      if (
        this.eggSpawnTimer >= this.eggSpawnInterval &&
        this.spawnedEggs < this.totalEggs
      ) {
        if (this.eggs.length <= this.maxNumberOfEggs) {
          this.obstacles.forEach((obstacle) => {
            if (this.checkCollision(obstacle, newEgg).collision) {
              collisionWithObstacle = true;
            }
          });

          this.eggs.forEach((egg) => {
            if (this.checkCollision(egg, newEgg).collision) {
              collisionWithEgg = true;
            }
          });

          if (!collisionWithObstacle && !collisionWithEgg) {
            this.eggs.push(newEgg);
            this.spawnedEggs++;
            this.eggSpawnTimer = 0;
          }
        }
      }
      this.eggSpawnTimer += this.deltaTime;
    }

    hatchEgg() {
      //this.larvae.push(newLarva);
      this.eggs.forEach((egg) => {
        if (egg.eggIncubationTimer > this.eggIncubationTime) {
          const newLarva = new Larva(this, this.eggs[0]);
          this.larvae.push(newLarva);

          //remove the hatched egg
          const eggIndex = this.eggs.indexOf(egg);
          this.eggs.splice(eggIndex, 1);
        }
      });
    }

    updateLarvae() {
      //larvae that have made it
      this.larvae.forEach((larva) => {
        if (larva.collisionY < this.larvaUpperLimit) {
          this.savedLarvae++;
          if (!this.gameOver) this.addScore(larva);
          this.createFireFlies(larva);
        }
      });

      //eaten larva
      this.larvae.forEach((larva) => {
        if (larva.eaten) {
          this.createSparks(larva);
        }
      });
    }

    createFireFlies(larva) {
      //create a random number of fireflies each time
      const numberOfFireflies = Math.random() * 3 + 1;

      for (let i = 0; i <= numberOfFireflies; i++) {
        const fireFlies = new Firefly(this, larva, this.firefliesColor);
        this.particles.push(fireFlies);
      }
    }

    createSparks(larva) {
      //create a random number of fireflies each time
      const numberOfSparks = Math.random() * 3 + 7;

      for (let i = 0; i <= numberOfSparks; i++) {
        const spark = new Spark(this, larva, this.sparksColor);
        this.particles.push(spark);
      }
    }

    spawnEnemies() {
      this.enemySpeed = 1 + 2 * Math.random();
      const newEnemy = new Enemy(this);

      if (
        this.enemies.length < this.maxNumberOfEnemies &&
        this.enemySpawnInterval <= this.enemySpawnTimer
      ) {
        this.enemies.push(newEnemy);
        this.enemySpawnTimer = 0;
      }
      this.enemySpawnTimer += this.deltaTime;

      //delete the enemies that have reached their destination
      this.enemies = this.enemies.filter((enemy) => {
        return enemy.collisionX > 0;
      });
    }

    removeObjects() {
      //remove eaten larvae
      this.larvae = this.larvae.filter((larva) => {
        return larva.eaten === false;
      });

      //remove scored larvae
      this.larvae = this.larvae.filter((larva) => {
        return larva.collisionY > this.larvaUpperLimit;
      });

      //remove particles
      this.particles = this.particles.filter((particle) => {
        return particle.radius > 0.1;
      });
    }

    addScore(larva) {
      // the longer the larvas life, the higher the score
      const adult = larva.adult;
      const addScore = adult ? this.adultLarvaScore : this.youngLarvaScore;
      this.score += addScore;
      this.storeNewScore();
      //console.log(localStorage.score);
    }

    renderDashboard(context) {
      //render the score and other texts text
      context.save();
      context.shadowOffsetX = 4;
      context.shadowOffsetY = 4;
      context.shadowColor = "black";
      context.shadowBlur = 2;
      context.textAlign = "left";
      context.fillText(`Saved: ${this.savedLarvae}`, 50, 50);
      context.fillText(`Eaten: ${this.eatenLarvae}`, 50, 100);
      context.fillText(
        `${this.spawnedEggs} of ${this.totalEggs} eggs`,
        1000,
        50
      );
      context.restore();
      context.save();
      context.textAlign = "center";
      ctx.font = `50px ${font}`;
      context.fillText(`Score: ${this.score}`, this.width / 2, 70);
      context.restore();
    }

    displayMessage(context) {
      let message1 = "";
      let message2 = "";

      //win-lose logics
      const total = this.eatenLarvae + this.savedLarvae;
      if (!this.gameWin) {
        message1 = "Gameover!";
        message2 = "Sorry, half the hatchlings were eaten.";
      } else if (this.gameWin) {
        const bestScore = localStorage.score;
        message1 = "WINNER!";
        if (this.score > bestScore) {
          message2 = `You've beaten your previous record.`;
        } else {
          message2 = `your best score so far: ${bestScore}! `;
        }
      }

      context.save();
      context.fillStyle = "rgba(0,0,0,0.5)";
      context.fillRect(0, 0, this.width, this.height);
      context.shadowOffsetX = 4;
      context.shadowOffsetY = 4;
      context.shadowColor = "black";
      context.shadowBlur = 2;
      context.fillStyle = "white";
      context.textAlign = "center";
      context.font = `120px ${font}`;
      this.animateWord(context, message1);

      if (this.gameWin) {
        context.font = `40px ${font}`;
        context.fillText(`your score: ${this.score}`, this.width * 0.5, 411);
      }
      context.font = `40px ${font}`;
      context.fillText(message2, this.width * 0.5, this.height * 0.5 + 100);
      context.font = `20px ${font}`;
      context.textAlign = "left";
      context.fillText(this.tip, 246, 706);
      context.fillText("Press 'R' to restart.", 775, 706);
      context.fillText("Press 'C' to reset memory.", 947, 706); //1020 , 706
      context.restore();

      if (this.pressedKey.toUpperCase() === "R") {
        console.log("restarting");
        restart();
      }
      if (this.pressedKey.toUpperCase() === "C") {
        console.log("clearing memory");
        localStorage.score = "";
      }
    }
    animateWord(context, word) {
      const letterSpacing = 60;
      const start = this.width * 0.5 - word.length * letterSpacing * 0.5;

      context.save();
      for (let i = 1; i <= word.length + 1; i++) {
        context.font = `120px ${font}`;
        const pace = this.winGame
          ? 20 * Math.sin(i + this.runningTime * 10)
          : 10 * Math.sin(i + this.runningTime * 4);

        context.fillText(
          word.charAt(i - 1),
          start + i * letterSpacing,
          this.height * 0.5 + pace
        );
      }

      context.restore();
    }

    storeNewScore() {
      //the highest score will be stored in the memory
      //https://blog.bitsrc.io/how-to-store-data-on-the-browser-with-javascript-9c57fc0f91b0
      if (localStorage.score < this.score) {
        localStorage.score = this.score;
      }
    }

    init() {
      //render the obstacles
      let attempts = 0;
      while (
        attempts < this.numberOfObstacles * 100 &&
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
          let duplicateType = false;
          this.obstacles.forEach((obstacle) => {
            /*check if the space has been taken already
            get the distance between the new obstacle and an obstacle that is already in the array.
            check the distance between the new obstacle and an obstacle that is already in the array is far enough if it's not, the space is not empty
            */
            const { collision } = this.checkCollision(
              obstacle,
              newObstacle,
              this.spaceBetweenObstacles
            );

            if (collision) {
              emptySpace = false;
            }

            //also look for duplicate obstacles
            if (obstacle.obstacleType === newObstacle.obstacleType) {
              duplicateType = true;
            }
          });

          //if it's ok, push the new obstacle into the array
          if (emptySpace && !duplicateType) {
            this.obstacles.push(newObstacle);
          }

          attempts++;
        }
      }
    }
  }

  //instantiate the Game class
  let game = new Game(canvas);
  game.init();

  // we need a loop to animate our game
  let lastTime = 0;
  function animate(timeStamp) {
    //deltaTime will be used to make sure enough time has past before the game rerender itself. that preventes the game from being too fast
    const deltaTime = timeStamp - lastTime;
    lastTime = timeStamp;

    if (timer > interval) {
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
      //render player, obstacles, eggs, etc...
      game.render(ctx, deltaTime);

      //reset the timer
      timer = 0;
    }
    timer += deltaTime;

    /*Comment - requestAnimationFrame
    requestAnimationFrame(function)  this method will tell the browser to repeat the function to create an animation.
    here, it's reapeating the parent function*/
    window.requestAnimationFrame(animate);
  }

  function restart() {
    //instantiate the Game class
    game = new Game(canvas);
    game.init();
  }

  //call animate to start the animation
  animate(0);
});
