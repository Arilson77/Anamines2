const router     = require('express').Router();
const autenticar = require('../middleware/autenticar');
const ctrl       = require('../controllers/whatsapp');

router.use(autenticar);
router.get('/status',      ctrl.status);
router.get('/qrcode',      ctrl.qrcode);
router.delete('/desconectar', ctrl.desconectar);
router.post('/testar',     ctrl.testar);

module.exports = router;
