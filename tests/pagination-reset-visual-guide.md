# Pagination Reset Visual Testing Guide

## Quick Reference for Manual Testing

### Test 1: New Search Resets Pagination ✅

```
Step 1: Initial Search
┌─────────────────────────────────────────┐
│ Query: "show me osdu wells"             │
│ Results: 50 records found               │
│ Pagination: [1] [2] [3] [4] [5]         │
│ Current Page: 1                         │
└─────────────────────────────────────────┘

Step 2: Navigate to Page 3
┌─────────────────────────────────────────┐
│ Query: "show me osdu wells"             │
│ Results: 50 records found               │
│ Pagination: [1] [2] [3] [4] [5]         │
│ Current Page: 3 ← User clicked here    │
│ Showing: Records 21-30                  │
└─────────────────────────────────────────┘

Step 3: New Search
┌─────────────────────────────────────────┐
│ Query: "show me osdu production wells"  │
│ Results: 30 records found               │
│ Pagination: [1] [2] [3]                 │
│ Current Page: 1 ← AUTO RESET ✅         │
│ Showing: Records 1-10                   │
└─────────────────────────────────────────┘

Console Output:
🔄 [OSDUSearchResponse] Records array changed, resetting pagination to page 1
📊 [OSDUSearchResponse] New record count: 30
📄 [OSDUSearchResponse] Previous page index: 3
✅ [OSDUSearchResponse] Pagination reset complete
```

### Test 2: Filter Application Resets Pagination ✅

```
Step 1: Initial Search
┌─────────────────────────────────────────┐
│ Query: "show me osdu wells"             │
│ Results: 50 records found               │
│ Pagination: [1] [2] [3] [4] [5]         │
│ Current Page: 1                         │
└─────────────────────────────────────────┘

Step 2: Navigate to Page 3
┌─────────────────────────────────────────┐
│ Query: "show me osdu wells"             │
│ Results: 50 records found               │
│ Pagination: [1] [2] [3] [4] [5]         │
│ Current Page: 3 ← User clicked here    │
│ Showing: Records 21-30                  │
└─────────────────────────────────────────┘

Step 3: Apply Filter
┌─────────────────────────────────────────┐
│ Query: "filter by operator Shell"       │
│ 🔍 Filters Applied                      │
│ Active Filters: [operator: ⊃ Shell]    │
│ Results: 15 of 50 records               │
│ Pagination: [1] [2]                     │
│ Current Page: 1 ← AUTO RESET ✅         │
│ Showing: Records 1-10                   │
└─────────────────────────────────────────┘

Console Output:
🔄 [OSDUSearchResponse] Records array changed, resetting pagination to page 1
📊 [OSDUSearchResponse] New record count: 15
📄 [OSDUSearchResponse] Previous page index: 3
✅ [OSDUSearchResponse] Pagination reset complete
```

### Test 3: Sequential Filters Reset Pagination ✅

```
Step 1: Initial Search + First Filter
┌─────────────────────────────────────────┐
│ Query: "filter by operator Shell"       │
│ Active Filters: [operator: ⊃ Shell]    │
│ Results: 25 of 50 records               │
│ Pagination: [1] [2] [3]                 │
│ Current Page: 1                         │
└─────────────────────────────────────────┘

Step 2: Navigate to Page 2
┌─────────────────────────────────────────┐
│ Query: "filter by operator Shell"       │
│ Active Filters: [operator: ⊃ Shell]    │
│ Results: 25 of 50 records               │
│ Pagination: [1] [2] [3]                 │
│ Current Page: 2 ← User clicked here    │
│ Showing: Records 11-20                  │
└─────────────────────────────────────────┘

Step 3: Apply Second Filter
┌─────────────────────────────────────────┐
│ Query: "show only depth > 3000"         │
│ Active Filters:                         │
│   [operator: ⊃ Shell]                   │
│   [depth: > 3000]                       │
│ Results: 12 of 50 records               │
│ Pagination: [1] [2]                     │
│ Current Page: 1 ← AUTO RESET ✅         │
│ Showing: Records 1-10                   │
└─────────────────────────────────────────┘

Console Output:
🔄 [OSDUSearchResponse] Records array changed, resetting pagination to page 1
📊 [OSDUSearchResponse] New record count: 12
📄 [OSDUSearchResponse] Previous page index: 2
✅ [OSDUSearchResponse] Pagination reset complete
```

### Test 4: Filter Reset Resets Pagination ✅

```
Step 1: Filtered Results
┌─────────────────────────────────────────┐
│ Query: "filter by operator Shell"       │
│ Active Filters: [operator: ⊃ Shell]    │
│ Results: 15 of 50 records               │
│ Pagination: [1] [2]                     │
│ Current Page: 1                         │
└─────────────────────────────────────────┘

Step 2: Navigate to Page 2
┌─────────────────────────────────────────┐
│ Query: "filter by operator Shell"       │
│ Active Filters: [operator: ⊃ Shell]    │
│ Results: 15 of 50 records               │
│ Pagination: [1] [2]                     │
│ Current Page: 2 ← User clicked here    │
│ Showing: Records 11-15                  │
└─────────────────────────────────────────┘

Step 3: Reset Filters
┌─────────────────────────────────────────┐
│ Query: "show all"                       │
│ 🔄 Filters Reset                        │
│ Results: 50 records                     │
│ Pagination: [1] [2] [3] [4] [5]         │
│ Current Page: 1 ← AUTO RESET ✅         │
│ Showing: Records 1-10                   │
└─────────────────────────────────────────┘

Console Output:
🔄 [OSDUSearchResponse] Records array changed, resetting pagination to page 1
📊 [OSDUSearchResponse] New record count: 50
📄 [OSDUSearchResponse] Previous page index: 2
✅ [OSDUSearchResponse] Pagination reset complete
```

### Test 5: Page Preservation on Re-render ✅

```
Step 1: Navigate to Page 3
┌─────────────────────────────────────────┐
│ Query: "show me osdu wells"             │
│ Results: 50 records found               │
│ Pagination: [1] [2] [3] [4] [5]         │
│ Current Page: 3 ← User clicked here    │
│ Showing: Records 21-30                  │
└─────────────────────────────────────────┘

Step 2: Component Re-renders (same records)
┌─────────────────────────────────────────┐
│ Query: "show me osdu wells"             │
│ Results: 50 records found               │
│ Pagination: [1] [2] [3] [4] [5]         │
│ Current Page: 3 ← PRESERVED ✅          │
│ Showing: Records 21-30                  │
└─────────────────────────────────────────┘

Console Output:
(No output - useEffect does not trigger)
```

## What to Look For

### ✅ Success Indicators
- Pagination shows "Page 1" after filter/search
- Table displays first 10 records (1-10)
- Console shows reset logs
- Smooth transition, no errors
- Page counter updates correctly

### ❌ Failure Indicators
- Pagination stays on page 3 after filter
- Table shows empty or wrong records
- No console logs
- Error messages in console
- Page counter shows wrong numbers

## Browser Console Commands

### Check Current State
```javascript
// Check if component is mounted
document.querySelector('[data-testid="osdu-search-response"]')

// Check pagination controls
document.querySelectorAll('[aria-label*="page"]')

// Check current page indicator
document.querySelector('[aria-current="page"]')
```

### Monitor Pagination
```javascript
// Watch for pagination changes
const observer = new MutationObserver(() => {
  console.log('Pagination changed');
});
observer.observe(
  document.querySelector('.pagination-container'),
  { childList: true, subtree: true }
);
```

## Quick Test Checklist

- [ ] Test 1: New search resets pagination
- [ ] Test 2: Filter application resets pagination
- [ ] Test 3: Sequential filters reset pagination
- [ ] Test 4: Filter reset resets pagination
- [ ] Test 5: Page preserved on re-render
- [ ] Console logs appear correctly
- [ ] No TypeScript errors
- [ ] No runtime errors
- [ ] Smooth user experience

## Expected Behavior Summary

| Action | Records Change? | Pagination Reset? |
|--------|----------------|-------------------|
| New search | ✅ Yes | ✅ Yes → Page 1 |
| Apply filter | ✅ Yes | ✅ Yes → Page 1 |
| Sequential filter | ✅ Yes | ✅ Yes → Page 1 |
| Reset filters | ✅ Yes | ✅ Yes → Page 1 |
| Navigate page | ❌ No | ❌ No → Stay on page |
| Component re-render | ❌ No | ❌ No → Stay on page |

## Troubleshooting

### Issue: Pagination doesn't reset
**Check:**
- Is records array reference changing?
- Is useEffect dependency correct?
- Are console logs appearing?

### Issue: Pagination resets too often
**Check:**
- Is records array being recreated unnecessarily?
- Is component re-rendering with new array reference?

### Issue: No console logs
**Check:**
- Is browser console open?
- Are console logs filtered?
- Is component actually rendering?

## Success Criteria

✅ All 5 test scenarios pass
✅ Console logs appear correctly
✅ No errors in browser console
✅ Smooth, intuitive user experience
✅ Pagination always shows correct page
✅ Table always shows correct records

---

**Status**: Ready for manual testing
**Requirements**: 11.4, 11.5
**Implementation**: Complete ✅
