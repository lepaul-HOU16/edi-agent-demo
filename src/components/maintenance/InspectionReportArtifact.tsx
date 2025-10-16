import React, { useState } from 'react';
import { 
  Container, 
  Header, 
  Box, 
  SpaceBetween, 
  Badge, 
  ColumnLayout,
  Table,
  Button,
  ExpandableSection
} from '@cloudscape-design/components';

interface SensorReading {
  timestamp: string;
  value: number;
  quality: 'good' | 'uncertain' | 'bad';
}

interface InspectionFinding {
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  description: string;
  recommendation: string;
}

interface SensorData {
  sensorId: string;
  type: 'temperature' | 'vibration' | 'pressure' | 'flow' | 'current';
  unit: string;
  currentValue: number;
  normalRange: { min: number; max: number };
  alertThreshold: { warning: number; critical: number };
  readings: SensorReading[];
  anomalies: number;
}

interface InspectionReportData {
  inspectionId: string;
  equipmentId: string;
  equipmentName: string;
  inspectionDate: string;
  inspector: string;
  inspectionType: 'routine' | 'detailed' | 'emergency';
  overallStatus: 'pass' | 'warning' | 'fail';
  sensors: SensorData[];
  findings: InspectionFinding[];
  recommendations: string[];
  nextInspectionDate?: string;
}

interface InspectionReportArtifactProps {
  data: {
    messageContentType: 'inspection_report';
    title?: string;
    subtitle?: string;
    report: InspectionReportData;
  };
}

export const InspectionReportArtifact: React.FC<InspectionReportArtifactProps> = ({ data }) => {
  const [expandedSensors, setExpandedSensors] = useState<Set<string>>(new Set());
  const report = data.report;

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: any; label: string }> = {
      pass: { color: 'green', label: 'Pass' },
      warning: { color: 'blue', label: 'Warning' },
      fail: { color: 'red', label: 'Fail' }
    };
    return statusMap[status] || statusMap.pass;
  };

  const getSeverityBadge = (severity: string) => {
    const severityMap: Record<string, { color: any }> = {
      low: { color: 'grey' },
      medium: { color: 'blue' },
      high: { color: 'red' },
      critical: { color: 'red' }
    };
    return severityMap[severity] || severityMap.low;
  };

  // Render trend chart for sensor
  const renderTrendChart = (sensor: SensorData) => {
    if (sensor.readings.length === 0) return null;

    const width = 500;
    const height = 150;
    const padding = { top: 20, right: 20, bottom: 30, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const values = sensor.readings.map(r => r.value);
    const minValue = Math.min(...values, sensor.normalRange.min);
    const maxValue = Math.max(...values, sensor.normalRange.max);
    const valueRange = maxValue - minValue;

    return (
      <svg width={width} height={height}>
        {/* Normal range background */}
        <rect
          x={padding.left}
          y={padding.top + ((maxValue - sensor.normalRange.max) / valueRange) * chartHeight}
          width={chartWidth}
          height={((sensor.normalRange.max - sensor.normalRange.min) / valueRange) * chartHeight}
          fill="#e6f7e6"
          opacity="0.5"
        />

        {/* Warning threshold line */}
        <line
          x1={padding.left}
          y1={padding.top + ((maxValue - sensor.alertThreshold.warning) / valueRange) * chartHeight}
          x2={padding.left + chartWidth}
          y2={padding.top + ((maxValue - sensor.alertThreshold.warning) / valueRange) * chartHeight}
          stroke="#df7c00"
          strokeWidth="1"
          strokeDasharray="4"
        />

        {/* Critical threshold line */}
        <line
          x1={padding.left}
          y1={padding.top + ((maxValue - sensor.alertThreshold.critical) / valueRange) * chartHeight}
          x2={padding.left + chartWidth}
          y2={padding.top + ((maxValue - sensor.alertThreshold.critical) / valueRange) * chartHeight}
          stroke="#d91515"
          strokeWidth="1"
          strokeDasharray="4"
        />

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = padding.top + ratio * chartHeight;
          const value = maxValue - ratio * valueRange;
          return (
            <g key={ratio}>
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
                fontSize="10"
                fill="#5f6b7a"
              >
                {value.toFixed(1)}
              </text>
            </g>
          );
        })}

        {/* Data line */}
        <path
          d={sensor.readings.map((reading, index) => {
            const x = padding.left + (index / (sensor.readings.length - 1)) * chartWidth;
            const y = padding.top + ((maxValue - reading.value) / valueRange) * chartHeight;
            return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
          }).join(' ')}
          fill="none"
          stroke="#0972d3"
          strokeWidth="2"
        />

        {/* Data points with anomaly highlighting */}
        {sensor.readings.map((reading, index) => {
          const x = padding.left + (index / (sensor.readings.length - 1)) * chartWidth;
          const y = padding.top + ((maxValue - reading.value) / valueRange) * chartHeight;
          const isAnomaly = reading.value > sensor.alertThreshold.warning || 
                           reading.value < sensor.normalRange.min;
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r={isAnomaly ? 5 : 3}
              fill={isAnomaly ? '#d91515' : '#0972d3'}
              stroke={isAnomaly ? '#fff' : 'none'}
              strokeWidth={isAnomaly ? 2 : 0}
            />
          );
        })}

        {/* X-axis label */}
        <text
          x={width / 2}
          y={height - 5}
          textAnchor="middle"
          fontSize="11"
          fill="#5f6b7a"
        >
          Time
        </text>

        {/* Y-axis label */}
        <text
          x={15}
          y={height / 2}
          textAnchor="middle"
          fontSize="11"
          fill="#5f6b7a"
          transform={`rotate(-90, 15, ${height / 2})`}
        >
          {sensor.type} ({sensor.unit})
        </text>
      </svg>
    );
  };

  const handleDownloadReport = () => {
    // Create a simple text report
    const reportText = `
INSPECTION REPORT
=================

Equipment: ${report.equipmentName} (${report.equipmentId})
Inspection ID: ${report.inspectionId}
Date: ${new Date(report.inspectionDate).toLocaleString()}
Inspector: ${report.inspector}
Type: ${report.inspectionType}
Status: ${report.overallStatus.toUpperCase()}

FINDINGS:
${report.findings.map((f, i) => `${i + 1}. [${f.severity.toUpperCase()}] ${f.category}: ${f.description}`).join('\n')}

RECOMMENDATIONS:
${report.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}

SENSOR DATA:
${report.sensors.map(s => `- ${s.type}: ${s.currentValue} ${s.unit} (${s.anomalies} anomalies)`).join('\n')}
    `.trim();

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inspection-report-${report.inspectionId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statusBadge = getStatusBadge(report.overallStatus);

  return (
    <Container
      header={
        <Header
          variant="h2"
          description={data.subtitle || `Inspection performed on ${new Date(report.inspectionDate).toLocaleDateString()}`}
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Badge color={statusBadge.color}>{statusBadge.label}</Badge>
              <Button onClick={handleDownloadReport} iconName="download">
                Download Report
              </Button>
            </SpaceBetween>
          }
        >
          {data.title || 'Inspection Report'}
        </Header>
      }
    >
      <SpaceBetween size="l">
        {/* Report Summary */}
        <ColumnLayout columns={4} variant="text-grid">
          <div>
            <Box variant="awsui-key-label">Equipment</Box>
            <div style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '4px' }}>
              {report.equipmentName}
            </div>
            <div style={{ fontSize: '12px', color: '#5f6b7a' }}>{report.equipmentId}</div>
          </div>
          <div>
            <Box variant="awsui-key-label">Inspector</Box>
            <div style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '4px' }}>
              {report.inspector}
            </div>
          </div>
          <div>
            <Box variant="awsui-key-label">Inspection Type</Box>
            <div style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '4px' }}>
              {report.inspectionType}
            </div>
          </div>
          <div>
            <Box variant="awsui-key-label">Next Inspection</Box>
            <div style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '4px' }}>
              {report.nextInspectionDate 
                ? new Date(report.nextInspectionDate).toLocaleDateString()
                : 'Not scheduled'}
            </div>
          </div>
        </ColumnLayout>

        {/* Sensor Readings */}
        {report.sensors && report.sensors.length > 0 && (
          <Box>
            <Box variant="awsui-key-label" margin={{ bottom: 's' }}>
              Sensor Readings ({report.sensors.length} sensors)
            </Box>
            <SpaceBetween size="m">
              {report.sensors.map((sensor) => (
                <ExpandableSection
                  key={sensor.sensorId}
                  headerText={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontWeight: 'bold' }}>{sensor.type}</span>
                      <Badge color={sensor.anomalies > 0 ? 'red' : 'green'}>
                        {sensor.currentValue} {sensor.unit}
                      </Badge>
                      {sensor.anomalies > 0 && (
                        <Badge color="red">{sensor.anomalies} anomalies</Badge>
                      )}
                    </div>
                  }
                  variant="container"
                >
                  <SpaceBetween size="m">
                    <ColumnLayout columns={3} variant="text-grid">
                      <div>
                        <Box variant="awsui-key-label">Current Value</Box>
                        <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                          {sensor.currentValue} {sensor.unit}
                        </div>
                      </div>
                      <div>
                        <Box variant="awsui-key-label">Normal Range</Box>
                        <div style={{ fontSize: '14px' }}>
                          {sensor.normalRange.min} - {sensor.normalRange.max} {sensor.unit}
                        </div>
                      </div>
                      <div>
                        <Box variant="awsui-key-label">Alert Thresholds</Box>
                        <div style={{ fontSize: '14px' }}>
                          ⚠️ {sensor.alertThreshold.warning} / 🚨 {sensor.alertThreshold.critical}
                        </div>
                      </div>
                    </ColumnLayout>
                    
                    <div>
                      <Box variant="awsui-key-label" margin={{ bottom: 'xs' }}>
                        Trend Analysis
                      </Box>
                      <div style={{ 
                        padding: '16px', 
                        backgroundColor: '#fff', 
                        borderRadius: '8px',
                        border: '1px solid #e9ebed'
                      }}>
                        {renderTrendChart(sensor)}
                      </div>
                    </div>
                  </SpaceBetween>
                </ExpandableSection>
              ))}
            </SpaceBetween>
          </Box>
        )}

        {/* Findings */}
        {report.findings && report.findings.length > 0 && (
          <Box>
            <Box variant="awsui-key-label" margin={{ bottom: 's' }}>
              Inspection Findings ({report.findings.length})
            </Box>
            <Table
              columnDefinitions={[
                {
                  id: 'severity',
                  header: 'Severity',
                  cell: (finding: InspectionFinding) => {
                    const badge = getSeverityBadge(finding.severity);
                    return <Badge color={badge.color}>{finding.severity.toUpperCase()}</Badge>;
                  },
                  minWidth: 100
                },
                {
                  id: 'category',
                  header: 'Category',
                  cell: (finding: InspectionFinding) => finding.category,
                  minWidth: 120
                },
                {
                  id: 'description',
                  header: 'Description',
                  cell: (finding: InspectionFinding) => finding.description,
                  minWidth: 250
                },
                {
                  id: 'recommendation',
                  header: 'Recommendation',
                  cell: (finding: InspectionFinding) => finding.recommendation,
                  minWidth: 250
                }
              ]}
              items={report.findings}
              loadingText="Loading findings"
              empty={<Box textAlign="center" color="inherit"><b>No findings</b></Box>}
              contentDensity="comfortable"
            />
          </Box>
        )}

        {/* Recommendations */}
        {report.recommendations && report.recommendations.length > 0 && (
          <Box>
            <Box variant="awsui-key-label" margin={{ bottom: 's' }}>
              Recommendations
            </Box>
            <div style={{
              padding: '16px',
              borderRadius: '8px',
              backgroundColor: '#f0f9ff',
              border: '1px solid #0972d3'
            }}>
              <SpaceBetween size="xs">
                {report.recommendations.map((rec, index) => (
                  <div key={index} style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ color: '#0972d3', fontWeight: 'bold' }}>{index + 1}.</span>
                    <span>{rec}</span>
                  </div>
                ))}
              </SpaceBetween>
            </div>
          </Box>
        )}

        <Box variant="small" color="text-body-secondary">
          Inspection ID: {report.inspectionId} • Date: {new Date(report.inspectionDate).toLocaleString()}
        </Box>
      </SpaceBetween>
    </Container>
  );
};
