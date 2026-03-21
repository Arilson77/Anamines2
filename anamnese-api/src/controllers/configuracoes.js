const bcrypt = require('bcrypt');
const pool   = require('../config/db');

// GET /configuracoes
exports.obter = async (req, res, next) => {
  try {
    const { rows } = await req.dbClient.query(
      `SELECT t.nome, t.email, u.nome AS nome_usuario, u.papel
       FROM tenants t
       JOIN usuarios u ON u.tenant_id = t.id
       WHERE t.id = $1 AND u.id = $2`,
      [req.usuario.tenant_id, req.usuario.usuario_id]
    );
    if (!rows.length) return res.status(404).json({ erro: 'Não encontrado' });
    res.json(rows[0]);
  } catch (err) { next(err); }
};

// PUT /configuracoes
exports.atualizar = async (req, res, next) => {
  const { nome, email } = req.body;
  try {
    await req.dbClient.query(
      'UPDATE tenants SET nome = $1, email = $2 WHERE id = $3',
      [nome, email, req.usuario.tenant_id]
    );
    res.json({ mensagem: 'Configurações atualizadas' });
  } catch (err) { next(err); }
};

// PUT /configuracoes/senha
exports.alterarSenha = async (req, res, next) => {
  const { senha_atual, senha_nova } = req.body;
  if (!senha_nova || senha_nova.length < 8)
    return res.status(400).json({ erro: 'A nova senha deve ter ao menos 8 caracteres' });

  try {
    const { rows } = await pool.query(
      'SELECT senha_hash FROM usuarios WHERE id = $1',
      [req.usuario.usuario_id]
    );
    if (!rows.length || !(await bcrypt.compare(senha_atual, rows[0].senha_hash)))
      return res.status(400).json({ erro: 'Senha atual incorreta' });

    const hash = await bcrypt.hash(senha_nova, 12);
    await pool.query('UPDATE usuarios SET senha_hash = $1 WHERE id = $2', [hash, req.usuario.usuario_id]);
    res.json({ mensagem: 'Senha alterada com sucesso' });
  } catch (err) { next(err); }
};
