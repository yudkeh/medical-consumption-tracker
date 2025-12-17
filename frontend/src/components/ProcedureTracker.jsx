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
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  FileDownload as FileDownloadIcon,
} from '@mui/icons-material';
import { proceduresAPI } from '../services/api';

const ProcedureTracker = () => {
  const [procedures, setProcedures] = useState([]);
  const [records, setRecords] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [procedureDialogOpen, setProcedureDialogOpen] = useState(false);
  const [recordDialogOpen, setRecordDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [editingProcedure, setEditingProcedure] = useState(null);
  const [editingScheduleProcedure, setEditingScheduleProcedure] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const [procedureForm, setProcedureForm] = useState({
    name: '',
  });

  const [recordForm, setRecordForm] = useState({
    procedure_id: '',
    procedure_date: new Date().toISOString().split('T')[0],
    procedure_time: new Date().toTimeString().slice(0, 5),
    notes: '',
  });

  const [scheduleForm, setScheduleForm] = useState({
    schedule_type: 'interval',
    interval_hours: '',
    times_per_day: '',
    notes: '',
  });

  const [exportForm, setExportForm] = useState({
    start_date: new Date(new Date().setMonth(new Date().getMonth() - 1))
      .toISOString()
      .split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    procedure_id: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [proceduresRes, recordsRes, schedulesRes] = await Promise.all([
        proceduresAPI.getProcedures(),
        proceduresAPI.getProcedureRecords(),
        proceduresAPI.getSchedules(),
      ]);
      setProcedures(proceduresRes.data.procedures);
      setRecords(recordsRes.data.records);
      setSchedules(schedulesRes.data.schedules);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProcedure = async () => {
    try {
      await proceduresAPI.createProcedure(procedureForm);
      setProcedureDialogOpen(false);
      setProcedureForm({ name: '' });
      loadData();
    } catch (error) {
      console.error('Failed to create procedure:', error);
      alert(error.response?.data?.error || 'Failed to create procedure');
    }
  };

  const handleUpdateProcedure = async () => {
    try {
      await proceduresAPI.updateProcedure(editingProcedure.id, procedureForm);
      setProcedureDialogOpen(false);
      setEditingProcedure(null);
      setProcedureForm({ name: '' });
      loadData();
    } catch (error) {
      console.error('Failed to update procedure:', error);
      alert(error.response?.data?.error || 'Failed to update procedure');
    }
  };

  const handleDeleteProcedure = async (id) => {
    if (!window.confirm('Are you sure you want to delete this procedure?')) return;
    try {
      await proceduresAPI.deleteProcedure(id);
      loadData();
    } catch (error) {
      console.error('Failed to delete procedure:', error);
      alert(error.response?.data?.error || 'Failed to delete procedure');
    }
  };

  const handleRecordProcedure = async () => {
    try {
      const performedAt = `${recordForm.procedure_date}T${recordForm.procedure_time}:00`;

      await proceduresAPI.recordProcedure({
        procedure_id: recordForm.procedure_id,
        procedure_date: recordForm.procedure_date,
        notes: recordForm.notes,
        performed_at: performedAt,
      });
      setRecordDialogOpen(false);
      setRecordForm({
        procedure_id: '',
        procedure_date: new Date().toISOString().split('T')[0],
        procedure_time: new Date().toTimeString().slice(0, 5),
        notes: '',
      });
      loadData();
    } catch (error) {
      console.error('Failed to record procedure:', error);
      alert(error.response?.data?.error || 'Failed to record procedure');
    }
  };

  const handleDeleteRecord = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      await proceduresAPI.deleteProcedureRecord(id);
      loadData();
    } catch (error) {
      console.error('Failed to delete record:', error);
      alert(error.response?.data?.error || 'Failed to delete record');
    }
  };

  const openEditProcedure = (procedure) => {
    setEditingProcedure(procedure);
    setProcedureForm({
      name: procedure.name,
    });
    setProcedureDialogOpen(true);
  };

  const formatProcedureType = (name) => {
    if (!name) return '';
    return name;
  };

  const openScheduleDialog = (procedure) => {
    setEditingScheduleProcedure(procedure);
    const existing = schedules.find((s) => s.procedure_id === procedure.id);
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
    if (!editingScheduleProcedure) return;
    try {
      await proceduresAPI.upsertSchedule({
        procedure_id: editingScheduleProcedure.id,
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
      setEditingScheduleProcedure(null);
      await loadData();
    } catch (error) {
      console.error('Failed to save schedule:', error);
      alert(error.response?.data?.error || 'Failed to save schedule');
    }
  };

  const getScheduleForProcedure = (procedureId) =>
    schedules.find((s) => s.procedure_id === procedureId);

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

  const hasDoneToday = (procedureId) => {
    const today = new Date().toISOString().split('T')[0];
    return records.some(
      (r) => r.procedure_id === procedureId && r.procedure_date === today
    );
  };

  const countDoneToday = (procedureId) => {
    const today = new Date().toISOString().split('T')[0];
    return records.filter(
      (r) => r.procedure_id === procedureId && r.procedure_date === today
    ).length;
  };

  const getTodayProgressLabel = (procedureId) => {
    const schedule = getScheduleForProcedure(procedureId);
    const count = countDoneToday(procedureId);

    if (!schedule) {
      return `${count} done today`;
    }

    if (schedule.schedule_type === 'per_day' && schedule.times_per_day) {
      return `${count}/${schedule.times_per_day} done today`;
    }

    return `${count} done today`;
  };

  const handlePrint = async () => {
    if (!exportForm.start_date || !exportForm.end_date) {
      alert('Please select both start and end dates');
      return;
    }

    if (new Date(exportForm.start_date) > new Date(exportForm.end_date)) {
      alert('Start date must be before end date');
      return;
    }

    try {
      const params = {
        start_date: exportForm.start_date,
        end_date: exportForm.end_date,
      };
      if (exportForm.procedure_id) {
        params.procedure_id = exportForm.procedure_id;
      }

      const response = await proceduresAPI.getProcedureRecords(params);
      const records = response.data.records || [];

      const selectedProcedure =
        procedures.find((p) => p.id === Number(exportForm.procedure_id)) ||
        null;

      const title = selectedProcedure
        ? `Procedure: ${selectedProcedure.name}`
        : 'All Procedures';

      const rangeText = `${exportForm.start_date} to ${exportForm.end_date}`;

      const rowsHtml = records
        .map((r) => {
          const dateStr = new Date(r.procedure_date).toLocaleDateString(
            'en-GB'
          );
          const timeStr = r.performed_at
            ? new Date(r.performed_at).toLocaleTimeString('en-GB', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              })
            : '';
          const notes = (r.notes || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
          const name = (r.procedure_name || '')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
          return `<tr>
            <td>${dateStr}</td>
            <td>${timeStr}</td>
            <td>${name}</td>
            <td>${notes}</td>
          </tr>`;
        })
        .join('');

      const html = `<!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Procedure Records</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 16px; }
            h1 { font-size: 20px; margin-bottom: 4px; }
            h2 { font-size: 16px; margin-top: 0; color: #555; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { border: 1px solid #ccc; padding: 8px; font-size: 12px; }
            th { background: #f0f0f0; text-align: left; }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <h2>Date range: ${rangeText}</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Procedure</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml || '<tr><td colspan="4">No records found</td></tr>'}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>`;

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
      }
    } catch (error) {
      console.error('Print failed:', error);
      alert(error.response?.data?.error || 'Failed to load records for printing');
    }
  };

  const handleExport = async () => {
    if (!exportForm.start_date || !exportForm.end_date) {
      alert('Please select both start and end dates');
      return;
    }

    if (new Date(exportForm.start_date) > new Date(exportForm.end_date)) {
      alert('Start date must be before end date');
      return;
    }

    setExporting(true);
    try {
      const params = {
        start_date: exportForm.start_date,
        end_date: exportForm.end_date,
      };
      if (exportForm.procedure_id) {
        params.procedure_id = exportForm.procedure_id;
      }

      const response = await proceduresAPI.exportRecords(params);
      
      // Create blob and download
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `procedure_records_${exportForm.start_date}_to_${exportForm.end_date}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setExportDialogOpen(false);
    } catch (error) {
      console.error('Export failed:', error);
      alert(error.response?.data?.error || 'Failed to export records');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Procedure Tracker
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={() => setExportDialogOpen(true)}
            sx={{ mr: 1 }}
          >
            Export
          </Button>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setRecordDialogOpen(true)}
            sx={{ mr: 1 }}
          >
            Record Procedure
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditingProcedure(null);
              setProcedureForm({ name: '' });
              setProcedureDialogOpen(true);
            }}
          >
            Add Procedure
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                My Procedures ({procedures.length})
              </Typography>
              {procedures.length > 0 ? (
                <Box>
                  {procedures.map((procedure) => (
                    <Box
                      key={procedure.id}
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
                        <Typography variant="body1">{procedure.name}</Typography>
                        <Chip
                          label={formatProcedureType(procedure.procedure_type)}
                          size="small"
                          sx={{ mt: 0.5, mr: 0.5 }}
                        />
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                        >
                          Schedule:{' '}
                          {formatSchedule(getScheduleForProcedure(procedure.id))}
                        </Typography>
                        {hasDoneToday(procedure.id) && (
                          <Chip
                            label={getTodayProgressLabel(procedure.id)}
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
                          onClick={() => openScheduleDialog(procedure)}
                        >
                          Schedule
                        </Button>
                        <IconButton
                          size="small"
                          onClick={() => openEditProcedure(procedure)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteProcedure(procedure.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography color="text.secondary">
                  No procedures added yet. Click "Add Procedure" to get started.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Time</TableCell>
                  <TableCell>Procedure</TableCell>
                  <TableCell>Notes</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {records.length > 0 ? (
                  records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        {new Date(
                          record.procedure_date
                        ).toLocaleDateString('en-GB')}
                      </TableCell>
                      <TableCell>
                        {record.performed_at
                          ? new Date(record.performed_at).toLocaleTimeString(
                              [],
                              {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false,
                              }
                            )
                          : ''}
                      </TableCell>
                      <TableCell>{record.procedure_name}</TableCell>
                      <TableCell>{record.notes || '-'}</TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteRecord(record.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No procedure records found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>

      {/* Procedure Dialog */}
      <Dialog
        open={procedureDialogOpen}
        onClose={() => setProcedureDialogOpen(false)}
      >
        <DialogTitle>
          {editingProcedure ? 'Edit Procedure' : 'Add New Procedure'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Procedure Name"
            margin="normal"
            value={procedureForm.name}
            onChange={(e) =>
              setProcedureForm({ ...procedureForm, name: e.target.value })
            }
            required
            placeholder="e.g., Daily Enema, Morning Catheterization"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProcedureDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={
              editingProcedure ? handleUpdateProcedure : handleCreateProcedure
            }
            variant="contained"
          >
            {editingProcedure ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Record Dialog */}
      <Dialog open={recordDialogOpen} onClose={() => setRecordDialogOpen(false)}>
        <DialogTitle>Record Medical Procedure</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Procedure</InputLabel>
            <Select
              value={recordForm.procedure_id}
              onChange={(e) =>
                setRecordForm({ ...recordForm, procedure_id: e.target.value })
              }
              required
            >
              {procedures.map((procedure) => (
                <MenuItem key={procedure.id} value={procedure.id}>
                  {procedure.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Date"
            type="date"
            margin="normal"
            value={recordForm.procedure_date}
            onChange={(e) =>
              setRecordForm({ ...recordForm, procedure_date: e.target.value })
            }
            InputLabelProps={{ shrink: true }}
            required
          />
          <TextField
            fullWidth
            label="Time"
            type="time"
            margin="normal"
            value={recordForm.procedure_time}
            onChange={(e) =>
              setRecordForm({
                ...recordForm,
                procedure_time: e.target.value,
              })
            }
            InputLabelProps={{ shrink: true }}
            required
          />
          <TextField
            fullWidth
            label="Notes (optional)"
            multiline
            rows={3}
            margin="normal"
            value={recordForm.notes}
            onChange={(e) =>
              setRecordForm({ ...recordForm, notes: e.target.value })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRecordDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleRecordProcedure} variant="contained">
            Record
          </Button>
        </DialogActions>
      </Dialog>

      {/* Schedule Dialog */}
      <Dialog
        open={scheduleDialogOpen}
        onClose={() => setScheduleDialogOpen(false)}
      >
        <DialogTitle>
          {editingScheduleProcedure
            ? `Schedule for ${editingScheduleProcedure.name}`
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

      {/* Export Dialog */}
      <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)}>
        <DialogTitle>Export Procedure Records to Excel</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select a date range to export procedure records. You can optionally filter by a specific procedure.
          </Typography>
          <TextField
            fullWidth
            label="Start Date"
            type="date"
            margin="normal"
            value={exportForm.start_date}
            onChange={(e) =>
              setExportForm({ ...exportForm, start_date: e.target.value })
            }
            InputLabelProps={{ shrink: true }}
            required
          />
          <TextField
            fullWidth
            label="End Date"
            type="date"
            margin="normal"
            value={exportForm.end_date}
            onChange={(e) =>
              setExportForm({ ...exportForm, end_date: e.target.value })
            }
            InputLabelProps={{ shrink: true }}
            required
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Procedure (Optional - leave empty for all)</InputLabel>
            <Select
              value={exportForm.procedure_id}
              onChange={(e) =>
                setExportForm({ ...exportForm, procedure_id: e.target.value })
              }
            >
              <MenuItem value="">All Procedures</MenuItem>
              {procedures.map((procedure) => (
                <MenuItem key={procedure.id} value={procedure.id}>
                  {procedure.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialogOpen(false)} disabled={exporting}>
            Cancel
          </Button>
          <Button
            onClick={handlePrint}
            variant="outlined"
            disabled={exporting}
            sx={{ mr: 1 }}
          >
            Print
          </Button>
          <Button
            onClick={handleExport}
            variant="contained"
            startIcon={<FileDownloadIcon />}
            disabled={exporting}
          >
            {exporting ? 'Exporting...' : 'Export'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProcedureTracker;

