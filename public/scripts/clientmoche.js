class player {
    constructor(username,socketId){
    this.username = username,
    this.socketId = socketId,
    this.host = false,
    this.roomId = undefined,
    this.color = undefined,
    this.ready = false,
    this.nbPions = 3
    this.socket = undefined
    this.estUnBot = false;
    }
};
let p =undefined;
const socket = io();

const usernamePlayer = (document.querySelector("#username"));

const roomJoin = (document.querySelector("#roomjoin"));

const createRoomButton = document.querySelector("#creerB");
console.log(createRoomButton)
createRoomButton.addEventListener("click",() => {
    p = new player(usernamePlayer.value,socket.id);
    socket.emit('playerData',p);
    console.debug("joueur p");
    console.debug(p);
} );

const joinRoomButton = document.querySelector("#roomjoinB");
joinRoomButton.addEventListener("click",() => {
    p = new player(usernamePlayer.value,socket.id);
    p.roomId = +roomJoin.value
    socket.emit('playerData',p);

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
    const conDiv = document.querySelector("#Connexion");
    const roomDiv = document.querySelector("#Room");
    const roomIDDiv = document.querySelector("#id-room");
    const roomEtChat = document.querySelector("#roomEtChat");
    conDiv.classList.add("cacher");
    roomDiv.classList.remove("cacher");
    roomEtChat.classList.remove("cacher");

    /* affichage du numero de room */
    const idRoomP = document.createElement('p');
    p.roomId = room.id;
    idRoomP.innerText = `ID room : ${room.id}`;
    roomIDDiv.append(idRoomP);

}
);

/*TODO : Permet d'actualiser la liste des joueur de la room*/
/*Moyen car utilsiation de innerHTML*/
socket.on("actuRoom",(room)=>{
    const listeJoueurDiv = document.querySelector("#liste-des-joueurs")
// ${room.players.map(player => `<li>${player.username}</li>`).join('')}

        let list =` <ul>  
                        ${room.players.map((player) => {
                            if(player.ready)
                                return `<li>${player.username} ✔️</li>`
                            else return `<li>${player.username}</li>`
                        }).join('')}
                    </ul>`

        listeJoueurDiv.innerHTML = list;
        //console.debug(player.username);
    

});

const pretB = document.querySelector("#pret");
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
    const roomDiv = document.querySelector("#Room");
    roomDiv.classList.add("cacher");

    const jeuDiv = document.querySelector("#Jeu");
    //console.log(jeuDiv);
    jeuDiv.classList.remove("cacher");
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

socket.on("actualisePartie",(plateau,aquiletour,liste_joueur_sans_couleur) => {
// function afficher(plateau,aquiletour,listejoueur_sanscouleur)
    
    afficher(plateau,aquiletour,liste_joueur_sans_couleur, p.roomId)
    activerPion();
    })

socket.on("FinPartie",(resultat)=>{
    const divFin = document.querySelector("#FinPartie");
    divFin.classList.remove("cacher");
    const hUsername = divFin.querySelector("#username-gagnant");

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
    socket.emit("actualiseJoueur",p);
    pretB.classList.remove("pretT");
})

socket.on("Error",(message) =>{
    alert   (message);
})



const relancerPartie = () => {
    const jeuDiv = document.querySelector("#Jeu");
    jeuDiv.classList.add("cacher");
    const divFin = document.querySelector("#FinPartie");
    divFin.classList.add("cacher");
    const roomDiv = document.querySelector("#Room");
    roomDiv.classList.remove("cacher");
}

const bRelance = document.querySelector("#button-relancer");
bRelance.addEventListener("click",relancerPartie);


const activerPion = () =>{
    const pionsB = document.querySelectorAll(".pion");
    pionsB.forEach(pion => {
        pion.addEventListener("click",deplacementPossible);
    });
}


const bAjouterBot = document.querySelector("#bAjouterBot");
bAjouterBot.addEventListener("click", ()=>{
    bAjouterBot.disabled=true;
    // clone le template
    let templateAjoutBot = document.querySelector("#template-ajouter-bot").content.cloneNode(true).querySelectorAll("*"); //querySelectorAll("*") pour enlever les espaces et les <br>
    let divDiffBot = document.querySelector("#diffBot");
    // ajoute les boutons a la div
    templateAjoutBot.forEach(element => {
        //console.debug(element);
        divDiffBot.appendChild(element);
    });
    
    // listeners TODO pour ajouter les bots
    let bBotAleatoire = divDiffBot.querySelector("#bBotAleatoire");
    bBotAleatoire.addEventListener("click", ()=>{(console.log("ajouter bot alétoire"),ajouterBot())});
    let bBotAlgo = divDiffBot.querySelector("#bBotAlgo");
    bBotAlgo.addEventListener("click", ()=>{console.log("ajouter bot algo")});
    let bBotIA = divDiffBot.querySelector("#bBotIA");
    bBotIA.addEventListener("click", ()=>{console.log("ajouter bot IA")});

    // X retire les boutons
    let bAnnulerAjouterBot = divDiffBot.querySelector("#bAnnulerAjouterBot");
    bAnnulerAjouterBot.addEventListener("click", ()=>{
        divDiffBot.textContent = "";
        bAjouterBot.disabled = false;
    });
});


socket.on("messageChat",(message, estInfoPartie)=>{
    messageChat(message, estInfoPartie);
})

    const reloadB = document.querySelector("#Retour")
reloadB.addEventListener("click",() => {
    location.reload();
})


const ajouterBot  = () =>{
    socket.emit('AjouterBot',p.roomId);   
    console.debug("bot");
}


/* CORRECTION PROBLEME MODULO */
Number.prototype.mod = function(n) {
    return ((this%n)+n)%n;
}
