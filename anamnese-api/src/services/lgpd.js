exports.log = async (dbClient, usuario, acao, recurso) => {
  await dbClient.query(
    `INSERT INTO logs_acesso (tenant_id, usuario_id, acao, recurso)
     VALUES ($1, $2, $3, $4)`,
    [usuario.tenant_id, usuario.usuario_id, acao, recurso]
  );
};

exports.registrarConsentimento = async (dbClient, tenantId, pacienteId, ip) => {
  await dbClient.query(
    `INSERT INTO consentimentos_lgpd (tenant_id, paciente_id, ip_origem)
     VALUES ($1, $2, $3)`,
    [tenantId, pacienteId, ip]
  );
  await dbClient.query(
    'UPDATE pacientes SET consentimento_lgpd = true WHERE id = $1',
    [pacienteId]
  );
};
