const pool = require('../config/db');

/**
 * Limpa as tabelas de teste na ordem correta (respeitando FK constraints).
 * Chame no beforeEach de cada suite para garantir isolamento entre testes.
 */
async function limparBanco() {
  await pool.query(`
    DELETE FROM logs_acesso;
    DELETE FROM consentimentos_lgpd;
    DELETE FROM fichas_anamnese;
    DELETE FROM pacientes;
    DELETE FROM usuarios;
    DELETE FROM tenants;
  `);
}

/**
 * Cria um tenant + usuário admin e retorna { tenantId, usuarioId }.
 */
async function criarTenant({ nome = 'Tenant Teste', email = 'tenant@teste.com', senha = 'Senha@123' } = {}) {
  const bcrypt = require('bcrypt');
  const { rows: [tenant] } = await pool.query(
    "INSERT INTO tenants (nome, email) VALUES ($1, $2) RETURNING id",
    [nome, email]
  );
  const hash = await bcrypt.hash(senha, 10);
  const { rows: [usuario] } = await pool.query(
    "INSERT INTO usuarios (tenant_id, nome, email, senha_hash, papel) VALUES ($1,$2,$3,$4,'admin') RETURNING id",
    [tenant.id, nome, email, hash]
  );
  return { tenantId: tenant.id, usuarioId: usuario.id };
}

module.exports = { limparBanco, criarTenant };
