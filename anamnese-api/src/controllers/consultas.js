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
    if (req.query.paciente_id) { q += ` AND c.paciente_id = $${i++}`; params.push(req.query.paciente_id); }
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

// Gera datas de recorrência a partir de data_hora até recorrencia_fim
function gerarDatas(data_hora, recorrencia, recorrencia_fim) {
  const datas = [];
  const fim = new Date(recorrencia_fim);
  let atual = new Date(data_hora);
  // pula a primeira (já será criada como consulta principal)
  while (true) {
    if (recorrencia === 'semanal')    atual = new Date(atual.getTime() + 7 * 86400000);
    else if (recorrencia === 'quinzenal') atual = new Date(atual.getTime() + 14 * 86400000);
    else if (recorrencia === 'mensal') {
      atual = new Date(atual);
      atual.setMonth(atual.getMonth() + 1);
    }
    if (atual > fim) break;
    datas.push(new Date(atual));
  }
  return datas;
}

exports.criar = async (req, res, next) => {
  const {
    paciente_id, profissional_id, especialidade_id, procedimento_id,
    data_hora, duracao_minutos, requer_preparacao, data_hora_preparacao, observacoes,
    recorrencia, recorrencia_fim,
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

    // Lembrete 2h antes (sempre, se consulta for no futuro)
    const lembrete2h = new Date(dataHora.getTime() - 2 * 3600000);
    if (lembrete2h > new Date()) {
      mensagens.push({ tipo: 'lembrete_2h', enviar_em: lembrete2h });
    }

    for (const { tipo, enviar_em } of mensagens) {
      await client.query(
        'INSERT INTO mensagens_fila (tenant_id, consulta_id, tipo, canal, enviar_em) VALUES ($1,$2,$3,$4,$5)',
        [req.usuario.tenant_id, consulta.id, tipo, 'email', enviar_em]
      );
    }

    // Cria ocorrências recorrentes se solicitado
    if (recorrencia && recorrencia_fim) {
      const datasExtra = gerarDatas(data_hora, recorrencia, recorrencia_fim);
      for (const dt of datasExtra) {
        const { rows: [c] } = await client.query(`
          INSERT INTO consultas
            (tenant_id, paciente_id, profissional_id, especialidade_id, procedimento_id,
             data_hora, duracao_minutos, requer_preparacao, data_hora_preparacao, observacoes)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id
        `, [
          req.usuario.tenant_id, paciente_id,
          profissional_id || req.usuario.usuario_id,
          especialidade_id || null, procedimento_id || null,
          dt.toISOString(), duracao_minutos || 50,
          requer_preparacao || false, data_hora_preparacao || null, observacoes || null,
        ]);
        // Lembrete 2h para cada ocorrência
        const l2h = new Date(dt.getTime() - 2 * 3600000);
        if (l2h > new Date()) {
          await client.query(
            'INSERT INTO mensagens_fila (tenant_id, consulta_id, tipo, canal, enviar_em) VALUES ($1,$2,$3,$4,$5)',
            [req.usuario.tenant_id, c.id, 'lembrete_2h', 'email', l2h]
          );
        }
        const conf = new Date(dt.getTime() - 24 * 3600000);
        if (conf > new Date()) {
          await client.query(
            'INSERT INTO mensagens_fila (tenant_id, consulta_id, tipo, canal, enviar_em) VALUES ($1,$2,$3,$4,$5)',
            [req.usuario.tenant_id, c.id, 'confirmacao_consulta', 'email', conf]
          );
        }
      }
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
