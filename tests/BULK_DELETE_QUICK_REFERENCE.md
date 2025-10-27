# Bulk Delete Quick Reference Guide

## Overview

The bulk delete functionality allows you to delete multiple projects at once using pattern matching. It includes safety features like confirmation prompts and dry-run capability.

## Basic Usage

### 1. Dry Run (Preview What Will Be Deleted)

```typescript
const result = await lifecycleManager.deleteBulk('pattern', false);
```

**Example:**
```typescript
const result = await lifecycleManager.deleteBulk('texas', false);
// Shows: "Found 3 project(s) matching 'texas': texas-wind-farm-1, texas-wind-farm-2, texas-wind-farm-3. Type 'yes' to delete all."
```

### 2. Confirmed Deletion

```typescript
const result = await lifecycleManager.deleteBulk('pattern', true);
```

**Example:**
```typescript
const result = await lifecycleManager.deleteBulk('texas', true);
// Deletes all matching projects
```

## Pattern Matching

The bulk delete uses fuzzy matching to find projects:

### Exact Match
```typescript
await lifecycleManager.deleteBulk('texas-wind-farm-1', true);
// Matches: texas-wind-farm-1
```

### Partial Match
```typescript
await lifecycleManager.deleteBulk('texas', true);
// Matches: texas-wind-farm-1, texas-wind-farm-2, texas-wind-farm-3
```

### Word Match
```typescript
await lifecycleManager.deleteBulk('wind', true);
// Matches: texas-wind-farm-1, texas-wind-farm-2, california-wind-farm-1
```

### Fuzzy Match
```typescript
await lifecycleManager.deleteBulk('farm', true);
// Matches: texas-wind-farm-1, texas-wind-farm-2, california-solar-farm-1
```

## Return Value

```typescript
interface BulkDeleteResult {
  success: boolean;              // True if all deletions succeeded
  deletedCount: number;          // Number of successfully deleted projects
  deletedProjects: string[];     // Names of deleted projects
  failedProjects: Array<{        // Details of failed deletions
    name: string;
    error: string;
  }>;
  message: string;               // User-friendly message
}
```

## Common Scenarios

### Scenario 1: Delete All Test Projects

```typescript
// Preview
const preview = await lifecycleManager.deleteBulk('test', false);
console.log(preview.message);

// Confirm and delete
const result = await lifecycleManager.deleteBulk('test', true);
console.log(`Deleted ${result.deletedCount} projects`);
```

### Scenario 2: Clean Up Duplicates

```typescript
// Find duplicates at a location
const duplicates = await lifecycleManager.deleteBulk('texas-wind-farm', false);
console.log(duplicates.message);

// Delete all but one (manually exclude one from pattern)
const result = await lifecycleManager.deleteBulk('texas-wind-farm-', true);
```

### Scenario 3: Delete Projects by Location

```typescript
// Delete all Texas projects
const result = await lifecycleManager.deleteBulk('texas', true);

// Delete all California projects
const result = await lifecycleManager.deleteBulk('california', true);
```

### Scenario 4: Handle Partial Failures

```typescript
const result = await lifecycleManager.deleteBulk('old-projects', true);

if (result.success) {
  console.log(`Successfully deleted all ${result.deletedCount} projects`);
} else {
  console.log(`Deleted ${result.deletedCount} projects`);
  console.log(`Failed to delete ${result.failedProjects.length} projects:`);
  result.failedProjects.forEach(failure => {
    console.log(`  - ${failure.name}: ${failure.error}`);
  });
}
```

## Safety Features

### 1. Confirmation Required by Default

```typescript
// This will NOT delete, just show what would be deleted
const result = await lifecycleManager.deleteBulk('pattern', false);
```

### 2. Project List Display

The confirmation message shows all matching projects:
```
Found 3 project(s) matching 'texas': 
  - texas-wind-farm-1
  - texas-wind-farm-2
  - texas-wind-farm-3
Type 'yes' to delete all.
```

### 3. Dry Run Capability

Use `skipConfirmation: false` to preview without deleting:
```typescript
const preview = await lifecycleManager.deleteBulk('pattern', false);
// Shows what would be deleted, but doesn't delete
```

### 4. Graceful Failure Handling

If some deletions fail, the operation continues:
```typescript
const result = await lifecycleManager.deleteBulk('pattern', true);
// result.deletedProjects contains successful deletions
// result.failedProjects contains failures with error details
```

## Error Handling

### No Matches Found

```typescript
const result = await lifecycleManager.deleteBulk('nonexistent', false);
// result.message: "No projects match pattern 'nonexistent'."
// result.success: false
// result.deletedCount: 0
```

### Partial Failures

```typescript
const result = await lifecycleManager.deleteBulk('pattern', true);
if (!result.success && result.deletedCount > 0) {
  console.log('Partial success:');
  console.log(`  Deleted: ${result.deletedProjects.join(', ')}`);
  console.log(`  Failed: ${result.failedProjects.map(f => f.name).join(', ')}`);
}
```

### Complete Failure

```typescript
const result = await lifecycleManager.deleteBulk('pattern', true);
if (!result.success && result.deletedCount === 0) {
  console.log('All deletions failed');
  result.failedProjects.forEach(failure => {
    console.log(`${failure.name}: ${failure.error}`);
  });
}
```

## Best Practices

### 1. Always Preview First

```typescript
// Step 1: Preview
const preview = await lifecycleManager.deleteBulk('pattern', false);
console.log(preview.message);

// Step 2: Review the list

// Step 3: Confirm and delete
const result = await lifecycleManager.deleteBulk('pattern', true);
```

### 2. Check Results

```typescript
const result = await lifecycleManager.deleteBulk('pattern', true);

if (result.success) {
  console.log('✅ All projects deleted successfully');
} else if (result.deletedCount > 0) {
  console.log('⚠️ Partial success - some projects failed');
} else {
  console.log('❌ All deletions failed');
}
```

### 3. Handle Failures

```typescript
const result = await lifecycleManager.deleteBulk('pattern', true);

if (result.failedProjects.length > 0) {
  console.log('Failed deletions:');
  result.failedProjects.forEach(failure => {
    console.log(`  ${failure.name}: ${failure.error}`);
    
    // Retry logic
    if (failure.error.includes('timeout')) {
      // Retry this project
    }
  });
}
```

### 4. Use Specific Patterns

```typescript
// ❌ Too broad
await lifecycleManager.deleteBulk('farm', true);

// ✅ More specific
await lifecycleManager.deleteBulk('texas-wind-farm', true);

// ✅ Even more specific
await lifecycleManager.deleteBulk('texas-wind-farm-test', true);
```

## Integration with Orchestrator

The bulk delete can be integrated into the renewable orchestrator for natural language commands:

```typescript
// User says: "delete all texas projects"
const pattern = extractPattern(userQuery); // "texas"
const result = await lifecycleManager.deleteBulk(pattern, false);

// Show confirmation to user
return {
  message: result.message,
  requiresConfirmation: true,
};

// After user confirms
const deleteResult = await lifecycleManager.deleteBulk(pattern, true);
return {
  message: deleteResult.message,
};
```

## Testing

### Unit Tests

```bash
npm test -- tests/unit/test-bulk-delete.test.ts
```

### Integration Tests

```bash
npm test -- tests/integration/test-bulk-delete-integration.test.ts
```

### Manual Verification

```bash
npx tsx tests/verify-bulk-delete.ts
```

## Troubleshooting

### Issue: No projects found

**Cause:** Pattern doesn't match any projects

**Solution:** Try a broader pattern or list all projects first

```typescript
const allProjects = await projectStore.list();
console.log('Available projects:', allProjects.map(p => p.project_name));
```

### Issue: Some deletions fail

**Cause:** S3 access issues, network problems, or projects in use

**Solution:** Check error details and retry

```typescript
const result = await lifecycleManager.deleteBulk('pattern', true);
result.failedProjects.forEach(failure => {
  console.log(`${failure.name}: ${failure.error}`);
});
```

### Issue: Deleted wrong projects

**Cause:** Pattern was too broad

**Solution:** Always preview first with `skipConfirmation: false`

```typescript
// Always do this first
const preview = await lifecycleManager.deleteBulk('pattern', false);
console.log(preview.message);
// Review the list before confirming
```

## Performance

- **Parallel Deletion:** Uses `Promise.allSettled` for concurrent deletion
- **Efficient Matching:** Fuzzy matching with scoring algorithm
- **Cache Management:** Clears caches after deletion for consistency
- **Scalability:** Handles large project lists efficiently

## Security

- **Confirmation Required:** Default behavior requires explicit confirmation
- **No Cascade Deletion:** Only deletes specified projects
- **Audit Trail:** Logs all deletion operations
- **Error Details:** Provides detailed error information without exposing sensitive data

---

**Quick Command Reference:**

```typescript
// Preview
await lifecycleManager.deleteBulk('pattern', false);

// Delete
await lifecycleManager.deleteBulk('pattern', true);

// Check result
if (result.success) { /* all deleted */ }
else if (result.deletedCount > 0) { /* partial success */ }
else { /* all failed */ }
```
