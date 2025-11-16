# Testing Mock Authentication After Deployment

## Overview

This document describes how to test the custom Lambda authorizer that supports both Cognito JWT tokens and mock development tokens.

## What Was Implemented

1. **Custom Lambda Authorizer** (`cdk/lambda-functions/authorizer/handler.ts`)
   - Accepts Cognito JWT tokens (production)
   - Accepts `mock-dev-token-*` tokens (development only)
   - Environment variable `ENABLE_MOCK_AUTH` controls mock token acceptance

2. **CDK Stack Updates** (`cdk/lib/main-stack.ts`)
   - Replaced `HttpUserPoolAuthorizer` with `HttpLambdaAuthorizer`
   - Authorizer function receives `ENABLE_MOCK_AUTH=true` in development
   - All API routes use the custom authorizer

## Testing Locally

The authorizer has been tested locally with the following results:

```bash
cd cdk
node test-mock-auth.js
```

### Test Results:
- ✅ Mock tokens accepted in development mode
- ✅ Invalid tokens rejected
- ✅ Mock tokens rejected in production mode

## Testing After Deployment

### 1. Deploy the Stack

```bash
cd cdk
npm run build
cdk deploy --profile <your-profile>
```

### 2. Get API Gateway URL

After deployment, note the `HttpApiUrl` output:
```
Outputs:
EnergyInsightsStack.HttpApiUrl = https://xxxxx.execute-api.us-east-1.amazonaws.com
```

### 3. Test with Mock Token

```bash
# Set variables
API_URL="https://xxxxx.execute-api.us-east-1.amazonaws.com"
MOCK_TOKEN="mock-dev-token-$(date +%s)"

# Test authenticated endpoint
curl -X GET "${API_URL}/test/auth" \
  -H "Authorization: Bearer ${MOCK_TOKEN}" \
  -v
```

**Expected Response (Development):**
- Status: 200 OK
- Body: Success message from test Lambda

**Expected Response (Production):**
- Status: 401 Unauthorized
- Body: Unauthorized

### 4. Test with Invalid Token

```bash
curl -X GET "${API_URL}/test/auth" \
  -H "Authorization: Bearer invalid-token" \
  -v
```

**Expected Response:**
- Status: 401 Unauthorized
- Body: Unauthorized

### 5. Test with Real Cognito Token

```bash
# Get a real Cognito token (use your authentication flow)
COGNITO_TOKEN="<your-cognito-jwt-token>"

curl -X GET "${API_URL}/test/auth" \
  -H "Authorization: Bearer ${COGNITO_TOKEN}" \
  -v
```

**Expected Response:**
- Status: 200 OK
- Body: Success message with user info

## Environment Variables

The authorizer uses these environment variables:

- `USER_POOL_ID`: Cognito User Pool ID (set by CDK)
- `USER_POOL_CLIENT_ID`: Cognito User Pool Client ID (set by CDK)
- `ENABLE_MOCK_AUTH`: `true` for development, `false` for production

## Frontend Integration

The frontend should send tokens in the Authorization header:

```typescript
// Development mode
const token = `mock-dev-token-${Date.now()}`;

// API call
fetch(`${API_URL}/api/endpoint`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});
```

## Troubleshooting

### Mock tokens not accepted

1. Check CloudWatch logs for the authorizer Lambda
2. Verify `ENABLE_MOCK_AUTH` environment variable is set to `true`
3. Ensure token starts with `mock-dev-token-`

### Cognito tokens not accepted

1. Check CloudWatch logs for JWT verification errors
2. Verify `USER_POOL_ID` and `USER_POOL_CLIENT_ID` are correct
3. Ensure token is a valid JWT from the correct User Pool

### All tokens rejected

1. Check API Gateway authorizer configuration
2. Verify Lambda has correct IAM permissions
3. Check CloudWatch logs for errors

## CloudWatch Logs

View authorizer logs:

```bash
aws logs tail /aws/lambda/EnergyInsightsStack-custom-authorizer --follow
```

## Production Deployment

For production deployment:

1. Set `environment: 'production'` in CDK stack props
2. This will set `ENABLE_MOCK_AUTH=false`
3. Only Cognito JWT tokens will be accepted
4. Deploy with: `cdk deploy --context environment=production`

## Security Notes

- Mock authentication is **ONLY** for development
- Never enable `ENABLE_MOCK_AUTH=true` in production
- Mock tokens provide full access without validation
- Use proper Cognito authentication in production
