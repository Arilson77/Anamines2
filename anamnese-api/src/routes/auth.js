const router = require('express').Router();
const ctrl   = require('../controllers/auth');
const { loginLimiter, cadastroLimiter } = require('../middleware/rateLimiter');

router.post('/login',           loginLimiter,    ctrl.login);
router.post('/cadastro',        cadastroLimiter, ctrl.cadastro);
router.post('/esqueceu-senha',  loginLimiter,    ctrl.esqueceuSenha);
router.post('/redefinir-senha', loginLimiter,    ctrl.redefinirSenha);

module.exports = router;
