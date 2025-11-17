# API Authentication Documentation

## Overview

All API endpoints in the AWS Energy Data Insights platform require authentication using JWT tokens issued by AWS Cognito. This document describes how to authenticate API requests.

## Authentication Requirements

### Required Header

All API requests must include an `Authorization` header with a valid JWT token:

```
Authorization: Bearer <JWT_TOKEN>
```

### Token Format

- **Type**: JWT (JSON Web Token)
- **Issuer**: AWS Cognito User Pool (us-east-1_sC6yswGji)
- **Expiration**: 1 hour from issuance
- **Algorithm**: RS256 (RSA Signature with SHA-256)

## Getting a JWT Token

### Method 1: Sign In Through UI

1. Navigate to the application
2. Sign in with your credentials
3. Open browser developer tools (F12)
4. Go to Console tab
5. Run: `await cognitoAuth.getToken()`
6. Copy the returned token

### Method 2: AWS CLI

```bash
aws cognito-idp admin-initiate-auth \
  --user-pool-id us-east-1_sC6yswGji \
  --client-id 18m99t0u39vi9614ssd8sf8vmb \
  --auth-flow ADMIN_NO_SRP_AUTH \
  --auth-parameters USERNAME=<username>,PASSWORD=<password> \
  --region us-east-1 \
  --query 'AuthenticationResult.IdToken' \
  --output text
```

### Method 3: Programmatic (JavaScript/TypeScript)

```typescript
import { cognitoAuth } from '@/lib/auth/cognitoAuth';

// Sign in
await cognitoAuth.signIn(username, password);

// Get token
const token = await cognitoAuth.getToken();
```

## API Endpoints

### Base URL

```
https://hbt1j807qf.execute-api.us-east-1.amazonaws.com/api
```

### Chat API

#### Create Chat Session

```bash
POST /chat/sessions
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "name": "Session Name"
}
```

**Response:**
```json
{
  "id": "session-id",
  "name": "Session Name",
  "createdAt": "2025-01-14T10:00:00Z"
}
```

#### Send Message

```bash
POST /chat/sessions/{sessionId}/messages
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "message": "Analyze well data for WELL-001"
}
```

**Response:**
```json
{
  "messageId": "message-id",
  "response": "Analysis complete...",
  "artifacts": [...]
}
```

#### List Sessions

```bash
GET /chat/sessions
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "sessions": [
    {
      "id": "session-id",
      "name": "Session Name",
      "createdAt": "2025-01-14T10:00:00Z"
    }
  ]
}
```

### Catalog API

#### Search Catalog

```bash
POST /catalog/search
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "query": "well data",
  "filters": {
    "type": "well"
  }
}
```

**Response:**
```json
{
  "results": [
    {
      "id": "item-id",
      "name": "WELL-001",
      "type": "well"
    }
  ]
}
```

### Petrophysical Analysis API

#### Calculate Porosity

```bash
POST /analysis/porosity
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "wellName": "WELL-001",
  "method": "density",
  "depthRange": {
    "start": 1000,
    "end": 2000
  }
}
```

**Response:**
```json
{
  "wellName": "WELL-001",
  "porosity": {
    "values": [...],
    "statistics": {
      "mean": 0.15,
      "min": 0.05,
      "max": 0.25
    }
  }
}
```

## Authentication Errors

### 401 Unauthorized

**Cause**: Invalid, expired, or missing JWT token

**Response:**
```json
{
  "message": "Unauthorized"
}
```

**Solutions:**
- Verify token is included in Authorization header
- Check token has not expired (1 hour lifetime)
- Ensure token format is correct: `Bearer <token>`
- Sign in again to get a new token

### 403 Forbidden

**Cause**: Valid token but insufficient permissions

**Response:**
```json
{
  "message": "Forbidden"
}
```

**Solutions:**
- Verify user has required permissions
- Contact administrator to grant access
- Check user group memberships

## Token Validation

### How Tokens Are Validated

1. **Extract Token**: Lambda authorizer extracts token from Authorization header
2. **Verify Signature**: Token signature verified against Cognito public keys
3. **Check Expiration**: Token expiration timestamp checked
4. **Validate Issuer**: Token issuer verified to match user pool
5. **Extract User Info**: User information extracted from token payload
6. **Allow/Deny**: Request allowed or denied based on validation

### Token Payload

A valid JWT token contains:

```json
{
  "sub": "user-id",
  "cognito:username": "username",
  "email": "user@example.com",
  "email_verified": true,
  "iss": "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_sC6yswGji",
  "aud": "18m99t0u39vi9614ssd8sf8vmb",
  "token_use": "id",
  "auth_time": 1705233600,
  "iat": 1705233600,
  "exp": 1705237200
}
```

### Decoding Tokens

To inspect a token (for debugging):

```bash
# Using jq (Linux/Mac)
echo "<token>" | cut -d. -f2 | base64 -d | jq

# Using online tool
# Visit: https://jwt.io
# Paste token to decode
```

## Example API Requests

### cURL Examples

#### Create Session and Send Message

```bash
# Get token
TOKEN=$(aws cognito-idp admin-initiate-auth \
  --user-pool-id us-east-1_sC6yswGji \
  --client-id 18m99t0u39vi9614ssd8sf8vmb \
  --auth-flow ADMIN_NO_SRP_AUTH \
  --auth-parameters USERNAME=testuser,PASSWORD=TestPass123! \
  --region us-east-1 \
  --query 'AuthenticationResult.IdToken' \
  --output text)

# Create session
SESSION_ID=$(curl -X POST \
  https://hbt1j807qf.execute-api.us-east-1.amazonaws.com/api/chat/sessions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Session"}' \
  | jq -r '.id')

# Send message
curl -X POST \
  https://hbt1j807qf.execute-api.us-east-1.amazonaws.com/api/chat/sessions/$SESSION_ID/messages \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"Analyze well data"}'
```

### JavaScript/TypeScript Examples

#### Using Fetch API

```typescript
// Get token
const token = await cognitoAuth.getToken();

// Create session
const response = await fetch(
  'https://hbt1j807qf.execute-api.us-east-1.amazonaws.com/api/chat/sessions',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: 'Test Session' }),
  }
);

const session = await response.json();
```

#### Using Axios

```typescript
import axios from 'axios';

// Get token
const token = await cognitoAuth.getToken();

// Configure axios
const api = axios.create({
  baseURL: 'https://hbt1j807qf.execute-api.us-east-1.amazonaws.com/api',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});

// Create session
const response = await api.post('/chat/sessions', {
  name: 'Test Session',
});
```

### Python Examples

```python
import requests
import boto3

# Get token using boto3
client = boto3.client('cognito-idp', region_name='us-east-1')
response = client.admin_initiate_auth(
    UserPoolId='us-east-1_sC6yswGji',
    ClientId='18m99t0u39vi9614ssd8sf8vmb',
    AuthFlow='ADMIN_NO_SRP_AUTH',
    AuthParameters={
        'USERNAME': 'testuser',
        'PASSWORD': 'TestPass123!'
    }
)
token = response['AuthenticationResult']['IdToken']

# Make API request
headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
}

response = requests.post(
    'https://hbt1j807qf.execute-api.us-east-1.amazonaws.com/api/chat/sessions',
    headers=headers,
    json={'name': 'Test Session'}
)

print(response.json())
```

## Rate Limiting

### Current Limits

- **Requests per second**: 100
- **Burst capacity**: 200
- **Daily limit**: 1,000,000

### Rate Limit Headers

Responses include rate limit information:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705233660
```

### Rate Limit Exceeded

**Response:**
```json
{
  "message": "Rate limit exceeded",
  "retryAfter": 60
}
```

**Status Code**: 429 Too Many Requests

## Security Best Practices

### Token Storage

- ✅ Store tokens in memory
- ✅ Use secure session storage if needed
- ❌ Never store tokens in localStorage
- ❌ Never commit tokens to version control
- ❌ Never log tokens in production

### Token Transmission

- ✅ Always use HTTPS
- ✅ Include token in Authorization header
- ❌ Never include token in URL parameters
- ❌ Never include token in request body

### Token Lifecycle

- ✅ Refresh tokens before expiration
- ✅ Clear tokens on sign-out
- ✅ Handle token expiration gracefully
- ❌ Never reuse expired tokens
- ❌ Never share tokens between users

## Monitoring and Logging

### CloudWatch Logs

Authentication events are logged to CloudWatch:

```bash
# View authorizer logs
aws logs tail /aws/lambda/EnergyInsights-development-custom-authorizer \
  --follow \
  --region us-east-1

# Filter for authentication failures
aws logs filter-log-events \
  --log-group-name /aws/lambda/EnergyInsights-development-custom-authorizer \
  --filter-pattern "Unauthorized" \
  --region us-east-1
```

### Metrics

Monitor authentication metrics:
- Successful authentications
- Failed authentications
- Token expiration events
- Rate limit violations

## Troubleshooting

### Common Issues

**Issue**: "Authorization header required"
- **Cause**: Missing Authorization header
- **Solution**: Add `Authorization: Bearer <token>` header

**Issue**: "Invalid token"
- **Cause**: Malformed or corrupted token
- **Solution**: Sign in again to get new token

**Issue**: "Token expired"
- **Cause**: Token older than 1 hour
- **Solution**: Sign in again or refresh token

**Issue**: "Unauthorized"
- **Cause**: Token validation failed
- **Solution**: Verify token is from correct user pool

### Debug Checklist

- [ ] Token included in Authorization header
- [ ] Token format is `Bearer <token>`
- [ ] Token has not expired
- [ ] Token is from correct user pool
- [ ] User account is enabled
- [ ] API endpoint URL is correct
- [ ] Request method is correct
- [ ] Content-Type header is set

## Support

For API authentication issues:
1. Check CloudWatch logs for detailed errors
2. Verify token is valid and not expired
3. Test with curl to isolate client issues
4. Contact support with request ID from error response
