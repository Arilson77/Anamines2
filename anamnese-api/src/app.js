require('dotenv').config();
const Sentry  = require('@sentry/node');
const express = require('express');
const cors    = require('cors');

if (process.env.SENTRY_DSN) {
  Sentry.init({ dsn: process.env.SENTRY_DSN, environment: process.env.NODE_ENV || 'production' });
}

const authRoutes      = require('./routes/auth');
const pacientesRoutes = require('./routes/pacientes');
const fichasRoutes    = require('./routes/fichas');
const publicoRoutes   = require('./routes/publico');
const configRoutes    = require('./routes/configuracoes');
const cobrancaRoutes  = require('./routes/cobranca');
const erros           = require('./middleware/erros');

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
app.use(cors({ origin: allowedOrigin, credentials: true }));

app.use('/cobranca/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

app.use('/auth',          authRoutes);
app.use('/pacientes',     pacientesRoutes);
app.use('/fichas',        fichasRoutes);
app.use('/publico',       publicoRoutes);
app.use('/configuracoes', configRoutes);
app.use('/cobranca',      cobrancaRoutes);

app.get('/health', (req, res) => res.json({ ok: true }));
if (process.env.SENTRY_DSN) Sentry.setupExpressErrorHandler(app);
app.use(erros);

module.exports = app;
