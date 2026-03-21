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
    res.status(201).json({ mensagem: 'Conta criada com sucesso' });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};
