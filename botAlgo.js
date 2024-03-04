class PionBot extends Pion {
    constructor(pion){
        this.couleur = pion.couleur;
        this.propaDeplacement[0] = 33;
        this.propaDeplacement[1] = 33;
        this.propaDeplacement[2] = 33;
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
        }
    }
    deplacementPionMaj(indexCasePlateau, deplacement){
        let pion = this.cases[indexCasePlateau]
        pion.propaDeplacement[0] = 0;
        pion.propaDeplacement[1] = 0;
        pion.propaDeplacement[2] = 0;
        pion.propaDeplacement[deplacement-1] = 100;
        let couleur = this.cases[indexCasePlateau].couleur;
        this.infoDeplacementPion[couleur].push(deplacement)
        for(i = 0; i < 3; i++){
            //pas de division par 0 par construction
            if(this.equipePion[couleur][i] !== this.cases[indexCasePlateau]){
                let nbConnu = this.infoDeplacementPion[couleur].length;
                if(this.infoDeplacementPion[couleur].include(1)){ //si on connais un pion qui se deplace de 1
                    this.equipePion[couleur][i].propaDeplacement[0] = 0;
                }else{
                    this.equipePion[couleur][i].propaDeplacement[0] = 100/(3-this.infoDeplacementPion[couleur].length);
                }

                if(this.infoDeplacementPion[couleur].include(2)){
                    this.equipePion[couleur][i].propaDeplacement[1] = 0;
                }else{
                    this.equipePion[couleur][i].propaDeplacement[1] = 100/(3-this.infoDeplacementPion[couleur].length);
                }

                if(this.infoDeplacementPion[couleur].include(3)){
                    this.equipePion[couleur][i].propaDeplacement[2] = 0;
                }else{
                    this.equipePion[couleur][i].propaDeplacement[2] = 100/(3-this.infoDeplacementPion[couleur].length);
                }
            }
        }
    }
    nivDangerMaj(){
        
    }
}

