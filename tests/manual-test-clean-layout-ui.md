# Manual Test Guide: Clean Layout Optimization UI

## Objective
Verify that layout optimization responses display only the Cloudscape Container without redundant status text.

## Prerequisites
- Application deployed and running
- User authenticated
- Terrain analysis and wind rose completed for a project

## Test Steps

### Step 1: Complete Prerequisites

1. **Start Terrain Analysis**
   - Navigate to chat interface
   - Enter query: `analyze terrain at 35.067482, -101.395466`
   - Wait for response
   - Verify Cloudscape Container displays (no status text above it)
   - Note the project ID from the response

2. **Complete Wind Rose**
   - Enter query: `show wind rose for project [PROJECT_ID]`
   - Wait for response
   - Verify Cloudscape Container displays (no status text above it)

### Step 2: Test Layout Optimization UI

1. **Request Layout Optimization**
   - Enter query: `optimize turbine layout for project [PROJECT_ID]`
   - Wait for response

2. **Verify No Status Text**
   - ✅ **PASS**: No text appears before the Cloudscape Container
   - ❌ **FAIL**: Text like "Layout optimization complete" appears above container

3. **Verify Cloudscape Container Renders**
   - ✅ **PASS**: Cloudscape Container with Header displays
   - ✅ **PASS**: Container has title "Layout Optimization"
   - ✅ **PASS**: Container shows layout visualization (map or chart)
   - ❌ **FAIL**: No container displays or error message shown

4. **Verify All Features Present**
   - ✅ **PASS**: WorkflowCTAButtons show correct workflow state
   - ✅ **PASS**: Layout metrics display (turbine count, capacity, etc.)
   - ✅ **PASS**: Map or visualization shows turbine positions
   - ✅ **PASS**: Action buttons work (if applicable)

### Step 3: Check Browser Console

1. **Open Developer Tools** (F12)
2. **Check Console Tab**
   - ✅ **PASS**: No errors related to artifact rendering
   - ✅ **PASS**: No warnings about missing data
   - ❌ **FAIL**: Errors about undefined properties or missing components

### Step 4: Verify Response Structure

1. **Open Network Tab** in Developer Tools
2. **Find the chat API request**
3. **Check Response**
   - ✅ **PASS**: `message` field is empty or very short (< 50 chars)
   - ✅ **PASS**: `artifacts` array contains layout optimization artifact
   - ✅ **PASS**: Artifact has `type: 'wind_farm_layout_optimization'`
   - ✅ **PASS**: Artifact data includes `projectId`, `title`, and layout data

## Expected Results

### ✅ Success Criteria

**Visual Appearance:**
```
[User Message: "optimize turbine layout for project xyz"]

┌─────────────────────────────────────────────────┐
│ Layout Optimization                        [i]  │ ← Cloudscape Header
├─────────────────────────────────────────────────┤
│                                                 │
│  [Map showing turbine positions]                │
│                                                 │
│  Metrics:                                       │
│  • Turbines: 25                                 │
│  • Total Capacity: 125 MW                       │
│  • Layout Efficiency: 94%                       │
│                                                 │
│  [Workflow CTA Buttons]                         │
│                                                 │
└─────────────────────────────────────────────────┘
```

**What You Should NOT See:**
```
❌ Layout optimization complete
❌ Project: xyz
❌ Project Status: ✓ Terrain ✓ Wind Rose ✓ Layout ○ Simulation
❌ Next: Run wake simulation

[Then the Cloudscape Container below]
```

### API Response Structure

```json
{
  "message": "",  // Empty or very short
  "artifacts": [
    {
      "type": "wind_farm_layout_optimization",
      "messageContentType": "wind_farm_layout_optimization",
      "data": {
        "projectId": "xyz",
        "title": "Layout Optimization",
        "subtitle": "Optimized turbine placement",
        "turbines": [...],
        "metrics": {
          "turbineCount": 25,
          "totalCapacity": 125,
          "efficiency": 0.94
        },
        "geojson": {...}
      }
    }
  ]
}
```

## Troubleshooting

### Issue: Status text appears above container

**Cause**: Orchestrator returning verbose message text

**Fix**: Check orchestrator code in `cdk/lambda-functions/renewable-orchestrator/orchestrator.ts`
- Layout optimization handler should return empty message
- Verify deployment: `cd cdk && npm run build:all && cdk deploy --all`

### Issue: No Cloudscape Container displays

**Cause**: Missing or malformed artifact

**Fix**: 
1. Check browser console for errors
2. Verify artifact type matches frontend component mapping
3. Check artifact data structure includes required fields

### Issue: Container displays but missing features

**Cause**: Incomplete artifact data

**Fix**:
1. Check artifact data includes all required fields
2. Verify layout tool Lambda returns complete data
3. Check S3 storage if visualization uses stored assets

## Test Completion Checklist

- [ ] Terrain analysis completed successfully
- [ ] Wind rose analysis completed successfully
- [ ] Layout optimization request sent
- [ ] No status text appears before Cloudscape Container
- [ ] Cloudscape Container renders with Header
- [ ] Layout visualization displays correctly
- [ ] Metrics show correct values
- [ ] WorkflowCTAButtons show correct state
- [ ] No console errors
- [ ] API response has empty/minimal message
- [ ] API response has proper artifact structure

## Notes

- This test verifies the UI cleanup is working correctly
- The goal is a clean, professional interface with only Cloudscape components
- All information should be in the Cloudscape Container, not in text above it
- This pattern should be consistent across all renewable energy artifacts

## Related Tests

- `test-clean-terrain-ui.js` - Terrain analysis UI test
- `test-clean-windrose-ui.js` - Wind rose UI test
- `test-clean-layout-ui.js` - Automated version of this test
