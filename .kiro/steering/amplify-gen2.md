# Amplify Gen 2 Project Guidelines

## Core Framework

This project uses **AWS Amplify Gen 2** (not Gen 1), which has significant architectural differences and specific patterns that must be followed.

## Key Characteristics

### 1. Code-First Configuration
- **No `amplify/backend/` folder structure** from Gen 1
- Backend defined in TypeScript using CDK constructs
- Main configuration in `amplify/backend.ts`
- Resources defined in `amplify/*/resource.ts` files

### 2. Backend Definition Pattern
```typescript
import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';

const backend = defineBackend({
  auth,
  data,
  storage,
  // Add custom resources here
});
```

### 3. Function Definition

#### Node.js Functions (Supported Natively)
```typescript
import { defineFunction } from '@aws-amplify/backend';

export const myFunction = defineFunction({
  name: 'myFunction',
  entry: './handler.ts',
  timeoutSeconds: 300,
  memoryMB: 512,
});
```

#### Python Functions (Requires CDK)
**IMPORTANT**: Amplify Gen 2's `defineFunction` does NOT support Python runtimes directly.

**Wrong Approach** (Will Fail):
```typescript
export const pythonFunction = defineFunction({
  runtime: 'python3.12',  // ❌ Error: Type 'string' is not assignable to type 'NodeVersion'
  entry: './handler.py',
});
```

**Correct Approach** (Use CDK Lambda Construct):
```typescript
import { defineFunction } from '@aws-amplify/backend';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const pythonFunction = defineFunction((scope: Construct) => {
  return new lambda.Function(scope, 'PythonFunction', {
    runtime: lambda.Runtime.PYTHON_3_12,
    handler: 'handler.handler',
    code: lambda.Code.fromAsset(__dirname),
    timeout: Duration.seconds(300),
    memorySize: 512,
  });
});
```

### 4. Data Layer (GraphQL)
- Schema defined in `amplify/data/resource.ts`
- Uses `a.schema()` builder pattern
- Custom queries/mutations defined inline
- Lambda resolvers attached via `.handler()` method

Example:
```typescript
import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  ChatMessage: a.model({
    content: a.json().required(),
    role: a.string().required(),
  }),
  
  invokeAgent: a.query()
    .arguments({ message: a.string().required() })
    .returns(a.json())
    .handler(a.handler.function(lightweightAgentFunction))
    .authorization(allow => [allow.authenticated()]),
});

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
```

### 5. IAM Permissions
Add permissions using CDK IAM constructs in `amplify/backend.ts`:

```typescript
import { aws_iam as iam } from 'aws-cdk-lib';

backend.myFunction.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    actions: ['s3:GetObject', 's3:PutObject'],
    resources: ['arn:aws:s3:::my-bucket/*'],
  })
);
```

### 6. Environment Variables
Add to Lambda functions:

```typescript
backend.myFunction.addEnvironment('MY_VAR', 'value');
```

Or in resource definition:
```typescript
export const myFunction = defineFunction({
  environment: {
    MY_VAR: process.env.MY_VAR || 'default',
  },
});
```

### 7. Custom CDK Constructs
Can be added in `amplify/custom/` directory:

```typescript
// amplify/custom/myConstruct.ts
import { Construct } from 'constructs';

export class MyConstruct extends Construct {
  constructor(scope: Construct, id: string, props: MyProps) {
    super(scope, id);
    // CDK resources here
  }
}

// amplify/backend.ts
import { MyConstruct } from './custom/myConstruct';

const backend = defineBackend({ /* ... */ });
const myConstruct = new MyConstruct(backend.stack, 'MyConstruct', {});
```

## Deployment

### Development (Sandbox)
```bash
npx ampx sandbox
```
- Creates temporary cloud environment
- Hot-reloads on code changes
- Streams function logs

### Production
```bash
npx ampx pipeline-deploy --branch main --app-id <app-id>
```

## Common Patterns

### 1. Accessing Other Resources
```typescript
// In backend.ts
backend.myFunction.addEnvironment(
  'BUCKET_NAME',
  backend.storage.resources.bucket.bucketName
);

backend.myFunction.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    actions: ['s3:GetObject'],
    resources: [
      backend.storage.resources.bucket.bucketArn,
      `${backend.storage.resources.bucket.bucketArn}/*`,
    ],
  })
);
```

### 2. Lambda-to-Lambda Invocation
```typescript
// Grant invoke permission
backend.callerFunction.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    actions: ['lambda:InvokeFunction'],
    resources: [backend.targetFunction.resources.lambda.functionArn],
  })
);

// Pass function name as environment variable
backend.callerFunction.addEnvironment(
  'TARGET_FUNCTION_NAME',
  backend.targetFunction.resources.lambda.functionName
);
```

### 3. Multiple Functions in Data Resource
```typescript
// amplify/data/resource.ts
import { defineFunction } from '@aws-amplify/backend';

export const function1 = defineFunction({ /* ... */ });
export const function2 = defineFunction({ /* ... */ });

export const data = defineData({
  schema: a.schema({
    query1: a.query().handler(a.handler.function(function1)),
    query2: a.query().handler(a.handler.function(function2)),
  }),
});

// amplify/backend.ts
import { data, function1, function2 } from './data/resource';

const backend = defineBackend({
  data,
  function1,
  function2,
});
```

## Important Differences from Gen 1

| Feature | Gen 1 | Gen 2 |
|---------|-------|-------|
| Configuration | JSON/YAML | TypeScript/CDK |
| CLI | `amplify` | `npx ampx` |
| Backend Definition | `amplify/backend/` folders | `amplify/backend.ts` |
| Functions | Separate `amplify add function` | `defineFunction()` in code |
| Python Support | Native | Requires CDK Lambda construct |
| Schema | GraphQL SDL files | TypeScript schema builder |
| Permissions | Auto-generated | Explicit IAM policies |
| Deployment | `amplify push` | `npx ampx sandbox` or pipeline |

## Anti-Patterns to Avoid

### ❌ Don't Use Gen 1 Patterns
```bash
# These don't work in Gen 2:
amplify add function
amplify add api
amplify push
```

### ❌ Don't Try to Use Python with defineFunction Directly
```typescript
// This will fail:
export const func = defineFunction({
  runtime: 'python3.12',  // ❌ Not supported
});
```

### ❌ Don't Forget to Register Resources
```typescript
// Resource defined but not registered:
export const myFunction = defineFunction({ /* ... */ });

// Must add to backend:
const backend = defineBackend({
  myFunction,  // ✅ Must include here
});
```

### ❌ Don't Mix Gen 1 and Gen 2
- Can't use Gen 1 CLI commands in Gen 2 project
- Can't use Gen 1 folder structure
- Must migrate fully to Gen 2 patterns

## Troubleshooting

### TypeScript Errors
```bash
# Check for type errors
npx tsc --noEmit

# Check diagnostics
npx ampx sandbox --help
```

### Function Not Deploying
1. Check it's registered in `defineBackend()`
2. Verify resource definition exports correctly
3. Check for TypeScript compilation errors

### Python Lambda Issues
1. Ensure using CDK Lambda construct (not `defineFunction` with runtime string)
2. Verify `handler.handler` matches Python file structure
3. Check `requirements.txt` exists if using dependencies
4. Use `lambda.Code.fromAsset(__dirname)` to include all files
5. **ES Module `__dirname` issue**: If you get `__dirname is not defined`, use:
   ```typescript
   import { fileURLToPath } from 'url';
   import { dirname } from 'path';
   const __filename = fileURLToPath(import.meta.url);
   const __dirname = dirname(__filename);
   ```

## Resources

- **Official Docs**: https://docs.amplify.aws/gen2/
- **Migration Guide**: https://docs.amplify.aws/gen2/start/migrate-from-gen1/
- **CDK Reference**: https://docs.aws.amazon.com/cdk/api/v2/

## Project-Specific Notes

### Current Setup
- **Framework**: Amplify Gen 2
- **Frontend**: Next.js 14 with App Router
- **Backend**: TypeScript Lambda functions + Python Lambda proxy
- **Database**: AppSync GraphQL with DynamoDB
- **Auth**: Cognito User Pools
- **Storage**: S3

### Custom Resources
- **MCP Server**: Custom CDK construct in `amplify/custom/mcpServer.ts`
- **Python Proxy**: CDK Lambda construct for bedrock-agentcore access

### Key Files
- `amplify/backend.ts` - Main backend configuration
- `amplify/data/resource.ts` - GraphQL schema and Lambda functions
- `amplify/auth/resource.ts` - Cognito configuration
- `amplify/storage/resource.ts` - S3 bucket configuration
- `amplify/functions/*/resource.ts` - Individual function definitions
