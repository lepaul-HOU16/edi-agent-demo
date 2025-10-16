import React from 'react';
import { 
  Container, 
  Header, 
  Box, 
  SpaceBetween, 
  Badge, 
  ColumnLayout,
  ProgressBar
} from '@cloudscape-design/components';

interface MaintenanceEvent {
  date: string;
  type: 'installation' | 'preventive' | 'corrective' | 'inspection' | 'upgrade';
  description: string;
  cost: number;
  downtime?: number; // hours
}

interface AssetLifecycleData {
  equipmentId: string;
  equipmentName: string;
  installDate: string;
  currentAge: number; // years
  expectedLifespan: number; // years
  predictedEndOfLife: string;
  totalCostOfOwnership: number;
  maintenanceEvents: MaintenanceEvent[];
  maintenanceFrequency: {
    preventive: number; // per year
    corrective: number; // per year
    trend: 'increasing' | 'stable' | 'decreasing';
  };
  performanceMetrics: {
    availability: number; // percentage
    reliability: number; // percentage
    efficiency: number; // percentage
  };
}

interface AssetLifecycleArtifactProps {
  data: {
    messageContentType: 'asset_lifecycle';
    title?: string;
    subtitle?: string;
    lifecycle: AssetLifecycleData;
  };
}

export const AssetLifecycleArtifact: React.FC<AssetLifecycleArtifactProps> = ({ data }) => {
  const lifecycle = data.lifecycle;

  // Calculate lifecycle progress
  const lifecycleProgress = (lifecycle.currentAge / lifecycle.expectedLifespan) * 100;
  const remainingLife = lifecycle.expectedLifespan - lifecycle.currentAge;

  // Get event type styling
  const getEventTypeBadge = (type: string) => {
    const typeMap: Record<string, { color: any; icon: string }> = {
      installation: { color: 'blue', icon: '🔧' },
      preventive: { color: 'green', icon: '✓' },
      corrective: { color: 'red', icon: '⚠️' },
      inspection: { color: 'grey', icon: '🔍' },
      upgrade: { color: 'blue', icon: '⬆️' }
    };
    return typeMap[type] || typeMap.inspection;
  };

  // Render timeline
  const renderTimeline = () => {
    const sortedEvents = [...lifecycle.maintenanceEvents].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const installDate = new Date(lifecycle.installDate);
    const now = new Date();
    const eolDate = new Date(lifecycle.predictedEndOfLife);
    const totalSpan = eolDate.getTime() - installDate.getTime();

    const width = 800;
    const height = 200;
    const padding = { top: 40, right: 40, bottom: 40, left: 40 };
    const timelineWidth = width - padding.left - padding.right;

    return (
      <svg width={width} height={height}>
        {/* Timeline bar */}
        <rect
          x={padding.left}
          y={height / 2 - 10}
          width={timelineWidth}
          height={20}
          fill="#e9ebed"
          rx="10"
        />

        {/* Progress bar */}
        <rect
          x={padding.left}
          y={height / 2 - 10}
          width={(lifecycleProgress / 100) * timelineWidth}
          height={20}
          fill={lifecycleProgress > 80 ? '#d91515' : lifecycleProgress > 60 ? '#df7c00' : '#0972d3'}
          rx="10"
        />

        {/* Current position marker */}
        <g>
          <line
            x1={padding.left + (lifecycleProgress / 100) * timelineWidth}
            y1={height / 2 - 30}
            x2={padding.left + (lifecycleProgress / 100) * timelineWidth}
            y2={height / 2 + 30}
            stroke="#000"
            strokeWidth="2"
          />
          <text
            x={padding.left + (lifecycleProgress / 100) * timelineWidth}
            y={height / 2 - 35}
            textAnchor="middle"
            fontSize="12"
            fontWeight="bold"
            fill="#000"
          >
            NOW
          </text>
        </g>

        {/* Start marker */}
        <g>
          <circle cx={padding.left} cy={height / 2} r="8" fill="#0972d3" />
          <text
            x={padding.left}
            y={height / 2 + 30}
            textAnchor="middle"
            fontSize="11"
            fill="#5f6b7a"
          >
            Install
          </text>
          <text
            x={padding.left}
            y={height / 2 + 45}
            textAnchor="middle"
            fontSize="10"
            fill="#5f6b7a"
          >
            {installDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
          </text>
        </g>

        {/* End marker */}
        <g>
          <circle cx={padding.left + timelineWidth} cy={height / 2} r="8" fill="#d91515" />
          <text
            x={padding.left + timelineWidth}
            y={height / 2 + 30}
            textAnchor="middle"
            fontSize="11"
            fill="#5f6b7a"
          >
            EOL
          </text>
          <text
            x={padding.left + timelineWidth}
            y={height / 2 + 45}
            textAnchor="middle"
            fontSize="10"
            fill="#5f6b7a"
          >
            {eolDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
          </text>
        </g>

        {/* Event markers */}
        {sortedEvents.slice(0, 10).map((event, index) => {
          const eventDate = new Date(event.date);
          const position = ((eventDate.getTime() - installDate.getTime()) / totalSpan) * timelineWidth;
          const eventBadge = getEventTypeBadge(event.type);
          
          return (
            <g key={index}>
              <circle
                cx={padding.left + position}
                cy={height / 2}
                r="5"
                fill={
                  event.type === 'corrective' ? '#d91515' :
                  event.type === 'preventive' ? '#037f0c' : '#0972d3'
                }
              />
              <text
                x={padding.left + position}
                y={height / 2 - 15}
                textAnchor="middle"
                fontSize="16"
              >
                {eventBadge.icon}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <Container
      header={
        <Header
          variant="h2"
          description={data.subtitle || `Complete lifecycle analysis for ${lifecycle.equipmentName}`}
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Badge color={lifecycleProgress > 80 ? 'red' : lifecycleProgress > 60 ? 'blue' : 'green'}>
                {lifecycleProgress.toFixed(0)}% lifecycle
              </Badge>
              <Badge color="grey">
                {remainingLife.toFixed(1)} years remaining
              </Badge>
            </SpaceBetween>
          }
        >
          {data.title || 'Asset Lifecycle Analysis'}
        </Header>
      }
    >
      <SpaceBetween size="l">
        {/* Lifecycle Overview */}
        <ColumnLayout columns={4} variant="text-grid">
          <div>
            <Box variant="awsui-key-label">Current Age</Box>
            <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px' }}>
              {lifecycle.currentAge.toFixed(1)} years
            </div>
          </div>
          <div>
            <Box variant="awsui-key-label">Expected Lifespan</Box>
            <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px' }}>
              {lifecycle.expectedLifespan} years
            </div>
          </div>
          <div>
            <Box variant="awsui-key-label">Remaining Life</Box>
            <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px', color: remainingLife < 2 ? '#d91515' : '#000' }}>
              {remainingLife.toFixed(1)} years
            </div>
          </div>
          <div>
            <Box variant="awsui-key-label">Total Cost of Ownership</Box>
            <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px' }}>
              ${lifecycle.totalCostOfOwnership.toLocaleString()}
            </div>
          </div>
        </ColumnLayout>

        {/* Lifecycle Timeline */}
        <Box>
          <Box variant="awsui-key-label" margin={{ bottom: 's' }}>
            Lifecycle Timeline
          </Box>
          <div style={{ 
            padding: '16px', 
            backgroundColor: '#fff', 
            borderRadius: '8px',
            border: '1px solid #e9ebed'
          }}>
            {renderTimeline()}
          </div>
          <Box variant="small" color="text-body-secondary" margin={{ top: 'xs' }}>
            Showing {Math.min(lifecycle.maintenanceEvents.length, 10)} of {lifecycle.maintenanceEvents.length} maintenance events
          </Box>
        </Box>

        {/* Performance Metrics */}
        <Box>
          <Box variant="awsui-key-label" margin={{ bottom: 's' }}>
            Performance Metrics
          </Box>
          <SpaceBetween size="s">
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>Availability</span>
                <span style={{ fontWeight: 'bold' }}>{lifecycle.performanceMetrics.availability.toFixed(1)}%</span>
              </div>
              <ProgressBar 
                value={lifecycle.performanceMetrics.availability} 
                status={lifecycle.performanceMetrics.availability < 90 ? 'error' : 'success'}
              />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>Reliability</span>
                <span style={{ fontWeight: 'bold' }}>{lifecycle.performanceMetrics.reliability.toFixed(1)}%</span>
              </div>
              <ProgressBar 
                value={lifecycle.performanceMetrics.reliability} 
                status={lifecycle.performanceMetrics.reliability < 85 ? 'error' : 'success'}
              />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>Efficiency</span>
                <span style={{ fontWeight: 'bold' }}>{lifecycle.performanceMetrics.efficiency.toFixed(1)}%</span>
              </div>
              <ProgressBar 
                value={lifecycle.performanceMetrics.efficiency} 
                status={lifecycle.performanceMetrics.efficiency < 80 ? 'error' : 'success'}
              />
            </div>
          </SpaceBetween>
        </Box>

        {/* Maintenance Frequency */}
        <Box>
          <Box variant="awsui-key-label" margin={{ bottom: 's' }}>
            Maintenance Frequency Trends
          </Box>
          <div style={{
            padding: '16px',
            borderRadius: '8px',
            backgroundColor: '#fafafa',
            border: '1px solid #e9ebed'
          }}>
            <ColumnLayout columns={3} variant="text-grid">
              <div>
                <Box variant="awsui-key-label">Preventive Maintenance</Box>
                <div style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '4px' }}>
                  {lifecycle.maintenanceFrequency.preventive} / year
                </div>
              </div>
              <div>
                <Box variant="awsui-key-label">Corrective Maintenance</Box>
                <div style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '4px', color: '#d91515' }}>
                  {lifecycle.maintenanceFrequency.corrective} / year
                </div>
              </div>
              <div>
                <Box variant="awsui-key-label">Trend</Box>
                <div style={{ marginTop: '4px' }}>
                  <Badge color={
                    lifecycle.maintenanceFrequency.trend === 'decreasing' ? 'green' :
                    lifecycle.maintenanceFrequency.trend === 'increasing' ? 'red' : 'grey'
                  }>
                    {lifecycle.maintenanceFrequency.trend === 'increasing' ? '↑' : 
                     lifecycle.maintenanceFrequency.trend === 'decreasing' ? '↓' : '→'} {lifecycle.maintenanceFrequency.trend}
                  </Badge>
                </div>
              </div>
            </ColumnLayout>
          </div>
        </Box>

        {/* Recent Maintenance Events */}
        <Box>
          <Box variant="awsui-key-label" margin={{ bottom: 's' }}>
            Recent Maintenance Events
          </Box>
          <SpaceBetween size="xs">
            {lifecycle.maintenanceEvents.slice(-5).reverse().map((event, index) => {
              const eventBadge = getEventTypeBadge(event.type);
              return (
                <div 
                  key={index}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: '#fff',
                    border: '1px solid #e9ebed',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                    <span style={{ fontSize: '20px' }}>{eventBadge.icon}</span>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{event.description}</div>
                      <div style={{ fontSize: '12px', color: '#5f6b7a' }}>
                        {new Date(event.date).toLocaleDateString()} • {' '}
                        <Badge color={eventBadge.color}>
                          {event.type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 'bold' }}>${event.cost.toLocaleString()}</div>
                    {event.downtime && (
                      <div style={{ fontSize: '12px', color: '#5f6b7a' }}>
                        {event.downtime}h downtime
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </SpaceBetween>
        </Box>

        <Box variant="small" color="text-body-secondary">
          Equipment: {lifecycle.equipmentName} ({lifecycle.equipmentId}) • 
          Installed: {new Date(lifecycle.installDate).toLocaleDateString()} • 
          Predicted EOL: {new Date(lifecycle.predictedEndOfLife).toLocaleDateString()}
        </Box>
      </SpaceBetween>
    </Container>
  );
};
