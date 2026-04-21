const pool = require('../config/db');

async function verificarPlano(req, res, next) {
  try {
    const { rows: [tenant] } = await pool.query(
      'SELECT assinatura_status, trial_termina_em FROM tenants WHERE id = $1',
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

    next();
  } catch (err) {
    next(err);
  }
}

module.exports = verificarPlano;
