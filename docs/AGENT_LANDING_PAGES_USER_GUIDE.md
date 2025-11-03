# Agent Landing Pages - User Guide

Welcome to the Agent Landing Pages feature! This guide will help you understand and use the five specialized AI agents available in the platform.

## Overview

The platform now features five specialized AI agents, each designed for specific tasks in energy data analysis and visualization:

1. **Auto Agent** - Intelligent query routing
2. **Petrophysics Agent** - Well log analysis and reservoir characterization
3. **Maintenance Agent** - Equipment health monitoring and predictive maintenance
4. **Renewable Energy Agent** - Wind farm site design and optimization
5. **EDIcraft Agent** - Minecraft-based subsurface data visualization

## Getting Started

### Accessing the Chat Interface

1. Navigate to the chat interface in the application
2. You'll see two agent switchers:
   - **Panel Switcher**: Located above the left panel, 20px to the left of the "AI Workflows" / "Chain of Thought" tabs
   - **Input Switcher**: Located in the chat input area at the bottom

### Understanding the Interface

The chat interface consists of three main areas:

1. **Left Panel**: Displays agent landing pages with information about the selected agent
2. **Center Area**: Shows your conversation with the AI agent
3. **Bottom Input**: Where you type your queries and select agents

## Using Agent Switchers

### Selecting an Agent

Both agent switchers work identically and stay synchronized:

1. Click on either agent switcher dropdown
2. Select your desired agent from the list:
   - Auto
   - Petrophysics
   - Maintenance
   - Renewable Energy
   - EDIcraft
3. The selected agent will be indicated with a checkmark (✓)
4. Both switchers will update to show your selection

### Agent Synchronization

The two agent switchers are always synchronized:
- Changing the panel switcher updates the input switcher
- Changing the input switcher updates the panel switcher
- Your selection persists even after refreshing the page

## Agent Landing Pages

When you select an agent, the left panel displays a landing page with:

- **Agent Icon and Title**: Visual identification of the agent
- **Bio/Introduction**: Description of the agent's capabilities and specializations
- **Custom Visualization**: Unique illustration representing the agent's domain
- **Capabilities**: List of key features and functions
- **Example Queries/Workflows**: Suggested queries to get started

### Viewing Landing Pages

1. Select an agent from either switcher
2. Ensure "AI Workflows" tab is selected in the left panel
3. The landing page for your selected agent will display
4. Scroll through the landing page to explore capabilities and examples

## The Five Agents

### 1. Auto Agent

**What it does**: Automatically analyzes your queries and routes them to the most appropriate specialized agent.

**When to use**: 
- When you're not sure which agent to use
- For general queries that might involve multiple domains
- When you want the system to decide the best approach

**Example queries**:
- "Analyze well data for WELL-001"
- "Check equipment health for PUMP-001"
- "Design a wind farm layout"
- "Visualize wellbore trajectory in Minecraft"

**How it works**:
The Auto Agent uses intent detection to understand your query and automatically routes it to the appropriate specialized agent (Petrophysics, Maintenance, Renewable Energy, or EDIcraft).

### 2. Petrophysics Agent

**What it does**: Analyzes well log data, calculates petrophysical properties, and performs reservoir characterization.

**When to use**:
- Well log analysis
- Porosity calculations
- Shale volume assessment
- Water saturation analysis
- Multi-well correlation
- Data quality assessment

**Example queries**:
- "Calculate porosity for WELL-001"
- "Perform shale volume analysis for WELL-002"
- "Correlate wells WELL-001 through WELL-005"
- "Assess data quality for GR curve in WELL-003"

**Capabilities**:
- Porosity calculation using multiple methods
- Shale volume analysis
- Water saturation calculations
- Multi-well correlation
- Data quality assessment
- Professional SPE/API standard reports

### 3. Maintenance Agent

**What it does**: Monitors equipment health, predicts failures, and helps plan maintenance activities.

**When to use**:
- Equipment health assessment
- Failure prediction
- Maintenance planning
- Inspection scheduling
- Performance monitoring

**Example queries**:
- "Assess health of PUMP-001"
- "Predict failures for COMPRESSOR-001"
- "Generate maintenance schedule for next quarter"
- "Check sensor readings for TURBINE-005"

**Capabilities**:
- Real-time health assessment
- Predictive failure analysis
- Maintenance schedule optimization
- Inspection planning
- Performance trend analysis

### 4. Renewable Energy Agent

**What it does**: Analyzes wind farm sites, optimizes turbine layouts, and models energy production.

**When to use**:
- Wind farm site analysis
- Turbine layout optimization
- Wind resource assessment
- Energy production modeling
- Terrain analysis

**Example queries**:
- "Analyze terrain for wind farm at 35.0675, -101.3954"
- "Optimize turbine layout for 50 turbines"
- "Generate wind rose visualization"
- "Model energy production for proposed layout"

**Capabilities**:
- Terrain analysis with OSM data integration
- Intelligent turbine placement
- Layout optimization
- Wind rose generation
- Energy production modeling
- Wake effect simulation

### 5. EDIcraft Agent

**What it does**: Visualizes subsurface data in a Minecraft environment, allowing 3D exploration of wellbores, horizons, and geological surfaces.

**When to use**:
- 3D visualization of wellbore trajectories
- Horizon surface rendering
- Geological data exploration
- Interactive subsurface visualization
- Educational demonstrations

**Example queries**:
- "Search for wellbores in the area"
- "Build wellbore trajectory for WELL-001 in Minecraft"
- "Visualize horizon surface"
- "Transform coordinates to Minecraft"
- "Show me wellbores near 30.5, -95.2"

**Capabilities**:
- Wellbore trajectory visualization in 3D
- Horizon surface rendering
- OSDU platform data integration
- Real-time Minecraft building
- Coordinate transformation
- Interactive exploration

**Special Features**:
- Connects to Minecraft server at edicraft.nigelgardiner.com:49000
- Integrates with OSDU platform for real subsurface data
- Builds structures in real-time as you query
- Allows exploration in Minecraft client

## Working with Agents

### Sending Queries

1. Select your desired agent from either switcher
2. Type your query in the chat input at the bottom
3. Press Enter or click the send button
4. The agent will process your query and respond

### Understanding Responses

Agent responses typically include:

- **Text Response**: Explanation of what the agent did
- **Artifacts**: Visual outputs like charts, maps, or data tables (when applicable)
- **Chain of Thought**: The agent's reasoning process (visible in "Chain of Thought" tab)

### Viewing Chain of Thought

To see how the agent reasoned through your query:

1. Click the "Chain of Thought" tab in the left panel
2. Review the step-by-step reasoning process
3. Understand which tools the agent used
4. See intermediate results and decisions

### Using Example Queries

Each landing page includes example queries:

1. Navigate to the agent's landing page
2. Find the "Example Queries" or "Example Workflows" section
3. Click on an example to automatically populate the input
4. Modify the example as needed
5. Send the query

## EDIcraft Agent - Special Instructions

The EDIcraft agent requires additional setup and has unique features:

### Prerequisites

- Minecraft server must be running at edicraft.nigelgardiner.com:49000
- OSDU platform credentials must be configured
- MCP server must be running (handled automatically)

### Connection Status

The EDIcraft landing page shows the Minecraft server connection status:
- **Connected**: Server is accessible and ready
- **Disconnected**: Server is not accessible (check with administrator)

### Using EDIcraft

1. **Search for Data**:
   ```
   "Search for wellbores near 30.5, -95.2"
   ```

2. **Build Wellbore**:
   ```
   "Build wellbore trajectory for WELL-001 in Minecraft"
   ```

3. **Visualize Horizons**:
   ```
   "Visualize horizon surface for TOP_RESERVOIR"
   ```

4. **Transform Coordinates**:
   ```
   "Transform UTM coordinates 500000, 3500000 to Minecraft"
   ```

### Viewing in Minecraft

To see the visualizations in Minecraft:

1. Connect to the Minecraft server: `edicraft.nigelgardiner.com:49000`
2. Navigate to the coordinates mentioned in the agent's response
3. Explore the 3D visualization
4. Use Minecraft controls to fly and examine structures

### EDIcraft Response Format

EDIcraft responses include:
- **Action Taken**: What was built or visualized
- **Coordinates**: Where to find it in Minecraft
- **Data Source**: Which OSDU data was used
- **Instructions**: How to view the visualization

## Tips and Best Practices

### Choosing the Right Agent

- **Use Auto Agent** when unsure which agent to use
- **Use specific agents** when you know exactly what you need
- **Switch agents** mid-conversation if your needs change

### Writing Effective Queries

**Good queries are**:
- Specific: "Calculate porosity for WELL-001" vs "analyze well"
- Complete: Include well names, coordinates, or equipment IDs
- Clear: Use standard terminology

**Examples**:
- ✅ "Calculate porosity for WELL-001 using density-neutron method"
- ✅ "Analyze terrain for wind farm at 35.0675, -101.3954 with 5km radius"
- ✅ "Build wellbore trajectory for WELL-001 in Minecraft"
- ❌ "analyze well"
- ❌ "wind farm"
- ❌ "show me something"

### Understanding Artifacts

Different agents produce different types of artifacts:

- **Petrophysics**: Log plots, crossplots, correlation panels
- **Maintenance**: Health dashboards, trend charts
- **Renewable Energy**: Terrain maps, layout diagrams, wind roses
- **EDIcraft**: Text descriptions (visualization is in Minecraft)

### Using Chain of Thought

The Chain of Thought feature helps you:
- Understand the agent's reasoning
- Debug unexpected results
- Learn how the agent works
- Verify the agent used correct data

## Troubleshooting

### Agent Not Responding

**Problem**: Agent doesn't respond to queries

**Solutions**:
1. Check your internet connection
2. Verify the agent is selected
3. Try refreshing the page
4. Check if the query is valid for the selected agent

### Landing Page Not Displaying

**Problem**: Landing page shows blank or doesn't update

**Solutions**:
1. Ensure "AI Workflows" tab is selected
2. Try selecting a different agent and back
3. Refresh the page
4. Clear browser cache

### Visualizations Not Rendering

**Problem**: Visualizations on landing pages don't show

**Solutions**:
1. Check browser console for errors
2. Try a different browser
3. Ensure JavaScript is enabled
4. Refresh the page

### EDIcraft Connection Issues

**Problem**: EDIcraft agent shows "Connection Failed"

**Solutions**:
1. Check Minecraft server status with administrator
2. Verify OSDU platform credentials are configured
3. Check MCP server status in Kiro
4. Review error message for specific issue

**Common EDIcraft Errors**:

- **"Unable to connect to Minecraft server"**: Server may be down or firewall blocking access
- **"Authentication failed"**: OSDU credentials may be incorrect or expired
- **"RCON password incorrect"**: Minecraft RCON password needs to be updated
- **"Timeout"**: Network connectivity issue or server overloaded

### Agent Switchers Not Synchronizing

**Problem**: Panel and input switchers show different agents

**Solutions**:
1. Refresh the page
2. Clear browser cache and cookies
3. Check browser console for errors
4. Try selecting agent from the other switcher

## Keyboard Shortcuts

- **Tab**: Navigate between interface elements
- **Enter**: Send query (when in input field)
- **Arrow Keys**: Navigate dropdown menus
- **Escape**: Close dropdown menus

## Accessibility Features

The agent landing pages are designed to be accessible:

- **Keyboard Navigation**: All features accessible via keyboard
- **Screen Reader Support**: ARIA labels on all interactive elements
- **High Contrast**: Text meets WCAG AA standards
- **Responsive Design**: Works on all screen sizes

## Getting Help

If you encounter issues:

1. **Check this guide** for common solutions
2. **Review error messages** for specific guidance
3. **Check CloudWatch logs** (for administrators)
4. **Contact support** with:
   - Selected agent
   - Query you sent
   - Error message received
   - Browser and version
   - Screenshots (if applicable)

## Advanced Features

### Session Persistence

Your agent selection is saved and persists:
- Across page refreshes
- Between sessions
- Until you explicitly change it

### Multi-Agent Workflows

You can switch agents mid-conversation:
1. Start with Auto Agent for initial analysis
2. Switch to Petrophysics for detailed calculations
3. Switch to EDIcraft for 3D visualization

### Combining Agent Capabilities

Some workflows benefit from multiple agents:

**Example Workflow**:
1. Use Petrophysics Agent to analyze well data
2. Switch to EDIcraft Agent to visualize wellbore in 3D
3. Use Renewable Energy Agent to assess wind farm potential nearby

## Best Practices Summary

✅ **Do**:
- Select the appropriate agent for your task
- Write specific, clear queries
- Review chain of thought for understanding
- Use example queries as templates
- Switch agents when needs change

❌ **Don't**:
- Use vague or incomplete queries
- Expect one agent to do everything
- Ignore error messages
- Forget to check connection status (EDIcraft)

## Frequently Asked Questions

### Q: Which agent should I use?
**A**: Use Auto Agent if unsure, or select the specific agent that matches your task domain.

### Q: Can I switch agents mid-conversation?
**A**: Yes! Select a different agent at any time. Your conversation history is preserved.

### Q: Why do both switchers exist?
**A**: For convenience - use the panel switcher when browsing landing pages, or the input switcher when focused on chatting.

### Q: Do I need Minecraft to use EDIcraft?
**A**: No, but you'll need Minecraft to view the 3D visualizations. The agent will still provide text descriptions.

### Q: How do I know if EDIcraft is working?
**A**: Check the connection status on the EDIcraft landing page, and look for successful responses without error messages.

### Q: Can I use multiple agents at once?
**A**: No, but you can switch between agents during your conversation.

### Q: What if my query doesn't work?
**A**: Try rephrasing it, check the example queries for guidance, or switch to Auto Agent to let it route your query.

### Q: Are my queries and data secure?
**A**: Yes, all data is processed securely through AWS infrastructure with appropriate access controls.

## Additional Resources

- [Environment Setup Guide](./AGENT_LANDING_PAGES_ENVIRONMENT_SETUP.md) - For administrators
- [Deployment Checklist](./AGENT_LANDING_PAGES_DEPLOYMENT_CHECKLIST.md) - For administrators
- [Troubleshooting Guide](./AGENT_LANDING_PAGES_TROUBLESHOOTING.md) - Detailed troubleshooting
- [EDIcraft Documentation](../EDIcraft-main/README.md) - EDIcraft agent details

## Feedback and Support

We're constantly improving the agent landing pages feature. If you have:
- Suggestions for improvements
- Bug reports
- Feature requests
- Questions not covered in this guide

Please contact your system administrator or support team.

---

**Version**: 1.0  
**Last Updated**: 2025  
**Applies To**: Agent Landing Pages Feature
