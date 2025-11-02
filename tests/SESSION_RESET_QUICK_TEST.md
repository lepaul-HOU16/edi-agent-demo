# Session Reset - Quick Test Guide

## Quick Manual Test (2 minutes)

### Test the "New Chat" Button

1. **Open Catalog Page**
   ```
   http://localhost:3000/catalog
   ```

2. **Perform Initial Search**
   - Type: "show all wells"
   - Wait for results to load
   - Verify table shows wells

3. **Apply Filter**
   - Type: "wells with log curve data"
   - Verify table updates to show filtered results
   - Note the filtered count (e.g., "15 of 151 wells")

4. **Check localStorage (Before Reset)**
   - Open Browser DevTools (F12)
   - Go to Application > Local Storage
   - Find keys:
     - `catalog_session_id` (e.g., "abc-123")
     - `catalog_messages_abc-123` (array of messages)

5. **Click "New Chat" Button**
   - Look for the reset icon button in the UI
   - Click it

6. **Verify Reset (After)**
   - ✅ All messages cleared from chat
   - ✅ Table is empty (no data)
   - ✅ Map is reset to default view
   - ✅ Console shows: "🔄 RESET: Generated new sessionId: xyz-789"

7. **Check localStorage (After Reset)**
   - `catalog_session_id` changed (e.g., "xyz-789")
   - `catalog_messages_abc-123` is REMOVED
   - `catalog_messages_xyz-789` does not exist yet

8. **Verify Fresh Start**
   - Type: "show all wells"
   - Verify search works
   - New messages saved under new sessionId

## Expected Console Output

```
🔄 RESET: Clearing all catalog state...
🗑️ RESET: Cleared persisted messages for old session: abc-123
🔄 RESET: Generated new sessionId: xyz-789
🗺️ RESET: Clearing map data...
✅ RESET: All catalog state cleared successfully
```

## What Gets Cleared

### localStorage
- ✅ `catalog_messages_{oldSessionId}` - REMOVED
- ✅ `catalog_session_id` - UPDATED to new ID

### React State
- ✅ `messages` - Empty array []
- ✅ `analysisData` - null
- ✅ `filteredData` - null
- ✅ `filterStats` - null
- ✅ `chainOfThoughtMessageCount` - 0
- ✅ `chainOfThoughtAutoScroll` - true
- ✅ `mapState` - Reset to default
- ✅ `polygons` - Empty array []
- ✅ `activePolygon` - null

## Automated Test

```bash
npm test -- tests/catalog-session-reset.test.ts
```

Expected: **5/5 tests passing**

## Common Issues

### Issue 1: Old messages still visible
**Cause**: localStorage not cleared
**Fix**: Check console for "🗑️ RESET: Cleared persisted messages"

### Issue 2: Same sessionId after reset
**Cause**: sessionId not regenerated
**Fix**: Check console for "🔄 RESET: Generated new sessionId"

### Issue 3: Filtered data still showing
**Cause**: filteredData/filterStats not cleared
**Fix**: Verify state clearing in handleCreateNewChat

## Success Criteria

✅ Old messages removed from localStorage
✅ New sessionId generated and saved
✅ All state cleared (messages, data, filters)
✅ New session starts fresh
✅ No errors in console
✅ User can perform new search immediately

## Integration with Message Persistence

The session reset works with message persistence:

1. **Normal Operation**: Messages auto-save to localStorage
2. **Page Reload**: Messages restore from localStorage
3. **Session Reset**: Old messages deleted, new session starts
4. **New Messages**: Saved under new sessionId

This ensures clean separation between sessions.
