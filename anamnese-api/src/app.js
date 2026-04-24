require('dotenv').config();
const Sentry  = require('@sentry/node');
const express = require('express');
const cors    = require('cors');

if (process.env.SENTRY_DSN) {
  Sentry.init({ dsn: process.env.SENTRY_DSN, environment: process.env.NODE_ENV || 'production' });
}

const authRoutes          = require('./routes/auth');
const pacientesRoutes     = require('./routes/pacientes');
const fichasRoutes        = require('./routes/fichas');
const publicoRoutes       = require('./routes/publico');
const configRoutes        = require('./routes/configuracoes');
const cobrancaRoutes      = require('./routes/cobranca');
const usuariosRoutes      = require('./routes/usuarios');
const especialidadesRoutes   = require('./routes/especialidades');
const procedimentosRoutes    = require('./routes/procedimentos');
const consultasRoutes        = require('./routes/consultas');
const disponibilidadeRoutes  = require('./routes/disponibilidade');
const whatsappRoutes         = require('./routes/whatsapp');
const relatoriosRoutes       = require('./routes/relatorios');
const erros               = require('./middleware/erros');
const scheduler           = require('./services/scheduler');

const app = express();

const FRONTEND_URLS = (process.env.FRONTEND_URL || '')
  .split(',')
  .map(u => u.trim())
  .filter(Boolean);

const allowedOrigin = (origin, callback) => {
  const isLocalhost  = !origin || /^https?:\/\/localhost(:\d+)?$/.test(origin);
  const isVercel     = origin  && /^https:\/\/anamines2[^.]*\.vercel\.app$/.test(origin);
  const isEnvAllowed = FRONTEND_URLS.includes(origin);
  if (isLocalhost || isVercel || isEnvAllowed) {
    callback(null, true);
  } else {
    callback(new Error(`CORS bloqueado para origem: ${origin}`));
  }
};
app.set('trust proxy', 1);
app.use(cors({ origin: allowedOrigin, credentials: true }));

app.use('/cobranca/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

app.use('/auth',           authRoutes);
app.use('/pacientes',      pacientesRoutes);
app.use('/fichas',         fichasRoutes);
app.use('/publico',        publicoRoutes);
app.use('/configuracoes',  configRoutes);
app.use('/cobranca',       cobrancaRoutes);
app.use('/usuarios',       usuariosRoutes);
app.use('/especialidades',  especialidadesRoutes);
app.use('/procedimentos',   procedimentosRoutes);
app.use('/consultas',       consultasRoutes);
app.use('/disponibilidade', disponibilidadeRoutes);
app.use('/whatsapp',       whatsappRoutes);
app.use('/relatorios',     relatoriosRoutes);

scheduler.iniciar();

app.get('/health', (req, res) => res.json({
  ok: true,
  stripe: !!process.env.STRIPE_SECRET_KEY,
  stripe_prefix: process.env.STRIPE_SECRET_KEY?.slice(0, 7) || 'não definida',
}));

app.get('/health/stripe', async (req, res) => {
  const https = require('https');
  const result = await new Promise((resolve) => {
    const req = https.get('https://api.stripe.com', { timeout: 5000 }, (r) => {
      resolve({ ok: true, status: r.statusCode });
    });
    req.on('error', (e) => resolve({ ok: false, error: e.code, message: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, error: 'TIMEOUT' }); });
  });
  res.json(result);
});
if (process.env.SENTRY_DSN) Sentry.setupExpressErrorHandler(app);
app.use(erros);

module.exports = app;
