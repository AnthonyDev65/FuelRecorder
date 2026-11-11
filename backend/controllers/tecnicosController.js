const bcrypt = require('bcrypt');
const pool = require('../config/database');

const tecnicosController = {
  // Get all technicians
  getAll: async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT id, nombre, ficha, tarjeta, rol, created_at, updated_at 
         FROM tecnicos 
         ORDER BY created_at DESC`
      );

      res.json({
        success: true,
        count: result.rows.length,
        data: result.rows,
      });
    } catch (error) {
      console.error('Get all tecnicos error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  },

  // Get technician by ID
  getById: async (req, res) => {
    try {
      const { id } = req.params;

      const result = await pool.query(
        `SELECT id, nombre, ficha, tarjeta, rol, created_at, updated_at 
         FROM tecnicos 
         WHERE id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Technician not found',
        });
      }

      res.json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      console.error('Get tecnico by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  },

  // Create technician
  create: async (req, res) => {
    try {
      const { nombre, ficha, tarjeta, password, rol = 'tecnico' } = req.body;

      // Validation
      if (!nombre || !ficha || !tarjeta || !password) {
        return res.status(400).json({
          success: false,
          message: 'Nombre, ficha, tarjeta y password son requeridos',
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
          message: 'La ficha ya existe',
        });
      }

      // Check if tarjeta already exists
      const existingTarjeta = await pool.query(
        'SELECT id FROM tecnicos WHERE tarjeta = $1',
        [tarjeta]
      );

      if (existingTarjeta.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'La tarjeta ya existe',
        });
      }

      // Hash password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Insert new technician
      const result = await pool.query(
        `INSERT INTO tecnicos (nombre, ficha, tarjeta, password_hash, rol) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING id, nombre, ficha, tarjeta, rol, created_at`,
        [nombre, ficha, parseInt(tarjeta), passwordHash, rol]
      );

      res.status(201).json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      console.error('Create tecnico error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  },

  // Update technician
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { nombre, ficha, tarjeta, password, rol } = req.body;

      // Check if technician exists
      const existingUser = await pool.query(
        'SELECT id FROM tecnicos WHERE id = $1',
        [id]
      );

      if (existingUser.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Technician not found',
        });
      }

      // If changing ficha, check uniqueness
      if (ficha) {
        const fichaExists = await pool.query(
          'SELECT id FROM tecnicos WHERE ficha = $1 AND id != $2',
          [ficha, id]
        );

        if (fichaExists.rows.length > 0) {
          return res.status(409).json({
            success: false,
            message: 'Ficha already exists',
          });
        }
      }

      // If changing tarjeta, check uniqueness
      if (tarjeta) {
        const tarjetaExists = await pool.query(
          'SELECT id FROM tecnicos WHERE tarjeta = $1 AND id != $2',
          [tarjeta, id]
        );

        if (tarjetaExists.rows.length > 0) {
          return res.status(409).json({
            success: false,
            message: 'Tarjeta already exists',
          });
        }
      }

      // Build dynamic update query
      const updates = [];
      const values = [];
      let paramCount = 1;

      if (nombre) {
        updates.push(`nombre = $${paramCount}`);
        values.push(nombre);
        paramCount++;
      }
      if (ficha) {
        updates.push(`ficha = $${paramCount}`);
        values.push(ficha);
        paramCount++;
      }
      if (rol) {
        updates.push(`rol = $${paramCount}`);
        values.push(rol);
        paramCount++;
      }
      if (password) {
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        updates.push(`password_hash = $${paramCount}`);
        values.push(passwordHash);
        paramCount++;
      }

      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No fields to update',
        });
      }

      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(id);

      const result = await pool.query(
        `UPDATE tecnicos 
         SET ${updates.join(', ')} 
         WHERE id = $${paramCount} 
         RETURNING id, nombre, ficha, rol, created_at, updated_at`,
        values
      );

      res.json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      console.error('Update tecnico error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  },

  // Delete technician
  delete: async (req, res) => {
    try {
      const { id } = req.params;

      // Prevent self-deletion
      if (parseInt(id) === req.user.id) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete your own account',
        });
      }

      const result = await pool.query(
        'DELETE FROM tecnicos WHERE id = $1 RETURNING id',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Technician not found',
        });
      }

      res.json({
        success: true,
        message: 'Technician deleted successfully',
      });
    } catch (error) {
      console.error('Delete tecnico error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  },
};

module.exports = tecnicosController;
