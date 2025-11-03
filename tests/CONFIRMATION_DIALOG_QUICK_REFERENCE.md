# Confirmation Dialog Quick Reference

## Overview

The confirmation dialog system provides interactive confirmation prompts for destructive operations in the renewable project lifecycle management system.

**Requirements:** 2.1, 2.6, 4.2, 4.4

## Components

### 1. ConfirmationDialog Component

**Location:** `src/components/ConfirmationDialog.tsx`

**Purpose:** Displays confirmation prompts with action buttons.

**Props:**
```typescript
interface ConfirmationDialogProps {
  message: string;                    // Main confirmation message
  confirmationPrompt?: string;        // Additional prompt text
  options?: Array<{                   // Custom action buttons
    label: string;
    value: string;
    variant?: 'primary' | 'danger' | 'secondary';
  }>;
  projectList?: string[];             // List of affected projects
  onConfirm: (value: string) => void; // Confirmation callback
  onCancel: () => void;               // Cancellation callback
}
```

**Example Usage:**
```typescript
<ConfirmationDialog
  message="Are you sure you want to delete 'texas-wind-farm'?"
  confirmationPrompt="Type 'yes' to confirm deletion."
  onConfirm={(value) => console.log('Confirmed:', value)}
  onCancel={() => console.log('Cancelled')}
/>
```

### 2. useConfirmationState Hook

**Location:** `src/hooks/useConfirmationState.ts`

**Purpose:** Manages confirmation dialog state and action routing.

**API:**
```typescript
const {
  confirmationState,    // Current confirmation state or null
  showConfirmation,     // Show confirmation dialog
  hideConfirmation,     // Hide confirmation dialog
  confirmAction,        // Process user confirmation
} = useConfirmationState();
```

**Example Usage:**
```typescript
// Show confirmation
showConfirmation({
  message: 'Delete project?',
  originalQuery: 'delete project texas-wind-farm',
  action: 'delete',
});

// Handle user confirmation
const followUpQuery = confirmAction('yes');
if (followUpQuery) {
  sendMessage(followUpQuery);
}
```

### 3. ConfirmationMessageComponent

**Location:** `src/components/messageComponents/ConfirmationMessageComponent.tsx`

**Purpose:** Renders confirmation prompts in the chat interface.

**Props:**
```typescript
interface ConfirmationMessageProps {
  message: string;
  confirmationPrompt?: string;
  options?: Array<{...}>;
  projectList?: string[];
  action: string;
  metadata?: Record<string, any>;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}
```

## Backend Integration

### Response Format

When the backend requires confirmation, it should return:

```typescript
{
  success: false,
  requiresConfirmation: true,
  message: "Are you sure you want to delete 'project-name'?",
  confirmationPrompt: "Type 'yes' to confirm deletion.",
  action: 'delete',
  projectName: 'project-name',
  // Optional fields:
  options: [...],
  projectList: [...],
  metadata: {...}
}
```

### Artifact Format

Alternatively, return as an artifact:

```typescript
{
  messageContentType: 'confirmation_required',
  data: {
    message: "Confirm action?",
    confirmationPrompt: "Type 'yes' to confirm.",
    action: 'delete',
    options: [...],
    projectList: [...],
    metadata: {...}
  }
}
```

## Supported Actions

### 1. Delete Project

**Action:** `delete`

**Backend Response:**
```typescript
{
  requiresConfirmation: true,
  message: "Are you sure you want to delete 'texas-wind-farm'?",
  confirmationPrompt: "Type 'yes' to confirm deletion.",
  action: 'delete',
  projectName: 'texas-wind-farm'
}
```

**Follow-up Query:** `delete project texas-wind-farm --confirmed`

### 2. Bulk Delete

**Action:** `bulk_delete`

**Backend Response:**
```typescript
{
  requiresConfirmation: true,
  message: "Found 3 projects matching 'texas':",
  projectList: ['texas-wind-farm-1', 'texas-wind-farm-2', 'texas-wind-farm-3'],
  confirmationPrompt: "Type 'yes' to delete all listed projects.",
  action: 'bulk_delete'
}
```

**Follow-up Query:** `delete all projects matching texas --confirmed`

### 3. Merge Projects

**Action:** `merge`

**Backend Response:**
```typescript
{
  requiresConfirmation: true,
  message: "Merge 'project-1' and 'project-2'?",
  confirmationPrompt: "Keep name 'project-1' or 'project-2'?",
  action: 'merge',
  options: [
    { label: 'Keep project-1', value: 'project-1', variant: 'primary' },
    { label: 'Keep project-2', value: 'project-2', variant: 'primary' },
    { label: 'Cancel', value: 'cancel', variant: 'secondary' }
  ],
  metadata: { project1: 'project-1', project2: 'project-2' }
}
```

**Follow-up Query:** `merge project-1 and project-2 keep project-1 --confirmed`

### 4. Duplicate Resolution

**Action:** `duplicate_resolution`

**Backend Response:**
```typescript
{
  requiresConfirmation: true,
  message: "Found existing project 'texas-wind-farm' at these coordinates.",
  options: [
    { label: 'Continue with existing project', value: 'continue', variant: 'primary' },
    { label: 'Create new project', value: 'create_new', variant: 'secondary' },
    { label: 'View existing project details', value: 'view_details', variant: 'secondary' }
  ],
  action: 'duplicate_resolution',
  duplicates: [...]
}
```

**Follow-up Query:** `resolve duplicate: continue`

## Testing

### Unit Tests

**Location:** `tests/unit/test-confirmation-dialog.test.tsx`

Run tests:
```bash
npm test test-confirmation-dialog
```

**Coverage:**
- Component rendering
- User interactions
- Visual elements
- Edge cases

### Integration Tests

**Location:** `tests/integration/test-confirmation-flow-integration.test.ts`

Run tests:
```bash
npm test test-confirmation-flow-integration
```

**Coverage:**
- Delete project flow
- Bulk delete flow
- Merge projects flow
- Duplicate resolution flow
- Error handling

## User Flow

### 1. User Initiates Action

User types: `delete project texas-wind-farm`

### 2. Backend Returns Confirmation Request

```typescript
{
  requiresConfirmation: true,
  message: "Are you sure you want to delete 'texas-wind-farm'?",
  action: 'delete'
}
```

### 3. Frontend Displays Confirmation Dialog

- Shows warning icon and title
- Displays confirmation message
- Shows action buttons (Yes/Cancel)
- Displays help text

### 4. User Confirms or Cancels

**If confirmed:**
- Generate follow-up query: `delete project texas-wind-farm --confirmed`
- Send to backend
- Backend processes deletion
- Return success message

**If cancelled:**
- Hide confirmation dialog
- No follow-up action
- User can continue with other actions

## Styling

### Theme Support

The confirmation dialog supports both light and dark themes:

**Dark Mode:**
- Background: `#2d2d2d`
- Border: `#ffa726`
- Text: `#e0e0e0`

**Light Mode:**
- Background: `#f5f5f5`
- Border: `#ff9800`
- Text: `#424242`

### Button Variants

**Primary:** Blue background, white text
**Danger:** Red background, white text (for destructive actions)
**Secondary:** Gray background, theme-appropriate text

## Best Practices

### 1. Clear Messaging

✅ **Good:** "Are you sure you want to delete 'texas-wind-farm'? This will remove all analysis data."

❌ **Bad:** "Delete?"

### 2. Explicit Actions

✅ **Good:** Provide clear button labels like "Delete Project" and "Cancel"

❌ **Bad:** Use vague labels like "OK" and "No"

### 3. Show Affected Items

✅ **Good:** Display list of projects that will be deleted in bulk operations

❌ **Bad:** Just say "multiple projects will be deleted"

### 4. Provide Context

✅ **Good:** Include metadata about the operation (project names, counts, etc.)

❌ **Bad:** Generic confirmation without details

## Troubleshooting

### Confirmation Dialog Not Showing

**Check:**
1. Backend response includes `requiresConfirmation: true`
2. Response has `message` field
3. ChatMessage component is detecting confirmation artifact
4. No console errors in browser

### Follow-up Query Not Sent

**Check:**
1. `onSendMessage` callback is provided to ChatMessage
2. User clicked confirm button (not cancel)
3. `confirmAction` is generating correct follow-up query
4. No errors in console

### Styling Issues

**Check:**
1. Theme provider is wrapping the component
2. MUI theme is properly configured
3. No CSS conflicts with other components

## Future Enhancements

### Planned Features

1. **Keyboard Shortcuts**
   - Enter to confirm
   - Escape to cancel

2. **Confirmation Timeout**
   - Auto-cancel after inactivity
   - Countdown timer display

3. **Undo Support**
   - Allow undo after confirmation
   - Time-limited undo window

4. **Confirmation History**
   - Track confirmed actions
   - Allow review of past confirmations

## Related Documentation

- [Requirements Document](../.kiro/specs/renewable-project-lifecycle-management/requirements.md)
- [Design Document](../.kiro/specs/renewable-project-lifecycle-management/design.md)
- [Tasks Document](../.kiro/specs/renewable-project-lifecycle-management/tasks.md)
- [Project Lifecycle Manager](../amplify/functions/shared/projectLifecycleManager.ts)

## Support

For issues or questions:
1. Check console logs for errors
2. Review test files for examples
3. Refer to design document for architecture
4. Check requirements document for expected behavior
