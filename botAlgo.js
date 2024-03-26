const $taillePlateau = 18;
const $couleurs = ["r", "v", "b", "m", "c", "j"];
const $caseVide = "O";

class BotAlgo {
    constructor(name, roomId){
        this.username = name;
        this.roomId = roomId;
        this.nbPions = 3;
        this.estUnBot = true;
        this.ready = true;
        this.color = undefined;
    }
    
    init(plateau){
        this.plateauLocal = new PlateauBot(plateau, this.color);
    }
    /**
     * 
     * @param {Plateau} plt Le plateau de jeu.
     * @param {*} coupPrecedant Le dernier coup ayant été joué. (déplacement : [0, départ, arrivée], dénonciation : [1, [pions éliminés]])
     * @param {Boolean} denonciation True si denonciation au dernier tour.
     */
    maj(plt, coupPrecedant){
        if(coupPrecedant[0] === 0){ //pas une dénonciation au coup d'avant
            this.plateauLocal.deplacementPionMaj(coupPrecedant[1], (+coupPrecedant[1] + +coupPrecedant[2]).mod(4));
        } 
        this.plateauLocal = new PlateauBot(plt);
    }
    /**
     * @return Un array de : [bool : vrai si dénonciation, unsigned int : index du tableau du pion à déplacer, bool : sens]
     */
    jouer(){
        this.plateauLocal.nivDangerMajAll();
        let indexPionLePlusDangereux = 0;
        //trouver le pion le plus dangereux
        for(let i = 1; i < $taillePlateau; i++){
            if(this.plateauLocal.pions[i].nivDanger > this.plateauLocal.pions[indexPionLePlusDangereux].nivDanger){
                indexPionLePlusDangereux = i;
            }
        }
        let mouvementPossible = [];
        //parcous à +-3 du pion
        let probaMax = 0;
        for(let i = 1; i < 3; i++){
            let probaPionPlus = 0
            if(this.plateauLocal.pions[(indexPionLePlusDangereux + i).mod($taillePlateau)] !== $caseVide){
                probaPionPlus = this.plateauLocal.pions[(indexPionLePlusDangereux + i).mod($taillePlateau)].probaDeplacement[i-1];
            }
            let probaPionMoins = 0
            if(this.plateauLocal.pions[(indexPionLePlusDangereux - i).mod($taillePlateau)] !== $caseVide){
                probaPionMoins = this.plateauLocal.pions[(indexPionLePlusDangereux - i).mod($taillePlateau)].probaDeplacement[i-1];
            }
            probaMax = Math.max(probaMax, probaPionPlus, probaPionMoins);
            if(probaPionPlus != 0)
            {
                mouvementPossible.push({proba: probaPionPlus , coup: [0, i, false]});
            }
            if(probaPionMoins != 0)
            {
                mouvementPossible.push({proba: probaPionPlus , coup: [0, i, true]});
            }
        }
        //TODO test coup precedant
        for(let i = 0; i < mouvementPossible.length; i++){
            if(mouvementPossible[i].proba < probaMax){
                mouvementPossible.splice(i, 1);
            }
        }
        if(mouvementPossible.length > 0){
            const alea = Math.round((Math.random() * mouvementPossible.length));
            return mouvementPossible[alea].coup;
        }
        else{
            const alea = (Math.random() < 0.5);
            return [0, indexPionLePlusDangereux, alea];
        }
    }
    
}

class PionBot {
    constructor(pion){
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
    constructor(plateau, color){
        this.nivDanger = new Array($taillePlateau);
        this.colorBot = color;
        this.equipePion = new Array($couleurs.length);
        for(let i = 0; i < $couleurs.length; i++){
            this.equipePion[i] = new Array();
        }
        this.infoDeplacementPion = new Array($couleurs.length);
        for(let i = 0; i < $couleurs.length; i++){
            this.infoDeplacementPion[i] = new Array();
        }
        this.pions = new Array($taillePlateau);
        for(let i = 0; i < $taillePlateau; i++){
            this.pions[i] = $caseVide;
        }
        for(let i = 0; i < $taillePlateau; i++){
            this.nivDanger[i] = 0;
            if(plateau[i] !== $caseVide){
                let pion = new PionBot(plateau[i]);
                this.pions[i] = pion;
                const colorIndex = $couleurs.indexOf(pion.couleur);
                this.equipePion[colorIndex].push(pion);
            }
        }
    }

    /**
     * Met à jour les probabilité de déplacement d'un pion.
     * @param {unsigned int} indexCasePlateau La case sur laquelle se trouve le pion à déplacer.
     * @param {unsigned int} deplacement Le nombre de case de déplacement.
     */
    deplacementPionMaj(indexCasePlateau, deplacement){
        let pion = this.pions[indexCasePlateau]
        pion.probaDeplacement[0] = 0;
        pion.probaDeplacement[1] = 0;
        pion.probaDeplacement[2] = 0;
        let couleur = this.pions[indexCasePlateau].couleur;
        this.infoDeplacementPion[$couleurs.indexOf(couleur)].push(deplacement)
        for(let i = 0; i < 3; i++){
            //pas de division par 0 par construction
            if(this.equipePion[$couleurs.indexOf(couleur)][i] !== this.pions[indexCasePlateau]){
                let nbConnu = this.infoDeplacementPion[$couleurs.indexOf(couleur)].length;
                if(this.infoDeplacementPion[$couleurs.indexOf(couleur)].includes(i+1)){ //si on connais un pion qui se deplace de i+1
                    this.equipePion[$couleurs.indexOf(couleur)][i].probaDeplacement[i] = 0;
                }
                else{
                    this.equipePion[$couleurs.indexOf(couleur)][i].probaDeplacement[i] = 100/(3-this.infoDeplacementPion[$couleurs.indexOf(couleur)].length);
                }
            }
        }
        pion.probaDeplacement[deplacement-1] = 100;
    }
    /**
     * Met à jour le niveau de danger d'une case du plateau local du bot.
     * Met à jour le niveau de danger d'un pion pour ceux du bot.
     * @param {unsigned int} indexCasePlateau L'index de la case à mettre à jour
     */
    nivDangerMaj(indexCasePlateau){
        for(let i = 1; i <= 3; i++){
            //danger sur la case
            if(this.pions[(indexCasePlateau - i).mod($taillePlateau)] !== $caseVide){
                this.nivDanger[indexCasePlateau] += this.pions[(indexCasePlateau - i).mod($taillePlateau)].probaDeplacement[i];
            }
            if(this.pions[(indexCasePlateau + i).mod($taillePlateau)] !== $caseVide){
                this.nivDanger[indexCasePlateau] += this.pions[(indexCasePlateau + i).mod($taillePlateau)].probaDeplacement[i];
            }
            //danger d'un pion pour les pions du bot
            if(this.pions[indexCasePlateau] !== $caseVide){
                if((this.pions[(indexCasePlateau + i).mod($taillePlateau)].couleur === this.colorBot) 
                || (this.pions[(indexCasePlateau - i).mod($taillePlateau)].couleur === this.colorBot)){
                    this.pions[indexCasePlateau].nivDanger += this.pions[indexCasePlateau].probaDeplacement[i];
                }
            }
        }
    }
    /**
     * Met à jour le niveau de danger sur toutes les cases du plateau local du bot.
     * Met à jour le niveau de danger des pion pour ceux du bot.
     */
    nivDangerMajAll(){
        for(let i = 0; i < $taillePlateau; i++){
            this.nivDangerMaj(i);
        }
    }
}

/**
 * Modulo non buggé.
 * @param {int} n Le modulo
 * @returns Le résultat d'un modulo avec les négatifs qui fonctionnent.
 */
Number.prototype.mod = function(n) {
    return ((this%n)+n)%n;
}

exports.BotAlgo = BotAlgo;