import { Game } from "./Game";
import { Player } from "./Player";
import { GlobalConstants as CONST } from "./GlobalConstants";

export class Server {
  
  //Server Variables
  private express:any;
  private app:any; 
  private http:any;
  private io:any;
  private socket: any;

  //Data the server holds
  private game:Game;
  private readyCounter:number = 0;

  //
  private clients: Array<any> = [];
  private gameState = {
    h1 : 30,
    h2 : "Hello"
  }
  
  constructor(){
    this.init();
    this.registerEvents();
  }

  //Sets up the actual server and starts listening to a port.
  init(){
    //Initial settings for the server.
    this.express = require("express");
    this.app = this.express();
    this.app.set("port", CONST.PORT);
    this.app.use(this.express.static('dist'));
    this.http = require("http").Server(this.app);
    this.io = require("socket.io")(this.http);

    //The server starts listening to the given port.
    this.http.listen(CONST.PORT, () => {
        console.log(`The server has been created and is now listening on port: ${CONST.PORT}.`);
    })
  }

  //Starting to register all the Events that can occur.
  //
  registerEvents(){
    this.io.on("connection", (socket: any) => {
        console.log(`The user with ID ${socket.id} is trying to connect...`);

        this.socket = socket;
        this.clients.push(socket);

        //Determines if there are enough players to start a game and keeps players
        //in the waiting lobby.
        this.userCountHandler();

        socket.on('disconnect', () => {
          this.readyCounter = 0;
          console.log(`The player with the ID ${socket.id} has disconnected.`);
          this.removeClient(socket);
        });

         //Event: When two clients are ready. Start the game.
         socket.on('ready', () => {
          this.readyCounter ++;
          console.log(`There are ${this.readyCounter} players ready to play.`)
          if (this.readyCounter === CONST.MAX_CLIENTS){
            //console.log(this.game.getPlayers()[1]);
            //this.io.emit("gameStarts", this.game.getPlayers());
            
            //gameLoop Berechnung
            //this.updateHandler(socket.id);
          }
        });


        /*
        //This code is performed before the game even started.
        socket.on("keyPressed", (Array: any) => {
          Array.push(socket.id);
          this.keyHandler(Array);
        });
        */

        socket.on("message", (message: any) => {
            let newMessage = "Other Person: " + message;

            socket.broadcast.emit("message", newMessage);
            console.log(`The player ${socket.id} has sent the message '${message}'.`);
        });

        
    })

    
  }

  //
  setBackGame(){
    //Disconnect all the clients.
    for (let entry of this.clients){
      this.removeClient(entry.id);
      console.log(`${entry.id} has been kicked.`);
    }
    //Delete the old game.
    this.game = null;
    console.log(`The game has been set back. New players can join again.`);
  }

  //
  addClient(socket:any){
    this.clients.push({socket, player: null});
  }

  //
  removeClient(socket:any){
    for(let i = 0; i < this.clients.length; i++){
      if(this.clients[i].id == socket.id){
        this.clients.splice(i, 1);
      }
    }
  }

  //
  getClientIndex(id:number){
    for(let i = 0; i < this.clients.length; i++){
      if(this.clients[i]['id'] == id){
        return i;
      }
    }
  }

  //
  userCountHandler(){
    if(this.clients.length == CONST.MAX_CLIENTS){
      this.startGame();
    }
    else {
      if(this.clients.length < CONST.MAX_CLIENTS){
        // notifies that another player has to connect.
        this.io.emit("message", "Waiting for somebody to join");
        console.log(`${this.socket.id} is waiting for another player to connect.`);
      } else {
        // notifies the connecting client that the lobby is full
        this.socket.emit("message", "Please wait... The game lobby is full at the moment. You can chat with the other players though.");
        console.log(`${this.socket.id} is on the waiting for other players to leave.`);
      }
    }
  }

  //
  sendGame(){

  }

  //
  startGame(){
    //TODO: Initialize the game
    this.game = new Game();
    let players:[Player, Player] = this.game.getPlayers();


    if (players.length === this.clients.length){
      for(let i = 0; i < this.clients.length; i++){
          this.clients[i]['player'] = players[i];
      }
    }

    // should eventually emit gamestate instead of players
    this.io.emit("asset", this.game.getAssets());

     //Messages to Player and Console.
     this.io.emit("message", "Game has started.");
     console.log(`A new game has started.`);
 
 
     //TODO: Waiting for Ready Players. io.on("ready")...
     //TODO: 2x ready leads to event "go".
     //TODO: Start the update loop. Send out gamestate 60 times a second.
     //TODO: And listen for inputs and calculate them.
     //TODO: Handle how the inputs should be calculated. Logic of the game.
     //TODO: Check if there is a winnner. io.on("winner"); and handle it.
     //TODO: What do you do if someone disconnects?
 
 
     //Needed?
     
 
     //Needed? should eventually emit gamestate instead of players
     //this.io.emit("gameStarts", this.game.getPlayers());
 
  }

  //
  updateGame(){

  }

  //
  keyHandler([keyName, eventType, socketId]:[string, string, number]){
    let keyState = (eventType == "keydown") ? true : false,
        clientIndex = this.getClientIndex(socketId),
        player = this.clients[clientIndex].player;

      switch(keyName) {

        case "ArrowLeft":// left key
              player.setLeft(keyState);
        break;
        case "ArrowUp":// up key
              player.setUp(keyState);
        break;
        case "ArrowRight":// right key
            player.setRight(keyState);
        break;
      }
  }

  //
  updateHandler(socketId:number){
    let clientIndex = this.getClientIndex(socketId),
        player = this.clients[clientIndex].player,
        playerGroundHeight = CONST.CANVAS_HEIGHT - CONST.GROUND_HEIGHT - CONST.PLAYER_HEIGHT,
        playerMaxCoordX =  CONST.CANVAS_WIDTH - CONST.PLAYER_WIDTH;

    if (player.getUp() && !player.getJumping()) {

      player.addVelocityY(-40); //bestimmt Höhe des Sprungs
      player.setJumping(true);

    }

    if (player.getLeft()) {
      player.addVelocityX(-1.5);
    }

    if (player.getRight()) {

      player.addVelocityX(1.5);

    }

    player.addVelocityY(1.2);// gravity
    player.addCoordsX(player.getVelocityX);
    player.addCoordsY(player.getVelocityY);

    player.multiplyVelocityX(0.9);
    player.multiplyVelocityY(0.9);

    // if player is falling below floor line
    if (player.getCoordsY() > playerGroundHeight) {

      player.setJumping(false);
      player.setCoordsY(playerGroundHeight);
      player.setVelocityY(0);

    }

    // if player is going off the left of the screen
    if (player.getCoordX() < 0) {

      player.setCoordX(0);

    } else if (player.getCoordX() > playerMaxCoordX) {// if player goes past right boundary

      player.setCoordX(playerMaxCoordX);

    }

    this.socket.emit('draw', {'x':player.getCoordsX(), 'y':player.getCoordsY()});

  }

}
