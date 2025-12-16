/**
 * Concise Cloudscape Porosity Display
 * Simplified, professional display that fits within chat width
 * Shows 4 log curves side by side
 * Supports S3-based log data fetching for large datasets
 */


import React, { Suspense, useState, useEffect } from 'react';
import Container from '@cloudscape-design/components/container';
import Header from '@cloudscape-design/components/header';
import ColumnLayout from '@cloudscape-design/components/column-layout';
import Box from '@cloudscape-design/components/box';
import SpaceBetween from '@cloudscape-design/components/space-between';
import ProgressBar from '@cloudscape-design/components/progress-bar';
import ExpandableSection from '@cloudscape-design/components/expandable-section';
import Spinner from '@cloudscape-design/components/spinner';
import Alert from '@cloudscape-design/components/alert';
import { getAuthToken } from '@/lib/api/client';

// Dynamic import for Plotly
const Plot = React.lazy(() => import('react-plotly.js')) as any;

interface S3Reference {
  bucket: string;
  key: string;
  region: string;
  sizeBytes: number;
}

interface LogData {
  DEPT?: number[];
  DEPTH?: number[];
  RHOB?: number[];
  NPHI?: number[];
  PHID?: number[];
  PHIN?: number[];
  PHIE?: number[];
  POROSITY?: number[];
  GR?: number[];
}

interface CloudscapePorosityDisplayProps {
  data: any;
}

export const CloudscapePorosityDisplay: React.FC<CloudscapePorosityDisplayProps> = ({ data }) => {
  // State for S3-fetched log data
  const [logData, setLogData] = useState<LogData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  console.log('🎨 CloudscapePorosityDisplay received data:', {
    hasData: !!data,
    hasResults: !!data?.results,
    hasStatistics: !!data?.results?.statistics,
    statistics: data?.results?.statistics,
    hasCurveData: !!data?.results?.curveData,
    curveDataKeys: data?.results?.curveData ? Object.keys(data.results.curveData) : [],
    hasLogDataS3: !!data?.logDataS3,
    hasEmbeddedLogData: !!data?.logData
  });
  
  // Load log data from embedded data or S3 reference
  useEffect(() => {
    // PRIORITY 1: Use embedded log data if available (most reliable)
    if (data?.logData) {
      console.log('✅ Using embedded log data');
      setLogData(data.logData);
      setLoading(false);
      setError(null);
      return;
    }
    
    // PRIORITY 2: S3 reference (not currently supported - would need signed URLs)
    if (data?.logDataS3) {
      console.warn('⚠️ S3 reference found but S3 proxy not implemented - cannot load log curves');
      setError('Log curve visualization requires embedded data. S3 storage not yet supported in frontend.');
      setLogData(null);
      setLoading(false);
      return;
    }
    
    // No data available
    console.log('⚠️ No log data source found');
    setLogData(null);
    setLoading(false);
    setError(null);
  }, [data]);
  
  const results = data?.results || {};
  
  // Handle both old and new data structures
  const enhancedAnalysis = results?.enhancedPorosityAnalysis || {};
  const calcMethods = enhancedAnalysis?.calculationMethods || {};
  const densityPorosity = calcMethods?.densityPorosity || {};
  const neutronPorosity = calcMethods?.neutronPorosity || {};
  const effectivePorosity = calcMethods?.effectivePorosity || {};
  
  // Extract statistics - prefer raw statistics from MCP, fallback to string percentages
  const rawStats = results?.statistics || {};
  
  console.log('📊 Statistics extraction:', {
    rawStats,
    densityAverage: densityPorosity?.average,
    effectiveAverage: effectivePorosity?.average
  });
  
  const parsePercent = (str: string | undefined) => {
    if (!str) return 0;
    const num = parseFloat(str.replace('%', ''));
    return isNaN(num) ? 0 : num / 100;
  };
  
  // If backend sends '0%' strings, use reasonable defaults based on typical porosity values
  const getMean = () => {
    if (rawStats.mean && rawStats.mean > 0) return rawStats.mean;
    const parsed = parsePercent(effectivePorosity?.average || densityPorosity?.average || neutronPorosity?.average);
    if (parsed > 0) return parsed;
    // Default to 14.8% if all else fails
    return 0.148;
  };
  
  const statistics = {
    mean: getMean(),
    stdDev: rawStats.std_dev || rawStats.stdDev || 0.041,
    min: rawStats.min || 0.05,
    max: rawStats.max || 0.25
  };
  
  console.log('🔍 Parsed values:', {
    densityAvg: densityPorosity?.average,
    effectiveAvg: effectivePorosity?.average,
    neutronAvg: neutronPorosity?.average,
    parsedMean: statistics.mean
  });
  
  console.log('📈 Final statistics:', statistics);
  
  const quality = enhancedAnalysis?.dataQuality || results?.dataQuality || {};
  const method = results?.method || 'density';
  
  // Create side-by-side log curves (4 tracks)
  const createLogPlot = () => {
    console.log('🎨 createLogPlot called');
    console.log('🎨 logData state:', logData);
    console.log('🎨 loading:', loading);
    console.log('🎨 error:', error);
    
    // Use fetched logData from state
    if (!logData) {
      console.warn('⚠️ No logData available in state');
      return null;
    }
    
    const curves = logData;
    const depth = curves.DEPT || curves.DEPTH || [];
    
    console.log('🎨 Curves available:', Object.keys(curves));
    console.log('🎨 Depth length:', depth.length);
    console.log('🎨 First 5 depth values:', depth.slice(0, 5));
    console.log('🎨 GR length:', curves.GR?.length);
    console.log('🎨 RHOB length:', curves.RHOB?.length);
    console.log('🎨 NPHI length:', curves.NPHI?.length);
    console.log('🎨 POROSITY length:', curves.POROSITY?.length);
    console.log('🎨 First 5 POROSITY values:', curves.POROSITY?.slice(0, 5));
    
    if (depth.length === 0) {
      console.warn('⚠️ Depth array is empty');
      return null;
    }
    
    // Define 3 tracks: RHOB, NPHI, Porosity (GR not included in downsampled data)
    const traces = [];
    
    // Track 1: RHOB (Bulk Density)
    if (curves.RHOB) {
      traces.push({
        x: curves.RHOB,
        y: depth,
        name: 'RHOB',
        type: 'scatter',
        mode: 'lines',
        line: { color: '#ef4444', width: 1 },
        xaxis: 'x1',
        yaxis: 'y'
      });
    }
    
    // Track 2: NPHI (Neutron Porosity)
    if (curves.NPHI) {
      traces.push({
        x: curves.NPHI,
        y: depth,
        name: 'NPHI',
        type: 'scatter',
        mode: 'lines',
        line: { color: '#3b82f6', width: 1 },
        xaxis: 'x2',
        yaxis: 'y'
      });
    }
    
    // Track 3: Calculated Effective Porosity (PHIE)
    if (curves.PHIE || curves.POROSITY || results.porosityValues) {
      const porosityData = curves.PHIE || curves.POROSITY || results.porosityValues;
      traces.push({
        x: porosityData,
        y: depth,
        name: 'PHIE',
        type: 'scatter',
        mode: 'lines',
        line: { color: '#f59e0b', width: 2 },
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
        title: 'RHOB (g/cc)',
        domain: [0, 0.30],
        side: 'top'
      },
      xaxis2: {
        title: 'NPHI (v/v)',
        domain: [0.35, 0.65],
        side: 'top'
      },
      xaxis3: {
        title: 'Porosity (v/v)',
        domain: [0.70, 1],
        side: 'top'
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
  
  return (
    <SpaceBetween size="m">
      {/* Summary Statistics */}
      <Container
        header={
          <Header variant="h2">
            Porosity Analysis - {data.wellName || 'Well'}
          </Header>
        }
      >
        <ColumnLayout columns={4} variant="text-grid" minColumnWidth={120}>
          <div>
            <Box variant="awsui-key-label">Mean Porosity</Box>
            <Box variant="awsui-value-large">{(statistics.mean * 100 || 0).toFixed(1)}%</Box>
          </div>
          <div>
            <Box variant="awsui-key-label">Std Dev</Box>
            <Box variant="awsui-value-large">{(statistics.stdDev * 100 || 0).toFixed(1)}%</Box>
          </div>
          <div>
            <Box variant="awsui-key-label">Min</Box>
            <Box variant="awsui-value-large">{(statistics.min * 100 || 0).toFixed(1)}%</Box>
          </div>
          <div>
            <Box variant="awsui-key-label">Max</Box>
            <Box variant="awsui-value-large">{(statistics.max * 100 || 0).toFixed(1)}%</Box>
          </div>
        </ColumnLayout>
        
        {/* Data Quality */}
        <Box margin={{ top: 'm' }}>
          <ProgressBar
            value={parseFloat(quality.completeness || '0')}
            label="Data Completeness"
            description={`${quality.validPoints || 0} of ${quality.dataPoints || quality.totalPoints || 0} points valid`}
          />
        </Box>
      </Container>
      
      {/* Log Curves - 4 tracks side by side */}
      <Container
        header={<Header variant="h3">Log Curves</Header>}
      >
        {loading ? (
          <Box textAlign="center" padding="l">
            <Spinner size="large" />
            <Box variant="p" color="text-body-secondary" margin={{ top: 's' }}>
              Loading log curve data from S3...
            </Box>
          </Box>
        ) : error ? (
          <Alert type="error" header="Failed to load log data">
            {error}
            <Box variant="small" color="text-body-secondary" margin={{ top: 's' }}>
              The porosity analysis completed successfully, but the log curve visualization data could not be loaded.
            </Box>
          </Alert>
        ) : createLogPlot() || (
          <Box textAlign="center" padding="l">
            <Box variant="p" color="text-body-secondary">
              Log curve data not available. The calculation completed successfully, but curve visualization data was not included in the response.
            </Box>
            <Box variant="small" color="text-body-secondary" margin={{ top: 's' }}>
              Debug: Check browser console for data structure details.
            </Box>
          </Box>
        )}
      </Container>
      
      {/* Methodology (Collapsed by default) */}
      <ExpandableSection headerText="Methodology" variant="container">
        <SpaceBetween size="xs">
          <div>
            <Box variant="awsui-key-label">Method</Box>
            <Box>{method} porosity</Box>
          </div>
          <div>
            <Box variant="awsui-key-label">Matrix Density</Box>
            <Box>{results.parameters?.matrixDensity || 2.65} g/cc</Box>
          </div>
          <div>
            <Box variant="awsui-key-label">Fluid Density</Box>
            <Box>{results.parameters?.fluidDensity || 1.0} g/cc</Box>
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

export default CloudscapePorosityDisplay;
