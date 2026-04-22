exports.listar = async (req, res, next) => {
  try {
    const { especialidade_id } = req.query;
    let q = `SELECT p.*, e.nome AS especialidade_nome
             FROM procedimentos p LEFT JOIN especialidades e ON e.id = p.especialidade_id`;
    const params = [];
    if (especialidade_id) { q += ' WHERE p.especialidade_id=$1'; params.push(especialidade_id); }
    q += ' ORDER BY p.nome';
    const { rows } = await req.dbClient.query(q, params);
    res.json(rows);
  } catch (err) { next(err); }
};

exports.criar = async (req, res, next) => {
  const { especialidade_id, nome, duracao_minutos, requer_preparacao, instrucoes_preparacao, antecedencia_aviso_horas } = req.body;
  try {
    const { rows: [proc] } = await req.dbClient.query(
      `INSERT INTO procedimentos (tenant_id, especialidade_id, nome, duracao_minutos, requer_preparacao, instrucoes_preparacao, antecedencia_aviso_horas)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.usuario.tenant_id, especialidade_id || null, nome, duracao_minutos || 50,
       requer_preparacao || false, instrucoes_preparacao || null, antecedencia_aviso_horas || 48]
    );
    res.status(201).json(proc);
  } catch (err) { next(err); }
};

exports.atualizar = async (req, res, next) => {
  const { especialidade_id, nome, duracao_minutos, requer_preparacao, instrucoes_preparacao, antecedencia_aviso_horas } = req.body;
  try {
    const { rows: [proc] } = await req.dbClient.query(
      `UPDATE procedimentos SET especialidade_id=$1, nome=$2, duracao_minutos=$3, requer_preparacao=$4,
       instrucoes_preparacao=$5, antecedencia_aviso_horas=$6 WHERE id=$7 RETURNING *`,
      [especialidade_id || null, nome, duracao_minutos || 50, requer_preparacao || false,
       instrucoes_preparacao || null, antecedencia_aviso_horas || 48, req.params.id]
    );
    if (!proc) return res.status(404).json({ erro: 'Procedimento não encontrado' });
    res.json(proc);
  } catch (err) { next(err); }
};

exports.remover = async (req, res, next) => {
  try {
    await req.dbClient.query('DELETE FROM procedimentos WHERE id=$1', [req.params.id]);
    res.status(204).end();
  } catch (err) { next(err); }
};
