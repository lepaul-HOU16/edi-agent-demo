import React, { useState } from 'react';
import { 
  Container, 
  Header, 
  Box, 
  SpaceBetween, 
  Badge, 
  ColumnLayout,
  ExpandableSection,
  ProgressBar
} from '@cloudscape-design/components';

interface ContributingFactor {
  factor: string;
  impact: number; // 0-1
  trend: 'improving' | 'stable' | 'degrading';
  description: string;
}

interface FailurePredictionData {
  equipmentId: string;
  equipmentName: string;
  predictionDate: string;
  failureRisk: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number; // 0-100
  timeToFailure: number; // days
  confidence: number; // 0-1
  contributingFactors: ContributingFactor[];
  recommendations: string[];
  methodology?: string;
  riskTimeline?: Array<{
    date: string;
    riskScore: number;
  }>;
}

interface FailurePredictionArtifactProps {
  data: {
    messageContentType: 'failure_prediction';
    title?: string;
    subtitle?: string;
    prediction: FailurePredictionData;
  };
}

export const FailurePredictionArtifact: React.FC<FailurePredictionArtifactProps> = ({ data }) => {
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const prediction = data.prediction;

  // Risk level styling
  const getRiskStyle = (risk: string) => {
    const riskMap: Record<string, { color: any; bgColor: string; label: string }> = {
      low: { color: 'green', bgColor: '#f0f9ff', label: 'Low Risk' },
      medium: { color: 'blue', bgColor: '#fef9e7', label: 'Medium Risk' },
      high: { color: 'red', bgColor: '#fff7ed', label: 'High Risk' },
      critical: { color: 'red', bgColor: '#fef2f2', label: 'Critical Risk' }
    };
    return riskMap[risk] || riskMap.low;
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'improving') return '↓';
    if (trend === 'degrading') return '↑';
    return '→';
  };

  const getTrendColor = (trend: string) => {
    if (trend === 'improving') return '#037f0c';
    if (trend === 'degrading') return '#d91515';
    return '#5f6b7a';
  };

  const riskStyle = getRiskStyle(prediction.failureRisk);

  // Render timeline chart
  const renderTimeline = () => {
    if (!prediction.riskTimeline || prediction.riskTimeline.length === 0) {
      return null;
    }

    const timeline = prediction.riskTimeline;
    const maxRisk = Math.max(...timeline.map(t => t.riskScore));
    const width = 600;
    const height = 200;
    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    return (
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <svg width={width} height={height}>
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((value) => {
            const y = padding.top + chartHeight - (value / 100) * chartHeight;
            return (
              <g key={value}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + chartWidth}
                  y2={y}
                  stroke="#e9ebed"
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="12"
                  fill="#5f6b7a"
                >
                  {value}
                </text>
              </g>
            );
          })}

          {/* Risk zones */}
          <rect
            x={padding.left}
            y={padding.top}
            width={chartWidth}
            height={chartHeight * 0.25}
            fill="#fef2f2"
            opacity="0.3"
          />
          <rect
            x={padding.left}
            y={padding.top + chartHeight * 0.25}
            width={chartWidth}
            height={chartHeight * 0.25}
            fill="#fff7ed"
            opacity="0.3"
          />

          {/* Timeline path */}
          <path
            d={timeline.map((point, index) => {
              const x = padding.left + (index / (timeline.length - 1)) * chartWidth;
              const y = padding.top + chartHeight - (point.riskScore / 100) * chartHeight;
              return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
            }).join(' ')}
            fill="none"
            stroke="#d91515"
            strokeWidth="3"
          />

          {/* Data points */}
          {timeline.map((point, index) => {
            const x = padding.left + (index / (timeline.length - 1)) * chartWidth;
            const y = padding.top + chartHeight - (point.riskScore / 100) * chartHeight;
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="4"
                fill="#d91515"
              />
            );
          })}

          {/* X-axis labels */}
          {timeline.map((point, index) => {
            if (index % Math.ceil(timeline.length / 5) === 0 || index === timeline.length - 1) {
              const x = padding.left + (index / (timeline.length - 1)) * chartWidth;
              const date = new Date(point.date);
              return (
                <text
                  key={index}
                  x={x}
                  y={height - 10}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#5f6b7a"
                >
                  {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </text>
              );
            }
            return null;
          })}

          {/* Y-axis label */}
          <text
            x={15}
            y={height / 2}
            textAnchor="middle"
            fontSize="12"
            fill="#5f6b7a"
            transform={`rotate(-90, 15, ${height / 2})`}
          >
            Risk Score
          </text>
        </svg>
      </div>
    );
  };

  return (
    <Container
      header={
        <Header
          variant="h2"
          description={data.subtitle || `Predictive failure analysis for ${prediction.equipmentName}`}
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Badge color={riskStyle.color}>{riskStyle.label}</Badge>
              <Badge color="grey">
                {prediction.timeToFailure} days to failure
              </Badge>
            </SpaceBetween>
          }
        >
          {data.title || 'Failure Prediction Analysis'}
        </Header>
      }
    >
      <SpaceBetween size="l">
        {/* Risk Overview */}
        <div style={{
          padding: '24px',
          borderRadius: '8px',
          backgroundColor: riskStyle.bgColor,
          borderLeft: `4px solid ${riskStyle.color === 'green' ? '#037f0c' : riskStyle.color === 'blue' ? '#0972d3' : '#d91515'}`
        }}>
          <ColumnLayout columns={4} variant="text-grid">
            <div>
              <Box variant="awsui-key-label">Risk Score</Box>
              <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '4px' }}>
                {prediction.riskScore}/100
              </div>
            </div>
            <div>
              <Box variant="awsui-key-label">Time to Failure</Box>
              <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '4px' }}>
                {prediction.timeToFailure} days
              </div>
            </div>
            <div>
              <Box variant="awsui-key-label">Confidence</Box>
              <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '4px' }}>
                {(prediction.confidence * 100).toFixed(0)}%
              </div>
            </div>
            <div>
              <Box variant="awsui-key-label">Equipment</Box>
              <div style={{ fontSize: '16px', fontWeight: 'bold', marginTop: '4px' }}>
                {prediction.equipmentId}
              </div>
            </div>
          </ColumnLayout>
        </div>

        {/* Risk Timeline */}
        {prediction.riskTimeline && prediction.riskTimeline.length > 0 && (
          <Box>
            <Box variant="awsui-key-label" margin={{ bottom: 's' }}>
              Risk Progression Over Time
            </Box>
            <div style={{ 
              padding: '16px', 
              backgroundColor: '#fff', 
              borderRadius: '8px',
              border: '1px solid #e9ebed'
            }}>
              {renderTimeline()}
            </div>
          </Box>
        )}

        {/* Contributing Factors */}
        {prediction.contributingFactors && prediction.contributingFactors.length > 0 && (
          <Box>
            <Box variant="awsui-key-label" margin={{ bottom: 's' }}>
              Contributing Factors ({prediction.contributingFactors.length})
            </Box>
            <SpaceBetween size="s">
              {prediction.contributingFactors.map((factor, index) => (
                <div 
                  key={index}
                  style={{
                    padding: '16px',
                    borderRadius: '8px',
                    backgroundColor: '#fafafa',
                    border: '1px solid #e9ebed'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 'bold' }}>{factor.factor}</span>
                      <span 
                        style={{ 
                          fontSize: '18px', 
                          color: getTrendColor(factor.trend),
                          fontWeight: 'bold'
                        }}
                      >
                        {getTrendIcon(factor.trend)}
                      </span>
                      <Badge color={
                        factor.trend === 'improving' ? 'green' :
                        factor.trend === 'degrading' ? 'red' : 'grey'
                      }>
                        {factor.trend}
                      </Badge>
                    </div>
                    <span style={{ fontWeight: 'bold', color: '#0972d3' }}>
                      {(factor.impact * 100).toFixed(0)}% impact
                    </span>
                  </div>
                  <div style={{ marginBottom: '8px', color: '#5f6b7a', fontSize: '14px' }}>
                    {factor.description}
                  </div>
                  <ProgressBar 
                    value={factor.impact * 100} 
                    status={factor.impact > 0.7 ? 'error' : 'in-progress'}
                  />
                </div>
              ))}
            </SpaceBetween>
          </Box>
        )}

        {/* Recommendations */}
        {prediction.recommendations && prediction.recommendations.length > 0 && (
          <Box>
            <Box variant="awsui-key-label" margin={{ bottom: 's' }}>
              Recommended Actions
            </Box>
            <div style={{
              padding: '16px',
              borderRadius: '8px',
              backgroundColor: '#f0f9ff',
              border: '1px solid #0972d3'
            }}>
              <SpaceBetween size="xs">
                {prediction.recommendations.map((rec, index) => (
                  <div key={index} style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ color: '#0972d3', fontWeight: 'bold', fontSize: '18px' }}>→</span>
                    <span>{rec}</span>
                  </div>
                ))}
              </SpaceBetween>
            </div>
          </Box>
        )}

        {/* Methodology */}
        {prediction.methodology && (
          <ExpandableSection
            headerText="Prediction Methodology"
            variant="container"
            expanded={detailsExpanded}
            onChange={({ detail }) => setDetailsExpanded(detail.expanded)}
          >
            <Box color="text-body-secondary">
              {prediction.methodology}
            </Box>
          </ExpandableSection>
        )}

        <Box variant="small" color="text-body-secondary">
          Prediction generated on {new Date(prediction.predictionDate).toLocaleString()} • 
          Equipment: {prediction.equipmentName} ({prediction.equipmentId})
        </Box>
      </SpaceBetween>
    </Container>
  );
};
