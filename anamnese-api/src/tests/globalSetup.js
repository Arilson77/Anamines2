// Executa uma vez antes de todos os testes
// Cria as tabelas no banco de teste
const { execSync } = require('child_process');
const path = require('path');

module.exports = async () => {
  const schemaPath = path.resolve(__dirname, '../../schema.sql');
  const dbUrl = process.env.DATABASE_URL_TEST;

  if (!dbUrl) {
    throw new Error(
      'DATABASE_URL_TEST não configurada. Crie um banco de dados de teste e configure a variável no .env'
    );
  }

  // Garante que as tabelas existem no banco de teste
  try {
    execSync(`psql "${dbUrl}" -f "${schemaPath}" 2>&1`, { stdio: 'pipe' });
  } catch {
    // Ignora erros de "já existe" — tabelas podem já estar criadas
  }
};
