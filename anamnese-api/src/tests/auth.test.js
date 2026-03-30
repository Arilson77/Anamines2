const request = require('supertest');
const app = require('../app');
const { limparBanco } = require('./helpers');

beforeEach(limparBanco);

describe('POST /auth/cadastro', () => {
  it('cria um novo tenant e retorna 201', async () => {
    const res = await request(app).post('/auth/cadastro').send({
      nome: 'Dra. Ana',
      email: 'ana@clinica.com',
      senha: 'Senha@123',
    });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ mensagem: expect.any(String) });
  });

  it('retorna erro ao cadastrar e-mail duplicado', async () => {
    const dados = { nome: 'Dra. Ana', email: 'ana@clinica.com', senha: 'Senha@123' };
    await request(app).post('/auth/cadastro').send(dados);

    const res = await request(app).post('/auth/cadastro').send(dados);
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

describe('POST /auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/auth/cadastro').send({
      nome: 'Dra. Ana',
      email: 'ana@clinica.com',
      senha: 'Senha@123',
    });
  });

  it('retorna token JWT ao autenticar com credenciais corretas', async () => {
    const res = await request(app).post('/auth/login').send({
      email: 'ana@clinica.com',
      senha: 'Senha@123',
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.token).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/); // formato JWT
    expect(res.body).toHaveProperty('nome', 'Dra. Ana');
  });

  it('retorna 401 com senha incorreta', async () => {
    const res = await request(app).post('/auth/login').send({
      email: 'ana@clinica.com',
      senha: 'senha_errada',
    });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('erro');
  });

  it('retorna 401 com e-mail inexistente', async () => {
    const res = await request(app).post('/auth/login').send({
      email: 'naoexiste@clinica.com',
      senha: 'Senha@123',
    });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('erro');
  });
});

describe('Rotas protegidas sem token', () => {
  it('GET /pacientes retorna 401 sem token', async () => {
    const res = await request(app).get('/pacientes');
    expect(res.status).toBe(401);
  });

  it('GET /fichas retorna 401 sem token', async () => {
    const res = await request(app).get('/fichas');
    expect(res.status).toBe(401);
  });
});
