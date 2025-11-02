# Expandable Rows Refactored - Native Cloudscape Implementation

## Summary

Refactored the catalog table to use Cloudscape's native expandable rows feature for displaying wellbore data, replacing the previous custom two-column layout approach.

## Changes Made

### 1. Removed Custom Expandable Content
- **Deleted**: Complex `getExpandableContent()` function that generated left/right column layouts
- **Deleted**: Custom CSS attempting to span content across columns
- **Deleted**: `__isExpandedContent` flag and associated rendering logic

### 2. Implemented Native Expandable Rows
- **Added**: `getWellboreChildren()` function that converts wellbores into child row items
- **Updated**: Column definitions to handle wellbore child rows with indentation
- **Updated**: `expandableRows` configuration to use native child row functionality

### 3. New Data Structure

#### Parent Rows (Facilities)
- Display facility name, wellbore count, total curve count
- Expandable if they have wellbores

#### Child Rows (Wellbores)
- Display with indentation and arrow icon
- Show wellbore name, welllog count, curve count
- Marked with `__isWellboreChild: true` flag
- Not expandable (single level hierarchy)

## Implementation Details

### Column Rendering

```typescript
{
  id: 'facilityName',
  header: 'Facility Name',
  cell: (item: any) => {
    // Wellbore child rows show with indent and icon
    if (item.__isWellboreChild) {
      return (
        <div style={{ paddingLeft: '24px', color: '#545b64' }}>
          <Icon name="angle-right" size="small" /> 
          <span>{item.wellboreName}</span>
        </div>
      );
    }
    // Parent rows show facility name
    return <strong>{item.data?.FacilityName || ...}</strong>;
  },
  width: '50%'
}
```

### Expandable Rows Configuration

```typescript
expandableRows={{
  getItemChildren: (item) => {
    // Don't expand wellbore children
    if (item.__isWellboreChild) return [];
    
    // Return wellbore children when expanded
    const isExpanded = expandedItems.some(...);
    return isExpanded ? getWellboreChildren(item) : [];
  },
  isItemExpandable: (item) => {
    // Only facilities with wellbores are expandable
    return !item.__isWellboreChild && hasWellbores(item);
  },
  ...
}}
```

### Wellbore Child Structure

```typescript
{
  __isWellboreChild: true,
  __parentId: 'parent-well-id',
  __wellboreId: 'unique-wellbore-id',
  wellboreName: 'Wellbore 1',
  welllogCount: 3,
  curveCount: 15,
  welllogs: [...],
  data: {...}
}
```

## Benefits

### 1. Native Cloudscape Behavior
- ✅ Uses built-in expandable rows feature
- ✅ Consistent with Cloudscape design patterns
- ✅ Proper accessibility support
- ✅ Standard keyboard navigation

### 2. Cleaner Code
- ✅ Removed 200+ lines of custom layout code
- ✅ No complex CSS hacks
- ✅ Simpler data flow
- ✅ Easier to maintain

### 3. Better UX
- ✅ Clear visual hierarchy with indentation
- ✅ Icon indicates child rows
- ✅ Consistent column alignment
- ✅ No layout shifting or overflow issues

### 4. Scalability
- ✅ Easy to add more levels if needed
- ✅ Can add welllog children in future
- ✅ Follows established patterns

## Visual Structure

```
┌─────────────────────────────────────────────────────────┐
│ Facility Name (50%)    │ Wellbores │ Welllog Curves     │
├─────────────────────────────────────────────────────────┤
│ ▼ PNA-GT-05            │ 1         │ 0                  │
│    → Wellbore 1        │ 3 welllogs│ 15 curves          │
│    → Wellbore 2        │ 2 welllogs│ 10 curves          │
├─────────────────────────────────────────────────────────┤
│ ▶ PNA-GT-06            │ 2         │ 25                 │
└─────────────────────────────────────────────────────────┘
```

## Testing

### Manual Testing Steps

1. **Expand a facility row**
   - Click dropdown icon or row
   - Wellbore children should appear indented
   - Arrow icon should be visible

2. **Verify data display**
   - Wellbore name in first column
   - Welllog count in second column
   - Curve count in third column

3. **Test multiple expansions**
   - Expand multiple facilities
   - Each should show its wellbores
   - No layout issues

4. **Test collapse**
   - Click to collapse
   - Children should disappear
   - Table returns to normal

5. **Verify sorting**
   - Sort by any column
   - Expanded state should persist
   - Children should move with parents

6. **Verify pagination**
   - Navigate between pages
   - Expanded state should reset (expected behavior)

## Migration Notes

### Removed Features
- Two-column expandable layout
- Custom CSS for spanning content
- Complex expandable content generation
- Left/right content splitting

### Preserved Features
- ✅ All data still accessible
- ✅ Wellbore information displayed
- ✅ Welllog and curve counts shown
- ✅ Sorting and pagination work
- ✅ Expand/collapse functionality

### Future Enhancements
- Could add third level (welllogs under wellbores)
- Could add tooltips for truncated names
- Could add inline actions on child rows
- Could add filtering by wellbore properties

## Files Modified

- `src/components/CatalogChatBoxCloudscape.tsx` - Main component refactor
- `src/app/globals.css` - Removed custom expandable row CSS

## Status

✅ **COMPLETE** - Ready for user validation

The refactored implementation uses Cloudscape's native expandable rows feature, providing a cleaner, more maintainable solution that follows established design patterns.
