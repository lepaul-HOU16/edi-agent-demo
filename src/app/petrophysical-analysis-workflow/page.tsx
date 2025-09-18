/**
 * Petrophysical Analysis Workflow Page
 * Demonstrates complete integration of visualization, calculation, and reporting systems
 * Requirements: 1.1, 2.1, 3.4, 5.1
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Alert,
  AlertTitle,
  Stack,
  Card,
  CardContent,
  CardActions,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Divider
} from '@mui/material';
import {
  Upload,
  PlayArrow,
  Assessment,
  Description,
  Download,
  Settings,
  Info
} from '@mui/icons-material';

import { WellLogData, CalculationParameters } from '../../types/petrophysics';
import { PetrophysicsAnalysisWorkflow } from '../../components/PetrophysicsAnalysisWorkflow';
import { WorkflowResult } from '../../services/petrophysicsWorkflowOrchestrator';

// Mock well data for demonstration
const createDemoWellData = (): WellLogData[] => {
  const wells: WellLogData[] = [];
  
  const wellNames = ['DEMO-001', 'DEMO-002', 'DEMO-003'];
  
  wellNames.forEach((wellName, wellIndex) => {
    const depthStart = 8000 + wellIndex * 500;
    const depthEnd = depthStart + 1000;
    const dataPoints = 1000;
    
    const well: WellLogData = {
      wellName,
      wellInfo: {
        wellName,
        field: 'Demo Field',
        operator: 'Demo Operator',
        location: { 
          latitude: 30.0 + wellIndex * 0.01, 
          longitude: -95.0 + wellIndex * 0.01 
        },
        elevation: 100 + wellIndex * 10,
        totalDepth: depthEnd + 500,
        spudDate: new Date(2023, wellIndex, 1),
        wellType: 'vertical' as const
      },
      curves: [
        {
          name: 'DEPT',
          unit: 'FT',
          description: 'Measured Depth',
          data: Array.from({ length: dataPoints }, (_, i) => depthStart + (i * (depthEnd - depthStart)) / dataPoints),
          nullValue: -999.25,
          quality: {
            completeness: 1.0,
            outliers: 0,
            gaps: 0,
            environmentalCorrections: []
          }
        },
        {
          name: 'GR',
          unit: 'API',
          description: 'Gamma Ray',
          data: Array.from({ length: dataPoints }, (_, i) => {
            // Simulate realistic gamma ray log with shale/sand cycles
            const depth = depthStart + (i * (depthEnd - depthStart)) / dataPoints;
            const cycle = Math.sin((depth - depthStart) / 100) * 0.5 + 0.5;
            const noise = (Math.random() - 0.5) * 20;
            return 40 + cycle * 80 + noise;
          }),
          nullValue: -999.25,
          quality: {
            completeness: 0.98,
            outliers: 3,
            gaps: 1,
            environmentalCorrections: ['borehole_correction']
          }
        },
        {
          name: 'NPHI',
          unit: 'V/V',
          description: 'Neutron Porosity',
          data: Array.from({ length: dataPoints }, (_, i) => {
            // Simulate neutron porosity with realistic values
            const depth = depthStart + (i * (depthEnd - depthStart)) / dataPoints;
            const trend = 0.25 - (depth - depthStart) / 10000; // Decreasing with depth
            const cycle = Math.sin((depth - depthStart) / 150) * 0.1;
            const noise = (Math.random() - 0.5) * 0.05;
            return Math.max(0.05, Math.min(0.4, trend + cycle + noise));
          }),
          nullValue: -999.25,
          quality: {
            completeness: 0.95,
            outliers: 5,
            gaps: 2,
            environmentalCorrections: ['environmental_correction']
          }
        },
        {
          name: 'RHOB',
          unit: 'G/C3',
          description: 'Bulk Density',
          data: Array.from({ length: dataPoints }, (_, i) => {
            // Simulate bulk density
            const depth = depthStart + (i * (depthEnd - depthStart)) / dataPoints;
            const trend = 2.2 + (depth - depthStart) / 20000; // Increasing with depth
            const cycle = Math.sin((depth - depthStart) / 120) * 0.2;
            const noise = (Math.random() - 0.5) * 0.1;
            return Math.max(1.8, Math.min(2.8, trend + cycle + noise));
          }),
          nullValue: -999.25,
          quality: {
            completeness: 0.97,
            outliers: 2,
            gaps: 1,
            environmentalCorrections: ['mud_cake_correction']
          }
        },
        {
          name: 'RT',
          unit: 'OHMM',
          description: 'True Resistivity',
          data: Array.from({ length: dataPoints }, (_, i) => {
            // Simulate resistivity with hydrocarbon shows
            const depth = depthStart + (i * (depthEnd - depthStart)) / dataPoints;
            const baseline = 2 + Math.random() * 3;
            const hcShow = Math.sin((depth - depthStart) / 80) > 0.7 ? 20 + Math.random() * 50 : 0;
            const noise = Math.random() * 2;
            return Math.max(0.5, baseline + hcShow + noise);
          }),
          nullValue: -999.25,
          quality: {
            completeness: 0.93,
            outliers: 8,
            gaps: 3,
            environmentalCorrections: ['invasion_correction']
          }
        }
      ],
      depthRange: [depthStart, depthEnd],
      dataQuality: {
        overallQuality: 'good',
        completeness: 0.96,
        dataCompleteness: 0.96,
        issues: ['Minor data gaps in resistivity log'],
        recommendations: ['Consider additional environmental corrections for neutron log']
      },
      lastModified: new Date()
    };
    
    wells.push(well);
  });
  
  return wells;
};

const defaultCalculationParameters: CalculationParameters = {
  matrixDensity: 2.65,
  fluidDensity: 1.0,
  a: 1.0,
  m: 2.0,
  n: 2.0,
  rw: 0.1,
  grClean: 30,
  grShale: 120
};

export default function PetrophysicalAnalysisWorkflowPage() {
  // State management
  const [wells, setWells] = useState<WellLogData[]>([]);
  const [calculationParameters, setCalculationParameters] = useState<CalculationParameters>(defaultCalculationParameters);
  const [workflowResult, setWorkflowResult] = useState<WorkflowResult | null>(null);
  const [showParametersDialog, setShowParametersDialog] = useState(false);
  const [showInfoDialog, setShowInfoDialog] = useState(false);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Load demo data on component mount
  useEffect(() => {
    const demoWells = createDemoWellData();
    setWells(demoWells);
  }, []);

  // Event handlers
  const handleLoadDemoData = useCallback(() => {
    setIsLoading(true);
    setTimeout(() => {
      const demoWells = createDemoWellData();
      setWells(demoWells);
      setError('');
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleWorkflowComplete = useCallback((result: WorkflowResult) => {
    setWorkflowResult(result);
    console.log('Workflow completed:', result);
  }, []);

  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage);
    console.error('Workflow error:', errorMessage);
  }, []);

  const handleParameterChange = useCallback((field: keyof CalculationParameters, value: number) => {
    setCalculationParameters(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleSaveParameters = useCallback(() => {
    setShowParametersDialog(false);
  }, []);

  const handleResetParameters = useCallback(() => {
    setCalculationParameters(defaultCalculationParameters);
  }, []);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Petrophysical Analysis Workflow
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Complete integration of visualization, calculation, and reporting systems
            </Typography>
          </Box>
          
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<Info />}
              onClick={() => setShowInfoDialog(true)}
            >
              About
            </Button>
            <Button
              variant="outlined"
              startIcon={<Settings />}
              onClick={() => setShowParametersDialog(true)}
            >
              Parameters
            </Button>
            <Button
              variant="contained"
              startIcon={<Upload />}
              onClick={handleLoadDemoData}
              disabled={isLoading}
            >
              Load Demo Data
            </Button>
          </Stack>
        </Box>

        {/* Well data summary */}
        {wells.length > 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Loaded Wells ({wells.length})
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {wells.map((well, index) => (
                <Chip
                  key={index}
                  label={`${well.wellName} (${well.depthRange[0]}-${well.depthRange[1]} ft)`}
                  variant="outlined"
                  color="primary"
                />
              ))}
            </Stack>
          </Box>
        )}
      </Paper>

      {/* Error display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          <AlertTitle>Workflow Error</AlertTitle>
          {error}
        </Alert>
      )}

      {/* Main workflow component */}
      {wells.length > 0 ? (
        <PetrophysicsAnalysisWorkflow
          wells={wells}
          initialParameters={calculationParameters}
          onWorkflowComplete={handleWorkflowComplete}
          onError={handleError}
          enableRealTimeUpdates={true}
          autoStartWorkflow={false}
        />
      ) : (
        <Paper elevation={1} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Well Data Loaded
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Load demo data or upload LAS files to begin petrophysical analysis
          </Typography>
          <Button
            variant="contained"
            startIcon={<Upload />}
            onClick={handleLoadDemoData}
            size="large"
          >
            Load Demo Data
          </Button>
        </Paper>
      )}

      {/* Workflow results summary */}
      {workflowResult && (
        <Paper elevation={2} sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Workflow Results Summary
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h4" color="primary">
                    {workflowResult.state.wells.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Wells Analyzed
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h4" color="primary">
                    {workflowResult.state.calculations.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Calculations Performed
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h4" color="primary">
                    {workflowResult.state.reservoirZones.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Reservoir Zones
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h4" color="primary">
                    {workflowResult.reports.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Reports Generated
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Parameters Dialog */}
      <Dialog open={showParametersDialog} onClose={() => setShowParametersDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Calculation Parameters</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Porosity Parameters</Typography>
              <Stack spacing={2}>
                <TextField
                  label="Matrix Density (g/cc)"
                  type="number"
                  value={calculationParameters.matrixDensity || 2.65}
                  onChange={(e) => handleParameterChange('matrixDensity', parseFloat(e.target.value))}
                  inputProps={{ step: 0.01, min: 2.0, max: 3.0 }}
                  fullWidth
                />
                <TextField
                  label="Fluid Density (g/cc)"
                  type="number"
                  value={calculationParameters.fluidDensity || 1.0}
                  onChange={(e) => handleParameterChange('fluidDensity', parseFloat(e.target.value))}
                  inputProps={{ step: 0.01, min: 0.5, max: 1.5 }}
                  fullWidth
                />
              </Stack>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Archie Parameters</Typography>
              <Stack spacing={2}>
                <TextField
                  label="Tortuosity Factor (a)"
                  type="number"
                  value={calculationParameters.a || 1.0}
                  onChange={(e) => handleParameterChange('a', parseFloat(e.target.value))}
                  inputProps={{ step: 0.1, min: 0.5, max: 2.0 }}
                  fullWidth
                />
                <TextField
                  label="Cementation Exponent (m)"
                  type="number"
                  value={calculationParameters.m || 2.0}
                  onChange={(e) => handleParameterChange('m', parseFloat(e.target.value))}
                  inputProps={{ step: 0.1, min: 1.0, max: 3.0 }}
                  fullWidth
                />
                <TextField
                  label="Saturation Exponent (n)"
                  type="number"
                  value={calculationParameters.n || 2.0}
                  onChange={(e) => handleParameterChange('n', parseFloat(e.target.value))}
                  inputProps={{ step: 0.1, min: 1.0, max: 3.0 }}
                  fullWidth
                />
                <TextField
                  label="Formation Water Resistivity (ohm-m)"
                  type="number"
                  value={calculationParameters.rw || 0.1}
                  onChange={(e) => handleParameterChange('rw', parseFloat(e.target.value))}
                  inputProps={{ step: 0.01, min: 0.01, max: 1.0 }}
                  fullWidth
                />
              </Stack>
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>Shale Volume Parameters</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    label="Clean Sand GR (API)"
                    type="number"
                    value={calculationParameters.grClean || 30}
                    onChange={(e) => handleParameterChange('grClean', parseFloat(e.target.value))}
                    inputProps={{ step: 1, min: 10, max: 80 }}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Shale GR (API)"
                    type="number"
                    value={calculationParameters.grShale || 120}
                    onChange={(e) => handleParameterChange('grShale', parseFloat(e.target.value))}
                    inputProps={{ step: 1, min: 80, max: 200 }}
                    fullWidth
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleResetParameters}>Reset to Defaults</Button>
          <Button onClick={() => setShowParametersDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveParameters} variant="contained">Save Parameters</Button>
        </DialogActions>
      </Dialog>

      {/* Info Dialog */}
      <Dialog open={showInfoDialog} onClose={() => setShowInfoDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>About Petrophysical Analysis Workflow</DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            This integrated workflow demonstrates the complete petrophysical analysis system that combines:
          </Typography>
          
          <Stack spacing={2}>
            <Box>
              <Typography variant="h6" gutterBottom>Log Visualization</Typography>
              <Typography variant="body2" color="text.secondary">
                Industry-standard log displays with triple/quad combo tracks, interactive zoom/pan, 
                and real-time parameter updates.
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="h6" gutterBottom>Petrophysical Calculations</Typography>
              <Typography variant="body2" color="text.secondary">
                Comprehensive calculation engine with multiple methods for porosity, shale volume, 
                water saturation, and permeability estimation.
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="h6" gutterBottom>Reservoir Analysis</Typography>
              <Typography variant="body2" color="text.secondary">
                Automated identification of reservoir zones, completion targets, and quality metrics 
                with statistical analysis and uncertainty quantification.
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="h6" gutterBottom>Professional Reporting</Typography>
              <Typography variant="body2" color="text.secondary">
                Automated generation of formation evaluation and completion design reports with 
                export to PDF, Excel, and LAS formats.
              </Typography>
            </Box>
          </Stack>
          
          <Typography variant="body1" sx={{ mt: 3 }}>
            The workflow integrates all components to provide a seamless experience from LAS file 
            upload to final report generation, matching industry-standard commercial software capabilities.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowInfoDialog(false)} variant="contained">Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}