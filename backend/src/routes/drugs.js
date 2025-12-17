const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
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
} = require('../controllers/drugController');

// Drug management
router.get('/', authenticateToken, getDrugs);
router.post('/', authenticateToken, createDrug);
router.put('/:id', authenticateToken, updateDrug);
router.delete('/:id', authenticateToken, deleteDrug);

// Consumption tracking
router.get('/consumptions', authenticateToken, getConsumptions);
router.post('/consumptions', authenticateToken, recordConsumption);
router.delete('/consumptions/:id', authenticateToken, deleteConsumption);

// Schedules
router.get('/schedules', authenticateToken, getDrugSchedules);
router.post('/schedules', authenticateToken, upsertDrugSchedule);
router.put('/schedules/:id', authenticateToken, upsertDrugSchedule);
router.delete('/schedules/:id', authenticateToken, deleteDrugSchedule);

// Summary
router.get('/summary/today', authenticateToken, getTodaySummary);

module.exports = router;

