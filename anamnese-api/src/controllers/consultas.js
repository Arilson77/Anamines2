exports.listar = async (req, res, next) => {
  try {
    const { inicio, fim, profissional_id } = req.query;
    let q = `
      SELECT c.*,
        p.nome AS paciente_nome, p.telefone AS paciente_telefone,
        u.nome AS profissional_nome,
        e.nome AS especialidade_nome, e.cor AS especialidade_cor,
        pr.nome AS procedimento_nome
      FROM consultas c
      JOIN pacientes p ON p.id = c.paciente_id
      JOIN usuarios u ON u.id = c.profissional_id
      LEFT JOIN especialidades e ON e.id = c.especialidade_id
      LEFT JOIN procedimentos pr ON pr.id = c.procedimento_id
      WHERE 1=1`;
    const params = [];
    let i = 1;
    if (inicio)          { q += ` AND c.data_hora >= $${i++}`; params.push(inicio); }
    if (fim)             { q += ` AND c.data_hora <= $${i++}`; params.push(fim); }
    if (profissional_id) { q += ` AND c.profissional_id = $${i++}`; params.push(profissional_id); }
    q += ' ORDER BY c.data_hora ASC';
    const { rows } = await req.dbClient.query(q, params);
    res.json(rows);
  } catch (err) { next(err); }
};

exports.buscar = async (req, res, next) => {
  try {
    const { rows: [consulta] } = await req.dbClient.query(`
      SELECT c.*,
        p.nome AS paciente_nome, p.email AS paciente_email, p.telefone AS paciente_telefone,
        u.nome AS profissional_nome,
        e.nome AS especialidade_nome,
        pr.nome AS procedimento_nome, pr.instrucoes_preparacao
      FROM consultas c
      JOIN pacientes p ON p.id = c.paciente_id
      JOIN usuarios u ON u.id = c.profissional_id
      LEFT JOIN especialidades e ON e.id = c.especialidade_id
      LEFT JOIN procedimentos pr ON pr.id = c.procedimento_id
      WHERE c.id = $1
    `, [req.params.id]);
    if (!consulta) return res.status(404).json({ erro: 'Consulta não encontrada' });
    res.json(consulta);
  } catch (err) { next(err); }
};

exports.criar = async (req, res, next) => {
  const {
    paciente_id, profissional_id, especialidade_id, procedimento_id,
    data_hora, duracao_minutos, requer_preparacao, data_hora_preparacao, observacoes,
  } = req.body;
  const client = req.dbClient;
  try {
    let antecedencia_aviso_horas = 48;
    if (procedimento_id) {
      const { rows: [proc] } = await client.query(
        'SELECT antecedencia_aviso_horas FROM procedimentos WHERE id=$1', [procedimento_id]
      );
      if (proc) antecedencia_aviso_horas = proc.antecedencia_aviso_horas;
    }

    const { rows: [consulta] } = await client.query(`
      INSERT INTO consultas
        (tenant_id, paciente_id, profissional_id, especialidade_id, procedimento_id,
         data_hora, duracao_minutos, requer_preparacao, data_hora_preparacao, observacoes)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *
    `, [
      req.usuario.tenant_id,
      paciente_id,
      profissional_id || req.usuario.usuario_id,
      especialidade_id || null,
      procedimento_id  || null,
      data_hora,
      duracao_minutos  || 50,
      requer_preparacao    || false,
      data_hora_preparacao || null,
      observacoes          || null,
    ]);

    // Agenda mensagens automáticas
    const dataHora = new Date(data_hora);
    const mensagens = [];

    if (requer_preparacao && data_hora_preparacao) {
      const dataPrep = new Date(data_hora_preparacao);
      mensagens.push({
        tipo:      'aviso_preparacao',
        enviar_em: new Date(dataPrep.getTime() - antecedencia_aviso_horas * 3600000),
      });
      mensagens.push({
        tipo:      'confirmacao_consulta',
        enviar_em: new Date(dataPrep.getTime() - 24 * 3600000),
      });
    } else {
      mensagens.push({
        tipo:      'confirmacao_consulta',
        enviar_em: new Date(dataHora.getTime() - 24 * 3600000),
      });
    }

    for (const { tipo, enviar_em } of mensagens) {
      await client.query(
        'INSERT INTO mensagens_fila (tenant_id, consulta_id, tipo, canal, enviar_em) VALUES ($1,$2,$3,$4,$5)',
        [req.usuario.tenant_id, consulta.id, tipo, 'email', enviar_em]
      );
    }

    res.status(201).json(consulta);
  } catch (err) { next(err); }
};

exports.atualizar = async (req, res, next) => {
  const { status, data_hora, duracao_minutos, observacoes, especialidade_id, procedimento_id, requer_preparacao, data_hora_preparacao } = req.body;
  try {
    const { rows: [consulta] } = await req.dbClient.query(`
      UPDATE consultas SET
        status               = COALESCE($1, status),
        data_hora            = COALESCE($2, data_hora),
        duracao_minutos      = COALESCE($3, duracao_minutos),
        observacoes          = COALESCE($4, observacoes),
        especialidade_id     = COALESCE($5, especialidade_id),
        procedimento_id      = COALESCE($6, procedimento_id),
        requer_preparacao    = COALESCE($7, requer_preparacao),
        data_hora_preparacao = COALESCE($8, data_hora_preparacao)
      WHERE id=$9 RETURNING *
    `, [status, data_hora, duracao_minutos, observacoes, especialidade_id, procedimento_id, requer_preparacao, data_hora_preparacao, req.params.id]);
    if (!consulta) return res.status(404).json({ erro: 'Consulta não encontrada' });
    res.json(consulta);
  } catch (err) { next(err); }
};

exports.remover = async (req, res, next) => {
  try {
    await req.dbClient.query('DELETE FROM consultas WHERE id=$1', [req.params.id]);
    res.status(204).end();
  } catch (err) { next(err); }
};
