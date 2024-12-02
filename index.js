const express = require('express');
const path = require('path');
const { getFreeRooms, toDate } = require('./utils');
const fs = require('fs');
const { log } = require('console');
const axios = require('axios');
const { getVisites, incrementVisites, createUser, checkCredentials, getRooms } = require('./sql');
const bodyParser = require('body-parser');
const session = require('express-session');

process.env.TZ = "Europe/Paris";

const app = express();
const port = 3001;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Note: Set secure to true if using HTTPS
}));
function authMiddleware(req, res, next) {
    if (req.session.loggedIn) {
        next();
    } else {
        res.redirect('/salles/login');
    }
}

app.use('/salles/public', express.static(path.join(__dirname, 'public')));

app.get('/salles', async (req, res) => {
    incrementVisites(new Date().toISOString().split('T')[0]);
    if (req.query.date || req.query.time) {
        const heureRegex = /^[0-2][0-9]:[0-5][0-9]$/;
        const dateRegex = /\d{4}-\d{2}-\d{2}/;
        if (!heureRegex.test(req.query.time) || !dateRegex.test(req.query.date)) {
            res.redirect('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
            return;
        }
    }
    try {

        const { freeRooms, usedRooms, invalidRooms } = await getFreeRooms(req.query.date, req.query.time);
        res.render('index', { freeRooms, usedRooms, toDate, invalidRooms});
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la récupération des salles libres: ' + error });
    }
});

app.get('/salles/login', (req, res) => {
    res.render('login');
});

app.post('/salles/login', async (req, res) => {
    const { username, password } = req.body;
    const isValid = await checkCredentials(username, password);
    if (isValid) {
        req.session.loggedIn = true;
        res.redirect('/salles/admin');
    } else {
        res.render('login', { error: 'Nom d\'utilisateur ou mot de passe incorrect' });
    }
});

app.get('/salles/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/salles/');
});

app.get('/salles/admin', authMiddleware, async (req, res) => {
    try {
        res.render('admin', { getVisites });
    } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des salles libres' });
    }
});

app.get('/salles/admin/rooms', async (req, res) => {
    let roomsData = null;
    try {
        roomsData = await getRooms();
    } catch (error) {
        roomsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'rooms.json'), 'utf8'));
    }

    res.json(roomsData);
});

app.get('/salles/admin/check-url', async (req, res) => {
    const { url } = req.query;
    try {
        const response = await axios.get(url);
        const isValidContent = /BEGIN:VEVENT/.test(response.data);
        res.json({ status: isValidContent ? 'accessible' : 'contenu invalide' });
    } catch (error) {
        res.json({ status: 'inaccessible' });
    }
});

app.get('/salles/admin/visites', async (req, res) => {
    try {
        const visites = await getVisites();
        res.json(visites); // Retourner directement les visites
    } catch (error) {
        console.error('Erreur lors de la récupération des visites:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des visites' });
    }
});


app.listen(port, () => {
    console.log(`Serveur en écoute sur le port ${port}`);
});
