# Implementation Plan

- [x] 1. Update AgentSwitcher component to support EDIcraft agent
  - Add 'edicraft' to AgentType union type
  - Add EDIcraft option to dropdown items array
  - Add variant prop to distinguish panel vs input instances
  - Update styling for panel variant positioning
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Create AgentVisualization component with SVG illustrations
- [x] 2.1 Implement base AgentVisualization component
  - Create component file with size prop (small, medium, large)
  - Implement responsive SVG container with viewBox
  - Add ARIA labels and accessibility attributes
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 2.2 Create Auto Agent visualization (routing nodes)
  - Implement central AI node with connected specialized agent nodes
  - Use Cloudscape color palette (#0972D3, #037F0C, #5F6B7A, #8B46FF, #FF6B00)
  - Add connection lines showing intelligent routing
  - _Requirements: 4.3, 8.1, 8.2_

- [x] 2.3 Create Petrophysics Agent visualization (well logs)
  - Implement depth track and log curves (GR, Resistivity, Porosity)
  - Use appropriate colors for different curve types
  - Add curve labels and depth indicators
  - _Requirements: 5.3, 8.1, 8.2_

- [x] 2.4 Create Maintenance Agent visualization (equipment health)
  - Implement equipment outline with health indicators
  - Add status circles (green, yellow, red) with icons
  - Include sensor connection lines
  - _Requirements: 6.3, 8.1, 8.2_

- [x] 2.5 Create Renewable Energy visualization (wind turbines)
  - Implement terrain with multiple wind turbines
  - Add wind direction arrows
  - Use appropriate scaling and positioning
  - _Requirements: 7.3, 8.1, 8.2_

- [x] 2.6 Create EDIcraft visualization (Minecraft blocks)
  - Implement pixelated Minecraft-style blocks
  - Show surface blocks and wellbore blocks
  - Add coordinate indicators (Y=100, Y=50)
  - Include subsurface layers
  - _Requirements: 11.3, 8.1, 8.2_

- [x] 3. Create individual agent landing panel components
- [x] 3.1 Create AutoAgentLanding component
  - Implement Container with agent header and icon
  - Add bio section describing intelligent routing
  - Create capabilities grid with icons
  - List all 5 specialized agents (Petrophysics, Maintenance, Renewable, EDIcraft)
  - Add expandable section with example queries
  - Include AgentVisualization component
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 3.2 Create PetrophysicsAgentLanding component
  - Implement Container with agent header and icon
  - Add bio section describing well log analysis capabilities
  - Create capabilities list (porosity, shale volume, correlation, data quality)
  - Add example workflows section
  - Include AgentVisualization component
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 3.3 Create MaintenanceAgentLanding component
  - Implement Container with agent header and icon
  - Add bio section describing equipment monitoring capabilities
  - Create capabilities list (health assessment, failure prediction, maintenance planning, inspection scheduling)
  - Add example use cases section
  - Include AgentVisualization component
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 3.4 Create RenewableAgentLanding component
  - Implement Container with agent header and icon
  - Add bio section describing wind farm analysis capabilities
  - Create capabilities list (terrain analysis, layout optimization, wind rose, energy modeling)
  - Add example workflows section
  - Include AgentVisualization component
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 3.5 Create EDIcraftAgentLanding component
  - Implement Container with agent header and icon
  - Add bio section describing Minecraft visualization capabilities
  - Create capabilities list (wellbore visualization, horizon rendering, OSDU integration, real-time building)
  - Add Minecraft server connection status indicator
  - Add example workflows section
  - Include AgentVisualization component
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

- [x] 4. Create AgentLandingPage container component
  - Implement component with selectedAgent prop
  - Add switch statement to render appropriate landing component
  - Pass onWorkflowSelect callback to child components
  - Add Suspense wrapper for lazy loading
  - Implement loading fallback UI
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 5. Update ChatPage to integrate agent landing panels
- [x] 5.1 Add panel agent switcher above SegmentedControl
  - Position AgentSwitcher 20px to the left of SegmentedControl
  - Set variant prop to 'panel'
  - Pass selectedAgent and handleAgentChange props
  - Add proper styling for alignment
  - _Requirements: 1.1, 9.1, 9.2_

- [x] 5.2 Replace AI-recommended workflows with AgentLandingPage
  - Import AgentLandingPage component
  - Replace existing workflows Container with AgentLandingPage when selectedId === "seg-1"
  - Pass selectedAgent prop
  - Pass onWorkflowSelect callback that sets userInput
  - Maintain existing .panel div structure
  - _Requirements: 3.1, 3.2, 9.3, 9.4, 9.5_

- [x] 5.3 Update agent selection state management
  - Ensure selectedAgent state is shared between both switchers
  - Update handleAgentChange to work with 5 agents including 'edicraft'
  - Verify sessionStorage persistence includes 'edicraft'
  - Test state synchronization between panel and input switchers
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 6. Implement EDIcraft MCP integration
- [x] 6.1 Configure MCP server for EDIcraft
  - Add EDIcraft MCP server configuration to platform settings
  - Configure connection to edicraft.nigelgardiner.com:49000
  - Add environment variables for MINECRAFT_HOST, MINECRAFT_PORT, RCON_PASSWORD
  - Add OSDU platform credentials (EDI_USERNAME, EDI_PASSWORD, EDI_CLIENT_ID, EDI_CLIENT_SECRET, EDI_PARTITION, EDI_PLATFORM_URL)
  - Validate MCP server connectivity
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [x] 6.2 Create EDIcraft agent handler Lambda
  - Create handler function in amplify/functions/agents/edicraft/
  - Implement MCP server invocation logic
  - Parse user message and route to EDIcraft MCP server
  - Handle MCP server responses
  - Extract feedback text and chain of thought
  - Return formatted response with no visual artifacts
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 6.3 Implement error handling for EDIcraft
  - Add connection error handling (ECONNREFUSED, ETIMEDOUT, EAUTH)
  - Create user-friendly error messages
  - Add troubleshooting information for common errors
  - Log errors for debugging
  - Implement graceful degradation
  - _Requirements: 13.4, 13.5_

- [x] 6.4 Update message routing to support EDIcraft agent
  - Update sendMessage utility to handle 'edicraft' agent type
  - Route EDIcraft messages to EDIcraft handler Lambda
  - Ensure chain of thought data is captured
  - Verify response format matches expected structure
  - _Requirements: 12.1, 12.2, 13.1, 13.2, 13.3_

- [x] 7. Add styling and responsive design
- [x] 7.1 Create styles for panel header layout
  - Add flexbox layout for agent switcher and SegmentedControl
  - Position agent switcher 20px to left of SegmentedControl
  - Ensure vertical alignment
  - Add responsive breakpoints for mobile
  - _Requirements: 9.1, 9.2_

- [x] 7.2 Create styles for agent landing content
  - Style agent header with icon and title
  - Style bio section with appropriate typography
  - Create grid layout for capabilities
  - Style visualization container with centering
  - Add spacing and padding consistent with Cloudscape
  - _Requirements: 9.4, 9.5_

- [x] 7.3 Ensure responsive design for all screen sizes
  - Test layout on mobile, tablet, and desktop
  - Adjust visualization sizes for different viewports
  - Ensure text remains readable at all sizes
  - Test agent switcher dropdown on mobile
  - _Requirements: 8.4, 9.4_

- [x] 8. Implement accessibility features
- [x] 8.1 Add keyboard navigation support
  - Ensure both agent switchers are keyboard accessible
  - Add proper tab order for landing content
  - Add visible focus indicators
  - Test with keyboard-only navigation
  - _Requirements: 10.2_

- [x] 8.2 Add screen reader support
  - Add ARIA labels to agent switchers
  - Add ARIA labels and descriptions to SVG visualizations
  - Ensure proper heading hierarchy (h1, h2, h3)
  - Add alt text for all visual elements
  - Test with screen reader (VoiceOver/NVDA)
  - _Requirements: 10.1, 10.3, 10.4_

- [x] 8.3 Ensure color contrast compliance
  - Verify all text meets WCAG AA standards (4.5:1 ratio)
  - Check interactive elements have sufficient contrast
  - Test visualizations with color blindness simulators
  - Add patterns in addition to color where needed
  - _Requirements: 10.5_

- [x] 9. Implement performance optimizations
- [x] 9.1 Add code splitting for landing components
  - Use React.lazy for each landing component
  - Implement dynamic imports
  - Add Suspense boundaries with loading fallbacks
  - _Requirements: Performance considerations_

- [x] 9.2 Optimize SVG visualizations
  - Minimize SVG path complexity
  - Use CSS for styling instead of inline attributes
  - Ensure SVGs are under 5KB each
  - Test rendering performance
  - _Requirements: 8.2, Performance considerations_

- [x] 9.3 Implement state management optimizations
  - Use React.memo for landing components
  - Prevent unnecessary re-renders
  - Optimize agent selection change handling
  - _Requirements: Performance considerations_

- [x] 10. Create comprehensive tests
- [x] 10.1 Write unit tests for AgentSwitcher
  - Test rendering of all 5 agent options
  - Test checkmark display for selected agent
  - Test onAgentChange callback
  - Test panel vs input variant differences
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 10.2 Write unit tests for AgentVisualization
  - Test rendering for each agent type
  - Test size prop (small, medium, large)
  - Test ARIA labels
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 10.3 Write unit tests for individual landing components
  - Test rendering of all sections (bio, capabilities, examples)
  - Test visualization display
  - Test onWorkflowSelect callback
  - _Requirements: 4.1-4.5, 5.1-5.5, 6.1-6.5, 7.1-7.5, 11.1-11.6_

- [x] 10.4 Write integration tests for agent synchronization
  - Test panel switcher updates input switcher
  - Test input switcher updates panel switcher
  - Test sessionStorage persistence
  - Test state management across re-renders
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 10.5 Write integration tests for EDIcraft MCP integration
  - Test MCP server connection
  - Test message routing to EDIcraft handler
  - Test response handling
  - Test error scenarios (connection refused, timeout, auth failure)
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 13.4, 13.5_

- [x] 10.6 Write end-to-end tests for user workflows
  - Test selecting agent from panel switcher
  - Test landing content updates
  - Test sending message with selected agent
  - Test EDIcraft workflow (select agent, send message, receive feedback)
  - _Requirements: All requirements_

- [x] 11. Documentation and deployment
- [x] 11.1 Update environment variables documentation
  - Document MINECRAFT_HOST, MINECRAFT_PORT, RCON_PASSWORD
  - Document OSDU platform credentials
  - Document MCP_SERVER_URL
  - Add setup instructions
  - _Requirements: 15.1, 15.2, 15.3, 15.4_

- [x] 11.2 Create deployment checklist
  - Verify all environment variables are set
  - Test MCP server connectivity
  - Verify EDIcraft agent handler is deployed
  - Test all 5 agents in deployed environment
  - Verify visualizations render correctly
  - _Requirements: All requirements_

- [x] 11.3 Update user documentation
  - Document new agent landing panels
  - Explain agent switcher functionality
  - Provide EDIcraft usage examples
  - Add troubleshooting guide for MCP connection issues
  - _Requirements: All requirements_
