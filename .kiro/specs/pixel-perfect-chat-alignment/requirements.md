# Requirements Document

## Introduction

This specification addresses the need for pixel-perfect visual consistency between the Data Catalog chat interface (CatalogChatBoxCloudscape) and the Workspace chat interface (ChatBox). Currently, these two chat interfaces have subtle but noticeable differences in layout, spacing, scrolling behavior, button positioning, and responsiveness. The goal is to ensure that when a user rapidly switches between browser tabs showing the Data Catalog and a Workspace chat, there should be ZERO pixel shifts - every element should align exactly.

## Glossary

- **Data Catalog Chat**: The chat interface used in the CatalogPage component, implemented by CatalogChatBoxCloudscape.tsx
- **Workspace Chat**: The chat interface used in individual chat sessions (chat/:sessionId), implemented by ChatBox.tsx
- **Pixel-Perfect Alignment**: Visual consistency where elements occupy identical positions, sizes, and spacing across different interfaces
- **Visual Shift**: Any perceptible movement of UI elements when switching between interfaces
- **Messages Container**: The scrollable area containing chat messages
- **Controls**: The input area at the bottom of the chat interface containing the prompt input and buttons
- **PTT Button**: Push-to-Talk button for voice input
- **Toggle Button**: Button that shows/hides the search input
- **Scroll-to-Bottom Button**: Floating action button that appears when user scrolls up

## Requirements

### Requirement 1: Identical Container Dimensions

**User Story:** As a user, I want the chat containers to have identical dimensions, so that switching between Data Catalog and Workspace chats feels seamless.

#### Acceptance Criteria

1. WHEN viewing Data Catalog chat THEN the messages container SHALL have height calc(100vh - 108px) with padding-bottom 100px
2. WHEN viewing Workspace chat THEN the messages container SHALL have height calc(100vh - 108px) with padding-bottom 100px
3. WHEN viewing either chat interface THEN the controls container SHALL be positioned at bottom 40px with identical width constraints
4. WHEN viewing either chat interface THEN the overall chat container SHALL use identical flex layout properties
5. WHEN the viewport is resized THEN both chat interfaces SHALL respond identically to maintain alignment

### Requirement 2: Consistent Message Spacing and Padding

**User Story:** As a user, I want messages to have identical spacing and padding, so that the visual rhythm is consistent across interfaces.

#### Acceptance Criteria

1. WHEN messages are displayed THEN each message SHALL have marginBottom 16px in both interfaces
2. WHEN the messages container is rendered THEN it SHALL have padding 20px on all sides in both interfaces
3. WHEN user and AI messages are displayed THEN the avatar size SHALL be 32x32 pixels in both interfaces
4. WHEN message content is rendered THEN the gap between avatar and content SHALL be 8px in both interfaces
5. WHEN multiple messages are stacked THEN the vertical spacing SHALL be identical across both interfaces

### Requirement 3: Identical Scroll Behavior

**User Story:** As a user, I want scrolling to behave identically, so that I have a consistent interaction experience.

#### Acceptance Criteria

1. WHEN new messages arrive THEN both interfaces SHALL auto-scroll to bottom using identical timing (300ms delay, requestAnimationFrame)
2. WHEN user scrolls up THEN both interfaces SHALL disable auto-scroll at the same threshold (10px from bottom)
3. WHEN user manually scrolls to bottom THEN both interfaces SHALL re-enable auto-scroll identically
4. WHEN the scroll-to-bottom button appears THEN it SHALL be positioned at bottom 120px right 20px in both interfaces
5. WHEN scrolling occurs THEN the scroll container SHALL use identical overflow properties (overflow-y: auto, overflow-x: hidden)

### Requirement 4: Consistent Button Positioning

**User Story:** As a user, I want all buttons to be positioned identically, so that muscle memory works across interfaces.

#### Acceptance Criteria

1. WHEN the PTT button is rendered THEN it SHALL be positioned at fixed right 22px bottom 98px with z-index 1002 in both interfaces
2. WHEN the toggle button is rendered THEN it SHALL be positioned at fixed right 22px bottom 50px with z-index 1001 in both interfaces
3. WHEN the scroll-to-bottom button appears THEN it SHALL be positioned at fixed bottom 120px right 20px with z-index 1400 in both interfaces
4. WHEN buttons are hovered THEN they SHALL use identical hover states and transitions in both interfaces
5. WHEN the input is hidden THEN the toggle button SHALL use variant="primary" in both interfaces

### Requirement 5: Identical Controls Layout

**User Story:** As a user, I want the input controls to look and behave identically, so that I don't have to relearn the interface.

#### Acceptance Criteria

1. WHEN the controls are rendered THEN they SHALL use Grid with gridDefinition [{ colspan: 5 }, { colspan: 7 }] in both interfaces
2. WHEN the input background is rendered THEN it SHALL have identical styling (background #006ce0, border-radius 8px, border 3px solid) in both interfaces
3. WHEN the input slides THEN it SHALL use transform translateX with identical calculation (calc(100vw - 50% + 24.95%)) in both interfaces
4. WHEN the input slides THEN it SHALL use transition 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' in both interfaces
5. WHEN the ExpandablePromptInput is rendered THEN it SHALL have identical placeholder text and styling in both interfaces

### Requirement 6: Consistent Voice Recording UI

**User Story:** As a user, I want voice recording to display identically, so that I have a consistent voice input experience.

#### Acceptance Criteria

1. WHEN voice recording starts THEN the VoiceTranscriptionDisplay SHALL appear with marginBottom 16px in both interfaces
2. WHEN voice recording is active THEN the input SHALL hide using identical logic in both interfaces
3. WHEN voice transcription completes THEN the display SHALL clear immediately before sending in both interfaces
4. WHEN PTT button state changes THEN it SHALL update isVoiceRecording identically in both interfaces
5. WHEN recording stops THEN the input visibility SHALL remain unchanged (not automatically shown) in both interfaces

### Requirement 7: Identical Loading States

**User Story:** As a user, I want loading indicators to appear identically, so that I have consistent feedback.

#### Acceptance Criteria

1. WHEN a message is being processed THEN the loading indicator SHALL appear at position absolute bottom 80px left 50% transform translateX(-50%) in both interfaces
2. WHEN loading indicator is shown THEN it SHALL use identical styling (background #ffffff, padding 8px 16px, border-radius 8px) in both interfaces
3. WHEN loading indicator is shown THEN it SHALL display "Processing your query..." text in both interfaces
4. WHEN loading indicator is shown THEN it SHALL use Cloudscape Spinner component with size="normal" in both interfaces
5. WHEN loading completes THEN the indicator SHALL disappear with identical timing in both interfaces

### Requirement 8: Consistent Responsive Behavior

**User Story:** As a user, I want both interfaces to respond to screen size changes identically, so that the experience is consistent across devices.

#### Acceptance Criteria

1. WHEN viewport width is less than 1920px THEN both interfaces SHALL apply padding 0 40px to app-container
2. WHEN viewport width is 1920px or greater THEN both interfaces SHALL remove side padding identically
3. WHEN controls are rendered on narrow screens THEN the colspan-7 column SHALL have padding-left 40px padding-right 77px in both interfaces
4. WHEN viewport width exceeds 2000px THEN both interfaces SHALL remove right padding from controls identically
5. WHEN screen size changes THEN all fixed-position elements SHALL maintain identical positions in both interfaces

### Requirement 9: Identical Message Rendering

**User Story:** As a user, I want messages to render identically, so that content appears consistent across interfaces.

#### Acceptance Criteria

1. WHEN AI messages are rendered THEN they SHALL use identical avatar styling (32x32 circle, #0073bb background) in both interfaces
2. WHEN user messages are rendered THEN they SHALL use identical ChatMessage component in both interfaces
3. WHEN message content is rendered THEN it SHALL use identical ReactMarkdown configuration in both interfaces
4. WHEN thinking indicator is shown THEN it SHALL use identical ThinkingIndicator component in both interfaces
5. WHEN messages are filtered THEN both interfaces SHALL use identical shouldDisplayMessage logic

### Requirement 10: Consistent Z-Index Layering

**User Story:** As a user, I want UI elements to layer identically, so that interactions are predictable.

#### Acceptance Criteria

1. WHEN controls are rendered THEN they SHALL have z-index 1000 in both interfaces
2. WHEN toggle button is rendered THEN it SHALL have z-index 1001 in both interfaces
3. WHEN PTT button is rendered THEN it SHALL have z-index 1002 in both interfaces
4. WHEN scroll-to-bottom button is rendered THEN it SHALL have z-index 1400 in both interfaces
5. WHEN loading indicator is rendered THEN it SHALL have z-index 1000 in both interfaces

### Requirement 11: Identical CSS Class Usage

**User Story:** As a developer, I want both interfaces to use identical CSS classes, so that styling is consistent and maintainable.

#### Acceptance Criteria

1. WHEN messages container is rendered THEN it SHALL use className "messages-container" in both interfaces
2. WHEN controls are rendered THEN they SHALL use className "controls" in both interfaces
3. WHEN input background is rendered THEN it SHALL use className "input-bkgd" in both interfaces
4. WHEN catalog chat container is rendered THEN it SHALL use className "catalog-chat-container" in both interfaces
5. WHEN workspace chat uses catalog styling THEN it SHALL apply data-page="catalog" attribute for CSS targeting

### Requirement 12: Consistent Auto-Scroll Timing

**User Story:** As a user, I want auto-scrolling to happen at the same speed, so that the experience feels consistent.

#### Acceptance Criteria

1. WHEN auto-scroll is triggered THEN both interfaces SHALL use requestAnimationFrame for smooth rendering
2. WHEN auto-scroll is triggered THEN both interfaces SHALL use 300ms setTimeout delay before scrolling
3. WHEN scrollIntoView is used THEN both interfaces SHALL use behavior: 'smooth', block: 'end' options
4. WHEN scrollTo is used THEN both interfaces SHALL use behavior: 'smooth' option
5. WHEN scroll animation completes THEN both interfaces SHALL log final position after 800ms delay

### Requirement 13: Identical Input Clearing Behavior

**User Story:** As a user, I want input to clear instantly when I send a message, so that I can type the next message immediately.

#### Acceptance Criteria

1. WHEN user sends a message THEN the input SHALL clear immediately via onInputChange('') before any async operations in both interfaces
2. WHEN input is cleared THEN both interfaces SHALL log the clearing duration for performance monitoring
3. WHEN an error occurs THEN both interfaces SHALL restore the input text identically
4. WHEN voice transcription completes THEN both interfaces SHALL clear voiceTranscription before sending
5. WHEN message is sent THEN both interfaces SHALL prevent duplicate submissions using isSubmittingRef

### Requirement 14: Consistent Message Deduplication

**User Story:** As a developer, I want messages to be deduplicated identically, so that duplicate messages never appear.

#### Acceptance Criteria

1. WHEN messages are displayed THEN both interfaces SHALL deduplicate by message ID using Map
2. WHEN duplicates are found THEN both interfaces SHALL log warning with duplicate count
3. WHEN duplicates are found THEN both interfaces SHALL log which IDs were duplicated
4. WHEN messages are filtered THEN both interfaces SHALL use identical shouldDisplayMessage function
5. WHEN ai-stream messages appear THEN both interfaces SHALL filter them out of the conversation

### Requirement 15: Identical Keyboard and Accessibility

**User Story:** As a user, I want keyboard navigation and accessibility to work identically, so that I can use either interface efficiently.

#### Acceptance Criteria

1. WHEN user presses Enter in input THEN both interfaces SHALL send the message identically
2. WHEN buttons are focused THEN both interfaces SHALL show identical focus indicators
3. WHEN screen reader is used THEN both interfaces SHALL provide identical aria-labels
4. WHEN keyboard navigation is used THEN both interfaces SHALL have identical tab order
5. WHEN reduced motion is preferred THEN both interfaces SHALL respect prefers-reduced-motion identically
