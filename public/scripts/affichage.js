const $taillePlateau = 18;
const joueurActu = 0;
const $caseVide = "O";
const $couleurs = ["r", "v", "b", "m", "c", "j"];
let nbJoueurs;

async function initAffichage(
  plateau,
  aQuiLeTour,
  liste_username,
  nbJoueur,
  roomId,
) {
  //console.debug("initAffichage");
  afficher(plateau, aQuiLeTour, liste_username, roomId);

  nbJoueurs = nbJoueur;
  let boutonDemasquer = document.querySelector("#bouton-demasquer");
  boutonDemasquer.addEventListener("click", demasquer);

  let pseudo = document.querySelector("#affichagePseudo");
  //console.log(pseudo);
  pseudo.textContent = p.username;

  p.color = undefined;

  socket.emit("getCouleur", p.socketId, p.roomId);
  socket.on("retourGetCouleur", (couleur) => {
    p.color = couleur;
  });

  while (p.color === undefined) {
    // Attendre un certain temps avant de vérifier à nouveau
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  let indicationCouleur = document.querySelector("#indicationCouleur");
  indicationCouleur.addEventListener("mouseover", changeColor);
  indicationCouleur.addEventListener("mouseout", resetColor);
}

function changeColor() {
  const indicationCouleur = document.querySelector("#indicationCouleur");

  indicationCouleur.style.backgroundColor = motAnglaisCouleurs(
    $couleurs[p.color],
  );
}

function resetColor() {
  const indicationCouleur = document.querySelector("#indicationCouleur");

  indicationCouleur.style.backgroundColor = "gray";
}

const inputRoom = document.querySelector("#roomjoin");
inputRoom.addEventListener("keypress", function (e) {
  if (e.charCode < 48 || e.charCode > 57) {
    e.preventDefault();
  }
});

const boutonEnvoyerChat = document.querySelector("#boutonEnvoyerChat");
boutonEnvoyerChat.addEventListener("click", envoyerMessage);

const inputChat = document.querySelector("#inputChat");
inputChat.addEventListener("keypress", function (e) {
  if (e.charCode == 13) {
    envoyerMessage();
  }
});

function envoyerMessage() {
  const message = inputChat.value;
  inputChat.value = "";
  if (message != "") socket.emit("envoyerChat", p.username, message, p.roomId);
}

function afficherJoueurActu(joueurActuel) {
  let spanJoueurActu = document.querySelector("#joueurActu");
  spanJoueurActu.textContent = joueurActuel;
}
 
const dialogElimine = document.querySelector("dialog");
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
      pion.classList.add(`color-${color}`);
      pion.setAttribute("data-posi", `${i}`);
      //pion.addEventListener("click",afficherDepPossibles);
      caze.replaceChildren(pion);
    } else {
      caze.textContent = "";
    }
  }

  updateListesDeroulantes(roomId);
}


async function updateListesDeroulantes(roomId) {
  let selectJoueurs = document.querySelector("#select-joueurs");
  let selectCouleurs = document.querySelector("#select-couleurs");
  let elemJoueurs;
  let elemCouleurs;

  socket.emit("listesJoueursEtCouleursEnJeu", roomId);
  socket.on("retourListesJoueursEtCouleursEnJeu", (couleurs, joueurs) => {
    //console.debug("elemCouleurs on");
    //console.debug(couleurs);
    //console.debug(joueurs);
    elemCouleurs = couleurs;
    elemJoueurs = joueurs;
  });

  while (elemCouleurs == undefined && elemJoueurs == undefined) {
    // Attendre un certain temps avant de vérifier à nouveau
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  if (elemJoueurs.length != selectJoueurs.children.length) {
    selectJoueurs.textContent = "";
    selectCouleurs.textContent = "";

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
}
/*
function melangerTableau(tableau) {
    for (let i = tableau.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tableau[i], tableau[j]] = [tableau[j], tableau[i]];
    }
}*/

async function demasquer() {
  let monTour;
  socket.on("RetourMonTour", (retour) => {
    monTour = retour;
  });
  socket.emit("MonTour", p);

  while (monTour === undefined) {
    // Attendre un certain temps avant de vérifier à nouveau
    await new Promise((resolve) => setTimeout(resolve, 20));
    //console.debug(`direction : ${direction}`);
  }

  console.log(`${p.username} a son tour ? ${monTour}`);

  if (!monTour) {
    return;
  }

  joueurSelectione = document.querySelector("#select-joueurs").value;
  couleurSelectonee = document.querySelector("#select-couleurs").value;

  //console.debug("joueurSelectione, couleurSelectonee");
  //console.debug(joueurSelectione, couleurSelectonee);

  socket.emit("demasquer", joueurSelectione, couleurSelectonee, p.roomId);
}

function messageChat(message, estInfoPartie) {
  const divMessage = document.createElement("div");
  divMessage.classList.add("border-bottom");
  divMessage.classList.add("border-light-subtle");

  divMessage.innerHTML = message;

  if (estInfoPartie) {
    divMessage.style.color = "grey";
  }

  const chat = document.querySelector("#messages-chat");
  chat.appendChild(divMessage);

  chat.scrollTop = chat.scrollHeight;
}

function resetBomJoueursDansRoom() {
  const divImagesJoueurs = document.querySelector("#images-joueurs");
  const affichagesJoueurs = divImagesJoueurs.querySelectorAll(
    "div[class*=imageJoueur]",
  );

  for (let i = 0; i < 6; i++) {
    //console.debug(affichagesJoueurs[i]);
    if (!affichagesJoueurs[i].classList.contains("transparent")) {
      //console.debug("ok");
      affichagesJoueurs[i].classList.add("transparent");
      const divPseudo = affichagesJoueurs[i].querySelector(".pseudoJoueur");
      divPseudo.textContent = "";
    }
  }
}

function afficherNomJoueurDansRoom(pseudo, estPret) {
  const divImagesJoueurs = document.querySelector("#images-joueurs");
  const affichagesJoueurs = divImagesJoueurs.querySelectorAll(
    "div[class*=imageJoueur]",
  );

  let texte;
  if (estPret) texte = `${pseudo} ✔️`;
  else texte = `${pseudo}`;

  for (let i = 0; i < 6; i++) {
    //console.debug(affichagesJoueurs[i]);
    if (affichagesJoueurs[i].classList.contains("transparent")) {
      //console.debug("ok");
      affichagesJoueurs[i].classList.remove("transparent");
      const divPseudo = affichagesJoueurs[i].querySelector(".pseudoJoueur");
      divPseudo.textContent = texte;
      return;
    }
  }

  console.debug("Trop de Jouerus ont rejoins");
  /*
    const listeJoueurDiv = document.querySelector("#liste-des-joueurs");

    const li = document.createElement("li");
    if(estPret)
        li.textContent = texte;
    else   
        li.textContent = texte;

    
    listeJoueurDiv.appendChild(li);*/
}

function toutCacher() {
  const ecrans = document.querySelectorAll(".ecran");
  ecrans.forEach((element) => {
    if (!element.classList.contains("cacher")) element.classList.add("cacher");
  });
    const decor = document.querySelector("#decor");
    decor.classList.add("cacher");

    const body = document.querySelector("body");
    body.classList.remove("fond-eau");
    body.classList.remove("fond-sol");

    const interface = document.querySelector("#interface");
    interface.classList.remove("cacher");
    const demasquer = document.querySelector("#demasquer");
    demasquer.classList.remove("cacher");
    dialogElimine.close();
}

function afficherMenu() {
  toutCacher();

  const body = document.querySelector("body");
  body.classList.add("fond-eau");

  const ecran = document.querySelector("#ecran-connexion");
  ecran.classList.remove("cacher");
}

function afficherRoom() {
  toutCacher();

  const body = document.querySelector("body");
  body.classList.add("fond-sol");

  const roomEtChat = document.querySelector("#roomEtChat");
  roomEtChat.classList.remove("cacher");

  const ecran = document.querySelector("#ecran-room");
  ecran.classList.remove("cacher");
}

function afficherJeu() {
  toutCacher();

  const body = document.querySelector("body");
  body.classList.add("fond-sol");

  const roomEtChat = document.querySelector("#roomEtChat");
  roomEtChat.classList.remove("cacher");

  const ecran = document.querySelector("#ecran-jeu");
  ecran.classList.remove("cacher")

  const decor = document.querySelector("#decor");
  decor.classList.remove("cacher");;
}

function afficherFinPartie() {
  toutCacher();

  const body = document.querySelector("body");
  body.classList.add("fond-sol");

  const roomEtChat = document.querySelector("#roomEtChat");
  roomEtChat.classList.remove("cacher");

  const ecranHaut = document.querySelector("#ecran-fin-partie-haut");
  ecranHaut.classList.remove("cacher");
  const ecranBas = document.querySelector("#ecran-fin-partie-bas");
  ecranBas.classList.remove("cacher");

  const ecranjeu = document.querySelector("#ecran-jeu");
  ecranjeu.classList.remove("cacher");
  
  const decor = document.querySelector("#decor");
  decor.classList.remove("cacher");;

  const interface = document.querySelector("#interface");
  interface.classList.add("cacher");
  const demasquer = document.querySelector("#demasquer");
  demasquer.classList.add("cacher");
}

function afficherAPropos() {
  toutCacher();

  const body = document.querySelector("body");
  body.classList.add("fond-sol");

  const aPropos = document.querySelector("#ecran-a-propos");
  aPropos.classList.remove("cacher");
}

/* CORRECTION PROBLEME MODULO */
Number.prototype.mod = function (n) {
  return ((this % n) + n) % n;
};

function motEntierCouleurs(couleur) {
  switch (couleur) {
    case "r":
      return "rouge";
      break;
    case "v":
      return "vert";
      break;
    case "b":
      return "bleu";
      break;
    case "m":
      return "magenta";
      break;
    case "c":
      return "cyan";
      break;
    case "j":
      return "jaune";
      break;
    default:
      console.debug(`motEntierCouleurs, ${couleur} pas une couleur`);
      break;
  }
}

function motAnglaisCouleurs(couleur) {
  switch (couleur) {
    case "r":
      return "red";
      break;
    case "v":
      return "green";
      break;
    case "b":
      return "blue";
      break;
    case "m":
      return "magenta";
      break;
    case "c":
      return "cyan";
      break;
    case "j":
      return "yellow";
      break;
    case "rouge":
      return "red";
      break;
    case "vert":
      return "green";
      break;
    case "bleu":
      return "blue";
      break;
    case "magenta":
      return "magenta";
      break;
    case "cyan":
      return "cyan";
      break;
    case "jaune":
      return "yellow";
      break;
    default:
      console.debug(`motAnglaisCouleurs, ${couleur} pas une couleur`);
      break;
  }
}

function test() {
  let cc = document.querySelectorAll(".case");

  cc.forEach((element) => {
    console.log(element);
    console.log(element.id);
    console.log(element.offsetLeft + ", " + element.offsetTop);
  });
}

const playSound = (sound) => {
  var audio = new Audio(sound);
  audio.play();
};

async function animation(depart, arrivee) {
  //console.debug(depart + " " + arrivee);
  const caseDepart = document.querySelector(`#case${depart}`);
  const caseArrivee = document.querySelector(`#case${arrivee}`);
  const pion = caseDepart.querySelector(".pion");

  const largeurCase = caseDepart.clientWidth / 2;

  pion.classList.add("animation");

  const xDepart = caseDepart.offsetLeft;
  const yDepart = caseDepart.offsetTop;
  const xArrivee = caseArrivee.offsetLeft;
  const yArrivee = caseArrivee.offsetTop;

  const vx = caseArrivee.offsetLeft - caseDepart.offsetLeft;
  const vy = caseArrivee.offsetTop - caseDepart.offsetTop;

  pion.style.translate = `${vx}px ${vy}px`;

  await new Promise((resolve) => setTimeout(resolve, 400));
  // si un pion est éliminé
  const pionElimine = caseArrivee.querySelector(".pion");

  if (pionElimine != undefined) animationElimine(arrivee);
}

async function animationElimine(numCase) {
  const casePion = document.querySelector(`#case${numCase}`);
  const pion = casePion.querySelector(`.pion`);
  pion.classList.add("animation");

  if (numCase >= 2 && numCase <= 7) {
    // haut
    pion.style.translate = `0px ${casePion.clientWidth * 0.75}px`;
  } else if (numCase >= 8 && numCase <= 10) {
    // droite
    pion.style.translate = `-${casePion.clientWidth * 0.75}px 0px`;
  } else if (numCase >= 11 && numCase <= 16) {
    // bas
    pion.style.translate = `0px -${casePion.clientWidth * 0.75}px`;
  } else if (numCase == 17 || numCase == 0 || numCase == 1) {
    // gauche
    pion.style.translate = `${casePion.clientWidth * 0.75}px 0px`;
  }

  await new Promise((resolve) => setTimeout(resolve, 500));

  if (numCase >= 2 && numCase <= 7) {
    // haut
    pion.style.translate = `0px ${casePion.clientWidth * 1.5}px`;
  } else if (numCase >= 8 && numCase <= 10) {
    // droite
    pion.style.translate = `-${casePion.clientWidth * 1.5}px 0px`;
  } else if (numCase >= 11 && numCase <= 16) {
    // bas
    pion.style.translate = `0px -${casePion.clientWidth * 1.5}px`;
  } else if (numCase == 17 || numCase == 0 || numCase == 1) {
    // gauche
    pion.style.translate = `${casePion.clientWidth * 1.5}px 0px`;
  }
  pion.style.scale = `0`;

  playSound("../data/bruit_de_plouf.mp3");
    
  if(pion.classList.contains(`color-${$couleurs[p.color]}`)){
      p.nbPions--;

      if(p.nbPions == 0)
          dialogElimine.show();
  }
}

function resetAnim(numCase) {
  const caseAnim = document.querySelector(`#case${numCase}`);
  const pion = caseAnim.querySelector(".pion");

  if (pion != undefined) {
    pion.classList.remove("animation");
    pion.style.translate = `0px 0px `;
  }

}
