# Design Document

## Overview

This design addresses the catalog table layout improvements by removing the redundant "Details" column and optimizing the table for better space utilization and reduced row height. The solution focuses on modifying the column definitions in the `generateColumnDefinitions` function within the `ProfessionalGeoscientistDisplay` component.

## Architecture

### Component Structure

The changes are isolated to the `CatalogChatBoxCloudscape.tsx` component, specifically within the `ProfessionalGeoscientistDisplay` function component. No new components or files are required.

```
CatalogChatBoxCloudscape.tsx
└── ProfessionalGeoscientistDisplay (function component)
    └── generateColumnDefinitions (function)
        ├── Column 1: Facility Name (modified width)
        ├── Column 2: Wellbores (modified width)
        └── Column 3: Welllog Curves (modified width)
        [Column 4: Details - REMOVED]
```

### Key Design Decisions

1. **Column Removal**: Remove the "Details" column entirely since the Cloudscape Table component's built-in expandable row functionality provides sufficient affordance through the dropdown icon
2. **Width Redistribution**: Redistribute the 20% width previously allocated to the "Details" column across the remaining three columns
3. **Compact Density**: Leverage the existing `contentDensity="compact"` prop to maintain minimal row height
4. **No Breaking Changes**: All expandable row functionality remains intact through the `expandableRows` prop configuration

## Components and Interfaces

### Modified Function: generateColumnDefinitions

**Location**: `src/components/CatalogChatBoxCloudscape.tsx` (lines ~130-220)

**Current Implementation**:
```typescript
const generateColumnDefinitions = () => {
  if (!tableData || tableData.length === 0) return [];

  return [
    {
      id: 'facilityName',
      header: 'Facility Name',
      cell: (item: any) => { /* ... */ },
      sortingField: 'facilityName',
      isRowHeader: true,
      width: '40%'
    },
    {
      id: 'wellboreCount',
      header: 'Wellbores',
      cell: (item: any) => { /* ... */ },
      sortingField: 'wellboreCount',
      width: '20%'
    },
    {
      id: 'curveCount',
      header: 'Welllog Curves',
      cell: (item: any) => { /* ... */ },
      sortingField: 'curveCount',
      width: '20%'
    },
    {
      id: 'actions',
      header: 'Details',
      cell: (item: any) => {
        if (item.__isExpandedContent) return null;
        return (
          <span style={{ color: '#0073bb', fontSize: '12px' }}>
            Click to expand →
          </span>
        );
      },
      width: '20%'
    }
  ];
};
```

**New Implementation**:
```typescript
const generateColumnDefinitions = () => {
  if (!tableData || tableData.length === 0) return [];

  return [
    {
      id: 'facilityName',
      header: 'Facility Name',
      cell: (item: any) => {
        // If this is an expanded content row, render the full content
        if (item.__isExpandedContent) {
          return item.content;
        }
        return <strong>{item.data?.FacilityName || item.facilityName || item.name || 'N/A'}</strong>;
      },
      sortingField: 'facilityName',
      isRowHeader: true,
      width: '50%'  // Increased from 40%
    },
    {
      id: 'wellboreCount',
      header: 'Wellbores',
      cell: (item: any) => {
        if (item.__isExpandedContent) return null;
        // Handle both array and object formats
        const wellbores = item.wellbores;
        const count = Array.isArray(wellbores)
          ? wellbores.length
          : (wellbores && typeof wellbores === 'object' ? Object.keys(wellbores).length : 0);
        return count;
      },
      sortingField: 'wellboreCount',
      width: '25%'  // Increased from 20%
    },
    {
      id: 'curveCount',
      header: 'Welllog Curves',
      cell: (item: any) => {
        if (item.__isExpandedContent) return null;
        // Handle both array and object formats
        const wellbores = item.wellbores;
        const wellboresArray = Array.isArray(wellbores)
          ? wellbores
          : (wellbores && typeof wellbores === 'object' ? Object.values(wellbores) : []);

        const totalCurves = wellboresArray.reduce((total: number, wellbore: any) => {
          const welllogs = wellbore.welllogs;
          const welllogsArray = Array.isArray(welllogs)
            ? welllogs
            : (welllogs && typeof welllogs === 'object' ? Object.values(welllogs) : []);

          const welllogCurves = welllogsArray.reduce((wbTotal: number, welllog: any) => {
            const curves = welllog.data?.Curves || welllog.Curves || [];
            return wbTotal + (Array.isArray(curves) ? curves.length : 0);
          }, 0);
          return total + welllogCurves;
        }, 0);
        return totalCurves;
      },
      sortingField: 'curveCount',
      width: '25%'  // Increased from 20%
    }
    // 'actions' column removed entirely
  ];
};
```

### Width Distribution Strategy

**Previous Distribution** (100% total):
- Facility Name: 40%
- Wellbores: 20%
- Welllog Curves: 20%
- Details: 20%

**New Distribution** (100% total):
- Facility Name: 50% (+10%)
- Wellbores: 25% (+5%)
- Welllog Curves: 25% (+5%)

**Rationale**:
- Facility names are typically longer and benefit most from additional space
- Numeric columns (Wellbores, Welllog Curves) need less space but should remain balanced
- Equal distribution of the freed 20% provides optimal readability

## Data Models

No changes to data models are required. The component continues to work with the existing data structure:

```typescript
interface WellDataItem {
  well_id?: string;
  wellId?: string;
  uniqueId?: string;
  id?: string;
  data?: {
    FacilityName?: string;
    NameAliases?: string[];
    [key: string]: any;
  };
  facilityName?: string;
  name?: string;
  wellbores?: any[] | { [key: string]: any };
  __isExpandedContent?: boolean;
  __expandableContent?: React.ReactNode;
}
```

## Error Handling

### Existing Error Handling (Preserved)

1. **Missing Data**: The cell renderers already handle missing data with fallback values (`'N/A'`, `0`)
2. **Type Variations**: The code handles both array and object formats for wellbores and welllogs
3. **Expanded Content Rows**: The `__isExpandedContent` check prevents rendering data in expanded content rows

### No New Error Cases

The removal of the "Details" column does not introduce new error scenarios. All existing error handling remains in place.

## Testing Strategy

### Visual Regression Testing

1. **Column Count Verification**
   - Verify table displays exactly 3 columns (not 4)
   - Verify column headers: "Facility Name", "Wellbores", "Welllog Curves"

2. **Width Distribution Verification**
   - Verify Facility Name column is wider than before
   - Verify numeric columns have adequate space
   - Verify no horizontal scrolling required for typical data

3. **Row Height Verification**
   - Verify rows are more compact than before
   - Verify text does not wrap unnecessarily
   - Verify more rows visible in viewport

### Functional Testing

1. **Expandable Rows**
   - Click on row → verify expansion works
   - Click dropdown icon → verify expansion works
   - Expand multiple rows → verify all work correctly
   - Collapse expanded rows → verify collapse works

2. **Sorting**
   - Sort by Facility Name → verify sorting works
   - Sort by Wellbores → verify sorting works
   - Sort by Welllog Curves → verify sorting works

3. **Pagination**
   - Navigate between pages → verify data displays correctly
   - Verify expanded rows reset on page change

### Data Integrity Testing

1. **Data Display**
   - Verify all facility names display correctly
   - Verify wellbore counts are accurate
   - Verify curve counts are accurate
   - Verify expanded content shows all details

2. **Edge Cases**
   - Empty data → verify empty state displays
   - Single item → verify table renders correctly
   - Large dataset (5000+ items) → verify pagination works

### Browser Compatibility Testing

1. Test in Chrome, Firefox, Safari, Edge
2. Verify table layout is consistent across browsers
3. Verify expandable rows work in all browsers

## Performance Considerations

### No Performance Impact

The changes are purely presentational and do not affect:
- Data fetching
- Data processing
- Rendering performance
- Memory usage

### Potential Minor Improvements

1. **Reduced DOM Nodes**: Removing one column reduces the number of DOM elements per row
2. **Simpler Rendering**: Fewer cells to render per row may provide marginal performance improvement for large datasets

## Accessibility Considerations

### Maintained Accessibility

1. **Keyboard Navigation**: Cloudscape Table's built-in keyboard navigation remains functional
2. **Screen Reader Support**: Column headers and cell content remain properly labeled
3. **ARIA Labels**: Existing ARIA labels for expandable rows remain in place

### Improved Accessibility

1. **Clearer Affordance**: The dropdown icon is a more universally recognized affordance than text
2. **Reduced Clutter**: Fewer columns reduce cognitive load for screen reader users

## Migration Strategy

### Implementation Steps

1. Locate the `generateColumnDefinitions` function in `CatalogChatBoxCloudscape.tsx`
2. Remove the fourth column definition (id: 'actions')
3. Update width percentages for the three remaining columns
4. Test expandable row functionality
5. Verify visual appearance and data integrity

### Rollback Plan

If issues arise, the change can be easily reverted by:
1. Restoring the fourth column definition
2. Reverting width percentages to original values

### No Breaking Changes

This change is purely visual and does not affect:
- Component props
- Data structure
- External APIs
- Other components

## Alternative Approaches Considered

### Alternative 1: Two-Column Layout

**Approach**: Combine Wellbores and Welllog Curves into a single column

**Pros**:
- Even more horizontal space for Facility Name
- Simpler column structure

**Cons**:
- Loses sortability for individual metrics
- Harder to scan numeric data
- Reduces data clarity

**Decision**: Rejected - maintaining separate columns for numeric data provides better usability

### Alternative 2: Keep Details Column with Icon Only

**Approach**: Replace "Click to expand →" text with just an icon

**Pros**:
- Maintains explicit affordance
- Could reduce column width to ~10%

**Cons**:
- Still wastes horizontal space
- Redundant with built-in dropdown icon
- Adds visual clutter

**Decision**: Rejected - the built-in dropdown icon is sufficient affordance

### Alternative 3: Responsive Column Widths

**Approach**: Use CSS flexbox or grid for dynamic column sizing

**Pros**:
- More adaptive to different screen sizes
- Could optimize space usage further

**Cons**:
- More complex implementation
- May conflict with Cloudscape Table's internal layout
- Harder to maintain consistent appearance

**Decision**: Rejected - fixed percentages provide predictable, consistent layout

## Conclusion

This design provides a straightforward solution to improve the catalog table layout by removing the redundant "Details" column and redistributing the space to the data columns. The implementation is simple, low-risk, and maintains all existing functionality while improving space efficiency and reducing row height.
