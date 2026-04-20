const pool    = require('../config/db');
const logsnag = require('../config/logsnag');

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  console.log('[Stripe] key presente:', !!key, '| prefixo:', key?.slice(0, 7));
  if (!key) return null;
  const Stripe = require('stripe');
  return new Stripe(key);
}

const PLANOS = {
  basico: { nome: 'Básico', preco: 'R$ 49/mês', price_id: process.env.STRIPE_PRICE_BASICO },
  pro:    { nome: 'Pro',    preco: 'R$ 99/mês', price_id: process.env.STRIPE_PRICE_PRO    },
};

// GET /cobranca/status — retorna status da assinatura do tenant
exports.status = async (req, res, next) => {
  try {
    const { rows: [tenant] } = await pool.query(
      'SELECT plano, assinatura_status, trial_termina_em, assinatura_termina_em FROM tenants WHERE id = $1',
      [req.usuario.tenant_id]
    );

    const agora = new Date();
    const termina = new Date(tenant.trial_termina_em);
    const diasRestantes = Math.max(0, Math.ceil((termina - agora) / 86400000));

    res.json({
      plano:              tenant.plano,
      status:             tenant.assinatura_status,
      trial_termina_em:   tenant.trial_termina_em,
      assinatura_termina_em: tenant.assinatura_termina_em,
      dias_restantes:     tenant.assinatura_status === 'trial' ? diasRestantes : null,
    });
  } catch (err) {
    next(err);
  }
};

// POST /cobranca/checkout — cria sessão de pagamento Stripe
exports.checkout = async (req, res, next) => {
  console.log('[checkout] plano:', req.body?.plano);
  console.log('[checkout] STRIPE_SECRET_KEY direto:', process.env.STRIPE_SECRET_KEY?.slice(0, 10) || 'VAZIO');
  const stripe = getStripe();
  console.log('[checkout] stripe inicializado:', !!stripe);
  if (!stripe) return res.status(503).json({ erro: 'Pagamentos não configurados ainda.' });

  const { plano } = req.body;
  if (!PLANOS[plano]) return res.status(400).json({ erro: 'Plano inválido' });

  try {
    const { rows: [tenant] } = await pool.query(
      'SELECT email, stripe_customer_id FROM tenants WHERE id = $1',
      [req.usuario.tenant_id]
    );

    let customerId = tenant.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: tenant.email });
      customerId = customer.id;
      await pool.query(
        'UPDATE tenants SET stripe_customer_id = $1 WHERE id = $2',
        [customerId, req.usuario.tenant_id]
      );
    }

    const session = await stripe.checkout.sessions.create({
      customer:    customerId,
      mode:        'subscription',
      line_items:  [{ price: PLANOS[plano].price_id, quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL}/assinatura?sucesso=1`,
      cancel_url:  `${process.env.FRONTEND_URL}/planos`,
      metadata:    { tenant_id: req.usuario.tenant_id, plano },
    });

    res.json({ url: session.url });
  } catch (err) {
    next(err);
  }
};

// POST /cobranca/portal — abre portal de gestão da assinatura
exports.portal = async (req, res, next) => {
  const stripe = getStripe();
  if (!stripe) return res.status(503).json({ erro: 'Pagamentos não configurados ainda.' });

  try {
    const { rows: [tenant] } = await pool.query(
      'SELECT stripe_customer_id FROM tenants WHERE id = $1',
      [req.usuario.tenant_id]
    );

    if (!tenant.stripe_customer_id)
      return res.status(400).json({ erro: 'Sem assinatura ativa para gerenciar.' });

    const session = await stripe.billingPortal.sessions.create({
      customer:   tenant.stripe_customer_id,
      return_url: `${process.env.FRONTEND_URL}/assinatura`,
    });

    res.json({ url: session.url });
  } catch (err) {
    next(err);
  }
};

// POST /cobranca/webhook — eventos Stripe (body raw obrigatório)
exports.webhook = async (req, res) => {
  const stripe = getStripe();
  if (!stripe) return res.sendStatus(200);

  const sig = req.headers['stripe-signature'];
  let evento;

  try {
    evento = stripe.webhooks.constructEvent(
      req.body, sig, process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch {
    return res.status(400).json({ erro: 'Assinatura do webhook inválida' });
  }

  const obj = evento.data.object;

  try {
    switch (evento.type) {
      case 'checkout.session.completed': {
        const { tenant_id, plano } = obj.metadata;
        await pool.query(
          `UPDATE tenants SET
             plano                  = $1,
             assinatura_status      = 'ativa',
             stripe_subscription_id = $2,
             assinatura_termina_em  = NULL
           WHERE id = $3`,
          [plano, obj.subscription, tenant_id]
        );
        await logsnag.track({
          channel:     'assinaturas',
          event:       'Nova assinatura',
          description: `Plano ${plano} ativado`,
          icon:        '💳',
          notify:      true,
        });
        break;
      }
      case 'customer.subscription.deleted': {
        await pool.query(
          `UPDATE tenants SET assinatura_status = 'expirada', assinatura_termina_em = $1
           WHERE stripe_subscription_id = $2`,
          [new Date(), obj.id]
        );
        await logsnag.track({
          channel:     'assinaturas',
          event:       'Assinatura cancelada',
          icon:        '⚠️',
          notify:      true,
        });
        break;
      }
      case 'customer.subscription.updated': {
        const status = obj.status === 'active' ? 'ativa' : 'expirada';
        const termina = obj.current_period_end
          ? new Date(obj.current_period_end * 1000)
          : null;
        await pool.query(
          `UPDATE tenants SET assinatura_status = $1, assinatura_termina_em = $2
           WHERE stripe_subscription_id = $3`,
          [status, termina, obj.id]
        );
        break;
      }
    }
  } catch (err) {
    console.error('Erro ao processar webhook:', err.message);
  }

  res.sendStatus(200);
};
