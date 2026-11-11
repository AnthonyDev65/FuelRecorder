# 🚀 FuelRecorder - Sistema de Gestión de Suministro de Combustible

Aplicación web completa para la gestión de suministro de combustible, con panel administrativo y aplicación para técnicos.

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Arquitectura del Sistema](#-arquitectura-del-sistema)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Configuración de la Base de Datos](#-configuración-de-la-base-de-datos)
- [Ejecución](#-ejecución)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [API Endpoints](#-api-endpoints)
- [Despliegue](#-despliegue)
- [Seguridad](#-seguridad)

---

## ✨ Características

### Para Técnicos
- ✅ Inicio de sesión seguro con JWT
- ✅ Registro rápido de suministros de combustible
- ✅ Validación automática de datos
- ✅ Historial personal de suministros
- ✅ Interfaz mobile-first optimizada para campo
- ✅ Fecha automática con opción manual

### Para Administradores
- ✅ Dashboard con estadísticas en tiempo real
- ✅ Gestión completa de técnicos (CRUD)
- ✅ Visualización de todos los registros
- ✅ Filtros avanzados (fecha, técnico, galones)
- ✅ Gráficos interactivos (Recharts)
- ✅ Exportación a Excel
- ✅ Control de roles y permisos

### Validaciones del Sistema
- ✅ Kilometraje no puede ser menor que registros anteriores
- ✅ Galones debe ser mayor a 0
- ✅ Prevención de registros duplicados (misma ficha y fecha)
- ✅ Contraseñas encriptadas con bcrypt
- ✅ Autenticación JWT con expiración

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────┐
│                   Frontend (React)                   │
│  ┌──────────────────┐  ┌──────────────────────────┐ │
│  │   Technician App │  │   Admin Dashboard        │ │
│  │   (Port 3000)    │  │   (Port 3001)            │ │
│  └────────┬─────────┘  └──────────┬───────────────┘ │
│           │                        │                  │
└───────────┼────────────────────────┼──────────────────┘
            │                        │
            │    HTTP/REST API       │
            └───────────┬────────────┘
                        │
┌───────────────────────┼────────────────────────┐
│                   Backend (Node.js)             │
│              Express.js (Port 5000)             │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐ │
│  │   Auth   │  │ CRUD API │  │  Statistics  │ │
│  │   JWT    │  │ Routes   │  │  & Export    │ │
│  └──────────┘  └──────────┘  └──────────────┘ │
└───────────────────────┼────────────────────────┘
                        │
            ┌───────────┴───────────┐
            │   PostgreSQL DB       │
            │   (Supabase/Local)    │
            │                       │
            │  - tecnicos           │
            │  - suministros        │
            └───────────────────────┘
```

---

## 📦 Requisitos Previos

- **Node.js** >= 16.x
- **npm** >= 8.x
- **PostgreSQL** >= 13.x o cuenta de [Supabase](https://supabase.com)

---

## 🔧 Instalación

### Opción 1: Docker (Recomendado para pruebas) ⚡

**¡La forma más rápida de probar la aplicación!**

```bash
cd FuelRecorder

# Windows - Ejecutar script
docker-start.bat
```

O manualmente:
```bash
docker compose up -d
```

**¡Listo!** La aplicación estará corriendo en:
- Backend: http://localhost:5000
- Admin Dashboard: http://localhost:3001
- Technician App: http://localhost:3000

**Credenciales de admin:**
- Ficha: `ADMIN001`
- Password: `admin123`

Para más detalles, ver [DOCKER.md](DOCKER.md)

---

### Opción 2: Instalación Local (Desarrollo)

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd FuelRecorder
```

### 2. Configurar el Backend

```bash
cd backend
npm install

# Copiar archivo de entorno
cp .env.example .env

# Editar .env con tus credenciales de base de datos
```

### 3. Configurar Frontend Admin

```bash
cd frontend-admin
npm install
```

### 4. Configurar Frontend Técnico

```bash
cd frontend
npm install
```

---

## 🗄️ Configuración de la Base de Datos

### Opción 1: PostgreSQL Local

1. Instalar PostgreSQL desde [postgresql.org](https://www.postgresql.org/download/)

2. Crear la base de datos:
```sql
CREATE DATABASE fuel_recorder;
```

3. Ejecutar el esquema:
```bash
cd backend
psql -U postgres -d fuel_recorder -f schema.sql
```

4. Configurar `.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fuel_recorder
DB_USER=postgres
DB_PASSWORD=tu_password
```

### Opción 2: Supabase (Recomendado para producción)

1. Crear cuenta en [supabase.com](https://supabase.com)
2. Crear nuevo proyecto
3. Ir a SQL Editor y ejecutar el contenido de `backend/schema.sql`
4. Copiar credenciales de Project Settings > Database
5. Configurar `.env`:
```env
DB_HOST=db.<project-ref>.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=tu_password_supabase
```

### Crear usuario admin por defecto

```sql
-- Generar hash de contraseña con bcrypt (password: admin123)
-- Usar https://bcrypt-generator.com/ para generar tu propio hash

INSERT INTO tecnicos (nombre, ficha, password_hash, rol)
VALUES ('Administrador', 'ADMIN001', '$2b$10$TuHashAqui', 'admin');
```

---

## 🚀 Ejecución

### Desarrollo

Terminal 1 - Backend:
```bash
cd backend
npm run dev
# Servidor en http://localhost:5000
```

Terminal 2 - Admin Dashboard:
```bash
cd frontend-admin
npm start
# App en http://localhost:3001
```

Terminal 3 - Technician App:
```bash
cd frontend
npm start
# App en http://localhost:3000
```

### Producción

Build de los frontends:
```bash
cd frontend-admin
npm run build

cd frontend
npm run build
```

Backend:
```bash
cd backend
npm start
```

---

## 📁 Estructura del Proyecto

```
FuelRecorder/
├── backend/
│   ├── config/
│   │   ├── database.js       # Conexión PostgreSQL
│   │   └── index.js          # Configuración general
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── tecnicosController.js
│   │   ├── suministrosController.js
│   │   └── statisticsController.js
│   ├── middleware/
│   │   └── auth.js           # JWT middleware
│   ├── routes/
│   │   ├── auth.js
│   │   ├── tecnicos.js
│   │   ├── suministros.js
│   │   ├── statistics.js
│   │   └── export.js
│   ├── utils/
│   │   └── jwt.js
│   ├── schema.sql            # Esquema de base de datos
│   ├── server.js             # Entry point
│   └── package.json
│
├── frontend-admin/           # Panel Administrativo
│   ├── src/
│   │   ├── components/
│   │   │   └── Layout.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Tecnicos.jsx
│   │   │   └── Suministros.jsx
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   └── index.js
│   │   ├── App.jsx
│   │   └── index.js
│   └── package.json
│
└── frontend/                 # App Técnicos
    ├── src/
    │   ├── components/
    │   │   └── Layout.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── NuevoSuministro.jsx
    │   │   └── Historial.jsx
    │   ├── services/
    │   │   ├── api.js
    │   │   └── index.js
    │   ├── App.jsx
    │   └── index.js
    └── package.json
```

---

## 🔌 API Endpoints

### Autenticación
```
POST   /api/auth/login           # Iniciar sesión
POST   /api/auth/register        # Registrar técnico (admin)
GET    /api/auth/me              # Obtener usuario actual
```

### Técnicos (Admin)
```
GET    /api/tecnicos             # Listar todos
GET    /api/tecnicos/:id         # Obtener por ID
POST   /api/tecnicos             # Crear
PUT    /api/tecnicos/:id         # Actualizar
DELETE /api/tecnicos/:id         # Eliminar
```

### Suministros
```
GET    /api/suministros          # Listar (con filtros)
GET    /api/suministros/:id      # Obtener por ID
POST   /api/suministros          # Crear registro
PUT    /api/suministros/:id      # Actualizar
DELETE /api/suministros/:id      # Eliminar
```

### Estadísticas (Admin)
```
GET    /api/statistics/dashboard              # Dashboard stats
GET    /api/statistics/galones-by-tecnico     # Galones por técnico
GET    /api/statistics/consumo-por-fecha      # Consumo por fecha
GET    /api/statistics/recent-activity        # Actividad reciente
```

### Exportación (Admin)
```
GET    /api/export/suministros    # Exportar suministros a Excel
GET    /api/export/tecnicos       # Exportar técnicos a Excel
```

---

## 🌐 Despliegue

### Backend en Render/Railway

1. Crear cuenta en [render.com](https://render.com) o [railway.app](https://railway.app)
2. Conectar repositorio de GitHub
3. Configurar variables de entorno
4. Deploy automático

**Variables de entorno necesarias:**
```env
NODE_ENV=production
DB_HOST=tu_host
DB_PORT=5432
DB_NAME=fuel_recorder
DB_USER=postgres
DB_PASSWORD=tu_password
JWT_SECRET=tu_secreto_muy_seguro
JWT_EXPIRATION=7d
PORT=5000
```

### Frontend en Vercel/Netlify

1. Importar proyecto desde GitHub
2. Configurar build command: `npm run build`
3. Configurar publish directory: `build`
4. Deploy automático con CI/CD

**frontend-admin:**
```
Build Command: npm run build
Publish Directory: build
```

**frontend:**
```
Build Command: npm run build
Publish Directory: build
```

### Base de Datos en Supabase

1. Crear proyecto en [supabase.com](https://supabase.com)
2. Ejecutar `backend/schema.sql` en SQL Editor
3. Copiar credenciales
4. Configurar en backend `.env`

### Recomendaciones de Producción

✅ **Backend:**
- Usar PM2 o similar para process management
- Configurar reverse proxy con Nginx
- Habilitar HTTPS con Let's Encrypt
- Implementar rate limiting
- Configurar backups automáticos de BD

✅ **Frontend:**
- Usar CDN para assets estáticos
- Habilitar gzip/brotli compression
- Implementar service workers para offline mode
- Usar environment variables para API URLs

✅ **Seguridad:**
- Cambiar JWT_SECRET en producción
- Usar contraseñas fuertes para BD
- Habilitar SSL/TLS
- Implementar CORS policies estrictas
- Monitorear logs de acceso

---

## 🔒 Seguridad

### Implementación Actual

✅ **Autenticación JWT:**
- Tokens con expiración configurable
- Middleware de autenticación en rutas protegidas
- Control de roles (admin vs técnico)

✅ **Hash de Contraseñas:**
- bcrypt con salt rounds = 10
- Nunca se almacenan contraseñas en texto plano

✅ **Validaciones:**
- Validación de datos en backend y frontend
- Prevención de inyección SQL con consultas parametrizadas
- Verificación de permisos en cada operación

✅ **CORS:**
- Configuración básica de CORS
- Personalizable por entorno

### Mejoras Recomendadas para Producción

1. Implementar refresh tokens
2. Agregar rate limiting (`express-rate-limit`)
3. Usar Helmet para security headers
4. Implementar logging con Winston/Morgan
5. Agregar validación de input sanitization
6. Configurar Content Security Policy (CSP)
7. Implementar CSRF protection
8. Usar HTTPS forzado
9. Configurar backups automáticos
10. Implementar monitoreo y alertas

---

## 📊 Tecnologías Utilizadas

### Backend
- **Node.js** - Runtime
- **Express.js** - Framework web
- **PostgreSQL** - Base de datos
- **bcrypt** - Hash de contraseñas
- **jsonwebtoken** - Autenticación JWT
- **pg** - Driver PostgreSQL
- **cors** - Middleware CORS
- **dotenv** - Variables de entorno
- **xlsx** - Exportación Excel

### Frontend (Ambos)
- **React 19** - Biblioteca UI
- **TailwindCSS** - Framework CSS
- **React Router DOM** - Routing
- **Axios** - Cliente HTTP
- **React Hook Form** - Gestión de formularios
- **Zod** - Validación de esquemas
- **Recharts** - Gráficos (admin only)
- **date-fns** - Manipulación de fechas (technician only)

---

## 📝 Licencia

Este proyecto es de uso interno para FuelRecorder.

---

## 👥 Soporte

Para reportar bugs o solicitar features, contactar al equipo de desarrollo.

---

## 🎯 Próximas Mejoras

- [ ] Notificaciones push
- [ ] Modo offline para técnicos
- [ ] Escaneo de códigos QR
- [ ] Reportes PDF
- [ ] Dashboard con métricas avanzadas
- [ ] Integración con sistemas de facturación
- [ ] App móvil nativa (React Native)
- [ ] Multi-idioma

---

**Desarrollado con ❤️ para gestión eficiente de combustible**
