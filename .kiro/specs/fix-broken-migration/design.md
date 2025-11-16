# Design Document: Fix Broken Vite Migration

## Overview

This design addresses the critical failures in the Vite migration by implementing proper authentication handling, CSS loading, Node.js polyfills, and API integration. The approach focuses on making the application functional first, then optimizing.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Vite Application                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  CSS Layer (globals.css + Cloudscape)                  │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Polyfills Layer (stream, util, buffer)               │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Auth Layer (Mock Token Provider)                      │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  API Client Layer (REST API calls)                     │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  UI Components (Pages, Components)                     │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                  ┌──────────────────┐
                  │   REST API       │
                  │  (API Gateway)   │
                  └──────────────────┘
```

## Components and Interfaces

### 1. Vite Configuration

**Purpose**: Configure Vite to handle CSS, polyfills, and build optimization

**Key Configuration**:
- CSS handling with proper import order
- Node.js polyfills (stream-browserify, util, buffer)
- Optimized dependencies
- Proper resolve aliases

**File**: `vite.config.ts`

```typescript
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'stream': 'stream-browserify',
      'util': 'util',
      'buffer': 'buffer',
    },
  },
  optimizeDeps: {
    include: [
      '@cloudscape-design/components',
      '@cloudscape-design/global-styles',
      'stream-browserify',
      'util',
      'buffer',
    ],
  },
  define: {
    'process.env': {},
    'global': 'globalThis',
    'process.browser': true,
  },
})
```

### 2. CSS Loading Strategy

**Purpose**: Ensure all CSS loads in correct order without conflicts

**Loading Order**:
1. Cloudscape global styles (from node_modules)
2. Application globals.css (custom styles)
3. Component-specific CSS

**Implementation**:
- Import Cloudscape CSS first in main.tsx
- Import globals.css second
- Import component CSS in components

**Files**:
- `src/main.tsx` - Entry point CSS imports
- `src/globals.css` - Application-wide styles
- `src/index.css` - Base styles

### 3. Authentication System

**Purpose**: Provide temporary authentication bypass for development

**Components**:

#### Mock Auth Provider
```typescript
// src/lib/auth/mockAuth.ts
export class MockAuthProvider {
  async getToken(): Promise<string> {
    return 'mock-dev-token-' + Date.now();
  }
  
  isAuthenticated(): boolean {
    return true; // Always true in dev mode
  }
}
```

#### API Client with Auth
```typescript
// src/lib/api/client.ts
export async function apiRequest(endpoint: string, options: RequestInit) {
  const token = await mockAuth.getToken();
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }
  
  return response.json();
}
```

### 4. Backend Auth Bypass

**Purpose**: Allow backend to accept mock tokens in development

**Implementation**:

#### Lambda Authorizer Update
```typescript
// cdk/lambda-functions/authorizer/handler.ts
export async function handler(event: APIGatewayAuthorizerEvent) {
  const token = event.authorizationToken;
  
  // Development bypass
  if (token.startsWith('mock-dev-token-')) {
    return generatePolicy('mock-user', 'Allow', event.methodArn);
  }
  
  // Production: validate real Cognito token
  // ... existing validation logic
}
```

### 5. Node.js Polyfills

**Purpose**: Provide browser-compatible versions of Node.js modules

**Required Polyfills**:
- `stream-browserify` - For Plotly.js
- `util` - For various libraries
- `buffer` - For binary data handling

**Installation**:
```bash
npm install stream-browserify util buffer
```

**Configuration**: Added to vite.config.ts resolve.alias

### 6. Error Handling

**Purpose**: Provide clear error messages for debugging

**Error Handler Component**:
```typescript
// src/components/ErrorBoundary.tsx
export class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Application Error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
    
    // Show user-friendly error
    this.setState({ hasError: true, error });
  }
}
```

## Data Models

### Auth Token
```typescript
interface AuthToken {
  token: string;
  expiresAt: number;
  userId: string;
}
```

### API Response
```typescript
interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

### CSS Load Status
```typescript
interface CSSLoadStatus {
  cloudscapeLoaded: boolean;
  globalsLoaded: boolean;
  errors: string[];
}
```

## Error Handling

### Authentication Errors
- **401 Unauthorized**: Display "Authentication failed - using mock token" message
- **403 Forbidden**: Display "Access denied" message
- **Network Error**: Display "Cannot connect to API" message

### CSS Loading Errors
- **Missing CSS**: Log warning and attempt to reload
- **Parse Error**: Log error with file name
- **Network Error**: Retry loading CSS

### API Errors
- **Timeout**: Retry with exponential backoff
- **Server Error**: Display error message to user
- **Invalid Response**: Log response and display generic error

## Testing Strategy

### Unit Tests
- Mock auth provider returns valid tokens
- API client adds correct headers
- Error boundary catches and displays errors

### Integration Tests
- CSS loads in correct order
- Polyfills work with Plotly.js
- API calls succeed with mock auth

### Manual Testing
1. Load application - no console errors
2. Navigate to each page - all render correctly
3. Click buttons - API calls succeed
4. Check styling - components look correct
5. Test dark mode - styles apply correctly

## Implementation Priority

### Phase 1: Critical Fixes (Blocking)
1. Fix Vite config with all polyfills
2. Fix CSS loading order
3. Implement mock auth in frontend
4. Update backend to accept mock tokens

### Phase 2: Functionality (High Priority)
1. Fix all API client calls
2. Fix page-specific errors
3. Test all user workflows
4. Fix responsive layout issues

### Phase 3: Polish (Medium Priority)
1. Improve error messages
2. Add loading states
3. Optimize performance
4. Add development mode indicator

## Deployment Considerations

### Development Mode
- Mock auth enabled
- Detailed error logging
- CSS source maps enabled
- Hot module replacement active

### Production Mode
- Real Cognito auth required
- Error logging to CloudWatch
- Minified CSS
- Optimized builds

## Rollback Plan

If fixes don't work:
1. Revert to last working Next.js commit
2. Keep Amplify backend
3. Document lessons learned
4. Plan proper migration with testing
