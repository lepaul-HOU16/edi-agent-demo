# Implementation Plan

- [x] 1. Set up project structure and types
  - Create TypeScript type definitions for Web Speech API
  - Define component interfaces and props
  - Set up test utilities and mocks for speech recognition
  - _Requirements: 6.1, 6.2_

- [x] 1.1 Create speech recognition type definitions
  - Write TypeScript interfaces for SpeechRecognition API
  - Define error types and error message mappings
  - Create transcription state types
  - _Requirements: 6.1, 6.2, 6.5_

- [x] 1.2 Set up test infrastructure
  - Create mock SpeechRecognition class for testing
  - Set up fast-check for property-based testing
  - Configure test utilities for speech events
  - _Requirements: All (testing foundation)_

- [x] 2. Implement PushToTalkButton component
  - Create base component with browser support detection
  - Implement press-and-hold interaction (mouse and keyboard)
  - Add speech recognition initialization and lifecycle management
  - Handle transcription updates (interim and final results)
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.3, 2.4, 6.1, 6.2, 6.3, 6.4, 8.2, 8.3_

- [x] 2.1 Implement browser support detection
  - Detect Web Speech API availability
  - Handle browser-specific API selection (webkit prefix)
  - Return null component when unsupported
  - _Requirements: 5.3, 6.1, 6.2, 6.3, 6.4_

- [x] 2.2 Implement press-and-hold interaction
  - Handle mouseDown/mouseUp events
  - Handle keyDown/keyUp events (Space, Enter)
  - Prevent concurrent recordings
  - Add visual feedback on press
  - _Requirements: 1.1, 7.1, 8.2, 8.3, 9.4_

- [x] 2.3 Implement speech recognition lifecycle
  - Initialize SpeechRecognition on component mount
  - Configure recognition settings (continuous, interimResults, language)
  - Start recognition on button press
  - Stop recognition on button release
  - Clean up on component unmount
  - _Requirements: 1.1, 1.2, 1.3, 6.1, 6.2, 6.3, 6.4_

- [x] 2.4 Handle transcription results
  - Process interim results and update display
  - Process final results and accumulate
  - Replace interim with final results
  - Clear transcription on new recording
  - _Requirements: 1.2, 1.5, 4.1, 4.2, 4.4, 4.5_

- [x] 2.5 Implement submission logic
  - Submit transcription on button release
  - Prevent empty/whitespace-only submissions
  - Call onTranscriptionComplete callback
  - Reset component state after submission
  - _Requirements: 1.3, 1.4, 7.4_

- [ ]* 2.6 Write property test for transcription display
  - **Property 2: Continuous transcription during recording**
  - **Validates: Requirements 1.2, 1.5, 4.1, 9.3**

- [ ]* 2.7 Write property test for empty submission prevention
  - **Property 4: Empty transcription prevents submission**
  - **Validates: Requirements 1.4, 7.4**

- [ ]* 2.8 Write property test for final result accumulation
  - **Property 7: Final results accumulate**
  - **Validates: Requirements 4.5**

- [x] 3. Implement error handling and permissions
  - Request microphone permissions on first use
  - Handle permission denied errors
  - Handle network errors during recognition
  - Handle speech recognition errors with user-friendly messages
  - Display errors using Cloudscape Alert component
  - _Requirements: 5.1, 5.2, 5.4, 5.5, 6.5, 7.2, 7.5_

- [x] 3.1 Implement permission management
  - Request microphone permissions on first button press
  - Store permission state to avoid repeated requests
  - Handle permission denied with clear error message
  - Provide recovery instructions
  - _Requirements: 5.1, 5.2, 5.4, 5.5_

- [x] 3.2 Implement error handling
  - Map speech recognition errors to user messages
  - Display errors using Alert component
  - Auto-dismiss errors after 5 seconds
  - Log errors for debugging
  - Return to idle state on error
  - _Requirements: 6.5, 7.2, 7.5_

- [ ]* 3.3 Write property test for error handling
  - **Property 23: Error handling displays user messages**
  - **Validates: Requirements 6.5**

- [ ]* 3.4 Write unit tests for permission flow
  - Test first-time permission request
  - Test permission denied error
  - Test permission granted state persistence
  - _Requirements: 5.1, 5.2, 5.4_

- [x] 4. Implement VoiceTranscriptionDisplay component
  - Create display component matching input box styling
  - Show recording indicator with animation
  - Display transcription text in real-time
  - Handle visibility state
  - _Requirements: 3.3, 4.1, 4.3, 9.1, 9.2_

- [x] 4.1 Create base display component
  - Match ExpandablePromptInput visual styling
  - Use same background, border, padding
  - Position above input area
  - Handle show/hide transitions
  - _Requirements: 3.3, 4.1, 4.3_

- [x] 4.2 Add recording indicator
  - Display pulsing microphone icon
  - Show "Listening..." text
  - Animate during recording
  - Remove immediately when recording stops
  - _Requirements: 9.1, 9.2, 9.5_

- [x] 4.3 Implement transcription display
  - Show interim results in real-time
  - Update with final results
  - Handle text overflow
  - Match input box text styling
  - _Requirements: 1.2, 1.5, 4.1, 4.2, 9.3_

- [ ]* 4.4 Write unit tests for display component
  - Test rendering with transcription
  - Test recording indicator animation
  - Test styling matches input box
  - Test visibility transitions
  - _Requirements: 3.3, 4.3, 9.1, 9.2_

- [x] 5. Integrate PTT into ChatBox component
  - Add PTT button above input toggle
  - Coordinate input visibility with voice recording
  - Connect PTT transcription to message submission
  - Manage state between PTT and input components
  - _Requirements: 2.1, 3.1, 3.2, 3.4, 3.5, 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 5.1 Add PTT button to ChatBox layout
  - Position button above input toggle
  - Add to controls container
  - Ensure proper z-index and positioning
  - _Requirements: 2.1_

- [x] 5.2 Implement input visibility coordination
  - Hide input when PTT recording starts
  - Keep input hidden after recording completes
  - Allow toggle to show input anytime
  - Maintain toggle functionality
  - _Requirements: 3.1, 3.2, 3.4, 3.5_

- [x] 5.3 Connect PTT to message submission
  - Call existing handleSend with transcription
  - Clear transcription after submission
  - Reset PTT button state
  - Preserve input hidden state after submission
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ]* 5.4 Write property test for input visibility coordination
  - **Property 8: Voice activation hides visible input**
  - **Property 9: Input stays hidden after recording**
  - **Property 11: Toggle always shows input**
  - **Validates: Requirements 3.1, 3.2, 3.4, 3.5**

- [ ]* 5.5 Write property test for submission integration
  - **Property 19: Voice submission uses existing flow**
  - **Property 22: Submission preserves input visibility**
  - **Validates: Requirements 10.1, 10.2, 10.5**

- [x] 6. Implement accessibility features
  - Add ARIA labels and roles
  - Implement keyboard navigation
  - Add focus indicators
  - Provide keyboard shortcut hints in tooltip
  - Ensure proper tab order
  - _Requirements: 2.2, 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 6.1 Add ARIA attributes
  - Add aria-label to PTT button
  - Add role="button" if needed
  - Add aria-pressed for recording state
  - Add aria-live region for errors
  - _Requirements: 2.2, 8.1_

- [x] 6.2 Implement keyboard support
  - Handle Space and Enter key press/release
  - Add keyboard shortcut hints to tooltip
  - Ensure button is in tab order
  - Add visible focus indicator
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ]* 6.3 Write property tests for keyboard interaction
  - **Property 15: Keyboard activation starts recording**
  - **Property 16: Keyboard release submits transcription**
  - **Validates: Requirements 8.2, 8.3**

- [ ]* 6.4 Write unit tests for accessibility
  - Test ARIA attributes are present
  - Test keyboard navigation works
  - Test focus indicators appear
  - Test tab order is correct
  - _Requirements: 8.1, 8.4, 8.5_

- [x] 7. Add visual feedback and animations
  - Implement recording indicator animation
  - Add button press visual feedback
  - Ensure feedback appears within 100ms
  - Remove indicators immediately on stop
  - _Requirements: 2.4, 9.1, 9.2, 9.4, 9.5_

- [x] 7.1 Create recording animation
  - Add pulsing animation to microphone icon
  - Animate "Listening..." text
  - Use CSS animations for performance
  - _Requirements: 9.1, 9.2_

- [x] 7.2 Implement immediate feedback
  - Show visual change within 100ms of press
  - Use optimistic UI updates
  - Remove indicators immediately on release
  - _Requirements: 9.4, 9.5_

- [ ]* 7.3 Write property test for visual feedback timing
  - **Property 17: Visual feedback timing**
  - **Property 18: Recording indicator cleanup**
  - **Validates: Requirements 9.4, 9.5**

- [ ]* 7.4 Write unit tests for animations
  - Test recording animation starts
  - Test animation stops on release
  - Test feedback timing
  - _Requirements: 9.1, 9.2, 9.4, 9.5_

- [x] 8. Implement edge case handling
  - Prevent concurrent recordings
  - Handle silence during recording
  - Handle rapid press/release
  - Handle component unmount during recording
  - _Requirements: 7.1, 7.3_

- [x] 8.1 Prevent concurrent recordings
  - Ignore button press if already recording
  - Add guard in press handler
  - Test with rapid presses
  - _Requirements: 7.1_

- [x] 8.2 Handle silence and timeouts
  - Continue listening during silence
  - Don't auto-stop on silence
  - Only stop on button release
  - _Requirements: 7.3_

- [ ]* 8.3 Write property test for concurrent prevention
  - **Property 13: Concurrent recording prevention**
  - **Validates: Requirements 7.1**

- [ ]* 8.4 Write property test for silence handling
  - **Property 14: Silence doesn't stop recording**
  - **Validates: Requirements 7.3**

- [ ]* 8.5 Write unit tests for edge cases
  - Test rapid press/release
  - Test unmount during recording
  - Test multiple simultaneous presses
  - _Requirements: 7.1, 7.3_

- [x] 9. Add tooltips and user guidance
  - Add tooltip with "Press and hold to speak"
  - Show keyboard shortcuts in tooltip when focused
  - Add icon-only button styling
  - _Requirements: 2.2, 2.5, 8.4_

- [x] 9.1 Implement tooltip
  - Add Cloudscape Tooltip or MUI Tooltip
  - Show on hover and focus
  - Include keyboard shortcut hints
  - Position appropriately
  - _Requirements: 2.2, 8.4_

- [ ]* 9.2 Write unit tests for tooltips
  - Test tooltip appears on hover
  - Test tooltip shows keyboard hints on focus
  - Test tooltip content is correct
  - _Requirements: 2.2, 8.4_

- [x] 10. Write comprehensive property-based tests
  - Implement all 23 correctness properties as property tests
  - Configure fast-check with 100+ iterations per test
  - Tag each test with property number and requirements
  - _Requirements: All_

- [ ]* 10.1 Write remaining property tests
  - **Property 1: PTT activation starts speech recognition**
  - **Property 3: Button release triggers submission**
  - **Property 5: Final results replace interim results**
  - **Property 6: Multiple interim results show latest only**
  - **Property 10: Transcription displays with hidden input**
  - **Property 12: Permission state persists**
  - **Property 20: Submission clears transcription**
  - **Property 21: Submission resets button state**
  - **Validates: Requirements 1.1, 1.3, 4.2, 4.4, 3.3, 5.4, 10.3, 10.4**

- [ ] 11. Write integration tests
  - Test complete voice input flow end-to-end
  - Test input visibility coordination
  - Test error recovery flows
  - Test keyboard accessibility flow
  - _Requirements: All_

- [ ]* 11.1 Write end-to-end integration tests
  - Test complete voice input flow (press → speak → release → submit)
  - Test input hiding and showing with voice
  - Test error scenarios with recovery
  - Test keyboard-only interaction
  - _Requirements: All_

- [ ] 12. Add browser compatibility handling
  - Detect browser type and version
  - Use appropriate API (webkit prefix)
  - Hide button in unsupported browsers
  - Add Safari-specific configurations
  - _Requirements: 5.3, 6.1, 6.2, 6.3, 6.4_

- [ ] 12.1 Implement browser detection
  - Detect Chrome, Edge, Safari, Firefox
  - Check for SpeechRecognition support
  - Return null component if unsupported
  - _Requirements: 5.3, 6.1_

- [ ] 12.2 Configure browser-specific settings
  - Use webkitSpeechRecognition for Chrome/Edge/Safari
  - Apply Safari-specific config if needed
  - Test on multiple browsers
  - _Requirements: 6.2, 6.3, 6.4_

- [ ]* 12.3 Write unit tests for browser compatibility
  - Test Chrome/Edge detection
  - Test Safari detection and config
  - Test Firefox (unsupported) handling
  - Test API selection logic
  - _Requirements: 5.3, 6.1, 6.2, 6.3, 6.4_

- [ ] 13. Add styling and theming
  - Match existing input box design
  - Support dark mode
  - Add responsive design for mobile
  - Ensure consistent spacing and alignment
  - _Requirements: 2.1, 4.3_

- [ ] 13.1 Style PTT button
  - Match Cloudscape Button styling
  - Add icon-only button styles
  - Support light and dark themes
  - Add hover and active states
  - _Requirements: 2.1, 2.3, 2.4, 2.5_

- [ ] 13.2 Style transcription display
  - Match ExpandablePromptInput styling
  - Use same colors, borders, padding
  - Support dark mode
  - Add responsive breakpoints
  - _Requirements: 4.3_

- [ ]* 13.3 Write visual regression tests
  - Test button appearance in light/dark mode
  - Test transcription display styling
  - Test responsive layout
  - _Requirements: 2.1, 4.3_

- [ ] 14. Add documentation
  - Write component API documentation
  - Add usage examples
  - Document browser compatibility
  - Add troubleshooting guide
  - _Requirements: All_

- [ ] 14.1 Write component documentation
  - Document PushToTalkButton props and usage
  - Document VoiceTranscriptionDisplay props
  - Add code examples
  - Document integration with ChatBox
  - _Requirements: All_

- [ ] 14.2 Write user documentation
  - Explain how to use voice input
  - Document browser requirements
  - Add troubleshooting for common issues
  - Document keyboard shortcuts
  - _Requirements: All_

- [ ] 15. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
  - Verify all properties are tested
  - Check test coverage
  - Run integration tests
  - Test on multiple browsers
