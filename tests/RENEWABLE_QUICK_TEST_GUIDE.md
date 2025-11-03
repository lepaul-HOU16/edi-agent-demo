# Renewable Energy Quick Test Guide

## 🚀 5-Minute Smoke Test

Copy-paste these prompts in sequence:

```
1. Analyze terrain at 35.067482, -101.395466
2. Optimize layout
3. Generate wind rose
4. Run wake simulation
5. Generate report
```

**Pass Criteria:** All 5 complete with artifacts displayed, no errors.

---

## 📋 Feature-Specific Quick Tests

### Terrain Analysis (30 seconds)
```
Analyze terrain at 35.067482, -101.395466
```
✅ Check: 151 features, map renders, project name generated

### Layout Optimization (30 seconds)
```
Optimize turbine layout at 35.067482, -101.395466
```
✅ Check: Turbines on map, capacity shown, action buttons present

### Wind Rose (30 seconds)
```
Generate wind rose for 35.067482, -101.395466
```
✅ Check: Plotly chart, 16 directions, interactive, export options

### Wake Simulation (30 seconds)
```
Run wake simulation at 35.067482, -101.395466 with 50 turbines
```
✅ Check: Heat map, performance metrics, AEP calculated

### Report Generation (30 seconds)
```
Generate report for 35.067482, -101.395466
```
✅ Check: HTML report, all sections, downloadable

---

## 🔄 Project Persistence Quick Test (2 minutes)

```
1. Analyze terrain at 35.067482, -101.395466 for project Quick Test
2. List my projects
3. Optimize layout for project Quick Test
4. Show project Quick Test
```

✅ Check: Project saved, listed, data persists, status updates

---

## 🎯 Action Buttons Quick Test (1 minute)

```
1. Analyze terrain at 35.067482, -101.395466
2. Click "Optimize Layout" button
3. Click "Run Wake Simulation" button
```

✅ Check: Buttons appear, clicking sends query, workflow progresses

---

## ⚠️ Error Handling Quick Test (1 minute)

```
1. Optimize layout
   (without coordinates - should error)
2. Run wake simulation
   (without layout - should error)
3. Show project Nonexistent
   (should error gracefully)
```

✅ Check: User-friendly errors, suggestions provided, no crashes

---

## 🔍 Chain of Thought Quick Test (30 seconds)

```
Analyze terrain at 35.067482, -101.395466
```

✅ Check: 
- Thought steps visible
- Cloudscape ExpandableSection used
- Timing shown
- Status indicators correct

---

## 📊 Dashboard Quick Test (1 minute)

```
1. Complete full workflow (terrain → layout → simulation)
2. Show wind resource dashboard
3. Show performance dashboard
4. Show wake analysis dashboard
```

✅ Check: All dashboards render, charts interactive, data correct

---

## 🔢 Multi-Project Quick Test (2 minutes)

```
1. Analyze terrain at 35.067482, -101.395466 for project Site A
2. Analyze terrain at 36.0, -102.0 for project Site B
3. List my projects
4. Optimize layout for project Site A
5. Optimize layout for project Site B
```

✅ Check: Both projects tracked, no cross-contamination, correct context

---

## 🚨 Critical Regression Checks

### Must Pass Every Time

1. **Terrain Feature Count**
   ```
   Analyze terrain at 35.067482, -101.395466
   ```
   ✅ MUST show 151 features (not 60)

2. **Layout Display**
   ```
   Optimize layout at 35.067482, -101.395466
   ```
   ✅ MUST show turbines on map (not blank)

3. **Project Persistence**
   ```
   1. Analyze terrain for project Test
   2. (Refresh page)
   3. Continue with project Test
   ```
   ✅ MUST load previous data

4. **No Visualization Unavailable**
   - Run any analysis
   ✅ MUST NOT show "Visualization Unavailable"

5. **No Infinite Loading**
   - Run any analysis
   ✅ MUST complete and dismiss loading state

---

## 🎯 One-Liner Tests

Quick copy-paste tests for specific features:

```bash
# Terrain
Analyze terrain at 35.067482, -101.395466

# Layout
Optimize turbine layout at 35.067482, -101.395466 with 50 turbines

# Wind Rose
Generate wind rose for 35.067482, -101.395466

# Wake
Run wake simulation at 35.067482, -101.395466 with 8 m/s wind

# Report
Generate comprehensive report for 35.067482, -101.395466

# Project List
List my renewable energy projects

# Project Details
Show project West Texas Wind

# Named Location
Analyze wind farm in Lubbock Texas

# Explicit Project
Analyze terrain at 35.067482, -101.395466 for project Highland Wind

# Continue Project
Continue with project Highland Wind

# Partial Match
Show layout for Highland
```

---

## 📈 Performance Benchmarks

| Operation | Target Time | Max Acceptable |
|-----------|-------------|----------------|
| Terrain Analysis | < 5s | 10s |
| Layout Optimization | < 5s | 10s |
| Wind Rose | < 3s | 8s |
| Wake Simulation | < 8s | 15s |
| Report Generation | < 10s | 20s |
| Project List | < 2s | 5s |
| Project Load | < 1s | 3s |

---

## ✅ Pass/Fail Criteria

### PASS if:
- All artifacts render correctly
- No errors in browser console
- No errors in CloudWatch logs
- Loading states dismiss properly
- Action buttons appear and work
- Project data persists
- Error messages are user-friendly

### FAIL if:
- "Visualization Unavailable" appears
- Infinite loading state
- Page reload required
- Blank maps or charts
- Generic error messages
- Data loss
- Feature count wrong (60 instead of 151)
- Crashes or exceptions

---

## 🔧 Troubleshooting Quick Checks

### If tests fail:

1. **Check Sandbox**
   ```bash
   # Is sandbox running?
   ps aux | grep ampx
   ```

2. **Check Environment Variables**
   ```bash
   # Are tool Lambdas configured?
   aws lambda get-function-configuration \
     --function-name <orchestrator-name> \
     --query "Environment.Variables"
   ```

3. **Check CloudWatch Logs**
   ```bash
   # Any errors in logs?
   aws logs tail /aws/lambda/<function-name> --follow
   ```

4. **Check S3 Bucket**
   ```bash
   # Can we access S3?
   aws s3 ls s3://<bucket-name>/renewable/
   ```

5. **Check DynamoDB Table**
   ```bash
   # Does table exist?
   aws dynamodb describe-table --table-name <table-name>
   ```

---

## 📝 Test Results Template

```
Date: ___________
Tester: ___________
Environment: [ ] Local Sandbox [ ] Production

5-Minute Smoke Test:        [ ] PASS [ ] FAIL
Terrain Analysis:            [ ] PASS [ ] FAIL
Layout Optimization:         [ ] PASS [ ] FAIL
Wind Rose:                   [ ] PASS [ ] FAIL
Wake Simulation:             [ ] PASS [ ] FAIL
Report Generation:           [ ] PASS [ ] FAIL
Project Persistence:         [ ] PASS [ ] FAIL
Action Buttons:              [ ] PASS [ ] FAIL
Error Handling:              [ ] PASS [ ] FAIL
Chain of Thought:            [ ] PASS [ ] FAIL
Dashboards:                  [ ] PASS [ ] FAIL
Multi-Project:               [ ] PASS [ ] FAIL

Critical Regressions:
- Feature Count (151):       [ ] PASS [ ] FAIL
- Layout Display:            [ ] PASS [ ] FAIL
- Project Persistence:       [ ] PASS [ ] FAIL
- No Viz Unavailable:        [ ] PASS [ ] FAIL
- No Infinite Loading:       [ ] PASS [ ] FAIL

Overall Result:              [ ] PASS [ ] FAIL

Notes:
_________________________________________________
_________________________________________________
_________________________________________________
```

---

## 🎓 Testing Best Practices

1. **Test in Order** - Start with basic, move to advanced
2. **One Feature at a Time** - Isolate failures
3. **Check Logs** - Always verify backend logs
4. **Test Both Sessions** - Same session and new session
5. **Test Edge Cases** - Don't just test happy path
6. **Document Failures** - Note exact steps to reproduce
7. **Verify Fixes** - Re-test after fixing
8. **No Assumptions** - Verify everything works

---

## 🚀 Ready to Test?

1. Start sandbox: `npx ampx sandbox`
2. Open chat interface
3. Run 5-minute smoke test
4. If pass → run feature-specific tests
5. If fail → check troubleshooting section
6. Document results
7. Report issues with exact reproduction steps

**Remember:** One failure = stop and fix. No proceeding with broken features.
