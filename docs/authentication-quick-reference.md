# Authentication Quick Reference

## For End Users

### Sign In
1. Go to application URL
2. Enter username/email and password
3. Click "Sign In"

### Sign Out
1. Click username in top navigation
2. Select "Sign Out"

### Forgot Password
Contact your administrator to reset your password.

---

## For Administrators

### Create User
```bash
aws cognito-idp admin-create-user \
  --user-pool-id us-east-1_sC6yswGji \
  --username <username> \
  --user-attributes Name=email,Value=<email> \
  --temporary-password <TempPass123!> \
  --region us-east-1
```

### Reset Password
```bash
aws cognito-idp admin-set-user-password \
  --user-pool-id us-east-1_sC6yswGji \
  --username <username> \
  --password <NewPassword123!> \
  --permanent \
  --region us-east-1
```

### List Users
```bash
aws cognito-idp list-users \
  --user-pool-id us-east-1_sC6yswGji \
  --region us-east-1
```

---

## For Developers

### Get JWT Token (Browser Console)
```javascript
await cognitoAuth.getToken()
```

### Get JWT Token (CLI)
```bash
aws cognito-idp admin-initiate-auth \
  --user-pool-id us-east-1_sC6yswGji \
  --client-id 18m99t0u39vi9614ssd8sf8vmb \
  --auth-flow ADMIN_NO_SRP_AUTH \
  --auth-parameters USERNAME=<user>,PASSWORD=<pass> \
  --region us-east-1 \
  --query 'AuthenticationResult.IdToken' \
  --output text
```

### Test API Request
```bash
TOKEN="<your-jwt-token>"
curl -X GET https://hbt1j807qf.execute-api.us-east-1.amazonaws.com/api/chat/sessions \
  -H "Authorization: Bearer $TOKEN"
```

### Check Authorizer Logs
```bash
aws logs tail /aws/lambda/EnergyInsights-development-custom-authorizer --follow
```

---

## Configuration

### User Pool
- **ID**: us-east-1_sC6yswGji
- **Client ID**: 18m99t0u39vi9614ssd8sf8vmb
- **Region**: us-east-1

### API Endpoint
- **Base URL**: https://hbt1j807qf.execute-api.us-east-1.amazonaws.com

### Token Lifetime
- **ID Token**: 1 hour
- **Access Token**: 1 hour
- **Refresh Token**: 30 days

---

## Common Issues

### 401 Unauthorized
- Token expired → Sign in again
- Invalid token → Verify token format
- Missing token → Add Authorization header

### Cannot Sign In
- Check username/password
- Verify account is enabled
- Check CloudWatch logs

### Token Expired
- Sign in again to get new token
- Tokens expire after 1 hour

---

## Documentation Links

- [Full Authentication Guide](./authentication-guide.md)
- [User Management Guide](./cognito-user-management.md)
- [API Authentication](./api-authentication.md)
