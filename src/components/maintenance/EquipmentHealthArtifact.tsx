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

interface EquipmentHealthData {
  equipmentId: string;
  equipmentName: string;
  healthScore: number; // 0-100
  operationalStatus: 'operational' | 'degraded' | 'failed' | 'maintenance';
  lastMaintenanceDate: string;
  nextMaintenanceDate?: string;
  metrics?: {
    temperature?: number;
    vibration?: number;
    pressure?: number;
    efficiency?: number;
  };
  alerts?: Array<{
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
  }>;
  recommendations?: string[];
}

interface EquipmentHealthArtifactProps {
  data: {
    messageContentType: 'equipment_health';
    title?: string;
    subtitle?: string;
    equipmentHealth: EquipmentHealthData;
  };
}

export const EquipmentHealthArtifact: React.FC<EquipmentHealthArtifactProps> = ({ data }) => {
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const health = data.equipmentHealth;

  // Determine health status color and label
  const getHealthStatus = (score: number) => {
    if (score >= 80) return { color: 'green', label: 'Excellent', badge: 'success' };
    if (score >= 60) return { color: 'blue', label: 'Good', badge: 'info' };
    if (score >= 40) return { color: 'orange', label: 'Fair', badge: 'warning' };
    return { color: 'red', label: 'Poor', badge: 'error' };
  };

  const getOperationalStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: any; label: string }> = {
      operational: { color: 'green', label: 'Operational' },
      degraded: { color: 'blue', label: 'Degraded' },
      failed: { color: 'red', label: 'Failed' },
      maintenance: { color: 'grey', label: 'Under Maintenance' }
    };
    return statusMap[status] || { color: 'grey', label: status };
  };

  const healthStatus = getHealthStatus(health.healthScore);
  const opStatus = getOperationalStatusBadge(health.operationalStatus);

  // Create gauge chart using SVG
  const renderGauge = () => {
    const score = health.healthScore;
    const radius = 80;
    const strokeWidth = 16;
    const circumference = 2 * Math.PI * radius;
    const progress = (score / 100) * circumference;
    const rotation = -90; // Start from top

    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '24px' }}>
        <div style={{ position: 'relative', width: '200px', height: '200px' }}>
          <svg width="200" height="200" style={{ transform: 'rotate(-90deg)' }}>
            {/* Background circle */}
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke="#e9ebed"
              strokeWidth={strokeWidth}
            />
            {/* Progress circle */}
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke={healthStatus.color === 'green' ? '#037f0c' : 
                     healthStatus.color === 'blue' ? '#0972d3' :
                     healthStatus.color === 'orange' ? '#df7c00' : '#d91515'}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={circumference - progress}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          </svg>
          {/* Center text */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#000' }}>
              {health.healthScore}
            </div>
            <div style={{ fontSize: '14px', color: '#5f6b7a', marginTop: '4px' }}>
              {healthStatus.label}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Container
      header={
        <Header
          variant="h2"
          description={data.subtitle || `Health assessment for ${health.equipmentName}`}
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Badge color={opStatus.color as any}>{opStatus.label}</Badge>
              <Badge color={healthStatus.badge as any}>
                Health: {health.healthScore}/100
              </Badge>
            </SpaceBetween>
          }
        >
          {data.title || 'Equipment Health Assessment'}
        </Header>
      }
    >
      <SpaceBetween size="l">
        {/* Health Score Gauge */}
        <Box>
          <Box variant="awsui-key-label" margin={{ bottom: 'xs' }}>
            Overall Health Score
          </Box>
          {renderGauge()}
        </Box>

        {/* Key Metrics */}
        <ColumnLayout columns={3} variant="text-grid">
          <div>
            <Box variant="awsui-key-label">Equipment ID</Box>
            <div style={{ fontSize: '16px', fontWeight: 'bold', marginTop: '4px' }}>
              {health.equipmentId}
            </div>
          </div>
          <div>
            <Box variant="awsui-key-label">Last Maintenance</Box>
            <div style={{ fontSize: '16px', fontWeight: 'bold', marginTop: '4px' }}>
              {new Date(health.lastMaintenanceDate).toLocaleDateString()}
            </div>
          </div>
          <div>
            <Box variant="awsui-key-label">Next Maintenance</Box>
            <div style={{ fontSize: '16px', fontWeight: 'bold', marginTop: '4px' }}>
              {health.nextMaintenanceDate 
                ? new Date(health.nextMaintenanceDate).toLocaleDateString()
                : 'Not scheduled'}
            </div>
          </div>
        </ColumnLayout>

        {/* Performance Metrics */}
        {health.metrics && (
          <Box>
            <Box variant="awsui-key-label" margin={{ bottom: 's' }}>
              Performance Metrics
            </Box>
            <SpaceBetween size="s">
              {health.metrics.temperature !== undefined && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>Temperature</span>
                    <span style={{ fontWeight: 'bold' }}>{health.metrics.temperature}°C</span>
                  </div>
                  <ProgressBar 
                    value={Math.min((health.metrics.temperature / 100) * 100, 100)} 
                    status={health.metrics.temperature > 80 ? 'error' : 'success'}
                  />
                </div>
              )}
              {health.metrics.vibration !== undefined && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>Vibration</span>
                    <span style={{ fontWeight: 'bold' }}>{health.metrics.vibration} mm/s</span>
                  </div>
                  <ProgressBar 
                    value={Math.min((health.metrics.vibration / 10) * 100, 100)} 
                    status={health.metrics.vibration > 7 ? 'error' : 'success'}
                  />
                </div>
              )}
              {health.metrics.pressure !== undefined && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>Pressure</span>
                    <span style={{ fontWeight: 'bold' }}>{health.metrics.pressure} bar</span>
                  </div>
                  <ProgressBar 
                    value={Math.min((health.metrics.pressure / 10) * 100, 100)} 
                    status="success"
                  />
                </div>
              )}
              {health.metrics.efficiency !== undefined && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>Efficiency</span>
                    <span style={{ fontWeight: 'bold' }}>{health.metrics.efficiency}%</span>
                  </div>
                  <ProgressBar 
                    value={health.metrics.efficiency} 
                    status={health.metrics.efficiency < 70 ? 'error' : 'success'}
                  />
                </div>
              )}
            </SpaceBetween>
          </Box>
        )}

        {/* Alerts */}
        {health.alerts && health.alerts.length > 0 && (
          <Box>
            <Box variant="awsui-key-label" margin={{ bottom: 's' }}>
              Active Alerts ({health.alerts.length})
            </Box>
            <SpaceBetween size="xs">
              {health.alerts.map((alert, index) => (
                <div 
                  key={index}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: 
                      alert.severity === 'critical' ? '#fef2f2' :
                      alert.severity === 'high' ? '#fff7ed' :
                      alert.severity === 'medium' ? '#fef9e7' : '#f0f9ff',
                    borderLeft: `4px solid ${
                      alert.severity === 'critical' ? '#d91515' :
                      alert.severity === 'high' ? '#df7c00' :
                      alert.severity === 'medium' ? '#f59e0b' : '#0972d3'
                    }`
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Badge color={
                      alert.severity === 'critical' ? 'red' :
                      alert.severity === 'high' ? 'red' :
                      alert.severity === 'medium' ? 'blue' : 'grey'
                    }>
                      {alert.severity.toUpperCase()}
                    </Badge>
                    <span>{alert.message}</span>
                  </div>
                </div>
              ))}
            </SpaceBetween>
          </Box>
        )}

        {/* Expandable Details */}
        {health.recommendations && health.recommendations.length > 0 && (
          <ExpandableSection
            headerText="Recommendations"
            variant="container"
            expanded={detailsExpanded}
            onChange={({ detail }) => setDetailsExpanded(detail.expanded)}
          >
            <SpaceBetween size="xs">
              {health.recommendations.map((rec, index) => (
                <div key={index} style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ color: '#0972d3', fontWeight: 'bold' }}>•</span>
                  <span>{rec}</span>
                </div>
              ))}
            </SpaceBetween>
          </ExpandableSection>
        )}

        <Box variant="small" color="text-body-secondary">
          Equipment: {health.equipmentName} ({health.equipmentId})
        </Box>
      </SpaceBetween>
    </Container>
  );
};
