require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const { Pool } = require('pg');
const app  = require('./src/app');
const PORT = process.env.PORT || 3001;

async function iniciar() {
  // Roda migrations antes de abrir o servidor
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  try {
    const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await pool.query(sql);
    console.log('Migrations executadas com sucesso.');
  } catch (err) {
    console.error('Erro nas migrations:', err.message);
  } finally {
    await pool.end();
  }

  app.listen(PORT, () => {
    console.log(`API rodando na porta ${PORT}`);
    console.log('[ENV] STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.slice(0, 10) + '...' : 'NÃO DEFINIDA');
    console.log('[ENV] STRIPE_PRICE_BASICO:', process.env.STRIPE_PRICE_BASICO || 'NÃO DEFINIDA');
    console.log('[ENV] FRONTEND_URL:', process.env.FRONTEND_URL || 'NÃO DEFINIDA');
  });
}

iniciar();

process.on('unhandledRejection', (err) => console.error('Unhandled rejection:', err?.message || err));
process.on('uncaughtException',  (err) => console.error('Uncaught exception:',  err?.message || err));
