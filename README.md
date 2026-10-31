# project_dashboard
# ISSATSo Board - Tableau de bord interactif

Mini-projet Web (partie JavaScript), sujet 3 : tableau de bord.
ISSAT Sousse - Département Informatique - FIA2 - A.U. 2026/2027

**Auteurs :** Fedi Ben Hessine, Ghassen Derbali

## Description

Tableau de bord d'administration (données fictives) réalisé en HTML5, CSS3 et JavaScript.
La partie 1 (HTML/CSS) a été enrichie avec JavaScript, sans repartir de zéro.

## Fonctionnalités

**Obligatoires**
- Tri, filtrage et mise à jour dynamique du tableau des paiements
- Graphiques interactifs avec Chart.js
- Actualisation automatique des données (simulée avec `setInterval`, toutes les 5 s)

**Bonus**
- Plusieurs types de graphiques (histogramme et anneau)
- Export CSV des données du tableau

## Lancer le projet

1. Ouvrir le dossier dans VS Code.
2. Lancer `index.html` avec l'extension Live Server.
3. Une connexion Internet est nécessaire pour charger Chart.js et la police Inter.

## Structure

```
project_dashboard/
├── index.html   structure de la page
├── style.css    mise en page et styles
├── script.js    logique JavaScript (tableau, graphiques, actualisation, export)
└── README.md
```

## Bibliothèque utilisée

- [Chart.js](https://www.chartjs.org/) 4.4.1, chargée depuis le CDN jsDelivr.
