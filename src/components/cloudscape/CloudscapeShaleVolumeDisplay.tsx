/**
 * Cloudscape Shale Volume Display
 * Professional display for shale volume analysis using Cloudscape Design System
 * Shows GR curve, Vsh distribution, and methodology
 */

'use client';

import React from 'react';
import Container from '@cloudscape-design/components/container';
import Header from '@cloudscape-design/components/header';
import ColumnLayout from '@cloudscape-design/components/column-layout';
import Box from '@cloudscape-design/components/box';
import SpaceBetween from '@cloudscape-design/components/space-between';
import ProgressBar from '@cloudscape-design/components/progress-bar';
import ExpandableSection from '@cloudscape-design/components/expandable-section';
import dynamic from 'next/dynamic';

// Dynamic import for Plotly
const Plot = dynamic(() => import('react-plotly.js'), {
  ssr: false,
  loading: () => <div>Loading chart...</div>
}) as any;

interface CloudscapeShaleVolumeDisplayProps {
  data: any;
}

export const CloudscapeShaleVolumeDisplay: React.FC<CloudscapeShaleVolumeDisplayProps> = ({ data }) => {
  const results = data?.results || {};
  const statistics = results?.statistics || {};
  const quality = results?.dataQuality || {};
  const method = results?.method || 'linear';
  
  // Create log plot with GR and Vsh
  const createLogPlot = () => {
    if (!results?.curveData) return null;
    
    const curves = results.curveData;
    const depth = curves.DEPT || curves.DEPTH || [];
    
    const traces = [];
    
    // Track 1: GR (Gamma Ray)
    if (curves.GR) {
      traces.push({
        x: curves.GR,
        y: depth,
        name: 'GR',
        type: 'scatter',
        mode: 'lines',
        line: { color: '#10b981', width: 1 },
        xaxis: 'x1',
        yaxis: 'y'
      });
    }
    
    // Track 2: Vsh (Shale Volume)
    if (curves.VSH || results.vshValues) {
      const vshData = curves.VSH || results.vshValues;
      traces.push({
        x: vshData,
        y: depth,
        name: 'Vsh',
        type: 'scatter',
        mode: 'lines',
        line: { color: '#8b4513', width: 2 },
        fill: 'tozerox',
        fillcolor: 'rgba(139, 69, 19, 0.2)',
        xaxis: 'x2',
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
        title: 'GR (API)',
        domain: [0, 0.45],
        side: 'top'
      },
      xaxis2: {
        title: 'Vsh (v/v)',
        domain: [0.55, 1],
        side: 'top',
        range: [0, 1]
      },
      plot_bgcolor: '#ffffff',
      paper_bgcolor: '#ffffff'
    };
    
    const config = {
      displayModeBar: false,
      responsive: true
    };
    
    return <Plot data={traces} layout={layout} config={config} style={{ width: '100%' }} />;
  };
  
  return (
    <SpaceBetween size="m">
      {/* Summary Statistics */}
      <Container
        header={
          <Header variant="h2">
            Shale Volume Analysis - {data.wellName || 'Well'}
          </Header>
        }
      >
        <ColumnLayout columns={4} variant="text-grid">
          <div>
            <Box variant="awsui-key-label">Mean Vsh</Box>
            <Box variant="awsui-value-large">{(statistics.mean * 100 || 0).toFixed(1)}%</Box>
          </div>
          <div>
            <Box variant="awsui-key-label">Net/Gross</Box>
            <Box variant="awsui-value-large">{((1 - statistics.mean) * 100 || 0).toFixed(1)}%</Box>
          </div>
          <div>
            <Box variant="awsui-key-label">GR Min</Box>
            <Box variant="awsui-value-large">{results.parameters?.grMin || 0} API</Box>
          </div>
          <div>
            <Box variant="awsui-key-label">GR Max</Box>
            <Box variant="awsui-value-large">{results.parameters?.grMax || 0} API</Box>
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
      <ExpandableSection headerText="Methodology" variant="container">
        <SpaceBetween size="xs">
          <div>
            <Box variant="awsui-key-label">Method</Box>
            <Box>{method} (Larionov)</Box>
          </div>
          <div>
            <Box variant="awsui-key-label">GR Clean</Box>
            <Box>{results.parameters?.grMin || 0} API</Box>
          </div>
          <div>
            <Box variant="awsui-key-label">GR Shale</Box>
            <Box>{results.parameters?.grMax || 0} API</Box>
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

export default CloudscapeShaleVolumeDisplay;
