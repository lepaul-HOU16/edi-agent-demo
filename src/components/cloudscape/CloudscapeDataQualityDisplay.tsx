import React, { Suspense } from 'react';
import Container from '@cloudscape-design/components/container';
import Header from '@cloudscape-design/components/header';
import ColumnLayout from '@cloudscape-design/components/column-layout';
import Box from '@cloudscape-design/components/box';
import SpaceBetween from '@cloudscape-design/components/space-between';
import ProgressBar from '@cloudscape-design/components/progress-bar';
import Badge from '@cloudscape-design/components/badge';
import Spinner from '@cloudscape-design/components/spinner';

// Dynamic import for Plotly
const Plot = React.lazy(() => import('react-plotly.js')) as any;

interface CloudscapeDataQualityDisplayProps {
  data?: any;
  artifact?: any;
}

export const CloudscapeDataQualityDisplay: React.FC<CloudscapeDataQualityDisplayProps> = ({ data, artifact }) => {
  // Support both 'data' and 'artifact' props for backwards compatibility
  const artifactData = data || artifact;
  const results = artifactData?.results || {};
  const summary = results?.summary || {};
  const curves = results?.curves || [];
  const overallQuality = results?.overall_quality || 'unknown';
  
  // Debug logging
  console.log('🔍 CloudscapeDataQualityDisplay render:', {
    hasData: !!data,
    hasArtifact: !!artifact,
    hasArtifactData: !!artifactData,
    hasSummary: !!summary,
    averageCompleteness: summary?.average_completeness,
    shouldShowProgressBar: summary.average_completeness !== undefined
  });
  
  // Quality badge color mapping
  const getQualityColor = (quality: string) => {
    switch (quality?.toLowerCase()) {
      case 'excellent': return 'green';
      case 'good': return 'blue';
      case 'fair': return 'grey';
      case 'poor': return 'red';
      default: return 'grey';
    }
  };
  
  // Create completeness bar chart - only if data exists
  const createCompletenessChart = () => {
    if (!curves || curves.length === 0) return null;
    
    // Filter out curves with missing completeness data
    const validCurves = curves.filter((c: any) => 
      c.data_completeness !== undefined && 
      c.data_completeness !== null && 
      !isNaN(c.data_completeness)
    );
    
    if (validCurves.length === 0) {
      return (
        <Box textAlign="center" padding="l" color="text-body-secondary">
          No completeness data available
        </Box>
      );
    }
    
    const sortedCurves = [...validCurves].sort((a: any, b: any) => b.data_completeness - a.data_completeness);
    
    const trace = {
      x: sortedCurves.map((c: any) => c.data_completeness * 100),
      y: sortedCurves.map((c: any) => c.curve_name),
      type: 'bar',
      orientation: 'h',
      marker: {
        color: sortedCurves.map((c: any) => {
          const comp = c.data_completeness;
          if (comp >= 0.95) return '#037f0c';
          if (comp >= 0.85) return '#0972d3';
          if (comp >= 0.70) return '#8d6605';
          return '#d91515';
        })
      },
      text: sortedCurves.map((c: any) => `${(c.data_completeness * 100).toFixed(1)}%`),
      textposition: 'outside',
      hovertemplate: '<b>%{y}</b><br>Completeness: %{x:.1f}%<extra></extra>'
    };
    
    const layout = {
      height: Math.max(300, validCurves.length * 40),
      margin: { l: 80, r: 40, t: 20, b: 40 },
      xaxis: {
        title: 'Data Completeness (%)',
        range: [0, 105],
        showgrid: true,
        gridcolor: '#e5e5e5'
      },
      yaxis: {
        automargin: true
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
        <Plot data={[trace]} layout={layout} config={config} style={{ width: '100%' }} />
      </Suspense>
    );
  };
  
  return (
    <SpaceBetween size="m">
      {/* Overall Quality Summary */}
      <Container
        header={
          <Header 
            variant="h2"
            actions={
              <Badge color={getQualityColor(overallQuality)}>
                {overallQuality?.toUpperCase()}
              </Badge>
            }
          >
            Data Quality Assessment - {artifactData?.wellName || results.well_name}
          </Header>
        }
      >
        <ColumnLayout columns={4} variant="text-grid">
          <div>
            <Box variant="awsui-key-label">Curves Analyzed</Box>
            <Box variant="awsui-value-large">{summary.total_curves || curves.length}</Box>
          </div>
          <div>
            <Box variant="awsui-key-label">Avg Completeness</Box>
            <Box variant="awsui-value-large">
              {((summary.average_completeness || 0) * 100).toFixed(1)}%
            </Box>
          </div>
          <div>
            <Box variant="awsui-key-label">Avg Outliers</Box>
            <Box variant="awsui-value-large">
              {((summary.average_outliers || 0) * 100).toFixed(1)}%
            </Box>
          </div>
          <div>
            <Box variant="awsui-key-label">Avg Noise</Box>
            <Box variant="awsui-value-large">
              {Math.min(((summary.average_noise || 0) * 100), 100).toFixed(1)}%
            </Box>
          </div>
        </ColumnLayout>
        
        {/* Overall Progress Bar */}
        {summary.average_completeness !== undefined && (
          <Box margin={{ top: 'm' }}>
            <ProgressBar
              value={(summary.average_completeness || 0) * 100}
              label="Overall Data Completeness"
              description={`Average completeness across ${summary.total_curves || curves.length} curves`}
            />
          </Box>
        )}
      </Container>
      
      {/* Completeness Chart - only show if data exists */}
      {curves.some((c: any) => c.data_completeness !== undefined && !isNaN(c.data_completeness)) && (
        <Container
          header={<Header variant="h3">Data Completeness by Curve</Header>}
        >
          {createCompletenessChart()}
        </Container>
      )}
      
      {/* Curve Details Table - compact grid layout */}
      <Container
        header={<Header variant="h3">Curve Quality Summary</Header>}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
          {curves.map((curve: any, idx: number) => (
            <div key={idx} style={{ padding: '12px', border: '1px solid #e5e5e5', borderRadius: '4px' }}>
              <SpaceBetween size="xxs">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <Box variant="strong">{curve.curve_name}</Box>
                  {curve.quality_flag && (
                    <Badge color={getQualityColor(curve.quality_flag)}>
                      {curve.quality_flag.toUpperCase()}
                    </Badge>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
                  {curve.data_completeness !== undefined && !isNaN(curve.data_completeness) && (
                    <div>
                      <Box variant="small" color="text-body-secondary">Complete</Box>
                      <Box>{(curve.data_completeness * 100).toFixed(1)}%</Box>
                    </div>
                  )}
                  {curve.outlier_percentage !== undefined && !isNaN(curve.outlier_percentage) && (
                    <div>
                      <Box variant="small" color="text-body-secondary">Outliers</Box>
                      <Box>{(curve.outlier_percentage * 100).toFixed(1)}%</Box>
                    </div>
                  )}
                  {curve.noise_level !== undefined && !isNaN(curve.noise_level) && (
                    <div>
                      <Box variant="small" color="text-body-secondary">Noise</Box>
                      <Box>{Math.min((curve.noise_level * 100), 100).toFixed(1)}%</Box>
                    </div>
                  )}
                </div>
              </SpaceBetween>
            </div>
          ))}
        </div>
      </Container>
    </SpaceBetween>
  );
};

export default CloudscapeDataQualityDisplay;
