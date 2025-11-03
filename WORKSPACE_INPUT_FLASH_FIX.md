# Workspace Chat Input Flash Fix

## Problem
Every keystroke in the workspace chat input caused the entire response to flash and re-render, creating a poor user experience.

## Root Cause
The `onInputChange` prop passed to `ChatBox` was directly using `setUserInput`, which caused the parent component to re-render on every keystroke. This triggered a cascade of re-renders throughout the component tree.

## Solution
Applied the same pattern already used for `messages` and `setMessages` - wrapped `setUserInput` in a `useCallback` to create a stable reference that doesn't change between renders.

## Code Changes

### File: `src/app/chat/[chatSessionId]/page.tsx`

**Added stable callback (line ~125):**
```typescript
// Memoized input change handler to prevent re-renders on every keystroke
const stableOnInputChange = React.useCallback((input: string) => {
    setUserInput(input);
}, []);
```

**Updated ChatBox usage (line ~996):**
```typescript
<ChatBox
    chatSessionId={activeChatSession.id}
    showChainOfThought={showChainOfThought}
    onInputChange={stableOnInputChange}  // ✅ Changed from setUserInput
    userInput={userInput}
    messages={stableMessages}
    setMessages={stableSetMessages}
    selectedAgent={selectedAgent}
    onAgentChange={handleAgentChange}
/>
```

## Why This Works

### Before (Broken):
```typescript
onInputChange={setUserInput}  // ❌ New reference on every render
```

Every time the parent component re-renders (which happens on every keystroke), `setUserInput` gets a new reference, causing ChatBox to re-render unnecessarily.

### After (Fixed):
```typescript
const stableOnInputChange = React.useCallback((input: string) => {
    setUserInput(input);
}, []);  // ✅ Stable reference across renders

onInputChange={stableOnInputChange}
```

`useCallback` with an empty dependency array ensures the function reference stays the same across renders, preventing unnecessary re-renders of child components.

## Pattern Consistency

This fix follows the same pattern already established in the codebase:

```typescript
// Existing pattern for messages
const stableSetMessages = React.useCallback((newMessages) => {
    setMessages(newMessages);
}, []);

const stableMessages = React.useMemo(() => messages, [messages]);

// New pattern for input (consistent with above)
const stableOnInputChange = React.useCallback((input: string) => {
    setUserInput(input);
}, []);
```

## Testing

After this fix:
1. Type in the workspace chat input
2. Verify no flashing or re-rendering of messages
3. Verify input updates smoothly
4. Verify messages send correctly

## Related Issues

This same pattern should be applied to any other chat interfaces that exhibit similar flashing behavior. The key is to use `useCallback` for any callback props passed to child components that handle frequent updates (like input changes).

## Deployment

No deployment needed - this is a frontend-only change. The fix takes effect immediately after the code is saved and the page is refreshed.
