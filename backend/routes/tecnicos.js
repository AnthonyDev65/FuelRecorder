const express = require('express');
const router = express.Router();
const tecnicosController = require('../controllers/tecnicosController');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateJWT);

// Admin only routes
router.post('/', authorizeRoles('admin'), tecnicosController.create);
router.put('/:id', authorizeRoles('admin'), tecnicosController.update);
router.delete('/:id', authorizeRoles('admin'), tecnicosController.delete);

// Routes accessible by admin and technicians
router.get('/', authorizeRoles('admin'), tecnicosController.getAll);
router.get('/:id', authorizeRoles('admin'), tecnicosController.getById);

module.exports = router;
