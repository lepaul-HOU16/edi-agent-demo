# Design Document

## Overview

This design applies the proven Cloudscape-based layout structure from CatalogPage.tsx to all Canvas Workspace chat sessions, creating a consistent session-based template for agent interactions. The design preserves agent-specific functionality while standardizing the UI structure.

## Architecture

### Component Hierarchy

```
ChatPage (Canvas Workspace)
├── AppLayout (existing wrapper)
└── ChatPageContent
    ├── Header Section (new)
    │   ├── Grid [5, 7]
    │   │   ├── Left: Header + SegmentedControl
    │   │   └── Right: Breadcrumbs + Action Buttons
    ├── Content Area (new)
    │   └── Grid [5, 7]
    │       ├── Left Panel (selectedId-based)
    │       │   ├── seg-1: Chat Messages View
    │       │   ├── seg-2: Data Analysis Panel
    │       │   └── seg-3: Chain of Thought Panel
    │       └── Right Column: Chat Interface
    │           ├── CatalogChatBoxCloudscape
    │           └── FileDrawer
```

### Layout Pattern

The design follows the exact structure from CatalogPage.tsx:

1. **Header Grid**: 5/7 split with title/controls on left, breadcrumbs/actions on right
2. **Content Grid**: 5/7 split with main panel on left, chat on right
3. **Segmented Control**: Three views (Chat, Analysis, Chain of Thought)
4. **Action Buttons**: Reset, File Drawer, agent-specific controls

## Components and Interfaces

### 1. ChatPageLayout Component

**Purpose**: Wrapper component that applies the catalog layout structure to chat sessions

**Props**:
```typescript
interface ChatPageLayoutProps {
  sessionId: string;
  sessionName: string;
  breadcrumbs: { label: string; href?: string }[];
  children: React.ReactNode;
  onReset?: () => void;
  additionalActions?: React.ReactNode;
}
```

**Responsibilities**:
- Render header grid with title and breadcrumbs
- Manage segmented control state (selectedId)
- Provide action buttons (reset, file drawer)
- Render content grid with panels

### 2. ChatPanelContainer Component

**Purpose**: Reusable container for chat session panels (analysis, chain of thought)

**Props**:
```typescript
interface ChatPanelContainerProps {
  title: string;
  children: React.ReactNode;
  emptyState?: {
    icon: string;
    title: string;
    description: string;
  };
  loading?: boolean;
}
```

**Responsibilities**:
- Render Cloudscape Container with consistent styling
- Handle empty states with centered content
- Apply scrollable content area with maxHeight
- Show loading states

### 3. Updated ChatPage Component

**Purpose**: Main chat session page using the new layout

**State Management**:
```typescript
const [selectedId, setSelectedId] = useState("seg-1"); // Chat view by default
const [messages, setMessages] = useState<Message[]>([]);
const [analysisData, setAnalysisData] = useState<any>(null);
const [fileDrawerOpen, setFileDrawerOpen] = useState(false);
```

**Panel Rendering**:
- **seg-1**: Chat messages view (existing ChatMessage components)
- **seg-2**: Data analysis panel (agent-specific visualizations)
- **seg-3**: Chain of thought panel (ChainOfThoughtDisplay component)

### 4. CatalogChatBoxCloudscape Integration

**Purpose**: Standardize chat interface across all agents

**Integration Pattern**:
```typescript
<CatalogChatBoxCloudscape
  onInputChange={setUserInput}
  userInput={userInput}
  messages={messages}
  setMessages={setMessages}
  onSendMessage={handleSendMessage}
  onOpenQueryBuilder={handleOpenQueryBuilder} // Optional
  showQueryBuilder={showQueryBuilder} // Optional
  onExecuteQuery={handleExecuteQuery} // Optional
/>
```

**Agent-Specific Handlers**:
- Each agent provides its own `handleSendMessage` implementation
- Petrophysics agent: Routes to petrophysics tools
- Renewable energy agent: Routes to renewable tools
- Generic agent: Routes to general conversation

## Data Models

### ChatSession Model

```typescript
interface ChatSession {
  id: string;
  name: string;
  agentType: 'petrophysics' | 'renewable' | 'generic';
  createdAt: string;
  updatedAt: string;
  messages: Message[];
  metadata?: {
    analysisData?: any;
    visualizations?: any[];
    thoughtSteps?: any[];
  };
}
```

### PanelState Model

```typescript
interface PanelState {
  selectedId: 'seg-1' | 'seg-2' | 'seg-3';
  chatView: {
    messages: Message[];
    scrollPosition: number;
  };
  analysisView: {
    data: any;
    queryType: string;
  };
  thoughtView: {
    steps: any[];
    autoScroll: boolean;
  };
}
```

## Error Handling

### Panel Switching Errors

**Scenario**: User switches panels while data is loading

**Handling**:
1. Preserve loading state in each panel
2. Show loading indicator in target panel
3. Allow switching back to previous panel
4. Complete data loading in background

### Agent Communication Errors

**Scenario**: Agent fails to respond or times out

**Handling**:
1. Display error message in chat
2. Preserve chat history
3. Allow retry without losing context
4. Log error for debugging

### State Persistence Errors

**Scenario**: Panel state fails to persist on switch

**Handling**:
1. Use React state to maintain panel data
2. Implement useEffect to save state on change
3. Restore state when switching back
4. Fallback to empty state if restoration fails

## Testing Strategy

### Unit Tests

1. **ChatPageLayout Component**
   - Test header rendering with different props
   - Test segmented control state management
   - Test action button click handlers
   - Test breadcrumb rendering

2. **ChatPanelContainer Component**
   - Test empty state rendering
   - Test loading state display
   - Test scrollable content area
   - Test container styling

3. **Panel Switching Logic**
   - Test selectedId state updates
   - Test panel visibility based on selectedId
   - Test state preservation on switch
   - Test mobile responsive behavior

### Integration Tests

1. **Chat Session Flow**
   - Test sending message in chat view
   - Test switching to analysis view
   - Test viewing chain of thought
   - Test file drawer integration

2. **Agent-Specific Features**
   - Test petrophysics agent with layout
   - Test renewable energy agent with layout
   - Test generic agent with layout
   - Test agent-specific visualizations

### End-to-End Tests

1. **Complete User Workflow**
   - Create new chat session
   - Send messages and receive responses
   - Switch between all three panels
   - View analysis and thought process
   - Reset session and verify state clear

2. **Mobile Experience**
   - Test responsive layout on mobile
   - Test floating action button
   - Test file drawer on mobile
   - Test panel switching on mobile

## Implementation Notes

### CSS Classes

The design uses specific CSS classes from the catalog page:

- `.main-container`: Top-level container with data-page attribute
- `.reset-chat`: Header section wrapper
- `.content-area`: Content grid wrapper
- `.panel`: Left panel container
- `.convo`: Right column chat container
- `.toggles`: Action buttons wrapper

### State Management

Panel state should be managed at the ChatPage level:

```typescript
// Panel state
const [selectedId, setSelectedId] = useState("seg-1");

// Panel-specific data
const [messages, setMessages] = useState<Message[]>([]);
const [analysisData, setAnalysisData] = useState<any>(null);
const [thoughtSteps, setThoughtSteps] = useState<any[]>([]);

// UI state
const [fileDrawerOpen, setFileDrawerOpen] = useState(false);
const [isMobile, setIsMobile] = useState(false);
```

### Agent Integration

Each agent should provide:

1. **Message Handler**: `handleSendMessage(message: string) => Promise<void>`
2. **Analysis Data**: Optional data for analysis panel
3. **Thought Steps**: Optional steps for chain of thought panel
4. **Custom Actions**: Optional additional action buttons

### Migration Strategy

1. **Phase 1**: Create reusable layout components
2. **Phase 2**: Migrate ChatPage to use new layout
3. **Phase 3**: Test with all agent types
4. **Phase 4**: Update other canvas workspace pages
5. **Phase 5**: Remove old layout code

## Performance Considerations

### Panel Rendering

- Use conditional rendering for panels (only render active panel)
- Preserve panel state when switching (don't unmount)
- Lazy load heavy visualizations in analysis panel
- Debounce panel switching to prevent rapid state changes

### Chat Message Rendering

- Virtualize long message lists (>100 messages)
- Lazy load message artifacts
- Optimize re-renders with React.memo
- Use useCallback for message handlers

### Mobile Optimization

- Reduce panel complexity on mobile
- Simplify visualizations for small screens
- Optimize touch interactions
- Minimize re-renders on orientation change

## Accessibility

### Keyboard Navigation

- Tab through segmented control options
- Arrow keys to switch panels
- Enter to activate selected panel
- Escape to close file drawer

### Screen Reader Support

- Announce panel switches
- Label all action buttons
- Provide alt text for icons
- Announce loading states

### Visual Indicators

- Clear active state for segmented control
- Loading spinners for async operations
- Error messages with proper contrast
- Focus indicators for interactive elements
