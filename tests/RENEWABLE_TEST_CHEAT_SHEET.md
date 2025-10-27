# Renewable Energy Test Cheat Sheet

## 🚀 Copy-Paste Test Prompts

### Basic Workflow (5 prompts)
```
Analyze terrain at 35.067482, -101.395466
Optimize layout
Generate wind rose
Run wake simulation
Generate report
```

### Named Location
```
Analyze wind farm in Lubbock Texas
```

### Explicit Project Name
```
Analyze terrain at 35.067482, -101.395466 for project Highland Wind
```

### Continue Project
```
Continue with project Highland Wind
```

### List Projects
```
List my renewable energy projects
```

### Show Project Details
```
Show project Highland Wind
```

---

## ✅ Quick Validation Checklist

After each test, verify:

- [ ] Artifact displays (no "Visualization Unavailable")
- [ ] Loading state dismisses (no infinite spinner)
- [ ] Action buttons appear
- [ ] Project name shown in response
- [ ] No errors in browser console
- [ ] No errors in CloudWatch logs

---

## 🎯 Critical Checks

### Terrain Analysis
- [ ] Shows **151 features** (not 60)
- [ ] Map renders with OSM data
- [ ] Wind statistics displayed
- [ ] Project name auto-generated

### Layout Optimization
- [ ] Turbines display on map
- [ ] Capacity shown (MW)
- [ ] Turbine count correct
- [ ] Action buttons present

### Wind Rose
- [ ] Plotly chart renders
- [ ] 16 directional bins
- [ ] Interactive (zoom/pan)
- [ ] Export options available

### Wake Simulation
- [ ] Heat map displays
- [ ] AEP calculated
- [ ] Capacity factor shown
- [ ] Wake losses reported

### Report Generation
- [ ] HTML report generated
- [ ] All sections included
- [ ] Downloadable
- [ ] Visualizations embedded

---

## 🚨 Regression Tests

Run these EVERY time:

```bash
# 1. Feature count
Analyze terrain at 35.067482, -101.395466
# ✅ Must show 151 features

# 2. Layout display
Optimize layout at 35.067482, -101.395466
# ✅ Must show turbines on map

# 3. Project persistence
Analyze terrain for project Test
# (Refresh page)
Continue with project Test
# ✅ Must load previous data
```

---

## 📊 Expected Results

### Terrain Analysis
```
✅ Artifact type: wind_farm_terrain_analysis
✅ Features: 151
✅ Map: Interactive with OSM data
✅ Wind stats: Average speed, max speed, direction
✅ Suitability: Score 0-100
✅ Project: Auto-generated name
✅ Actions: ["Optimize Layout", "Generate Wind Rose"]
```

### Layout Optimization
```
✅ Artifact type: layout_optimization
✅ Turbines: 30-50 (default)
✅ Capacity: 90-150 MW
✅ Map: Turbine markers
✅ Spacing: Minimum distance enforced
✅ Actions: ["Run Wake Simulation", "Generate Report"]
```

### Wind Rose
```
✅ Artifact type: wind_rose
✅ Chart: Plotly barpolar
✅ Directions: 16 bins (22.5° each)
✅ Speeds: 7 ranges (0-1, 1-2, ..., 6+)
✅ Colors: Yellow → Orange → Pink → Purple
✅ Interactive: Zoom, pan, hover
✅ Export: PNG, SVG, JSON
```

### Wake Simulation
```
✅ Artifact type: wake_simulation
✅ Heat map: Folium visualization
✅ AEP: Annual energy (GWh)
✅ Capacity Factor: Percentage
✅ Wake Losses: Percentage
✅ Actions: ["Generate Report"]
```

### Report
```
✅ Artifact type: report_generation
✅ Format: HTML
✅ Sections: Executive summary, terrain, layout, wake, recommendations
✅ Visualizations: All embedded
✅ Downloadable: Yes
```

---

## 🔧 Quick Troubleshooting

### Issue: "Visualization Unavailable"
```bash
# Check S3 permissions
aws s3 ls s3://<bucket>/renewable/
```

### Issue: Infinite Loading
```bash
# Check CloudWatch logs
aws logs tail /aws/lambda/<orchestrator> --follow
```

### Issue: Wrong Feature Count (60 instead of 151)
```bash
# Check terrain Lambda logs
aws logs tail /aws/lambda/<terrain-lambda> --follow
```

### Issue: Missing Coordinates
```bash
# Check project data in S3
aws s3 cp s3://<bucket>/renewable/projects/<project-name>.json -
```

---

## 📈 Performance Targets

| Test | Target | Max |
|------|--------|-----|
| Terrain | 5s | 10s |
| Layout | 5s | 10s |
| Wind Rose | 3s | 8s |
| Wake | 8s | 15s |
| Report | 10s | 20s |

---

## 🎯 Pass/Fail Criteria

### PASS ✅
- All artifacts render
- No console errors
- No CloudWatch errors
- Loading states dismiss
- Action buttons work
- Data persists

### FAIL ❌
- "Visualization Unavailable"
- Infinite loading
- Blank maps
- Wrong feature count
- Generic errors
- Data loss

---

## 📝 Quick Test Log

```
Date: ___________
Tester: ___________

Smoke Test:          [ ] PASS [ ] FAIL
Terrain (151):       [ ] PASS [ ] FAIL
Layout Display:      [ ] PASS [ ] FAIL
Wind Rose:           [ ] PASS [ ] FAIL
Wake Simulation:     [ ] PASS [ ] FAIL
Report:              [ ] PASS [ ] FAIL
Project Persist:     [ ] PASS [ ] FAIL
Action Buttons:      [ ] PASS [ ] FAIL

Overall:             [ ] PASS [ ] FAIL
```

---

## 🚀 Test Commands

### Automated Tests
```bash
# All tests
./tests/run-renewable-e2e-tests.sh all

# Smoke test only
./tests/run-renewable-e2e-tests.sh smoke

# Specific category
./tests/run-renewable-e2e-tests.sh terrain
```

### Manual Tests
```bash
# Open chat interface
npm run dev

# Or use deployed version
open https://<your-app>.amplifyapp.com/chat
```

---

## 📚 Full Documentation

- **Comprehensive Guide:** `RENEWABLE_E2E_TEST_PROMPTS.md`
- **Quick Reference:** `RENEWABLE_QUICK_TEST_GUIDE.md`
- **Test Summary:** `RENEWABLE_TESTING_SUMMARY.md`
- **This Cheat Sheet:** `RENEWABLE_TEST_CHEAT_SHEET.md`

---

**Pro Tip:** Start with the 5-prompt smoke test. If it passes, you're 90% good!
