/**
 * Cloudscape Water Saturation Display
 * Professional display for water saturation analysis using Cloudscape Design System
 * Shows resistivity curves, Sw distribution, and Archie parameters
 */


import React, { Suspense } from 'react';
import Container from '@cloudscape-design/components/container';
import Header from '@cloudscape-design/components/header';
import ColumnLayout from '@cloudscape-design/components/column-layout';
import Box from '@cloudscape-design/components/box';
import SpaceBetween from '@cloudscape-design/components/space-between';
import ProgressBar from '@cloudscape-design/components/progress-bar';
import ExpandableSection from '@cloudscape-design/components/expandable-section';
import Spinner from '@cloudscape-design/components/spinner';

// Dynamic import for Plotly
const Plot = React.lazy(() => import('react-plotly.js')) as any;

interface CloudscapeSaturationDisplayProps {
  data: any;
}

export const CloudscapeSaturationDisplay: React.FC<CloudscapeSaturationDisplayProps> = ({ data }) => {
  const results = data?.results || {};
  const statistics = results?.statistics || {};
  const quality = results?.dataQuality || {};
  const method = results?.method || 'archie';
  
  // Create log plot with resistivity and Sw
  const createLogPlot = () => {
    if (!results?.curveData) return null;
    
    const curves = results.curveData;
    const depth = curves.DEPT || curves.DEPTH || [];
    
    const traces = [];
    
    // Track 1: Resistivity (RT)
    if (curves.RT) {
      traces.push({
        x: curves.RT,
        y: depth,
        name: 'RT',
        type: 'scatter',
        mode: 'lines',
        line: { color: '#dc2626', width: 1 },
        xaxis: 'x1',
        yaxis: 'y'
      });
    }
    
    // Track 2: Water Saturation (Sw)
    if (curves.SW) {
      traces.push({
        x: curves.SW,
        y: depth,
        name: 'Sw',
        type: 'scatter',
        mode: 'lines',
        line: { color: '#2563eb', width: 2 },
        fill: 'tozerox',
        fillcolor: 'rgba(37, 99, 235, 0.2)',
        xaxis: 'x2',
        yaxis: 'y'
      });
    }
    
    // Track 3: Porosity (NPHI or RHOB derived)
    if (curves.NPHI) {
      traces.push({
        x: curves.NPHI,
        y: depth,
        name: 'NPHI',
        type: 'scatter',
        mode: 'lines',
        line: { color: '#16a34a', width: 1 },
        xaxis: 'x3',
        yaxis: 'y'
      });
    }
    
    const layout = {
      height: 400,
      margin: { l: 60, r: 20, t: 20, b: 40 },
      showlegend: false,
      yaxis: {
        title: 'Depth (ft)',
        autorange: 'reversed',
        domain: [0, 1]
      },
      xaxis: {
        title: 'RT (ohm-m)',
        domain: [0, 0.3],
        side: 'top',
        type: 'log'
      },
      xaxis2: {
        title: 'Sw (v/v)',
        domain: [0.35, 0.65],
        side: 'top',
        range: [0, 1]
      },
      xaxis3: {
        title: 'NPHI (v/v)',
        domain: [0.7, 1],
        side: 'top',
        range: [0.45, -0.15],
        autorange: 'reversed'
      },
      plot_bgcolor: '#ffffff',
      paper_bgcolor: '#ffffff'
    };
    
    const config = {
      displayModeBar: false,
      responsive: true
    };
    
    return (
      <Suspense fallback={<Box textAlign="center" padding="l"><Spinner size="large" /></Box>}>
        <Plot data={traces} layout={layout} config={config} style={{ width: '100%' }} />
      </Suspense>
    );
  };
  
  // Calculate hydrocarbon saturation
  const shMean = 1 - (statistics.mean || 0);
  
  return (
    <SpaceBetween size="m">
      {/* Summary Statistics */}
      <Container
        header={
          <Header variant="h2">
            Water Saturation Analysis - {data.wellName || 'Well'}
          </Header>
        }
      >
        <ColumnLayout columns={4} variant="text-grid">
          <div>
            <Box variant="awsui-key-label">Mean Sw</Box>
            <Box variant="awsui-value-large">{(statistics.mean * 100 || 0).toFixed(1)}%</Box>
          </div>
          <div>
            <Box variant="awsui-key-label">Mean Sh</Box>
            <Box variant="awsui-value-large" color="text-status-success">
              {(shMean * 100).toFixed(1)}%
            </Box>
          </div>
          <div>
            <Box variant="awsui-key-label">Sw Range</Box>
            <Box variant="awsui-value-large">
              {(statistics.min * 100 || 0).toFixed(0)}-{(statistics.max * 100 || 0).toFixed(0)}%
            </Box>
          </div>
          <div>
            <Box variant="awsui-key-label">Method</Box>
            <Box variant="awsui-value-large">{method.toUpperCase()}</Box>
          </div>
        </ColumnLayout>
        
        {/* Data Quality */}
        <Box margin={{ top: 'm' }}>
          <ProgressBar
            value={quality.completeness || 0}
            label="Data Completeness"
            description={`${quality.validPoints || 0} of ${quality.totalPoints || 0} points valid`}
          />
        </Box>
      </Container>
      
      {/* Log Curves */}
      <Container
        header={<Header variant="h3">Log Curves</Header>}
      >
        {createLogPlot()}
      </Container>
      
      {/* Methodology */}
      <ExpandableSection headerText="Archie Parameters" variant="container">
        <SpaceBetween size="xs">
          <div>
            <Box variant="awsui-key-label">Method</Box>
            <Box>Archie Equation</Box>
          </div>
          <div>
            <Box variant="awsui-key-label">Tortuosity (a)</Box>
            <Box>{results.parameters?.a || 1.0}</Box>
          </div>
          <div>
            <Box variant="awsui-key-label">Cementation (m)</Box>
            <Box>{results.parameters?.m || 2.0}</Box>
          </div>
          <div>
            <Box variant="awsui-key-label">Saturation (n)</Box>
            <Box>{results.parameters?.n || 2.0}</Box>
          </div>
          <div>
            <Box variant="awsui-key-label">Rw (ohm-m)</Box>
            <Box>{results.parameters?.rw || 0.1}</Box>
          </div>
          <div>
            <Box variant="awsui-key-label">Standard</Box>
            <Box>SPE/API RP 40</Box>
          </div>
        </SpaceBetween>
      </ExpandableSection>
    </SpaceBetween>
  );
};

export default CloudscapeSaturationDisplay;
