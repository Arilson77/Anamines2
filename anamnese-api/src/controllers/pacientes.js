const jwt         = require('jsonwebtoken');
const lgpdService = require('../services/lgpd');

exports.listar = async (req, res, next) => {
  try {
    const { rows } = await req.dbClient.query(
      'SELECT id, nome, email, telefone, data_nascimento, criado_em FROM pacientes ORDER BY nome'
    );
    res.json(rows);
  } catch (err) { next(err); }
};

exports.buscar = async (req, res, next) => {
  try {
    const { rows } = await req.dbClient.query(
      'SELECT * FROM pacientes WHERE id = $1',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ erro: 'Paciente não encontrado' });
    await lgpdService.log(req.dbClient, req.usuario, 'visualizou_paciente', `paciente:${req.params.id}`);
    res.json(rows[0]);
  } catch (err) { next(err); }
};

exports.criar = async (req, res, next) => {
  const { nome, email, telefone, data_nascimento } = req.body;
  try {
    const { rows } = await req.dbClient.query(
      `INSERT INTO pacientes (tenant_id, profissional_id, nome, email, telefone, data_nascimento)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, nome, criado_em`,
      [req.usuario.tenant_id, req.usuario.usuario_id, nome, email, telefone, data_nascimento]
    );
    await lgpdService.log(req.dbClient, req.usuario, 'criou_paciente', `paciente:${rows[0].id}`);
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
};

exports.atualizar = async (req, res, next) => {
  const { nome, email, telefone, data_nascimento } = req.body;
  try {
    const { rows } = await req.dbClient.query(
      `UPDATE pacientes SET nome=$1, email=$2, telefone=$3, data_nascimento=$4
       WHERE id=$5 RETURNING id, nome`,
      [nome, email, telefone, data_nascimento, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ erro: 'Paciente não encontrado' });
    await lgpdService.log(req.dbClient, req.usuario, 'editou_paciente', `paciente:${rows[0].id}`);
    res.json(rows[0]);
  } catch (err) { next(err); }
};

exports.remover = async (req, res, next) => {
  try {
    const { rowCount } = await req.dbClient.query(
      'DELETE FROM pacientes WHERE id = $1',
      [req.params.id]
    );
    if (!rowCount) return res.status(404).json({ erro: 'Paciente não encontrado' });
    await lgpdService.log(req.dbClient, req.usuario, 'removeu_paciente', `paciente:${req.params.id}`);
    res.status(204).send();
  } catch (err) { next(err); }
};

// GET /pacientes/:id/link-consentimento
// Gera um JWT de curta duração para o paciente assinar o termo LGPD
exports.gerarLinkConsentimento = async (req, res, next) => {
  try {
    const { rows } = await req.dbClient.query(
      'SELECT id FROM pacientes WHERE id = $1',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ erro: 'Paciente não encontrado' });

    const token = jwt.sign(
      { paciente_id: req.params.id, tenant_id: req.usuario.tenant_id, tipo: 'lgpd_consent' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const base = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.json({ link: `${base}/consentimento/${token}` });
  } catch (err) { next(err); }
};
