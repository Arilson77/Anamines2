require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function migrate() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  const sql = fs.readFileSync(path.join(__dirname, '..', 'schema.sql'), 'utf8');

  try {
    await pool.query(sql);
    console.log('Migração concluída com sucesso.');
  } catch (err) {
    console.error('Erro na migração:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
