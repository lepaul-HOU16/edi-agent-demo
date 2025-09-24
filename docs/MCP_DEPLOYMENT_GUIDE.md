# MCP Server Deployment Guide

## Overview

This guide explains how to deploy the cloud-native MCP server with petrophysical analysis capabilities to AWS Amplify.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Kiro IDE (Local)                            │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  Chat Interface │  │  MCP Client     │  │  Agent System   │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                    AWS Cloud Infrastructure                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  API Gateway    │  │  Lambda MCP     │  │  S3 Well Data   │  │
│  │  (with API Key) │  │  Server         │  │  Storage        │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Components

### 1. Lambda MCP Server (`amplify/functions/mcpAwsTools/index.ts`)
- **Purpose**: Cloud-native MCP server running in AWS Lambda
- **Features**: 
  - Petrophysical calculation tools
  - S3 integration for LAS file access
  - API Gateway endpoint with authentication
  - Auto-scaling and serverless architecture

### 2. Petrophysical Tools (`amplify/functions/tools/petrophysicsTools.ts`)
- **Tools Available**:
  - `list_wells` - List all wells from S3
  - `get_well_info` - Get well header information
  - `get_curve_data` - Retrieve curve data with depth filtering
  - `calculate_porosity` - Density, neutron, effective porosity
  - `calculate_shale_volume` - Larionov, Clavier, linear methods
  - `calculate_saturation` - Archie equation calculations
  - `assess_data_quality` - Comprehensive quality assessment
  - `perform_uncertainty_analysis` - Monte Carlo uncertainty analysis

### 3. S3 Integration
- **Bucket**: `amplify-d1eeg2gu6ddc3z-ma-workshopstoragebucketd9b-lzf4vwokty7m`
- **Path**: `global/well-data/*.las`
- **Permissions**: Read-only access for MCP server Lambda function

## Deployment Steps

### Step 1: Deploy Backend Infrastructure

```bash
# Deploy the Amplify backend with MCP server
npx amplify push

# This will create:
# - Lambda function for MCP server
# - API Gateway with API key authentication
# - IAM roles and policies for S3 access
```

### Step 2: Get API Gateway URL and API Key

After deployment, get the API Gateway URL and API key:

```bash
# Get the API Gateway URL from Amplify console or CloudFormation outputs
# Format: https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod/mcp

# Get the API key from AWS Console > API Gateway > API Keys
```

### Step 3: Configure Kiro MCP Settings

Update `.kiro/settings/mcp.json` with the deployed endpoint:

```json
{
  "mcpServers": {
    "petrophysical-analysis": {
      "command": "curl",
      "args": [
        "-X", "POST",
        "-H", "Content-Type: application/json",
        "-H", "x-api-key: YOUR_ACTUAL_API_KEY",
        "https://your-actual-api-gateway-url.amazonaws.com/prod/mcp"
      ],
      "env": {},
      "disabled": false,
      "autoApprove": [
        "list_wells",
        "get_well_info",
        "get_curve_data",
        "calculate_porosity",
        "calculate_shale_volume",
        "calculate_saturation",
        "assess_data_quality",
        "perform_uncertainty_analysis"
      ]
    }
  }
}
```

### Step 4: Test MCP Server Connection

Test the connection from Kiro:

1. Open Kiro IDE
2. Create a new chat session
3. Try MCP commands:
   ```
   List all available wells
   Get well information for SANDSTONE_RESERVOIR_001
   Calculate density porosity for SANDSTONE_RESERVOIR_001
   ```

## Environment Variables

The Lambda MCP server uses these environment variables:

```typescript
// Set automatically by deployment
S3_BUCKET=amplify-d1eeg2gu6ddc3z-ma-workshopstoragebucketd9b-lzf4vwokty7m
AWS_REGION=us-east-1

// Available in Lambda runtime
AGENT_MODEL_ID=us.anthropic.claude-3-5-haiku-20241022-v1:0
TEXT_TO_TABLE_MODEL_ID=anthropic.claude-3-haiku-20240307-v1:0
```

## Security

### API Key Authentication
- API Gateway requires `x-api-key` header
- API key is managed through AWS API Gateway console
- Usage plans control rate limiting and quotas

### IAM Permissions
- Lambda execution role has minimal S3 permissions:
  - `s3:ListBucket` on the well data bucket
  - `s3:GetObject` on well data objects
- No write permissions to maintain data integrity

### Network Security
- HTTPS-only communication
- API Gateway handles SSL termination
- Lambda runs in AWS VPC with security groups

## Monitoring and Logging

### CloudWatch Logs
- Lambda function logs available in CloudWatch
- Log groups: `/aws/lambda/[function-name]`
- Includes MCP tool execution logs and errors

### API Gateway Metrics
- Request count and latency metrics
- Error rates and throttling statistics
- Available in CloudWatch dashboard

### Cost Monitoring
- Lambda execution time and memory usage
- API Gateway request charges
- S3 data transfer costs

## Troubleshooting

### Common Issues

1. **API Key Authentication Failure**
   ```
   Error: 403 Forbidden
   Solution: Verify API key is correct in MCP configuration
   ```

2. **S3 Access Denied**
   ```
   Error: Access Denied when reading LAS files
   Solution: Check IAM permissions for Lambda execution role
   ```

3. **Lambda Timeout**
   ```
   Error: Task timed out after 15.00 seconds
   Solution: Optimize calculation algorithms or increase timeout
   ```

4. **MCP Tool Not Found**
   ```
   Error: Tool 'calculate_porosity' not found
   Solution: Verify tool registration in mcpAwsTools/index.ts
   ```

### Debug Steps

1. **Check Lambda Logs**
   ```bash
   aws logs tail /aws/lambda/[function-name] --follow
   ```

2. **Test API Gateway Directly**
   ```bash
   curl -X POST \
     -H "Content-Type: application/json" \
     -H "x-api-key: YOUR_API_KEY" \
     -d '{"jsonrpc":"2.0","id":"1","method":"tools/list"}' \
     https://your-api-gateway-url.amazonaws.com/prod/mcp
   ```

3. **Verify S3 Access**
   ```bash
   aws s3 ls s3://amplify-d1eeg2gu6ddc3z-ma-workshopstoragebucketd9b-lzf4vwokty7m/global/well-data/
   ```

## Performance Optimization

### Lambda Configuration
- **Memory**: 1024 MB (adjustable based on calculation complexity)
- **Timeout**: 15 minutes (maximum for API Gateway)
- **Concurrent Executions**: 1000 (default AWS limit)

### Caching Strategy
- Implement result caching for expensive calculations
- Use Lambda environment variables for configuration caching
- Consider ElastiCache for shared caching across invocations

### S3 Optimization
- Use S3 Transfer Acceleration for large files
- Implement parallel downloads for multiple wells
- Consider S3 Select for partial data retrieval

## Scaling Considerations

### Auto Scaling
- Lambda automatically scales based on request volume
- API Gateway handles traffic spikes transparently
- No infrastructure management required

### Cost Optimization
- Pay-per-request pricing model
- No idle costs when not in use
- Optimize memory allocation based on actual usage

### Regional Deployment
- Deploy in multiple regions for global access
- Use CloudFront for API Gateway caching
- Consider data locality for S3 buckets

## Migration from Local MCP Server

### Development Workflow
1. **Local Development**: Use Python MCP server (`mcp-well-data-server.py`)
2. **Testing**: Deploy to Amplify sandbox for integration testing
3. **Production**: Use cloud-native Lambda MCP server

### Configuration Management
- Maintain separate MCP configurations for local vs cloud
- Use environment-specific settings
- Implement feature flags for gradual migration

## Future Enhancements

### Planned Features
- Real-time calculation streaming
- Multi-well batch processing
- Advanced visualization endpoints
- Machine learning integration

### Integration Opportunities
- Connect to external petrophysical databases
- Integrate with geological modeling software
- Add support for additional file formats (DLIS, XML)

## Support and Maintenance

### Regular Tasks
- Monitor API Gateway usage and costs
- Update Lambda function dependencies
- Review and rotate API keys
- Backup calculation results

### Version Management
- Use Amplify environment branches for staging
- Implement blue-green deployments
- Maintain backward compatibility for MCP tools

---

**Note**: This deployment creates a production-ready, scalable MCP server that integrates seamlessly with Kiro IDE while maintaining the same S3 data access as the Strands agent.