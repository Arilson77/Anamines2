require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const authRoutes      = require('./src/routes/auth');
const pacientesRoutes = require('./src/routes/pacientes');
const fichasRoutes    = require('./src/routes/fichas');
const publicoRoutes   = require('./src/routes/publico');
const configRoutes    = require('./src/routes/configuracoes');
const cobrancaRoutes  = require('./src/routes/cobranca');
const erros           = require('./src/middleware/erros');

const app  = express();
const PORT = process.env.PORT || 3001;

const FRONTEND_URLS = (process.env.FRONTEND_URL || '')
  .split(',')
  .map(u => u.trim())
  .filter(Boolean);

const allowedOrigin = (origin, callback) => {
  const isLocalhost    = !origin || /^https?:\/\/localhost(:\d+)?$/.test(origin);
  const isVercel       = origin  && /^https:\/\/anamines2[^.]*\.vercel\.app$/.test(origin);
  const isEnvAllowed   = FRONTEND_URLS.includes(origin);
  if (isLocalhost || isVercel || isEnvAllowed) {
    callback(null, true);
  } else {
    callback(new Error(`CORS bloqueado para origem: ${origin}`));
  }
};
app.use(cors({ origin: allowedOrigin, credentials: true }));

// Webhook Stripe precisa de corpo raw (antes do express.json)
app.use('/cobranca/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

app.use('/auth',          authRoutes);
app.use('/pacientes',     pacientesRoutes);
app.use('/fichas',        fichasRoutes);
app.use('/publico',       publicoRoutes);
app.use('/configuracoes', configRoutes);
app.use('/cobranca',      cobrancaRoutes);

app.get('/health', (req, res) => res.json({ ok: true }));
app.use(erros);

app.listen(PORT, () => console.log(`API rodando na porta ${PORT}`));

process.on('unhandledRejection', (err) => console.error('Unhandled rejection:', err?.message || err));
process.on('uncaughtException',  (err) => console.error('Uncaught exception:',  err?.message || err));

