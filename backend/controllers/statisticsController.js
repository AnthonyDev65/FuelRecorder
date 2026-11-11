const pool = require('../config/database');

const statisticsController = {
  // Get dashboard statistics
  getDashboard: async (req, res) => {
    try {
      const { fecha_inicio, fecha_fin } = req.query;

      // Total records
      let countQuery = 'SELECT COUNT(*) as total FROM suministros WHERE 1=1';
      const countValues = [];
      let paramCount = 1;

      if (fecha_inicio) {
        countQuery += ` AND fecha >= $${paramCount}`;
        countValues.push(fecha_inicio);
        paramCount++;
      }
      if (fecha_fin) {
        countQuery += ` AND fecha <= $${paramCount}`;
        countValues.push(fecha_fin);
        paramCount++;
      }

      const countResult = await pool.query(countQuery, countValues);

      // Total galones
      let galonesQuery = 'SELECT COALESCE(SUM(galones), 0) as total FROM suministros WHERE 1=1';
      if (fecha_inicio || fecha_fin) {
        galonesQuery = countQuery.replace('COUNT(*) as total', 'COALESCE(SUM(galones), 0) as total');
      }
      const galonesResult = await pool.query(galonesQuery, countValues);

      // Average galones per record
      let avgQuery = 'SELECT COALESCE(AVG(galones), 0) as average FROM suministros WHERE 1=1';
      if (fecha_inicio || fecha_fin) {
        avgQuery = countQuery.replace('COUNT(*) as total', 'COALESCE(AVG(galones), 0) as average');
      }
      const avgResult = await pool.query(avgQuery, countValues);

      // Total technicians
      const tecnicosResult = await pool.query(
        "SELECT COUNT(*) as total FROM tecnicos WHERE rol = 'tecnico'"
      );

      res.json({
        success: true,
        data: {
          total_registros: parseInt(countResult.rows[0].total),
          total_galones: parseFloat(galonesResult.rows[0].total),
          promedio_galones: parseFloat(avgResult.rows[0].average),
          total_tecnicos: parseInt(tecnicosResult.rows[0].total),
        },
      });
    } catch (error) {
      console.error('Get dashboard error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  },

  // Get galones summary by technician
  getGalonesByTecnico: async (req, res) => {
    try {
      const { fecha_inicio, fecha_fin } = req.query;

      let query = `
        SELECT 
          t.id,
          t.nombre,
          t.ficha,
          COALESCE(SUM(s.galones), 0) as total_galones,
          COUNT(s.id) as total_registros
        FROM tecnicos t
        LEFT JOIN suministros s ON t.id = s.tecnico_id
        WHERE t.rol = 'tecnico'
      `;
      const values = [];
      let paramCount = 1;

      if (fecha_inicio) {
        query += ` AND s.fecha >= $${paramCount}`;
        values.push(fecha_inicio);
        paramCount++;
      }
      if (fecha_fin) {
        query += ` AND s.fecha <= $${paramCount}`;
        values.push(fecha_fin);
        paramCount++;
      }

      query += ` GROUP BY t.id, t.nombre, t.ficha ORDER BY total_galones DESC`;

      const result = await pool.query(query, values);

      res.json({
        success: true,
        data: result.rows,
      });
    } catch (error) {
      console.error('Get galones by tecnico error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  },

  // Get consumption by date
  getConsumoPorFecha: async (req, res) => {
    try {
      const { fecha_inicio, fecha_fin } = req.query;

      if (!fecha_inicio || !fecha_fin) {
        return res.status(400).json({
          success: false,
          message: 'fecha_inicio and fecha_fin are required',
        });
      }

      const query = `
        SELECT 
          fecha,
          COUNT(*) as total_registros,
          SUM(galones) as total_galones,
          AVG(galones) as promedio_galones
        FROM suministros
        WHERE fecha >= $1 AND fecha <= $2
        GROUP BY fecha
        ORDER BY fecha ASC
      `;

      const result = await pool.query(query, [fecha_inicio, fecha_fin]);

      res.json({
        success: true,
        data: result.rows,
      });
    } catch (error) {
      console.error('Get consumo por fecha error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  },

  // Get recent activity
  getRecentActivity: async (req, res) => {
    try {
      const { limit = 5 } = req.query;

      const result = await pool.query(
        `SELECT 
          s.*,
          t.nombre as tecnico_nombre,
          t.ficha as tecnico_ficha
        FROM suministros s
        JOIN tecnicos t ON s.tecnico_id = t.id
        ORDER BY s.created_at DESC
        LIMIT $1`,
        [parseInt(limit)]
      );

      res.json({
        success: true,
        data: result.rows,
      });
    } catch (error) {
      console.error('Get recent activity error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  },
};

module.exports = statisticsController;
