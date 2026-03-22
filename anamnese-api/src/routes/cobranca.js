const express    = require('express');
const autenticar = require('../middleware/autenticar');
const ctrl       = require('../controllers/cobranca');

const router = express.Router();

// Webhook precisa de corpo raw (antes do express.json)
router.post('/webhook', express.raw({ type: 'application/json' }), ctrl.webhook);

// Rotas autenticadas
router.get('/status',   autenticar, ctrl.status);
router.post('/checkout', autenticar, ctrl.checkout);
router.post('/portal',   autenticar, ctrl.portal);

module.exports = router;
