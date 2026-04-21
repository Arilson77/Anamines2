const bcrypt   = require('bcrypt');
const jwt      = require('jsonwebtoken');
const pool     = require('../config/db');
const logsnag  = require('../config/logsnag');
const emailSvc = require('../services/email');

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
    const token = jwt.sign(
      { usuario_id: id, tenant_id, papel },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ token, nome });
  } catch (err) { next(err); }
};

exports.cadastro = async (req, res, next) => {
  const { nome, email, senha } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: [tenant] } = await client.query(
      'INSERT INTO tenants (nome, email) VALUES ($1, $2) RETURNING id',
      [nome, email]
    );

    const hash = await bcrypt.hash(senha, 12);
    await client.query(
      `INSERT INTO usuarios (tenant_id, nome, email, senha_hash, papel)
       VALUES ($1, $2, $3, $4, 'admin')`,
      [tenant.id, nome, email, hash]
    );

    await client.query('COMMIT');
    await logsnag.track({
      channel: 'usuarios',
      event:   'Novo cadastro',
      description: `${nome} (${email})`,
      icon:    '🎉',
      notify:  true,
    });
    res.status(201).json({ mensagem: 'Conta criada com sucesso' });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

exports.esqueceuSenha = async (req, res, next) => {
  const { email } = req.body;
  try {
    const { rows } = await pool.query(
      'SELECT id, nome FROM usuarios WHERE email = $1',
      [email]
    );
    // Responde igual mesmo se e-mail não existir (evita enumeração de usuários)
    if (rows.length) {
      const { id, nome } = rows[0];
      const token = jwt.sign(
        { usuario_id: id, tipo: 'reset_senha' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      const base = process.env.FRONTEND_URL || 'http://localhost:3000';
      await emailSvc.enviarRedefinicaoSenha(email, nome, `${base}/redefinir-senha/${token}`);
    }
    res.json({ mensagem: 'Se o e-mail existir, você receberá as instruções em breve.' });
  } catch (err) { next(err); }
};

exports.redefinirSenha = async (req, res, next) => {
  const { token, nova_senha } = req.body;
  try {
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(400).json({ erro: 'Link inválido ou expirado.' });
    }

    if (payload.tipo !== 'reset_senha')
      return res.status(400).json({ erro: 'Link inválido.' });

    const hash = await bcrypt.hash(nova_senha, 12);
    const { rowCount } = await pool.query(
      'UPDATE usuarios SET senha_hash = $1 WHERE id = $2',
      [hash, payload.usuario_id]
    );
    if (!rowCount) return res.status(404).json({ erro: 'Usuário não encontrado.' });

    res.json({ mensagem: 'Senha redefinida com sucesso.' });
  } catch (err) { next(err); }
};
