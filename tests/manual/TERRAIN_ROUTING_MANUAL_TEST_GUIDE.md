# Terrain Query Routing Fix - Manual Testing Guide

## Overview

This guide provides step-by-step instructions for manually testing the terrain query routing fix. This addresses the critical bug where terrain analysis queries were incorrectly matched by project listing patterns.

**Bug Fixed:** "Analyze terrain at coordinates 35.067482, -101.395466 in Texas" was incorrectly routing to project list instead of terrain analysis.

## Prerequisites

- Sandbox environment running (`npx ampx sandbox`)
- Access to AWS Console for CloudWatch logs
- Chat interface accessible

## Test Tasks

### Task 6.1: Test Problematic Query ✅

**Objective:** Verify the exact problematic query now routes correctly to terrain analysis.

#### Steps:

1. **Open the chat interface** in your browser
2. **Select "Renewables Agent"** from the agent switcher
3. **Submit the exact problematic query:**
   ```
   Analyze terrain at coordinates 35.067482, -101.395466 in Texas
   ```

#### Expected Results:

✅ **Success Indicators:**
- Query completes successfully
- Response includes terrain analysis artifacts
- Map visualization displays with terrain features
- Response does NOT say "projects that match" or show project list
- No need to reload page to see results

❌ **Failure Indicators:**
- Response shows "Your Renewable Energy Projects"
- Response lists 34 projects
- No terrain analysis artifacts generated
- No map visualization

#### CloudWatch Verification:

1. Open AWS Console → CloudWatch → Log Groups
2. Find `/aws/lambda/amplify-digitalassistant-renewableOrchestrator`
3. Search for recent logs containing `[ProjectListHandler]`
4. Look for: `❌ Rejected: Query contains action verb`

**This confirms the pattern matching correctly rejected the project list match.**

---

### Task 6.2: Test Legitimate Project List Queries ✅

**Objective:** Verify legitimate project list queries still work correctly.

#### Test Case 1: "list my renewable projects"

1. **Submit query:**
   ```
   list my renewable projects
   ```

#### Expected Results:

✅ **Success Indicators:**
- Response shows "Your Renewable Energy Projects"
- Lists all existing projects with status
- Shows completion percentages
- No terrain analysis artifacts
- Text-only response (no visualizations)

#### Test Case 2: "show my projects"

1. **Submit query:**
   ```
   show my projects
   ```

#### Expected Results:

✅ **Success Indicators:**
- Same as Test Case 1
- Response shows project list
- No artifacts generated

#### CloudWatch Verification:

1. Search logs for `[ProjectListHandler]`
2. Look for: `✅ Matched pattern X`
3. Verify pattern number matches expected project list patterns

---

### Task 6.3: Verify No Regressions ✅

**Objective:** Ensure other renewable energy queries still work correctly.

#### Test Case 1: Terrain Analysis (Different Coordinates)

1. **Submit query:**
   ```
   analyze terrain at 40.7128, -74.0060
   ```

#### Expected Results:

✅ **Success Indicators:**
- Terrain analysis executes
- Generates terrain artifacts
- Map visualization displays
- NOT routed to project list

---

#### Test Case 2: Layout Optimization

1. **Submit query:**
   ```
   optimize layout for my wind farm
   ```

#### Expected Results:

✅ **Success Indicators:**
- Layout optimization executes
- Generates layout artifacts
- Shows turbine placement
- NOT routed to project list

---

#### Test Case 3: Wake Simulation

1. **Submit query:**
   ```
   run wake simulation
   ```

#### Expected Results:

✅ **Success Indicators:**
- Wake simulation executes
- Generates simulation artifacts
- Shows energy production estimates
- NOT routed to project list

---

#### Test Case 4: Report Generation

1. **Submit query:**
   ```
   generate comprehensive report
   ```

#### Expected Results:

✅ **Success Indicators:**
- Report generation executes
- Generates report artifacts
- Shows comprehensive analysis
- NOT routed to project list

---

#### Test Case 5: Project Details

1. **Submit query:**
   ```
   show project [existing-project-name]
   ```

#### Expected Results:

✅ **Success Indicators:**
- Shows project details
- Displays project status
- Shows completion percentage
- Text-only response (no artifacts)

---

## Automated Testing

For automated testing, run:

```bash
node tests/manual/test-terrain-routing-manual.js
```

This script will:
- Test all scenarios automatically
- Verify CloudWatch logs
- Check artifact generation
- Validate routing decisions
- Provide detailed pass/fail results

## Common Issues

### Issue 1: Query Still Routes to Project List

**Symptoms:**
- Terrain query shows project list
- Response says "projects that match"

**Solution:**
1. Check if sandbox is running latest code
2. Restart sandbox: `npx ampx sandbox`
3. Verify pattern fixes deployed
4. Check CloudWatch logs for pattern matching

---

### Issue 2: Project List Queries Don't Work

**Symptoms:**
- "list my projects" doesn't show projects
- Gets routed to terrain analysis

**Solution:**
1. Verify patterns include word boundaries
2. Check action verb safety check isn't too aggressive
3. Review CloudWatch logs for rejection reason

---

### Issue 3: CloudWatch Logs Not Showing

**Symptoms:**
- Can't find pattern matching logs
- No `[ProjectListHandler]` entries

**Solution:**
1. Verify log group name: `/aws/lambda/amplify-digitalassistant-renewableOrchestrator`
2. Check time range (last 15 minutes)
3. Ensure sandbox is running and processing queries

---

## Success Criteria

All tests pass when:

✅ Task 6.1: Problematic query routes to terrain analysis
✅ Task 6.2: Project list queries route to project list
✅ Task 6.3: No regressions in other renewable queries
✅ CloudWatch logs show correct pattern matching decisions
✅ No false positives (terrain queries matched as project list)
✅ No false negatives (project list queries not matched)

## Deployment Checklist

Before marking task 6 complete:

- [ ] All manual tests pass
- [ ] Automated test script passes
- [ ] CloudWatch logs show correct routing
- [ ] No regressions detected
- [ ] User validates fix works
- [ ] Ready for production deployment

## Next Steps

After all tests pass:

1. **Mark Task 6 complete** in tasks.md
2. **Proceed to Task 7:** Deploy and monitor
3. **Monitor production** for any routing issues
4. **Document lessons learned** for future pattern matching

---

## Contact

If you encounter issues or have questions:
- Check CloudWatch logs first
- Review pattern matching code in `projectListHandler.ts`
- Verify orchestrator routing logic in `handler.ts`
- Test with automated script for detailed diagnostics
