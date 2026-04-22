const router         = require('express').Router();
const autenticar     = require('../middleware/autenticar');
const verificarPlano = require('../middleware/verificarPlano');
const ctrl           = require('../controllers/consultas');

router.use(autenticar);
router.use(verificarPlano);

router.get('/',    ctrl.listar);
router.get('/:id', ctrl.buscar);
router.post('/',   ctrl.criar);
router.put('/:id', ctrl.atualizar);
router.delete('/:id', ctrl.remover);

module.exports = router;
