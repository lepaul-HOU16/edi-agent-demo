# Task 2: IAM Permissions Audit - Complete Analysis

## Lambda Function Details

**Function Name**: `EnergyInsights-development-chat`  
**Role ARN**: `arn:aws:iam::484907533441:role/EnergyInsights-developmen-ChatFunctionServiceRole74-RuTl81HzQbxF`  
**VPC Configuration**: Not in VPC (no subnets, security groups)

## Current IAM Permissions

### 1. Inline Policy: ChatFunctionServiceRoleDefaultPolicy5EC937D2

#### DynamoDB Permissions ✅
**Status**: COMPLETE - All necessary DynamoDB permissions granted

```json
{
  "Action": [
    "dynamodb:BatchGetItem",
    "dynamodb:BatchWriteItem",
    "dynamodb:ConditionCheckItem",
    "dynamodb:DeleteItem",
    "dynamodb:DescribeTable",
    "dynamodb:GetItem",
    "dynamodb:GetRecords",
    "dynamodb:GetShardIterator",
    "dynamodb:PutItem",
    "dynamodb:Query",
    "dynamodb:Scan",
    "dynamodb:UpdateItem"
  ],
  "Resource": [
    "arn:aws:dynamodb:us-east-1:484907533441:table/AgentProgress",
    "arn:aws:dynamodb:us-east-1:484907533441:table/ChatMessage-fhzj4la45fevdnax5s2o4hbuqy-NONE",
    "arn:aws:dynamodb:us-east-1:484907533441:table/ChatSession-fhzj4la45fevdnax5s2o4hbuqy-NONE",
    "arn:aws:dynamodb:us-east-1:484907533441:table/RenewableSessionContext"
  ]
}
```

#### S3 Permissions ✅
**Status**: COMPLETE - S3 access for artifacts

```json
{
  "Action": [
    "s3:DeleteObject",
    "s3:GetObject",
    "s3:ListBucket",
    "s3:PutObject"
  ],
  "Resource": [
    "arn:aws:s3:::amplify-digitalassistant--workshopstoragebucketd9b-mx1aevbdpmqy",
    "arn:aws:s3:::amplify-digitalassistant--workshopstoragebucketd9b-mx1aevbdpmqy/*"
  ]
}
```

#### Bedrock Permissions ✅
**Status**: COMPLETE - All Bedrock permissions granted

```json
{
  "Action": [
    "bedrock-agent-runtime:InvokeAgent",
    "bedrock:InvokeModel",
    "bedrock:InvokeModelWithResponseStream"
  ],
  "Resource": "*"
}
```

**Analysis**: 
- ✅ `bedrock-agent-runtime:InvokeAgent` - PRESENT
- ✅ `bedrock:InvokeModel` - PRESENT
- ✅ `bedrock:InvokeModelWithResponseStream` - PRESENT

#### Lambda Invocation Permissions ✅
**Status**: COMPLETE - Can invoke other Lambda functions

```json
{
  "Action": "lambda:InvokeFunction",
  "Resource": [
    "arn:aws:lambda:us-east-1:484907533441:function:EnergyInsights-development-petrophysics-calculator",
    "arn:aws:lambda:us-east-1:484907533441:function:EnergyInsights-development-renewable-orchestrator",
    "arn:aws:lambda:us-east-1:484907533441:function:EnergyInsights-development-petrophysics-calculator:*",
    "arn:aws:lambda:us-east-1:484907533441:function:EnergyInsights-development-renewable-orchestrator:*"
  ]
}
```

### 2. Managed Policy: AWSLambdaBasicExecutionRole ✅
**Status**: COMPLETE - CloudWatch Logs access

Provides:
- `logs:CreateLogGroup`
- `logs:CreateLogStream`
- `logs:PutLogEvents`

### 3. Managed Policy: AmazonBedrockFullAccess ✅
**Status**: COMPLETE - Full Bedrock access

Provides:
- `bedrock:*` - All Bedrock actions
- `bedrock-agent:*` - All Bedrock Agent actions (includes GetAgent)
- `bedrock-agent-runtime:*` - All Bedrock Agent Runtime actions
- VPC-related permissions: `ec2:DescribeVpcs`, `ec2:DescribeSubnets`, `ec2:DescribeSecurityGroups`
- IAM role listing: `iam:ListRoles`
- KMS key description: `kms:DescribeKey`

## Permission Analysis by Requirement

### Requirement 9.1: bedrock-agent-runtime:InvokeAgent ✅
**Status**: GRANTED (via both inline policy and AmazonBedrockFullAccess)

Found in:
1. Inline policy: Explicitly granted on all resources (`*`)
2. Managed policy: Granted via `bedrock-agent-runtime:*`

### Requirement 9.2: bedrock-agent:GetAgent ✅
**Status**: GRANTED (via AmazonBedrockFullAccess)

Found in:
- Managed policy: Granted via `bedrock:*` which includes all bedrock-agent actions

### Requirement 9.3: MCP-Related Permissions ⚠️
**Status**: PARTIALLY GRANTED - VPC permissions present, but Lambda not in VPC

VPC Permissions Available:
- ✅ `ec2:DescribeVpcs` - Can describe VPCs
- ✅ `ec2:DescribeSubnets` - Can describe subnets
- ✅ `ec2:DescribeSecurityGroups` - Can describe security groups

**Current VPC Configuration**: 
- Lambda is NOT in a VPC (empty SubnetIds, SecurityGroupIds)
- If MCP servers are in a VPC, Lambda cannot reach them
- If MCP servers are public, no VPC configuration needed

**Action Required**:
- Determine if MCP servers are deployed in VPC or publicly accessible
- If in VPC: Configure Lambda VPC settings (subnets, security groups)
- If public: No additional permissions needed

### Requirement 9.4: Additional Permissions Check ✅
**Status**: COMPLETE - All standard permissions present

Additional permissions granted:
- ✅ DynamoDB full access to required tables
- ✅ S3 access for artifact storage
- ✅ Lambda invocation for orchestrator and calculator
- ✅ CloudWatch Logs for monitoring

## Missing Permissions Analysis

### Critical Missing Permissions: NONE ✅

All required permissions for Bedrock Agent invocation are present:
1. ✅ `bedrock-agent-runtime:InvokeAgent` - Can invoke agents
2. ✅ `bedrock-agent:GetAgent` - Can retrieve agent details
3. ✅ `bedrock:InvokeModel` - Can invoke foundation models
4. ✅ `bedrock:InvokeModelWithResponseStream` - Can stream responses

### Potential Issues

#### 1. MCP Server Connectivity ⚠️
**Issue**: Lambda is not in a VPC

**Impact**: 
- If MCP servers are deployed in a VPC, Lambda cannot reach them
- If MCP servers require VPC connectivity, this will cause connection failures

**Resolution Options**:
1. **If MCP servers are public**: No action needed
2. **If MCP servers are in VPC**: 
   - Add Lambda to VPC via CDK configuration
   - Configure security groups to allow Lambda → MCP traffic
   - Ensure subnets have NAT gateway for internet access

#### 2. Secrets Manager Access ⚠️
**Issue**: No explicit Secrets Manager permissions

**Impact**:
- If credentials (RCON password, API keys) are stored in Secrets Manager
- Lambda cannot retrieve them

**Current Workaround**: 
- Credentials likely in environment variables (less secure)

**Recommended**: Add Secrets Manager permissions
```json
{
  "Action": [
    "secretsmanager:GetSecretValue"
  ],
  "Resource": "arn:aws:secretsmanager:us-east-1:484907533441:secret:*"
}
```

#### 3. SSM Parameter Store Access ⚠️
**Issue**: No SSM Parameter Store permissions

**Impact**:
- If configuration values stored in Parameter Store
- Lambda cannot retrieve them

**Recommended**: Add SSM permissions if needed
```json
{
  "Action": [
    "ssm:GetParameter",
    "ssm:GetParameters"
  ],
  "Resource": "arn:aws:ssm:us-east-1:484907533441:parameter/*"
}
```

## Summary

### ✅ Permissions Present (Complete)
1. ✅ `bedrock-agent-runtime:InvokeAgent` - Can invoke Bedrock Agents
2. ✅ `bedrock-agent:GetAgent` - Can retrieve agent metadata
3. ✅ `bedrock:InvokeModel` - Can invoke foundation models
4. ✅ `bedrock:InvokeModelWithResponseStream` - Can stream responses
5. ✅ DynamoDB access - Can read/write chat data
6. ✅ S3 access - Can store/retrieve artifacts
7. ✅ Lambda invocation - Can call orchestrator and calculator
8. ✅ CloudWatch Logs - Can write logs
9. ✅ VPC describe permissions - Can query VPC resources

### ⚠️ Potential Gaps (Non-Critical)
1. ⚠️ Lambda not in VPC - May prevent MCP server connectivity if servers are in VPC
2. ⚠️ No Secrets Manager access - Cannot retrieve secrets (if used)
3. ⚠️ No SSM Parameter Store access - Cannot retrieve parameters (if used)

### 🎯 Recommendations

#### Immediate Actions: NONE REQUIRED
All critical permissions for Bedrock Agent invocation are present.

#### Optional Enhancements:
1. **Add Secrets Manager permissions** - For secure credential storage
2. **Add SSM Parameter Store permissions** - For configuration management
3. **Configure VPC** - Only if MCP servers require VPC connectivity

## Next Steps

Based on this audit:

1. **Task 3: Discover MCP Servers** - Determine if MCP servers exist and how to reach them
2. **Task 4: Discover Bedrock Agents** - Verify which agents are deployed
3. **Task 7: Environment Variables** - Ensure agent IDs and credentials are set
4. **Task 9: Fix IAM Permissions** - Only if gaps found in Tasks 3-4

## Conclusion

**IAM permissions are COMPLETE for Bedrock Agent invocation.**

The Lambda function has all necessary permissions to:
- Invoke Bedrock Agents
- Retrieve agent metadata
- Stream responses
- Access DynamoDB, S3, and other AWS services

**No IAM permission fixes are required at this time.**

The issues preventing agents from working are likely:
1. Missing environment variables (agent IDs, credentials)
2. MCP servers not deployed or unreachable
3. Bedrock Agents not deployed
4. Implementation issues in agent handlers

These will be addressed in subsequent tasks.
