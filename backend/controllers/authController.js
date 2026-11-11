const bcrypt = require('bcrypt');
const pool = require('../config/database');
const { generateToken } = require('../utils/jwt');

const authController = {
  // Login
  login: async (req, res) => {
    try {
      const { tarjeta, password } = req.body;

      // Validation
      if (!tarjeta || !password) {
        return res.status(400).json({
          success: false,
          message: 'Tarjeta y contraseña son requeridas',
        });
      }

      // Find user by tarjeta
      const result = await pool.query(
        'SELECT * FROM tecnicos WHERE tarjeta = $1',
        [parseInt(tarjeta)]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas',
        });
      }

      const user = result.rows[0];

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);

      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas',
        });
      }

      // Generate token
      const token = generateToken(user);

      res.json({
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            nombre: user.nombre,
            ficha: user.ficha,
            tarjeta: user.tarjeta,
            rol: user.rol,
          },
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  },

  // Register (admin only)
  register: async (req, res) => {
    try {
      const { nombre, ficha, password, rol = 'tecnico' } = req.body;

      // Validation
      if (!nombre || !ficha || !password) {
        return res.status(400).json({
          success: false,
          message: 'Nombre, ficha, and password are required',
        });
      }

      // Check if ficha already exists
      const existingUser = await pool.query(
        'SELECT id FROM tecnicos WHERE ficha = $1',
        [ficha]
      );

      if (existingUser.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Ficha already exists',
        });
      }

      // Hash password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Insert new user
      const result = await pool.query(
        `INSERT INTO tecnicos (nombre, ficha, password_hash, rol) 
         VALUES ($1, $2, $3, $4) 
         RETURNING id, nombre, ficha, rol, created_at`,
        [nombre, ficha, passwordHash, rol]
      );

      const newUser = result.rows[0];

      res.status(201).json({
        success: true,
        data: newUser,
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  },

  // Get current user
  me: async (req, res) => {
    try {
      const result = await pool.query(
        'SELECT id, nombre, ficha, tarjeta, rol, created_at FROM tecnicos WHERE id = $1',
        [req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      res.json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  },
};

module.exports = authController;
