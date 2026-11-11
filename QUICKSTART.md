# 🚀 Guía de Inicio Rápido - FuelRecorder

Sigue estos pasos para tener la aplicación funcionando en menos de 10 minutos.

---

## 📋 Paso 1: Prerrequisitos

Asegúrate de tener instalados:
- ✅ Node.js 16+ ([Descargar](https://nodejs.org/))
- ✅ PostgreSQL 13+ ([Descargar](https://www.postgresql.org/download/))

Verificar instalación:
```bash
node --version
npm --version
psql --version
```

---

## 🗄️ Paso 2: Configurar Base de Datos

### Opción A: PostgreSQL Local

1. **Instalar PostgreSQL** (si no lo tienes)

2. **Crear base de datos:**
```bash
# Windows (PowerShell como administrador)
cd "C:\Program Files\PostgreSQL\15\bin"
.\psql -U postgres

# En la consola de PostgreSQL:
CREATE DATABASE fuel_recorder;
\q
```

3. **Ejecutar esquema:**
```bash
cd backend
psql -U postgres -d fuel_recorder -f schema.sql
```

4. **Crear usuario admin:**
```bash
# Generar hash en https://bcrypt-generator.com/
# Password: admin123

psql -U postgres -d fuel_recorder
```

```sql
INSERT INTO tecnicos (nombre, ficha, password_hash, rol)
VALUES ('Administrador', 'ADMIN001', '$2b$10$EixZaYK1Wi2cDe2.F0YHBuOCrOwMEEqGWSI', 'admin');
-- Nota: Genera tu propio hash con la contraseña que quieras
\q
```

### Opción B: Supabase (Recomendado)

1. Ir a [supabase.com](https://supabase.com) y crear cuenta
2. Crear nuevo proyecto
3. Ir a "SQL Editor"
4. Copiar y pegar el contenido de `backend/schema.sql`
5. Copiar credenciales de: Project Settings > Database
6. Usar esas credenciales en el `.env` del backend

---

## ⚙️ Paso 3: Configurar Backend

```bash
# Navegar a backend
cd backend

# Instalar dependencias
npm install

# El archivo .env ya está creado, solo necesitas editarlo
# Editar backend/.env con tus credenciales de BD
```

**Ejemplo de `.env`:**
```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fuel_recorder
DB_USER=postgres
DB_PASSWORD=tu_password_de_postgres
JWT_SECRET=muy_secreto_12345678901234567890
JWT_EXPIRATION=7d
```

---

## 💻 Paso 4: Configurar Frontends

### Frontend Admin
```bash
cd frontend-admin
npm install
```

### Frontend Técnico
```bash
cd frontend
npm install
```

---

## 🚀 Paso 5: Ejecutar la Aplicación

Necesitarás **3 terminales** abiertas:

### Terminal 1 - Backend
```bash
cd backend
npm run dev
```
✅ Verás: `🚀 Server running on port 5000`

### Terminal 2 - Admin Dashboard
```bash
cd frontend-admin
npm start
```
✅ Se abrirá en: `http://localhost:3001`

### Terminal 3 - Technician App
```bash
cd frontend
npm start
```
✅ Se abrirá en: `http://localhost:3000`

---

## 🔐 Paso 6: Primer Inicio de Sesión

### Admin Dashboard (http://localhost:3001)
- **Ficha:** ADMIN001
- **Contraseña:** admin123 (o la que configuraste)

### Técnico App (http://localhost:3000)
1. Primero crea un técnico desde el admin dashboard
2. Ve a "Técnicos" > "Nuevo Técnico"
3. Crea un técnico con ficha y contraseña
4. Usa esas credenciales para login en la app de técnico

---

## ✅ Verificación

### Backend funcionando:
Abre: http://localhost:5000/api/health
```json
{
  "status": "OK",
  "timestamp": "2026-04-11T..."
}
```

### Frontends funcionando:
- Admin: http://localhost:3001/login
- Técnico: http://localhost:3000/login

---

## 🎯 Flujo Básico de Prueba

1. **Login como Admin** en http://localhost:3001
2. **Crear un técnico** en la sección "Técnicos"
3. **Login como técnico** en http://localhost:3000
4. **Registrar un suministro** en "Nuevo Registro"
5. **Ver el registro** en el admin dashboard

---

## 🐛 Solución de Problemas

### Error: "EADDRINUSE: address already in use"
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# O cambia el puerto en .env
PORT=5001
```

### Error: "database does not exist"
```bash
# Crear la base de datos
psql -U postgres
CREATE DATABASE fuel_recorder;
\q

# Ejecutar schema.sql
psql -U postgres -d fuel_recorder -f backend/schema.sql
```

### Error: "Cannot find module"
```bash
# Reinstalar dependencias
cd backend
rm -rf node_modules package-lock.json
npm install

# Repetir para cada frontend
cd frontend-admin
rm -rf node_modules package-lock.json
npm install

cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Error de CORS en frontend
Verificar que `backend/.env` tenga:
```env
NODE_ENV=development
```

Y que `server.js` tenga:
```javascript
app.use(cors());
```

### Frontend no conecta con backend
Verificar que los frontends apunten al backend correcto:

En `frontend/src/config.js` y `frontend-admin/src/config.js`:
```javascript
const API_URL = 'http://localhost:5000/api';
```

---

## 📱 Prueba en Dispositivo Móvil (Red Local)

Para probar la app de técnico en tu celular:

1. **Obtener IP local de tu PC:**
```bash
# Windows
ipconfig
# Buscar: IPv4 Address (ej: 192.168.1.100)
```

2. **Modificar `frontend/src/config.js`:**
```javascript
const API_URL = 'http://192.168.1.100:5000/api';
```

3. **Iniciar frontend con host 0.0.0.0:**
```bash
cd frontend
# package.json > "start": "set PORT=3000 && set HOST=0.0.0.0 && react-scripts start"
```

4. **Acceder desde el celular:**
```
http://192.168.1.100:3000
```

---

## 📊 Comandos Útiles

### Ver todos los técnicos:
```sql
psql -U postgres -d fuel_recorder
SELECT id, nombre, ficha, rol, created_at FROM tecnicos;
```

### Ver todos los suministros:
```sql
SELECT s.*, t.nombre as tecnico 
FROM suministros s 
JOIN tecnicos t ON s.tecnico_id = t.id 
ORDER BY s.created_at DESC;
```

### Resetear datos (¡CUIDADO!):
```sql
DELETE FROM suministros;
DELETE FROM tecnicos WHERE rol != 'admin';
```

---

## 🎓 Siguientes Pasos

1. ✅ Personalizar colores en Tailwind config
2. ✅ Agregar logo de la empresa
3. ✅ Configurar usuarios reales
4. ✅ Probar en producción con Supabase + Vercel
5. ✅ Configurar backups automáticos
6. ✅ Agregar logging y monitoreo

---

## 📞 Soporte

Si tienes problemas:
1. Revisar la sección de solución de problemas
2. Verificar logs de consola
3. Revisar README.md principal
4. Contactar al equipo de desarrollo

---

**¡Listo! Ya tienes FuelRecorder funcionando 🎉**
