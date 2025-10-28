import React from 'react';
import { Container, Header, Box, SpaceBetween, ColumnLayout, ExpandableSection, Cards } from '@cloudscape-design/components';
import AgentVisualization from './AgentVisualization';

interface MaintenanceAgentLandingProps {
  onWorkflowSelect?: (prompt: string) => void;
}

const MaintenanceAgentLanding: React.FC<MaintenanceAgentLandingProps> = React.memo(({ onWorkflowSelect }) => {
  const exampleUseCases = [
    {
      title: 'Equipment Health Assessment',
      description: 'Assess the current health status of pumps, compressors, and other equipment',
      prompt: 'Assess health of PUMP-001'
    },
    {
      title: 'Failure Prediction',
      description: 'Predict potential equipment failures based on sensor data and historical patterns',
      prompt: 'Predict failures for COMPRESSOR-001'
    },
    {
      title: 'Maintenance Schedule',
      description: 'Generate optimized maintenance schedules based on equipment condition',
      prompt: 'Generate maintenance schedule for all equipment'
    },
    {
      title: 'Inspection Planning',
      description: 'Plan and prioritize equipment inspections based on risk assessment',
      prompt: 'Plan inspections for high-risk equipment'
    }
  ];

  return (
    <Container
      header={
        <Header variant="h2">
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span role="img" aria-label="Gear icon">⚙️</span>
            <span>Maintenance Agent</span>
          </span>
        </Header>
      }
    >
      <SpaceBetween direction="vertical" size="l">
        {/* Agent Visualization */}
        <AgentVisualization type="maintenance" size="medium" />

        {/* Bio/Introduction */}
        <section aria-labelledby="maint-agent-intro">
          <Box variant="h3" padding={{ bottom: 's' }}>Equipment Monitoring & Predictive Maintenance</Box>
          <Box color="text-body-secondary">
            The Maintenance Agent specializes in monitoring equipment health and predicting potential 
            failures before they occur. Using sensor data, historical maintenance records, and machine 
            learning algorithms, it provides actionable insights for maintenance planning, inspection 
            scheduling, and asset lifecycle management. The agent helps reduce downtime, optimize 
            maintenance costs, and extend equipment lifespan.
          </Box>
        </section>

        {/* Capabilities */}
        <section aria-labelledby="maint-agent-capabilities">
          <Box variant="h3" padding={{ bottom: 's' }}>Key Capabilities</Box>
          <ColumnLayout columns={2} variant="text-grid">
            <Box>
              <Box fontWeight="bold" padding={{ bottom: 'xxs' }}>
                <span role="img" aria-label="Checkmark">✓</span> Health Assessment
              </Box>
              <Box color="text-body-secondary" fontSize="body-s">
                Real-time monitoring and assessment of equipment health status
              </Box>
            </Box>
            <Box>
              <Box fontWeight="bold" padding={{ bottom: 'xxs' }}>
                <span role="img" aria-label="Checkmark">✓</span> Failure Prediction
              </Box>
              <Box color="text-body-secondary" fontSize="body-s">
                Predictive analytics to identify potential failures before they occur
              </Box>
            </Box>
            <Box>
              <Box fontWeight="bold" padding={{ bottom: 'xxs' }}>
                <span role="img" aria-label="Checkmark">✓</span> Maintenance Planning
              </Box>
              <Box color="text-body-secondary" fontSize="body-s">
                Optimized maintenance schedules based on equipment condition and priorities
              </Box>
            </Box>
            <Box>
              <Box fontWeight="bold" padding={{ bottom: 'xxs' }}>
                <span role="img" aria-label="Checkmark">✓</span> Inspection Scheduling
              </Box>
              <Box color="text-body-secondary" fontSize="body-s">
                Risk-based inspection planning and resource allocation
              </Box>
            </Box>
            <Box>
              <Box fontWeight="bold" padding={{ bottom: 'xxs' }}>
                <span role="img" aria-label="Checkmark">✓</span> Asset Lifecycle Management
              </Box>
              <Box color="text-body-secondary" fontSize="body-s">
                Track equipment lifecycle from installation to decommissioning
              </Box>
            </Box>
            <Box>
              <Box fontWeight="bold" padding={{ bottom: 'xxs' }}>
                <span role="img" aria-label="Checkmark">✓</span> Anomaly Detection
              </Box>
              <Box color="text-body-secondary" fontSize="body-s">
                Identify unusual patterns in sensor data that may indicate issues
              </Box>
            </Box>
          </ColumnLayout>
        </section>

        {/* Equipment Types */}
        <section aria-labelledby="maint-agent-equipment">
          <Box variant="h3" padding={{ bottom: 's' }}>Supported Equipment Types</Box>
          <Box color="text-body-secondary">
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li>Pumps and Compressors</li>
              <li>Wellhead Equipment</li>
              <li>Production Facilities</li>
              <li>Pipeline Infrastructure</li>
              <li>Rotating Equipment</li>
              <li>Control Systems</li>
            </ul>
          </Box>
        </section>

        {/* Example Use Cases */}
        <section aria-labelledby="maint-agent-examples">
          <ExpandableSection 
            headerText="Example Use Cases" 
            variant="container"
            headerAriaLabel="Expand to view example use cases for the Maintenance Agent"
          >
            <Cards
              cardDefinition={{
                header: item => item.title,
                sections: [
                  {
                    id: 'description',
                    content: item => item.description
                  },
                  {
                    id: 'action',
                    content: item => (
                      <Box textAlign="right">
                        <a
                          href="#"
                          onClick={() => {
                            onWorkflowSelect?.(item.prompt);
                          }}
                          aria-label={`Start analysis: ${item.title}`}
                        >
                          Start analysis →
                        </a>
                      </Box>
                    )
                  }
                ]
              }}
              items={exampleUseCases}
              cardsPerRow={[{ cards: 1 }, { minWidth: 500, cards: 2 }]}
              ariaLabels={{
                itemSelectionLabel: (e, item) => `Select ${item.title}`,
                selectionGroupLabel: "Example use cases"
              }}
            />
          </ExpandableSection>
        </section>
      </SpaceBetween>
    </Container>
  );
});

MaintenanceAgentLanding.displayName = 'MaintenanceAgentLanding';

export default MaintenanceAgentLanding;
