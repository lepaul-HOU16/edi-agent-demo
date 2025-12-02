import React from 'react';
import { Container, Header, Box, SpaceBetween, ColumnLayout, ExpandableSection, Cards, StatusIndicator, Button, Alert } from '@cloudscape-design/components';
import AgentVisualization from './AgentVisualization';

interface EDIcraftAgentLandingProps {
  onWorkflowSelect?: (prompt: string) => void;
  onSendMessage?: (message: string) => Promise<void>;
}

const EDIcraftAgentLanding: React.FC<EDIcraftAgentLandingProps> = React.memo(({ onWorkflowSelect, onSendMessage }) => {
  // In a real implementation, this would check actual server status
  const serverStatus = 'success'; // 'success' | 'warning' | 'error' | 'info'
  const serverUrl = 'edicraft.nigelgardiner.com:49000';

  // State for clear environment operation
  const [isClearing, setIsClearing] = React.useState(false);
  const [clearResult, setClearResult] = React.useState<{ type: 'success' | 'error', message: string } | null>(null);

  const handleClearEnvironment = async () => {
    console.log('[CLEAR BUTTON] Button clicked - executing clear via chat');
    setIsClearing(true);
    setClearResult(null);

    try {
      // Use the onSendMessage callback if provided (sends through chat)
      if (onSendMessage) {
        console.log('[CLEAR BUTTON] Sending clear message through chat');
        await onSendMessage('Clear the Minecraft environment and fill any terrain holes');

        setClearResult({
          type: 'success',
          message: 'Clear command sent! Check the chat for results.'
        });
      }

      // Hide the message after 5 seconds
      setTimeout(() => {
        setClearResult(null);
      }, 5000);

    } catch (error) {
      console.error('[CLEAR BUTTON] Error clearing environment:', error);
      setClearResult({
        type: 'error',
        message: 'Failed to clear environment. Please try again.'
      });
    } finally {
      setIsClearing(false);
    }
  };

  const exampleWorkflows = [
    {
      title: 'Available Commands',
      description: 'Learn what EDIcraft can do and available commands',
      prompt: 'What can you help me with in Minecraft?'
    },
    {
      title: 'Horizon Surface Rendering',
      description: 'Render geological horizon surfaces as Minecraft terrain',
      prompt: 'Visualize horizon surface in Minecraft'
    },
    {
      title: 'OSDU Data Search',
      description: 'Search OSDU platform for wellbores and geological data',
      prompt: 'Search OSDU for wellbores in the area'
    },
    {
      title: 'Coordinate Transformation',
      description: 'Transform UTM coordinates to Minecraft coordinate system',
      prompt: 'Transform coordinates to Minecraft system'
    }
  ];

  return (
    <Container
      header={
        <Header variant="h2">
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🎮</span>
            <span>EDIcraft Agent</span>
          </span>
        </Header>
      }
    >
      <SpaceBetween direction="vertical" size="l">
        {/* Agent Visualization */}
        <Box textAlign="center">
          <AgentVisualization type="edicraft" size="medium" />
        </Box>

        {/* Bio/Introduction */}
        <Box>
          <Box variant="h3" padding={{ bottom: 's' }}>Minecraft-Based Subsurface Visualization</Box>
          <Box color="text-body-secondary">
            The EDIcraft Agent brings subsurface data to life in a Minecraft environment, providing
            an immersive 3D visualization experience. It integrates with the OSDU platform to retrieve
            wellbore trajectories, geological horizons, and other subsurface data, then renders them
            as Minecraft structures. This unique approach makes complex geological data more intuitive
            and accessible, enabling collaborative exploration and analysis in a familiar gaming environment.
          </Box>
        </Box>

        {/* Minecraft Server Status */}
        <Box>
          <Box variant="h3" padding={{ bottom: 's' }}>Minecraft Server Connection</Box>
          <Box>
            <SpaceBetween direction="vertical" size="xs">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <StatusIndicator type={serverStatus}>
                  {serverStatus === 'success' ? 'Connected' :
                    serverStatus === 'warning' ? 'Connecting' :
                      serverStatus === 'error' ? 'Disconnected' : 'Unknown'}
                </StatusIndicator>
                {/* <Box color="text-body-secondary" fontSize="body-s">
                  Server: {serverUrl}
                </Box> */}
              </div>
              <Box color="text-body-secondary" fontSize="body-s">
                The EDIcraft agent communicates with a dedicated Minecraft server to build
                and visualize subsurface data in real-time.
              </Box>
            </SpaceBetween>
          </Box>
        </Box>

        {/* Capabilities */}
        <Box>
          <Box variant="h3" padding={{ bottom: 's' }}>Key Capabilities</Box>
          <ColumnLayout columns={2} variant="text-grid">
            <Box>
              <Box fontWeight="bold" padding={{ bottom: 'xxs' }}>✓ Wellbore Trajectory Visualization</Box>
              <Box color="text-body-secondary" fontSize="body-s">
                3D rendering of wellbore paths with depth markers and annotations
              </Box>
            </Box>
            <Box>
              <Box fontWeight="bold" padding={{ bottom: 'xxs' }}>✓ Horizon Surface Rendering</Box>
              <Box color="text-body-secondary" fontSize="body-s">
                Geological horizon surfaces rendered as Minecraft terrain layers
              </Box>
            </Box>
            <Box>
              <Box fontWeight="bold" padding={{ bottom: 'xxs' }}>✓ OSDU Data Integration</Box>
              <Box color="text-body-secondary" fontSize="body-s">
                Direct integration with OSDU platform for data retrieval
              </Box>
            </Box>
            <Box>
              <Box fontWeight="bold" padding={{ bottom: 'xxs' }}>✓ Real-time Building</Box>
              <Box color="text-body-secondary" fontSize="body-s">
                Live construction of geological structures in Minecraft
              </Box>
            </Box>
            <Box>
              <Box fontWeight="bold" padding={{ bottom: 'xxs' }}>✓ Coordinate Transformation</Box>
              <Box color="text-body-secondary" fontSize="body-s">
                Automatic conversion between UTM and Minecraft coordinate systems
              </Box>
            </Box>
            <Box>
              <Box fontWeight="bold" padding={{ bottom: 'xxs' }}>✓ Player Position Tracking</Box>
              <Box color="text-body-secondary" fontSize="body-s">
                Track player location and provide contextual geological information
              </Box>
            </Box>
          </ColumnLayout>
        </Box>

        {/* Technical Details */}
        <Box>
          <Box variant="h3" padding={{ bottom: 's' }}>Technical Integration</Box>
          <Box color="text-body-secondary">
            <SpaceBetween direction="vertical" size="xs">
              <Box>• RCON protocol for Minecraft server communication</Box>
              <Box>• OSDU platform API integration for data retrieval</Box>
              <Box>• Automatic coordinate system transformation</Box>
              <Box>• Block-based geological structure representation</Box>
              <Box>• Multi-player collaborative exploration support</Box>
              <Box>• Real-time feedback and progress updates</Box>
            </SpaceBetween>
          </Box>
        </Box>

        {/* Example Workflows */}
        <ExpandableSection headerText="Example Workflows" variant="container">
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
                        onClick={(e) => {
                          e.preventDefault();
                          onWorkflowSelect?.(item.prompt);
                        }}
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
          />
        </ExpandableSection>

        {/* Note about visualization */}
        <Box variant="awsui-key-label">
          <Box color="text-body-secondary" fontSize="body-s">
            <strong>Note:</strong> Visualizations are created in the external Minecraft server environment.
            The agent provides text feedback about what has been built, but the actual 3D visualization
            must be viewed by connecting to the Minecraft server at {serverUrl}.
          </Box>
        </Box>

        {/* Environment Controls */}
        <Box>
          <Box variant="h3" padding={{ bottom: 's' }}>Environment Controls</Box>
          <SpaceBetween direction="vertical" size="s">
            {clearResult && (
              <Alert
                type={clearResult.type}
                dismissible
                onDismiss={() => setClearResult(null)}
              >
                {clearResult.message}
              </Alert>
            )}
            <Box>
              <Button
                variant="normal"
                iconName="remove"
                loading={isClearing}
                onClick={handleClearEnvironment}
                fullWidth
              >
                Clear Minecraft Environment
              </Button>
            </Box>
            <Box color="text-body-secondary" fontSize="body-s">
              Clears the Minecraft environment by removing all structures (wellbores, rigs, markers) 
              and entities. Uses chunk-based clearing to remove blocks while preserving terrain. 
              The agent will show progress and results in the chat. 
              Ideal for demo preparation or complete environment reset.
            </Box>
          </SpaceBetween>
        </Box>
      </SpaceBetween>
    </Container>
  );
});

EDIcraftAgentLanding.displayName = 'EDIcraftAgentLanding';

export default EDIcraftAgentLanding;
