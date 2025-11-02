# Expandable Rows Test Plan

## Quick Start Guide

This document provides a streamlined test plan for verifying the expandable rows functionality after removing the "Details" column.

## Prerequisites

1. Development server running: `npm run dev`
2. Navigate to catalog/chat interface
3. Execute a query that returns well data (e.g., "show me wells")
4. Wait for table to render

## Test Execution

### Test 1: Basic Expansion (Requirement 4.1)

**Steps:**
1. Locate the first row in the table
2. Click anywhere on the row (except interactive elements)
3. Observe the result

**Expected Result:**
- ✅ Row expands smoothly
- ✅ Expanded content appears below the row
- ✅ Content includes: Well ID, Name Aliases, Wellbores, Additional Info

**Pass/Fail:** [ ]

---

### Test 2: Dropdown Icon Toggle (Requirement 4.2)

**Steps:**
1. Locate the dropdown icon (chevron/arrow) at the start of a row
2. Click the icon to expand
3. Click the icon again to collapse

**Expected Result:**
- ✅ Icon is visible and clickable
- ✅ Row expands when icon is clicked
- ✅ Row collapses when icon is clicked again
- ✅ Icon rotates to indicate state

**Pass/Fail:** [ ]

---

### Test 3: Expanded Content Display (Requirement 4.3)

**Steps:**
1. Expand any row
2. Examine the expanded content sections

**Expected Result:**
- ✅ **Well ID Section:** Label and ID in monospace font
- ✅ **Name Aliases Section:** Comma-separated list of aliases
- ✅ **Wellbores Section:** Count and list of wellbores
- ✅ **Welllogs:** Nested under wellbores with curve counts
- ✅ **Additional Information:** Grid layout of metadata
- ✅ **Styling:** Light gray background, white content boxes, proper padding

**Pass/Fail:** [ ]

---

### Test 4: Multiple Simultaneous Expansions (Requirement 4.4)

**Steps:**
1. Expand the first row
2. Without collapsing the first, expand the second row
3. Without collapsing the first two, expand the third row
4. Verify all three are expanded

**Expected Result:**
- ✅ First row remains expanded when second is expanded
- ✅ First and second remain expanded when third is expanded
- ✅ All three rows show their expanded content simultaneously
- ✅ Content is not overlapping or hidden

**Pass/Fail:** [ ]

---

### Test 5: Collapse Functionality (Requirement 4.5)

**Steps:**
1. Expand three rows (as in Test 4)
2. Click the first row to collapse it
3. Verify second and third remain expanded
4. Click the second row to collapse it
5. Verify third remains expanded
6. Click the third row to collapse it

**Expected Result:**
- ✅ First row collapses, others remain expanded
- ✅ Second row collapses, third remains expanded
- ✅ Third row collapses
- ✅ Table returns to compact state
- ✅ Can re-expand any row after collapsing

**Pass/Fail:** [ ]

---

## Visual Verification

### Column Layout
- [ ] Only 3 columns visible: "Facility Name", "Wellbores", "Welllog Curves"
- [ ] No "Details" column present
- [ ] Facility Name column is wider (~50%)
- [ ] Wellbores and Welllog Curves columns are equal width (~25% each)

### Dropdown Icon
- [ ] Icon visible at start of each row
- [ ] Icon clearly indicates expandability
- [ ] Icon rotates when row is expanded/collapsed

### Expanded Content
- [ ] Content appears directly below the row
- [ ] Content spans full table width
- [ ] Background is light gray (#f9f9f9)
- [ ] Content boxes have white background
- [ ] Text is readable and properly formatted

## Functional Verification

### Sorting
- [ ] Can sort by Facility Name while rows are expanded
- [ ] Can sort by Wellbores while rows are expanded
- [ ] Can sort by Welllog Curves while rows are expanded
- [ ] Expanded state is maintained after sorting

### Pagination
- [ ] Can navigate to page 2 while rows are expanded
- [ ] Expanded state resets when changing pages
- [ ] Can expand rows on page 2
- [ ] Pagination controls work correctly

### Performance
- [ ] Expansion is smooth and responsive
- [ ] No lag when toggling multiple rows
- [ ] No visual glitches or flickering
- [ ] Scrolling works smoothly with expanded rows

## Edge Cases

### Empty Data
- [ ] Rows with no wellbores expand without errors
- [ ] Rows with missing fields display gracefully
- [ ] Empty sections are handled appropriately

### Large Data
- [ ] Rows with many wellbores display correctly
- [ ] Rows with many curves show count (not all names)
- [ ] Long facility names wrap or truncate appropriately

### Browser Console
- [ ] No JavaScript errors in console
- [ ] No warnings related to expandable rows
- [ ] No React warnings or errors

## Test Results Summary

**Total Tests:** 5 core requirements + visual + functional + edge cases

**Passed:** [ ] / [ ]

**Failed:** [ ] / [ ]

**Issues Found:**
1. _____________________________________
2. _____________________________________
3. _____________________________________

## Sign-off

**Tested By:** _____________________

**Date:** _____________________

**Environment:** 
- [ ] Local Development
- [ ] Staging
- [ ] Production

**Browser(s) Tested:**
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

**Approval:**
- [ ] All tests passed
- [ ] No critical issues found
- [ ] Ready for production

**Notes:**
_____________________________________________
_____________________________________________
_____________________________________________

---

## Quick Reference: What to Look For

### ✅ Good Signs
- Rows expand smoothly when clicked
- Dropdown icon is visible and functional
- Expanded content is well-formatted and readable
- Multiple rows can be expanded at once
- Rows collapse cleanly when clicked again
- No console errors
- Performance is smooth

### ❌ Red Flags
- Rows don't expand when clicked
- Dropdown icon is missing or non-functional
- Expanded content is missing or malformed
- Only one row can be expanded at a time
- Rows don't collapse when clicked
- Console shows errors
- Lag or stuttering when toggling rows

## Troubleshooting

### Issue: Rows don't expand
**Check:**
- Is the data loaded correctly?
- Are there console errors?
- Is the `expandableRows` prop configured?

### Issue: Expanded content is blank
**Check:**
- Does the data have wellbores?
- Is `getExpandableContent` returning content?
- Are there rendering errors in console?

### Issue: Multiple rows don't stay expanded
**Check:**
- Is `expandedItems` an array?
- Is the toggle logic adding to array (not replacing)?
- Check the `onExpandableItemToggle` implementation

### Issue: Performance is slow
**Check:**
- How many rows are in the table?
- How many rows are expanded?
- Is pagination working correctly?
- Are there memory leaks?

## Contact

If you encounter issues during testing, document them in the "Issues Found" section above and contact the development team.

---

**Remember:** The goal is to verify that removing the "Details" column did NOT break the expandable rows functionality. All features should work exactly as they did before.
