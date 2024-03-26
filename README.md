# Plouf Party

#### Technologies utilisées : 
- HTML/CSS
- JavaScript
- Node.js / Express / socket.io
- Three.js ?


#### Dependances 
Executer : 
<code>npm install</code> 
dans le dossier plouf-Party
npm va lire le fichier package.json pour installer toute les dependances (normalement)

#### Regles du jeu
Chaque joueur possède une couleur unique qu'il doit garder secrète, ainsi que 3 pions de cette couleurs avec les numéros 1, 2 et 3 indiqué dessous.
Les numéros sous les pions ne sont, au début de la partie, connu par personne.
Le but du jeu est de conserver des pions de sa couleure sur le terrain jusqu'en fin de partie.
- **A chaque tour, un joueur peut :**
    - Dénoncer la couleure d'un autre joueur. Si il a raison, tout les pions de ce derniers sautent à la piscine, sinon ses propres pions sautent.
    - Choisir n'imorte que pion encore sur le terrain, regarder dessous, et le déplacer du nombre de case indiqué dans le sens qu'il veut. Il ne peut cependant pas réaliser le coup inverse au tour precedent.

- **Elimination des pions :**
    - Un pion se déplace sur un autre, celui du dessous tombe à l'eau.
    - Un joueur est dénoncé justement, tout les pions du joueur dénoncé tombent à l'eau.
    - Un joueur est dénoncé faussement, tout les pions du joueur qui a dénoncé tombent à l'eau.

- **Fin de partie :**
    - Quand il ne reste plus que 2 couleures sur le terrain, la partie prend fin.
    - Le joueur ayant, dans l'ordre de priorité, gagne :
        - Le plus de pions restant.
        - Le joueur ayant le pion le plus proche du plongeoir.
        - Le joueur ayant le pion à la plus grand valeure le plus proche du plongeoir.