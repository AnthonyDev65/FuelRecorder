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

// Cerrar el reporte abierto y abrir el siguiente (solo admin).
// Va antes de /:id/cerrar para que "auto" no se tome como id.
// El cierre diario lo hace la propia API (utils/reportes.js).
router.post('/auto/cerrar', authorizeRoles('admin'), reportesController.cerrarReporteAutomatico);

// Cerrar reporte manualmente (solo admin)
router.post('/:id/cerrar', authorizeRoles('admin'), reportesController.cerrarReporte);

module.exports = router;
