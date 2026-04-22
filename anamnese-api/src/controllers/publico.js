const jwt      = require('jsonwebtoken');
const pool     = require('../config/db');
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
// Registra o consentimento do paciente (idempotente — bloqueia uso duplo)
exports.registrarConsentimento = async (req, res) => {
  const client = await pool.connect();
  try {
    const payload = jwt.verify(req.params.token, process.env.JWT_SECRET);
    if (payload.tipo !== 'lgpd_consent')
      return res.status(400).json({ erro: 'Token inválido' });

    await client.query(
      'SELECT set_config($1,$2,true), set_config($3,$4,true)',
      ['app.tenant_id', payload.tenant_id, 'app.papel', 'admin']
    );

    const { rows: [paciente] } = await client.query(
      'SELECT consentimento_lgpd FROM pacientes WHERE id = $1',
      [payload.paciente_id]
    );

    if (!paciente) return res.status(404).json({ erro: 'Paciente não encontrado' });
    if (paciente.consentimento_lgpd)
      return res.status(409).json({ erro: 'Consentimento já registrado anteriormente' });

    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
    await lgpdService.registrarConsentimento(client, payload.tenant_id, payload.paciente_id, ip);

    res.json({ mensagem: 'Consentimento registrado com sucesso' });
  } catch {
    res.status(401).json({ erro: 'Link inválido ou expirado' });
  } finally {
    client.release();
  }
};

// GET /publico/confirmar-consulta/:token
exports.consultarConsulta = async (req, res) => {
  try {
    const { rows: [c] } = await pool.query(`
      SELECT c.data_hora, c.status, c.requer_preparacao, c.data_hora_preparacao, c.confirmado_em,
        p.nome AS paciente_nome, u.nome AS profissional_nome, t.nome AS clinica_nome,
        pr.instrucoes_preparacao
      FROM consultas c
      JOIN pacientes p  ON p.id = c.paciente_id
      JOIN usuarios u   ON u.id = c.profissional_id
      JOIN tenants t    ON t.id = c.tenant_id
      LEFT JOIN procedimentos pr ON pr.id = c.procedimento_id
      WHERE c.token_precadastro = $1
    `, [req.params.token]);
    if (!c) return res.status(404).json({ erro: 'Consulta não encontrada' });
    res.json(c);
  } catch { res.status(500).json({ erro: 'Erro ao buscar consulta' }); }
};

// POST /publico/confirmar-consulta/:token
exports.confirmarConsulta = async (req, res) => {
  const client = await pool.connect();
  try {
    const { rows: [consulta] } = await client.query(
      `UPDATE consultas SET status='confirmada', confirmado_em=NOW()
       WHERE token_precadastro=$1 AND status='agendada' RETURNING *`,
      [req.params.token]
    );
    if (!consulta) return res.status(404).json({ erro: 'Consulta não encontrada ou já confirmada' });

    await client.query(
      `INSERT INTO mensagens_fila (tenant_id, consulta_id, tipo, canal, enviar_em)
       VALUES ($1,$2,'ficha_precadastro','email',NOW())`,
      [consulta.tenant_id, consulta.id]
    );
    res.json({ mensagem: 'Consulta confirmada com sucesso' });
  } catch { res.status(500).json({ erro: 'Erro ao confirmar' }); }
  finally { client.release(); }
};

// GET /publico/pre-cadastro/:token
exports.consultarPrecadastro = async (req, res) => {
  try {
    const { rows: [c] } = await pool.query(`
      SELECT c.data_hora, c.status, c.precadastro_feito,
        p.nome, p.email, p.telefone, p.data_nascimento, t.nome AS clinica_nome
      FROM consultas c
      JOIN pacientes p ON p.id = c.paciente_id
      JOIN tenants t   ON t.id = c.tenant_id
      WHERE c.token_precadastro = $1
    `, [req.params.token]);
    if (!c) return res.status(404).json({ erro: 'Link inválido' });
    res.json(c);
  } catch { res.status(500).json({ erro: 'Erro' }); }
};

// POST /publico/pre-cadastro/:token
exports.salvarPrecadastro = async (req, res) => {
  const { nome, telefone, data_nascimento } = req.body;
  const client = await pool.connect();
  try {
    const { rows: [consulta] } = await client.query(
      'SELECT paciente_id FROM consultas WHERE token_precadastro=$1', [req.params.token]
    );
    if (!consulta) return res.status(404).json({ erro: 'Link inválido' });

    const updates = [], vals = [];
    let i = 1;
    if (nome)            { updates.push(`nome=$${i++}`);            vals.push(nome); }
    if (telefone)        { updates.push(`telefone=$${i++}`);        vals.push(telefone); }
    if (data_nascimento) { updates.push(`data_nascimento=$${i++}`); vals.push(data_nascimento); }
    if (updates.length) {
      vals.push(consulta.paciente_id);
      await client.query(`UPDATE pacientes SET ${updates.join(',')} WHERE id=$${i}`, vals);
    }
    await client.query(
      'UPDATE consultas SET precadastro_feito=true WHERE token_precadastro=$1', [req.params.token]
    );
    res.json({ mensagem: 'Dados salvos com sucesso' });
  } catch { res.status(500).json({ erro: 'Erro ao salvar' }); }
  finally { client.release(); }
};
