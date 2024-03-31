class player {
    constructor(username,socketId){
    this.username = username,
    this.socketId = socketId,
    this.host = false,
    this.roomId = undefined,
    this.color = undefined,
    this.ready = false,
    this.nbPions = 3,
    this.connecte = true
    }
};
let p =undefined;
const socket = io();

const usernamePlayer = (document.querySelector("#input-pseudo"));

const roomJoin = (document.querySelector("#roomjoin"));

const createRoomButton = document.querySelector("#roomCreerB");
createRoomButton.addEventListener("click",() => {
    if(usernamePlayer.value != ""){
        usernamePlayer.classList.remove("is-invalid");
        p = new player(usernamePlayer.value,socket.id);
        socket.emit('playerData',p);
        //console.debug("joueur p");
        //console.debug(p);
        roomJoin.value = "";
    }
    else{
        usernamePlayer.classList.add("is-invalid");
    }
} );

const joinRoomButton = document.querySelector("#roomjoinB");
joinRoomButton.addEventListener("click",() => {
    if(roomJoin.value == ""){
        roomJoin.classList.add("is-invalid");
        return
    }
    else{
        roomJoin.classList.remove("is-invalid");
    }
    if(usernamePlayer.value != ""){
        usernamePlayer.classList.remove("is-invalid");
        p = new player(usernamePlayer.value,socket.id);
        p.roomId = +roomJoin.value
        socket.emit('playerData',p);
        roomJoin.value = "";
    }
    else{
        usernamePlayer.classList.add("is-invalid");
    }
} );

/* changement de page pas fou car faudrai use des cookie pour stocker les info des joueurs etc
socket.on("goRoom",()=>{
    window.location.href = '/templates/room.html';
    socket.emit('listPlayersRoom',p);   
} );
*/

socket.on("goRoom",(room)=>{
    /*Cache le div de connexion et affiche celui de la room */
    //console.log("bordel")
    
    afficherRoom();

    /* affichage du numero de room */
    const idRoomP = document.querySelector("#id-room");
    p.roomId = room.id;
    idRoomP.innerText = room.id;

}
);

/*TODO : Permet d'actualiser la liste des joueur de la room*/
socket.on("actuRoom",(room)=>{
    resetBomJoueursDansRoom();

    room.players.forEach(element => {
        //console.debug(element);
        afficherNomJoueurDansRoom(element.username, element.ready, element.estUnBot);
    });

});


const pretB = document.querySelector("#b-pret-roomjeu");
pretB.addEventListener("click",()=>
{
    p.ready = !p.ready;
    pretB.classList.toggle("pretT");
    //console.debug(p.roomId);
    socket.emit('joueurPret',p);
    //console.debug(p.ready);
})


socket.on("lancerPartie",(plateau,aQuiLeTour,liste_username,nbJoueur,roomId)=>{
    //console.debug("roomId dans le on");
    //console.debug(roomId);
    
    afficherJeu();

    initAffichage(plateau,aQuiLeTour,liste_username,nbJoueur,roomId);
    
    const pionsB = document.querySelectorAll(".pion");
    pionsB.forEach(pion => {
        pion.addEventListener("click",deplacementPossible);
    });
   
})


const deplacementPossible = async (event) =>{
    let monTour = undefined
 
 
 socket.on("RetourMonTour",(retour) =>{monTour = retour})  
 socket.emit("MonTour",p)
 while (monTour === undefined) {
    // Attendre un certain temps avant de vérifier à nouveau
    await new Promise(resolve => setTimeout(resolve, 20));
    //console.debug(`direction : ${direction}`);
}

console.log(`${p.username} a son tour ? ${monTour}`)


    if(!monTour){
        return;
    }

    let direction;
    let pion = event.target;
    //console.debug(pion);
    const posiPion = pion.dataset.posi;
    let futurPosiPossible = undefined;
    let depPion;
    //on desactive les boutons pions
    document.querySelectorAll('[class^="pion"]').forEach(pion => {
        pion.removeEventListener("click",deplacementPossible);
    });
    socket.emit("deplacementPossible",posiPion,p.roomId)

    socket.on("retourDeplacementPossible",(deplacementPossible, x) =>{
        //console.log(deplacementPossible);
        depPion = x;
       futurPosiPossible = deplacementPossible;
    })


    while (futurPosiPossible === undefined) {
        // Attendre un certain temps avant de vérifier à nouveau
        await new Promise(resolve => setTimeout(resolve, 50));
        //console.debug(`direction : ${direction}`);
    }

    //console.debug(pion);
    //console.debug(depPion);
    pion.textContent = depPion;
    
    let caseEnAvant = futurPosiPossible[0];
    let caseEnArriere = futurPosiPossible[1];
    function choixDirTrue(){ direction = true; /*console.debug(`Tu as choisi T`)*/;}
    function choixDirFalse(){ direction = false; /*console.debug(`Tu as choisi F`)*/;}
    

    if(caseEnAvant !== null){
        let caseT = document.querySelector(`#case${caseEnAvant}`);
        caseT.classList.add("direction");
        caseT.addEventListener("click", choixDirTrue);}

    if(caseEnArriere !== null){    
        let caseF = document.querySelector(`#case${caseEnArriere}`);
        caseF.classList.add("direction");
        caseF.addEventListener("click", choixDirFalse);}
   
   
    while (direction === undefined) {
        // Attendre un certain temps avant de vérifier à nouveau
        await new Promise(resolve => setTimeout(resolve, 20));
        //console.debug(`direction : ${direction}`);
    }
    //console.log(direction);
    // Enleve les cases noir de marquage des deplacements
    const casesDirection = document.querySelectorAll(".direction");
    Array.from(casesDirection).forEach((caseDirection) => {
        caseDirection.classList.remove("direction")
        caseDirection.removeEventListener("click", choixDirTrue)
        caseDirection.removeEventListener("click", choixDirFalse)}
    )

    //on reactive les boutons puis
    activerPion();
    socket.emit("deplacerPion",posiPion,direction,p.roomId)
}

socket.on("actualisePartie",async (plateau,aquiletour,liste_joueur_sans_couleur,action) => {
// function afficher(plateau,aquiletour,listejoueur_sanscouleur)
    
console.debug("action");
console.debug(action);
    if(action != undefined){
        if(action[0] == 0){ // déplacement
            animation(action[1], action[2]);
            await new Promise(resolve => setTimeout(resolve, 2000));
            resetAnim(action[1]);
            resetAnim(action[2]);
        }
        if(action[0] == 1){ // démasquage
            action[1].forEach(element => {
                animationElimine(element);
            });
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    afficher(plateau,aquiletour,liste_joueur_sans_couleur, p.roomId)
    activerPion();
    })

socket.on("FinPartie",(resultat)=>{
    console.debug(resultat);
    afficherFinPartie();
    const hUsername = document.querySelector("#username-gagnant");

    if(resultat[1]==0){
        hUsername.innerText = `${resultat[0].username} gagne en ayant le plus de pions restants !`
    }
    else if(resultat[1]==1){
        hUsername.innerText = `${resultat[0].username} gagne en étant le plus proche du plongeoir !`
    }
    else if(resultat[1]==2){
        hUsername.innerText = `${resultat[0].username} gagne en ayant le meilleur pion le plus proche du plongeoir !`
    }
    else if(resultat[1]==3){
        hUsername.innerText = `${resultat[0][0].username} et ${resultat[0][1].username} ont fait égalité !`
    }

    // Reset le stat des joueurs
    p.ready = false;
    pretB.classList.remove("pretT");
})

socket.on("Error",(message) =>{
    alert   (message);
})



const relancerPartie = () => {
    //p.nbPions = 3;
    socket.emit("actualiseJoueur",p);
    afficherRoom();
}

const bRelance = document.querySelector("#button-relancer");
bRelance.addEventListener("click",relancerPartie);


const activerPion = () =>{
    const pionsB = document.querySelectorAll(".pion");
    pionsB.forEach(pion => {
        pion.addEventListener("click",deplacementPossible);
    });
}

/* CORRECTION PROBLEME MODULO */
Number.prototype.mod = function(n) {
    return ((this%n)+n)%n;
}

const bIdRoom = document.querySelector("#id-room");
bIdRoom.addEventListener("click", ()=>{

    navigator.clipboard.writeText(bIdRoom.textContent);


});

const bAjouterBot = document.querySelector("#bAjouterBot");
bAjouterBot.addEventListener("click", ()=>{
    bAjouterBot.disabled=true;
    
    // listeners TODO pour ajouter les bots
    const bBotAleatoire = document.querySelector("#bBotAleatoire");
    bBotAleatoire.classList.remove("cacher");
    bBotAleatoire.addEventListener("click", ()=>{(console.log("ajouter bot alétoire"),ajouterBot(1))});
    const bBotAlgo = document.querySelector("#bBotAlgo");
    bBotAlgo.classList.remove("cacher");
    bBotAlgo.addEventListener("click", ()=>{(console.log("ajouter bot algo"),ajouterBot(2))});
    const bBotIA = document.querySelector("#bBotIA");
    bBotIA.classList.remove("cacher");
    bBotIA.addEventListener("click", ()=>{(console.log("ajouter bot IA"),ajouterBot(3))});

    // X retire les boutons
    const bAnnulerAjouterBot = document.querySelector("#bAnnulerAjouterBot");
    bAnnulerAjouterBot.classList.remove("cacher");
    bAnnulerAjouterBot.addEventListener("click", ()=>{
        bBotAleatoire.classList.add("cacher");
        bBotAlgo.classList.add("cacher");
        bBotIA.classList.add("cacher");
        bAnnulerAjouterBot.classList.add("cacher");
        bAjouterBot.disabled = false;
    });
});

const ajouterBot  = (niveauBot) =>{
    socket.emit('AjouterBot',p.roomId,niveauBot);   
    console.debug("bot");
}


socket.on("messageChat",(message, estInfoPartie)=>{
    messageChat(message, estInfoPartie);
})

    const reloadB = document.querySelector("#Retour")
reloadB.addEventListener("click",() => {
    location.reload();
})

const bRetour = document.querySelector("#b-retour-roomjeu")
bRetour.addEventListener("click",() => {
    location.reload();
})


const bRetourAPropos = document.querySelector("#b-retour-a-propos");
bRetourAPropos.addEventListener("click",() => {
    afficherMenu();
})
const bAPropos = document.querySelector("#b-a-propos");
bAPropos.addEventListener("click",() => {
    afficherAPropos();
})

const retirerBot = (idx) =>{
    console.log(`Retirer le bot qui est a l'index ${idx}`)
    socket.emit("RetirerBot",idx,p.roomId);
}