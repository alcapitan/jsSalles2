const express = require('express');
const path = require('path');
const { getFreeRooms, toDate } = require('./utils');

process.env.TZ = "Europe/Paris";

const app = express();
const port = 3001;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use('/salles/public',express.static(path.join(__dirname, 'public')));

app.get('/salles', async (req, res) => {
    if(req.query.date || req.query.time) {
        const heureRegex = /^[0-2][0-9]:[0-5][0-9]$/;
        const dateRegex = /\d{4}-\d{2}-\d{2}/;
        if(!heureRegex.test(req.query.time) || !dateRegex.test(req.query.date)) {
            res.redirect('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
            return;
        }
    }
    try {
        
        const { freeRooms, usedRooms } = await getFreeRooms(req.query.date, req.query.time);

        const sortedFreeRooms = Object.keys(freeRooms).sort().reduce((result, key) => {
            result[key] = freeRooms[key];
            return result;
        }, {});
        const sortedUsedRooms = Object.keys(usedRooms).sort().reduce((result, key) => {
            result[key] = usedRooms[key];
            return result;
        }, {});
        res.render('index', { freeRooms: sortedFreeRooms, usedRooms: sortedUsedRooms, toDate });
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la récupération des salles libres' });
    }
});


app.listen(port, () => {
    console.log(`Serveur en écoute sur le port ${port}`);
});