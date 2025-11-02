# Expandable Row Width Limitation - Cloudscape Design System

## Issue

The expanded row content in the catalog table is constrained to the first column width (50%) and does not span the full table width.

## Root Cause

**AWS Cloudscape Design System's Table component does not support colspan for expandable rows.**

This is a fundamental limitation of the component library:
- Expandable rows are implemented as child rows in the table
- Each child row still follows the parent table's column structure
- There is no built-in way to make a cell span multiple columns
- CSS workarounds are ineffective due to the component's internal structure

## Attempted Solutions

### 1. CSS Grid Approach ❌
- Tried converting expanded rows to CSS Grid layout
- Result: Broke table layout, made it worse

### 2. Absolute Positioning ❌
- Tried positioning expanded content absolutely to span full width
- Result: Content overlapped other elements, z-index issues

### 3. Hiding Other Columns ❌
- Tried hiding columns 2 and 3 for expanded rows
- Result: Layout broke, content still constrained

### 4. Custom Overlay ❌
- Tried rendering expanded content as an overlay outside table
- Result: Too complex, fragile positioning, maintenance nightmare

## Current State

The expanded content is displayed within the first column (50% width) with:
- ✅ Proper padding (16px)
- ✅ Background color (#f9f9f9)
- ✅ Rounded corners
- ✅ All content visible (with scrolling if needed)
- ❌ **NOT spanning full table width**

## Possible Solutions

### Option 1: Accept the Limitation (Recommended)
- Keep current implementation
- Design expanded content to work well within 50% width
- Use vertical layout instead of horizontal
- Ensure all content is readable and accessible

### Option 2: Use Different Table Component
- Replace Cloudscape Table with a custom table component
- Implement colspan support manually
- **Effort**: High (2-3 days)
- **Risk**: High (may break other features)

### Option 3: Use Modal/Drawer for Details
- Instead of expanding rows inline, open a modal or drawer
- Show full details in a dedicated panel
- **Effort**: Medium (1 day)
- **UX**: Different interaction pattern

### Option 4: Redesign Table Layout
- Make first column wider (e.g., 70%)
- Reduce other columns (15% each)
- More space for expanded content
- **Effort**: Low (1 hour)
- **Trade-off**: Less space for wellbore/curve counts

## Recommendation

**Accept the limitation and optimize content for 50% width.**

Reasons:
1. Cloudscape is the chosen design system for this project
2. Replacing the table component is high risk
3. The current implementation is functional
4. Content can be designed to work within the constraint

## Content Optimization for 50% Width

To make the expanded content work better within 50% width:

1. **Use Vertical Layout**
   - Stack sections vertically instead of horizontally
   - Each section takes full 50% width

2. **Compact Information Display**
   - Use smaller fonts for less critical info
   - Abbreviate labels where possible
   - Use icons to save space

3. **Scrollable Sections**
   - Make long content sections scrollable
   - Keep overall height reasonable

4. **Responsive Typography**
   - Use appropriate font sizes
   - Ensure readability at 50% width

## Related Documentation

- [Cloudscape Table Component](https://cloudscape.design/components/table/)
- [Cloudscape Expandable Rows](https://cloudscape.design/components/table/?tabId=api#expandable-rows)
- Task 3: Verify expandable row functionality

## Conclusion

This is a **known limitation** of the Cloudscape Design System, not a bug in our implementation. The expanded content will remain constrained to the first column width (50%) unless we switch to a different table component or interaction pattern.

**Status**: LIMITATION DOCUMENTED - No further action on this specific issue.
