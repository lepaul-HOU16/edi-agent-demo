# Authentication Guide

## Overview

The AWS Energy Data Insights platform uses AWS Cognito for secure user authentication. All API requests require valid JWT tokens issued by Cognito.

## Authentication Flow

### 1. User Sign-In Process

```
User enters credentials
    ↓
Frontend calls cognitoAuth.signIn()
    ↓
AWS Cognito validates credentials
    ↓
Cognito returns JWT tokens (ID token, Access token, Refresh token)
    ↓
Frontend stores session in memory
    ↓
User redirected to main application
```

### 2. API Request Authentication

```
User makes API request
    ↓
Frontend retrieves JWT token from session
    ↓
Token added to Authorization header
    ↓
API Gateway receives request
    ↓
Lambda Authorizer validates JWT token
    ↓
If valid: Request forwarded to backend Lambda
If invalid: 401 Unauthorized returned
```

### 3. Session Management

- **Token Storage**: Tokens stored in memory (not localStorage for security)
- **Token Expiration**: ID tokens expire after 1 hour
- **Refresh**: Automatic token refresh using refresh token
- **Sign-Out**: Clears all session data and redirects to sign-in page

## User Sign-In Instructions

### Accessing the Application

1. Navigate to the application URL
2. If not authenticated, you'll be automatically redirected to `/auth`
3. Enter your username or email
4. Enter your password
5. Click "Sign In"

### First-Time Sign-In

If you're signing in for the first time with a temporary password:

1. Enter your username and temporary password
2. You'll be prompted to create a new password
3. Follow the password requirements:
   - Minimum 8 characters
   - At least one uppercase letter
   - At least one lowercase letter
   - At least one number
   - At least one special character

### Troubleshooting Sign-In Issues

**Invalid Credentials Error**
- Verify username/email is correct
- Check password is correct
- Ensure Caps Lock is off

**Network Error**
- Check internet connection
- Verify application URL is correct
- Try refreshing the page

**Session Expired**
- Sign in again with your credentials
- Sessions expire after 1 hour of inactivity

## Sign-Out

To sign out of the application:

1. Click your username in the top navigation bar
2. Select "Sign Out" from the dropdown menu
3. You'll be redirected to the sign-in page
4. All session data will be cleared

## Security Features

### Token Security
- JWT tokens transmitted over HTTPS only
- Tokens stored in memory (not localStorage)
- Short token expiration (1 hour)
- Automatic token refresh

### Password Requirements
- Minimum 8 characters
- Must contain uppercase and lowercase letters
- Must contain numbers
- Must contain special characters

### Account Security
- Failed login attempts are logged
- Account lockout after multiple failed attempts
- Password reset available via email

## API Authentication

### Making Authenticated Requests

All API requests must include a valid JWT token in the Authorization header:

```bash
curl -X POST https://api.example.com/endpoint \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"data": "value"}'
```

### Getting Your JWT Token

For development/testing purposes, you can retrieve your JWT token:

1. Sign in to the application
2. Open browser developer tools (F12)
3. Go to Console tab
4. Run: `await cognitoAuth.getToken()`
5. Copy the returned token

**Note**: Tokens expire after 1 hour. Generate a new token if requests fail with 401.

### API Response Codes

- **200 OK**: Request successful
- **401 Unauthorized**: Invalid or expired token
- **403 Forbidden**: Valid token but insufficient permissions
- **500 Internal Server Error**: Server error

## For Developers

### Frontend Authentication

The authentication system is implemented in `src/lib/auth/cognitoAuth.ts`:

```typescript
import { cognitoAuth } from '@/lib/auth/cognitoAuth';

// Sign in
await cognitoAuth.signIn(username, password);

// Check authentication status
const isAuth = await cognitoAuth.isAuthenticated();

// Get current user info
const user = await cognitoAuth.getUserInfo();

// Get JWT token
const token = await cognitoAuth.getToken();

// Sign out
await cognitoAuth.signOut();
```

### Protected Routes

Routes are protected using the `ProtectedRoute` component:

```tsx
import { ProtectedRoute } from '@/components/ProtectedRoute';

<ProtectedRoute>
  <YourComponent />
</ProtectedRoute>
```

### Lambda Authorizer

The Lambda authorizer validates JWT tokens for all API requests:

- **Location**: `cdk/lambda-functions/authorizer/handler.ts`
- **Validation**: Verifies token signature against Cognito public keys
- **User Context**: Passes user information to backend Lambdas

## Cognito Configuration

### User Pool Details

- **User Pool ID**: `us-east-1_sC6yswGji`
- **Client ID**: `18m99t0u39vi9614ssd8sf8vmb`
- **Region**: `us-east-1`

### Environment Variables

Backend Lambdas use these environment variables:

```bash
USER_POOL_ID=us-east-1_sC6yswGji
USER_POOL_CLIENT_ID=18m99t0u39vi9614ssd8sf8vmb
AWS_REGION=us-east-1
```

## Support

For authentication issues or questions:

1. Check CloudWatch logs for error details
2. Verify Cognito user pool configuration
3. Ensure environment variables are set correctly
4. Contact system administrator for account issues
