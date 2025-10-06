/**
 * ReportArtifact Component
 * 
 * Renders wind farm executive report artifacts from the renewable energy backend.
 * Displays HTML reports with executive summaries and recommendations.
 */

import React from 'react';
import { Container, Header, Box, SpaceBetween } from '@cloudscape-design/components';

interface ReportArtifactProps {
  data: {
    messageContentType: 'wind_farm_report';
    title: string;
    subtitle?: string;
    projectId: string;
    executiveSummary: string;
    recommendations: string[];
    reportHtml: string;
    s3Url?: string;
  };
}

const ReportArtifact: React.FC<ReportArtifactProps> = ({ data }) => {
  return (
    <Container
      header={
        <Header variant="h2" description={data.subtitle}>
          {data.title}
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
                backgroundColor: '#f9f9f9',
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
                    backgroundColor: '#fff',
                    border: '1px solid #e9ebed',
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
        <Box>
          <Box variant="awsui-key-label" margin={{ bottom: 'xs' }}>
            Detailed Report
          </Box>
          <div
            style={{
              width: '100%',
              minHeight: '400px',
              border: '1px solid #e9ebed',
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: '#fff',
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

        {/* Project ID */}
        <Box variant="small" color="text-body-secondary">
          Project ID: {data.projectId}
        </Box>
      </SpaceBetween>
    </Container>
  );
};

export default ReportArtifact;
