# Implementation Plan

## Overview
This implementation plan breaks down the agent landing pages and sliding input features into discrete, manageable coding tasks. Each task builds incrementally on previous work.

## Task List

- [ ] 1. Create agent landing page content data structure
  - [ ] 1.1 Define AgentType enum with AUTO, RENEWABLE_ENERGY, MAINTENANCE, DEFAULT
    - Create TypeScript enum in shared types file
    - Export for use across components
    - _Requirements: 1.1, 1.4_
  
  - [ ] 1.2 Create AgentLandingContent interface and data
    - Define interface with title, description, capabilities, howItWorks, icon fields
    - Create content objects for Auto, Renewable Energy, Maintenance, and Default agents
    - Include Auto agent explanation of intelligent routing
    - _Requirements: 1.1, 1.3, 4.1, 4.2, 4.3, 4.4_
  
  - [ ] 1.3 Create AgentOption interface for selector options
    - Define interface with type, label, icon, description
    - Create array of available agent options
    - _Requirements: 2.4_

- [ ] 2. Build LandingPageContent component
  - [ ] 2.1 Create base LandingPageContent component
    - Accept agent prop of type AgentType
    - Render agent-specific content based on prop
    - Use Tailwind CSS for styling
    - _Requirements: 1.1, 4.1, 4.4_
  
  - [ ] 2.2 Implement content rendering logic
    - Map AgentType to corresponding content object
    - Render title, description, capabilities list
    - Render "How It Works" section for Auto agent
    - Include agent icon
    - _Requirements: 4.2, 4.3_
  
  - [ ] 2.3 Add responsive styling
    - Ensure content adapts to panel container dimensions
    - Use consistent typography and spacing
    - Apply design system tokens
    - _Requirements: 4.4, 4.5_
  
  - [ ] 2.4 Add transition animations
    - Fade in/out when agent changes
    - Smooth content switching
    - _Requirements: 1.1_

- [ ] 3. Create DuplicateAgentSelector component
  - [ ] 3.1 Build icon button selector component
    - Create component with selectedAgent and onAgentChange props
    - Use Cloudscape or MUI icon button
    - Implement dropdown menu with agent options
    - _Requirements: 1.5, 2.4, 2.5_
  
  - [ ] 3.2 Implement agent selection logic
    - Handle click events on agent options
    - Trigger onAgentChange callback with selected agent
    - Close dropdown after selection
    - _Requirements: 2.2_
  
  - [ ] 3.3 Add visual feedback
    - Highlight currently selected agent
    - Show hover states
    - Display agent icons and labels in dropdown
    - _Requirements: 2.5_
  
  - [ ] 3.4 Position component correctly
    - Add CSS for 20px left margin from segmented controller
    - Ensure proper alignment
    - Test responsive behavior
    - _Requirements: 1.5_

- [ ] 4. Build AgentLandingPanel container component
  - [ ] 4.1 Create AgentLandingPanel component structure
    - Accept selectedAgent and onAgentChange props
    - Manage currentAgent state
    - Render DuplicateAgentSelector and LandingPageContent
    - _Requirements: 1.1, 1.3_
  
  - [ ] 4.2 Implement agent change handling
    - Update internal state when agent changes
    - Propagate changes to parent via onAgentChange
    - Trigger landing page content update
    - _Requirements: 2.3_
  
  - [ ] 4.3 Integrate with existing panel layout
    - Replace "AI-Powered Workflow Recommendations" content
    - Maintain segmented controller positioning
    - Ensure proper DOM structure with .panel class
    - _Requirements: 1.3_
  
  - [ ] 4.4 Add transition state management
    - Track isTransitioning state during agent changes
    - Prevent rapid switching during transitions
    - _Requirements: 1.1_

- [ ] 5. Implement agent selection synchronization
  - [ ] 5.1 Create shared agent state management
    - Use React Context or state lifting for agent selection
    - Ensure single source of truth for selected agent
    - _Requirements: 1.4, 2.1, 2.2, 5.1_
  
  - [ ] 5.2 Connect input switcher to shared state
    - Update existing AgentSwitcher to use shared state
    - Trigger state updates on agent change
    - _Requirements: 2.1_
  
  - [ ] 5.3 Connect duplicate selector to shared state
    - Update DuplicateAgentSelector to use shared state
    - Trigger state updates on agent change
    - _Requirements: 2.2_
  
  - [ ] 5.4 Verify bidirectional synchronization
    - Test input switcher → duplicate selector sync
    - Test duplicate selector → input switcher sync
    - Test landing page updates from both sources
    - _Requirements: 2.1, 2.2, 2.3_

- [ ] 6. Create RevealButton component
  - [ ] 6.1 Build reveal button component
    - Create component with onClick and position props
    - Use circular icon button design
    - Add chat/message icon (chevron left or chat bubble)
    - _Requirements: 3.2, 3.6_
  
  - [ ] 6.2 Implement positioning logic
    - Accept position prop with top and right values
    - Use fixed positioning in right margin
    - Calculate position based on original input location
    - _Requirements: 3.2_
  
  - [ ] 6.3 Add visibility animations
    - Fade in when input hides
    - Fade out when input reveals
    - Use CSS transitions for smooth effect
    - _Requirements: 3.2, 3.4, 3.5_
  
  - [ ] 6.4 Add accessibility attributes
    - Include ARIA label "Show chat input"
    - Ensure keyboard accessible
    - Add focus visible indicator
    - _Requirements: 3.6_

- [ ] 7. Enhance chat input with sliding behavior
  - [ ] 7.1 Add sliding state management to chat input
    - Add isVisible, isAnimating, scrollPosition state
    - Initialize with input visible
    - _Requirements: 3.1, 3.7, 5.2, 5.3_
  
  - [ ] 7.2 Implement scroll detection
    - Add scroll event listener to .convo element
    - Use requestAnimationFrame for performance
    - Debounce scroll events (100ms)
    - Track scroll position and direction
    - _Requirements: 3.1_
  
  - [ ] 7.3 Implement slide-out animation
    - Add CSS transform to slide input right
    - Trigger on scroll threshold (50px)
    - Set isVisible to false
    - Show reveal button
    - _Requirements: 3.1, 3.2, 3.5_
  
  - [ ] 7.4 Implement slide-in animation
    - Add CSS transform to slide input back
    - Trigger on reveal button click
    - Set isVisible to true
    - Hide reveal button
    - _Requirements: 3.3, 3.4, 3.5_
  
  - [ ] 7.5 Add animation timing and easing
    - Use 300ms duration for slide animations
    - Apply ease-in-out easing function
    - Ensure smooth transitions
    - _Requirements: 3.5_
  
  - [ ] 7.6 Implement state persistence during session
    - Maintain input visibility state during interactions
    - Keep hidden until reveal button clicked
    - Keep visible until user scrolls again
    - _Requirements: 5.2, 5.3_

- [ ] 8. Integrate components into chat page
  - [ ] 8.1 Update chat page layout
    - Import AgentLandingPanel component
    - Replace existing panel content with AgentLandingPanel
    - Pass agent state and handlers
    - _Requirements: 1.3_
  
  - [ ] 8.2 Update chat input area
    - Wrap existing input with sliding behavior
    - Add RevealButton component
    - Connect to scroll detection logic
    - _Requirements: 3.1, 3.2_
  
  - [ ] 8.3 Wire up agent selection state
    - Create or use existing agent state management
    - Connect AgentLandingPanel to state
    - Connect AgentSwitcher to state
    - Ensure synchronization works
    - _Requirements: 1.4, 2.1, 2.2, 5.1_
  
  - [ ] 8.4 Test integration
    - Verify agent selection updates landing page
    - Verify both selectors stay synchronized
    - Verify input sliding works with scroll
    - Verify reveal button appears and functions
    - _Requirements: 1.1, 2.3, 3.1, 3.3_

- [ ] 9. Add CSS styling and animations
  - [ ] 9.1 Create sliding input CSS
    - Add transform transition for slide animation
    - Define hidden and visible states
    - Use GPU-accelerated transforms
    - Add will-change property for performance
    - _Requirements: 3.5_
  
  - [ ] 9.2 Create reveal button CSS
    - Add fixed positioning styles
    - Define fade in/out transitions
    - Style button appearance
    - Add hover and focus states
    - _Requirements: 3.2, 3.4_
  
  - [ ] 9.3 Create duplicate selector CSS
    - Add positioning relative to segmented controller
    - Define 20px left margin
    - Style dropdown menu
    - Add responsive behavior
    - _Requirements: 1.5_
  
  - [ ] 9.4 Create landing page content CSS
    - Style title, description, capabilities list
    - Add consistent spacing and typography
    - Ensure responsive layout
    - Add transition animations
    - _Requirements: 4.4, 4.5_

- [ ] 10. Implement performance optimizations
  - [ ] 10.1 Optimize scroll event handling
    - Use requestAnimationFrame for scroll callbacks
    - Implement debouncing (100ms threshold)
    - Only trigger hide after scroll threshold (50px)
    - _Requirements: 3.1, 3.7_
  
  - [ ] 10.2 Optimize component re-renders
    - Use React.memo for landing page content components
    - Memoize agent content objects
    - Avoid unnecessary state updates
    - _Requirements: 1.1, 4.1_
  
  - [ ] 10.3 Optimize animations
    - Use CSS transforms instead of position changes
    - Avoid layout thrashing
    - Test animation performance
    - _Requirements: 3.5_

- [ ] 11. Add accessibility features
  - [ ] 11.1 Implement keyboard navigation
    - Ensure duplicate selector accessible via Tab
    - Ensure reveal button accessible via Tab
    - Support Enter/Space for activation
    - _Requirements: 2.5, 3.6_
  
  - [ ] 11.2 Add screen reader support
    - Add ARIA labels to all interactive elements
    - Announce agent selection changes
    - Announce input visibility changes
    - Label reveal button clearly
    - _Requirements: 3.6_
  
  - [ ] 11.3 Implement focus management
    - Maintain focus on duplicate selector after selection
    - Move focus to input when revealed
    - Ensure focus visible indicators present
    - _Requirements: 2.5, 3.6_

- [ ] 12. Add error handling and fallbacks
  - [ ] 12.1 Handle invalid agent types
    - Fall back to default landing page for unknown agents
    - Log errors for debugging
    - _Requirements: 4.1_
  
  - [ ] 12.2 Handle animation failures
    - Ensure input remains accessible if animation fails
    - Use instant show/hide as fallback
    - Don't hide input permanently on error
    - _Requirements: 3.1, 3.3_
  
  - [ ] 12.3 Handle scroll event listener failures
    - Keep input visible by default if listener fails
    - Log errors for debugging
    - _Requirements: 3.1_
  
  - [ ] 12.4 Handle position calculation errors
    - Use fallback fixed positioning for reveal button
    - Ensure button remains accessible
    - _Requirements: 3.2_

- [ ] 13. Implement state persistence
  - [ ] 13.1 Add session-level agent selection persistence
    - Maintain agent selection during session
    - Update on explicit user changes only
    - Persist across page navigation within chat session
    - _Requirements: 5.1, 5.4_
  
  - [ ] 13.2 Add input visibility state management
    - Track visibility state during session
    - Reset on new chat session navigation
    - Maintain during same session interactions
    - _Requirements: 5.2, 5.3, 5.5_

- [ ] 14. Write unit tests
  - [ ] 14.1 Test LandingPageContent component
    - Renders correct content for each agent type
    - Updates when agent prop changes
    - Displays all content fields correctly
    - _Requirements: 1.1, 4.1, 4.2, 4.3_
  
  - [ ] 14.2 Test DuplicateAgentSelector component
    - Displays current agent selection
    - Triggers onAgentChange callback
    - Shows dropdown with all agent options
    - Highlights selected agent
    - _Requirements: 2.1, 2.2, 2.4, 2.5_
  
  - [ ] 14.3 Test AgentLandingPanel component
    - Renders duplicate selector and landing content
    - Updates content when agent changes
    - Propagates agent changes to parent
    - _Requirements: 1.1, 1.3, 2.3_
  
  - [ ] 14.4 Test sliding input behavior
    - Hides on scroll event
    - Shows reveal button when hidden
    - Reveals on button click
    - Maintains scroll position
    - _Requirements: 3.1, 3.2, 3.3, 3.7_
  
  - [ ] 14.5 Test RevealButton component
    - Renders at correct position
    - Triggers reveal callback on click
    - Animates visibility correctly
    - _Requirements: 3.2, 3.4, 3.6_

- [ ] 15. Write integration tests
  - [ ] 15.1 Test agent selection synchronization
    - Change in input switcher updates duplicate selector
    - Change in duplicate selector updates input switcher
    - Both changes update landing page content
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [ ] 15.2 Test sliding input flow
    - Scroll .convo → input slides out → reveal button appears
    - Click reveal button → input slides in → reveal button disappears
    - Multiple scroll/reveal cycles work correctly
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [ ] 15.3 Test state persistence
    - Agent selection persists across interactions
    - Input visibility state maintained during session
    - State resets appropriately on navigation
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 16. Write end-to-end tests
  - [ ] 16.1 Test complete agent selection workflow
    - User selects agent from input switcher
    - Landing page updates with agent content
    - User selects different agent from duplicate selector
    - Both selectors synchronized
    - Landing page updates again
    - _Requirements: 1.1, 1.4, 2.1, 2.2, 2.3_
  
  - [ ] 16.2 Test complete sliding input workflow
    - User scrolls conversation
    - Input hides with animation
    - Reveal button appears
    - User clicks reveal button
    - Input shows with animation
    - Reveal button disappears
    - User scrolls again
    - Input hides again
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [ ] 16.3 Test combined workflow
    - User selects agent while input is hidden
    - Landing page updates correctly
    - User reveals input
    - Agent selection still synchronized
    - User changes agent from input switcher
    - Duplicate selector updates
    - _Requirements: 1.1, 2.1, 2.2, 2.3, 5.1_

- [ ] 17. Perform cross-browser testing
  - [ ] 17.1 Test in Chrome
    - Verify all animations work
    - Test agent selection
    - Test sliding input
    - _Requirements: 1.1, 3.1, 3.5_
  
  - [ ] 17.2 Test in Firefox
    - Verify all animations work
    - Test agent selection
    - Test sliding input
    - _Requirements: 1.1, 3.1, 3.5_
  
  - [ ] 17.3 Test in Safari
    - Verify all animations work
    - Test agent selection
    - Test sliding input
    - _Requirements: 1.1, 3.1, 3.5_
  
  - [ ] 17.4 Test in Edge
    - Verify all animations work
    - Test agent selection
    - Test sliding input
    - _Requirements: 1.1, 3.1, 3.5_

- [ ] 18. Perform accessibility audit
  - [ ] 18.1 Test keyboard navigation
    - Tab through all interactive elements
    - Activate with Enter/Space keys
    - Verify focus indicators visible
    - _Requirements: 2.5, 3.6_
  
  - [ ] 18.2 Test with screen reader
    - Verify all elements announced correctly
    - Test agent selection announcements
    - Test input visibility announcements
    - _Requirements: 3.6_
  
  - [ ] 18.3 Run automated accessibility tests
    - Use axe or similar tool
    - Fix any violations found
    - _Requirements: 2.5, 3.6_

- [ ] 19. Optimize and polish
  - [ ] 19.1 Performance profiling
    - Profile scroll event handling
    - Profile animation performance
    - Optimize any bottlenecks found
    - _Requirements: 3.5, 3.7_
  
  - [ ] 19.2 Visual polish
    - Refine animation timing
    - Adjust spacing and alignment
    - Ensure consistent styling
    - _Requirements: 1.5, 3.5, 4.4_
  
  - [ ] 19.3 Code review and cleanup
    - Remove console.logs
    - Add code comments
    - Ensure consistent code style
    - _Requirements: All_

- [ ] 20. Implement instant input clearing
  - [ ] 20.1 Modify chat input send handler
    - Store input value in local variable before clearing
    - Clear input synchronously (setInput('')) before any async operations
    - Maintain focus on input after clearing
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [ ] 20.2 Test input clearing timing
    - Verify input clears within 50ms of send action
    - Verify input clears before prompt bubble appears
    - Verify focus remains on input
    - Verify sent message content is preserved
    - _Requirements: 6.1, 6.2, 6.3, 10.1_

- [ ] 21. Implement immediate chain-of-thought display
  - [ ] 21.1 Add immediate state initialization
    - Set chain-of-thought state to 'initializing' synchronously on send
    - Show component within 100ms of send action
    - Display loading indicators immediately
    - _Requirements: 7.1, 7.2, 7.3, 10.2_
  
  - [ ] 21.2 Create visual activity indicators
    - Implement PulsingDots component for initializing state
    - Implement SpinnerWithText for processing state
    - Implement FlowingAnimation for streaming state
    - Add CSS animations (pulse-fast, flow)
    - _Requirements: 7.4, 7.5_
  
  - [ ] 21.3 Wire up immediate display logic
    - Trigger chain-of-thought display before input clears
    - Show "flurry of activity" with animated indicators
    - Ensure display appears before prompt bubble
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 22. Implement real-time chain-of-thought streaming
  - [ ] 22.1 Set up streaming response handler
    - Create handleStreamChunk function
    - Update state immediately on each chunk (within 50ms)
    - Append new content incrementally without replacing
    - _Requirements: 7.6, 7.7, 8.1, 8.2_
  
  - [ ] 22.2 Implement smooth content updates
    - Use React.memo for ThinkingStep components
    - Prevent flickering during updates
    - Maintain 60fps rendering performance
    - _Requirements: 8.2, 8.3, 8.5_
  
  - [ ] 22.3 Add streaming state management
    - Track status: idle → initializing → processing → streaming → complete
    - Update status as chunks arrive
    - Show rapid updates for "flurry of activity" feel
    - _Requirements: 7.5, 7.6, 8.4_

- [ ] 23. Implement smart auto-scroll for chain-of-thought
  - [ ] 23.1 Create scroll state management
    - Track isAutoScrollEnabled, isNearBottom, lastScrollTop
    - Set scroll threshold to 50px from bottom
    - Initialize with auto-scroll enabled
    - _Requirements: 9.1, 9.2, 9.5_
  
  - [ ] 23.2 Implement auto-scroll logic
    - Scroll to bottom when new content added
    - Use smooth scroll behavior
    - Only scroll if isAutoScrollEnabled is true
    - Use requestAnimationFrame for performance
    - _Requirements: 9.1, 9.2_
  
  - [ ] 23.3 Implement user scroll detection
    - Detect when user scrolls up
    - Pause auto-scroll when user scrolls up
    - Resume auto-scroll when user scrolls to bottom
    - _Requirements: 9.3, 9.4_
  
  - [ ] 23.4 Style scroll container
    - Set min-height to show 5 lines
    - Set max-height for scrollable area
    - Add scroll indicators when needed
    - Hide scrollbar when content fits
    - _Requirements: 9.5, 9.6, 9.7, 9.8_

- [ ] 24. Add CSS animations for real-time feel
  - [ ] 24.1 Create pulsing dots animation
    - Define pulse-fast keyframes (0.8s duration)
    - Add delay classes (delay-100, delay-200)
    - Apply to loading indicators
    - _Requirements: 7.4, 10.5_
  
  - [ ] 24.2 Create flowing animation
    - Define flow keyframes (1.5s duration)
    - Apply to streaming state indicator
    - Ensure smooth 60fps performance
    - _Requirements: 7.4, 10.5_
  
  - [ ] 24.3 Style chain-of-thought container
    - Add smooth scroll behavior
    - Set proper min/max heights
    - Style scrollbar appearance
    - _Requirements: 9.1, 9.2, 9.5_

- [ ] 25. Optimize performance for real-time updates
  - [ ] 25.1 Implement debounced scroll handling
    - Debounce scroll events (100ms)
    - Use useMemo for debounced handler
    - _Requirements: 10.6_
  
  - [ ] 25.2 Memoize content rendering
    - Use React.memo for ThinkingStep components
    - Memoize based on id and isComplete
    - Prevent unnecessary re-renders
    - _Requirements: 8.5, 10.5_
  
  - [ ] 25.3 Use requestAnimationFrame for scroll
    - Wrap scroll operations in requestAnimationFrame
    - Ensure 60fps performance
    - _Requirements: 10.5_

- [ ] 26. Implement optimistic UI update strategy
  - [ ] 26.1 Refactor message send flow
    - Clear input synchronously (0ms)
    - Show chain-of-thought synchronously (50ms)
    - Add prompt bubble synchronously (100ms)
    - Send to backend asynchronously
    - _Requirements: 6.1, 7.1, 10.1, 10.2, 10.3_
  
  - [ ] 26.2 Implement streaming response handler
    - Read stream chunks asynchronously
    - Update state immediately on each chunk
    - Continue until stream complete
    - _Requirements: 7.6, 7.7, 8.1, 10.4_

- [ ] 27. Add error handling for chat UX features
  - [ ] 27.1 Handle input clearing failures
    - Add fallback to direct DOM manipulation
    - Use inputRef.current.value = '' as backup
    - Log errors for debugging
    - _Requirements: 6.1_
  
  - [ ] 27.2 Handle chain-of-thought display failures
    - Ensure component appears even if state update fails
    - Show generic "Processing..." as fallback
    - Log errors for debugging
    - _Requirements: 7.1_
  
  - [ ] 27.3 Handle streaming failures
    - Buffer and reorder out-of-order chunks
    - Display available content if chunks dropped
    - Show warning for gaps in content
    - _Requirements: 7.6, 8.1_
  
  - [ ] 27.4 Handle scroll failures
    - Disable auto-scroll if it fails
    - Show "scroll to bottom" button as fallback
    - Use fallback positioning if calculation fails
    - _Requirements: 9.1_

- [ ] 28. Write unit tests for chat UX features
  - [ ] 28.1 Test instant input clearing
    - Verify input clears within 50ms
    - Verify input clears before API call
    - Verify focus remains on input
    - Verify message content preserved
    - _Requirements: 6.1, 6.2, 6.3, 6.5_
  
  - [ ] 28.2 Test immediate chain-of-thought display
    - Verify component appears within 100ms
    - Verify loading state shows immediately
    - Verify content updates on each chunk
    - Verify status transitions correctly
    - _Requirements: 7.1, 7.2, 7.3, 7.6_
  
  - [ ] 28.3 Test auto-scroll behavior
    - Verify scrolls to bottom on new content
    - Verify pauses when user scrolls up
    - Verify resumes when user scrolls to bottom
    - Verify respects scroll threshold
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ] 29. Write integration tests for complete flow
  - [ ] 29.1 Test complete send flow
    - Send message → input clears → chain appears → content streams
    - Verify timing: input clear < 50ms, chain display < 100ms
    - Verify order: chain appears before input clears
    - _Requirements: 6.1, 7.1, 10.1, 10.2_
  
  - [ ] 29.2 Test streaming flow
    - Backend sends chunks → UI updates in real-time
    - Verify no lag between chunk arrival and display
    - Verify smooth rendering without flicker
    - _Requirements: 7.6, 8.1, 8.2, 8.3_
  
  - [ ] 29.3 Test scroll behavior with streaming
    - New content arrives → auto-scrolls if at bottom
    - User scrolls up → auto-scroll pauses
    - User scrolls down → auto-scroll resumes
    - _Requirements: 9.1, 9.3, 9.4_

- [ ] 30. Perform timing and performance benchmarks
  - [ ] 30.1 Benchmark input clearing
    - Measure time from send to input clear
    - Target: < 50ms (ideal: 10ms)
    - _Requirements: 10.1_
  
  - [ ] 30.2 Benchmark chain-of-thought display
    - Measure time from send to component visible
    - Target: < 100ms (ideal: 50ms)
    - _Requirements: 10.2_
  
  - [ ] 30.3 Benchmark chunk rendering
    - Measure time from chunk arrival to display
    - Target: < 50ms (ideal: 16ms for 60fps)
    - _Requirements: 10.4, 10.5_
  
  - [ ] 30.4 Test animation performance
    - Verify 60fps during all animations
    - Check for frame drops during rapid updates
    - Verify smooth scrolling without jank
    - _Requirements: 10.5_

- [ ] 31. Documentation
  - [ ] 31.1 Update component documentation
    - Document AgentLandingPanel props and usage
    - Document DuplicateAgentSelector props and usage
    - Document LandingPageContent props and usage
    - Document RevealButton props and usage
    - Document ExtendedThinkingDisplay enhancements
    - Document ChatInput instant clear behavior
    - _Requirements: All_
  
  - [ ] 31.2 Create user guide
    - Explain agent landing pages feature
    - Explain sliding input feature
    - Explain instant input clearing
    - Explain real-time chain-of-thought
    - Include screenshots or GIFs
    - _Requirements: All_
