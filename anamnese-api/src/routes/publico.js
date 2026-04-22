const router = require('express').Router();
const ctrl   = require('../controllers/publico');

router.get('/consentimento/:token',         ctrl.consultarConsentimento);
router.post('/consentimento/:token',        ctrl.registrarConsentimento);
router.get('/confirmar-consulta/:token',    ctrl.consultarConsulta);
router.post('/confirmar-consulta/:token',   ctrl.confirmarConsulta);
router.get('/pre-cadastro/:token',          ctrl.consultarPrecadastro);
router.post('/pre-cadastro/:token',         ctrl.salvarPrecadastro);

module.exports = router;
