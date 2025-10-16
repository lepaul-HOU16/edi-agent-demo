# Design Document

## Overview

This design implements a project persistence layer for renewable energy tools that enables:
- Human-friendly project names with auto-generation from location context
- Session-based active project tracking
- S3-based project data storage with automatic load/save
- Natural language project references with partial matching
- Seamless workflow without repeating project names

## Architecture

### High-Level Flow

```
User Query
    ↓
Orchestrator
    ↓
┌─────────────────────────────────────┐
│ 1. Parse Query & Extract Context    │
│    - Location names                 │
│    - Project references             │
│    - Session context                │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ 2. Project Name Resolution          │
│    - Match existing projects        │
│    - Generate new project name      │
│    - Set active project             │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ 3. Load Project Data from S3        │
│    - Get project.json               │
│    - Merge with session context     │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ 4. Call Tool Lambda                 │
│    - Pass project context           │
│    - Include previous results       │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ 5. Save Results to S3               │
│    - Update project.json            │
│    - Merge new data                 │
└─────────────────────────────────────┘
    ↓
Response with human-friendly project name
```

## Components and Interfaces

### 1. ProjectNameGenerator

**Purpose:** Generate human-friendly project names from location context

**Interface:**
```typescript
interface ProjectNameGenerator {
  /**
   * Generate project name from query and coordinates
   * @param query - User query text
   * @param coordinates - {latitude, longitude}
   * @returns Human-friendly project name (kebab-case)
   */
  generateFromQuery(query: string, coordinates?: {lat: number, lon: number}): Promise<string>;
  
  /**
   * Generate project name from coordinates using reverse geocoding
   * @param latitude - Latitude
   * @param longitude - Longitude
   * @returns Location-based project name (e.g., "amarillo-tx-wind-farm")
   */
  generateFromCoordinates(latitude: number, longitude: number): Promise<string>;
  
  /**
   * Normalize user-provided project name
   * @param name - Raw project name
   * @returns Normalized kebab-case name
   */
  normalize(name: string): string;
  
  /**
   * Ensure project name is unique
   * @param baseName - Base project name
   * @returns Unique name (appends number if needed)
   */
  ensureUnique(baseName: string): Promise<string>;
}
```

**Implementation Details:**
- Extract location names from query using regex patterns:
  - "in {location}" → extract location
  - "at {location}" → extract location
  - "{location} wind farm" → extract location
- Use AWS Location Service for reverse geocoding (coordinates → city/state)
- Fallback to coordinate-based names if geocoding fails: "site-{lat}-{lon}"
- Check S3 for existing projects to ensure uniqueness
- Normalize to kebab-case: lowercase, replace spaces/special chars with hyphens

### 2. ProjectStore

**Purpose:** Manage project data persistence in S3

**Interface:**
```typescript
interface ProjectData {
  project_id: string;           // Unique ID (UUID)
  project_name: string;          // Human-friendly name
  created_at: string;            // ISO timestamp
  updated_at: string;            // ISO timestamp
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  terrain_results?: any;         // From terrain analysis
  layout_results?: any;          // From layout optimization
  simulation_results?: any;      // From wake simulation
  report_results?: any;          // From report generation
  metadata?: {
    turbine_count?: number;
    total_capacity_mw?: number;
    annual_energy_gwh?: number;
  };
}

interface ProjectStore {
  /**
   * Save or update project data
   * @param projectName - Human-friendly project name
   * @param data - Project data to save/merge
   */
  save(projectName: string, data: Partial<ProjectData>): Promise<void>;
  
  /**
   * Load project data by name
   * @param projectName - Human-friendly project name
   * @returns Project data or null if not found
   */
  load(projectName: string): Promise<ProjectData | null>;
  
  /**
   * List all projects
   * @returns Array of project data
   */
  list(): Promise<ProjectData[]>;
  
  /**
   * Find projects by partial name match
   * @param partialName - Partial project name
   * @returns Array of matching projects
   */
  findByPartialName(partialName: string): Promise<ProjectData[]>;
  
  /**
   * Delete project
   * @param projectName - Human-friendly project name
   */
  delete(projectName: string): Promise<void>;
}
```

**S3 Structure:**
```
renewable/
  projects/
    {project-name}/
      project.json          # Main project data
      terrain/
        terrain_data.json
        terrain_map.html
      layout/
        layout.json
        layout_map.html
      simulation/
        simulation_data.json
        wake_map.html
        performance_charts/
      reports/
        report.pdf
```

**Implementation Details:**
- Use S3 bucket from environment variable: `RENEWABLE_S3_BUCKET`
- Project data stored at: `renewable/projects/{project-name}/project.json`
- Merge updates with existing data (don't overwrite)
- Handle S3 errors gracefully with fallback to in-memory cache
- Use S3 ListObjectsV2 for project listing
- Cache project list in memory for 5 minutes to reduce S3 calls

### 3. SessionContextManager

**Purpose:** Track active project and session state

**Interface:**
```typescript
interface SessionContext {
  session_id: string;
  user_id: string;
  active_project?: string;      // Current project name
  project_history: string[];    // Recently accessed projects
  last_updated: string;         // ISO timestamp
}

interface SessionContextManager {
  /**
   * Get session context
   * @param sessionId - Chat session ID
   * @returns Session context
   */
  getContext(sessionId: string): Promise<SessionContext>;
  
  /**
   * Set active project for session
   * @param sessionId - Chat session ID
   * @param projectName - Project name to set as active
   */
  setActiveProject(sessionId: string, projectName: string): Promise<void>;
  
  /**
   * Get active project for session
   * @param sessionId - Chat session ID
   * @returns Active project name or null
   */
  getActiveProject(sessionId: string): Promise<string | null>;
  
  /**
   * Add project to history
   * @param sessionId - Chat session ID
   * @param projectName - Project name to add
   */
  addToHistory(sessionId: string, projectName: string): Promise<void>;
}
```

**Implementation Details:**
- Store session context in DynamoDB table: `RenewableSessionContext`
- Table schema:
  - Partition key: `session_id` (string)
  - Attributes: `user_id`, `active_project`, `project_history` (list), `last_updated`
- TTL: 7 days (auto-cleanup old sessions)
- In-memory cache for active sessions (5 minute TTL)
- Fallback to session-only context if DynamoDB unavailable

### 4. ProjectResolver

**Purpose:** Resolve project references from natural language queries

**Interface:**
```typescript
interface ProjectResolver {
  /**
   * Resolve project name from query and context
   * @param query - User query
   * @param sessionContext - Current session context
   * @returns Resolved project name or null
   */
  resolve(query: string, sessionContext: SessionContext): Promise<string | null>;
  
  /**
   * Extract explicit project reference from query
   * @param query - User query
   * @returns Extracted project name or null
   */
  extractExplicitReference(query: string): string | null;
  
  /**
   * Match project by partial name
   * @param partialName - Partial project name
   * @returns Best matching project name or null
   */
  matchPartialName(partialName: string): Promise<string | null>;
}
```

**Resolution Logic:**
1. Check for explicit project reference in query:
   - "for project {name}"
   - "for {name} project"
   - "project {name}"
2. Check for implicit reference:
   - "that project" → use last mentioned project
   - "the project" → use active project
   - "continue" → use active project
3. Check for partial name match:
   - "west texas" → match "west-texas-wind-farm"
   - "texas" → match projects containing "texas"
4. Fall back to active project from session
5. If no match, return null (will trigger project creation)

**Implementation Details:**
- Use regex patterns for explicit references
- Fuzzy matching for partial names (Levenshtein distance)
- Prioritize exact matches over partial matches
- If multiple matches, return most recently used
- Cache project list for fast matching

## Data Models

### ProjectData Schema

```typescript
{
  "project_id": "uuid-v4",
  "project_name": "west-texas-wind-farm",
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T11:45:00Z",
  "coordinates": {
    "latitude": 35.067482,
    "longitude": -101.395466
  },
  "terrain_results": {
    "features": [...],
    "suitability_score": 85,
    "constraints": [...]
  },
  "layout_results": {
    "turbines": [...],
    "total_capacity_mw": 30,
    "turbine_count": 12
  },
  "simulation_results": {
    "annual_energy_gwh": 95.5,
    "capacity_factor": 0.36,
    "wake_loss_percent": 5.2
  },
  "report_results": {
    "report_url": "s3://..."
  },
  "metadata": {
    "turbine_count": 12,
    "total_capacity_mw": 30,
    "annual_energy_gwh": 95.5
  }
}
```

### SessionContext Schema

```typescript
{
  "session_id": "session-123",
  "user_id": "user-456",
  "active_project": "west-texas-wind-farm",
  "project_history": [
    "west-texas-wind-farm",
    "panhandle-wind",
    "amarillo-tx-wind-farm"
  ],
  "last_updated": "2025-01-15T11:45:00Z"
}
```

## Error Handling

### Missing Project Data Errors

**Scenario:** User tries to run operation without required previous step

**Error Response Format:**
```typescript
{
  "success": false,
  "error": {
    "type": "MissingProjectData",
    "message": "No layout found for project 'west-texas-wind-farm'",
    "project_name": "west-texas-wind-farm",
    "missing_data": "layout_results",
    "required_operation": "layout_optimization",
    "suggestion": "Please run layout optimization first: 'optimize layout for west-texas-wind-farm'"
  }
}
```

**Implementation:**
- Check project data before calling tool Lambda
- Return specific error for missing data
- Include helpful suggestion for next step
- Log error for debugging

### Project Name Conflicts

**Scenario:** Generated project name already exists

**Resolution:**
- Append number to make unique: "west-texas-wind-farm-2"
- Check S3 for existing projects
- Increment number until unique name found
- Log conflict for monitoring

### Ambiguous Project References

**Scenario:** Partial name matches multiple projects

**Response:**
```typescript
{
  "success": false,
  "error": {
    "type": "AmbiguousProjectReference",
    "message": "Multiple projects match 'texas'",
    "matches": [
      "west-texas-wind-farm",
      "east-texas-wind-farm",
      "north-texas-wind-farm"
    ],
    "suggestion": "Please specify which project: 'west texas', 'east texas', or 'north texas'"
  }
}
```

## Testing Strategy

### Unit Tests

1. **ProjectNameGenerator**
   - Test location extraction from queries
   - Test reverse geocoding
   - Test name normalization
   - Test uniqueness checking

2. **ProjectStore**
   - Test save/load operations
   - Test data merging
   - Test project listing
   - Test partial name matching
   - Test S3 error handling

3. **SessionContextManager**
   - Test context creation
   - Test active project tracking
   - Test project history
   - Test DynamoDB operations

4. **ProjectResolver**
   - Test explicit reference extraction
   - Test implicit reference resolution
   - Test partial name matching
   - Test ambiguity handling

### Integration Tests

1. **End-to-End Workflow**
   - Create project with terrain analysis
   - Run layout optimization (auto-load coordinates)
   - Run wake simulation (auto-load layout)
   - Generate report (auto-load all data)

2. **Session Context**
   - Test active project persistence across requests
   - Test project switching
   - Test session expiration

3. **Natural Language References**
   - Test "that project" references
   - Test partial name matching
   - Test ambiguous references

### Performance Tests

1. **S3 Operations**
   - Test project load time (< 500ms)
   - Test project save time (< 1s)
   - Test project listing (< 2s for 100 projects)

2. **Caching**
   - Test cache hit rate (> 80%)
   - Test cache invalidation
   - Test memory usage

## Deployment Considerations

### DynamoDB Table Creation

```typescript
// In amplify/backend.ts
const sessionContextTable = new dynamodb.Table(stack, 'RenewableSessionContext', {
  partitionKey: { name: 'session_id', type: dynamodb.AttributeType.STRING },
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
  timeToLiveAttribute: 'ttl',
  removalPolicy: RemovalPolicy.DESTROY
});
```

### IAM Permissions

Orchestrator Lambda needs:
- S3: GetObject, PutObject, ListObjects on `renewable/projects/*`
- DynamoDB: GetItem, PutItem, UpdateItem on SessionContext table
- Location Service: SearchPlaceIndexForPosition (for reverse geocoding)

### Environment Variables

```
RENEWABLE_S3_BUCKET=<bucket-name>
SESSION_CONTEXT_TABLE=RenewableSessionContext
AWS_LOCATION_PLACE_INDEX=<place-index-name>
```

## Migration Strategy

### Phase 1: Add Project Store (No Breaking Changes)
- Implement ProjectStore with S3 backend
- Add project data saving to orchestrator
- Keep existing parameter-based flow working
- Test with new projects only

### Phase 2: Add Session Context
- Implement SessionContextManager with DynamoDB
- Add active project tracking
- Keep explicit project references working
- Test session persistence

### Phase 3: Add Name Generation
- Implement ProjectNameGenerator
- Add reverse geocoding
- Generate names for new projects
- Migrate existing projects to named format

### Phase 4: Add Natural Language Resolution
- Implement ProjectResolver
- Add partial name matching
- Add implicit reference resolution
- Test with various query patterns

### Phase 5: Full Rollout
- Enable for all users
- Monitor error rates
- Collect feedback
- Iterate on name generation and matching

## Visualization Enhancements

### Plotly Wind Rose Visualization

**Purpose:** Replace matplotlib-based wind rose with interactive Plotly wind rose showing wind speed distributions by direction

**Design Specifications:**
- **Chart Type:** Polar bar chart (barpolar) with stacked bars
- **Data Structure:**
  - 16 directional bins (N, NNE, NE, ENE, E, ESE, SE, SSE, S, SSW, SW, WSW, W, WNW, NW, NNW)
  - Wind speed bins: 0-1, 1-2, 2-3, 3-4, 4-5, 5-6, 6+ m/s
  - Frequency percentage for each direction/speed combination
- **Visual Style:**
  - Dark background (#1a1a1a or transparent)
  - Color gradient: Yellow (low speeds) → Orange → Pink → Purple (high speeds)
  - Stacked bars showing speed distribution
  - Radial grid lines with percentage labels
  - Compass directions labeled around perimeter
- **Interactivity:**
  - Hover tooltips showing exact frequency and speed range
  - Click to filter data by direction
  - Zoom and pan capabilities
  - Export to PNG/SVG

**Implementation:**
```typescript
// Frontend: Plotly.js configuration
const windRoseConfig = {
  data: [{
    type: 'barpolar',
    r: frequencies,  // Frequency percentages
    theta: directions,  // 16 compass directions
    marker: {
      color: windSpeeds,  // Color by wind speed
      colorscale: [
        [0, '#ffff00'],    // 0-1 m/s: Yellow
        [0.17, '#ffcc00'], // 1-2 m/s: Light orange
        [0.33, '#ff9900'], // 2-3 m/s: Orange
        [0.5, '#ff6600'],  // 3-4 m/s: Dark orange
        [0.67, '#ff3366'], // 4-5 m/s: Pink
        [0.83, '#cc33cc'], // 5-6 m/s: Purple
        [1, '#9933ff']     // 6+ m/s: Deep purple
      ],
      line: { color: '#333', width: 1 }
    },
    hovertemplate: '<b>%{theta}</b><br>Speed: %{marker.color} m/s<br>Frequency: %{r}%<extra></extra>'
  }],
  layout: {
    polar: {
      radialaxis: {
        visible: true,
        range: [0, maxFrequency],
        showticklabels: true,
        ticksuffix: '%',
        gridcolor: '#444'
      },
      angularaxis: {
        direction: 'clockwise',
        rotation: 90,
        gridcolor: '#444'
      },
      bgcolor: 'rgba(0,0,0,0)'
    },
    paper_bgcolor: '#1a1a1a',
    plot_bgcolor: '#1a1a1a',
    font: { color: '#fff' },
    showlegend: true,
    legend: {
      title: { text: 'Wind Speed (m/s)' },
      orientation: 'v',
      x: 1.1,
      y: 0.5
    }
  }
};
```

**Backend Generation:**
- Python Lambda generates wind rose data using real wind measurements
- Bins data into 16 directions and 7 speed ranges
- Calculates frequency percentages
- Returns structured data for Plotly rendering
- Optionally generates static PNG using plotly.py for fallback

### Dashboard Consolidation

**Purpose:** Combine related charts into cohesive dashboard views instead of separate artifact components

**Dashboard Types:**

Based on actual demo artifacts in `renewable_generated_samples/`:

#### 1. Simulation Results Dashboard
**Combines (from simulation_agent/):**
- Wind rose (Plotly polar chart - primary, large)
- Wind speed distribution (histogram)
- AEP distribution (histogram)
- AEP per turbine (bar chart)
- Wake losses (bar chart by turbine)
- Wake map (spatial visualization)
- AEP vs wind speed (scatter/line chart)
- Power curve (line chart)

**Layout:** 
- Top row: Wind rose (50%) + Wind speed distribution (50%)
- Middle row: Wake map (100% width, interactive)
- Bottom grid: 2x3 grid for remaining charts
- Summary metrics bar at top with key stats from simulation_summary.json

**Data Structure:**
```json
{
  "total_aep_gwh": 134.03,
  "capacity_factor": 0.507,
  "wake_loss_percent": 4.25,
  "number_of_turbines": 9,
  "mean_wind_speed": 7.95,
  "turbine_model": "IEA37 3.35MW",
  "aep_per_turbine_gwh": [14.66, 14.72, ...],
  "has_flow_map": true
}
```

#### 2. Layout Optimization Dashboard
**Combines (from layout_agent/):**
- Layout map (interactive Folium map with turbine positions)
- Layout final visualization (PNG)
- Turbine layout GeoJSON data
- Spacing analysis
- Constraint compliance visualization

**Layout:**
- Interactive map: 70% width, left side
- Layout metrics and constraints: 30% width, right side

#### 3. Terrain Analysis Dashboard
**Combines (from terrain_agent/):**
- Boundaries map (interactive Folium HTML)
- Boundaries visualization (PNG)
- Boundaries GeoJSON data
- Terrain suitability heatmap
- Constraint zones overlay

**Layout:**
- Interactive map: 100% width
- Constraint legend and metrics: Overlay panel

**Implementation Strategy:**
- Three artifact types: `simulation_dashboard`, `layout_dashboard`, `terrain_dashboard`
- Backend generates all charts as PNG files (matching demo output)
- Backend also provides JSON data for interactive Plotly re-rendering
- Frontend can display PNGs directly OR re-render with Plotly for interactivity
- Interactive maps use Folium HTML (matching demo)
- Responsive layout adapts to screen size
- Export entire dashboard as PDF or individual charts

**Artifact Response Structure:**
```typescript
{
  type: 'simulation_dashboard',
  data: {
    summary: {
      total_aep_gwh: 134.03,
      capacity_factor: 0.507,
      wake_loss_percent: 4.25,
      number_of_turbines: 9,
      mean_wind_speed: 7.95,
      turbine_model: "IEA37 3.35MW"
    },
    visualizations: {
      wind_rose: 's3://bucket/project-id/wind_rose.png',
      wind_speed_distribution: 's3://bucket/project-id/wind_speed_distribution.png',
      aep_distribution: 's3://bucket/project-id/aep_distribution.png',
      aep_per_turbine: 's3://bucket/project-id/aep_per_turbine.png',
      wake_losses: 's3://bucket/project-id/wake_losses.png',
      wake_map: 's3://bucket/project-id/wake_map.png',
      aep_vs_windspeed: 's3://bucket/project-id/aep_vs_windspeed.png',
      power_curve: 's3://bucket/project-id/power_curve.png'
    },
    raw_data: {
      // JSON data for Plotly re-rendering if needed
      wind_rose_data: {...},
      aep_per_turbine_data: {...}
    }
  }
}
```

## User Experience Enhancements

### Contextual Action Buttons

**Purpose:** Guide users to the next logical step in their workflow without requiring them to type commands

**Design Principles:**
- Human-centric language (not "Next"/"Previous")
- Context-aware based on project completion status
- Concise and action-oriented
- Positioned as footer in artifact displays

**Button Examples by Context:**

**After Terrain Analysis:**
```typescript
{
  "actions": [
    {
      "label": "Optimize Turbine Layout",
      "query": "optimize layout for {project_name}",
      "icon": "layout",
      "primary": true
    },
    {
      "label": "View Project Details",
      "query": "show project {project_name}",
      "icon": "info"
    }
  ]
}
```

**After Layout Optimization:**
```typescript
{
  "actions": [
    {
      "label": "Run Wake Simulation",
      "query": "run wake simulation for {project_name}",
      "icon": "simulation",
      "primary": true
    },
    {
      "label": "Adjust Layout",
      "query": "optimize layout for {project_name} with different spacing",
      "icon": "edit"
    }
  ]
}
```

**After Wake Simulation:**
```typescript
{
  "actions": [
    {
      "label": "Generate Report",
      "query": "generate report for {project_name}",
      "icon": "report",
      "primary": true
    },
    {
      "label": "View Performance Dashboard",
      "query": "show performance dashboard for {project_name}",
      "icon": "dashboard"
    },
    {
      "label": "Compare Scenarios",
      "query": "create alternative layout for {project_name}",
      "icon": "compare"
    }
  ]
}
```

**After Report Generation:**
```typescript
{
  "actions": [
    {
      "label": "Start New Project",
      "query": "analyze terrain at [coordinates]",
      "icon": "add",
      "primary": true
    },
    {
      "label": "View All Projects",
      "query": "list my renewable projects",
      "icon": "list"
    }
  ]
}
```

**Implementation:**
- Include `actions` array in artifact data
- Frontend renders buttons in artifact footer
- Clicking button sends pre-filled query to chat
- Buttons styled based on `primary` flag
- Icons from Cloudscape icon set

### Response Message Enhancements

**Include Project Status:**
```
✓ Terrain analysis complete for West Texas Wind Farm

Project Status:
  ✓ Terrain Analysis
  ○ Layout Optimization
  ○ Wake Simulation
  ○ Report Generation

[Optimize Turbine Layout] [View Project Details]
```

**Include Next Steps:**
```
✓ Layout optimized with 12 turbines (30 MW total)

Next: Run wake simulation to analyze energy production and wake effects

[Run Wake Simulation] [Adjust Layout]
```

**Dashboard Artifact Response:**
```
✓ Wake simulation complete for West Texas Wind Farm

Performance Summary:
  • Annual Energy: 95.5 GWh
  • Capacity Factor: 36%
  • Wake Losses: 5.2%

View comprehensive analysis in the interactive dashboard below.

[Generate Report] [View Performance Dashboard] [Compare Scenarios]
```

## Chain of Thought Display Enhancement

### Purpose
Replace the current complex chain of thought display with a clean, minimal design matching AgentCore's default style.

### Design Principles
- **Minimal**: Clean, uncluttered interface
- **Professional**: Business-appropriate styling
- **Informative**: Shows key information without overwhelming
- **Subtle**: Animations are gentle and purposeful
- **Cloudscape-native**: Uses Cloudscape components exclusively

### Component Structure

```typescript
interface ThoughtStep {
  step: number;
  action: string;
  reasoning?: string;
  result?: string;
  status: 'in_progress' | 'complete' | 'error';
  duration?: number;  // milliseconds
  timestamp: string;
}
```

### Visual Design

**Step Display (Collapsed - Default for completed steps):**
```
┌─────────────────────────────────────────────────────┐
│ ✓ 1. Intent Detection                    125ms  [▼]│
└─────────────────────────────────────────────────────┘
```

**Step Display (Expanded):**
```
┌─────────────────────────────────────────────────────┐
│ ✓ 1. Intent Detection                    125ms  [▲]│
├─────────────────────────────────────────────────────┤
│ Action: Analyzing query to determine intent         │
│ Result: Detected wake_simulation intent (95% conf.) │
└─────────────────────────────────────────────────────┘
```

**In-Progress Step:**
```
┌─────────────────────────────────────────────────────┐
│ ⟳ 2. Calling Tool Lambda                        [▼]│
│ ▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░ 50%                           │
└─────────────────────────────────────────────────────┘
```

**Error Step:**
```
┌─────────────────────────────────────────────────────┐
│ ✗ 3. Parameter Validation                   45ms [▲]│
├─────────────────────────────────────────────────────┤
│ Error: Missing required parameter: latitude          │
│ Suggestion: Provide coordinates or project name      │
└─────────────────────────────────────────────────────┘
```

### Implementation

**Cloudscape Components:**
- Container for overall panel
- ExpandableSection for each step
- StatusIndicator for step status
- ProgressBar for in-progress steps
- Alert for error steps
- Box for layout and spacing

**Styling:**
```typescript
const stepStyles = {
  complete: {
    icon: <StatusIndicator type="success">✓</StatusIndicator>,
    color: '#037f0c',
    collapsed: true  // Default collapsed
  },
  in_progress: {
    icon: <Spinner size="small" />,
    color: '#0972d3',
    collapsed: false  // Always expanded
  },
  error: {
    icon: <StatusIndicator type="error">✗</StatusIndicator>,
    color: '#d13212',
    collapsed: false  // Always expanded
  }
};
```

**Animation:**
- In-progress spinner: Subtle rotation
- Progress bar: Smooth fill animation
- Expand/collapse: 200ms ease transition
- NO pulsing, glowing, or complex animations

### Comparison with Current Implementation

**Remove:**
- Complex MUI animations
- Psychology icons
- Gradient backgrounds
- Pulsing effects
- Estimated time displays (unless accurate)
- Multiple animation intensities

**Keep:**
- Step numbering
- Action descriptions
- Status indicators
- Expandable details
- Error handling

**Add:**
- Actual timing data (milliseconds)
- Cleaner Cloudscape styling
- Default collapsed state for completed steps
- Better error messages with suggestions

## Success Metrics

- **Project Creation Success Rate:** > 95%
- **Name Generation Accuracy:** > 90% (user doesn't rename)
- **Session Context Hit Rate:** > 80% (active project used)
- **Partial Name Match Accuracy:** > 85%
- **S3 Operation Latency:** < 500ms (p95)
- **User Satisfaction:** Reduced need to repeat project names by > 70%
- **Action Button Click Rate:** > 60% (users use buttons instead of typing)
- **Workflow Completion Rate:** > 80% (users complete all 4 steps)
- **Chain of Thought Clarity:** > 85% of users understand AI reasoning process
