


//////////////////////////////// OUVRE LE FICHIER
const fs = require('fs'); // Module pour gérer les fichiers
const { type } = require('os');

function lireFichierJson(nomFichier) {
  try {
    // Lecture du fichier synchronement (pour un exemple simple)
    const data = fs.readFileSync(nomFichier, 'utf8');
    const stats = JSON.parse(data);
    return stats;
  } catch (err) {
    console.error('Erreur de lecture du fichier :', err);
    return null;
  }
}

// Utilisation de la fonction pour lire le fichier data.json
const stats = lireFichierJson('logs/statistiques.json');

// Vérification si les stats ont été chargées avec succès
if (stats) {
  console.log('Stats chargées avec succès :');
} else {
  console.log('Impossible de charger les stats.');
  return;
}

//////////////////////////////// REGARDE LA DATE DE DERNIERE MAJ
let dateDuJour = new Date();
dateDuJour.setUTCHours(0, 0, 0, 0);
dateDuJour.setDate(dateDuJour.getDate() + 1);
/*
// Séparation de la date et de l'heure
let [datePart, timePart] = dateDuJour.split("T");

// Remplacement de la partie de l'heure par "00:00:00.000Z"
let dateModifiee = datePart + "T00:00:00.000Z";
*/
console.debug(dateDuJour.toISOString());
console.debug(stats.derniereMaJ);

if(stats.derniereMaJ == dateDuJour.toISOString()){
    console.log("les statistiques ont déjà été calculées aujourd'hui");
    return; 
}
if(stats.derniereMaJ == "undefined"){
    stats.derniereMaJ = dateDuJour;
}

let dateDerniereMaj = new Date(stats.derniereMaJ);



////////////////////////////////// LIS LES JSONs DES JOURS NON CALCULES

// Fonction pour obtenir le nombre de jours entre deux dates
const getDaysDiff = (date1, date2) => {
    const oneDay = 24 * 60 * 60 * 1000; // Nombre de millisecondes dans un jour
    const diff = Math.abs(date1.getTime() - date2.getTime());
    return Math.round(diff / oneDay);
  };

  
  // Calculer le nombre de jours entre la date enregistrée et la date actuelle
const daysDiff = getDaysDiff(dateDerniereMaj, dateDuJour);

//console.debug(daysDiff);

// Parcourir chaque jour depuis la date enregistrée jusqu'à la date actuelle
for (let i = 0; i <= daysDiff; i++) {
    const dateCourante = new Date(dateDerniereMaj);
    dateCourante.setDate(dateDerniereMaj.getDate() + i);
    const stringDateCourante = dateCourante.toISOString().split('T')[0];

    let logsCourants;

    // essaye d'ouvrir le fichier du jour courant
    try {
        // Lecture du fichier synchronement (pour un exemple simple)
        const data = fs.readFileSync(`logs/logs-${stringDateCourante}.json`, 'utf8');
        logsCourants = JSON.parse(data);
        //console.debug(`ouverture de logs-${stringDateCourante}.json`);
      } catch (err) {
        //console.error('Erreur de lecture du fichier :', err);
      }

   
    if(logsCourants){
///// v calculer les stats ici v //////

    
    //console.debug(stats.typesDeParties.length);
    logsCourants.parties.forEach(partie => {
        stats.dureeMoyenne = ((stats.dureeMoyenne*stats.nbTotalPartie)
                            + (partie.duree))
                            / stats.nbTotalPartie+1;
        stats.nbTotalPartie++;

        const nbJoueurs = partie.listeJoueurs.length;
        const nbHumains = partie.listeJoueurs.filter(joueur=>joueur.type=="humain").length;
        const nbBotAlea = partie.listeJoueurs.filter(joueur=>joueur.type=="BotAlea" || joueur.type==undefined).length;
        const nbBotAlgo = partie.listeJoueurs.filter(joueur=>joueur.type=="BotAlgo").length;
        //console.debug("///////////////");
        //console.debug(nbJoueurs);
        //console.debug(nbHumains);
        //console.debug(nbBotAlea);
        //console.debug(nbBotAlgo);

        let typeDePartie = stats.typesDeParties.filter(tdp=> 
            (/*console.debug(tdp.joueurs.nbJoueurs),*/tdp.joueurs.nbJoueurs == nbJoueurs)
            && (/*console.debug(tdp.joueurs.nbHumains),*/tdp.joueurs.nbHumains == nbHumains)
            && (/*console.debug(tdp.joueurs.nbBotAlea),*/tdp.joueurs.nbBotAlea == nbBotAlea)
            && (/*console.debug(tdp.joueurs.nbBotAlgo),*/tdp.joueurs.nbBotAlgo == nbBotAlgo));
        /*
            if(stats.typesDeParties.length > 3) {
            //console.debug(stats.typesDeParties[3])
        }*/
        ////console.debug(typeDePartie);
        //console.debug("///////////////");
        let typeDePartieExistant;
        if(typeDePartie.length == 0){
            typeDePartieExistant = false;
            // si aucune partie enregistrée dans stats n'a la même configuration de joueur
            typeDePartie = {
                "joueurs": {
                    "nbJoueurs": nbJoueurs,
                    "nbHumains": nbHumains,
                    "nbBotAlea": nbBotAlea,
                    "nbBotAlgo": nbBotAlgo
                },
                "nbParties": 0,
                "nbPartiesAnnulees": 0,
                "dureeMoyenne": 0,
                "victoires":{
                    "nbVictoiresH": 0,
                    "nbVictoiresAlea": 0,
                    "nbVictoiresAlgo": 0,
    
                    "nbVictoirePos1": 0,
                    "nbVictoirePos2": 0,
                    "nbVictoirePos3": 0,
                    "nbVictoirePos4": 0,
                    "nbVictoirePos5": 0,
                    "nbVictoirePos6": 0,
    
                    "nbVictoireTypeNbPion": 0,
                    "nbVictoireTypeProchePlongoir": 0,
                    "nbVictoireTypeMeilleurDep": 0,
                    "nbVictoireTypeEgalite": 0
                },
                "demasquages":{
                    "nbDemasquages": 0,
                    "nbDemasquagesJustes": 0,
                    "nbHumainsDemasque": 0,
                    "nbAleaDemasque": 0,
                    "nbAlgoDemasque": 0
                },
                "eliminations":{
                    "nbPionsMangesParH": 0,
                    "nbPionsMangesParAlea": 0,
                    "nbPionsMangesParAlgo": 0
                }
            }
        }
        else{
            // si une partie enregistrée dans stats a la même configuration de joueur
            typeDePartieExistant = true;
            typeDePartie = typeDePartie[0];
        }

        typeDePartie.nbParties++;

        // vérifie si la partie possède bien un gagnant
        if(partie.listeJoueurs.some(joueur=>joueur.aGagne) == false){
            // la partie n'a aucun gagnant, elle n'a pas été terminée
            typeDePartie.nbPartiesAnnulees++;
        }
        else{ // la partie a été finie, elle peut entrer dans les statistiques
            typeDePartie.dureeMoyenne = ((typeDePartie.dureeMoyenne*typeDePartie.nbParties-1)
                                        +(partie.duree)
                                        /typeDePartie.nbParties-typeDePartie.nbPartiesAnnulees);
            
            partie.listeJoueurs.filter(joueur=>joueur.aGagne).forEach(gagnant => {
                switch (gagnant.type) {
                    case "humain":
                        typeDePartie.victoires.nbVictoiresH++;
                        break;
                    case "BotAlea":
                        typeDePartie.victoires.nbVictoiresAlea++;
                        break;
                    case "BotAlgo":
                        typeDePartie.victoires.nbVictoiresAlgo++;
                        break;
                    default:
                        typeDePartie.victoires.nbVictoiresAlea++;
                    break;
                }
                switch (gagnant.ordre) {
                    case 0:
                        typeDePartie.victoires.nbVictoirePos1++;
                        break;
                    case 1:
                        typeDePartie.victoires.nbVictoirePos2++;
                        break;
                    case 2:
                        typeDePartie.victoires.nbVictoirePos3++;
                        break;
                    case 3:
                        typeDePartie.victoires.nbVictoirePos4++;
                        break;
                    case 4:
                        typeDePartie.victoires.nbVictoirePos5++;
                        break;
                    case 5:
                        typeDePartie.victoires.nbVictoirePos6++;
                        break;
                }
            });
            
            switch (partie.typeVictoire) {
                case "nbPions":
                    typeDePartie.victoires.nbVictoireTypeNbPion++;
                    break;
                case "prochePlongeoir":
                    typeDePartie.victoires.nbVictoireTypeProchePlongoir++;
                    break;
                case "meilleurPion":
                    typeDePartie.victoires.nbVictoireTypeMeilleurDep++;
                    break;
                case "egalite":
                    typeDePartie.victoires.nbVictoireTypeEgalite++;
                    break;
            }

            partie.listeCoups.forEach(coup => {
                if(coup.type == "demasquer"){ // demasquage
                    typeDePartie.demasquages.nbDemasquages++;
                    if(coup.estJuste){
                        typeDePartie.demasquages.nbDemasquagesJustes++;
                        const joueurGuess = coup.joueurGuess;
                        const typeDemasque = partie.listeJoueurs.filter(joueur=>joueur.couleur == joueurGuess)[0].type;
                        switch (typeDemasque) {
                            case "humain":
                                typeDePartie.demasquages.nbHumainsDemasque++;
                                break;
                            case "BotAlea":
                                typeDePartie.demasquages.nbAleaDemasque++;
                                break;
                            case "BotAlgo":
                                typeDePartie.demasquages.nbAlgoDemasque++;
                                break;
                            default:
                                typeDePartie.demasquages.nbAleaDemasque++;
                                break;
                        }
                    }
                }
                else{ // deplacement
                    if(coup.elimine){
                        const eliminePar = partie.listeJoueurs.filter(joueur=>joueur.couleur == coup.joueur)[0];
                        //console.debug(eliminePar.type);

                        switch (eliminePar.type) {
                            case "humain":
                                typeDePartie.eliminations.nbPionsMangesParH++;
                                break;
                            case "BotAlea":
                                typeDePartie.eliminations.nbPionsMangesParAlea++;
                                break;
                            case "BotAlgo":
                                typeDePartie.eliminations.nbPionsMangesParAlgo++;
                                break;
                            default:
                                typeDePartie.eliminations.nbPionsMangesParAlea++;
                                break;
                        }
                    }
                }
            });
    
        }

        ////console.debug(typeDePartie);
        //console.debug(typeDePartieExistant);
        if(typeDePartieExistant){
            stats.typesDeParties.filter(partie=> partie.nbJoueurs == nbJoueurs
                && partie.nbHumains == nbHumains
                && partie.nbBotAlea == nbBotAlea
                && partie.nbBotAlgo == nbBotAlgo)[0]=typeDePartie;
        }
        else{
            stats.typesDeParties.push(typeDePartie);
        }
        //console.debug(stats.typesDeParties.length);
    });

    }
    


  }





///////////////////////////////// ENREGISTRE LE JSON

    // derniere MaJ
    stats.derniereMaJ = dateDuJour;

// Convertir l'objet en une chaîne JSON
let jsonStats = JSON.stringify(stats, null, 2); // Indentation de 2 espaces pour une meilleure lisibilité

// Écrire la chaîne JSON dans un fichier

fs.writeFile('logs/statistiques.json', jsonStats, (err) => {
    if (err) {
        console.error('Erreur lors de l\'écriture du fichier :', err);
        return;
    }
    console.log('Fichier "statistiques.json" enregistré avec succès !');
});

////console.debug(stats);

stats.typesDeParties.forEach(tdp => {
    //console.debug(tdp);
});


