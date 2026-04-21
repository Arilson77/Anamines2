const pool  = require('../config/db');
const email = require('../services/email');

async function verificarPlano(req, res, next) {
  try {
    const { rows: [tenant] } = await pool.query(
      'SELECT assinatura_status, trial_termina_em, trial_aviso_enviado, email, nome FROM tenants WHERE id = $1',
      [req.usuario.tenant_id]
    );

    if (!tenant) return res.status(401).json({ erro: 'Tenant não encontrado' });

    const trialExpirado =
      tenant.assinatura_status === 'trial' &&
      new Date() > new Date(tenant.trial_termina_em);

    if (trialExpirado) {
      await pool.query(
        "UPDATE tenants SET assinatura_status = 'expirada' WHERE id = $1",
        [req.usuario.tenant_id]
      );
    }

    if (tenant.assinatura_status === 'expirada' || trialExpirado) {
      return res.status(402).json({
        erro: 'Período de trial encerrado. Assine um plano para continuar.',
        codigo: 'PLANO_EXPIRADO',
      });
    }

    if (tenant.assinatura_status === 'inadimplente') {
      res.setHeader('X-Aviso', 'PAGAMENTO_PENDENTE');
    }

    if (tenant.assinatura_status === 'trial' && !tenant.trial_aviso_enviado) {
      const dias = Math.ceil((new Date(tenant.trial_termina_em) - new Date()) / 86400000);
      if (dias <= 3) {
        pool.query(
          'UPDATE tenants SET trial_aviso_enviado = true WHERE id = $1',
          [req.usuario.tenant_id]
        ).catch(() => null);
        email.avisarTrialExpirando(tenant.email, tenant.nome, dias).catch(() => null);
      }
    }

    next();
  } catch (err) {
    next(err);
  }
}

module.exports = verificarPlano;
