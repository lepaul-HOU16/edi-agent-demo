# Implementation Plan

- [x] 1. Update CDK stack to disable mock authentication
  - Set ENABLE_MOCK_AUTH to 'false' in authorizer Lambda environment
  - Remove conditional logic that enables mock auth in development
  - Verify environment variables are correctly set for all environments
  - _Requirements: 1.1, 5.1, 5.2, 5.3, 5.4_

- [x] 2. Update Lambda authorizer to reject mock tokens
  - Remove mock token handling logic when ENABLE_MOCK_AUTH is false
  - Ensure only Cognito JWT tokens are accepted
  - Add detailed error logging for authentication failures
  - Test authorizer with valid Cognito JWT
  - Test authorizer rejects mock tokens
  - _Requirements: 1.2, 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 3. Remove mock auth fallbacks from frontend
  - Remove ENABLE_MOCK_AUTH checks from cognitoAuth.ts
  - Update getToken() to always require Cognito session
  - Update isAuthenticated() to return false when no session
  - Update getUserInfo() to throw error when no session
  - Remove mock token generation code
  - Remove mock user data fallbacks
  - _Requirements: 2.3, 4.1, 4.2, 4.3, 4.4_

- [x] 4. Create sign-in page component
  - Create AuthPage.tsx at /auth route with username and password inputs
  - Use same background image as HomePage (edi-bkgd.jpg)
  - Show TopNav/AppLayout so navigation is visible
  - Center login form container over background
  - Implement handleSignIn function using cognitoAuth.signIn()
  - Add error message display for failed authentication
  - Add loading state during authentication
  - Add redirect to main app after successful sign-in
  - Style sign-in form with Cloudscape components
  - _Requirements: 2.1, 2.2, 6.1, 6.2, 6.3, 6.4_

- [x] 5. Create protected route wrapper
  - Create ProtectedRoute.tsx component
  - Check authentication status on mount
  - Redirect to sign-in if not authenticated
  - Show loading state while checking auth
  - Pass user context to children components
  - _Requirements: 2.1, 2.4_

- [x] 6. Update app routing
  - Add /sign-in route for SignInPage
  - Wrap existing routes with ProtectedRoute
  - Add sign-out button to navigation
  - Implement sign-out handler that clears session
  - Redirect to sign-in after sign-out
  - _Requirements: 2.1, 2.5, 6.5_

- [x] 7. Deploy backend changes
  - Build and deploy CDK stack with updated configuration
  - Verify authorizer Lambda has ENABLE_MOCK_AUTH=false
  - Check CloudWatch logs for authorizer deployment
  - Test authorizer with curl using mock token (should fail)
  - Test authorizer with curl using real Cognito token (should succeed)
  - _Requirements: 1.1, 5.4, 7.2_

- [x] 8. Deploy frontend changes
  - Build frontend with updated auth provider
  - Deploy to CloudFront
  - Clear CloudFront cache
  - Verify sign-in page is accessible
  - Test sign-in flow in browser
  - _Requirements: 2.1, 6.1_

- [x] 9. Test complete authentication flow
  - Open application in browser
  - Verify redirect to sign-in page
  - Sign in with test Cognito user
  - Verify redirect to main application
  - Make API requests and verify they succeed
  - Check Authorization header contains JWT token
  - Verify CloudWatch logs show successful JWT validation
  - _Requirements: 7.1, 7.5_

- [x] 10. Test authentication error scenarios
  - Test with invalid credentials (should show error)
  - Test with expired token (should prompt re-authentication)
  - Test without authentication (should reject with 401)
  - Test sign-out (should clear session and redirect)
  - Verify error messages are clear and helpful
  - _Requirements: 7.2, 7.3, 7.4_

- [x] 11. Create test Cognito users
  - Create test user in Cognito user pool
  - Set temporary password
  - Test sign-in with test user
  - Verify user can access all features
  - Document test user credentials securely
  - _Requirements: 7.1_

- [x] 12. Update documentation
  - Document authentication flow
  - Add sign-in instructions for users
  - Document how to create new Cognito users
  - Update API documentation to require JWT tokens
  - Remove references to mock authentication
  - _Requirements: All_

## Notes

- All changes should be tested in development environment first
- Ensure test Cognito users are created before deploying frontend
- Monitor CloudWatch logs during deployment for any issues
- Have rollback plan ready in case of issues
- Coordinate backend and frontend deployments to minimize downtime

## Testing Commands

### Test Authorizer with Mock Token (Should Fail)
```bash
curl -X POST https://hbt1j807qf.execute-api.us-east-1.amazonaws.com/api/chat/sessions \
  -H "Authorization: Bearer mock-dev-token-test-user" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Session"}'
# Expected: 401 Unauthorized
```

### Test Authorizer with Real Cognito Token (Should Succeed)
```bash
# First, get a real token by signing in through the UI or using AWS CLI
TOKEN="<real-cognito-jwt-token>"
curl -X POST https://hbt1j807qf.execute-api.us-east-1.amazonaws.com/api/chat/sessions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Session"}'
# Expected: 201 Created
```

### Create Test Cognito User
```bash
aws cognito-idp admin-create-user \
  --user-pool-id us-east-1_sC6yswGji \
  --username testuser \
  --user-attributes Name=email,Value=test@example.com \
  --temporary-password TempPass123!
```

### Check Authorizer Logs
```bash
aws logs tail /aws/lambda/EnergyInsights-development-custom-authorizer --follow
```

### Verify Environment Variables
```bash
aws lambda get-function-configuration \
  --function-name EnergyInsights-development-custom-authorizer \
  --query "Environment.Variables"
```
