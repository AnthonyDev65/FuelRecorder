-- Agregar campo mdp (Margen de Pérdida) a la tabla suministros
ALTER TABLE suministros ADD COLUMN IF NOT EXISTS mdp DECIMAL(10, 2);

-- Comentario: MDP = (Lectura Anterior + Galones Actuales) - Lectura Actual
-- Un valor positivo indica pérdida, negativo indica ganancia
