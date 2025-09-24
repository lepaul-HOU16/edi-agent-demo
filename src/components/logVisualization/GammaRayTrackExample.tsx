/**
 * GammaRayTrackExample Component - Example usage of the GammaRayTrack component
 * Demonstrates industry-standard gamma ray visualization with proper formatting
 */

import React, { useState } from 'react';
import { Box, Paper, Typography, FormControlLabel, Switch, Slider } from '@mui/material';
import { GammaRayTrack } from './GammaRayTrack';
import { WellLogData } from '../../types/petrophysics';

// Sample gamma ray data representing different lithologies
const createSampleWellData = (): WellLogData[] => {
  // Generate realistic gamma ray values for different zones
  const grValues: number[] = [];
  const depths: number[] = [];
  
  // Zone 1: Clean sandstone (8000-8200 ft) - Low GR (20-50 API)
  for (let i = 0; i < 50; i++) {
    depths.push(8000 + i * 4);
    grValues.push(20 + Math.random() * 30 + Math.sin(i * 0.3) * 10);
  }
  
  // Zone 2: Transition zone (8200-8300 ft) - Increasing GR (40-80 API)
  for (let i = 0; i < 25; i++) {
    depths.push(8200 + i * 4);
    grValues.push(40 + i * 1.6 + Math.random() * 20);
  }
  
  // Zone 3: Shale (8300-8500 ft) - High GR (80-130 API)
  for (let i = 0; i < 50; i++) {
    depths.push(8300 + i * 4);
    grValues.push(80 + Math.random() * 50 + Math.sin(i * 0.2) * 15);
  }
  
  // Zone 4: Carbonate (8500-8700 ft) - Medium GR (30-70 API)
  for (let i = 0; i < 50; i++) {
    depths.push(8500 + i * 4);
    grValues.push(30 + Math.random() * 40 + Math.cos(i * 0.4) * 10);
  }
  
  // Zone 5: Clean sandstone reservoir (8700-8900 ft) - Low GR (15-45 API)
  for (let i = 0; i < 50; i++) {
    depths.push(8700 + i * 4);
    grValues.push(15 + Math.random() * 30 + Math.sin(i * 0.5) * 8);
  }

  return [{
    wellName: 'EXAMPLE_WELL_001',
    wellInfo: {
      wellName: 'EXAMPLE_WELL_001',
      field: 'Example Field',
      operator: 'Example Operator',
      location: { latitude: 30.2672, longitude: -97.7431 },
      elevation: 500,
      totalDepth: 9000,
      spudDate: new Date('2024-01-15'),
      wellType: 'vertical' as const
    },
    curves: [{
      name: 'GR',
      unit: 'API',
      description: 'Gamma Ray',
      data: grValues,
      nullValue: -999.25,
      quality: {
        completeness: 0.98,
        outlierCount: 1,
        environmentalCorrections: ['borehole_correction', 'temperature_correction'],
        qualityFlag: 'excellent' as const
      }
    }],
    depthRange: [8000, 8900],
    dataQuality: {
      overallQuality: 'excellent' as const,
      dataCompleteness: 0.95,
      environmentalCorrections: ['Environmental corrections applied'],
      validationFlags: [],
      lastAssessment: new Date()
    },
    lastModified: new Date(),
    version: '1.0'
  }];
};

export const GammaRayTrackExample: React.FC = () => {
  const [wellData] = useState<WellLogData[]>(createSampleWellData());
  const [depthRange, setDepthRange] = useState({ min: 8000, max: 8900 });
  const [showGrid, setShowGrid] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [trackWidth, setTrackWidth] = useState(250);
  const [selectedCurve, setSelectedCurve] = useState<string | null>(null);

  const handleCurveClick = (curveName: string, wellName: string) => {
    setSelectedCurve(`${curveName} (${wellName})`);
  };

  const handleDepthRangeChange = (event: Event, newValue: number | number[]) => {
    if (Array.isArray(newValue)) {
      setDepthRange({ min: newValue[0], max: newValue[1] });
    }
  };

  const handleWidthChange = (event: Event, newValue: number | number[]) => {
    if (typeof newValue === 'number') {
      setTrackWidth(newValue);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Gamma Ray Track Example
      </Typography>
      
      <Typography variant="body1" paragraph>
        This example demonstrates the industry-standard gamma ray track visualization with:
      </Typography>
      
      <Box component="ul" sx={{ mb: 3 }}>
        <li>0-150 API scale with proper grid lines</li>
        <li>Green fill for clean sand (GR &lt; 75 API)</li>
        <li>Brown fill for shale (GR &gt; 75 API)</li>
        <li>Interactive curve selection</li>
        <li>Configurable display options</li>
      </Box>

      <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
        {/* Controls */}
        <Paper sx={{ p: 2, minWidth: 300 }}>
          <Typography variant="h6" gutterBottom>
            Display Controls
          </Typography>
          
          <FormControlLabel
            control={
              <Switch
                checked={showGrid}
                onChange={(e) => setShowGrid(e.target.checked)}
              />
            }
            label="Show Grid Lines"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={showLabels}
                onChange={(e) => setShowLabels(e.target.checked)}
              />
            }
            label="Show Labels"
          />
          
          <Box sx={{ mt: 2 }}>
            <Typography gutterBottom>
              Track Width: {trackWidth}px
            </Typography>
            <Slider
              value={trackWidth}
              onChange={handleWidthChange}
              min={150}
              max={400}
              step={10}
              valueLabelDisplay="auto"
            />
          </Box>
          
          <Box sx={{ mt: 2 }}>
            <Typography gutterBottom>
              Depth Range: {depthRange.min} - {depthRange.max} ft
            </Typography>
            <Slider
              value={[depthRange.min, depthRange.max]}
              onChange={handleDepthRangeChange}
              min={8000}
              max={8900}
              step={10}
              valueLabelDisplay="auto"
              marks={[
                { value: 8000, label: '8000 ft' },
                { value: 8200, label: '8200 ft' },
                { value: 8400, label: '8400 ft' },
                { value: 8600, label: '8600 ft' },
                { value: 8800, label: '8800 ft' },
                { value: 8900, label: '8900 ft' }
              ]}
            />
          </Box>
          
          {selectedCurve && (
            <Box sx={{ mt: 2, p: 1, bgcolor: 'info.light', borderRadius: 1 }}>
              <Typography variant="body2">
                Selected: {selectedCurve}
              </Typography>
            </Box>
          )}
        </Paper>

        {/* Gamma Ray Track */}
        <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Typography variant="h6" gutterBottom>
            Gamma Ray Track
          </Typography>
          
          <GammaRayTrack
            wellData={wellData}
            depthRange={depthRange}
            height={600}
            width={trackWidth}
            showGrid={showGrid}
            showLabels={showLabels}
            onCurveClick={handleCurveClick}
          />
          
          <Box sx={{ mt: 2, maxWidth: trackWidth }}>
            <Typography variant="caption" color="text.secondary" align="center">
              Example well showing typical lithology variations:
              <br />
              • Clean sandstone (low GR)
              • Shale intervals (high GR) 
              • Carbonate sections (medium GR)
              • Reservoir quality sandstone
            </Typography>
          </Box>
        </Paper>
      </Box>

      {/* Interpretation Guide */}
      <Paper sx={{ p: 2, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Gamma Ray Interpretation Guide
        </Typography>
        
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2 }}>
          <Box>
            <Typography variant="subtitle2" color="success.main">
              Clean Sand (GR &lt; 75 API)
            </Typography>
            <Typography variant="body2">
              • Low clay content
              • Good reservoir potential
              • High porosity and permeability
              • Green fill indicates clean intervals
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="subtitle2" color="warning.main">
              Shaly Sand (GR 75-100 API)
            </Typography>
            <Typography variant="body2">
              • Moderate clay content
              • Reduced reservoir quality
              • May require special completion
              • Transition between colors
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="subtitle2" sx={{ color: '#8B4513' }}>
              Shale (GR &gt; 100 API)
            </Typography>
            <Typography variant="body2">
              • High clay content
              • Poor reservoir quality
              • Sealing intervals
              • Brown fill indicates shale
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default GammaRayTrackExample;