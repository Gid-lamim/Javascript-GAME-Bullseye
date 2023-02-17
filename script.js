//addEventListener('load' --> when the page loads
window.addEventListener("load", function () {
  const canvas = document.getElementById("canvas1");
  const ctx = canvas.getContext("2d");

  //set canvas size
  canvas.width = 1280;
  canvas.height = 720;

  //object player
  class Player {
    constructor(game) {
      this.game = game;
    }

    //this method will draw the player
    draw(context) {
      //beginPath tells Javascript to begin drawing a new shape
      context.beginPath();
      //arc needs 5 arguments: x, y, radius, start angle(rad), end angle
      context.arc(100, 100, 50, 0, Math.PI * 2);
      context.fill();
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
    }

    //the Render method will draw the player
    render(context) {
      this.player.draw(context);
    }
  }

  //instantiate the Game class
  const game = new Game(canvas);
  game.render(ctx);
  console.log(game);

  // we need a loop to animate our game
  function animate() {}
});
