/**
 * ResistivityTrackExample Component - Example usage of ResistivityTrack
 * Demonstrates logarithmic scale, high resistivity fills, and hydrocarbon indication
 * Requirements: 1.4, 1.6
 */

import React, { useState } from 'react';
import { Box, Typography, FormControlLabel, Switch, Slider, Paper } from '@mui/material';
import { ResistivityTrack } from './ResistivityTrack';
import { WellLogData } from '../../types/petrophysics';

// Generate synthetic resistivity data for demonstration
const generateSyntheticResistivityData = (
  wellName: string,
  depthStart: number,
  depthEnd: number,
  numPoints: number = 200
): WellLogData => {
  const depths = Array.from({ length: numPoints }, (_, i) => 
    depthStart + (i / (numPoints - 1)) * (depthEnd - depthStart)
  );

  // Generate realistic resistivity values with hydrocarbon zones
  const resistivityValues = depths.map((depth, i) => {
    const normalizedDepth = (depth - depthStart) / (depthEnd - depthStart);
    
    // Base resistivity trend (decreasing with depth)
    let baseResistivity = 5 + Math.exp(-normalizedDepth * 2) * 10;
    
    // Add hydrocarbon zones (high resistivity)
    if (normalizedDepth > 0.2 && normalizedDepth < 0.35) {
      // First hydrocarbon zone
      baseResistivity += 50 + Math.sin((normalizedDepth - 0.2) * 20) * 30;
    }
    
    if (normalizedDepth > 0.6 && normalizedDepth < 0.8) {
      // Second hydrocarbon zone
      baseResistivity += 100 + Math.cos((normalizedDepth - 0.6) * 15) * 80;
    }
    
    // Add some noise
    baseResistivity += (Math.random() - 0.5) * 3;
    
    // Ensure positive values for log scale
    return Math.max(0.2, baseResistivity);
  });

  return {
    wellName,
    wellInfo: {
      wellName,
      field: 'Example Field',
      operator: 'Example Operator',
      location: { latitude: 30.0, longitude: -95.0 },
      elevation: 100,
      totalDepth: depthEnd,
      wellType: 'vertical'
    },
    curves: [
      {
        name: 'RT',
        unit: 'ohm-m',
        description: 'True Resistivity',
        data: resistivityValues,
        nullValue: -999.25,
        quality: {
          completeness: 0.98,
          outlierCount: 1,
          environmentalCorrections: ['borehole_correction', 'invasion_correction'],
          qualityFlag: 'excellent'
        }
      }
    ],
    depthRange: [depthStart, depthEnd],
    dataQuality: {
      overallQuality: 'excellent',
      dataCompleteness: 0.98,
      environmentalCorrections: ['borehole_correction'],
      validationFlags: [],
      lastAssessment: new Date()
    },
    lastModified: new Date(),
    version: '1.0'
  };
};

export const ResistivityTrackExample: React.FC = () => {
  const [showGrid, setShowGrid] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [trackWidth, setTrackWidth] = useState(200);
  const [depthRange, setDepthRange] = useState({ min: 8000, max: 9000 });
  const [selectedCurve, setSelectedCurve] = useState<string | null>(null);

  // Generate example well data
  const wellData = [
    generateSyntheticResistivityData('EXAMPLE_WELL_001', depthRange.min, depthRange.max),
    generateSyntheticResistivityData('EXAMPLE_WELL_002', depthRange.min, depthRange.max)
  ];

  const handleCurveClick = (curveName: string, wellName: string) => {
    setSelectedCurve(`${curveName} from ${wellName}`);
  };

  const handleDepthRangeChange = (event: Event, newValue: number | number[]) => {
    if (Array.isArray(newValue)) {
      setDepthRange({ min: newValue[0], max: newValue[1] });
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Resistivity Track Example
      </Typography>
      
      <Typography variant="body1" paragraph>
        This example demonstrates the ResistivityTrack component with industry-standard 
        logarithmic scaling (0.2-2000 Ω·m), high resistivity fills for hydrocarbon indication, 
        and proper curve normalization.
      </Typography>

      {/* Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Display Controls
        </Typography>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'center' }}>
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
          
          <Box sx={{ minWidth: 200 }}>
            <Typography gutterBottom>Track Width: {trackWidth}px</Typography>
            <Slider
              value={trackWidth}
              onChange={(e, value) => setTrackWidth(value as number)}
              min={150}
              max={300}
              step={10}
            />
          </Box>
        </Box>

        <Box sx={{ mt: 2, minWidth: 300 }}>
          <Typography gutterBottom>
            Depth Range: {depthRange.min} - {depthRange.max} ft
          </Typography>
          <Slider
            value={[depthRange.min, depthRange.max]}
            onChange={handleDepthRangeChange}
            min={7500}
            max={9500}
            step={50}
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => `${value} ft`}
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

      {/* Track Display */}
      <Paper sx={{ p: 2, display: 'inline-block' }}>
        <Typography variant="h6" gutterBottom>
          Resistivity Track Display
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <ResistivityTrack
            wellData={wellData}
            depthRange={depthRange}
            height={600}
            width={trackWidth}
            showGrid={showGrid}
            showLabels={showLabels}
            onCurveClick={handleCurveClick}
          />
          
          {/* Legend */}
          <Box sx={{ ml: 2, minWidth: 200 }}>
            <Typography variant="subtitle2" gutterBottom>
              Track Features:
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                <strong>Scale:</strong> Logarithmic 0.2-2000 Ω·m
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Curve:</strong> RT (True Resistivity) - Black line
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Fill:</strong> Green for high resistivity (&gt;10 Ω·m)
              </Typography>
            </Box>

            <Typography variant="subtitle2" gutterBottom>
              Interpretation Guide:
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                • <span style={{ color: '#90EE90' }}>Green zones</span>: Potential hydrocarbons
              </Typography>
              <Typography variant="body2" gutterBottom>
                • High resistivity (&gt;10 Ω·m): Hydrocarbon indication
              </Typography>
              <Typography variant="body2" gutterBottom>
                • Low resistivity (&lt;10 Ω·m): Water-bearing zones
              </Typography>
              <Typography variant="body2" gutterBottom>
                • Log scale: Accommodates wide resistivity range
              </Typography>
            </Box>

            <Typography variant="subtitle2" gutterBottom>
              Example Data:
            </Typography>
            
            <Box>
              <Typography variant="body2" gutterBottom>
                • Two synthetic wells with realistic resistivity profiles
              </Typography>
              <Typography variant="body2" gutterBottom>
                • Hydrocarbon zones at ~8200-8350 ft and ~8600-8800 ft
              </Typography>
              <Typography variant="body2" gutterBottom>
                • Background water resistivity ~2-15 Ω·m
              </Typography>
              <Typography variant="body2" gutterBottom>
                • Hydrocarbon resistivity ~20-200 Ω·m
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Technical Details */}
      <Paper sx={{ p: 2, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Technical Implementation
        </Typography>
        
        <Typography variant="body2" paragraph>
          The ResistivityTrack component implements industry-standard logarithmic scaling 
          to accommodate the wide range of resistivity values encountered in well logging 
          (0.2 to 2000+ Ω·m). The logarithmic scale allows for better visualization of 
          both low resistivity water zones and high resistivity hydrocarbon zones.
        </Typography>

        <Typography variant="body2" paragraph>
          <strong>Key Features:</strong>
        </Typography>
        
        <ul>
          <li>
            <Typography variant="body2">
              Logarithmic coordinate conversion for proper scaling
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              Automatic curve normalization and value clamping
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              High resistivity fill highlighting for hydrocarbon indication
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              Industry-standard color scheme and formatting
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              Interactive curve selection and depth synchronization
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              Proper handling of null values and data quality flags
            </Typography>
          </li>
        </ul>
      </Paper>
    </Box>
  );
};

export default ResistivityTrackExample;