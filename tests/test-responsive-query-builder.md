# Responsive Query Builder - Manual Testing Guide

## Task 11: Responsive Design Implementation

This guide validates the responsive design features added to the OSDU Query Builder.

## Test Environment Setup

1. Open the catalog page with query builder
2. Have browser DevTools open (F12)
3. Enable device toolbar (Ctrl+Shift+M / Cmd+Shift+M)

---

## Test 11.1: Mobile-Friendly Layout

### Test Case 1: Responsive Breakpoint Detection
**Steps:**
1. Start with desktop viewport (1920x1080)
2. Resize to tablet (768x1024)
3. Resize to mobile (375x667)

**Expected Results:**
- ✅ Layout switches from multi-column to stacked at 768px breakpoint
- ✅ Advanced options auto-collapse on mobile
- ✅ No horizontal scrolling on any viewport size

### Test Case 2: Stacked Fields on Mobile
**Steps:**
1. Set viewport to mobile (375x667)
2. Add a filter criterion
3. Observe field layout

**Expected Results:**
- ✅ Field selector takes full width (12 columns)
- ✅ Operator selector takes full width (12 columns)
- ✅ Value input takes full width (12 columns)
- ✅ Actions section takes full width (12 columns)
- ✅ All fields are vertically stacked

### Test Case 3: Native Mobile Controls
**Steps:**
1. Set viewport to mobile (375x667)
2. Add criterion with number field (e.g., Depth)
3. Add criterion with date field (e.g., Acquisition Date)
4. Click on value inputs

**Expected Results:**
- ✅ Number field shows numeric keyboard (inputMode="numeric")
- ✅ Date field shows native date picker (type="date")
- ✅ Text fields show standard keyboard

### Test Case 4: Touch-Friendly Tap Targets
**Steps:**
1. Set viewport to mobile (375x667)
2. Measure button heights using DevTools
3. Try tapping all interactive elements

**Expected Results:**
- ✅ All buttons have minimum 44px height
- ✅ Template buttons are touch-friendly (minHeight: 44px)
- ✅ History buttons are touch-friendly (minHeight: 44px)
- ✅ Execute/Copy buttons are touch-friendly (minHeight: 44px)
- ✅ Remove button shows text "Remove" instead of icon-only
- ✅ All buttons have fontSize: 16px on mobile (prevents zoom)

### Test Case 5: Template Dropdown on Mobile
**Steps:**
1. Set viewport to mobile (375x667)
2. Open Quick Start Templates dropdown
3. Select a template

**Expected Results:**
- ✅ Dropdown replaced tabs (no horizontal scrolling)
- ✅ Template descriptions visible in dropdown
- ✅ Filtering works with filteringType="auto"
- ✅ Template applies correctly

### Test Case 6: Responsive Grid Layout
**Steps:**
1. Set viewport to desktop (1920x1080)
2. Observe Template/History/Save buttons
3. Resize to mobile (375x667)
4. Observe same buttons

**Expected Results:**
- ✅ Desktop: 3 columns (4-4-4 grid)
- ✅ Mobile: 1 column (12-12-12 grid)
- ✅ Buttons stack vertically on mobile
- ✅ Full width buttons on mobile

---

## Test 11.2: Collapsible Sections

### Test Case 1: Advanced Options Collapsible
**Steps:**
1. Set viewport to mobile (375x667)
2. Observe Advanced Options section
3. Click to expand/collapse

**Expected Results:**
- ✅ Advanced Options section is collapsed by default on mobile
- ✅ Section shows "Templates, history, and save options" description
- ✅ Section uses "container" variant on mobile
- ✅ Clicking expands to show all options
- ✅ Templates, History, and Save buttons visible when expanded

### Test Case 2: Desktop Advanced Options
**Steps:**
1. Set viewport to desktop (1920x1080)
2. Observe Advanced Options section

**Expected Results:**
- ✅ Advanced Options section is expanded by default on desktop
- ✅ Section uses "default" variant on desktop
- ✅ No description shown on desktop
- ✅ All options immediately visible

### Test Case 3: Keyboard Shortcuts Section (Desktop Only)
**Steps:**
1. Set viewport to desktop (1920x1080)
2. Scroll to Query Preview section
3. Look for Keyboard Shortcuts expandable section

**Expected Results:**
- ✅ Keyboard Shortcuts section visible on desktop
- ✅ Shows: Ctrl/Cmd + Enter (Execute query)
- ✅ Shows: Ctrl/Cmd + N (Add new criterion)
- ✅ Shows: Ctrl/Cmd + H (Toggle query history)
- ✅ Section uses "footer" variant

### Test Case 4: Keyboard Shortcuts Hidden on Mobile
**Steps:**
1. Set viewport to mobile (375x667)
2. Scroll to Query Preview section
3. Look for Keyboard Shortcuts section

**Expected Results:**
- ✅ Keyboard Shortcuts section NOT visible on mobile
- ✅ No keyboard shortcut hints shown on mobile

### Test Case 5: Keyboard Shortcut Functionality (Desktop)
**Steps:**
1. Set viewport to desktop (1920x1080)
2. Add valid criteria to make query valid
3. Press Ctrl+Enter (Cmd+Enter on Mac)
4. Press Ctrl+N (Cmd+N on Mac)
5. Press Ctrl+H (Cmd+H on Mac)

**Expected Results:**
- ✅ Ctrl+Enter executes the query (if valid)
- ✅ Ctrl+N adds a new criterion (if < 10 criteria)
- ✅ Ctrl+H toggles query history panel
- ✅ Shortcuts only work on desktop (not mobile)

### Test Case 6: Responsive Query Preview
**Steps:**
1. Set viewport to desktop (1920x1080)
2. Add criteria and observe query preview
3. Resize to mobile (375x667)
4. Observe query preview

**Expected Results:**
- ✅ Query preview code block wraps properly on mobile
- ✅ Syntax highlighting works on all viewport sizes
- ✅ Copy/Execute buttons stack vertically on mobile
- ✅ Copy/Execute buttons are side-by-side on desktop

---

## Test 11.3: Responsive Descriptions

### Test Case 1: Field Descriptions on Mobile
**Steps:**
1. Set viewport to mobile (375x667)
2. Add a criterion
3. Observe field descriptions

**Expected Results:**
- ✅ Field descriptions hidden on mobile (saves space)
- ✅ Operator descriptions hidden on mobile
- ✅ Value input descriptions hidden on mobile
- ✅ Only error messages shown when invalid

### Test Case 2: Field Descriptions on Desktop
**Steps:**
1. Set viewport to desktop (1920x1080)
2. Add a criterion
3. Observe field descriptions

**Expected Results:**
- ✅ Field descriptions visible on desktop
- ✅ Operator descriptions visible on desktop
- ✅ Value input descriptions visible on desktop
- ✅ Helpful hints shown for each field type

---

## Test 11.4: Responsive Actions

### Test Case 1: Logic and Remove Actions on Mobile
**Steps:**
1. Set viewport to mobile (375x667)
2. Add multiple criteria
3. Observe Actions column

**Expected Results:**
- ✅ Logic selector (AND/OR) takes full width
- ✅ Remove button shows text "Remove" (not icon-only)
- ✅ Remove button is full width
- ✅ Actions stack vertically (direction="vertical")
- ✅ Remove button has minHeight: 44px

### Test Case 2: Logic and Remove Actions on Desktop
**Steps:**
1. Set viewport to desktop (1920x1080)
2. Add multiple criteria
3. Observe Actions column

**Expected Results:**
- ✅ Logic selector and Remove button side-by-side
- ✅ Remove button is icon-only (no text)
- ✅ Actions arranged horizontally (direction="horizontal")
- ✅ Compact layout saves space

---

## Test 11.5: Viewport Transitions

### Test Case 1: Smooth Resize Behavior
**Steps:**
1. Start at desktop (1920x1080)
2. Slowly resize to mobile (375x667)
3. Observe layout changes

**Expected Results:**
- ✅ Layout transitions smoothly at 768px breakpoint
- ✅ No layout jumps or flashing
- ✅ All content remains accessible during resize
- ✅ No horizontal scrolling at any size

### Test Case 2: State Preservation During Resize
**Steps:**
1. Set viewport to desktop (1920x1080)
2. Add 3 criteria with values
3. Expand Advanced Options
4. Resize to mobile (375x667)
5. Resize back to desktop

**Expected Results:**
- ✅ All criteria preserved during resize
- ✅ All values preserved during resize
- ✅ Query preview updates correctly
- ✅ Validation state preserved
- ✅ Advanced Options state preserved

---

## Test 11.6: Accessibility on Mobile

### Test Case 1: Touch Target Sizes
**Steps:**
1. Set viewport to mobile (375x667)
2. Use DevTools to measure all interactive elements
3. Try tapping with finger (if on real device)

**Expected Results:**
- ✅ All buttons ≥ 44px height
- ✅ All select dropdowns ≥ 44px height
- ✅ All input fields ≥ 44px height
- ✅ Adequate spacing between tap targets (≥ 8px)

### Test Case 2: Font Sizes on Mobile
**Steps:**
1. Set viewport to mobile (375x667)
2. Observe all text elements
3. Check for browser zoom on input focus

**Expected Results:**
- ✅ Button text is 16px (prevents iOS zoom)
- ✅ Input text is 16px (prevents iOS zoom)
- ✅ No unwanted zoom when focusing inputs
- ✅ All text remains readable

---

## Success Criteria

All tests must pass for Task 11 to be considered complete:

### 11.1 Mobile-Friendly Layout
- ✅ Responsive layout with stacked fields on mobile
- ✅ Native mobile controls for dates and numbers
- ✅ Minimum 44px tap targets for touch devices

### 11.2 Collapsible Sections
- ✅ Advanced options collapsed on small screens
- ✅ Expandable sections for complex features
- ✅ Keyboard shortcuts supported on desktop

---

## Known Issues / Notes

1. **iOS Safari**: Date inputs may render differently than Android
2. **Keyboard Shortcuts**: Only work on desktop (intentionally disabled on mobile)
3. **Advanced Options**: Auto-collapse on mobile for better UX
4. **Template Selector**: Changed from tabs to dropdown for mobile compatibility

---

## Testing Checklist

- [ ] Test on Chrome Desktop (1920x1080)
- [ ] Test on Chrome Mobile Emulator (375x667)
- [ ] Test on Firefox Desktop
- [ ] Test on Firefox Mobile Emulator
- [ ] Test on Safari Desktop (if available)
- [ ] Test on Safari iOS (if available)
- [ ] Test on actual mobile device (if available)
- [ ] Test all viewport sizes (375px to 1920px)
- [ ] Test landscape and portrait orientations
- [ ] Test keyboard shortcuts on desktop
- [ ] Test touch interactions on mobile

---

## Validation Complete

Date: _____________
Tester: _____________
Result: ✅ PASS / ❌ FAIL

Notes:
