import { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { drugsAPI } from '../services/api';

const DrugTracker = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [drugs, setDrugs] = useState([]);
  const [consumptions, setConsumptions] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [drugDialogOpen, setDrugDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [consumptionDialogOpen, setConsumptionDialogOpen] = useState(false);
  const [editingDrug, setEditingDrug] = useState(null);
  const [editingScheduleDrug, setEditingScheduleDrug] = useState(null);
  const [loading, setLoading] = useState(true);

  const [drugForm, setDrugForm] = useState({
    name: '',
    unit_type: 'pills',
    default_dosage: '',
  });

  const [consumptionForm, setConsumptionForm] = useState({
    drug_id: '',
    consumption_date: new Date().toISOString().split('T')[0],
    consumption_time: new Date().toTimeString().slice(0, 5),
    quantity: '',
    unit_type: 'pills',
    notes: '',
  });

  const [scheduleForm, setScheduleForm] = useState({
    schedule_type: 'interval',
    interval_hours: '',
    times_per_day: '',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [drugsRes, consumptionsRes, schedulesRes] = await Promise.all([
        drugsAPI.getDrugs(),
        drugsAPI.getConsumptions(),
        drugsAPI.getSchedules(),
      ]);
      setDrugs(drugsRes.data.drugs);
      setConsumptions(consumptionsRes.data.consumptions);
      setSchedules(schedulesRes.data.schedules);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDrug = async () => {
    try {
      await drugsAPI.createDrug(drugForm);
      setDrugDialogOpen(false);
      setDrugForm({ name: '', unit_type: 'pills', default_dosage: '' });
      loadData();
    } catch (error) {
      console.error('Failed to create drug:', error);
      alert(error.response?.data?.error || 'Failed to create drug');
    }
  };

  const handleUpdateDrug = async () => {
    try {
      await drugsAPI.updateDrug(editingDrug.id, drugForm);
      setDrugDialogOpen(false);
      setEditingDrug(null);
      setDrugForm({ name: '', unit_type: 'pills', default_dosage: '' });
      loadData();
    } catch (error) {
      console.error('Failed to update drug:', error);
      alert(error.response?.data?.error || 'Failed to update drug');
    }
  };

  const handleDeleteDrug = async (id) => {
    if (!window.confirm('Are you sure you want to delete this drug?')) return;
    try {
      await drugsAPI.deleteDrug(id);
      loadData();
    } catch (error) {
      console.error('Failed to delete drug:', error);
      alert(error.response?.data?.error || 'Failed to delete drug');
    }
  };

  const handleRecordConsumption = async () => {
    try {
      const consumedAt = `${consumptionForm.consumption_date}T${consumptionForm.consumption_time}:00`;

      await drugsAPI.recordConsumption({
        drug_id: consumptionForm.drug_id,
        consumption_date: consumptionForm.consumption_date,
        quantity: Number(consumptionForm.quantity),
        unit_type: consumptionForm.unit_type,
        notes: consumptionForm.notes,
        consumed_at: consumedAt,
      });
      setConsumptionDialogOpen(false);
      setConsumptionForm({
        drug_id: '',
        consumption_date: new Date().toISOString().split('T')[0],
        consumption_time: new Date().toTimeString().slice(0, 5),
        quantity: '',
        unit_type: 'pills',
        notes: '',
      });
      loadData();
    } catch (error) {
      console.error('Failed to record consumption:', error);
      alert(error.response?.data?.error || 'Failed to record consumption');
    }
  };

  const handleDeleteConsumption = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      await drugsAPI.deleteConsumption(id);
      loadData();
    } catch (error) {
      console.error('Failed to delete consumption:', error);
      alert(error.response?.data?.error || 'Failed to delete consumption');
    }
  };

  const openEditDrug = (drug) => {
    setEditingDrug(drug);
    setDrugForm({
      name: drug.name,
      unit_type: drug.unit_type,
      default_dosage: drug.default_dosage || '',
    });
    setDrugDialogOpen(true);
  };

  const openScheduleDialog = (drug) => {
    setEditingScheduleDrug(drug);
    const existing = schedules.find((s) => s.drug_id === drug.id);
    if (existing) {
      setScheduleForm({
        schedule_type: existing.schedule_type,
        interval_hours: existing.interval_hours || '',
        times_per_day: existing.times_per_day || '',
        notes: existing.notes || '',
      });
    } else {
      setScheduleForm({
        schedule_type: 'interval',
        interval_hours: '',
        times_per_day: '',
        notes: '',
      });
    }
    setScheduleDialogOpen(true);
  };

  const handleSaveSchedule = async () => {
    if (!editingScheduleDrug) return;
    try {
      await drugsAPI.upsertSchedule({
        drug_id: editingScheduleDrug.id,
        schedule_type: scheduleForm.schedule_type,
        interval_hours:
          scheduleForm.schedule_type === 'interval'
            ? Number(scheduleForm.interval_hours)
            : undefined,
        times_per_day:
          scheduleForm.schedule_type === 'per_day'
            ? Number(scheduleForm.times_per_day)
            : undefined,
        notes: scheduleForm.notes || undefined,
      });
      setScheduleDialogOpen(false);
      setEditingScheduleDrug(null);
      await loadData();
    } catch (error) {
      console.error('Failed to save schedule:', error);
      alert(error.response?.data?.error || 'Failed to save schedule');
    }
  };

  const getScheduleForDrug = (drugId) =>
    schedules.find((s) => s.drug_id === drugId);

  const formatSchedule = (schedule) => {
    if (!schedule) return 'No schedule';
    if (schedule.schedule_type === 'interval') {
      return `Every ${schedule.interval_hours} hours`;
    }
    if (schedule.schedule_type === 'per_day') {
      return `${schedule.times_per_day} time(s) per day`;
    }
    return 'No schedule';
  };

  const hasTakenToday = (drugId) => {
    const today = new Date().toISOString().split('T')[0];
    return consumptions.some(
      (c) => c.drug_id === drugId && c.consumption_date === today
    );
  };

  const countTakenToday = (drugId) => {
    const today = new Date().toISOString().split('T')[0];
    return consumptions.filter(
      (c) => c.drug_id === drugId && c.consumption_date === today
    ).length;
  };

  const getTodayProgressLabel = (drugId) => {
    const schedule = getScheduleForDrug(drugId);
    const count = countTakenToday(drugId);

    if (!schedule) {
      return `${count} taken today`;
    }

    if (schedule.schedule_type === 'per_day' && schedule.times_per_day) {
      return `${count}/${schedule.times_per_day} taken today`;
    }

    return `${count} taken today`;
  };

  return (
    <Box>
      <Box 
        display="flex" 
        flexDirection={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between" 
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        mb={3}
        gap={2}
      >
        <Typography variant="h4" component="h1" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
          Drug Tracker
        </Typography>
        <Box display="flex" gap={1} width={{ xs: '100%', sm: 'auto' }}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setConsumptionDialogOpen(true)}
            fullWidth={isMobile}
          >
            Record Consumption
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditingDrug(null);
              setDrugForm({ name: '', unit_type: 'pills', default_dosage: '' });
              setDrugDialogOpen(true);
            }}
            fullWidth={isMobile}
          >
            Add Drug
          </Button>
        </Box>
      </Box>

      <Grid container spacing={{ xs: 2, sm: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                My Drugs ({drugs.length})
              </Typography>
              {drugs.length > 0 ? (
                <Box>
                  {drugs.map((drug) => (
                    <Box
                      key={drug.id}
                      sx={{
                        p: 2,
                        mb: 1,
                        border: '1px solid #e0e0e0',
                        borderRadius: 1,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Box>
                        <Typography variant="body1">{drug.name}</Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {drug.unit_type}{' '}
                          {drug.default_dosage ? `(${drug.default_dosage})` : ''}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                        >
                          Schedule: {formatSchedule(getScheduleForDrug(drug.id))}
                        </Typography>
                        {hasTakenToday(drug.id) && (
                          <Chip
                            label={getTodayProgressLabel(drug.id)}
                            color="success"
                            size="small"
                            sx={{ mt: 0.5 }}
                          />
                        )}
                      </Box>
                      <Box>
                        <Button
                          size="small"
                          variant="outlined"
                          sx={{ mr: 1 }}
                          onClick={() => openScheduleDialog(drug)}
                        >
                          Schedule
                        </Button>
                        <IconButton
                          size="small"
                          onClick={() => openEditDrug(drug)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteDrug(drug.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography color="text.secondary">
                  No drugs added yet. Click "Add Drug" to get started.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <TableContainer 
            component={Paper}
            sx={{ 
              maxHeight: { xs: '400px', sm: 'none' },
              overflowX: 'auto'
            }}
          >
            <Table size={isMobile ? 'small' : 'medium'}>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Time</TableCell>
                  <TableCell>Drug</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Notes</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {consumptions.length > 0 ? (
                  consumptions.map((consumption) => (
                    <TableRow key={consumption.id}>
                      <TableCell>
                        {new Date(
                          consumption.consumption_date
                        ).toLocaleDateString('en-GB')}
                      </TableCell>
                      <TableCell>
                        {consumption.consumed_at
                          ? new Date(consumption.consumed_at).toLocaleTimeString(
                              [],
                              {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false,
                              }
                            )
                          : ''}
                      </TableCell>
                      <TableCell>{consumption.drug_name}</TableCell>
                      <TableCell>
                        {consumption.quantity}{' '}
                        {consumption.unit_type === 'mg'
                          ? 'mg'
                          : consumption.quantity === 1
                          ? 'pill'
                          : 'pills'}
                      </TableCell>
                      <TableCell>
                        {consumption.notes || '-'}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteConsumption(consumption.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No consumption records found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>

      {/* Drug Dialog */}
      <Dialog 
        open={drugDialogOpen} 
        onClose={() => setDrugDialogOpen(false)}
        fullScreen={isMobile}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {editingDrug ? 'Edit Drug' : 'Add New Drug'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Drug Name"
            margin="normal"
            value={drugForm.name}
            onChange={(e) => setDrugForm({ ...drugForm, name: e.target.value })}
            required
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Unit Type</InputLabel>
            <Select
              value={drugForm.unit_type}
              onChange={(e) =>
                setDrugForm({ ...drugForm, unit_type: e.target.value })
              }
            >
              <MenuItem value="pills">Pills</MenuItem>
              <MenuItem value="mg">Milligrams (mg)</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Default Dosage (optional)"
            type="number"
            margin="normal"
            value={drugForm.default_dosage}
            onChange={(e) =>
              setDrugForm({ ...drugForm, default_dosage: e.target.value })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDrugDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={editingDrug ? handleUpdateDrug : handleCreateDrug}
            variant="contained"
          >
            {editingDrug ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Consumption Dialog */}
      <Dialog
        open={consumptionDialogOpen}
        onClose={() => setConsumptionDialogOpen(false)}
        fullScreen={isMobile}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Record Drug Consumption</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Drug</InputLabel>
            <Select
              value={consumptionForm.drug_id}
              onChange={(e) => {
                const selectedDrug = drugs.find((d) => d.id === parseInt(e.target.value));
                setConsumptionForm({
                  ...consumptionForm,
                  drug_id: e.target.value,
                  unit_type: selectedDrug?.unit_type || 'pills',
                });
              }}
              required
            >
              {drugs.map((drug) => (
                <MenuItem key={drug.id} value={drug.id}>
                  {drug.name} ({drug.unit_type})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Date"
            type="date"
            margin="normal"
            value={consumptionForm.consumption_date}
            onChange={(e) =>
              setConsumptionForm({
                ...consumptionForm,
                consumption_date: e.target.value,
              })
            }
            InputLabelProps={{ shrink: true }}
            required
          />
          <TextField
            fullWidth
            label="Time"
            type="time"
            margin="normal"
            value={consumptionForm.consumption_time}
            onChange={(e) =>
              setConsumptionForm({
                ...consumptionForm,
                consumption_time: e.target.value,
              })
            }
            InputLabelProps={{ shrink: true }}
            required
          />
          <TextField
            fullWidth
            label="Quantity"
            type="number"
            margin="normal"
            value={consumptionForm.quantity}
            onChange={(e) =>
              setConsumptionForm({ ...consumptionForm, quantity: e.target.value })
            }
            required
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Unit Type</InputLabel>
            <Select
              value={consumptionForm.unit_type}
              onChange={(e) =>
                setConsumptionForm({ ...consumptionForm, unit_type: e.target.value })
              }
            >
              <MenuItem value="pills">Pills</MenuItem>
              <MenuItem value="mg">Milligrams (mg)</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Notes (optional)"
            multiline
            rows={3}
            margin="normal"
            value={consumptionForm.notes}
            onChange={(e) =>
              setConsumptionForm({ ...consumptionForm, notes: e.target.value })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConsumptionDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleRecordConsumption} variant="contained">
            Record
          </Button>
        </DialogActions>
      </Dialog>

      {/* Schedule Dialog */}
      <Dialog
        open={scheduleDialogOpen}
        onClose={() => setScheduleDialogOpen(false)}
        fullScreen={isMobile}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {editingScheduleDrug
            ? `Schedule for ${editingScheduleDrug.name}`
            : 'Schedule'}
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Schedule Type</InputLabel>
            <Select
              value={scheduleForm.schedule_type}
              label="Schedule Type"
              onChange={(e) =>
                setScheduleForm({
                  ...scheduleForm,
                  schedule_type: e.target.value,
                })
              }
            >
              <MenuItem value="interval">Every X hours</MenuItem>
              <MenuItem value="per_day">Times per day</MenuItem>
            </Select>
          </FormControl>

          {scheduleForm.schedule_type === 'interval' && (
            <TextField
              fullWidth
              label="Every how many hours?"
              type="number"
              margin="normal"
              value={scheduleForm.interval_hours}
              onChange={(e) =>
                setScheduleForm({
                  ...scheduleForm,
                  interval_hours: e.target.value,
                })
              }
              required
            />
          )}

          {scheduleForm.schedule_type === 'per_day' && (
            <TextField
              fullWidth
              label="Times per day"
              type="number"
              margin="normal"
              value={scheduleForm.times_per_day}
              onChange={(e) =>
                setScheduleForm({
                  ...scheduleForm,
                  times_per_day: e.target.value,
                })
              }
              required
            />
          )}

          <TextField
            fullWidth
            label="Notes (optional)"
            multiline
            rows={3}
            margin="normal"
            value={scheduleForm.notes}
            onChange={(e) =>
              setScheduleForm({
                ...scheduleForm,
                notes: e.target.value,
              })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScheduleDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveSchedule} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DrugTracker;

