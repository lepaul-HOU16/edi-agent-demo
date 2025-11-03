# Duplication Fix - Wind Rose & Wind Farm Layout

## Problem

Both wind rose and wind farm layout artifacts were appearing twice in the UI, showing duplicate response cards with identical content.

## Root Cause

The duplication was happening at the **database/message level**, not in the rendering logic. The `messages` array contained duplicate messages with the same ID, which were then being rendered multiple times.

### Evidence

The ChatBox component already had duplicate detection logic that was logging warnings:
```typescript
console.warn('⚠️ DUPLICATE MESSAGES DETECTED!', {
  totalMessages: messageIds.length,
  uniqueMessages: uniqueIds.size,
  duplicateCount: messageIds.length - uniqueIds.size
});
```

However, it was only **detecting** duplicates, not **removing** them.

## Solution

Added deduplication logic in `ChatBox.tsx` to remove duplicate messages before rendering:

```typescript
// CRITICAL FIX: Deduplicate messages by ID before processing
const deduplicatedMessages = messages ? Array.from(
  new Map(messages.map(m => [m.id, m])).values()
) : [];
```

This uses a `Map` to ensure only one message per ID is kept, effectively removing duplicates.

## Files Modified

### 1. `src/components/ChatBox.tsx`
- **Changed**: `displayedMessages` useMemo hook
- **Added**: Deduplication logic using Map
- **Added**: Better logging to track removed duplicates

### 2. `src/components/ChatMessage.tsx`
- **Added**: Render tracking logs in `EnhancedArtifactProcessor`
- **Added**: Message ID tracking in logs
- **Added**: Artifact count logging

### 3. `src/components/renewable/WindRoseArtifact.tsx`
- **Added**: Render tracking logs
- **Added**: Visualization URL logging

### 4. `src/components/renewable/LayoutMapArtifact.tsx`
- **Added**: Render tracking logs
- **Added**: Map data logging

## How It Works

### Before Fix
```
Database → [Message1, Message1, Message2] → Render all 3 → Duplicates appear
```

### After Fix
```
Database → [Message1, Message1, Message2] → Deduplicate → [Message1, Message2] → Render 2 → No duplicates
```

## Testing

To verify the fix:

1. **Check browser console** for deduplication logs:
   ```
   ⚠️ DUPLICATE MESSAGES REMOVED!
   originalCount: 2
   deduplicatedCount: 1
   removedCount: 1
   ```

2. **Verify UI** shows only one instance of each artifact

3. **Test both features**:
   - Wind rose analysis
   - Wind farm layout

## Why Duplicates Were in Database

Possible causes (needs further investigation):
1. Message being saved twice in orchestrator
2. GraphQL subscription triggering multiple times
3. Race condition in message creation
4. Frontend sending duplicate requests

## Next Steps

### Immediate
- ✅ Deploy fix and test
- ✅ Verify no duplicates in UI
- ✅ Check console logs for deduplication warnings

### Short Term
- Investigate why duplicates are being created in database
- Add unique constraint on message ID in database
- Add request deduplication in orchestrator

### Long Term
- Implement idempotency keys for message creation
- Add database-level deduplication
- Improve GraphQL subscription handling

## Impact

- **User Experience**: No more confusing duplicate responses
- **Performance**: Slightly better (fewer components rendered)
- **Debugging**: Better logs to track duplication issues

## Related Issues

- Wind rose visualization not showing (separate issue - matplotlib not available)
- Both issues were reported together but have different root causes

## Verification Commands

```bash
# Check if duplicates are being logged
# Look for "DUPLICATE MESSAGES REMOVED" in browser console

# Test wind rose
# Query: "show wind rose for 35.0, -101.0"

# Test wind farm layout
# Query: "optimize layout for 35.0, -101.0 with 10 turbines"
```

## Success Criteria

- ✅ Only one wind rose card appears
- ✅ Only one layout card appears
- ✅ Console shows deduplication logs if duplicates exist
- ✅ No visual duplicates in UI
- ✅ All artifact data displays correctly

## Notes

- The fix is **defensive** - it handles duplicates at the UI level
- The **root cause** (why duplicates are created) still needs investigation
- This fix prevents duplicates from affecting users while we investigate the source
