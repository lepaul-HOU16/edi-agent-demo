# Task 8: Credentials Implementation Guide

## Status: ✅ IMPLEMENTATION READY

**Date**: December 3, 2024

## Summary

This guide provides the complete implementation for storing and retrieving credentials from AWS Secrets Manager. The code is ready to deploy once you provide the actual credentials.

## What I've Prepared

### 1. Secrets Manager Helper Module

Created a reusable module for retrieving credentials from AWS Secrets Manager with caching.

### 2. Updated Agent Code

Modified EDIcraft agent to use Secrets Manager for sensitive credentials.

### 3. IAM Permissions

Added necessary permissions for Lambda to read from Secrets Manager.

### 4. Deployment Scripts

Created scripts to help you store credentials in Secrets Manager.

## Implementation Steps

### Step 1: Store Credentials in AWS Secrets Manager

#### Option A: Minecraft RCON Only (Minimum Required)

```bash
# Store Minecraft RCON password
aws secretsmanager create-secret \
  --name minecraft/rcon-password \
  --description "RCON password for EDIcraft Minecraft server" \
  --secret-string '{"password":"YOUR_ACTUAL_RCON_PASSWORD_HERE"}' \
  --region us-east-1
```

#### Option B: Minecraft + OSDU (Full EDIcraft Functionality)

```bash
# Store Minecraft RCON password
aws secretsmanager create-secret \
  --name minecraft/rcon-password \
  --description "RCON password for EDIcraft Minecraft server" \
  --secret-string '{"password":"YOUR_ACTUAL_RCON_PASSWORD_HERE"}' \
  --region us-east-1

# Store OSDU credentials
aws secretsmanager create-secret \
  --name edicraft/osdu-credentials \
  --description "OSDU platform credentials for EDIcraft agent" \
  --secret-string '{
    "client_id": "YOUR_CLIENT_ID",
    "client_secret": "YOUR_CLIENT_SECRET",
    "username": "YOUR_USERNAME",
    "password": "YOUR_PASSWORD",
    "platform_url": "https://your-osdu-platform.com",
    "partition": "your-partition"
  }' \
  --region us-east-1
```

### Step 2: Deploy Updated Lambda Code

The Lambda code has been updated to:
1. Retrieve credentials from Secrets Manager
2. Cache credentials in memory (reduces API calls)
3. Handle missing credentials gracefully
4. Provide clear error messages

```bash
cd cdk
npm run deploy
```

### Step 3: Test on Localhost

```bash
npm run dev
# Open http://localhost:3000
# Test EDIcraft clear functionality
```

## Code Changes Made

### 1. Secrets Manager Helper (`cdk/lambda-functions/chat/utils/secretsManager.ts`)

```typescript
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

// Cache for secrets (reduces API calls)
const secretsCache = new Map<string, { value: any; timestamp: number }>();
const CACHE_TTL = 3600000; // 1 hour

export async function getSecret(secretId: string, region: string = 'us-east-1'): Promise<any> {
  // Check cache first
  const cached = secretsCache.get(secretId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.value;
  }

  // Retrieve from Secrets Manager
  const client = new SecretsManagerClient({ region });
  try {
    const response = await client.send(
      new GetSecretValueCommand({ SecretId: secretId })
    );
    
    const secret = JSON.parse(response.SecretString || '{}');
    
    // Cache the secret
    secretsCache.set(secretId, { value: secret, timestamp: Date.now() });
    
    return secret;
  } catch (error: any) {
    if (error.name === 'ResourceNotFoundException') {
      throw new Error(`Secret '${secretId}' not found in Secrets Manager`);
    }
    throw error;
  }
}

export async function getMinecraftPassword(): Promise<string> {
  const secret = await getSecret('minecraft/rcon-password');
  if (!secret.password) {
    throw new Error('Minecraft RCON password not found in secret');
  }
  return secret.password;
}

export async function getOSDUCredentials() {
  return await getSecret('edicraft/osdu-credentials');
}
```

### 2. Updated EDIcraft Agent

The agent now retrieves credentials from Secrets Manager instead of environment variables:

```typescript
// In edicraftAgent.ts
import { getMinecraftPassword, getOSDUCredentials } from '../utils/secretsManager';

async processMessage(message: string) {
  try {
    // Get credentials from Secrets Manager
    const rconPassword = await getMinecraftPassword();
    
    // Optional: Get OSDU credentials if needed
    let osduCreds;
    try {
      osduCreds = await getOSDUCredentials();
    } catch (error) {
      console.log('OSDU credentials not available (optional)');
    }
    
    // Use credentials for RCON connection
    // ... rest of implementation
  } catch (error) {
    if (error.message.includes('not found in Secrets Manager')) {
      return {
        success: false,
        message: 'EDIcraft credentials not configured. Please run: aws secretsmanager create-secret ...',
        error: error.message
      };
    }
    throw error;
  }
}
```

### 3. Updated IAM Permissions

Added Secrets Manager permissions to Lambda role:

```typescript
// In main-stack.ts
chatFunction.function.addToRolePolicy(
  new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    actions: ['secretsmanager:GetSecretValue'],
    resources: [
      `arn:aws:secretsmanager:us-east-1:${this.account}:secret:minecraft/rcon-password-*`,
      `arn:aws:secretsmanager:us-east-1:${this.account}:secret:edicraft/osdu-credentials-*`,
    ],
  })
);
```

## What You Need to Provide

### Minimum (EDIcraft Basic Functionality):
1. **Minecraft RCON Password** - Required for clear functionality

### Optional (EDIcraft Full Functionality):
2. **OSDU Credentials** - Only if EDIcraft needs to access subsurface data

## Credential Storage Commands

### Quick Start: Minecraft Only

```bash
# Replace YOUR_ACTUAL_PASSWORD with the real RCON password
aws secretsmanager create-secret \
  --name minecraft/rcon-password \
  --description "RCON password for EDIcraft Minecraft server" \
  --secret-string '{"password":"YOUR_ACTUAL_PASSWORD"}' \
  --region us-east-1
```

### Full Setup: Minecraft + OSDU

```bash
# 1. Store Minecraft password
aws secretsmanager create-secret \
  --name minecraft/rcon-password \
  --description "RCON password for EDIcraft Minecraft server" \
  --secret-string '{"password":"YOUR_ACTUAL_PASSWORD"}' \
  --region us-east-1

# 2. Store OSDU credentials
aws secretsmanager create-secret \
  --name edicraft/osdu-credentials \
  --description "OSDU platform credentials for EDIcraft agent" \
  --secret-string '{
    "client_id": "YOUR_CLIENT_ID",
    "client_secret": "YOUR_CLIENT_SECRET",
    "username": "YOUR_USERNAME",
    "password": "YOUR_PASSWORD",
    "platform_url": "https://your-osdu-platform.com",
    "partition": "your-partition"
  }' \
  --region us-east-1
```

## Verification

### Check Secrets Were Created

```bash
# List all secrets
aws secretsmanager list-secrets --region us-east-1

# Get Minecraft password (to verify)
aws secretsmanager get-secret-value \
  --secret-id minecraft/rcon-password \
  --region us-east-1 \
  --query 'SecretString' \
  --output text

# Get OSDU credentials (to verify)
aws secretsmanager get-secret-value \
  --secret-id edicraft/osdu-credentials \
  --region us-east-1 \
  --query 'SecretString' \
  --output text
```

## Error Handling

The implementation includes comprehensive error handling:

### Missing Secret
```
Error: Secret 'minecraft/rcon-password' not found in Secrets Manager
Solution: Run the aws secretsmanager create-secret command above
```

### Invalid Secret Format
```
Error: Minecraft RCON password not found in secret
Solution: Ensure secret contains {"password": "..."}
```

### Permission Denied
```
Error: AccessDeniedException
Solution: Ensure Lambda has secretsmanager:GetSecretValue permission
```

## Security Benefits

### Before (Environment Variables):
- ❌ Passwords visible in Lambda console
- ❌ Passwords in CDK code/git
- ❌ No audit trail
- ❌ No rotation capability
- ❌ Exposed in CloudFormation

### After (Secrets Manager):
- ✅ Passwords encrypted at rest
- ✅ Passwords never in code
- ✅ Full audit trail (CloudTrail)
- ✅ Automatic rotation possible
- ✅ Fine-grained access control
- ✅ Cached in memory (performance)

## Cost

AWS Secrets Manager pricing:
- $0.40 per secret per month
- $0.05 per 10,000 API calls

For this implementation:
- 2 secrets = $0.80/month
- Caching reduces API calls significantly
- Estimated cost: ~$1/month

## Troubleshooting

### Secret Not Found
```bash
# Check if secret exists
aws secretsmanager describe-secret \
  --secret-id minecraft/rcon-password \
  --region us-east-1
```

### Permission Issues
```bash
# Check Lambda role permissions
aws iam get-role-policy \
  --role-name EnergyInsights-development-chat-role \
  --policy-name SecretsManagerPolicy
```

### Test Credential Retrieval
```bash
# Invoke Lambda to test
aws lambda invoke \
  --function-name EnergyInsights-development-chat \
  --payload '{"test": "credentials"}' \
  response.json
```

## Next Steps

1. **You provide credentials** - Run the aws secretsmanager create-secret commands
2. **I deploy the code** - Run `cd cdk && npm run deploy`
3. **We test on localhost** - Verify EDIcraft works
4. **Mark task complete** - Move to next task

## Questions?

- **Q: Do I need OSDU credentials?**
  - A: Only if EDIcraft needs to access subsurface data from OSDU. If it only needs Minecraft visualization, just provide the RCON password.

- **Q: Where do I get the RCON password?**
  - A: From the Minecraft server administrator or server configuration files.

- **Q: Can I update credentials later?**
  - A: Yes, use `aws secretsmanager update-secret` command.

- **Q: What if I don't have credentials now?**
  - A: We can skip this task and come back to it later. EDIcraft won't work until credentials are provided.

---

**Ready to proceed once you provide credentials!**

