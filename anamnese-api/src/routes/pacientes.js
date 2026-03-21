const router     = require('express').Router();
const autenticar = require('../middleware/autenticar');
const ctrl       = require('../controllers/pacientes');

router.use(autenticar);

router.get('/',                      ctrl.listar);
router.get('/:id',                   ctrl.buscar);
router.get('/:id/link-consentimento', ctrl.gerarLinkConsentimento);
router.post('/',                     ctrl.criar);
router.put('/:id',                   ctrl.atualizar);
router.delete('/:id',                ctrl.remover);

module.exports = router;
