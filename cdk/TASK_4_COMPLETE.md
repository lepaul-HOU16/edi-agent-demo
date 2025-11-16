# Task 4 Complete: Backend Mock Authentication

## ✅ Implementation Complete

The backend now accepts mock development tokens for local development and testing.

## What Was Deployed

### 1. Custom Lambda Authorizer
- **Function**: `EnergyInsights-development-custom-authorizer`
- **ARN**: `arn:aws:lambda:us-east-1:484907533441:function:EnergyInsights-development-custom-authorizer`
- **Location**: `cdk/lambda-functions/authorizer/handler.ts`

### 2. Features
- ✅ Accepts mock tokens with prefix `mock-dev-token-*`
- ✅ Accepts Cognito JWT tokens (production)
- ✅ Environment-based control (`ENABLE_MOCK_AUTH=true` in development)
- ✅ Supports both API Gateway V1 and V2 event formats
- ✅ Returns simple response format for HTTP API

### 3. API Gateway Configuration
- All routes now use the custom Lambda authorizer
- Mock authentication enabled in development environment
- Production environment will have `ENABLE_MOCK_AUTH=false`

## Testing Results

### Successful Mock Token Authentication
```bash
curl -X GET "https://hbt1j807qf.execute-api.us-east-1.amazonaws.com/test/auth" \
  -H "Authorization: Bearer mock-dev-token-$(date +%s)"
```

**Response shows successful authorization:**
```json
{
  "authorizer": {
    "lambda": {
      "authType": "mock",
      "email": "dev@example.com",
      "userId": "mock-user"
    }
  }
}
```

### CloudWatch Logs Confirm
```
Authorizer invoked: {
  eventType: 'REQUEST',
  identitySource: [ 'Bearer mock-dev-token-1763152072' ],
  mockAuthEnabled: true
}
Token found: Bearer mock-dev-token-17631520...
Mock development token detected - allowing access
```

## How to Use

### Frontend Integration

```typescript
// In development mode
const token = `mock-dev-token-${Date.now()}`;

// Make API call
fetch('https://hbt1j807qf.execute-api.us-east-1.amazonaws.com/api/endpoint', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});
```

### Testing Different Endpoints

```bash
# API Gateway URL
API_URL="https://hbt1j807qf.execute-api.us-east-1.amazonaws.com"

# Test chat endpoint
curl -X POST "${API_URL}/api/chat/message" \
  -H "Authorization: Bearer mock-dev-token-123" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'

# Test catalog endpoint
curl -X GET "${API_URL}/api/catalog/map-data" \
  -H "Authorization: Bearer mock-dev-token-123"

# Test projects endpoint
curl -X GET "${API_URL}/api/projects/project-123" \
  -H "Authorization: Bearer mock-dev-token-123"
```

## Environment Variables

The authorizer uses these environment variables (automatically set by CDK):

- `USER_POOL_ID`: `us-east-1_sC6yswGji`
- `USER_POOL_CLIENT_ID`: `18m99t0u39vi9614ssd8sf8vmb`
- `ENABLE_MOCK_AUTH`: `true` (development) / `false` (production)

## Security Notes

⚠️ **Important Security Considerations:**

1. Mock authentication is **ONLY** enabled in development environment
2. Production deployment will have `ENABLE_MOCK_AUTH=false`
3. Mock tokens provide full access without validation
4. Never enable mock auth in production
5. Use proper Cognito authentication for production

## Deployment Info

- **Stack**: `EnergyInsights-development`
- **Region**: `us-east-1`
- **API Gateway**: `https://hbt1j807qf.execute-api.us-east-1.amazonaws.com`
- **CloudFront**: `https://d36sq31aqkfe46.cloudfront.net`
- **Mock Auth Status**: `Enabled` (development)

## Next Steps

1. ✅ Backend accepts mock tokens (COMPLETE)
2. Frontend needs to send mock tokens in Authorization header (Task 3)
3. Test end-to-end authentication flow
4. Verify all API endpoints work with mock tokens

## Troubleshooting

### View Authorizer Logs
```bash
aws logs tail /aws/lambda/EnergyInsights-development-custom-authorizer --follow
```

### Test Authorizer Directly
```bash
# Should succeed with mock token
curl -v -H "Authorization: Bearer mock-dev-token-test" \
  https://hbt1j807qf.execute-api.us-east-1.amazonaws.com/test/auth

# Should fail with invalid token
curl -v -H "Authorization: Bearer invalid-token" \
  https://hbt1j807qf.execute-api.us-east-1.amazonaws.com/test/auth
```

### Common Issues

**401 Unauthorized with mock token:**
- Check `ENABLE_MOCK_AUTH` environment variable is `true`
- Verify token starts with `mock-dev-token-`
- Check CloudWatch logs for details

**All tokens rejected:**
- Verify authorizer Lambda is deployed
- Check IAM permissions for Cognito User Pool access
- Review CloudWatch logs for errors

## Files Modified

1. `cdk/lib/main-stack.ts` - Replaced Cognito authorizer with custom Lambda authorizer
2. `cdk/lambda-functions/authorizer/handler.ts` - Custom authorizer implementation
3. `cdk/lambda-functions/authorizer/package.json` - Dependencies
4. `cdk/lambda-functions/authorizer/tsconfig.json` - TypeScript configuration

## Task Status

✅ **COMPLETE** - Backend successfully accepts mock development tokens
