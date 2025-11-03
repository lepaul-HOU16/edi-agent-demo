# Task 5: Collection Detail Page Navigation - Manual Testing Guide

## Overview

This guide provides step-by-step instructions for manually testing the collection detail page navigation feature.

## Prerequisites

- Application deployed and running
- User authenticated
- Collections feature enabled (feature flag)
- Collection creation enabled (feature flag)

## Test Scenarios

### Scenario 1: Successful Collection Creation and Navigation

**Objective:** Verify that creating a collection navigates to the detail page

**Steps:**
1. Navigate to Data Catalog (`/catalog`)
2. Enter a search query (e.g., "wells in Cuu Long Basin")
3. Wait for search results to display on map
4. In the chat input, type: "create a collection"
5. Verify collection creation modal opens
6. Enter collection details:
   - Name: "Test Collection Navigation"
   - Description: "Testing navigation to detail page"
7. Click "Create Collection" button
8. Observe the following:
   - Success message appears in chat
   - Message includes "Navigating to collection detail page..."
   - Page automatically redirects to `/collections/[collectionId]`
   - Collection detail page loads
   - Collection name matches what you entered
   - Well count matches search results

**Expected Results:**
- ✅ Modal opens on "create collection" prompt
- ✅ Collection creates successfully
- ✅ Success message displays
- ✅ Automatic navigation occurs
- ✅ Detail page loads with correct data
- ✅ No errors in browser console

**Failure Indicators:**
- ❌ Modal doesn't open
- ❌ Collection creation fails
- ❌ No navigation occurs
- ❌ Navigation goes to wrong page
- ❌ Detail page shows error
- ❌ Console errors present

---

### Scenario 2: Collection Detail Page Display

**Objective:** Verify all collection details display correctly

**Steps:**
1. After creating a collection (Scenario 1), verify the detail page shows:
   - Collection name in header
   - Collection description (if provided)
   - Data summary section with:
     - Well count badge
     - Data point count badge
   - Data source badge (OSDU, S3, or Mixed)
   - Created date and time
   - Last accessed date and time
   - Breadcrumb navigation
   - Action buttons:
     - "Back to Collections"
     - "Edit Collection"
     - "Duplicate"
     - "Archive"
     - "View Collection Data in Catalog"
     - "Create New Canvas from Collection"
   - Linked Canvases section (showing "coming soon" message)

**Expected Results:**
- ✅ All sections display correctly
- ✅ Data is accurate
- ✅ Dates are formatted properly
- ✅ Badges have correct colors
- ✅ Layout is responsive
- ✅ No missing or broken elements

---

### Scenario 3: Navigation from Detail Page

**Objective:** Verify navigation buttons work correctly

**Steps:**
1. On collection detail page, test each navigation option:

   **Test 3.1: Back to Collections**
   - Click "Back to Collections" button
   - Verify navigation to `/collections`
   - Verify collections list displays

   **Test 3.2: Breadcrumb Navigation**
   - Click "Collections" in breadcrumb
   - Verify navigation to `/collections`

   **Test 3.3: View Collection Data**
   - Click "View Collection Data in Catalog" button
   - Verify navigation to `/catalog`
   - (Future: Verify collection data loads)

   **Test 3.4: Create New Canvas**
   - Click "Create New Canvas from Collection" button
   - Verify navigation to `/create-new-chat`
   - (Future: Verify collection context is set)

**Expected Results:**
- ✅ All navigation buttons work
- ✅ Correct pages load
- ✅ No broken links
- ✅ Browser back button works

---

### Scenario 4: Error Handling - Missing Collection ID

**Objective:** Verify graceful handling when collection ID is missing

**Steps:**
1. This scenario requires backend modification for testing
2. Temporarily modify backend to return success without collection ID
3. Create a collection
4. Observe behavior:
   - Success message displays
   - Console shows warning: "No collection ID in response"
   - Navigation goes to `/collections` (list page)
   - User can see all collections

**Expected Results:**
- ✅ No JavaScript errors
- ✅ Warning logged to console
- ✅ Fallback navigation works
- ✅ User can find their collection in the list

---

### Scenario 5: Error Handling - Invalid Collection ID

**Objective:** Verify error display for non-existent collection

**Steps:**
1. Manually navigate to `/collections/invalid-id-12345`
2. Observe the page:
   - Loading state appears briefly
   - Error alert displays
   - Error message: "Unable to Load Collection"
   - "Back to Collections" button present
3. Click "Back to Collections" button
4. Verify navigation to collections list

**Expected Results:**
- ✅ Error state displays correctly
- ✅ User-friendly error message
- ✅ Back button works
- ✅ No console errors (except expected 404)

---

### Scenario 6: Loading State

**Objective:** Verify loading state displays during data fetch

**Steps:**
1. Navigate to a valid collection detail page
2. Observe loading state (may be brief):
   - "Loading Collection..." header
   - Loading spinner
   - "Loading collection details..." message
3. Wait for collection to load
4. Verify smooth transition to loaded state

**Expected Results:**
- ✅ Loading state displays
- ✅ Smooth transition to loaded state
- ✅ No flickering or layout shifts

---

### Scenario 7: Responsive Design

**Objective:** Verify detail page works on different screen sizes

**Steps:**
1. Open collection detail page
2. Test at different viewport sizes:
   - Desktop (1920x1080)
   - Laptop (1366x768)
   - Tablet (768x1024)
   - Mobile (375x667)
3. Verify for each size:
   - Layout adapts appropriately
   - All content is readable
   - Buttons are accessible
   - No horizontal scrolling
   - Grid layout adjusts

**Expected Results:**
- ✅ Responsive at all sizes
- ✅ Content remains accessible
- ✅ No layout breaks
- ✅ Touch targets adequate on mobile

---

### Scenario 8: Multiple Collections

**Objective:** Verify navigation works with multiple collections

**Steps:**
1. Create 3 different collections:
   - Collection A: "Basin Wells"
   - Collection B: "Production Data"
   - Collection C: "Exploration Sites"
2. For each collection:
   - Verify navigation to detail page
   - Verify correct collection displays
   - Navigate back to list
   - Verify all collections show in list
3. Click each collection from list
4. Verify correct detail page loads each time

**Expected Results:**
- ✅ Each collection navigates correctly
- ✅ No data mixing between collections
- ✅ List shows all collections
- ✅ Detail pages load correct data

---

### Scenario 9: Browser Back/Forward

**Objective:** Verify browser navigation works correctly

**Steps:**
1. Navigate: Catalog → Create Collection → Detail Page
2. Click browser back button
3. Verify: Returns to catalog (or collections list)
4. Click browser forward button
5. Verify: Returns to detail page
6. Repeat several times
7. Verify: Navigation history works correctly

**Expected Results:**
- ✅ Back button works
- ✅ Forward button works
- ✅ No navigation loops
- ✅ State preserved correctly

---

### Scenario 10: Direct URL Access

**Objective:** Verify detail page works with direct URL access

**Steps:**
1. Create a collection and note its ID
2. Copy the detail page URL (e.g., `/collections/abc-123`)
3. Open a new browser tab
4. Paste the URL and navigate
5. Verify:
   - Page loads correctly
   - Collection details display
   - All functionality works
6. Test with bookmarked URL
7. Test with shared URL (different user)

**Expected Results:**
- ✅ Direct URL access works
- ✅ Page loads correctly
- ✅ Auth protection applies
- ✅ Bookmarks work
- ✅ Shared URLs work (with auth)

---

## Performance Testing

### Load Time
- Detail page should load in < 2 seconds
- Loading state should be visible if > 500ms
- No unnecessary re-renders

### Network Requests
- Single GraphQL query for collection data
- No redundant requests
- Proper error handling for network failures

---

## Accessibility Testing

### Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Enter/Space activate buttons
- [ ] Escape closes modals (if any)
- [ ] Focus indicators visible

### Screen Reader
- [ ] Page title announced
- [ ] Headings properly structured
- [ ] Buttons have descriptive labels
- [ ] Error messages announced

### Color Contrast
- [ ] Text meets WCAG AA standards
- [ ] Badges are distinguishable
- [ ] Focus indicators visible

---

## Browser Compatibility

Test in the following browsers:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

---

## Common Issues and Solutions

### Issue: Navigation doesn't occur
**Solution:** Check browser console for errors, verify backend returns collection ID

### Issue: Detail page shows error
**Solution:** Verify collection exists in database, check backend logs

### Issue: Loading state never ends
**Solution:** Check network tab for failed requests, verify backend is responding

### Issue: Wrong collection displays
**Solution:** Verify URL parameter matches collection ID, check backend query

---

## Test Results Template

```
Test Date: _______________
Tester: _______________
Environment: _______________

Scenario 1: [ ] Pass [ ] Fail
Scenario 2: [ ] Pass [ ] Fail
Scenario 3: [ ] Pass [ ] Fail
Scenario 4: [ ] Pass [ ] Fail
Scenario 5: [ ] Pass [ ] Fail
Scenario 6: [ ] Pass [ ] Fail
Scenario 7: [ ] Pass [ ] Fail
Scenario 8: [ ] Pass [ ] Fail
Scenario 9: [ ] Pass [ ] Fail
Scenario 10: [ ] Pass [ ] Fail

Performance: [ ] Pass [ ] Fail
Accessibility: [ ] Pass [ ] Fail
Browser Compatibility: [ ] Pass [ ] Fail

Notes:
_________________________________
_________________________________
_________________________________

Overall Result: [ ] Pass [ ] Fail
```

---

## Reporting Issues

When reporting issues, include:
1. Scenario number
2. Steps to reproduce
3. Expected behavior
4. Actual behavior
5. Browser and version
6. Screenshots/videos
7. Console errors
8. Network tab information

---

## Sign-off

- [ ] All scenarios tested
- [ ] All issues documented
- [ ] Performance acceptable
- [ ] Accessibility verified
- [ ] Browser compatibility confirmed
- [ ] Ready for production

Tester Signature: _______________
Date: _______________
