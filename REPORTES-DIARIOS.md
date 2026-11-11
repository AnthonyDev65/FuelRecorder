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

### Cerrar Reporte Abierto Ahora (Admin)
```
POST /api/reportes/auto/cerrar
```
Cierra el reporte abierto con la última lectura del dispensador y abre el siguiente.

## Cierre Automático

La propia API cierra el reporte cada día (`backend/utils/reportes.js`); no hace falta cron ni servicios externos.
Revisa cada minuto y, si el reporte abierto ya venció, lo cierra y abre el del día siguiente.
Si la API estuvo apagada a la hora de cierre, lo cierra en cuanto vuelve a arrancar.

Variables de entorno del backend:

```env
REPORTE_HORA_CIERRE=17:00         # HH:MM, por defecto 17:00
TZ=America/Santo_Domingo          # zona horaria de la operación (por defecto esta)
```

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
