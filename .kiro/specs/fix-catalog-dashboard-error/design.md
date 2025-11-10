# Design Document

## Overview

This design addresses the catalog dashboard error by implementing comprehensive null safety and defensive programming patterns throughout the data visualization pipeline. The solution focuses on three key areas: safe coordinate access in the GeoscientistDashboard component, data validation in the catalog page, and enhanced error boundary handling.

## Architecture

### Component Hierarchy

```
CatalogPage
├── CatalogChatBoxCloudscape (chat interface)
├── MapComponent (geographic visualization)
└── GeoscientistDashboard (wrapped in ErrorBoundary)
    ├── Executive Summary
    ├── Tabs
    │   ├── Reservoir Analysis
    │   ├── Production Intelligence
    │   ├── Regional Context
    │   ├── Operations Planning
    │   └── Data Table (ERROR LOCATION)
    └── Recommended Actions
```

### Error Location

The error occurs in the Data Table tab when rendering coordinates:

```typescript
// Current problematic code (line ~850)
<TableCell style={{ fontSize: '11px', color: '#666' }}>
  {well.coordinates[1].toFixed(4)}, {well.coordinates[0].toFixed(4)}
</TableCell>
```

**Problem**: `well.coordinates` may be undefined, causing `Cannot read properties of undefined (reading '1')`

## Components and Interfaces

### 1. GeoscientistDashboard Component

**File**: `src/components/GeoscientistDashboard.tsx`

**Changes Required**:

#### Safe Coordinate Rendering Helper

```typescript
// Add helper function at component level
const formatCoordinates = useCallback((coordinates: [number, number] | undefined): string => {
  if (!coordinates || !Array.isArray(coordinates) || coordinates.length < 2) {
    return 'N/A';
  }
  
  const [lon, lat] = coordinates;
  
  if (typeof lon !== 'number' || typeof lat !== 'number' || 
      isNaN(lon) || isNaN(lat)) {
    return 'N/A';
  }
  
  return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
}, []);
```

#### Data Table Coordinate Cell

```typescript
// Replace problematic TableCell with safe version
<TableCell style={{ fontSize: '11px', color: '#666' }}>
  {formatCoordinates(well.coordinates)}
</TableCell>
```

#### Additional Null Safety

Apply similar defensive patterns to:
- Crossplot SVG rendering (check coordinates before plotting)
- Operations planning phase assignments (check well existence)
- EUR calculations (validate numeric properties)

### 2. Catalog Page Data Validation

**File**: `src/app/catalog/page.tsx`

**Changes Required**:

#### Data Validation Function

```typescript
// Add validation function before setting analysisData
const validateWellData = useCallback((wells: any[]): WellData[] => {
  return wells.map((well, index) => {
    // Ensure coordinates are valid or undefined
    let validatedCoordinates: [number, number] | undefined;
    
    if (well.coordinates && Array.isArray(well.coordinates) && well.coordinates.length >= 2) {
      const [lon, lat] = well.coordinates;
      if (typeof lon === 'number' && typeof lat === 'number' && 
          !isNaN(lon) && !isNaN(lat)) {
        validatedCoordinates = [lon, lat];
      }
    } else if (well.longitude !== undefined && well.latitude !== undefined) {
      // Fallback: try to construct from separate lon/lat fields
      const lon = parseFloat(well.longitude);
      const lat = parseFloat(well.latitude);
      if (!isNaN(lon) && !isNaN(lat)) {
        validatedCoordinates = [lon, lat];
      }
    }
    
    if (!validatedCoordinates) {
      console.warn(`Well ${well.name || index} has invalid coordinates:`, well.coordinates);
    }
    
    return {
      name: well.name || `Well-${index + 1}`,
      type: well.type || 'Unknown',
      depth: well.depth || 'Unknown',
      location: well.location || 'Unknown',
      operator: well.operator || 'Unknown',
      coordinates: validatedCoordinates,
      // Preserve other properties
      ...well
    };
  });
}, []);
```

#### Apply Validation Before Setting State

```typescript
// When setting analysisData, validate first
if (wellData.length > 0) {
  const validatedData = validateWellData(wellData);
  setAnalysisData(validatedData);
  setAnalysisQueryType('osdu-query-builder');
}
```

### 3. Error Boundary Enhancement

**File**: `src/components/GeoscientistDashboardErrorBoundary.tsx`

**Current Implementation**: Already exists and catches errors

**Enhancement**: Improve error message clarity

```typescript
// In the error state render
<Alert
  type="error"
  header="Dashboard Error Detected"
>
  The professional dashboard encountered an error. Displaying simplified table view to ensure data accessibility.
  
  <Box variant="p" margin={{ top: 's' }}>
    <strong>Error Details:</strong> {this.state.error?.message}
  </Box>
  
  <Box variant="p" margin={{ top: 's' }}>
    <strong>Possible Causes:</strong>
    <ul>
      <li>Missing or invalid coordinate data in well records</li>
      <li>Incomplete data from search results</li>
      <li>Data format mismatch between source and dashboard</li>
    </ul>
  </Box>
  
  <Box variant="p" margin={{ top: 's' }}>
    <strong>Recommendation:</strong> Try refining your search query or contact support if the issue persists.
  </Box>
</Alert>
```

## Data Models

### WellData Interface (Enhanced)

```typescript
interface WellData {
  name: string;
  type: string;
  depth: string;
  location: string;
  operator: string;
  coordinates?: [number, number]; // Made optional with explicit undefined
  
  // Optional reservoir properties
  porosity?: number;
  permeability?: number;
  netPay?: number;
  waterSaturation?: number;
  reservoirQuality?: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  
  // Optional OSDU fields
  dataSource?: string;
  osduId?: string;
  basin?: string;
  country?: string;
  logType?: string;
  status?: string;
  
  // Separate coordinate fields (fallback)
  latitude?: number;
  longitude?: number;
}
```

## Error Handling

### Error Scenarios and Responses

| Scenario | Detection | Response |
|----------|-----------|----------|
| Undefined coordinates | Check `!coordinates` | Display "N/A" in table |
| Invalid coordinate array | Check `!Array.isArray()` or `length < 2` | Display "N/A" in table |
| NaN coordinate values | Check `isNaN(lon)` or `isNaN(lat)` | Display "N/A" in table |
| Missing well properties | Check each property | Use fallback values ("Unknown", "N/A", 0) |
| Dashboard render error | Error boundary catches | Show simplified table with error message |
| Data validation failure | Validation function logs warning | Continue with validated subset of data |

### Logging Strategy

```typescript
// In validation function
if (!validatedCoordinates) {
  console.warn(`Well ${well.name || index} has invalid coordinates:`, {
    provided: well.coordinates,
    longitude: well.longitude,
    latitude: well.latitude,
    wellData: well
  });
}

// In dashboard component
if (enhancedWells.length === 0) {
  console.error('GeoscientistDashboard: No valid wells to display');
}

// In error boundary
console.error('GeoscientistDashboard Error:', {
  error: error.message,
  stack: error.stack,
  componentStack: errorInfo.componentStack,
  wellCount: this.props.fallbackTableData?.length
});
```

## Testing Strategy

### Unit Tests

1. **Coordinate Formatting Function**
   - Test with valid coordinates: `[114.5, 10.4]` → `"10.4000, 114.5000"`
   - Test with undefined: `undefined` → `"N/A"`
   - Test with invalid array: `[114.5]` → `"N/A"`
   - Test with NaN values: `[NaN, 10.4]` → `"N/A"`
   - Test with non-numeric: `["114.5", "10.4"]` → `"N/A"`

2. **Data Validation Function**
   - Test with complete well data
   - Test with missing coordinates
   - Test with separate lon/lat fields
   - Test with invalid coordinate types
   - Test with empty array

### Integration Tests

1. **Dashboard Rendering**
   - Render with valid well data
   - Render with wells missing coordinates
   - Render with mixed valid/invalid data
   - Verify no console errors
   - Verify "N/A" displayed for missing coordinates

2. **Error Boundary**
   - Trigger error in dashboard
   - Verify error boundary catches it
   - Verify fallback table displays
   - Verify error message shows

### Manual Testing

1. **Catalog Search Flow**
   - Perform OSDU search
   - Switch to Analytics panel
   - Verify dashboard loads without errors
   - Check Data Table tab
   - Verify coordinates display correctly or show "N/A"

2. **Query Builder Flow**
   - Execute structured query
   - View results in Analytics panel
   - Verify dashboard renders
   - Check all tabs for errors

3. **Edge Cases**
   - Search with no coordinate data
   - Search with partial coordinate data
   - Search with very large dataset
   - Rapid panel switching

## Performance Considerations

### Memoization

The dashboard already uses `useMemo` for expensive calculations. Ensure validation doesn't break memoization:

```typescript
// Validation should be memoized too
const validatedWells = useMemo(() => {
  return validateWellData(wells);
}, [wells, validateWellData]);
```

### Validation Cost

- Validation adds O(n) operation where n = number of wells
- Acceptable for typical datasets (< 1000 wells)
- Validation runs only when `analysisData` changes
- No impact on render performance

## Deployment Plan

### Phase 1: Core Fixes (Immediate)

1. Add `formatCoordinates` helper to GeoscientistDashboard
2. Replace coordinate access in Data Table
3. Add null checks to crossplot rendering
4. Test locally

### Phase 2: Data Validation (Same Deploy)

1. Add `validateWellData` function to catalog page
2. Apply validation before setting `analysisData`
3. Add console warnings for invalid data
4. Test with various search queries

### Phase 3: Error Boundary Enhancement (Optional)

1. Improve error message in error boundary
2. Add troubleshooting guidance
3. Test error scenarios

### Phase 4: Verification

1. Deploy to sandbox
2. Test all catalog search flows
3. Verify no console errors
4. Verify Analytics panel works
5. User validation

## Rollback Plan

If issues occur:

1. Revert GeoscientistDashboard.tsx changes
2. Revert catalog page validation changes
3. Keep error boundary enhancements (safe)
4. Investigate root cause
5. Re-apply fixes with additional testing

## Success Criteria

- ✅ No "Cannot read properties of undefined" errors in console
- ✅ Dashboard renders successfully with all data types
- ✅ Coordinates display correctly or show "N/A" when missing
- ✅ All dashboard tabs accessible without errors
- ✅ Error boundary catches any remaining issues gracefully
- ✅ User can view analytics for all search results
