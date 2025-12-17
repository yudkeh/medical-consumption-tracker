import { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import { Medication, LocalHospital, Add as AddIcon, Print as PrintIcon, FileDownload as FileDownloadIcon } from '@mui/icons-material';
import { drugsAPI, proceduresAPI } from '../services/api';

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [drugs, setDrugs] = useState([]);
  const [procedures, setProcedures] = useState([]);

  const [drugDialogOpen, setDrugDialogOpen] = useState(false);
  const [procedureDialogOpen, setProcedureDialogOpen] = useState(false);

  const [drugForm, setDrugForm] = useState({
    drug_id: '',
    consumption_date: new Date().toISOString().split('T')[0],
    consumption_time: new Date().toTimeString().slice(0, 5),
    quantity: '',
    unit_type: 'pills',
    notes: '',
  });

  const [procedureForm, setProcedureForm] = useState({
    procedure_id: '',
    procedure_date: new Date().toISOString().split('T')[0],
    procedure_time: new Date().toTimeString().slice(0, 5),
    notes: '',
  });

  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [noteDialogTitle, setNoteDialogTitle] = useState('');
  const [noteDialogContent, setNoteDialogContent] = useState('');

  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [printForm, setPrintForm] = useState({
    start_date: new Date(new Date().setMonth(new Date().getMonth() - 1))
      .toISOString()
      .split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    procedure_id: '',
  });
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadTodaySummary();
  }, []);

  const loadTodaySummary = async () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];

      const [drugsSummary, proceduresData, drugsRes, proceduresRes] =
        await Promise.all([
          drugsAPI.getTodaySummary(),
          proceduresAPI.getProcedureRecords({
            start_date: todayStr,
            end_date: todayStr,
          }),
          drugsAPI.getDrugs(),
          proceduresAPI.getProcedures(),
        ]);

      setSummary({
        date: drugsSummary.data.date,
        consumptions: drugsSummary.data.consumptions,
        procedures: proceduresData.data.records,
      });
      setDrugs(drugsRes.data.drugs);
      setProcedures(proceduresRes.data.procedures);
    } catch (err) {
      setError('Failed to load summary');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const handleRecordDrugFromDashboard = async () => {
    try {
      const consumedAt = `${drugForm.consumption_date}T${drugForm.consumption_time}:00`;
      await drugsAPI.recordConsumption({
        drug_id: drugForm.drug_id,
        consumption_date: drugForm.consumption_date,
        quantity: Number(drugForm.quantity),
        unit_type: drugForm.unit_type,
        notes: drugForm.notes,
        consumed_at: consumedAt,
      });
      setDrugDialogOpen(false);
      setDrugForm({
        drug_id: '',
        consumption_date: new Date().toISOString().split('T')[0],
        consumption_time: new Date().toTimeString().slice(0, 5),
        quantity: '',
        unit_type: 'pills',
        notes: '',
      });
      await loadTodaySummary();
    } catch (err) {
      console.error('Failed to record drug consumption from dashboard', err);
      setError('Failed to record drug consumption');
    }
  };

  const handleRecordProcedureFromDashboard = async () => {
    try {
      const performedAt = `${procedureForm.procedure_date}T${procedureForm.procedure_time}:00`;
      await proceduresAPI.recordProcedure({
        procedure_id: procedureForm.procedure_id,
        procedure_date: procedureForm.procedure_date,
        notes: procedureForm.notes,
        performed_at: performedAt,
      });
      setProcedureDialogOpen(false);
      setProcedureForm({
        procedure_id: '',
        procedure_date: new Date().toISOString().split('T')[0],
        procedure_time: new Date().toTimeString().slice(0, 5),
        notes: '',
      });
      await loadTodaySummary();
    } catch (err) {
      console.error('Failed to record procedure from dashboard', err);
      setError('Failed to record procedure');
    }
  };

  const openNoteDialog = (title, content) => {
    setNoteDialogTitle(title);
    setNoteDialogContent(content || '');
    setNoteDialogOpen(true);
  };

  const handlePrintProcedures = async () => {
    if (!printForm.start_date || !printForm.end_date) {
      alert('Please select both start and end dates');
      return;
    }
    if (new Date(printForm.start_date) > new Date(printForm.end_date)) {
      alert('Start date must be before end date');
      return;
    }

    setPrinting(true);
    try {
      const params = {
        start_date: printForm.start_date,
        end_date: printForm.end_date,
      };
      if (printForm.procedure_id) {
        params.procedure_id = printForm.procedure_id;
      }

      const response = await proceduresAPI.getProcedureRecords(params);
      const records = response.data.records || [];

      const selectedProcedure =
        procedures.find((p) => p.id === Number(printForm.procedure_id)) ||
        null;

      const title = selectedProcedure
        ? `Procedure: ${selectedProcedure.name}`
        : 'All Procedures';

      const rangeText = `${printForm.start_date} to ${printForm.end_date}`;

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

      setPrintDialogOpen(false);
    } catch (error) {
      console.error('Print from dashboard failed:', error);
      alert(error.response?.data?.error || 'Failed to load records for printing');
    } finally {
      setPrinting(false);
    }
  };

  const handleExportProcedures = async () => {
    if (!printForm.start_date || !printForm.end_date) {
      alert('Please select both start and end dates');
      return;
    }
    if (new Date(printForm.start_date) > new Date(printForm.end_date)) {
      alert('Start date must be before end date');
      return;
    }

    setExporting(true);
    try {
      const params = {
        start_date: printForm.start_date,
        end_date: printForm.end_date,
      };
      if (printForm.procedure_id) {
        params.procedure_id = printForm.procedure_id;
      }

      const response = await proceduresAPI.exportRecords(params);

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `procedure_records_${printForm.start_date}_to_${printForm.end_date}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setPrintDialogOpen(false);
    } catch (error) {
      console.error('Export from dashboard failed:', error);
      alert(error.response?.data?.error || 'Failed to export records');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const today = new Date().toLocaleDateString('en-GB');

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        {today}
      </Typography>

      {error && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'error.light' }}>
          <Typography color="error">{error}</Typography>
        </Paper>
      )}

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Medication sx={{ mr: 1 }} />
                <Typography variant="h6">Today's Drug Consumptions</Typography>
                <Box sx={{ flexGrow: 1 }} />
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setDrugDialogOpen(true)}
                >
                  Record
                </Button>
              </Box>
              {summary?.consumptions.length > 0 ? (
                <List sx={{ mt: 1, borderRadius: 1, border: '1px solid #e0e0e0' }}>
                  {summary.consumptions.map((consumption, index) => (
                    <ListItem
                      key={consumption.id}
                      alignItems="flex-start"
                      sx={{
                        borderBottom:
                          index === summary.consumptions.length - 1
                            ? 'none'
                            : '1px solid #e0e0e0',
                      }}
                    >
                      <ListItemText
                        primaryTypographyProps={{ variant: 'body1' }}
                        secondaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                        primary={`${consumption.drug_name} — ${
                          consumption.quantity
                        } ${
                          consumption.unit_type === 'mg'
                            ? 'mg'
                            : consumption.quantity === 1
                            ? 'pill'
                            : 'pills'
                        }`}
                        secondary={formatTime(consumption.consumed_at)}
                      />
                      <Box display="flex" flexDirection="column" alignItems="flex-end" ml={1}>
                        {consumption.notes && (
                          <>
                            <Chip
                              label="Has notes"
                              size="small"
                              sx={{ mb: 0.5, mr: 0.5 }}
                            />
                            <IconButton
                              size="small"
                              aria-label="View note"
                              onClick={() =>
                                openNoteDialog(
                                  `${consumption.drug_name} note`,
                                  consumption.notes
                                )
                              }
                            >
                              <InfoIcon fontSize="small" />
                            </IconButton>
                          </>
                        )}
                      </Box>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary">
                  No drug consumptions recorded today
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <LocalHospital sx={{ mr: 1 }} />
                <Typography variant="h6">Today's Procedures</Typography>
                <Box sx={{ flexGrow: 1 }} />
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<PrintIcon />}
                  sx={{ mr: 1 }}
                  onClick={() => setPrintDialogOpen(true)}
                >
                  Export
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setProcedureDialogOpen(true)}
                >
                  Record
                </Button>
              </Box>
              {summary?.procedures.length > 0 ? (
                <List sx={{ mt: 1, borderRadius: 1, border: '1px solid #e0e0e0' }}>
                  {summary.procedures.map((procedure, index) => (
                    <ListItem
                      key={procedure.id}
                      alignItems="flex-start"
                      sx={{
                        borderBottom:
                          index === summary.procedures.length - 1
                            ? 'none'
                            : '1px solid #e0e0e0',
                      }}
                    >
                      <ListItemText
                        primaryTypographyProps={{ variant: 'body1' }}
                        secondaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                        primary={procedure.procedure_name}
                        secondary={formatTime(procedure.performed_at)}
                      />
                      <Box display="flex" flexDirection="column" alignItems="flex-end" ml={1}>
                        {procedure.notes && (
                          <>
                            <Chip
                              label="Has notes"
                              size="small"
                              sx={{ mb: 0.5, mr: 0.5 }}
                            />
                            <IconButton
                              size="small"
                              aria-label="View note"
                              onClick={() =>
                                openNoteDialog(
                                  `${procedure.procedure_name} note`,
                                  procedure.notes
                                )
                              }
                            >
                              <InfoIcon fontSize="small" />
                            </IconButton>
                          </>
                        )}
                      </Box>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary">
                  No procedures recorded today
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick record drug dialog */}
      <Dialog
        open={drugDialogOpen}
        onClose={() => setDrugDialogOpen(false)}
      >
        <DialogTitle>Record Drug Consumption</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Drug</InputLabel>
            <Select
              value={drugForm.drug_id}
              label="Drug"
              onChange={(e) =>
                setDrugForm({ ...drugForm, drug_id: e.target.value })
              }
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
            value={drugForm.consumption_date}
            onChange={(e) =>
              setDrugForm({
                ...drugForm,
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
            value={drugForm.consumption_time}
            onChange={(e) =>
              setDrugForm({
                ...drugForm,
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
            value={drugForm.quantity}
            onChange={(e) =>
              setDrugForm({ ...drugForm, quantity: e.target.value })
            }
            required
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Unit Type</InputLabel>
            <Select
              value={drugForm.unit_type}
              label="Unit Type"
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
            label="Notes (optional)"
            multiline
            rows={3}
            margin="normal"
            value={drugForm.notes}
            onChange={(e) =>
              setDrugForm({ ...drugForm, notes: e.target.value })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDrugDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleRecordDrugFromDashboard} variant="contained">
            Record
          </Button>
        </DialogActions>
      </Dialog>

      {/* Quick record procedure dialog */}
      <Dialog
        open={procedureDialogOpen}
        onClose={() => setProcedureDialogOpen(false)}
      >
        <DialogTitle>Record Procedure</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Procedure</InputLabel>
            <Select
              value={procedureForm.procedure_id}
              label="Procedure"
              onChange={(e) =>
                setProcedureForm({
                  ...procedureForm,
                  procedure_id: e.target.value,
                })
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
            value={procedureForm.procedure_date}
            onChange={(e) =>
              setProcedureForm({
                ...procedureForm,
                procedure_date: e.target.value,
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
            value={procedureForm.procedure_time}
            onChange={(e) =>
              setProcedureForm({
                ...procedureForm,
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
            value={procedureForm.notes}
            onChange={(e) =>
              setProcedureForm({
                ...procedureForm,
                notes: e.target.value,
              })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProcedureDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleRecordProcedureFromDashboard}
            variant="contained"
          >
            Record
          </Button>
        </DialogActions>
      </Dialog>

      {/* Note viewer dialog */}
      <Dialog
        open={noteDialogOpen}
        onClose={() => setNoteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{noteDialogTitle || 'Note'}</DialogTitle>
        <DialogContent dividers>
          <Typography whiteSpace="pre-wrap">
            {noteDialogContent || 'No content'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNoteDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Print procedures dialog */}
      <Dialog
        open={printDialogOpen}
        onClose={() => setPrintDialogOpen(false)}
      >
        <DialogTitle>Print Procedures</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select a date range to print or export procedure records. You can
            optionally filter by a specific procedure.
          </Typography>
          <TextField
            fullWidth
            label="Start Date"
            type="date"
            margin="normal"
            value={printForm.start_date}
            onChange={(e) =>
              setPrintForm({ ...printForm, start_date: e.target.value })
            }
            InputLabelProps={{ shrink: true }}
            required
          />
          <TextField
            fullWidth
            label="End Date"
            type="date"
            margin="normal"
            value={printForm.end_date}
            onChange={(e) =>
              setPrintForm({ ...printForm, end_date: e.target.value })
            }
            InputLabelProps={{ shrink: true }}
            required
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Procedure (Optional - leave empty for all)</InputLabel>
            <Select
              value={printForm.procedure_id}
              label="Procedure (Optional - leave empty for all)"
              onChange={(e) =>
                setPrintForm({ ...printForm, procedure_id: e.target.value })
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
          <Button
            onClick={() => setPrintDialogOpen(false)}
            disabled={printing || exporting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExportProcedures}
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            disabled={printing || exporting}
          >
            {exporting ? 'Exporting...' : 'Export'}
          </Button>
          <Button
            onClick={handlePrintProcedures}
            variant="contained"
            startIcon={<PrintIcon />}
            disabled={printing || exporting}
          >
            {printing ? 'Printing...' : 'Print'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard;

