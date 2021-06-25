import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import { v4 as uuid } from 'uuid';
import connection from './database.js';
import moment from 'moment';

const app = express();
app.use(cors());
app.use(express.json());

const query = connection.query('SELECT * FROM categories');

query.then(result => {
    console.log(result.rows);
});

app.post('/sign-up', async (req, res) => {
    const { email, password, username } = req.body;
    if (email === '' || password === '' || username === '') {return res.sendStatus(400)}
    const passwordHash = bcrypt.hashSync(password, 10);

    try {
        let emailAvailable = true;
        const checkEmail = await connection.query('SELECT (email) FROM users');
        checkEmail.rows.forEach(i => {
            if (i.email === email) {emailAvailable = false}
        })
        if (!emailAvailable) {return res.sendStatus(409)}

        const createAccount = await connection.query(`
            INSERT INTO users (username, email, password) 
            VALUES ($1, $2, $3)
        `, [username, email, passwordHash]);

        const pickUserid = await connection.query(`
            SELECT id FROM users WHERE email=$1
        `, [email]);

        const createWallet = await connection.query(`
            INSERT INTO wallets (userid, amount)
            VALUES ($1, '0')
        `, [pickUserid.rows[0].id]);
        res.sendStatus(201);
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
});

app.post('/log-in', async (req, res) => {
    const { email, password } = req.body;
    if (email === '' || password === '') {return res.sendStatus(400)}

    try {
        const pickUser = await connection.query(`
            SELECT * FROM users
            WHERE email = $1
        `,[email]);

        const user = pickUser.rows[0];

        if(user && bcrypt.compareSync(password, user.password)) {
            const token = uuid();
        
            await connection.query(`
                INSERT INTO sessions (userid, token)
                VALUES ($1, $2)
            `, [user.id, token]);

            res.send({user: user.username, userId: user.id, token: token});
        } else {
            res.sendStatus(403)
        }
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
});

app.get('/transactions/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const pickTransactions = await connection.query('SELECT * FROM transactions WHERE userid=$1', [id]);
        res.send(pickTransactions.rows);
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
});

app.get('/wallets/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const pickAmountOnWallet = await connection.query('SELECT * FROM wallets WHERE userid=$1', [id]);
        res.send(pickAmountOnWallet.rows[0]);
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
});

app.post(`/new-entry-in/:id`, async (req,res) => {
    const id = parseInt(req.params.id);
    const { entryValue, categoryId, entryDescription } = req.body;
    let tableValue = entryValue * 10;
    try {
        let todayDate = moment().format('DD/MM');
        await connection.query(`
            INSERT INTO transactions (value, categoryid, userid, description, date)
            VALUES ($1, $2, $3, $4, $5)
        `, [tableValue, categoryId, id, entryDescription, todayDate]);
        const pickAmountOnWallet = await connection.query('SELECT * FROM wallets WHERE userid=$1', [id]);
        let newAmount = parseInt(pickAmountOnWallet.rows[0].amount) + parseInt(tableValue);
        await connection.query(`
            UPDATE wallets
            SET amount=$1
            WHERE userid=$2
        `, [newAmount, id])
        res.sendStatus(201);
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
});

app.post(`/new-entry-out/:id`, async (req,res) => {
    const id = parseInt(req.params.id);
    const { entryValue, categoryId, entryDescription } = req.body;
    let tableValue = entryValue * 10;
    try {
        let todayDate = moment().format('DD/MM');
        await connection.query(`
            INSERT INTO transactions (value, categoryid, userid, description, date)
            VALUES ($1, $2, $3, $4, $5)
        `, [tableValue, categoryId, id, entryDescription, todayDate]);

        const pickAmountOnWallet = await connection.query('SELECT * FROM wallets WHERE userid=$1', [id]);
        let newAmount = parseInt(pickAmountOnWallet.rows[0].amount) - parseInt(tableValue);
        await connection.query(`
            UPDATE wallets
            SET amount=$1
            WHERE userid=$2
        `, [newAmount, id])
        res.sendStatus(201);
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
});

export default app;