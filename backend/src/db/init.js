require('../config/env');
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

(async () => {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(sql);
  console.log('Esquema aplicado correctamente');
  await pool.end();
})().catch((err) => {
  console.error('Error al aplicar el esquema:', err.message);
  process.exit(1);
});