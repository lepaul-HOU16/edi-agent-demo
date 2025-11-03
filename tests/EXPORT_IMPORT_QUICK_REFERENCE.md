# Export/Import Quick Reference

## Quick Commands

### Run All Tests
```bash
./tests/deploy-and-test-export-import.sh
```

### Run Specific Tests
```bash
# Unit tests
npm test -- tests/unit/test-project-lifecycle-manager.test.ts --run

# Integration tests
npm test -- tests/integration/test-export-import-integration.test.ts --run

# E2E tests
npm test -- tests/e2e-test-export-import-flow.ts --run

# Verification
npx ts-node tests/verify-export-import.ts
```

## User Commands

### Export Project
```
export project [project-name]
```

### Import Project
```
import project from [export JSON]
```

## Export Data Format

```json
{
  "version": "1.0",
  "exportedAt": "2025-01-21T...",
  "project": {
    "project_name": "...",
    "coordinates": { "latitude": 35.0, "longitude": -101.0 },
    "terrain_results": { "s3_key": "..." },
    "layout_results": { "s3_key": "..." },
    "simulation_results": { "s3_key": "..." },
    "report_results": { "s3_key": "..." },
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

## Requirements Coverage

| Requirement | Description | Status |
|-------------|-------------|--------|
| 9.1 | Export project with all data | ✅ Implemented |
| 9.2 | Import project from export data | ✅ Implemented |
| 9.3 | Include metadata, coordinates, results, artifacts | ✅ Implemented |
| 9.4 | Validate format and check conflicts | ✅ Implemented |
| 9.5 | Handle name conflicts with -imported suffix | ✅ Implemented |

## Test Files

| File | Purpose |
|------|---------|
| `tests/unit/test-project-lifecycle-manager.test.ts` | Unit tests |
| `tests/integration/test-export-import-integration.test.ts` | Integration tests |
| `tests/e2e-test-export-import-flow.ts` | E2E tests |
| `tests/verify-export-import.ts` | Verification script |
| `tests/e2e-export-import-manual-test.md` | Manual test guide |
| `tests/deploy-and-test-export-import.sh` | Deployment script |

## Key Features

### Export
- ✅ Generates JSON with version 1.0
- ✅ Includes exportedAt timestamp
- ✅ Includes complete project data
- ✅ Includes all artifact S3 keys
- ✅ Handles partial data gracefully
- ✅ Error for non-existent project

### Import
- ✅ Validates version (must be 1.0)
- ✅ Creates new project
- ✅ Adds imported_at timestamp
- ✅ Handles name conflicts (-imported suffix)
- ✅ Preserves all data
- ✅ Preserves artifact references

## Common Scenarios

### Export Complete Project
```
User: export project west-texas-wind-farm

Response: [JSON export data with all fields]
```

### Import Project
```
User: import project from [JSON]

Response: Project imported as 'west-texas-wind-farm'
```

### Name Conflict
```
User: import project from [JSON with existing name]

Response: Project imported as 'west-texas-wind-farm-imported'
```

### Version Error
```
User: import project from [JSON with version "2.0"]

Response: Unsupported export version: 2.0. This system supports version 1.0.
```

## Verification Checklist

- [ ] Export generates complete JSON
- [ ] Export includes version 1.0
- [ ] Export includes artifact S3 keys
- [ ] Import creates project
- [ ] Import adds imported_at
- [ ] Name conflicts handled
- [ ] Version validated
- [ ] Data preserved
- [ ] Imported project functional

## Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| Project not found | Project doesn't exist | Check name with `list projects` |
| Unsupported version | Wrong version in export | Use version "1.0" |
| Name already exists | Conflict during import | System auto-appends "-imported" |
| Invalid export data | Malformed JSON | Check export data structure |

## CloudWatch Logs

### Search Patterns
```
[ProjectLifecycleManager] Exporting project
[ProjectLifecycleManager] Importing project
[ProjectLifecycleManager] Successfully exported
[ProjectLifecycleManager] Successfully imported
Error exporting project
Error importing project
```

### Log Commands
```bash
# Recent export/import operations
aws logs filter-log-events \
  --log-group-name /aws/lambda/renewableOrchestrator \
  --filter-pattern "export\|import" \
  --start-time $(date -u -d '5 minutes ago' +%s)000
```

## Success Criteria

### Automated Tests
- ✅ All unit tests pass
- ✅ All integration tests pass
- ✅ All E2E tests pass
- ✅ Verification script passes

### Manual Tests
- ✅ Export command works
- ✅ Import command works
- ✅ Name conflicts handled
- ✅ Version validation works
- ✅ Data integrity verified

### Integration
- ✅ Orchestrator recognizes commands
- ✅ No CloudWatch errors
- ✅ Imported projects functional

## Next Steps

1. Run deployment script: `./tests/deploy-and-test-export-import.sh`
2. Follow manual test guide: `tests/e2e-export-import-manual-test.md`
3. Verify in chat interface
4. Check CloudWatch logs
5. Mark task 24 complete

## Resources

- **Testing Guide:** `tests/EXPORT_IMPORT_TESTING_GUIDE.md`
- **Manual Tests:** `tests/e2e-export-import-manual-test.md`
- **Requirements:** `.kiro/specs/renewable-project-lifecycle-management/requirements.md`
- **Design:** `.kiro/specs/renewable-project-lifecycle-management/design.md`
- **Implementation:** `amplify/functions/shared/projectLifecycleManager.ts`
