const router = require('express').Router();
const ctrl = require('../controllers/asistencias.controller');
const { autenticar, soloAdmin } = require('../middlewares/auth');

// Rutas para empleados autenticados
router.post('/check-in', autenticar, ctrl.checkIn);
router.post('/check-out', autenticar, ctrl.checkOut);
router.get('/mis-registros', autenticar, ctrl.misRegistros);
router.get('/estado', autenticar, ctrl.obtenerEstado);

// Ruta exclusiva para administradores (reportes / supervisión)
router.get('/', autenticar, soloAdmin, ctrl.listar);

module.exports = router;
