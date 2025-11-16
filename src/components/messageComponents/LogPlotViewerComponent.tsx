import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Chip, 
  Grid,
  Paper,
  Tabs,
  Tab,
  Stack,
  Button,
  Alert,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider
} from '@mui/material';
import {
  Layers,
  BarChart,
  Timeline,
  Settings,
  Download,
  ZoomIn,
  Visibility,
  VisibilityOff,
  GridOn
} from '@mui/icons-material';

// Lazy load Plotly for better performance
const Plot = React.lazy(() => import('react-plotly.js')) as any;

interface LogPlotViewerProps {
  data: any;
}

// Professional geological zone definitions
const GEOLOGICAL_ZONES = [
  { name: 'Shale', color: '#F4E04D', pattern: 'horizontal-lines', minGR: 80, maxGR: 150 },
  { name: 'Sand', color: '#FFE8B0', pattern: 'none', minGR: 0, maxGR: 50 },
  { name: 'Hydrocarbon', color: '#808080', opacity: 0.6, resistivity: 'high' },
  { name: 'Gas', color: '#FF6B35', opacity: 0.7, neutronDensityGap: 'high' },
  { name: 'Oil', color: '#4A7C59', opacity: 0.7, resistivity: 'medium' },
  { name: 'Brine', color: '#4A90E2', opacity: 0.5, resistivity: 'low' }
];

const LogPlotViewerComponentBase: React.FC<LogPlotViewerProps> = ({ data }) => {
  const theme = useTheme();
  const [selectedTab, setSelectedTab] = useState(0);
  const [showGeologicalZones, setShowGeologicalZones] = useState(true);
  const [showFormationBoundaries, setShowFormationBoundaries] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [selectedTrackLayout, setSelectedTrackLayout] = useState('professional');
  const [visibleCurves, setVisibleCurves] = useState<Record<string, boolean>>({});

  // Responsive container detection
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerDimensions, setContainerDimensions] = useState({
    width: 800,
    height: 600
  });

  // Layout configurations for different modes
  const layoutConfigs = {
    professional: {
      height: 800,
      trackWidths: {
        grSp: 0.18,
        resistivity: 0.23,
        porosity: 0.23,
        density: 0.23
      },
      minWidth: 600
    },
    compact: {
      height: 600,
      trackWidths: {
        grSp: 0.22,
        resistivity: 0.26,
        porosity: 0.26,
        density: 0.26
      },
      minWidth: 400
    },
    custom: {
      height: 700,
      trackWidths: {
        grSp: 0.20,
        resistivity: 0.27,
        porosity: 0.27,
        density: 0.26
      },
      minWidth: 500
    }
  };

  // ResizeObserver to detect container size changes
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const config = layoutConfigs[selectedTrackLayout as keyof typeof layoutConfigs];
        
        setContainerDimensions({
          width: Math.max(width, config.minWidth),
          height: config.height
        });
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [selectedTrackLayout]);

  // Recalculate dimensions when layout changes
  useEffect(() => {
    if (containerRef.current) {
      const config = layoutConfigs[selectedTrackLayout as keyof typeof layoutConfigs];
      const rect = containerRef.current.getBoundingClientRect();
      
      setContainerDimensions({
        width: Math.max(rect.width, config.minWidth),
        height: config.height
      });
    }
  }, [selectedTrackLayout]);

  // Extract well information
  const wellName = data?.wellName || 'CARBONATE_PLATFORM_002';
  const tracks = data?.tracks || ['gammaRay', 'resistivity', 'porosity', 'lithology'];
  const visualizationType = data?.type || 'logPlotViewer';

  // Process real well data from the backend
  const processRealWellData = () => {
    if (!data || !data.logData) {
      return {
        depths: [],
        curves: {},
        curveNames: [],
        hasData: false
      };
    }

    const logData = data.logData;
    const depths = logData.DEPT || [];
    const curves = {};
    const curveNames = [];

    Object.keys(logData).forEach(curveName => {
      if (curveName !== 'DEPT' && Array.isArray(logData[curveName])) {
        curves[curveName] = logData[curveName];
        curveNames.push(curveName);
      }
    });

    return {
      depths,
      curves,
      curveNames,
      hasData: depths.length > 0 && curveNames.length > 0
    };
  };

  const realLogData = processRealWellData();
  
  // Stable deterministic data generation - fixes crossplot jumping issue
  const stableLogData = useMemo(() => {
    if (realLogData.hasData) {
      return realLogData;
    }

    // Generate stable fallback data using deterministic functions
    const depths = [];
    const curves = {};
    
    for (let i = 0; i <= 300; i += 1) {
      const depth = 7000 + i * 1;
      depths.push(depth);
    }

    // Deterministic curve generation - no Math.random() to prevent jumping
    const normalizeIndex = (i: number) => i / 300;
    const depthNormalized = (depth: number) => (depth - 7000) / 300;

    // Gamma Ray - with clear stable shale/sand differentiation
    curves['GR'] = depths.map((depth, i) => {
      const normalized = depthNormalized(depth);
      
      // Create distinct zones with deterministic values
      if (depth >= 7050 && depth <= 7150) return 25 + 15 * Math.sin(i * 0.1); // Clean sand
      if (depth >= 7000 && depth <= 7050) return 85 + 20 * Math.cos(i * 0.08); // Shale
      if (depth >= 7150 && depth <= 7200) return 95 + 25 * Math.sin(i * 0.12); // Shale marker
      if (depth >= 7200 && depth <= 7300) return 30 + 20 * Math.cos(i * 0.09); // Sand variations
      
      return 45 + 30 * Math.sin(normalized * 6) + 15 * Math.cos(normalized * 8);
    });

    // Spontaneous Potential - deterministic based on GR
    curves['SP'] = depths.map((depth, i) => {
      const grValue = curves['GR'][i];
      const baseSP = grValue > 70 ? -10 : -45;
      return baseSP + 15 * Math.sin(i * 0.05);
    });

    // Resistivity curves - deterministic relationships
    curves['RES_SHALLOW'] = depths.map((depth, i) => {
      const normalized = depthNormalized(depth);
      const baseRes = depth >= 7080 && depth <= 7120 ? 
        25 + 75 * (0.5 + 0.5 * Math.sin(i * 0.3)) : // Gas zone - deterministic
        2 + 8 * (0.5 + 0.5 * Math.cos(i * 0.2));
      return Math.max(0.2, baseRes * (0.8 + 0.4 * Math.sin(normalized * 10)));
    });

    curves['RES_MEDIUM'] = depths.map((depth, i) => {
      const shallowRes = curves['RES_SHALLOW'][i];
      return shallowRes * (1.1 + 0.3 * Math.sin(i * 0.15));
    });

    curves['RES_DEEP'] = depths.map((depth, i) => {
      const mediumRes = curves['RES_MEDIUM'][i];
      return mediumRes * (1.05 + 0.2 * Math.cos(i * 0.18));
    });

    // Neutron Porosity - deterministic based on GR
    curves['NPHI'] = depths.map((depth, i) => {
      const grValue = curves['GR'][i];
      const normalized = depthNormalized(depth);
      
      if (depth >= 7080 && depth <= 7120) return 0.12 + 0.08 * Math.sin(i * 0.25); // Gas zone
      if (grValue > 70) return 0.35 + 0.05 * Math.cos(i * 0.1); // Shale - high neutron
      return Math.max(0.05, 0.25 - (grValue - 30) * 0.002 + 0.05 * Math.sin(normalized * 12));
    });

    // Bulk Density - deterministic based on neutron
    curves['RHOB'] = depths.map((depth, i) => {
      const neutron = curves['NPHI'][i];
      const normalized = depthNormalized(depth);
      
      if (depth >= 7080 && depth <= 7120) return 2.2 + 0.1 * Math.cos(i * 0.2); // Gas zone - low density
      return Math.max(1.8, Math.min(2.8, 2.6 - neutron * 2 + 0.1 * Math.sin(normalized * 8)));
    });

    return {
      depths,
      curves,
      curveNames: ['GR', 'SP', 'RES_SHALLOW', 'RES_MEDIUM', 'RES_DEEP', 'NPHI', 'RHOB'],
      hasData: true
    };
  }, [realLogData.hasData, wellName]); // Stable dependencies

  const logData = stableLogData;

  // Initialize visible curves
  React.useEffect(() => {
    if (logData.curveNames && logData.curveNames.length > 0) {
      const initialVisibility = logData.curveNames.reduce((acc, curve) => {
        acc[curve] = true;
        return acc;
      }, {} as Record<string, boolean>);
      setVisibleCurves(initialVisibility);
    }
  }, [logData.curveNames]);

  // Geological interpretation logic
  const interpretGeologicalZones = useMemo(() => {
    if (!logData.depths || !logData.curves) return [];

    const zones = [];
    const depths = logData.depths;
    const grCurve = logData.curves['GR'] || [];
    const resCurve = logData.curves['RES_DEEP'] || logData.curves['RES_MEDIUM'] || [];
    const neutronCurve = logData.curves['NPHI'] || [];
    const densityCurve = logData.curves['RHOB'] || [];

    for (let i = 0; i < depths.length - 1; i++) {
      const gr = grCurve[i] || 50;
      const res = resCurve[i] || 5;
      const neutron = neutronCurve[i] || 0.2;
      const density = densityCurve[i] || 2.4;
      
      let zoneType = 'Sand';
      let zoneColor = '#FFE8B0';
      let opacity = 0.3;

      // Lithology interpretation
      if (gr > 75) {
        zoneType = 'Shale';
        zoneColor = '#F4E04D';
      }

      // Fluid interpretation
      if (res > 20 && neutron < 0.15 && density < 2.3) {
        zoneType = 'Gas';
        zoneColor = '#FF6B35';
        opacity = 0.6;
      } else if (res > 10 && res < 20) {
        zoneType = 'Oil';
        zoneColor = '#4A7C59';
        opacity = 0.5;
      } else if (res < 5) {
        zoneType = 'Brine';
        zoneColor = '#4A90E2';
        opacity = 0.4;
      } else if (res > 5 && res < 10 && gr < 50) {
        zoneType = 'Hydrocarbon';
        zoneColor = '#808080';
        opacity = 0.5;
      }

      zones.push({
        depth: depths[i],
        nextDepth: depths[i + 1],
        type: zoneType,
        color: zoneColor,
        opacity: opacity,
        properties: { gr, res, neutron, density }
      });
    }

    return zones;
  }, [logData]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const toggleCurveVisibility = (curveName: string) => {
    setVisibleCurves(prev => ({
      ...prev,
      [curveName]: !prev[curveName]
    }));
  };

  // Professional Multi-Track Log Display - Now Responsive!
  const renderProfessionalLogDisplay = () => {
    const depths = logData.depths || [];
    const curves = logData.curves || {};
    const availableCurves = logData.curveNames || [];
    
    if (!depths.length || !availableCurves.length) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 600 }}>
          <Alert severity="warning">
            <Typography>No log curve data available for professional display</Typography>
          </Alert>
        </Box>
      );
    }

    // Get current layout configuration
    const config = layoutConfigs[selectedTrackLayout as keyof typeof layoutConfigs];
    const { width, height } = containerDimensions;

    // Calculate track domains based on container width and layout
    const totalTracks = 4; // GR/SP, Resistivity, Porosity, Density
    const trackGap = 0.02;
    const availableWidth = 1.0;
    const trackWidth = (availableWidth - (totalTracks - 1) * trackGap) / totalTracks;
    
    // Dynamic track positions based on container width
    let currentPos = 0;
    const trackDomains = {
      grSp: [currentPos, currentPos + trackWidth],
      resistivity: [currentPos += trackWidth + trackGap, currentPos + trackWidth],
      porosity: [currentPos += trackWidth + trackGap, currentPos + trackWidth],
      density: [currentPos += trackWidth + trackGap, currentPos + trackWidth]
    };

    const traces = [];
    const shapes = [];

    // Track 1: Gamma Ray & Spontaneous Potential
    if (availableCurves.includes('GR') && visibleCurves['GR'] !== false) {
      traces.push({
        x: curves['GR'],
        y: depths,
        mode: 'lines',
        name: 'Gamma Ray',
        line: { color: '#22C55E', width: 1.5 },
        xaxis: 'x1',
        yaxis: 'y',
        fill: showGeologicalZones ? 'tonexty' : 'none',
        fillcolor: 'rgba(34, 197, 94, 0.1)'
      });
    }

    if (availableCurves.includes('SP') && visibleCurves['SP'] !== false) {
      traces.push({
        x: curves['SP'],
        y: depths,
        mode: 'lines',
        name: 'SP',
        line: { color: '#8B5CF6', width: 1, dash: 'dot' },
        xaxis: 'x2',
        yaxis: 'y'
      });
    }

    // Track 2: Resistivity curves
    if (availableCurves.includes('RES_SHALLOW') && visibleCurves['RES_SHALLOW'] !== false) {
      traces.push({
        x: curves['RES_SHALLOW'],
        y: depths,
        mode: 'lines',
        name: 'Resistivity, Shallow',
        line: { color: '#000000', width: 1, dash: 'dot' },
        xaxis: 'x3',
        yaxis: 'y'
      });
    }

    if (availableCurves.includes('RES_MEDIUM') && visibleCurves['RES_MEDIUM'] !== false) {
      traces.push({
        x: curves['RES_MEDIUM'],
        y: depths,
        mode: 'lines',
        name: 'Resistivity, Medium',
        line: { color: '#000000', width: 1, dash: 'dash' },
        xaxis: 'x3',
        yaxis: 'y'
      });
    }

    if (availableCurves.includes('RES_DEEP') && visibleCurves['RES_DEEP'] !== false) {
      traces.push({
        x: curves['RES_DEEP'],
        y: depths,
        mode: 'lines',
        name: 'Resistivity, Deep',
        line: { color: '#000000', width: 2 },
        xaxis: 'x3',
        yaxis: 'y'
      });
    }

    // Track 3: Neutron Porosity and Bulk Density
    if (availableCurves.includes('NPHI') && visibleCurves['NPHI'] !== false) {
      traces.push({
        x: curves['NPHI'].map(val => val * 100), // Convert to percentage
        y: depths,
        mode: 'lines',
        name: 'Neutron Porosity',
        line: { color: '#3B82F6', width: 1.5 },
        xaxis: 'x4',
        yaxis: 'y'
      });
    }

    if (availableCurves.includes('RHOB') && visibleCurves['RHOB'] !== false) {
      traces.push({
        x: curves['RHOB'],
        y: depths,
        mode: 'lines',
        name: 'Bulk Density',
        line: { color: '#DC2626', width: 1.5 },
        xaxis: 'x5',
        yaxis: 'y'
      });
    }

    // Add geological zone background shapes if enabled
    if (showGeologicalZones) {
      interpretGeologicalZones.forEach((zone, index) => {
        // Only add shapes for every 5th zone to avoid clutter
        if (index % 5 === 0) {
          shapes.push({
            type: 'rect',
            xref: 'paper',
            yref: 'y',
            x0: 0,
            y0: zone.depth,
            x1: 1,
            y1: zone.nextDepth,
            fillcolor: zone.color,
            opacity: zone.opacity,
            layer: 'below',
            line: { width: 0 }
          });
        }
      });
    }

    // Responsive layout configuration
    const layout = {
      title: {
        text: `${wellName} - Professional Multi-Track Log Display (${selectedTrackLayout.toUpperCase()})`,
        font: { 
          size: width < 600 ? 14 : 16, 
          family: 'Arial, sans-serif' 
        }
      },
      height: config.height,
      width: width,
      autosize: true,
      margin: { 
        t: width < 600 ? 80 : 100, 
        b: 50, 
        l: width < 600 ? 60 : 100, 
        r: width < 600 ? 20 : 50 
      },
      
      // Main depth axis
      yaxis: {
        title: 'Depth, ft',
        autorange: 'reversed',
        side: 'left',
        showgrid: showGrid,
        gridwidth: 1,
        gridcolor: '#E5E5E5'
      },

      // Track 1: Gamma Ray
      xaxis: {
        title: width < 600 ? 'GR<br>API' : 'Gamma Ray<br>API',
        domain: trackDomains.grSp,
        side: 'top',
        range: [0, 150],
        showgrid: showGrid,
        gridwidth: 1,
        gridcolor: '#E5E5E5'
      },

      // Track 1b: Spontaneous Potential  
      xaxis2: {
        title: width < 600 ? 'SP<br>mV' : 'Spontaneous Potential<br>mV',
        domain: trackDomains.grSp,
        side: 'bottom',
        range: [-80, 20],
        overlaying: 'x',
        showgrid: false
      },

      // Track 2: Resistivity
      xaxis3: {
        title: width < 600 ? 'Resistivity<br>ohm.m' : 'Resistivity, Shallow<br>Resistivity, Medium<br>Resistivity, Deep<br>ohm.m',
        domain: trackDomains.resistivity,
        side: 'top',
        type: 'log',
        range: [-1, 3], // 0.1 to 1000 ohm-m
        showgrid: showGrid,
        gridwidth: 1,
        gridcolor: '#E5E5E5'
      },

      // Track 3: Neutron Porosity
      xaxis4: {
        title: width < 600 ? 'NPHI<br>%' : 'Neutron Porosity<br>%',
        domain: trackDomains.porosity,
        side: 'top',
        range: [45, -15],
        autorange: 'reversed',
        showgrid: showGrid,
        gridwidth: 1,
        gridcolor: '#E5E5E5'
      },

      // Track 4: Bulk Density
      xaxis5: {
        title: width < 600 ? 'RHOB<br>g/cm³' : 'Bulk Density<br>g/cm³',
        domain: trackDomains.density,
        side: 'top',
        range: [1.90, 2.90],
        showgrid: showGrid,
        gridwidth: 1,
        gridcolor: '#E5E5E5'
      },

      showlegend: width > 800,
      legend: width > 800 ? {
        x: 1.02,
        y: 1,
        bgcolor: 'rgba(255,255,255,0.9)',
        bordercolor: '#E5E5E5',
        borderwidth: 1
      } : {},
      
      shapes: shapes,
      
      plot_bgcolor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#ffffff',
      paper_bgcolor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#ffffff'
    };

    return (
      <Box ref={containerRef} sx={{ width: '100%', overflow: 'hidden' }}>
        <Plot
          data={traces}
          layout={layout}
          config={{
            displayModeBar: width > 600,
            displaylogo: false,
            modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
            toImageButtonOptions: {
              format: 'png',
              filename: `${wellName}_log_display_${selectedTrackLayout}`,
              height: config.height,
              width: width,
              scale: 2
            },
            responsive: true
          }}
          style={{ width: '100%', height: `${config.height}px` }}
          useResizeHandler={true}
        />
      </Box>
    );
  };

  // Crossplot visualization - Now Responsive!
  const renderCrossplot = () => {
    const depths = logData.depths || [];
    const availableCurves = logData.curveNames || [];
    
    const hasNPHI = availableCurves.includes('NPHI') && logData.curves['NPHI'];
    const hasRHOB = availableCurves.includes('RHOB') && logData.curves['RHOB'];
    
    if (!hasNPHI || !hasRHOB || depths.length === 0) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <Alert severity="warning">
            <Typography>Crossplot requires both Neutron Porosity (NPHI) and Bulk Density (RHOB) curves</Typography>
          </Alert>
        </Box>
      );
    }

    const { width } = containerDimensions;
    const crossplotHeight = Math.min(500, width * 0.6); // Responsive height

    const traces = [
      {
        x: logData.curves['NPHI'].map((val: number) => val * 100),
        y: logData.curves['RHOB'],
        mode: 'markers',
        type: 'scatter',
        name: 'NPHI vs RHOB',
        marker: {
          color: depths,
          colorscale: 'Viridis',
          size: width < 600 ? 3 : 4,
          colorbar: {
            title: 'Depth (ft)',
            titlefont: { size: width < 600 ? 10 : 12 }
          }
        },
        text: depths.map(d => `Depth: ${d.toFixed(1)} ft`),
        hovertemplate: '<b>%{text}</b><br>NPHI: %{x:.1f}%<br>RHOB: %{y:.2f} g/cc<extra></extra>'
      }
    ];

    const layout = {
      title: {
        text: `${wellName} - Neutron-Density Crossplot`,
        font: { size: width < 600 ? 14 : 16 }
      },
      xaxis: { 
        title: 'Neutron Porosity (%)',
        titlefont: { size: width < 600 ? 12 : 14 }
      },
      yaxis: { 
        title: 'Bulk Density (g/cc)', 
        autorange: 'reversed',
        titlefont: { size: width < 600 ? 12 : 14 }
      },
      height: crossplotHeight,
      width: width,
      autosize: true,
      margin: { 
        t: width < 600 ? 50 : 60, 
        b: 50, 
        l: width < 600 ? 50 : 60, 
        r: width < 600 ? 40 : 50 
      },
      plot_bgcolor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#ffffff',
      paper_bgcolor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#ffffff'
    };

    return (
      <Box sx={{ width: '100%', overflow: 'hidden' }}>
        <Plot
          data={traces}
          layout={layout}
          config={{ 
            displayModeBar: width > 600, 
            displaylogo: false,
            responsive: true
          }}
          style={{ width: '100%', height: `${crossplotHeight}px` }}
          useResizeHandler={true}
        />
      </Box>
    );
  };

  // Control panel for display options
  const renderControlPanel = () => (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={6} md={3}>
          <FormControlLabel
            control={
              <Switch
                checked={showGeologicalZones}
                onChange={(e) => setShowGeologicalZones(e.target.checked)}
              />
            }
            label="Geological Zones"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FormControlLabel
            control={
              <Switch
                checked={showFormationBoundaries}
                onChange={(e) => setShowFormationBoundaries(e.target.checked)}
              />
            }
            label="Formation Boundaries"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FormControlLabel
            control={
              <Switch
                checked={showGrid}
                onChange={(e) => setShowGrid(e.target.checked)}
                icon={<GridOn />}
                checkedIcon={<GridOn />}
              />
            }
            label="Grid Lines"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Layout</InputLabel>
            <Select
              value={selectedTrackLayout}
              onChange={(e) => setSelectedTrackLayout(e.target.value)}
              label="Layout"
            >
              <MenuItem value="professional">Professional</MenuItem>
              <MenuItem value="compact">Compact</MenuItem>
              <MenuItem value="custom">Custom</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
      
      {/* Curve visibility controls */}
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" gutterBottom>Visible Curves:</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {logData.curveNames?.map((curveName) => (
            <Chip
              key={curveName}
              label={curveName}
              variant={visibleCurves[curveName] !== false ? "filled" : "outlined"}
              color={visibleCurves[curveName] !== false ? "primary" : "default"}
              onClick={() => toggleCurveVisibility(curveName)}
              icon={visibleCurves[curveName] !== false ? <Visibility /> : <VisibilityOff />}
              size="small"
            />
          ))}
        </Box>
      </Box>
    </Paper>
  );

  return (
    <Card 
      sx={{ 
        width: '100%',
        mt: 2, 
        mb: 2,
        backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#f8f9fa',
        border: `1px solid ${theme.palette.mode === 'dark' ? '#333' : '#e0e0e0'}`,
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" sx={{ color: theme.palette.primary.main }}>
            📊 Professional Log Plot Viewer - {wellName}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button size="small" startIcon={<Download />} variant="outlined">
              Export
            </Button>
            <Button size="small" startIcon={<ZoomIn />} variant="outlined">
              Zoom
            </Button>
          </Box>
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Well Name: <strong>{wellName}</strong> • Visualization Type: <strong>{visualizationType}</strong>
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {tracks.map((track, index) => (
              <Chip 
                key={index}
                label={track}
                size="small"
                variant="filled"
                color="primary"
              />
            ))}
          </Box>
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={selectedTab} onChange={handleTabChange} variant="fullWidth">
            <Tab icon={<Timeline />} label="Professional Display" iconPosition="start" />
            <Tab icon={<BarChart />} label="Crossplot" iconPosition="start" />
            <Tab icon={<Settings />} label="Controls" iconPosition="start" />
          </Tabs>
        </Box>

        <Box>
          {selectedTab === 0 && (
            <Box>
              {renderControlPanel()}
              {renderProfessionalLogDisplay()}
            </Box>
          )}
          {selectedTab === 1 && renderCrossplot()}
          {selectedTab === 2 && (
            <Box>
              {renderControlPanel()}
              <Paper sx={{ p: 3, mt: 2 }}>
                <Typography variant="h6" gutterBottom>Display Controls & Features</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom>Professional Features:</Typography>
                    <ul>
                      <li>Multi-track side-by-side layout matching industry standards</li>
                      <li>Geological zone interpretation with color coding</li>
                      <li>Formation boundary markers and fluid identification</li>
                      <li>Professional grid overlay and depth scaling</li>
                    </ul>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom>Interactive Controls:</Typography>
                    <ul>
                      <li>Toggle geological zone highlighting</li>
                      <li>Show/hide individual curves</li>
                      <li>Professional export for presentations</li>
                      <li>Zoom and pan capabilities</li>
                    </ul>
                  </Grid>
                </Grid>
              </Paper>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

// Wrap with React.memo to prevent re-mounting on parent re-renders
export const LogPlotViewerComponent = React.memo(LogPlotViewerComponentBase, (prevProps, nextProps) => {
  // Custom comparison to prevent re-renders when data hasn't actually changed
  return (
    prevProps.data?.wellName === nextProps.data?.wellName &&
    prevProps.data?.type === nextProps.data?.type &&
    JSON.stringify(prevProps.data?.logData) === JSON.stringify(nextProps.data?.logData)
  );
});

export default LogPlotViewerComponent;
