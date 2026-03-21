const router = require('express').Router();
const ctrl   = require('../controllers/auth');

router.post('/login',    ctrl.login);
router.post('/cadastro', ctrl.cadastro);

module.exports = router;
