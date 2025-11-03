# Collection System - User Acceptance Testing Guide

## Overview

This guide provides step-by-step instructions for validating the Collection System Completion implementation. All 12 tasks have been completed and deployed to the sandbox environment.

## Prerequisites

✅ Sandbox is deployed and running (`npx ampx sandbox`)
✅ Development server is running (`npm run dev`)
✅ You have valid AWS credentials configured
✅ You can access the application at http://localhost:3000

## Test Scenarios

### 1. Collection Pagination (Task 1)

**Objective**: Verify that collections display properly with pagination (10 per page)

**Steps**:
1. Navigate to **Data Catalog** → **View All Collections**
2. Observe the collections displayed
3. If you have more than 10 collections, verify pagination controls appear
4. Click through pages to verify all collections are visible
5. Create a new collection (see Test 2)
6. Verify the new collection appears without removing existing ones

**Expected Results**:
- ✅ Collections display in a grid layout
- ✅ Maximum 10 collections per page
- ✅ Pagination controls show current page and total pages
- ✅ New collections appear without dropping existing ones
- ✅ No array splicing issues (all collections preserved)

**Pass/Fail**: ⬜

---

### 2. Modal Responsiveness (Task 2)

**Objective**: Verify collection creation modal is properly sized and responsive

**Steps**:
1. Navigate to **Data Catalog** (map view)
2. Filter or search for data (e.g., wells in a specific area)
3. In the chat, type: "create a collection"
4. Observe the modal that appears

**Expected Results**:
- ✅ Modal is 60% of browser width (not full width)
- ✅ Modal is centered horizontally
- ✅ Modal has 100px margin from top of viewport
- ✅ Modal has 100px margin from bottom of viewport
- ✅ Modal content scrolls if needed (doesn't overflow viewport)

**Responsive Test**:
1. Resize browser to fullscreen
2. Verify modal maintains 60% width
3. Resize browser to smaller size
4. Verify modal adjusts appropriately

**Pass/Fail**: ⬜

---

### 3. Navigation Integration (Task 3)

**Objective**: Verify new navigation menu items work correctly

**Steps**:
1. Click **Data Catalog** in top navigation
2. Verify "View All Collections" menu item appears
3. Click "View All Collections"
4. Verify you navigate to `/collections` page

5. Click **Workspace** in top navigation
6. Verify "View All Canvases" menu item appears
7. Click "View All Canvases"
8. Verify you navigate to `/canvases` page

**Expected Results**:
- ✅ "View All Collections" appears in Data Catalog menu
- ✅ Clicking it navigates to collections page
- ✅ "View All Canvases" appears in Workspace menu
- ✅ Clicking it navigates to canvases page
- ✅ Both pages load without errors

**Pass/Fail**: ⬜

---

### 4. Canvas List Page (Task 4)

**Objective**: Verify the new "View All Canvases" page works correctly

**Steps**:
1. Navigate to **Workspace** → **View All Canvases**
2. Observe the canvases displayed
3. Check for collection filter dropdown at top
4. Select "All Collections" in dropdown
5. Verify all canvases display
6. If you have collections, select a specific collection
7. Verify only canvases linked to that collection display
8. If you have more than 25 canvases, verify pagination

**Expected Results**:
- ✅ Canvases display in card format (similar to /listChats)
- ✅ Collection filter dropdown appears
- ✅ "All Collections" option shows all canvases
- ✅ Selecting a collection filters canvases correctly
- ✅ Pagination shows 25 canvases per page
- ✅ Canvas cards show name, creation date, and linked collection

**Pass/Fail**: ⬜

---

### 5. Collection Detail Page Navigation (Task 5)

**Objective**: Verify navigation to collection detail page after creation

**Steps**:
1. Navigate to **Data Catalog**
2. Filter for some data
3. Type in chat: "create a collection"
4. Fill in collection name and description
5. Click "Create Collection"
6. Observe what happens after creation

**Expected Results**:
- ✅ After creation, you are automatically navigated to the collection detail page
- ✅ URL changes to `/collections/[collectionId]`
- ✅ Collection detail page displays the newly created collection
- ✅ Collection data items are visible

**Pass/Fail**: ⬜

---

### 6. Collection Detail Canvas Display (Task 6)

**Objective**: Verify collection detail page shows linked canvases

**Steps**:
1. Navigate to a collection detail page (from Test 5 or via "View All Collections")
2. Scroll down to see canvases section
3. Observe canvases linked to this collection
4. If you have more than 25 linked canvases, verify pagination
5. Click "Create New Canvas" button
6. Verify a new canvas is created and you navigate to it

**Expected Results**:
- ✅ Collection detail page shows linked canvases section
- ✅ Canvases display in card format
- ✅ Pagination shows 25 canvases per page
- ✅ "Create New Canvas" button appears
- ✅ Clicking it creates a canvas linked to the collection
- ✅ You navigate to the new canvas immediately

**Pass/Fail**: ⬜

---

### 7. Data Context Inheritance (Task 7)

**Objective**: Verify canvases inherit collection data context

**Steps**:
1. Create a collection with specific data items (e.g., 3 wells)
2. From the collection detail page, click "Create New Canvas"
3. In the new canvas, verify the collection context is set
4. Ask the AI a question about the data (e.g., "analyze these wells")
5. Verify the AI only accesses data from the collection

**Expected Results**:
- ✅ Canvas is linked to the collection (check `linkedCollectionId`)
- ✅ Collection context is loaded and cached
- ✅ AI agent respects data context limits
- ✅ AI only analyzes data from the collection

**Pass/Fail**: ⬜

---

### 8. Data Access Approval Flow (Task 8)

**Objective**: Verify data access violation detection and approval

**Steps**:
1. Create a canvas from a collection (with limited data)
2. Ask the AI to analyze data outside the collection scope
3. Observe if approval prompt appears
4. Type "approve" to grant expanded access
5. Verify the AI can now access additional data
6. Check that approval is logged

**Expected Results**:
- ✅ AI detects when query requires out-of-scope data
- ✅ Approval prompt message appears in chat
- ✅ User can approve by typing "approve"
- ✅ After approval, AI can access expanded data
- ✅ Approval is logged in `dataAccessLog`

**Pass/Fail**: ⬜

---

### 9. GraphQL Schema Updates (Task 9)

**Objective**: Verify schema changes are deployed correctly

**Steps**:
1. Open browser developer tools → Network tab
2. Create a new canvas from a collection
3. Observe the GraphQL mutation request
4. Verify `linkedCollectionId` is included in the request
5. Check the response includes `collectionContext` and `dataAccessLog`

**Expected Results**:
- ✅ `linkedCollectionId` field exists in ChatSession model
- ✅ `collectionContext` field exists in ChatSession model
- ✅ `dataAccessLog` field exists in ChatSession model
- ✅ Fields are properly saved and retrieved

**Pass/Fail**: ⬜

---

### 10. Collection Context Badge (Task 10)

**Objective**: Verify collection context badge displays in canvas

**Steps**:
1. Open a canvas that is linked to a collection
2. Look for a collection badge/indicator in the chat interface
3. Verify it shows the collection name
4. Click on the badge
5. Verify you navigate to the collection detail page

**Expected Results**:
- ✅ Collection badge appears in canvas interface
- ✅ Badge shows collection name and data scope
- ✅ Badge is clickable
- ✅ Clicking badge navigates to collection detail page
- ✅ Tooltip shows data scope information

**Pass/Fail**: ⬜

---

### 11. /listChats Redirect (Task 11)

**Status**: ⚠️ **DEPRECATED** - This feature was not implemented

**Note**: The /listChats page remains as-is. The new "View All Canvases" page provides the enhanced functionality without replacing /listChats.

**Pass/Fail**: N/A (Deprecated)

---

### 12. Comprehensive Testing (Task 12)

**Objective**: Verify all tests pass

**Steps**:
1. Run the validation script: `node tests/validate-collection-system.js`
2. Verify all tests pass
3. Run unit tests: `npm test -- tests/unit/test-collection`
4. Run integration tests: `npm test -- tests/integration/test-collection`
5. Run E2E tests: `npm test -- tests/e2e/test-collection`

**Expected Results**:
- ✅ Validation script shows 22/22 tests passed
- ✅ Unit tests pass
- ✅ Integration tests pass
- ✅ E2E tests pass
- ✅ No regressions in existing functionality

**Pass/Fail**: ⬜

---

## Complete User Workflow Test

**Objective**: Test the entire collection system end-to-end

**Steps**:
1. **Discovery**: Navigate to Data Catalog
2. **Filter**: Search for wells in a specific area
3. **Create Collection**: Type "create a collection" in chat
4. **Configure**: Fill in name, description, deselect unwanted items
5. **Navigate**: Verify you navigate to collection detail page
6. **Create Canvas**: Click "Create New Canvas" from collection
7. **Verify Context**: Check collection badge appears in canvas
8. **Query AI**: Ask AI to analyze the collection data
9. **Test Limits**: Try to query data outside collection scope
10. **Approve Access**: If prompted, approve expanded access
11. **Navigate Back**: Click collection badge to return to collection
12. **View All**: Navigate to "View All Collections"
13. **Pagination**: Verify pagination works with multiple collections
14. **View Canvases**: Navigate to "View All Canvases"
15. **Filter**: Filter canvases by collection

**Expected Results**:
- ✅ Complete workflow works without errors
- ✅ All navigation works correctly
- ✅ Data context is properly enforced
- ✅ Pagination works throughout
- ✅ Modal is responsive and properly sized
- ✅ No console errors
- ✅ No page reloads required

**Pass/Fail**: ⬜

---

## Regression Testing

**Objective**: Verify no existing functionality was broken

**Critical Features to Test**:
1. ✅ Chat interface still works
2. ✅ Data catalog map still works
3. ✅ Well data discovery still works
4. ✅ Petrophysical analysis still works
5. ✅ Renewable energy features still work
6. ✅ EDIcraft agent still works
7. ✅ File uploads still work
8. ✅ Report generation still works

**Pass/Fail**: ⬜

---

## Sign-Off

### Automated Tests
- ✅ Validation script: **PASSED** (22/22 tests)
- ⬜ Unit tests: _____
- ⬜ Integration tests: _____
- ⬜ E2E tests: _____

### Manual Tests
- ⬜ Collection pagination: _____
- ⬜ Modal responsiveness: _____
- ⬜ Navigation integration: _____
- ⬜ Canvas list page: _____
- ⬜ Collection detail navigation: _____
- ⬜ Canvas display in collection: _____
- ⬜ Data context inheritance: _____
- ⬜ Data access approval: _____
- ⬜ Collection context badge: _____
- ⬜ Complete workflow: _____
- ⬜ Regression testing: _____

### Overall Assessment

**All Tests Passed**: ⬜ YES / ⬜ NO

**Issues Found**:
- _____________________________________
- _____________________________________
- _____________________________________

**User Sign-Off**: ⬜

**Date**: _____________________

**Tester Name**: _____________________

---

## Troubleshooting

### Modal Not Appearing
- Check browser console for errors
- Verify chat message contains "create a collection"
- Check that data is filtered/selected in catalog

### Pagination Not Working
- Verify you have more than 10 collections (or 25 canvases)
- Check browser console for errors
- Verify pagination controls appear at bottom

### Navigation Links Missing
- Clear browser cache and reload
- Verify sandbox is deployed
- Check `src/app/layout.tsx` for menu items

### Collection Context Not Working
- Verify canvas has `linkedCollectionId` set
- Check browser console for context loading errors
- Verify collection service Lambda is deployed

### Data Access Approval Not Triggering
- Verify canvas is linked to a collection
- Try querying data explicitly outside collection scope
- Check agent handler logs in CloudWatch

---

## Support

If you encounter issues during testing:

1. **Check CloudWatch Logs**:
   ```bash
   aws logs tail /aws/lambda/[function-name] --follow
   ```

2. **Check Browser Console**: Look for JavaScript errors

3. **Verify Deployment**:
   ```bash
   node tests/validate-collection-system.js
   ```

4. **Check Sandbox Status**: Ensure sandbox is running and deployed

5. **Review Documentation**: See `.kiro/specs/collection-system-completion/` for requirements and design

---

## Next Steps After Sign-Off

Once all tests pass and user signs off:

1. ✅ Mark task 13.3 as complete
2. ✅ Mark task 13 as complete
3. ✅ Update project documentation
4. ✅ Consider production deployment
5. ✅ Plan for future enhancements

---

**End of User Acceptance Testing Guide**
