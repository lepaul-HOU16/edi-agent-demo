import React, { useState } from 'react';
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
  Alert
} from '@mui/material';
import {
  Layers,
  BarChart,
  Timeline,
  Settings,
  Download,
  ZoomIn
} from '@mui/icons-material';
import dynamic from 'next/dynamic';

// Dynamic import for Plotly to avoid SSR issues
const Plot = dynamic(() => import('react-plotly.js'), {
  ssr: false,
  loading: () => (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
      <Typography>Loading interactive visualization...</Typography>
    </Box>
  )
}) as any;

interface LogPlotViewerProps {
  data: any;
}

export const LogPlotViewerComponent: React.FC<LogPlotViewerProps> = ({ data }) => {
  const theme = useTheme();
  const [selectedTab, setSelectedTab] = useState(0);

  // Extract well information
  const wellName = data?.wellName || 'CARBONATE_PLATFORM_002';
  const tracks = data?.tracks || ['gammaRay', 'porosity', 'resistivity', 'calculated'];
  const visualizationType = data?.type || 'logPlotViewer';

  // Generate sample log data for demonstration
  const generateLogData = () => {
    const depths = [];
    const gammaRay = [];
    const porosity = [];
    const resistivity = [];
    const calculated = [];

    for (let i = 0; i <= 500; i += 0.5) {
      const depth = 2000 + i;
      depths.push(depth);
      
      // Realistic gamma ray curve with geological variation
      const baseGR = 45 + 30 * Math.sin(i * 0.02) + 15 * Math.sin(i * 0.05) + 10 * Math.random();
      gammaRay.push(Math.max(20, Math.min(150, baseGR)));
      
      // Porosity with inverse relationship to GR in clean sands
      const basePor = 25 - (baseGR - 45) * 0.3 + 5 * Math.sin(i * 0.03) + 3 * Math.random();
      porosity.push(Math.max(5, Math.min(35, basePor)));
      
      // Resistivity with hydrocarbon effects
      const baseRes = depth > 2200 && depth < 2350 ? 50 + 100 * Math.random() : 5 + 15 * Math.random();
      resistivity.push(Math.max(0.5, baseRes));
      
      // Calculated shale volume
      const vsh = Math.max(0, Math.min(1, (baseGR - 25) / (120 - 25)));
      calculated.push(vsh * 100);
    }

    return { depths, gammaRay, porosity, resistivity, calculated };
  };

  const logData = generateLogData();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  // Multi-track log plot
  const renderLogPlot = () => {
    const traces = [
      {
        x: logData.gammaRay,
        y: logData.depths,
        mode: 'lines',
        name: 'Gamma Ray (API)',
        line: { color: '#22C55E', width: 1 },
        xaxis: 'x1',
        yaxis: 'y'
      },
      {
        x: logData.porosity,
        y: logData.depths,
        mode: 'lines',
        name: 'Porosity (%)',
        line: { color: '#3B82F6', width: 1 },
        xaxis: 'x2',
        yaxis: 'y'
      },
      {
        x: logData.resistivity,
        y: logData.depths,
        mode: 'lines',
        name: 'Resistivity (ohm-m)',
        line: { color: '#EF4444', width: 1 },
        xaxis: 'x3',
        yaxis: 'y'
      },
      {
        x: logData.calculated,
        y: logData.depths,
        mode: 'lines',
        name: 'Shale Volume (%)',
        line: { color: '#F59E0B', width: 1 },
        fill: 'tonextx',
        fillcolor: 'rgba(245, 158, 11, 0.3)',
        xaxis: 'x4',
        yaxis: 'y'
      }
    ];

    const layout = {
      title: `${wellName} - Multi-Track Log Display`,
      height: 600,
      yaxis: {
        title: 'Depth (ft)',
        autorange: 'reversed',
        side: 'left'
      },
      xaxis1: {
        title: 'GR (API)',
        domain: [0, 0.2],
        side: 'top',
        range: [0, 150]
      },
      xaxis2: {
        title: 'POR (%)',
        domain: [0.25, 0.45],
        side: 'top',
        range: [0, 40]
      },
      xaxis3: {
        title: 'RES (ohm)',
        domain: [0.5, 0.7],
        side: 'top',
        type: 'log',
        range: [0, 2]
      },
      xaxis4: {
        title: 'VSH (%)',
        domain: [0.75, 0.95],
        side: 'top',
        range: [0, 100]
      },
      margin: { t: 80, b: 50, l: 80, r: 50 },
      showlegend: true,
      legend: { x: 1, y: 1 }
    };

    return (
      <Plot
        data={traces}
        layout={layout}
        config={{
          displayModeBar: true,
          displaylogo: false,
          modeBarButtonsToRemove: ['pan2d', 'lasso2d']
        }}
        style={{ width: '100%', height: '600px' }}
      />
    );
  };

  // Crossplot visualization
  const renderCrossplot = () => {
    const traces = [
      {
        x: logData.porosity,
        y: logData.gammaRay,
        mode: 'markers',
        type: 'scatter',
        name: 'Porosity vs GR',
        marker: {
          color: logData.depths,
          colorscale: 'Viridis',
          size: 4,
          colorbar: {
            title: 'Depth (ft)'
          }
        },
        text: logData.depths.map(d => `Depth: ${d.toFixed(1)} ft`),
        hovertemplate: '<b>%{text}</b><br>Porosity: %{x:.1f}%<br>Gamma Ray: %{y:.1f} API<extra></extra>'
      }
    ];

    const layout = {
      title: `${wellName} - Porosity vs Gamma Ray Crossplot`,
      xaxis: { title: 'Porosity (%)' },
      yaxis: { title: 'Gamma Ray (API)' },
      height: 500,
      margin: { t: 60, b: 50, l: 60, r: 50 }
    };

    return (
      <Plot
        data={traces}
        layout={layout}
        config={{ displayModeBar: true, displaylogo: false }}
        style={{ width: '100%', height: '500px' }}
      />
    );
  };

  // Statistics and analysis
  const renderStatistics = () => {
    const grStats = {
      min: Math.min(...logData.gammaRay),
      max: Math.max(...logData.gammaRay),
      mean: logData.gammaRay.reduce((a, b) => a + b, 0) / logData.gammaRay.length
    };

    const porStats = {
      min: Math.min(...logData.porosity),
      max: Math.max(...logData.porosity),
      mean: logData.porosity.reduce((a, b) => a + b, 0) / logData.porosity.length
    };

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Gamma Ray Statistics</Typography>
            <Stack spacing={1}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Minimum:</Typography>
                <Typography variant="body2" fontWeight="bold">{grStats.min.toFixed(1)} API</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Maximum:</Typography>
                <Typography variant="body2" fontWeight="bold">{grStats.max.toFixed(1)} API</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Mean:</Typography>
                <Typography variant="body2" fontWeight="bold">{grStats.mean.toFixed(1)} API</Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Porosity Statistics</Typography>
            <Stack spacing={1}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Minimum:</Typography>
                <Typography variant="body2" fontWeight="bold">{porStats.min.toFixed(1)}%</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Maximum:</Typography>
                <Typography variant="body2" fontWeight="bold">{porStats.max.toFixed(1)}%</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Mean:</Typography>
                <Typography variant="body2" fontWeight="bold">{porStats.mean.toFixed(1)}%</Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Alert severity="info">
            <Typography variant="body2">
              <strong>Analysis Summary:</strong> The gamma ray log shows typical carbonate platform characteristics 
              with clean limestone intervals (low GR) and higher values indicating clay-rich zones. 
              Porosity values are consistent with good reservoir quality in the cleaner intervals.
            </Typography>
          </Alert>
        </Grid>
      </Grid>
    );
  };

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
            📊 Log Plot Viewer - {wellName}
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
            <Tab icon={<Timeline />} label="Log Tracks" iconPosition="start" />
            <Tab icon={<BarChart />} label="Crossplot" iconPosition="start" />
            <Tab icon={<Settings />} label="Statistics" iconPosition="start" />
          </Tabs>
        </Box>

        <Box>
          {selectedTab === 0 && renderLogPlot()}
          {selectedTab === 1 && renderCrossplot()}
          {selectedTab === 2 && renderStatistics()}
        </Box>
      </CardContent>
    </Card>
  );
};

export default LogPlotViewerComponent;
