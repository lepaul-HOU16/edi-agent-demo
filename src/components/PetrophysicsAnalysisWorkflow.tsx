/**
 * Petrophysics Analysis Workflow Component
 * Integrates visualization, calculation, and reporting systems
 * Requirements: 1.1, 2.1, 3.4, 5.1
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  LinearProgress,
  Alert,
  AlertTitle,
  Chip,
  Stack,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Tabs,
  Tab,
  CircularProgress,
  Snackbar
} from '@mui/material';
import {
  PlayArrow,
  Stop,
  Download,
  Visibility,
  Assessment,
  Description,
  CheckCircle,
  Error,
  Warning,
  Info,
  Refresh
} from '@mui/icons-material';

import { WellLogData, CalculationParameters, CalculationResults } from '../types/petrophysics';
import { LogPlotViewer, TrackConfig } from './logVisualization/LogPlotViewer';
import { 
  PetrophysicsWorkflowOrchestrator, 
  WorkflowState, 
  WorkflowResult, 
  ProgressUpdate 
} from '../services/petrophysicsWorkflowOrchestrator';

interface PetrophysicsAnalysisWorkflowProps {
  wells: WellLogData[];
  initialParameters?: CalculationParameters;
  onWorkflowComplete?: (result: WorkflowResult) => void;
  onError?: (error: string) => void;
  enableRealTimeUpdates?: boolean;
  autoStartWorkflow?: boolean;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`workflow-tabpanel-${index}`}
      aria-labelledby={`workflow-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const PetrophysicsAnalysisWorkflow: React.FC<PetrophysicsAnalysisWorkflowProps> = ({
  wells,
  initialParameters = {},
  onWorkflowComplete,
  onError,
  enableRealTimeUpdates = true,
  autoStartWorkflow = false
}) => {
  // State management
  const [workflowState, setWorkflowState] = useState<WorkflowState | null>(null);
  const [workflowResult, setWorkflowResult] = useState<WorkflowResult | null>(null);
  const [currentProgress, setCurrentProgress] = useState<ProgressUpdate | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [calculationParameters, setCalculationParameters] = useState<CalculationParameters>(initialParameters);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'warning' | 'info'>('info');
  const [showSnackbar, setShowSnackbar] = useState(false);

  // Refs
  const orchestratorRef = useRef<PetrophysicsWorkflowOrchestrator | null>(null);
  const currentWorkflowId = useRef<string | null>(null);

  // Initialize orchestrator
  useEffect(() => {
    orchestratorRef.current = new PetrophysicsWorkflowOrchestrator({
      enableRealTimeUpdates,
      enableProgressTracking: true,
      enableErrorRecovery: true
    });

    const orchestrator = orchestratorRef.current;

    // Setup event listeners
    orchestrator.on('progress', (update: ProgressUpdate) => {
      setCurrentProgress(update);
      
      if (currentWorkflowId.current === update.workflowId) {
        const state = orchestrator.getWorkflowState(update.workflowId);
        if (state) {
          setWorkflowState({ ...state });
        }
      }
    });

    orchestrator.on('workflow_error', ({ workflowId, error }) => {
      if (currentWorkflowId.current === workflowId) {
        setSnackbarMessage(`Workflow error: ${error}`);
        setSnackbarSeverity('error');
        setShowSnackbar(true);
        onError?.(error);
      }
    });

    orchestrator.on('workflow_updated', ({ workflowId, visualizationData }) => {
      if (currentWorkflowId.current === workflowId) {
        setSnackbarMessage('Workflow updated with new calculations');
        setSnackbarSeverity('info');
        setShowSnackbar(true);
      }
    });

    orchestrator.on('calculations_updated', ({ workflowId, calculations }) => {
      if (currentWorkflowId.current === workflowId) {
        setSnackbarMessage(`Updated ${calculations.length} calculations`);
        setSnackbarSeverity('success');
        setShowSnackbar(true);
      }
    });

    return () => {
      orchestrator.removeAllListeners();
    };
  }, [enableRealTimeUpdates, onError]);

  // Auto-start workflow if enabled
  useEffect(() => {
    if (autoStartWorkflow && wells.length > 0 && !workflowState) {
      handleStartWorkflow();
    }
  }, [autoStartWorkflow, wells]);

  // Workflow control handlers
  const handleStartWorkflow = useCallback(async () => {
    if (!orchestratorRef.current || wells.length === 0) return;

    try {
      setWorkflowState({
        id: '',
        status: 'loading',
        progress: 0,
        currentStep: 'Initializing',
        wells: [],
        calculations: [],
        reservoirZones: [],
        completionTargets: [],
        errors: [],
        warnings: []
      });

      const result = await orchestratorRef.current.startCompleteWorkflow(
        wells,
        calculationParameters,
        ['formation_evaluation', 'completion_design'],
        ['PDF', 'Excel', 'LAS']
      );

      currentWorkflowId.current = result.state.id;
      setWorkflowResult(result);
      setWorkflowState(result.state);
      
      setSnackbarMessage('Workflow completed successfully!');
      setSnackbarSeverity('success');
      setShowSnackbar(true);
      
      onWorkflowComplete?.(result);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setSnackbarMessage(`Workflow failed: ${errorMessage}`);
      setSnackbarSeverity('error');
      setShowSnackbar(true);
      onError?.(errorMessage);
    }
  }, [wells, calculationParameters, onWorkflowComplete, onError]);

  const handleStopWorkflow = useCallback(() => {
    if (orchestratorRef.current && currentWorkflowId.current) {
      orchestratorRef.current.cancelWorkflow(currentWorkflowId.current);
      setWorkflowState(prev => prev ? { ...prev, status: 'error' } : null);
      
      setSnackbarMessage('Workflow cancelled');
      setSnackbarSeverity('warning');
      setShowSnackbar(true);
    }
  }, []);

  const handleParameterChange = useCallback((newParameters: CalculationParameters) => {
    setCalculationParameters(newParameters);
    
    if (enableRealTimeUpdates && orchestratorRef.current && currentWorkflowId.current) {
      orchestratorRef.current.emit('parameter_change', {
        workflowId: currentWorkflowId.current,
        parameters: newParameters
      });
    }
  }, [enableRealTimeUpdates]);

  // UI event handlers
  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  }, []);

  const handleShowReports = useCallback(() => {
    setShowReportDialog(true);
  }, []);

  const handleShowExports = useCallback(() => {
    setShowExportDialog(true);
  }, []);

  const handleDownloadFile = useCallback((filePath: string, format: string) => {
    // In a real implementation, this would trigger file download
    setSnackbarMessage(`Downloading ${format} file: ${filePath}`);
    setSnackbarSeverity('info');
    setShowSnackbar(true);
  }, []);

  const handleCloseSnackbar = useCallback(() => {
    setShowSnackbar(false);
  }, []);

  // Workflow steps configuration
  const workflowSteps = [
    {
      label: 'Load Well Data',
      description: 'Validate and load well log data',
      icon: <Info />
    },
    {
      label: 'Perform Calculations',
      description: 'Execute petrophysical calculations',
      icon: <Assessment />
    },
    {
      label: 'Analyze Reservoir',
      description: 'Identify zones and completion targets',
      icon: <Visibility />
    },
    {
      label: 'Generate Reports',
      description: 'Create professional reports',
      icon: <Description />
    },
    {
      label: 'Export Results',
      description: 'Export to various formats',
      icon: <Download />
    }
  ];

  const getStepStatus = (stepIndex: number) => {
    if (!workflowState) return 'pending';
    
    const progress = workflowState.progress;
    const stepProgress = (stepIndex + 1) * 20;
    
    if (progress >= stepProgress) return 'completed';
    if (progress >= stepProgress - 20) return 'active';
    return 'pending';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'success';
      case 'error': return 'error';
      case 'loading':
      case 'calculating':
      case 'generating_report': return 'info';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete': return <CheckCircle color="success" />;
      case 'error': return <Error color="error" />;
      case 'loading':
      case 'calculating':
      case 'generating_report': return <CircularProgress size={20} />;
      default: return <Info />;
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2 }}>
      {/* Header */}
      <Paper elevation={2} sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" component="h1">
            Petrophysical Analysis Workflow
          </Typography>
          
          <Stack direction="row" spacing={2}>
            {workflowState?.status && (
              <Chip
                icon={getStatusIcon(workflowState.status)}
                label={workflowState.status.replace('_', ' ').toUpperCase()}
                color={getStatusColor(workflowState.status) as any}
                variant="outlined"
              />
            )}
            
            <Button
              variant="contained"
              startIcon={<PlayArrow />}
              onClick={handleStartWorkflow}
              disabled={wells.length === 0 || (workflowState?.status === 'loading' || workflowState?.status === 'calculating')}
            >
              Start Analysis
            </Button>
            
            {workflowState?.status && ['loading', 'calculating', 'generating_report'].includes(workflowState.status) && (
              <Button
                variant="outlined"
                startIcon={<Stop />}
                onClick={handleStopWorkflow}
                color="error"
              >
                Stop
              </Button>
            )}
            
            {workflowResult && (
              <>
                <Button
                  variant="outlined"
                  startIcon={<Description />}
                  onClick={handleShowReports}
                >
                  View Reports
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={handleShowExports}
                >
                  Export Results
                </Button>
              </>
            )}
          </Stack>
        </Box>

        {/* Progress indicator */}
        {currentProgress && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {currentProgress.step}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {currentProgress.progress.toFixed(0)}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={currentProgress.progress} 
              sx={{ height: 8, borderRadius: 4 }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              {currentProgress.message}
            </Typography>
          </Box>
        )}

        {/* Workflow steps */}
        <Stepper orientation="horizontal" sx={{ mt: 2 }}>
          {workflowSteps.map((step, index) => (
            <Step key={step.label} completed={getStepStatus(index) === 'completed'} active={getStepStatus(index) === 'active'}>
              <StepLabel icon={step.icon}>
                <Typography variant="caption">{step.label}</Typography>
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Status and errors */}
      {workflowState && (workflowState.errors.length > 0 || workflowState.warnings.length > 0) && (
        <Paper elevation={1} sx={{ p: 2 }}>
          {workflowState.errors.length > 0 && (
            <Alert severity="error" sx={{ mb: 1 }}>
              <AlertTitle>Errors ({workflowState.errors.length})</AlertTitle>
              <List dense>
                {workflowState.errors.slice(0, 3).map((error, index) => (
                  <ListItem key={index} sx={{ py: 0 }}>
                    <ListItemText primary={error} />
                  </ListItem>
                ))}
                {workflowState.errors.length > 3 && (
                  <ListItem sx={{ py: 0 }}>
                    <ListItemText primary={`... and ${workflowState.errors.length - 3} more errors`} />
                  </ListItem>
                )}
              </List>
            </Alert>
          )}
          
          {workflowState.warnings.length > 0 && (
            <Alert severity="warning">
              <AlertTitle>Warnings ({workflowState.warnings.length})</AlertTitle>
              <List dense>
                {workflowState.warnings.slice(0, 3).map((warning, index) => (
                  <ListItem key={index} sx={{ py: 0 }}>
                    <ListItemText primary={warning} />
                  </ListItem>
                ))}
                {workflowState.warnings.length > 3 && (
                  <ListItem sx={{ py: 0 }}>
                    <ListItemText primary={`... and ${workflowState.warnings.length - 3} more warnings`} />
                  </ListItem>
                )}
              </List>
            </Alert>
          )}
        </Paper>
      )}

      {/* Main content tabs */}
      {workflowResult && (
        <Paper elevation={2}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={activeTab} onChange={handleTabChange}>
              <Tab label="Log Visualization" />
              <Tab label="Calculation Results" />
              <Tab label="Reservoir Analysis" />
              <Tab label="Reports" />
            </Tabs>
          </Box>

          <TabPanel value={activeTab} index={0}>
            {/* Log Visualization */}
            {workflowResult.visualizationData && (
              <LogPlotViewer
                wellData={workflowResult.state.wells}
                tracks={workflowResult.visualizationData.trackConfigs}
                initialDepthRange={workflowResult.visualizationData.depthRanges.overall}
                height={600}
                showZoomControls={true}
                showCurveControls={true}
                showCalculationUpdates={enableRealTimeUpdates}
                calculationParameters={calculationParameters}
                enabledCalculations={['porosity', 'shale_volume', 'saturation', 'permeability']}
                autoUpdateCalculations={enableRealTimeUpdates}
                onParameterChange={(changes) => {
                  // Handle parameter changes from visualization
                  const newParams = { ...calculationParameters };
                  changes.forEach(change => {
                    (newParams as any)[change.parameter] = change.newValue;
                  });
                  handleParameterChange(newParams);
                }}
              />
            )}
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            {/* Calculation Results */}
            <Stack spacing={2}>
              {workflowResult.state.calculations.map((calc, index) => (
                <Card key={index} variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {calc.calculationType.replace('_', ' ').toUpperCase()} - {calc.wellName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Method: {calc.method} | Quality: {calc.qualityMetrics.confidenceLevel}
                    </Typography>
                    
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 2, mt: 2 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Mean</Typography>
                        <Typography variant="body1">{calc.statistics.mean.toFixed(3)}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Std Dev</Typography>
                        <Typography variant="body1">{calc.statistics.standardDeviation.toFixed(3)}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Range</Typography>
                        <Typography variant="body1">
                          {calc.statistics.min.toFixed(3)} - {calc.statistics.max.toFixed(3)}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Data Completeness</Typography>
                        <Typography variant="body1">
                          {(calc.qualityMetrics.dataCompleteness * 100).toFixed(1)}%
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            {/* Reservoir Analysis */}
            <Stack spacing={3}>
              {/* Reservoir Zones */}
              <Box>
                <Typography variant="h6" gutterBottom>
                  Reservoir Zones ({workflowResult.state.reservoirZones.length})
                </Typography>
                <Stack spacing={1}>
                  {workflowResult.state.reservoirZones.map((zone, index) => (
                    <Card key={index} variant="outlined">
                      <CardContent sx={{ py: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="subtitle1">{zone.name}</Typography>
                          <Chip 
                            label={zone.quality} 
                            color={zone.quality === 'excellent' ? 'success' : zone.quality === 'good' ? 'primary' : 'default'}
                            size="small"
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          Depth: {zone.topDepth.toFixed(1)} - {zone.bottomDepth.toFixed(1)} ft | 
                          Porosity: {(zone.averagePorosity * 100).toFixed(1)}% | 
                          Net/Gross: {(zone.netToGross * 100).toFixed(1)}%
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              </Box>

              <Divider />

              {/* Completion Targets */}
              <Box>
                <Typography variant="h6" gutterBottom>
                  Completion Targets ({workflowResult.state.completionTargets.length})
                </Typography>
                <Stack spacing={1}>
                  {workflowResult.state.completionTargets.map((target, index) => (
                    <Card key={index} variant="outlined">
                      <CardContent sx={{ py: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="subtitle1">
                            {target.wellName} - Target {index + 1}
                          </Typography>
                          <Chip 
                            label={`Rank #${target.ranking}`} 
                            color="primary"
                            size="small"
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          Depth: {target.startDepth.toFixed(1)} - {target.endDepth.toFixed(1)} ft | 
                          Thickness: {target.thickness.toFixed(1)} ft | 
                          Porosity: {(target.averagePorosity * 100).toFixed(1)}%
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              </Box>
            </Stack>
          </TabPanel>

          <TabPanel value={activeTab} index={3}>
            {/* Reports */}
            <Stack spacing={2}>
              {workflowResult.reports.map((report, index) => (
                <Card key={index} variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {report.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Generated: {report.generatedAt.toLocaleString()} | 
                      Sections: {report.sections.length}
                    </Typography>
                    <Typography variant="body2">
                      {report.sections[0]?.processedContent.substring(0, 200)}...
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small" startIcon={<Visibility />}>
                      View Report
                    </Button>
                    <Button size="small" startIcon={<Download />}>
                      Download PDF
                    </Button>
                  </CardActions>
                </Card>
              ))}
            </Stack>
          </TabPanel>
        </Paper>
      )}

      {/* Reports Dialog */}
      <Dialog open={showReportDialog} onClose={() => setShowReportDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Generated Reports</DialogTitle>
        <DialogContent>
          {workflowResult?.reports.map((report, index) => (
            <Box key={index} sx={{ mb: 2 }}>
              <Typography variant="h6">{report.title}</Typography>
              <Typography variant="body2" color="text.secondary">
                {report.sections.length} sections | Generated: {report.generatedAt.toLocaleString()}
              </Typography>
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowReportDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onClose={() => setShowExportDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Export Results</DialogTitle>
        <DialogContent>
          {workflowResult?.exportedFiles && Object.entries(workflowResult.exportedFiles).map(([format, filePath]) => (
            <Box key={format} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
              <Typography>{format} Export</Typography>
              <Button
                size="small"
                startIcon={<Download />}
                onClick={() => handleDownloadFile(filePath, format)}
              >
                Download
              </Button>
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowExportDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={showSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PetrophysicsAnalysisWorkflow;