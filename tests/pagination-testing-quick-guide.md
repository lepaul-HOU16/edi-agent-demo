# Pagination Testing Quick Guide

## 🚀 Quick Start

### 1. Test with Large Dataset (2 minutes)
```
1. Open Data Catalog
2. Search: "show me osdu wells"
3. ✓ Pagination appears
4. ✓ Shows "Page 1 of X"
5. Click "Next" 3 times
6. ✓ Page updates each time
7. Click "Previous" 2 times
8. ✓ Returns to correct pages
```

### 2. Test with Small Dataset (1 minute)
```
1. Apply filter: "filter by operator Shell"
2. Apply filter: "show only status Active"
3. Continue until < 10 records
4. ✓ Pagination disappears
5. ✓ All records on one page
```

### 3. Test Boundaries (1 minute)
```
1. Go to page 1
2. ✓ "Previous" is disabled
3. Go to last page
4. ✓ "Next" is disabled
5. ✓ Correct record count shown
```

### 4. Test Filter Reset (1 minute)
```
1. Navigate to page 3
2. Apply any filter
3. ✓ Resets to page 1
4. ✓ Page count updates
```

## ✅ Pass Criteria

**Must verify ALL of these**:
- [ ] Pagination shows when > 10 records
- [ ] Pagination hides when ≤ 10 records
- [ ] Page navigation works (Next/Previous)
- [ ] "Previous" disabled on page 1
- [ ] "Next" disabled on last page
- [ ] Counter shows "Showing X-Y of Z"
- [ ] Filter resets to page 1
- [ ] Last page shows correct record count

## 🐛 Common Issues to Check

1. **Pagination doesn't appear**
   - Check: Are there > 10 records?
   - Check: Console for errors

2. **Wrong records shown**
   - Check: "Showing X-Y of Z" matches displayed records
   - Check: Page number is correct

3. **Buttons not disabled**
   - Check: On page 1, "Previous" should be disabled
   - Check: On last page, "Next" should be disabled

4. **Filter doesn't reset pagination**
   - Check: After filter, should be on page 1
   - Check: Page count should update

## 📊 Test Data Scenarios

### Scenario A: 60 records (6 pages)
- Page 1: Records 1-10
- Page 2: Records 11-20
- Page 3: Records 21-30
- Page 4: Records 31-40
- Page 5: Records 41-50
- Page 6: Records 51-60

### Scenario B: 25 records (3 pages)
- Page 1: Records 1-10
- Page 2: Records 11-20
- Page 3: Records 21-25 (only 5 records)

### Scenario C: 11 records (2 pages)
- Page 1: Records 1-10
- Page 2: Record 11 (only 1 record)

### Scenario D: 10 records (1 page)
- No pagination shown
- All 10 records visible

### Scenario E: 7 records (1 page)
- No pagination shown
- All 7 records visible

## 🎯 5-Minute Full Test

```
Time: 0:00 - Open Data Catalog
Time: 0:30 - Search "show me osdu wells"
Time: 1:00 - Verify pagination appears
Time: 1:30 - Click through 3 pages
Time: 2:00 - Verify counter accuracy
Time: 2:30 - Go to last page, check "Next" disabled
Time: 3:00 - Go to first page, check "Previous" disabled
Time: 3:30 - Navigate to page 3
Time: 4:00 - Apply filter, verify reset to page 1
Time: 4:30 - Apply filter to get < 10 records
Time: 5:00 - Verify pagination disappears
```

## 📱 Mobile Testing (Optional)

**Quick mobile check** (2 minutes):
1. Open on mobile device
2. Search for OSDU wells
3. ✓ Pagination controls visible
4. ✓ Buttons are touch-friendly
5. ✓ Page counter readable
6. ✓ Navigation works

## 🔍 Visual Inspection

**What to look for**:
- ✓ Pagination controls at bottom of table
- ✓ Clear page counter (e.g., "Page 2 of 5")
- ✓ Disabled buttons are grayed out
- ✓ Active buttons are clickable
- ✓ "Showing X-Y of Z" in table header
- ✓ Smooth transitions between pages

## 💡 Pro Tips

1. **Use browser console** to check for errors
2. **Test with different record counts** (10, 11, 25, 50, 100)
3. **Test sequential filters** to verify reset behavior
4. **Check accessibility** with keyboard navigation
5. **Verify on different browsers** (Chrome, Firefox, Safari)

## 🎉 Success Indicators

**You're done when**:
- ✅ All 8 pass criteria checked
- ✅ No console errors
- ✅ Smooth user experience
- ✅ Correct record counts on all pages
- ✅ Buttons enable/disable correctly

## 📞 Need Help?

**If tests fail**:
1. Check `tests/test-pagination-comprehensive.js` output
2. Review `tests/TASK_21_PAGINATION_TESTING_COMPLETE.md`
3. Verify OSDUSearchResponse component implementation
4. Check browser console for errors

**Expected behavior**:
- Pagination is automatic
- No configuration needed
- Works with any OSDU search
- Resets on every filter
