# Requirements Document

## Introduction

This feature introduces agent-specific landing pages that replace the current AI-recommended workflows panel. Each agent (Auto, Petrophysics, Maintenance, Renewable Energy, and EDIcraft) will have a dedicated landing page with a bio/introduction and custom visualization. A synchronized agent switcher will be added above the panel (20px left of the SegmentedControl) that mirrors the existing agent switcher in the chat input, ensuring both dropdowns stay in sync. The EDIcraft Agent integrates with an MCP server to visualize subsurface data in a Minecraft environment at edicraft.nigelgardiner.com:49000.

## Glossary

- **Agent Switcher**: A dropdown component that allows users to select between different AI agents (Auto, Petrophysics, Maintenance, Renewable Energy, EDIcraft)
- **Landing Page**: An introductory page displayed in the panel area that provides information about the selected agent
- **Panel**: The left-side container (`.panel` class) in the chat interface that currently displays AI-recommended workflows
- **SegmentedControl**: The Cloudscape component that switches between "AI Workflows" and "Chain of Thought" views
- **Synchronized State**: Both agent switchers (panel and input) reflect the same selected agent at all times
- **Bio/Introduction**: A description of the agent's capabilities, specializations, and use cases
- **Custom Visualization**: A unique visual representation or illustration for each agent
- **MCP Server**: Model Context Protocol server that enables communication between the platform and external services
- **EDIcraft**: A Minecraft-based subsurface data visualization system that renders wellbores, horizons, and geological data in 3D
- **RCON**: Remote Console protocol used to send commands to the Minecraft server

## Requirements

### Requirement 1: Panel Agent Switcher

**User Story:** As a user, I want to see an agent switcher above the panel so that I can quickly change agents without scrolling to the input area.

#### Acceptance Criteria

1. WHEN the chat interface loads, THE System SHALL display an agent switcher dropdown 20 pixels to the left of the SegmentedControl component
2. WHEN the user clicks the agent switcher, THE System SHALL display a dropdown menu with options for Auto, Petrophysics, Maintenance, Renewable Energy, and EDIcraft agents
3. WHEN the user selects an agent from the panel switcher, THE System SHALL update both the panel switcher and the input switcher to reflect the same selection
4. THE System SHALL use the same visual design (icon, styling) as the existing agent switcher in the chat input area
5. THE System SHALL display a checkmark icon next to the currently selected agent in the dropdown menu

### Requirement 2: Synchronized Agent Selection

**User Story:** As a user, I want both agent switchers to stay in sync so that I always know which agent is active regardless of where I change it.

#### Acceptance Criteria

1. WHEN the user changes the agent from the panel switcher, THE System SHALL update the input switcher to match the selection
2. WHEN the user changes the agent from the input switcher, THE System SHALL update the panel switcher to match the selection
3. WHEN the page loads, THE System SHALL restore the previously selected agent from sessionStorage and apply it to both switchers
4. THE System SHALL maintain agent selection state across component re-renders
5. THE System SHALL persist agent selection in sessionStorage when either switcher is used

### Requirement 3: Agent Landing Pages

**User Story:** As a user, I want to see a dedicated landing page for each agent so that I understand what each agent specializes in and how it can help me.

#### Acceptance Criteria

1. WHEN the user selects an agent, THE System SHALL display the corresponding landing page in the panel area
2. WHEN the "AI Workflows" segment is selected, THE System SHALL show the agent landing page instead of the AI-recommended workflows
3. THE System SHALL display a unique landing page for each of the five agents: Auto, Petrophysics, Maintenance, Renewable Energy, and EDIcraft
4. EACH landing page SHALL include a header with the agent name and icon
5. EACH landing page SHALL include a bio/introduction section describing the agent's capabilities and specializations

### Requirement 4: Auto Agent Landing Page

**User Story:** As a user, I want to see an informative landing page for the Auto agent so that I understand how it intelligently routes my queries.

#### Acceptance Criteria

1. THE Auto Agent landing page SHALL display the title "Auto Agent"
2. THE Auto Agent landing page SHALL include a description explaining that it automatically detects user intent and routes queries to the appropriate specialized agent
3. THE Auto Agent landing page SHALL include a custom visualization representing intelligent routing or decision-making
4. THE Auto Agent landing page SHALL list the specialized agents it can route to (Petrophysics, Maintenance, Renewable Energy, EDIcraft)
5. THE Auto Agent landing page SHALL include example use cases or query types

### Requirement 5: Petrophysics Agent Landing Page

**User Story:** As a user, I want to see an informative landing page for the Petrophysics agent so that I understand its well data analysis capabilities.

#### Acceptance Criteria

1. THE Petrophysics Agent landing page SHALL display the title "Petrophysics Agent"
2. THE Petrophysics Agent landing page SHALL include a description of its specialization in well log analysis, porosity calculations, and reservoir characterization
3. THE Petrophysics Agent landing page SHALL include a custom visualization representing subsurface data or well logs
4. THE Petrophysics Agent landing page SHALL list key capabilities (e.g., shale volume analysis, porosity calculation, multi-well correlation)
5. THE Petrophysics Agent landing page SHALL include example workflows or analysis types

### Requirement 6: Maintenance Agent Landing Page

**User Story:** As a user, I want to see an informative landing page for the Maintenance agent so that I understand its equipment monitoring and predictive capabilities.

#### Acceptance Criteria

1. THE Maintenance Agent landing page SHALL display the title "Maintenance Agent"
2. THE Maintenance Agent landing page SHALL include a description of its specialization in equipment health monitoring, failure prediction, and maintenance planning
3. THE Maintenance Agent landing page SHALL include a custom visualization representing equipment monitoring or predictive analytics
4. THE Maintenance Agent landing page SHALL list key capabilities (e.g., health assessment, failure prediction, inspection scheduling)
5. THE Maintenance Agent landing page SHALL include example use cases or equipment types

### Requirement 7: Renewable Energy Agent Landing Page

**User Story:** As a user, I want to see an informative landing page for the Renewable Energy agent so that I understand its wind farm analysis capabilities.

#### Acceptance Criteria

1. THE Renewable Energy Agent landing page SHALL display the title "Renewable Energy Agent"
2. THE Renewable Energy Agent landing page SHALL include a description of its specialization in wind farm site design, layout optimization, and energy analysis
3. THE Renewable Energy Agent landing page SHALL include a custom visualization representing wind turbines, terrain analysis, or energy production
4. THE Renewable Energy Agent landing page SHALL list key capabilities (e.g., terrain analysis, layout optimization, wind rose generation)
5. THE Renewable Energy Agent landing page SHALL include example workflows or analysis types

### Requirement 8: Visual Design and Illustrations

**User Story:** As a user, I want each agent landing page to have a unique and visually appealing design so that I can quickly identify different agents and feel engaged with the interface.

#### Acceptance Criteria

1. EACH agent landing page SHALL include a custom illustration or visualization that represents the agent's domain
2. THE System SHALL use SVG-based illustrations for scalability and performance
3. THE illustrations SHALL follow the AWS Cloudscape Design System color palette and styling guidelines
4. THE illustrations SHALL be responsive and adapt to different screen sizes
5. THE System SHALL use appropriate icons from the Cloudscape icon library where applicable

### Requirement 9: Layout and Positioning

**User Story:** As a user, I want the agent switcher and landing pages to be properly positioned and styled so that the interface feels cohesive and professional.

#### Acceptance Criteria

1. THE panel agent switcher SHALL be positioned 20 pixels to the left of the SegmentedControl component
2. THE panel agent switcher SHALL be vertically aligned with the SegmentedControl component
3. THE landing page content SHALL replace the current AI-recommended workflows container
4. THE landing page SHALL use the same Container component styling as the current workflows panel
5. THE landing page SHALL maintain proper spacing and padding consistent with the Cloudscape Design System

### Requirement 10: Accessibility and Usability

**User Story:** As a user with accessibility needs, I want the agent switcher and landing pages to be fully accessible so that I can navigate and understand the interface using assistive technologies.

#### Acceptance Criteria

1. THE panel agent switcher SHALL include proper ARIA labels for screen readers
2. THE panel agent switcher SHALL be keyboard navigable (Tab, Enter, Arrow keys)
3. EACH landing page SHALL include proper heading hierarchy (h1, h2, h3)
4. THE illustrations SHALL include descriptive alt text or ARIA labels
5. THE System SHALL maintain sufficient color contrast ratios for text and interactive elements


### Requirement 11: EDIcraft Agent Landing Page

**User Story:** As a user, I want to see an informative landing page for the EDIcraft agent so that I understand its Minecraft-based subsurface data visualization capabilities.

#### Acceptance Criteria

1. THE EDIcraft Agent landing page SHALL display the title "EDIcraft Agent"
2. THE EDIcraft Agent landing page SHALL include a description of its specialization in visualizing subsurface data (wellbores, horizons, geological surfaces) in a Minecraft environment
3. THE EDIcraft Agent landing page SHALL include a custom visualization representing Minecraft blocks, subsurface geology, or 3D wellbore visualization
4. THE EDIcraft Agent landing page SHALL list key capabilities (e.g., wellbore trajectory visualization, horizon surface rendering, OSDU data integration, real-time Minecraft building)
5. THE EDIcraft Agent landing page SHALL include example workflows or visualization types
6. THE EDIcraft Agent landing page SHALL indicate the Minecraft server connection status (edicraft.nigelgardiner.com:49000)

### Requirement 12: EDIcraft Agent MCP Integration

**User Story:** As a user, I want the EDIcraft agent to connect to the Minecraft server via MCP so that I can visualize subsurface data in a 3D Minecraft environment.

#### Acceptance Criteria

1. WHEN the user selects the EDIcraft agent, THE System SHALL establish a connection to the MCP server configured for EDIcraft
2. WHEN the user sends a message with the EDIcraft agent selected, THE System SHALL route the message to the EDIcraft MCP server at edicraft.nigelgardiner.com:49000
3. THE System SHALL send the user's input text to the EDIcraft agent for processing
4. THE EDIcraft agent SHALL execute appropriate Minecraft RCON commands to visualize data in the Minecraft environment
5. THE System SHALL return feedback to the user describing what actions were performed in the Minecraft environment

### Requirement 13: EDIcraft Agent Response Handling

**User Story:** As a user, I want to receive clear feedback about what the EDIcraft agent has done in Minecraft so that I understand the visualization results.

#### Acceptance Criteria

1. WHEN the EDIcraft agent completes an action, THE System SHALL display a text response describing what was built or visualized in Minecraft
2. THE System SHALL display chain of thought information showing the agent's reasoning process for EDIcraft operations
3. THE System SHALL NOT attempt to display Minecraft environment visuals in the chat interface (visualization occurs in the external Minecraft server)
4. THE System SHALL indicate successful connection and command execution status
5. IF the Minecraft server connection fails, THE System SHALL display an error message with troubleshooting information

### Requirement 14: EDIcraft Agent Capabilities

**User Story:** As a user, I want the EDIcraft agent to support various subsurface data visualization workflows so that I can explore geological data in 3D.

#### Acceptance Criteria

1. THE EDIcraft agent SHALL support wellbore trajectory visualization using OSDU data
2. THE EDIcraft agent SHALL support horizon surface rendering in Minecraft
3. THE EDIcraft agent SHALL support coordinate transformation from UTM to Minecraft coordinates
4. THE EDIcraft agent SHALL support player position tracking and coordinate system setup
5. THE EDIcraft agent SHALL support searching and retrieving data from the OSDU platform
6. THE EDIcraft agent SHALL execute all visualization commands automatically without requiring manual RCON command input from the user

### Requirement 15: MCP Server Configuration

**User Story:** As a developer, I want the EDIcraft MCP server to be properly configured in the platform so that the agent can communicate with the Minecraft server.

#### Acceptance Criteria

1. THE System SHALL include MCP server configuration for EDIcraft in the platform's MCP settings
2. THE MCP configuration SHALL specify the connection details for edicraft.nigelgardiner.com:49000
3. THE MCP configuration SHALL include necessary authentication credentials for the Minecraft RCON connection
4. THE MCP configuration SHALL include OSDU platform credentials for data retrieval
5. THE System SHALL validate MCP server connectivity when the EDIcraft agent is selected
