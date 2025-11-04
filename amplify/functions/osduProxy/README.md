# OSDU Proxy Lambda Function

## Overview

This Lambda function acts as a secure proxy for OSDU Search API requests. It keeps the OSDU API key on the backend and never exposes it to the frontend.

## Security Architecture

- **API Key Storage**: Stored in Lambda environment variables only
- **Frontend Access**: None - frontend calls this Lambda via GraphQL
- **Error Handling**: Sanitizes all error messages to prevent key exposure
- **Logging**: Never logs the API key

## Configuration

### Environment Variables

| Variable | Description | Set In | Required |
|----------|-------------|--------|----------|
| `OSDU_API_URL` | OSDU Search API endpoint | `resource.ts` (hardcoded) | Yes |
| `OSDU_API_KEY` | OSDU API authentication key | Lambda environment | Yes |

### Setting the API Key

**For Local Development:**
```bash
# Add to .env.local (gitignored)
OSDU_API_KEY=your-api-key-here
```

**For Production:**
```bash
# Get Lambda function name
OSDU_LAMBDA=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'osduProxy')].FunctionName" --output text)

# Set API key
aws lambda update-function-configuration \
  --function-name "$OSDU_LAMBDA" \
  --environment Variables={OSDU_API_KEY=your-api-key-here}
```

## API

### Input (GraphQL Arguments)

```typescript
{
  query: string;           // Natural language search query
  dataPartition?: string;  // OSDU data partition (default: "osdu")
  maxResults?: number;     // Maximum results to return (default: 10)
}
```

### Output

```typescript
{
  answer: string;          // AI-generated natural language response
  recordCount: number;     // Total number of records found
  records: Array<{         // Array of OSDU records
    id?: string;
    name?: string;
    type?: string;
    [key: string]: any;
  }>;
}
```

### Error Response

```typescript
{
  error: string;           // Sanitized error message
  answer: string;          // User-friendly error message
  recordCount: 0;
  records: [];
}
```

## Testing

### Local Testing

```bash
# Run integration test
node tests/test-osdu-catalog-integration.js
```

### Manual Testing

```bash
# Invoke Lambda directly
aws lambda invoke \
  --function-name <osduProxy-function-name> \
  --payload '{"arguments":{"query":"wells in Permian Basin","dataPartition":"osdu","maxResults":10}}' \
  response.json

# View response
cat response.json
```

## Monitoring

### CloudWatch Logs

```bash
# Tail logs
aws logs tail /aws/lambda/<osduProxy-function-name> --follow

# Search for errors
aws logs filter-log-events \
  --log-group-name /aws/lambda/<osduProxy-function-name> \
  --filter-pattern "ERROR"
```

### Metrics

- **Invocations**: Number of times Lambda is called
- **Errors**: Number of failed invocations
- **Duration**: Execution time per invocation
- **Throttles**: Number of throttled requests

## Troubleshooting

### "OSDU API is not configured"

**Cause**: API key not set in Lambda environment

**Solution**: Set `OSDU_API_KEY` environment variable (see Configuration above)

### "OSDU API request failed: 401"

**Cause**: Invalid or expired API key

**Solution**: Update API key in Lambda environment

### "OSDU API request failed: 403"

**Cause**: API key doesn't have permission for requested operation

**Solution**: Contact OSDU platform administrator to grant permissions

### "Network error occurred"

**Cause**: Cannot reach OSDU API endpoint

**Solution**: 
1. Verify `OSDU_API_URL` is correct
2. Check network connectivity
3. Verify OSDU API is operational

## Security Checklist

- [ ] API key stored in Lambda environment variables only
- [ ] API key never logged in CloudWatch
- [ ] API key never exposed in error messages
- [ ] API key never committed to version control
- [ ] Error messages sanitized (see handler.ts)
- [ ] HTTPS used for all API calls
- [ ] Request timeout set (30 seconds)

## Deployment

This function is automatically deployed when you run:

```bash
# Development
npx ampx sandbox

# Production
npx ampx pipeline-deploy --branch main --app-id <your-app-id>
```

After deployment, remember to set the API key in the Lambda environment.

## Files

- `resource.ts` - Lambda function definition and configuration
- `handler.ts` - Request handler and OSDU API integration logic
- `README.md` - This file

## References

- [OSDU API Documentation](https://community.opengroup.org/osdu/platform)
- [Amplify Gen 2 Functions](https://docs.amplify.aws/gen2/build-a-backend/functions/)
- [AWS Lambda Environment Variables](https://docs.aws.amazon.com/lambda/latest/dg/configuration-envvars.html)
