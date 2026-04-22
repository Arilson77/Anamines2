require('dotenv').config();
const { Pool } = require('pg');
const fs   = require('fs');
const path = require('path');

// Divide o SQL respeitando blocos $$ (PL/pgSQL)
function splitSQL(sql) {
  const statements = [];
  let current    = '';
  let inDollar   = false;

  for (let i = 0; i < sql.length; i++) {
    // Detecta abertura/fechamento de $$
    if (sql[i] === '$' && sql[i + 1] === '$') {
      inDollar  = !inDollar;
      current  += '$$';
      i++;
      continue;
    }

    current += sql[i];

    // Divide apenas em ';' fora de blocos dollar-quoted
    if (sql[i] === ';' && !inDollar) {
      const stmt = current.trim();
      if (stmt && stmt !== ';') statements.push(stmt);
      current = '';
    }
  }

  const resto = current.trim();
  if (resto && resto !== ';') statements.push(resto);

  return statements.filter(s => s.replace(/--.*$/gm, '').trim().length > 0);
}

async function migrate() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  const sql        = fs.readFileSync(path.join(__dirname, '..', 'schema.sql'), 'utf8');
  const statements = splitSQL(sql);

  console.log(`Migração: ${statements.length} statements encontrados.`);

  const client = await pool.connect();
  try {
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      try {
        await client.query(stmt);
        console.log(`[${i + 1}/${statements.length}] OK`);
      } catch (err) {
        console.error(`\n[${i + 1}/${statements.length}] ERRO: ${err.message}`);
        console.error(`SQL: ${stmt.slice(0, 300)}\n`);
        process.exit(1);
      }
    }
    console.log('\nMigração concluída com sucesso.');
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
