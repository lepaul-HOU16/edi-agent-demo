# Renewable Workflow Quick Test Guide

## Quick Validation

Run the complete workflow test:

```bash
node tests/validate-complete-renewable-workflow.js
```

Expected output:
```
✅ Terrain Analysis:      PASS
✅ Layout Optimization:   PASS
⚠️  Wake Simulation:       FAIL (known issue)
✅ Wind Rose:             PASS
✅ Dashboard:             PASS

Overall: 4/5 tests passed
```

## Manual Testing in UI

### 1. Terrain Analysis
**Query:** "Analyze terrain at coordinates 35.067482, -101.395466 with 5km radius"

**Expected:**
- Terrain artifact displays
- 170 OSM features shown
- Perimeter polygon visible
- "Optimize Turbine Layout" button appears

### 2. Layout Optimization
**Query:** "Optimize turbine layout"

**Expected:**
- Layout map displays
- Turbines positioned on map
- Terrain features visible (roads, buildings, water)
- "Run Wake Simulation" button appears

### 3. Wake Simulation
**Query:** "Run wake simulation"

**Expected:**
- ⚠️ Currently fails with data format error
- Known issue, does not block other features

### 4. Wind Rose
**Query:** "Generate wind rose"

**Expected:**
- Interactive Plotly wind rose displays
- Wind direction and speed data shown
- "View Project Dashboard" button appears

### 5. Dashboard
**Query:** "Show project dashboard"

**Expected:**
- Consolidated dashboard displays
- All completed analyses shown
- Project summary visible

## Debugging

### Check Lambda Functions
```bash
aws lambda list-functions --query "Functions[?contains(FunctionName, 'Renewable')].FunctionName" --output table
```

### Check Environment Variables
```bash
ORCHESTRATOR=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'renewableOrchestrator')].FunctionName" --output text)
aws lambda get-function-configuration --function-name "$ORCHESTRATOR" --query "Environment.Variables" --output json | jq -r 'to_entries[] | select(.key | startswith("RENEWABLE")) | "\(.key)=\(.value)"'
```

### Test Orchestrator Directly
```bash
node tests/diagnose-orchestrator.js
```

## Known Issues

### Wake Simulation Data Format
- **Issue:** `'str' object has no attribute 'get'`
- **Impact:** Wake simulation doesn't generate artifacts
- **Workaround:** Other features work independently
- **Status:** Documented, fix planned for future iteration

## Success Criteria

✅ **4/5 features working** (80% success rate)
✅ **CTA buttons functional**
✅ **Terrain features visualized**
✅ **Dashboard accessible**
✅ **Error messages clear**

## Next Steps

1. ✅ Deployment complete
2. ✅ Validation complete (4/5 passing)
3. 📋 User acceptance testing
4. 📋 Fix wake simulation in follow-up task
