# Renewable Energy End-to-End Test Prompts

## Overview

This document provides a comprehensive list of test prompts to validate the complete Renewable Energy workflow, including all features implemented through the project persistence spec.

**Last Updated:** January 2025  
**Status:** Ready for Testing  
**Purpose:** Validate all renewable energy features end-to-end

---

## Test Categories

1. [Basic Terrain Analysis](#1-basic-terrain-analysis)
2. [Layout Optimization](#2-layout-optimization)
3. [Wind Rose Analysis](#3-wind-rose-analysis)
4. [Wake Simulation](#4-wake-simulation)
5. [Report Generation](#5-report-generation)
6. [Project Persistence](#6-project-persistence)
7. [Project Context & Auto-Loading](#7-project-context--auto-loading)
8. [Project Listing & Status](#8-project-listing--status)
9. [Action Buttons & Next Steps](#9-action-buttons--next-steps)
10. [Dashboard Consolidation](#10-dashboard-consolidation)
11. [Chain of Thought Display](#11-chain-of-thought-display)
12. [Error Handling & Edge Cases](#12-error-handling--edge-cases)
13. [Multi-Project Workflows](#13-multi-project-workflows)

---

## 1. Basic Terrain Analysis

### 1.1 Simple Terrain Query
```
Analyze terrain at 35.067482, -101.395466
```
**Expected:**
- ✅ Terrain analysis artifact with 151 features
- ✅ Interactive map with OSM data
- ✅ Wind resource statistics
- ✅ Suitability score
- ✅ Project name auto-generated (e.g., "lubbock-wind-farm")
- ✅ Action buttons: "Optimize Layout", "Generate Wind Rose"

### 1.2 Named Location Terrain Query
```
Analyze wind farm terrain in Lubbock, Texas
```
**Expected:**
- ✅ Coordinates extracted or geocoded
- ✅ Project name: "lubbock-texas-wind-farm"
- ✅ Same terrain analysis features as 1.1

### 1.3 Terrain with Explicit Project Name
```
Analyze terrain at 35.067482, -101.395466 for project West Texas Wind
```
**Expected:**
- ✅ Project name: "west-texas-wind"
- ✅ Terrain analysis with 151 features
- ✅ Project saved with explicit name

### 1.4 Terrain with Radius
```
Analyze terrain at 35.067482, -101.395466 with 10km radius
```
**Expected:**
- ✅ Larger analysis area
- ✅ More features captured
- ✅ Radius reflected in results

---

## 2. Layout Optimization

### 2.1 Layout After Terrain (Same Session)
```
Optimize turbine layout
```
**Expected:**
- ✅ Auto-loads coordinates from terrain analysis
- ✅ Layout optimization artifact
- ✅ Turbine positions on map
- ✅ Capacity and turbine count
- ✅ Action buttons: "Run Wake Simulation", "Generate Report"

### 2.2 Layout with Explicit Coordinates
```
Optimize turbine layout at 35.067482, -101.395466
```
**Expected:**
- ✅ Layout optimization without prior terrain
- ✅ Creates or updates project
- ✅ Turbine layout displayed

### 2.3 Layout for Named Project
```
Optimize layout for project West Texas Wind
```
**Expected:**
- ✅ Loads coordinates from project data
- ✅ Updates project with layout results
- ✅ Shows project status checklist

### 2.4 Layout with Turbine Count
```
Optimize layout with 50 turbines at 35.067482, -101.395466
```
**Expected:**
- ✅ Layout with specified turbine count
- ✅ Respects turbine count parameter

---

## 3. Wind Rose Analysis

### 3.1 Wind Rose After Terrain
```
Generate wind rose
```
**Expected:**
- ✅ Plotly interactive wind rose chart
- ✅ 16 directional bins
- ✅ Speed ranges color-coded
- ✅ Frequency percentages
- ✅ Zoom/pan interactivity
- ✅ Export options (PNG, SVG, JSON)

### 3.2 Wind Rose with Coordinates
```
Generate wind rose for 35.067482, -101.395466
```
**Expected:**
- ✅ Wind rose without prior terrain
- ✅ Creates or updates project

### 3.3 Wind Rose for Named Project
```
Show wind rose for project West Texas Wind
```
**Expected:**
- ✅ Loads coordinates from project
- ✅ Generates wind rose

---

## 4. Wake Simulation

### 4.1 Wake Simulation After Layout
```
Run wake simulation
```
**Expected:**
- ✅ Auto-loads layout from project
- ✅ Wake heat map visualization
- ✅ Performance metrics (AEP, capacity factor)
- ✅ Wake loss analysis
- ✅ Action button: "Generate Report"

### 4.2 Wake Simulation for Named Project
```
Run wake simulation for project West Texas Wind
```
**Expected:**
- ✅ Loads layout from project data
- ✅ Wake analysis results
- ✅ Updates project with simulation results

### 4.3 Wake Simulation with Wind Speed
```
Run wake simulation with 8 m/s wind speed
```
**Expected:**
- ✅ Uses specified wind speed
- ✅ Reflects in results

---

## 5. Report Generation

### 5.1 Report After Complete Workflow
```
Generate comprehensive report
```
**Expected:**
- ✅ Loads all project data (terrain, layout, simulation)
- ✅ Comprehensive HTML report
- ✅ Executive summary
- ✅ All visualizations included
- ✅ Recommendations
- ✅ Downloadable report

### 5.2 Report for Named Project
```
Generate report for project West Texas Wind
```
**Expected:**
- ✅ Loads all available project data
- ✅ Report includes all completed analyses
- ✅ Clear indication of missing analyses

---

## 6. Project Persistence

### 6.1 Project Name Auto-Generation
```
Analyze terrain at 35.067482, -101.395466
```
**Expected:**
- ✅ Project name auto-generated from location
- ✅ Saved to S3 with kebab-case name
- ✅ Session context updated

### 6.2 Project Name from Query
```
Analyze wind farm in Sweetwater Texas
```
**Expected:**
- ✅ Project name: "sweetwater-texas-wind-farm"
- ✅ Location extracted from query

### 6.3 Explicit Project Name
```
Analyze terrain at 35.067482, -101.395466 for project Lone Star Wind
```
**Expected:**
- ✅ Project name: "lone-star-wind"
- ✅ Explicit name used instead of auto-generated

### 6.4 Project Name Uniqueness
```
Analyze terrain at 35.067482, -101.395466 for project West Texas Wind
```
(Run twice)
**Expected:**
- ✅ First run: "west-texas-wind"
- ✅ Second run: "west-texas-wind-2"
- ✅ Automatic conflict resolution

---

## 7. Project Context & Auto-Loading

### 7.1 Sequential Workflow (Same Session)
```
1. Analyze terrain at 35.067482, -101.395466
2. Optimize layout
3. Run wake simulation
4. Generate report
```
**Expected:**
- ✅ Each step auto-loads previous results
- ✅ No need to repeat coordinates
- ✅ Project data accumulates
- ✅ Status checklist updates

### 7.2 Resume Project (New Session)
```
1. Analyze terrain at 35.067482, -101.395466 for project Highland Wind
2. (Close browser, reopen)
3. Continue with project Highland Wind
```
**Expected:**
- ✅ Project data loaded from S3
- ✅ Previous results available
- ✅ Can continue workflow

### 7.3 Implicit Project Reference
```
1. Analyze terrain at 35.067482, -101.395466
2. Show me the layout for that project
```
**Expected:**
- ✅ "that project" resolves to active project
- ✅ Loads layout if exists, or prompts to create

### 7.4 Partial Name Matching
```
1. Analyze terrain at 35.067482, -101.395466 for project West Texas Wind Farm
2. Show layout for West Texas
```
**Expected:**
- ✅ Fuzzy matching finds "west-texas-wind-farm"
- ✅ Loads correct project

---

## 8. Project Listing & Status

### 8.1 List All Projects
```
List my renewable energy projects
```
**Expected:**
- ✅ Table of all projects
- ✅ Status indicators (✓/✗) for each analysis type
- ✅ Key metrics (turbines, capacity, AEP)
- ✅ Created/updated timestamps
- ✅ Active project marked

### 8.2 Show Project Details
```
Show project West Texas Wind
```
**Expected:**
- ✅ Complete project information
- ✅ All analysis results
- ✅ Metrics and statistics
- ✅ Status of each workflow step

### 8.3 Project Status in Response
After any analysis:
**Expected:**
- ✅ Response includes project name
- ✅ Status checklist shows completed steps
- ✅ "Next:" suggestion for next step

---

## 9. Action Buttons & Next Steps

### 9.1 Terrain Analysis Action Buttons
After terrain analysis:
**Expected:**
- ✅ "Optimize Layout" button (primary)
- ✅ "Generate Wind Rose" button (secondary)
- ✅ Clicking button sends pre-filled query

### 9.2 Layout Optimization Action Buttons
After layout optimization:
**Expected:**
- ✅ "Run Wake Simulation" button (primary)
- ✅ "Generate Wind Rose" button (secondary)
- ✅ "Generate Report" button (secondary)

### 9.3 Wake Simulation Action Buttons
After wake simulation:
**Expected:**
- ✅ "Generate Report" button (primary)
- ✅ "Optimize Layout" button (secondary, to iterate)

### 9.4 Next Step Suggestions
After each analysis:
**Expected:**
- ✅ Clear "Next:" suggestion in response
- ✅ Contextual based on completed steps
- ✅ Guides user through workflow

---

## 10. Dashboard Consolidation

### 10.1 Wind Resource Dashboard
```
Show wind resource dashboard for project West Texas Wind
```
**Expected:**
- ✅ 60% wind rose, 40% supporting charts
- ✅ Seasonal patterns chart
- ✅ Wind speed distribution
- ✅ Monthly averages
- ✅ Variability analysis

### 10.2 Performance Analysis Dashboard
```
Show performance dashboard for project West Texas Wind
```
**Expected:**
- ✅ 2x2 grid layout with summary bar
- ✅ Monthly energy production chart
- ✅ Capacity factor distribution
- ✅ Turbine performance heatmap
- ✅ Availability and losses

### 10.3 Wake Analysis Dashboard
```
Show wake analysis dashboard for project West Texas Wind
```
**Expected:**
- ✅ 50% map, 50% charts (2x2 grid)
- ✅ Wake heat map (Folium)
- ✅ Wake deficit profile
- ✅ Turbine interaction matrix
- ✅ Wake loss by direction

---

## 11. Chain of Thought Display

### 11.1 Thought Steps Visibility
For any renewable query:
**Expected:**
- ✅ Cloudscape ExpandableSection for each step
- ✅ Step number, action, status, duration
- ✅ Completed steps default collapsed
- ✅ In-progress steps expanded with spinner
- ✅ Error steps expanded with alert

### 11.2 Thought Step Content
**Expected steps:**
1. Validating deployment
2. Analyzing query
3. Resolving project name
4. Validating parameters
5. Loading project data (if exists)
6. Calling [tool] tool
7. Processing results
8. Saving project data

### 11.3 Timing Information
**Expected:**
- ✅ Actual duration in milliseconds for each step
- ✅ Total execution time
- ✅ No estimated times

---

## 12. Error Handling & Edge Cases

### 12.1 Missing Coordinates
```
Optimize layout
```
(Without prior terrain or coordinates)
**Expected:**
- ✅ User-friendly error message
- ✅ Suggestion to provide coordinates or run terrain first
- ✅ Example query shown

### 12.2 Missing Layout
```
Run wake simulation
```
(Without prior layout)
**Expected:**
- ✅ Clear error about missing layout
- ✅ Suggestion to run layout optimization first
- ✅ Project name included in error

### 12.3 Ambiguous Project Reference
```
1. Create project "Texas Wind"
2. Create project "Texas Wind Farm"
3. Show layout for Texas
```
**Expected:**
- ✅ Error listing matching projects
- ✅ Suggestion to be more specific
- ✅ Example queries to disambiguate

### 12.4 Invalid Coordinates
```
Analyze terrain at 999, 999
```
**Expected:**
- ✅ Validation error
- ✅ Clear message about invalid coordinates
- ✅ Valid range shown

### 12.5 Project Not Found
```
Show project Nonexistent Project
```
**Expected:**
- ✅ Clear "project not found" message
- ✅ Suggestion to list all projects
- ✅ No crash or generic error

---

## 13. Multi-Project Workflows

### 13.1 Multiple Projects in Same Session
```
1. Analyze terrain at 35.067482, -101.395466 for project Site A
2. Analyze terrain at 36.0, -102.0 for project Site B
3. Optimize layout for project Site A
4. Optimize layout for project Site B
```
**Expected:**
- ✅ Each project tracked separately
- ✅ Correct project context maintained
- ✅ No cross-contamination of data

### 13.2 Switching Between Projects
```
1. Analyze terrain for project Site A
2. Analyze terrain for project Site B
3. Continue with project Site A
4. Optimize layout
```
**Expected:**
- ✅ "Continue with project Site A" sets active project
- ✅ Layout optimization uses Site A coordinates
- ✅ Session context updated correctly

### 13.3 Comparing Projects
```
1. Create project Site A with terrain and layout
2. Create project Site B with terrain and layout
3. List my projects
```
**Expected:**
- ✅ Both projects listed
- ✅ Status shows completed analyses for each
- ✅ Metrics allow comparison

---

## Testing Checklist

### Pre-Test Setup
- [ ] Sandbox is running (`npx ampx sandbox`)
- [ ] All Lambda functions deployed
- [ ] Environment variables configured
- [ ] S3 bucket accessible
- [ ] DynamoDB table created
- [ ] AWS Location Service configured

### During Testing
- [ ] Test in order (basic → advanced)
- [ ] Verify each expected outcome
- [ ] Check browser console for errors
- [ ] Check CloudWatch logs for backend errors
- [ ] Test in both same session and new session
- [ ] Test with multiple projects

### Post-Test Validation
- [ ] All artifacts render correctly
- [ ] No "Visualization Unavailable" errors
- [ ] No infinite loading states
- [ ] No page reloads required
- [ ] Action buttons work
- [ ] Project data persists
- [ ] Session context maintained
- [ ] Error messages are user-friendly

---

## Success Criteria

### Core Functionality
- ✅ All 5 analysis types work (terrain, layout, wind rose, wake, report)
- ✅ Project persistence saves and loads correctly
- ✅ Session context tracks active project
- ✅ Auto-loading of previous results works
- ✅ Project listing shows all projects

### User Experience
- ✅ Project names are human-friendly
- ✅ Action buttons guide workflow
- ✅ Next step suggestions are clear
- ✅ Error messages are helpful
- ✅ No technical jargon in user-facing messages

### Performance
- ✅ Responses within 10 seconds
- ✅ No timeouts
- ✅ Smooth UI interactions
- ✅ Fast project data loading

### Reliability
- ✅ No regressions in existing features
- ✅ Consistent behavior across sessions
- ✅ Graceful error handling
- ✅ No data loss

---

## Regression Tests

### Critical Features to Protect
1. **Terrain Analysis**
   - Must show 151 features (not 60)
   - Map must render correctly
   - OSM data must load

2. **Layout Optimization**
   - Turbines must display on map
   - Capacity calculations correct
   - No blank visualizations

3. **Project Persistence**
   - Data must save to S3
   - Data must load from S3
   - No data corruption

4. **Session Context**
   - Active project tracked correctly
   - Project history maintained
   - No session leaks

---

## Quick Smoke Test

Run these 5 prompts in sequence to validate basic functionality:

```
1. Analyze terrain at 35.067482, -101.395466
2. Optimize layout
3. Generate wind rose
4. Run wake simulation
5. Generate report
```

**Expected:** All 5 complete successfully with artifacts displayed.

---

## Notes

- Test prompts are designed to be copy-paste ready
- Expected outcomes are specific and measurable
- Tests cover happy path and error cases
- Tests validate both functionality and UX
- Tests ensure no regressions

**Remember:** If ANY test fails, stop and fix before proceeding. Regressions are not acceptable.
