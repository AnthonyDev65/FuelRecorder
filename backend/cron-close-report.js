// Script para cerrar reportes automáticamente
// Este script debe ejecutarse diariamente a las 5 PM
// Puede configurarse con cron, node-cron, o un servicio externo

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:5000';

async function closeReport() {
  try {
    console.log(`[${new Date().toISOString()}] Iniciando cierre automático de reporte...`);
    
    const response = await axios.post(`${API_URL}/api/reportes/auto/cerrar`);
    
    if (response.data.success) {
      console.log(`[${new Date().toISOString()}] ✓ Reporte cerrado exitosamente`);
      console.log('Reporte cerrado:', response.data.data.reporteCerrado);
      console.log('Nuevo reporte:', response.data.data.nuevoReporte);
    } else {
      console.log(`[${new Date().toISOString()}] ${response.data.message}`);
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ✗ Error al cerrar reporte:`, error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

closeReport();
