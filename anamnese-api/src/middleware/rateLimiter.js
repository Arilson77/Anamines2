const rateLimit = require('express-rate-limit');

// Limita tentativas de login: 5 por IP a cada 15 minutos
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
});

// Limita criação de contas: 3 por IP por hora (evita spam de tenants)
const cadastroLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: 'Muitos cadastros realizados. Tente novamente em 1 hora.' },
});

module.exports = { loginLimiter, cadastroLimiter };
