-- Actualizar contraseña del admin a 'admin123'
-- Hash generado con bcrypt
UPDATE tecnicos 
SET password_hash = '$2b$10$NzJQDDtFQC2rdmNjyr9xI.IyYmfY5mE9HBYG3VfNm0S83Z9hvBDqC'
WHERE ficha = 'ADMIN001';

-- Verificar el cambio
SELECT ficha, length(password_hash) as hash_length, rol 
FROM tecnicos 
WHERE ficha = 'ADMIN001';
