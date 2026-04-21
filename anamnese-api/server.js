require('dotenv').config();
const app  = require('./src/app');
const PORT = process.env.PORT || 3001;

async function iniciar() {
  app.listen(PORT, () => {
    console.log(`API rodando na porta ${PORT}`);
  });
}

iniciar();

process.on('unhandledRejection', (err) => console.error('Unhandled rejection:', err?.message || err));
process.on('uncaughtException',  (err) => console.error('Uncaught exception:',  err?.message || err));
