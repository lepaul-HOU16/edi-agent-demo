# Implementation Plan

- [x] 1. Apply inline styles to ChatBox root container
  - Add inline styles to root div: width: 100%, height: 100%, display: flex, flexDirection: column, position: relative
  - Remove any conflicting CSS class-based styles
  - Verify inline styles override problematic CSS selectors
  - _Requirements: 16.1, 16.3, 16.4, 16.5_

- [x] 2. Remove MUI List/ListItem wrappers from ChatBox
  - Replace `<List>` with plain `<div>`
  - Replace `<ListItem>` with `<div style={{ marginBottom: '16px' }}>`
  - Remove MUI imports: List, ListItem
  - Verify message rendering still works correctly
  - _Requirements: 2.1, 2.2, 9.2_

- [x] 3. Standardize messages-container styling
  - Apply absolute positioning: position: absolute, top: 0, left: 0, right: 0, bottom: 0
  - Set padding: 20px on all sides
  - Set padding-bottom: 100px for controls space
  - Set overflow-y: auto, overflow-x: hidden
  - Remove any MUI-specific styling
  - _Requirements: 1.1, 1.2, 2.1, 2.2_

- [x] 4. Unify scroll behavior functions
  - Replace `performAutoScroll()` with simpler `scrollToBottom()` matching catalog
  - Use scrollTo with behavior: 'smooth'
  - Remove complex buffer calculations
  - Set 500ms timeout for isScrolledToBottom state update
  - _Requirements: 3.1, 12.2, 12.3_

- [x] 5. Standardize auto-scroll effect timing
  - Use 300ms setTimeout before scroll trigger
  - Wrap scroll call in requestAnimationFrame
  - Remove consolidated useEffect, use simpler pattern from catalog
  - Verify auto-scroll triggers on new messages
  - _Requirements: 3.1, 12.1, 12.2_

- [x] 6. Update PTT button positioning
  - Change bottom from 98px to 90px
  - Keep zIndex at 1002 (BELOW FileDrawer 1250)
  - Verify button remains clickable and visible
  - _Requirements: 4.1_

- [x] 7. Update toggle button positioning
  - Keep zIndex at 1001 (BELOW FileDrawer 1250)
  - Verify positioning remains at right: 22px, bottom: 50px
  - _Requirements: 4.2_

- [x] 8. Replace scroll-to-bottom Fab with Cloudscape Button
  - Remove MUI Fab and KeyboardArrowDownIcon imports
  - Replace with Cloudscape Button with iconName="angle-down"
  - Change position from bottom: 120px to bottom: 10px
  - Keep right: 22px, zIndex: 1400
  - Apply variant="primary"
  - _Requirements: 4.3_

- [x] 9. Add loading indicator to ChatBox
  - Add Spinner import from @cloudscape-design/components
  - Create loading indicator div with position: absolute, bottom: 80px, left: 50%, transform: translateX(-50%)
  - Add Spinner component with size="normal"
  - Add text: "Processing your query..."
  - Apply identical styling: backgroundColor: #ffffff, padding: 8px 16px, borderRadius: 8px, etc.
  - Show when isLoading is true
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 10. Verify voice recording UI consistency
  - Confirm VoiceTranscriptionDisplay has marginBottom: 16px
  - Verify recording state management matches catalog
  - Test input hiding on recording start
  - Test transcription clearing on completion
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 11. Verify controls layout and animation
  - Confirm Grid uses gridDefinition: [{ colspan: 5 }, { colspan: 7 }]
  - Verify sliding animation: transform with calc(100vw - 50% + 24.95%)
  - Verify transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
  - Test input show/hide animation smoothness
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 12. Verify z-index layering
  - Controls: z-index 1000
  - Toggle button: z-index 1001 (BELOW FileDrawer)
  - PTT button: z-index 1002 (BELOW FileDrawer)
  - FileDrawer: z-index 1250 (covers buttons when open)
  - Scroll button: z-index 1400 (ABOVE FileDrawer)
  - Test all elements layer correctly
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 13. Test responsive behavior
  - Test at 768px width - verify padding and layout
  - Test at 1024px width - verify padding and layout
  - Test at 1920px width - verify padding changes
  - Test at 2560px width - verify padding changes
  - Verify controls colspan-7 padding adjustments
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 14. Visual regression testing - tab flip test
  - Open Data Catalog in one tab
  - Open Workspace chat in another tab
  - Rapidly flip between tabs
  - Verify ZERO pixel shifts in:
    - Messages container position
    - Message spacing
    - Button positions (PTT, toggle, scroll)
    - Controls position
    - Input area
  - _Requirements: All_

- [ ] 15. Test scroll behavior consistency
  - Send multiple messages in both interfaces
  - Verify auto-scroll triggers identically
  - Scroll up in both interfaces
  - Verify auto-scroll disables identically
  - Click scroll-to-bottom button in both
  - Verify scroll animation is identical
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 16. Test voice recording flow
  - Click PTT button in both interfaces
  - Verify input hides identically
  - Speak and verify transcription displays identically
  - Release PTT and verify message sends identically
  - Verify input remains hidden after send
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 17. Test loading states
  - Send message in both interfaces
  - Verify loading indicator appears identically
  - Verify spinner and text are identical
  - Verify positioning is identical
  - Verify indicator disappears identically
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 18. Final checkpoint - pixel-perfect validation
  - Ensure all tests pass, ask the user if questions arise.
