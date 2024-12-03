const { Client } = require('pg');
const bcrypt = require('bcrypt');

const client = new Client({
    user: 'jsSalles',
    host: 'db.tidic.fr',
    database: 'jssalles',
    password: 'xa32vc8b',
    port: 5432,
});

client.connect();

async function getVisites() {
    try {
        const res = await client.query('SELECT * FROM visites');
        let visitesMap = {};
        res.rows.forEach(row => {
            const visites_jour = new Date(row.visites_jour).toISOString().split('T')[0];
            visitesMap[visites_jour] = row.visites;
        });
        return visitesMap;
    } catch (err) {
        console.error('Erreur lors de la récupération des visites', err);
        throw err;
    }
    
}

async function incrementVisites(jour) {
    try {
        const res = await client.query('UPDATE visites SET visites = visites + 1 WHERE visites_jour = $1 RETURNING *', [jour]);
        if (res.rowCount === 0) {
            await client.query('INSERT INTO visites (visites_jour, visites) VALUES ($1, 1)', [jour]);
        }
    } catch (err) {
        console.error('Erreur lors de l\'incrémentation des visites', err);
        throw err;
    }
}

async function checkCredentials(username, password) {
    try {
        const res = await client.query('SELECT * FROM users WHERE username = $1', [username]);
        if (res.rows.length > 0) {
            const user = res.rows[0];
            const match = await bcrypt.compare(password, user.password);
            return match;
        } else {
            return false;
        }
    } catch (err) {
        console.error('Erreur lors de la vérification des identifiants', err);
        throw err;
    }
}

async function createUser(username, password) {
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await client.query('INSERT INTO users (username, password) VALUES ($1, $2)', [username, hashedPassword]);
    } catch (err) {
        console.error('Erreur lors de la création de l\'utilisateur', err);
        throw err;
    }
}

async function getRooms(univ) {
    if (!univ) {
        try {
            const res = await client.query('SELECT univ, room_name, room_url FROM rooms');
            return res.rows;
        } catch (err) {
            console.error('Erreur lors de la récupération des salles', err);
            throw err;
        }
    }
    dbUnivs = (await getUniv()).map(u => u.univ);
    if (!dbUnivs.includes(univ)) {
        console.log('univ: ', univ);
        console.log('dbUnivs: ', dbUnivs);
        console.error('Erreur: université non trouvée');
        throw new Error('université non trouvée');
    }
    try {
        const res = await client.query('SELECT univ, room_name, room_url FROM rooms WHERE univ = $1', [univ]);
        return res.rows;
    } catch (err) {
        console.error('Erreur lors de la récupération des salles', err);
        throw err;
    }
}

async function getUniv() {
    try {
        const res = await client.query('SELECT DISTINCT univ FROM rooms;');
        return res.rows;
    } catch (err) {
        console.error('Erreur lors de la récupération des universités', err);
        throw err;
    }
}

module.exports = {
    getVisites,
    incrementVisites,
    createUser,
    checkCredentials,
    getRooms,
    getUniv
};