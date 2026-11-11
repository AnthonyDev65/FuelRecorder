const pool = require('../config/database');

const ZONA = process.env.TZ || 'America/Santo_Domingo';
const HORA_CIERRE = process.env.REPORTE_HORA_CIERRE || '17:00';

// Fecha (YYYY-MM-DD) y hora (HH:MM) actuales en la zona de la operación
function ahora() {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: ZONA,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(new Date())
      .map((p) => [p.type, p.value])
  );
  return {
    fecha: `${partes.year}-${partes.month}-${partes.day}`,
    hora: `${partes.hour}:${partes.minute}`,
  };
}

const pasoHoraCierre = () => ahora().hora >= HORA_CIERRE;

// Crea un reporte abierto: hoy, o mañana si ya pasó la hora de cierre.
// Si esa fecha ya tiene reporte (fecha es UNIQUE), usa el siguiente día libre.
async function crearReporte(lecturaInicial, client = pool) {
  const { fecha } = ahora();
  const desde = pasoHoraCierre() ? '($1::date + 1)' : '$1::date';
  const result = await client.query(
    `INSERT INTO reportes_diarios (fecha, lectura_inicial, estado)
     SELECT MIN(d)::date, $2, 'abierto'
     FROM generate_series(${desde}, $1::date + 60, interval '1 day') d
     WHERE NOT EXISTS (SELECT 1 FROM reportes_diarios r WHERE r.fecha = d::date)
     RETURNING *`,
    [fecha, lecturaInicial]
  );
  return result.rows[0];
}

// Cierra el reporte abierto con la última lectura del dispensador y abre el siguiente.
// Devuelve null si no había reporte abierto.
async function cerrarReporteAbierto() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const reporteResult = await client.query(
      `SELECT * FROM reportes_diarios WHERE estado = 'abierto'
       ORDER BY fecha DESC LIMIT 1 FOR UPDATE`
    );
    if (reporteResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return null;
    }
    const reporte = reporteResult.rows[0];

    const lastLecturaResult = await client.query(
      `SELECT lectura_dispensador FROM suministros
       WHERE reporte_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [reporte.id]
    );
    const lecturaFinal = lastLecturaResult.rows.length > 0
      ? lastLecturaResult.rows[0].lectura_dispensador
      : reporte.lectura_inicial;

    await client.query(
      `UPDATE reportes_diarios
       SET lectura_final = $1, estado = 'cerrado', fecha_cierre = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [lecturaFinal, reporte.id]
    );

    const nuevoReporte = await crearReporte(lecturaFinal, client);

    await client.query('COMMIT');
    return {
      reporteCerrado: { ...reporte, lectura_final: lecturaFinal, estado: 'cerrado' },
      nuevoReporte,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// ¿Hay un reporte abierto que ya debería estar cerrado?
// (de un día anterior, o de hoy y ya pasó la hora de cierre)
async function hayReporteVencido() {
  const result = await pool.query(
    `SELECT fecha::text AS fecha FROM reportes_diarios
     WHERE estado = 'abierto' ORDER BY fecha DESC LIMIT 1`
  );
  if (result.rows.length === 0) return false;

  const { fecha } = ahora();
  const fechaReporte = result.rows[0].fecha;
  return fechaReporte < fecha || (fechaReporte === fecha && pasoHoraCierre());
}

const UN_MINUTO = 60 * 1000;

// Revisa cada minuto; si la API estuvo caída a la hora de cierre, cierra al volver.
// while: se repite mientras la API esté encendida. El await de la espera libera el
// servidor entre vueltas, así que el bucle no bloquea las peticiones.
async function iniciarCierreAutomatico() {
  console.log(`⏰ Cierre automático de reportes a las ${HORA_CIERRE} (${ZONA})`);

  while (true) {
    try {
      if (await hayReporteVencido()) {
        const resultado = await cerrarReporteAbierto();
        if (resultado) {
          console.log(
            `✓ Reporte ${resultado.reporteCerrado.id} cerrado automáticamente; ` +
              `abierto el del ${resultado.nuevoReporte.fecha.toISOString().slice(0, 10)}`
          );
        }
      }
    } catch (error) {
      console.error('Error en el cierre automático de reportes:', error.message);
    }

    await new Promise((r) => setTimeout(r, UN_MINUTO));
  }
}

module.exports = { crearReporte, cerrarReporteAbierto, iniciarCierreAutomatico };
