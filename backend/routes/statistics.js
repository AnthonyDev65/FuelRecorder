const express = require('express');
const router = express.Router();
const statisticsController = require('../controllers/statisticsController');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth');

// All routes require authentication and admin role
router.use(authenticateJWT);
router.use(authorizeRoles('admin'));

router.get('/dashboard', statisticsController.getDashboard);
router.get('/galones-by-tecnico', statisticsController.getGalonesByTecnico);
router.get('/consumo-por-fecha', statisticsController.getConsumoPorFecha);
router.get('/recent-activity', statisticsController.getRecentActivity);

module.exports = router;
