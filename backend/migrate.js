const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const pool = require('./config/database');

// Orden de ejecución; cada archivo se aplica una sola vez (registrado en schema_migrations)
const MIGRATIONS = [
  'schema.sql',
  'migrations/add-mdp-to-suministros.sql',
  'migrations/add-tarjeta-to-tecnicos.sql',
  'migrations/create-reportes-diarios.sql',
];

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

async function runMigrations() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const { rows } = await pool.query('SELECT name FROM schema_migrations');
  const applied = new Set(rows.map((r) => r.name));

  for (const name of MIGRATIONS) {
    if (applied.has(name)) continue;

    const sql = fs.readFileSync(path.join(__dirname, name), 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [name]);
      await client.query('COMMIT');
      console.log(`✓ Migración aplicada: ${name}`);
    } catch (err) {
      await client.query('ROLLBACK');
      throw new Error(`Falló la migración ${name}: ${err.message}`);
    } finally {
      client.release();
    }
  }
}

async function seedAdmin() {
  const { rows } = await pool.query("SELECT 1 FROM tecnicos WHERE rol = 'admin' LIMIT 1");
  if (rows.length) return;

  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    console.warn('⚠ No existe ningún admin. Define ADMIN_PASSWORD para crearlo al arrancar.');
    return;
  }

  const ficha = process.env.ADMIN_FICHA || 'ADMIN001';
  const hash = await bcrypt.hash(password, 10);
  await pool.query(
    "INSERT INTO tecnicos (nombre, ficha, password_hash, rol) VALUES ($1, $2, $3, 'admin')",
    ['Administrador Principal', ficha, hash]
  );
  console.log(`✓ Admin creado con ficha ${ficha}`);
}

async function migrate() {
  await waitForDatabase();
  await runMigrations();
  await seedAdmin();
}

module.exports = migrate;

if (require.main === module) {
  migrate()
    .then(() => pool.end())
    .catch((err) => {
      console.error(err.message);
      process.exit(1);
    });
}
