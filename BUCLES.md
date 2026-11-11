# Bucles en FuelRecorder: `for`, `while` y `do-while`

Este documento recorre **todos los bucles reales** del proyecto FuelRecorder (backend en Node.js y
frontends en React), explica cómo funciona cada uno y por qué se eligió ese tipo de bucle en cada
caso. Los tres bucles del curso (`for`, `while` y `do-while`) están en uso real en el programa.

---

## 1. Resumen

| Bucle | Dónde | Para qué |
|---|---|---|
| **`for`** clásico | `backend/controllers/suministrosController.js:365` | Calcular el MDP comparando cada suministro con el anterior |
| **`for...of`** (variante de `for`) | `backend/migrate.js:45` | Aplicar las migraciones de la base de datos en orden |
| **`for...in`** (variante de `for`) | `backend/controllers/suministrosController.js:362` | Recorrer los vehículos (fichas) |
| **`while`** | `backend/utils/reportes.js:117` | Revisar cada minuto si hay que cerrar el reporte del día |
| **`do-while`** | `backend/migrate.js:20-29` | Conectar a la base de datos al arrancar, reintentando si falla |
| Métodos `forEach`, `map`, `find` | Backend y frontends (React) | Agrupar datos y dibujar tablas y listas |

Cada bucle está donde mejor encaja su forma de funcionar:

- **`for`** → se sabe qué hay que recorrer (una lista de suministros, de archivos, de fichas).
- **`while`** → se repite **mientras** la API esté encendida, sin un número fijo de vueltas.
- **`do-while`** → hay que intentarlo **al menos una vez** y repetir **mientras** falle.

---

## 2. Repaso: los tres bucles en JavaScript

### `for`: cuando se sabe qué recorrer

```javascript
for (inicialización; condición; actualización) {
  // cuerpo
}
```

1. Ejecuta la **inicialización** una sola vez (`let i = 0`).
2. Evalúa la **condición** (`i < 10`). Si es falsa, termina.
3. Ejecuta el **cuerpo**.
4. Ejecuta la **actualización** (`i++`) y vuelve al paso 2.

### `while`: mientras se cumpla una condición

```javascript
while (condición) {
  // cuerpo
}
```

Evalúa la condición **antes** de cada vuelta. Si es falsa desde el principio, el cuerpo **no se
ejecuta nunca**.

### `do-while`: al menos una vez

```javascript
do {
  // cuerpo
} while (condición);
```

Ejecuta el cuerpo **primero** y evalúa la condición **después**. El cuerpo se ejecuta **siempre al
menos una vez**.

### Variantes del `for`

| Variante | Recorre | Ejemplo |
|---|---|---|
| `for...of` | Los **valores** de un arreglo | `for (const nombre of ['a', 'b'])` → `'a'`, `'b'` |
| `for...in` | Las **claves** de un objeto | `for (const clave in { x: 1, y: 2 })` → `'x'`, `'y'` |

### Palabras de control

| Palabra | Efecto | Dónde se usa en el proyecto |
|---|---|---|
| `continue` | Salta a la **siguiente** vuelta | `migrate.js:46` |
| `true` como condición | Bucle que no termina por sí solo | `reportes.js:117` |

---

## 3. `for` en el proyecto

### 3.1 Recalcular el MDP de cada vehículo (`for` clásico anidado en `for...in`)

**Archivo:** `backend/controllers/suministrosController.js:342-397`
**Ruta:** `POST /api/suministros/recalculate-mdp` (solo admin)

El **MDP** compara lo que marcó el dispensador con lo que debería marcar según los galones
servidos. Para calcular el MDP de un suministro hace falta el **suministro anterior del mismo
vehículo**:

```
MDP = (lectura anterior + galones actuales) − lectura actual
```

Es el caso más completo del proyecto: combina **tres bucles**, un `forEach`, un `for...in` y un
`for` clásico dentro del `for...in`.

```javascript
// Paso 1: agrupar por ficha (vehículo) con forEach
allRecords.rows.forEach(record => {
  if (!recordsByFicha[record.ficha]) {
    recordsByFicha[record.ficha] = [];
  }
  recordsByFicha[record.ficha].push(record);
});

// Paso 2: recorrer cada vehículo (for...in)
for (const ficha in recordsByFicha) {
  const records = recordsByFicha[ficha];

  // Paso 3: recorrer los suministros de ese vehículo (for clásico)
  for (let i = 0; i < records.length; i++) {
    const currentRecord = records[i];

    if (i === 0) {
      // Primer suministro del vehículo: no hay anterior, el MDP queda en NULL
      ...
    } else {
      const previousRecord = records[i - 1];
      const mdp = (lecturaAnterior + galonesActuales) - lecturaActual;
      ...
    }
  }
}
```

#### Paso 1: `forEach` para agrupar

Los suministros llegan de la base de datos en una sola lista, ordenados por ficha y fecha. El
`forEach` los reparte en un objeto donde cada clave es una ficha:

```javascript
// Antes (lista plana)
[ {ficha:'A1', ...}, {ficha:'A1', ...}, {ficha:'B7', ...} ]

// Después (agrupado)
{
  'A1': [ {ficha:'A1', ...}, {ficha:'A1', ...} ],
  'B7': [ {ficha:'B7', ...} ]
}
```

#### Paso 2: `for...in` para recorrer las fichas

`recordsByFicha` es un **objeto**, no un arreglo. Por eso se usa `for...in`, que recorre sus
**claves**: `'A1'`, luego `'B7'`. Cada vuelta procesa un vehículo distinto.

#### Paso 3: `for` clásico para recorrer los suministros

Aquí **hace falta el índice `i`**, por dos motivos:

- `i === 0` identifica el **primer** suministro, que no tiene anterior.
- `records[i - 1]` accede al suministro **anterior**. Con `for...of` o `forEach` no hay acceso
  directo a la posición, así que el `for` clásico es la opción natural.

| Parte | Código | Significado |
|---|---|---|
| Inicialización | `let i = 0` | Empieza por el primer suministro |
| Condición | `i < records.length` | Sigue mientras queden suministros de ese vehículo |
| Actualización | `i++` | Pasa al siguiente suministro |

#### Ejemplo paso a paso (vehículo `A1`)

| `i` | Lectura dispensador | Galones | Anterior (`records[i-1]`) | Cálculo | MDP |
|---|---|---|---|---|---|
| 0 | 1000 | 20 | — (`i === 0`) | — | `NULL` |
| 1 | 1030 | 30 | lectura 1000 | (1000 + 30) − 1030 | **0** ✅ cuadra |
| 2 | 1050 | 25 | lectura 1030 | (1030 + 25) − 1050 | **5** ⚠️ faltan 5 galones |

El bucle termina cuando `i` llega a `records.length` (3). Entonces el `for...in` pasa a la
siguiente ficha.

**Total de vueltas:** el bucle interno se ejecuta una vez por cada suministro de la base de datos.
Con 3 fichas y 10 suministros cada una, el externo da 3 vueltas y el interno 30 en total.

**Contadores dentro del bucle:** `updated++` y `skipped++` cuentan cuántos registros se modificaron
y cuántos ya estaban bien. Al terminar, la API devuelve esos totales.

### 3.2 Aplicar las migraciones en orden (`for...of`)

**Archivo:** `backend/migrate.js:45-62`

```javascript
const MIGRATIONS = [
  'schema.sql',
  'migrations/add-mdp-to-suministros.sql',
  'migrations/add-tarjeta-to-tecnicos.sql',
  'migrations/create-reportes-diarios.sql',
];

for (const name of MIGRATIONS) {
  if (applied.has(name)) continue;   // ya aplicada → saltar a la siguiente

  const sql = fs.readFileSync(path.join(__dirname, name), 'utf8');
  // ... ejecutar el SQL dentro de una transacción
  console.log(`✓ Migración aplicada: ${name}`);
}
```

**Para qué sirve:** al arrancar, la API crea y actualiza las tablas de la base de datos ejecutando
cada archivo `.sql` **en orden**. Cada archivo se aplica una sola vez.

**¿Por qué `for...of`?**
- Solo hacen falta los **valores** (los nombres de archivo), no la posición.
- Funciona con `await`: espera a que termine una migración antes de empezar la siguiente. Con
  `forEach` las migraciones **no se esperarían** entre sí y podrían ejecutarse desordenadas.

**Uso de `continue`:** si la migración ya está registrada en `schema_migrations`, `continue` salta
directamente a la siguiente vuelta sin ejecutar el resto del cuerpo.

```
Primer arranque:                Arranques siguientes:
✓ Migración aplicada: schema.sql             (todas hacen continue,
✓ Migración aplicada: ...add-mdp...           no se imprime nada)
✓ Migración aplicada: ...add-tarjeta...
✓ Migración aplicada: ...create-reportes...
```

---

## 4. `while` en el proyecto: el cierre automático de reportes

**Archivo:** `backend/utils/reportes.js:114-135`

```javascript
const UN_MINUTO = 60 * 1000;

async function iniciarCierreAutomatico() {
  console.log(`⏰ Cierre automático de reportes a las ${HORA_CIERRE} (${ZONA})`);

  while (true) {
    try {
      if (await hayReporteVencido()) {
        const resultado = await cerrarReporteAbierto();
        ...
      }
    } catch (error) {
      console.error('Error en el cierre automático de reportes:', error.message);
    }

    await new Promise((r) => setTimeout(r, UN_MINUTO));   // esperar 1 minuto
  }
}
```

**Para qué sirve:** cada día a las 17:00 (hora de República Dominicana) hay que cerrar el reporte
del día y abrir el siguiente. Este bucle revisa **cada minuto** si ya pasó la hora de cierre y, si
es así, cierra el reporte. Si la API estuvo apagada a esa hora, lo cierra en la primera vuelta al
volver a arrancar.

**Cómo funciona cada vuelta:**

1. Pregunta a la base de datos si el reporte abierto ya venció (`hayReporteVencido`).
2. Si venció, lo cierra con la última lectura del dispensador y abre el siguiente.
3. Si algo falla, lo registra en los logs **sin detener el bucle** (`try/catch`).
4. Espera un minuto y vuelve a empezar.

**¿Por qué `while`?**
- No hay un número de vueltas conocido: el bucle debe repetirse **mientras la API esté encendida**.
  Por eso la condición es `true`.
- Es un **bucle infinito controlado**: termina cuando se apaga la API.

**¿Por qué no bloquea el servidor?** Node.js atiende todas las peticiones con un solo hilo. Un
`while (true)` normal acapararía ese hilo y la API dejaría de responder. Aquí no pasa porque:

- La función es `async`, y `server.js` la lanza **sin esperarla**.
- El `await` de la espera de un minuto **cede el hilo**: mientras el bucle espera, el servidor
  atiende las peticiones normalmente.

Se comprobó arrancando la API con un reporte vencido: el bucle lo cerró en la primera vuelta y,
mientras tanto, `GET /api/health` respondió `200` en las tres peticiones de prueba.

```
⏰ Cierre automático de reportes a las 17:00 (America/Santo_Domingo)
✓ Reporte 1 cerrado automáticamente; abierto el del 2026-11-11
```

---

## 5. `do-while` en el proyecto: conectar a la base de datos

**Archivo:** `backend/migrate.js:14-32`. Se ejecuta cada vez que arranca la API.

```javascript
// do-while: la conexión se intenta siempre al menos una vez, y se repite
// mientras falle y queden intentos
async function waitForDatabase(retries = 10) {
  let intento = 0;
  let conectado = false;

  do {
    intento++;
    try {
      await pool.query('SELECT 1');
      conectado = true;
    } catch (err) {
      console.log(`Esperando base de datos (${intento}/${retries}): ${err.message}`);
      if (intento < retries) await new Promise((r) => setTimeout(r, 3000));
    }
  } while (!conectado && intento < retries);

  if (!conectado) throw new Error('No se pudo conectar a la base de datos');
}
```

**Para qué sirve:** cuando se despliega, la API y la base de datos arrancan casi a la vez, y la base
puede tardar unos segundos en aceptar conexiones. En vez de fallar al primer intento, la API lo
intenta hasta 10 veces, esperando 3 segundos entre intentos.

**¿Por qué `do-while`?** Porque la conexión **siempre hay que intentarla al menos una vez**. No
tiene sentido preguntar "¿hace falta reintentar?" antes de haberlo intentado. Esa es justo la
diferencia del `do-while`: primero ejecuta el cuerpo y después evalúa la condición.

**La condición** `!conectado && intento < retries` se lee: "repetir **mientras no** esté conectado
**y** queden intentos". El bucle termina en cuanto deja de cumplirse cualquiera de las dos partes:

| Situación | `conectado` | `intento < retries` | ¿Repite? |
|---|---|---|---|
| Conectó | `true` | — | No → sigue el arranque |
| Falló, quedan intentos | `false` | `true` | Sí → espera 3 s y reintenta |
| Falló el último intento | `false` | `false` | No → `throw`, la API no arranca |

**Detalle:** `if (intento < retries)` evita esperar 3 segundos después del último intento, porque
ya no se va a reintentar.

**Lo que se ve en los logs** cuando la base de datos no está disponible (probado apuntando a un
puerto sin base de datos):

```
Esperando base de datos (1/10): ...
Esperando base de datos (2/10): ...
...
Esperando base de datos (10/10): ...
✗ Error al iniciar: No se pudo conectar a la base de datos
```

Cuando la base está disponible, conecta en el primer intento y no se imprime nada.

### Comparación: el mismo bucle con `for` y con `while`

Antes este bucle estaba escrito con `for`. Así se ve con cada uno de los tres bucles:

```javascript
// Con for
for (let i = 1; i <= retries; i++) {
  try { await pool.query('SELECT 1'); return; }
  catch (err) { await esperar(3000); }
}
throw new Error('No se pudo conectar a la base de datos');

// Con while
let i = 1;
while (i <= retries) {
  try { await pool.query('SELECT 1'); return; }
  catch (err) { await esperar(3000); }
  i++;
}
throw new Error('No se pudo conectar a la base de datos');

// Con do-while (el que usa el proyecto)
do {
  intento++;
  try { await pool.query('SELECT 1'); conectado = true; }
  catch (err) { if (intento < retries) await esperar(3000); }
} while (!conectado && intento < retries);
```

Se probaron las tres versiones con una base de datos simulada que falla un número de veces:

| Fallos de la base | `retries` | `for` | `while` | `do-while` |
|---|---|---|---|---|
| 0 | 10 | Conecta en 1 intento | Conecta en 1 intento | Conecta en 1 intento |
| 3 | 10 | Conecta en 4 intentos | Conecta en 4 intentos | Conecta en 4 intentos |
| 9 | 10 | Conecta en 10 intentos | Conecta en 10 intentos | Conecta en 10 intentos |
| 15 | 10 | Error tras 10 intentos | Error tras 10 intentos | Error tras 10 intentos |
| 0 | **0** | Error, **0 intentos** | Error, **0 intentos** | Conecta en **1 intento** |

La última fila muestra la diferencia clave: con `for` y `while` la condición se evalúa **antes** y
el cuerpo no llega a ejecutarse; con `do-while` el cuerpo se ejecuta **una vez** antes de evaluarla.

---

## 6. Bucles "ocultos": métodos de arreglos

JavaScript tiene métodos que **recorren un arreglo por dentro**: el bucle existe, pero lo escribe el
propio lenguaje. El proyecto los usa mucho, sobre todo en React para dibujar listas en pantalla.

| Método | Qué hace | Devuelve |
|---|---|---|
| `forEach` | Ejecuta algo con cada elemento | Nada |
| `map` | Transforma cada elemento en otro | Un arreglo nuevo del mismo tamaño |
| `find` | Busca el primer elemento que cumple una condición | Ese elemento (o `undefined`) |

### 6.1 `forEach`

| Archivo | Para qué |
|---|---|
| `backend/controllers/suministrosController.js:354` | Agrupar suministros por ficha (sección 3.1) |
| `frontend-admin/src/pages/Suministros.jsx:70` | Quitar los filtros vacíos antes de pedir datos a la API |

```javascript
// frontend-admin/src/pages/Suministros.jsx:70
Object.keys(params).forEach(key => {
  if (!params[key]) delete params[key];
});
```

`Object.keys(params)` da la lista de filtros (`['fecha_inicio', 'tecnico_id', ...]`) y el `forEach`
borra los que están vacíos. Así la API solo recibe los filtros que el usuario rellenó. Equivale a:

```javascript
const claves = Object.keys(params);
for (let i = 0; i < claves.length; i++) {
  if (!params[claves[i]]) delete params[claves[i]];
}
```

### 6.2 `map`: dibujar listas en React

En React, para mostrar una lista en pantalla se usa `map`: convierte **cada dato** en **un elemento
visual** (una fila de tabla, una opción de un menú, una tarjeta…).

| Archivo | Qué dibuja |
|---|---|
| `frontend-admin/src/components/Layout.jsx:80` | Los enlaces del menú lateral |
| `frontend-admin/src/pages/Dashboard.jsx:180` | La tabla de galones por técnico |
| `frontend-admin/src/pages/Suministros.jsx:254` | Las opciones del selector de técnicos |
| `frontend-admin/src/pages/Suministros.jsx:326` | La tabla de suministros |
| `frontend-admin/src/pages/Reportes.jsx` | La lista de reportes y sus suministros |
| `frontend-admin/src/pages/Tecnicos.jsx` | La tabla de técnicos |
| `frontend/src/pages/Historial.jsx:69` | El historial de suministros del técnico |
| `frontend/src/pages/Dashboard.jsx`, `frontend/src/components/Layout.jsx` | Listas y menú de la app de técnicos |

**Ejemplo con índice:** `frontend/src/pages/Historial.jsx:69`

```jsx
{suministros.map((suministro, index) => {
  // Detectar si la lectura es menor a la anterior (posible fraude)
  const lecturaAnterior = index < suministros.length - 1
    ? suministros[index + 1].lectura_dispensador
    : null;
  const lecturaEsMenor = lecturaAnterior &&
    parseFloat(suministro.lectura_dispensador) < parseFloat(lecturaAnterior);

  return <div key={suministro.id}> ... </div>;
})}
```

Igual que el `for` del MDP, este `map` usa el **índice** para mirar un elemento vecino. La lista
viene ordenada de más nuevo a más antiguo, así que el suministro anterior en el tiempo está en
`index + 1`. Si la lectura del dispensador **bajó** respecto a la anterior, la fila se marca como
posible fraude. La misma lógica está en `frontend-admin/src/pages/Suministros.jsx:326`.

**Ejemplo en el backend:** `backend/server.js:13`

```javascript
process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
// "https://a.com, https://b.com"  →  ['https://a.com', 'https://b.com']
```

### 6.3 `find`

```jsx
// frontend-admin/src/components/Layout.jsx:142
navigation.find(n => n.href === location.pathname)?.name || 'FuelRecorder'
```

Recorre los elementos del menú hasta encontrar el de la página actual y muestra su nombre como
título. **Se detiene en cuanto lo encuentra**, igual que un `for` con `break`:

```javascript
let titulo = 'FuelRecorder';
for (const n of navigation) {
  if (n.href === location.pathname) {
    titulo = n.name;
    break;
  }
}
```

---

## 7. Un bucle dentro de SQL

**Archivo:** `backend/utils/reportes.js:35-43`

```sql
INSERT INTO reportes_diarios (fecha, lectura_inicial, estado)
SELECT MIN(d)::date, $2, 'abierto'
FROM generate_series($1::date, $1::date + 60, interval '1 day') d
WHERE NOT EXISTS (SELECT 1 FROM reportes_diarios r WHERE r.fecha = d::date)
```

`generate_series` genera una secuencia de fechas, día a día, durante 60 días, y la consulta se queda
con la primera que todavía no tiene reporte. En JavaScript sería un `for` con `break`:

```javascript
for (let d = 0; d <= 60; d++) {
  const fecha = sumarDias(hoy, d);
  if (!existeReporte(fecha)) {
    crearReporte(fecha);
    break;
  }
}
```

Se hace en SQL porque así la base de datos lo resuelve en una sola consulta, en vez de hacer hasta
61 consultas desde Node.js.

---

## 8. Resumen: qué bucle usar y cuándo

| Situación | Bucle adecuado | Ejemplo en FuelRecorder |
|---|---|---|
| Recorrer una lista y hace falta la posición (elemento anterior o siguiente) | `for` clásico | Cálculo del MDP (`suministrosController.js:365`) |
| Recorrer los valores de un arreglo, en orden y con `await` | `for...of` | Migraciones (`migrate.js:45`) |
| Recorrer las claves de un objeto | `for...in` | Fichas agrupadas (`suministrosController.js:362`) |
| Repetir **mientras** se cumpla algo, sin saber cuántas veces | `while` | Cierre automático de reportes (`reportes.js:117`) |
| Hacer algo **al menos una vez** y repetir **mientras** haga falta | `do-while` | Conexión a la base de datos (`migrate.js:20`) |
| Convertir cada dato en un elemento visual | `map` | Todas las tablas y listas de React |

### Idea clave para la exposición

Los tres bucles son **intercambiables**: todo `for` se puede escribir como `while`, y todo `while`
como `do-while` añadiendo una comprobación previa. Lo que cambia es **qué expresa mejor la
intención**:

- `for` → "recorre **esta lista**" o "repite **N veces**".
- `while` → "repite **mientras** se cumpla esto".
- `do-while` → "hazlo **una vez** y repite **mientras** haga falta".

FuelRecorder usa cada uno donde mejor encaja: `for` para recorrer suministros, migraciones y fichas;
`while` para la tarea que se repite mientras la API está encendida; y `do-while` para la conexión
que hay que intentar al menos una vez.
