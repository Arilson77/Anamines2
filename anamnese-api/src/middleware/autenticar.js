const jwt  = require('jsonwebtoken');
const pool = require('../config/db');

async function autenticar(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer '))
    return res.status(401).json({ erro: 'Token ausente' });

  try {
    const payload = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);

    const client = await pool.connect();
    // Usa set_config para evitar SQL injection ao injetar o tenant_id
    await client.query('SELECT set_config($1, $2, true)', ['app.tenant_id', payload.tenant_id]);

    req.usuario  = payload;
    req.dbClient = client;
    res.on('finish', () => client.release());

    next();
  } catch {
    res.status(401).json({ erro: 'Token inválido ou expirado' });
  }
}

module.exports = autenticar;
