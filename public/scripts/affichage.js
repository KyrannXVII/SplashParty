const $taillePlateau = 18;
const joueurActu = 0;
const $caseVide = "O";
const $couleurs = ["r", "v", "b", "m", "c", "j"];
let nbJoueurs;

async function initAffichage(plateau,aQuiLeTour,liste_username,nbJoueur,roomId) {
    //console.debug("initAffichage");
    afficher(plateau,aQuiLeTour,liste_username,roomId)

    nbJoueurs = nbJoueur;
    let boutonDemasquer = document.querySelector("#bouton-demasquer");
    boutonDemasquer.addEventListener("click",demasquer);
    console.log("init affichage");
    let pseudo = document.querySelector("#affichagePseudo");
    //console.log(pseudo);
    pseudo.textContent = p.username;

    p.color = undefined;

    socket.emit("getCouleur",p.socketId, p.roomId);
    socket.on("retourGetCouleur", (couleur)=>{
        p.color=couleur;
    })

    while (p.color === undefined) {
        // Attendre un certain temps avant de vérifier à nouveau
        await new Promise(resolve => setTimeout(resolve, 200));
    }

    let indicationCouleur = document.querySelector("#indicationCouleur");
    indicationCouleur.style.backgroundColor = motAnglaisCouleurs($couleurs[p.color]);

}


function afficherJoueurActu(joueurActuel){
    let spanJoueurActu = document.querySelector("#joueurActu"); 
    spanJoueurActu.textContent = joueurActuel;
}
 
function afficher(plateau,aquiletour,liste_username,roomId){
//function afficher(partie) {
    afficherJoueurActu(liste_username[aquiletour]);
    const $plateau = plateau;

    for (let i = 0; i < $taillePlateau; i++) {
        let caze = document.querySelector(`#case${i}`);
      
        if ($plateau[i] != $caseVide) {
            let pion = document.createElement("button");
            let color = $plateau[i].couleur;
            pion.classList.add("pion");
            pion.classList.add(`color-${color}`)
            pion.setAttribute("data-posi", `${i}`);
           //pion.addEventListener("click",afficherDepPossibles);
            caze.replaceChildren(pion); 
        }
        else {
            caze.textContent = "";
        }
    }

    
    updateListesDeroulantes(roomId);

}

async function updateListesDeroulantes(roomId) {
    let selectJoueurs = document.querySelector("#select-joueurs");
    let selectCouleurs = document.querySelector("#select-couleurs");
    selectJoueurs.textContent = "";
    selectCouleurs.textContent = "";
    let elemJoueurs;
    let elemCouleurs;

    socket.emit("listesJoueursEtCouleursEnJeu", roomId);
    socket.on("retourListesJoueursEtCouleursEnJeu", (couleurs, joueurs)=>{
        //console.debug("elemCouleurs on");
        //console.debug(couleurs);
        //console.debug(joueurs);
        elemCouleurs = couleurs;
        elemJoueurs = joueurs;
    })

    while (elemCouleurs == undefined && elemJoueurs == undefined) {
        // Attendre un certain temps avant de vérifier à nouveau
        await new Promise(resolve => setTimeout(resolve, 200));
    }

    for (var i = 0; i < elemJoueurs.length; i++) {
        var optionJoueur = document.createElement("option");
        optionJoueur.text = elemJoueurs[i];
        optionJoueur.value = elemJoueurs[i];
        
        selectJoueurs.add(optionJoueur);

        var optionCouleur = document.createElement("option");
        //console.debug("retourListeJoueursEtCouleurs, $couleurs[elemCouleurs[i]]");
        //console.debug($couleurs[elemCouleurs[i]]);
        optionCouleur.text = motEntierCouleurs($couleurs[elemCouleurs[i]]);
        optionCouleur.value = elemCouleurs[i];
        selectCouleurs.add(optionCouleur);
    }
}
/*
function melangerTableau(tableau) {
    for (let i = tableau.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tableau[i], tableau[j]] = [tableau[j], tableau[i]];
    }
}*/

async function demasquer(){
    let monTour;
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

    joueurSelectione = document.querySelector("#select-joueurs").value;
    couleurSelectonee = document.querySelector("#select-couleurs").value;

    //console.debug("joueurSelectione, couleurSelectonee");
    //console.debug(joueurSelectione, couleurSelectonee);

    socket.emit("demasquer",joueurSelectione, couleurSelectonee, p.roomId);
}


function messageChat(message, estInfoPartie, ){
    const divMessage = document.createElement("div");
    divMessage.innerHTML = message;
    
    if(estInfoPartie){
        divMessage.style.color = "grey";
    }

    const chat = document.querySelector("#divChat");
    chat.appendChild(divMessage);
}


/* CORRECTION PROBLEME MODULO */
Number.prototype.mod = function(n) {
    return ((this%n)+n)%n;
}

function motEntierCouleurs(couleur){
    switch(couleur){
        case "r" : return "rouge"; break;
        case "v" : return "vert"; break;
        case "b" : return "bleu"; break;
        case "m" : return "magenta"; break;
        case "c" : return "cyan"; break;
        case "j" : return "jaune"; break;
        default : console.debug(`motEntierCouleurs, ${couleur} pas une couleur`); break;
    }
}

function motAnglaisCouleurs(couleur){
    switch(couleur){
        case "r" : return "red"; break;
        case "v" : return "green"; break;
        case "b" : return "blue"; break;
        case "m" : return "magenta"; break;
        case "c" : return "cyan"; break;
        case "j" : return "yellow"; break;
        case "rouge" : return "red"; break;
        case "vert" : return "green"; break;
        case "bleu" : return "blue"; break;
        case "magenta" : return "magenta"; break;
        case "cyan" : return "cyan"; break;
        case "jaune" : return "yellow"; break;
        default : console.debug(`motAnglaisCouleurs, ${couleur} pas une couleur`); break;
    }
}


