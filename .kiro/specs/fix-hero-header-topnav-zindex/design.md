# Design Document

## Overview

This design addresses two critical UI issues:
1. **Z-Index Layering**: Hero-header backgrounds on landing and sign-up pages obscure the TopNavigation component
2. **Button State Visibility**: The "Create Account" button's disabled state is not visually distinct enough from its enabled state

The solution establishes a clear z-index hierarchy and improves button state styling for better user feedback.

## Architecture

### Component Hierarchy

```
AppLayout (z-index: 10000)
├── TopNavigation (z-index: 10000)
└── Page Content (z-index: auto)
    ├── HomePage (z-index: auto)
    │   └── hero-header background (z-index: -1 or 1)
    └── SignUpPage (z-index: auto)
        ├── Background container (z-index: -1 or 1)
        └── Form container (z-index: 10)
            └── Create Account button (z-index: auto)
```

### Z-Index Scale

Establish a consistent z-index scale across the application:

- **10000+**: Global navigation (TopNavigation, AppLayout header)
- **9000**: Modals and overlays
- **1000**: Dropdowns and popovers
- **100**: Floating UI elements (tooltips, notifications)
- **10**: Content layer elements
- **1**: Background elements
- **-1**: Decorative backgrounds that should never overlap content

## Components and Interfaces

### 1. CSS Z-Index Variables

Define CSS custom properties for consistent z-index values:

```css
:root {
  --z-index-navigation: 10000;
  --z-index-modal: 9000;
  --z-index-dropdown: 1000;
  --z-index-floating: 100;
  --z-index-content: 10;
  --z-index-background: 1;
  --z-index-decorative: -1;
}
```

### 2. TopNavigation Z-Index Fix

Apply explicit z-index to TopNavigation component:

```css
/* In src/index.css or src/globals.css */
[class*="awsui_top-navigation"],
header[class*="awsui"] {
  z-index: var(--z-index-navigation, 10000) !important;
  position: relative !important;
}
```

### 3. Hero-Header Background Fix

Modify hero-header styling to ensure it stays behind navigation:

```css
/* For HomePage and SignUpPage backgrounds */
.hero-header,
[data-page="home"] > div:first-child,
[data-page="signup"] > div:first-child {
  position: relative;
  z-index: var(--z-index-decorative, -1);
}

/* Ensure content inside hero-header is above background */
.hero-header > * {
  position: relative;
  z-index: var(--z-index-content, 10);
}
```

### 4. Button State Styling Enhancement

Improve visual distinction between enabled and disabled button states:

```css
/* Enhanced disabled button styling */
button[class*="awsui_button"][disabled],
button[class*="awsui_button"]:disabled {
  opacity: 0.4 !important;
  cursor: not-allowed !important;
  background-color: #e5e7eb !important;
  border-color: #d1d5db !important;
  color: #9ca3af !important;
}

/* Primary button disabled state */
button[class*="awsui_button-variant-primary"][disabled],
button[class*="awsui_button-variant-primary"]:disabled {
  background-color: #93c5fd !important;
  border-color: #93c5fd !important;
  color: #ffffff !important;
  opacity: 0.5 !important;
}

/* Enabled button - ensure full opacity */
button[class*="awsui_button"]:not([disabled]):not(:disabled) {
  opacity: 1 !important;
  cursor: pointer !important;
}
```

## Data Models

No data model changes required - this is purely a CSS/styling fix.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Navigation Always On Top
*For any* page with a hero-header background, the TopNavigation component should always render above the background and remain clickable
**Validates: Requirements 1.1, 1.2, 1.3, 1.4**

### Property 2: Z-Index Hierarchy Consistency
*For any* two elements with defined z-index values, the element with the higher semantic priority (navigation > content > background) should have a higher z-index value
**Validates: Requirements 2.1, 2.3, 2.4**

### Property 3: Button State Visual Distinction
*For any* button in disabled state, its visual appearance (opacity, color, cursor) should be clearly distinguishable from its enabled state
**Validates: Requirements 3.1, 3.2, 3.3, 3.5**

### Property 4: Real-Time Button State Updates
*For any* form with validation, when validation state changes from invalid to valid, the submit button's visual state should update immediately without page refresh
**Validates: Requirements 3.5**

## Error Handling

### Z-Index Conflicts

If z-index conflicts occur:
1. Check for competing `position` values (relative, absolute, fixed)
2. Verify stacking context is not being created unintentionally
3. Use browser DevTools to inspect computed z-index values
4. Ensure `!important` is used sparingly and only when necessary

### Button State Not Updating

If button state doesn't update:
1. Verify React state is updating correctly (check with React DevTools)
2. Ensure CSS selectors are specific enough to override Cloudscape defaults
3. Check for conflicting CSS rules with higher specificity
4. Verify `disabled` attribute is being set/removed correctly

## Testing Strategy

### Manual Testing

1. **Z-Index Testing**:
   - Navigate to HomePage - verify TopNavigation is clickable
   - Navigate to SignUpPage - verify TopNavigation is clickable
   - Open TopNavigation dropdowns - verify they appear above backgrounds
   - Test on different screen sizes

2. **Button State Testing**:
   - Leave all fields empty - verify button is grayed out
   - Fill in username only - verify button stays grayed out
   - Fill in all fields with valid data - verify button becomes fully colored
   - Enter invalid email - verify button stays grayed out
   - Correct the email - verify button becomes enabled immediately
   - Submit form - verify loading state appears

### Visual Regression Testing

Create test cases to capture:
- TopNavigation rendering on HomePage
- TopNavigation rendering on SignUpPage
- Button states (disabled, enabled, loading)
- Dropdown menus appearing above backgrounds

### Browser Testing

Test across:
- Chrome/Edge (Chromium)
- Firefox
- Safari
- Mobile browsers (iOS Safari, Chrome Mobile)

## Implementation Notes

### CSS Specificity

Use `!important` judiciously:
- Required for z-index overrides of Cloudscape components
- Required for button state styling to override Cloudscape defaults
- Document why `!important` is needed in comments

### Performance Considerations

- Z-index changes do not trigger reflow/repaint
- CSS custom properties have minimal performance impact
- Button state changes are handled by React's efficient re-rendering

### Accessibility

- Disabled buttons should have `aria-disabled="true"`
- Disabled buttons should not be focusable
- Screen readers should announce button state changes
- Ensure sufficient color contrast for disabled state (WCAG AA: 4.5:1)

### Dark Mode Compatibility

Ensure button state styling works in both light and dark modes:

```css
/* Dark mode disabled button */
[data-awsui-mode="dark"] button[class*="awsui_button"][disabled] {
  background-color: #2a3642 !important;
  border-color: #414d5c !important;
  color: #687078 !important;
}

/* Dark mode primary button disabled */
[data-awsui-mode="dark"] button[class*="awsui_button-variant-primary"][disabled] {
  background-color: #1e3a5f !important;
  border-color: #1e3a5f !important;
  color: #7fa7d4 !important;
}
```

## Migration Strategy

1. Add CSS custom properties to `:root`
2. Apply z-index fixes to TopNavigation
3. Fix hero-header z-index on HomePage and SignUpPage
4. Enhance button disabled state styling
5. Test on localhost
6. Deploy to production (frontend only - no backend changes)

## Rollback Plan

If issues occur:
1. Remove CSS custom properties
2. Revert z-index changes
3. Revert button styling changes
4. Deploy previous version

CSS-only changes are low-risk and easily reversible.
