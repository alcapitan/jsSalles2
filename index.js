const express = require('express');
const path = require('path');
const { getFreeRooms, toDate } = require('./utils');
const fs = require('fs');
const { log } = require('console');
const axios = require('axios');
const { getVisites, incrementVisites, checkCredentials, getRooms, getUniv } = require('./sql');
const bodyParser = require('body-parser');
const session = require('express-session');

process.env.TZ = "Europe/Paris";

const app = express();
const port = 3001;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'timefield',
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: { secure: false, maxAge: 60*1000 } // Note: Set secure to true if using HTTPS
}));
function authMiddleware(req, res, next) {
    if (req.session.loggedIn) {
        next();
    } else {
        res.redirect('/salles/login');
    }
}

/**
 * #####################
 * Section Authenfication
 * #####################
 */
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





/**
 * ######################
 * Section Administration
 * ######################
 */
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

/**
 * ################
 * Section Publique
 * ################
 */
app.use('/salles/public', express.static(path.join(__dirname, 'public')));

app.get('/salles', async (req, res) => {
    // incrementVisites(new Date().toISOString().split('T')[0]);
    res.redirect('/salles/univ/ceri');
});

app.get('/salles/univ/:univ', async (req, res) => {
    const univs = (await getUniv(req.params.univ)).map(u => u.univ);
    const univ = req.params.univ;
    if(!univs.includes(univ)) {
        console.log('Université non trouvée');
        res.status(404).send('Université non trouvée');
        return;
    }
    if (!req.session.visited) {
        try {
            await incrementVisites(new Date().toISOString().split('T')[0]);
            req.session.visited = true; // Marquer l'utilisateur comme compté
        } catch (error) {
            console.error('Erreur lors de l\'incrémentation des visites', error);
        }
    }
    if (req.query.date || req.query.time) {
        const heureRegex = /^[0-2][0-9]:[0-5][0-9]$/;
        const dateRegex = /\d{4}-\d{2}-\d{2}/;
        if (!heureRegex.test(req.query.time) || !dateRegex.test(req.query.date)) {
            res.redirect('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
            return;
        }
    }
    try {
        const { freeRooms, usedRooms, invalidRooms } = await getFreeRooms(req.query.date, req.query.time, univ);        
        res.render('index', { freeRooms, usedRooms, toDate, invalidRooms, univ: univ });
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la récupération des salles libres: ' + error });
    }
});

// 404 page
app.use((req, res) => {
    // snd 404.html
    res.status(404).render(path.join(__dirname, 'views', '404.ejs'));
});

/**
 * ####################
 * Demarrage du serveur
 * ####################
 */
app.listen(port, () => {
    console.log(`Serveur en écoute sur le port ${port}`);
});
