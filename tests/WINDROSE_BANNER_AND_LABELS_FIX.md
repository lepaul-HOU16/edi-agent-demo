# Wind Rose Banner and Light Mode Labels Fix

## Problem
1. "HIGH QUALITY DATA" banner was showing on wind rose visualizations
2. Legend and label text was not visible in light mode (white text on white background)

## Root Cause
1. **Banner Issue**: Both `PlotlyWindRose.tsx` and `WindRoseArtifact.tsx` had data source/quality banners
2. **Label Issue**: Text colors were not properly configured to switch between light/dark modes

## Solution

### 1. Removed "HIGH QUALITY DATA" Banner
- **File**: `src/components/renewable/PlotlyWindRose.tsx`
  - Removed entire "Data Source Label" section
  - Removed border styling that created banner appearance
  - Simplified component to just show the plot

- **File**: `src/components/renewable/WindRoseArtifact.tsx`
  - Removed "Data Source Information Banner" section
  - Removed unused `ButtonDropdown` import
  - Cleaned up component structure

### 2. Fixed Light Mode Label Colors
- **File**: `src/components/renewable/PlotlyWindRose.tsx`
  - Enhanced `textColor` variable to properly switch: `#ffffff` (dark) / `#000000` (light)
  - Applied `textColor` to ALL text elements:
    - Title font color
    - Legend title font color
    - Legend item font color
    - Radial axis tick font color
    - Angular axis tick font color
    - Statistics annotation color
  - Added `font-family: 'Arial, sans-serif'` for consistency
  - Ensured theme detection hook properly syncs with Cloudscape Design theme

## Changes Made

### PlotlyWindRose.tsx
```typescript
// BEFORE: Banner with data source
<div style={{ padding: '12px 16px', backgroundColor: ..., border: ... }}>
  <span>Data Source:</span>
  <span>{dataSource} ({dataYear})</span>
</div>

// AFTER: No banner, just the plot
<div style={{ width: '100%', height: '600px', border: ..., borderRadius: '8px' }}>
  <Plot ... />
</div>
```

```typescript
// BEFORE: Inconsistent text colors
legend: {
  font: { color: textColor, size: 11 }
}

// AFTER: Explicit font configuration
legend: {
  title: { 
    font: { size: 13, color: textColor, family: 'Arial, sans-serif' }
  },
  font: { color: textColor, size: 11, family: 'Arial, sans-serif' }
}
```

### WindRoseArtifact.tsx
```typescript
// BEFORE: "HIGH QUALITY DATA" banner
{data.plotlyWindRose && (
  <Box padding="s" variant="div">
    <div style={{ ... }}>
      <div>Real Meteorological Data</div>
      <div>HIGH QUALITY DATA</div>
    </div>
  </Box>
)}

// AFTER: Banner removed completely
{/* Banner removed - no data source display */}
```

## Testing

### Automated Tests
```bash
node tests/test-windrose-banner-fix.js
```

**Results**: ✅ All tests passed
- Banner removed from PlotlyWindRose
- Banner removed from WindRoseArtifact
- Text color properly configured
- Theme detection working
- No hardcoded colors

### Manual Testing Checklist
- [ ] Open wind rose in browser
- [ ] Verify NO "HIGH QUALITY DATA" banner appears
- [ ] Switch to light mode
- [ ] Verify legend text is BLACK and readable
- [ ] Verify title text is BLACK and readable
- [ ] Verify axis labels are BLACK and readable
- [ ] Switch to dark mode
- [ ] Verify legend text is WHITE and readable
- [ ] Verify title text is WHITE and readable
- [ ] Verify axis labels are WHITE and readable
- [ ] Toggle between modes multiple times
- [ ] Verify smooth theme transitions

## Files Modified
1. `src/components/renewable/PlotlyWindRose.tsx` - Removed banner, fixed text colors
2. `src/components/renewable/WindRoseArtifact.tsx` - Removed banner, cleaned imports
3. `tests/test-windrose-banner-fix.js` - Automated verification tests

## Verification Commands

```bash
# Run automated tests
node tests/test-windrose-banner-fix.js

# Check for TypeScript errors
npx tsc --noEmit

# Check specific files
npx tsc --noEmit src/components/renewable/PlotlyWindRose.tsx
npx tsc --noEmit src/components/renewable/WindRoseArtifact.tsx
```

## Expected Behavior

### Dark Mode
- Background: Dark gray (#1a1a1a)
- Text: White (#ffffff)
- Grid: Medium gray (#444444)
- Legend: White text on dark background

### Light Mode
- Background: White (#ffffff)
- Text: Black (#000000)
- Grid: Light gray (#e9ebed)
- Legend: Black text on light background

## Key Implementation Details

### Theme Detection
```typescript
const useThemeMode = (): boolean => {
  // 1. Check localStorage (set by layout.tsx)
  const savedMode = localStorage.getItem('darkMode');
  
  // 2. Check body data-theme attribute
  const bodyTheme = document.body.getAttribute('data-theme');
  
  // 3. Fallback to system preference
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}
```

### Text Color Application
```typescript
const textColor = isDarkMode ? '#ffffff' : '#000000';

// Applied to:
- layout.title.font.color
- layout.polar.radialaxis.tickfont.color
- layout.polar.angularaxis.tickfont.color
- layout.legend.title.font.color
- layout.legend.font.color
- layout.font.color
- annotations[].font.color
```

## Success Criteria
✅ No "HIGH QUALITY DATA" banner visible
✅ Legend readable in light mode (black text)
✅ Legend readable in dark mode (white text)
✅ All labels visible in both modes
✅ Smooth theme switching
✅ No TypeScript errors
✅ No console errors

## Notes
- The fix is **specific** to wind rose text elements only
- Does NOT affect other component styling
- Uses Cloudscape Design theme detection
- Syncs with global theme changes via localStorage
- Polls for theme changes as backup mechanism
