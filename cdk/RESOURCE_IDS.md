# AWS Resource IDs

This document tracks the IDs of existing AWS resources that are imported into the CDK stack.

## Cognito

### User Pool
- **ID**: `us-east-1_sC6yswGji`
- **Region**: `us-east-1`
- **Source**: Amplify Gen 2 deployment
- **Status**: ✅ Verified and imported in CDK

### User Pool Client
- **ID**: `18m99t0u39vi9614ssd8sf8vmb`
- **Source**: Amplify Gen 2 deployment
- **Status**: ✅ Verified and imported in CDK

### Identity Pool
- **ID**: `us-east-1:9deb181a-83d2-4e1d-bb7a-f4f2d418bbae`
- **Source**: Amplify Gen 2 deployment
- **Status**: ⏳ Not yet imported (not needed for REST API)

## DynamoDB Tables

### ChatMessage Table
- **Name**: `ChatMessage-fhzj4la45fevdnax5s2o4hbuqy-NONE`
- **Source**: Amplify Gen 2 deployment
- **Status**: ✅ Verified and imported in CDK
- **Item Count**: 5,399 messages
- **Size**: 20.6 MB

### Project Table
- **Name**: `Project-fhzj4la45fevdnax5s2o4hbuqy-NONE`
- **Source**: Amplify Gen 2 deployment
- **Status**: ✅ Verified and imported in CDK
- **Item Count**: 3 projects
- **Size**: 2 KB

### ChatSession Table
- **Name**: `ChatSession-fhzj4la45fevdnax5s2o4hbuqy-NONE`
- **Source**: Amplify Gen 2 deployment
- **Status**: ✅ Verified and imported in CDK
- **Item Count**: 393 sessions
- **Size**: 93 KB

### RenewableSessionContext Table
- **Name**: `RenewableSessionContext`
- **Source**: Amplify Gen 2 deployment
- **Status**: ✅ Verified and imported in CDK
- **Item Count**: 8 contexts
- **Size**: 1 KB

### AgentProgress Table
- **Name**: `AgentProgress`
- **Source**: Amplify Gen 2 deployment
- **Status**: ✅ Verified and imported in CDK
- **Item Count**: 3 progress records
- **Size**: 3 KB

## S3 Buckets

### Storage Bucket
- **Name**: `amplify-digitalassistant--workshopstoragebucketd9b-mx1aevbdpmqy`
- **Region**: `us-east-1`
- **Source**: Amplify Gen 2 deployment
- **Status**: ✅ Verified and imported in CDK
- **Contents**: Chat artifacts, renewable energy data, layers, test data

## How to Update

When importing resources, update this document with:
1. The exact resource ID/name
2. Verification status (✅ verified, ⏳ pending, ❌ failed)
3. Any notes about the resource

## Verification Commands

```bash
# Verify Cognito User Pool
aws cognito-idp describe-user-pool --user-pool-id us-east-1_sC6yswGji

# Verify DynamoDB tables
aws dynamodb describe-table --table-name ChatMessage-fhzj4la45fevdnax5s2o4hbuqy-NONE

# Verify S3 bucket
aws s3 ls s3://amplify-digitalassistant--workshopstoragebucketd9b-mx1aevbdpmqy

# Test Cognito import via Lambda
aws lambda invoke --function-name EnergyInsights-development-verify-cognito response.json
cat response.json
```

## Notes

- All resource IDs are from the current Amplify Gen 2 deployment
- These resources will continue to be used by both Amplify and CDK stacks during migration
- Do NOT delete these resources until Amplify is fully decommissioned
- Resource names may change if Amplify is redeployed
