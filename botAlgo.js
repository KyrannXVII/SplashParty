const $taillePlateau = 18;
const $couleurs = ["r", "v", "b", "m", "c", "j"];
const $caseVide = "O";

class BotAlgo {
  constructor(name, roomId) {
    this.username = name;
    this.roomId = roomId;
    this.nbPions = 3;
    this.estUnBot = true;
    this.ready = true;
    this.color = undefined;
    this.plateauLocal = undefined;
    this.coupPrecedant= undefined;
  }

  /**
   * Initialise les structures de données utilisées par le bot.
   * @param {Plateau} plateau
   */
  init(plateau, listeJoueurs) {
    this.plateauLocal = new PlateauBot(plateau, this.color);
    this.plateauLocal.majPlt(plateau);
    this.listeJoueurs = listeJoueurs;
    this.listeJoueurs.filter((e) => e != this.username);
  }
  /**
   * Met à jour les informations de déplacement d'un pion.
   * @param {Plateau} plt Le plateau de jeu.
   * @param {*} coupPrecedant Le dernier coup ayant été joué. (déplacement : [0, départ, arrivée], dénonciation : [1, [pions éliminés]])
   * @param {Boolean} denonciation True si denonciation au dernier tour.
   */
  maj(plt, coupPrecedant) {
    this.coupPrecedant = coupPrecedant;
    if (coupPrecedant !== undefined) {
      if (coupPrecedant[0] === 0) {
        //pas une dénonciation au coup d'avant
        this.plateauLocal.deplacementPionMaj(
          coupPrecedant[1],
          (+coupPrecedant[1] + +coupPrecedant[2]).mod(4)
        );
      }
    }

    this.plateauLocal.majPlt(plt);
  }
  /**
   * Le bot joue son coup.
   * @return Un array de : [bool : vrai si dénonciation, unsigned int : index du tableau du pion à déplacer, bool : sens]
   */
  jouer() {
    const aleaDenoncer = Math.random() > 0;
    if (aleaDenoncer) {
      const aleaJoueur =
        this.listeJoueurs[
          Math.floor(Math.random() * (this.listeJoueurs.length - 1))
        ];
      const aleaCouleur = $couleurs.filter((e) => e !== this.color)[
        Math.floor(Math.random() * (this.listeJoueurs.length - 1))
      ];
      return [true, aleaJoueur, $couleurs.indexOf(aleaCouleur)];
    }
    this.plateauLocal.nivDangerMajAll();
    let pionLePlusDangereux = this.plateauLocal.pions;
    let indexPionLePlusDangereux;
    //init non vide du pion le plus dangereux
    for (let i = 0; i < $taillePlateau; i++) {
      if (this.plateauLocal.idPions[i] !== $caseVide) {
        indexPionLePlusDangereux = i;
        pionLePlusDangereux =
          this.plateauLocal.pions[this.plateauLocal.idPions[i]];
        break;
      }
    }

    //trouver le pion le plus dangereux
    for (let i = 0; i < $taillePlateau; i++) {
      if (this.plateauLocal.pions[i] !== $caseVide) {
        if (
          this.plateauLocal.pions[i].nivDanger > pionLePlusDangereux.nivDanger
        ) {
          pionLePlusDangereux = this.plateauLocal.pions[i];
        }
      }
    }

    //trouver sa position sur le plateau
    for (let i = 1; i < $taillePlateau; i++) {
      if (this.plateauLocal.idPions[i] === pionLePlusDangereux.id) {
        indexPionLePlusDangereux = i;
      }
    }

    let mouvementPossible = [];
    let probaMax = 0;
    //parcous à +-3 du pion
    for (let i = 1; i < 3; i++) {
      let probaPionPlus = 0;
      let indexPionPlus = (indexPionLePlusDangereux + i).mod($taillePlateau);
      let idPionPlus = this.plateauLocal.idPions[indexPionPlus];
      if (idPionPlus !== $caseVide) {
        if (this.plateauLocal.pions[indexPionPlus] !== $caseVide) {
          probaPionPlus =
            this.plateauLocal.pions[idPionPlus].probaDeplacement[i - 1];
        }
      }

      let probaPionMoins = 0;
      let indexPionMoins = (indexPionLePlusDangereux - i).mod($taillePlateau);
      let idPionMoins = this.plateauLocal.idPions[indexPionMoins];
      if (idPionMoins !== $caseVide) {
        if (this.plateauLocal.pions[idPionMoins] !== $caseVide) {
          probaPionMoins =
            this.plateauLocal.pions[idPionMoins].probaDeplacement[i - 1];
        }
      }

      probaMax = Math.max(probaMax, probaPionPlus, probaPionMoins);
      if (probaPionPlus !== 0) {
        mouvementPossible.push({
          proba: probaPionPlus,
          coup: [0, (indexPionLePlusDangereux + i).mod($taillePlateau), false],
        });
      }
      if (probaPionMoins !== 0) {
        mouvementPossible.push({
          proba: probaPionMoins,
          coup: [0, (indexPionLePlusDangereux - i).mod($taillePlateau), true],
        });
      }
    }
    for(let i = 0; i < mouvementPossible.length; i++){
      if(mouvementPossible[i].coup === this.coupPrecedant){
        mouvementPossible.splice(i, 1);
      }
    }
    for (let i = 0; i < mouvementPossible.length; i++) {
      if (mouvementPossible[i].proba < probaMax) {
        mouvementPossible.splice(i, 1);
      }
    }
    if (mouvementPossible.length > 0) {
      const alea = Math.round(Math.random() * (mouvementPossible.length - 1));
      return mouvementPossible[alea].coup;
    } else {
      const alea = Math.random() < 0.5;
      return [0, indexPionLePlusDangereux, alea];
    }
  }
}

class PionBot {
  constructor(pion) {
    this.couleur = pion.couleur;
    this.id = pion.id;
    this.probaDeplacement = new Array(3);
    this.probaDeplacement[0] = 33;
    this.probaDeplacement[1] = 33;
    this.probaDeplacement[2] = 33;
    this.nivDanger = 0;
  }
}

class PlateauBot {
  constructor(plateau, color) {
    this.nivDanger = new Array($taillePlateau);
    this.colorBot = color;
    this.equipePion = new Array($couleurs.length);
    this.idPions = new Array($taillePlateau);

    this.infoDeplacementPion = new Array($couleurs.length);
    for (let i = 0; i < $couleurs.length; i++) {
      this.equipePion[i] = new Array();
      this.infoDeplacementPion[i] = new Array();
    }

    this.pions = new Array($taillePlateau);
    //init sinon problèmes.
    for (let i = 0; i < $taillePlateau; i++) {
      this.pions[i] = $caseVide;
    }
    for (let i = 0; i < $taillePlateau; i++) {
      this.nivDanger[i] = 0;
      if (plateau[i] !== $caseVide) {
        let idPion = plateau[i].id;
        this.pions[idPion] = new PionBot(plateau[i]);
        let colorIndex = $couleurs.indexOf(this.pions[idPion].couleur);
        this.equipePion[colorIndex].push(this.pions[idPion]);
      }
    }
  }
  /**
   * Initialise le plateau local
   * @param {Plateau} plateau Le plateau du jeu.
   */
  majPlt(plateau) {
    for (let i = 0; i < $taillePlateau; i++) {
      this.idPions[i] = $caseVide;
    }
    for (let i = 0; i < $taillePlateau; i++) {
      if (plateau[i] !== $caseVide) {
        this.idPions[i] = plateau[i].id;
      }
    }
  }
  /**
   * Met à jour les probabilité de déplacement d'un pion.
   * @param {unsigned int} indexCasePlateau La case sur laquelle se trouve le pion à déplacer.
   * @param {unsigned int} deplacement Le nombre de case de déplacement.
   */
  deplacementPionMaj(indexCasePlateau, deplacement) {
    let pion = this.pions[this.idPions[indexCasePlateau]];
    let couleur = $couleurs.indexOf(
      this.pions[this.idPions[indexCasePlateau]].couleur
    );
    this.infoDeplacementPion[couleur].push(deplacement);
    for (let i = 0; i < 3; i++) {
      let nbConnu = this.infoDeplacementPion[couleur].length;
      for (let j = 0; j < 3; j++) {
        if (
          this.equipePion[couleur][i].probaDeplacement[j] !== 100 ||
          this.equipePion[couleur][i].probaDeplacement[j] !== 0
        ) {
          if (this.infoDeplacementPion[couleur].includes(j + 1)) {
            //si on connais un pion qui se deplace de i+1
            this.equipePion[couleur][i].probaDeplacement[j] = 0;
          } else {
            //pas de division par 0 par construction
            this.equipePion[couleur][i].probaDeplacement[j] =
              100 / (3 - nbConnu);
          }
        }
      }
    }
    pion.probaDeplacement[0] = 0;
    pion.probaDeplacement[1] = 0;
    pion.probaDeplacement[2] = 0;
    pion.probaDeplacement[deplacement - 1] = 100;
  }

  /**
   * Met à jour le niveau de danger d'une case du plateau local du bot.
   * Met à jour le niveau de danger d'un pion pour ceux du bot.
   * @param {unsigned int} indexCasePlateau L'index de la case à mettre à jour
   */
  nivDangerMaj(indexCasePlateau) {
    //danger sur la case
    this.nivDanger[indexCasePlateau] = 0;
    for (let i = 1; i <= 3; i++) {
      let idPionPlus = this.idPions[(indexCasePlateau + i).mod($taillePlateau)];
      let idPionMoins =
        this.idPions[(indexCasePlateau - i).mod($taillePlateau)];
      if (idPionPlus != $caseVide) {
        this.nivDanger[indexCasePlateau] +=
          this.pions[idPionPlus].probaDeplacement[i - 1];
      }
      if (idPionMoins !== $caseVide) {
        this.nivDanger[indexCasePlateau] +=
          this.pions[idPionMoins].probaDeplacement[i - 1];
      }

      //danger d'un pion pour les pions du bot
      if (this.idPions[indexCasePlateau] !== $caseVide) {
        if (
          idPionPlus !== $caseVide &&
          this.pions[idPionPlus].couleur === $couleurs[this.colorBot]
        ) {
          this.pions[this.idPions[indexCasePlateau]].nivDanger +=
            this.pions[this.idPions[indexCasePlateau]].probaDeplacement[i - 1];
        }
        if (
          idPionMoins !== $caseVide &&
          this.pions[idPionMoins].couleur === $couleurs[this.colorBot]
        ) {
          this.pions[this.idPions[indexCasePlateau]].nivDanger +=
            this.pions[this.idPions[indexCasePlateau]].probaDeplacement[i - 1];
        }
      }
    }
  }
  /**
   * Met à jour le niveau de danger sur toutes les cases du plateau local du bot.
   * Met à jour le niveau de danger des pion pour ceux du bot.
   */
  nivDangerMajAll() {
    for (let i = 0; i < $taillePlateau; i++) {
      this.nivDangerMaj(i);
    }
  }
}

/**
 * Modulo non buggé.
 * @param {int} n Le modulo
 * @returns Le résultat d'un modulo avec les négatifs qui fonctionnent.
 */
Number.prototype.mod = function (n) {
  return ((this % n) + n) % n;
};

exports.BotAlgo = BotAlgo;
