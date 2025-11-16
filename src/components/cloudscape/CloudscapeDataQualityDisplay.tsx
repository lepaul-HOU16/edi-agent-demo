/**
 * Cloudscape Data Quality Display
 * Professional display for well data quality assessment
 * Shows completeness metrics with color-coded progress bars
 */


import React from 'react';
import Container from '@cloudscape-design/components/container';
import Header from '@cloudscape-design/components/header';
import ColumnLayout from '@cloudscape-design/components/column-layout';
import Box from '@cloudscape-design/components/box';
import SpaceBetween from '@cloudscape-design/components/space-between';
import ProgressBar from '@cloudscape-design/components/progress-bar';
import StatusIndicator from '@cloudscape-design/components/status-indicator';
import ExpandableSection from '@cloudscape-design/components/expandable-section';

interface CurveQuality {
  curve: string;
  completeness: number;
  totalPoints: number;
  validPoints: number;
}

interface QualitySummary {
  totalCurves: number;
  goodQuality: number;
  fairQuality: number;
  poorQuality: number;
  averageCompleteness?: number;
}

interface DataQualityArtifact {
  messageContentType: 'data_quality_assessment';
  wellName: string;
  overallQuality: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  curves: CurveQuality[];
  summary?: QualitySummary;
}

interface CloudscapeDataQualityDisplayProps {
  artifact: DataQualityArtifact;
}

export const CloudscapeDataQualityDisplay: React.FC<CloudscapeDataQualityDisplayProps> = ({ artifact }) => {
  console.log('🎨 CloudscapeDataQualityDisplay received artifact:', artifact);
  
  // Helper function to determine progress bar status based on completeness
  const getProgressBarStatus = (completeness: number): 'success' | 'in-progress' | 'error' => {
    if (completeness > 90) return 'success';
    if (completeness >= 50) return 'in-progress';
    return 'error';
  };
  
  // Helper function to get status indicator type
  const getStatusType = (quality: string): 'success' | 'warning' | 'error' | 'info' => {
    switch (quality) {
      case 'Excellent':
      case 'Good':
        return 'success';
      case 'Fair':
        return 'warning';
      case 'Poor':
        return 'error';
      default:
        return 'info';
    }
  };
  
  // Sort curves by completeness (worst first for visibility)
  const sortedCurves = [...artifact.curves].sort((a, b) => a.completeness - b.completeness);
  
  return (
    <SpaceBetween size="m">
      {/* Overall Quality Header */}
      <Container
        header={
          <Header
            variant="h2"
            description={`Overall data quality assessment for ${artifact.wellName}`}
          >
            Data Quality Assessment
          </Header>
        }
      >
        <SpaceBetween size="m">
          {/* Overall Quality Status */}
          <div>
            <Box variant="awsui-key-label">Overall Quality</Box>
            <StatusIndicator type={getStatusType(artifact.overallQuality)}>
              {artifact.overallQuality}
            </StatusIndicator>
          </div>
          
          {/* Summary Statistics */}
          {artifact.summary && (
            <ColumnLayout columns={4} variant="text-grid">
              <div>
                <Box variant="awsui-key-label">Total Curves</Box>
                <Box variant="awsui-value-large">{artifact.summary.totalCurves}</Box>
              </div>
              <div>
                <Box variant="awsui-key-label">Good Quality (&gt;90%)</Box>
                <Box variant="awsui-value-large" color="text-status-success">
                  {artifact.summary.goodQuality}
                </Box>
              </div>
              <div>
                <Box variant="awsui-key-label">Fair Quality (50-90%)</Box>
                <Box variant="awsui-value-large" color="text-status-warning">
                  {artifact.summary.fairQuality}
                </Box>
              </div>
              <div>
                <Box variant="awsui-key-label">Poor Quality (&lt;50%)</Box>
                <Box variant="awsui-value-large" color="text-status-error">
                  {artifact.summary.poorQuality}
                </Box>
              </div>
            </ColumnLayout>
          )}
          
          {/* Average Completeness */}
          {artifact.summary?.averageCompleteness !== undefined && (
            <Box margin={{ top: 's' }}>
              <ProgressBar
                value={artifact.summary.averageCompleteness}
                label="Average Completeness"
                status={getProgressBarStatus(artifact.summary.averageCompleteness)}
                description={`${artifact.summary.averageCompleteness.toFixed(1)}% average across all curves`}
              />
            </Box>
          )}
        </SpaceBetween>
      </Container>
      
      {/* Curve Details */}
      <Container
        header={
          <Header
            variant="h3"
            description="Completeness metrics for each curve"
          >
            Curve Quality Details
          </Header>
        }
      >
        <SpaceBetween size="m">
          {sortedCurves.map((curve) => {
            // Ensure minimum visible value for progress bar (at least 2% for visibility)
            // Cloudscape ProgressBar doesn't show bars below ~2%
            const displayValue = curve.completeness < 2 && curve.completeness > 0 
              ? 2 
              : curve.completeness;
            
            return (
              <div key={curve.curve}>
                <SpaceBetween size="xs">
                  <Box variant="awsui-key-label" fontSize="body-m" fontWeight="bold">
                    {curve.curve}
                  </Box>
                  <Box>
                    <div style={{ marginBottom: '4px', fontSize: '14px', color: '#5f6b7a' }}>
                      {curve.validPoints.toLocaleString()} / {curve.totalPoints.toLocaleString()} valid points
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      width: '100%'
                    }}>
                      <div style={{ 
                        flex: 1,
                        height: '8px',
                        backgroundColor: '#e9ebed',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        position: 'relative'
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${displayValue}%`,
                          backgroundColor: 
                            curve.completeness > 90 ? '#037f0c' : 
                            curve.completeness >= 50 ? '#0972d3' : 
                            '#d91515',
                          transition: 'width 0.3s ease',
                          minWidth: curve.completeness > 0 ? '4px' : '0'
                        }} />
                      </div>
                      <div style={{ 
                        fontSize: '14px', 
                        fontWeight: 'bold',
                        color: '#000716',
                        minWidth: '50px',
                        textAlign: 'right'
                      }}>
                        {curve.completeness.toFixed(2)}%
                      </div>
                    </div>
                    {curve.completeness > 90 && (
                      <div style={{ marginTop: '4px', fontSize: '12px', color: '#037f0c' }}>
                        ✓ Good quality
                      </div>
                    )}
                    {curve.completeness < 50 && (
                      <div style={{ marginTop: '4px', fontSize: '12px', color: '#d91515' }}>
                        ✗ Poor quality
                      </div>
                    )}
                  </Box>
                </SpaceBetween>
              </div>
            );
          })}
        </SpaceBetween>
      </Container>
      
      {/* Quality Thresholds (Collapsed by default) */}
      <ExpandableSection headerText="Quality Thresholds" variant="container">
        <SpaceBetween size="s">
          <div>
            <Box variant="awsui-key-label">Excellent</Box>
            <Box>≥ 95% completeness</Box>
          </div>
          <div>
            <Box variant="awsui-key-label">Good</Box>
            <Box>≥ 90% completeness</Box>
          </div>
          <div>
            <Box variant="awsui-key-label">Fair</Box>
            <Box>≥ 50% completeness</Box>
          </div>
          <div>
            <Box variant="awsui-key-label">Poor</Box>
            <Box>&lt; 50% completeness</Box>
          </div>
          <Box margin={{ top: 's' }} variant="p" color="text-body-secondary">
            Null values (-999.25, -9999) are excluded from valid point counts.
          </Box>
        </SpaceBetween>
      </ExpandableSection>
    </SpaceBetween>
  );
};

export default CloudscapeDataQualityDisplay;
