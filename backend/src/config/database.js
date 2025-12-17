const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.ORI_DB_HOST,
  port: process.env.ORI_DB_PORT,
  database: process.env.ORI_DB_NAME,
  user: process.env.ORI_DB_USER,
  password: process.env.ORI_DB_PASSWORD,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = pool;

