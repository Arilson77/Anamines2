// Testa o fluxo de consentimento LGPD
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../app');
const { limparBanco } = require('./helpers');

let token;
let pacienteId;

beforeEach(async () => {
  await limparBanco();

  await request(app).post('/auth/cadastro').send({
    nome: 'Dra. LGPD',
    email: 'lgpd@clinica.com',
    senha: 'Senha@123',
  });
  const login = await request(app).post('/auth/login').send({
    email: 'lgpd@clinica.com',
    senha: 'Senha@123',
  });
  token = login.body.token;

  // Cria um paciente para usar nos testes
  const criacao = await request(app)
    .post('/pacientes')
    .set('Authorization', `Bearer ${token}`)
    .send({ nome: 'Paciente LGPD', email: 'paciente-lgpd@teste.com' });

  pacienteId = criacao.body.id;
});

describe('GET /pacientes/:id/link-consentimento', () => {
  it('gera um link de consentimento com token JWT válido', async () => {
    const res = await request(app)
      .get(`/pacientes/${pacienteId}/link-consentimento`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('link');
    expect(res.body.link).toContain('/consentimento/');
  });

  it('o token JWT embutido no link tem o payload correto', async () => {
    const res = await request(app)
      .get(`/pacientes/${pacienteId}/link-consentimento`)
      .set('Authorization', `Bearer ${token}`);

    const linkToken = res.body.link.split('/consentimento/')[1];
    const payload = jwt.verify(linkToken, process.env.JWT_SECRET);

    expect(payload).toMatchObject({
      paciente_id: pacienteId,
      tipo: 'lgpd_consent',
    });
    expect(payload).toHaveProperty('tenant_id');
  });

  it('o token de consentimento expira em até 7 dias', async () => {
    const res = await request(app)
      .get(`/pacientes/${pacienteId}/link-consentimento`)
      .set('Authorization', `Bearer ${token}`);

    const linkToken = res.body.link.split('/consentimento/')[1];
    const payload = jwt.decode(linkToken);
    const setesDiasEmSegundos = 7 * 24 * 60 * 60;

    expect(payload.exp - payload.iat).toBeLessThanOrEqual(setesDiasEmSegundos);
  });

  it('retorna 404 para paciente inexistente', async () => {
    const idFalso = '00000000-0000-0000-0000-000000000000';
    const res = await request(app)
      .get(`/pacientes/${idFalso}/link-consentimento`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it('retorna 401 sem autenticação', async () => {
    const res = await request(app)
      .get(`/pacientes/${pacienteId}/link-consentimento`);

    expect(res.status).toBe(401);
  });
});
