const $taillePlateau = 18;
const $plateau = [];
const $couleurs = ["r", "v", "b", "m", "c", "j"];
let nbJoueurs = 0;
const $joueurs = []
const $caseVide = "O";
let coupEnAttente;

let joueurActu = 0;
let coupPrecedent = null;

    ///////////////////////////////////////
    /////////////// CLASSES ///////////////
class Partie {
    constuctor(nbJoueur, listeJoueur, plateau){
        this.nbJoueur = nbJoueur;
        this.listeJoueur = listeJoueur;
        this.plateau = plateau;
    }
}

class Pion {
    constructor(couleur, deplacement){
        this.deplacement = deplacement;
        this.couleur = couleur;
    }
};

class Joueur {
    constructor(nom = "nomDefaut",couleur){
        this.nom = nom;
        this.couleur = couleur;
        this.nbPions = 3;
    }
}
class Player {
    constructor(username,socketId){
        this.nbPions = 3;
        this.username = username,
        this.socketId = socketId,
        this.host = false,
        this.roomId = undefined,
        this.color = undefined,
        this.ready = false
    }
}

    //////////////////////////////////////////////////
    /////////////// DEROULEMENT DU JEU ///////////////

/*
Permettra de distribué la meme partie a toute la room 
on l'init une fois puis on la file a tous
Interessant pour l'ia + socket("XYZ",partie) pour distribué

class Partie{
    nbJoueurs
    listeJoueurs
    plateau
}
*/

/**
 * Initialise une partie
 * @param {int} x nombre de joueurs dans la partie
 */
function initPartie(x, listeJoueur){
    let plateau = [];
    let nbJoueurs = x;
    
    
    let couleursRestantes = $couleurs.slice(0,nbJoueurs);
    // init des joueurs
    for(let i = 0; i<nbJoueurs; i++){
        let couleurChoisie = Math.floor(Math.random()*couleursRestantes.length);
        //console.debug(couleurChoisie);
        
        listeJoueur[i].color = couleurChoisie;
        //console.debug(couleursRestantes);
        
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
    
    let partie = new Partie(nbJoueur, listeJoueur, plateau);

}

/**
 * Boucle du jeu
 */
async function boucle(){
    
    // boucle de jeu pour que chacun joue
    let partieEnCours = true;
    while(partieEnCours){
        
        // si le joueur a toujours des pions
        if($joueurs[joueurActu].nbPions > 0){
            coupEnAttente = true;

                ///// diffuser sur les sockets des clients le nom du joueur qui peut jouer /////

            // attenque que le joueur joue
            console.debug($joueurs[joueurActu]);
            while (coupEnAttente) {
                

                // Attendre un certain temps avant de vérifier à nouveau
                await new Promise(resolve => setTimeout(resolve, 200));
            }

        }

        
        // passe au joueur suivant
        joueurActu++;
        if(joueurActu==nbJoueurs) joueurActu=0;

        // verifie si la partie est finie
        if(partieFinie()) partieEnCours = false;
    }

    // calcule le gagnant
    let gagnant = calculerGagnant();
    console.debug("La partie est finie, le gagnant est :");
    if(gagnant == false)
        console.debug("égalité");
    else
        console.debug(gagnant.nom);

}

/**
 * Calcule le joueur gagnant
 * @returns {Joueur} Le joueur gagnant OU FALSE si égalité
 */
function calculerGagnant(){
    let joueur1;
    for(let i=0; i<nbJoueurs; i++){
        if($joueurs[i].nbPions > 0){
            if(joueur1 == null){ // on garde de coté le joueur1 pour comparer plus tard
                joueur1 = $joueurs[i];
            }
            else{
                let joueur2 = $joueurs[i];
                //console.log(`poins ${joueur1.couleur} : ${joueur1.nbPions}, pions ${joueur2.couleur} : ${joueur2.nbPions} `);
                if(joueur1.nbPions < joueur2.nbPions){
                    console.debug(`Le joueur ${joueur2.couleur} gagne en ayant le plus de pions restants`);
                    return joueur2; // le joueur2 a gagné
                } 
                else if(joueur1.nbPions > joueur2.nbPions){
                    console.debug(`Le joueur ${joueur1.couleur} gagne en ayant le plus de pions restants`);
                    return joueur1; // le joueur1 a gagén
                }
                else{ // si le joueur1 a autant de pions que le joueur2, on regarde le plus proche du plongeoir
                    if($plateau[0]!=$caseVide){ // si il y a un pion sur le plongeoir, il gagne
                        console.debug(`Le joueur ${$plateau[0].couleur} gagne en étant le plus proche du plongeoir`);
                        return getJoueurAvecCouleur($plateau[0].couleur);
                    }
                    else{ // sinon on parcourt le plateau depuis le debut et la fin, le premier pion trouvé sera gagnant
                        let pion1; let pion2;
                        for(let y=1; y<($taillePlateau/2)-1; y++){
                            pion1 = $plateau[y];
                            pion2 = $plateau[$taillePlateau-y]
                            if(pion1!=$caseVide && pion2==$caseVide){
                                console.debug(`Le joueur ${pion1.couleur} gagne en étant le plus proche du plongeoir`);
                                return getJoueurAvecCouleur(pion1.couleur);
                            }
                            if(pion1==$caseVide && pion2!=$caseVide){
                                console.debug(`Le joueur ${pion2.couleur} gagne en étant le plus proche du plongeoir`);
                                return getJoueurAvecCouleur(pion2.couleur);
                            }
                            if(pion1!=$caseVide && pion2!=$caseVide){ // si deux pions sont trouvés
                                if(pion1.couleur == pion2.colueur){ // s'ils sont de la même couleur, celle ci est gagnante
                                    console.debug(`Le joueur ${pion1.couleur} gagne en étant le plus proche du plongeoir`);
                                    return getJoueurAvecCouleur(pion1.couleur);
                                }
                                else{ // sinon on compare leurs deplacements
                                    if(pion1.deplacement > pion2.deplacement){
                                        console.debug(`Le joueur ${pion1.couleur} gagne en ayant le meilleur pion le plus proche du plongeoir`);
                                        return getJoueurAvecCouleur(pion1.couleur);
                                    }
                                    else if(pion1.deplacement < pion2.deplacement){
                                        console.debug(`Le joueur ${pion2.couleur} gagne en ayant le meilleur pion le plus proche du plongeoir`);
                                        return getJoueurAvecCouleur(pion2.couleur);
                                    }
                                    else return false; // les deplacements sont les mêmes donc EGALITE
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

/**
 * Calcule quand la partie est finie
 * @returns {boolean} true si elle est finie, false sinon
 */
function partieFinie(){
    let nbJoueursEnJeu = 0;
    for(let i=0; i<nbJoueurs; i++){
        if($joueurs[i].nbPions > 0) nbJoueursEnJeu++;
    }

    return nbJoueursEnJeu <= 2;
}

/**
 * Vérifie si la couleur donnée est celle du joueur donnée 
 * puis élimine le joueur qui doit être éliminer
 * @param {string} nomJoueur 
 * @param {string} couleur 
 */
function demasquerCouleurJoueur(nomJoueur, couleur){
    if(getJoueurAvecNom(nomJoueur).couleur == couleur){
        eliminerJoueur(couleur);
    }
    else{
        eliminerJoueur($joueurs[joueurActu].couleur);
    }
    coupEnAttente=false;
}


    ////////////////////////////////////////////
    /////////////// DEPLACEMENTS ///////////////

/**
 * Déplace un pion
 * @param {int} caseDepart case de départ du pion
 * @param {boolean} sens sens de déplacement (true: horaire | false: anti horaire) 
 */
function deplacer(caseDepart, sens){
    let caseArrivee = getCaseArrivee(caseDepart, sens);
    if (! estCoupPrecedentInverse(caseDepart,caseArrivee)){
        if ($plateau[caseArrivee] != $caseVide) {
            eliminerPion(caseArrivee);
        }

        $plateau[caseArrivee] = $plateau[caseDepart];
        $plateau[caseDepart] = $caseVide;

        // sauvegarde le coup
        coupPrecedent = [caseDepart, caseArrivee];
        //console.debug(coupPrecedent);
        

        afficher();
        coupEnAttente=false;
    }
    else {
        console.debug("Coup inverse!!")
    }
}

/**
 * Regarde de combien de cases peut se deplacer un pion
 * @param {int} casePion case du pion demandé sur le plateau
 * @returns {int} déplacement du pion
 */
function getDepPossible(casePion){
    if(casePion >=0 && casePion < $taillePlateau){ // si le case est bien entre 0 et 19
        if($plateau[casePion] != $caseVide){ // si le case n'est pas vide
            return $plateau[casePion].deplacement;
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
    console.debug("init jeu fini");
}

/**
 * Regarde où va arriver un pion qui se déplace selon le sens
 * @param {int} casePion case du pion demandé sur le plateau
 * @param {boolean} sens sens de déplacement (true: horaire | false: anti horaire) 
 * @returns {int} case d'arrivée du pion sur la plateau
 */
function getCaseArrivee(casePion, sens){
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
 * vérifie si le dédplacement donné est l'inverse du dernier coup joué
 * @param {int} depart case départ 
 * @param {int} arrivee case d'arrivée
 * @returns {boolean}
 */
function estCoupPrecedentInverse(depart, arrivee){
    
    if(coupPrecedent == null) return false;
    
    if(depart==coupPrecedent[1] && arrivee==coupPrecedent[0]){
        // console.log("true");
        return true; }
    else 
        return false;
}

/**
 * Sert a rien
 * @returns n'importe quoi 
 */
function genRoom(){getJoueurAvecCouleur

    return "room";
}


    ////////////////////////////////////////////////
    /////////////// GESTIONS JOUEURS ///////////////

/**
 * Renvoie le joueur de la couleur donnée
 * @param {string} couleur 
 * @returns {Joueur} 
 */
function getJoueurAvecCouleur(couleur){
    for(let i=0; i<nbJoueurs; i++){
        if($joueurs[i].couleur == couleur) return $joueurs[i];
    }
}

/**
 * Renvoie le joueur qui a le nom donné
 * @param {string} nom 
 * @returns {Joueur}
 */
function getJoueurAvecNom(nom){
    for(let i=0; i<nbJoueurs; i++){
        if($joueurs[i].nom == nom) return $joueurs[i];
    }
}

/**
 * Elimine le joueur de la couleur donnée
 * @param {string} couleurJoueur 
 */
function eliminerJoueur(couleurJoueur){
    console.log(`Joueur ${motEntierCouleurs(couleurJoueur)} éliminé`);
    for(let i = 0; i<$taillePlateau; i++){
        if($plateau[i]!=$caseVide){
            if($plateau[i].couleur==couleurJoueur){
                $plateau[i] = $caseVide;
            }
        }
    }
    getJoueurAvecCouleur(couleurJoueur).nbPions = 0;
    //afficher();
}

/**
 * Elimine le pion sur la case du plateau donnée
 * @param {int} casePion 
 */
function eliminerPion(casePion){
    if(casePion >=0 && casePion < $taillePlateau){ // si le case est bien entre 0 et 19
        let couleur = $plateau[casePion].couleur;
        getJoueurAvecCouleur(couleur).nbPions--;
        console.log(`Un pion ${motEntierCouleurs(couleur)} est tombé a l'eau`);

        $plateau[casePion] = $caseVide;
    }
    //afficher();
}





    ///////////////////////////////////////////////
    /////////////// DEBUG ET AUTRES ///////////////

/**
 * Joue tout seul le nombre de coup donné avec les bots du niveau donné
 * @param {int} coups 
 * @param {int} diff 0: bot random | 1: bot sans suicide
 */
async function test(coups, diff=0){
    for(let i = 0; i<coups; i++) {
        if(partieFinie()){
            return;
        }
        if(diff==0)
            jouerBotDif0();
        else
            jouerBotDif1($joueurs[joueurActu].couleur);
        await new Promise(resolve => setTimeout(resolve, 500));
    };
}

/**
 * renvoie le mot entier de la couleur donnée
 * @param {string} couleur 
 * @returns {string} "r" deviens "rouge"
 */
function motEntierCouleurs(couleur){
    switch(couleur){
        case "r" : return "rouge"; break;
        case "v" : return "vert"; break;
        case "b" : return "bleu"; break;
        case "m" : return "magenta"; break;
        case "c" : return "cyan"; break;
        case "j" : return "jaune"; break;
        default : console.log("pas une couleur"); break;
    }
}


//initPartie(5);
//boucle();
