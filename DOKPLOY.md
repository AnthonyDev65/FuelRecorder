# Despliegue de la API en Dokploy

El backend (`/backend`) se despliega como una aplicación Docker y usa una base Postgres creada en Dokploy.
Al arrancar, la API crea las tablas, aplica las migraciones (registradas en `schema_migrations`) y crea el usuario admin si no existe.

## 1. Subir el código a Git

Dokploy despliega desde un repositorio (GitHub, GitLab, etc.). Verifica que `.env` **no** se suba (ya está en `.gitignore`).

## 2. Crear la base de datos

1. En tu proyecto de Dokploy: **Create Service → Database → PostgreSQL**.
2. Nombre: `fuelrecorder-db`, Database Name: `fuel_recorder`, define usuario y contraseña.
3. **Deploy**.
4. Copia la **Internal Connection URL** (algo como `postgresql://usuario:pass@fuelrecorder-db-xxxx:5432/fuel_recorder`).

No hace falta exponer el puerto externo: la API se conecta por la red interna.

## 3. Crear la aplicación (API)

1. **Create Service → Application**, conecta tu repositorio y rama.
2. **Build Type:** `Dockerfile`
   - Docker File: `Dockerfile`
   - Docker Context Path / Build Path: `backend`
3. **Environment**:

   ```env
   NODE_ENV=production
   PORT=5000
   DATABASE_URL=<Internal Connection URL del paso 2>
   JWT_SECRET=<cadena larga aleatoria>
   JWT_EXPIRATION=7d
   ADMIN_FICHA=ADMIN001
   ADMIN_PASSWORD=<contraseña del admin>
   CORS_ORIGIN=
   ```

   - `JWT_SECRET` es obligatorio en producción (la API no arranca sin él). Puedes generar uno con
     `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.
   - `CORS_ORIGIN`: déjalo vacío para permitir cualquier origen, o pon los dominios de los frontends separados por comas
     (`https://admin.midominio.com,https://app.midominio.com`).
   - `ADMIN_PASSWORD` solo se usa la primera vez (cuando no hay ningún admin).

4. **Domains**: agrega un dominio (o el dominio generado de Dokploy) con **Container Port `5000`** y HTTPS activado.
5. **Deploy**.

## 4. Verificar

```
GET https://<tu-dominio>/api/health
→ {"status":"OK", ...}
```

En los logs del despliegue deberías ver `✓ Migración aplicada: ...` (solo la primera vez), `✓ Admin creado` y `Server running on port 5000`.

Login de prueba:

```
POST https://<tu-dominio>/api/auth/login
{"ficha": "ADMIN001", "password": "<ADMIN_PASSWORD>"}
```

## 5. Cierre automático del reporte diario (opcional)

El endpoint `POST /api/reportes/auto/cerrar` cierra el reporte del día. En Dokploy puedes programarlo en
**Schedules** de la aplicación con el comando:

```sh
node -e "fetch('http://localhost:5000/api/reportes/auto/cerrar',{method:'POST'}).then(r=>r.text()).then(console.log)"
```

y la expresión cron `0 17 * * *` (5 PM; ajusta la zona horaria del servidor).

> Ojo: hoy esa ruta exige un token JWT (`router.use(authenticateJWT)` en `routes/reportes.js`), así que la llamada
> anterior devuelve 401. Hay que enviarle un token, o protegerla con una clave propia (por ejemplo `CRON_SECRET`) en lugar de JWT.

## Frontends

Los frontends (`frontend`, `frontend-admin`) apuntan a la API con `REACT_APP_API_URL`, que se fija **en tiempo de build**.
Al desplegarlos, define `REACT_APP_API_URL=https://<dominio-de-la-api>/api`.
