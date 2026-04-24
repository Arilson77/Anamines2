const router     = require('express').Router();
const autenticar = require('../middleware/autenticar');
const ctrl       = require('../controllers/relatorios');

router.use(autenticar);
router.get('/resumo', ctrl.resumo);
router.get('/pdf',    ctrl.pdf);

module.exports = router;
