const PDFDocument = require('pdfkit');

exports.pdf = async (req, res, next) => {
  const client = req.dbClient;
  try {
    const [porStatus, porEspecialidade, porMes, totais] = await Promise.all([
      client.query(`SELECT status, COUNT(*)::int AS total FROM consultas WHERE data_hora >= NOW() - INTERVAL '90 days' GROUP BY status ORDER BY total DESC`),
      client.query(`SELECT COALESCE(e.nome,'Sem especialidade') AS especialidade, COUNT(*)::int AS total FROM consultas c LEFT JOIN especialidades e ON e.id = c.especialidade_id WHERE c.data_hora >= NOW() - INTERVAL '90 days' GROUP BY e.nome ORDER BY total DESC LIMIT 8`),
      client.query(`SELECT TO_CHAR(DATE_TRUNC('month', data_hora), 'Mon/YY') AS mes, COUNT(*)::int AS total FROM consultas WHERE data_hora >= NOW() - INTERVAL '6 months' GROUP BY mes, DATE_TRUNC('month', data_hora) ORDER BY DATE_TRUNC('month', data_hora)`),
      client.query(`SELECT (SELECT COUNT(*)::int FROM pacientes) AS total_pacientes, (SELECT COUNT(*)::int FROM consultas WHERE data_hora >= DATE_TRUNC('month', NOW())) AS consultas_mes, (SELECT COUNT(*)::int FROM consultas WHERE status='realizada' AND data_hora >= NOW() - INTERVAL '30 days') AS realizadas_30d, (SELECT COUNT(*)::int FROM consultas WHERE status='cancelada' AND data_hora >= NOW() - INTERVAL '30 days') AS canceladas_30d, (SELECT COUNT(*)::int FROM fichas_anamnese) AS total_fichas`),
    ]);

    const t = totais.rows[0];
    const taxa = t.realizadas_30d + t.canceladas_30d > 0
      ? Math.round((t.realizadas_30d / (t.realizadas_30d + t.canceladas_30d)) * 100) : 0;
    const geradoEm = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'full', timeStyle: 'short' });

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="relatorio-${new Date().toISOString().slice(0,10)}.pdf"`);
    doc.pipe(res);

    // Cabeçalho
    doc.fontSize(20).fillColor('#0f766e').text('Relatório Clínico', { align: 'center' });
    doc.fontSize(10).fillColor('#6b7280').text(`Gerado em ${geradoEm}`, { align: 'center' });
    doc.moveDown(1.5);

    // KPIs
    doc.fontSize(13).fillColor('#111827').text('Resumo Geral');
    doc.moveDown(0.4);
    const kpis = [
      ['Total de pacientes', t.total_pacientes],
      ['Consultas este mês', t.consultas_mes],
      ['Realizadas (30d)', t.realizadas_30d],
      ['Canceladas (30d)', t.canceladas_30d],
      ['Taxa de realização', `${taxa}%`],
      ['Total de fichas', t.total_fichas],
    ];
    for (const [label, valor] of kpis) {
      doc.fontSize(10).fillColor('#6b7280').text(label, { continued: true });
      doc.fillColor('#0f766e').text(` ${valor}`, { align: 'right' });
    }

    doc.moveDown(1.2);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e5e7eb').stroke();
    doc.moveDown(0.8);

    // Consultas por mês
    doc.fontSize(13).fillColor('#111827').text('Consultas por mês (últimos 6 meses)');
    doc.moveDown(0.4);
    for (const row of porMes.rows) {
      const pct = porMes.rows.length ? row.total / Math.max(...porMes.rows.map(r => r.total)) : 0;
      const barW = Math.round(pct * 300);
      doc.fontSize(9).fillColor('#6b7280').text(row.mes, 50, doc.y, { width: 60, continued: true });
      doc.rect(120, doc.y - 2, barW, 10).fill('#14b8a6');
      doc.fillColor('#374151').text(` ${row.total}`, 120 + barW + 6, doc.y - 11);
      doc.moveDown(0.6);
    }

    doc.moveDown(0.8);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e5e7eb').stroke();
    doc.moveDown(0.8);

    // Por especialidade
    doc.fontSize(13).fillColor('#111827').text('Por especialidade (últimos 90 dias)');
    doc.moveDown(0.4);
    for (const row of porEspecialidade.rows) {
      doc.fontSize(10).fillColor('#374151').text(`${row.especialidade}`, { continued: true });
      doc.fillColor('#0f766e').text(` ${row.total}`, { align: 'right' });
    }

    doc.moveDown(0.8);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e5e7eb').stroke();
    doc.moveDown(0.8);

    // Status
    doc.fontSize(13).fillColor('#111827').text('Status das consultas (últimos 90 dias)');
    doc.moveDown(0.4);
    const STATUS_PT = { agendada:'Agendada', confirmada:'Confirmada', realizada:'Realizada', cancelada:'Cancelada', faltou:'Faltou' };
    for (const row of porStatus.rows) {
      doc.fontSize(10).fillColor('#374151').text(STATUS_PT[row.status] ?? row.status, { continued: true });
      doc.fillColor('#0f766e').text(` ${row.total}`, { align: 'right' });
    }

    doc.end();
  } catch (err) { next(err); }
};

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
