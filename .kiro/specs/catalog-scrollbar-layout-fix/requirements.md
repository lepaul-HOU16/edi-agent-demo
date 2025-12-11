# Requirements Document

## Introduction

Fix the layout shift issue in the Catalog page where the reset-chat header and content-area shift upward when a scrollbar appears in the conversation panel (.convo > .messages-container).

## Glossary

- **System**: The Catalog page layout system
- **reset-chat**: The header area containing page title, segmented controls, and action buttons
- **content-area**: The main content area containing the panel (left) and convo (right) columns
- **panel**: The left column containing map/analysis/chain-of-thought views
- **convo**: The right column containing the chat interface
- **messages-container**: The scrollable container inside convo where chat messages appear
- **layout shift**: Unwanted movement of page elements when scrollbar appears

## Requirements

### Requirement 1

**User Story:** As a user viewing the Catalog page, I want the header and content layout to remain stable when chat messages cause a scrollbar to appear, so that the interface doesn't jump around unexpectedly.

#### Acceptance Criteria

1. WHEN a scrollbar appears in the messages-container THEN the reset-chat header SHALL remain in its original position
2. WHEN a scrollbar appears in the messages-container THEN the content-area SHALL remain in its original position
3. WHEN a scrollbar appears in the messages-container THEN the panel column SHALL remain in its original position
4. WHEN a scrollbar appears in the messages-container THEN the convo column SHALL remain in its original position
5. WHEN a scrollbar appears in the messages-container THEN no horizontal shift SHALL occur in any layout elements
