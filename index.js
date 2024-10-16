const express = require('express');
const path = require('path');
const { getFreeRooms, toDate } = require('./utils');

process.env.TZ = "Europe/Paris";

const app = express();
const port = 3001;

// Définir le moteur de template EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Servir des fichiers statiques
app.use('/salles/public',express.static(path.join(__dirname, 'public')));

app.get('/salles', async (req, res) => {
    try {
        const freeRooms = await getFreeRooms();
        const sortedRooms = Object.keys(freeRooms).sort().reduce((result, key) => {
            result[key] = freeRooms[key];
            return result;
        }, {});
        res.render('index', { freeRooms: sortedRooms, toDate });
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la récupération des salles libres' });
    }
});

app.listen(port, () => {
    console.log(`Serveur en écoute sur le port ${port}`);
});