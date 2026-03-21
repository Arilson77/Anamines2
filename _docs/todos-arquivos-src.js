// ============================================================
// src/config/db.js — pool de conexões com o PostgreSQL
// ============================================================
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

pool.on('error', (err) => console.error('Erro no pool do banco:', err));

module.exports = pool;


// ============================================================
// src/middleware/autenticar.js — valida JWT e injeta tenant
// ============================================================
const jwt  = require('jsonwebtoken');
const pool = require('../config/db');

async function autenticar(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer '))
    return res.status(401).json({ erro: 'Token ausente' });

  try {
    const payload = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);

    const client = await pool.connect();
    await client.query(`SET LOCAL app.tenant_id = '${payload.tenant_id}'`);

    req.usuario  = payload;
    req.dbClient = client;
    res.on('finish', () => client.release());

    next();
  } catch {
    res.status(401).json({ erro: 'Token inválido ou expirado' });
  }
}

module.exports = autenticar;


// ============================================================
// src/middleware/erros.js — tratamento global de erros
// ============================================================
function erros(err, req, res, next) {
  console.error(err.stack);
  const status  = err.status  || 500;
  const mensagem = err.message || 'Erro interno do servidor';
  res.status(status).json({ erro: mensagem });
}

module.exports = erros;


// ============================================================
// src/routes/auth.js
// ============================================================
const router = require('express').Router();
const ctrl   = require('../controllers/auth');

router.post('/login',   ctrl.login);
router.post('/cadastro', ctrl.cadastro);

module.exports = router;


// ============================================================
// src/controllers/auth.js
// ============================================================
const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');
const pool   = require('../config/db');

exports.login = async (req, res, next) => {
  const { email, senha } = req.body;
  try {
    const { rows } = await pool.query(
      'SELECT id, tenant_id, nome, senha_hash, papel FROM usuarios WHERE email = $1',
      [email]
    );
    if (!rows.length || !(await bcrypt.compare(senha, rows[0].senha_hash)))
      return res.status(401).json({ erro: 'Credenciais inválidas' });

    const { id, tenant_id, nome, papel } = rows[0];
    const token = jwt.sign({ usuario_id: id, tenant_id, papel },
      process.env.JWT_SECRET, { expiresIn: '8h' });

    res.json({ token, nome });
  } catch (err) { next(err); }
};

exports.cadastro = async (req, res, next) => {
  const { nome, email, senha } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Cria o tenant
    const { rows: [tenant] } = await client.query(
      'INSERT INTO tenants (nome, email) VALUES ($1, $2) RETURNING id',
      [nome, email]
    );

    // Cria o usuário admin vinculado ao tenant
    const hash = await bcrypt.hash(senha, 12);
    await client.query(
      `INSERT INTO usuarios (tenant_id, nome, email, senha_hash, papel)
       VALUES ($1, $2, $3, $4, 'admin')`,
      [tenant.id, nome, email, hash]
    );

    await client.query('COMMIT');
    res.status(201).json({ mensagem: 'Conta criada com sucesso' });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};


// ============================================================
// src/routes/pacientes.js
// ============================================================
const router      = require('express').Router();
const autenticar  = require('../middleware/autenticar');
const ctrl        = require('../controllers/pacientes');

router.use(autenticar);             // todas as rotas exigem login

router.get('/',     ctrl.listar);
router.get('/:id',  ctrl.buscar);
router.post('/',    ctrl.criar);
router.put('/:id',  ctrl.atualizar);
router.delete('/:id', ctrl.remover);

module.exports = router;


// ============================================================
// src/controllers/pacientes.js
// ============================================================
const lgpdService = require('../services/lgpd');

exports.listar = async (req, res, next) => {
  try {
    const { rows } = await req.dbClient.query(
      'SELECT id, nome, email, telefone, criado_em FROM pacientes ORDER BY nome'
    );
    res.json(rows);
  } catch (err) { next(err); }
};

exports.buscar = async (req, res, next) => {
  try {
    const { rows } = await req.dbClient.query(
      'SELECT * FROM pacientes WHERE id = $1',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ erro: 'Paciente não encontrado' });
    res.json(rows[0]);
  } catch (err) { next(err); }
};

exports.criar = async (req, res, next) => {
  const { nome, email, telefone, data_nascimento } = req.body;
  try {
    const { rows } = await req.dbClient.query(
      `INSERT INTO pacientes (tenant_id, nome, email, telefone, data_nascimento)
       VALUES ($1,$2,$3,$4,$5) RETURNING id, nome, criado_em`,
      [req.usuario.tenant_id, nome, email, telefone, data_nascimento]
    );
    // Registra log LGPD
    await lgpdService.log(req.dbClient, req.usuario, 'criou_paciente', `paciente:${rows[0].id}`);
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
};

exports.atualizar = async (req, res, next) => {
  const { nome, email, telefone } = req.body;
  try {
    const { rows } = await req.dbClient.query(
      `UPDATE pacientes SET nome=$1, email=$2, telefone=$3
       WHERE id=$4 RETURNING id, nome`,
      [nome, email, telefone, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ erro: 'Paciente não encontrado' });
    await lgpdService.log(req.dbClient, req.usuario, 'editou_paciente', `paciente:${rows[0].id}`);
    res.json(rows[0]);
  } catch (err) { next(err); }
};

exports.remover = async (req, res, next) => {
  try {
    await req.dbClient.query('DELETE FROM pacientes WHERE id = $1', [req.params.id]);
    await lgpdService.log(req.dbClient, req.usuario, 'removeu_paciente', `paciente:${req.params.id}`);
    res.status(204).send();
  } catch (err) { next(err); }
};


// ============================================================
// src/routes/fichas.js
// ============================================================
const router     = require('express').Router();
const autenticar = require('../middleware/autenticar');
const ctrl       = require('../controllers/fichas');

router.use(autenticar);

router.get('/',            ctrl.listar);
router.get('/:id',         ctrl.buscar);
router.post('/',           ctrl.criar);
router.put('/:id',         ctrl.atualizar);
router.get('/:id/exportar', ctrl.exportar); // PDF futuro

module.exports = router;


// ============================================================
// src/controllers/fichas.js
// ============================================================
const lgpdService = require('../services/lgpd');

exports.listar = async (req, res, next) => {
  try {
    const { rows } = await req.dbClient.query(
      `SELECT f.id, p.nome AS paciente, f.status, f.criado_em
       FROM fichas_anamnese f
       JOIN pacientes p ON p.id = f.paciente_id
       ORDER BY f.criado_em DESC`
    );
    res.json(rows);
  } catch (err) { next(err); }
};

exports.buscar = async (req, res, next) => {
  try {
    const { rows } = await req.dbClient.query(
      `SELECT f.*, p.nome AS paciente
       FROM fichas_anamnese f
       JOIN pacientes p ON p.id = f.paciente_id
       WHERE f.id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ erro: 'Ficha não encontrada' });
    await lgpdService.log(req.dbClient, req.usuario, 'visualizou_ficha', `ficha:${req.params.id}`);
    res.json(rows[0]);
  } catch (err) { next(err); }
};

exports.criar = async (req, res, next) => {
  const { paciente_id, dados } = req.body;
  try {
    const { rows } = await req.dbClient.query(
      `INSERT INTO fichas_anamnese (tenant_id, paciente_id, dados)
       VALUES ($1,$2,$3) RETURNING id, criado_em`,
      [req.usuario.tenant_id, paciente_id, JSON.stringify(dados)]
    );
    await lgpdService.log(req.dbClient, req.usuario, 'criou_ficha', `ficha:${rows[0].id}`);
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
};

exports.atualizar = async (req, res, next) => {
  const { dados, status } = req.body;
  try {
    const { rows } = await req.dbClient.query(
      `UPDATE fichas_anamnese SET dados=$1, status=$2
       WHERE id=$3 RETURNING id`,
      [JSON.stringify(dados), status, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ erro: 'Ficha não encontrada' });
    await lgpdService.log(req.dbClient, req.usuario, 'editou_ficha', `ficha:${rows[0].id}`);
    res.json(rows[0]);
  } catch (err) { next(err); }
};

exports.exportar = async (req, res, next) => {
  // Placeholder — implementar geração de PDF na próxima etapa
  res.json({ mensagem: 'Exportação de PDF em breve' });
};


// ============================================================
// src/services/lgpd.js — log de auditoria LGPD
// ============================================================
exports.log = async (dbClient, usuario, acao, recurso) => {
  await dbClient.query(
    `INSERT INTO logs_acesso (tenant_id, usuario_id, acao, recurso)
     VALUES ($1, $2, $3, $4)`,
    [usuario.tenant_id, usuario.usuario_id, acao, recurso]
  );
};

exports.registrarConsentimento = async (dbClient, tenantId, pacienteId, ip) => {
  await dbClient.query(
    `INSERT INTO consentimentos_lgpd (tenant_id, paciente_id, ip_origem)
     VALUES ($1, $2, $3)`,
    [tenantId, pacienteId, ip]
  );
  await dbClient.query(
    'UPDATE pacientes SET consentimento_lgpd = true WHERE id = $1',
    [pacienteId]
  );
};


// ============================================================
// src/services/email.js — notificações (sem dados sensíveis)
// ============================================================
// npm install nodemailer
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   process.env.SMTP_PORT || 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

exports.notificarNovaFicha = async (emailTerapeuta, nomePaciente) => {
  await transporter.sendMail({
    from:    `"Anamnese App" <${process.env.SMTP_USER}>`,
    to:      emailTerapeuta,
    subject: 'Nova ficha de anamnese recebida',
    text:    `Uma nova ficha de ${nomePaciente} foi recebida. Acesse o painel para visualizar.`,
    // Nunca enviar dados clínicos por e-mail!
  });
};
