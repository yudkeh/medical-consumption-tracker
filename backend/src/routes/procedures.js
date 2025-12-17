const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
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
} = require('../controllers/procedureController');

// Procedure management
router.get('/', authenticateToken, getProcedures);
router.post('/', authenticateToken, createProcedure);
router.put('/:id', authenticateToken, updateProcedure);
router.delete('/:id', authenticateToken, deleteProcedure);

// Procedure records
router.get('/records', authenticateToken, getProcedureRecords);
router.post('/records', authenticateToken, recordProcedure);
router.delete('/records/:id', authenticateToken, deleteProcedureRecord);

// Procedure schedules
router.get('/schedules', authenticateToken, getProcedureSchedules);
router.post('/schedules', authenticateToken, upsertProcedureSchedule);
router.put('/schedules/:id', authenticateToken, upsertProcedureSchedule);
router.delete('/schedules/:id', authenticateToken, deleteProcedureSchedule);

// Export
router.get('/export', authenticateToken, exportProcedureRecords);

module.exports = router;

