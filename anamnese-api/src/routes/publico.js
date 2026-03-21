const router = require('express').Router();
const ctrl   = require('../controllers/publico');

router.get('/consentimento/:token',  ctrl.consultarConsentimento);
router.post('/consentimento/:token', ctrl.registrarConsentimento);

module.exports = router;
