const pool = require('../config/database');

const suministrosController = {
  getAll: async (req, res) => {
    try {
      const { fecha_inicio, fecha_fin, tecnico_id, galones_min, galones_max, page = 1, limit = 20 } = req.query;
      const conditions = ['1=1'];
      const values = [];
      let paramCount = 1;

      if (fecha_inicio) {
        conditions.push('s.fecha >= $' + paramCount);
        values.push(fecha_inicio);
        paramCount++;
      }
      if (fecha_fin) {
        conditions.push('s.fecha <= $' + paramCount);
        values.push(fecha_fin);
        paramCount++;
      }
      if (tecnico_id && req.user.rol === 'admin') {
        conditions.push('s.tecnico_id = $' + paramCount);
        values.push(tecnico_id);
        paramCount++;
      }
      if (galones_min) {
        conditions.push('s.galones >= $' + paramCount);
        values.push(galones_min);
        paramCount++;
      }
      if (galones_max) {
        conditions.push('s.galones <= $' + paramCount);
        values.push(galones_max);
        paramCount++;
      }
      if (req.user.rol === 'tecnico') {
        conditions.push('s.tecnico_id = $' + paramCount);
        values.push(req.user.id);
        paramCount++;
      }

      const whereClause = conditions.join(' AND ');
      const countQuery = 'SELECT COUNT(*) as count FROM suministros s JOIN tecnicos t ON s.tecnico_id = t.id WHERE ' + whereClause;
      const countResult = await pool.query(countQuery, values);
      const total = parseInt(countResult.rows[0].count);

      const query = 'SELECT s.*, t.nombre as tecnico_nombre, t.ficha as tecnico_ficha FROM suministros s JOIN tecnicos t ON s.tecnico_id = t.id WHERE ' + whereClause + ' ORDER BY s.fecha DESC, s.created_at DESC LIMIT $' + paramCount + ' OFFSET $' + (paramCount + 1);
      const limitValue = parseInt(limit);
      const offsetValue = (parseInt(page) - 1) * limitValue;
      values.push(limitValue, offsetValue);

      const result = await pool.query(query, values);
      res.json({ success: true, data: result.rows, pagination: { page: parseInt(page), limit: limitValue, total, pages: Math.ceil(total / limitValue) } });
    } catch (error) {
      console.error('Get all suministros error:', error);
      res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const query = 'SELECT s.*, t.nombre as tecnico_nombre, t.ficha as tecnico_ficha FROM suministros s JOIN tecnicos t ON s.tecnico_id = t.id WHERE s.id = $1';
      const result = await pool.query(query, [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Supply record not found' });
      }
      const record = result.rows[0];
      if (req.user.rol === 'tecnico' && record.tecnico_id !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
      res.json({ success: true, data: record });
    } catch (error) {
      console.error('Get suministro by ID error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },
};

module.exports = suministrosController;

suministrosController.create = async (req, res) => {
  try {
    const { ficha, kilometraje, galones, lectura_dispensador, fecha } = req.body;
    
    // Log para debug
    console.log('Datos recibidos:', { ficha, kilometraje, galones, lectura_dispensador, fecha });
    
    // Validar que los campos existan (permitir 0 como valor válido)
    if (!ficha || ficha.trim() === '') {
      return res.status(400).json({ success: false, message: 'Ficha del vehículo es requerida' });
    }
    if (kilometraje === undefined || kilometraje === null || kilometraje === '') {
      return res.status(400).json({ success: false, message: 'Kilometraje es requerido' });
    }
    if (galones === undefined || galones === null || galones === '') {
      return res.status(400).json({ success: false, message: 'Galones es requerido' });
    }
    if (lectura_dispensador === undefined || lectura_dispensador === null || lectura_dispensador === '') {
      return res.status(400).json({ success: false, message: 'Lectura del dispensador es requerida' });
    }
    
    // Validar valores numéricos
    if (parseFloat(galones) <= 0) {
      return res.status(400).json({ success: false, message: 'Galones debe ser mayor a 0' });
    }
    if (parseInt(kilometraje) <= 0) {
      return res.status(400).json({ success: false, message: 'Kilometraje debe ser mayor a 0' });
    }
    if (parseFloat(lectura_dispensador) < 0) {
      return res.status(400).json({ success: false, message: 'Lectura del dispensador debe ser mayor o igual a 0' });
    }
    
    // Obtener la tarjeta del técnico logueado
    const tecnicoResult = await pool.query('SELECT tarjeta FROM tecnicos WHERE id = $1', [req.user.id]);
    if (tecnicoResult.rows.length === 0 || !tecnicoResult.rows[0].tarjeta) {
      return res.status(400).json({ success: false, message: 'El técnico no tiene una tarjeta asignada. Contacte al administrador.' });
    }
    const tarjeta = tecnicoResult.rows[0].tarjeta;
    
    // Verificar que el kilometraje sea mayor al último registro del vehículo
    const kmCheck = await pool.query('SELECT MAX(kilometraje) as max_km FROM suministros WHERE ficha = $1', [ficha]);
    const maxKm = kmCheck.rows[0].max_km ? parseInt(kmCheck.rows[0].max_km) : 0;
    if (maxKm && parseInt(kilometraje) <= maxKm) {
      return res.status(400).json({ success: false, message: 'El kilometraje debe ser mayor al último registro del vehículo (' + maxKm + ' km)' });
    }
    
    // Obtener o crear el reporte activo del día
    let reporteActivo = await pool.query(
      `SELECT * FROM reportes_diarios WHERE estado = 'abierto' ORDER BY fecha DESC LIMIT 1`
    );

    if (reporteActivo.rows.length === 0) {
      // No hay reporte abierto, crear uno nuevo
      const lastReporte = await pool.query(
        `SELECT * FROM reportes_diarios ORDER BY fecha DESC LIMIT 1`
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
      reporteActivo = newReporte;
    }

    const reporte = reporteActivo.rows[0];
    
    // Obtener el último registro del reporte actual (más reciente por fecha/hora)
    const lastRegistroResult = await pool.query(
      `SELECT lectura_dispensador FROM suministros 
       WHERE reporte_id = $1 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [reporte.id]
    );


    
    // Calcular MDP (Margen de Pérdida)
    let mdp = null;
    let lecturaAnterior;
    
    if (lastRegistroResult.rows.length > 0) {
      // Hay registros previos en el reporte, usar la última lectura
      lecturaAnterior = parseFloat(lastRegistroResult.rows[0].lectura_dispensador);
    } else {
      // Es el primer registro del día, usar la lectura inicial del reporte
      lecturaAnterior = parseFloat(reporte.lectura_inicial);
    }
    
    const galonesActuales = parseFloat(galones);
    const lecturaActual = parseFloat(lectura_dispensador);
    
    // MDP = (Lectura Anterior + Galones Actuales) - Lectura Actual
    mdp = (lecturaAnterior + galonesActuales) - lecturaActual;
    
    const fechaToUse = fecha || new Date().toISOString().split('T')[0];
    const result = await pool.query(
      'INSERT INTO suministros (tecnico_id, ficha, kilometraje, tarjeta, galones, lectura_dispensador, fecha, mdp, reporte_id, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
      [req.user.id, ficha, parseInt(kilometraje), tarjeta, parseFloat(galones), parseFloat(lectura_dispensador), fechaToUse, mdp, reporte.id, req.user.id]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Create suministro error:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

suministrosController.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { ficha, kilometraje, tarjeta, galones, lectura_dispensador, fecha } = req.body;
    const existingRecord = await pool.query('SELECT * FROM suministros WHERE id = $1', [id]);
    if (existingRecord.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Supply record not found' });
    }
    const record = existingRecord.rows[0];
    if (req.user.rol !== 'admin' && record.tecnico_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const updates = [];
    const values = [];
    let paramCount = 1;
    if (kilometraje) {
      const kmValue = parseInt(kilometraje);
      if (kmValue <= 0) return res.status(400).json({ success: false, message: 'Kilometraje must be greater than 0' });
      updates.push('kilometraje = $' + paramCount);
      values.push(kmValue);
      paramCount++;
    }
    if (tarjeta) {
      updates.push('tarjeta = $' + paramCount);
      values.push(parseInt(tarjeta));
      paramCount++;
    }
    if (galones) {
      const galValue = parseFloat(galones);
      if (galValue <= 0) return res.status(400).json({ success: false, message: 'Galones must be greater than 0' });
      updates.push('galones = $' + paramCount);
      values.push(galValue);
      paramCount++;
    }
    if (lectura_dispensador) {
      updates.push('lectura_dispensador = $' + paramCount);
      values.push(parseFloat(lectura_dispensador));
      paramCount++;
    }
    if (fecha) {
      updates.push('fecha = $' + paramCount);
      values.push(fecha);
      paramCount++;
    }
    if (ficha) {
      updates.push('ficha = $' + paramCount);
      values.push(ficha);
      paramCount++;
    }
    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }
    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    const result = await pool.query('UPDATE suministros SET ' + updates.join(', ') + ' WHERE id = $' + paramCount + ' RETURNING *', values);
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Update suministro error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

suministrosController.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const existingRecord = await pool.query('SELECT * FROM suministros WHERE id = $1', [id]);
    if (existingRecord.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Supply record not found' });
    }
    const record = existingRecord.rows[0];
    if (req.user.rol !== 'admin' && record.tecnico_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    await pool.query('DELETE FROM suministros WHERE id = $1', [id]);
    res.json({ success: true, message: 'Supply record deleted successfully' });
  } catch (error) {
    console.error('Delete suministro error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Calculate MDP preview (without saving)
suministrosController.calculateMDP = async (req, res) => {
  try {
    const { ficha, galones, lectura_dispensador } = req.body;
    
    if (!ficha || !galones || !lectura_dispensador) {
      return res.status(400).json({ 
        success: false, 
        message: 'Ficha, galones y lectura_dispensador son requeridos' 
      });
    }

    // Obtener la última lectura del dispensador para este vehículo
    const lastLecturaResult = await pool.query(
      'SELECT lectura_dispensador, galones, fecha FROM suministros WHERE ficha = $1 ORDER BY fecha DESC, created_at DESC LIMIT 1',
      [ficha]
    );

    if (lastLecturaResult.rows.length === 0) {
      return res.json({
        success: true,
        data: {
          mdp: null,
          message: 'Este es el primer registro para este vehículo. No hay MDP que calcular.',
          hasHistory: false
        }
      });
    }

    const lastRecord = lastLecturaResult.rows[0];
    const lecturaAnterior = parseFloat(lastRecord.lectura_dispensador);
    const galonesActuales = parseFloat(galones);
    const lecturaActual = parseFloat(lectura_dispensador);

    // MDP = (Lectura Anterior + Galones Actuales) - Lectura Actual
    const mdp = (lecturaAnterior + galonesActuales) - lecturaActual;

    res.json({
      success: true,
      data: {
        mdp: parseFloat(mdp.toFixed(2)),
        lecturaAnterior: lecturaAnterior,
        galonesActuales: galonesActuales,
        lecturaActual: lecturaActual,
        esperado: parseFloat((lecturaAnterior + galonesActuales).toFixed(2)),
        diferencia: parseFloat(mdp.toFixed(2)),
        estado: mdp > 0 ? 'Pérdida' : mdp < 0 ? 'Ganancia' : 'Sin diferencia',
        hasHistory: true,
        lastRecord: {
          fecha: lastRecord.fecha,
          galones: lastRecord.galones,
          lectura: lastRecord.lectura_dispensador
        }
      }
    });
  } catch (error) {
    console.error('Calculate MDP error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al calcular MDP' 
    });
  }
};

// Recalculate MDP for all existing records
suministrosController.recalculateMDP = async (req, res) => {
  try {
    // Obtener todos los suministros ordenados por ficha y fecha
    const allRecords = await pool.query(
      'SELECT * FROM suministros ORDER BY ficha, fecha ASC, created_at ASC'
    );

    let updated = 0;
    let skipped = 0;
    const recordsByFicha = {};

    // Agrupar por ficha
    allRecords.rows.forEach(record => {
      if (!recordsByFicha[record.ficha]) {
        recordsByFicha[record.ficha] = [];
      }
      recordsByFicha[record.ficha].push(record);
    });

    // Recalcular MDP para cada ficha
    for (const ficha in recordsByFicha) {
      const records = recordsByFicha[ficha];
      
      for (let i = 0; i < records.length; i++) {
        const currentRecord = records[i];
        
        if (i === 0) {
          // Primer registro de este vehículo, MDP = null
          if (currentRecord.mdp !== null) {
            await pool.query('UPDATE suministros SET mdp = NULL WHERE id = $1', [currentRecord.id]);
            updated++;
          } else {
            skipped++;
          }
        } else {
          // Calcular MDP basado en el registro anterior
          const previousRecord = records[i - 1];
          const lecturaAnterior = parseFloat(previousRecord.lectura_dispensador);
          const galonesActuales = parseFloat(currentRecord.galones);
          const lecturaActual = parseFloat(currentRecord.lectura_dispensador);
          
          const mdp = (lecturaAnterior + galonesActuales) - lecturaActual;
          
          // Actualizar solo si el MDP es diferente o es null
          if (currentRecord.mdp === null || Math.abs(parseFloat(currentRecord.mdp) - mdp) > 0.001) {
            await pool.query(
              'UPDATE suministros SET mdp = $1 WHERE id = $2',
              [parseFloat(mdp.toFixed(2)), currentRecord.id]
            );
            updated++;
          } else {
            skipped++;
          }
        }
      }
    }

    res.json({
      success: true,
      message: 'MDP recalculado exitosamente',
      data: {
        totalRecords: allRecords.rows.length,
        updated: updated,
        skipped: skipped,
        vehiculos: Object.keys(recordsByFicha).length
      }
    });
  } catch (error) {
    console.error('Recalculate MDP error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al recalcular MDP',
      error: error.message
    });
  }
};

// Recalculate MDP for a specific record
suministrosController.recalculateMDPById = async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener el registro actual
    const currentResult = await pool.query(
      'SELECT * FROM suministros WHERE id = $1',
      [id]
    );

    if (currentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Registro no encontrado'
      });
    }

    const currentRecord = currentResult.rows[0];

    // Obtener el registro anterior más reciente por fecha/hora
    // NO importa la ficha porque todos usan el mismo dispensador
    const previousResult = await pool.query(
      `SELECT * FROM suministros
       WHERE id != $1
         AND (fecha < $2 OR (fecha = $2 AND created_at < $3))
       ORDER BY fecha DESC, created_at DESC
       LIMIT 1`,
      [id, currentRecord.fecha, currentRecord.created_at]
    );

    let mdp = null;

    if (previousResult.rows.length > 0) {
      // Hay un registro anterior, calcular MDP
      const previousRecord = previousResult.rows[0];
      const lecturaAnterior = parseFloat(previousRecord.lectura_dispensador);
      const galonesActuales = parseFloat(currentRecord.galones);
      const lecturaActual = parseFloat(currentRecord.lectura_dispensador);

      // MDP = (Lectura Anterior + Galones Actuales) - Lectura Actual
      const esperado = lecturaAnterior + galonesActuales;
      mdp = esperado - lecturaActual;
      mdp = parseFloat(mdp.toFixed(2));
    }

    // Actualizar el MDP
    const updateResult = await pool.query(
      'UPDATE suministros SET mdp = $1 WHERE id = $2 RETURNING *',
      [mdp, id]
    );

    res.json({
      success: true,
      message: mdp !== null ? '' : 'No hay registro anterior para comparar',
      data: {
        id: id,
        mdp: mdp,
        previousRecord: previousResult.rows.length > 0 ? {
          tecnico: previousResult.rows[0].tecnico_id,
          fecha: previousResult.rows[0].fecha,
          lectura: previousResult.rows[0].lectura_dispensador,
          galones: previousResult.rows[0].galones
        } : null,
        calculation: previousResult.rows.length > 0 ? {
          lecturaAnterior: parseFloat(previousResult.rows[0].lectura_dispensador),
          galonesActuales: parseFloat(currentRecord.galones),
          esperado: parseFloat((parseFloat(previousResult.rows[0].lectura_dispensador) + parseFloat(currentRecord.galones)).toFixed(2)),
          lecturaActual: parseFloat(currentRecord.lectura_dispensador),
          diferencia: mdp
        } : null,
        record: updateResult.rows[0]
      }
    });
  } catch (error) {
    console.error('Recalculate MDP by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al calcular MDP',
      error: error.message
    });
  }
};
