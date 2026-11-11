# Sistema de Reportes Diarios

## Descripción
El sistema ahora segmenta los suministros por día mediante "Reportes Diarios". Cada reporte tiene una lectura inicial y final del dispensador, y todos los suministros del día se asocian a ese reporte.

## Características

### 1. Apertura y Cierre Automático
- **Apertura**: Se crea automáticamente cuando el primer técnico registra un suministro del día
- **Cierre**: Debe cerrarse a las 5:00 PM diariamente (manual o automático)
- **Lectura Inicial**: La lectura final del reporte anterior
- **Lectura Final**: La última lectura registrada en el día

### 2. Cálculo de MDP por Reporte
- **Primer registro del día**: Se compara con la lectura inicial del reporte
- **Registros subsecuentes**: Se comparan con el registro anterior del mismo reporte
- **Detección de fraude**: Si la lectura es menor a la anterior, se marca en rojo ⚠️

### 3. Estados del Reporte
- **Abierto**: Reporte activo, acepta nuevos suministros
- **Cerrado**: Reporte finalizado, no acepta más suministros

## API Endpoints

### Obtener Reporte Activo
```
GET /api/reportes/activo
```
Retorna el reporte abierto del día actual. Si no existe, crea uno nuevo.

### Listar Todos los Reportes (Admin)
```
GET /api/reportes?page=1&limit=20&fecha_inicio=2024-01-01&fecha_fin=2024-12-31&estado=abierto
```

### Obtener Reporte por ID (Admin)
```
GET /api/reportes/:id
```
Retorna el reporte con todos sus suministros asociados.

### Cerrar Reporte Manualmente (Admin)
```
POST /api/reportes/:id/cerrar
Body: { "lectura_final": 1500.50 }
```

### Cerrar Reporte Automáticamente
```
POST /api/reportes/auto/cerrar
```
Cierra el reporte actual y crea uno nuevo para el siguiente día.

## Cierre Automático con Cron

### Opción 1: Cron del Sistema (Linux/Mac)
```bash
# Editar crontab
crontab -e

# Agregar línea para ejecutar a las 5 PM diariamente
0 17 * * * cd /ruta/al/proyecto/backend && node cron-close-report.js >> /var/log/fuel-recorder-cron.log 2>&1
```

### Opción 2: Task Scheduler (Windows)
1. Abrir "Programador de tareas"
2. Crear tarea básica
3. Nombre: "Cerrar Reporte Diario Fuel Recorder"
4. Desencadenador: Diariamente a las 5:00 PM
5. Acción: Iniciar programa
   - Programa: `node`
   - Argumentos: `cron-close-report.js`
   - Directorio: `C:\ruta\al\proyecto\backend`

### Opción 3: node-cron (Dentro de la aplicación)
Agregar al `server.js`:
```javascript
const cron = require('node-cron');

// Ejecutar todos los días a las 5 PM
cron.schedule('0 17 * * *', async () => {
  console.log('Ejecutando cierre automático de reporte...');
  try {
    const axios = require('axios');
    await axios.post('http://localhost:5000/api/reportes/auto/cerrar');
    console.log('Reporte cerrado exitosamente');
  } catch (error) {
    console.error('Error al cerrar reporte:', error.message);
  }
});
```

### Opción 4: Servicio Externo
- **EasyCron**: https://www.easycron.com/
- **Cron-job.org**: https://cron-job.org/
- Configurar para llamar a: `https://tu-dominio.com/api/reportes/auto/cerrar`

## Estructura de Base de Datos

### Tabla: reportes_diarios
```sql
id                SERIAL PRIMARY KEY
fecha             DATE NOT NULL UNIQUE
lectura_inicial   DECIMAL(10, 2) NOT NULL
lectura_final     DECIMAL(10, 2)
estado            VARCHAR(20) DEFAULT 'abierto'
fecha_apertura    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
fecha_cierre      TIMESTAMP
created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

### Tabla: suministros (actualizada)
Se agregó la columna:
```sql
reporte_id        INTEGER REFERENCES reportes_diarios(id)
```

## Flujo de Trabajo

### Día 1 (Inicio)
1. Sistema crea reporte con `lectura_inicial = 0`
2. Técnico A registra: lectura 100, galones 10
   - MDP = (0 + 10) - 100 = -90 (primera carga del día)
3. Técnico B registra: lectura 110, galones 10
   - MDP = (100 + 10) - 110 = 0 ✓
4. A las 5 PM: Reporte se cierra con `lectura_final = 110`

### Día 2
1. Sistema crea nuevo reporte con `lectura_inicial = 110`
2. Técnico C registra: lectura 120, galones 10
   - MDP = (110 + 10) - 120 = 0 ✓
3. Técnico D registra: lectura 125, galones 5
   - MDP = (120 + 5) - 125 = 0 ✓

## Detección de Fraudes

### Lectura Menor a la Anterior
Si un técnico registra una lectura menor a la anterior:
- La lectura se muestra en **rojo** con ⚠️
- Indica posible manipulación del dispensador
- Requiere investigación administrativa

### MDP Fuera de Rango
Si `|MDP| > 0.5`:
- Se muestra en **rojo**
- Indica pérdida o ganancia anormal de combustible

## Próximos Pasos

1. **Frontend Admin**: Crear página para ver y gestionar reportes diarios
2. **Dashboard**: Mostrar reporte activo con estadísticas del día
3. **Alertas**: Notificar cuando un reporte no se cierra a tiempo
4. **Reportes**: Generar PDF/Excel de reportes cerrados
