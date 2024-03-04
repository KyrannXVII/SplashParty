const $taillePlateau = 18;
const $couleurs = ["r", "v", "b", "m", "c", "j"];
const $caseVide = "O";
exports.$caseVide = $caseVide;
/**
 * @class
 * @classdesc Représentation d'un pion du jeu, possède une couleur et un déplacement.
 */
class Pion {
    /**
     * Creation d'un pion.
     * @constructor
     * @param {string} couleur
     * @param {unsigned int} deplacement
     */
    constructor(couleur, deplacement){
        this.deplacement = deplacement;
        this.couleur = couleur;
    }
};

/**
 * @class
 * @classdesc Représentation d'une partie.
 */
class Partie {
    /**
     * Creation d'une partie.
     * @constructor
     * @param {unsigned int} nbJoueur Le nombre de joueur dans la partie.
     * @param {*} listeJoueur La liste des joueurs dans la partie.
     * @param {Pion[]} plateau Le plateau de jeu.
     */
    constructor(nbJoueur, listeJoueur, plateau){
        this.nbJoueur = nbJoueur;
        this.listeJoueur = listeJoueur;
        this.plateau = plateau;
        this.coupPrecedent = undefined;
        this.aQuiLeTour = 0;
    }
}

/**
 * Initialisation d'une partie : attribution des couleures et distribution aléatoire des pions sur le plateau.
 * @param {unsigned int} x Le nombre de joueur.
 * @param {*} listeJoueur La liste des joueurs de la partie.
 * @returns La partie initialisée.
 */
exports.initPartie= (x, listeJoueur) => {
    let plateau = [];
    let nbJoueurs = x;
    
    
    let couleursRestantes = $couleurs.slice(0,nbJoueurs);
    // init des joueurs
    for(let i = 0; i<nbJoueurs; i++){
        let couleurChoisie = Math.floor(Math.random()*couleursRestantes.length);
        //console.debug("couleurChoisie");
        //console.debug(couleurChoisie);
        //console.debug(couleursRestantes);
        
        //console.log('joueur :');
        //console.log(listeJoueur[i]);
        listeJoueur[i].color = $couleurs.indexOf(couleursRestantes[couleurChoisie]);
        //console.debug(couleursRestantes);
        //console.debug("couleur du joueur");
        //console.debug(listeJoueur[i].color);
        //console.debug($couleurs);
        
        couleursRestantes.splice(couleurChoisie,1);
        //console.debug(couleursRestantes);

    }

    // init du tableau
    for(let i = 0; i<$taillePlateau; i++){
        plateau.push($caseVide);
    }
    //console.debug($plateau);
    
    // met les pions sur le plateau
    for(let i = 0; i<3; i++){
        for(let y = 0; y<nbJoueurs; y++){
            let x;
            let estVide = true;
            while(estVide){
                x = Math.floor(Math.random()*$taillePlateau);
                if(plateau[x]==$caseVide){
                    plateau[x] = new Pion($couleurs[y], i+1);
                    estVide = false;
                }
            }
        }
    }
    console.debug("init jeu fini");
    
    let partie = new Partie(nbJoueurs, listeJoueur, plateau);
    console.log("nouvelle partie");
    console.log(partie);
    return partie;
}



/**
 * Calcul le déplacement possible d'un pion séléctionné.
 * @param {unsigned int} casePion Pion séléctionné pour être déplacé.
 * @param {*} partie La partie à laquelle appartient le pion.
 * @returns Un tableau de taille deux : [0] = deplacement du pion / [1] = position en avant / [2] = position en arriere, null si pas dispo car coup précédent.
 */
exports.getDepPossible = (casePion,partie) =>{ 
    const plateau = partie.plateau;
    //console.debug(plateau)
    if(casePion >=0 && casePion < $taillePlateau){ // si le case est bien entre 0 et 17
        if(plateau[casePion] != $caseVide){ // si le case n'est pas vide
            const depla = plateau[casePion].deplacement;
            //return [null,(+casePion-(+depla)).mod($taillePlateau)]
            let coupEnAvant = (+casePion+(+depla)).mod($taillePlateau);
            let coupEnArriere = (+casePion-(+depla)).mod($taillePlateau);
            if(estCoupPrecedentInverse(casePion,coupEnAvant,partie)) coupEnAvant = null;
            if(estCoupPrecedentInverse(casePion,coupEnArriere,partie)) coupEnArriere = null;
            return [depla,coupEnAvant,coupEnArriere];
        }
        else{
            console.error("Il n'y a pas de pion sur cette case")
            return 0;
        }
    }
    else{
        console.error("Cette case n'existe pas")
        return 0;
    }    
}


/**
 * Vérifie si le déplacement donné est l'inverse du dernier coup joue.
 * @param {unsigned int} depart Case de départ.
 * @param {unsigned int} arrivee Case d'arrivée.
 * @returns {boolean} True si la case d'arrivée est le coup précédent, False sinon.
 */
const estCoupPrecedentInverse = (depart, arrivee,partie) => {
    const coupPrecedent = partie.coupPrecedent;
    if(coupPrecedent === undefined) return false;
    if(depart==coupPrecedent[1] && arrivee==coupPrecedent[0]){
        // console.log("true");
        return true; }
    else 
        return false;
}


/**
 * Déplace un pion selon les règles du jeu établies.
 * @param {usigned int} caseDepart Case de départ du pion
 * @param {boolean} sens Sens de déplacement (True: horaire | False: anti horaire) 
 */
exports.deplacer = (caseDepart, sens, partie) => {
    let message;
    let $plateau = partie.plateau
    let caseArrivee = getCaseArrivee(caseDepart, sens, $plateau);
    //if (! estCoupPrecedentInverse(caseDepart,caseArrivee)){
    message = `${partie.listeJoueur[partie.aQuiLeTour].username} à déplacé un pion ${motEntierCouleurs(partie.plateau[caseDepart].couleur)}`;
    if ($plateau[caseArrivee] != $caseVide) {
        message += ` en éliminant un pion ${motEntierCouleurs(partie.plateau[caseArrivee].couleur)}`
        eliminerPion(caseArrivee,partie); 
    }

    $plateau[caseArrivee] = $plateau[caseDepart];
    $plateau[caseDepart] = $caseVide;

    // sauvegarde le coup
    partie.coupPrecedent = [caseDepart, caseArrivee];
    //console.debug(coupPrecedent);

    


    // Verifie si la partie est finie
    if(partieFinie(partie.listeJoueur)){
        console.log("Partie terminée");
        console.log(partie);
        return [terminerPartie(partie), message];
    }
    else{
    //    console.log(`Avant changement de joueur : ${partie.aQuiLeTour}`)
        joueurSuivant(partie);
    //    console.log(`Après changement de joueur : ${partie.aQuiLeTour}`)
            
    //    console.log(partie.aQuiLeTour)
    }
    return [false, message];

}



/**
 * Regarde où va arriver un pion qui se déplace selon le sens.
 * @param {unsigned int} casePion Case du pion demandé sur le plateau.
 * @param {boolean} sens Sens de déplacement (true: horaire | false: anti horaire).
 * @param {*} plateau Le plateau de jeu.
 * @returns {unsigned int} Case d'arrivée du pion sur la plateau.
 */
function getCaseArrivee(casePion, sens, $plateau){
    //console.debug(`casePionA = ${casePion}`); 
    if(casePion >=0 && casePion < $taillePlateau){ // si le case est bien entre 0 et 19
        let caseArrivee;
        if(sens){
        //console.debug(`casePionSensTrue = ${casePion}`); 
        
            caseArrivee = +casePion + +$plateau[casePion].deplacement;
            //console.debug(typeof(caseArrivee));
            //console.debug(`CaseArriveeTrue = ${caseArrivee}`); 

            if(caseArrivee > $taillePlateau-1){
                caseArrivee = caseArrivee-$taillePlateau;
            }
        }
        else{
            caseArrivee = casePion - $plateau[casePion].deplacement;
            if(caseArrivee < 0){
                caseArrivee = $taillePlateau + caseArrivee;
            }
        }
        //console.debug(`Prochaine posi = ${caseArrivee}`); 
        return caseArrivee;
    }
    else{
        console.error("Cette case n'existe pas");
        return 0;
    }
}

/**
 * Renvoie le joueur de la couleur donnée.
 * @param {int} couleur La couleur.
 * @param {Partie} partie 
 * @returns {Joueur} Le joueur correspondant à la couleur.
 */
function getJoueurAvecCouleur(couleur,partie){
    //console.debug("getJoueurAvecCouleur");
    //console.debug(couleur);
    //console.debug(partie);
    for(let i=0; i<partie.listeJoueur.length; i++){
        //console.log(partie.listeJoueur[i])
        if(partie.listeJoueur[i].color == couleur) return partie.listeJoueur[i];
    }
    console.debug(`getJoueurAvecCouleur, joueur ${couleur} non trouvé`);
}




/**
 * Élimine le pion sur la case du plateau donnée
 * @param {unsigned int} casePion Case du plateau dont il faut éliminer le pion, si vide, ne fait rien.
 * @param {partie} partie La partie en cour.
 * @todo Si la case est vide il se passe quoi ?????
 */
function eliminerPion(casePion,partie){
    if(casePion >=0 && casePion < $taillePlateau){ // si le case est bien entre 0 et 17
        if(casePion!=$caseVide){
            let couleur = partie.plateau[casePion].couleur;
            couleur = $couleurs.indexOf(couleur);
            let joueur = getJoueurAvecCouleur(couleur,partie);
            joueur.nbPions--;
            console.log(`Un pion ${motEntierCouleurs(couleur)} est tombé a l'eau`);
            partie.plateau[casePion] = $caseVide;
        }
        else{
            console.debug(`'eliminerPion' La case ${casePion} est vide`);
        }
    }
    //afficher();
}

const eliminerJoueur = (joueur, partie) => {
    //console.debug("eliminerJoueur");
    //console.debug(partie);
    //console.debug(joueur);

    joueur.nbPions = 0;


    for(i=0; i<$taillePlateau; i++){
        if(partie.plateau[i] != $caseVide){
            //console.debug("partie.plateau[i]");
            //console.debug(partie.plateau[i]);
            if(partie.plateau[i].couleur == $couleurs[joueur.color]){
                partie.plateau[i] = $caseVide;
            }
        }
    }
    
    console.log(`${joueur.username} est éliminé`);
    //console.debug(partie);
    //console.debug(joueur);
}
exports.eliminerJoueur = eliminerJoueur;

exports.demasquerJoueur = (partie, nomJoueur, couleur)=>{
    //console.debug("demasquerJoueur");
    //console.debug(nomJoueur, couleur);
    //console.debug(partie);

    let message;
    
    let joueur;
    partie.listeJoueur.forEach(element => {
        if(element.username == nomJoueur){
            joueur = element;
            //console.debug("joueur trouvé");
            //console.debug(joueur);
        }
    });

    if(joueur.color == couleur){
        message = `${partie.listeJoueur[partie.aQuiLeTour].username} a voulu démasquer ${nomJoueur} comme étant ${motEntierCouleurs($couleurs[couleur])}, il avait raison !`;
        console.log(message);
        eliminerJoueur(joueur, partie);
    }
    else{
        message = `${partie.listeJoueur[partie.aQuiLeTour].username} a voulu démasquer ${nomJoueur} comme étant ${motEntierCouleurs($couleurs[couleur])}, il avait tort !`;
        console.log(message);
        eliminerJoueur(partie.listeJoueur[partie.aQuiLeTour], partie);
    }
    
    // Verifie si la partie est finie
    if(partieFinie(partie.listeJoueur)){
        console.debug("Partie terminée");
        console.debug(partie);
        return [terminerPartie(partie), message];
    }
    else{
        //console.debug(`Avant changement de joueur : ${partie.aQuiLeTour}`)
        joueurSuivant(partie);
        //console.debug(`Après changement de joueur : ${partie.aQuiLeTour}`)
            
        //console.debug(partie.aQuiLeTour)
    }

    return [false, message];
};

/**
 * Renvoie le mot entier de la couleur donnée.
 * @param {string} couleur L'intiale de la couleur.
 * @returns {string} Le nom de la couleur en entier ("r" deviens "rouge").
 */
function motEntierCouleurs(couleur){
    switch(couleur){
        case "r" : return "rouge"; break;
        case "v" : return "vert"; break;
        case "b" : return "bleu"; break;
        case "m" : return "magenta"; break;
        case "c" : return "cyan"; break;
        case "j" : return "jaune"; break;
        default : console.debug(`motEntierCouleurs, ${couleur} pas une couleur`); break;
    }
}

/**
 * Change le joueur à qui c'est le tour de jouer.
 * @param {*} partie La partie en cours.
 */
const joueurSuivant = (partie)=>{
    partie.aQuiLeTour = (partie.aQuiLeTour+1).mod(partie.nbJoueur)
    if(partie.listeJoueur[partie.aQuiLeTour].nbPions == 0)
        joueurSuivant(partie);
}

/**
 * Verifie c'est le tour d'un joueur sélectionné.
 * @param {*} joueurATester Joueur à vérifié si c'est le tour
 * @param {*} partie La partie en cours.
 * @returns {boolean} True si c'est au joueur sélectionné de jouer, False sinon.
 */
exports.aSonTour = (joueurATester,partie) => {
    //partie.listeJoueur.findIndex((joueur) => joueur.socketId ===joueurATester.socketId)
    const indexJoueur = partie.listeJoueur.findIndex((joueur) => joueur.socketId ===joueurATester.socketId)
    return indexJoueur === partie.aQuiLeTour
}

/**
 * Calcule quand la partie est finie
 * @param {Joueur[]} listeJoueur liste des joueurs de la partie
 * @returns {boolean} true si elle est finie, false sinon
 */
function partieFinie(listeJoueur){
    let nbJoueursEnJeu = 0;
    for(let i=0; i<listeJoueur.length; i++){
        if(listeJoueur[i].nbPions > 0) nbJoueursEnJeu++;
    }

    return nbJoueursEnJeu <= 2;
}

/**
 * Calcule le joueur gagnant
 * @param {Partie} partie 
 * @returns {Joueur} Le joueur gagnant OU FALSE si égalité
 */
function calculerGagnant(partie){
    let joueur1;
    for(let i=0; i<partie.listeJoueur.length; i++){
        if(partie.listeJoueur[i].nbPions > 0){
            if(joueur1 == null){ // on garde de coté le joueur1 pour comparer plus tard
                joueur1 = partie.listeJoueur[i];
            }
            else{
                let joueur2 = partie.listeJoueur[i];
                //console.log(`poins ${joueur1.couleur} : ${joueur1.nbPions}, pions ${joueur2.couleur} : ${joueur2.nbPions} `);
                if(joueur1.nbPions < joueur2.nbPions){
                    console.log(`Le joueur ${$couleurs[joueur2.color]} gagne en ayant le plus de pions restants`);
                    return [joueur2,0]; // le joueur2 a gagné
                } 
                else if(joueur1.nbPions > joueur2.nbPions){
                    console.log(`Le joueur ${$couleurs[joueur1.color]} gagne en ayant le plus de pions restants`);
                    return [joueur1,0]; // le joueur1 a gagné
                }
                else{ // si le joueur1 a autant de pions que le joueur2, on regarde le plus proche du plongeoir
                    if(partie.plateau[0]!=$caseVide){ // si il y a un pion sur le plongeoir, il gagne
                        console.log(`Le joueur ${partie.plateau[0].couleur} gagne en étant le plus proche du plongeoir`);
                        return [getJoueurAvecCouleur($couleurs.indexOf(partie.plateau[0].couleur), partie),1];
                    }
                    else{ // sinon on parcourt le plateau depuis le debut et la fin, le premier pion trouvé sera gagnant
                        let pion1; let pion2;
                        for(let y=1; y<($taillePlateau/2)-1; y++){
                            pion1 = partie.plateau[y];
                            pion2 = partie.plateau[$taillePlateau-y]
                            if(pion1!=$caseVide && pion2==$caseVide){
                                console.log(`Le joueur ${pion1.couleur} gagne en étant le plus proche du plongeoir`);
                                return [getJoueurAvecCouleur($couleurs.indexOf(pion1.couleur), partie),1];
                            }
                            if(pion1==$caseVide && pion2!=$caseVide){
                                console.log(`Le joueur ${pion2.couleur} gagne en étant le plus proche du plongeoir`);
                                return [getJoueurAvecCouleur($couleurs.indexOf(pion2.couleur), partie),1];
                            }
                            if(pion1!=$caseVide && pion2!=$caseVide){ // si deux pions sont trouvés
                                if(pion1.couleur == pion2.couleur){ // s'ils sont de la même couleur, celle ci est gagnante
                                    console.log(`Le joueur ${pion1.couleur} gagne en étant le plus proche du plongeoir`);
                                    return [getJoueurAvecCouleur($couleurs.indexOf(pion1.couleur), partie),1];
                                }
                                else{ // sinon on compare leurs deplacements
                                    if(pion1.deplacement > pion2.deplacement){
                                        console.log(`Le joueur ${pion1.couleur} gagne en ayant le meilleur pion le plus proche du plongeoir`);
                                        return [getJoueurAvecCouleur($couleurs.indexOf(pion1.couleur), partie),2];
                                    }
                                    else if(pion1.deplacement < pion2.deplacement){
                                        console.log(`Le joueur ${pion2.couleur} gagne en ayant le meilleur pion le plus proche du plongeoir`);
                                        return [getJoueurAvecCouleur($couleurs.indexOf(pion2.couleur), partie),2];
                                    }
                                    else return [[getJoueurAvecCouleur($couleurs.indexOf(pion1.couleur), partie),getJoueurAvecCouleur($couleurs.indexOf(pion2.couleur), partie)],3]; // les deplacements sont les mêmes donc EGALITE
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
/*
*   retourne les deux joueur pour egalité et sinon le pseudo du joueur
*
*/
function terminerPartie(partie){
    // changer l'affichage de tout le monde

    let gagnant = calculerGagnant(partie);
   
    console.log("La partie est finie, le gagnant est :");
    console.log(gagnant[0].username);

     return gagnant
}




/**
 * Modulo non buggé.
 * @param {int} n Le modulo
 * @returns Le résultat d'un modulo avec les négatifs qui fonctionnent.
 */
Number.prototype.mod = function(n) {
    return ((this%n)+n)%n;
}
