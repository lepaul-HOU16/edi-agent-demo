# Task 9: Lambda Deployment Instructions

## Current Status

✅ **Root Cause Confirmed**: All Lambda functions are missing from AWS
- This explains the "access issue" error users are experiencing
- The renewable energy backend has never been deployed

## Lambda Functions That Need Deployment

The following 7 Lambda functions need to be deployed:

1. ✅ `lightweightAgent` - Main conversational agent
2. ❌ `renewableOrchestrator` - Renewable energy orchestrator
3. ❌ `renewableTerrain` - Terrain analysis tool
4. ❌ `renewableLayout` - Layout optimization tool
5. ❌ `renewableSimulation` - Wind farm simulation tool
6. ❌ `renewableReport` - Report generation tool
7. ❌ `renewableAgentCoreProxy` - Python proxy for AgentCore

## Deployment Command

To deploy all Lambda functions, run:

```bash
npx ampx sandbox --stream-function-logs
```

## What This Command Does

1. **Builds all Lambda functions** from the `amplify/` directory
2. **Creates CloudFormation stacks** for all resources
3. **Deploys to AWS** in your account
4. **Streams logs** so you can monitor deployment progress
5. **Hot-reloads** on code changes (useful for development)

## Expected Deployment Time

- **Initial deployment**: 5-10 minutes
- **Subsequent deployments**: 2-5 minutes

## Monitoring Deployment

The command will output:
- ✅ Green checkmarks for successful deployments
- ❌ Red X marks for failures
- 📋 Resource ARNs and function names
- 📊 Deployment progress

## After Deployment

Once deployment completes, verify all functions exist:

```bash
node scripts/check-lambda-exists.js
```

Expected output:
```
✅ Existing Functions: 7/7
❌ Missing Functions: 0/7
```

## Troubleshooting

### If Deployment Fails

1. **Check AWS credentials**:
   ```bash
   aws sts get-caller-identity
   ```

2. **Check for TypeScript errors**:
   ```bash
   npx tsc --noEmit
   ```

3. **Check CloudFormation console** for detailed error messages

4. **Check deployment logs** in the terminal output

### Common Issues

- **Timeout errors**: Increase Lambda timeout in resource definitions
- **Memory errors**: Increase Lambda memory in resource definitions
- **Permission errors**: Check IAM policies in `amplify/backend.ts`
- **Python dependency errors**: Check `requirements.txt` files

## Next Steps After Deployment

1. ✅ Verify Lambda existence: `node scripts/check-lambda-exists.js`
2. ✅ Check environment variables: `node scripts/check-env-vars.js`
3. ✅ Test direct invocation: `node scripts/test-invoke-orchestrator.js`
4. ✅ Test end-to-end flow through UI

## Important Notes

- **Keep the terminal open** - The sandbox process must stay running
- **Don't interrupt deployment** - Let it complete fully
- **Watch for errors** - Address any deployment failures immediately
- **Verify all functions** - Ensure all 7 functions are deployed

## Deployment Started

Timestamp: ${new Date().toISOString()}

Status: **READY TO DEPLOY**

---

**Action Required**: Run `npx ampx sandbox --stream-function-logs` in your terminal to begin deployment.
