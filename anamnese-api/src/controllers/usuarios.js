const jwt      = require('jsonwebtoken');
const pool     = require('../config/db');
const emailSvc = require('../services/email');

function apenasAdmin(req, res) {
  if (req.usuario.papel !== 'admin') {
    res.status(403).json({ erro: 'Apenas administradores podem realizar esta ação.' });
    return false;
  }
  return true;
}

// GET /usuarios — lista profissionais do tenant
exports.listar = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, nome, email, papel, criado_em FROM usuarios WHERE tenant_id = $1 ORDER BY criado_em',
      [req.usuario.tenant_id]
    );
    res.json(rows);
  } catch (err) { next(err); }
};

// POST /usuarios/convidar — admin convida novo profissional
exports.convidar = async (req, res, next) => {
  if (!apenasAdmin(req, res)) return;
  const { email, papel = 'colaborador' } = req.body;

  if (!['admin', 'colaborador'].includes(papel))
    return res.status(400).json({ erro: 'Papel inválido.' });

  try {
    const { rows: [tenant] } = await pool.query(
      'SELECT nome, limite_usuarios FROM tenants WHERE id = $1',
      [req.usuario.tenant_id]
    );

    const { rows: usuariosAtivos } = await pool.query(
      'SELECT COUNT(*) AS total FROM usuarios WHERE tenant_id = $1',
      [req.usuario.tenant_id]
    );
    const { rows: convitesPendentes } = await pool.query(
      'SELECT COUNT(*) AS total FROM convites WHERE tenant_id = $1 AND usado = false AND expira_em > now()',
      [req.usuario.tenant_id]
    );

    const ocupados = parseInt(usuariosAtivos[0].total) + parseInt(convitesPendentes[0].total);
    if (ocupados >= tenant.limite_usuarios)
      return res.status(403).json({
        erro: `Seu plano permite até ${tenant.limite_usuarios} profissional(is). Faça upgrade para convidar mais.`,
        codigo: 'LIMITE_USUARIOS',
      });

    const { rows: existente } = await pool.query(
      'SELECT id FROM usuarios WHERE email = $1 AND tenant_id = $2',
      [email, req.usuario.tenant_id]
    );
    if (existente.length)
      return res.status(409).json({ erro: 'Este e-mail já pertence a um usuário do consultório.' });

    await pool.query(
      'DELETE FROM convites WHERE email = $1 AND tenant_id = $2',
      [email, req.usuario.tenant_id]
    );

    const { rows: [convite] } = await pool.query(
      'INSERT INTO convites (tenant_id, email, papel) VALUES ($1, $2, $3) RETURNING id',
      [req.usuario.tenant_id, email, papel]
    );

    const token = jwt.sign(
      { convite_id: convite.id, tenant_id: req.usuario.tenant_id, email, papel, tipo: 'convite' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const base = process.env.FRONTEND_URL || 'http://localhost:3000';
    await emailSvc.enviarConvite(email, tenant.nome, `${base}/aceitar-convite/${token}`);

    res.status(201).json({ mensagem: 'Convite enviado com sucesso.' });
  } catch (err) { next(err); }
};

// DELETE /usuarios/:id — admin remove profissional do tenant
exports.remover = async (req, res, next) => {
  if (!apenasAdmin(req, res)) return;

  if (req.params.id === req.usuario.usuario_id)
    return res.status(400).json({ erro: 'Você não pode remover sua própria conta.' });

  try {
    const { rowCount } = await pool.query(
      'DELETE FROM usuarios WHERE id = $1 AND tenant_id = $2',
      [req.params.id, req.usuario.tenant_id]
    );
    if (!rowCount) return res.status(404).json({ erro: 'Usuário não encontrado.' });
    res.status(204).send();
  } catch (err) { next(err); }
};
