# Task 14 Quick Reference: Test Orchestrator Invocation Flow

## Quick Start

### Prerequisites
- Sandbox environment running: `npx ampx sandbox`
- AWS credentials configured
- Node.js and AWS SDK installed

### Run Test

```bash
# Option 1: Automated deployment and test
./scripts/deploy-and-test-orchestrator.sh

# Option 2: Manual test execution
export RENEWABLE_ORCHESTRATOR_FUNCTION_NAME=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'renewableOrchestrator')].FunctionName" --output text | head -1)
export RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'renewableTerrainTool')].FunctionName" --output text | head -1)
node scripts/test-orchestrator-invocation-flow.js
```

## What This Test Validates

| Test | Validates | Pass Criteria |
|------|-----------|---------------|
| **Deployment Check** | Lambda functions are deployed | Both orchestrator and terrain tool exist |
| **Orchestrator Invocation** | Orchestrator responds to queries | Successful invocation within timeout |
| **CloudWatch Logs - Orchestrator** | Orchestrator is actually invoked | Entry point log pattern found |
| **CloudWatch Logs - Terrain** | Terrain Lambda called by orchestrator | Invocation logs present |
| **Response Validation** | Unique project ID generated | Project ID ≠ "default-project" |

## Expected Results

### ✅ Success
```
📈 Overall: 5/5 tests passed
✅ ALL TESTS PASSED
🆔 Project ID: terrain-1704710400000-abc123
```

### ❌ Failure Scenarios

#### Orchestrator Not Deployed
```
❌ Deployment check failed
Error: ResourceNotFoundException
```
**Fix**: Ensure sandbox is running and deployment is complete

#### Orchestrator Bypassed
```
❌ Orchestrator entry point NOT found in logs
```
**Fix**: Check RenewableProxyAgent validation logic

#### Default Project ID
```
❌ Project ID is "default-project"
```
**Fix**: Check orchestrator project ID generation logic

## CloudWatch Log Patterns

The test searches for these patterns to confirm orchestrator flow:

1. `ORCHESTRATOR ENTRY POINT` - Orchestrator received request
2. `INTENT DETECTION RESULTS` - Intent routing worked
3. `TOOL LAMBDA INVOCATION` - Terrain Lambda called
4. `TOOL LAMBDA RESPONSE` - Terrain Lambda responded
5. `PROJECT ID GENERATION` - Unique ID created
6. `FINAL RESPONSE STRUCTURE` - Response formatted

## Troubleshooting Commands

```bash
# Check orchestrator logs
aws logs tail /aws/lambda/$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'renewableOrchestrator')].FunctionName" --output text | head -1) --follow

# Check terrain tool logs
aws logs tail /aws/lambda/$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'renewableTerrainTool')].FunctionName" --output text | head -1) --follow

# Test orchestrator directly
aws lambda invoke \
  --function-name $(aws lambda list-functions --query "Functions[?contains(FunctionName, 'renewableOrchestrator')].FunctionName" --output text | head -1) \
  --payload '{"query":"Analyze terrain at 35.067482, -101.395466","userId":"test","sessionId":"test"}' \
  response.json && cat response.json | jq
```

## Files Created

| File | Purpose |
|------|---------|
| `scripts/test-orchestrator-invocation-flow.js` | Main test script |
| `scripts/deploy-and-test-orchestrator.sh` | Deployment wrapper |
| `docs/ORCHESTRATOR_INVOCATION_FLOW_TEST.md` | Detailed documentation |
| `docs/TASK14_QUICK_REFERENCE.md` | This quick reference |

## Next Steps After Success

1. ✅ Mark task 14 as complete
2. 🔄 Proceed to task 15: Test feature count restoration
3. 📊 Review CloudWatch logs for performance metrics
4. 🎨 Test through UI for end-to-end validation

## Requirements Validated

- ✅ **Requirement 1.1**: Verify RenewableProxyAgent invokes orchestrator
- ✅ **Requirement 1.2**: Confirm orchestrator appears in CloudWatch logs
- ✅ **Requirement 1.3**: Verify orchestrator calls terrain Lambda
- ✅ **Requirement 2.1**: Unique project ID generated
- ✅ **Requirement 2.2**: Project ID passed to terrain Lambda
- ✅ **Requirement 2.3**: Project ID in response (not "default-project")

## Integration Points

This test validates the complete flow:

```
User Query
    ↓
lightweightAgent
    ↓
AgentRouter
    ↓
RenewableProxyAgent
    ↓
[VALIDATION] ← Task 3
    ↓
[RETRY LOGIC] ← Task 4
    ↓
renewableOrchestrator ← Task 1 (Health Check)
    ↓
[INTENT DETECTION] ← Task 6
    ↓
[PROJECT ID GEN] ← Task 7
    ↓
renewableTerrainTool ← Task 8
    ↓
[RESPONSE VALIDATION] ← Task 9
    ↓
Response with Unique Project ID
```

## Manual UI Test

After automated tests pass:

1. Open chat interface
2. Send query: "Analyze terrain for wind farm at 35.067482, -101.395466 with 5km radius"
3. Verify:
   - Loading indicator appears
   - Loading indicator disappears when complete
   - Terrain map artifact renders
   - Project ID is unique (check browser console)
   - No page reload needed

## Success Metrics

- **Invocation Time**: < 5 seconds
- **Log Propagation**: < 10 seconds
- **Project ID Format**: `terrain-{timestamp}-{random}` or `project-{timestamp}`
- **Artifact Count**: ≥ 1
- **Thought Steps**: ≥ 3

## Contact

For issues or questions:
- Review full documentation: `docs/ORCHESTRATOR_INVOCATION_FLOW_TEST.md`
- Check CloudWatch logs for detailed error messages
- Verify all previous tasks (1-13) are complete
