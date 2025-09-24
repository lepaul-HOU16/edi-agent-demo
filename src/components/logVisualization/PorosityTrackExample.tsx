/**
 * PorosityTrack Example Component
 * Demonstrates porosity track with dual curves and gas effect highlighting
 * Requirements: 1.3, 1.6
 */

import React, { useState } from 'react';
import { Box, Typography, Paper, FormControlLabel, Switch, Slider } from '@mui/material';
import { PorosityTrack } from './PorosityTrack';
import { WellLogData, LogCurve, CurveQuality, QualityAssessment, WellHeaderInfo } from '../../types/petrophysics';

export const PorosityTrackExample: React.FC = () => {
  const [showGrid, setShowGrid] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [depthRange, setDepthRange] = useState([8000, 8100]);
  const [selectedCurve, setSelectedCurve] = useState<string | null>(null);

  // Create example well data with realistic porosity values
  const createExampleWellData = (): WellLogData => {
    const mockCurveQuality: CurveQuality = {
      completeness: 0.98,
      outlierCount: 1,
      environmentalCorrections: ['borehole_correction', 'temperature_correction'],
      qualityFlag: 'excellent',
    };

    const mockQualityAssessment: QualityAssessment = {
      overallQuality: 'excellent',
      dataCompleteness: 0.98,
      environmentalCorrections: ['borehole_correction', 'temperature_correction'],
      validationFlags: [],
      lastAssessment: new Date(),
    };

    const mockWellHeaderInfo: WellHeaderInfo = {
      wellName: 'EXAMPLE-001',
      field: 'Permian Basin',
      operator: 'Example Energy',
      location: { latitude: 31.8457, longitude: -102.3676 },
      elevation: 2850,
      totalDepth: 12500,
      wellType: 'horizontal',
    };

    // Generate realistic NPHI data (neutron porosity in %)
    const nphiData: number[] = [];
    // Generate realistic RHOB data (bulk density in g/cc)
    const rhobData: number[] = [];
    
    const dataPoints = 100;
    for (let i = 0; i < dataPoints; i++) {
      const depth = 8000 + (i / dataPoints) * 100;
      
      // Simulate different reservoir zones
      if (depth < 8020) {
        // Shale zone - high neutron, low density
        nphiData.push(25 + Math.random() * 10);
        rhobData.push(2.20 + Math.random() * 0.15);
      } else if (depth < 8040) {
        // Clean sand zone - moderate porosity
        nphiData.push(15 + Math.random() * 8);
        rhobData.push(2.35 + Math.random() * 0.20);
      } else if (depth < 8060) {
        // Gas-bearing sand - gas effect (NPHI < density porosity)
        nphiData.push(8 + Math.random() * 6);
        rhobData.push(2.15 + Math.random() * 0.15);
      } else if (depth < 8080) {
        // Water-bearing sand - normal porosity relationship
        nphiData.push(18 + Math.random() * 7);
        rhobData.push(2.30 + Math.random() * 0.18);
      } else {
        // Tight zone - low porosity
        nphiData.push(5 + Math.random() * 5);
        rhobData.push(2.55 + Math.random() * 0.15);
      }
    }

    const nphiCurve: LogCurve = {
      name: 'NPHI',
      unit: '%',
      description: 'Neutron Porosity',
      data: nphiData,
      nullValue: -999.25,
      quality: mockCurveQuality,
      apiCode: '42',
    };

    const rhobCurve: LogCurve = {
      name: 'RHOB',
      unit: 'g/cc',
      description: 'Bulk Density',
      data: rhobData,
      nullValue: -999.25,
      quality: mockCurveQuality,
      apiCode: '45',
    };

    return {
      wellName: 'EXAMPLE-001',
      wellInfo: mockWellHeaderInfo,
      curves: [nphiCurve, rhobCurve],
      depthRange: [8000, 8100],
      dataQuality: mockQualityAssessment,
      lastModified: new Date(),
      version: '1.0',
    };
  };

  const exampleWellData = createExampleWellData();

  const handleCurveClick = (curveName: string, wellName: string) => {
    setSelectedCurve(curveName);
    console.log(`Clicked on ${curveName} curve in well ${wellName}`);
  };

  const handleDepthRangeChange = (event: Event, newValue: number | number[]) => {
    if (Array.isArray(newValue)) {
      setDepthRange(newValue);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Porosity Track Example
      </Typography>
      
      <Typography variant="body1" paragraph>
        This example demonstrates the PorosityTrack component with dual curves (NPHI and RHOB) 
        and gas effect highlighting. The track shows:
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" component="div">
          • <span style={{ color: '#0000FF', fontWeight: 'bold' }}>Blue line</span>: NPHI (Neutron Porosity, 0-40% scale)
        </Typography>
        <Typography variant="body2" component="div">
          • <span style={{ color: '#FF0000', fontWeight: 'bold' }}>Red line</span>: RHOB (Bulk Density, inverted 1.95-2.95 g/cc scale)
        </Typography>
        <Typography variant="body2" component="div">
          • <span style={{ color: '#FFFF00', fontWeight: 'bold' }}>Yellow fill</span>: Gas effect (NPHI &lt; density porosity)
        </Typography>
        <Typography variant="body2" component="div">
          • <span style={{ color: '#87CEEB', fontWeight: 'bold' }}>Sky blue fill</span>: Porosity fill between curves
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
        {/* Controls */}
        <Paper sx={{ p: 2, minWidth: 300 }}>
          <Typography variant="h6" gutterBottom>
            Controls
          </Typography>
          
          <FormControlLabel
            control={
              <Switch
                checked={showGrid}
                onChange={(e) => setShowGrid(e.target.checked)}
              />
            }
            label="Show Grid"
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
              Depth Range: {depthRange[0]} - {depthRange[1]} ft
            </Typography>
            <Slider
              value={depthRange}
              onChange={handleDepthRangeChange}
              valueLabelDisplay="auto"
              min={8000}
              max={8100}
              step={5}
              marks={[
                { value: 8000, label: '8000' },
                { value: 8050, label: '8050' },
                { value: 8100, label: '8100' },
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

        {/* Porosity Track */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Porosity Track (Track 2)
          </Typography>
          
          <PorosityTrack
            wellData={[exampleWellData]}
            depthRange={{ min: depthRange[0], max: depthRange[1] }}
            height={600}
            width={250}
            showGrid={showGrid}
            showLabels={showLabels}
            onCurveClick={handleCurveClick}
          />
        </Paper>
      </Box>

      {/* Geological Interpretation */}
      <Paper sx={{ p: 2, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Geological Interpretation
        </Typography>
        
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              8000-8020 ft: Shale Zone
            </Typography>
            <Typography variant="body2">
              High neutron porosity, low bulk density. Clay-bound water causes elevated neutron response.
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              8020-8040 ft: Clean Sand
            </Typography>
            <Typography variant="body2">
              Moderate porosity with good NPHI-RHOB agreement. Water-bearing reservoir rock.
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              8040-8060 ft: Gas Sand
            </Typography>
            <Typography variant="body2">
              Gas effect visible - NPHI reads lower than density porosity due to hydrogen deficiency.
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              8060-8080 ft: Water Sand
            </Typography>
            <Typography variant="body2">
              Normal porosity relationship. Good reservoir quality with water saturation.
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              8080-8100 ft: Tight Zone
            </Typography>
            <Typography variant="body2">
              Low porosity, high density. Poor reservoir quality, likely cemented.
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Technical Notes */}
      <Paper sx={{ p: 2, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Technical Notes
        </Typography>
        
        <Typography variant="body2" paragraph>
          <strong>Density Porosity Calculation:</strong> φD = (2.65 - RHOB) / (2.65 - 1.0)
        </Typography>
        
        <Typography variant="body2" paragraph>
          <strong>Gas Effect:</strong> When neutron porosity (NPHI) reads significantly lower than 
          density porosity, it indicates the presence of gas. Gas has low hydrogen content, causing 
          the neutron tool to underestimate porosity.
        </Typography>
        
        <Typography variant="body2" paragraph>
          <strong>Scale Configuration:</strong> NPHI uses 0-40% scale (left to right), while RHOB 
          uses inverted 1.95-2.95 g/cc scale to align porosity trends.
        </Typography>
        
        <Typography variant="body2">
          <strong>Industry Standards:</strong> This track follows API RP 40 standards for 
          porosity log display and color schemes.
        </Typography>
      </Paper>
    </Box>
  );
};

export default PorosityTrackExample;