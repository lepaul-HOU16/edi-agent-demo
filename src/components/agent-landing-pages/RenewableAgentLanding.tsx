import React from 'react';
import { Container, Header, Box, SpaceBetween, ColumnLayout, ExpandableSection, Cards } from '@cloudscape-design/components';
import AgentVisualization from './AgentVisualization';

interface RenewableAgentLandingProps {
  onWorkflowSelect?: (prompt: string) => void;
}

const RenewableAgentLanding: React.FC<RenewableAgentLandingProps> = React.memo(({ onWorkflowSelect }) => {
  const exampleWorkflows = [
    {
      title: 'Terrain Analysis',
      description: 'Analyze terrain features, elevation, and land use for wind farm suitability',
      prompt: 'Analyze terrain for wind farm at coordinates (35.0, -101.0) with 5km radius'
    },
    {
      title: 'Layout Optimization',
      description: 'Optimize turbine placement to maximize energy production while minimizing wake effects',
      prompt: 'Optimize turbine layout for site at (35.0, -101.0)'
    },
    {
      title: 'Wind Rose Generation',
      description: 'Generate wind rose visualization showing wind speed and direction distribution',
      prompt: 'Generate wind rose for coordinates (35.0, -101.0)'
    },
    {
      title: 'Energy Production Modeling',
      description: 'Model annual energy production based on wind resources and turbine specifications',
      prompt: 'Model energy production for wind farm at (35.0, -101.0)'
    }
  ];

  return (
    <Container
      header={
        <Header variant="h2">
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span role="img" aria-label="Wind icon">🌬️</span>
            <span>Renewable Energy Agent</span>
          </span>
        </Header>
      }
    >
      <SpaceBetween direction="vertical" size="l">
        {/* Agent Visualization */}
        <AgentVisualization type="renewable" size="medium" />

        {/* Bio/Introduction */}
        <section aria-labelledby="renewable-agent-intro">
          <Box variant="h3" padding={{ bottom: 's' }}>Wind Farm Site Design & Optimization</Box>
          <Box color="text-body-secondary">
            The Renewable Energy Agent specializes in wind farm site analysis and design optimization. 
            It combines terrain analysis, wind resource assessment, and advanced optimization algorithms 
            to identify optimal turbine placements. The agent considers factors such as wind patterns, 
            terrain features, wake effects, environmental constraints, and energy production potential 
            to deliver comprehensive site design recommendations.
          </Box>
        </section>

        {/* Capabilities */}
        <section aria-labelledby="renewable-agent-capabilities">
          <Box variant="h3" padding={{ bottom: 's' }}>Key Capabilities</Box>
          <ColumnLayout columns={2} variant="text-grid">
            <Box>
              <Box fontWeight="bold" padding={{ bottom: 'xxs' }}>✓ Terrain Analysis</Box>
              <Box color="text-body-secondary" fontSize="body-s">
                Elevation mapping, slope analysis, and land use classification
              </Box>
            </Box>
            <Box>
              <Box fontWeight="bold" padding={{ bottom: 'xxs' }}>✓ Layout Optimization</Box>
              <Box color="text-body-secondary" fontSize="body-s">
                Genetic algorithm-based turbine placement optimization
              </Box>
            </Box>
            <Box>
              <Box fontWeight="bold" padding={{ bottom: 'xxs' }}>✓ Wind Rose Generation</Box>
              <Box color="text-body-secondary" fontSize="body-s">
                Interactive wind speed and direction distribution visualization
              </Box>
            </Box>
            <Box>
              <Box fontWeight="bold" padding={{ bottom: 'xxs' }}>✓ Energy Production Modeling</Box>
              <Box color="text-body-secondary" fontSize="body-s">
                Annual energy production (AEP) calculations and forecasting
              </Box>
            </Box>
            <Box>
              <Box fontWeight="bold" padding={{ bottom: 'xxs' }}>✓ Wake Effect Analysis</Box>
              <Box color="text-body-secondary" fontSize="body-s">
                PyWake-based wake modeling and energy loss assessment
              </Box>
            </Box>
            <Box>
              <Box fontWeight="bold" padding={{ bottom: 'xxs' }}>✓ Constraint Management</Box>
              <Box color="text-body-secondary" fontSize="body-s">
                Environmental, regulatory, and technical constraint compliance
              </Box>
            </Box>
          </ColumnLayout>
        </section>

        {/* Analysis Features */}
        <section aria-labelledby="renewable-agent-features">
          <Box variant="h3" padding={{ bottom: 's' }}>Analysis Features</Box>
          <Box color="text-body-secondary">
            <SpaceBetween direction="vertical" size="xs">
              <Box>• OpenStreetMap integration for terrain features</Box>
              <Box>• NREL wind resource data integration</Box>
              <Box>• Interactive map visualizations with Leaflet</Box>
              <Box>• Turbine wake simulation and visualization</Box>
              <Box>• Comprehensive site suitability reports</Box>
              <Box>• Multi-scenario comparison and optimization</Box>
            </SpaceBetween>
          </Box>
        </section>

        {/* Example Workflows */}
        <section aria-labelledby="renewable-agent-examples">
          <ExpandableSection 
            headerText="Example Workflows" 
            variant="container"
            headerAriaLabel="Expand to view example workflows for the Renewable Energy Agent"
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
                        aria-label={`Start workflow: ${item.title}`}
                      >
                        Start workflow →
                      </a>
                    </Box>
                  )
                }
              ]
            }}
            items={exampleWorkflows}
            cardsPerRow={[{ cards: 1 }, { minWidth: 500, cards: 2 }]}
            ariaLabels={{
              itemSelectionLabel: (e, item) => `Select ${item.title}`,
              selectionGroupLabel: "Example workflows"
            }}
          />
          </ExpandableSection>
        </section>
      </SpaceBetween>
    </Container>
  );
});

RenewableAgentLanding.displayName = 'RenewableAgentLanding';

export default RenewableAgentLanding;
