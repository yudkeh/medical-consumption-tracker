const pool = require('../config/database');
const ExcelJS = require('exceljs');

// Get all procedures for a user
const getProcedures = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM medical_procedures WHERE user_id = $1 ORDER BY name',
      [req.user.userId]
    );
    res.json({ procedures: result.rows });
  } catch (error) {
    console.error('Get procedures error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create a new procedure
const createProcedure = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }

    const result = await pool.query(
      'INSERT INTO medical_procedures (user_id, name) VALUES ($1, $2) RETURNING *',
      [req.user.userId, name]
    );

    res.status(201).json({ procedure: result.rows[0] });
  } catch (error) {
    console.error('Create procedure error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update a procedure
const updateProcedure = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    // Verify procedure belongs to user
    const procedureCheck = await pool.query(
      'SELECT id FROM medical_procedures WHERE id = $1 AND user_id = $2',
      [id, req.user.userId]
    );

    if (procedureCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Procedure not found' });
    }

    const result = await pool.query(
      'UPDATE medical_procedures SET name = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
      [name, id, req.user.userId]
    );

    res.json({ procedure: result.rows[0] });
  } catch (error) {
    console.error('Update procedure error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete a procedure
const deleteProcedure = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify procedure belongs to user
    const procedureCheck = await pool.query(
      'SELECT id FROM medical_procedures WHERE id = $1 AND user_id = $2',
      [id, req.user.userId]
    );

    if (procedureCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Procedure not found' });
    }

    await pool.query('DELETE FROM medical_procedures WHERE id = $1 AND user_id = $2', [id, req.user.userId]);

    res.json({ message: 'Procedure deleted successfully' });
  } catch (error) {
    console.error('Delete procedure error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get procedure records
const getProcedureRecords = async (req, res) => {
  try {
    const { start_date, end_date, procedure_id } = req.query;
    let query = `
      SELECT pr.*, mp.name as procedure_name
      FROM procedure_records pr
      JOIN medical_procedures mp ON pr.procedure_id = mp.id
      WHERE pr.user_id = $1
    `;
    const params = [req.user.userId];

    if (start_date && end_date) {
      query += ' AND pr.procedure_date BETWEEN $2 AND $3';
      params.push(start_date, end_date);

      if (procedure_id) {
        query += ' AND pr.procedure_id = $4';
        params.push(procedure_id);
      }

      query += ' ORDER BY pr.procedure_date DESC, pr.performed_at DESC';
    } else {
      query +=
        ' ORDER BY pr.procedure_date DESC, pr.performed_at DESC LIMIT 100';
    }

    const result = await pool.query(query, params);
    res.json({ records: result.rows });
  } catch (error) {
    console.error('Get procedure records error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Record a procedure (each call represents one performed procedure at a specific time)
const recordProcedure = async (req, res) => {
  try {
    const { procedure_id, procedure_date, notes, performed_at } = req.body;

    if (!procedure_id || !procedure_date) {
      return res.status(400).json({ error: 'procedure_id and procedure_date are required' });
    }

    // Verify procedure belongs to user
    const procedureCheck = await pool.query(
      'SELECT id FROM medical_procedures WHERE id = $1 AND user_id = $2',
      [procedure_id, req.user.userId]
    );

    if (procedureCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Procedure not found' });
    }

    const performedAtValue =
      performed_at ||
      new Date(
        `${procedure_date}T${new Date().toTimeString().slice(0, 8)}`
      ).toISOString();

    const result = await pool.query(
      `INSERT INTO procedure_records (user_id, procedure_id, procedure_date, notes, performed_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.user.userId, procedure_id, procedure_date, notes || null, performedAtValue]
    );

    res.status(201).json({ record: result.rows[0] });
  } catch (error) {
    console.error('Record procedure error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete a procedure record
const deleteProcedureRecord = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify record belongs to user
    const recordCheck = await pool.query(
      'SELECT id FROM procedure_records WHERE id = $1 AND user_id = $2',
      [id, req.user.userId]
    );

    if (recordCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Procedure record not found' });
    }

    await pool.query('DELETE FROM procedure_records WHERE id = $1 AND user_id = $2', [id, req.user.userId]);

    res.json({ message: 'Procedure record deleted successfully' });
  } catch (error) {
    console.error('Delete procedure record error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all procedure schedules for a user
const getProcedureSchedules = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ps.*, mp.name AS procedure_name
       FROM procedure_schedules ps
       JOIN medical_procedures mp ON ps.procedure_id = mp.id
       WHERE ps.user_id = $1
       ORDER BY mp.name`,
      [req.user.userId]
    );
    res.json({ schedules: result.rows });
  } catch (error) {
    console.error('Get procedure schedules error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create or replace a schedule for a procedure
const upsertProcedureSchedule = async (req, res) => {
  try {
    const { procedure_id, schedule_type, interval_hours, times_per_day, notes } = req.body;

    if (!procedure_id || !schedule_type) {
      return res
        .status(400)
        .json({ error: 'procedure_id and schedule_type are required' });
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

    // Verify procedure belongs to user
    const procedureCheck = await pool.query(
      'SELECT id FROM medical_procedures WHERE id = $1 AND user_id = $2',
      [procedure_id, req.user.userId]
    );

    if (procedureCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Procedure not found' });
    }

    const result = await pool.query(
      `INSERT INTO procedure_schedules (user_id, procedure_id, schedule_type, interval_hours, times_per_day, notes, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE)
       ON CONFLICT (user_id, procedure_id)
       DO UPDATE SET schedule_type = $3,
                     interval_hours = $4,
                     times_per_day = $5,
                     notes = $6,
                     is_active = TRUE
       RETURNING *`,
      [
        req.user.userId,
        procedure_id,
        schedule_type,
        interval_hours || null,
        times_per_day || null,
        notes || null
      ]
    );

    res.status(201).json({ schedule: result.rows[0] });
  } catch (error) {
    console.error('Upsert procedure schedule error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete a procedure schedule
const deleteProcedureSchedule = async (req, res) => {
  try {
    const { id } = req.params;

    const scheduleCheck = await pool.query(
      'SELECT id FROM procedure_schedules WHERE id = $1 AND user_id = $2',
      [id, req.user.userId]
    );

    if (scheduleCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    await pool.query(
      'DELETE FROM procedure_schedules WHERE id = $1 AND user_id = $2',
      [id, req.user.userId]
    );

    res.json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    console.error('Delete procedure schedule error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Export procedure records to Excel
const exportProcedureRecords = async (req, res) => {
  try {
    const { start_date, end_date, procedure_id } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'start_date and end_date are required' });
    }

    // Build query
    let query = `
      SELECT 
        pr.id,
        pr.procedure_date,
        pr.performed_at,
        pr.notes,
        mp.name as procedure_name
      FROM procedure_records pr
      JOIN medical_procedures mp ON pr.procedure_id = mp.id
      WHERE pr.user_id = $1
        AND pr.procedure_date BETWEEN $2 AND $3
    `;
    const params = [req.user.userId, start_date, end_date];

    // Filter by specific procedure if provided
    if (procedure_id) {
      query += ' AND pr.procedure_id = $4';
      params.push(procedure_id);
    }

    query += ' ORDER BY pr.procedure_date ASC, pr.performed_at ASC';

    const result = await pool.query(query, params);

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Procedure Records');

    // Define columns
    worksheet.columns = [
      { header: 'Date', key: 'date', width: 12 },
      { header: 'Time', key: 'time', width: 10 },
      { header: 'Procedure Name', key: 'procedure_name', width: 30 },
      { header: 'Notes', key: 'notes', width: 50 },
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Add data rows
    result.rows.forEach((record) => {
      const date = new Date(record.procedure_date);
      const performedAt = record.performed_at ? new Date(record.performed_at) : null;
      
      const dateStr = date.toLocaleDateString('en-GB');
      const timeStr = performedAt 
        ? performedAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
        : '';

      worksheet.addRow({
        date: dateStr,
        time: timeStr,
        procedure_name: record.procedure_name,
        notes: record.notes || ''
      });
    });

    // Set response headers
    const filename = `procedure_records_${start_date}_to_${end_date}.xlsx`;
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export procedure records error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getProcedures,
  createProcedure,
  updateProcedure,
  deleteProcedure,
  getProcedureRecords,
  recordProcedure,
  deleteProcedureRecord,
  getProcedureSchedules,
  upsertProcedureSchedule,
  deleteProcedureSchedule,
  exportProcedureRecords
};

