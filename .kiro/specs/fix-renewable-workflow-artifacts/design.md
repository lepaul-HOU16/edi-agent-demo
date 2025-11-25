# Design Document

## Overview

This design addresses critical gaps in the renewable energy workflow artifact rendering and workflow guidance system. The solution focuses on adding missing artifact renderers, fixing workflow button logic, and implementing financial analysis capabilities.

## Architecture

### Component Hierarchy

```
ChatMessage
├── EnhancedArtifactProcessor
│   ├── TerrainMapArtifact ✅ (exists)
│   ├── LayoutMapArtifact ✅ (exists)
│   ├── SimulationChartArtifact ✅ (exists)
│   ├── WindRoseArtifact ✅ (exists, needs verification)
│   ├── WakeAnalysisArtifact ✅ (exists)
│   ├── ReportArtifact ❌ (missing renderer)
│   └── FinancialAnalysisArtifact ❌ (needs creation)
└── WorkflowCTAButtons
    └── Button logic (needs fix)
```

### Data Flow

```
Orchestrator Response
    ↓
ChatMessage receives artifacts array
    ↓
EnhancedArtifactProcessor deserializes artifacts
    ↓
Check artifact.messageContentType or artifact.type
    ↓
Match to appropriate component
    ↓
Render artifact with data
```

## Components and Interfaces

### 1. ChatMessage.tsx - Add Report Artifact Rendering

**Location:** `src/components/ChatMessage.tsx`

**Changes:**
- Add rendering case for `wind_farm_report` artifacts
- Add rendering case for `financial_analysis` artifacts
- Improve logging for artifact type detection

**Implementation:**

```typescript
// Add after wind rose artifact check (around line 680)

// Check for wind farm report
if (parsedArtifact && typeof parsedArtifact === 'object' && 
    (parsedArtifact.messageContentType === 'wind_farm_report' ||
     parsedArtifact.data?.messageContentType === 'wind_farm_report' ||
     parsedArtifact.type === 'wind_farm_report')) {
    console.log('🎉 EnhancedArtifactProcessor: Rendering ReportArtifact!');
    const artifactData = parsedArtifact.data || parsedArtifact;
    return <AiMessageComponent 
        message={message} 
        theme={theme} 
        enhancedComponent={<ReportArtifact 
            data={artifactData} 
            onFollowUpAction={onSendMessage}
        />}
    />;
}

// Check for financial analysis
if (parsedArtifact && typeof parsedArtifact === 'object' && 
    (parsedArtifact.messageContentType === 'financial_analysis' ||
     parsedArtifact.data?.messageContentType === 'financial_analysis' ||
     parsedArtifact.type === 'financial_analysis')) {
    console.log('🎉 EnhancedArtifactProcessor: Rendering FinancialAnalysisArtifact!');
    const artifactData = parsedArtifact.data || parsedArtifact;
    return <AiMessageComponent 
        message={message} 
        theme={theme} 
        enhancedComponent={<FinancialAnalysisArtifact 
            data={artifactData} 
            onFollowUpAction={onSendMessage}
        />}
    />;
}
```

### 2. ReportArtifact.tsx - Add Follow-Up Actions

**Location:** `src/components/renewable/ReportArtifact.tsx`

**Current State:** Component exists but may not have follow-up action support

**Changes:**
- Add `onFollowUpAction` prop
- Add action buttons for "Download PDF", "Share Report", "Create New Project"
- Improve error handling for missing report data

**Interface:**

```typescript
interface ReportArtifactProps {
  data: {
    messageContentType: 'wind_farm_report';
    title: string;
    subtitle?: string;
    executiveSummary: string;
    recommendations: string[];
    projectId: string;
    reportUrl?: string;
    sections?: {
      siteAnalysis?: any;
      layoutDesign?: any;
      wakeAnalysis?: any;
      economicAnalysis?: any;
      environmentalImpact?: any;
      riskAnalysis?: any;
    };
  };
  onFollowUpAction?: (query: string) => void;
}
```

### 3. FinancialAnalysisArtifact.tsx - New Component

**Location:** `src/components/renewable/FinancialAnalysisArtifact.tsx`

**Purpose:** Display financial metrics, cost breakdown, revenue projections, and ROI analysis

**Interface:**

```typescript
interface FinancialAnalysisArtifactProps {
  data: {
    messageContentType: 'financial_analysis';
    projectId: string;
    metrics: {
      totalCapitalCost: number;
      operatingCostPerYear: number;
      revenuePerYear: number;
      lcoe: number; // Levelized Cost of Energy ($/MWh)
      npv: number; // Net Present Value
      irr: number; // Internal Rate of Return (%)
      paybackPeriod: number; // years
    };
    costBreakdown: {
      turbines: number;
      installation: number;
      grid: number;
      land: number;
      other: number;
    };
    revenueProjection: Array<{
      year: number;
      revenue: number;
      costs: number;
      netIncome: number;
    }>;
    assumptions: {
      discountRate: number;
      projectLifetime: number;
      electricityPrice: number;
      capacityFactor: number;
    };
  };
  onFollowUpAction?: (query: string) => void;
}
```

**Design:**
- Use Cloudscape Container and ColumnLayout
- Display key metrics in KPI cards
- Show cost breakdown as pie chart
- Show revenue projection as line chart
- Display assumptions in expandable section
- Add action buttons: "Compare Scenarios", "Adjust Assumptions", "Export Analysis"

### 4. WorkflowCTAButtons.tsx - Fix Button Logic

**Location:** `src/components/renewable/WorkflowCTAButtons.tsx`

**Current Issues:**
- Shows "Optimize Layout" after terrain (should be "Generate Layout")
- Doesn't check for actual artifact existence
- Button prerequisites not properly validated

**Changes:**

```typescript
// Update WORKFLOW_BUTTONS array
const WORKFLOW_BUTTONS: WorkflowCTAButton[] = [
  {
    step: 'terrain',
    label: 'Generate Turbine Layout',  // Changed from "Optimize Turbine Layout"
    action: 'generate turbine layout for {project_id}',
    icon: 'settings',
    primary: true
  },
  {
    step: 'layout',
    label: 'Run Wake Simulation',
    action: 'run wake simulation for {project_id}',
    icon: 'refresh',
    primary: true
  },
  {
    step: 'simulation',
    label: 'Generate Wind Rose',
    action: 'generate wind rose for {project_id}',
    icon: 'view-full',
    primary: true
  },
  {
    step: 'windrose',
    label: 'Financial Analysis',  // Changed from "Generate Report"
    action: 'analyze project economics for {project_id}',
    icon: 'calculator',
    primary: true
  },
  {
    step: 'financial',
    label: 'Generate Report',
    action: 'generate report for {project_id}',
    icon: 'status-info',
    primary: true
  }
];

// Add secondary buttons (always available after certain steps)
const SECONDARY_BUTTONS: WorkflowCTAButton[] = [
  {
    step: 'layout',  // Available after layout
    label: 'Compare Scenarios',
    action: 'compare scenarios for {project_id}',
    icon: 'compare',
    primary: false
  },
  {
    step: 'simulation',  // Available after simulation
    label: 'Optimize Layout',
    action: 'optimize turbine layout for {project_id}',
    icon: 'settings',
    primary: false
  }
];
```

**New Logic:**
- Check for artifact existence in message history, not just step names
- Show primary button for next step
- Show secondary buttons for alternative actions
- Validate prerequisites before enabling buttons

### 5. Orchestrator - Add Financial Analysis Intent

**Location:** `cdk/lambda-functions/renewable-orchestrator/handler.ts`

**Changes:**
- Add `financial_analysis` intent detection
- Add `compare_scenarios` intent detection
- Route to appropriate tool Lambda (or generate inline if simple)

**Intent Detection:**

```typescript
// Add to IntentRouter.ts
{
  type: 'financial_analysis',
  patterns: [
    /financial\s+analysis/i,
    /analyze.*economics/i,
    /project.*economics/i,
    /cost.*analysis/i,
    /roi.*analysis/i,
    /economic.*viability/i
  ],
  confidence: 90
},
{
  type: 'compare_scenarios',
  patterns: [
    /compare\s+scenarios/i,
    /scenario.*comparison/i,
    /compare.*layouts/i,
    /compare.*configurations/i
  ],
  confidence: 90
}
```

## Data Models

### Financial Analysis Data Structure

```typescript
interface FinancialAnalysisData {
  projectId: string;
  turbineCount: number;
  totalCapacity: number; // MW
  annualProduction: number; // MWh/year
  
  costs: {
    turbineCost: number; // $ per turbine
    installationCost: number; // $ per turbine
    gridConnectionCost: number; // $
    landLeaseCost: number; // $ per year
    operatingCost: number; // $ per year
    maintenanceCost: number; // $ per year
  };
  
  revenue: {
    electricityPrice: number; // $ per MWh
    annualRevenue: number; // $
  };
  
  financial: {
    totalCapitalCost: number;
    lcoe: number;
    npv: number;
    irr: number;
    paybackPeriod: number;
  };
  
  assumptions: {
    discountRate: number; // %
    projectLifetime: number; // years
    capacityFactor: number; // %
    degradationRate: number; // % per year
  };
}
```

### Scenario Comparison Data Structure

```typescript
interface ScenarioComparison {
  scenarios: Array<{
    name: string;
    projectId: string;
    turbineCount: number;
    totalCapacity: number;
    annualProduction: number;
    lcoe: number;
    npv: number;
    irr: number;
    paybackPeriod: number;
    landUse: number; // hectares
    environmentalImpact: string;
  }>;
  
  comparison: {
    bestByProduction: string; // scenario name
    bestByLCOE: string;
    bestByNPV: string;
    bestByEnvironmental: string;
  };
  
  recommendations: string[];
}
```

## Error Handling

### Missing Report Data

**Scenario:** User requests report but report generation failed

**Handling:**
```typescript
if (!data.reportUrl && !data.executiveSummary) {
  return (
    <Container>
      <Alert type="error">
        Report generation failed. Please try again or contact support.
      </Alert>
      <Button onClick={() => onFollowUpAction?.('regenerate report')}>
        Retry Report Generation
      </Button>
    </Container>
  );
}
```

### Missing Financial Data

**Scenario:** User requests financial analysis before layout completion

**Handling:**
```typescript
if (!projectData.layout || !projectData.simulation) {
  return {
    success: false,
    message: 'Financial analysis requires completed layout and simulation. Please complete these steps first.',
    artifacts: [{
      type: 'error',
      messageContentType: 'error',
      message: 'Prerequisites not met',
      requiredSteps: ['layout', 'simulation']
    }]
  };
}
```

### Artifact Rendering Fallback

**Scenario:** Artifact type not recognized

**Handling:**
```typescript
// At end of EnhancedArtifactProcessor
console.warn('⚠️ Unknown artifact type:', {
  messageContentType: parsedArtifact.messageContentType,
  type: parsedArtifact.type,
  availableKeys: Object.keys(parsedArtifact)
});

return <AiMessageComponent 
  message={message} 
  theme={theme} 
  enhancedComponent={
    <Alert type="warning">
      Unsupported artifact type: {parsedArtifact.messageContentType || parsedArtifact.type}
      <br />
      <small>Available data: {Object.keys(parsedArtifact).join(', ')}</small>
    </Alert>
  }
/>;
```

## Testing Strategy

### Unit Tests

1. **ChatMessage Artifact Rendering**
   - Test report artifact renders ReportArtifact component
   - Test financial artifact renders FinancialAnalysisArtifact component
   - Test unknown artifact shows fallback message

2. **WorkflowCTAButtons Logic**
   - Test correct button shown after each step
   - Test secondary buttons appear when appropriate
   - Test prerequisite validation works

3. **FinancialAnalysisArtifact**
   - Test metrics display correctly
   - Test charts render with valid data
   - Test error handling for missing data

### Integration Tests

1. **End-to-End Workflow**
   - Complete terrain → layout → simulation → wind rose → financial → report
   - Verify each artifact renders correctly
   - Verify workflow buttons guide user through correct sequence

2. **Financial Analysis Flow**
   - Request financial analysis after simulation
   - Verify financial artifact renders
   - Verify metrics are calculated correctly

3. **Report Generation Flow**
   - Request report after all steps complete
   - Verify report artifact renders
   - Verify PDF download link works

### Manual Testing

1. **Visual Verification**
   - Check report artifact displays all sections
   - Check financial analysis charts render correctly
   - Check workflow buttons show correct labels

2. **User Flow Testing**
   - Follow workflow buttons from start to finish
   - Verify no confusing or backwards steps
   - Verify all artifacts render without errors

## Deployment Considerations

### Frontend Deployment

**Required:**
1. Build frontend: `npm run build`
2. Deploy to S3: `aws s3 sync dist/ s3://energyinsights-development-frontend-development/ --delete`
3. Invalidate CloudFront: `aws cloudfront create-invalidation --distribution-id E18FPAPGJR8ZNO --paths "/*"`
4. Wait 1-2 minutes for cache invalidation

### Backend Deployment

**Required if orchestrator changes:**
1. Navigate to CDK: `cd cdk`
2. Deploy: `npm run deploy`
3. Verify Lambda updated: Check LastModified timestamp

### Verification

**After deployment:**
1. Test report generation: "generate report for [project]"
2. Test financial analysis: "analyze project economics for [project]"
3. Test workflow buttons: Complete full workflow and verify button sequence
4. Check browser console for artifact rendering logs

## Performance Considerations

### Financial Calculations

- Perform calculations in orchestrator or tool Lambda
- Cache results in project data
- Return pre-calculated metrics to frontend

### Report Generation

- Generate report asynchronously if large
- Store PDF in S3
- Return S3 URL to frontend for download

### Artifact Rendering

- Use React.memo for artifact components
- Prevent duplicate renders with content hash
- Lazy load heavy components (charts, maps)

## Security Considerations

### Financial Data

- Validate all financial inputs
- Use reasonable defaults for missing data
- Prevent injection attacks in calculations

### Report Access

- Verify user has access to project before generating report
- Use signed S3 URLs for report downloads
- Set expiration on report URLs (24 hours)

## Future Enhancements

1. **Advanced Financial Modeling**
   - Sensitivity analysis
   - Monte Carlo simulation
   - Tax incentive calculations

2. **Scenario Optimization**
   - AI-powered scenario generation
   - Multi-objective optimization
   - Constraint-based layout generation

3. **Report Customization**
   - User-selectable report sections
   - Custom branding
   - Multiple export formats (PDF, Word, Excel)

4. **Workflow Automation**
   - Auto-run entire workflow with one command
   - Background processing for long-running tasks
   - Email notifications when complete
