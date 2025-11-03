# Collection Creation Modal Responsive Behavior Test

## Test Objective
Verify that the CollectionCreationModal component displays with proper responsive sizing across different viewport sizes.

## Prerequisites
- Application running locally or in sandbox
- Access to catalog page or collections page
- Browser developer tools available

## Test Cases

### Test 1: Desktop View (60% Width)
**Steps:**
1. Open browser to full screen (> 1024px width)
2. Navigate to `/catalog` page
3. Perform a search query (e.g., "show me all wells")
4. Type "create a collection" in the chat
5. Modal should open

**Expected Results:**
- ✅ Modal width is 60% of viewport width
- ✅ Modal is centered horizontally
- ✅ Modal has 100px margin from top of viewport
- ✅ Modal has 100px margin from bottom of viewport
- ✅ Modal max height is calc(100vh - 200px)
- ✅ Modal content scrolls if it exceeds max height

**Validation:**
```javascript
// In browser console:
const modal = document.querySelector('.collection-modal-container .awsui-modal-container');
console.log('Width:', modal.style.width); // Should be 60vw
console.log('Max Height:', modal.style.maxHeight); // Should be calc(100vh - 200px)
console.log('Margin Top:', modal.style.marginTop); // Should be 100px
```

### Test 2: Tablet View (75% Width)
**Steps:**
1. Resize browser window to 800px width
2. Navigate to `/catalog` page
3. Perform a search query
4. Type "create a collection" in the chat
5. Modal should open

**Expected Results:**
- ✅ Modal width is 75% of viewport width (responsive breakpoint)
- ✅ Modal is centered horizontally
- ✅ Modal maintains 100px top/bottom margins
- ✅ Content is readable and properly formatted

### Test 3: Mobile View (90% Width)
**Steps:**
1. Resize browser window to 375px width (mobile size)
2. Navigate to `/catalog` page
3. Perform a search query
4. Type "create a collection" in the chat
5. Modal should open

**Expected Results:**
- ✅ Modal width is 90% of viewport width
- ✅ Modal is centered horizontally
- ✅ Modal maintains 100px top/bottom margins
- ✅ Form fields stack vertically
- ✅ Buttons are properly sized for mobile
- ✅ Content is readable without horizontal scroll

### Test 4: Collections Page Modal
**Steps:**
1. Navigate to `/collections` page
2. Click "Create New Collection" button
3. Modal should open

**Expected Results:**
- ✅ Same responsive behavior as catalog modal
- ✅ 60% width on desktop
- ✅ 90% width on mobile
- ✅ Proper centering and margins
- ✅ No item selection table (simpler version)

### Test 5: Fullscreen Mode
**Steps:**
1. Open browser in fullscreen mode (F11)
2. Navigate to `/catalog` page
3. Perform a search query
4. Type "create a collection" in the chat
5. Modal should open

**Expected Results:**
- ✅ Modal width is 60% of fullscreen viewport
- ✅ Modal is properly centered
- ✅ Modal is not too wide (comfortable reading width)
- ✅ 100px margins prevent modal from touching edges
- ✅ Content is easily readable

### Test 6: Modal Content Overflow
**Steps:**
1. Open modal on catalog page with many data items
2. Observe scrolling behavior

**Expected Results:**
- ✅ Modal content scrolls vertically when exceeding max height
- ✅ Modal header and footer remain fixed
- ✅ Scroll is smooth and responsive
- ✅ No horizontal scroll appears

### Test 7: Form Interaction
**Steps:**
1. Open modal
2. Enter collection name
3. Enter description
4. Select/deselect data items (if applicable)
5. Click Create Collection

**Expected Results:**
- ✅ All form fields are accessible
- ✅ Inputs respond to user interaction
- ✅ Create button enables when name is provided
- ✅ Create button shows loading state
- ✅ Modal closes on successful creation

## Browser Compatibility
Test on:
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari

## Responsive Breakpoints
- **Desktop**: > 1024px → 60% width
- **Tablet**: 769px - 1024px → 75% width
- **Mobile**: < 768px → 90% width

## CSS Validation
The modal should have these CSS properties applied:

```css
.collection-modal-container .awsui-modal-container {
  width: 60vw !important;
  max-width: 60vw !important;
  max-height: calc(100vh - 200px) !important;
  margin-top: 100px !important;
  margin-bottom: 100px !important;
}

@media (max-width: 768px) {
  .collection-modal-container .awsui-modal-container {
    width: 90vw !important;
    max-width: 90vw !important;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .collection-modal-container .awsui-modal-container {
    width: 75vw !important;
    max-width: 75vw !important;
  }
}
```

## Success Criteria
All test cases pass with expected results. Modal displays properly across all viewport sizes and provides a good user experience on desktop, tablet, and mobile devices.

## Notes
- The modal uses Cloudscape Design System components
- Responsive styling is applied via scoped CSS in the component
- The modal is reusable across catalog and collections pages
- Item selection table is optional and controlled by `showItemSelection` prop
