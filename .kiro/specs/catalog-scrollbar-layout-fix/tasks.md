# Implementation Plan

- [x] 1. Implement overlay scrollbar solution with fallback
  - Add `overflow: overlay` to `.messages-container` for browsers that support it
  - Add fallback using `scrollbar-gutter: stable` for browsers without overlay support
  - Test in Chrome, Firefox, Safari to verify behavior
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 2. Remove conflicting CSS rules
  - Remove any `width: calc(100% - 40px)` rules that might cause horizontal shifts
  - Ensure all containers use `box-sizing: border-box`
  - Remove any fixed height calculations like `calc(100% - 101px)`
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 3. Verify layout stability
  - Open Catalog page in browser
  - Send messages until scrollbar appears
  - Use DevTools to measure element positions before and after
  - Confirm no shifts occur
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ]* 4. Write property test for position stability
  - **Property 1: Reset-chat position stability**
  - **Validates: Requirements 1.1**

- [ ]* 5. Write property test for content-area stability
  - **Property 2: Content-area position stability**
  - **Validates: Requirements 1.2**

- [ ]* 6. Write property test for panel stability
  - **Property 3: Panel position stability**
  - **Validates: Requirements 1.3**

- [ ]* 7. Write property test for convo stability
  - **Property 4: Convo position stability**
  - **Validates: Requirements 1.4**

- [ ]* 8. Write property test for no horizontal shift
  - **Property 5: No horizontal shift**
  - **Validates: Requirements 1.5**

- [ ] 9. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise.
