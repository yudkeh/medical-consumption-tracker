const pool = require('./database');

const createTables = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Drugs table (drug definitions)
    await client.query(`
      CREATE TABLE IF NOT EXISTS drugs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        unit_type VARCHAR(20) NOT NULL CHECK (unit_type IN ('pills', 'mg')),
        default_dosage DECIMAL(10,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Drug consumptions (daily tracking)
    await client.query(`
      CREATE TABLE IF NOT EXISTS drug_consumptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        drug_id INTEGER REFERENCES drugs(id) ON DELETE CASCADE,
        consumption_date DATE NOT NULL,
        quantity DECIMAL(10,2) NOT NULL,
        unit_type VARCHAR(20) NOT NULL CHECK (unit_type IN ('pills', 'mg')),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Medical procedures (procedure definitions)
    await client.query(`
      CREATE TABLE IF NOT EXISTS medical_procedures (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Drop old CHECK constraint on procedure_type if it exists
    await client.query(`
      ALTER TABLE medical_procedures
      DROP CONSTRAINT IF EXISTS medical_procedures_procedure_type_check
    `);

    // Drop procedure_type column if it still exists (we now store only name)
    await client.query(`
      ALTER TABLE medical_procedures
      DROP COLUMN IF EXISTS procedure_type
    `);

    // Procedure records (daily tracking)
    await client.query(`
      CREATE TABLE IF NOT EXISTS procedure_records (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        procedure_id INTEGER REFERENCES medical_procedures(id) ON DELETE CASCADE,
        procedure_date DATE NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add timestamp columns (exact time) if they don't exist yet
    await client.query(`
      ALTER TABLE drug_consumptions
      ADD COLUMN IF NOT EXISTS consumed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    `);

    await client.query(`
      ALTER TABLE procedure_records
      ADD COLUMN IF NOT EXISTS performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    `);

    // Drop old uniqueness constraints to allow multiple records per day
    await client.query(`
      ALTER TABLE drug_consumptions
      DROP CONSTRAINT IF EXISTS drug_consumptions_user_id_drug_id_consumption_date_key
    `);

    await client.query(`
      ALTER TABLE procedure_records
      DROP CONSTRAINT IF EXISTS procedure_records_user_id_procedure_id_procedure_date_key
    `);

    // Create indexes for better performance (by date of timestamp)
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_drug_consumptions_user_date 
      ON drug_consumptions(user_id, consumption_date)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_procedure_records_user_date 
      ON procedure_records(user_id, procedure_date)
    `);

    // Drug schedules
    await client.query(`
      CREATE TABLE IF NOT EXISTS drug_schedules (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        drug_id INTEGER REFERENCES drugs(id) ON DELETE CASCADE,
        schedule_type VARCHAR(20) NOT NULL CHECK (schedule_type IN ('interval', 'per_day')),
        interval_hours INTEGER,
        times_per_day INTEGER,
        notes TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (user_id, drug_id)
      )
    `);

    // Procedure schedules
    await client.query(`
      CREATE TABLE IF NOT EXISTS procedure_schedules (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        procedure_id INTEGER REFERENCES medical_procedures(id) ON DELETE CASCADE,
        schedule_type VARCHAR(20) NOT NULL CHECK (schedule_type IN ('interval', 'per_day')),
        interval_hours INTEGER,
        times_per_day INTEGER,
        notes TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (user_id, procedure_id)
      )
    `);

    await client.query('COMMIT');
    console.log('✅ Database tables created successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating tables:', error);
    throw error;
  } finally {
    client.release();
  }
};

createTables()
  .then(() => {
    console.log('Migration completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });

