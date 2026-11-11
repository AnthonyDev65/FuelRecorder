-- FuelRecorder Database Schema
-- PostgreSQL Schema for Fuel Supply Management

-- Create enum for user roles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'tecnico');
    END IF;
END
$$;

-- Table: tecnicos (users/technicians)
CREATE TABLE IF NOT EXISTS tecnicos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    ficha VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol user_role DEFAULT 'tecnico',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: suministros (fuel supplies)
CREATE TABLE IF NOT EXISTS suministros (
    id SERIAL PRIMARY KEY,
    tecnico_id INTEGER NOT NULL REFERENCES tecnicos(id) ON DELETE CASCADE,
    ficha VARCHAR(50) NOT NULL,
    kilometraje INTEGER NOT NULL,
    tarjeta BIGINT NOT NULL,
    galones DECIMAL(10, 2) NOT NULL CHECK (galones > 0),
    lectura_dispensador DECIMAL(10, 2) NOT NULL,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES tecnicos(id) ON DELETE SET NULL
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_suministros_tecnico_id ON suministros(tecnico_id);
CREATE INDEX IF NOT EXISTS idx_suministros_fecha ON suministros(fecha);
CREATE INDEX IF NOT EXISTS idx_suministros_ficha ON suministros(ficha);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_tecnicos_updated_at ON tecnicos;
CREATE TRIGGER update_tecnicos_updated_at
    BEFORE UPDATE ON tecnicos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_suministros_updated_at ON suministros;
CREATE TRIGGER update_suministros_updated_at
    BEFORE UPDATE ON suministros
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- El usuario admin inicial lo crea migrate.js a partir de ADMIN_FICHA / ADMIN_PASSWORD

-- Helper function to get galones summary by tecnico
CREATE OR REPLACE FUNCTION get_galones_by_tecnico(start_date DATE DEFAULT NULL, end_date DATE DEFAULT NULL)
RETURNS TABLE (
    tecnico_id INTEGER,
    nombre VARCHAR(100),
    ficha VARCHAR(50),
    total_galones DECIMAL,
    total_registros BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id as tecnico_id,
        t.nombre,
        t.ficha,
        COALESCE(SUM(s.galones), 0) as total_galones,
        COUNT(s.id) as total_registros
    FROM tecnicos t
    LEFT JOIN suministros s ON t.id = s.tecnico_id
        AND (start_date IS NULL OR s.fecha >= start_date)
        AND (end_date IS NULL OR s.fecha <= end_date)
    WHERE t.rol = 'tecnico'
    GROUP BY t.id, t.nombre, t.ficha
    ORDER BY total_galones DESC;
END;
$$ LANGUAGE plpgsql;

-- Helper function to get consumption by date range
CREATE OR REPLACE FUNCTION get_consumo_por_fecha(start_date DATE, end_date DATE)
RETURNS TABLE (
    fecha DATE,
    total_galones DECIMAL,
    total_registros BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.fecha,
        SUM(s.galones) as total_galones,
        COUNT(s.id) as total_registros
    FROM suministros s
    WHERE s.fecha BETWEEN start_date AND end_date
    GROUP BY s.fecha
    ORDER BY s.fecha ASC;
END;
$$ LANGUAGE plpgsql;
