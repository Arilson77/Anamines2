require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const authRoutes      = require('./src/routes/auth');
const pacientesRoutes = require('./src/routes/pacientes');
const fichasRoutes    = require('./src/routes/fichas');
const erros           = require('./src/middleware/erros');

const app  = express();
const PORT = process.env.PORT || 3001;

// Middlewares globais
app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());

// Rotas
app.use('/auth',      authRoutes);
app.use('/pacientes', pacientesRoutes);
app.use('/fichas',    fichasRoutes);

// Middleware de erros (sempre por último)
app.use(erros);

app.listen(PORT, () => console.log(`API rodando na porta ${PORT}`));
