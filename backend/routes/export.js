const express = require('express');
const XLSX = require('xlsx');
const pool = require('../config/database');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Export suministros to Excel
router.get('/suministros', authenticateJWT, authorizeRoles('admin'), async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin, tecnico_id } = req.query;

    let query = `
      SELECT 
        s.id,
        t.nombre as tecnico,
        t.ficha as tecnico_ficha,
        s.ficha as vehiculo_ficha,
        s.kilometraje,
        s.tarjeta,
        s.galones,
        s.lectura_dispensador,
        s.fecha,
        s.created_at
      FROM suministros s
      JOIN tecnicos t ON s.tecnico_id = t.id
      WHERE 1=1
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
    if (tecnico_id) {
      query += ` AND s.tecnico_id = $${paramCount}`;
      values.push(tecnico_id);
      paramCount++;
    }

    query += ' ORDER BY s.fecha DESC';

    const result = await pool.query(query, values);

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(result.rows);

    // Set column widths
    ws['!cols'] = [
      { wch: 5 },  // ID
      { wch: 25 }, // Tecnico
      { wch: 15 }, // Tecnico Ficha
      { wch: 15 }, // Vehiculo Ficha
      { wch: 15 }, // Kilometraje
      { wch: 15 }, // Tarjeta
      { wch: 10 }, // Galones
      { wch: 20 }, // Lectura Dispensador
      { wch: 12 }, // Fecha
      { wch: 20 }, // Created At
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Suministros');

    // Generate buffer and send
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader(
      'Content-Disposition',
      'attachment; filename=suministros.xlsx'
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.send(buffer);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting data',
    });
  }
});

// Export technicians to Excel
router.get('/tecnicos', authenticateJWT, authorizeRoles('admin'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, nombre, ficha, rol, created_at FROM tecnicos ORDER BY created_at DESC`
    );

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(result.rows);

    ws['!cols'] = [
      { wch: 5 },  // ID
      { wch: 25 }, // Nombre
      { wch: 15 }, // Ficha
      { wch: 10 }, // Rol
      { wch: 20 }, // Created At
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Tecnicos');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader(
      'Content-Disposition',
      'attachment; filename=tecnicos.xlsx'
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.send(buffer);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting data',
    });
  }
});

module.exports = router;
