const { Socket } = require("socket.io");
const express = require("express");
const fs = require('fs'); // TEST 
const app = express();
const http = require("http").createServer(app);
const path = require("path");
const port = 8080;

const io = require("socket.io")(http);
const jeu = require("./jeu_server.js");
const bots = require("./botAlea.js");
///à voir la diff entre use et get
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  ///choses à envoyer au client (script, templates, ect...)
  res.sendFile(path.join(__dirname, "public/templates/index.html"));
});

http.listen(port, () => console.log(`listening on http://localhost:${port}`));
let rooms = [];
/*
    room = {
            id: int
            players : tableau de joueurs
            }

*/
/*Gestion socket*/
io.on("connection", (socket) => {
  console.log(`Socket connecte: ${socket.id}`);
  socket.on("playerData", (player) => {
    try {
      console.log(`Player : ${player.username}`);
      let room;
      /* création de la room */
      if (player.roomId === undefined) {
        room = createRoom(player);
        player.roomId = room.id;
        //console.debug(player.roomId);
        player.host = true;
        player.sonTour = true;
        console.log(`${DateLog()} -> room crée : ${room.id}, host ${player.username}`);
      } else {
        /* rejoindre une room */
        console.log(`Room a rejoindre : ${player.roomId}`);
        room = rooms.find((r) => r.id === player.roomId);
        if (room === undefined) {
          socket.emit("Error", "room inconnu");
          return;
        }

        if (room.players.length === 6) {
          socket.emit("Error", "ROOM PLEINE !");
          return;
        }
        room.players.push(player);
      }

      socket.emit("goRoom", room);
      /* regroupe les socket dans les room pour broacast */
      socket.join(room.id);
      /* broadcast pour actualiser la liste des joueurs d'une room */
      io.in(room.id).emit("actuRoom", room);
    } catch (error) {
      console.error(`${DateLog()} -> Erreur lors de playerData ${error}`);
    }
  });

  /* si socket deconnecter vire le jouer de la liste des joueur de la room*/
  socket.on("disconnect", () => {
    try {
      let idxRoom = 0;
      if (rooms.length > 0) {
        for (let room of rooms) {
          const idxPlayer = room.players.findIndex(
            (player) => player.socketId === socket.id,
          );
          if (idxPlayer >= 0) {
            //si le joueur est dans la room -> on a trouver la bonne room
            //console.log(room.id);

          if (room.partie !== undefined) {
           
            const joueur = room.players[idxPlayer];
            const tabPionsElimines =  jeu.eliminerJoueur(room.players[idxPlayer], room.partie);
           // room.players[idxPlayer].connecte = false
            room.partie.nbJoueur--;
            if(room.partie.aQuiLeTour>idxPlayer) room.partie.aQuiLeTour--;
            
            //room.partie.listeJoueur.splice(idxPlayer,1);
            room.players.splice(idxPlayer, 1);
            console.debug(room.partie.listeJoueur)
            console.log(room.partie.aQuiLeTour);

              //room.partie.listeJoueur.splice(idxPlayer,1);
              room.players.splice(idxPlayer, 1);
              console.debug(room.partie.listeJoueur);
              console.log(room.partie.aQuiLeTour);

              console.debug(`Un joueur s'est deconnecté`);
              if (joueurNonBot(room.players)) {
                room.partie.plusDeJoueurHumain = true;
                console.debug("ICI : on a plus de joueur humain ");
              }

              const partie = room.partie;

              const liste_username = partie.listeJoueur.map(
                (joueur) => joueur.username,
              );
              const plateau_secu = partie.plateau.map(securisation_pion);
              console.log(plateau_secu);
              io.in(room.id).emit("messageChat", `${joueur.username} s'est déconnnecté`, true);
              io.in(room.id).emit(
                "actualisePartie",
                plateau_secu,
                partie.aQuiLeTour,
                liste_username,
              );
              broadCastBotActu(room, plateau_secu, [1, tabPionsElimines]); //agis comme un démasquage
              faireJouerBot(room, false);
            }
            

            //room.players.splice(idxPlayer, 1);
            console.debug(room.players);
            io.in(room.id).emit("actuRoom", room);

            if (room.players.length === 0) {
              rooms.splice(rooms.indexOf(room), 1);
            }
            break;
          }
        }
      }
    } catch (error) {
      console.error(`${DateLog()} -> Erreur lors de disconnect ${error}`);
    }
  });

  socket.on("joueurPret", (player) => {
    try{
      createFileWithHelloWorld(); // TEST LOG SERVEUR²²²²
    console.debug("PRET!!");
    actualiserJoueur(player);
    let room = rooms.find((room) => room.id === player.roomId);

    if (room.players.every((joueur) => joueur.ready)) {
      // si tous les joueurs sont prets
      if (room.players.length < 3) {
        console.log("Il faut au moins 3 joueurs pour commencer une partie");
        io.in(room.id).emit("actuRoom", room);
      } else {
        //console.log('room.player');
        //console.log(room.players);
        room.partie = jeu.initPartie(room.players.length, room.players);
        const partie = room.partie;
        const liste_username = partie.listeJoueur.map(
          (joueur) => joueur.username,
        );
        const plateau_secu = partie.plateau.map(securisation_pion);
        io.in(room.id).emit("messageChat", "== NOUVELLE PARTIE ==", true);
        io.in(room.id).emit(
          "lancerPartie",
          plateau_secu,
          partie.aQuiLeTour,
          liste_username,
          partie.nbJoueur,
          room.id,
        );
        broadCastBotInit(room, plateau_secu);
      }
    } else {
      // si tous les joueurs ne sont pas prets
      console.log("Tous les joueurs ne sont pas pret");
      io.in(room.id).emit("actuRoom", room);
    }
  } catch(error){
    console.error(`${DateLog()} -> Erreur lors de  ${error}`);
  }

});

  //Envoie individuellement à chaque client sa couleur.
  socket.on("getCouleur", (sockId, roomId) => {
    try{
    const room = rooms.find((room) => room.id === roomId);
    const player = room.players.find((player) => player.socketId === sockId);
    socket.emit("retourGetCouleur", player.color);
    } catch {
      console.error(`${DateLog()} -> Erreur lors de getCouleur ${error}`);
    }
  });

  socket.on("deplacementPossible", (positionPion, roomId) => {
    try{
    const room = rooms.find((room) => room.id === roomId);
    const retour = jeu.getDepPossible(positionPion, room.partie); // getDepPossible renvoie [depDuPion, casePossible1, casePossible2]
    const deplacementPossible = [retour[1], retour[2]];
    const depPion = retour[0];
    socket.emit("retourDeplacementPossible", deplacementPossible, depPion);
    } catch{
      console.error(`${DateLog()} -> Erreur lors de deplacementPossible ${error}`);
    }

  });

  socket.on("estCoupPrecedentInverse", (posiPion, idxCase, roomId) => {
    try{
    const room = rooms.find((room) => room.id === roomId);
    const retour = jeu.estCoupPrecedentInverse(posiPion, idxCase, room.partie);
    //console.debug(retour);
    socket.emit("retourEstCoupPrecedentInverse", retour);
    }catch {
      console.error(`${DateLog()} -> Erreur lors de estCoupPrecedentInverse ${error}`);
    }
  });

  socket.on("deplacerPion", async (posiPion, direction, roomId) => {
    try{
    const room = rooms.find((room) => room.id === roomId);
    console.log(`posiPion : ${posiPion} direction : ${direction}`);

    const caseArrivee = jeu.getCaseArrivee(
      posiPion,
      direction,
      room.partie.plateau,
    );
    let res = jeu.deplacer(posiPion, direction, room.partie);
    finPartie = res[0] != false;
    let message = res[1];

    const partie = room.partie;
    let liste_username = partie.listeJoueur.map((joueur) => joueur.username);
    let plateau_secu = partie.plateau.map(securisation_pion);
    io.in(room.id).emit(
      "actualisePartie",
      plateau_secu,
      partie.aQuiLeTour,
      liste_username,
      [0, posiPion, caseArrivee],
    );
    broadCastBotActu(room, plateau_secu, [0, posiPion, caseArrivee]); ////////////////////////////////////////////////// FALSE CAR ASKIP PAS ENCORE DE DENON FAUT S'EN OCCUPER TA MERE!
    io.in(room.id).emit("messageChat", message, true);

    if(finPartie){
      const gagnant = res[0][0];
      const estEgalite = res[0][1];
      const messageFin = res[0][2];
      io.in(room.id).emit("messageChat", messageFin, true);
      io.in(room.id).emit("FinPartie", finPartie);
      broadCastBotFinPartie(room);
    }else{
      faireJouerBot(room, finPartie);
    }
    } catch(error){
      console.error(`${DateLog()} -> Erreur lors de deplacerPion ${error}`);
    }
  });

  socket.on("MonTour", (joueur) => {
    try{
    const room = rooms.find((room) => room.id === joueur.roomId);
    const retour = jeu.aSonTour(joueur, room.partie);
    console.log(`${joueur.username} a son tour ? ${retour}`);
    socket.emit("RetourMonTour", retour);
    }catch(error){
      console.error(`${DateLog()} -> Erreur lors de MonTour ${error}`);
    }
  });

  //permet d'actualiser la room pour tout le monde au niveau client pour relancer
  //la game avec le status ready des joueurs mis a jour pour relancer la partie
  socket.on("actualiseJoueur", (joueur) => {
    try{    
    actualiserJoueur(joueur);
    console.debug(`PROBLEME NB PIONS = ${joueur.nbPions}`)
    const room = rooms.find((room) => room.id === joueur.roomId);
    io.in(room.id).emit("actuRoom", room);
  } catch{
    console.error(`${DateLog()} -> Erreur lors de actualiserJoueur ${error}`);
  }
  });

  socket.on("listesJoueursEtCouleursEnJeu", (roomId) => {
    //console.debug("roomId");
    //console.debug(roomId);
    try{
    const room = rooms.find((room) => room.id === roomId);
    const couleurs = [];
    const joueurs = [];
    //console.debug("listesJoueursEtCouleursEnJeu, room.partie.listeJoueur :");
    room.partie.listeJoueur.forEach((element) => {
      //console.debug(element);
      if (element.nbPions > 0) {
        //console.debug("nbPions > 0");
        couleurs.push(element.color);
        joueurs.push(element.username);
      }
    });
    //console.debug("couleurs en jeu");
    //console.debug(couleurs);
    melangerTableau(couleurs);
    melangerTableau(joueurs);
    socket.emit("retourListesJoueursEtCouleursEnJeu", couleurs, joueurs);
    }catch(error){
      console.error(`${DateLog()} -> Erreur lors de listesJoueursEtCouleursEnJeu ${error}`);
    }
  });

  socket.on("demasquer", (nomJoueur, couleur, roomId) => {
    //console.debug("demasquer");
    try {
      
    const room = rooms.find((room) => room.id === roomId);

    //const demasquageVrai = jeu.demasquerJoueur(room.partie, nomJoueur, couleur);

    const res = jeu.demasquerJoueur(room.partie, nomJoueur, couleur);
    finPartie = res[0] != false;
    const message = res[1];
    const tabPionsElimines = res[2];
    io.in(room.id).emit("messageChat", message, true);

    if (finPartie) {
      const liste_username = room.partie.listeJoueur.map(
        (joueur) => joueur.username,
      );
      io.in(room.id).emit(
        "actualisePartie",
        room.partie.plateau,
        room.partie.aQuiLeTour,
        liste_username,
        [1, tabPionsElimines],
      );
      const gagnant = res[0][0];
      const estEgalite = res[0][1];
      const messageFin = res[0][2];
      io.in(room.id).emit("messageChat", messageFin, true);
      io.in(room.id).emit("FinPartie", finPartie);
      broadCastBotFinPartie(room);
    } else {
      const liste_username = room.partie.listeJoueur.map(
        (joueur) => joueur.username,
      );
      let plateau_secu = room.partie.plateau.map(securisation_pion);
      io.in(room.id).emit(
        "actualisePartie",
        room.partie.plateau,
        room.partie.aQuiLeTour,
        liste_username,
        [1, tabPionsElimines],
      );
      broadCastBotActu(room, plateau_secu, [1, tabPionsElimines]); //true car demasquage
      faireJouerBot(room, finPartie);
    }

  } catch(error){
    console.error(`${DateLog()} -> Erreur lors de demasquer ${error}`);
  }
    //console.debug("room.partie a la fin de demasquer");
    //console.debug(room.partie);
  });

  socket.on("envoyerChat", (username, message, roomId) => {
    try{
    const room = rooms.find((room) => room.id === roomId);
    io.in(room.id).emit("messageChat", `${username} : ${message}`, false);
    }catch(error){
      console.error(`${DateLog()} -> Erreur lors de envoyerChat ${error}`);
    }
  });

  socket.on("AjouterBot", (roomId) => {
    try{
    room = rooms.find((r) => r.id === roomId);
    if (room.players.length === 6) {
      socket.emit("${DateLog()} -> Error", "ROOM PLEINE !");
      return;
    }
    room.nbBot++;
    let bot = new bots.BotAlea(`BOT${room.nbBot}`, roomId);
    room.players.push(bot);
    io.in(room.id).emit("actuRoom", room);
    }catch(error){
      console.error(`${DateLog()} -> Erreur lors de AjouterBot ${error}`);
    }
  });
  /*
            SUITE SOCKET ON ET EMIT
    
    */
});

/*TODO : verifié que le numero de room n'est pas déjà utilisé */
const createRoom = function (host) {
  const room = {
    id: roomId(),
    players: [host],
    bots: [],
    partie: undefined,
    nbBot: 0,
  };
  rooms.push(room);
  host.roomId = room.id;
  return room;
};
/*  */
const roomId = () => Math.floor(Math.random() * 1000);

/*Permet d'actualiser coté serveur le joueur*/
const actualiserJoueur = (p) => {
  const room = rooms.find((room) => room.id === p.roomId);
  //console.debug(room);
  let idxJoueur = room.players.findIndex(
    (player) => player.socketId === p.socketId,
  );
  //console.debug(idxJoueur);
  room.players[idxJoueur] = p;
  //console.debug(room);
};

function melangerTableau(tableau) {
  for (let i = tableau.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tableau[i], tableau[j]] = [tableau[j], tableau[i]];
  }
}
const securisation_pion = (pion) => {
  console.log(pion);
  console.log(jeu.$caseVide);

  pion === jeu.$caseVide;
  if (pion === jeu.$caseVide) return jeu.$caseVide;

  let newPion = { ...pion };
  newPion.deplacement = 0;
  return newPion;
};

// ****************************** GESTION BOT
const broadCastBotInit = (room, plateau) => {
  room.players.forEach((element) => {
    if (element.estUnBot) {
      //  console.log(element.username);
      // console.log(typeof element);
      element.init(plateau);
    }
  });
};

const broadCastBotActu = (room, plateau, dernierCoup) => {
  room.players.forEach((element) => {
    if (element.estUnBot) {
      //  console.log(element.username);
      //  console.log(typeof element);
      element.maj(plateau, dernierCoup);
    }
  });
};

//Permet de remettre les pions des bots à 3 pour relancer partie
const broadCastBotFinPartie = (room) => {
  room.players.forEach((element) => {
    if (element.estUnBot) {
      //  console.log(element.username);
      //  console.log(typeof element);
      element.nbPions = 3;
    }
  });
};

const faireJouerBot = async (room, finPartie_) => {
  try{
  const partie = room.partie;
  let finPartie = finPartie_;
  let res;
  while (partie.listeJoueur[partie.aQuiLeTour].estUnBot && !finPartie) {
    const bot = partie.listeJoueur[partie.aQuiLeTour];
    let action;
    // Check si le coup est légal si c'est le cas on continue sinon on demande au bot de rejouer
    do {
      action = bot.jouer();
    } while (
      !jeu.estCoupLegalBot(action[1], action[2], room.partie) &&
      !action[0]
    ); // on relance pas si le bot veut denonncer
    // Check si le coup est légal si c'est le cas on continue sinon on demande au bot de rejouer

    console.debug(`LAA : ${room.partie}`);
    console.debug(`BORDEL : ${action[1]}, ${action[2]} `);

    let tabPourAnimation = undefined;

    if (!action[0]) {
      // si n'est pas un démasquage
      await new Promise((r) => setTimeout(r, 2000));
      const caseArrivee = jeu.getCaseArrivee(
        action[1],
        action[2],
        room.partie.plateau,
      );
      res = jeu.deplacer(action[1], action[2], room.partie); // pion et sens
      finPartie = res[0];
      message = res[1];
      tabPourAnimation = [0, action[1], caseArrivee];
    } else {
      // si le bot veut denoncer
      await new Promise((r) => setTimeout(r, 2000));
      res = jeu.demasquerJoueur(room.partie, action[1], action[2]);
      finPartie = res[0] != false;
      message = res[1];
    }

    liste_username = partie.listeJoueur.map((joueur) => joueur.username);
    plateau_secu = partie.plateau.map(securisation_pion);
    io.in(room.id).emit(
      "actualisePartie",
      plateau_secu,
      partie.aQuiLeTour,
      liste_username,
      tabPourAnimation,
    );
    broadCastBotActu(room, plateau_secu, tabPourAnimation); ////////////////////////////////////////////////// FALSE CAR ASKIP PAS ENCORE DE DENON FAUT S'EN OCCUPER TA MERE!
    ////////////////////////////////////////////////// CORDIALEMENT.
    io.in(room.id).emit("messageChat", message, true);
  }
  if (finPartie) {
    const gagnant = res[0][0];
    const estEgalite = res[0][1];
    const messageFin = res[0][2];
    io.in(room.id).emit("messageChat", messageFin, true);
    io.in(room.id).emit("FinPartie", finPartie);
    broadCastBotFinPartie(room);
  }
  }
  catch(error){
    console.error(`${DateLog()} -> Erreur lors de faireJouerBot ${error}`);
}
  //return finPartie
};

const joueurNonBot = (listeJoueur) => {
  return listeJoueur.every((j) => j.estUnBot);
};




// TEST SERVEUR LOG
function createFileWithHelloWorld() {
  fs.writeFile('/opt/render/log/HelloWorld.txt', 'Hello World', (err) => {
      if (err) throw err;
      console.log('The file has been saved!');
  });
}

function DateLog() {
  const date = new Date();
  const options = { timeZone: 'Europe/Paris', hour12: false };
  return date.toLocaleString('fr-FR', options);
}

console.log(DateLog());