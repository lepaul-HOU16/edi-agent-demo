/**
 * Cloudscape Curve Quality Display
 * Professional display for single curve quality assessment
 * Simpler version focused on one curve's quality metrics
 */


import React from 'react';
import Container from '@cloudscape-design/components/container';
import Header from '@cloudscape-design/components/header';
import Box from '@cloudscape-design/components/box';
import SpaceBetween from '@cloudscape-design/components/space-between';
import ProgressBar from '@cloudscape-design/components/progress-bar';
import StatusIndicator from '@cloudscape-design/components/status-indicator';
import KeyValuePairs from '@cloudscape-design/components/key-value-pairs';
import Alert from '@cloudscape-design/components/alert';
import ExpandableSection from '@cloudscape-design/components/expandable-section';

interface CurveQualityArtifact {
  messageContentType: 'curve_quality_assessment';
  wellName: string;
  curveName: string;
  completeness: number;
  totalPoints: number;
  validPoints: number;
  qualityScore: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  outliers?: {
    count: number;
    percentage: number;
  };
}

interface CloudscapeCurveQualityDisplayProps {
  artifact: CurveQualityArtifact;
}

export const CloudscapeCurveQualityDisplay: React.FC<CloudscapeCurveQualityDisplayProps> = ({ artifact }) => {
  console.log('🎨 CloudscapeCurveQualityDisplay received artifact:', artifact);
  
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
  
  // Check if outliers are significant (>5%)
  const hasSignificantOutliers = artifact.outliers && artifact.outliers.percentage > 5;
  
  return (
    <SpaceBetween size="m">
      {/* Main Quality Assessment */}
      <Container
        header={
          <Header
            variant="h2"
            description={`Quality assessment for ${artifact.curveName} curve in ${artifact.wellName}`}
          >
            Curve Quality Assessment
          </Header>
        }
      >
        <SpaceBetween size="m">
          {/* Curve Name and Well */}
          <div>
            <Box variant="awsui-key-label">Curve</Box>
            <Box variant="h3">{artifact.curveName}</Box>
            <Box variant="small" color="text-body-secondary">
              Well: {artifact.wellName}
            </Box>
          </div>
          
          {/* Quality Score */}
          <div>
            <Box variant="awsui-key-label">Quality Score</Box>
            <StatusIndicator type={getStatusType(artifact.qualityScore)}>
              {artifact.qualityScore}
            </StatusIndicator>
          </div>
          
          {/* Large Completeness Progress Bar */}
          <Box margin={{ top: 's' }}>
            <ProgressBar
              value={artifact.completeness < 1 && artifact.completeness > 0 ? 1 : artifact.completeness}
              status={getProgressBarStatus(artifact.completeness)}
              label="Data Completeness"
              description={`${artifact.completeness.toFixed(2)}% of data points are valid`}
              additionalInfo={`${artifact.validPoints.toLocaleString()} / ${artifact.totalPoints.toLocaleString()} points`}
            />
          </Box>
          
          {/* Data Points Summary */}
          <KeyValuePairs
            columns={3}
            items={[
              {
                label: 'Total Points',
                value: artifact.totalPoints.toLocaleString()
              },
              {
                label: 'Valid Points',
                value: artifact.validPoints.toLocaleString()
              },
              {
                label: 'Missing Points',
                value: (artifact.totalPoints - artifact.validPoints).toLocaleString()
              }
            ]}
          />
        </SpaceBetween>
      </Container>
      
      {/* Outlier Warning (if significant) */}
      {hasSignificantOutliers && (
        <Alert
          type="warning"
          header="Significant Outliers Detected"
        >
          This curve contains {artifact.outliers!.count.toLocaleString()} outlier data points 
          ({artifact.outliers!.percentage.toFixed(2)}% of valid data). Review the data for potential 
          measurement errors or unusual geological conditions.
        </Alert>
      )}
      
      {/* Outlier Information (if available but not significant) */}
      {artifact.outliers && !hasSignificantOutliers && (
        <Container
          header={<Header variant="h3">Outlier Analysis</Header>}
        >
          <KeyValuePairs
            columns={2}
            items={[
              {
                label: 'Outlier Count',
                value: artifact.outliers.count.toLocaleString()
              },
              {
                label: 'Outlier Percentage',
                value: `${artifact.outliers.percentage.toFixed(2)}%`
              }
            ]}
          />
          <Box margin={{ top: 's' }} variant="p" color="text-body-secondary">
            Outliers are within acceptable range (&lt;5%).
          </Box>
        </Container>
      )}
      
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

export default CloudscapeCurveQualityDisplay;
