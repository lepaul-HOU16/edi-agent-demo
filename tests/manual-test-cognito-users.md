# Manual Test Guide: Cognito User Authentication

## Test Users

### Test User 1
- **Email:** testuser1@example.com
- **Password:** TestUser123!

### Test User 2
- **Email:** testuser2@example.com
- **Password:** TestUser456!

## Test Checklist

### 1. Sign-In Flow
- [ ] Navigate to application URL
- [ ] Verify redirect to sign-in page (if not authenticated)
- [ ] Enter Test User 1 credentials
- [ ] Click "Sign In"
- [ ] Verify successful sign-in
- [ ] Verify redirect to main application
- [ ] Verify no console errors

### 2. Chat Features
- [ ] Navigate to Chat page
- [ ] Create a new chat session
- [ ] Send a message
- [ ] Verify response is received
- [ ] Verify artifacts render correctly
- [ ] Test with different agent types (EDIcraft, Renewable, etc.)

### 3. Catalog Features
- [ ] Navigate to Catalog page
- [ ] Search for data
- [ ] View search results
- [ ] Click on a result to view details
- [ ] Verify map visualization loads
- [ ] Verify data displays correctly

### 4. Renewable Energy Features
- [ ] Navigate to Renewable Energy section
- [ ] Test terrain analysis
- [ ] Test layout optimization
- [ ] Test wind rose visualization
- [ ] Test wake simulation
- [ ] Verify all artifacts render correctly

### 5. Petrophysical Analysis Features
- [ ] Navigate to Petrophysical Analysis
- [ ] Select a well
- [ ] Run porosity calculation
- [ ] Run shale volume analysis
- [ ] Verify log visualizations display
- [ ] Verify calculations are correct

### 6. Projects and Collections
- [ ] Create a new project
- [ ] Add items to project
- [ ] Create a collection
- [ ] Add items to collection
- [ ] Verify data persists
- [ ] Verify user can access their own data

### 7. Sign-Out Flow
- [ ] Click "Sign Out" button
- [ ] Verify session is cleared
- [ ] Verify redirect to sign-in page
- [ ] Verify cannot access protected routes
- [ ] Try to access a protected route directly
- [ ] Verify redirect to sign-in

### 8. Token Expiration
- [ ] Sign in with Test User 1
- [ ] Wait for token to expire (1 hour)
- [ ] Try to make an API request
- [ ] Verify 401 Unauthorized response
- [ ] Verify redirect to sign-in page
- [ ] Sign in again
- [ ] Verify can access features again

### 9. Error Scenarios
- [ ] Try to sign in with invalid email
- [ ] Verify error message displays
- [ ] Try to sign in with invalid password
- [ ] Verify error message displays
- [ ] Try to sign in with empty fields
- [ ] Verify validation errors display
- [ ] Test network error handling (disconnect network)
- [ ] Verify appropriate error message

### 10. Multi-User Testing
- [ ] Sign in with Test User 1
- [ ] Create some data (chat sessions, projects)
- [ ] Sign out
- [ ] Sign in with Test User 2
- [ ] Verify Test User 2 cannot see Test User 1's data
- [ ] Create some data for Test User 2
- [ ] Sign out
- [ ] Sign in with Test User 1 again
- [ ] Verify Test User 1 can still see their own data

## Expected Results

### All Tests Should Pass
- ✅ Users can sign in successfully
- ✅ Users can access all features
- ✅ Users can create and manage data
- ✅ Users are properly isolated (cannot see each other's data)
- ✅ Sign-out works correctly
- ✅ Token expiration is handled gracefully
- ✅ Error messages are clear and helpful
- ✅ No console errors during normal operation

## Troubleshooting

### Cannot Sign In
1. Verify user exists in Cognito:
   ```bash
   aws cognito-idp admin-get-user \
     --user-pool-id us-east-1_sC6yswGji \
     --username testuser1@example.com \
     --region us-east-1
   ```

2. Verify user status is CONFIRMED:
   ```bash
   aws cognito-idp list-users \
     --user-pool-id us-east-1_sC6yswGji \
     --region us-east-1 \
     --filter "email = \"testuser1@example.com\""
   ```

3. Reset password if needed:
   ```bash
   aws cognito-idp admin-set-user-password \
     --user-pool-id us-east-1_sC6yswGji \
     --username testuser1@example.com \
     --password TestUser123! \
     --permanent \
     --region us-east-1
   ```

### API Requests Fail with 401
1. Check CloudWatch logs for authorizer:
   ```bash
   aws logs tail /aws/lambda/EnergyInsights-development-custom-authorizer --follow
   ```

2. Verify token is being sent:
   - Open browser DevTools
   - Go to Network tab
   - Make a request
   - Check Authorization header

3. Verify ENABLE_MOCK_AUTH is false:
   ```bash
   aws lambda get-function-configuration \
     --function-name EnergyInsights-development-custom-authorizer \
     --query "Environment.Variables.ENABLE_MOCK_AUTH"
   ```

### Features Not Working
1. Check browser console for errors
2. Check Network tab for failed requests
3. Check CloudWatch logs for backend errors
4. Verify user has proper permissions

## Automated Test Results

Run automated tests to verify basic functionality:

```bash
# Test sign-in and API access
node tests/test-cognito-user-signin.js

# Test complete auth flow
node test-complete-auth-flow.js

# Test error scenarios
node test-auth-error-scenarios.js
```

## Notes

- Test users are for development and testing only
- Do not use test credentials in production
- Passwords should be changed regularly
- Consider using AWS Secrets Manager for production credentials
- Monitor CloudWatch logs during testing for any issues
