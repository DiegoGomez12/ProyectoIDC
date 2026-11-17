const router = require('express').Router();
const ctrl = require('../controllers/usuarios.controller');
const { autenticar, soloAdmin } = require('../middlewares/auth');

router.post('/', ctrl.crear);
router.get('/', autenticar, soloAdmin, ctrl.listar);
router.get('/:id', autenticar, ctrl.obtener);
router.put('/:id', autenticar, ctrl.actualizar);
router.delete('/:id', autenticar, soloAdmin, ctrl.eliminar);

module.exports = router;