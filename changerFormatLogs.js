const fs = require('fs');
const path = require('path');

// Chemin du dossier contenant les fichiers
const dossier = 'logs';

// Lire le contenu du dossier
fs.readdir(dossier, (err, fichiers) => {
  if (err) {
    console.error("Erreur de lecture du dossier :", err);
    return;
  }

  // Pour chaque fichier dans le dossier
  fichiers.forEach((fichier) => {
    // Vérifier si le fichier est au format "logs-20-4-2024.json"
    if (fichier.startsWith("logs-") && fichier.endsWith(".json")) {
      // Séparation du nom de fichier et de son extension
      const { name, ext } = path.parse(fichier);
      
      // Séparation de la date
      const elementsDate = name.split('-');
      let jour = elementsDate[1];
      if(jour.length == 1) jour = "0" + jour;
      let mois = elementsDate[2];
      if(mois.length == 1) mois = "0" + mois;
      const annee = elementsDate[3];
      
      // Nouveau nom de fichier avec la date réorganisée
      const nouveauNom = `logs-${annee}-${mois}-${jour}${ext}`;
      
      // Chemin actuel et nouveau chemin du fichier
      const cheminActuel = path.join(dossier, fichier);
      const nouveauChemin = path.join(dossier, nouveauNom);
      
      // Renommer le fichier
      fs.rename(cheminActuel, nouveauChemin, (err) => {
        if (err) {
          console.error(`Erreur lors du renommage de ${fichier} :`, err);
        } else {
          console.log(`Le fichier ${fichier} a été renommé en ${nouveauNom}`);
        }
      });
    }
  });
});