-- Agregar campo tarjeta a la tabla tecnicos
ALTER TABLE tecnicos ADD COLUMN IF NOT EXISTS tarjeta BIGINT;

-- Actualizar el admin con una tarjeta de ejemplo
UPDATE tecnicos SET tarjeta = 1001 WHERE ficha = 'ADMIN001';

-- Comentario: Cada técnico debe tener su tarjeta única
-- La tarjeta se usará automáticamente al crear suministros
