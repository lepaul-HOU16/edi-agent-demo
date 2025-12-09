import React from 'react';
import { Container, Header, Box, SpaceBetween, ColumnLayout, ExpandableSection, Cards } from '@cloudscape-design/components';
import AgentVisualization from './AgentVisualization';

interface PetrophysicsAgentLandingProps {
  onWorkflowSelect?: (prompt: string) => void;
}

const PetrophysicsAgentLanding: React.FC<PetrophysicsAgentLandingProps> = React.memo(({ onWorkflowSelect }) => {
  const exampleWorkflows = [
    {
      title: 'Porosity Calculation',
      description: 'Calculate porosity for a specific well using density and neutron logs',
      prompt: 'Calculate porosity for WELL-004'
    },
    {
      title: 'Shale Volume Analysis',
      description: 'Perform shale volume analysis using gamma ray logs',
      prompt: 'Perform shale analysis for WELL-002'
    },
    {
      title: 'Multi-Well Correlation',
      description: 'Correlate multiple wells to identify geological markers',
      prompt: 'Correlate wells WELL-001, WELL-002, and WELL-003'
    },
    {
      title: 'Data Quality Assessment',
      description: 'Assess the quality and completeness of well log data',
      prompt: 'Assess data quality for WELL-001'
    }
  ];

  return (
    <Container
      header={
        <Header variant="h2">
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span role="img" aria-label="Chart icon">📊</span>
            <span>Petrophysics Agent</span>
          </span>
        </Header>
      }
    >
      <SpaceBetween direction="vertical" size="l">
        {/* Agent Visualization */}
        <AgentVisualization type="petrophysics" size="medium" />

        {/* Bio/Introduction */}
        <section aria-labelledby="petro-agent-intro">
          <Box variant="h3" padding={{ bottom: 's' }}>Well Log Analysis & Reservoir Characterization</Box>
          <Box color="text-body-secondary">
            The Petrophysics Agent specializes in analyzing well log data to characterize subsurface 
            reservoirs. It performs industry-standard calculations for porosity, shale volume, water 
            saturation, and permeability. With expertise in multi-well correlation and data quality 
            assessment, it helps geoscientists make informed decisions about reservoir properties 
            and hydrocarbon potential.
          </Box>
        </section>

        {/* Capabilities */}
        <section aria-labelledby="petro-agent-capabilities">
          <Box variant="h3" padding={{ bottom: 's' }}>Key Capabilities</Box>
          <ColumnLayout columns={2} variant="text-grid">
            <Box>
              <Box fontWeight="bold" padding={{ bottom: 'xxs' }}>
                <span role="img" aria-label="Checkmark">✓</span> Porosity Calculation
              </Box>
              <Box color="text-body-secondary" fontSize="body-s">
                Density-neutron crossplot analysis and effective porosity determination
              </Box>
            </Box>
            <Box>
              <Box fontWeight="bold" padding={{ bottom: 'xxs' }}>
                <span role="img" aria-label="Checkmark">✓</span> Shale Volume Analysis
              </Box>
              <Box color="text-body-secondary" fontSize="body-s">
                Gamma ray-based shale volume estimation using linear and non-linear methods
              </Box>
            </Box>
            <Box>
              <Box fontWeight="bold" padding={{ bottom: 'xxs' }}>
                <span role="img" aria-label="Checkmark">✓</span> Multi-Well Correlation
              </Box>
              <Box color="text-body-secondary" fontSize="body-s">
                Cross-well correlation to identify geological markers and formation tops
              </Box>
            </Box>
            <Box>
              <Box fontWeight="bold" padding={{ bottom: 'xxs' }}>
                <span role="img" aria-label="Checkmark">✓</span> Data Quality Assessment
              </Box>
              <Box color="text-body-secondary" fontSize="body-s">
                Completeness analysis, outlier detection, and data validation
              </Box>
            </Box>
            <Box>
              <Box fontWeight="bold" padding={{ bottom: 'xxs' }}>
                <span role="img" aria-label="Checkmark">✓</span> Water Saturation
              </Box>
              <Box color="text-body-secondary" fontSize="body-s">
                Archie equation-based water saturation calculations
              </Box>
            </Box>
            <Box>
              <Box fontWeight="bold" padding={{ bottom: 'xxs' }}>
                <span role="img" aria-label="Checkmark">✓</span> Professional Reporting
              </Box>
              <Box color="text-body-secondary" fontSize="body-s">
                SPE and API standard-compliant analysis reports
              </Box>
            </Box>
          </ColumnLayout>
        </section>

        {/* Example Workflows */}
        <section aria-labelledby="petro-agent-examples">
          <ExpandableSection 
            headerText="Example Workflows" 
            variant="container"
            headerAriaLabel="Expand to view example workflows for the Petrophysics Agent"
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

PetrophysicsAgentLanding.displayName = 'PetrophysicsAgentLanding';

export default PetrophysicsAgentLanding;
