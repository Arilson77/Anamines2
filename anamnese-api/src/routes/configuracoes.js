const router     = require('express').Router();
const autenticar = require('../middleware/autenticar');
const ctrl       = require('../controllers/configuracoes');

router.use(autenticar);

router.get('/',       ctrl.obter);
router.put('/',       ctrl.atualizar);
router.put('/senha',  ctrl.alterarSenha);

module.exports = router;
