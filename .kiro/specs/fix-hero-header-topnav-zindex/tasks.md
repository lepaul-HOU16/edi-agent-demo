# Implementation Plan

- [x] 1. Add CSS custom properties for z-index scale
  - Add `:root` CSS custom properties to `src/index.css` or `src/globals.css`
  - Define variables: `--z-index-navigation: 10000`, `--z-index-modal: 9000`, `--z-index-dropdown: 1000`, `--z-index-floating: 100`, `--z-index-content: 10`, `--z-index-background: 1`, `--z-index-decorative: -1`
  - _Requirements: 2.3, 2.4_

- [x] 2. Fix TopNavigation z-index
  - Add CSS rules to ensure TopNavigation appears above all page content
  - Target `[class*="awsui_top-navigation"]` and `header[class*="awsui"]`
  - Set `z-index: var(--z-index-navigation, 10000) !important`
  - Set `position: relative !important` to establish stacking context
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 3. Fix hero-header background z-index
  - Add CSS rules for `.hero-header` class
  - Set `position: relative` and `z-index: var(--z-index-decorative, -1)`
  - Ensure content inside hero-header has higher z-index than background
  - Apply to both HomePage and SignUpPage backgrounds
  - _Requirements: 1.1, 1.4_

- [ ] 4. Enhance button disabled state styling
  - Add CSS rules for disabled button states
  - Target `button[class*="awsui_button"][disabled]` and `:disabled` pseudo-class
  - Set `opacity: 0.4`, `cursor: not-allowed`, muted colors
  - Add specific styling for primary button disabled state
  - Ensure enabled buttons have `opacity: 1` and `cursor: pointer`
  - _Requirements: 3.1, 3.2, 3.3, 3.5_

- [ ] 5. Add dark mode button state styling
  - Add dark mode specific CSS rules for disabled buttons
  - Target `[data-awsui-mode="dark"] button[class*="awsui_button"][disabled]`
  - Use appropriate dark mode colors for disabled state
  - Ensure sufficient contrast for accessibility (WCAG AA)
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 6. Test z-index fixes on localhost
  - Start dev server with `npm run dev`
  - Navigate to HomePage (/) - verify TopNavigation is clickable
  - Navigate to SignUpPage (/sign-up) - verify TopNavigation is clickable
  - Open TopNavigation dropdowns - verify they appear above backgrounds
  - Test on different screen sizes (desktop, tablet, mobile)
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 7. Test button state styling on localhost
  - Navigate to SignUpPage (/sign-up)
  - Verify button is grayed out when form is empty
  - Fill in all fields with valid data - verify button becomes fully colored
  - Enter invalid email - verify button stays grayed out
  - Correct the email - verify button becomes enabled immediately
  - Test in both light and dark modes
  - _Requirements: 3.1, 3.2, 3.3, 3.5_

- [ ] 8. Checkpoint - Ensure all visual fixes work correctly
  - Ensure all tests pass, ask the user if questions arise.
