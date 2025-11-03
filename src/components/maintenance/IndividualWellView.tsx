/**
 * Individual Well View Component
 * Detailed view of a single selected well
 * 
 * Features:
 * - Well header with ID, name, location, health score, status
 * - Sensor dashboard with real-time gauges
 * - Alerts panel with severity and timestamps
 * - Maintenance timeline
 * - Production metrics section
 * - AI-generated recommendations
 * - Action buttons (Schedule Maintenance, Export Report)
 * 
 * Requirements: 3.2, 3.5
 */

import React, { useState } from 'react';
import {
  Container,
  Header,
  SpaceBetween,
  Box,
  Badge,
  ColumnLayout,
  StatusIndicator,
  Icon,
  Button,
  ExpandableSection,
  Grid,
  ProgressBar,
  Alert
} from '@cloudscape-design/components';

// Type definitions
interface Sensor {
  type: 'pressure' | 'temperature' | 'flow_rate' | 'vibration' | 'level';
  currentValue: number;
  unit: string;
  normalRange: { min: number; max: number };
  alertThreshold: { warning: number; critical: number };
  status: 'normal' | 'warning' | 'critical';
  lastUpdated: string;
  trend: 'increasing' | 'decreasing' | 'stable';
}

interface Alert {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: string;
  acknowledged: boolean;
  relatedSensor?: string;
}

interface MaintenanceRecord {
  id: string;
  date: string;
  type: 'preventive' | 'corrective' | 'inspection';
  description: string;
  technician: string;
  duration: number;
  cost?: number;
  partsReplaced?: string[];
}

interface ProductionData {
  currentRate: number;
  averageRate: number;
  cumulativeProduction: number;
  efficiency: number;
}

interface WellLocation {
  field: string;
  sector: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

interface WellSummary {
  id: string;
  name: string;
  healthScore: number;
  status: 'operational' | 'degraded' | 'critical' | 'offline';
  alertCount: number;
  criticalAlertCount: number;
  lastMaintenance: string;
  nextMaintenance: string;
  location: string;
  keyMetrics: {
    temperature?: number;
    pressure?: number;
    flowRate?: number;
    production?: number;
  };
}

interface IndividualWellViewProps {
  well: WellSummary;
  onBackToConsolidated?: () => void;
  onScheduleMaintenance?: (wellId: string) => void;
  onExportReport?: (wellId: string) => void;
}

/**
 * Get status badge color
 */
const getStatusColor = (status: string): 'red' | 'green' | 'blue' | 'grey' => {
  switch (status) {
    case 'critical':
      return 'red';
    case 'degraded':
      return 'blue';
    case 'operational':
      return 'green';
    case 'offline':
      return 'grey';
    default:
      return 'grey';
  }
};

/**
 * Get health score color
 */
const getHealthScoreColor = (score: number): string => {
  if (score >= 80) return '#22c55e'; // Green
  if (score >= 60) return '#f59e0b'; // Orange
  return '#dc2626'; // Red
};

/**
 * Get sensor status icon
 */
const getSensorStatusIcon = (status: string): string => {
  switch (status) {
    case 'normal':
      return 'status-positive';
    case 'warning':
      return 'status-warning';
    case 'critical':
      return 'status-negative';
    default:
      return 'status-info';
  }
};

/**
 * Get trend icon
 */
const getTrendIcon = (trend: string): string => {
  switch (trend) {
    case 'increasing':
      return '↗';
    case 'decreasing':
      return '↘';
    case 'stable':
      return '→';
    default:
      return '→';
  }
};

/**
 * Format date for display
 */
const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
};

/**
 * Format timestamp for display
 */
const formatTimestamp = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
  } catch {
    return timestamp;
  }
};

/**
 * Well Header Component
 */
const WellHeader: React.FC<{
  well: WellSummary;
  onBackToConsolidated?: () => void;
}> = ({ well, onBackToConsolidated }) => {
  return (
    <Container>
      <SpaceBetween size="m">
        {/* Back button */}
        {onBackToConsolidated && (
          <Box>
            <Button
              variant="link"
              iconName="arrow-left"
              onClick={onBackToConsolidated}
            >
              Back to Consolidated View
            </Button>
          </Box>
        )}

        {/* Well identification */}
        <Box>
          <SpaceBetween direction="horizontal" size="s" alignItems="center">
            <Box fontSize="heading-xl" fontWeight="bold">
              {well.id}
            </Box>
            <Box fontSize="heading-l" color="text-body-secondary">
              {well.name}
            </Box>
            <Badge color={getStatusColor(well.status)}>
              {well.status.toUpperCase()}
            </Badge>
          </SpaceBetween>
        </Box>

        {/* Location */}
        <Box>
          <SpaceBetween direction="horizontal" size="xs">
            <span>📍</span>
            <Box variant="span" color="text-body-secondary">
              {well.location}
            </Box>
          </SpaceBetween>
        </Box>

        {/* Key metrics */}
        <Grid gridDefinition={[
          { colspan: { default: 12, xs: 6, s: 3 } },
          { colspan: { default: 12, xs: 6, s: 3 } },
          { colspan: { default: 12, xs: 6, s: 3 } },
          { colspan: { default: 12, xs: 6, s: 3 } }
        ]}>
          {/* Health Score */}
          <Box>
            <Box variant="awsui-key-label">Health Score</Box>
            <Box fontSize="heading-xl" fontWeight="bold">
              <span style={{ color: getHealthScoreColor(well.healthScore) }}>
                {well.healthScore}/100
              </span>
            </Box>
          </Box>

          {/* Alerts */}
          <Box>
            <Box variant="awsui-key-label">Active Alerts</Box>
            <SpaceBetween direction="horizontal" size="xs">
              <Box fontSize="heading-xl" fontWeight="bold">
                {well.alertCount}
              </Box>
              {well.criticalAlertCount > 0 && (
                <Badge color="red">
                  {well.criticalAlertCount} critical
                </Badge>
              )}
            </SpaceBetween>
          </Box>

          {/* Last Maintenance */}
          <Box>
            <Box variant="awsui-key-label">Last Maintenance</Box>
            <Box fontSize="heading-m" fontWeight="bold">
              {formatDate(well.lastMaintenance)}
            </Box>
          </Box>

          {/* Next Maintenance */}
          <Box>
            <Box variant="awsui-key-label">Next Maintenance</Box>
            <Box fontSize="heading-m" fontWeight="bold">
              {formatDate(well.nextMaintenance)}
            </Box>
          </Box>
        </Grid>
      </SpaceBetween>
    </Container>
  );
};

/**
 * Sensor Gauge Component
 */
const SensorGauge: React.FC<{ sensor: Sensor }> = ({ sensor }) => {
  // Calculate percentage for gauge
  const range = sensor.normalRange.max - sensor.normalRange.min;
  const valuePosition = ((sensor.currentValue - sensor.normalRange.min) / range) * 100;
  const percentage = Math.max(0, Math.min(100, valuePosition));

  // Determine color based on status
  const getGaugeColor = (): string => {
    if (sensor.status === 'critical') return '#dc2626';
    if (sensor.status === 'warning') return '#f59e0b';
    return '#22c55e';
  };

  return (
    <Box padding="m" variant="div">
      <SpaceBetween size="s">
        {/* Sensor name and status */}
        <SpaceBetween direction="horizontal" size="s" alignItems="center">
          <Box variant="h4" fontWeight="bold">
            {sensor.type.replace('_', ' ').toUpperCase()}
          </Box>
          <StatusIndicator type={sensor.status === 'critical' ? 'error' : sensor.status === 'warning' ? 'warning' : 'success'}>
            {sensor.status}
          </StatusIndicator>
        </SpaceBetween>

        {/* Current value */}
        <Box textAlign="center">
          <Box fontSize="display-l" fontWeight="bold" color={sensor.status === 'critical' ? 'text-status-error' : sensor.status === 'warning' ? 'text-status-warning' : 'text-status-success'}>
            {sensor.currentValue.toFixed(1)}
          </Box>
          <Box variant="small" color="text-body-secondary">
            {sensor.unit}
          </Box>
        </Box>

        {/* Progress bar gauge */}
        <ProgressBar
          value={percentage}
          status={sensor.status === 'critical' ? 'error' : sensor.status === 'warning' ? 'in-progress' : 'success'}
          additionalInfo={`Normal: ${sensor.normalRange.min}-${sensor.normalRange.max} ${sensor.unit}`}
        />

        {/* Trend and last updated */}
        <SpaceBetween direction="horizontal" size="s" alignItems="center">
          <Box variant="small" color="text-body-secondary">
            Trend: {getTrendIcon(sensor.trend)} {sensor.trend}
          </Box>
          <Box variant="small" color="text-body-secondary">
            Updated: {formatTimestamp(sensor.lastUpdated)}
          </Box>
        </SpaceBetween>
      </SpaceBetween>
    </Box>
  );
};

/**
 * Sensor Dashboard Component
 */
const SensorDashboard: React.FC<{ well: WellSummary }> = ({ well }) => {
  // Generate mock sensor data based on well's key metrics
  const sensors: Sensor[] = [
    {
      type: 'pressure',
      currentValue: well.keyMetrics.pressure || 2500,
      unit: 'PSI',
      normalRange: { min: 2000, max: 3000 },
      alertThreshold: { warning: 3200, critical: 3500 },
      status: well.keyMetrics.pressure && well.keyMetrics.pressure > 3200 ? 'warning' : 'normal',
      lastUpdated: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      trend: 'stable'
    },
    {
      type: 'temperature',
      currentValue: well.keyMetrics.temperature || 180,
      unit: '°F',
      normalRange: { min: 150, max: 200 },
      alertThreshold: { warning: 210, critical: 230 },
      status: well.keyMetrics.temperature && well.keyMetrics.temperature > 210 ? 'warning' : 'normal',
      lastUpdated: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
      trend: 'increasing'
    },
    {
      type: 'flow_rate',
      currentValue: well.keyMetrics.flowRate || 450,
      unit: 'BPD',
      normalRange: { min: 400, max: 600 },
      alertThreshold: { warning: 350, critical: 300 },
      status: well.keyMetrics.flowRate && well.keyMetrics.flowRate < 350 ? 'warning' : 'normal',
      lastUpdated: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      trend: 'stable'
    },
    {
      type: 'vibration',
      currentValue: 2.5,
      unit: 'mm/s',
      normalRange: { min: 0, max: 4 },
      alertThreshold: { warning: 5, critical: 7 },
      status: 'normal',
      lastUpdated: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      trend: 'stable'
    }
  ];

  return (
    <Container
      header={
        <Header variant="h2">
          <SpaceBetween direction="horizontal" size="xs">
            <Icon name="status-info" />
            <span>Sensor Dashboard</span>
          </SpaceBetween>
        </Header>
      }
    >
      <Grid gridDefinition={[
        { colspan: { default: 12, xs: 6, s: 3 } },
        { colspan: { default: 12, xs: 6, s: 3 } },
        { colspan: { default: 12, xs: 6, s: 3 } },
        { colspan: { default: 12, xs: 6, s: 3 } }
      ]}>
        {sensors.map((sensor, index) => (
          <SensorGauge key={index} sensor={sensor} />
        ))}
      </Grid>
    </Container>
  );
};

/**
 * Alerts Panel Component
 */
const AlertsPanel: React.FC<{ well: WellSummary }> = ({ well }) => {
  // Generate mock alerts based on well status
  const alerts: Alert[] = [];

  if (well.status === 'critical' || well.criticalAlertCount > 0) {
    alerts.push({
      id: '1',
      severity: 'critical',
      message: 'Pressure exceeds critical threshold - Immediate inspection required',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      acknowledged: false,
      relatedSensor: 'pressure'
    });
  }

  if (well.status === 'degraded' || well.alertCount > 0) {
    alerts.push({
      id: '2',
      severity: 'warning',
      message: 'Flow rate elevated - Monitor closely',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      acknowledged: false,
      relatedSensor: 'flow_rate'
    });
  }

  if (well.alertCount > 2) {
    alerts.push({
      id: '3',
      severity: 'info',
      message: 'Routine maintenance due in 7 days',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      acknowledged: true
    });
  }

  const getSeverityType = (severity: string): 'error' | 'warning' | 'info' => {
    switch (severity) {
      case 'critical':
        return 'error';
      case 'warning':
        return 'warning';
      default:
        return 'info';
    }
  };

  return (
    <Container
      header={
        <Header
          variant="h2"
          counter={`(${alerts.length})`}
        >
          <SpaceBetween direction="horizontal" size="xs">
            <Icon name="notification" />
            <span>Active Alerts</span>
          </SpaceBetween>
        </Header>
      }
    >
      {alerts.length === 0 ? (
        <Box textAlign="center" padding="l">
          <StatusIndicator type="success">
            No active alerts. Well is operating normally.
          </StatusIndicator>
        </Box>
      ) : (
        <SpaceBetween size="s">
          {alerts.map((alert) => (
            <Alert
              key={alert.id}
              type={getSeverityType(alert.severity)}
              header={alert.message}
              dismissible={!alert.acknowledged}
            >
              <SpaceBetween size="xs">
                <Box variant="small">
                  Detected: {formatTimestamp(alert.timestamp)}
                </Box>
                {alert.relatedSensor && (
                  <Box variant="small">
                    Related sensor: <code>{alert.relatedSensor}</code>
                  </Box>
                )}
                {alert.acknowledged && (
                  <Box variant="small" color="text-status-success">
                    ✓ Acknowledged
                  </Box>
                )}
              </SpaceBetween>
            </Alert>
          ))}
        </SpaceBetween>
      )}
    </Container>
  );
};

/**
 * Maintenance Timeline Component
 */
const MaintenanceTimeline: React.FC<{ well: WellSummary }> = ({ well }) => {
  // Generate mock maintenance history
  const maintenanceHistory: MaintenanceRecord[] = [
    {
      id: '1',
      date: well.lastMaintenance,
      type: 'preventive',
      description: 'Routine preventive maintenance - replaced filters and checked all systems',
      technician: 'John Smith',
      duration: 4,
      cost: 2500,
      partsReplaced: ['Oil filter', 'Air filter', 'Pressure sensor']
    },
    {
      id: '2',
      date: new Date(new Date(well.lastMaintenance).getTime() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      type: 'inspection',
      description: 'Quarterly inspection - all systems operational',
      technician: 'Jane Doe',
      duration: 2,
      cost: 800
    },
    {
      id: '3',
      date: new Date(new Date(well.lastMaintenance).getTime() - 180 * 24 * 60 * 60 * 1000).toISOString(),
      type: 'corrective',
      description: 'Repaired pressure valve - restored to normal operation',
      technician: 'Mike Johnson',
      duration: 6,
      cost: 4200,
      partsReplaced: ['Pressure valve', 'Gasket set']
    }
  ];

  const getMaintenanceTypeColor = (type: string): 'blue' | 'green' | 'red' => {
    switch (type) {
      case 'preventive':
        return 'green';
      case 'inspection':
        return 'blue';
      case 'corrective':
        return 'red';
      default:
        return 'blue';
    }
  };

  return (
    <Container
      header={
        <Header variant="h2">
          <SpaceBetween direction="horizontal" size="xs">
            <Icon name="calendar" />
            <span>Maintenance Timeline</span>
          </SpaceBetween>
        </Header>
      }
    >
      <SpaceBetween size="m">
        {/* Upcoming maintenance */}
        <Box>
          <Box variant="awsui-key-label">Next Scheduled Maintenance</Box>
          <Box padding={{ top: 'xs' }}>
            <SpaceBetween direction="horizontal" size="s" alignItems="center">
              <Badge color="blue">SCHEDULED</Badge>
              <Box variant="span" fontWeight="bold">
                {formatDate(well.nextMaintenance)}
              </Box>
              <Box variant="small" color="text-body-secondary">
                Preventive maintenance
              </Box>
            </SpaceBetween>
          </Box>
        </Box>

        {/* Past maintenance */}
        <ExpandableSection
          headerText="Maintenance History"
          defaultExpanded={false}
        >
          <SpaceBetween size="m">
            {maintenanceHistory.map((record) => (
              <Box key={record.id} padding="m" variant="div">
                <SpaceBetween size="s">
                  {/* Header */}
                  <SpaceBetween direction="horizontal" size="s" alignItems="center">
                    <Badge color={getMaintenanceTypeColor(record.type)}>
                      {record.type.toUpperCase()}
                    </Badge>
                    <Box variant="span" fontWeight="bold">
                      {formatDate(record.date)}
                    </Box>
                  </SpaceBetween>

                  {/* Description */}
                  <Box variant="p">
                    {record.description}
                  </Box>

                  {/* Details */}
                  <ColumnLayout columns={3} variant="text-grid">
                    <div>
                      <Box variant="awsui-key-label">Technician</Box>
                      <Box variant="p">{record.technician}</Box>
                    </div>
                    <div>
                      <Box variant="awsui-key-label">Duration</Box>
                      <Box variant="p">{record.duration} hours</Box>
                    </div>
                    {record.cost && (
                      <div>
                        <Box variant="awsui-key-label">Cost</Box>
                        <Box variant="p">${record.cost.toLocaleString()}</Box>
                      </div>
                    )}
                  </ColumnLayout>

                  {/* Parts replaced */}
                  {record.partsReplaced && record.partsReplaced.length > 0 && (
                    <Box>
                      <Box variant="awsui-key-label">Parts Replaced</Box>
                      <Box variant="p">
                        {record.partsReplaced.join(', ')}
                      </Box>
                    </Box>
                  )}
                </SpaceBetween>
              </Box>
            ))}
          </SpaceBetween>
        </ExpandableSection>
      </SpaceBetween>
    </Container>
  );
};

/**
 * Production Metrics Component
 */
const ProductionMetrics: React.FC<{ well: WellSummary }> = ({ well }) => {
  // Generate mock production data
  const production: ProductionData = {
    currentRate: well.keyMetrics.production || 450,
    averageRate: 475,
    cumulativeProduction: 1250000,
    efficiency: 94.7
  };

  return (
    <Container
      header={
        <Header variant="h2">
          <SpaceBetween direction="horizontal" size="xs">
            <Icon name="status-info" />
            <span>Production Metrics</span>
          </SpaceBetween>
        </Header>
      }
    >
      <ColumnLayout columns={4} variant="text-grid">
        <div>
          <Box variant="awsui-key-label">Current Rate</Box>
          <Box fontSize="heading-xl" fontWeight="bold">
            {production.currentRate.toFixed(0)}
          </Box>
          <Box variant="small" color="text-body-secondary">
            BPD (Barrels Per Day)
          </Box>
        </div>

        <div>
          <Box variant="awsui-key-label">Average Rate</Box>
          <Box fontSize="heading-xl" fontWeight="bold">
            {production.averageRate.toFixed(0)}
          </Box>
          <Box variant="small" color="text-body-secondary">
            BPD (30-day average)
          </Box>
        </div>

        <div>
          <Box variant="awsui-key-label">Cumulative Production</Box>
          <Box fontSize="heading-xl" fontWeight="bold">
            {(production.cumulativeProduction / 1000000).toFixed(2)}M
          </Box>
          <Box variant="small" color="text-body-secondary">
            Total barrels
          </Box>
        </div>

        <div>
          <Box variant="awsui-key-label">Efficiency</Box>
          <Box fontSize="heading-xl" fontWeight="bold" color="text-status-success">
            {production.efficiency.toFixed(1)}%
          </Box>
          <Box variant="small" color="text-body-secondary">
            Production efficiency
          </Box>
        </div>
      </ColumnLayout>
    </Container>
  );
};

/**
 * Recommendations Component
 */
const Recommendations: React.FC<{ well: WellSummary }> = ({ well }) => {
  // Generate AI recommendations based on well status
  const recommendations: string[] = [];

  if (well.status === 'critical') {
    recommendations.push('🔴 URGENT: Schedule immediate inspection due to critical pressure levels');
    recommendations.push('Consider temporary production reduction until issue is resolved');
  }

  if (well.status === 'degraded') {
    recommendations.push('🟡 Schedule diagnostic check within 48 hours');
    recommendations.push('Monitor sensor readings every 4 hours');
  }

  if (well.healthScore < 70) {
    recommendations.push('Review maintenance schedule - consider increasing frequency');
    recommendations.push('Analyze historical data for declining performance trends');
  }

  if (well.alertCount > 3) {
    recommendations.push('Multiple alerts detected - prioritize resolution of critical issues');
  }

  // Always add some general recommendations
  recommendations.push('Continue routine monitoring and data collection');
  recommendations.push('Maintain detailed maintenance logs for trend analysis');

  return (
    <Container
      header={
        <Header variant="h2">
          <SpaceBetween direction="horizontal" size="xs">
            <span>💡</span>
            <span>AI-Generated Recommendations</span>
          </SpaceBetween>
        </Header>
      }
    >
      <SpaceBetween size="s">
        {recommendations.map((recommendation, index) => (
          <Box key={index} padding="s" variant="div">
            <SpaceBetween direction="horizontal" size="s">
              <Box variant="span" color="text-body-secondary">
                {index + 1}.
              </Box>
              <Box variant="p">
                {recommendation}
              </Box>
            </SpaceBetween>
          </Box>
        ))}
      </SpaceBetween>
    </Container>
  );
};

/**
 * Action Buttons Component
 */
const ActionButtons: React.FC<{
  wellId: string;
  onScheduleMaintenance?: (wellId: string) => void;
  onExportReport?: (wellId: string) => void;
}> = ({ wellId, onScheduleMaintenance, onExportReport }) => {
  return (
    <Container>
      <SpaceBetween direction="horizontal" size="s">
        <Button
          variant="primary"
          iconName="calendar"
          onClick={() => onScheduleMaintenance?.(wellId)}
        >
          Schedule Maintenance
        </Button>

        <Button
          variant="normal"
          iconName="download"
          onClick={() => onExportReport?.(wellId)}
        >
          Export Report
        </Button>

        <Button
          variant="normal"
          iconName="view-full"
        >
          View History
        </Button>
      </SpaceBetween>
    </Container>
  );
};

/**
 * Main Individual Well View Component
 */
export const IndividualWellView: React.FC<IndividualWellViewProps> = ({
  well,
  onBackToConsolidated,
  onScheduleMaintenance,
  onExportReport
}) => {
  console.log('🔍 Rendering Individual Well View');
  console.log(`   Well ID: ${well.id}`);
  console.log(`   Well Name: ${well.name}`);
  console.log(`   Health Score: ${well.healthScore}`);
  console.log(`   Status: ${well.status}`);

  return (
    <SpaceBetween size="l">
      {/* Well Header */}
      <WellHeader well={well} onBackToConsolidated={onBackToConsolidated} />

      {/* Sensor Dashboard */}
      <SensorDashboard well={well} />

      {/* Alerts Panel */}
      <AlertsPanel well={well} />

      {/* Two-column layout for maintenance and production */}
      <Grid gridDefinition={[
        { colspan: { default: 12, s: 6 } },
        { colspan: { default: 12, s: 6 } }
      ]}>
        <MaintenanceTimeline well={well} />
        <ProductionMetrics well={well} />
      </Grid>

      {/* Recommendations */}
      <Recommendations well={well} />

      {/* Action Buttons */}
      <ActionButtons
        wellId={well.id}
        onScheduleMaintenance={onScheduleMaintenance}
        onExportReport={onExportReport}
      />
    </SpaceBetween>
  );
};

export default IndividualWellView;
