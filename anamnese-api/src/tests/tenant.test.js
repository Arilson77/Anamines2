// Testa o isolamento de dados entre tenants (RLS)
const request = require('supertest');
const app = require('../app');
const { limparBanco, criarTenant } = require('./helpers');

let tokenA, tokenB;

beforeEach(async () => {
  await limparBanco();

  // Cria dois tenants independentes
  await request(app).post('/auth/cadastro').send({
    nome: 'Clínica A',
    email: 'clinica-a@teste.com',
    senha: 'Senha@123',
  });
  await request(app).post('/auth/cadastro').send({
    nome: 'Clínica B',
    email: 'clinica-b@teste.com',
    senha: 'Senha@123',
  });

  const resA = await request(app).post('/auth/login').send({ email: 'clinica-a@teste.com', senha: 'Senha@123' });
  const resB = await request(app).post('/auth/login').send({ email: 'clinica-b@teste.com', senha: 'Senha@123' });

  tokenA = resA.body.token;
  tokenB = resB.body.token;
});

describe('Isolamento de tenant — Pacientes', () => {
  it('tenant A não vê pacientes do tenant B', async () => {
    // Tenant A cria um paciente
    await request(app)
      .post('/pacientes')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ nome: 'Paciente da Clínica A', email: 'paciente-a@teste.com' });

    // Tenant B lista seus pacientes — não deve ver o paciente de A
    const res = await request(app)
      .get('/pacientes')
      .set('Authorization', `Bearer ${tokenB}`);

    expect(res.status).toBe(200);
    const nomes = res.body.map(p => p.nome);
    expect(nomes).not.toContain('Paciente da Clínica A');
  });

  it('tenant A vê apenas seus próprios pacientes', async () => {
    await request(app)
      .post('/pacientes')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ nome: 'Paciente da Clínica A', email: 'pa@teste.com' });

    await request(app)
      .post('/pacientes')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ nome: 'Paciente da Clínica B', email: 'pb@teste.com' });

    const res = await request(app)
      .get('/pacientes')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    const nomes = res.body.map(p => p.nome);
    expect(nomes).toContain('Paciente da Clínica A');
    expect(nomes).not.toContain('Paciente da Clínica B');
  });
});

describe('Isolamento de tenant — acesso por ID', () => {
  it('tenant B não acessa paciente criado pelo tenant A via ID', async () => {
    // A cria paciente e captura o ID
    const criacao = await request(app)
      .post('/pacientes')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ nome: 'Exclusivo A', email: 'exclusivo-a@teste.com' });

    const idPacienteA = criacao.body.id;

    // B tenta acessar pelo ID — deve receber 404 (RLS oculta o registro)
    const res = await request(app)
      .get(`/pacientes/${idPacienteA}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(res.status).toBe(404);
  });
});
