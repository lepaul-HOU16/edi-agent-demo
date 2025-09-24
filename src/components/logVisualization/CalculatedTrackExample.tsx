/**
 * CalculatedTrackExample Component - Example usage of CalculatedTrack
 * Demonstrates Track 4 display with calculated parameters
 */

import React, { useState } from 'react';
import { Box, Typography, Button, Paper, Grid } from '@mui/material';
import CalculatedTrack, { CalculatedParameters } from './CalculatedTrack';
import { WellLogData, LogCurve, CurveQuality, QualityAssessment } from '../../types/petrophysics';

const CalculatedTrackExample: React.FC = () => {
  const [selectedCurve, setSelectedCurve] = useState<string | null>(null);
  const [selectedWell, setSelectedWell] = useState<string | null>(null);

  // Create sample curve quality
  const sampleQuality: CurveQuality = {
    completeness: 0.95,
    outlierCount: 2,
    environmentalCorrections: ['Temperature', 'Borehole'],
    qualityFlag: 'good',
    notes: 'Good quality data with minor corrections applied'
  };

  // Create sample quality assessment
  const sampleQualityAssessment: QualityAssessment = {
    overallQuality: 'good',
    dataCompleteness: 0.92,
    environmentalCorrections: ['Temperature', 'Borehole', 'Mud filtrate'],
    validationFlags: [],
    lastAssessment: new Date()
  };

  // Generate synthetic well log data
  const generateSyntheticWellData = (): WellLogData[] => {
    const depths = Array.from({ length: 200 }, (_, i) => 8000 + i * 0.5);
    
    // Generate synthetic GR data (clean sand to shale transition)
    const grData = depths.map((depth, i) => {
      const baseGR = 30 + Math.sin((i / 50) * Math.PI) * 60 + Math.random() * 10;
      return Math.max(15, Math.min(180, baseGR));
    });

    // Generate synthetic NPHI data (porosity variation)
    const nphiData = depths.map((depth, i) => {
      const basePorosity = 15 + Math.cos((i / 40) * Math.PI) * 8 + Math.random() * 3;
      return Math.max(5, Math.min(35, basePorosity));
    });

    // Generate synthetic RT data (resistivity variation)
    const rtData = depths.map((depth, i) => {
      const baseRT = 5 + Math.exp((Math.sin((i / 30) * Math.PI) + 1) * 1.5) + Math.random() * 2;
      return Math.max(0.5, Math.min(100, baseRT));
    });

    const grCurve: LogCurve = {
      name: 'GR',
      unit: 'API',
      description: 'Gamma Ray',
      data: grData,
      nullValue: -999.25,
      quality: sampleQuality,
      apiCode: '07'
    };

    const nphiCurve: LogCurve = {
      name: 'NPHI',
      unit: '%',
      description: 'Neutron Porosity',
      data: nphiData,
      nullValue: -999.25,
      quality: sampleQuality,
      apiCode: '42'
    };

    const rtCurve: LogCurve = {
      name: 'RT',
      unit: 'ohm-m',
      description: 'True Resistivity',
      data: rtData,
      nullValue: -999.25,
      quality: sampleQuality,
      apiCode: '20'
    };

    const depthCurve: LogCurve = {
      name: 'DEPTH',
      unit: 'ft',
      description: 'Measured Depth',
      data: depths,
      nullValue: -999.25,
      quality: sampleQuality
    };

    return [
      {
        wellName: 'DEMO-001',
        wellInfo: {
          wellName: 'DEMO-001',
          field: 'Demo Field',
          operator: 'Demo Operator',
          location: {
            latitude: 29.7604,
            longitude: -95.3698
          },
          elevation: 50,
          totalDepth: 8100,
          spudDate: new Date('2024-01-15'),
          wellType: 'vertical'
        },
        curves: [grCurve, nphiCurve, rtCurve, depthCurve],
        depthRange: [8000, 8100],
        dataQuality: sampleQualityAssessment,
        lastModified: new Date(),
        version: '1.0'
      }
    ];
  };

  // Generate calculated parameters data
  const generateCalculatedData = (): CalculatedParameters[] => {
    const depths = Array.from({ length: 200 }, (_, i) => 8000 + i * 0.5);
    
    // Calculate Vsh using simplified linear method
    const vsh = depths.map((depth, i) => {
      const gr = 30 + Math.sin((i / 50) * Math.PI) * 60 + Math.random() * 10;
      const clampedGR = Math.max(15, Math.min(180, gr));
      return Math.max(0, Math.min(1, (clampedGR - 25) / (150 - 25)));
    });

    // Calculate porosity from NPHI
    const porosity = depths.map((depth, i) => {
      const nphi = 15 + Math.cos((i / 40) * Math.PI) * 8 + Math.random() * 3;
      const clampedNPHI = Math.max(5, Math.min(35, nphi));
      return Math.max(0, Math.min(1, clampedNPHI / 100));
    });

    // Calculate Sw using simplified Archie
    const sw = depths.map((depth, i) => {
      const rt = 5 + Math.exp((Math.sin((i / 30) * Math.PI) + 1) * 1.5) + Math.random() * 2;
      const clampedRT = Math.max(0.5, Math.min(100, rt));
      const phi = porosity[i];
      if (phi > 0) {
        const swCalc = Math.pow(0.1 / (phi * phi * clampedRT), 0.5);
        return Math.max(0, Math.min(1, swCalc));
      }
      return 1.0;
    });

    // Determine net pay flags
    const netPay = depths.map((depth, i) => {
      const phi = porosity[i];
      const swVal = sw[i];
      const vshVal = vsh[i];
      
      // Net pay criteria: porosity > 8%, Sw < 60%, Vsh < 50%
      return phi > 0.08 && swVal < 0.6 && vshVal < 0.5;
    });

    return [
      {
        wellName: 'DEMO-001',
        depths,
        vsh,
        sw,
        porosity,
        netPay
      }
    ];
  };

  const wellData = generateSyntheticWellData();
  const calculatedData = generateCalculatedData();
  const depthRange = { min: 8000, max: 8100 };

  const handleCurveClick = (curveName: string, wellName: string) => {
    setSelectedCurve(curveName);
    setSelectedWell(wellName);
  };

  const resetSelection = () => {
    setSelectedCurve(null);
    setSelectedWell(null);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Calculated Track Example (Track 4)
      </Typography>
      
      <Typography variant="body1" paragraph>
        This example demonstrates the CalculatedTrack component displaying industry-standard 
        calculated parameters including shale volume (Vsh), water saturation (Sw), porosity (φ), 
        and net pay flags with proper color schemes and fills.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Track 4: Calculated Parameters
            </Typography>
            
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center',
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              p: 1,
              backgroundColor: '#fafafa'
            }}>
              <CalculatedTrack
                wellData={wellData}
                calculatedData={calculatedData}
                depthRange={depthRange}
                height={600}
                width={250}
                showGrid={true}
                showLabels={true}
                onCurveClick={handleCurveClick}
              />
            </Box>

            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                • <strong>Brown fill/curve:</strong> Shale Volume (Vsh) - indicates clay content
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • <strong>Blue fill/curve:</strong> Water Saturation (Sw) - fraction of pore space filled with water
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • <strong>Yellow fill/curve:</strong> Effective Porosity (φ) - interconnected pore space
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • <strong>Green bars:</strong> Net Pay Flags - intervals meeting reservoir quality criteria
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Track Information
            </Typography>
            
            <Typography variant="body2" paragraph>
              <strong>Scale:</strong> 0-100% (normalized)
            </Typography>
            
            <Typography variant="body2" paragraph>
              <strong>Parameters Displayed:</strong>
            </Typography>
            <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
              <li>Shale Volume (Vsh)</li>
              <li>Water Saturation (Sw)</li>
              <li>Effective Porosity (φ)</li>
              <li>Net Pay Intervals</li>
            </ul>

            <Typography variant="body2" paragraph sx={{ mt: 2 }}>
              <strong>Net Pay Criteria:</strong>
            </Typography>
            <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
              <li>Porosity &gt; 8%</li>
              <li>Water Saturation &lt; 60%</li>
              <li>Shale Volume &lt; 50%</li>
            </ul>

            {selectedCurve && selectedWell && (
              <Box sx={{ mt: 3, p: 2, backgroundColor: '#e3f2fd', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Selected Curve
                </Typography>
                <Typography variant="body2">
                  <strong>Curve:</strong> {selectedCurve}
                </Typography>
                <Typography variant="body2">
                  <strong>Well:</strong> {selectedWell}
                </Typography>
                <Button 
                  size="small" 
                  onClick={resetSelection}
                  sx={{ mt: 1 }}
                >
                  Clear Selection
                </Button>
              </Box>
            )}

            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Features Demonstrated
              </Typography>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.875rem' }}>
                <li>Industry-standard color schemes</li>
                <li>Multiple parameter visualization</li>
                <li>Net pay flag display</li>
                <li>Interactive curve selection</li>
                <li>Proper scaling and grid lines</li>
                <li>Professional track formatting</li>
              </ul>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CalculatedTrackExample;