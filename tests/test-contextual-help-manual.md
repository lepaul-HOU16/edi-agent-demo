# Manual Testing Guide: OSDU Query Builder Contextual Help

## Overview
This guide provides step-by-step instructions for manually testing the contextual help features implemented in Task 12.

## Prerequisites
- OSDU Query Builder accessible in catalog chat interface
- Browser with developer tools (for inspecting tooltips)
- Test on both desktop and mobile viewports

---

## Test 1: Tooltip Help for Fields

### Steps:
1. Open the OSDU Query Builder in the catalog chat
2. Click "Add Criterion" to add a filter criterion
3. Hover over the "Field" label (look for the info icon next to it)
4. Verify tooltip appears with:
   - Field description
   - Help text explaining the field's purpose
   - Examples of valid values

### Expected Results:
✅ Tooltip appears on hover  
✅ Tooltip contains field description  
✅ Tooltip contains help text  
✅ Tooltip contains 2-4 examples  
✅ Tooltip is readable and well-formatted  

### Test Multiple Fields:
- [ ] data.operator (should show company examples)
- [ ] data.country (should show country examples)
- [ ] data.depth (should show numeric examples)
- [ ] data.wellName (should show wildcard examples)
- [ ] data.status (should show status examples)

---

## Test 2: Tooltip Help for Operators

### Steps:
1. In an existing criterion, hover over the "Operator" label
2. Verify tooltip appears with:
   - Operator description
   - Help text explaining how the operator works
   - Usage examples with actual OSDU query syntax

### Expected Results:
✅ Tooltip appears on hover  
✅ Tooltip contains operator description  
✅ Tooltip contains help text  
✅ Tooltip contains usage examples in code format  
✅ Examples show real OSDU query syntax  

### Test Multiple Operators:
- [ ] Equals (=) - should show exact match example
- [ ] LIKE - should show wildcard examples
- [ ] BETWEEN - should show range example
- [ ] IN - should show list example
- [ ] Greater Than (>) - should show comparison example

---

## Test 3: Help Button and Documentation Modal

### Steps:
1. Look for the help button (info icon) in the top-right of the query builder
2. Click the help button
3. Verify the help modal opens with comprehensive documentation

### Expected Results:
✅ Help button is visible and accessible  
✅ Help button uses info icon  
✅ Modal opens when button is clicked  
✅ Modal is large and readable  
✅ Modal has "Close" button  

### Verify Modal Sections:
- [ ] **Overview** - Explains what the query builder does
- [ ] **Getting Started** - 4-step guide for beginners
- [ ] **Understanding Field Types** - String, Number, Date explanations
- [ ] **Operator Reference** - All operator types documented
- [ ] **Combining Multiple Criteria** - AND/OR logic examples
- [ ] **Troubleshooting Common Errors** - 6 common error solutions
- [ ] **Tips and Tricks** - 5+ helpful tips
- [ ] **OSDU Query Syntax Reference** - 7 query examples
- [ ] **Need More Help?** - Additional guidance

---

## Test 4: Guided Help for Multiple Errors

### Steps:
1. Add 3 or more criteria to the query builder
2. Leave all value fields empty (to trigger validation errors)
3. Observe the validation alert at the top

### Expected Results:
✅ Alert changes from warning to error type  
✅ Alert shows error count (e.g., "Your query has 3 errors")  
✅ Alert lists common causes  
✅ Alert provides "Quick Fix" instructions  
✅ Alert has "Get Help" button  
✅ Clicking "Get Help" opens the full documentation modal  

### Test Scenarios:
- [ ] 1-2 errors: Shows standard warning alert
- [ ] 3+ errors: Shows enhanced error alert with guided help
- [ ] Click "Get Help" button: Opens help modal

---

## Test 5: Field-Specific Help Content

### Steps:
1. For each data type (Well, Wellbore, Log, Seismic), verify field help:

#### Well Fields:
- [ ] Operator - mentions operating company
- [ ] Country - mentions geographic location
- [ ] Basin - mentions geological basin
- [ ] Well Name - mentions wildcards
- [ ] Depth - mentions meters and ranges
- [ ] Status - mentions Active/Inactive/Abandoned
- [ ] Well Type - mentions Production/Exploration

#### Wellbore Fields:
- [ ] Wellbore Name - mentions unique identifier
- [ ] Wellbore Type - mentions Vertical/Horizontal
- [ ] Measured Depth - mentions wellbore path
- [ ] True Vertical Depth - mentions straight-line depth

#### Log Fields:
- [ ] Log Type - mentions Gamma Ray/Resistivity
- [ ] Log Name - mentions identifier
- [ ] Curve Count - mentions number of curves
- [ ] Top Depth - mentions shallowest depth
- [ ] Bottom Depth - mentions deepest depth

#### Seismic Fields:
- [ ] Survey Name - mentions identifier
- [ ] Survey Type - mentions 2D/3D/4D
- [ ] Acquisition Date - mentions YYYY-MM-DD format

---

## Test 6: Operator-Specific Help Content

### String Operators:
- [ ] Equals (=) - exact match, case-sensitive
- [ ] Not Equals (!=) - does not match
- [ ] LIKE - wildcards * and ?
- [ ] NOT LIKE - excludes patterns
- [ ] IN - comma-separated list
- [ ] NOT IN - excludes list values

### Number Operators:
- [ ] Equals (=) - exact value
- [ ] Not Equals (!=) - different value
- [ ] Greater Than (>) - larger than
- [ ] Less Than (<) - smaller than
- [ ] Greater or Equal (>=) - larger or equal
- [ ] Less or Equal (<=) - smaller or equal
- [ ] BETWEEN - range with two values

### Date Operators:
- [ ] On Date (=) - exact date
- [ ] After (>) - later than
- [ ] Before (<) - earlier than
- [ ] On or After (>=) - on or later
- [ ] On or Before (<=) - on or earlier
- [ ] Between Dates - date range

---

## Test 7: Help Modal Content Quality

### Overview Section:
- [ ] Explains query builder purpose
- [ ] Lists key benefits (4 items)
- [ ] Clear and concise

### Getting Started Section:
- [ ] Step 1: Choose starting point (template or scratch)
- [ ] Step 2: Select data type
- [ ] Step 3: Add filter criteria (3 parts explained)
- [ ] Step 4: Review and execute
- [ ] Steps are actionable and clear

### Troubleshooting Section:
- [ ] "Value is required" - solution provided
- [ ] "Must be a valid number" - solution provided
- [ ] "Date must be in YYYY-MM-DD format" - solution provided
- [ ] "BETWEEN requires exactly two values" - solution provided
- [ ] "Use comma to separate multiple values" - solution provided
- [ ] "First value must be less than second value" - solution provided

### Tips and Tricks Section:
- [ ] Use Autocomplete tip
- [ ] Save Frequently Used Queries tip
- [ ] Check Query History tip
- [ ] Use Wildcards tip
- [ ] Copy Queries tip
- [ ] Keyboard Shortcuts (desktop only)

### Query Syntax Reference:
- [ ] Basic query example
- [ ] Multiple criteria with AND
- [ ] Multiple criteria with OR
- [ ] Numeric comparison
- [ ] Pattern matching with wildcards
- [ ] List matching
- [ ] Range query
- [ ] Complex query with grouping

---

## Test 8: Mobile Responsiveness

### Steps:
1. Resize browser to mobile viewport (< 768px)
2. Open query builder
3. Test help features on mobile

### Expected Results:
✅ Help button remains accessible  
✅ Tooltips work on mobile (tap to show)  
✅ Help modal is readable on small screen  
✅ Modal content scrolls properly  
✅ Keyboard shortcuts section hidden on mobile  
✅ All sections remain accessible  

---

## Test 9: Accessibility

### Steps:
1. Use keyboard navigation to access help features
2. Use screen reader to test tooltip content
3. Verify color contrast for help text

### Expected Results:
✅ Help button is keyboard accessible (Tab to focus)  
✅ Tooltips are accessible via keyboard  
✅ Help modal can be closed with Escape key  
✅ Screen reader announces tooltip content  
✅ Color contrast meets WCAG AA standards  
✅ Focus indicators are visible  

---

## Test 10: Error-Triggered Help

### Scenario 1: Empty Values
1. Add 3 criteria
2. Leave all values empty
3. Verify guided help appears

### Scenario 2: Invalid Number
1. Add criterion with numeric field (e.g., depth)
2. Enter text instead of number
3. Verify error message and tooltip help

### Scenario 3: Invalid Date Format
1. Add criterion with date field
2. Enter date in wrong format (e.g., 01/15/2023)
3. Verify error message and help tooltip

### Scenario 4: BETWEEN Operator
1. Add criterion with BETWEEN operator
2. Enter only one value
3. Verify error message explains need for two values

### Expected Results:
✅ Each error type shows specific help message  
✅ Error messages are actionable  
✅ Tooltips provide examples of correct format  
✅ Guided help appears for 3+ errors  

---

## Test 11: Help Content Accuracy

### Verify Examples:
- [ ] All field examples are realistic and valid
- [ ] All operator examples use correct OSDU syntax
- [ ] All query syntax examples are executable
- [ ] Wildcard examples (* and ?) are correct
- [ ] Date format examples use YYYY-MM-DD
- [ ] Number examples are reasonable values

### Verify Descriptions:
- [ ] Field descriptions match OSDU data model
- [ ] Operator descriptions are technically accurate
- [ ] Help text is clear and jargon-free
- [ ] Examples match the described functionality

---

## Test 12: Integration with Existing Features

### Template Integration:
1. Select a template
2. Hover over pre-filled field labels
3. Verify tooltips show relevant help

### Query History Integration:
1. Load a query from history
2. Hover over field labels
3. Verify tooltips work for loaded queries

### Validation Integration:
1. Create invalid query
2. Verify error messages match help documentation
3. Click "Get Help" from error alert
4. Verify help modal opens to relevant section

---

## Success Criteria

### All Tests Must Pass:
- ✅ All tooltips display correctly
- ✅ All help content is accurate and helpful
- ✅ Help modal is comprehensive and well-organized
- ✅ Guided help appears for multiple errors
- ✅ Mobile experience is fully functional
- ✅ Accessibility requirements are met
- ✅ Help integrates seamlessly with existing features

### User Experience Goals:
- Users can find help without leaving the query builder
- Help content answers common questions
- Examples are practical and realistic
- Error messages guide users to solutions
- Help is progressive (tooltips → modal → guided help)

---

## Reporting Issues

If any test fails, document:
1. Test number and name
2. Steps to reproduce
3. Expected result
4. Actual result
5. Screenshots (if applicable)
6. Browser and viewport size

---

## Notes

- Test on multiple browsers (Chrome, Firefox, Safari, Edge)
- Test on actual mobile devices, not just browser emulation
- Verify help content with domain experts for accuracy
- Collect user feedback on help usefulness
- Update help content based on common user questions

