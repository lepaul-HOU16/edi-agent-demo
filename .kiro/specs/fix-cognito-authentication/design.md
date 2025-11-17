# Design Document

## Overview

This design removes mock authentication and enforces real Cognito JWT authentication across the entire application. The solution involves updating the CDK stack configuration, modifying the Lambda authorizer, updating the frontend auth provider, and adding a sign-in UI.

## Architecture

### Current State (With Mock Auth)

```
User Request
    ↓
Frontend (tries Cognito, falls back to mock token)
    ↓
API Gateway
    ↓
Lambda Authorizer (accepts mock tokens if ENABLE_MOCK_AUTH=true)
    ↓
Backend Lambda (processes request)
```

### Target State (Real Cognito Only)

```
User Request
    ↓
Frontend (requires Cognito session, no fallback)
    ↓
API Gateway
    ↓
Lambda Authorizer (validates Cognito JWT only)
    ↓
Backend Lambda (processes request with user context)
```

## Components and Interfaces

### 1. CDK Stack Configuration

**File:** `cdk/lib/main-stack.ts`

**Changes:**
- Set `ENABLE_MOCK_AUTH: 'false'` for all environments
- Ensure authorizer Lambda has correct Cognito configuration
- Verify all backend Lambdas receive user context from authorizer

**Environment Variables:**
```typescript
environment: {
  USER_POOL_ID: this.userPool.userPoolId,
  USER_POOL_CLIENT_ID: this.userPoolClient.userPoolClientId,
  ENABLE_MOCK_AUTH: 'false', // Changed from conditional
}
```

### 2. Lambda Authorizer

**File:** `cdk/lambda-functions/authorizer/handler.ts`

**Changes:**
- Remove mock token handling when `ENABLE_MOCK_AUTH` is false
- Ensure proper error messages for authentication failures
- Add detailed logging for debugging

**Logic Flow:**
```typescript
1. Extract token from Authorization header
2. Remove 'Bearer ' prefix
3. Verify token with Cognito JWT verifier
4. If valid: return Allow policy with user context
5. If invalid: return Unauthorized error
```

### 3. Frontend Auth Provider

**File:** `src/lib/auth/cognitoAuth.ts`

**Changes:**
- Remove `ENABLE_MOCK_AUTH` checks and fallbacks
- Always require real Cognito session
- Throw errors instead of returning mock data
- Add proper error handling for expired sessions

**Updated Methods:**
```typescript
async getToken(): Promise<string> {
  // No mock fallback - always require Cognito
  const session = await this.getSession();
  return session.getIdToken().getJwtToken();
}

async isAuthenticated(): Promise<boolean> {
  // No mock fallback - check real session
  try {
    const session = await this.getSession();
    return session.isValid();
  } catch {
    return false;
  }
}

async getUserInfo() {
  // No mock fallback - require real session
  const session = await this.getSession();
  const idToken = session.getIdToken();
  return {
    userId: idToken.payload.sub,
    username: idToken.payload['cognito:username'],
    email: idToken.payload.email,
  };
}
```

### 4. Sign-In Page

**New File:** `src/pages/SignInPage.tsx`

**Features:**
- Username/email input field
- Password input field
- Sign-in button
- Error message display
- Loading state during authentication
- Redirect to main app after successful sign-in

**Component Structure:**
```tsx
<SignInPage>
  <SignInForm>
    <Input type="text" placeholder="Username or Email" />
    <Input type="password" placeholder="Password" />
    <Button onClick={handleSignIn}>Sign In</Button>
    {error && <ErrorMessage>{error}</ErrorMessage>}
  </SignInForm>
</SignInPage>
```

### 5. Protected Route Wrapper

**New File:** `src/components/ProtectedRoute.tsx`

**Purpose:** Wrap routes that require authentication

**Logic:**
```typescript
1. Check if user is authenticated
2. If yes: render children
3. If no: redirect to sign-in page
4. Show loading state while checking
```

### 6. App Router Updates

**File:** `src/App.tsx` or routing configuration

**Changes:**
- Add sign-in route
- Wrap protected routes with ProtectedRoute component
- Add sign-out functionality to navigation

## Data Models

### Cognito JWT Token Payload

```typescript
interface CognitoTokenPayload {
  sub: string;                    // User ID
  'cognito:username': string;     // Username
  email: string;                  // Email address
  email_verified: boolean;        // Email verification status
  iat: number;                    // Issued at timestamp
  exp: number;                    // Expiration timestamp
  token_use: 'id';               // Token type
  auth_time: number;             // Authentication time
}
```

### Authorizer Context

```typescript
interface AuthorizerContext {
  userId: string;                 // From token.sub
  username: string;               // From token['cognito:username']
  email: string;                  // From token.email
  authType: 'cognito';           // Authentication type
}
```

### Auth State

```typescript
interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: {
    userId: string;
    username: string;
    email: string;
  } | null;
  error: string | null;
}
```

## Error Handling

### Authentication Errors

**Frontend:**
- No session: Redirect to sign-in
- Invalid credentials: Show error message
- Expired session: Prompt to sign in again
- Network error: Show retry option

**Backend:**
- No token: Return 401 with "Authorization header required"
- Invalid token: Return 401 with "Invalid token"
- Expired token: Return 401 with "Token expired"
- Cognito error: Return 401 with "Authentication failed"

### Error Messages

```typescript
const AUTH_ERRORS = {
  NO_SESSION: 'Please sign in to continue',
  INVALID_CREDENTIALS: 'Invalid username or password',
  EXPIRED_SESSION: 'Your session has expired. Please sign in again',
  NETWORK_ERROR: 'Network error. Please check your connection',
  UNKNOWN_ERROR: 'Authentication failed. Please try again',
};
```

## Testing Strategy

### Unit Tests

1. **Lambda Authorizer:**
   - Test with valid Cognito JWT
   - Test with invalid token
   - Test with expired token
   - Test with missing token
   - Test with malformed token

2. **Frontend Auth Provider:**
   - Test signIn with valid credentials
   - Test signIn with invalid credentials
   - Test getToken with valid session
   - Test getToken with expired session
   - Test isAuthenticated states
   - Test getUserInfo

3. **Protected Route:**
   - Test with authenticated user
   - Test with unauthenticated user
   - Test redirect behavior

### Integration Tests

1. **End-to-End Auth Flow:**
   - Sign in with valid credentials
   - Make authenticated API request
   - Verify request succeeds
   - Sign out
   - Verify subsequent requests fail

2. **Token Expiration:**
   - Sign in
   - Wait for token to expire
   - Make API request
   - Verify 401 response
   - Verify redirect to sign-in

3. **Multiple Endpoints:**
   - Test chat API with Cognito auth
   - Test renewable API with Cognito auth
   - Test catalog API with Cognito auth
   - Verify all accept valid tokens
   - Verify all reject invalid tokens

### Manual Testing

1. **Browser Testing:**
   - Open app without authentication
   - Verify redirect to sign-in
   - Sign in with test user
   - Verify access to all features
   - Sign out
   - Verify redirect to sign-in

2. **CloudWatch Verification:**
   - Check authorizer logs for JWT validation
   - Verify no mock token messages
   - Check for authentication errors
   - Verify user context passed to Lambdas

## Security Considerations

### Token Security

- JWT tokens transmitted over HTTPS only
- Tokens stored in memory, not localStorage (XSS protection)
- Short token expiration (1 hour default)
- Refresh tokens for session extension

### CORS Configuration

- Restrict allowed origins to application domains
- Include credentials in CORS policy
- Validate Origin header in authorizer

### Rate Limiting

- Implement rate limiting on sign-in endpoint
- Prevent brute force attacks
- Log failed authentication attempts

## Performance Considerations

### Token Caching

- Cache Cognito JWT verifier instance
- Reuse verifier across invocations
- Reduce cold start impact

### Session Management

- Keep session in memory for fast access
- Minimize Cognito API calls
- Use token expiration for validation

## Deployment Strategy

### Phase 1: Update Backend
1. Deploy CDK stack with ENABLE_MOCK_AUTH=false
2. Verify authorizer rejects mock tokens
3. Test with real Cognito tokens

### Phase 2: Update Frontend
1. Remove mock auth fallbacks
2. Add sign-in page
3. Add protected route wrapper
4. Deploy frontend

### Phase 3: Testing
1. Test complete auth flow
2. Verify all API endpoints work
3. Check CloudWatch logs
4. Test error scenarios

### Phase 4: Cleanup
1. Remove mock auth code
2. Remove ENABLE_MOCK_AUTH environment variable
3. Update documentation

## Rollback Plan

If issues occur:
1. Revert CDK stack to previous version
2. Re-enable ENABLE_MOCK_AUTH=true
3. Revert frontend changes
4. Investigate and fix issues
5. Retry deployment

## Migration Notes

### Existing Users

- All existing Cognito users will continue to work
- No user data migration required
- Users may need to sign in again after deployment

### Test Users

Create test users in Cognito for testing:
```bash
aws cognito-idp admin-create-user \
  --user-pool-id us-east-1_sC6yswGji \
  --username testuser \
  --user-attributes Name=email,Value=test@example.com \
  --temporary-password TempPass123!
```

### Environment Variables

Verify these are set correctly:
- `USER_POOL_ID`: us-east-1_sC6yswGji
- `USER_POOL_CLIENT_ID`: 18m99t0u39vi9614ssd8sf8vmb
- `ENABLE_MOCK_AUTH`: false (or removed entirely)
