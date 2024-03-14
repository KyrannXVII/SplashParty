const { Socket } = require("socket.io");
const express = require("express");
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
  console.log(`Socket : ${socket.id}`);
  socket.on("playerData", (player) => {
    console.log(`Player : ${player.username}`);
    let room;
    /* création de la room */
    if (player.roomId === undefined) {
      room = createRoom(player);
      player.roomId = room.id;
      //console.debug(player.roomId);
      player.host = true;
      player.sonTour = true;
      console.log(`room crée : ${room.id}, host ${player.username}`);
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
  });

  /* si socket deconnecter vire le jouer de la liste des joueur de la room*/
  socket.on("disconnect", () => {
    if (rooms.length > 0) {
      for (let room of rooms) {
        const idxPlayer = room.players.findIndex(
          (player) => player.socketId === socket.id,
        );
        if (idxPlayer >= 0) {
          //console.log(room.id);

          if (room.partie !== undefined) {
            jeu.eliminerJoueur(room.players[idxPlayer], room.partie);
            const partie = room.partie;
            const liste_username = partie.listeJoueur.map(
              (joueur) => joueur.username,
            );
            const plateau_secu = partie.plateau.map(securisation_pion);
            console.log(plateau_secu);
            io.in(room.id).emit(
              "actualisePartie",
              plateau_secu,
              partie.aQuiLeTour,
              liste_username,
            );
          }
          room.players.splice(idxPlayer, 1);
          io.in(room.id).emit("actuRoom", room);

          if (room.players.length === 0) {
            rooms.splice(rooms.indexOf(room), 1);
          }
        }
      }
    }
  });

  socket.on("joueurPret", (player) => {
    console.log("PRET!!");
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
  });

  //Envoie individuellement à chaque client sa couleur.
  socket.on("getCouleur", (sockId, roomId) => {
    const room = rooms.find((room) => room.id === roomId);
    const player = room.players.find((player) => player.socketId === sockId);
    socket.emit("retourGetCouleur", player.color);
  });

  socket.on("deplacementPossible", (positionPion, roomId) => {
    const room = rooms.find((room) => room.id === roomId);
    const retour = jeu.getDepPossible(positionPion, room.partie); // getDepPossible renvoie [depDuPion, casePossible1, casePossible2]
    const deplacementPossible = [retour[1], retour[2]];
    const depPion = retour[0];
    socket.emit("retourDeplacementPossible", deplacementPossible, depPion);
  });

  socket.on("estCoupPrecedentInverse", (posiPion, idxCase, roomId) => {
    const room = rooms.find((room) => room.id === roomId);
    const retour = jeu.estCoupPrecedentInverse(posiPion, idxCase, room.partie);
    //console.debug(retour);
    socket.emit("retourEstCoupPrecedentInverse", retour);
  });

  socket.on("deplacerPion", async (posiPion, direction, roomId) => {
    const room = rooms.find((room) => room.id === roomId);
    console.log(`posiPion : ${posiPion} direction : ${direction}`);
    let res = jeu.deplacer(posiPion, direction, room.partie);
    finPartie = res[0];
    let message = res[1];

    const partie = room.partie;
    let liste_username = partie.listeJoueur.map((joueur) => joueur.username);
    let plateau_secu = partie.plateau.map(securisation_pion);
    io.in(room.id).emit(
      "actualisePartie",
      plateau_secu,
      partie.aQuiLeTour,
      liste_username,
    );
    broadCastBotActu(room, plateau_secu, false); ////////////////////////////////////////////////// FALSE CAR ASKIP PAS ENCORE DE DENON FAUT S'EN OCCUPER TA MERE!
    io.in(room.id).emit("messageChat", message, true);

    faireJouerBot(room,finPartie);
  });

  socket.on("MonTour", (joueur) => {
    const room = rooms.find((room) => room.id === joueur.roomId);
    const retour = jeu.aSonTour(joueur, room.partie);
    console.log(`${joueur.username} a son tour ? ${retour}`);
    socket.emit("RetourMonTour", retour);
  });


  //permet d'actualiser la room pour tout le monde au niveau client pour relancer
  //la game avec le status ready des joueurs mis a jour pour relancer la partie
  socket.on("actualiseJoueur", (joueur) => {
    actualiserJoueur(joueur);
    const room = rooms.find((room) => room.id === joueur.roomId);
    io.in(room.id).emit("actuRoom", room);
  });

  socket.on("listesJoueursEtCouleursEnJeu", (roomId) => {
    //console.debug("roomId");
    //console.debug(roomId);
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
  });

  socket.on("demasquer", (nomJoueur, couleur, roomId) => {
    //console.debug("demasquer");
    const room = rooms.find((room) => room.id === roomId);

    //const demasquageVrai = jeu.demasquerJoueur(room.partie, nomJoueur, couleur);

    const res = jeu.demasquerJoueur(room.partie, nomJoueur, couleur);
    finPartie = res[0];
    const message = res[1];
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
      );
      io.in(room.id).emit("FinPartie", finPartie);
      broadCastBotFinPartie();
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
      );
      broadCastBotActu(room, plateau_secu, true); //true car demasquage
      faireJouerBot(room,finPartie);
    }
   
    //console.debug("room.partie a la fin de demasquer");
    //console.debug(room.partie);
  });

  socket.on("envoyerChat", (username, message, roomId) => {
    const room = rooms.find((room) => room.id === roomId);

    io.in(room.id).emit("messageChat", `${username} : ${message}`, false);
  });

  socket.on("AjouterBot", (roomId) => {
    room = rooms.find((r) => r.id === roomId);
    if (room.players.length === 6) {
      socket.emit("Error", "ROOM PLEINE !");
      return;
    }
    room.nbBot++;
    let bot = new bots.BotAlea(`BOT${room.nbBot}`, roomId);
    room.players.push(bot);
    io.in(room.id).emit("actuRoom", room);
  });
  /*
            SUITE SOCKET ON ET EMIT
    
    */
});

/*TODO : verifié que le numero de room n'est pas déjà utilisé */
const createRoom = function (host) {
  const room = { id: roomId(), players: [host], bots: [], partie: undefined, nbBot: 0};
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

const broadCastBotActu = (room, plateau, denoncer) => {
  room.players.forEach((element) => {
    if (element.estUnBot) {
    //  console.log(element.username);
    //  console.log(typeof element);
      element.maj(plateau, denoncer);
    }
  });
};

//Permet de remettre les pions des bots à 3 pour relancer partie
const broadCastBotFinPartie = () => {
  room.players.forEach((element) => {
    if (element.estUnBot) {
    //  console.log(element.username);
    //  console.log(typeof element);
    element.nbPions = 3;
    }
  });
};


const faireJouerBot = async (room,finPartie_) => {
  const partie = room.partie;
  let finPartie = finPartie_;
  while (partie.listeJoueur[partie.aQuiLeTour].estUnBot && !finPartie) {
    const bot = partie.listeJoueur[partie.aQuiLeTour];
    let action;
    // Check si le coup est légal si c'est le cas on continue sinon on demande au bot de rejouer
    do{action = bot.jouer()} while((!jeu.estCoupLegalBot(action[1], action[2], room.partie)) && !action[0] ); // on relance pas si le bot veut denonncer
    // Check si le coup est légal si c'est le cas on continue sinon on demande au bot de rejouer
  
    console.debug(`LAA : ${room.partie}`);
    console.debug(`BORDEL : ${action[1]}, ${action[2]} `);

    if (!action[0]) {
      // si n'est pas un démasquage
      await new Promise((r) => setTimeout(r, 2000));
      res = jeu.deplacer(action[1], action[2], room.partie); // pion et sens
      finPartie = res[0];
      message = res[1];
    } else { // si le bot veut denoncer
      await new Promise((r) => setTimeout(r, 2000));
      res = jeu.demasquerJoueur(room.partie, action[1], action[2]);
      finPartie = res[0];
      message = res[1];
    }

    liste_username = partie.listeJoueur.map((joueur) => joueur.username);
    plateau_secu = partie.plateau.map(securisation_pion);
    io.in(room.id).emit(
      "actualisePartie",
      plateau_secu,
      partie.aQuiLeTour,
      liste_username,
    );
    broadCastBotActu(room, plateau_secu, action[0]); ////////////////////////////////////////////////// FALSE CAR ASKIP PAS ENCORE DE DENON FAUT S'EN OCCUPER TA MERE!
    ////////////////////////////////////////////////// CORDIALEMENT.
    io.in(room.id).emit("messageChat", message, true);
  }
  if (finPartie) {
    io.in(room.id).emit("FinPartie", finPartie);
    broadCastBotFinPartie();
  }
  //return finPartie

}