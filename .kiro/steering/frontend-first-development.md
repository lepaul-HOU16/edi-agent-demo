---
inclusion: always
priority: high
---

# FRONTEND-FIRST DEVELOPMENT PHILOSOPHY

## Core Principle

**The frontend is the product. The backend is infrastructure that supports the frontend.**

Users interact with the frontend. They never see the backend. Therefore:
- Frontend requirements drive backend design
- Frontend user experience is the primary concern
- Backend exists only to serve frontend needs

## Development Order

### ✅ CORRECT Order

1. **Understand User Need**
   - What does the user want to accomplish?
   - What will they see and interact with?

2. **Design Frontend Experience**
   - Sketch the UI/UX
   - Define user interactions
   - Plan visual feedback
   - Consider error states

3. **Implement Frontend Components**
   - Build React components
   - Create UI elements
   - Add user interactions
   - Implement client-side logic

4. **Define Backend Requirements**
   - What data does the frontend need?
   - What APIs must the backend provide?
   - What format should responses use?

5. **Implement Backend Services**
   - Build Lambda functions
   - Create API endpoints
   - Implement business logic
   - Set up data storage

6. **Deploy Frontend**
   - Run `./deploy-frontend.sh`
   - Verify in production

7. **Iterate Based on User Feedback**
   - Test with real users
   - Gather feedback
   - Improve frontend experience
   - Adjust backend as needed

### ❌ WRONG Order (Never Do This)

1. ~~Build backend services first~~
2. ~~Create database schemas~~
3. ~~Implement business logic~~
4. ~~Then figure out how frontend will use it~~
5. ~~Realize frontend needs different data format~~
6. ~~Refactor backend to match frontend needs~~

**This wastes time and creates mismatched systems.**

## Frontend-First Questions

Before writing ANY code, ask:

### User Experience Questions
- What will the user see on their screen?
- How will they trigger this action?
- What feedback will they receive?
- What happens if something goes wrong?
- How will they know the action succeeded?

### Frontend Requirements Questions
- What React components are needed?
- What state management is required?
- What user interactions must be handled?
- What visual feedback is necessary?
- What error messages should be shown?

### Backend Requirements Questions (Asked AFTER Frontend)
- What data does the frontend need from the backend?
- What format should the API response use?
- What endpoints must the backend provide?
- What business logic is required?
- What data must be persisted?

## Frontend Components Drive Everything

### Example: Adding a New Feature

**Feature**: "Allow users to save wind farm projects"

#### ✅ Frontend-First Approach

1. **Design UI**
   - Add "Save Project" button to project dashboard
   - Create modal for entering project name
   - Show success/error toast notifications
   - Display saved projects in a list

2. **Implement Frontend**
   ```typescript
   // Define what data frontend needs
   interface SavedProject {
     id: string;
     name: string;
     location: string;
     createdAt: string;
   }
   
   // Implement save button
   const handleSave = async () => {
     const response = await saveProject({
       name: projectName,
       location: projectLocation,
       data: projectData
     });
     showSuccessToast("Project saved!");
   };
   ```

3. **Define Backend API Contract**
   ```typescript
   // Frontend defines what it needs from backend
   POST /api/projects
   Request: {
     name: string;
     location: string;
     data: object;
   }
   Response: {
     id: string;
     name: string;
     location: string;
     createdAt: string;
   }
   ```

4. **Implement Backend**
   - Create Lambda function matching the API contract
   - Store data in DynamoDB
   - Return response in format frontend expects

5. **Deploy Frontend**
   ```bash
   ./deploy-frontend.sh
   ```

6. **Test in Production**
   - Click "Save Project" button
   - Verify modal appears
   - Enter project name
   - Confirm project saves
   - Check success toast appears

#### ❌ Backend-First Approach (WRONG)

1. ~~Create DynamoDB table schema~~
2. ~~Build Lambda function with complex business logic~~
3. ~~Create API endpoint with arbitrary response format~~
4. ~~Then try to build frontend to use it~~
5. ~~Realize frontend needs different data structure~~
6. ~~Refactor backend~~
7. ~~Repeat until it works~~

**This approach wastes time and creates friction.**

## Frontend Deployment is User Deployment

### Key Insight

**When you deploy the frontend, you deploy to USERS.**

- Backend deployment = infrastructure update (users don't see it)
- Frontend deployment = user experience update (users see it immediately)

Therefore:
- Frontend deployment is more critical
- Frontend deployment must happen every time
- Frontend deployment is the final step of every task

### Deployment Impact

| Change Type | Backend Deploy | Frontend Deploy | User Impact |
|-------------|----------------|-----------------|-------------|
| Frontend component update | No | **YES** | Immediate |
| Backend API change | Yes | **YES** | Immediate |
| Database schema update | Yes | **YES** | Immediate |
| Configuration change | Maybe | **YES** | Immediate |
| Bug fix (any layer) | Maybe | **YES** | Immediate |

**Notice: Frontend deployment is ALWAYS required for users to see changes.**

## React Component Best Practices

### Component Structure

```typescript
// 1. Imports
import React, { useState, useEffect } from 'react';
import { Button, Alert } from '@cloudscape-design/components';

// 2. Types/Interfaces (Frontend-defined)
interface MyComponentProps {
  projectId: string;
  onSave: (data: ProjectData) => void;
}

// 3. Component
export const MyComponent: React.FC<MyComponentProps> = ({ projectId, onSave }) => {
  // 4. State (Frontend-managed)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 5. Effects
  useEffect(() => {
    // Load data when component mounts
  }, [projectId]);
  
  // 6. Event Handlers (User interactions)
  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave(data);
      // Show success feedback
    } catch (err) {
      setError('Failed to save project');
    } finally {
      setLoading(false);
    }
  };
  
  // 7. Render (User interface)
  return (
    <div>
      {error && <Alert type="error">{error}</Alert>}
      <Button onClick={handleSave} loading={loading}>
        Save Project
      </Button>
    </div>
  );
};
```

### State Management Priority

1. **Local Component State** (useState)
   - Use for component-specific UI state
   - Loading states, form inputs, modals

2. **Context API** (useContext)
   - Use for shared state across components
   - User preferences, theme, active project

3. **Backend State** (API calls)
   - Use for persisted data
   - Projects, user data, analysis results

**Frontend state drives user experience. Backend state is just persistence.**

## User Feedback is Paramount

### Always Provide Visual Feedback

```typescript
// ✅ GOOD: User knows what's happening
const handleAction = async () => {
  setLoading(true);  // Show loading spinner
  try {
    const result = await apiCall();
    showSuccessToast('Action completed!');  // Show success
  } catch (error) {
    showErrorAlert('Action failed: ' + error.message);  // Show error
  } finally {
    setLoading(false);  // Hide loading spinner
  }
};

// ❌ BAD: User has no idea what's happening
const handleAction = async () => {
  await apiCall();  // Silent, no feedback
};
```

### Loading States

- Show spinners during API calls
- Disable buttons while processing
- Display progress indicators for long operations

### Success States

- Show success toasts/alerts
- Update UI to reflect changes
- Provide confirmation messages

### Error States

- Show clear error messages
- Explain what went wrong
- Suggest how to fix it
- Don't just show technical error codes

## Testing Priority

### 1. Frontend Testing (Most Important)
- Does the UI render correctly?
- Do user interactions work?
- Is feedback clear and helpful?
- Are error states handled gracefully?

### 2. Integration Testing
- Does frontend communicate with backend correctly?
- Are API responses in the expected format?
- Do error responses display properly?

### 3. Backend Testing (Least Important for User Experience)
- Does business logic work correctly?
- Are edge cases handled?
- Is data persisted correctly?

**Note**: Backend testing is still important, but frontend testing directly impacts user experience.

## Summary

### The Frontend-First Mindset

1. **Users see the frontend** → Frontend is the product
2. **Frontend defines requirements** → Backend serves frontend needs
3. **Frontend deployment is user deployment** → Always deploy frontend
4. **User experience is paramount** → Design UI first, then build backend

### The Deployment Rule

**After ANY code change, deploy the frontend.**

Even if you only changed backend code, deploy the frontend. Why?
- Frontend may need rebuilding to pick up changes
- Environment variables may have changed
- API contracts may have shifted
- Configuration may have updated
- **Users can only see deployed frontend changes**

### Remember

**Backend without frontend = invisible = worthless**

**Frontend without deployment = local only = worthless**

**Deployed frontend = user value = success**

**ALWAYS DEPLOY THE FRONTEND.**
