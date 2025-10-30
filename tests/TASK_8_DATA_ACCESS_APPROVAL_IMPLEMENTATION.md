# Task 8: Data Access Approval Flow - Implementation Summary

## Overview
Implemented a comprehensive data access approval flow that detects when AI agents attempt to access data outside a collection's scope and prompts users for approval before proceeding.

## Implementation Details

### 1. Backend - Data Access Violation Detection (Task 8.1)

**File:** `amplify/functions/agents/handler.ts`

**Key Features:**
- **Violation Detection Function**: Analyzes user queries to extract well/data references and compares them against collection scope
- **Pattern Matching**: Uses regex to identify well references in queries (e.g., "well-001", "WELL 002")
- **Scope Validation**: Checks if requested data items exist in the collection's allowed data set
- **Approval Request Generation**: Creates structured approval artifacts when violations are detected

**Detection Logic:**
```typescript
const detectDataAccessViolation = (query: string, context: any) => {
  // Extract well references from query
  const wellPattern = /well[- ]?(\d+|[a-z0-9-]+)/gi;
  const requestedWells = query.match(wellPattern) || [];
  
  // Build allowed data set from collection
  const allowedDataIds = new Set<string>();
  context.dataItems.forEach(item => {
    if (item.id) allowedDataIds.add(item.id.toLowerCase());
    if (item.name) allowedDataIds.add(item.name.toLowerCase());
  });
  
  // Identify out-of-scope items
  const outOfScopeItems = requestedWells.filter(
    well => !allowedDataIds.has(well)
  );
  
  return { requiresApproval: outOfScopeItems.length > 0, outOfScopeItems };
};
```

**Approval Response Handling:**
- Detects approval keywords: "approve", "yes", "approve expanded access"
- Logs approval in ChatSession's `dataAccessLog` field
- Temporarily clears collection context to allow expanded access for approved queries

**Data Access Log Entry Structure:**
```typescript
{
  timestamp: ISO 8601 timestamp,
  action: 'expanded_access_approved',
  collectionId: string,
  collectionName: string,
  userId: string,
  message: user's approval message
}
```

### 2. Frontend - Approval UI Component (Task 8.2)

**File:** `src/components/messageComponents/DataAccessApprovalComponent.tsx`

**Key Features:**
- **Visual Warning**: Prominent warning icon and colored alert box
- **Clear Information Display**: Shows collection name and out-of-scope items
- **User Options**: Lists three clear options (approve, rephrase, cancel)
- **Action Buttons**: Approve (warning color) and Cancel buttons
- **Audit Notice**: Informs users that approval will be logged

**Component Props:**
```typescript
interface DataAccessApprovalComponentProps {
  data: {
    message?: string;
    outOfScopeItems?: string[];
    collectionId?: string;
    collectionName?: string;
  };
  theme: any;
  onApprove?: () => void;
  onCancel?: () => void;
}
```

**UI Features:**
- Dark/light theme support
- Responsive layout with Material-UI components
- Lists up to 5 out-of-scope items with "... and X more" for longer lists
- Clear visual hierarchy with icons and typography

### 3. Integration - ChatMessage Component

**File:** `src/components/ChatMessage.tsx`

**Changes:**
- Added import for `DataAccessApprovalComponent`
- Added artifact handler for `data_access_approval` type
- Integrated approval/cancel callbacks with chat message sending

**Artifact Detection:**
```typescript
if (parsedArtifact.messageContentType === 'data_access_approval') {
  return <DataAccessApprovalComponent
    data={artifactData}
    theme={theme}
    onApprove={() => onSendMessage('approve')}
    onCancel={() => onSendMessage('cancel')}
  />;
}
```

## Testing

**File:** `tests/unit/test-data-access-approval.test.ts`

**Test Coverage:**
1. **Data Access Violation Detection**
   - ✅ Detects queries requesting data outside collection scope
   - ✅ Allows queries when all data is within scope
   - ✅ Allows all queries when no collection context exists

2. **Approval Response Detection**
   - ✅ Detects "approve" as approval
   - ✅ Detects "yes" as approval
   - ✅ Detects "approve expanded access" phrase
   - ✅ Rejects non-approval messages

3. **Data Access Log**
   - ✅ Creates proper log entry structure with all required fields

4. **Approval Artifact Structure**
   - ✅ Creates valid artifact with correct type and fields

**Test Results:** All 9 tests passing ✅

## User Workflow

### Scenario: User queries data outside collection scope

1. **User sends query**: "analyze well-003 and well-004"
2. **Backend detects violation**: Identifies well-003 and well-004 are not in collection
3. **Approval artifact created**: Returns data_access_approval artifact instead of processing query
4. **UI displays approval request**: Shows warning with out-of-scope items and options
5. **User clicks "Approve"**: Sends "approve" message back to chat
6. **Backend logs approval**: Adds entry to dataAccessLog in ChatSession
7. **Backend processes query**: Clears collection context temporarily and processes original query
8. **Results displayed**: User sees analysis results with expanded data access

### Scenario: User cancels request

1. **User sends query**: "analyze well-003 and well-004"
2. **Backend detects violation**: Identifies out-of-scope data
3. **UI displays approval request**: Shows warning
4. **User clicks "Cancel"**: Sends "cancel" message
5. **Query cancelled**: No further processing, user can rephrase or start over

## Requirements Satisfied

✅ **Requirement 4.3**: Data access violation detection and approval prompts
- Detects when agent attempts to access out-of-scope data
- Prompts user to confirm expanded access
- Provides clear options (approve, rephrase, cancel)

✅ **Requirement 4.4**: Approval logging and context expansion
- Logs all approved expansions in ChatSession.dataAccessLog
- Includes timestamp, action, collection info, and user ID
- Allows agent to access additional data after approval

## Security & Audit

**Audit Trail:**
- All data access approvals are logged with timestamps
- Logs include user ID, collection ID, and approval message
- Logs are stored in ChatSession model for session-level tracking
- Can be queried for compliance and security audits

**Access Control:**
- Default behavior: Strict enforcement of collection scope
- Approval required: One-time expansion for specific query
- No permanent scope changes: Each query requires separate approval
- User control: Users explicitly approve each expansion

## Future Enhancements

Potential improvements for future iterations:
1. **Persistent Approvals**: Option to remember approval for session/collection
2. **Approval History View**: UI to view past approvals and revoke if needed
3. **Granular Permissions**: Allow approval for specific data items vs. all
4. **Admin Controls**: Organization-level policies for data access
5. **Analytics**: Track approval patterns and data access trends

## Files Modified

1. `amplify/functions/agents/handler.ts` - Backend violation detection and approval handling
2. `src/components/messageComponents/DataAccessApprovalComponent.tsx` - New approval UI component
3. `src/components/ChatMessage.tsx` - Integration of approval component
4. `tests/unit/test-data-access-approval.test.ts` - Comprehensive unit tests

## Deployment Notes

**No schema changes required** - Uses existing ChatSession.dataAccessLog field (already defined in schema)

**No environment variables needed** - All logic is self-contained

**No external dependencies** - Uses existing Material-UI components

**Ready for deployment** - All tests passing, no TypeScript errors

## Conclusion

Task 8 is complete with full implementation of data access approval flow. The system now:
- Detects data access violations automatically
- Prompts users with clear approval UI
- Logs all approvals for audit purposes
- Allows controlled expansion of data access
- Maintains security while providing flexibility

All requirements (4.3, 4.4) are satisfied with comprehensive testing and documentation.
