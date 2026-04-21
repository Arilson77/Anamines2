const router     = require('express').Router();
const autenticar = require('../middleware/autenticar');
const ctrl       = require('../controllers/usuarios');

router.use(autenticar);

router.get('/',           ctrl.listar);
router.post('/convidar',  ctrl.convidar);
router.delete('/:id',     ctrl.remover);

module.exports = router;
