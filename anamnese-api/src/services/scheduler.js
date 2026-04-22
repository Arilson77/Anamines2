const cron    = require('node-cron');
const pool    = require('../config/db');
const emailSvc = require('./email');
const waSvc   = require('./whatsapp');

async function processarMensagens() {
  const client = await pool.connect();
  try {
    const { rows: mensagens } = await client.query(`
      SELECT mf.*,
        c.token_precadastro, c.requer_preparacao, c.data_hora, c.data_hora_preparacao, c.status AS consulta_status,
        p.nome AS paciente_nome, p.email AS paciente_email, p.telefone AS paciente_telefone,
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

    // Verifica se WhatsApp está conectado (uma vez por ciclo)
    const waStatus = waSvc.configurado() ? await waSvc.status() : { estado: 'nao_configurado' };
    const waOnline = waStatus.estado === 'open';

    for (const msg of mensagens) {
      try {
        const base            = process.env.FRONTEND_URL || 'http://localhost:3000';
        const linkConfirmar   = `${base}/confirmar-consulta/${msg.token_precadastro}`;
        const linkPrecadastro = `${base}/pre-cadastro/${msg.token_precadastro}`;

        const params = {
          nomePaciente:     msg.paciente_nome,
          nomeProfissional: msg.profissional_nome,
          nomeClinica:      msg.clinica_nome,
          dataHora:         msg.data_hora,
          requerPreparacao: msg.requer_preparacao,
          dataPreparacao:   msg.data_hora_preparacao,
          instrucoes:       msg.instrucoes_preparacao,
          linkConfirmar,
          linkPrecadastro,
        };

        // Envia WhatsApp se disponível e paciente tem telefone
        if (waOnline && msg.paciente_telefone) {
          try {
            let texto;
            if      (msg.tipo === 'confirmacao_consulta') texto = waSvc.textoConfirmacao(params);
            else if (msg.tipo === 'aviso_preparacao')     texto = waSvc.textoAvisoPreparacao(params);
            else if (msg.tipo === 'ficha_precadastro')    texto = waSvc.textoPrecadastro(params);
            if (texto) await waSvc.enviarTexto(msg.paciente_telefone, texto);
          } catch (waErr) {
            console.error(`WhatsApp falhou (msg ${msg.id}):`, waErr.message);
            // continua para tentar e-mail
          }
        }

        // Envia e-mail se paciente tem e-mail
        if (msg.paciente_email) {
          if (msg.tipo === 'confirmacao_consulta') {
            await emailSvc.enviarConfirmacaoConsulta({ email: msg.paciente_email, ...params });
          } else if (msg.tipo === 'aviso_preparacao') {
            await emailSvc.enviarAvisoPreparacao({ email: msg.paciente_email, ...params });
          } else if (msg.tipo === 'ficha_precadastro') {
            await emailSvc.enviarFichaPrecadastro({ email: msg.paciente_email, ...params });
          }
        }

        // Pelo menos um canal disponível?
        if (!msg.paciente_email && !msg.paciente_telefone) {
          console.warn(`Mensagem ${msg.id}: paciente sem e-mail e sem telefone`);
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
