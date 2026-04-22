exports.listar = async (req, res, next) => {
  try {
    const { rows } = await req.dbClient.query('SELECT * FROM especialidades ORDER BY nome');
    res.json(rows);
  } catch (err) { next(err); }
};

exports.criar = async (req, res, next) => {
  const { nome, cor } = req.body;
  try {
    const { rows: [esp] } = await req.dbClient.query(
      'INSERT INTO especialidades (tenant_id, nome, cor) VALUES ($1,$2,$3) RETURNING *',
      [req.usuario.tenant_id, nome, cor || '#6b7280']
    );
    res.status(201).json(esp);
  } catch (err) { next(err); }
};

exports.atualizar = async (req, res, next) => {
  const { nome, cor } = req.body;
  try {
    const { rows: [esp] } = await req.dbClient.query(
      'UPDATE especialidades SET nome=$1, cor=$2 WHERE id=$3 RETURNING *',
      [nome, cor, req.params.id]
    );
    if (!esp) return res.status(404).json({ erro: 'Especialidade não encontrada' });
    res.json(esp);
  } catch (err) { next(err); }
};

exports.remover = async (req, res, next) => {
  try {
    await req.dbClient.query('DELETE FROM especialidades WHERE id=$1', [req.params.id]);
    res.status(204).end();
  } catch (err) { next(err); }
};
