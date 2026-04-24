exports.resumo = async (req, res, next) => {
  const client = req.dbClient;
  try {
    const [porStatus, porEspecialidade, porMes, topPacientes, totais] = await Promise.all([
      // Consultas por status (últimos 90 dias)
      client.query(`
        SELECT status, COUNT(*)::int AS total
        FROM consultas
        WHERE data_hora >= NOW() - INTERVAL '90 days'
        GROUP BY status ORDER BY total DESC
      `),
      // Consultas por especialidade (últimos 90 dias)
      client.query(`
        SELECT COALESCE(e.nome, 'Sem especialidade') AS especialidade,
               e.cor,
               COUNT(*)::int AS total
        FROM consultas c
        LEFT JOIN especialidades e ON e.id = c.especialidade_id
        WHERE c.data_hora >= NOW() - INTERVAL '90 days'
        GROUP BY e.nome, e.cor ORDER BY total DESC LIMIT 8
      `),
      // Consultas por mês (últimos 6 meses)
      client.query(`
        SELECT TO_CHAR(DATE_TRUNC('month', data_hora), 'Mon/YY') AS mes,
               DATE_TRUNC('month', data_hora) AS mes_ordem,
               COUNT(*)::int AS total
        FROM consultas
        WHERE data_hora >= NOW() - INTERVAL '6 months'
        GROUP BY mes, mes_ordem ORDER BY mes_ordem ASC
      `),
      // Top 5 pacientes com mais consultas
      client.query(`
        SELECT p.nome, COUNT(*)::int AS total
        FROM consultas c
        JOIN pacientes p ON p.id = c.paciente_id
        GROUP BY p.nome ORDER BY total DESC LIMIT 5
      `),
      // Totais gerais
      client.query(`
        SELECT
          (SELECT COUNT(*)::int FROM pacientes) AS total_pacientes,
          (SELECT COUNT(*)::int FROM consultas WHERE data_hora >= DATE_TRUNC('month', NOW())) AS consultas_mes,
          (SELECT COUNT(*)::int FROM consultas WHERE status = 'realizada' AND data_hora >= NOW() - INTERVAL '30 days') AS realizadas_30d,
          (SELECT COUNT(*)::int FROM consultas WHERE status = 'cancelada' AND data_hora >= NOW() - INTERVAL '30 days') AS canceladas_30d,
          (SELECT COUNT(*)::int FROM fichas_anamnese) AS total_fichas,
          (SELECT COUNT(*)::int FROM pacientes WHERE consentimento_lgpd = false) AS lgpd_pendente
      `),
    ]);

    res.json({
      totais:          totais.rows[0],
      porStatus:       porStatus.rows,
      porEspecialidade: porEspecialidade.rows,
      porMes:          porMes.rows,
      topPacientes:    topPacientes.rows,
    });
  } catch (err) { next(err); }
};
