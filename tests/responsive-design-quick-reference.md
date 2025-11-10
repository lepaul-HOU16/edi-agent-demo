# OSDU Query Builder - Responsive Design Quick Reference

## Mobile vs Desktop Features

### Layout

| Feature | Mobile (< 768px) | Desktop (≥ 768px) |
|---------|------------------|-------------------|
| Field Layout | Stacked (1 column) | Multi-column (4 columns) |
| Template Selector | Dropdown | Dropdown |
| Advanced Options | Collapsed by default | Expanded by default |
| Button Width | Full width | Auto width |
| Actions Layout | Vertical stack | Horizontal |

### Controls

| Control Type | Mobile | Desktop |
|--------------|--------|---------|
| Date Input | Native date picker | Text input (YYYY-MM-DD) |
| Number Input | Numeric keyboard | Number input |
| Remove Button | Text "Remove" | Icon only |
| Button Height | 44px minimum | Auto |
| Font Size | 16px (no zoom) | 14px |

### Features

| Feature | Mobile | Desktop |
|---------|--------|---------|
| Keyboard Shortcuts | Disabled | Enabled |
| Field Descriptions | Hidden | Visible |
| Operator Descriptions | Hidden | Visible |
| Value Hints | Hidden | Visible |
| Keyboard Shortcut Help | Hidden | Visible |

## Keyboard Shortcuts (Desktop Only)

- **Ctrl/Cmd + Enter**: Execute query (if valid)
- **Ctrl/Cmd + N**: Add new criterion (if < 10)
- **Ctrl/Cmd + H**: Toggle query history

## Responsive Breakpoints

- **Mobile**: 0 - 767px
- **Desktop**: 768px and above

## Touch Target Sizes (Mobile)

All interactive elements meet WCAG 2.1 Level AAA standards:
- Minimum height: 44px
- Minimum width: 44px (or full width)
- Spacing between targets: 8px minimum

## Testing Viewports

### Recommended Test Sizes
- **Mobile**: 375x667 (iPhone SE)
- **Tablet**: 768x1024 (iPad)
- **Desktop**: 1920x1080 (Full HD)

### Browser DevTools
1. Open DevTools (F12)
2. Enable device toolbar (Ctrl+Shift+M / Cmd+Shift+M)
3. Select device or enter custom dimensions
4. Test all interactive features

## Common Issues & Solutions

### Issue: iOS Zoom on Input Focus
**Solution**: All inputs use 16px font size on mobile

### Issue: Horizontal Scrolling on Mobile
**Solution**: All layouts use responsive Grid with 12-column mobile layout

### Issue: Small Tap Targets
**Solution**: All buttons have 44px minimum height on mobile

### Issue: Keyboard Shortcuts Interfering on Mobile
**Solution**: Shortcuts disabled when isMobile === true

## Implementation Details

### Mobile Detection
```typescript
const [isMobile, setIsMobile] = useState(false);

useEffect(() => {
  const checkMobile = () => {
    setIsMobile(window.innerWidth < 768);
  };
  checkMobile();
  window.addEventListener('resize', checkMobile);
  return () => window.removeEventListener('resize', checkMobile);
}, []);
```

### Responsive Grid
```typescript
<Grid
  gridDefinition={
    isMobile
      ? [{ colspan: 12 }] // Full width on mobile
      : [{ colspan: 6 }]  // Half width on desktop
  }
>
```

### Touch-Friendly Button
```typescript
<Button
  fullWidth={isMobile}
  {...(isMobile && { 
    style: { minHeight: '44px', fontSize: '16px' }
  })}
>
```

### Native Mobile Controls
```typescript
<Input
  type={criterion.fieldType === 'number' ? 'number' : 'text'}
  {...(isMobile && { 
    inputMode: criterion.fieldType === 'number' ? 'numeric' : 'text'
  })}
/>
```

## Accessibility Checklist

- ✅ Touch targets ≥ 44px
- ✅ Font size ≥ 16px on mobile
- ✅ No horizontal scrolling
- ✅ Keyboard navigation (desktop)
- ✅ ARIA labels on icon buttons
- ✅ Focus indicators visible
- ✅ Color contrast meets WCAG AA

## Performance

- Minimal re-renders (only on resize)
- Event listeners properly cleaned up
- Conditional rendering for mobile-specific features
- No layout thrashing during resize

## Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Samsung Internet 14+

## Quick Test Checklist

### Mobile (375x667)
- [ ] All fields stack vertically
- [ ] All buttons are full width
- [ ] All buttons are 44px tall
- [ ] Date picker is native
- [ ] Number keyboard appears
- [ ] No horizontal scroll
- [ ] Advanced options collapsed
- [ ] No keyboard shortcuts

### Desktop (1920x1080)
- [ ] Multi-column layout
- [ ] Compact buttons
- [ ] Keyboard shortcuts work
- [ ] All descriptions visible
- [ ] Advanced options expanded
- [ ] Keyboard shortcut help visible

### Resize Test
- [ ] Layout transitions smoothly
- [ ] No layout jumps
- [ ] State preserved
- [ ] No errors in console
