// Executa uma vez após todos os testes
// Fecha o pool de conexões para o Jest terminar limpo
module.exports = async () => {
  const pool = require('../config/db');
  await pool.end();
};
