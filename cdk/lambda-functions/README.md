# Lambda Functions

This directory contains Lambda function code that will be deployed via CDK (replacing Amplify functions).

## Directory Structure

```
lambda-functions/
├── projects/           # Project management functions
│   ├── handler.ts     # Main handler for project operations
│   └── package.json   # Dependencies
├── chat/              # Chat and agent functions
│   ├── handler.ts     # Main handler for chat operations
│   └── package.json   # Dependencies
├── catalog/           # Catalog functions
│   ├── handler.ts     # Main handler for catalog operations
│   └── package.json   # Dependencies
├── shared/            # Shared utilities
│   ├── dynamodb.ts    # DynamoDB helpers
│   ├── s3.ts          # S3 helpers
│   └── types.ts       # Shared TypeScript types
└── README.md          # This file
```

## Build Process

Lambda functions are built using esbuild for fast TypeScript compilation and bundling.

### Build Commands

```bash
# Build all Lambda functions
npm run build:lambdas

# Build specific function
npm run build:lambda -- projects

# Watch mode for development
npm run watch:lambdas
```

### Build Configuration

- **Runtime**: Node.js 20.x
- **Bundler**: esbuild
- **Source Maps**: Enabled for debugging
- **Minification**: Enabled for production
- **External Modules**: AWS SDK v3 (provided by Lambda runtime)

## Function Standards

### Handler Signature

All Lambda functions use API Gateway HTTP API (v2) event format:

```typescript
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  // Handler logic
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ success: true }),
  };
};
```

### Error Handling

All functions should use consistent error handling:

```typescript
try {
  // Function logic
} catch (error) {
  console.error('Error:', error);
  return {
    statusCode: 500,
    body: JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      code: 'INTERNAL_ERROR',
    }),
  };
}
```

### Environment Variables

Access environment variables via `process.env`:

```typescript
const tableName = process.env.TABLE_NAME;
const bucketName = process.env.BUCKET_NAME;
```

### User Context

Extract user information from JWT claims:

```typescript
const authorizer = (event.requestContext as any).authorizer;
const userId = authorizer?.jwt?.claims?.sub;
const email = authorizer?.jwt?.claims?.email;
```

## Migration from Amplify

When migrating a function from `amplify/functions/`:

1. Copy handler code to appropriate directory in `cdk/lambda-functions/`
2. Update imports (remove Amplify-specific imports)
3. Change event type from AppSync to API Gateway HTTP API v2
4. Update environment variable access
5. Test locally with sample events
6. Deploy via CDK

### Event Format Changes

**Amplify AppSync Event**:
```typescript
{
  arguments: { projectId: "abc123" },
  identity: { sub: "user-id" }
}
```

**API Gateway HTTP API v2 Event**:
```typescript
{
  body: '{"projectId":"abc123"}',
  requestContext: {
    authorizer: {
      jwt: {
        claims: { sub: "user-id" }
      }
    }
  }
}
```

## Testing

### Local Testing

Use AWS SAM CLI for local testing:

```bash
# Invoke function locally
sam local invoke ProjectsFunction -e events/delete-project.json

# Start local API
sam local start-api
```

### Unit Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## Deployment

Functions are deployed via CDK:

```bash
# Deploy all functions
cd cdk
npx cdk deploy EnergyInsights-development
```

## Monitoring

- **CloudWatch Logs**: `/aws/lambda/EnergyInsights-development-<function-name>`
- **CloudWatch Metrics**: Lambda duration, errors, throttles
- **X-Ray Tracing**: Can be enabled per function

## Best Practices

1. **Keep functions small** - Single responsibility principle
2. **Use shared utilities** - DRY principle
3. **Handle errors gracefully** - Always return proper error responses
4. **Log appropriately** - Use structured logging
5. **Set timeouts** - Don't use default 3 seconds
6. **Optimize cold starts** - Minimize dependencies
7. **Use environment variables** - Don't hardcode configuration
8. **Test thoroughly** - Unit tests + integration tests

## Common Issues

### Issue: Module not found
**Solution**: Check that dependencies are in `package.json` and run `npm install`

### Issue: Timeout
**Solution**: Increase timeout in CDK construct (default 300s)

### Issue: Permission denied
**Solution**: Add IAM permissions in CDK construct

### Issue: Cold start slow
**Solution**: Reduce bundle size, use Lambda layers for large dependencies

## Resources

- [AWS Lambda Node.js Runtime](https://docs.aws.amazon.com/lambda/latest/dg/lambda-nodejs.html)
- [API Gateway HTTP API Event Format](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-develop-integrations-lambda.html)
- [esbuild Documentation](https://esbuild.github.io/)
- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)
