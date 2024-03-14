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
        this.plateauLocal = new PlateauBot(plateau);
    }
    /**
     * 
     * @param {Plateau} plt Le plateau de jeu.
     * @param {Boolean} denonciation True si denonciation au dernier tour.
     */
    maj(plt, denonciation){
        if(!denonciation){
            //resDiff = plateauDiff(plt);
            //deplacementPionMaj(resDiff[0], resDiff[1]);
            this.plateauLocal = new PlateauBot(plt);
            this.plateauLocal.nivDangerMaj();
        }
    }
    /**
     * @return Un array de : [bool : vrai si dénonciation, unsigned int : index du tableau, bool : sens]
     */
    jouer(){
        
    }
    
}

class PionBot extends Pion {
    constructor(pion){
        this.couleur = pion.couleur;
        this.id = pion.id;
        this.probaDeplacement[0] = 33;
        this.probaDeplacement[1] = 33;
        this.probaDeplacement[2] = 33;
        this.nivDanger = 0;
    }

}

class PlateauBot extends Plateau {
    constructor(plateau){
        for(i = 0; i < $taillePlateau; i++){
            this.nivDanger[i] = 0;
            let pion = new PionBot(plateau[i]);
            this.cases[i] = pion;
            this.equipePion[pion.couleur].push(pion);
            this.nivDangerMaj();
        }
    }

    /**
     * Met à jour les probabilité de déplacement d'un pion.
     * @param {unsigned int} indexCasePlateau La case sur laquelle se trouve le pion à déplacer.
     * @param {unsigned int} deplacement Le nombre de case de déplacement.
     */
    deplacementPionMaj(indexCasePlateau, deplacement){
        let pion = this.cases[indexCasePlateau]
        pion.probaDeplacement[0] = 0;
        pion.probaDeplacement[1] = 0;
        pion.probaDeplacement[2] = 0;
        pion.probaDeplacement[deplacement-1] = 100;
        let couleur = this.cases[indexCasePlateau].couleur;
        this.infoDeplacementPion[couleur].push(deplacement)
        for(i = 0; i < 3; i++){
            //pas de division par 0 par construction
            if(this.equipePion[couleur][i] !== this.cases[indexCasePlateau]){
                let nbConnu = this.infoDeplacementPion[couleur].length;
                if(this.infoDeplacementPion[couleur].include(i+1)){ //si on connais un pion qui se deplace de 1
                    this.equipePion[couleur][i].probaDeplacement[i] = 0;
                }else{
                    this.equipePion[couleur][i].probaDeplacement[i] = 100/(3-this.infoDeplacementPion[couleur].length);
                }
            }
        }
    }
    /**
     * Met à jour le niveau de danger sur une case du plateau d'analyse du bot.
     * @param {unsigned int} indexCasePlateau L'index de la case à mettre à jour
     */
    nivDangerMaj(indexCasePlateau){
        for(i = 1; i <= 3; i++){
            this.cases[indexCasePlateau].nivDanger += this.cases[(indexCasePlateau-i).mod($taillePlateau)].probaDeplacement[i];
            this.cases[indexCasePlateau].nivDanger += this.cases[(indexCasePlateau+i).mod($taillePlateau)].probaDeplacement[i];
        }
    }
    /**
     * Met à jour le niveau de danger sur toutes les cases du plateau d'analyse du bot.
     */
    nivDangerMaj(){
        for(i = 0; i < $taillePlateau; i++){
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