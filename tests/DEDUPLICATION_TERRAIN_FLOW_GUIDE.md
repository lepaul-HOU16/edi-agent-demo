# Deduplication in Terrain Analysis Flow - Quick Reference

## Overview

Task 13 integrates deduplication detection into the terrain analysis flow to prevent duplicate projects at the same coordinates.

## Implementation Location

- **Orchestrator**: `amplify/functions/renewableOrchestrator/handler.ts`
  - Duplicate detection: Lines 547-595
  - Choice handling: Lines 124-200
- **Lifecycle Manager**: `amplify/functions/shared/projectLifecycleManager.ts`
  - `checkForDuplicates()`: Lines 280-320
  - `handleDuplicateChoice()`: Lines 360-430

## User Flow

### 1. User Requests Terrain Analysis

```
User: "Analyze terrain at coordinates 35.067482, -101.395466"
```

### 2. System Checks for Duplicates

The orchestrator automatically checks for existing projects within 1km radius:

```typescript
const duplicateCheck = await lifecycleManager.checkForDuplicates(
  { latitude: 35.067482, longitude: -101.395466 },
  1.0 // 1km radius
);
```

### 3. If Duplicates Found

System presents options to user:

```
Found existing project(s) at these coordinates:

1. texas-wind-farm (0.05km away)

Would you like to:
1. Continue with existing project
2. Create new project
3. View existing project details

Please respond with your choice (1, 2, or 3).
```

### 4. User Makes Choice

#### Choice 1: Continue with Existing

```
User: "1"

System: "Continuing with existing project: texas-wind-farm. 
You can now continue with terrain analysis, layout optimization, or other operations."
```

- Sets project as active in session
- Adds to project history
- User can proceed with operations

#### Choice 2: Create New Project

```
User: "2"

System: "Creating new project at these coordinates. 
Please repeat your terrain analysis query to create a new project."
```

- User must repeat original query
- System will create new project with numbered suffix (e.g., "texas-wind-farm-2")

#### Choice 3: View Details

```
User: "3"

System: "Project Details:

1. texas-wind-farm (0.05km away)
   Created: 1/15/2025
   Completion: 75% (3/4 steps)
   Status: Terrain: ✓, Layout: ✓, Simulation: ✓, Report: ✗

Would you like to:
1. Continue with existing project
2. Create new project"
```

- Shows project completion status
- Re-prompts for choice 1 or 2

### 5. If No Duplicates Found

System proceeds with creating new project:

```
System: "No existing projects found at this location. 
Creating new project: texas-wind-farm"
```

## Requirements Coverage

### Requirement 1.1: Duplicate Detection
✅ System checks for projects within 1km radius before terrain analysis

### Requirement 1.2: User Prompt
✅ System presents clear options when duplicates found

### Requirement 1.3: Choice Handling
✅ System handles all three user choices correctly

### Requirement 1.4: Session Context
✅ System updates active project and history when user continues

## Testing

### Run Integration Tests

```bash
npm test -- tests/integration/test-deduplication-terrain-flow.test.ts
```

### Run Verification Script

```bash
npx ts-node tests/verify-deduplication-terrain-flow.ts
```

### Manual Testing

1. Create a project at specific coordinates:
   ```
   "Analyze terrain at 35.067482, -101.395466"
   ```

2. Try to analyze same coordinates again:
   ```
   "Analyze terrain at 35.067482, -101.395466"
   ```

3. System should detect duplicate and prompt for choice

4. Test each choice (1, 2, 3)

## Configuration

### Proximity Threshold

Default: 1km radius

To change, modify the radius parameter in orchestrator:

```typescript
const duplicateCheck = await lifecycleManager.checkForDuplicates(
  coordinates,
  2.0 // Change to 2km radius
);
```

### Session Context

Session context is managed automatically:
- Active project set when user chooses to continue
- Project added to history
- Context persists across queries

## Error Handling

### No Coordinates Provided

If terrain analysis query doesn't include coordinates, deduplication is skipped.

### Multiple Duplicates

If multiple projects found within radius:
- System shows closest project first
- User can view all with choice 3
- Choice 1 continues with closest project

### Session Not Available

If session ID not provided:
- Deduplication still works
- Session context updates skipped
- User can still make choices

## Integration Points

### Orchestrator Flow

```
1. Parse intent (terrain_analysis)
2. Extract coordinates
3. Check for duplicates ← TASK 13
4. If duplicates: prompt user
5. If no duplicates: create project
6. Proceed with terrain analysis
```

### Lifecycle Manager

```
checkForDuplicates()
  ↓
detectDuplicates() (ProximityDetector)
  ↓
promptForDuplicateResolution()
  ↓
Return user prompt
```

### Choice Handling

```
User responds with 1, 2, or 3
  ↓
handleDuplicateChoice()
  ↓
Update session context (if choice 1)
  ↓
Return action and message
```

## Monitoring

### CloudWatch Logs

Look for these log messages:

```
🔍 Checking for duplicate projects at coordinates...
⚠️  Found N duplicate project(s)
✅ No duplicates found, proceeding with new project
🔄 Handling duplicate resolution choice
```

### Metrics

Track:
- Duplicate detection rate
- User choice distribution (1, 2, 3)
- Session context update success rate

## Troubleshooting

### Duplicates Not Detected

1. Check coordinates are valid
2. Verify projects have coordinates stored
3. Check proximity threshold (1km default)
4. Review ProximityDetector logs

### User Prompt Not Showing

1. Verify duplicateCheck.hasDuplicates is true
2. Check userPrompt is generated
3. Review orchestrator response

### Session Not Updated

1. Verify sessionId is provided
2. Check SessionContextManager logs
3. Verify DynamoDB table access

### Choice Not Handled

1. Verify choice is "1", "2", or "3"
2. Check handleDuplicateChoice logs
3. Review choice result action

## Best Practices

1. **Always provide coordinates** for terrain analysis to enable deduplication
2. **Use descriptive project names** to help users identify duplicates
3. **Review project details** (choice 3) before deciding
4. **Continue with existing** (choice 1) to avoid clutter
5. **Create new only when needed** (choice 2) for different analysis scenarios

## Future Enhancements

Potential improvements:
- Configurable proximity threshold per user
- Bulk duplicate detection and cleanup
- Automatic project merging suggestions
- Visual map showing duplicate locations
- Project similarity scoring beyond just coordinates
