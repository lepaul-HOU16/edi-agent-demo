# Renewable Energy Workflow Diagram

## 🔄 Complete Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER STARTS HERE                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: TERRAIN ANALYSIS                                        │
│  ─────────────────────────                                       │
│  Query: "Analyze terrain at 35.067482, -101.395466"            │
│                                                                  │
│  ✅ Generates:                                                   │
│     • Project name (e.g., "lubbock-wind-farm")                  │
│     • 151 OSM features                                          │
│     • Wind resource statistics                                  │
│     • Suitability score                                         │
│     • Interactive map                                           │
│                                                                  │
│  💾 Saves to S3:                                                │
│     • Project coordinates                                       │
│     • Terrain results                                           │
│                                                                  │
│  🎯 Action Buttons:                                             │
│     [Optimize Layout] [Generate Wind Rose]                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 2: LAYOUT OPTIMIZATION                                     │
│  ────────────────────────                                        │
│  Query: "Optimize layout"                                       │
│  (Auto-loads coordinates from Step 1)                           │
│                                                                  │
│  ✅ Generates:                                                   │
│     • Turbine positions (30-50 turbines)                        │
│     • Total capacity (90-150 MW)                                │
│     • Spacing optimization                                      │
│     • Interactive map with turbines                             │
│                                                                  │
│  💾 Saves to S3:                                                │
│     • Layout results                                            │
│     • Turbine count & capacity                                  │
│                                                                  │
│  🎯 Action Buttons:                                             │
│     [Run Wake Simulation] [Generate Wind Rose] [Generate Report]│
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│  STEP 3A: WIND ROSE      │  │  STEP 3B: WAKE SIMULATION│
│  ───────────────────     │  │  ─────────────────────── │
│  Query: "Generate wind   │  │  Query: "Run wake        │
│         rose"            │  │          simulation"     │
│                          │  │                          │
│  ✅ Generates:           │  │  ✅ Generates:           │
│     • Plotly chart       │  │     • Wake heat map      │
│     • 16 directions      │  │     • AEP (GWh/year)     │
│     • 7 speed ranges     │  │     • Capacity factor    │
│     • Interactive        │  │     • Wake losses        │
│     • Export options     │  │     • Performance metrics│
│                          │  │                          │
│  💾 Saves to S3:         │  │  💾 Saves to S3:         │
│     • Wind rose data     │  │     • Simulation results │
│                          │  │     • Performance data   │
│                          │  │                          │
│  🎯 Action Buttons:      │  │  🎯 Action Buttons:      │
│     [Run Wake Sim]       │  │     [Generate Report]    │
└──────────────────────────┘  └──────────────────────────┘
                    │                   │
                    └─────────┬─────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 4: REPORT GENERATION                                       │
│  ──────────────────────                                          │
│  Query: "Generate report"                                       │
│  (Auto-loads all previous results)                              │
│                                                                  │
│  ✅ Generates:                                                   │
│     • Comprehensive HTML report                                 │
│     • Executive summary                                         │
│     • All visualizations embedded                               │
│     • Recommendations                                           │
│     • Downloadable format                                       │
│                                                                  │
│  💾 Saves to S3:                                                │
│     • Complete report                                           │
│     • Project marked as complete                                │
│                                                                  │
│  🎯 Project Status:                                             │
│     ✅ Terrain Analysis                                         │
│     ✅ Layout Optimization                                      │
│     ✅ Wind Rose Analysis                                       │
│     ✅ Wake Simulation                                          │
│     ✅ Report Generation                                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     WORKFLOW COMPLETE                            │
│                                                                  │
│  User can now:                                                  │
│  • View complete project details                               │
│  • Download report                                              │
│  • Start new project                                            │
│  • Compare with other projects                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔀 Alternative Workflows

### Workflow A: Direct to Layout
```
User Query: "Optimize turbine layout at 35.067482, -101.395466"
     │
     ▼
Layout Optimization (creates project, skips terrain)
     │
     ▼
Wake Simulation
     │
     ▼
Report Generation
```

### Workflow B: Resume Existing Project
```
User Query: "Continue with project Highland Wind"
     │
     ▼
Load Project Data from S3
     │
     ▼
User chooses next step (layout, wake, report)
     │
     ▼
Execute chosen analysis
```

### Workflow C: Multi-Project Comparison
```
User Query: "List my renewable energy projects"
     │
     ▼
Display all projects with status
     │
     ▼
User selects project to view/continue
     │
     ▼
Load project details
```

---

## 🎯 Data Flow

```
┌──────────────┐
│  User Query  │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│  Orchestrator        │
│  ─────────────       │
│  1. Parse intent     │
│  2. Resolve project  │
│  3. Load context     │
│  4. Validate params  │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Tool Lambda         │
│  ──────────          │
│  1. Execute analysis │
│  2. Generate viz     │
│  3. Return results   │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  S3 Storage          │
│  ──────────          │
│  1. Save viz         │
│  2. Save project data│
│  3. Return URLs      │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Orchestrator        │
│  ─────────────       │
│  1. Format response  │
│  2. Add action btns  │
│  3. Update session   │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Frontend            │
│  ────────            │
│  1. Render artifact  │
│  2. Show action btns │
│  3. Display status   │
└──────────────────────┘
```

---

## 💾 Project Data Structure

```
S3: s3://bucket/renewable/projects/<project-name>.json
{
  "project_name": "lubbock-wind-farm",
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T11:45:00Z",
  "coordinates": {
    "latitude": 35.067482,
    "longitude": -101.395466
  },
  "terrain_results": {
    "features": [...],
    "wind_statistics": {...},
    "suitability_score": 85
  },
  "layout_results": {
    "turbines": [...],
    "turbine_count": 45,
    "total_capacity_mw": 135
  },
  "simulation_results": {
    "annual_energy_gwh": 450,
    "capacity_factor": 38,
    "wake_losses": 8
  },
  "report_results": {
    "report_url": "s3://...",
    "executive_summary": "..."
  },
  "metadata": {
    "turbine_count": 45,
    "total_capacity_mw": 135,
    "annual_energy_gwh": 450
  }
}
```

---

## 🔄 Session Context

```
DynamoDB: SessionContext Table
{
  "session_id": "session-abc123",
  "active_project": "lubbock-wind-farm",
  "project_history": [
    "lubbock-wind-farm",
    "highland-wind",
    "west-texas-wind"
  ],
  "last_accessed": "2025-01-15T11:45:00Z",
  "ttl": 1736956800  // 7 days from now
}
```

---

## 🎯 Action Button Flow

```
After Terrain Analysis:
┌─────────────────────┐
│ [Optimize Layout]   │ ──► Sends: "Optimize layout"
└─────────────────────┘

┌─────────────────────┐
│ [Generate Wind Rose]│ ──► Sends: "Generate wind rose"
└─────────────────────┘

After Layout Optimization:
┌─────────────────────┐
│ [Run Wake Sim]      │ ──► Sends: "Run wake simulation"
└─────────────────────┘

┌─────────────────────┐
│ [Generate Report]   │ ──► Sends: "Generate report"
└─────────────────────┘

After Wake Simulation:
┌─────────────────────┐
│ [Generate Report]   │ ──► Sends: "Generate report"
└─────────────────────┘
```

---

## 🔍 Chain of Thought Steps

```
Step 1: Validating deployment
   ├─ Check tool Lambdas exist
   ├─ Check environment variables
   └─ Status: ✅ Complete (50ms)

Step 2: Analyzing query
   ├─ Parse intent
   ├─ Extract parameters
   └─ Status: ✅ Complete (30ms)

Step 3: Resolving project name
   ├─ Check for explicit name
   ├─ Check session context
   ├─ Generate if needed
   └─ Status: ✅ Complete (200ms)

Step 4: Validating parameters
   ├─ Check required params
   ├─ Validate ranges
   └─ Status: ✅ Complete (20ms)

Step 5: Loading project data
   ├─ Load from S3
   ├─ Merge with context
   └─ Status: ✅ Complete (150ms)

Step 6: Calling terrain tool
   ├─ Invoke Lambda
   ├─ Wait for response
   └─ Status: ✅ Complete (4500ms)

Step 7: Processing results
   ├─ Format artifacts
   ├─ Generate action buttons
   └─ Status: ✅ Complete (50ms)

Step 8: Saving project data
   ├─ Save to S3
   ├─ Update session context
   └─ Status: ✅ Complete (180ms)

Total: 5180ms
```

---

## 📊 Dashboard Layouts

### Wind Resource Dashboard
```
┌─────────────────────────────────────────┐
│                                         │
│         Wind Rose (60%)                 │
│                                         │
│                                         │
├─────────────────────────────────────────┤
│  Seasonal   │  Speed Dist │  Monthly   │
│  Patterns   │             │  Averages  │
│  (40%)      │             │            │
└─────────────────────────────────────────┘
```

### Performance Analysis Dashboard
```
┌─────────────────────────────────────────┐
│         Summary Bar                     │
├──────────────────┬──────────────────────┤
│  Monthly Energy  │  Capacity Factor     │
│                  │  Distribution        │
├──────────────────┼──────────────────────┤
│  Turbine Perf    │  Availability &      │
│  Heatmap         │  Losses              │
└──────────────────┴──────────────────────┘
```

### Wake Analysis Dashboard
```
┌──────────────────┬──────────────────────┐
│                  │  Wake Deficit        │
│  Wake Heat Map   │  Profile             │
│  (50%)           ├──────────────────────┤
│                  │  Turbine Interaction │
│                  │  Matrix              │
│                  ├──────────────────────┤
│                  │  Wake Loss by        │
│                  │  Direction           │
└──────────────────┴──────────────────────┘
```

---

## 🚀 Quick Reference

### Start New Project
```
Analyze terrain at <lat>, <lon>
```

### Continue Existing Project
```
Continue with project <name>
```

### View All Projects
```
List my renewable energy projects
```

### View Project Details
```
Show project <name>
```

### Complete Workflow
```
1. Analyze terrain at <lat>, <lon>
2. Optimize layout
3. Generate wind rose
4. Run wake simulation
5. Generate report
```

---

**Visual Guide Version:** 1.0  
**Last Updated:** January 2025  
**Status:** Ready for Reference
