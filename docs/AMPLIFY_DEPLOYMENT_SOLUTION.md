# Amplify Deployment Solution - "Unknown command: push" Error

## Problem
You encountered the error "Unknown command: push" when trying to deploy your Amplify application.

## Root Cause
Your project uses **Amplify Gen 2**, which has different CLI commands than the older Amplify CLI v1. The old `amplify push` command doesn't exist in Amplify Gen 2.

## Solution

### 1. Use the Correct CLI Command
Instead of `amplify push`, use the new Amplify Gen 2 CLI commands:

#### For Development/Sandbox Deployment:
```bash
# Start sandbox with file watching (recommended for development)
npx ampx sandbox

# One-time deployment without file watching
npx ampx sandbox --once
```

#### For Production Deployment:
```bash
# Use in CI/CD pipelines
npx ampx pipeline-deploy
```

### 2. Key Differences Between Amplify CLI v1 and Gen 2

| Amplify CLI v1 | Amplify Gen 2 (ampx) |
|----------------|----------------------|
| `amplify push` | `npx ampx sandbox` |
| `amplify publish` | `npx ampx sandbox --once` |
| `amplify delete` | `npx ampx sandbox delete` |

### 3. Your Project Configuration
Your project is correctly configured for Amplify Gen 2:
- ✅ Uses `@aws-amplify/backend` v1.14.0
- ✅ Uses `@aws-amplify/backend-cli` v1.4.9
- ✅ Has `amplify/backend.ts` file (Gen 2 configuration)
- ✅ `ampx` CLI v1.5.0 is available

### 4. AWS Credentials Issue (Secondary)
During testing, we also discovered an AWS credentials issue:
```
SSMCredentialsError: UnrecognizedClientException: The security token included in the request is invalid.
```

#### To Fix AWS Credentials:
```bash
# Check current AWS configuration
aws configure list

# If using AWS SSO, login again
aws sso login --profile your-profile-name

# Or configure with access keys
aws configure
```

### 5. Recommended Deployment Workflow

#### For Local Development:
```bash
# Start development server
npm run dev

# In another terminal, start Amplify sandbox
npx ampx sandbox
```

#### For Production Deployment:
```bash
# Build the Next.js app
npm run build

# Deploy backend (one-time)
npx ampx sandbox --once

# Deploy to Amplify Console (if using hosted deployment)
# This happens automatically via git push if connected to Amplify Console
```

### 6. Useful Commands

```bash
# Check ampx version
npx ampx --version

# Get help for sandbox command
npx ampx sandbox --help

# Delete sandbox environment
npx ampx sandbox delete

# Generate troubleshooting info
npx ampx info
```

## Summary
- Replace `amplify push` with `npx ampx sandbox`
- Ensure AWS credentials are valid
- Use `npx ampx sandbox --once` for one-time deployments
- Your project is correctly configured for Amplify Gen 2
