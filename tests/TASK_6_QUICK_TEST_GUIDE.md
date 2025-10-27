# Task 6: Quick Test Guide - Action Button Generation

## Quick Verification (5 minutes)

### 1. Deploy Changes
```bash
npx ampx sandbox
# Wait for "Deployed" message
```

### 2. Test Terrain Analysis
Open chat interface and send:
```
analyze terrain at 35.0, -101.0
```

**Expected Result:**
- Artifact renders with terrain map
- 2 action buttons appear:
  - "Optimize Turbine Layout" (primary)
  - "View Project Details"

### 3. Check CloudWatch Logs
```bash
# Get orchestrator function name
aws lambda list-functions --query "Functions[?contains(FunctionName, 'renewableOrchestrator')].FunctionName" --output text

# View recent logs
aws logs tail /aws/lambda/[FUNCTION_NAME] --follow
```

**Look for:**
```
🔘 Generated 2 action button(s) for terrain_analysis: Optimize Turbine Layout, View Project Details
```

### 4. Test Button Click
Click "Optimize Turbine Layout" button

**Expected Result:**
- Query sent: "optimize layout for [project-name]"
- Layout optimization runs
- New artifact with 2 action buttons:
  - "Run Wake Simulation" (primary)
  - "Adjust Layout"

## CloudWatch Log Patterns

### Success Patterns
```
✅ Artifact validated and added: { type: 'wind_farm_terrain_analysis', hasData: true, ... }
🔘 Generated 2 action button(s) for terrain_analysis: Optimize Turbine Layout, View Project Details
```

### Warning Patterns (Expected for some queries)
```
⚠️  No action buttons generated for terrain_analysis (projectName: undefined, artifactType: terrain_analysis)
```
This is normal when project name is not available (e.g., first query without project context).

## Complete Workflow Test

Test the full workflow to verify action buttons at each step:

1. **Terrain Analysis**
   ```
   analyze terrain at 35.0, -101.0
   ```
   → Buttons: "Optimize Layout", "View Details"

2. **Layout Optimization** (click button or type)
   ```
   optimize layout for [project-name]
   ```
   → Buttons: "Run Wake Simulation", "Adjust Layout"

3. **Wake Simulation** (click button or type)
   ```
   run wake simulation for [project-name]
   ```
   → Buttons: "Generate Report", "View Dashboard", "Compare Scenarios"

4. **Report Generation** (click button or type)
   ```
   generate report for [project-name]
   ```
   → Buttons: "Start New Project", "View All Projects"

## Troubleshooting

### No Action Buttons Appear

**Check 1: Project Name**
- Action buttons require a project name
- First query may not have project context
- Subsequent queries should have project name

**Check 2: CloudWatch Logs**
```bash
# Check for warning messages
aws logs filter-log-events \
  --log-group-name /aws/lambda/[FUNCTION_NAME] \
  --filter-pattern "No action buttons generated" \
  --start-time $(date -u -d '5 minutes ago' +%s)000
```

**Check 3: Artifact Structure**
- Open browser console
- Check artifact object in ChatMessage component
- Verify `artifact.actions` array exists

### Buttons Don't Work When Clicked

**Check 1: Query Format**
- Button query should include project name
- Example: "optimize layout for project-name"

**Check 2: Frontend Integration**
- Verify ActionButtons component is rendering
- Check onClick handler is wired correctly

## Success Criteria

✅ All artifact types include action buttons
✅ CloudWatch logs show "Generated X action buttons for {type}"
✅ Buttons render in UI
✅ Clicking buttons sends correct query
✅ Workflow progression works end-to-end

## Quick Commands

```bash
# Deploy
npx ampx sandbox

# Check deployment status
aws lambda list-functions | grep renewableOrchestrator

# Tail logs
aws logs tail /aws/lambda/$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'renewableOrchestrator')].FunctionName" --output text) --follow

# Test orchestrator directly
node tests/verify-action-button-generation.js
```

## Next Task

After verifying Task 6 works:
- Move to Task 7: Enhance generateActionButtons with dashboard access
- Add "View Dashboard" button to all artifact types
- Ensure dashboard is always accessible

---

**Quick Test Time:** ~5 minutes
**Full Workflow Test:** ~10 minutes
**Troubleshooting:** ~5-15 minutes if issues found
