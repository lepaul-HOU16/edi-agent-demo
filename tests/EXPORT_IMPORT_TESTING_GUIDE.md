# Export/Import Testing Guide

## Overview
Comprehensive guide for testing export/import functionality (Task 24).

## Quick Start

### Run All Tests
```bash
./tests/deploy-and-test-export-import.sh
```

### Run Individual Test Suites
```bash
# Unit tests
npm test -- tests/unit/test-project-lifecycle-manager.test.ts --run

# Integration tests
npm test -- tests/integration/test-export-import-integration.test.ts --run

# E2E tests
npm test -- tests/e2e-test-export-import-flow.ts --run

# Verification script
npx ts-node tests/verify-export-import.ts
```

## Test Coverage

### Requirement 9.1: Export Project
**Tests:**
- Export project with all data
- Export includes version 1.0
- Export includes exportedAt timestamp
- Export includes complete project data
- Export includes artifact S3 keys
- Export handles partial data gracefully
- Export error for non-existent project

**Files:**
- `tests/unit/test-project-lifecycle-manager.test.ts`
- `tests/integration/test-export-import-integration.test.ts`
- `tests/e2e-test-export-import-flow.ts`
- `tests/verify-export-import.ts`

### Requirement 9.2: Import Project
**Tests:**
- Import project successfully
- Import creates new project
- Import adds imported_at timestamp
- Import preserves all data
- Import preserves artifact references

**Files:**
- `tests/integration/test-export-import-integration.test.ts`
- `tests/e2e-test-export-import-flow.ts`
- `tests/verify-export-import.ts`

### Requirement 9.3: Include All Data
**Tests:**
- Export includes project metadata
- Export includes coordinates
- Export includes all analysis results
- Export includes artifacts
- Data preserved through export/import cycle

**Files:**
- `tests/e2e-test-export-import-flow.ts`
- `tests/verify-export-import.ts`

### Requirement 9.4: Validate Format
**Tests:**
- Validate export format version
- Reject unsupported versions
- Check for data conflicts
- Validate data structure

**Files:**
- `tests/integration/test-export-import-integration.test.ts`
- `tests/e2e-test-export-import-flow.ts`
- `tests/verify-export-import.ts`

### Requirement 9.5: Handle Name Conflicts
**Tests:**
- Detect name conflicts
- Append -imported suffix
- Create unique names
- Preserve both projects

**Files:**
- `tests/integration/test-export-import-integration.test.ts`
- `tests/e2e-test-export-import-flow.ts`
- `tests/verify-export-import.ts`

## Manual Testing

### Prerequisites
1. Deployed renewable orchestrator
2. At least one project with data
3. Access to chat interface

### Test Scenarios

#### 1. Export Complete Project
```
User: export project [project-name]

Expected:
- JSON export data returned
- Version: "1.0"
- All project data included
- All artifact S3 keys included
```

#### 2. Import Project
```
User: import project from [export JSON]

Expected:
- Project created successfully
- Message: "Project imported as '[name]'"
- Project appears in list
- All data preserved
```

#### 3. Name Conflict
```
User: import project from [export JSON with existing name]

Expected:
- Name conflict detected
- Project created with "-imported" suffix
- Both projects exist
- No data overwritten
```

#### 4. Version Validation
```
User: import project from [export JSON with version "2.0"]

Expected:
- Import rejected
- Error: "Unsupported export version: 2.0"
- No project created
```

#### 5. Export Non-Existent
```
User: export project nonexistent-project

Expected:
- Error message
- "Project 'nonexistent-project' not found"
- Suggestion to list projects
```

### Manual Test Checklist
- [ ] Export project with all data
- [ ] Export includes version 1.0
- [ ] Export includes artifact S3 keys
- [ ] Import project successfully
- [ ] Import adds imported_at timestamp
- [ ] Name conflict handled with -imported suffix
- [ ] Unsupported version rejected
- [ ] Export error for non-existent project
- [ ] All data preserved through cycle
- [ ] Imported project functional

## Verification Steps

### 1. Check Export Data Structure
```typescript
{
  "version": "1.0",
  "exportedAt": "2025-01-21T...",
  "project": {
    "project_name": "...",
    "coordinates": { ... },
    "terrain_results": { ... },
    "layout_results": { ... },
    "simulation_results": { ... },
    "report_results": { ... },
    "metadata": { ... }
  },
  "artifacts": {
    "terrain": "renewable/projects/.../terrain.json",
    "layout": "renewable/projects/.../layout.json",
    "simulation": "renewable/projects/.../simulation.json",
    "report": "renewable/projects/.../report.pdf"
  }
}
```

### 2. Verify Imported Project
```bash
# List projects
list projects

# Show imported project
show project [imported-project-name]

# Check metadata
# Should include imported_at timestamp
```

### 3. Check CloudWatch Logs
```bash
# Search for export/import operations
aws logs filter-log-events \
  --log-group-name /aws/lambda/renewableOrchestrator \
  --filter-pattern "export\|import" \
  --start-time $(date -u -d '5 minutes ago' +%s)000
```

## Common Issues

### Issue: Export returns null
**Cause:** Project doesn't exist
**Solution:** Check project name with `list projects`

### Issue: Import fails with version error
**Cause:** Unsupported export version
**Solution:** Verify export data has version: "1.0"

### Issue: Name conflict not handled
**Cause:** ProjectNameGenerator not working
**Solution:** Check ensureUnique method implementation

### Issue: Artifact S3 keys missing
**Cause:** Original project incomplete
**Solution:** Verify original project had completed analysis

### Issue: Imported project not functional
**Cause:** Data corruption or missing fields
**Solution:** Check CloudWatch logs for import errors

## Success Criteria

### All Tests Pass
- ✅ Unit tests: 100% pass rate
- ✅ Integration tests: 100% pass rate
- ✅ E2E tests: 100% pass rate
- ✅ Verification script: All checks pass

### Manual Tests Pass
- ✅ Export generates complete JSON
- ✅ Import creates functional project
- ✅ Name conflicts handled automatically
- ✅ Version validation works
- ✅ Error messages clear and helpful

### Data Integrity
- ✅ All project data preserved
- ✅ All metadata preserved
- ✅ All coordinates preserved
- ✅ All artifact S3 keys preserved
- ✅ Completion status preserved

### Integration
- ✅ Export command recognized
- ✅ Import command recognized
- ✅ Orchestrator routes correctly
- ✅ No CloudWatch errors
- ✅ Imported projects functional

## Deployment Checklist

### Pre-Deployment
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All E2E tests pass
- [ ] Verification script passes
- [ ] No TypeScript errors
- [ ] Code reviewed

### Deployment
- [ ] Sandbox running
- [ ] Changes deployed
- [ ] CloudWatch logs clean
- [ ] No deployment errors

### Post-Deployment
- [ ] Export command works
- [ ] Import command works
- [ ] Name conflicts handled
- [ ] Version validation works
- [ ] Data integrity verified
- [ ] Manual tests pass

## Test Files Reference

### Unit Tests
- `tests/unit/test-project-lifecycle-manager.test.ts`
  - Tests ProjectLifecycleManager methods
  - Tests export/import logic
  - Tests error handling

### Integration Tests
- `tests/integration/test-export-import-integration.test.ts`
  - Tests complete export/import workflow
  - Tests data preservation
  - Tests name conflict handling
  - Tests version validation

### E2E Tests
- `tests/e2e-test-export-import-flow.ts`
  - Tests end-to-end export/import flow
  - Tests all requirements
  - Tests error scenarios
  - Tests data integrity

### Verification Scripts
- `tests/verify-export-import.ts`
  - Automated verification
  - Tests all scenarios
  - Generates test report

### Manual Test Guides
- `tests/e2e-export-import-manual-test.md`
  - Step-by-step manual testing
  - Test scenarios
  - Expected results
  - Troubleshooting

### Deployment Scripts
- `tests/deploy-and-test-export-import.sh`
  - Automated deployment and testing
  - Runs all test suites
  - Generates summary report

## Monitoring

### CloudWatch Metrics
Monitor these metrics after deployment:
- Export operation count
- Import operation count
- Export errors
- Import errors
- Name conflict rate
- Version validation failures

### CloudWatch Logs
Search for these patterns:
- `[ProjectLifecycleManager] Exporting project`
- `[ProjectLifecycleManager] Importing project`
- `[ProjectLifecycleManager] Successfully exported`
- `[ProjectLifecycleManager] Successfully imported`
- `Error exporting project`
- `Error importing project`

### Alerts
Set up alerts for:
- High export error rate (> 5%)
- High import error rate (> 5%)
- Version validation failures
- Name conflict failures

## Next Steps

### After Task 24 Complete
1. ✅ Export/import functionality deployed and tested
2. Move to Task 25: End-to-end user workflow testing
3. Test complete workflows:
   - Create duplicate → detect → delete old → rename new
   - Search → find duplicates → merge workflow
   - Natural language command variations

### Future Enhancements
- Export to file download
- Import from file upload
- Batch export/import
- Export templates
- Import validation UI
- Export history tracking

## Resources

### Documentation
- Requirements: `.kiro/specs/renewable-project-lifecycle-management/requirements.md`
- Design: `.kiro/specs/renewable-project-lifecycle-management/design.md`
- Tasks: `.kiro/specs/renewable-project-lifecycle-management/tasks.md`

### Code References
- ProjectLifecycleManager: `amplify/functions/shared/projectLifecycleManager.ts`
- ProjectStore: `amplify/functions/shared/projectStore.ts`
- Export/Import types: `amplify/functions/shared/projectLifecycleManager.ts`

### Test References
- Unit tests: `tests/unit/`
- Integration tests: `tests/integration/`
- E2E tests: `tests/e2e-test-export-import-flow.ts`
- Verification: `tests/verify-export-import.ts`
- Manual guide: `tests/e2e-export-import-manual-test.md`
