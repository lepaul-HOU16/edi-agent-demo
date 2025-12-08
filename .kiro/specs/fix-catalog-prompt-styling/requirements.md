# Requirements Document

## Introduction

The Catalog page has INSANELY BROKEN prompt styling where user message avatars are rendering at MASSIVE sizes, completely destroying the UI. The user icon appears as a giant black circle that takes up a huge portion of the screen, making the chat interface unusable.

## Glossary

- **UserAvatar**: The icon/avatar displayed next to user messages in the chat interface
- **CatalogChatBox**: The chat component used in the Catalog page for data queries
- **PersonIcon**: Material-UI icon component used to represent the user
- **MessageBubble**: The container holding the user's message text

## Requirements

### Requirement 1: User Avatar Must Be Normal Size

**User Story:** As a user of the Catalog page, I want user message avatars to be a normal, reasonable size so that I can actually see and use the chat interface.

#### Acceptance Criteria

1. WHEN a user message is displayed THEN the user avatar SHALL be exactly 32x32 pixels
2. WHEN the avatar is rendered THEN it SHALL NOT scale beyond its specified dimensions
3. WHEN multiple messages are displayed THEN all user avatars SHALL be consistently sized at 32x32 pixels
4. WHEN the page is resized THEN the avatar size SHALL remain fixed at 32x32 pixels
5. WHEN dark mode is toggled THEN the avatar size SHALL remain unchanged

### Requirement 2: Avatar Styling Must Be Consistent

**User Story:** As a developer, I want avatar styling to be consistent across all chat components so that the UI looks professional and polished.

#### Acceptance Criteria

1. WHEN rendering user avatars THEN the system SHALL use the same styling rules across ChatPage and CatalogPage
2. WHEN CSS is applied THEN no global styles SHALL override the avatar dimensions
3. WHEN Cloudscape components are used THEN their default sizing SHALL be overridden to match our design
4. WHEN Material-UI icons are used THEN their size SHALL be explicitly set to prevent scaling
5. WHEN flexbox layouts are used THEN the avatar SHALL have flexShrink: 0 to prevent compression

### Requirement 3: Message Layout Must Be Preserved

**User Story:** As a user, I want the message layout to remain clean and readable with properly sized avatars.

#### Acceptance Criteria

1. WHEN a user message is displayed THEN the avatar SHALL be aligned to the right
2. WHEN the message bubble is rendered THEN it SHALL have a maximum width of 80%
3. WHEN the avatar and message are displayed THEN there SHALL be an 8px gap between them
4. WHEN long messages are displayed THEN the avatar SHALL remain at the top of the message
5. WHEN the layout is rendered THEN the avatar SHALL NOT push other elements off screen

### Requirement 4: Fix Must Apply to All Catalog Components

**User Story:** As a developer, I want the fix to apply everywhere user avatars are rendered in the Catalog page.

#### Acceptance Criteria

1. WHEN CatalogChatBoxCloudscape renders user messages THEN avatars SHALL be 32x32 pixels
2. WHEN CatalogPage displays chat history THEN all user avatars SHALL be correctly sized
3. WHEN new messages are added THEN their avatars SHALL match the fixed size
4. WHEN the component re-renders THEN avatar sizes SHALL remain consistent
5. WHEN CSS is updated THEN no regressions SHALL be introduced to other components

### Requirement 5: Visual Regression Prevention

**User Story:** As a QA engineer, I want to ensure this fix doesn't break other parts of the UI.

#### Acceptance Criteria

1. WHEN the fix is applied THEN AI message icons SHALL remain unchanged
2. WHEN the fix is applied THEN the prompt input SHALL remain unchanged
3. WHEN the fix is applied THEN the message text SHALL remain readable
4. WHEN the fix is applied THEN the overall layout SHALL remain functional
5. WHEN the fix is deployed THEN no console errors SHALL be introduced

