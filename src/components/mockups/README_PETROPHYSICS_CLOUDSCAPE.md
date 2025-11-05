# Petrophysics Cloudscape Redesign Mockup (v2 - Narrow Width)

## Overview

This mockup demonstrates the **redesigned** petrophysics agent responses optimized for **narrow widths** with a unique **heatmap/boxplot intensity overlay** visualization using AWS Cloudscape Design System.

## Access the Mockup

Navigate to: `/mockup/petrophysics-cloudscape`

Or run the development server and visit:
```
http://localhost:3000/mockup/petrophysics-cloudscape
```

## 🎯 Key Design Changes (v2)

### Mobile-First Responsive Design
- ✅ Optimized for narrow screens (mobile, tablets, chat panels)
- ✅ Stacked vertical layout instead of side-by-side
- ✅ Collapsible controls to maximize visualization space
- ✅ Full-width visualizations for maximum detail
- ✅ Touch-friendly controls and interactions

### Unique Intensity Heatmap Visualization
- ✅ **Heatmap shows depth vs property value**
- ✅ **Color intensity increases where wells overlap**
- ✅ **Visual representation of data density and agreement**
- ✅ Darker colors = more wells agree on similar values
- ✅ Lighter colors = fewer wells or single well data

## Key Features Demonstrated

### 1. **Cloudscape Components for Consistency**
- Uses AWS Cloudscape Design System throughout
- Consistent with catalog and other AWS-integrated features
- Professional enterprise UI patterns
- Responsive grid system

### 2. **Intensity Heatmap with Overlap Visualization**
- **Primary Innovation**: Color intensity shows well overlap
- Depth on Y-axis (reversed for geological convention)
- Property value encoded in color
- Overlay count creates intensity gradient
- Clear colorbar legend showing overlap levels

### 3. **Tabs for Content Organization**
- **Overview Tab**: Executive summary, key metrics, distribution charts
- **Intensity Heatmap Tab**: Main feature with heatmap + controls
- **Reservoir Intervals Tab**: Detailed interval analysis with cards
- **Methodology Tab**: Technical documentation and standards

### 4. **Collapsible Controls (Narrow Width Optimized)**
- **Expandable Section** for controls (collapsed by default on mobile)
- **Data Type Selector**: Choose property to visualize
- **Well Overlay Multi-select**: Select 1-4 wells
- **Bin Size Selector**: Adjust depth averaging (25/50/100 ft)
- **Depth Range Sliders**: Focus on specific intervals
- **Selected Wells Badge Display**: Visual confirmation with colors

### 5. **Complementary Visualizations**
- **Boxplot**: Statistical distribution by well (expandable)
- **Histogram**: Value distribution with overlay (expandable)
- **Both use same color scheme** for consistency

### 6. **Removed Features**
- ❌ Wide side-by-side layout
- ❌ Complex "Data Analytics Toggle Panel"
- ❌ Multi-column grids that break on narrow screens
- ✅ Replaced with stacked, full-width components

## Design Principles Applied

### Simplicity First
- Clean, uncluttered interface
- Progressive disclosure (expandable sections)
- Clear visual hierarchy

### Data-Driven
- Large visualizations take center stage
- Multiple chart types for different insights
- Real-time interactivity

### Professional Standards
- Industry-standard color schemes
- Clear labeling and units
- Quality indicators and confidence metrics

### Responsive Layout
- Grid-based layout adapts to screen size
- Side-by-side comparisons where appropriate
- Full-width visualizations for maximum detail

## Component Structure

```
PetrophysicsCloudscapeMockup
├── Header Container
│   ├── Key Metrics (4 columns)
│   └── Quality Indicators (3 progress bars)
├── Tabs
│   ├── Overview Tab
│   │   ├── Executive Summary (expandable)
│   │   ├── Porosity Distribution (pie chart)
│   │   └── Well Comparison (bar chart)
│   ├── Interactive Data Visualization Tab
│   │   ├── Control Panel (side column)
│   │   │   ├── Data Type Selector
│   │   │   ├── Well Overlay Multi-select
│   │   │   ├── Depth Range Sliders
│   │   │   └── Selected Wells Legend
│   │   └── Visualization Area
│   │       ├── Multi-Well Intensity Plot (main)
│   │       └── Zone Comparison (expandable)
│   ├── Reservoir Intervals Tab
│   │   ├── Best Intervals (cards)
│   │   └── High-Porosity Zones (scatter plot)
│   └── Methodology Tab
│       ├── Calculation Methods (expandable)
│       └── Assumptions & Limitations (expandable)
```

## Interactive Features

### Well Overlay Selection
- Select 1-4 wells to overlay
- Each well has distinct color
- Legend shows selected wells with color indicators
- Real-time update of visualization

### Depth Range Control
- Min/Max sliders for depth range
- Immediate visual feedback
- Allows focused analysis on specific intervals

### Data Type Switching
- Toggle between different log properties
- Porosity, Permeability, Saturation, Shale Volume, Gamma Ray
- Chart updates with appropriate units and scales

### Expandable Sections
- Click to expand/collapse detailed information
- Reduces initial cognitive load
- Maintains access to technical details

## Comparison: Old vs New

### Old Design (Material-UI)
- ❌ Complex nested accordions
- ❌ Small, cramped visualizations
- ❌ Inconsistent with AWS catalog UI
- ❌ Data analytics toggle panel (confusing)
- ❌ Limited interactivity

### New Design (Cloudscape)
- ✅ Clean tab-based navigation
- ✅ Large, prominent visualizations
- ✅ Consistent with AWS ecosystem
- ✅ Simple, intuitive controls
- ✅ Rich interactivity with Plotly

## Technical Implementation Notes

### Dependencies Required
```json
{
  "@cloudscape-design/components": "^3.x",
  "@cloudscape-design/global-styles": "^1.x",
  "react-plotly.js": "^2.x",
  "plotly.js": "^2.x"
}
```

### Cloudscape Theme
Ensure Cloudscape global styles are imported in your app:
```typescript
import '@cloudscape-design/global-styles/index.css';
```

### Dynamic Plotly Import
Uses Next.js dynamic import to avoid SSR issues:
```typescript
const Plot = dynamic(() => import('react-plotly.js'), {
  ssr: false,
  loading: () => <div>Loading visualization...</div>
});
```

## Next Steps

### If Approved:
1. Create spec document for implementation
2. Define data interfaces and API contracts
3. Implement real data integration
4. Add export functionality (PDF, PNG, Excel)
5. Implement calculation parameter controls
6. Add more chart types (crossplots, histograms)
7. Integrate with existing petrophysics agent backend

### Potential Enhancements:
- Add heatmap visualization for multi-well comparison
- Implement crossplot with lithology interpretation
- Add histogram overlays for distribution analysis
- Include uncertainty bands on plots
- Add annotation capabilities
- Implement saved view configurations

## Feedback Requested

Please review the mockup and provide feedback on:

1. **Layout & Organization**: Is the tab structure intuitive?
2. **Control Panel**: Are the controls clear and sufficient?
3. **Visualizations**: Are the charts readable and informative?
4. **Interactivity**: Is the well overlay feature useful?
5. **Missing Features**: What else would you like to see?

## Files Created

- `src/components/mockups/PetrophysicsCloudscapeMockup.tsx` - Main mockup component
- `src/app/mockup/petrophysics-cloudscape/page.tsx` - Mockup page
- `src/components/mockups/README_PETROPHYSICS_CLOUDSCAPE.md` - This documentation

---

**Status**: 🎨 Mockup Ready for Review
**Date**: 2024
**Author**: Kiro AI Assistant
