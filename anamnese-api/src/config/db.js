const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  options: '-c client_encoding=UTF8',
});

pool.on('error', (err) => console.error('Erro no pool do banco:', err));

module.exports = pool;
