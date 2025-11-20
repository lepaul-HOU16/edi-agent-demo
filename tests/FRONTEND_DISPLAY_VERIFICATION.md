# Frontend Display Logic Verification Guide

## Overview

This guide helps you verify that the frontend is correctly receiving, processing, and displaying renewable agent responses and artifacts.

## Component Flow

```
API Response
    ↓
ChatBox.tsx (receives response)
    ↓
ChatBox state update (adds AI message)
    ↓
displayedMessages calculation
    ↓
ChatMessage.tsx (renders message)
    ↓
Artifact components (render visualizations)
```

## Method 1: Browser Console Inspection

### Step 1: Check if ChatBox Receives Response

Add this to browser console before sending message:

```javascript
// Monitor ChatBox state updates
window.monitorChatBox = true;

// Intercept console.log to track ChatBox logs
const originalLog = console.log;
console.log = function(...args) {
  if (args[0] && typeof args[0] === 'string' && args[0].includes('FRONTEND')) {
    console.group('📊 Frontend Log');
    originalLog.apply(console, args);
    console.groupEnd();
  } else {
    originalLog.apply(console, args);
  }
};

console.log('✅ ChatBox monitoring enabled');
```

### Step 2: Send Test Message

Send a renewable query and watch for these logs:

```
🔵 FRONTEND (ChatBox): Sending message
🔵 FRONTEND (chatUtils): sendMessage called
🔵 FRONTEND (chatUtils): REST API Response
  → Success: true
  → Artifact Count: 1
🔵 FRONTEND: Adding AI message to chat
```

### Step 3: Check Message State

After response is received, inspect the messages state:

```javascript
// Get React DevTools (if installed)
// Or use this to inspect component state

// Find ChatBox component in React tree
// This requires React DevTools extension

// Alternative: Check if message appears in DOM
const messages = document.querySelectorAll('[class*="ChatMessage"]');
console.log('Messages in DOM:', messages.length);

messages.forEach((msg, i) => {
  console.log(`Message ${i + 1}:`, {
    role: msg.getAttribute('data-role'),
    hasArtifacts: msg.querySelector('[class*="Artifact"]') !== null
  });
});
```

### Step 4: Check Artifact Rendering

```javascript
// Check if artifact components are rendered
const artifacts = document.querySelectorAll('[class*="Artifact"]');
console.log('Artifacts in DOM:', artifacts.length);

artifacts.forEach((artifact, i) => {
  console.log(`Artifact ${i + 1}:`, {
    type: artifact.className,
    visible: artifact.offsetParent !== null,
    hasContent: artifact.children.length > 0
  });
});

// Check for "Visualization Unavailable" messages
const unavailable = document.querySelectorAll('*');
let foundUnavailable = false;
unavailable.forEach(el => {
  if (el.textContent.includes('Visualization Unavailable') || 
      el.textContent.includes('No response generated')) {
    console.warn('⚠️ Found error message:', el.textContent);
    foundUnavailable = true;
  }
});

if (!foundUnavailable) {
  console.log('✅ No error messages found');
}
```

## Method 2: React DevTools Inspection

### Step 1: Install React DevTools

1. Install React DevTools browser extension
2. Open Developer Tools
3. Go to "Components" tab

### Step 2: Find ChatBox Component

1. Search for "ChatBox" in component tree
2. Select the component
3. Inspect props and state

### Step 3: Check Messages State

Look for:
```
messages: Array(2)
  0: {role: "user", content: {...}, ...}
  1: {role: "ai", content: {...}, artifacts: [...], ...}
```

**Verify:**
- ✅ AI message exists in array
- ✅ AI message has `artifacts` property
- ✅ `artifacts` is an array with items
- ✅ Each artifact has `type`, `messageContentType`, `data`

### Step 4: Check displayedMessages

Look for `displayedMessages` in component state or computed values:

```
displayedMessages: Array(2)
  0: {role: "user", ...}
  1: {role: "ai", artifacts: [...], ...}
```

**Verify:**
- ✅ AI message is included in displayedMessages
- ✅ AI message still has artifacts
- ✅ No filtering removed the AI message

### Step 5: Check ChatMessage Props

1. Find ChatMessage component in tree
2. Select the AI message instance
3. Check props:

```
message: {
  role: "ai",
  content: {text: "..."},
  artifacts: [{...}],
  ...
}
```

**Verify:**
- ✅ `message` prop is passed
- ✅ `message.artifacts` exists
- ✅ Artifacts array has items

## Method 3: Code Inspection

### Check ChatBox Message Filtering

Look at `shouldDisplayMessage` function in ChatBox.tsx:

```typescript
const shouldDisplayMessage = useCallback((message: Message) => {
  switch (message.role) {
    case 'ai':
      return message.responseComplete || 
             (message.content && (message.content as any).text && (message.content as any).text.trim().length > 0)
    case 'ai-stream':
      return true
    case 'tool':
      return ['renderAssetTool', 'userInputTool', 'createProject'].includes((message as any).toolName!);
    default:
      return true;
  }
}, []);
```

**Check:**
- ✅ AI messages with `responseComplete: true` are displayed
- ✅ AI messages with text content are displayed
- ✅ No additional filtering that might hide renewable responses

### Check displayedMessages Calculation

Look at the `displayedMessages` useMemo in ChatBox.tsx:

```typescript
const displayedMessages = React.useMemo(() => {
  // Deduplication
  const deduplicatedMessages = messages ? Array.from(
    new Map(messages.map(m => [m.id, m])).values()
  ) : [];
  
  const allMessages = [
    ...deduplicatedMessages,
    ...(streamChunkMessage ? [streamChunkMessage] : [])
  ];
  
  return allMessages.filter(shouldDisplayMessage);
}, [messages, streamChunkMessage, shouldDisplayMessage]);
```

**Check:**
- ✅ Messages are deduplicated by ID
- ✅ Filtered by `shouldDisplayMessage`
- ✅ No additional logic that might remove AI messages

### Check ChatMessage Component

Look at ChatMessage.tsx to see how artifacts are rendered:

```typescript
// Check if artifacts are being passed to artifact components
{message.artifacts && message.artifacts.length > 0 && (
  <div>
    {message.artifacts.map((artifact, index) => (
      <ArtifactComponent key={index} artifact={artifact} />
    ))}
  </div>
)}
```

**Check:**
- ✅ Artifacts are checked for existence
- ✅ Artifacts are mapped to components
- ✅ Correct artifact component is selected based on type

### Check Artifact Component Mapping

Look for artifact type to component mapping:

```typescript
function getArtifactComponent(artifact) {
  switch (artifact.type) {
    case 'wind_farm_terrain_analysis':
      return TerrainMapArtifact;
    case 'wind_farm_layout':
      return LayoutMapArtifact;
    // ... other types
    default:
      return null;
  }
}
```

**Check:**
- ✅ Renewable artifact types are mapped
- ✅ Components exist and are imported
- ✅ No missing component imports

## Method 4: Breakpoint Debugging

### Set Breakpoints

1. Open Sources tab in DevTools
2. Find ChatBox.tsx
3. Set breakpoints at:
   - Line where `setMessages` is called after API response
   - Line where `displayedMessages` is calculated
   - Line where messages are mapped in render

### Step Through Code

1. Send a test message
2. When breakpoint hits, inspect:
   - `apiResponse` - does it have artifacts?
   - `aiMessage` - does it include artifacts?
   - `messages` state - does it include the AI message with artifacts?
   - `displayedMessages` - is the AI message included?

### Check Variable Values

At each breakpoint, check:

```javascript
// After API response
console.log('API Response:', apiResponse);
console.log('Has artifacts:', apiResponse.response?.artifacts?.length);

// After creating AI message
console.log('AI Message:', aiMessage);
console.log('AI Message artifacts:', aiMessage.artifacts);

// After state update
console.log('Messages state:', messages);
console.log('Last message:', messages[messages.length - 1]);
console.log('Last message artifacts:', messages[messages.length - 1]?.artifacts);

// In render
console.log('Displayed messages:', displayedMessages);
console.log('AI messages:', displayedMessages.filter(m => m.role === 'ai'));
```

## Common Issues and Solutions

### Issue 1: AI Message Not in displayedMessages

**Symptom:** API returns response but AI message not in displayedMessages array

**Possible Causes:**
1. Message filtered out by `shouldDisplayMessage`
2. Message not added to state
3. State update not triggering re-render

**Debug:**
```javascript
// Check if message passes filter
const aiMessage = messages.find(m => m.role === 'ai');
console.log('AI message:', aiMessage);
console.log('Passes filter:', shouldDisplayMessage(aiMessage));
```

**Solution:**
- Check `shouldDisplayMessage` logic
- Ensure `responseComplete` is true or text is non-empty
- Verify state update is called

### Issue 2: Artifacts Lost in State Update

**Symptom:** API response has artifacts but they're missing from state

**Possible Causes:**
1. Artifacts not included when creating AI message object
2. State update overwrites artifacts
3. Shallow copy losing nested data

**Debug:**
```javascript
// Check AI message creation
console.log('Creating AI message with artifacts:', result.response.artifacts);
const aiMessage = {
  role: 'ai',
  content: { text: result.response.text },
  artifacts: result.response.artifacts  // ← Check this line
};
console.log('AI message object:', aiMessage);
```

**Solution:**
- Ensure artifacts are included in message object
- Use proper object spreading to preserve artifacts
- Check for any code that might strip artifacts

### Issue 3: Artifacts Not Passed to ChatMessage

**Symptom:** AI message in state has artifacts but ChatMessage doesn't receive them

**Possible Causes:**
1. Props not passed correctly
2. Destructuring losing artifacts
3. Message transformation removing artifacts

**Debug:**
```javascript
// In ChatMessage component
console.log('ChatMessage props:', props);
console.log('Message:', props.message);
console.log('Artifacts:', props.message.artifacts);
```

**Solution:**
- Check ChatMessage prop passing
- Ensure artifacts are not destructured away
- Verify no transformation removes artifacts

### Issue 4: Artifact Components Not Rendering

**Symptom:** ChatMessage receives artifacts but components don't render

**Possible Causes:**
1. Artifact type not recognized
2. Component not imported
3. Conditional rendering hiding components
4. Component error preventing render

**Debug:**
```javascript
// Check artifact type mapping
const artifact = message.artifacts[0];
console.log('Artifact type:', artifact.type);
console.log('Component for type:', getArtifactComponent(artifact));

// Check if component renders
try {
  const Component = getArtifactComponent(artifact);
  console.log('Component:', Component);
  console.log('Component name:', Component?.name);
} catch (error) {
  console.error('Error getting component:', error);
}
```

**Solution:**
- Add artifact type to component mapping
- Import missing components
- Check conditional rendering logic
- Fix component errors

### Issue 5: "No Response Generated" Message

**Symptom:** UI shows "No response generated" instead of actual response

**Possible Causes:**
1. Response text is empty
2. Conditional logic showing error message
3. Artifacts present but text missing

**Debug:**
```javascript
// Check response content
console.log('Response text:', message.content?.text);
console.log('Text length:', message.content?.text?.length);
console.log('Has artifacts:', message.artifacts?.length > 0);
```

**Solution:**
- Ensure response.text is non-empty
- Check error message display logic
- Verify both text and artifacts are present

## Verification Checklist

```
Frontend Display Logic:

□ ChatBox receives API response
□ API response has success: true
□ API response has response.artifacts array
□ AI message object is created with artifacts
□ setMessages is called with AI message
□ AI message is added to messages state
□ AI message has artifacts in state
□ AI message passes shouldDisplayMessage filter
□ AI message is included in displayedMessages
□ ChatMessage component is rendered for AI message
□ ChatMessage receives message prop with artifacts
□ Artifact components are mapped correctly
□ Artifact type is recognized
□ Artifact component is imported
□ Artifact component renders without errors
□ Artifacts are visible in UI
□ No "No response generated" error
□ No "Visualization Unavailable" error
```

## Next Steps

After verifying frontend display logic:

1. **If all checks pass:**
   - Frontend is working correctly
   - Issue must be in backend (API, orchestrator, tools)
   - Go back to backend diagnostics

2. **If AI message not in displayedMessages:**
   - Fix `shouldDisplayMessage` filter logic
   - Ensure `responseComplete` is set correctly
   - Test again

3. **If artifacts lost in state:**
   - Fix AI message creation to include artifacts
   - Ensure state update preserves artifacts
   - Test again

4. **If artifacts not passed to ChatMessage:**
   - Fix prop passing
   - Remove any transformation that strips artifacts
   - Test again

5. **If artifact components not rendering:**
   - Add missing artifact type mappings
   - Import missing components
   - Fix component errors
   - Test again

## Testing After Fixes

After making any fixes:

1. Clear browser cache
2. Reload application
3. Send test query
4. Verify all checklist items pass
5. Check for any console errors
6. Verify artifacts display correctly
