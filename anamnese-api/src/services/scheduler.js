const cron    = require('node-cron');
const pool    = require('../config/db');
const emailSvc = require('./email');

async function processarMensagens() {
  const client = await pool.connect();
  try {
    const { rows: mensagens } = await client.query(`
      SELECT mf.*,
        c.token_precadastro, c.requer_preparacao, c.data_hora, c.data_hora_preparacao, c.status AS consulta_status,
        p.nome AS paciente_nome, p.email AS paciente_email,
        u.nome AS profissional_nome,
        t.nome AS clinica_nome,
        pr.instrucoes_preparacao
      FROM mensagens_fila mf
      JOIN consultas c  ON c.id  = mf.consulta_id
      JOIN pacientes p  ON p.id  = c.paciente_id
      JOIN usuarios u   ON u.id  = c.profissional_id
      JOIN tenants t    ON t.id  = mf.tenant_id
      LEFT JOIN procedimentos pr ON pr.id = c.procedimento_id
      WHERE mf.status = 'pendente' AND mf.enviar_em <= NOW() AND mf.tentativas < 3
    `);

    for (const msg of mensagens) {
      try {
        if (!msg.paciente_email) continue;
        const base            = process.env.FRONTEND_URL || 'http://localhost:3000';
        const linkConfirmar   = `${base}/confirmar-consulta/${msg.token_precadastro}`;
        const linkPrecadastro = `${base}/pre-cadastro/${msg.token_precadastro}`;

        if (msg.tipo === 'confirmacao_consulta') {
          await emailSvc.enviarConfirmacaoConsulta({
            email:            msg.paciente_email,
            nomePaciente:     msg.paciente_nome,
            nomeProfissional: msg.profissional_nome,
            nomeClinica:      msg.clinica_nome,
            dataHora:         msg.data_hora,
            requerPreparacao: msg.requer_preparacao,
            dataPreparacao:   msg.data_hora_preparacao,
            linkConfirmar,
          });
        } else if (msg.tipo === 'aviso_preparacao') {
          await emailSvc.enviarAvisoPreparacao({
            email:          msg.paciente_email,
            nomePaciente:   msg.paciente_nome,
            nomeClinica:    msg.clinica_nome,
            dataHora:       msg.data_hora,
            dataPreparacao: msg.data_hora_preparacao,
            instrucoes:     msg.instrucoes_preparacao,
          });
        } else if (msg.tipo === 'ficha_precadastro') {
          await emailSvc.enviarFichaPrecadastro({
            email:            msg.paciente_email,
            nomePaciente:     msg.paciente_nome,
            nomeClinica:      msg.clinica_nome,
            dataHora:         msg.data_hora,
            requerPreparacao: msg.requer_preparacao,
            instrucoes:       msg.instrucoes_preparacao,
            linkPrecadastro,
          });
        }

        await client.query(
          `UPDATE mensagens_fila SET status='enviada', enviada_em=NOW() WHERE id=$1`,
          [msg.id]
        );
      } catch (err) {
        console.error(`Scheduler: falha mensagem ${msg.id}:`, err.message);
        await client.query(
          `UPDATE mensagens_fila SET tentativas=tentativas+1,
           status=CASE WHEN tentativas+1>=3 THEN 'falhou' ELSE 'pendente' END WHERE id=$1`,
          [msg.id]
        );
      }
    }
  } finally {
    client.release();
  }
}

exports.iniciar = () => {
  cron.schedule('*/5 * * * *', () => {
    processarMensagens().catch(err => console.error('Scheduler error:', err.message));
  });
  console.log('Scheduler de mensagens iniciado (a cada 5 min)');
};
