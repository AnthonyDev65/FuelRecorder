# 🐳 FuelRecorder - Docker Quick Start

## Inicio Rápido (Windows)

### 1️⃣ Ejecutar el script de inicio

```bash
# Doble clic o desde cmd:
docker-start.bat
```

### 2️⃣ ¡Listo! Accede a las aplicaciones

| Aplicación | URL | Uso |
|------------|-----|-----|
| **Admin Dashboard** | http://localhost:3001 | Gestión completa |
| **Technician App** | http://localhost:3000 | Registro de suministros |
| **Backend API** | http://localhost:5000 | API REST |

### 3️⃣ Login

**Credenciales de Administrador:**
```
Ficha: ADMIN001
Password: admin123
```

---

## 📋 Comandos Útiles

### Iniciar la aplicación
```bash
docker compose up -d
# o
docker-start.bat
```

### Detener la aplicación
```bash
docker compose down
# o
docker-stop.bat
```

### Ver logs
```bash
docker compose logs -f
# o
docker-logs.bat
```

### Reiniciar todo (reconstruir)
```bash
docker compose down -v
docker compose up -d --build
# o
docker-rebuild.bat
```

---

## 🎯 Primeros Pasos

### Como Administrador (http://localhost:3001)

1. **Login** con ADMIN001 / admin123
2. **Crear técnicos** en la sección "Técnicos"
3. **Ver registros** en "Suministros"
4. **Ver estadísticas** en "Dashboard"
5. **Exportar datos** a Excel

### Como Técnico (http://localhost:3000)

1. **Login** con las credenciales que creó el admin
2. **Registrar suministro** en "Nuevo Registro"
3. **Ver historial** en "Historial"

---

## 🗄️ Base de Datos

### Acceder a PostgreSQL
```bash
docker compose exec postgres psql -U postgres -d fuel_recorder
```

### Ver usuarios creados
```sql
SELECT id, nombre, ficha, rol FROM tecnicos;
```

### Crear admin manualmente (si es necesario)
```bash
docker compose exec postgres psql -U postgres -d fuel_recorder -f /schema.sql
```

---

## ❓ Troubleshooting

### Error: "Port already in use"
```bash
# Ver procesos usando los puertos
netstat -ano | findstr :5000
netstat -ano | findstr :3000
netstat -ano | findstr :3001
netstat -ano | findstr :5432

# Matar el proceso o cambiar puerto en docker-compose.yml
taskkill /PID <PID> /F
```

### Error: "Database connection refused"
```bash
# Esperar 30 segundos a que PostgreSQL inicie
timeout /t 30

# Verificar que PostgreSQL está corriendo
docker compose ps postgres
```

### Error: "Cannot find module"
```bash
# Reconstruir desde cero
docker compose down -v
docker compose up -d --build
```

### Los cambios no se reflejan
```bash
# Reiniciar servicios
docker compose restart

# O reconstruir
docker compose up -d --build
```

### Limpiar todo completamente
```bash
# Detener y eliminar todo (incluyendo datos)
docker compose down -v

# Limpiar Docker
docker system prune -f

# Volver a iniciar
docker compose up -d --build
```

---

## 📊 Ver Estado de Servicios

```bash
docker compose ps
```

Deberías ver 4 servicios corriendo:
- ✅ fuelrecorder-db (PostgreSQL)
- ✅ fuelrecorder-backend (Backend API)
- ✅ fuelrecorder-admin (Admin Dashboard)
- ✅ fuelrecorder-technician (Technician App)

---

## 🔐 Seguridad

### Cambiar contraseña de admin

1. Login como ADMIN001
2. Ir a configuración (próximamente)
3. O actualizar directamente en BD:

```bash
docker compose exec postgres psql -U postgres -d fuel_recorder
```

```sql
-- Generar nuevo hash en https://bcrypt-generator.com
UPDATE tecnicos 
SET password_hash = '$2b$10$TuNuevoHashAqui'
WHERE ficha = 'ADMIN001';
```

### Cambiar JWT_SECRET

Editar `.env`:
```env
JWT_SECRET=tu_secreto_muy_seguro_aqui
```

Luego reiniciar:
```bash
docker compose restart backend
```

---

## 📁 Archivos de Docker

| Archivo | Descripción |
|---------|-------------|
| `docker-compose.yml` | Configuración de servicios |
| `Dockerfile` (cada carpeta) | Configuración de contenedores |
| `.dockerignore` | Archivos ignorados en build |
| `.env` | Variables de entorno |
| `docker-start.bat` | Script de inicio |
| `docker-stop.bat` | Script de parada |
| `docker-rebuild.bat` | Script de reconstrucción |
| `docker-logs.bat` | Script de logs |

---

## 🎓 Tips

✅ **Desarrollo:** Los cambios en el código se reflejan automáticamente (hot reload)

✅ **Logs:** Usa `docker compose logs -f backend` para ver errores del backend

✅ **Base de datos:** Los datos persisten entre reinicios (volúmenes de Docker)

✅ **Reset completo:** `docker compose down -v` elimina TODO incluyendo datos de BD

---

## 📞 Más Ayuda

- **Guía completa:** [DOCKER.md](DOCKER.md)
- **README principal:** [README.md](README.md)
- **Guía rápida:** [QUICKSTART.md](QUICKSTART.md)

---

**¡Disfruta FuelRecorder con Docker! 🎉**
