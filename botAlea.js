const { $caseVide } = require("./jeu_server");
const { $taillePlateau } = require("./jeu_server");
const $couleurs = ["r", "v", "b", "m", "c", "j"];
class BotAlea {
  constructor(name, roomId) {
    this.username = name;
    this.roomId = roomId;
    this.nbPions = 3;
    this.estUnBot = true;
    this.ready = true;
    this.color = undefined;
  }

  init(plateau, listeJoueurs) {
    this.plateauLocal = plateau;
    this.listeJoueurs = listeJoueurs;
    this.listeJoueurs = this.listeJoueurs.filter((e) => e !== this.username);
  }

  /**
   *
   * @param {Plateau} plt Le plateau de jeu.
   * @param {Boolean} denonciation True si denonciation au dernier tour.
   */
  maj(plt, coupPrecedant) {
    this.plateauLocal = plt;
  }

  /**
   * @return Un array de : [bool : vrai si dénonciation, unsigned int : index du tableau, bool : sens]
   */
  jouer() {
    let index;
    const alea = Math.random() < 0.95;
    if (alea) {
      do {
        index = Math.floor(Math.random() * 18);
      } while (this.plateauLocal[index] === $caseVide);
      let sens = Math.floor(Math.random() * 2);
      return [false, index, sens];
    }
    else{
        const aleaJoueur = this.listeJoueurs[Math.floor(Math.random() * (this.listeJoueurs.length-1))]
        const aleaCouleur = $couleurs.filter(e => e !== this.color)[Math.floor(Math.random() * (this.listeJoueurs.length-1))];
        return [true, aleaJoueur, $couleurs.indexOf(aleaCouleur)];
    }
  }
}
exports.BotAlea = BotAlea;
