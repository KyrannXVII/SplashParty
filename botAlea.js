const { $caseVide } = require("./jeu_server");
const { $taillePlateau } = require("./jeu_server");
class BotAlea {
    constructor(name, roomId){
        this.username = name;
        this.roomId = roomId;
        this.nbPions = 3;
        this.estUnBot = true;
        this.ready = true;
        this.color = undefined;
    }
    
    init(plateau){
        this.plateauLocal = plateau;
    }

    /**
     * 
     * @param {Plateau} plt Le plateau de jeu.
     * @param {Boolean} denonciation True si denonciation au dernier tour.
     */
    maj(plt, denonciation){
        if(!denonciation){
            this.plateauLocal = plt;
        }
        //BYPASS POUR BOT ALEA POUR TEST SINON IL JOUE DES PIONS QUI N'EXISTES PLUS
        this.plateauLocal = plt;
    }

    /**
     * @return Un array de : [bool : vrai si dénonciation, unsigned int : index du tableau, bool : sens]
     */
    jouer(){
        let index;
        do{
            index = Math.floor(Math.random() * 18);
            console.debug(`TU MARCHE CONNARD : ${index}`);
        }
        while(this.plateauLocal[index] === $caseVide)
        let sens = Math.floor(Math.random() * 2);
    console.debug(`BOT ALEA : ${index} ${sens}`)
    return [false, index, sens];
    }
    
}
exports.BotAlea = BotAlea;