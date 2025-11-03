# Task 20: Deploy and Test Rename Operations - Deployment Guide

## Overview

This guide covers the deployment and testing of project rename functionality (Requirements 3.1-3.6).

## Quick Start

```bash
# Run all tests
./tests/deploy-and-test-rename.sh

# Or run individually
npm test -- tests/unit/test-rename-project.test.ts --run
npm test -- tests/integration/test-rename-project-integration.test.ts --run
npx ts-node tests/verify-rename-project.ts
npx ts-node tests/e2e-test-rename-flow.ts
```

## Requirements Tested

- **3.1**: Update project name in project index
- **3.2**: Preserve all project data and history
- **3.3**: Update S3 path from old to new
- **3.4**: Check if new name already exists
- **3.5**: Respond with success message
- **3.6**: Update active project context with new name

## Test Files

1. **Unit Tests**: `tests/unit/test-rename-project.test.ts`
2. **Integration Tests**: `tests/integration/test-rename-project-integration.test.ts`
3. **Verification Script**: `tests/verify-rename-project.ts`
4. **E2E Test**: `tests/e2e-test-rename-flow.ts`
5. **Manual Test Guide**: `tests/e2e-rename-manual-test.md`

## Deployment Steps

### 1. Verify Implementation

Check that `ProjectLifecycleManager.renameProject()` is implemented:
```bash
grep -A 50 "async renameProject" amplify/functions/shared/projectLifecycleManager.ts
```

### 2. Run Automated Tests

```bash
./tests/deploy-and-test-rename.sh
```

### 3. Deploy to Sandbox

If not already running:
```bash
npx ampx sandbox
```

### 4. Manual Testing

Follow the guide in `tests/e2e-rename-manual-test.md`

## Success Criteria

All tests pass with:
- ✓ Old project deleted
- ✓ New project exists with all data
- ✓ Session context updated
- ✓ Project history updated
- ✓ Duplicate names prevented
- ✓ Error handling works

## Next Steps

After completion:
1. Mark Task 20 as complete
2. Proceed to Task 21 (Search functionality)
