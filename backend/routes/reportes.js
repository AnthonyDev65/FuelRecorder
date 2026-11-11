const express = require('express');
const router = express.Router();
const reportesController = require('../controllers/reportesController');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(authenticateJWT);

// Obtener reporte activo (abierto)
router.get('/activo', reportesController.getReporteActivo);

// Obtener todos los reportes (solo admin)
router.get('/', authorizeRoles('admin'), reportesController.getAll);

// Obtener reporte por ID (solo admin)
router.get('/:id', authorizeRoles('admin'), reportesController.getById);

// Cerrar reporte manualmente (solo admin)
router.post('/:id/cerrar', authorizeRoles('admin'), reportesController.cerrarReporte);

// Cerrar reporte automáticamente (endpoint para cron job)
router.post('/auto/cerrar', reportesController.cerrarReporteAutomatico);

module.exports = router;
