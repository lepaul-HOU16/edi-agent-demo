/**
 * ReportArtifact Component
 * 
 * Renders wind farm executive report artifacts from the renewable energy backend.
 * Displays HTML reports with executive summaries and recommendations.
 */

import React from 'react';
import { Container, Header, Box, SpaceBetween, Alert, Button } from '@cloudscape-design/components';

interface ReportArtifactProps {
  data: {
    messageContentType: 'wind_farm_report';
    title: string;
    subtitle?: string;
    projectId: string;
    executiveSummary?: string;
    recommendations?: string[];
    reportHtml?: string;
    s3Url?: string;
    reportUrl?: string;
    sections?: {
      siteAnalysis?: any;
      layoutDesign?: any;
      wakeAnalysis?: any;
      economicAnalysis?: any;
      environmentalImpact?: any;
      riskAnalysis?: any;
    };
  };
  onFollowUpAction?: (query: string) => void;
}

const ReportArtifact: React.FC<ReportArtifactProps> = ({ data, onFollowUpAction }) => {
  console.log('🎯 ReportArtifact: Rendering with data:', {
    hasExecutiveSummary: !!data.executiveSummary,
    hasRecommendations: !!data.recommendations,
    recommendationsCount: data.recommendations?.length || 0,
    hasReportHtml: !!data.reportHtml,
    hasReportUrl: !!(data.reportUrl || data.s3Url),
    hasSections: !!data.sections,
    projectId: data.projectId,
  });

  // Error handling for completely missing report data
  if (!data.reportHtml && !data.executiveSummary && (!data.recommendations || data.recommendations.length === 0)) {
    console.error('❌ ReportArtifact: No report data available');
    return (
      <Container
        header={
          <Header variant="h2" description="Report generation failed">
            Wind Farm Report Error
          </Header>
        }
      >
        <SpaceBetween size="m">
          <Alert type="error" header="Report Generation Failed">
            The report data is incomplete or missing. This could be due to:
            <ul style={{ marginTop: '8px', marginBottom: '0' }}>
              <li>Incomplete project data (missing terrain, layout, or simulation results)</li>
              <li>Report generation service error</li>
              <li>Network connectivity issues</li>
            </ul>
          </Alert>
          {onFollowUpAction && (
            <Box>
              <SpaceBetween direction="horizontal" size="xs">
                <Button
                  variant="primary"
                  onClick={() => onFollowUpAction(`regenerate report for ${data.projectId || 'project'}`)}
                >
                  Retry Report Generation
                </Button>
                <Button
                  onClick={() => onFollowUpAction(`check project status for ${data.projectId || 'project'}`)}
                >
                  Check Project Status
                </Button>
              </SpaceBetween>
            </Box>
          )}
        </SpaceBetween>
      </Container>
    );
  }

  // Partial data warning
  const hasPartialData = !data.reportHtml || !data.executiveSummary || !data.recommendations || data.recommendations.length === 0;
  
  if (hasPartialData) {
    console.warn('⚠️ ReportArtifact: Partial report data detected');
  }

  return (
    <Container
      header={
        <Header variant="h2" description={data.subtitle || `Project: ${data.projectId}`}>
          {data.title || 'Wind Farm Executive Report'}
        </Header>
      }
    >
      <SpaceBetween size="l">


        {/* Executive Summary */}
        {data.executiveSummary && (
          <Box>
            <Box variant="awsui-key-label" margin={{ bottom: 'xs' }}>
              Executive Summary
            </Box>
            <div
              style={{
                padding: '16px',
                backgroundColor: 'var(--awsui-color-background-container-content)',
                borderRadius: '8px',
                borderLeft: '4px solid #0972d3',
                lineHeight: '1.6',
              }}
            >
              {data.executiveSummary}
            </div>
          </Box>
        )}

        {/* Recommendations */}
        {data.recommendations && data.recommendations.length > 0 && (
          <Box>
            <Box variant="awsui-key-label" margin={{ bottom: 'xs' }}>
              Key Recommendations
            </Box>
            <SpaceBetween size="xs">
              {data.recommendations.map((recommendation, index) => (
                <div
                  key={index}
                  style={{
                    padding: '12px',
                    backgroundColor: 'var(--awsui-color-background-container-content)',
                    border: '1px solid var(--awsui-color-border-divider-default)',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'flex-start',
                  }}
                >
                  <div
                    style={{
                      minWidth: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: '#0972d3',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                    }}
                  >
                    {index + 1}
                  </div>
                  <div style={{ flex: 1 }}>{recommendation}</div>
                </div>
              ))}
            </SpaceBetween>
          </Box>
        )}

        {/* Full Report */}
        {data.reportHtml && (
          <Box>
            <Box variant="awsui-key-label" margin={{ bottom: 'xs' }}>
              Detailed Report
            </Box>
            <div
              style={{
                width: '100%',
                minHeight: '400px',
                border: '1px solid var(--awsui-color-border-divider-default)',
                borderRadius: '8px',
                overflow: 'hidden',
                backgroundColor: 'var(--awsui-color-background-container-content)',
              }}
            >
              <iframe
                srcDoc={data.reportHtml}
                style={{
                  width: '100%',
                  minHeight: '400px',
                  border: 'none',
                }}
                title="Wind Farm Executive Report"
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          </Box>
        )}

        {/* Download Button */}
        {(data.reportUrl || data.s3Url) && (
          <Box>
            <Button
              variant="primary"
              iconName="download"
              href={data.reportUrl || data.s3Url}
              target="_blank"
            >
              Download PDF
            </Button>
          </Box>
        )}

        {/* Project ID */}
        {data.projectId && (
          <Box variant="small" color="text-body-secondary">
            Project ID: {data.projectId}
          </Box>
        )}
      </SpaceBetween>
    </Container>
  );
};

export default ReportArtifact;
