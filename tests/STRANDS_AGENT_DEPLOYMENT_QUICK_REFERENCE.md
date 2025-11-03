# Strands Agent Deployment - Quick Reference

## Task 1 Status: ✅ COMPLETE

The Strands Agent Lambda is fully deployed and operational.

## Quick Verification

```bash
# Run the verification script
node tests/verify-strands-agent-deployment.js
```

Expected output: `🎉 SUCCESS: Task 1 Complete!`

## Lambda Details

| Property | Value |
|----------|-------|
| **Function Name** | `amplify-digitalassistant--RenewableAgentsFunction0-6JliJjYdH7pm` |
| **Type** | Docker Image |
| **Memory** | 3008 MB |
| **Timeout** | 15 minutes |
| **Model** | Claude 3.7 Sonnet |

## Key Environment Variables

```bash
BEDROCK_MODEL_ID=us.anthropic.claude-3-7-sonnet-20250219-v1:0
RENEWABLE_S3_BUCKET=amplify-digitalassistant--workshopstoragebucketd9b-mx1aevbdpmqy
AGENT_PROGRESS_TABLE=AgentProgress
```

## Permissions Granted

✅ Bedrock model invocation  
✅ S3 artifact storage  
✅ DynamoDB progress tracking  
✅ CloudWatch metrics  
✅ Orchestrator can invoke agent  

## Quick Commands

**Get function info:**
```bash
aws lambda get-function-configuration \
  --function-name amplify-digitalassistant--RenewableAgentsFunction0-6JliJjYdH7pm
```

**Check logs:**
```bash
aws logs tail /aws/lambda/amplify-digitalassistant--RenewableAgentsFunction0-6JliJjYdH7pm --follow
```

**Test invocation:**
```bash
aws lambda invoke \
  --function-name amplify-digitalassistant--RenewableAgentsFunction0-6JliJjYdH7pm \
  --payload '{"test": true}' \
  response.json
```

## Next Tasks

- [ ] Task 2: Test cold start performance
- [ ] Task 3: Implement lazy loading if needed
- [ ] Task 4: Add provisioned concurrency if needed
- [ ] Task 5: Verify intelligent algorithm selection
- [ ] Task 6: Test multi-agent orchestration

## Troubleshooting

**If Lambda not found:**
```bash
# List all renewable functions
aws lambda list-functions --query "Functions[?contains(FunctionName, 'Renewable')].FunctionName"
```

**If permissions missing:**
```bash
# Check IAM role
aws lambda get-function --function-name <function-name> --query 'Configuration.Role'

# List role policies
aws iam list-role-policies --role-name <role-name>
```

**If environment variables missing:**
```bash
# Check all environment variables
aws lambda get-function-configuration \
  --function-name <function-name> \
  --query 'Environment.Variables' \
  --output json
```

## Documentation

- Full details: `tests/TASK_1_STRANDS_AGENT_DEPLOYMENT_COMPLETE.md`
- Verification script: `tests/verify-strands-agent-deployment.js`
- Backend config: `amplify/backend.ts` (line 44)
- Resource definition: `amplify/functions/renewableAgents/resource.ts`

## Status Summary

```
✅ Lambda Deployment
✅ Environment Variables  
✅ IAM Permissions
✅ Orchestrator Integration

🎉 Task 1: COMPLETE
```
