-- Crear tabla de reportes diarios
CREATE TABLE IF NOT EXISTS reportes_diarios (
    id SERIAL PRIMARY KEY,
    fecha DATE NOT NULL UNIQUE,
    lectura_inicial DECIMAL(10, 2) NOT NULL,
    lectura_final DECIMAL(10, 2),
    estado VARCHAR(20) DEFAULT 'abierto' CHECK (estado IN ('abierto', 'cerrado')),
    fecha_apertura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_cierre TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Agregar columna reporte_id a suministros
ALTER TABLE suministros ADD COLUMN IF NOT EXISTS reporte_id INTEGER REFERENCES reportes_diarios(id);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_reportes_fecha ON reportes_diarios(fecha);
CREATE INDEX IF NOT EXISTS idx_reportes_estado ON reportes_diarios(estado);
CREATE INDEX IF NOT EXISTS idx_suministros_reporte ON suministros(reporte_id);

-- Insertar reporte inicial si no existe
INSERT INTO reportes_diarios (fecha, lectura_inicial, estado)
SELECT CURRENT_DATE, 0, 'abierto'
WHERE NOT EXISTS (SELECT 1 FROM reportes_diarios WHERE fecha = CURRENT_DATE);
