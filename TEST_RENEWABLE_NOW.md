# Test Renewable NOW

## Deployment Complete ✅
- Orchestrator function name added to lightweight agent
- AgentRouter has renewable patterns
- All Lambda functions deployed

## Test Query
```
Analyze terrain for wind farm at 40.7128, -74.0060
```

## Expected Flow
1. User query → GraphQL → lightweightAgent Lambda
2. lightweightAgent → AgentRouter
3. AgentRouter detects "terrain.*analysis" pattern
4. Routes to RenewableProxyAgent
5. RenewableProxyAgent calls renewableOrchestrator
6. renewableOrchestrator calls terrain tool
7. Returns 1000 features

## If Still Getting Access Error

Check browser console for actual error message. The issue might be:

1. **Frontend not reloaded**: Restart dev server
   ```bash
   # Kill existing server
   # Restart
   npm run dev
   ```

2. **Environment variable**: Check `.env.local` has:
   ```
   NEXT_PUBLIC_RENEWABLE_ENABLED=true
   ```

3. **Lambda not updated**: Verify deployment
   ```bash
   aws lambda get-function --function-name amplify-digitalassistant--lightweightAgentlambda3D-YHBgjx1rRMbY --query 'Configuration.Environment.Variables.RENEWABLE_ORCHESTRATOR_FUNCTION_NAME'
   ```

## Quick Test
```bash
# Test orchestrator directly
node scripts/test-renewable-invoke.js
```

Should return 1000 features for NYC coordinates.
