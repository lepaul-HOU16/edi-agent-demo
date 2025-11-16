# Design Document

## Overview

This design document outlines the CSS styling approach to fix the chat input component's visual appearance. The existing functionality (multi-line expansion, sliding animation, agent switcher) is fully working and will be preserved. We will only add/modify CSS to achieve the desired visual design: a blue container with a semi-transparent white overlay, featuring an overlapping agent switcher button.

## Architecture

### Component Structure (Existing - No Changes)

The chat input is rendered in `ChatBox.tsx` with the following structure:

```tsx
<div className='controls'>
  <div className='input-bkgd'>
    <ExpandablePromptInput />
    <Typography>AI Agent Switcher</Typography>
    <AgentSwitcher />
  </div>
</div>
<button className="input-toggle-button" />
```

### CSS Architecture (New Styling)

We will add CSS rules for:
- `.controls` - Outer container for positioning
- `.input-bkgd` - Blue container with white overlay
- Agent switcher positioning within `.input-bkgd`
- Magnifying glass button styling enhancements

## Components and Interfaces

### 1. Controls Container (`.controls`)

**Purpose:** Outer container that handles the sliding animation

**Existing Inline Styles (Preserve):**
```tsx
style={{
  transform: isInputVisible ? 'translateX(0)' : 'translateX(calc(100vw - 50% + 24.95%))',
  transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
}}
```

**New CSS Styling:**
```css
.controls {
  position: fixed;
  bottom: 20px;
  left: 0;
  right: 0;
  z-index: 1000;
  padding: 0 20px;
  pointer-events: none; /* Allow clicks through empty space */
}
```

### 2. Input Background Container (`.input-bkgd`)

**Purpose:** Blue container with white overlay that contains the input and agent switcher

**Existing Inline Styles (Preserve):**
```tsx
style={{
  backdropFilter: 'blur(8px)'
}}
```

**New CSS Styling:**
```css
.input-bkgd {
  /* Blue container */
  background: linear-gradient(135deg, #006ce0 0%, #0053ba 100%);
  border-radius: 24px;
  padding: 12px 16px;
  box-shadow: 0 4px 16px rgba(0, 108, 224, 0.3);
  
  /* White overlay */
  position: relative;
  pointer-events: auto; /* Re-enable clicks within container */
}

.input-bkgd::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.85);
  border-radius: 24px;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 0;
}

/* Ensure content is above the white overlay */
.input-bkgd > * {
  position: relative;
  z-index: 1;
}

/* Layout for input and agent switcher */
.input-bkgd {
  display: flex;
  align-items: center;
  gap: 12px;
  max-width: 900px;
  margin: 0 auto;
}
```

### 3. Agent Switcher Positioning

**Purpose:** Position the agent switcher to overlap the right edge of the container

**New CSS Styling:**
```css
/* Agent switcher label */
.input-bkgd > [style*="lineHeight"] {
  font-size: 11px;
  line-height: 14px;
  width: 50px;
  margin-right: -13px;
  margin-left: 10px;
  color: #000716;
  font-weight: 500;
  white-space: nowrap;
}

/* Agent switcher component */
.input-bkgd > div:last-child {
  /* AgentSwitcher component */
  flex-shrink: 0;
  margin-right: -8px; /* Overlap the container edge */
}
```

### 4. Expandable Prompt Input Styling

**Purpose:** Ensure the input field integrates well with the new container styling

**New CSS Styling:**
```css
.input-bkgd [class*="awsui-input"] {
  flex: 1;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

.input-bkgd [class*="awsui-input"]:focus {
  outline: 2px solid #0972d3;
  outline-offset: 2px;
  border-radius: 4px;
}

/* Ensure the input container doesn't add extra background */
.input-bkgd [class*="awsui-input-container"] {
  background: transparent !important;
}
```

### 5. Magnifying Glass Button Styling

**Purpose:** Enhance the existing button styling for better visual feedback

**Existing Inline Styles (Preserve):**
```tsx
style={{
  position: 'fixed',
  right: '15px',
  bottom: '81px',
  width: '48px',
  height: '48px',
  borderRadius: '50%',
  border: 'none',
  backgroundColor: isInputVisible ? 'rgba(200, 200, 200, 0.9)' : '#006ce0',
  backdropFilter: 'blur(4px)',
  WebkitBackdropFilter: 'blur(4px)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1001,
  transition: 'background-color 0.3s ease',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
}}
```

**Additional CSS Styling:**
```css
.input-toggle-button {
  /* Enhance hover state */
}

.input-toggle-button:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2) !important;
}

.input-toggle-button:active {
  transform: scale(0.95);
}

.input-toggle-button[data-visible="true"] {
  /* When input is visible */
}

.input-toggle-button[data-visible="false"] {
  /* When input is hidden */
  box-shadow: 0 4px 16px rgba(0, 108, 224, 0.4) !important;
}

/* SVG icon styling */
.input-toggle-button svg {
  transition: fill 0.3s ease;
}
```

## Data Models

No data model changes required - this is a styling-only fix.

## Error Handling

### CSS Fallbacks

1. **Backdrop Filter Support:**
   - Primary: `backdrop-filter: blur(8px)`
   - Fallback: Solid white background with reduced opacity if backdrop-filter is not supported

```css
@supports not (backdrop-filter: blur(8px)) {
  .input-bkgd::before {
    background: rgba(255, 255, 255, 0.95);
  }
}
```

2. **Gradient Support:**
   - Primary: Linear gradient for blue container
   - Fallback: Solid blue color

```css
.input-bkgd {
  background: #006ce0; /* Fallback */
  background: linear-gradient(135deg, #006ce0 0%, #0053ba 100%);
}
```

## Testing Strategy

### Visual Regression Testing

1. **Desktop View (1920x1080)**
   - Input visible state
   - Input hidden state
   - Input with single line of text
   - Input with multiple lines of text
   - Agent switcher dropdown open
   - Hover states on all interactive elements

2. **Tablet View (768x1024)**
   - Same tests as desktop
   - Verify responsive layout

3. **Mobile View (375x667)**
   - Same tests as desktop
   - Verify responsive layout
   - Verify touch targets are adequate

### Functional Testing

1. **Sliding Animation**
   - Click magnifying glass button
   - Verify smooth animation
   - Verify styling maintained during animation
   - Verify no visual glitches

2. **Multi-line Input**
   - Type multiple lines of text
   - Verify container expands
   - Verify styling maintained during expansion
   - Verify agent switcher stays positioned correctly

3. **Agent Switcher**
   - Click agent switcher
   - Verify dropdown opens
   - Verify dropdown is readable against new background
   - Verify selection works

4. **Accessibility**
   - Tab through all interactive elements
   - Verify focus indicators are visible
   - Verify contrast ratios meet WCAG AA standards
   - Test with screen reader

### Browser Compatibility

Test in:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Implementation Notes

### CSS File Location

Add the new CSS rules to `src/index.css` or `src/globals.css` after the Cloudscape imports.

### Specificity Considerations

Some Cloudscape components may have high specificity. Use `!important` sparingly and only when necessary to override Cloudscape defaults.

### Performance Considerations

- `backdrop-filter` can be GPU-intensive on some devices
- Consider adding `will-change: transform` to `.controls` for smoother animations
- Use CSS containment if needed: `contain: layout style paint`

### Responsive Breakpoints

```css
/* Mobile */
@media (max-width: 768px) {
  .input-bkgd {
    max-width: calc(100vw - 40px);
    padding: 10px 12px;
  }
  
  .controls {
    padding: 0 10px;
  }
}

/* Tablet */
@media (min-width: 769px) and (max-width: 1024px) {
  .input-bkgd {
    max-width: 700px;
  }
}

/* Desktop */
@media (min-width: 1025px) {
  .input-bkgd {
    max-width: 900px;
  }
}
```

## Design Decisions and Rationales

### 1. Pseudo-element for White Overlay

**Decision:** Use `::before` pseudo-element for the white overlay instead of a nested div

**Rationale:**
- Avoids modifying the React component structure
- Cleaner CSS-only solution
- Better performance (no extra DOM node)
- Easier to maintain

### 2. Fixed Positioning for Controls

**Decision:** Use `position: fixed` for the controls container

**Rationale:**
- Already implemented in the existing code
- Ensures input stays visible while scrolling
- Consistent with the magnifying glass button positioning

### 3. Flexbox Layout

**Decision:** Use flexbox for the input-bkgd layout

**Rationale:**
- Simple and flexible
- Easy to align items vertically
- Responsive by default
- Good browser support

### 4. Gradient Background

**Decision:** Use linear gradient for the blue container

**Rationale:**
- More visually interesting than solid color
- Matches modern design trends
- Subtle depth effect
- Fallback to solid color for older browsers

### 5. Border Radius

**Decision:** Use 24px border radius for the container

**Rationale:**
- Matches the design specification
- Creates a pill-shaped appearance
- Consistent with modern UI design
- Softens the overall look

## Accessibility Considerations

### Color Contrast

- Blue container (#006ce0) with white overlay (rgba(255, 255, 255, 0.85)) provides sufficient contrast
- Text color (#000716) on white overlay meets WCAG AA standards
- Focus indicators use #0972d3 which is visible against all backgrounds

### Focus Indicators

- Maintain existing focus indicators
- Ensure they are visible against the new blue/white background
- Use 2px outline with 2px offset for clarity

### Screen Reader Support

- No changes to aria-labels or semantic HTML
- Existing accessibility features are preserved
- CSS-only changes don't affect screen reader behavior

## Visual Consistency

### AWS Cloudscape Design System Alignment

- Primary blue: #006ce0 (Cloudscape primary color)
- Focus color: #0972d3 (Cloudscape focus color)
- Text color: #000716 (Cloudscape text color)
- Border radius: Consistent with Cloudscape components
- Shadows: Consistent with Cloudscape elevation system

### Typography

- Font family: Inherited from Cloudscape
- Font sizes: Consistent with Cloudscape scale
- Font weights: 400 (normal), 500 (medium), 600 (semibold)

## Conclusion

This design provides a comprehensive CSS-only solution to fix the chat input styling. All existing functionality is preserved, and the new styling integrates seamlessly with the AWS Cloudscape Design System. The implementation is straightforward, maintainable, and accessible.
