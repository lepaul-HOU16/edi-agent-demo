# Export/Import Manual E2E Test Guide

## Overview
This guide provides step-by-step instructions for manually testing the export/import functionality in the deployed environment.

## Prerequisites
- Deployed renewable orchestrator with project lifecycle manager
- At least one existing project with data
- Access to chat interface

## Test Scenarios

### Scenario 1: Export Project with All Data

**Objective:** Export a complete project and verify all data is included

**Steps:**
1. Open chat interface
2. Create a test project (if needed):
   ```
   Analyze terrain at 35.067482, -101.395466
   ```
3. Wait for terrain analysis to complete
4. Export the project:
   ```
   export project [project-name]
   ```

**Expected Results:**
- ✅ System responds with export data in JSON format
- ✅ Export includes version: "1.0"
- ✅ Export includes exportedAt timestamp
- ✅ Export includes complete project data
- ✅ Export includes artifact S3 keys:
  - terrain S3 key (if terrain analysis done)
  - layout S3 key (if layout optimization done)
  - simulation S3 key (if simulation done)
  - report S3 key (if report generated)
- ✅ Export includes project metadata
- ✅ Export includes coordinates

**Verification:**
```json
{
  "version": "1.0",
  "exportedAt": "2025-01-21T...",
  "project": {
    "project_name": "...",
    "coordinates": { "latitude": 35.067482, "longitude": -101.395466 },
    "terrain_results": { "s3_key": "renewable/projects/.../terrain.json" },
    ...
  },
  "artifacts": {
    "terrain": "renewable/projects/.../terrain.json",
    "layout": "renewable/projects/.../layout.json",
    ...
  }
}
```

---

### Scenario 2: Import Project Successfully

**Objective:** Import a project from export data

**Steps:**
1. Copy export data from Scenario 1
2. Import the project:
   ```
   import project from [paste export JSON]
   ```

**Expected Results:**
- ✅ System validates export format version
- ✅ System creates new project with imported data
- ✅ System adds imported_at timestamp to metadata
- ✅ System responds: "Project imported as '[project-name]'"
- ✅ Imported project appears in project list
- ✅ Imported project has all original data
- ✅ Imported project has all artifact references

**Verification:**
```
list projects
```
Should show the imported project

```
show project [imported-project-name]
```
Should show all project details

---

### Scenario 3: Import with Name Conflict

**Objective:** Verify system handles name conflicts during import

**Steps:**
1. Export an existing project:
   ```
   export project [existing-project]
   ```
2. Try to import with same name:
   ```
   import project from [export JSON with same name]
   ```

**Expected Results:**
- ✅ System detects name conflict
- ✅ System automatically appends "-imported" suffix
- ✅ System creates project with unique name
- ✅ System responds: "Project imported as '[project-name]-imported'"
- ✅ Both original and imported projects exist
- ✅ No data loss or overwriting

**Verification:**
```
list projects
```
Should show both:
- [original-project]
- [original-project]-imported

---

### Scenario 4: Import with Unsupported Version

**Objective:** Verify version validation

**Steps:**
1. Create export data with unsupported version:
   ```json
   {
     "version": "2.0",
     "exportedAt": "2025-01-21T...",
     "project": { ... }
   }
   ```
2. Try to import:
   ```
   import project from [modified export JSON]
   ```

**Expected Results:**
- ✅ System rejects import
- ✅ System responds: "Unsupported export version: 2.0. This system supports version 1.0."
- ✅ No project created
- ✅ Error message is clear and helpful

---

### Scenario 5: Export Non-Existent Project

**Objective:** Verify error handling for missing projects

**Steps:**
1. Try to export a project that doesn't exist:
   ```
   export project nonexistent-project-xyz
   ```

**Expected Results:**
- ✅ System responds with error
- ✅ Error message: "Project 'nonexistent-project-xyz' not found"
- ✅ Error includes suggestion: "Use 'list projects' to see available projects"
- ✅ No export data generated

---

### Scenario 6: Export/Import Complete Project

**Objective:** Verify all data preserved through export/import cycle

**Steps:**
1. Create a complete project:
   ```
   Analyze terrain at 35.067482, -101.395466
   ```
   Wait for completion
   
   ```
   Optimize layout for [project-name]
   ```
   Wait for completion
   
   ```
   Run simulation for [project-name]
   ```
   Wait for completion

2. Export the complete project:
   ```
   export project [project-name]
   ```

3. Delete the original project:
   ```
   delete project [project-name]
   ```
   Confirm: `yes`

4. Import the project back:
   ```
   import project from [export JSON]
   ```

5. Verify imported project:
   ```
   show project [imported-project-name]
   ```

**Expected Results:**
- ✅ Export includes all analysis results
- ✅ Export includes all artifact S3 keys
- ✅ Import recreates project completely
- ✅ All terrain data preserved
- ✅ All layout data preserved
- ✅ All simulation data preserved
- ✅ All metadata preserved
- ✅ Coordinates preserved
- ✅ Project functional after import

**Verification:**
- Check project details show all completed steps
- Verify completion percentage is same as original
- Verify all artifact S3 keys present
- Verify metadata values match original

---

### Scenario 7: Export Project with Partial Data

**Objective:** Verify export handles projects with incomplete analysis

**Steps:**
1. Create a project with only terrain analysis:
   ```
   Analyze terrain at 36.0, -102.0
   ```
   Wait for completion (don't run layout/simulation)

2. Export the project:
   ```
   export project [project-name]
   ```

**Expected Results:**
- ✅ Export succeeds
- ✅ Export includes terrain artifact S3 key
- ✅ Export has undefined/null for missing artifacts:
  - layout: undefined
  - simulation: undefined
  - report: undefined
- ✅ Export includes all available data
- ✅ No errors for missing data

**Verification:**
```json
{
  "artifacts": {
    "terrain": "renewable/projects/.../terrain.json",
    "layout": undefined,
    "simulation": undefined,
    "report": undefined
  }
}
```

---

### Scenario 8: Import and Continue Analysis

**Objective:** Verify imported project can be used for further analysis

**Steps:**
1. Export a project with only terrain analysis
2. Import the project
3. Continue analysis on imported project:
   ```
   Optimize layout for [imported-project-name]
   ```

**Expected Results:**
- ✅ Import succeeds
- ✅ Imported project becomes active
- ✅ Layout optimization works on imported project
- ✅ New analysis results added to imported project
- ✅ Project progresses normally

**Verification:**
```
show project [imported-project-name]
```
Should show:
- Terrain: ✓ (from import)
- Layout: ✓ (from new analysis)
- Simulation: ✗
- Report: ✗

---

## Test Checklist

### Export Functionality
- [ ] Export project with all data
- [ ] Export includes version 1.0
- [ ] Export includes exportedAt timestamp
- [ ] Export includes complete project data
- [ ] Export includes all artifact S3 keys
- [ ] Export includes metadata
- [ ] Export includes coordinates
- [ ] Export handles partial data gracefully
- [ ] Export error for non-existent project

### Import Functionality
- [ ] Import project successfully
- [ ] Import validates version
- [ ] Import adds imported_at timestamp
- [ ] Import handles name conflicts
- [ ] Import preserves all data
- [ ] Import preserves artifact references
- [ ] Import rejects unsupported versions
- [ ] Import error messages are clear

### Data Integrity
- [ ] All project data preserved
- [ ] All metadata preserved
- [ ] All coordinates preserved
- [ ] All artifact S3 keys preserved
- [ ] Completion status preserved
- [ ] Project functional after import

### Integration
- [ ] Imported project appears in list
- [ ] Imported project can be viewed
- [ ] Imported project can be used for analysis
- [ ] Imported project can be exported again
- [ ] Imported project can be deleted
- [ ] Imported project can be renamed

---

## Common Issues and Solutions

### Issue: Export returns null
**Solution:** Check if project exists: `list projects`

### Issue: Import fails with version error
**Solution:** Verify export data has version: "1.0"

### Issue: Import creates duplicate
**Solution:** This is expected behavior for name conflicts. Use unique names or delete original first.

### Issue: Artifact S3 keys missing
**Solution:** Verify original project had completed analysis steps

### Issue: Imported project not functional
**Solution:** Check CloudWatch logs for import errors. Verify all required fields present in export data.

---

## Success Criteria

All tests pass when:
1. ✅ Export generates complete JSON with all data
2. ✅ Import creates functional project
3. ✅ Name conflicts handled automatically
4. ✅ Version validation works
5. ✅ All data preserved through export/import cycle
6. ✅ Imported projects can be used normally
7. ✅ Error messages are clear and helpful
8. ✅ No data loss or corruption

---

## Deployment Verification

After deployment, verify:
1. Export command recognized by orchestrator
2. Import command recognized by orchestrator
3. Export/import intents detected correctly
4. ProjectLifecycleManager methods accessible
5. S3 artifact references preserved
6. No CloudWatch errors during export/import

---

## Notes

- Export data is JSON format
- Import expects same JSON structure
- Version must be "1.0"
- Name conflicts automatically resolved with "-imported" suffix
- Artifact S3 keys are references, not actual data
- Imported projects get new imported_at timestamp
- Original project IDs preserved in import
