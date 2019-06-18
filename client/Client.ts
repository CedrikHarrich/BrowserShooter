import { GlobalConstants as Const } from "../global/GlobalConstants"
import { Keys as Keys } from "../global/Keys"

export class Client {
    private socket:any = io();
    private canvas:any;
    private context:any;
    private character:any = new Image();
    private background:any = new Image();
    private gameState:any;

    constructor(){
        console.log("A Client has started.");

        //HTML Variables
        this.canvas = <HTMLCanvasElement> document.getElementById("myCanvas");
        this.context = this.canvas.getContext("2d");

        // Image Sources
        this.character.src = `./${Const.ASSET_FOLDER}character.png`;
        this.background.src = `./${Const.ASSET_FOLDER}background.png`;

        this.drawBackground();
        this.registerEvents();
    }

    registerEvents(){
      //Event: Update with the new GameState
      this.socket.on('update', (gameState:any) =>{
          this.gameState = gameState;
          this.draw();

      });

      //Event: Signal the server that a key has been pressed.
      window.addEventListener("keydown", (event : any) =>{
        console.log(event.key)
          this.keyPressedHander(event.key, true)
      }, true);

      //Event: Stop moving when key is not pressed.
      window.addEventListener("keyup", (event : any) =>{
        this.keyPressedHander(event.key, false)
      }, true);
    }

    keyPressedHander(inputId:string, state:boolean) {
      if (Object.values(Keys).includes(inputId)){
        this.socket.emit('keyPressed', {inputId: inputId, state : state});
      }
    }

    draw(){
      this.drawBackground()
      this.drawCharacter();
    }

    drawCharacter(){
      for (var i = 0; i < this.gameState.length; i++){
          console.log(this.gameState[i].x);
          this.context.drawImage(this.character, this.gameState[i].x, this.gameState[i].y, Const.PLAYER_HEIGHT, Const.PLAYER_WIDTH);
      }
    }

    drawBackground(){
      // this.context.clearRect(0, 0, Const.CANVAS_WIDTH, Const.CANVAS_HEIGHT);
      this.context.drawImage(this.background, 0 ,0 , Const.CANVAS_WIDTH, Const.CANVAS_HEIGHT);
    }


}
