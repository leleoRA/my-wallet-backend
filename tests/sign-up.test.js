import app from "../src/app.js";
import connection from '../src/database.js';
import supertest from 'supertest';

/*beforeEach(async () => {
    await connection.query(`DELETE FROM users`);
});*/

describe("POST /sign-up", () => {
    it("returns 201 for valid params", async () => {
        const body = {
          email: 'adriano.teste@gmail.com',
          password: '123456',
          username: 'Adriano Teste'
        };
        const result = await supertest(app).post("/sign-up").send(body);
        const status = result.status;
        expect(status).toEqual(201);
        await connection.query(`DELETE FROM users WHERE username='Adriano Teste'`);
    });

    it("returns 400 for invalid email", async () => {
        const body = {
            email: '',
            password: '123456',
            username: 'Adriano Teste'
        };
        const result = await supertest(app).post("/sign-up").send(body);
        const status = result.status;
        expect(status).toEqual(400);
        await connection.query(`DELETE FROM users WHERE username='Adriano Teste'`);
    });

    it("returns 400 for invalid password", async () => {
        const body = {
            email: 'adriano.teste@gmail.com',
            password: '',
            username: 'Adriano Teste'
        };
        const result = await supertest(app).post("/sign-up").send(body);
        const status = result.status;
        expect(status).toEqual(400);
        await connection.query(`DELETE FROM users WHERE username='Adriano Teste'`);
    });

    it("returns 400 for invalid username", async () => {
        const body = {
            email: 'adriano.teste@gmail.com',
            password: '123456',
            username: ''
        };
        const result = await supertest(app).post("/sign-up").send(body);
        const status = result.status;
        expect(status).toEqual(400);
        await connection.query(`DELETE FROM users WHERE email='adriano.teste@gmail.com'`);
    });

    it("returns 409 for duplicated email", async () => {
        const body = {
            email: 'adriano.teste@gmail.com',
            password: '123456',
            username: 'Adriano Teste'
        };
        // a primeira inserção vai funcionar
        const firstTry = await supertest(app).post("/sign-up").send(body);
        expect(firstTry.status).toEqual(201);
        // se tentarmos criar um post igual, deve retornar 409
        const secondTry = await supertest(app).post("/sign-up").send(body);
        expect(secondTry.status).toEqual(409);
        await connection.query(`DELETE FROM users WHERE username='Adriano Teste'`);
    });
});

afterAll(async () => {
    /*await connection.query('DELETE FROM users');
    await connection.query(`
        INSERT INTO users (username, email, password)
        VALUES ('lalala', 'lelele', 'lilili')
    `);*/
    connection.end();
});