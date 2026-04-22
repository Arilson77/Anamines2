const router     = require('express').Router();
const autenticar = require('../middleware/autenticar');
const ctrl       = require('../controllers/disponibilidade');

router.use(autenticar);

router.get('/',            ctrl.listar);
router.put('/grade',       ctrl.salvarGrade);
router.get('/slots',       ctrl.slots);
router.post('/bloqueios',  ctrl.criarBloqueio);
router.delete('/bloqueios/:id', ctrl.removerBloqueio);

module.exports = router;
