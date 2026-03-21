const jwt  = require('jsonwebtoken');
const pool = require('../config/db');
const lgpdService = require('../services/lgpd');

// GET /publico/consentimento/:token
// Valida o token e retorna nome do paciente/consultório
exports.consultarConsentimento = async (req, res) => {
  try {
    const payload = jwt.verify(req.params.token, process.env.JWT_SECRET);
    if (payload.tipo !== 'lgpd_consent')
      return res.status(400).json({ erro: 'Token inválido' });

    const { rows } = await pool.query(
      `SELECT p.nome AS paciente, p.consentimento_lgpd, t.nome AS consultorio
       FROM pacientes p
       JOIN tenants t ON t.id = p.tenant_id
       WHERE p.id = $1 AND p.tenant_id = $2`,
      [payload.paciente_id, payload.tenant_id]
    );
    if (!rows.length) return res.status(404).json({ erro: 'Não encontrado' });

    res.json({
      paciente:                 rows[0].paciente,
      consultorio:              rows[0].consultorio,
      consentimento_registrado: rows[0].consentimento_lgpd,
    });
  } catch {
    res.status(401).json({ erro: 'Link inválido ou expirado' });
  }
};

// POST /publico/consentimento/:token
// Registra o consentimento do paciente
exports.registrarConsentimento = async (req, res) => {
  const client = await pool.connect();
  try {
    const payload = jwt.verify(req.params.token, process.env.JWT_SECRET);
    if (payload.tipo !== 'lgpd_consent')
      return res.status(400).json({ erro: 'Token inválido' });

    await client.query('SELECT set_config($1, $2, true)', ['app.tenant_id', payload.tenant_id]);

    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
    await lgpdService.registrarConsentimento(client, payload.tenant_id, payload.paciente_id, ip);

    res.json({ mensagem: 'Consentimento registrado com sucesso' });
  } catch {
    res.status(401).json({ erro: 'Link inválido ou expirado' });
  } finally {
    client.release();
  }
};
