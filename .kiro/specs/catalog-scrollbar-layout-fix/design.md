# Design Document

## Overview

The Catalog page layout is experiencing a shift when scrollbars appear in the chat messages container. This is caused by the browser's default scrollbar behavior which takes up layout space, triggering a reflow of the entire page. The fix requires isolating the scrollbar's impact to only the scrollable container without affecting parent or sibling elements.

## Architecture

The current layout hierarchy is:
```
body (overflow: hidden)
  #root (overflow: hidden, height: 100vh)
    AppLayout wrapper (overflow: hidden, height: 100vh)
      TopNavigation (Cloudscape component)
      .app-container (height: 100%)
        .main-container[data-page="catalog"] (flex column, height: 100%)
          .reset-chat (flex-shrink: 0, height: 60px)
          .content-area (flex: 1, overflow: hidden)
            Grid (Cloudscape, flex, gap: 40px)
              .panel (colspan-5, height: 100%)
              .convo (colspan-7, overflow: hidden)
                .catalog-chat-container (flex column)
                  .messages-container (THIS IS WHERE SCROLL HAPPENS)
```

The issue: When `.messages-container` gets a scrollbar, the browser recalculates layout dimensions, causing parent containers to shift.

## Components and Interfaces

### CSS Classes Involved

1. **`.main-container[data-page="catalog"]`** - Root flex container
2. **`.reset-chat`** - Fixed-height header (60px)
3. **`.content-area`** - Flex-grow content area
4. **`.panel`** - Left column (map/analysis)
5. **`.convo`** - Right column (chat)
6. **`.messages-container`** - Scrollable messages area

### Key CSS Properties

- `overflow` behavior on each level
- `height` calculations (100%, 100vh, calc())
- `flex` properties for layout
- `position` values (relative, sticky, fixed)
- `scrollbar-gutter` for reserving space

## Data Models

N/A - This is a pure CSS layout fix.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Reset-chat position stability
*For any* state where messages-container has no scrollbar and any state where it has a scrollbar, the reset-chat element's top and left coordinates should remain identical.
**Validates: Requirements 1.1**

### Property 2: Content-area position stability
*For any* state where messages-container has no scrollbar and any state where it has a scrollbar, the content-area element's top and left coordinates should remain identical.
**Validates: Requirements 1.2**

### Property 3: Panel position stability
*For any* state where messages-container has no scrollbar and any state where it has a scrollbar, the panel element's top and left coordinates should remain identical.
**Validates: Requirements 1.3**

### Property 4: Convo position stability
*For any* state where messages-container has no scrollbar and any state where it has a scrollbar, the convo element's top and left coordinates should remain identical.
**Validates: Requirements 1.4**

### Property 5: No horizontal shift
*For any* layout element (reset-chat, content-area, panel, convo) and any state where messages-container scrollbar appears, the element's left (x) coordinate should not change.
**Validates: Requirements 1.5**

## Error Handling

N/A - This is a layout fix with no error states.

## Testing Strategy

### Manual Testing
1. Open Catalog page
2. Send enough messages to trigger scrollbar in messages-container
3. Observe that reset-chat, content-area, panel, and convo do not shift
4. Measure element positions using browser DevTools before and after scrollbar appears
5. Verify no horizontal or vertical movement

### Browser Testing
- Test in Chrome, Firefox, Safari, Edge
- Test at different viewport sizes
- Test with different zoom levels

### Property-Based Testing
Use Playwright or Cypress to:
1. Capture element positions before scrollbar
2. Trigger scrollbar appearance
3. Capture element positions after scrollbar
4. Assert positions are identical

## Implementation Approach

The fix requires preventing the scrollbar from affecting parent layout. Three potential solutions:

### Solution 1: Overlay Scrollbar (Preferred)
Use `overflow: overlay` which makes scrollbar float over content instead of taking layout space. Fallback to padding trick for unsupported browsers.

### Solution 2: Scrollbar Gutter
Use `scrollbar-gutter: stable` to always reserve space for scrollbar, preventing layout shift when it appears.

### Solution 3: Absolute Positioning
Position messages-container absolutely within convo, removing it from normal flow so scrollbar doesn't affect siblings.

**Recommended**: Solution 1 with Solution 2 as fallback, as it provides the best user experience without always showing scrollbar space.
