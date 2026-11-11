# 🐳 Docker Setup Guide - FuelRecorder

Guía completa para ejecutar FuelRecorder con Docker y Docker Compose.

---

## 📋 Prerrequisitos

- **Docker** >= 20.10 ([Descargar](https://www.docker.com/products/docker-desktop))
- **Docker Compose** >= 2.0 (incluido con Docker Desktop)

Verificar instalación:
```bash
docker --version
docker compose version
```

---

## 🚀 Inicio Rápido

### 1. Clonar el repositorio (si aún no lo tienes)
```bash
cd c:\Users\casti\Documents\DevWorkBench\projects
# Ya deberías tener la carpeta FuelRecorder
```

### 2. Configurar variables de entorno (opcional)
```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar con tus preferencias
# Para pruebas, los valores por defecto están bien
```

### 3. ¡Levantar todo!
```bash
cd c:\Users\casti\Documents\DevWorkBench\projects\FuelRecorder
docker compose up -d
```

**¡Eso es todo!** La aplicación estará corriendo en:
- **Backend API:** http://localhost:5000
- **Admin Dashboard:** http://localhost:3001
- **Technician App:** http://localhost:3000

---

## 🏗️ Arquitectura Docker

```
┌─────────────────────────────────────────────────────┐
│               Docker Network                        │
│                                                     │
│  ┌──────────────┐  ┌──────────────┐                │
│  │   Frontend   │  │   Frontend   │                │
│  │   Admin      │  │   Technician │                │
│  │  (Port 3001) │  │  (Port 3000) │                │
│  └──────┬───────┘  └──────┬───────┘                │
│         │                  │                         │
│         └────────┬─────────┘                         │
│                  │                                   │
│         ┌────────▼─────────┐                        │
│         │    Backend API   │                         │
│         │   (Port 5000)    │                        │
│         └────────┬─────────┘                        │
│                  │                                   │
│         ┌────────▼─────────┐                        │
│         │   PostgreSQL DB  │                         │
│         │   (Port 5432)    │                        │
│         └──────────────────┘                        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Servicios

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| `postgres` | 5432 | Base de datos PostgreSQL 15 |
| `backend` | 5000 | API REST (Node.js + Express) |
| `frontend-admin` | 3001 | Panel Administrativo (React) |
| `frontend` | 3000 | App Técnicos (React) |

---

## 📦 Comandos Docker

### Iniciar todos los servicios
```bash
docker compose up -d
```

### Iniciar en modo foreground (ver logs)
```bash
docker compose up
```

### Detener todos los servicios
```bash
docker compose down
```

### Detener y eliminar volúmenes (¡cuidado! pierde datos)
```bash
docker compose down -v
```

### Ver logs
```bash
# Todos los logs
docker compose logs

# Solo backend
docker compose logs backend

# Solo frontend admin
docker compose logs frontend-admin

# Seguir logs en tiempo real
docker compose logs -f backend
```

### Reiniciar un servicio
```bash
docker compose restart backend
```

### Reconstruir imágenes
```bash
docker compose up -d --build
```

### Ver estado de servicios
```bash
docker compose ps
```

### Ejecutar comandos dentro de un contenedor
```bash
# Acceder al backend
docker compose exec backend sh

# Acceder a la base de datos
docker compose exec postgres psql -U postgres -d fuel_recorder

# Ver logs de PostgreSQL
docker compose exec postgres tail -f /var/log/postgresql/postgresql.log
```

---

## 🗄️ Base de Datos

### Acceder a PostgreSQL
```bash
docker compose exec postgres psql -U postgres -d fuel_recorder
```

### Ver tablas
```sql
\dt
```

### Ver técnicos
```sql
SELECT id, nombre, ficha, rol, created_at FROM tecnicos;
```

### Ver suministros
```sql
SELECT s.*, t.nombre as tecnico 
FROM suministros s 
JOIN tecnicos t ON s.tecnico_id = t.id 
ORDER BY s.created_at DESC 
LIMIT 10;
```

### Crear usuario admin inicial

Primero, genera un hash de contraseña:
```bash
# Usa https://bcrypt-generator.com/
# Password recomendado: admin123
```

Luego ejecuta:
```bash
docker compose exec postgres psql -U postgres -d fuel_recorder
```

```sql
INSERT INTO tecnicos (nombre, ficha, password_hash, rol)
VALUES (
  'Administrador Principal',
  'ADMIN001',
  '$2b$10$TuHashAqui',
  'admin'
);
```

### Backup de base de datos
```bash
# Crear backup
docker compose exec postgres pg_dump -U postgres fuel_recorder > backup_$(date +%Y%m%d_%H%M%S).sql

# Restaurar backup
cat backup_20260411_120000.sql | docker compose exec -T postgres psql -U postgres fuel_recorder
```

---

## 🔧 Desarrollo con Hot Reload

La configuración actual incluye **volumes** para desarrollo:

```yaml
volumes:
  - ./backend:/app
  - backend_node_modules:/app/node_modules
```

Esto significa que:
- ✅ Cambios en el código se reflejan automáticamente
- ✅ No necesitas reconstruir las imágenes
- ✅ Los `node_modules` se mantienen en volúmenes separados

### Flujo de trabajo

1. **Iniciar Docker:**
   ```bash
   docker compose up -d
   ```

2. **Editar código normalmente** en tu editor
   - Los cambios se detectan automáticamente
   - Los frontends recargan solos (React Hot Reload)
   - El backend usa nodemon (ya configurado)

3. **Ver logs:**
   ```bash
   docker compose logs -f backend
   ```

---

## 🐛 Troubleshooting

### Error: "Port already in use"

```bash
# Windows - Ver qué proceso usa el puerto
netstat -ano | findstr :5000
netstat -ano | findstr :3000
netstat -ano | findstr :3001
netstat -ano | findstr :5432

# Matar el proceso
taskkill /PID <PID> /F

# O cambia el puerto en docker-compose.yml
ports:
  - "5001:5000"  # Backend en puerto 5001
```

### Error: "Container exited immediately"

```bash
# Ver logs del contenedor
docker compose logs backend
docker compose logs frontend-admin
docker compose logs frontend

# Verificar que las variables de entorno están correctas
docker compose config
```

### Error: "Database connection refused"

```bash
# Verificar que PostgreSQL está corriendo
docker compose ps postgres

# Ver logs de PostgreSQL
docker compose logs postgres

# Esperar a que PostgreSQL esté listo (healthcheck)
docker compose up -d postgres
# Esperar 30 segundos
docker compose up -d backend
```

### Error: "Cannot find module" o "node_modules missing"

```bash
# Eliminar volúmenes de node_modules y reconstruir
docker compose down -v
docker compose up -d --build
```

### Error: "Build failed" en frontends

```bash
# Ver logs completos
docker compose logs frontend-admin
docker compose logs frontend

# Reconstruir sin cache
docker compose build --no-cache frontend-admin
docker compose build --no-cache frontend
docker compose up -d
```

### Los cambios no se reflejan

```bash
# Para contenedores y volver a levantar
docker compose restart

# O si cambiaste dependencias
docker compose up -d --build
```

### Limpiar todo completamente

```bash
# Detener y eliminar todo
docker compose down -v

# Eliminar imágenes
docker rmi fuelrecorder_backend fuelrecorder_frontend-admin fuelrecorder_frontend

# Eliminar volúmenes huérfanos
docker volume prune -f

# Volver a construir
docker compose up -d --build
```

---

## 📊 Monitoreo

### Ver uso de recursos
```bash
docker stats
```

### Ver logs de un servicio específico
```bash
# Backend
docker compose logs -f backend

# PostgreSQL queries
docker compose logs -f postgres

# Frontend builds
docker compose logs -f frontend-admin
```

### Health checks
```bash
# Verificar que todo está healthy
docker compose ps

# Backend health endpoint
curl http://localhost:5000/api/health

# PostgreSQL status
docker compose exec postgres pg_isready -U postgres
```

---

## 🔐 Seguridad

### Variables de entorno sensibles

**NUNCA** subas el archivo `.env` a Git. Ya está en `.gitignore`.

Para producción, usa variables de entorno del sistema o secrets:

```bash
# En lugar de editar .env, exporta las variables
export DB_PASSWORD=my_secure_password
export JWT_SECRET=$(openssl rand -hex 32)

# Luego ejecuta
docker compose up -d
```

### Cambiar contraseñas por defecto

Edita `.env`:
```env
DB_PASSWORD=cambia_esto_por_algo_seguro
JWT_SECRET=genera_un_string_largo_y_aleatorio
```

Generar JWT_SECRET seguro:
```bash
# Linux/Mac
openssl rand -hex 32

# Windows (PowerShell)
-join ((1..32) | ForEach-Object { "{0:x}" -f (Get-Random -Minimum 0 -Maximum 16) })
```

---

## 🎯 Comandos Útiles

### Ver todos los contenedores corriendo
```bash
docker ps
```

### Detener un servicio específico
```bash
docker compose stop frontend-admin
```

### Iniciar un servicio específico
```bash
docker compose start backend
```

### Ejecutar migraciones de BD
```bash
# El schema.sql se ejecuta automáticamente al crear el contenedor
# Pero si necesitas ejecutar SQL manual:
cat backend/schema.sql | docker compose exec -T postgres psql -U postgres fuel_recorder
```

### Ver logs en tiempo real con colores
```bash
docker compose logs -f --tail=100
```

### Ejecutar comandos de npm
```bash
# Backend
docker compose exec backend npm run dev

# Frontend admin
docker compose exec frontend-admin npm start

# Instalar nueva dependencia
docker compose exec backend npm install package-name
```

---

## 📝 Variables de Entorno

### Archivo `.env` (en la raíz del proyecto)

```env
# Database
DB_PASSWORD=postgres_secret          # Contraseña de PostgreSQL
DB_HOST=localhost                    # No cambiar (se maneja internamente)
DB_PORT=5432                         # Puerto de PostgreSQL
DB_NAME=fuel_recorder                # Nombre de la BD
DB_USER=postgres                     # Usuario de PostgreSQL

# JWT
JWT_SECRET=dev_jwt_secret_key...     # Secreto para JWT (cambiar en producción)
JWT_EXPIRATION=7d                    # Expiración del token

# Server
NODE_ENV=development                 # development o production
PORT=5000                            # Puerto del backend

# Frontend
REACT_APP_API_URL=http://localhost:5000/api  # URL del backend
```

---

## 🚀 Producción con Docker

Para producción, crea un `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    restart: always
    environment:
      NODE_ENV: production
      # ... variables de producción
    networks:
      - fuelrecorder-network

  frontend-admin:
    build:
      context: ./frontend-admin
      dockerfile: Dockerfile.prod
    restart: always
    networks:
      - fuelrecorder-network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    restart: always
    networks:
      - fuelrecorder-network

networks:
  fuelrecorder-network:
    driver: bridge
```

Y ejecuta:
```bash
docker compose -f docker-compose.prod.yml up -d
```

---

## 🎓 Tips y Mejores Prácticas

✅ **Desarrollo:**
- Usa `docker compose up -d` para correr en background
- Usa `docker compose logs -f` para ver logs en tiempo real
- Los cambios en el código se reflejan automáticamente

✅ **Performance:**
- Los volúmenes de `node_modules` mejoran el build time
- Usa `docker system prune` regularmente para limpiar

✅ **Debugging:**
- Accede a un contenedor: `docker compose exec backend sh`
- Ejecuta queries SQL directamente: `docker compose exec postgres psql -U postgres fuel_recorder`

✅ **Cleanup:**
```bash
# Limpiar todo periódicamente
docker compose down -v
docker system prune -f
docker compose up -d --build
```

---

## 📚 Recursos Adicionales

- [Docker Docs](https://docs.docker.com/)
- [Docker Compose Docs](https://docs.docker.com/compose/)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
- [Node Docker Image](https://hub.docker.com/_/node)

---

## 🐛 ¿Problemas?

1. Revisar logs: `docker compose logs <servicio>`
2. Verificar variables de entorno: `docker compose config`
3. Verificar que los puertos están disponibles
4. Reiniciar contenedores: `docker compose restart`
5. Reconstruir desde cero: `docker compose down -v && docker compose up -d --build`

---

**¡Disfruta desarrollando con Docker! 🎉**
