class player {
    constructor(username, socketId) {
      (this.username = username),
        (this.socketId = socketId),
        (this.host = false),
        (this.roomId = undefined),
        (this.color = undefined),
        (this.ready = false),
        (this.nbPions = 3),
        (this.connecte = true);
    }
 }
let p = undefined;
const socket = io();
const alea = document.querySelector("#alea");
const algo = document.querySelector("#algo");
const partie = document.querySelector("#partie");

const boutonLancer = document.querySelector("#lancer");
boutonLancer.addEventListener("click",()=>{
    const nbAlea = alea.value;
    const nbAlgo = algo.value;
    const nbPartie = partie.value;
    
    console.log(`alea = ${nbAlea}, algo = ${nbAlgo}`)
    if(+nbAlea + +nbAlgo > 7 ){
        alert("Nb de bots max = 6...")
    }
    else{
    p = new player("Admin", socket.id);
    socket.emit("CréerRoomsBot",p,nbAlea,nbAlgo,nbPartie)
    }
})