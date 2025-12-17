const pool = require('../config/database');

// Get all drugs for a user
const getDrugs = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM drugs WHERE user_id = $1 ORDER BY name',
      [req.user.userId]
    );
    res.json({ drugs: result.rows });
  } catch (error) {
    console.error('Get drugs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create a new drug
const createDrug = async (req, res) => {
  try {
    const { name, unit_type, default_dosage } = req.body;

    if (!name || !unit_type) {
      return res.status(400).json({ error: 'Name and unit_type are required' });
    }

    if (!['pills', 'mg'].includes(unit_type)) {
      return res.status(400).json({ error: 'unit_type must be "pills" or "mg"' });
    }

    const result = await pool.query(
      'INSERT INTO drugs (user_id, name, unit_type, default_dosage) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.userId, name, unit_type, default_dosage || null]
    );

    res.status(201).json({ drug: result.rows[0] });
  } catch (error) {
    console.error('Create drug error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update a drug
const updateDrug = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, unit_type, default_dosage } = req.body;

    // Verify drug belongs to user
    const drugCheck = await pool.query(
      'SELECT id FROM drugs WHERE id = $1 AND user_id = $2',
      [id, req.user.userId]
    );

    if (drugCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Drug not found' });
    }

    const result = await pool.query(
      'UPDATE drugs SET name = $1, unit_type = $2, default_dosage = $3 WHERE id = $4 AND user_id = $5 RETURNING *',
      [name, unit_type, default_dosage || null, id, req.user.userId]
    );

    res.json({ drug: result.rows[0] });
  } catch (error) {
    console.error('Update drug error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete a drug
const deleteDrug = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify drug belongs to user
    const drugCheck = await pool.query(
      'SELECT id FROM drugs WHERE id = $1 AND user_id = $2',
      [id, req.user.userId]
    );

    if (drugCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Drug not found' });
    }

    await pool.query('DELETE FROM drugs WHERE id = $1 AND user_id = $2', [id, req.user.userId]);

    res.json({ message: 'Drug deleted successfully' });
  } catch (error) {
    console.error('Delete drug error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get drug consumptions
const getConsumptions = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    let query = `
      SELECT dc.*, d.name as drug_name, d.unit_type as drug_unit_type
      FROM drug_consumptions dc
      JOIN drugs d ON dc.drug_id = d.id
      WHERE dc.user_id = $1
    `;
    const params = [req.user.userId];

    if (start_date && end_date) {
      query +=
        ' AND dc.consumption_date BETWEEN $2 AND $3 ORDER BY dc.consumption_date DESC, dc.consumed_at DESC';
      params.push(start_date, end_date);
    } else {
      query +=
        ' ORDER BY dc.consumption_date DESC, dc.consumed_at DESC LIMIT 100';
    }

    const result = await pool.query(query, params);
    res.json({ consumptions: result.rows });
  } catch (error) {
    console.error('Get consumptions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Record a drug consumption (each call represents one taken dose at a specific time)
const recordConsumption = async (req, res) => {
  try {
    const {
      drug_id,
      consumption_date,
      quantity,
      unit_type,
      notes,
      consumed_at,
    } = req.body;

    if (!drug_id || !consumption_date || quantity === undefined || !unit_type) {
      return res.status(400).json({
        error:
          'drug_id, consumption_date, quantity, and unit_type are required',
      });
    }

    // Verify drug belongs to user
    const drugCheck = await pool.query(
      'SELECT id FROM drugs WHERE id = $1 AND user_id = $2',
      [drug_id, req.user.userId]
    );

    if (drugCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Drug not found' });
    }

    const consumedAtValue =
      consumed_at ||
      new Date(
        `${consumption_date}T${new Date().toTimeString().slice(0, 8)}`
      ).toISOString();

    const result = await pool.query(
      `INSERT INTO drug_consumptions (user_id, drug_id, consumption_date, quantity, unit_type, notes, consumed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        req.user.userId,
        drug_id,
        consumption_date,
        quantity,
        unit_type,
        notes || null,
        consumedAtValue,
      ]
    );

    res.status(201).json({ consumption: result.rows[0] });
  } catch (error) {
    console.error('Record consumption error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete a consumption record
const deleteConsumption = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify consumption belongs to user
    const consumptionCheck = await pool.query(
      'SELECT id FROM drug_consumptions WHERE id = $1 AND user_id = $2',
      [id, req.user.userId]
    );

    if (consumptionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Consumption record not found' });
    }

    await pool.query('DELETE FROM drug_consumptions WHERE id = $1 AND user_id = $2', [id, req.user.userId]);

    res.json({ message: 'Consumption record deleted successfully' });
  } catch (error) {
    console.error('Delete consumption error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get today's summary
const getTodaySummary = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const consumptionsResult = await pool.query(
      `SELECT dc.*, d.name as drug_name
       FROM drug_consumptions dc
       JOIN drugs d ON dc.drug_id = d.id
       WHERE dc.user_id = $1 AND dc.consumption_date = $2
       ORDER BY dc.consumed_at DESC`,
      [req.user.userId, today]
    );

    const proceduresResult = await pool.query(
      `SELECT pr.*, mp.name as procedure_name
       FROM procedure_records pr
       JOIN medical_procedures mp ON pr.procedure_id = mp.id
       WHERE pr.user_id = $1 AND pr.procedure_date = $2
       ORDER BY pr.performed_at DESC`,
      [req.user.userId, today]
    );

    res.json({
      date: today,
      consumptions: consumptionsResult.rows,
      procedures: proceduresResult.rows
    });
  } catch (error) {
    console.error('Get today summary error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all drug schedules for a user
const getDrugSchedules = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ds.*, d.name AS drug_name
       FROM drug_schedules ds
       JOIN drugs d ON ds.drug_id = d.id
       WHERE ds.user_id = $1
       ORDER BY d.name`,
      [req.user.userId]
    );
    res.json({ schedules: result.rows });
  } catch (error) {
    console.error('Get drug schedules error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create or replace a schedule for a drug
const upsertDrugSchedule = async (req, res) => {
  try {
    const { drug_id, schedule_type, interval_hours, times_per_day, notes } = req.body;

    if (!drug_id || !schedule_type) {
      return res
        .status(400)
        .json({ error: 'drug_id and schedule_type are required' });
    }

    if (!['interval', 'per_day'].includes(schedule_type)) {
      return res
        .status(400)
        .json({ error: 'schedule_type must be "interval" or "per_day"' });
    }

    if (schedule_type === 'interval' && (!interval_hours || interval_hours <= 0)) {
      return res
        .status(400)
        .json({ error: 'interval_hours must be a positive number for interval schedules' });
    }

    if (schedule_type === 'per_day' && (!times_per_day || times_per_day <= 0)) {
      return res
        .status(400)
        .json({ error: 'times_per_day must be a positive number for per_day schedules' });
    }

    // Verify drug belongs to user
    const drugCheck = await pool.query(
      'SELECT id FROM drugs WHERE id = $1 AND user_id = $2',
      [drug_id, req.user.userId]
    );

    if (drugCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Drug not found' });
    }

    const result = await pool.query(
      `INSERT INTO drug_schedules (user_id, drug_id, schedule_type, interval_hours, times_per_day, notes, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE)
       ON CONFLICT (user_id, drug_id)
       DO UPDATE SET schedule_type = $3,
                     interval_hours = $4,
                     times_per_day = $5,
                     notes = $6,
                     is_active = TRUE
       RETURNING *`,
      [
        req.user.userId,
        drug_id,
        schedule_type,
        interval_hours || null,
        times_per_day || null,
        notes || null
      ]
    );

    res.status(201).json({ schedule: result.rows[0] });
  } catch (error) {
    console.error('Upsert drug schedule error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete a drug schedule
const deleteDrugSchedule = async (req, res) => {
  try {
    const { id } = req.params;

    const scheduleCheck = await pool.query(
      'SELECT id FROM drug_schedules WHERE id = $1 AND user_id = $2',
      [id, req.user.userId]
    );

    if (scheduleCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    await pool.query('DELETE FROM drug_schedules WHERE id = $1 AND user_id = $2', [
      id,
      req.user.userId
    ]);

    res.json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    console.error('Delete drug schedule error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getDrugs,
  createDrug,
  updateDrug,
  deleteDrug,
  getConsumptions,
  recordConsumption,
  deleteConsumption,
  getTodaySummary,
  getDrugSchedules,
  upsertDrugSchedule,
  deleteDrugSchedule
};

