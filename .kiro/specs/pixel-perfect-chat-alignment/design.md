# Design Document: Pixel-Perfect Chat Alignment

## Overview

This design document outlines the technical approach for achieving pixel-perfect visual consistency between the Data Catalog chat interface (CatalogChatBoxCloudscape) and the Workspace chat interface (ChatBox). The goal is to ensure that when users rapidly switch between browser tabs showing these two interfaces, there is ZERO perceptible pixel shift - every element should align exactly.

The Data Catalog chat has been extensively refined and serves as the **golden standard** for layout, spacing, scrolling, button positioning, and responsive behavior. This design will systematically apply all those refinements to the Workspace chat.

## Architecture

### Component Hierarchy

**Current State:**
```
ChatBox (Workspace)
├── messages-container (MUI List)
│   ├── ListItem (per message)
│   │   └── ChatMessage
│   ├── ThinkingIndicator
│   └── VoiceTranscriptionDisplay
├── controls (Grid)
│   └── input-bkgd
│       ├── ExpandablePromptInput
│       └── AgentSwitcher
├── PTT Button (fixed)
├── Toggle Button (fixed)
└── Scroll-to-Bottom Button (Fab)

CatalogChatBoxCloudscape (Data Catalog) ✅ GOLDEN STANDARD
├── messages-container (div)
│   ├── div (per message)
│   │   └── ChatMessage / CustomAIMessage
│   ├── VoiceTranscriptionDisplay
│   └── messagesEndRef
├── controls (Grid)
│   └── input-bkgd
│       ├── ExpandablePromptInput
│       └── ButtonDropdown
├── PTT Button (fixed)
├── Toggle Button (fixed)
└── Scroll-to-Bottom Button (Cloudscape Button)
```

**Target State:**
Both components will use identical structure, styling, and behavior patterns.

## Components and Interfaces

### 1. Messages Container Alignment

**Current Differences:**
- ChatBox uses MUI `<List>` and `<ListItem>` wrappers
- CatalogChatBoxCloudscape uses plain `<div>` elements
- ChatBox has `padding-left/right` on ListItems
- Different scroll container styling

**Design Solution:**

**Remove MUI List wrappers** - Replace with plain divs to match catalog structure:
```tsx
// BEFORE (ChatBox)
<List>
  {displayedMessages.map((message, index) => (
    <ListItem key={stableKey}>
      <ChatMessage message={message} />
    </ListItem>
  ))}
</List>

// AFTER (ChatBox - matching Catalog)
<div>
  {displayedMessages.map((message, index) => (
    <div key={stableKey} style={{ marginBottom: '16px' }}>
      <ChatMessage message={message} />
    </div>
  ))}
</div>
```

**Apply identical CSS:**
```css
.messages-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 20px;
  padding-bottom: 100px;
}
```

**Key Properties:**
- `position: absolute` - Isolates from layout calculations
- `padding: 20px` - Consistent spacing on all sides
- `padding-bottom: 100px` - Space for controls
- `marginBottom: 16px` - Per-message spacing

### 2. Scroll Behavior Standardization

**Current Differences:**
- ChatBox uses `performAutoScroll()` with complex buffer calculations
- CatalogChatBoxCloudscape uses simpler `scrollToBottom()`
- Different timing and animation approaches

**Design Solution:**

**Unified Auto-Scroll Function:**
```tsx
const scrollToBottom = useCallback(() => {
  if (messagesContainerRef.current) {
    console.log('Scrolling to bottom, messages length:', messages.length);
    messagesContainerRef.current.scrollTo({
      top: messagesContainerRef.current.scrollHeight,
      behavior: 'smooth'
    });
    setTimeout(() => {
      setIsScrolledToBottom(true);
    }, 500);
  }
}, [messages.length]);
```

**Unified Auto-Scroll Effect:**
```tsx
useEffect(() => {
  if (messagesContainerRef.current && messages.length > 0) {
    const timeoutId = setTimeout(() => {
      requestAnimationFrame(() => {
        scrollToBottom();
      });
    }, 300);
    return () => clearTimeout(timeoutId);
  }
}, [messages.length, scrollToBottom]);
```

**Key Properties:**
- `300ms` delay before scroll
- `requestAnimationFrame` for smooth rendering
- `behavior: 'smooth'` for animation
- `500ms` delay before updating scroll state

### 3. Button Positioning Standardization

**Current Differences:**
- ChatBox PTT button at `bottom: 98px`
- CatalogChatBoxCloudscape PTT button at `bottom: 90px`
- Different z-index values
- ChatBox uses MUI Fab, Catalog uses Cloudscape Button

**Design Solution:**

**Standardize ALL button positions to match Catalog:**


```tsx
// PTT Button - EXACT catalog positioning
<div style={{
  position: 'fixed',
  right: '22px',
  bottom: '90px',  // Changed from 98px to match catalog
  zIndex: 10002,   // Changed from 1002 to match catalog
}}>
  <PushToTalkButton {...props} />
</div>

// Toggle Button - EXACT catalog positioning
<div style={{
  position: 'fixed',
  right: '22px',
  bottom: '50px',
  zIndex: 10001,   // Changed from 1001 to match catalog
}}>
  <Button {...props} />
</div>

// Scroll-to-Bottom Button - EXACT catalog positioning
{!isScrolledToBottom && (
  <div style={{
    position: 'fixed',
    bottom: '10px',  // Changed from 120px to match catalog
    right: '22px',
    zIndex: 1400
  }}>
    <Button
      variant="primary"
      iconName="angle-down"
      onClick={scrollToBottom}
      ariaLabel="Scroll to bottom"
    />
  </div>
)}
```

**Replace MUI Fab with Cloudscape Button:**
- Remove `<Fab>` and `<KeyboardArrowDownIcon>`
- Use Cloudscape `<Button>` with `iconName="angle-down"`
- Ensures consistent styling and behavior

### 4. Controls Layout Alignment

**Current Differences:**
- Both use Grid with colspan [5, 7] ✅
- Both use sliding animation ✅
- ChatBox has AgentSwitcher, Catalog has ButtonDropdown
- Different placeholder text

**Design Solution:**

**Maintain Grid structure** (already correct):
```tsx
<Grid
  disableGutters
  gridDefinition={[{ colspan: 5 }, { colspan: 7 }]}
>
  <div></div>
  <div className='input-bkgd'>
    <ExpandablePromptInput {...props} />
    {/* Agent-specific controls */}
  </div>
</Grid>
```

**Standardize placeholder text:**
- Catalog: "Ask me a question about your data"
- ChatBox: "Ask a question"
- **Decision:** Keep different placeholders (context-appropriate)

**Ensure identical sliding animation:**
```tsx
<div 
  className='controls'
  style={{
    transform: isInputVisible ? 'translateX(0)' : 'translateX(calc(100vw - 50% + 24.95%))',
    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  }}
>
```

### 5. Voice Recording UI Standardization

**Current Differences:**
- Both show VoiceTranscriptionDisplay ✅
- Both hide input on recording start ✅
- Positioning and styling may differ

**Design Solution:**

**Ensure identical rendering:**
```tsx
{isVoiceRecording && (
  <div style={{ marginBottom: '16px' }}>
    <VoiceTranscriptionDisplay
      transcription={voiceTranscription}
      isRecording={isVoiceRecording}
      isVisible={true}
    />
  </div>
)}
```

**Ensure identical state management:**
```tsx
const handleVoiceRecordingStateChange = useCallback((isRecording: boolean) => {
  setIsVoiceRecording(isRecording);
  if (isRecording && isInputVisible) {
    console.log('🎤 Voice recording started, hiding input');
    setIsInputVisible(false);
  }
}, [isInputVisible]);
```

### 6. Loading State Alignment

**Current Differences:**
- ChatBox: No visible loading indicator in controls area
- CatalogChatBoxCloudscape: Shows spinner with "Processing your query..." text
- Different positioning

**Design Solution:**

**Add loading indicator to ChatBox** (matching Catalog exactly):


```tsx
{isLoading && (
  <div style={{
    position: 'absolute',
    bottom: '80px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: '8px 16px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    zIndex: 1000,
    border: '1px solid #e9ebed'
  }}>
    <Spinner size="normal" />
    <span style={{ marginLeft: '8px', fontSize: '14px', color: '#232f3e' }}>
      Processing your query...
    </span>
  </div>
)}
```

**Key Properties:**
- `position: absolute` - Floats above content
- `bottom: 80px` - Above controls
- `left: 50%` + `transform: translateX(-50%)` - Centered
- Cloudscape `<Spinner>` component
- Identical styling and text

## Data Models

### Message Display State

Both components use identical message filtering and display logic:

```typescript
interface DisplayedMessage {
  id: string;
  role: 'human' | 'ai' | 'ai-stream' | 'tool';
  content: { text: string };
  responseComplete: boolean;
  // ... other properties
}

// Unified filter function
const shouldDisplayMessage = useCallback((message: Message) => {
  switch (message.role) {
    case 'ai':
      return message.responseComplete || 
             (message.content?.text?.trim().length > 0);
    case 'ai-stream':
      return true;
    case 'tool':
      return ['renderAssetTool', 'userInputTool', 'createProject']
        .includes(message.toolName);
    default:
      return true;
  }
}, []);
```

### Scroll State Management

```typescript
interface ScrollState {
  isScrolledToBottom: boolean;
  autoScroll: boolean;
  messageCount: number;
}

// Unified scroll detection
const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
  const container = e.currentTarget;
  const isAtBottom = container.scrollHeight - container.scrollTop 
    <= container.clientHeight + 5;
  setIsScrolledToBottom(isAtBottom);
}, []);
```

### Voice Recording State

```typescript
interface VoiceState {
  isVoiceRecording: boolean;
  voiceTranscription: string;
  isInputVisible: boolean;
}

// Unified state transitions
// Recording starts → hide input
// Recording stops → input stays hidden (user must manually show)
// Transcription completes → clear display, send message
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Container Dimension Consistency
*For any* viewport size, the messages container height SHALL be calc(100vh - 108px) with padding-bottom 100px in both interfaces
**Validates: Requirements 1.1, 1.2**

### Property 2: Message Spacing Uniformity
*For any* message in the chat, the marginBottom SHALL be 16px and the messages container padding SHALL be 20px in both interfaces
**Validates: Requirements 2.1, 2.2, 2.3**

### Property 3: Auto-Scroll Timing Consistency
*For any* new message arrival, auto-scroll SHALL trigger after 300ms delay using requestAnimationFrame in both interfaces
**Validates: Requirements 3.1, 12.1, 12.2**

### Property 4: Button Position Invariance
*For any* viewport state, PTT button SHALL be at fixed right 22px bottom 90px with z-index 10002 in both interfaces
**Validates: Requirements 4.1**

### Property 5: Toggle Button Position Invariance
*For any* viewport state, toggle button SHALL be at fixed right 22px bottom 50px with z-index 10001 in both interfaces
**Validates: Requirements 4.2**

### Property 6: Scroll Button Position Invariance
*For any* scroll state where not at bottom, scroll-to-bottom button SHALL be at fixed bottom 10px right 22px with z-index 1400 in both interfaces
**Validates: Requirements 4.3**

### Property 7: Controls Sliding Animation Consistency
*For any* input visibility toggle, the transform SHALL use translateX(calc(100vw - 50% + 24.95%)) with transition 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' in both interfaces
**Validates: Requirements 5.3, 5.4**

### Property 8: Voice Recording UI Consistency
*For any* voice recording session, VoiceTranscriptionDisplay SHALL appear with marginBottom 16px in both interfaces
**Validates: Requirements 6.1**

### Property 9: Loading Indicator Position Consistency
*For any* loading state, the spinner SHALL be at position absolute bottom 80px left 50% with transform translateX(-50%) in both interfaces
**Validates: Requirements 7.1, 7.2**

### Property 10: Responsive Padding Consistency
*For any* viewport width less than 1920px, app-container SHALL have padding 0 40px in both interfaces
**Validates: Requirements 8.1**

### Property 11: Z-Index Layering Consistency
*For any* UI state, controls SHALL have z-index 1000, toggle button 10001, PTT button 10002, and scroll button 1400 in both interfaces
**Validates: Requirements 10.1, 10.2, 10.3, 10.4**

### Property 12: CSS Class Name Consistency
*For any* rendered element, messages-container, controls, and input-bkgd classes SHALL be used identically in both interfaces
**Validates: Requirements 11.1, 11.2, 11.3**

### Property 13: Input Clearing Speed Consistency
*For any* message send action, input SHALL clear via onInputChange('') before any async operations in both interfaces
**Validates: Requirements 13.1, 13.2**

### Property 14: Message Deduplication Consistency
*For any* message array, deduplication SHALL use Map with message ID as key in both interfaces
**Validates: Requirements 14.1, 14.2**

### Property 15: Scroll Detection Threshold Consistency
*For any* scroll event, isAtBottom SHALL be true when scrollHeight - scrollTop <= clientHeight + 5 in both interfaces
**Validates: Requirements 3.2**

## Error Handling

### Scroll Failures
- If `scrollIntoView` fails, fall back to `scrollTo`
- Log errors but don't block UI
- Maintain scroll state consistency

### Message Rendering Errors
- Wrap message rendering in error boundaries
- Display fallback UI for failed messages
- Log errors for debugging

### Voice Recording Errors
- Handle microphone permission denials gracefully
- Clear transcription state on errors
- Restore input visibility on failures

## Testing Strategy

### Visual Regression Testing
1. **Tab Flip Test**: Rapidly switch between Data Catalog and Workspace chat tabs
2. **Measure pixel shifts**: Use browser dev tools to verify zero movement
3. **Test all viewport sizes**: 768px, 1024px, 1920px, 2560px
4. **Test all UI states**: Loading, voice recording, scrolled up, scrolled down

### Unit Testing
1. **Scroll behavior**: Verify auto-scroll triggers at correct times
2. **Button positioning**: Verify fixed positions remain constant
3. **Message spacing**: Verify margins and padding
4. **State management**: Verify voice recording state transitions

### Integration Testing
1. **End-to-end message flow**: Send message → see response → verify layout
2. **Voice input flow**: Record → transcribe → send → verify layout
3. **Scroll interaction**: Scroll up → new message → verify no auto-scroll
4. **Input toggle**: Hide → show → verify animation

### Property-Based Testing
We will use **fast-check** (TypeScript property-based testing library) to verify universal properties.

**Configuration**: Each property test will run a minimum of 100 iterations.

**Test Tagging Format**: `**Feature: pixel-perfect-chat-alignment, Property {number}: {property_text}**`

#### Property Test 1: Container Dimensions
**Feature: pixel-perfect-chat-alignment, Property 1: Container Dimension Consistency**
```typescript
import fc from 'fast-check';

test('messages container has identical dimensions', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 768, max: 2560 }), // viewport width
      fc.integer({ min: 600, max: 1440 }), // viewport height
      (width, height) => {
        // Render both components with viewport size
        const catalogHeight = getMessagesContainerHeight('catalog', height);
        const chatHeight = getMessagesContainerHeight('chat', height);
        
        expect(catalogHeight).toBe(chatHeight);
        expect(catalogHeight).toBe(`calc(100vh - 108px)`);
      }
    ),
    { numRuns: 100 }
  );
});
```

#### Property Test 2: Message Spacing
**Feature: pixel-perfect-chat-alignment, Property 2: Message Spacing Uniformity**
```typescript
test('all messages have identical spacing', () => {
  fc.assert(
    fc.property(
      fc.array(fc.record({ id: fc.string(), text: fc.string() }), { minLength: 1, maxLength: 50 }),
      (messages) => {
        const catalogSpacing = getMessageSpacing('catalog', messages);
        const chatSpacing = getMessageSpacing('chat', messages);
        
        expect(catalogSpacing).toEqual(chatSpacing);
        expect(catalogSpacing.marginBottom).toBe('16px');
        expect(catalogSpacing.containerPadding).toBe('20px');
      }
    ),
    { numRuns: 100 }
  );
});
```

#### Property Test 3: Button Positions
**Feature: pixel-perfect-chat-alignment, Property 4-6: Button Position Invariance**
```typescript
test('all buttons maintain fixed positions', () => {
  fc.assert(
    fc.property(
      fc.boolean(), // isInputVisible
      fc.boolean(), // isScrolledToBottom
      fc.boolean(), // isVoiceRecording
      (inputVisible, scrolledBottom, voiceRecording) => {
        const catalogPositions = getButtonPositions('catalog', { inputVisible, scrolledBottom, voiceRecording });
        const chatPositions = getButtonPositions('chat', { inputVisible, scrolledBottom, voiceRecording });
        
        expect(catalogPositions.ptt).toEqual({ right: '22px', bottom: '90px', zIndex: 10002 });
        expect(chatPositions.ptt).toEqual({ right: '22px', bottom: '90px', zIndex: 10002 });
        
        expect(catalogPositions.toggle).toEqual({ right: '22px', bottom: '50px', zIndex: 10001 });
        expect(chatPositions.toggle).toEqual({ right: '22px', bottom: '50px', zIndex: 10001 });
      }
    ),
    { numRuns: 100 }
  );
});
```

## Implementation Plan Reference

The detailed implementation steps are defined in `tasks.md`. This design document provides the technical foundation for those tasks.

## Migration Strategy

### Phase 1: Structure Alignment
1. Remove MUI List/ListItem wrappers
2. Apply absolute positioning to messages-container
3. Standardize message div structure

### Phase 2: Behavior Alignment
1. Unify scroll functions
2. Standardize auto-scroll timing
3. Align button positioning

### Phase 3: Visual Alignment
1. Match loading indicators
2. Align voice recording UI
3. Verify responsive behavior

### Phase 4: Validation
1. Visual regression testing
2. Property-based testing
3. User acceptance testing
