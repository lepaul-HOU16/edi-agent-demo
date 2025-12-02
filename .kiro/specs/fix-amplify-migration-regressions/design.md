# Fix Amplify Migration Regressions - Design Document

## Overview

This design document outlines the systematic approach to fix ALL regressions introduced during the Amplify Gen2 to CDK migration (commit ab01226). The migration was supposed to ONLY replace infrastructure (Amplify → CDK, Next.js → React Router) but instead broke multiple features. This design uses pre-migration code (commit 925b396 "working minecraft demo") as the source of truth and systematically restores all broken functionality.

## Key Principle

**Smart Merge Strategy: Keep Progress, Restore UX**

- **KEEP**: Post-migration agent improvements, new features, backend enhancements
- **RESTORE**: Pre-migration UX patterns, component behavior, user interactions
- **MERGE**: Combine the best of both - new functionality with working UX

This is NOT a revert. This is a surgical merge that preserves valuable work while fixing broken patterns.

## Architecture

### Smart Merge Strategy

```
KEEP (Post-Migration Progress):
✅ New agent features and capabilities
✅ Backend improvements and optimizations
✅ New API endpoints and functionality
✅ CDK infrastructure (replace Amplify)
✅ React Router (replace Next.js)
✅ Any bug fixes made post-migration
✅ Performance improvements

RESTORE (Pre-Migration UX):
🔄 Component state management patterns
🔄 Button loading states and visual feedback
🔄 Alert/notification patterns
🔄 User interaction flows
🔄 Error handling UX
🔄 Success message patterns

MERGE APPROACH:
1. Take current (post-migration) code as base
2. Identify broken UX patterns
3. Extract working UX pattern from pre-migration
4. Merge pre-migration UX into current code
5. Keep all new functionality intact
6. Result: New features + Working UX
```

### Regression Categories

1. **Component Behavior Regressions**: Components that changed behavior during migration
2. **API Integration Regressions**: API calls that don't produce same results
3. **State Management Regressions**: State handling that changed
4. **UI/UX Regressions**: Visual or interaction changes
5. **Infrastructure Regressions**: CDN/deployment issues

## Components and Regressions

### 1. EDIcraft Clear Button Regression

**Pre-Migration Behavior** (commit 925b396):
```typescript
// File: src/components/agent-landing-pages/EDIcraftAgentLanding.tsx
const [isClearing, setIsClearing] = useState(false);
const [clearResult, setClearResult] = useState<{type: 'success' | 'error', message: string} | null>(null);

const handleClearEnvironment = async () => {
  setIsClearing(true);
  setClearResult(null);
  
  try {
    if (onSendMessage) {
      await onSendMessage('Clear the Minecraft environment');
      setClearResult({
        type: 'success',
        message: 'Clear command sent! Check the chat for results.'
      });
    } else {
      // Fallback: call agent directly via Amplify
      const client = generateClient<Schema>();
      const result = await client.mutations.invokeEDIcraftAgent({...});
      // Handle result
    }
    
    setTimeout(() => setClearResult(null), 5000);
  } catch (error) {
    setClearResult({type: 'error', message: 'Failed to clear environment'});
  } finally {
    setIsClearing(false);
  }
};

// Button with loading state
<Button loading={isClearing} onClick={handleClearEnvironment}>
  Clear Minecraft Environment
</Button>

// Alert for results
{clearResult && <Alert type={clearResult.type}>{clearResult.message}</Alert>}
```

**Post-Migration Broken Behavior**:
- Uses `onSendMessage` which adds user message to chat (WRONG)
- No loading state on button
- No success/error alerts
- Different user experience

**Smart Merge Fix**:
1. **KEEP**: Current `onSendMessage` prop and any new agent features
2. **RESTORE**: Pre-migration state management (`isClearing`, `clearResult`)
3. **RESTORE**: Pre-migration button `loading` prop
4. **RESTORE**: Pre-migration Alert component for user feedback
5. **MERGE**: Combine current functionality with pre-migration UX patterns
6. **RESULT**: Button that works with new infrastructure BUT shows loading/success/error like before

```typescript
// MERGED SOLUTION:
const [isClearing, setIsClearing] = useState(false);  // RESTORED from pre-migration
const [clearResult, setClearResult] = useState<...>(null);  // RESTORED from pre-migration

const handleClearEnvironment = async () => {
  setIsClearing(true);  // RESTORED UX pattern
  setClearResult(null);
  
  try {
    if (onSendMessage) {  // KEEP current approach
      await onSendMessage('Clear the Minecraft environment');
      setClearResult({  // RESTORED UX pattern
        type: 'success',
        message: 'Clear command sent! Check the chat for results.'
      });
    }
    setTimeout(() => setClearResult(null), 5000);  // RESTORED UX pattern
  } catch (error) {
    setClearResult({type: 'error', message: '...'});  // RESTORED UX pattern
  } finally {
    setIsClearing(false);  // RESTORED UX pattern
  }
};

// RESTORED UI components
<Button loading={isClearing} onClick={handleClearEnvironment}>...</Button>
{clearResult && <Alert type={clearResult.type}>{clearResult.message}</Alert>}
```

### 2. CloudFront Deployment Regression

**Issue**: GitHub Actions deployment fails at "Wait for invalidation" step with error:
```
Unknown options: ICOGQ081R5VF51X8XG7QL2VZ2P
Error: Process completed with exit code 252.
```

**Root Cause**: The invalidation ID is being passed as an option instead of as a positional argument to `aws cloudfront wait invalidation-completed`.

**Pre-Migration**: Amplify handled deployments automatically
**Post-Migration**: Manual GitHub Actions workflow with incorrect AWS CLI syntax

**Required Fix**:
```yaml
# WRONG (current):
- name: Wait for invalidation
  run: |
    INVALIDATION_ID=$(aws cloudfront list-invalidations ...)
    aws cloudfront wait invalidation-completed $INVALIDATION_ID

# CORRECT:
- name: Wait for invalidation  
  run: |
    INVALIDATION_ID=$(aws cloudfront list-invalidations ... | jq -r '.InvalidationList.Items[0].Id')
    aws cloudfront wait invalidation-completed --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} --id $INVALIDATION_ID
```

### 3. Systematic File Comparison Process

**Files Changed During Migration** (from git diff):
```
src/components/agent-landing-pages/EDIcraftAgentLanding.tsx
src/pages/ChatPage.tsx
src/components/ChatBox.tsx
src/lib/api/chat.ts (new file - REST API wrapper)
src/utils/chatUtils.ts
.github/workflows/deploy-production.yml (new file)
[... and many more]
```

**Comparison Process**:
1. For each changed file, extract pre-migration version
2. Extract post-migration version
3. Identify differences line-by-line
4. Categorize each difference as:
   - Infrastructure change (keep, verify correctness)
   - Behavioral change (REGRESSION - must fix)
5. Document all regressions
6. Create fix tasks

## Data Models

### Regression Record

```typescript
interface Regression {
  id: string;
  file: string;
  component: string;
  category: 'component' | 'api' | 'state' | 'ui' | 'infrastructure';
  preMigrationBehavior: string;
  postMigrationBehavior: string;
  impact: 'critical' | 'high' | 'medium' | 'low';
  fixRequired: string;
  validationSteps: string[];
}
```

### Infrastructure Mapping

```typescript
interface InfrastructureMapping {
  preMigration: string;  // e.g., "generateClient().mutations.invokeEDIcraftAgent()"
  postMigration: string; // e.g., "fetch('/api/edicraft/invoke')"
  verified: boolean;     // Does it produce same result?
  notes: string;
}
```

## Regression Inventory

### Critical Regressions (Block Usage)

1. **EDIcraft Clear Button**
   - File: `src/components/agent-landing-pages/EDIcraftAgentLanding.tsx`
   - Impact: Users cannot clear Minecraft environment properly
   - Behavior Change: Button shows user message in chat instead of direct action
   - Fix: Restore pre-migration state management and UI

2. **CloudFront Deployment**
   - File: `.github/workflows/deploy-production.yml`
   - Impact: Cannot deploy to production
   - Behavior Change: Deployment fails at invalidation wait step
   - Fix: Correct AWS CLI syntax for wait command

### High Priority Regressions (Degraded UX)

[To be identified during systematic comparison]

### Medium Priority Regressions (Minor Issues)

[To be identified during systematic comparison]

## Implementation Strategy

### Phase 1: Regression Discovery (Tasks 1-3)

1. **Generate complete file diff**
   ```bash
   git diff 925b396 ab01226 --name-only > changed-files.txt
   ```

2. **For each file, extract both versions**
   ```bash
   git show 925b396:path/to/file > pre-migration/file
   git show ab01226:path/to/file > post-migration/file
   ```

3. **Categorize all changes**
   - Use git diff to see exact changes
   - Mark each change as infrastructure or behavioral
   - Document all behavioral changes as regressions

### Phase 2: Critical Regression Fixes (Tasks 4-6)

1. **Fix EDIcraft Clear Button**
   - Restore pre-migration state management
   - Restore pre-migration UI components
   - Replace Amplify call with REST API equivalent
   - Verify behavior matches pre-migration exactly

2. **Fix CloudFront Deployment**
   - Update GitHub Actions workflow
   - Correct AWS CLI wait command syntax
   - Test deployment end-to-end

3. **Verify Critical Fixes**
   - Test on localhost
   - Compare behavior to pre-migration
   - Ensure no new regressions introduced

### Phase 3: Smart Merge for Each Regression (Tasks 7-N)

For each identified regression:
1. **Analyze Current**: What new features/improvements exist post-migration?
2. **Analyze Pre-Migration**: What UX patterns worked before?
3. **Identify Gap**: What UX was lost during migration?
4. **Smart Merge**: 
   - Keep all new functionality
   - Restore lost UX patterns
   - Combine into single solution
5. **Verify**: New features work + UX matches pre-migration
6. **Test**: No regressions in either direction

**Example Merge Decision Tree**:
```
Is there new functionality post-migration?
├─ YES → Keep it, add pre-migration UX on top
└─ NO → Was it just broken during migration?
    ├─ YES → Restore pre-migration version
    └─ NO → Investigate why it changed
```

### Phase 4: Validation (Final Tasks)

1. **Component-by-Component Validation**
   - Test each fixed component
   - Compare to pre-migration behavior
   - Document any remaining differences

2. **End-to-End Testing**
   - Test complete user workflows
   - Verify all features work as pre-migration
   - Confirm no regressions remain

3. **Deployment Validation**
   - Deploy to production via CI/CD
   - Verify deployment succeeds
   - Confirm production matches localhost

## Infrastructure Wrapper Pattern

To maintain pre-migration behavior while using new infrastructure:

```typescript
// Pre-migration: Amplify call
const client = generateClient<Schema>();
const result = await client.mutations.invokeEDIcraftAgent({
  chatSessionId: 'session-123',
  message: 'Clear environment',
  foundationModelId: 'claude-3-5-sonnet',
  userId: 'user-456'
});

// Post-migration: REST API wrapper that produces IDENTICAL result
async function invokeEDIcraftAgent(params: {
  chatSessionId: string;
  message: string;
  foundationModelId: string;
  userId: string;
}) {
  const response = await fetch('/api/edicraft/invoke', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(params)
  });
  
  if (!response.ok) throw new Error('API call failed');
  
  // Return in SAME format as Amplify
  return {
    data: await response.json()
  };
}
```

## Testing Strategy

### Regression Testing Approach

1. **Baseline Capture**
   - Document pre-migration behavior for each feature
   - Create test cases based on pre-migration
   - Use pre-migration as acceptance criteria

2. **Fix Validation**
   - Test each fix against pre-migration baseline
   - Verify exact behavior match
   - Check for side effects

3. **Integration Testing**
   - Test interactions between fixed components
   - Verify no new regressions introduced
   - Confirm system-wide behavior matches pre-migration

### Test Cases

#### EDIcraft Clear Button Test

```typescript
describe('EDIcraft Clear Button - Regression Fix', () => {
  it('should match pre-migration behavior exactly', async () => {
    // Setup
    render(<EDIcraftAgentLanding onSendMessage={mockSendMessage} />);
    const button = screen.getByText('Clear Minecraft Environment');
    
    // Pre-migration behavior: button shows loading state
    fireEvent.click(button);
    expect(button).toHaveAttribute('loading', 'true');
    
    // Pre-migration behavior: success alert appears
    await waitFor(() => {
      expect(screen.getByText(/Clear command sent/)).toBeInTheDocument();
    });
    
    // Pre-migration behavior: alert disappears after 5 seconds
    await waitFor(() => {
      expect(screen.queryByText(/Clear command sent/)).not.toBeInTheDocument();
    }, {timeout: 6000});
    
    // Pre-migration behavior: button returns to normal state
    expect(button).not.toHaveAttribute('loading');
  });
});
```

#### CloudFront Deployment Test

```bash
# Test deployment workflow
# 1. Trigger deployment
# 2. Verify S3 upload succeeds
# 3. Verify CloudFront invalidation creates
# 4. Verify wait command succeeds
# 5. Verify deployment completes
```

## Error Handling

### Regression Fix Failures

If a fix doesn't restore pre-migration behavior:
1. Re-examine pre-migration code more carefully
2. Check for hidden dependencies
3. Verify infrastructure wrapper is correct
4. Test in isolation
5. Ask user for clarification if needed

### New Regressions

If fixing one regression breaks something else:
1. Immediately revert the fix
2. Analyze the dependency
3. Fix both issues together
4. Re-test comprehensively

## Success Criteria

1. ✅ All identified regressions documented
2. ✅ All critical regressions fixed
3. ✅ All high-priority regressions fixed
4. ✅ EDIcraft Clear button works exactly as pre-migration
5. ✅ CloudFront deployment succeeds
6. ✅ All components behave identically to pre-migration
7. ✅ All tests pass
8. ✅ User validates fixes match pre-migration
9. ✅ Production deployment succeeds
10. ✅ No new regressions introduced

## Rollback Plan

If systematic fixes cause issues:
1. Each fix is in its own commit
2. Can revert individual fixes
3. Can revert to pre-fix state
4. No data loss (frontend only)

## Summary

This design provides a **smart merge strategy** to fix migration regressions while preserving progress:

1. **Preserve Progress**: Keep all new agent features, backend improvements, and enhancements made post-migration
2. **Restore UX**: Bring back working UX patterns from pre-migration (loading states, alerts, user feedback)
3. **Smart Merge**: Surgically combine the best of both versions
4. **Validate Both**: Ensure new features work AND UX matches pre-migration
5. **No Loss**: Don't throw away valuable work done post-migration

The key insight: **Migration broke UX patterns, not functionality. We can have both - new features AND working UX. This is a merge, not a revert.**

### Merge Philosophy

```
Pre-Migration (925b396)     Current (HEAD)           Target (Merged)
├─ Working UX        ─────┐                    ┌──> Working UX (restored)
├─ Old infrastructure     ├─> Smart Merge ────┤
└─ Missing features       │                    ├──> New features (kept)
                          │                    ├──> New agents (kept)
Current (HEAD)            │                    └──> CDK infrastructure (kept)
├─ Broken UX         ─────┘
├─ CDK infrastructure
└─ New features

Result: Best of both worlds
```
