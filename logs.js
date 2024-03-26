const partie = {
    "date" : undefined,
    "duree" : undefined,
    "plateauDepart" : undefined,
    "plateauFin": undefined,
    "listeJoueurs":[

    ],
    "listeCoups":[

    ],
    "aQuitte": [

    ],
    "gagnant": undefined,
    "typeVictire": undefined
}

/**
 * efface toutes les données enregistrées au cours de la partie
 */
function resetLog(){
    partie = {
        "date" : undefined,
        "duree" : undefined,
        "plateauDepart" : undefined,
        "plateauFin": undefined,
        "listeJoueurs":[
    
        ],
        "listeCoups":[
    
        ],
        "aQuitte": [
    
        ],
        "gagnant": undefined,
        "typeVictire": undefined
    }
}

/**
 * enregistre la date actuelle comme étant la date de début de la partie
 */
function setDateDebut(){
    const dateCourante = new Date();
    partie.date = dateCourante;
}

/**
 * enregistre la durée de la partie avec la date actuelle comme étant la fin de la partie
 */
function calculerDuree(){
    if(partie.date != undefined){
        const dateCourante = new Date();
        partie.duree = dateCourante - partie.date;
    }
}

/**
 * enregistre un joueur qui a participé a la partie.
 * @param {string} pseudo 
 * @param {string} couleur sous forme "r", "v", "b" etc
 * @param {string} type humain, bot_alea, bot_inteligent etc
 * @param {int} ordre index de passage du joueur
 */
function ajouterJoueur(pseudo, couleur, type, ordre){
    const joueur = {
        "pseudo" : pseudo,
        "couleur" : couleur,
        "nbPion" : undefined,
        "type" : type,
        "ordre" : ordre,
        "aQuitte" : undefined,
        "aGagne" : false,
        "elimineA" : undefined,
        "eliminerPar" : undefined
    }

    partie.listeJoueurs.push(joueur);
}

/**
 * enregistre le nombre de pion final du joueur de la couleur donnée
 * @param {string} couleur sous forme "r", "v", "b" etc
 * @param {int} nbPion 
 */
function setNbPion(couleur, nbPion){
    partie.listeJoueurs.find((joueur)=>joueur.couleur === couleur).nbPion = nbPion;
}

/**
 * enregistre la date a laquelle le joueur a quitté
 * @param {string} couleur sous forme "r", "v", "b" etc
 */
function joueurQuitte(couleur){
    const dateCourante = new Date();
    partie.listeJoueurs.find((joueur)=>joueur.couleur === couleur).aQuitte = dateCourante;
}

/**
 * enregistre un déplacement dans les coups de la partie
 * @param {int} caseDepart 
 * @param {int} caseArrivee 
 * @param {string} couleurPion sous forme "r", "v", "b" etc
 * @param {int} depPion 
 * @param {boolean} direction
 * @param {string} jouePar sous forme "r", "v", "b" etc
 * @param {string} aElimine sous forme "r", "v", "b" etc
 */
function ajouterDep(caseDepart, caseArrivee, couleurPion, depPion, direction, jouePar, aElimine=undefined){
    const dateCourante = new Date();
    const coup = {
        "type": "deplacer",
        "date": dateCourante,
        "depart": caseDepart,
        "arrivee": caseArrivee,
        "pion": {
            "couleur": couleurPion, 
            "deplacement": depPion,
            "direction" : direction
        },
        "joueur": jouePar,
        "elimine": aElimine
    }
    partie.listeCoups.push(coup);
}

/**
 * enregistre un démasquage dans les coups de la partie
 * @param {string} joueurGuess  sous forme "r", "v", "b" etc
 * @param {string} couleurGuess  sous forme "r", "v", "b" etc
 * @param {string} demasqueur  sous forme "r", "v", "b" etc
 * @param {boolean} juste 
 */
function ajouterDem(joueurGuess, couleurGuess, demasqueur, juste){
    const dateCourante = new Date();
    const demasquage = {
        "type": "demasquer",
        "date": dateCourante,
        "joueurGuess" : joueurGuess,
        "couleurGuess" : couleurGuess,
        "joueur" : demasqueur,
        "estJuste" : juste
    }

}

/**
 * enregistre la date et par qui un joueur a été éliminé
 * @param {string} couleur sous forme "r", "v", "b" etc
 * @param {string} par sous forme "r", "v", "b" etc
 */
function eliminerJoueur(couleur, par){
    const dateCourante = new Date();
    partie.listeJoueurs.find((joueur)=>joueur.couleur === couleur).elimineA = dateCourante;
    partie.listeJoueurs.find((joueur)=>joueur.couleur === couleur).eliminerPar = par;
}

/**
 * enregistre que le joueur de la couleur donnée a gagné
 * @param {string} couleur sous forme "r", "v", "b" etc
 */
function setGagnant(couleur){
    partie.listeJoueurs.find((joueur)=>joueur.couleur === couleur).a = true;
}

/**
 * enregistre comment le gagnant a gagné
 * @param {string} type nBpions, prochePlongeoir, meilleurDep, egalite
 */
function setTypeVictoire(type){
    partie.typeVictire = type;
}

const fs = require('fs');
function enregistrerJSONecrase(){
    // Convertir l'objet en une chaîne JSON
    let jsonPartie = JSON.stringify(partie, null, 2); // Indentation de 2 espaces pour une meilleure lisibilité

    // Écrire la chaîne JSON dans un fichier
    fs.writeFile('logs/logsEcrase.json', jsonPartie, (err) => {
        if (err) {
            console.error('Erreur lors de l\'écriture du fichier :', err);
            return;
        }
        console.log('Fichier "logsEcrase.json" enregistré avec succès !');
    });
}
function enregistrerJSONincremente(){
    // Lire le contenu du fichier JSON
fs.readFile('logs/logsIncremente.json', 'utf8', (err, data) => {
    if (err) {
        console.error('Erreur lors de la lecture du fichier :', err);
        return;
    }


    // Analyser le contenu JSON en tant qu'objet JavaScript
    let jsonCourant = JSON.parse(data);
    console.log(jsonCourant);

    // Modifier les données de la partie
    jsonCourant.parties.push(partie);
    console.log(jsonCourant);

    // Convertir l'objet modifié en une chaîne JSON
    let jsonPartie = JSON.stringify(jsonCourant, null, 2);
    console.log(jsonPartie);

    // Écrire la chaîne JSON dans le fichier
    fs.writeFile('logs/logsIncremente.json', jsonPartie, (err) => {
        if (err) {
            console.error('Erreur lors de l\'écriture du fichier :', err);
            return;
        }
        console.log('Fichier "partie.json" modifié avec succès !');
    });
});
}


/// TESTS

/**
 * affiche les données dans la console
 */
function afficherConsole(){
    console.log(partie);
}

/**
 * teste
 */
function testValeurs(){
    setDateDebut();
    ajouterJoueur("cc1", "r", 3, "humain", 0);
    ajouterJoueur("ccccccccccccccccccc2", "b", 0, "humain", 1);
    ajouterJoueur("BOT1", "m", 0, "BOT1", 3);
    ajouterJoueur("cc3", "v", 2, "humain", 2);
    joueurQuitte("r");
    
    ajouterDep(1,2);
    ajouterDep(2,3);
    ajouterDep(5,8);
    
    //await new Promise(resolve => setTimeout(resolve, 2000));
    calculerDuree();
    //afficherConsole();
    enregistrerJSONecrase();
    enregistrerJSONincremente();
}
testValeurs();