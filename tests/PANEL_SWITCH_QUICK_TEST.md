# Quick Test Guide: Panel Switch Filter State Persistence

## Purpose
Quick manual test to verify filter state persists across panel switches.

## Prerequisites
- Catalog page loaded
- At least one search performed with results

## Test Steps

### Test 1: Basic Panel Switch with Filter

1. **Apply Filter**
   ```
   User Action: Type "wells with log curve data" in chat
   Expected: Table shows "X of 151 total" (filtered count)
   ```

2. **Switch to Map Panel**
   ```
   User Action: Click Map icon (first icon in panel selector)
   Expected: 
   - Map displays only filtered wells
   - Well count matches filtered count
   ```

3. **Switch to Data Analysis Panel**
   ```
   User Action: Click Data Analysis icon (second icon)
   Expected:
   - Dashboard shows analysis for filtered wells
   - Well count matches filtered count
   ```

4. **Switch to Chain of Thought Panel**
   ```
   User Action: Click Chain of Thought icon (third icon)
   Expected:
   - Chain of thought steps displayed
   - Filter state maintained (verify by switching back)
   ```

5. **Switch Back to Chat Panel**
   ```
   User Action: Click Data Analysis icon again
   Expected:
   - Table still shows "X of 151 total"
   - Same filtered data displayed
   - Filter state maintained
   ```

### Test 2: Multiple Filters with Panel Switches

1. **Initial Search**
   ```
   User Action: Type "/getdata"
   Expected: Table shows "151 total" (all wells)
   ```

2. **First Filter**
   ```
   User Action: Type "wells deeper than 3000m"
   Expected: Table shows "Y of 151 total"
   ```

3. **Switch to Map**
   ```
   User Action: Click Map icon
   Expected: Map shows Y filtered wells
   ```

4. **Second Filter**
   ```
   User Action: Switch back to chat, type "wells with GR curve"
   Expected: Table shows "Z of 151 total" (further filtered)
   ```

5. **Verify Across Panels**
   ```
   User Action: Switch between all panels
   Expected: All panels show Z filtered wells
   ```

### Test 3: Rapid Panel Switching

1. **Apply Filter**
   ```
   User Action: Type "wells with log curve data"
   Expected: Filter applied
   ```

2. **Rapid Switches**
   ```
   User Action: Quickly click: Map → Data Analysis → Chain of Thought → Map → Data Analysis
   Expected: Filter state maintained throughout
   ```

3. **Verify Final State**
   ```
   User Action: Check table in Data Analysis panel
   Expected: Still shows filtered data with correct count
   ```

### Test 4: Filter State After Session Reset

1. **Apply Filter**
   ```
   User Action: Type "wells with log curve data"
   Expected: Filter applied
   ```

2. **Reset Session**
   ```
   User Action: Click reset button or type "/reset"
   Expected: All state cleared, including filter
   ```

3. **Verify Clean State**
   ```
   User Action: Switch between panels
   Expected: No filtered data, clean state
   ```

## Visual Verification Checklist

### In Chat/Data Analysis Panel:
- [ ] Table header shows "(X of Y total)" when filtered
- [ ] Table description says "Filtered results - click any row to view details"
- [ ] Only filtered wells displayed in table

### In Map Panel:
- [ ] Only filtered wells shown as markers
- [ ] Well count matches filtered count
- [ ] Map bounds fit filtered wells

### In Chain of Thought Panel:
- [ ] Chain of thought steps displayed
- [ ] Switching back to other panels maintains filter

## Expected Results Summary

| Action | Expected Result |
|--------|----------------|
| Apply filter in chat | Table shows "X of Y total" |
| Switch to Map | Map shows X filtered wells |
| Switch to Data Analysis | Dashboard analyzes X wells |
| Switch to Chain of Thought | Steps displayed, filter maintained |
| Switch back to chat | Table still shows "X of Y total" |
| Rapid panel switches | Filter state never lost |
| Session reset | Filter state cleared |

## Common Issues to Watch For

### ❌ Issue: Filter state lost on panel switch
**Symptom**: Table shows all wells after switching panels
**Expected**: Table should show filtered wells
**Status**: Should NOT occur (verified by tests)

### ❌ Issue: Filter stats not displayed
**Symptom**: Table header shows "(X total)" instead of "(X of Y total)"
**Expected**: Should show filtered count and total count
**Status**: Should NOT occur (verified by tests)

### ❌ Issue: Map shows all wells instead of filtered
**Symptom**: Map displays 151 wells when filter is applied
**Expected**: Map should show only filtered wells
**Status**: Should NOT occur (verified by tests)

## Success Criteria

✅ All tests pass
✅ Filter state persists across all panel switches
✅ Table shows correct filtered data in all panels
✅ Map shows correct filtered wells
✅ Visual indicators display correctly
✅ No console errors
✅ Smooth user experience

## Test Duration

- **Quick Test**: 2-3 minutes (Test 1 only)
- **Full Test**: 5-7 minutes (All tests)
- **Comprehensive**: 10-15 minutes (All tests + edge cases)

## Notes

- Filter state is maintained by React state management
- Panel switching only changes displayed component, not state
- State is only cleared on explicit session reset
- All automated tests pass (12/12)

---

**Last Updated**: 2025-01-15
**Test Status**: ✅ All automated tests passing
**Manual Test Status**: Ready for user validation
