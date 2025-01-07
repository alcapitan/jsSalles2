const { Client } = require('pg');
const bcrypt = require('bcrypt');

const createClient = () => {
    return new Client({
        user: 'jssalles',
        host: 'db.tidic.fr',
        database: 'jssalles',
        password: 'xa32vc8b',
        port: 5432,
    });
};

const connectToDatabase = () => {
    const client = createClient();
    client.connect(err => {
        if (err) {
            console.error('connection error', err.stack);
            setTimeout(connectToDatabase, 5000);
        } else {
            console.log('connected');
        }
    });

    client.on('error', err => {
        console.error('Unexpected error on idle client', err);
        client.end();
        connectToDatabase();
    });

    return client;
};

const client = connectToDatabase();

async function getVisites() {
    const client = createClient();
    await client.connect();
    let visitesMap = [];
    try {
        const res1 = await client.query('SELECT * FROM visites');
        const res2 = await client.query('SELECT * FROM visitesparutilisateur');
        
        visitesMap.push(res1.rows);
        visitesMap.push(res2.rows);

    } catch (err) {
        console.error('Erreur lors de la récupération des visites', err);
        throw err;
    } finally {
        await client.end();
    }
    return visitesMap;
}

async function incrementVisites2(jour) {
    console.log(jour);
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

async function incrementVisites(jour) {
    try {
        const res2 = await client.query('UPDATE visitesparutilisateur SET visites = visites + 1 WHERE visites_jour = $1 RETURNING *', [jour]);
        if (res2.rowCount === 0) {
            await client.query('INSERT INTO visitesparutilisateur (visites_jour, visites) VALUES ($1, 1)', [jour]);
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
    incrementVisites2,
    createUser,
    checkCredentials,
    getRooms,
    getUniv
};