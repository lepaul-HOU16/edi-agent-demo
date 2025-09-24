/**
 * LogPlotExample Component - Demonstrates usage of LogPlotViewer
 * This component shows how to configure and use the professional log visualization
 */

import React, { useState } from 'react';
import { Box, Paper, Typography, Button, Stack } from '@mui/material';
import LogPlotViewer, { TrackConfig, DepthRange } from './LogPlotViewer';
import { WellLogData, LogCurve, CurveQuality, QualityAssessment } from '../../types/petrophysics';

// Create sample well data for demonstration
const createSampleWellData = (): WellLogData[] => {
  const mockCurveQuality: CurveQuality = {
    completeness: 0.95,
    outlierCount: 2,
    environmentalCorrections: ['temperature', 'pressure'],
    qualityFlag: 'good',
    notes: 'Sample data for demonstration'
  };

  const mockQualityAssessment: QualityAssessment = {
    overallQuality: 'good',
    dataCompleteness: 0.95,
    environmentalCorrections: ['temperature'],
    validationFlags: [],
    lastAssessment: new Date()
  };

  // Generate synthetic log data
  const depthCount = 200;
  const startDepth = 8000;
  const endDepth = 9000;

  // Gamma Ray curve - typical shale/sand sequence
  const grData = Array.from({ length: depthCount }, (_, i) => {
    const depth = startDepth + (i / (depthCount - 1)) * (endDepth - startDepth);
    const baseGR = 60;
    const shaleLayer = Math.sin((depth - startDepth) * 0.01) > 0.3 ? 40 : 0;
    const noise = (Math.random() - 0.5) * 10;
    return Math.max(20, Math.min(140, baseGR + shaleLayer + noise));
  });

  // Neutron Porosity curve
  const nphiData = Array.from({ length: depthCount }, (_, i) => {
    const depth = startDepth + (i / (depthCount - 1)) * (endDepth - startDepth);
    const basePorosity = 0.15;
    const porosityVar = Math.sin((depth - startDepth) * 0.008) * 0.08;
    const noise = (Math.random() - 0.5) * 0.03;
    return Math.max(0.05, Math.min(0.35, basePorosity + porosityVar + noise));
  });

  // Bulk Density curve
  const rhobData = Array.from({ length: depthCount }, (_, i) => {
    const depth = startDepth + (i / (depthCount - 1)) * (endDepth - startDepth);
    const baseDensity = 2.35;
    const densityVar = -Math.sin((depth - startDepth) * 0.008) * 0.15;
    const noise = (Math.random() - 0.5) * 0.05;
    return Math.max(1.8, Math.min(2.8, baseDensity + densityVar + noise));
  });

  // Resistivity curve
  const rtData = Array.from({ length: depthCount }, (_, i) => {
    const depth = startDepth + (i / (depthCount - 1)) * (endDepth - startDepth);
    const baseRT = 10;
    const hydrocarbon = Math.sin((depth - startDepth) * 0.012) > 0.4 ? 50 : 0;
    const noise = Math.random() * 5;
    return Math.max(0.5, baseRT + hydrocarbon + noise);
  });

  const curves: LogCurve[] = [
    {
      name: 'GR',
      unit: 'API',
      description: 'Gamma Ray',
      data: grData,
      nullValue: -999.25,
      quality: mockCurveQuality,
      apiCode: 'GR'
    },
    {
      name: 'NPHI',
      unit: 'V/V',
      description: 'Neutron Porosity',
      data: nphiData,
      nullValue: -999.25,
      quality: mockCurveQuality,
      apiCode: 'NPHI'
    },
    {
      name: 'RHOB',
      unit: 'G/C3',
      description: 'Bulk Density',
      data: rhobData,
      nullValue: -999.25,
      quality: mockCurveQuality,
      apiCode: 'RHOB'
    },
    {
      name: 'RT',
      unit: 'OHMM',
      description: 'True Resistivity',
      data: rtData,
      nullValue: -999.25,
      quality: mockCurveQuality,
      apiCode: 'RT'
    }
  ];

  return [{
    wellName: 'DEMO-001',
    wellInfo: {
      wellName: 'DEMO-001',
      field: 'Demo Field',
      operator: 'Demo Operator',
      location: {
        latitude: 30.0,
        longitude: -95.0
      },
      elevation: 100,
      totalDepth: 10000,
      wellType: 'vertical'
    },
    curves,
    depthRange: [startDepth, endDepth],
    dataQuality: mockQualityAssessment,
    lastModified: new Date(),
    version: '1.0'
  }];
};

// Create industry-standard track configurations
const createSampleTracks = (): TrackConfig[] => [
  // Track 1: Gamma Ray
  {
    id: 'track1',
    type: 'GR',
    title: 'Gamma Ray',
    width: 1,
    curves: [{
      name: 'GR',
      displayName: 'GR',
      color: '#228B22',
      lineWidth: 2,
      scale: [0, 150],
      unit: 'API'
    }],
    scale: {
      min: 0,
      max: 150,
      gridLines: true,
      tickInterval: 25
    },
    fills: [
      {
        type: 'threshold',
        curveName: 'GR',
        threshold: 75,
        color: 'rgba(34, 139, 34, 0.3)',
        opacity: 0.3,
        condition: 'less_than'
      },
      {
        type: 'threshold',
        curveName: 'GR',
        threshold: 75,
        color: 'rgba(139, 69, 19, 0.3)',
        opacity: 0.3,
        condition: 'greater_than'
      }
    ]
  },
  // Track 2: Porosity
  {
    id: 'track2',
    type: 'POROSITY',
    title: 'Porosity',
    width: 1,
    curves: [
      {
        name: 'NPHI',
        displayName: 'NPHI',
        color: '#0000FF',
        lineWidth: 2,
        scale: [0, 0.4],
        unit: 'V/V'
      },
      {
        name: 'RHOB',
        displayName: 'RHOB',
        color: '#FF0000',
        lineWidth: 2,
        scale: [1.95, 2.95],
        inverted: true,
        unit: 'G/C3'
      }
    ],
    scale: {
      min: 0,
      max: 0.4,
      gridLines: true
    },
    fills: []
  },
  // Track 3: Resistivity
  {
    id: 'track3',
    type: 'RESISTIVITY',
    title: 'Resistivity',
    width: 1,
    curves: [{
      name: 'RT',
      displayName: 'RT',
      color: '#000000',
      lineWidth: 2,
      scale: [0.2, 2000],
      unit: 'OHMM'
    }],
    scale: {
      min: 0.2,
      max: 2000,
      logarithmic: true,
      gridLines: true
    },
    fills: [
      {
        type: 'threshold',
        curveName: 'RT',
        threshold: 20,
        color: 'rgba(0, 255, 0, 0.3)',
        opacity: 0.3,
        condition: 'greater_than'
      }
    ]
  }
];

export const LogPlotExample: React.FC = () => {
  const [wellData] = useState<WellLogData[]>(createSampleWellData());
  const [tracks] = useState<TrackConfig[]>(createSampleTracks());
  const [depthRange, setDepthRange] = useState<DepthRange>({ min: 8200, max: 8800 });
  const [selectedCurve, setSelectedCurve] = useState<string | null>(null);

  const handleDepthRangeChange = (newRange: DepthRange) => {
    setDepthRange(newRange);
  };

  const handleCurveSelect = (curveName: string, wellName: string) => {
    setSelectedCurve(curveName);
    console.log(`Selected curve: ${curveName} from well: ${wellName}`);
  };

  const handlePresetZoom = (preset: 'full' | 'top' | 'middle' | 'bottom') => {
    const fullRange = wellData[0]?.depthRange || [8000, 9000];
    const totalDepth = fullRange[1] - fullRange[0];
    
    switch (preset) {
      case 'full':
        setDepthRange({ min: fullRange[0], max: fullRange[1] });
        break;
      case 'top':
        setDepthRange({ min: fullRange[0], max: fullRange[0] + totalDepth * 0.33 });
        break;
      case 'middle':
        setDepthRange({ 
          min: fullRange[0] + totalDepth * 0.33, 
          max: fullRange[0] + totalDepth * 0.67 
        });
        break;
      case 'bottom':
        setDepthRange({ min: fullRange[0] + totalDepth * 0.67, max: fullRange[1] });
        break;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Professional Log Visualization Demo
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        This demonstrates the LogPlotViewer component with industry-standard formatting.
        Features include zoom/pan controls, curve selection, and proper scaling.
      </Typography>

      {/* Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Controls
        </Typography>
        
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <Button 
            variant="outlined" 
            size="small"
            onClick={() => handlePresetZoom('full')}
          >
            Full Range
          </Button>
          <Button 
            variant="outlined" 
            size="small"
            onClick={() => handlePresetZoom('top')}
          >
            Top Third
          </Button>
          <Button 
            variant="outlined" 
            size="small"
            onClick={() => handlePresetZoom('middle')}
          >
            Middle Third
          </Button>
          <Button 
            variant="outlined" 
            size="small"
            onClick={() => handlePresetZoom('bottom')}
          >
            Bottom Third
          </Button>
        </Stack>

        <Typography variant="body2" color="text.secondary">
          Current depth range: {depthRange.min.toFixed(1)} - {depthRange.max.toFixed(1)} ft
          {selectedCurve && ` | Selected curve: ${selectedCurve}`}
        </Typography>
      </Paper>

      {/* Log Plot */}
      <LogPlotViewer
        wellData={wellData}
        tracks={tracks}
        initialDepthRange={depthRange}
        height={700}
        showDepthScale={true}
        interactive={true}
        onDepthRangeChange={handleDepthRangeChange}
        onCurveSelect={handleCurveSelect}
      />

      {/* Legend */}
      <Paper sx={{ p: 2, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Track Legend
        </Typography>
        
        <Stack spacing={2}>
          <Box>
            <Typography variant="subtitle2" color="primary">
              Track 1: Gamma Ray (0-150 API)
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Green fill: Clean sand (GR &lt; 75 API)
              • Brown fill: Shale (GR &gt; 75 API)
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="subtitle2" color="primary">
              Track 2: Porosity (0-40% NPHI, 1.95-2.95 g/cc RHOB)
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Blue line: Neutron Porosity (NPHI)
              • Red line: Bulk Density (RHOB, inverted scale)
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="subtitle2" color="primary">
              Track 3: Resistivity (0.2-2000 ohm-m, log scale)
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Black line: True Resistivity (RT)
              • Green fill: High resistivity (&gt; 20 ohm-m, potential hydrocarbon)
            </Typography>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
};

export default LogPlotExample;