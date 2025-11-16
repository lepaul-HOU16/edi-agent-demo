# Implementation Plan

- [ ] 1. Create reusable layout components
  - Create ChatPageLayout component with header grid and segmented control
  - Create ChatPanelContainer component for consistent panel styling
  - Extract common CSS classes and styles from CatalogPage
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 3.1, 3.2, 3.3, 3.4_

- [ ] 2. Update ChatPage with new layout structure
  - [ ] 2.1 Implement header section with Grid [5, 7] layout
    - Add Cloudscape Header component with session name
    - Add SegmentedControl with three options (Chat, Analysis, Chain of Thought)
    - Add breadcrumbs display (Workspace › Canvas Name)
    - Add action buttons (Reset, File Drawer, agent-specific)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 3.1, 3.2, 3.3, 3.4_

  - [ ] 2.2 Implement content area with Grid [5, 7] layout
    - Add content-area wrapper div
    - Add Grid component with proper column definitions
    - Add panel div for left column
    - Add convo div for right column
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ] 2.3 Implement panel switching logic
    - Add selectedId state management
    - Implement conditional rendering based on selectedId
    - Add seg-1 panel for chat messages view
    - Add seg-2 panel for data analysis
    - Add seg-3 panel for chain of thought
    - Preserve state when switching panels
    - _Requirements: 2.3, 2.4, 5.1, 5.2, 5.3, 5.4_

  - [ ] 2.4 Integrate CatalogChatBoxCloudscape component
    - Replace existing chat component with CatalogChatBoxCloudscape
    - Pass messages, setMessages, and onSendMessage props
    - Add paddingBottom: '160px' to wrapper
    - Integrate FileDrawer component
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ] 2.5 Implement mobile responsive behavior
    - Add useMediaQuery hook for mobile detection
    - Add floating action button for file drawer on mobile
    - Position FAB at bottom: '16px', right: '16px'
    - Hide FAB when drawer is open
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 3. Preserve agent-specific functionality
  - [ ] 3.1 Maintain petrophysics agent features
    - Preserve petrophysics data state management
    - Keep petrophysics tool handlers
    - Maintain log visualization rendering
    - Preserve calculation result displays
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ] 3.2 Maintain renewable energy agent features
    - Preserve renewable energy data state
    - Keep renewable tool handlers
    - Maintain wind farm visualizations
    - Preserve terrain analysis displays
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ] 3.3 Maintain generic agent features
    - Preserve general conversation state
    - Keep generic tool handlers
    - Maintain artifact rendering
    - Preserve feature flags
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 4. Update other canvas workspace pages
  - [ ] 4.1 Update CreateNewChatPage with layout
    - Apply ChatPageLayout component
    - Add segmented control for views
    - Integrate CatalogChatBoxCloudscape
    - Test agent initialization
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 4.1, 4.2, 4.3, 4.4_

  - [ ] 4.2 Update ListChatsPage with consistent styling
    - Apply header grid layout
    - Add breadcrumbs navigation
    - Update action buttons styling
    - Test chat list display
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 3.1, 3.2, 3.3, 3.4_

  - [ ] 4.3 Update CanvasesPage with layout pattern
    - Apply header grid layout
    - Add breadcrumbs navigation
    - Update canvas cards styling
    - Test canvas creation flow
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 3.1, 3.2, 3.3, 3.4_

- [ ] 5. Testing and validation
  - [ ] 5.1 Test panel switching functionality
    - Test switching between all three panels
    - Verify state preservation on switch
    - Test with different agents
    - Verify no console errors
    - _Requirements: 2.3, 2.4_

  - [ ] 5.2 Test mobile responsive behavior
    - Test on mobile viewport
    - Verify FAB appears and functions
    - Test file drawer on mobile
    - Verify panel switching on mobile
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [ ] 5.3 Test agent-specific features
    - Test petrophysics agent with new layout
    - Test renewable energy agent with new layout
    - Test generic agent with new layout
    - Verify all visualizations render correctly
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ] 5.4 Test end-to-end user workflows
    - Test creating new chat session
    - Test sending messages and receiving responses
    - Test viewing analysis and thought process
    - Test resetting session
    - _Requirements: 1.1, 2.1, 4.1, 6.1_

- [ ] 6. Documentation and cleanup
  - [ ] 6.1 Update component documentation
    - Document ChatPageLayout component usage
    - Document ChatPanelContainer component usage
    - Add examples for agent integration
    - Document CSS classes and styling
    - _Requirements: All_

  - [ ] 6.2 Remove deprecated code
    - Remove old chat page layout code
    - Remove unused CSS classes
    - Remove deprecated components
    - Clean up imports
    - _Requirements: All_
