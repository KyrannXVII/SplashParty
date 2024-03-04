// bouge n'importe quel pion au hasard
function jouerBotDif0(){ 
    let pionAleatoire;
    let dirAleatoire;
    let caseArrivee;

    do{
        // choisi un pion aléatoire
        pionAleatoire;
        do{
            pionAleatoire = Math.floor(Math.random()*$taillePlateau);

        }while($plateau[pionAleatoire]==$caseVide)

        // choisi une direction aléatoire
        dirAleatoire = Math.floor(Math.random()*10)%2 == 0;

        // case arrivee
        caseArrivee = getCaseArrivee(pionAleatoire,dirAleatoire);
    } while (estCoupPrecedentInverse(pionAleatoire, caseArrivee))  

    // deplace le pion
    deplacer(pionAleatoire, dirAleatoire);

}



// bouge n'importe quel pion au hasard tant que ça ne jette pas de [couleur] a l'eau
function jouerBotDif1(couleur){ 
    let pionAleatoire;
    let dirAleatoire;

    let caseArrivee;
    let depInterdit = true;
    do{
        do{
            // choisi un pion aléatoire
            do{
                pionAleatoire = Math.floor(Math.random()*$taillePlateau);

            }while($plateau[pionAleatoire]==$caseVide)

            // choisi une direction aléatoire
            dirAleatoire = Math.floor(Math.random()*10)%2 == 0;

            caseArrivee = $plateau[getCaseArrivee(pionAleatoire, dirAleatoire)];

            if (caseArrivee == $caseVide){
                depInterdit = false;
            }
            else {
                if(caseArrivee.couleur != couleur ){
                    depInterdit = false;
                }
            }

        }while(depInterdit);
    } while (estCoupPrecedentInverse(pionAleatoire, caseArrivee))  

    // deplace le pion
    deplacer(pionAleatoire, dirAleatoire);
}