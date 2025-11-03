# Design Document

## Overview

This design implements agent-specific landing pages that replace the AI-recommended workflows panel, along with a synchronized agent switcher positioned above the panel. The system supports five agents (Auto, Petrophysics, Maintenance, Renewable Energy, and EDIcraft), each with a custom landing page featuring unique visualizations. The EDIcraft agent integrates with an MCP server to enable Minecraft-based subsurface data visualization.

## Architecture

### Component Hierarchy

```
ChatPage (src/app/chat/[chatSessionId]/page.tsx)
├── Panel Header
│   ├── AgentSwitcher (new, positioned 20px left of SegmentedControl)
│   └── SegmentedControl (existing)
├── .panel div (existing container)
│   ├── WHEN selectedId === "seg-1":
│   │   └── AgentLandingPage (new, replaces AI-recommended workflows Container)
│   │       ├── AutoAgentLanding
│   │       ├── PetrophysicsAgentLanding
│   │       ├── MaintenanceAgentLanding
│   │       ├── RenewableAgentLanding
│   │       └── EDIcraftAgentLanding
│   └── WHEN selectedId === "seg-2":
│       └── ChainOfThought (existing)
└── .convo div (existing container)
    └── ChatBox
        └── AgentSwitcher (existing, in input area)
```

### State Management

```typescript
// Shared state between both agent switchers
const [selectedAgent, setSelectedAgent] = useState<'auto' | 'petrophysics' | 'maintenance' | 'renewable' | 'edicraft'>('auto');

// Handler ensures both switchers stay synchronized
const handleAgentChange = (agent: AgentType) => {
  setSelectedAgent(agent);
  sessionStorage.setItem('selectedAgent', agent);
};
```

### Data Flow

```
User selects agent from panel switcher
    ↓
handleAgentChange updates state
    ↓
State change triggers re-render
    ↓
Both switchers reflect new selection
    ↓
Panel displays corresponding landing page
    ↓
ChatBox uses selected agent for message routing
```

## Components and Interfaces

### 1. AgentLandingPage Component

**Location:** `src/components/AgentLandingPage.tsx`

**Purpose:** Container component that renders the appropriate landing panel content based on selected agent. This component replaces the AI-recommended workflows content within the `.panel` div.

**Interface:**
```typescript
interface AgentLandingPageProps {
  selectedAgent: 'auto' | 'petrophysics' | 'maintenance' | 'renewable' | 'edicraft';
  onWorkflowSelect?: (prompt: string) => void;
}

const AgentLandingPage: React.FC<AgentLandingPageProps> = ({
  selectedAgent,
  onWorkflowSelect
}) => {
  // Render appropriate landing panel content
  // This replaces the AI-recommended workflows Container within the .panel div
  switch (selectedAgent) {
    case 'auto':
      return <AutoAgentLanding onWorkflowSelect={onWorkflowSelect} />;
    case 'petrophysics':
      return <PetrophysicsAgentLanding onWorkflowSelect={onWorkflowSelect} />;
    case 'maintenance':
      return <MaintenanceAgentLanding onWorkflowSelect={onWorkflowSelect} />;
    case 'renewable':
      return <RenewableAgentLanding onWorkflowSelect={onWorkflowSelect} />;
    case 'edicraft':
      return <EDIcraftAgentLanding onWorkflowSelect={onWorkflowSelect} />;
  }
};
```

### 2. Individual Landing Panel Components

**Location:** `src/components/agent-landing-pages/`

Each landing panel component renders content within the `.panel` container and follows a consistent structure:

```typescript
interface AgentLandingProps {
  onWorkflowSelect?: (prompt: string) => void;
}

const AutoAgentLanding: React.FC<AgentLandingProps> = ({ onWorkflowSelect }) => {
  // This component renders inside the .panel div, replacing the AI-recommended workflows
  return (
    <Container header="Auto Agent">
      <SpaceBetween direction="vertical" size="l">
        {/* Agent Icon/Visualization */}
        <Box textAlign="center">
          <AgentVisualization type="auto" />
        </Box>
        
        {/* Bio/Introduction */}
        <Box variant="h2">Intelligent Query Routing</Box>
        <Box>
          The Auto Agent automatically analyzes your queries and routes them to the most 
          appropriate specialized agent...
        </Box>
        
        {/* Capabilities */}
        <ColumnLayout columns={2}>
          <Box>
            <Icon name="check" /> Intent Detection
          </Box>
          <Box>
            <Icon name="check" /> Smart Routing
          </Box>
        </ColumnLayout>
        
        {/* Specialized Agents List */}
        <Box variant="h3">Routes to:</Box>
        <SpaceBetween direction="vertical" size="s">
          <Badge color="blue">Petrophysics Agent</Badge>
          <Badge color="green">Maintenance Agent</Badge>
          <Badge color="purple">Renewable Energy Agent</Badge>
          <Badge color="orange">EDIcraft Agent</Badge>
        </SpaceBetween>
        
        {/* Example Queries */}
        <ExpandableSection headerText="Example Queries">
          <Cards items={exampleQueries} />
        </ExpandableSection>
      </SpaceBetween>
    </Container>
  );
};
```

### 3. AgentVisualization Component

**Location:** `src/components/agent-landing-pages/AgentVisualization.tsx`

**Purpose:** Renders custom SVG illustrations for each agent.

**Interface:**
```typescript
interface AgentVisualizationProps {
  type: 'auto' | 'petrophysics' | 'maintenance' | 'renewable' | 'edicraft';
  size?: 'small' | 'medium' | 'large';
}

const AgentVisualization: React.FC<AgentVisualizationProps> = ({ type, size = 'medium' }) => {
  const dimensions = {
    small: { width: 120, height: 120 },
    medium: { width: 200, height: 200 },
    large: { width: 300, height: 300 }
  };
  
  return (
    <svg 
      width={dimensions[size].width} 
      height={dimensions[size].height}
      viewBox="0 0 200 200"
      aria-label={`${type} agent visualization`}
    >
      {renderVisualization(type)}
    </svg>
  );
};
```

### 4. Updated AgentSwitcher Component

**Location:** `src/components/AgentSwitcher.tsx`

**Updates:**
```typescript
export interface AgentSwitcherProps {
  selectedAgent: 'auto' | 'petrophysics' | 'maintenance' | 'renewable' | 'edicraft'; // Added 'edicraft'
  onAgentChange: (agent: 'auto' | 'petrophysics' | 'maintenance' | 'renewable' | 'edicraft') => void;
  disabled?: boolean;
  variant?: 'panel' | 'input'; // New prop to distinguish between the two instances
}

const AgentSwitcher: React.FC<AgentSwitcherProps> = ({
  selectedAgent,
  onAgentChange,
  disabled = false,
  variant = 'input'
}) => {
  const items = [
    { id: 'auto', text: 'Auto', iconName: selectedAgent === 'auto' ? 'check' : undefined },
    { id: 'petrophysics', text: 'Petrophysics', iconName: selectedAgent === 'petrophysics' ? 'check' : undefined },
    { id: 'maintenance', text: 'Maintenance', iconName: selectedAgent === 'maintenance' ? 'check' : undefined },
    { id: 'renewable', text: 'Renewable Energy', iconName: selectedAgent === 'renewable' ? 'check' : undefined },
    { id: 'edicraft', text: 'EDIcraft', iconName: selectedAgent === 'edicraft' ? 'check' : undefined } // New option
  ];

  return (
    <div className={`agent-switcher-container agent-switcher-${variant}`}>
      <ButtonDropdown
        items={items}
        onItemClick={({ detail }) => {
          onAgentChange(detail.id as AgentType);
        }}
        disabled={disabled}
        expandToViewport={true}
        iconName="contact"
        ariaLabel="Select agent"
      />
    </div>
  );
};
```

### 5. EDIcraft MCP Integration

**Location:** `amplify/functions/agents/edicraft/handler.ts`

**Purpose:** Route EDIcraft agent requests to the MCP server.

```typescript
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

export const handler = async (event: any) => {
  const { message, chatSessionId } = event;
  
  try {
    // Invoke MCP server for EDIcraft
    const mcpResponse = await invokeMCPServer({
      server: 'edicraft',
      tool: 'process_query',
      parameters: {
        prompt: message,
        minecraft_host: process.env.MINECRAFT_HOST,
        minecraft_port: process.env.MINECRAFT_PORT,
        rcon_password: process.env.RCON_PASSWORD
      }
    });
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: mcpResponse.response,
        thoughtSteps: mcpResponse.thoughtSteps,
        artifacts: [] // No visual artifacts, just text feedback
      })
    };
  } catch (error) {
    console.error('EDIcraft agent error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Failed to connect to Minecraft server. Please check server status.',
        error: error.message
      })
    };
  }
};

async function invokeMCPServer(params: any) {
  // MCP server invocation logic
  // This will call the EDIcraft agent.py via MCP protocol
  const response = await fetch(`${process.env.MCP_SERVER_URL}/invoke`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  
  return await response.json();
}
```

## Data Models

### Agent Type

```typescript
type AgentType = 'auto' | 'petrophysics' | 'maintenance' | 'renewable' | 'edicraft';
```

### Agent Configuration

```typescript
interface AgentConfig {
  id: AgentType;
  name: string;
  description: string;
  icon: string;
  color: string;
  capabilities: string[];
  exampleQueries: string[];
  mcpServer?: string; // Optional MCP server identifier
}

const AGENT_CONFIGS: Record<AgentType, AgentConfig> = {
  auto: {
    id: 'auto',
    name: 'Auto Agent',
    description: 'Intelligent query routing to specialized agents',
    icon: 'gen-ai',
    color: 'blue',
    capabilities: [
      'Intent Detection',
      'Smart Routing',
      'Multi-Agent Coordination',
      'Context Awareness'
    ],
    exampleQueries: [
      'Analyze well data for WELL-001',
      'Check equipment health for PUMP-001',
      'Design a wind farm layout',
      'Visualize wellbore trajectory in Minecraft'
    ]
  },
  petrophysics: {
    id: 'petrophysics',
    name: 'Petrophysics Agent',
    description: 'Well log analysis and reservoir characterization',
    icon: 'folder',
    color: 'blue',
    capabilities: [
      'Porosity Calculation',
      'Shale Volume Analysis',
      'Multi-Well Correlation',
      'Data Quality Assessment'
    ],
    exampleQueries: [
      'Calculate porosity for WELL-001',
      'Perform shale analysis',
      'Correlate wells 001-005'
    ]
  },
  maintenance: {
    id: 'maintenance',
    name: 'Maintenance Agent',
    description: 'Equipment monitoring and predictive maintenance',
    icon: 'settings',
    color: 'green',
    capabilities: [
      'Health Assessment',
      'Failure Prediction',
      'Maintenance Planning',
      'Inspection Scheduling'
    ],
    exampleQueries: [
      'Assess health of PUMP-001',
      'Predict failures for COMPRESSOR-001',
      'Generate maintenance schedule'
    ]
  },
  renewable: {
    id: 'renewable',
    name: 'Renewable Energy Agent',
    description: 'Wind farm site design and optimization',
    icon: 'status-positive',
    color: 'purple',
    capabilities: [
      'Terrain Analysis',
      'Layout Optimization',
      'Wind Rose Generation',
      'Energy Production Modeling'
    ],
    exampleQueries: [
      'Analyze terrain for wind farm',
      'Optimize turbine layout',
      'Generate wind rose visualization'
    ]
  },
  edicraft: {
    id: 'edicraft',
    name: 'EDIcraft Agent',
    description: 'Minecraft-based subsurface data visualization',
    icon: 'view-full',
    color: 'orange',
    capabilities: [
      'Wellbore Trajectory Visualization',
      'Horizon Surface Rendering',
      'OSDU Data Integration',
      'Real-time 3D Building'
    ],
    exampleQueries: [
      'Build wellbore trajectory in Minecraft',
      'Visualize horizon surface',
      'Search OSDU for wellbores',
      'Transform coordinates to Minecraft'
    ],
    mcpServer: 'edicraft'
  }
};
```

### MCP Server Configuration

```typescript
interface MCPServerConfig {
  name: string;
  host: string;
  port: number;
  protocol: 'http' | 'https';
  authentication?: {
    type: 'rcon' | 'token' | 'basic';
    credentials: Record<string, string>;
  };
}

const MCP_SERVERS: Record<string, MCPServerConfig> = {
  edicraft: {
    name: 'EDIcraft MCP Server',
    host: 'edicraft.nigelgardiner.com',
    port: 49000,
    protocol: 'https',
    authentication: {
      type: 'rcon',
      credentials: {
        password: process.env.MINECRAFT_RCON_PASSWORD || ''
      }
    }
  }
};
```

## Visualization Designs

### Auto Agent Visualization

**Concept:** Interconnected nodes representing intelligent routing

```svg
<svg viewBox="0 0 200 200">
  <!-- Central AI node -->
  <circle cx="100" cy="100" r="20" fill="#0972D3" />
  <text x="100" y="105" text-anchor="middle" fill="white" font-size="12">AI</text>
  
  <!-- Specialized agent nodes -->
  <circle cx="50" cy="50" r="15" fill="#037F0C" />
  <circle cx="150" cy="50" r="15" fill="#5F6B7A" />
  <circle cx="50" cy="150" r="15" fill="#8B46FF" />
  <circle cx="150" cy="150" r="15" fill="#FF6B00" />
  
  <!-- Connection lines -->
  <line x1="100" y1="100" x2="50" y2="50" stroke="#0972D3" stroke-width="2" />
  <line x1="100" y1="100" x2="150" y2="50" stroke="#0972D3" stroke-width="2" />
  <line x1="100" y1="100" x2="50" y2="150" stroke="#0972D3" stroke-width="2" />
  <line x1="100" y1="100" x2="150" y2="150" stroke="#0972D3" stroke-width="2" />
</svg>
```

### Petrophysics Agent Visualization

**Concept:** Well log curves and depth tracks

```svg
<svg viewBox="0 0 200 200">
  <!-- Depth track -->
  <rect x="20" y="20" width="30" height="160" fill="#F0F0F0" stroke="#5F6B7A" />
  
  <!-- GR curve -->
  <path d="M 60 20 Q 80 60, 70 100 T 60 180" fill="none" stroke="#037F0C" stroke-width="2" />
  
  <!-- Resistivity curve -->
  <path d="M 100 20 Q 120 80, 110 120 T 100 180" fill="none" stroke="#0972D3" stroke-width="2" />
  
  <!-- Porosity curve -->
  <path d="M 140 20 Q 160 50, 150 90 T 140 180" fill="none" stroke="#8B46FF" stroke-width="2" />
  
  <!-- Labels -->
  <text x="60" y="15" font-size="10" fill="#037F0C">GR</text>
  <text x="100" y="15" font-size="10" fill="#0972D3">RES</text>
  <text x="140" y="15" font-size="10" fill="#8B46FF">PHI</text>
</svg>
```

### Maintenance Agent Visualization

**Concept:** Equipment with health indicators

```svg
<svg viewBox="0 0 200 200">
  <!-- Equipment outline (pump) -->
  <rect x="70" y="80" width="60" height="40" fill="#5F6B7A" stroke="#000" />
  <circle cx="100" cy="100" r="15" fill="#0972D3" />
  
  <!-- Health indicators -->
  <circle cx="50" cy="50" r="8" fill="#037F0C" />
  <text x="50" y="40" text-anchor="middle" font-size="10">✓</text>
  
  <circle cx="100" cy="50" r="8" fill="#FF9900" />
  <text x="100" y="40" text-anchor="middle" font-size="10">!</text>
  
  <circle cx="150" cy="50" r="8" fill="#D91515" />
  <text x="150" y="40" text-anchor="middle" font-size="10">✗</text>
  
  <!-- Sensor lines -->
  <line x1="50" y1="58" x2="85" y2="85" stroke="#037F0C" stroke-width="1" stroke-dasharray="2,2" />
  <line x1="100" y1="58" x2="100" y2="85" stroke="#FF9900" stroke-width="1" stroke-dasharray="2,2" />
  <line x1="150" y1="58" x2="115" y2="85" stroke="#D91515" stroke-width="1" stroke-dasharray="2,2" />
</svg>
```

### Renewable Energy Agent Visualization

**Concept:** Wind turbines on terrain

```svg
<svg viewBox="0 0 200 200">
  <!-- Terrain -->
  <path d="M 0 150 Q 50 130, 100 140 T 200 150 L 200 200 L 0 200 Z" fill="#E9ECEF" />
  
  <!-- Wind turbines -->
  <g transform="translate(50, 120)">
    <line x1="0" y1="0" x2="0" y2="-40" stroke="#5F6B7A" stroke-width="2" />
    <ellipse cx="0" cy="-40" rx="15" ry="2" fill="#0972D3" />
  </g>
  
  <g transform="translate(100, 110)">
    <line x1="0" y1="0" x2="0" y2="-50" stroke="#5F6B7A" stroke-width="2" />
    <ellipse cx="0" cy="-50" rx="18" ry="2" fill="#0972D3" />
  </g>
  
  <g transform="translate(150, 125)">
    <line x1="0" y1="0" x2="0" y2="-45" stroke="#5F6B7A" stroke-width="2" />
    <ellipse cx="0" cy="-45" rx="16" ry="2" fill="#0972D3" />
  </g>
  
  <!-- Wind direction arrows -->
  <path d="M 20 40 L 40 40 L 35 35 M 40 40 L 35 45" stroke="#0972D3" stroke-width="1" fill="none" />
</svg>
```

### EDIcraft Agent Visualization

**Concept:** Minecraft blocks forming a wellbore

```svg
<svg viewBox="0 0 200 200">
  <!-- Minecraft-style blocks (pixelated) -->
  <!-- Surface blocks -->
  <rect x="40" y="60" width="20" height="20" fill="#8B7355" stroke="#000" stroke-width="1" />
  <rect x="60" y="60" width="20" height="20" fill="#7A6A4F" stroke="#000" stroke-width="1" />
  <rect x="80" y="60" width="20" height="20" fill="#8B7355" stroke="#000" stroke-width="1" />
  <rect x="100" y="60" width="20" height="20" fill="#7A6A4F" stroke="#000" stroke-width="1" />
  <rect x="120" y="60" width="20" height="20" fill="#8B7355" stroke="#000" stroke-width="1" />
  <rect x="140" y="60" width="20" height="20" fill="#7A6A4F" stroke="#000" stroke-width="1" />
  
  <!-- Wellbore blocks (vertical) -->
  <rect x="90" y="80" width="20" height="20" fill="#FF6B00" stroke="#000" stroke-width="1" />
  <rect x="90" y="100" width="20" height="20" fill="#FF8533" stroke="#000" stroke-width="1" />
  <rect x="90" y="120" width="20" height="20" fill="#FF6B00" stroke="#000" stroke-width="1" />
  <rect x="90" y="140" width="20" height="20" fill="#FF8533" stroke="#000" stroke-width="1" />
  
  <!-- Subsurface layers -->
  <rect x="40" y="160" width="120" height="10" fill="#5F6B7A" stroke="#000" stroke-width="1" />
  <rect x="40" y="170" width="120" height="10" fill="#4A5568" stroke="#000" stroke-width="1" />
  
  <!-- Coordinate indicator -->
  <text x="100" y="30" text-anchor="middle" font-size="10" fill="#0972D3">Y=100</text>
  <text x="100" y="195" text-anchor="middle" font-size="10" fill="#0972D3">Y=50</text>
</svg>
```

## Layout and Styling

### Panel Header Layout

```scss
.panel-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 16px;
  
  .agent-switcher-panel {
    // Positioned 20px to the left of SegmentedControl
    margin-right: 20px;
  }
}
```

### Agent Landing Panel Content Styling

```scss
// These styles apply to content rendered within the existing .panel div
.agent-landing-content {
  .agent-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 24px;
    
    .agent-icon {
      width: 48px;
      height: 48px;
    }
    
    .agent-title {
      font-size: 24px;
      font-weight: 600;
    }
  }
  
  .agent-bio {
    font-size: 16px;
    line-height: 1.6;
    color: var(--color-text-body-secondary);
    margin-bottom: 24px;
  }
  
  .agent-visualization {
    display: flex;
    justify-content: center;
    margin: 32px 0;
    
    svg {
      max-width: 100%;
      height: auto;
    }
  }
  
  .agent-capabilities {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
  }
  
  .agent-examples {
    margin-top: 24px;
  }
}
```

## Error Handling

### MCP Connection Errors

```typescript
try {
  const response = await invokeMCPServer(params);
  return response;
} catch (error) {
  if (error.code === 'ECONNREFUSED') {
    return {
      message: 'Unable to connect to Minecraft server. Please verify the server is running at edicraft.nigelgardiner.com:49000',
      error: 'CONNECTION_REFUSED'
    };
  } else if (error.code === 'ETIMEDOUT') {
    return {
      message: 'Connection to Minecraft server timed out. Please check network connectivity.',
      error: 'TIMEOUT'
    };
  } else if (error.code === 'EAUTH') {
    return {
      message: 'Authentication failed. Please verify RCON password is correct.',
      error: 'AUTH_FAILED'
    };
  } else {
    return {
      message: 'An unexpected error occurred while communicating with the Minecraft server.',
      error: error.message
    };
  }
}
```

### Agent Selection Validation

```typescript
const isValidAgent = (agent: string): agent is AgentType => {
  return ['auto', 'petrophysics', 'maintenance', 'renewable', 'edicraft'].includes(agent);
};

const handleAgentChange = (agent: string) => {
  if (!isValidAgent(agent)) {
    console.error(`Invalid agent type: ${agent}`);
    return;
  }
  setSelectedAgent(agent);
  sessionStorage.setItem('selectedAgent', agent);
};
```

## Testing Strategy

### Unit Tests

1. **AgentSwitcher Component**
   - Renders all 5 agent options
   - Shows checkmark for selected agent
   - Calls onAgentChange with correct agent ID
   - Synchronizes between panel and input variants

2. **AgentLandingPage Component**
   - Renders correct landing panel content for each agent
   - Passes onWorkflowSelect callback correctly
   - Handles agent switching without errors
   - Properly replaces AI-recommended workflows within .panel div

3. **Individual Landing Panel Components**
   - Renders all required sections (bio, capabilities, examples)
   - Displays custom visualization
   - Handles workflow selection
   - Renders correctly within .panel container

### Integration Tests

1. **Agent Synchronization**
   - Changing panel switcher updates input switcher
   - Changing input switcher updates panel switcher
   - SessionStorage persists selection across page reloads

2. **EDIcraft MCP Integration**
   - Successfully connects to MCP server
   - Sends correct parameters
   - Handles responses correctly
   - Displays error messages on failure

### End-to-End Tests

1. **User Workflow**
   - User selects agent from panel switcher
   - Panel content updates immediately to show agent landing
   - Input switcher reflects selection
   - User sends message with selected agent
   - Response displays correctly

2. **EDIcraft Workflow**
   - User selects EDIcraft agent
   - Panel content shows EDIcraft landing with Minecraft visualization
   - User sends "Build wellbore for WELL-001"
   - System connects to MCP server
   - Minecraft commands execute
   - Feedback displays in chat
   - Chain of thought shows reasoning

## Accessibility Considerations

### Keyboard Navigation

- Both agent switchers are fully keyboard accessible (Tab, Enter, Arrow keys)
- Landing panel content follows logical tab order
- All interactive elements have visible focus indicators
- Focus management when switching between agents

### Screen Reader Support

```typescript
<ButtonDropdown
  items={items}
  ariaLabel="Select AI agent for query processing"
  expandToViewport={true}
/>

<svg 
  role="img" 
  aria-label="Auto agent visualization showing intelligent routing between specialized agents"
>
  <title>Auto Agent Routing Diagram</title>
  <desc>Central AI node connected to four specialized agent nodes</desc>
  {/* SVG content */}
</svg>
```

### Color Contrast

- All text meets WCAG AA standards (4.5:1 for normal text, 3:1 for large text)
- Interactive elements have sufficient contrast in all states
- Visualizations use patterns in addition to color for differentiation

## Performance Considerations

### SVG Optimization

- Use inline SVG for small visualizations (< 5KB)
- Lazy load complex visualizations
- Minimize SVG path complexity
- Use CSS for styling instead of inline attributes

### State Management

- Use React.memo for landing page components to prevent unnecessary re-renders
- Debounce agent selection changes if needed
- Cache MCP server responses when appropriate

### Bundle Size

- Code-split landing panel components
- Lazy load visualizations on demand
- Use dynamic imports for agent-specific code

```typescript
const AutoAgentLanding = lazy(() => import('./agent-landing-pages/AutoAgentLanding'));
const PetrophysicsAgentLanding = lazy(() => import('./agent-landing-pages/PetrophysicsAgentLanding'));
// ... etc

// In ChatPage component:
<div className='panel'>
  <Suspense fallback={<Spinner />}>
    <AgentLandingPage selectedAgent={selectedAgent} onWorkflowSelect={handleWorkflowSelect} />
  </Suspense>
</div>
```

## Deployment Considerations

### Environment Variables

```bash
# EDIcraft MCP Server Configuration
MINECRAFT_HOST=edicraft.nigelgardiner.com
MINECRAFT_PORT=49000
MINECRAFT_RCON_PASSWORD=<secure_password>

# OSDU Platform Configuration (for EDIcraft)
EDI_PLATFORM_URL=<osdu_platform_url>
EDI_USERNAME=<username>
EDI_PASSWORD=<password>
EDI_CLIENT_ID=<client_id>
EDI_CLIENT_SECRET=<client_secret>
EDI_PARTITION=<partition_name>

# MCP Server URL
MCP_SERVER_URL=https://edicraft.nigelgardiner.com:49000
```

### MCP Server Deployment

The EDIcraft MCP server (agent.py) should be deployed as:
1. A containerized service accessible at edicraft.nigelgardiner.com:49000
2. With proper RCON access to the Minecraft server
3. With OSDU platform credentials configured
4. With health check endpoints for monitoring

### Security Considerations

- Store RCON password in AWS Secrets Manager
- Use HTTPS for MCP server communication
- Validate all user inputs before sending to MCP server
- Implement rate limiting for MCP requests
- Log all MCP interactions for audit purposes

## Future Enhancements

1. **Agent Analytics**
   - Track which agents are used most frequently
   - Monitor agent performance and response times
   - Collect user feedback on agent responses

2. **Custom Agent Configurations**
   - Allow users to customize agent behavior
   - Save preferred agents per project
   - Create custom agent combinations

3. **Enhanced Visualizations**
   - Animated SVG illustrations
   - Interactive 3D visualizations
   - Real-time Minecraft server preview (if feasible)

4. **Multi-Agent Collaboration**
   - Allow multiple agents to work together on complex queries
   - Show collaboration flow in chain of thought
   - Coordinate responses from multiple specialized agents
