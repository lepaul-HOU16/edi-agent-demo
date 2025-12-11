# Design Document

## Overview

This design addresses a UI regression in the catalog page file drawer where the Material UI side panel is not displaying properly, preventing users from accessing 24 LAS files. The root cause is a combination of z-index layering issues and potential positioning conflicts with other page elements. The data exists and is accessible via the MCP server, confirming this is purely a frontend rendering issue.

## Architecture

### Component Hierarchy

```
CatalogPage
├── AppLayout (Cloudscape)
│   ├── TopNavBar (z-index: ~1100)
│   ├── Content Area
│   │   ├── SegmentedControl (Map/Analytics/Chain of Thought)
│   │   ├── Map Component (z-index: 1)
│   │   ├── DataDashboard
│   │   └── CatalogChatBoxCloudscape
│   └── FileDrawer (Material UI)
│       ├── Fixed Position Box (desktop)
│       │   ├── Header (Upload/New Folder/Close buttons)
│       │   ├── FileExplorer (40% width)
│       │   │   ├── Navigation (Breadcrumbs/Back/Refresh)
│       │   │   └── File List
│       │   └── FileViewer (60% width)
│       └── Drawer (mobile)
```

### Z-Index Layering Strategy

Current z-index values (Material-UI defaults):
- `theme.zIndex.drawer`: 1200
- `theme.zIndex.modal`: 1300
- `theme.zIndex.snackbar`: 1400
- `theme.zIndex.tooltip`: 1500

Proposed z-index hierarchy:
1. Base content: 1
2. Map controls: 400
3. Floating buttons: 1100
4. File drawer: 1250 (increased from 1200)
5. Modals/Dialogs: 1300
6. Snackbars: 1400
7. Tooltips: 1500

## Components and Interfaces

### FileDrawer Component

**Current Implementation Issues:**
1. Uses `theme.zIndex.drawer` (1200) which may conflict with other elements
2. Fixed positioning with `top: 0` may be obscured by TopNavBar
3. Transform-based show/hide may have rendering issues
4. No explicit z-index override for desktop fixed position

**Proposed Changes:**

```typescript
interface FileDrawerProps {
  open: boolean;
  onClose: () => void;
  chatSessionId: string;
  variant?: 'temporary' | 'persistent' | 'permanent';
}

// Desktop: Fixed position Box
sx={{
  position: 'fixed',
  top: 0,
  right: 0,
  width: '45%',
  height: '100%',
  backgroundColor: 'background.paper',
  boxShadow: '-8px 0 20px rgba(0,0,0,0.1)',
  zIndex: 1250, // INCREASED from theme.zIndex.drawer
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  borderLeft: '1px solid rgba(0,0,0,0.08)',
  transform: open ? 'translateX(0)' : 'translateX(100%)',
  transition: theme.transitions.create('transform', {
    easing: theme.transitions.easing.easeOut,
    duration: theme.transitions.duration.enteringScreen,
  }),
}}
```

### FileExplorer Component

**Current Implementation:**
- Loads files from S3 via `listFiles` API
- Displays folders and files in a list
- Handles navigation with breadcrumbs
- Shows global folder at root level

**No Changes Required** - Component logic is sound, only parent container visibility is affected.

### CatalogPage Integration

**Current Implementation:**
```typescript
const [fileDrawerOpen, setFileDrawerOpen] = useState(false);

<FileDrawer
  open={fileDrawerOpen}
  onClose={() => setFileDrawerOpen(false)}
  chatSessionId={activeChatSession.id || ""}
  variant={drawerVariant}
/>
```

**No Changes Required** - Integration is correct, only FileDrawer rendering needs fixing.

## Data Models

### FileItem Interface

```typescript
interface FileItem {
  key: string;           // S3 key
  path: string;          // Relative path
  isFolder: boolean;     // Folder vs file
  name: string;          // Display name
  url?: string;          // Presigned URL for files
  children?: FileItem[]; // Nested items
  lastRefreshTime?: number; // Cache timestamp
}
```

**No Changes Required** - Data model is correct.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Drawer visibility on open

*For any* state where `fileDrawerOpen` is true, the file drawer SHALL be visible on screen with all interactive elements (header, file list, buttons) accessible and not obscured by other page elements.

**Validates: Requirements 1.1, 1.3, 3.4**

### Property 2: Z-index layering correctness

*For any* page state, the file drawer z-index SHALL be greater than all content elements (map, dashboard, chat) and less than modal dialogs, ensuring proper layering without obscuring critical UI.

**Validates: Requirements 3.1, 3.2, 3.3, 3.5**

### Property 3: Global folder accessibility

*For any* file drawer state at root level, the global folder SHALL be present in the file list and clicking it SHALL navigate to display all 24 LAS files.

**Validates: Requirements 2.1, 2.2, 2.3**

### Property 4: Desktop positioning correctness

*For any* desktop viewport (width >= 960px), the file drawer SHALL render as a fixed position box at 45% width on the right edge, extending full viewport height.

**Validates: Requirements 4.1, 4.2**

### Property 5: Mobile drawer behavior

*For any* mobile viewport (width < 960px), the file drawer SHALL render as a temporary Material-UI Drawer with full width overlay behavior.

**Validates: Requirements 4.3**

### Property 6: Navigation state consistency

*For any* folder navigation action (breadcrumb click, back button, folder click), the breadcrumb display SHALL update to reflect the current path and the file list SHALL display the correct folder contents.

**Validates: Requirements 5.1, 5.2, 5.3, 5.5**

## Error Handling

### File Loading Errors

**Current Handling:**
- 403: "Access denied. You may not have permission to view these files."
- 404: "Folder not found. It may have been deleted."
- 500: "Server error. The folder may not exist yet."
- Generic: "Failed to load files. Please try again later."

**No Changes Required** - Error handling is comprehensive.

### Empty Folder State

**Current Handling:**
- Displays "No files found in this folder."
- Shows navigation toolbar even when empty

**No Changes Required** - Empty state handling is correct.

## Testing Strategy

### Unit Tests

1. **FileDrawer Rendering Test**
   - Verify drawer renders with correct z-index (1250)
   - Verify drawer uses fixed positioning on desktop
   - Verify drawer uses Material-UI Drawer on mobile
   - Verify transform transitions work correctly

2. **FileExplorer Navigation Test**
   - Verify global folder appears at root level
   - Verify clicking global folder navigates correctly
   - Verify breadcrumbs update on navigation
   - Verify back button enables/disables correctly

3. **Z-Index Layering Test**
   - Verify drawer z-index > map z-index
   - Verify drawer z-index > content z-index
   - Verify drawer z-index < modal z-index
   - Verify all drawer elements are clickable when open

### Integration Tests

1. **End-to-End File Access Test**
   - Open catalog page
   - Click folder icon button
   - Verify drawer slides in from right
   - Click global folder
   - Verify 24 LAS files display
   - Click a LAS file
   - Verify file preview displays

2. **Responsive Behavior Test**
   - Test drawer on desktop viewport (1920x1080)
   - Test drawer on tablet viewport (768x1024)
   - Test drawer on mobile viewport (375x667)
   - Verify correct rendering mode for each

### Visual Regression Tests

1. **Drawer Visibility Test**
   - Capture screenshot with drawer open
   - Verify drawer is fully visible
   - Verify no elements obscure drawer
   - Verify drawer shadow renders correctly

2. **File List Display Test**
   - Capture screenshot of global folder contents
   - Verify all 24 files are visible
   - Verify file icons render correctly
   - Verify action buttons are visible

## Implementation Notes

### Root Cause Analysis

The regression is likely caused by:

1. **Z-Index Conflict**: The drawer's z-index (1200) may be equal to or lower than other page elements, causing it to render behind them.

2. **Fixed Positioning Issue**: The drawer uses `top: 0` which starts at the viewport top, but may be obscured by a TopNavBar or other fixed elements.

3. **Transform Rendering**: The transform-based show/hide may have GPU rendering issues in certain browsers or with certain CSS combinations.

### Fix Strategy

**Primary Fix: Increase Z-Index**
- Change drawer z-index from `theme.zIndex.drawer` (1200) to 1250
- This ensures drawer renders above all content but below modals

**Secondary Fix: Verify Transform**
- Ensure transform transitions are hardware-accelerated
- Add `will-change: transform` for performance
- Verify no conflicting CSS is preventing rendering

**Tertiary Fix: Add Debugging**
- Add console logs to verify drawer open state
- Add visual indicators (border, background) to confirm rendering
- Test in multiple browsers (Chrome, Firefox, Safari)

### Testing Approach

1. **Localhost Testing First**
   - Run `npm run dev`
   - Open http://localhost:3000/catalog
   - Click folder icon
   - Verify drawer appears
   - Click global folder
   - Verify 24 files display

2. **Browser DevTools Inspection**
   - Inspect drawer element
   - Verify z-index is 1250
   - Verify transform is translateX(0) when open
   - Verify no conflicting styles

3. **Responsive Testing**
   - Test on desktop (Chrome DevTools)
   - Test on tablet (Chrome DevTools)
   - Test on mobile (Chrome DevTools)
   - Verify correct behavior for each

## Deployment Strategy

**No Backend Changes Required** - This is a pure frontend fix.

**Testing Workflow:**
1. Make frontend changes to FileDrawer.tsx
2. Test on localhost (`npm run dev`)
3. Verify drawer displays correctly
4. Verify 24 LAS files are accessible
5. User validates fix works
6. User commits and pushes for CI/CD deployment

**No Lambda deployment needed** - Data is already accessible via MCP server.
