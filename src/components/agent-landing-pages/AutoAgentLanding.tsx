import React from 'react';
import { Container, Header, Box, SpaceBetween, Badge, ColumnLayout, ExpandableSection, Cards } from '@cloudscape-design/components';
import AgentVisualization from './AgentVisualization';

interface AutoAgentLandingProps {
  onWorkflowSelect?: (prompt: string) => void;
}

const AutoAgentLanding: React.FC<AutoAgentLandingProps> = React.memo(({ onWorkflowSelect }) => {
  const exampleQueries = [
    {
      title: 'Well Data Analysis',
      description: 'Analyze well data for WELL-001',
      prompt: 'Analyze well data for WELL-001'
    },
    {
      title: 'Equipment Health Check',
      description: 'Check equipment health for PUMP-001',
      prompt: 'Check equipment health for PUMP-001'
    },
    {
      title: 'Wind Farm Design',
      description: 'Design a wind farm layout for coordinates (35.0, -101.0)',
      prompt: 'Design a wind farm layout for coordinates (35.0, -101.0)'
    },
    {
      title: 'Minecraft Visualization',
      description: 'Visualize wellbore trajectory in Minecraft',
      prompt: 'Visualize wellbore trajectory in Minecraft'
    }
  ];

  return (
    <Container
      header={
        <Header variant="h2">
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span role="img" aria-label="Robot icon">🤖</span>
            <span>Auto Agent</span>
          </span>
        </Header>
      }
    >
      <SpaceBetween direction="vertical" size="l">
        {/* Agent Visualization */}
        <AgentVisualization type="auto" size="medium" />

        {/* Bio/Introduction */}
        <section aria-labelledby="auto-agent-intro">
          <Box variant="h3" padding={{ bottom: 's' }}>Intelligent Query Routing</Box>
          <Box color="text-body-secondary">
            The Auto Agent automatically analyzes your queries and routes them to the most 
            appropriate specialized agent. Using advanced intent detection, it understands 
            the context of your request and seamlessly connects you with the right expertise—whether 
            you need petrophysical analysis, equipment maintenance insights, renewable energy 
            site design, or Minecraft-based subsurface visualization.
          </Box>
        </section>

        {/* Capabilities */}
        <section aria-labelledby="auto-agent-capabilities">
          <Box variant="h3" padding={{ bottom: 's' }}>Core Capabilities</Box>
          <ColumnLayout columns={2} variant="text-grid">
            <Box>
              <Box fontWeight="bold" padding={{ bottom: 'xxs' }}>
                <span role="img" aria-label="Checkmark">✓</span> Intent Detection
              </Box>
              <Box color="text-body-secondary" fontSize="body-s">
                Analyzes natural language queries to understand user intent
              </Box>
            </Box>
            <Box>
              <Box fontWeight="bold" padding={{ bottom: 'xxs' }}>
                <span role="img" aria-label="Checkmark">✓</span> Smart Routing
              </Box>
              <Box color="text-body-secondary" fontSize="body-s">
                Routes queries to the most appropriate specialized agent
              </Box>
            </Box>
            <Box>
              <Box fontWeight="bold" padding={{ bottom: 'xxs' }}>
                <span role="img" aria-label="Checkmark">✓</span> Multi-Agent Coordination
              </Box>
              <Box color="text-body-secondary" fontSize="body-s">
                Coordinates between multiple agents for complex workflows
              </Box>
            </Box>
            <Box>
              <Box fontWeight="bold" padding={{ bottom: 'xxs' }}>
                <span role="img" aria-label="Checkmark">✓</span> Context Awareness
              </Box>
              <Box color="text-body-secondary" fontSize="body-s">
                Maintains conversation context across agent transitions
              </Box>
            </Box>
          </ColumnLayout>
        </section>

        {/* Specialized Agents List */}
        <section aria-labelledby="auto-agent-routes">
          <Box variant="h3" padding={{ bottom: 's' }}>Routes to Specialized Agents</Box>
          <SpaceBetween direction="vertical" size="s">
            <div>
              <Badge color="blue">Petrophysics Agent</Badge>
              <Box color="text-body-secondary" fontSize="body-s" padding={{ left: 's' }}>
                Well log analysis, porosity calculations, and reservoir characterization
              </Box>
            </div>
            
            <div>
              <Badge color="green">Maintenance Agent</Badge>
              <Box color="text-body-secondary" fontSize="body-s" padding={{ left: 's' }}>
                Equipment health monitoring, failure prediction, and maintenance planning
              </Box>
            </div>
            
            <div>
              <Badge color="blue">Renewable Energy Agent</Badge>
              <Box color="text-body-secondary" fontSize="body-s" padding={{ left: 's' }}>
                Wind farm site design, layout optimization, and energy analysis
              </Box>
            </div>
            
            <div>
              <Badge>EDIcraft Agent</Badge>
              <Box color="text-body-secondary" fontSize="body-s" padding={{ left: 's' }}>
                Minecraft-based subsurface data visualization and 3D wellbore rendering
              </Box>
            </div>
          </SpaceBetween>
        </section>

        {/* Example Queries */}
        <section aria-labelledby="auto-agent-examples">
          <ExpandableSection 
            headerText="Example Queries" 
            variant="container"
            headerAriaLabel="Expand to view example queries for the Auto Agent"
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
                          aria-label={`Try example query: ${item.title}`}
                        >
                          Try this query →
                        </a>
                      </Box>
                    )
                  }
                ]
              }}
              items={exampleQueries}
              cardsPerRow={[{ cards: 1 }, { minWidth: 500, cards: 2 }]}
              ariaLabels={{
                itemSelectionLabel: (e, item) => `Select ${item.title}`,
                selectionGroupLabel: "Example queries"
              }}
            />
          </ExpandableSection>
        </section>
      </SpaceBetween>
    </Container>
  );
});

AutoAgentLanding.displayName = 'AutoAgentLanding';

export default AutoAgentLanding;
