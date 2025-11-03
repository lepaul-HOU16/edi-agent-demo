# Design Document

## Overview

This design addresses two specific styling issues:
1. Making user prompt bubble text consistently white across all themes
2. Fixing the input field light/dark mode styling that was broken in previous changes

The solution will target specific CSS selectors to avoid affecting other UI elements.

## Architecture

### Component Structure
- **Chat Interface**: Contains both user prompt bubbles and AI response bubbles
- **Input Field**: Text input area with associated controls and icons
- **Theme System**: Light/dark mode switching mechanism

### Styling Approach
- Use specific CSS selectors to target only user prompt bubbles
- Restore proper input field theme-aware styling
- Maintain existing AI response bubble styling
- Preserve all other UI element styling

## Components and Interfaces

### User Prompt Bubble Styling
- **Target**: User message bubbles specifically
- **Selector Strategy**: Use class-based selectors that distinguish user messages from AI responses
- **Color Override**: Force white text color regardless of theme
- **Scope**: Only affect text color, preserve all other styling

### Input Field Theme Restoration
- **Target**: Chat input field and associated controls
- **Light Mode**: Ensure dark text on light background with visible icons
- **Dark Mode**: Ensure light text on dark background with visible icons
- **Controls**: Restore proper icon visibility and contrast

## Data Models

### CSS Selector Mapping
```css
/* User prompt bubbles - force white text */
.user-message-bubble {
  color: white !important;
}

/* Input field - theme-aware styling */
.chat-input {
  /* Light mode */
  color: var(--text-color-light);
  background: var(--input-bg-light);
}

[data-theme="dark"] .chat-input {
  /* Dark mode */
  color: var(--text-color-dark);
  background: var(--input-bg-dark);
}
```

### Theme Variables
- Light mode text: Dark color for readability
- Dark mode text: Light color for readability
- Input backgrounds: Appropriate contrast for each theme
- Icon colors: Visible in both themes

## Error Handling

### Fallback Styling
- If theme variables are unavailable, use hardcoded fallback colors
- Ensure minimum contrast ratios are maintained
- Graceful degradation for unsupported browsers

### Validation
- Test in both light and dark modes
- Verify user prompt bubbles are always white
- Confirm input field visibility in both themes
- Check icon visibility and functionality

## Testing Strategy

### Visual Testing
- Screenshot comparison between light and dark modes
- User prompt bubble text color verification
- Input field contrast and visibility testing
- Icon visibility validation

### Functional Testing
- Theme switching behavior
- Input field typing and visibility
- Control interaction testing
- Cross-browser compatibility

### Regression Testing
- Ensure AI response bubbles remain unchanged
- Verify other UI elements are not affected
- Confirm existing functionality is preserved