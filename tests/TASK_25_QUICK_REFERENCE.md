# Task 25: Quick Reference Guide

## Overview

Task 25 validates complete end-to-end user workflows for the renewable project lifecycle management system.

## Quick Start

### Run Automated Tests
```bash
./tests/deploy-and-test-complete-workflows.sh
```

### Run Manual Tests
Follow the guide: `tests/TASK_25_E2E_WORKFLOW_TESTING_GUIDE.md`

## Test Workflows

### 1. Duplicate → Delete → Rename
```
1. Create project at coordinates
2. Try to create duplicate
3. System detects duplicate
4. User creates new project
5. User deletes old project
6. User renames new project
```

### 2. Search → Find → Merge
```
1. Create multiple projects
2. Search by location
3. Find duplicates
4. Merge duplicates
```

### 3. Natural Language Variations
```
Test different command phrasings:
- "delete project X" vs "remove project X"
- "rename X to Y" vs "change name of X to Y"
- "list projects" vs "show projects"
```

### 4. Confirmation Prompts
```
Verify confirmations for:
- Single project deletion
- Bulk deletion
- Merge operations
```

### 5. Error Scenarios
```
Test error handling:
- Project not found
- Name already exists
- Project in progress
- Invalid coordinates
- Invalid merge name
```

## Test Commands

### Create Project
```
Analyze terrain at coordinates 35.067482, -101.395466 in Amarillo
```

### List Projects
```
list projects
show projects
what are my projects
```

### Delete Project
```
delete project <name>
remove project <name>
get rid of <name>
```

### Rename Project
```
rename project <old> to <new>
change name of <old> to <new>
```

### Search Projects
```
list projects in Amarillo
list incomplete projects
list projects created today
```

### Find Duplicates
```
show duplicate projects
find duplicate projects
```

### Merge Projects
```
merge projects <name1> and <name2>
```

### Archive Project
```
archive project <name>
unarchive project <name>
list archived projects
```

## Test Coordinates

### Amarillo, TX
```
Latitude: 35.067482
Longitude: -101.395466
```

### Lubbock, TX
```
Latitude: 33.577863
Longitude: -101.855166
```

## Expected Results

### Duplicate Detection
```
Found existing project 'amarillo-tx-wind-farm' at these coordinates.
Would you like to:
(1) Continue with existing project
(2) Create new project
(3) View existing project details
```

### Deletion Confirmation
```
Are you sure you want to delete 'project-name'?
This will remove all analysis data.
Type 'yes' to confirm.
```

### Rename Success
```
Project renamed from 'old-name' to 'new-name'
```

### Merge Success
```
Projects merged into 'project-1'. Deleted 'project-2'.
```

## Error Messages

### Project Not Found
```
Project 'name' not found.
Use 'list projects' to see available projects.
```

### Name Already Exists
```
Project name 'name' already exists.
Please choose a different name.
```

### Project In Progress
```
Cannot delete 'name' - project is currently being processed.
Please wait for completion.
```

### Invalid Coordinates
```
Invalid coordinates.
Latitude must be between -90 and 90, longitude between -180 and 180.
```

## Verification Checklist

### Workflow 1
- [ ] Duplicate detection triggers
- [ ] User can create new project
- [ ] Deletion requires confirmation
- [ ] Deletion removes project
- [ ] Rename updates name
- [ ] Data preserved

### Workflow 2
- [ ] Search filters correctly
- [ ] Duplicate finder works
- [ ] Merge combines data
- [ ] Merge deletes duplicate
- [ ] Name choice works

### Workflow 3
- [ ] Delete variations work
- [ ] Rename variations work
- [ ] List variations work
- [ ] Archive variations work

### Workflow 4
- [ ] Single deletion confirmation
- [ ] Bulk deletion confirmation
- [ ] Merge name choice
- [ ] Operations blocked without confirmation

### Workflow 5
- [ ] Project not found error
- [ ] Name exists error
- [ ] In progress error
- [ ] Invalid coordinates error
- [ ] Invalid merge name error

## Files

### Test Files
- `tests/e2e-test-complete-lifecycle-workflows.ts` - Automated tests
- `tests/TASK_25_E2E_WORKFLOW_TESTING_GUIDE.md` - Manual testing guide
- `tests/deploy-and-test-complete-workflows.sh` - Deployment script

### Implementation Files
- `amplify/functions/shared/projectLifecycleManager.ts` - Main lifecycle manager
- `amplify/functions/shared/proximityDetector.ts` - Duplicate detection
- `amplify/functions/shared/projectStore.ts` - Project storage
- `amplify/functions/shared/projectResolver.ts` - Project resolution
- `amplify/functions/shared/projectNameGenerator.ts` - Name generation

## Success Criteria

All workflows must:
- ✅ Complete successfully end-to-end
- ✅ Handle user input correctly
- ✅ Provide clear feedback
- ✅ Require confirmation for destructive operations
- ✅ Handle errors gracefully
- ✅ Preserve data integrity
- ✅ Update session context correctly
- ✅ Clear caches appropriately

## Troubleshooting

### Tests Fail
1. Check sandbox is running
2. Verify environment variables
3. Check CloudWatch logs
4. Verify S3 bucket access

### Duplicate Detection Not Working
1. Check ProximityDetector implementation
2. Verify coordinate parsing
3. Check distance calculation
4. Verify 1km threshold

### Deletion Not Working
1. Check confirmation logic
2. Verify S3 permissions
3. Check project status
4. Verify cache clearing

### Rename Not Working
1. Check name validation
2. Verify S3 copy/delete
3. Check session context update
4. Verify cache clearing

## Next Steps

After Task 25 completion:
1. All lifecycle workflows validated
2. System ready for production use
3. User documentation complete
4. Error handling verified

## Support

For issues or questions:
1. Check CloudWatch logs
2. Review test output
3. Verify deployment status
4. Check S3 bucket contents
