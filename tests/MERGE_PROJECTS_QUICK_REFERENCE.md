# Project Merge Operations - Quick Reference

**Task 22 Complete** ✅  
**Requirements:** 4.2, 4.3, 4.4

## Quick Commands

### Run All Tests
```bash
./tests/deploy-and-test-merge.sh
```

### Run Unit Tests Only
```bash
npm test -- tests/unit/test-merge-projects.test.ts
```

### Run E2E Tests Only
```bash
export RENEWABLE_S3_BUCKET=your-bucket-name
npx ts-node tests/e2e-test-merge-flow.ts
```

### View Manual Testing Guide
```bash
cat tests/e2e-merge-manual-test.md
```

## Usage Examples

### Basic Merge (Keep Target Name)
```
User: Merge projects texas-wind-farm-1 and texas-wind-farm-2
System: Which name would you like to keep?
User: Keep texas-wind-farm-2
System: ✓ Projects merged into 'texas-wind-farm-2'. Deleted 'texas-wind-farm-1'.
```

### Merge with Explicit Name Selection
```
User: Merge projects project-a and project-b, keep project-a
System: ✓ Projects merged into 'project-a'. Deleted 'project-b'.
```

### Merge Duplicates
```
User: Show duplicate projects
System: Found 2 groups of duplicate projects...
User: Merge projects texas-wind-farm-1 and texas-wind-farm-2
System: ✓ Projects merged successfully
```

## API Reference

### mergeProjects Method

```typescript
async mergeProjects(
  sourceProjectName: string,
  targetProjectName: string,
  keepName?: string
): Promise<MergeResult>
```

**Parameters:**
- `sourceProjectName` - Project to merge from (will be deleted)
- `targetProjectName` - Project to merge into (will be kept by default)
- `keepName` - Optional: which name to keep (must be one of the two project names)

**Returns:**
```typescript
{
  success: boolean;
  mergedProject: string;      // Name of the merged project
  deletedProject: string;     // Name of the deleted project
  message: string;
  error?: string;
}
```

**Example:**
```typescript
const result = await lifecycleManager.mergeProjects(
  'project-a',
  'project-b',
  'project-b'
);

if (result.success) {
  console.log(result.message);
  // "Projects merged into 'project-b'. Deleted 'project-a'."
}
```

## Data Combination Logic

When merging projects, the system:

1. **Keeps non-null values** from either project
2. **Merges metadata** from both projects
3. **Preserves all artifacts** (terrain, layout, simulation, report)
4. **Updates timestamp** to current time
5. **Deletes source project** after successful merge

### Example Data Combination

**Project A:**
- Terrain: ✓
- Layout: ✓
- Simulation: ✗
- Report: ✗

**Project B:**
- Terrain: ✗
- Layout: ✗
- Simulation: ✓
- Report: ✓

**Merged Project:**
- Terrain: ✓ (from A)
- Layout: ✓ (from A)
- Simulation: ✓ (from B)
- Report: ✓ (from B)

## Error Handling

### PROJECT_NOT_FOUND
```
Error: Project 'project-name' not found.
Solution: Verify project name with 'list projects'
```

### MERGE_CONFLICT
```
Error: Keep name must be either 'project-a' or 'project-b'.
Solution: Use one of the two project names being merged
```

### S3_ERROR
```
Error: Failed to merge projects due to storage error.
Solution: Check S3 permissions and try again
```

## Test Coverage

### Unit Tests (10 tests) ✅
- Merge two projects successfully
- Keep most complete data
- Validate keepName
- Error handling (not found, invalid name)
- Cache invalidation
- Timestamp updates

### E2E Tests (6 tests) ✅
- Merge complementary projects
- Name selection
- Different completion levels
- Error scenarios
- Metadata merging

### Manual Tests (7 scenarios) ✅
- Basic merge workflow
- Name selection
- Duplicate merging
- Error handling
- Cache verification

## Requirements Coverage

### Requirement 4.2: Project Merging ✅
- Merge two projects into one
- Delete source project after merge
- Preserve all data from both projects

### Requirement 4.3: Data Combination Logic ✅
- Keep most complete data from both projects
- Merge metadata from both projects
- Handle projects with different completion levels
- Preserve all artifacts

### Requirement 4.4: Name Selection ✅
- User can choose which project name to keep
- System validates keepName is one of the two project names
- Correct project is deleted based on name selection

## Files Reference

### Implementation
- `amplify/functions/shared/projectLifecycleManager.ts` - Core implementation

### Tests
- `tests/unit/test-merge-projects.test.ts` - Unit tests
- `tests/integration/test-merge-projects-integration.test.ts` - Integration tests
- `tests/e2e-test-merge-flow.ts` - E2E automated tests
- `tests/e2e-merge-manual-test.md` - Manual testing guide

### Documentation
- `tests/TASK_22_TESTING_GUIDE.md` - Complete testing guide
- `tests/TASK_22_COMPLETE_SUMMARY.md` - Implementation summary
- `tests/MERGE_PROJECTS_QUICK_REFERENCE.md` - This file

### Scripts
- `tests/deploy-and-test-merge.sh` - Deployment and testing script

## Troubleshooting

### Tests fail with "RENEWABLE_S3_BUCKET not set"
```bash
export RENEWABLE_S3_BUCKET=$(node -e "console.log(require('./amplify_outputs.json').storage.bucket_name)")
```

### Merge fails in deployed environment
1. Check CloudWatch logs for orchestrator Lambda
2. Verify ProjectLifecycleManager is deployed
3. Check IAM permissions for S3 operations

### Test projects not cleaned up
```bash
# List test projects
aws s3 ls s3://$RENEWABLE_S3_BUCKET/renewable/projects/ | grep test-merge

# Delete manually
aws s3 rm s3://$RENEWABLE_S3_BUCKET/renewable/projects/test-merge-project-* --recursive
```

## Next Steps

After completing task 22:

1. ✅ Mark task 22 as complete
2. ➡️ Proceed to task 23: Deploy and test archive functionality
3. Continue with remaining lifecycle management tasks

## Summary

Task 22 provides comprehensive merge functionality with:
- ✅ Full test coverage (unit, integration, E2E, manual)
- ✅ Complete documentation
- ✅ Automated deployment script
- ✅ All requirements (4.2, 4.3, 4.4) satisfied

**Status:** COMPLETE AND READY FOR USE
