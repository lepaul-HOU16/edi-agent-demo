# Design Document: Wells Equipment Status Dashboard

## Overview

The Wells Equipment Status Dashboard provides an intelligent, consolidated analytical view of all wells (24, 121, or any number) with AI-powered insights highlighting noteworthy conditions. Users can switch between the consolidated view and individual well details via a dropdown selector. The design focuses on scalability, intelligent analysis, and actionable insights.

## Architecture

### High-Level Architecture

```
User Query → Agent Router → Maintenance Agent → Equipment Status Handler
                                                         ↓
                                                   Well Data Service
                                                         ↓
                                                   Database Query
                                                         ↓
                                                   24 Wells Data
                                                         ↓
                                              Dashboard Artifact Generator
                                                         ↓
                                              Frontend Dashboard Component
```

### Component Layers

1. **Backend Layer**
   - Equipment Status Handler (enhanced)
   - Well Data Service (new)
   - Database Query Layer
   - Artifact Generator

2. **Frontend Layer**
   - Wells Dashboard Container Component
   - Wells Grid Component
   - Well Card Component
   - Well Details Panel Component
   - Dashboard Charts Component

## Components and Interfaces

### Backend Components

#### 1. Well Data Service

**Purpose:** Centralized service for retrieving well data from database

**Interface:**
```typescript
interface WellDataService {
  getAllWells(): Promise<Well[]>;
  getWellById(wellId: string): Promise<Well | null>;
  getWellsByStatus(status: OperationalStatus): Promise<Well[]>;
  getWellHealthMetrics(): Promise<WellHealthMetrics>;
}

interface Well {
  id: string;
  name: string;
  type: 'well';
  location: string;
  operationalStatus: 'operational' | 'degraded' | 'critical' | 'offline';
  healthScore: number;
  lastMaintenanceDate: string;
  nextMaintenanceDate: string;
  sensors: Sensor[];
  alerts: Alert[];
  metadata: {
    field: string;
    operator: string;
    installDate: string;
    depth: number;
    production: ProductionData;
  };
}

interface WellHealthMetrics {
  totalWells: number;
  operational: number;
  degraded: number;
  critical: number;
  offline: number;
  averageHealthScore: number;
  totalAlerts: number;
  criticalAlerts: number;
}
```

**Implementation:**
- Query DynamoDB for well data
- Implement caching (5-minute TTL)
- Handle errors gracefully
- Support parallel queries for performance

#### 2. Enhanced Equipment Status Handler

**Purpose:** Handle "all wells" queries and generate dashboard artifacts

**Changes:**
```typescript
// Add new function
async function handleAllWellsStatus(message: string): Promise<EquipmentStatusResult> {
  // 1. Query Well Data Service for all 24 wells
  const wells = await wellDataService.getAllWells();
  
  // 2. Calculate aggregate metrics
  const metrics = calculateAggregateMetrics(wells);
  
  // 3. Generate dashboard artifact
  const artifact = {
    messageContentType: 'wells_equipment_dashboard',
    title: 'Wells Equipment Status Dashboard',
    subtitle: `${wells.length} wells monitored`,
    dashboard: {
      summary: metrics,
      wells: wells.map(w => transformWellForDashboard(w)),
      timestamp: new Date().toISOString()
    }
  };
  
  return {
    success: true,
    message: generateSummaryMessage(metrics),
    artifacts: [artifact],
    thoughtSteps: generateThoughtSteps(wells, metrics)
  };
}
```

#### 3. Dashboard Artifact Generator

**Purpose:** Transform well data into dashboard-ready format

**Artifact Structure:**
```typescript
interface WellsDashboardArtifact {
  messageContentType: 'wells_equipment_dashboard';
  title: string;
  subtitle: string;
  dashboard: {
    summary: {
      totalWells: number;
      operational: number;
      degraded: number;
      critical: number;
      offline: number;
      fleetHealthScore: number;  // Weighted average
      criticalAlerts: number;
      wellsNeedingAttention: number;  // Health < 70
      upcomingMaintenance: number;    // Next 7 days
    };
    noteworthyConditions: {
      criticalIssues: NoteworthyItem[];
      decliningHealth: NoteworthyItem[];
      maintenanceOverdue: NoteworthyItem[];
      topPerformers: NoteworthyItem[];
      unusualPatterns: NoteworthyItem[];
    };
    priorityActions: PriorityAction[];
    wells: WellSummary[];  // All wells with basic info
    charts: {
      healthDistribution: ChartData;
      statusBreakdown: ChartData;
      fleetTrend: ChartData;  // 30-day trend
      alertHeatmap: ChartData;
    };
    comparativePerformance: {
      topByHealth: WellSummary[];
      bottomByHealth: WellSummary[];
      topByProduction: WellSummary[];
      bottomByProduction: WellSummary[];
    };
    timestamp: string;
  };
}

interface NoteworthyItem {
  wellId: string;
  wellName: string;
  severity: 'critical' | 'high' | 'medium' | 'info';
  title: string;
  description: string;
  recommendation?: string;
  metrics?: Record<string, any>;
}

interface PriorityAction {
  id: string;
  wellId: string;
  wellName: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  estimatedTime?: string;
  dueDate?: string;
  actionType: 'inspection' | 'maintenance' | 'diagnostic' | 'repair';
}

interface WellSummary {
  id: string;
  name: string;
  healthScore: number;
  status: 'operational' | 'degraded' | 'critical' | 'offline';
  alertCount: number;
  criticalAlertCount: number;
  lastMaintenance: string;
  nextMaintenance: string;
  location: string;
  keyMetrics: {
    temperature?: number;
    pressure?: number;
    flowRate?: number;
    production?: number;
  };
}

interface WellDashboardCard {
  id: string;
  name: string;
  healthScore: number;
  status: 'operational' | 'degraded' | 'critical' | 'offline';
  alertCount: number;
  criticalAlertCount: number;
  lastMaintenance: string;
  nextMaintenance: string;
  keyMetrics: {
    temperature?: number;
    pressure?: number;
    flowRate?: number;
    vibration?: number;
  };
  // Detailed data loaded on-demand
  detailedData?: WellDetailedData;
}

interface WellDetailedData {
  sensors: Sensor[];
  alerts: Alert[];
  maintenanceHistory: MaintenanceRecord[];
  productionData: ProductionData;
  recommendations: string[];
  trends: {
    healthScore: TrendData;
    production: TrendData;
  };
}
```

### Frontend Components

#### 1. Wells Dashboard Container (`WellsEquipmentDashboard.tsx`)

**Purpose:** Main container component managing view state and data flow

**Props:**
```typescript
interface WellsEquipmentDashboardProps {
  artifact: WellsDashboardArtifact;
}
```

**State:**
```typescript
interface DashboardState {
  viewMode: 'consolidated' | 'individual';
  selectedWellId: string | null;  // null = consolidated view
  wells: Well[];
  consolidatedAnalysis: ConsolidatedAnalysis;
}
```

**Features:**
- Toggle between consolidated and individual well views
- Manage well selection dropdown
- Coordinate data loading
- Export functionality

#### 2. View Selector Component (`ViewSelector.tsx`)

**Purpose:** Dropdown to switch between consolidated view and individual wells

**Features:**
- Dropdown with "Consolidated View" as default
- List all wells grouped by status (Critical first, then Degraded, then Operational)
- Search/filter wells in dropdown
- Show well health score badge next to each well name
- Keyboard navigation support

**Visual Design:**
```
┌─────────────────────────────────────┐
│ View: [Consolidated View ▼]         │
│                                     │
│ Options:                            │
│ ● Consolidated View (All Wells)    │
│ ─────────────────────────────────  │
│ 🔴 WELL-003 (Health: 45)           │
│ 🔴 WELL-012 (Health: 52)           │
│ 🟡 WELL-007 (Health: 68)           │
│ 🟢 WELL-001 (Health: 92)           │
│ 🟢 WELL-002 (Health: 88)           │
│ ...                                 │
└─────────────────────────────────────┘
```

#### 3. Consolidated Analysis View (`ConsolidatedAnalysisView.tsx`)

**Purpose:** AI-powered analysis of ALL wells highlighting noteworthy conditions

**Sections:**

**A. Executive Summary Card:**
- Total wells monitored
- Fleet health score (weighted average)
- Critical alerts requiring immediate action
- Wells requiring attention (health < 70)
- Upcoming maintenance (next 7 days)

**B. Noteworthy Conditions Panel:**
AI-generated insights highlighting:
- Wells with declining health trends
- Wells with critical alerts
- Wells overdue for maintenance
- Wells with unusual sensor patterns
- Production anomalies
- Comparative analysis (best/worst performers)

**C. Fleet Health Visualization:**
- Health score distribution histogram
- Status breakdown pie chart
- Trend line showing fleet health over time (30 days)
- Alert frequency heatmap

**D. Priority Action Items:**
Ranked list of recommended actions:
1. "WELL-003: Critical pressure alert - Immediate inspection required"
2. "WELL-012: Health declining 15% in 7 days - Schedule diagnostic"
3. "WELL-007: Maintenance overdue by 14 days - Schedule service"
4. etc.

**E. Comparative Performance Table:**
Top 5 and Bottom 5 wells by:
- Health score
- Production efficiency
- Alert frequency
- Maintenance compliance

**Visual Design:**
```
┌─────────────────────────────────────────────────────────┐
│ View: [Consolidated View ▼]                             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │ EXECUTIVE SUMMARY                                │   │
│ │                                                  │   │
│ │ 24 Wells Monitored    Fleet Health: 78/100      │   │
│ │ 🔴 3 Critical Alerts  🟡 5 Need Attention        │   │
│ │ 📅 2 Maintenance Due (Next 7 Days)              │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │ 🔍 NOTEWORTHY CONDITIONS                         │   │
│ │                                                  │   │
│ │ ⚠️ Critical Issues (3)                           │   │
│ │ • WELL-003: Pressure 15% above critical          │   │
│ │   threshold. Immediate inspection required.      │   │
│ │ • WELL-012: Temperature rising steadily for      │   │
│ │   48 hours. Potential equipment failure.         │   │
│ │ • WELL-018: Flow rate dropped 40% in 24 hours.  │   │
│ │                                                  │   │
│ │ 📉 Declining Health Trends (2)                   │   │
│ │ • WELL-007: Health dropped from 82 to 68 in      │   │
│ │   7 days. Recommend diagnostic check.            │   │
│ │ • WELL-015: Vibration levels increasing.         │   │
│ │                                                  │   │
│ │ 🏆 Top Performers (3)                            │   │
│ │ • WELL-001: 98% uptime, optimal production       │   │
│ │ • WELL-005: Consistently high efficiency         │   │
│ │ • WELL-009: Zero alerts in 30 days               │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │ FLEET HEALTH VISUALIZATION                       │   │
│ │                                                  │   │
│ │ [Health Distribution Chart]  [Status Breakdown]  │   │
│ │ [30-Day Trend Line]          [Alert Heatmap]     │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │ 🎯 PRIORITY ACTION ITEMS                         │   │
│ │                                                  │   │
│ │ 1. 🔴 WELL-003: Inspect pressure system          │   │
│ │    Priority: URGENT | Est. Time: 2 hours        │   │
│ │    [Schedule] [View Details]                     │   │
│ │                                                  │   │
│ │ 2. 🔴 WELL-012: Diagnostic check required        │   │
│ │    Priority: HIGH | Est. Time: 4 hours          │   │
│ │    [Schedule] [View Details]                     │   │
│ │                                                  │   │
│ │ 3. 🟡 WELL-007: Schedule maintenance             │   │
│ │    Priority: MEDIUM | Overdue: 14 days          │   │
│ │    [Schedule] [View Details]                     │   │
│ └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

#### 4. Individual Well View (`IndividualWellView.tsx`)

**Purpose:** Detailed view of a single selected well

**Sections:**
- **Well Header:** ID, name, location, health score, status
- **Sensor Dashboard:** Real-time gauges for all sensors
- **Alerts Panel:** Active alerts with severity and timestamps
- **Maintenance Timeline:** Past and upcoming maintenance
- **Production Metrics:** Current and historical production data
- **Trend Charts:** 30-day trends for key sensors
- **Recommendations:** AI-generated maintenance recommendations
- **Action Buttons:** Schedule maintenance, export report, view history

**Visual Design:**
```
┌─────────────────────────────────────────────────────────┐
│ View: [WELL-001 - Production Well Alpha ▼]              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │ WELL-001 | Production Well Alpha                │   │
│ │ Field A - Sector 1                              │   │
│ │                                                  │   │
│ │ Health Score: 92/100 ● Operational              │   │
│ │ Last Maintenance: Dec 15, 2024                  │   │
│ │ Next Maintenance: Mar 15, 2025                  │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │ SENSOR DASHBOARD                                 │   │
│ │                                                  │   │
│ │ [Pressure Gauge]  [Temperature Gauge]            │   │
│ │ [Flow Rate Gauge] [Vibration Gauge]              │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │ ACTIVE ALERTS (1)                                │   │
│ │                                                  │   │
│ │ 🟡 Flow rate elevated - Monitor closely          │   │
│ │    Detected: 2 hours ago                         │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ [Maintenance Timeline] [Production Metrics]             │
│ [Trend Charts] [Recommendations]                        │
└─────────────────────────────────────────────────────────┘
```

#### 5. Dashboard Charts Component (`DashboardCharts.tsx`)

**Purpose:** Visualize aggregate well data in consolidated view

**Charts:**
1. **Health Score Distribution:** Histogram showing distribution across all wells
2. **Status Breakdown:** Pie chart showing operational/degraded/critical/offline counts
3. **30-Day Fleet Trend:** Line chart showing average fleet health over time
4. **Alert Heatmap:** Calendar heatmap showing alert frequency by day

**Library:** Recharts (already used in renewable dashboards)

#### 6. Dashboard Controls (`DashboardControls.tsx`)

**Purpose:** Provide export and refresh controls

**Controls:**
- Export button (PDF/CSV)
- Refresh button with last updated timestamp
- Time range selector (7/30/90 days for trends)
- Filter by status (for consolidated view)

## Data Models

### Well Data Model

```typescript
interface Well {
  // Identity
  id: string;                    // e.g., "WELL-001"
  name: string;                  // e.g., "Production Well Alpha"
  type: 'well';
  
  // Location
  location: {
    field: string;               // e.g., "Field A"
    sector: string;              // e.g., "Sector 1"
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  
  // Status
  operationalStatus: 'operational' | 'degraded' | 'critical' | 'offline';
  healthScore: number;           // 0-100
  
  // Maintenance
  lastMaintenanceDate: string;   // ISO 8601
  nextMaintenanceDate: string;   // ISO 8601
  maintenanceHistory: MaintenanceRecord[];
  
  // Sensors
  sensors: Sensor[];
  
  // Alerts
  alerts: Alert[];
  
  // Production
  production: {
    currentRate: number;         // BPD
    averageRate: number;         // BPD
    cumulativeProduction: number; // barrels
    efficiency: number;          // percentage
  };
  
  // Metadata
  metadata: {
    operator: string;
    installDate: string;
    depth: number;               // feet
    wellType: 'vertical' | 'horizontal' | 'directional';
    completionType: string;
  };
}

interface Sensor {
  type: 'pressure' | 'temperature' | 'flow_rate' | 'vibration' | 'level';
  currentValue: number;
  unit: string;
  normalRange: { min: number; max: number };
  alertThreshold: { warning: number; critical: number };
  status: 'normal' | 'warning' | 'critical';
  lastUpdated: string;
  trend: 'increasing' | 'decreasing' | 'stable';
}

interface Alert {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: string;
  acknowledged: boolean;
  relatedSensor?: string;
}

interface MaintenanceRecord {
  id: string;
  date: string;
  type: 'preventive' | 'corrective' | 'inspection';
  description: string;
  technician: string;
  duration: number;            // hours
  cost?: number;
  partsReplaced?: string[];
}
```

## Error Handling

### Backend Error Handling

1. **Database Query Failures:**
   - Retry with exponential backoff (3 attempts)
   - Return partial data if some wells fail
   - Log errors to CloudWatch
   - Include error details in response

2. **Data Validation:**
   - Validate well data structure
   - Handle missing or malformed data
   - Provide default values where appropriate
   - Log validation errors

3. **Performance Issues:**
   - Implement query timeout (10 seconds)
   - Use parallel queries for multiple wells
   - Cache results (5-minute TTL)
   - Implement circuit breaker pattern

### Frontend Error Handling

1. **Loading States:**
   - Show skeleton loaders while fetching data
   - Display progress indicator for large datasets
   - Provide cancel option for long operations

2. **Error States:**
   - Display user-friendly error messages
   - Provide retry button
   - Show partial data if available
   - Log errors to monitoring service

3. **Offline Handling:**
   - Cache last successful data
   - Display "offline" indicator
   - Queue actions for when connection restored

## Testing Strategy

### Backend Testing

1. **Unit Tests:**
   - Well Data Service methods
   - Artifact generation logic
   - Data transformation functions
   - Error handling paths

2. **Integration Tests:**
   - Database query performance
   - End-to-end data flow
   - Error recovery scenarios
   - Cache behavior

3. **Performance Tests:**
   - Query time for 24 wells
   - Concurrent user load
   - Memory usage
   - Cache effectiveness

### Frontend Testing

1. **Component Tests:**
   - Well Card rendering
   - Expand/collapse behavior
   - Sorting and filtering
   - Chart rendering

2. **Integration Tests:**
   - Dashboard data flow
   - User interactions
   - Progressive disclosure
   - Export functionality

3. **Visual Regression Tests:**
   - Dashboard layouts
   - Responsive behavior
   - Theme consistency
   - Accessibility

4. **Performance Tests:**
   - Initial render time
   - Scroll performance
   - Expand/collapse animation
   - Chart rendering

## Performance Optimization

### Backend Optimization

1. **Database Queries:**
   - Use batch queries for multiple wells
   - Implement pagination for large datasets
   - Create database indexes on frequently queried fields
   - Use connection pooling

2. **Caching Strategy:**
   - Cache well data (5-minute TTL)
   - Cache aggregate metrics (5-minute TTL)
   - Implement cache warming for frequently accessed data
   - Use Redis for distributed caching

3. **Data Transfer:**
   - Compress response data
   - Send only required fields
   - Implement lazy loading for detailed data
   - Use GraphQL for flexible queries

### Frontend Optimization

1. **Rendering:**
   - Use React.memo for well cards
   - Implement virtualization for large lists
   - Lazy load chart libraries
   - Use CSS transforms for animations

2. **Data Management:**
   - Implement local state management (Zustand or Context)
   - Cache expanded well data
   - Debounce filter/sort operations
   - Use Web Workers for heavy computations

3. **Bundle Size:**
   - Code split dashboard components
   - Lazy load chart library
   - Tree-shake unused dependencies
   - Optimize images and icons

## Security Considerations

1. **Data Access:**
   - Verify user permissions for well data
   - Implement row-level security
   - Audit data access
   - Encrypt sensitive data

2. **API Security:**
   - Validate all inputs
   - Implement rate limiting
   - Use authentication tokens
   - Sanitize user inputs

3. **Frontend Security:**
   - Sanitize displayed data
   - Implement CSP headers
   - Prevent XSS attacks
   - Secure export functionality

## Accessibility

1. **Keyboard Navigation:**
   - Tab through all interactive elements
   - Arrow keys for grid navigation
   - Enter/Space to expand wells
   - Escape to close expanded views

2. **Screen Reader Support:**
   - ARIA labels for all controls
   - Announce state changes
   - Describe chart data
   - Provide text alternatives

3. **Visual Accessibility:**
   - High contrast mode support
   - Color-blind friendly palette
   - Scalable text
   - Focus indicators

## Deployment Strategy

### Phase 1: Backend Implementation
1. Create Well Data Service
2. Enhance Equipment Status Handler
3. Implement artifact generation
4. Add caching layer
5. Deploy and test

### Phase 2: Frontend Core
1. Create dashboard container
2. Implement well grid
3. Build well card component
4. Add expand/collapse functionality
5. Deploy and test

### Phase 3: Advanced Features
1. Add charts and visualizations
2. Implement sorting and filtering
3. Add export functionality
4. Optimize performance
5. Deploy and test

### Phase 4: Polish
1. Add animations and transitions
2. Implement responsive design
3. Enhance accessibility
4. Add error handling
5. Final testing and deployment

## Monitoring and Metrics

### Backend Metrics
- Query response time
- Cache hit rate
- Error rate
- Database connection pool usage
- API latency

### Frontend Metrics
- Initial load time
- Time to interactive
- Render performance
- User interaction latency
- Error rate

### Business Metrics
- Dashboard usage frequency
- Most viewed wells
- Export usage
- Filter/sort usage
- Average session duration
