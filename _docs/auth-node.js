// ============================================================
// Dependências:  npm install express jsonwebtoken bcrypt pg
// ============================================================

const express = require('express');
const jwt     = require('jsonwebtoken');
const bcrypt  = require('bcrypt');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

// Pool de conexões com o PostgreSQL
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const JWT_SECRET = process.env.JWT_SECRET; // guarde no .env, nunca no código

// ============================================================
// ROTA DE LOGIN
// POST /auth/login  { email, senha }
// ============================================================
app.post('/auth/login', async (req, res) => {
  const { email, senha } = req.body;

  try {
    // 1. Busca o usuário pelo e-mail (sem RLS — é a rota pública)
    const { rows } = await pool.query(
      'SELECT id, tenant_id, nome, senha_hash, papel FROM usuarios WHERE email = $1',
      [email]
    );

    if (!rows.length) {
      return res.status(401).json({ erro: 'Credenciais inválidas' });
    }

    const usuario = rows[0];

    // 2. Compara a senha com o hash salvo
    const senhaOk = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaOk) {
      return res.status(401).json({ erro: 'Credenciais inválidas' });
    }

    // 3. Gera o JWT com tenant_id no payload
    const token = jwt.sign(
      {
        usuario_id: usuario.id,
        tenant_id:  usuario.tenant_id,   // <-- a chave de tudo
        papel:      usuario.papel,
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ token, nome: usuario.nome });

  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// ============================================================
// MIDDLEWARE DE AUTENTICAÇÃO
// Decodifica o JWT e injeta tenant_id na conexão do banco
// ============================================================
async function autenticar(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Token ausente' });
  }

  const token = header.split(' ')[1];

  try {
    // 1. Verifica e decodifica o token
    const payload = jwt.verify(token, JWT_SECRET);

    // 2. Pega uma conexão do pool
    const client = await pool.connect();

    // 3. Injeta o tenant_id na sessão do PostgreSQL
    //    O RLS vai usar isso automaticamente em todas as queries
    await client.query(
      `SET LOCAL app.tenant_id = '${payload.tenant_id}'`
    );

    // 4. Disponibiliza no request para as rotas usarem
    req.usuario  = payload;
    req.dbClient = client;   // conexão já "temperada" com o tenant

    // 5. Libera a conexão ao terminar a requisição
    res.on('finish', () => client.release());

    next();

  } catch (err) {
    return res.status(401).json({ erro: 'Token inválido ou expirado' });
  }
}

// ============================================================
// EXEMPLO DE ROTA PROTEGIDA
// GET /pacientes  — só retorna pacientes do tenant logado
// ============================================================
app.get('/pacientes', autenticar, async (req, res) => {
  try {
    // O RLS garante que só vêm pacientes do tenant_id correto
    // Não precisa de WHERE tenant_id = ? — o banco já filtra!
    const { rows } = await req.dbClient.query(
      'SELECT id, nome, email, criado_em FROM pacientes ORDER BY criado_em DESC'
    );

    res.json(rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao buscar pacientes' });
  }
});

// ============================================================
// EXEMPLO: Salvar ficha de anamnese
// POST /fichas  { paciente_id, dados }
// ============================================================
app.post('/fichas', autenticar, async (req, res) => {
  const { paciente_id, dados } = req.body;

  try {
    const { rows } = await req.dbClient.query(
      `INSERT INTO fichas_anamnese (tenant_id, paciente_id, dados)
       VALUES ($1, $2, $3)
       RETURNING id, criado_em`,
      [req.usuario.tenant_id, paciente_id, JSON.stringify(dados)]
    );

    // Registra no log de acesso (LGPD)
    await req.dbClient.query(
      `INSERT INTO logs_acesso (tenant_id, usuario_id, acao, recurso)
       VALUES ($1, $2, 'criou_ficha', $3)`,
      [req.usuario.tenant_id, req.usuario.usuario_id, `ficha:${rows[0].id}`]
    );

    res.status(201).json(rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao salvar ficha' });
  }
});

app.listen(3001, () => console.log('API rodando na porta 3001'));
