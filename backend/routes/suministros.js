const express = require('express');
const router = express.Router();
const suministrosController = require('../controllers/suministrosController');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateJWT);

// Calculate MDP preview
router.post('/calculate-mdp', suministrosController.calculateMDP);

// Recalculate MDP for all records (admin only)
router.post('/recalculate-mdp', authorizeRoles('admin'), suministrosController.recalculateMDP);

// Recalculate MDP for a specific record (admin only)
router.post('/:id/recalculate-mdp', authorizeRoles('admin'), suministrosController.recalculateMDPById);

// Delete all records (admin only, for demos)
router.delete('/', authorizeRoles('admin'), suministrosController.deleteAll);

// CRUD routes
router.get('/', suministrosController.getAll);
router.get('/:id', suministrosController.getById);
router.post('/', suministrosController.create);
router.put('/:id', suministrosController.update);
router.delete('/:id', suministrosController.delete);

module.exports = router;
