const { Socket } = require("socket.io");
const express = require("express");
const fs = require("fs"); // TEST
const app = express();
const http = require("http").createServer(app);
const path = require("path");
const port = 8080;

const io = require("socket.io")(http);
const jeu = require("./jeu_server.js");
const botsAlea = require("./botAlea.js");
const botsAlgo = require("./botAlgo.js");

///à voir la diff entre use et get
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  ///choses à envoyer au client (script, templates, ect...)
  res.sendFile(path.join(__dirname, "public/templates/index.html"));
});

app.get("/bot", (req, res) => {
  ///choses à envoyer au client (script, templates, ect...)
  res.sendFile(path.join(__dirname, "public/templates/bot.html"));
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
        console.log(
          `${DateLog()} -> room crée : ${room.id}, host ${player.username}`,
        );
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
      console.error(`${DateLog()} -> Erreur lors de playerData`);
      console.error('Trace de la pile:', error.stack);
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
              const botRemplacant = new botsAlea.BotAlea(
                joueur.username,
                room.id,
              );
              const plateau_secu = room.partie.plateau.map(securisation_pion);
              botRemplacant.init(plateau_secu);
              botRemplacant.color = joueur.color;
              botRemplacant.nbPions = joueur.nbPions;

              console.debug(room.players[idxPlayer]);

              room.players[idxPlayer] = botRemplacant;
              console.debug("room.players");

              console.debug(room.players);
              //// logs ////
              //TODO A corriger
             // jeu.logs.joueurQuitte($couleurs[joueur.couleur]);
              //// //// ////

              faireJouerBot(room, false);
              /* Jouueur eliminer lors de la deconnexion
            const tabPionsElimines =  jeu.eliminerJoueur(room.players[idxPlayer], room.partie);
           
           
            // room.players[idxPlayer].connecte = false
            room.partie.nbJoueur--;
            if(room.partie.aQuiLeTour>idxPlayer) room.partie.aQuiLeTour--;
            
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
                (joueur) => joueur.username
              );
              const plateau_secu = partie.plateau.map(securisation_pion);
              console.log(plateau_secu);
              io.in(room.id).emit(
                "messageChat",
                `${joueur.username} s'est déconnnecté`,
                true
              );
              io.in(room.id).emit(
                "actualisePartie",
                plateau_secu,
                partie.aQuiLeTour,
                liste_username
              );
              broadCastBotActu(room, plateau_secu, [1, tabPionsElimines]); //agis comme un démasquage
              faireJouerBot(room, false);
              */
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
      console.error(`${DateLog()} -> Erreur lors de disconnect`)
      console.error('Trace de la pile:', error.stack);;;
    }
  });

  socket.on("joueurPret", (player) => {
    try {
      //createFileWithHelloWorld(); // TEST LOG SERVEUR
      console.debug("PRET!!");
      actualiserJoueur(player);
      let room = rooms.find((room) => room.id === player.roomId);
      verificationPret(room);      
    } catch (error) {
      console.error(`${DateLog()} -> Erreur lors de joueurPret `)
      console.error('Trace de la pile:', error.stack);
    }
  });

  //Envoie individuellement à chaque client sa couleur.
  socket.on("getCouleur", (sockId, roomId) => {
    try {
      const room = rooms.find((room) => room.id === roomId);
      const player = room.players.find((player) => player.socketId === sockId);
      socket.emit("retourGetCouleur", player.color);
    } catch {
      console.error(`${DateLog()} -> Erreur lors de getCouleur ${error}`);
    }
  });

  socket.on("deplacementPossible", (positionPion, roomId) => {
    try {
      const room = rooms.find((room) => room.id === roomId);
      const retour = jeu.getDepPossible(positionPion, room.partie); // getDepPossible renvoie [depDuPion, casePossible1, casePossible2]
      const deplacementPossible = [retour[1], retour[2]];
      const depPion = retour[0];
      socket.emit("retourDeplacementPossible", deplacementPossible, depPion);
    } catch {
      console.error(
        `${DateLog()} -> Erreur lors de deplacementPossible ${error}`,
      );
    }
  });

  socket.on("estCoupPrecedentInverse", (posiPion, idxCase, roomId) => {
    try {
      const room = rooms.find((room) => room.id === roomId);
      const retour = jeu.estCoupPrecedentInverse(
        posiPion,
        idxCase,
        room.partie,
      );
      //console.debug(retour);
      socket.emit("retourEstCoupPrecedentInverse", retour);
    } catch {
      console.error(
        `${DateLog()} -> Erreur lors de estCoupPrecedentInverse ${error}`,
      );
    }
  });

  socket.on("deplacerPion", async (posiPion, direction, roomId) => {
    try {
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

      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (finPartie) {
        const gagnant = res[0][0];
        const estEgalite = res[0][1];
        const messageFin = res[0][2];
        io.in(room.id).emit("messageChat", messageFin, true);
        io.in(room.id).emit("FinPartie", res[0]);
        //broadCastBotFinPartie(room);
      } else {
        faireJouerBot(room, finPartie);
      }
    } catch (error) {
      console.error(`${DateLog()} -> Erreur lors de deplacerPion`);
      console.error('Trace de la pile:', error.stack);
    }
  });

  socket.on("MonTour", (joueur) => {
    try {
      const room = rooms.find((room) => room.id === joueur.roomId);
      const retour = jeu.aSonTour(joueur, room.partie);
      console.log(`${joueur.username} a son tour ? ${retour}`);
      socket.emit("RetourMonTour", retour);
    } catch (error) {
      console.error(`${DateLog()} -> Erreur lors de MonTour `);
      console.error('Trace de la pile:', error.stack);;
    }
  });

  //permet d'actualiser la room pour tout le monde au niveau client pour relancer
  //la game avec le status ready des joueurs mis a jour pour relancer la partie
  socket.on("actualiseJoueur", (joueur) => {
    try {
      actualiserJoueur(joueur);
      console.debug(`PROBLEME NB PIONS = ${joueur.nbPions}`);
      const room = rooms.find((room) => room.id === joueur.roomId);
      io.in(room.id).emit("actuRoom", room);
    } catch {
      console.error(`${DateLog()} -> Erreur lors de actualiserJoueur ${error}`);
    }
  });

  socket.on("listesJoueursEtCouleursEnJeu", (roomId) => {
    //console.debug("roomId");
    //console.debug(roomId);
    try {
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
    } catch (error) {
      console.error(
        `${DateLog()} -> Erreur lors de listesJoueursEtCouleursEnJeu`);
      console.error('Trace de la pile:', error.stack);
    }
  });

  socket.on("demasquer", (nomJoueur, couleur, roomId) => {
    //console.debug("demasquer");
    try {
      const room = rooms.find((room) => room.id === roomId);

      //const demasquageVrai = jeu.demasquerJoueur(room.partie, nomJoueur, couleur);

      const res = jeu.demasquerJoueur(room.partie, nomJoueur, couleur);

      finPartie = res[0] != false;
      console.log(`res= ${res[0]}`);

      console.log(`FIN DE PARTIE ? Valeur de finPartie = ${finPartie}`);
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
        io.in(room.id).emit("FinPartie", res[0]);
        //broadCastBotFinPartie(room);
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
    } catch (error) {
      console.error(`${DateLog()} -> Erreur lors de demasquer ${error}`);
      console.error('Trace de la pile:', error.stack);;
    }
    //console.debug("room.partie a la fin de demasquer");
    //console.debug(room.partie);
  });

  socket.on("envoyerChat", (username, message, roomId) => {
    try {
      const room = rooms.find((room) => room.id === roomId);
      io.in(room.id).emit("messageChat", `${username} : ${message}`, false);
    } catch (error) {
      console.error(`${DateLog()} -> Erreur lors de envoyerChat`);
      console.error('Trace de la pile:', error.stack);;
    }
  });

  socket.on("AjouterBot", (roomId, niveauBot) => {
    try {
      room = rooms.find((r) => r.id === roomId);
      if (room.players.length === 6) {
        socket.emit("${DateLog()} -> Error", "ROOM PLEINE !");
        return;
      }
      room.nbBot++;
      let bot;
      switch (niveauBot) {
        case 1:
          bot = new botsAlea.BotAlea(`🤖 ${usernameBot()} (Aléa)`, roomId);
          break;
        case 2:
          bot = new botsAlgo.BotAlgo(`🤖 ${usernameBot()} (Algo1)`, roomId);
          break;
        case 3:
          bot = new botsAlea.BotAlea(`🤖 ${usernameBot()} (Algo2)`, roomId);
          break;
      }
      room.players.push(bot);
      console.debug("room.players :");

      console.debug(room.players);
      io.in(room.id).emit("actuRoom", room);
      verificationPret(room); 
    } catch (error) {
      console.error(`${DateLog()} -> Erreur lors de AjouterBot`);
      console.error('Trace de la pile:', error.stack);;
    }
  });
  
  socket.on("RetirerBot",(index,roomid) =>{
  
    const room = rooms.find((room) => room.id === roomid);  
    room.players.splice(index, 1);
    room.nbBot--;
    io.in(room.id).emit("actuRoom", room);


  })

  socket.on("CréerRoomsBot", async (p,nbBotAlea, nbBotAlgo,nbPartie) =>{
    for(let i = 0; i<nbPartie ; i++){

await new Promise(resolve => setTimeout(resolve, 500));
    creerRoomBot(p,nbBotAlea,nbBotAlgo);
    }
  })
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

const verificationPret = (room) => {
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
    room.players.map((j)=>{
      if(!j.estUnBot){
        console.debug("ICI PAS UN BOT!");
        j.ready = false;
      }
    })
    console.debug("room.players");

    console.debug(room.players);
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
    faireJouerBot(room, false);
  }
} else {
  // si tous les joueurs ne sont pas prets
  console.log("Tous les joueurs ne sont pas pret");
  io.in(room.id).emit("actuRoom", room);
}}


// ****************************** GESTION BOT
const broadCastBotInit = (room, plateau) => {
  room.players.forEach((element) => {
    if (element.estUnBot) {
      //  console.log(element.username);
      // console.log(typeof element);
      element.nbPions = 3;
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
      //element.nbPions = 3;
    }
  });
};

const usernameBot = () =>{
 /* const noms = [
    "Bidule", "Choupinou", "Loulou", "Pamplemousse", "Cacahuète",
    "Bibi", "Frimousse", "Titi", "Minou", "Zazou",
    "Papillon", "Poussin", "Croquignol", "Tic-tac", "Paillette",
    "Bambou", "Coquillette", "Zozo", "Frimousse", "Sardine",
    "Zébulon", "Chipie", "Bouton d'or", "Biscuit", "Poupoune",
    "Zinzin", "Miette", "Pirouette", "Fanfan", "Tagada",
    "Tchou-tchou", "Boubou", "Zigzag", "Lutin", "Pingouin",
    "Chouquette", "Nin-Nin", "Tournesol", "Pistache", "Galipette",
    "Zoubida", "Choupette", "Bidibidi", "Roudoudou", "Pinpin",
    "Choupichou", "Papaye", "Pop-corn", "Pimousse", "Kiki"
  ];
  const adjectifs = [
    "Étourdi", "Facétieux", "Givré", "Farfelu", "Pétillant",
    "Frétillant", "Zinzin", "Froufroutant", "Ravigotant", "Sautillant",
    "Foufou", "Ébouriffant", "Chamboulant", "Zigzaguant", "Éclatant",
    "Tournicotant", "Rigolard", "Loufoque", "Truculent", "Pittoresque",
    "Espiègle", "Exubérant", "Bouillonnant", "Cocasse", "Fougueux",
    "Tourbillonnant", "Singulier", "Épatant", "Éclaboussant", "Éblouissant",
    "Farceur", "Badin", "Coquin", "Fougueux", "Fringant",
    "Éblouissant", "Amusant", "Éclatant", "Excentrique", "Fantaisiste",
    "Fringant", "Jubilatoire", "Loufoque", "Marrant", "Original",
    "Rigolo", "Surprenant", "Volubile", "Zazou", "Zinzolin"
  ];*/ 
  const noms = [
    "Bidule", "Loulou", "Bibi", "Minou", "Zazou",
    "Tic-tac", "Poule", "Bambou", "Zozo", "Sardou",
    "Chipie", "Gaston", "Pistou", "Zigzag", "Ginette",
    "Louise", "Zébu", "Boubou", "Nin-Nin", "Pirate",
    "Titi", "Minet", "Papaye", "Pop-corn", "Pimousse",
    "Kiki", "Ricrac", "Minnie", "Tourni", "Câlin",
    "Poupi", "Mickey", "Tartif", "Tonton", "Papou",
    "Pépère", "Cocoon", "Gigi", "Trotro", "Vénus",
    "Cassis", "Médor", "Boubou", "Bidibi", "Pupuce",
    "Zazie", "Moumou", "Babou", "Bibine", "Zazou"
  ]
  const adjectifs = [
    "Drôle", "Givré", "Foufou", "Farfel", "Fiesta",
    "Pétant", "Tordu", "Zinzin", "Coquin", "Zinzin",
    "Rigolo", "Frivole", "Dingue", "Fougue", "Dinghy",
    "Badin", "Bavard", "Zinzin", "Givré", "Fiesta",
    "Zazou", "Furtif", "Fouine", "Très", "Précis",
    "Gentil", "Déco", "Glam", "Funky", "Brutal",
    "Disco", "Calin", "Choupi", "Gaieté", "Foufou",
    "Fring", "Groovy", "Foufou", "Limpid", "Zazou",
    "Grin", "Génial", "Zigzag", "Inédit", "Chic",
    "Craquant", "Crazy", "Flash", "Glitch", "Mignon"
  ];

  let username =  noms[Math.floor(Math.random() * noms.length)] + " " + adjectifs[Math.floor(Math.random() * adjectifs.length)];
  return username

}

const faireJouerBot = async (room, finPartie_,wait = true) => {
  try {
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
        if(wait){
        await new Promise((r) => setTimeout(r, 2000));
        }
        const caseArrivee = jeu.getCaseArrivee(
          action[1],
          action[2],
          room.partie.plateau,
        );
        res = jeu.deplacer(action[1], action[2], room.partie); // pion et sens
        finPartie = res[0] != false;
        message = res[1];
        tabPourAnimation = [0, action[1], caseArrivee];
      } else {
        // si le bot veut denoncer
        if(wait){
        await new Promise((r) => setTimeout(r, 2000));
        }
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
      io.in(room.id).emit("FinPartie", res[0]);
      //broadCastBotFinPartie(room);
    }
     if(wait){
    await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  } catch (error) {
    console.error(`${DateLog()} -> Erreur lors de faireJouerBot`);
    console.error('Trace de la pile:', error.stack);;
}
  //return finPartie
};

const joueurNonBot = (listeJoueur) => {
  return listeJoueur.every((j) => j.estUnBot);
};




// TEST SERVEUR LOG
function createFileWithHelloWorld() {
  fs.writeFile("/opt/render/log/HelloWorld.txt", "Hello World", (err) => {
    if (err) throw err;
    console.log("The file has been saved!");
  });
}

function DateLog() {
  const date = new Date();
  const options = { timeZone: "Europe/Paris", hour12: false };
  return date.toLocaleString("fr-FR", options);
}

console.log(DateLog());


const creerRoomBot = (p,nbBotAlea = 2, nbBotAlgo =1) =>{
  const room = createRoom(p);
  const roomId = room.id;
  // init bot host
  
  for(let i = 0; i<nbBotAlea;i++){
    let bot = new botsAlea.BotAlea(`🤖 ${usernameBot()} (Aléa)`, roomId);
    room.players.push(bot);
  }
  for(let i = 0; i<nbBotAlgo;i++){
    let bot = new botsAlgo.BotAlgo(`🤖 ${usernameBot()} (Algo)`, roomId);
    room.players.push(bot);
  }
  room.players.splice(0,1);
  console.debug(room.players);
  room.partie = jeu.initPartie(room.players.length, room.players);
  const partie = room.partie;
  const plateau_secu = partie.plateau.map(securisation_pion);
  broadCastBotInit(room, plateau_secu);
  faireJouerBot(room, false,false);
}
