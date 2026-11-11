-- =============================================
-- FuelRecorder - Crear Usuario Admin Inicial
-- =============================================
-- Ejecutar este script para crear el primer admin
-- Password por defecto: admin123
-- IMPORTANTE: Cambiar la contraseña después del primer login
-- =============================================

-- Generar hash de contraseña con bcrypt para 'admin123'
-- Hash pre-generado (cambiar en producción)
-- Puedes generar tu propio hash en: https://bcrypt-generator.com/

INSERT INTO tecnicos (nombre, ficha, password_hash, rol)
VALUES (
  'Administrador Principal',
  'ADMIN001',
  '$2b$10$NzJQDDtFQC2rdmNjyr9xI.IyYmfY5mE9HBYG3VfNm0S83Z9hvBDqC',
  'admin'
) ON CONFLICT (ficha) DO NOTHING;

-- Crear algunos técnicos de prueba (opcional)
-- Descomenta las siguientes líneas si quieres técnicos de prueba

/*
INSERT INTO tecnicos (nombre, ficha, password_hash, rol)
VALUES 
  ('Técnico Uno', 'TEC001', '$2b$10$NzJQDDtFQC2rdmNjyr9xI.IyYmfY5mE9HBYG3VfNm0S83Z9hvBDqC', 'tecnico'),
  ('Técnico Dos', 'TEC002', '$2b$10$NzJQDDtFQC2rdmNjyr9xI.IyYmfY5mE9HBYG3VfNm0S83Z9hvBDqC', 'tecnico')
ON CONFLICT (ficha) DO NOTHING;
*/

-- Verificar que se crearon los usuarios
SELECT id, nombre, ficha, rol, created_at 
FROM tecnicos 
ORDER BY created_at DESC;

-- Nota: Todos los passwords de prueba son 'admin123'
-- Hash: $2b$10$NzJQDDtFQC2rdmNjyr9xI.IyYmfY5mE9HBYG3VfNm0S83Z9hvBDqC
