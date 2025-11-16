# Design: Remove Amplify Migration

## Overview

This design outlines the architecture for migrating from AWS Amplify Gen 2 to a pure CDK + Next.js stack, eliminating Amplify-specific limitations while maintaining all functionality.

## Current Architecture (Amplify Gen 2)

```
┌─────────────────────────────────────────────────────────────┐
│                     Amplify Gen 2                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Frontend (Next.js)                                     │ │
│  │  - Amplify Hosting                                      │ │
│  │  - Amplify UI Components                                │ │
│  │  - Amplify GraphQL Client                               │ │
│  └────────────────────────────────────────────────────────┘ │
│                           │                                  │
│                           ▼                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  AppSync GraphQL API                                    │ │
│  │  - Schema defined in data/resource.ts                   │ │
│  │  - Resolvers (often broken/disconnected)                │ │
│  │  - Data sources (sometimes missing)                     │ │
│  └────────────────────────────────────────────────────────┘ │
│                           │                                  │
│                           ▼                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Lambda Functions                                       │ │
│  │  - Defined via defineFunction()                         │ │
│  │  - Deployment issues (code not updating)                │ │
│  │  - Resolver connection problems                         │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Cognito + DynamoDB + S3                                │ │
│  │  - Managed by Amplify                                   │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Problems:**
- AppSync resolvers not connecting to Lambda functions
- Lambda code changes not deploying
- Complex debugging (Amplify abstractions hide issues)
- Limited control over infrastructure
- Amplify Gen 2 bugs and limitations

## Proposed Architecture (Pure CDK + Next.js)

```
┌─────────────────────────────────────────────────────────────┐
│                    CloudFront CDN                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Origin 1: S3 (Static Assets)                          │ │
│  │  - Next.js build output                                 │ │
│  │  - HTML, CSS, JS, images                                │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Origin 2: API Gateway (API Calls)                     │ │
│  │  - /api/* routes to API Gateway                         │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              API Gateway HTTP API                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Routes:                                                │ │
│  │  POST /projects/delete                                  │ │
│  │  POST /projects/rename                                  │ │
│  │  GET  /projects/list                                    │ │
│  │  POST /chat/message                                     │ │
│  │  GET  /agent/progress/{requestId}                       │ │
│  │  ... (all other endpoints)                              │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Authorizer: Cognito JWT                                │ │
│  │  - Validates tokens on every request                    │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  Lambda Functions                            │
│  - Same handler code as before                              │
│  - Direct CDK deployment (no Amplify wrapper)               │
│  - Clear logs and debugging                                 │
│  - Fast, reliable updates                                   │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│          Cognito + DynamoDB + S3                             │
│  - Same resources, managed by CDK                            │
│  - No data migration needed                                  │
└─────────────────────────────────────────────────────────────┘
```

**Benefits:**
- ✅ Direct Lambda deployment (no resolver issues)
- ✅ Simple REST API (easy debugging)
- ✅ Full CDK control (no Amplify limitations)
- ✅ Fast deployments (CDK is reliable)
- ✅ Clear error messages (no Amplify abstractions)

## Components

### 1. CDK Infrastructure Stack

**File:** `cdk/lib/main-stack.ts`

```typescript
export class MainStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Cognito User Pool (reuse existing)
    const userPool = cognito.UserPool.fromUserPoolId(
      this,
      'UserPool',
      'us-east-1_sC6yswGji' // existing pool
    );

    // S3 Bucket for storage
    const storageBucket = new s3.Bucket(this, 'StorageBucket', {
      bucketName: 'energy-data-insights-storage',
      cors: [/* ... */],
    });

    // DynamoDB Tables (reuse existing)
    const chatTable = dynamodb.Table.fromTableName(
      this,
      'ChatTable',
      'ChatMessage-...'
    );

    // Lambda Functions
    const chatFunction = new lambda.Function(this, 'ChatFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('dist/functions/chat'),
      environment: {
        STORAGE_BUCKET: storageBucket.bucketName,
        CHAT_TABLE: chatTable.tableName,
      },
    });

    // API Gateway
    const api = new apigatewayv2.HttpApi(this, 'Api', {
      corsPreflight: {
        allowOrigins: ['*'],
        allowMethods: [apigatewayv2.CorsHttpMethod.ANY],
      },
    });

    // Cognito Authorizer
    const authorizer = new apigatewayv2_authorizers.HttpUserPoolAuthorizer(
      'CognitoAuthorizer',
      userPool
    );

    // Routes
    api.addRoutes({
      path: '/projects/delete',
      methods: [apigatewayv2.HttpMethod.POST],
      integration: new apigatewayv2_integrations.HttpLambdaIntegration(
        'DeleteProjectIntegration',
        chatFunction
      ),
      authorizer,
    });

    // Frontend S3 Bucket
    const frontendBucket = new s3.Bucket(this, 'FrontendBucket', {
      websiteIndexDocument: 'index.html',
      publicReadAccess: true,
    });

    // CloudFront Distribution
    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(frontendBucket),
      },
      additionalBehaviors: {
        '/api/*': {
          origin: new origins.HttpOrigin(api.apiEndpoint),
        },
      },
    });
  }
}
```

### 2. Frontend API Client

**File:** `src/lib/api-client.ts`

```typescript
import { fetchAuthSession } from 'aws-amplify/auth'; // Keep Amplify Auth only

class ApiClient {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL;

  private async getAuthToken(): Promise<string> {
    const session = await fetchAuthSession();
    return session.tokens?.idToken?.toString() || '';
  }

  async deleteProject(projectId: string) {
    const token = await this.getAuthToken();
    
    const response = await fetch(`${this.baseUrl}/projects/delete`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ projectId }),
    });

    if (!response.ok) {
      throw new Error(`Delete failed: ${response.statusText}`);
    }

    return response.json();
  }

  async listProjects() {
    const token = await this.getAuthToken();
    
    const response = await fetch(`${this.baseUrl}/projects/list`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    return response.json();
  }
}

export const apiClient = new ApiClient();
```

### 3. Lambda Function Handler

**File:** `functions/projects/handler.ts`

```typescript
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  
  // Route based on path
  const path = event.requestContext.http.path;
  const method = event.requestContext.http.method;

  try {
    if (path === '/projects/delete' && method === 'POST') {
      const { projectId } = JSON.parse(event.body || '{}');
      await deleteProject(projectId);
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, message: 'Deleted' }),
      };
    }

    if (path === '/projects/list' && method === 'GET') {
      const projects = await listProjects();
      return {
        statusCode: 200,
        body: JSON.stringify({ projects }),
      };
    }

    return {
      statusCode: 404,
      body: JSON.stringify({ error: 'Not found' }),
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
```

### 4. Next.js Configuration

**File:** `next.config.js`

```javascript
module.exports = {
  output: 'export', // Static export for S3
  // OR
  output: 'standalone', // For Lambda@Edge SSR
  
  images: {
    unoptimized: true, // Required for static export
  },
  
  env: {
    NEXT_PUBLIC_API_URL: process.env.API_URL,
    NEXT_PUBLIC_USER_POOL_ID: process.env.USER_POOL_ID,
    NEXT_PUBLIC_USER_POOL_CLIENT_ID: process.env.USER_POOL_CLIENT_ID,
  },
};
```

## Migration Strategy

### Phase 1: Set Up CDK Infrastructure (Week 1)

1. Create new CDK project
2. Define all resources (Lambda, API Gateway, S3, CloudFront)
3. Import existing Cognito and DynamoDB resources
4. Deploy to separate stack (parallel to Amplify)

### Phase 2: Migrate Lambda Functions (Week 2)

1. Copy Lambda function code to CDK project
2. Update environment variables
3. Deploy via CDK
4. Test all functions work correctly

### Phase 3: Create REST API (Week 3)

1. Define API Gateway routes
2. Connect routes to Lambda functions
3. Set up Cognito authorizer
4. Test all endpoints

### Phase 4: Update Frontend (Week 4)

1. Replace Amplify GraphQL client with REST client
2. Update all API calls to use new endpoints
3. Keep Amplify Auth (only for Cognito)
4. Test all features work

### Phase 5: Deploy Frontend (Week 5)

1. Build Next.js for static export
2. Upload to S3
3. Configure CloudFront
4. Test production deployment

### Phase 6: Cutover (Week 6)

1. Update DNS to point to new CloudFront
2. Monitor for issues
3. Decommission Amplify stack
4. Celebrate! 🎉

## Effort Estimation

### High-Level Breakdown

| Task | Effort | Risk |
|------|--------|------|
| CDK Infrastructure Setup | 2-3 days | Low |
| Lambda Migration | 3-4 days | Low |
| API Gateway Setup | 2-3 days | Low |
| Frontend API Client | 3-4 days | Medium |
| Frontend Updates | 5-7 days | Medium |
| Testing & Debugging | 5-7 days | Medium |
| Deployment & Cutover | 2-3 days | High |
| **Total** | **22-31 days** | **Medium** |

### Detailed Breakdown

**Infrastructure (5-7 days):**
- CDK project setup: 1 day
- Resource definitions: 2-3 days
- IAM permissions: 1-2 days
- Testing: 1 day

**Backend (5-7 days):**
- Lambda function migration: 2-3 days
- API Gateway routes: 2-3 days
- Testing: 1 day

**Frontend (8-11 days):**
- API client implementation: 2-3 days
- Update all components: 4-6 days
- Testing: 2 days

**Deployment (4-6 days):**
- S3 + CloudFront setup: 2-3 days
- Production testing: 1-2 days
- Cutover: 1 day

## Do We Need Next.js?

### Option 1: Keep Next.js (Recommended)

**Pros:**
- ✅ Keep all existing React components
- ✅ SSR capabilities for SEO
- ✅ File-based routing
- ✅ Built-in optimization
- ✅ Minimal frontend changes

**Cons:**
- ❌ Still need build process
- ❌ Larger bundle size

**Verdict:** **Keep Next.js**. The benefits outweigh the costs, and migration effort is minimal.

### Option 2: Pure React (Vite)

**Pros:**
- ✅ Simpler build process
- ✅ Faster dev server
- ✅ Smaller bundle

**Cons:**
- ❌ Need to rewrite routing
- ❌ Lose SSR capabilities
- ❌ More migration work

**Verdict:** Not worth the effort. Next.js works fine without Amplify.

### Option 3: Pure HTML/JS

**Pros:**
- ✅ No build process
- ✅ Simplest deployment

**Cons:**
- ❌ Complete rewrite required
- ❌ Lose all React components
- ❌ Lose all UI libraries

**Verdict:** Absolutely not worth it. Would take months.

## Recommendation

**Keep Next.js, remove Amplify backend.**

The frontend is fine. The problem is Amplify Gen 2's backend abstractions causing deployment and resolver issues. By moving to pure CDK + API Gateway, we get:

- ✅ Full control over infrastructure
- ✅ Reliable deployments
- ✅ Simple debugging
- ✅ No Amplify-specific bugs
- ✅ Keep all existing frontend code

**Estimated effort: 4-6 weeks**
**Risk: Medium**
**Value: High** (eliminates ongoing Amplify issues)

## Alternative: Fix Current Amplify Issues

If migration is too much work right now, we can:

1. Manually fix the AppSync resolver connections (what we're doing now)
2. Document all Amplify workarounds
3. Plan migration for later

**Estimated effort: 1-2 days**
**Risk: Low**
**Value: Low** (temporary fix, issues will recur)

## Local Development & Testing

### Current (Amplify Gen 2)

**Problems:**
- ❌ Must run `npx ampx sandbox` (deploys to AWS)
- ❌ Every code change requires cloud deployment
- ❌ Slow feedback loop (5-10 minutes per change)
- ❌ Can't test Lambda functions locally
- ❌ Costs money for every test
- ❌ Need internet connection
- ❌ Hard to debug (logs in CloudWatch)

**Workflow:**
```bash
# 1. Start sandbox (deploys to AWS)
npx ampx sandbox
# Wait 5-10 minutes...

# 2. Make code change
vim amplify/functions/renewableTools/handler.ts

# 3. Wait for auto-deploy
# Wait 2-5 minutes...

# 4. Test in browser
# If it doesn't work, check CloudWatch logs

# 5. Repeat...
```

### After Migration (Pure CDK)

**Benefits:**
- ✅ Frontend runs locally with hot reload
- ✅ Lambda functions can be tested locally
- ✅ Fast feedback loop (instant for frontend, seconds for Lambda)
- ✅ No deployment needed for most changes
- ✅ Free local testing
- ✅ Works offline
- ✅ Easy debugging (local logs)

**Workflow:**

#### Option 1: Full Local (Recommended for Development)

```bash
# Terminal 1: Run Next.js dev server
npm run dev
# Starts on http://localhost:3000
# Hot reload on every change

# Terminal 2: Run local Lambda functions (using AWS SAM)
sam local start-api --port 3001
# Lambdas available at http://localhost:3001
# Instant updates on code changes

# Terminal 3: Watch Lambda builds
npm run watch:lambdas
# Auto-rebuilds on file changes
```

**Frontend calls local API:**
```typescript
// .env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**No deployment needed!** Just save and refresh.

#### Option 2: Hybrid (Frontend Local, Backend in AWS)

```bash
# Terminal 1: Run Next.js dev server
npm run dev

# Use deployed API Gateway
# .env.local
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

**When to use:**
- Testing with real data
- Testing integrations (S3, DynamoDB)
- Final validation before deployment

#### Option 3: Full Cloud (Like Current Amplify)

```bash
# Deploy everything to AWS
cdk deploy

# Access via CloudFront
https://yourdomain.com
```

**When to use:**
- Production testing
- Performance testing
- Final validation

### Local Lambda Testing

**Test individual Lambda functions:**

```bash
# Invoke Lambda locally with test event
sam local invoke ChatFunction -e events/chat-message.json

# Start API Gateway locally
sam local start-api

# Test with curl
curl -X POST http://localhost:3001/projects/delete \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"projectId": "test-project"}'
```

**Debug Lambda functions:**

```bash
# Run with debugger
sam local invoke ChatFunction -e events/test.json -d 5858

# Attach VSCode debugger to port 5858
# Set breakpoints in TypeScript code
# Step through execution
```

### Frontend Development

**No changes needed!**

```bash
# Same as now
npm run dev

# Hot reload works
# Fast refresh works
# All Next.js features work
```

**The difference:**
- API calls go to local Lambda (instant) instead of AWS (slow)
- No waiting for deployments
- No CloudWatch log hunting

### Testing Workflow Comparison

#### Current (Amplify)

```
Make change → Wait for sandbox deploy (5 min) → Test → Check CloudWatch → Repeat
Total: 10-15 minutes per iteration
```

#### After Migration

```
Make change → Save file → Refresh browser → Test → Check terminal logs → Repeat
Total: 5-10 seconds per iteration
```

**100x faster feedback loop!**

### Do You Need to Deploy?

**No, for most development:**
- Frontend changes: Just save and refresh
- Lambda changes: Auto-rebuild and restart (seconds)
- Quick iterations: All local

**Yes, for:**
- Testing with real AWS services (S3, DynamoDB)
- Performance testing
- Integration testing
- Final validation before production

**Deployment is fast:**
```bash
# Deploy only changed resources
cdk deploy
# Takes 2-5 minutes (vs 10-15 for Amplify)

# Deploy only frontend
npm run deploy:frontend
# Takes 30 seconds
```

### Cost Comparison

#### Current (Amplify Sandbox)

- **Every test** deploys to AWS
- **Every code change** triggers deployment
- **Costs money** for every iteration
- **Estimated:** $50-100/month for active development

#### After Migration

- **Local testing** is free
- **Only deploy** when ready
- **Costs money** only for deployed resources
- **Estimated:** $10-20/month for deployed stack

**Savings: $30-80/month**

### Developer Experience

#### Current Pain Points

1. **Slow iterations** - Wait for deployment
2. **Hard debugging** - CloudWatch logs are slow
3. **No offline work** - Need internet
4. **Expensive** - Every test costs money
5. **Frustrating** - Code changes don't deploy

#### After Migration

1. **Fast iterations** - Instant feedback
2. **Easy debugging** - Local logs in terminal
3. **Offline capable** - Work anywhere
4. **Cheap** - Local testing is free
5. **Reliable** - Changes always apply

### Setup for Local Development

**One-time setup:**

```bash
# 1. Install AWS SAM CLI
brew install aws-sam-cli

# 2. Configure local environment
cp .env.example .env.local

# 3. Start local stack
npm run dev:local
```

**That's it!** No sandbox, no waiting, no deployment.

### Summary

| Feature | Amplify Gen 2 | Pure CDK |
|---------|---------------|----------|
| Frontend hot reload | ✅ Yes | ✅ Yes |
| Lambda local testing | ❌ No | ✅ Yes |
| Deployment required | ✅ Always | ❌ Optional |
| Feedback loop | 5-10 min | 5-10 sec |
| Offline capable | ❌ No | ✅ Yes |
| Cost per test | $$ | Free |
| Debugging | CloudWatch | Terminal |
| Reliability | Low | High |

**Local testing is MUCH better without Amplify.**

## Decision

The choice is yours:

1. **Quick fix now, migrate later** - Fix resolver, deal with Amplify issues as they come
2. **Migrate now** - 4-6 weeks of work, eliminate Amplify permanently

Both are viable. The migration is worth it if you're tired of fighting Amplify.
