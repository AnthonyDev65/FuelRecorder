const pool = require('../config/database');

const reportesController = {
  // Obtener el reporte activo (abierto) del día
  getReporteActivo: async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT * FROM reportes_diarios 
         WHERE estado = 'abierto' 
         ORDER BY fecha DESC 
         LIMIT 1`
      );

      if (result.rows.length === 0) {
        // No hay reporte abierto, crear uno nuevo
        const lastReporte = await pool.query(
          `SELECT * FROM reportes_diarios 
           ORDER BY fecha DESC 
           LIMIT 1`
        );

        let lecturaInicial = 0;
        if (lastReporte.rows.length > 0 && lastReporte.rows[0].lectura_final) {
          lecturaInicial = lastReporte.rows[0].lectura_final;
        }

        const newReporte = await pool.query(
          `INSERT INTO reportes_diarios (fecha, lectura_inicial, estado) 
           VALUES (CURRENT_DATE, $1, 'abierto') 
           RETURNING *`,
          [lecturaInicial]
        );

        return res.json({ success: true, data: newReporte.rows[0] });
      }

      res.json({ success: true, data: result.rows[0] });
    } catch (error) {
      console.error('Get reporte activo error:', error);
      res.status(500).json({ success: false, message: 'Error al obtener reporte activo' });
    }
  },

  // Obtener todos los reportes con paginación
  getAll: async (req, res) => {
    try {
      const { fecha_inicio, fecha_fin, estado, page = 1, limit = 20 } = req.query;
      const conditions = ['1=1'];
      const values = [];
      let paramCount = 1;

      if (fecha_inicio) {
        conditions.push(`fecha >= $${paramCount}`);
        values.push(fecha_inicio);
        paramCount++;
      }
      if (fecha_fin) {
        conditions.push(`fecha <= $${paramCount}`);
        values.push(fecha_fin);
        paramCount++;
      }
      if (estado) {
        conditions.push(`estado = $${paramCount}`);
        values.push(estado);
        paramCount++;
      }

      const whereClause = conditions.join(' AND ');
      
      // Contar total
      const countQuery = `SELECT COUNT(*) as count FROM reportes_diarios WHERE ${whereClause}`;
      const countResult = await pool.query(countQuery, values);
      const total = parseInt(countResult.rows[0].count);

      // Obtener reportes con conteo de suministros
      const query = `
        SELECT r.*, 
               COUNT(s.id) as total_suministros,
               COALESCE(SUM(s.galones), 0) as total_galones
        FROM reportes_diarios r
        LEFT JOIN suministros s ON s.reporte_id = r.id
        WHERE ${whereClause}
        GROUP BY r.id
        ORDER BY r.fecha DESC
        LIMIT $${paramCount} OFFSET $${paramCount + 1}
      `;
      
      const limitValue = parseInt(limit);
      const offsetValue = (parseInt(page) - 1) * limitValue;
      values.push(limitValue, offsetValue);

      const result = await pool.query(query, values);
      
      res.json({
        success: true,
        data: result.rows,
        pagination: {
          page: parseInt(page),
          limit: limitValue,
          total,
          pages: Math.ceil(total / limitValue)
        }
      });
    } catch (error) {
      console.error('Get all reportes error:', error);
      res.status(500).json({ success: false, message: 'Error al obtener reportes' });
    }
  },

  // Obtener reporte por ID con sus suministros
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const reporteResult = await pool.query(
        `SELECT r.*, 
                COUNT(s.id) as total_suministros,
                COALESCE(SUM(s.galones), 0) as total_galones
         FROM reportes_diarios r
         LEFT JOIN suministros s ON s.reporte_id = r.id
         WHERE r.id = $1
         GROUP BY r.id`,
        [id]
      );

      if (reporteResult.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Reporte no encontrado' });
      }

      // Obtener suministros del reporte
      const suministrosResult = await pool.query(
        `SELECT s.*, t.nombre as tecnico_nombre, t.ficha as tecnico_ficha
         FROM suministros s
         JOIN tecnicos t ON s.tecnico_id = t.id
         WHERE s.reporte_id = $1
         ORDER BY s.created_at ASC`,
        [id]
      );

      res.json({
        success: true,
        data: {
          reporte: reporteResult.rows[0],
          suministros: suministrosResult.rows
        }
      });
    } catch (error) {
      console.error('Get reporte by ID error:', error);
      res.status(500).json({ success: false, message: 'Error al obtener reporte' });
    }
  },

  // Cerrar reporte manualmente
  cerrarReporte: async (req, res) => {
    try {
      const { id } = req.params;
      const { lectura_final } = req.body;

      if (!lectura_final) {
        return res.status(400).json({ success: false, message: 'Lectura final es requerida' });
      }

      // Verificar que el reporte existe y está abierto
      const reporteResult = await pool.query(
        'SELECT * FROM reportes_diarios WHERE id = $1',
        [id]
      );

      if (reporteResult.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Reporte no encontrado' });
      }

      if (reporteResult.rows[0].estado === 'cerrado') {
        return res.status(400).json({ success: false, message: 'El reporte ya está cerrado' });
      }

      // Cerrar el reporte
      const result = await pool.query(
        `UPDATE reportes_diarios 
         SET lectura_final = $1, estado = 'cerrado', fecha_cierre = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING *`,
        [parseFloat(lectura_final), id]
      );

      res.json({ success: true, data: result.rows[0], message: 'Reporte cerrado exitosamente' });
    } catch (error) {
      console.error('Cerrar reporte error:', error);
      res.status(500).json({ success: false, message: 'Error al cerrar reporte' });
    }
  },

  // Cerrar reporte automáticamente (llamado por cron job)
  cerrarReporteAutomatico: async (req, res) => {
    try {
      // Obtener el reporte abierto
      const reporteResult = await pool.query(
        `SELECT * FROM reportes_diarios WHERE estado = 'abierto' ORDER BY fecha DESC LIMIT 1`
      );

      if (reporteResult.rows.length === 0) {
        return res.json({ success: true, message: 'No hay reportes abiertos para cerrar' });
      }

      const reporte = reporteResult.rows[0];

      // Obtener la última lectura del dispensador del día
      const lastLecturaResult = await pool.query(
        `SELECT lectura_dispensador FROM suministros 
         WHERE reporte_id = $1 
         ORDER BY created_at DESC 
         LIMIT 1`,
        [reporte.id]
      );

      let lecturaFinal = reporte.lectura_inicial;
      if (lastLecturaResult.rows.length > 0) {
        lecturaFinal = lastLecturaResult.rows[0].lectura_dispensador;
      }

      // Cerrar el reporte actual
      await pool.query(
        `UPDATE reportes_diarios 
         SET lectura_final = $1, estado = 'cerrado', fecha_cierre = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [lecturaFinal, reporte.id]
      );

      // Crear nuevo reporte para el siguiente día
      const newReporte = await pool.query(
        `INSERT INTO reportes_diarios (fecha, lectura_inicial, estado) 
         VALUES (CURRENT_DATE + INTERVAL '1 day', $1, 'abierto') 
         RETURNING *`,
        [lecturaFinal]
      );

      res.json({
        success: true,
        message: 'Reporte cerrado y nuevo reporte creado',
        data: {
          reporteCerrado: { ...reporte, lectura_final: lecturaFinal, estado: 'cerrado' },
          nuevoReporte: newReporte.rows[0]
        }
      });
    } catch (error) {
      console.error('Cerrar reporte automático error:', error);
      res.status(500).json({ success: false, message: 'Error al cerrar reporte automáticamente' });
    }
  }
};

module.exports = reportesController;
