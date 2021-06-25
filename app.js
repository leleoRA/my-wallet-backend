import express from 'express';
import cors from 'cors';
import pg from 'pg';
import bcrypt from 'bcrypt';
import { v4 as uuid } from 'uuid';

const { Pool } = pg;

const connection = new Pool({
  user: 'postgres',
  password: '123456',
  host: 'localhost',
  port: 5432,
  database: 'my_wallet_database'
});

const server = express();
server.use(cors());
server.use(express.json());

console.log("Servidor ativo!");

const query = connection.query('SELECT * FROM categories');

query.then(result => {
    console.log(result.rows);
});

server.post('/sign-up', async (req, res) => {
    const { email, password, username } = req.body;
    if (email === '' || password === '' || username === '') {return res.sendStatus(400)}
    const passwordHash = bcrypt.hashSync(password, 10);

    try {
        let emailAvailable = true;
        const checkEmail = await connection.query('SELECT (email) FROM users');
        checkEmail.rows.forEach(i => {
            if (i.email === email) {emailAvailable = false}
        })
        if (!emailAvailable) {return res.sendStatus(403)}

        const createAccount = await connection.query(`
            INSERT INTO users (username, email, password) 
            VALUES ($1, $2, $3)
        `, [username, email, passwordHash]);
        res.sendStatus(201);
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
});

server.post('/log-in', async (req, res) => {
    const { email, password } = req.body;
    if (email === '' || password === '') {return res.sendStatus(400)}

    try {
        const pickUser = await connection.query(`
            SELECT * FROM users
            WHERE email = $1
        `,[email]);

        const user = result.rows[0];

        if(user && bcrypt.compareSync(password, user.password)) {
            const token = uuid.v4();
        
            await connection.query(`
                INSERT INTO sessions (iduser, token)
                VALUES ($1, $2)
            `, [user.id, token]);

            res.send({user: user.username, token: token});
        } else {
            res.sendStatus(403)
        }
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
});

server.listen(4000);

//ERRO 500 NA TENTATIVA DE LOGIN