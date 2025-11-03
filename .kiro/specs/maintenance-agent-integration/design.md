# Design Document

## Overview

This document outlines the design for integrating a Maintenance Agent into the Energy Data Insights (EDI) platform. The Maintenance agent will follow the proven Strands/AgentCore architecture pattern established by the Petrophysics agent, providing AI-powered maintenance planning, equipment monitoring, and predictive maintenance capabilities. The design includes a new agent switcher UI component that allows users to explicitly select between Petro, Maintenance, and Renewables agents.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React/Next.js)                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Chat Interface with Agent Switcher                       │  │
│  │  [Petrophysics] [Maintenance] [Renewables]               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  GraphQL Client (AWS Amplify)                            │  │
│  │  - invokeMaintenanceAgent mutation                       │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend (AWS Lambda + AppSync)                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Agent Router (agentRouter.ts)                           │  │
│  │  - Determines agent type from query                      │  │
│  │  - Routes to appropriate agent                           │  │
│  │  - Handles explicit agent selection                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│         │                    │                    │              │
│         ▼                    ▼                    ▼              │
│  ┌──────────┐      ┌──────────────┐      ┌──────────────┐     │
│  │  Petro   │      │ Maintenance  │      │  Renewable   │     │
│  │  Agent   │      │    Agent     │      │    Agent     │     │
│  │          │      │              │      │              │     │
│  │ Enhanced │      │ Maintenance  │      │  Renewable   │     │
│  │ Strands  │      │   Strands    │      │    Proxy     │     │
│  │  Agent   │      │    Agent     │      │    Agent     │     │
│  └──────────┘      └──────────────┘      └──────────────┘     │
│       │                     │                     │              │
│       ▼                     ▼                     ▼              │
│  ┌──────────┐      ┌──────────────┐      ┌──────────────┐     │
│  │  Petro   │      │ Maintenance  │      │  Renewable   │     │
│  │  Tools   │      │    Tools     │      │ Orchestrator │     │
│  │  (MCP)   │      │    (MCP)     │      │   (Lambda)   │     │
│  └──────────┘      └──────────────┘      └──────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

### Component Architecture

#### 1. Maintenance Agent (MaintenanceStrandsAgent)

The Maintenance agent follows the same architecture as EnhancedStrandsAgent:

```typescript
class MaintenanceStrandsAgent {
  private modelId: string;
  private s3Client: S3Client;
  private s3Bucket: string;
  private maintenanceDataPath: string;
  private availableEquipment: string[];
  
  // Workflow tracking
  private maintenanceAuditTrail: Map<string, MaintenanceAuditTrail[]>;
  private methodologyDocumentation: Map<string, MethodologyDocumentation>;
  
  constructor(modelId?: string, s3Bucket?: string);
  
  async processMessage(message: string): Promise<MaintenanceResponse>;
  
  // Intent detection
  private detectUserIntent(message: string): MaintenanceIntent;
  
  // Handler methods
  private async handleEquipmentStatus(message: string, equipmentId?: string);
  private async handleFailurePrediction(message: string, equipmentId?: string);
  private async handleMaintenancePlanning(message: string);
  private async handleInspectionSchedule(message: string);
  private async handleMaintenanceHistory(message: string, equipmentId?: string);
  private async handleAssetHealth(message: string);
  private async handlePreventiveMaintenance(message: string);
}
```

#### 2. Agent Router Enhancement

The AgentRouter will be enhanced to support the Maintenance agent:

```typescript
class AgentRouter {
  private generalAgent: GeneralKnowledgeAgent;
  private petrophysicsAgent: EnhancedStrandsAgent;
  private maintenanceAgent: MaintenanceStrandsAgent;  // NEW
  private renewableAgent: RenewableProxyAgent | null;
  
  constructor(foundationModelId?: string, s3Bucket?: string);
  
  async routeQuery(
    message: string, 
    conversationHistory?: any[], 
    sessionContext?: { 
      chatSessionId?: string; 
      userId?: string;
      selectedAgent?: 'petrophysics' | 'maintenance' | 'renewable';  // NEW
    }
  ): Promise<RouterResponse>;
  
  private determineAgentType(
    message: string,
    explicitSelection?: string  // NEW
  ): 'petrophysics' | 'maintenance' | 'renewable' | 'general';
  
  private containsMaintenanceTerms(message: string): boolean;  // NEW
}
```

#### 3. Agent Switcher UI Component

A new React component for agent selection:

```typescript
interface AgentSwitcherProps {
  selectedAgent: 'auto' | 'petrophysics' | 'maintenance' | 'renewable';
  onAgentChange: (agent: 'auto' | 'petrophysics' | 'maintenance' | 'renewable') => void;
  disabled?: boolean;
}

const AgentSwitcher: React.FC<AgentSwitcherProps> = ({
  selectedAgent,
  onAgentChange,
  disabled = false
}) => {
  return (
    <SegmentedControl
      selectedId={selectedAgent}
      onChange={({ detail }) => onAgentChange(detail.selectedId)}
      options={[
        { id: 'auto', text: 'Auto', iconName: 'gen-ai' },
        { id: 'petrophysics', text: 'Petro', iconName: 'analytics' },
        { id: 'maintenance', text: 'Maintenance', iconName: 'settings' },
        { id: 'renewable', text: 'Renewables', iconName: 'environment' }
      ]}
      disabled={disabled}
    />
  );
};
```

## Components and Interfaces

### 1. Maintenance Agent Interface

```typescript
interface MaintenanceIntent {
  type: 'equipment_status' | 'failure_prediction' | 'maintenance_planning' | 
        'inspection_schedule' | 'maintenance_history' | 'asset_health' | 
        'preventive_maintenance' | 'natural_language_query';
  score: number;
  equipmentId?: string;
  method?: string;
  query?: string;
}

interface MaintenanceResponse {
  success: boolean;
  message: string;
  artifacts?: MaintenanceArtifact[];
  thoughtSteps?: ThoughtStep[];
  workflow?: MaintenanceWorkflow;
  auditTrail?: MaintenanceAuditTrail;
}

interface MaintenanceArtifact {
  messageContentType: 'equipment_health' | 'failure_prediction' | 
                      'maintenance_schedule' | 'inspection_report' | 
                      'asset_lifecycle';
  title: string;
  subtitle?: string;
  data: any;
  visualizationType?: 'chart' | 'gantt' | 'timeline' | 'gauge' | 'table';
}

interface MaintenanceWorkflow {
  equipmentId: string;
  timestamp: Date;
  steps: string[];
  results: any;
  methodology: any;
  qualityMetrics: any;
}

interface MaintenanceAuditTrail {
  timestamp: Date;
  operation: string;
  parameters: any;
  results: any;
  methodology: any;
  user: string;
}
```

### 2. GraphQL Schema Extension

```graphql
type Mutation {
  # Existing mutations
  invokeLightweightAgent(
    chatSessionId: String!
    message: String!
    foundationModelId: String
  ): AgentResponse @aws_auth(cognito_groups: ["authenticated"])
  
  # NEW: Maintenance agent mutation
  invokeMaintenanceAgent(
    chatSessionId: String!
    message: String!
    foundationModelId: String
  ): AgentResponse @aws_auth(cognito_groups: ["authenticated"])
}

type AgentResponse {
  success: Boolean!
  message: String!
  artifacts: [AWSJSON]
  thoughtSteps: [AWSJSON]
  workflow: AWSJSON
  auditTrail: AWSJSON
}
```

### 3. Backend Lambda Function Structure

```
amplify/functions/maintenanceAgent/
├── handler.ts                 # Lambda entry point
├── maintenanceStrandsAgent.ts # Main agent implementation
├── maintenanceTools.ts        # Maintenance-specific tools
├── intentDetection.ts         # Intent detection logic
├── resource.ts                # CDK resource definition
├── package.json
└── tsconfig.json
```

### 4. Maintenance Tools (MCP Integration)

```typescript
// Maintenance tools following MCP pattern
export const equipmentStatusTool = {
  name: 'get_equipment_status',
  description: 'Get current operational status and health metrics for equipment',
  inputSchema: {
    type: 'object',
    properties: {
      equipmentId: { type: 'string', description: 'Equipment identifier' }
    },
    required: ['equipmentId']
  }
};

export const failurePredictionTool = {
  name: 'predict_equipment_failure',
  description: 'Analyze historical data to predict equipment failure risk',
  inputSchema: {
    type: 'object',
    properties: {
      equipmentId: { type: 'string', description: 'Equipment identifier' },
      timeHorizon: { type: 'number', description: 'Prediction horizon in days' }
    },
    required: ['equipmentId']
  }
};

export const maintenancePlanningTool = {
  name: 'generate_maintenance_plan',
  description: 'Generate optimized maintenance schedule based on equipment condition',
  inputSchema: {
    type: 'object',
    properties: {
      equipmentIds: { type: 'array', items: { type: 'string' } },
      startDate: { type: 'string', format: 'date' },
      endDate: { type: 'string', format: 'date' }
    },
    required: ['equipmentIds', 'startDate', 'endDate']
  }
};

export const maintenanceTools = [
  equipmentStatusTool,
  failurePredictionTool,
  maintenancePlanningTool,
  // Additional tools...
];
```

## Data Models

### Equipment Data Model

```typescript
interface Equipment {
  id: string;
  name: string;
  type: 'pump' | 'compressor' | 'turbine' | 'valve' | 'motor' | 'other';
  location: string;
  installDate: Date;
  manufacturer: string;
  model: string;
  serialNumber: string;
  operationalStatus: 'operational' | 'degraded' | 'failed' | 'maintenance';
  healthScore: number; // 0-100
  lastMaintenanceDate: Date;
  nextMaintenanceDate: Date;
  maintenanceHistory: MaintenanceRecord[];
  sensors: Sensor[];
}

interface MaintenanceRecord {
  id: string;
  equipmentId: string;
  date: Date;
  type: 'preventive' | 'corrective' | 'predictive' | 'inspection';
  description: string;
  technician: string;
  duration: number; // hours
  cost: number;
  partsReplaced: string[];
  findings: string;
  recommendations: string;
}

interface Sensor {
  id: string;
  equipmentId: string;
  type: 'temperature' | 'vibration' | 'pressure' | 'flow' | 'current';
  unit: string;
  currentValue: number;
  normalRange: { min: number; max: number };
  alertThreshold: { warning: number; critical: number };
  lastReading: Date;
  readings: SensorReading[];
}

interface SensorReading {
  timestamp: Date;
  value: number;
  quality: 'good' | 'uncertain' | 'bad';
}
```

### Failure Prediction Model

```typescript
interface FailurePrediction {
  equipmentId: string;
  predictionDate: Date;
  failureRisk: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number; // 0-100
  timeToFailure: number; // days
  confidence: number; // 0-1
  contributingFactors: ContributingFactor[];
  recommendations: string[];
  methodology: string;
}

interface ContributingFactor {
  factor: string;
  impact: number; // 0-1
  trend: 'improving' | 'stable' | 'degrading';
  description: string;
}
```

### Maintenance Schedule Model

```typescript
interface MaintenanceSchedule {
  id: string;
  startDate: Date;
  endDate: Date;
  tasks: MaintenanceTask[];
  totalCost: number;
  totalDuration: number; // hours
  optimizationCriteria: 'cost' | 'downtime' | 'risk';
}

interface MaintenanceTask {
  id: string;
  equipmentId: string;
  equipmentName: string;
  type: 'preventive' | 'corrective' | 'predictive' | 'inspection';
  priority: 'low' | 'medium' | 'high' | 'critical';
  scheduledDate: Date;
  estimatedDuration: number; // hours
  estimatedCost: number;
  requiredParts: string[];
  requiredSkills: string[];
  dependencies: string[]; // task IDs
  description: string;
  procedures: string[];
}
```

## Error Handling

### Error Categories

1. **Data Availability Errors**
   - Equipment not found
   - Sensor data unavailable
   - Historical data insufficient

2. **Calculation Errors**
   - Prediction model failure
   - Invalid parameters
   - Insufficient data for analysis

3. **Integration Errors**
   - MCP server unavailable
   - External service timeout
   - Authentication failure

### Error Response Format

```typescript
interface MaintenanceError {
  success: false;
  errorType: 'data_unavailable' | 'calculation_failed' | 'integration_error' | 'unknown';
  message: string;
  details: string;
  suggestions: string[];
  timestamp: Date;
}
```

### Error Handling Strategy

```typescript
class MaintenanceStrandsAgent {
  private async handleError(error: Error, context: any): Promise<MaintenanceResponse> {
    console.error('Maintenance agent error:', error, context);
    
    // Categorize error
    const errorType = this.categorizeError(error);
    
    // Generate user-friendly message
    const message = this.generateErrorMessage(errorType, error);
    
    // Provide actionable suggestions
    const suggestions = this.generateSuggestions(errorType, context);
    
    return {
      success: false,
      message,
      artifacts: [],
      thoughtSteps: [{
        type: 'error',
        title: 'Error Occurred',
        summary: message,
        details: error.message,
        status: 'error',
        timestamp: Date.now()
      }]
    };
  }
  
  private categorizeError(error: Error): string {
    if (error.message.includes('not found')) return 'data_unavailable';
    if (error.message.includes('calculation')) return 'calculation_failed';
    if (error.message.includes('timeout')) return 'integration_error';
    return 'unknown';
  }
}
```

## Testing Strategy

### Unit Tests

1. **Intent Detection Tests**
   - Test maintenance query patterns
   - Test equipment ID extraction
   - Test method detection
   - Test edge cases and ambiguous queries

2. **Handler Tests**
   - Test each handler method independently
   - Mock external dependencies
   - Verify response format
   - Test error handling

3. **Tool Integration Tests**
   - Test MCP tool invocation
   - Test parameter validation
   - Test response parsing
   - Test timeout handling

### Integration Tests

1. **Agent Router Tests**
   - Test routing to maintenance agent
   - Test explicit agent selection
   - Test fallback behavior
   - Test conversation history handling

2. **End-to-End Tests**
   - Test complete user workflows
   - Test artifact generation
   - Test visualization rendering
   - Test error scenarios

3. **Performance Tests**
   - Test response time under load
   - Test concurrent requests
   - Test large dataset handling
   - Test memory usage

### Test Files Structure

```
amplify/functions/maintenanceAgent/__tests__/
├── intentDetection.test.ts
├── equipmentStatus.test.ts
├── failurePrediction.test.ts
├── maintenancePlanning.test.ts
├── errorHandling.test.ts
└── integration.test.ts

tests/
├── test-maintenance-agent.js
├── test-agent-switcher.js
└── test-maintenance-workflows.js
```

## Deployment Strategy

### Phase 1: Backend Infrastructure (Week 1)

1. Create MaintenanceStrandsAgent class
2. Implement intent detection
3. Create maintenance tools (MCP)
4. Add Lambda function and handler
5. Update GraphQL schema
6. Configure IAM permissions
7. Deploy and test backend

### Phase 2: Agent Router Integration (Week 1)

1. Update AgentRouter with maintenance support
2. Add maintenance intent patterns
3. Implement explicit agent selection
4. Test routing logic
5. Deploy and validate

### Phase 3: Frontend UI (Week 2)

1. Create AgentSwitcher component
2. Integrate into chat interface
3. Add state management for agent selection
4. Update message sending logic
5. Test UI interactions

### Phase 4: Preloaded Prompts (Week 2)

1. Design maintenance workflow prompts
2. Add to Cards component
3. Implement auto-agent-selection
4. Test prompt execution
5. Gather user feedback

### Phase 5: Visualizations (Week 3)

1. Create maintenance artifact components
2. Implement health score gauges
3. Implement failure prediction timelines
4. Implement maintenance schedule Gantt charts
5. Test rendering and interactions

### Phase 6: Testing and Refinement (Week 3)

1. Comprehensive testing
2. Performance optimization
3. Error handling refinement
4. Documentation updates
5. User acceptance testing

## Security Considerations

### Authentication and Authorization

- All maintenance agent mutations require authenticated users
- Equipment data access controlled by user permissions
- Sensitive maintenance data encrypted at rest and in transit
- Audit trail for all maintenance operations

### Data Privacy

- Equipment identifiers anonymized where appropriate
- Maintenance records comply with data retention policies
- Personal information (technician names) handled per GDPR
- Sensor data aggregated to prevent reverse engineering

### API Security

- Rate limiting on maintenance agent invocations
- Input validation for all parameters
- SQL injection prevention in database queries
- XSS prevention in artifact rendering

## Performance Optimization

### Caching Strategy

- Cache equipment status for 5 minutes
- Cache failure predictions for 1 hour
- Cache maintenance schedules for 24 hours
- Invalidate cache on data updates

### Query Optimization

- Index equipment by ID, type, and location
- Index maintenance records by equipment and date
- Paginate large result sets
- Use database views for complex queries

### Lambda Optimization

- Warm Lambda instances with provisioned concurrency
- Optimize memory allocation (1024 MB recommended)
- Minimize cold start time with layer optimization
- Use connection pooling for database access

## Monitoring and Observability

### CloudWatch Metrics

- Agent invocation count
- Response time (p50, p95, p99)
- Error rate by error type
- Tool invocation count
- Cache hit rate

### CloudWatch Logs

- Structured logging with request IDs
- Log all intent detection decisions
- Log all tool invocations
- Log all errors with context

### Alarms

- High error rate (> 5%)
- Slow response time (> 5s)
- Lambda throttling
- Database connection failures

## Future Enhancements

### Phase 2 Features

1. **Real-time Equipment Monitoring**
   - WebSocket integration for live sensor data
   - Real-time alerts for critical conditions
   - Dashboard for equipment fleet overview

2. **Advanced Analytics**
   - Machine learning models for failure prediction
   - Anomaly detection in sensor data
   - Root cause analysis for failures

3. **Mobile Support**
   - Mobile-optimized UI
   - Offline mode for field technicians
   - Push notifications for alerts

4. **Integration Enhancements**
   - CMMS (Computerized Maintenance Management System) integration
   - ERP system integration
   - IoT platform integration

### Long-term Vision

- Multi-site maintenance coordination
- Spare parts inventory optimization
- Technician scheduling optimization
- Maintenance cost forecasting
- Regulatory compliance tracking
