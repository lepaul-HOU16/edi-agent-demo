# Task 10: Collection Context Badge - Manual Test Guide

## Overview
This guide provides step-by-step instructions to manually test the Collection Context Badge feature in the canvas interface.

## Prerequisites
- Sandbox environment deployed with latest changes
- At least one collection created with data items
- At least one canvas linked to a collection

## Test Scenarios

### Scenario 1: Badge Display for Linked Canvas

**Objective:** Verify that the collection context badge displays correctly when a canvas is linked to a collection.

**Steps:**
1. Navigate to the Data Catalog (`/catalog`)
2. Search for wells or data points
3. Create a collection with the prompt "create a collection"
4. Name the collection "Test Collection" with description "Test data for badge"
5. Add 3-5 data items to the collection
6. Create a new canvas from the collection detail page
7. Observe the canvas header area

**Expected Results:**
- ✅ A blue badge appears in the canvas header next to the canvas name
- ✅ Badge displays the collection name "Test Collection"
- ✅ Badge shows the item count in parentheses (e.g., "(5)")
- ✅ Badge has a folder icon
- ✅ Badge is visually distinct and easy to identify

### Scenario 2: Badge Tooltip/Popover

**Objective:** Verify that hovering over the badge shows detailed collection information.

**Steps:**
1. Open a canvas linked to a collection
2. Hover over the collection context badge
3. Observe the popover content

**Expected Results:**
- ✅ Popover appears below the badge
- ✅ Popover shows collection name as heading
- ✅ Popover shows collection description
- ✅ Popover displays "Data Scope: X items"
- ✅ If available, popover shows well count
- ✅ Popover includes info message: "AI queries are limited to this collection's data"
- ✅ Popover includes instruction: "Click badge to view collection details"

### Scenario 3: Badge Navigation

**Objective:** Verify that clicking the badge navigates to the collection detail page.

**Steps:**
1. Open a canvas linked to a collection
2. Click on the collection context badge
3. Observe the navigation

**Expected Results:**
- ✅ Browser navigates to `/collections/[collectionId]`
- ✅ Collection detail page loads correctly
- ✅ Collection detail page shows the correct collection
- ✅ Can navigate back to canvas using browser back button

### Scenario 4: No Badge for Unlinked Canvas

**Objective:** Verify that canvases without a linked collection do not show the badge.

**Steps:**
1. Create a new canvas from the main page (not from a collection)
2. Observe the canvas header area

**Expected Results:**
- ✅ No collection context badge appears
- ✅ Canvas header looks normal without badge
- ✅ No loading indicators or errors

### Scenario 5: Badge Loading State

**Objective:** Verify that the badge shows a loading state while fetching collection data.

**Steps:**
1. Open a canvas linked to a collection
2. Observe the badge area immediately after page load
3. Note the transition from loading to loaded state

**Expected Results:**
- ✅ Brief loading indicator appears (may be very quick)
- ✅ Loading indicator shows "Loading collection context..."
- ✅ Loading indicator transitions smoothly to badge
- ✅ No flickering or layout shifts

### Scenario 6: Badge with Different Item Counts

**Objective:** Verify that the badge correctly displays various item counts.

**Test Cases:**
- Collection with 1 item: Badge shows "(1)"
- Collection with 10 items: Badge shows "(10)"
- Collection with 100+ items: Badge shows "(100+)"

**Steps:**
1. Create collections with different numbers of items
2. Create canvases from each collection
3. Verify badge displays correct count

**Expected Results:**
- ✅ Item count is accurate
- ✅ Singular/plural formatting is correct
- ✅ Large numbers display without truncation

### Scenario 7: Badge Responsiveness

**Objective:** Verify that the badge works correctly on different screen sizes.

**Steps:**
1. Open a canvas linked to a collection
2. Resize browser window to mobile size (< 768px)
3. Resize to tablet size (768px - 1024px)
4. Resize to desktop size (> 1024px)

**Expected Results:**
- ✅ Badge remains visible at all screen sizes
- ✅ Badge text doesn't overflow or wrap awkwardly
- ✅ Popover positions correctly on all screen sizes
- ✅ Click/tap works on mobile devices

### Scenario 8: Badge with Long Collection Names

**Objective:** Verify that the badge handles long collection names gracefully.

**Steps:**
1. Create a collection with a very long name (50+ characters)
2. Create a canvas from this collection
3. Observe the badge display

**Expected Results:**
- ✅ Long names are truncated with ellipsis if needed
- ✅ Full name is visible in the popover
- ✅ Badge doesn't break layout
- ✅ Badge remains clickable

### Scenario 9: Error Handling

**Objective:** Verify that the badge handles errors gracefully.

**Steps:**
1. Open a canvas linked to a collection
2. Simulate network error (disconnect internet briefly)
3. Refresh the page
4. Observe badge behavior

**Expected Results:**
- ✅ Badge doesn't crash the page
- ✅ Error is logged to console
- ✅ Badge either shows nothing or shows error state
- ✅ Page remains functional

### Scenario 10: Badge Integration with Chat Interface

**Objective:** Verify that the badge integrates well with other chat interface elements.

**Steps:**
1. Open a canvas linked to a collection
2. Observe the badge position relative to:
   - Canvas name (EditableTextBox)
   - Agent switcher
   - File drawer button
   - Chat messages

**Expected Results:**
- ✅ Badge is positioned correctly in header
- ✅ Badge doesn't overlap other elements
- ✅ Badge maintains consistent spacing
- ✅ Badge doesn't interfere with chat functionality

## Validation Checklist

After completing all scenarios, verify:

- [ ] Badge displays correctly for linked canvases
- [ ] Badge shows accurate collection information
- [ ] Badge navigation works correctly
- [ ] Badge doesn't appear for unlinked canvases
- [ ] Badge handles loading states properly
- [ ] Badge works on all screen sizes
- [ ] Badge handles edge cases (long names, errors)
- [ ] Badge integrates well with chat interface
- [ ] No console errors related to badge
- [ ] No performance issues with badge

## Known Issues

Document any issues found during testing:

1. Issue: [Description]
   - Steps to reproduce: [Steps]
   - Expected: [Expected behavior]
   - Actual: [Actual behavior]
   - Severity: [Low/Medium/High]

## Test Results

**Date:** [Date of testing]
**Tester:** [Your name]
**Environment:** [Sandbox/Production]
**Browser:** [Browser and version]

**Overall Result:** [PASS/FAIL]

**Notes:**
[Any additional observations or comments]

## Deployment Verification

After deployment to production:

- [ ] Verify badge works in production environment
- [ ] Test with real user data
- [ ] Monitor for any errors in CloudWatch logs
- [ ] Collect user feedback on badge usability

## Success Criteria

The feature is considered complete when:

1. All test scenarios pass
2. No critical or high-severity issues found
3. Badge provides clear value to users
4. Badge doesn't negatively impact performance
5. User feedback is positive

## Next Steps

After successful testing:

1. Mark Task 10 as complete in tasks.md
2. Document any lessons learned
3. Update user documentation if needed
4. Plan for any follow-up improvements
