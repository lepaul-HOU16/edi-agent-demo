# Quick Start Guide

Get your new agent up and running in 30 minutes!

## Prerequisites

- [ ] AWS account with appropriate permissions
- [ ] Node.js 18.x or 20.x installed
- [ ] AWS CDK installed (`npm install -g aws-cdk`)
- [ ] Project cloned and dependencies installed
- [ ] Sandbox environment running (`npx ampx sandbox`)

## 30-Minute Quick Start

### Minute 0-5: Planning

**1. Define your agent's purpose (2 minutes)**

Answer these questions:
- What domain? _________________
- What queries? _________________
- What outputs? _________________

**2. Choose architecture (1 minute)**

- [ ] Simple Agent (no tools)
- [ ] Agent + Tool Lambda
- [ ] Orchestrator + Multiple Tools

**3. Create intent patterns (2 minutes)**

Write 3-5 regex patterns:
```
/pattern1/i
/pattern2/i
/pattern3/i
```

### Minute 5-15: Backend Implementation

**4. Create agent file (3 minutes)**

```bash
cd cdk/lambda-functions/chat/agents
cp weatherAgent.ts yourAgent.ts
# Edit yourAgent.ts - replace class name and logic
```

**5. Register with router (2 minutes)**

Edit `agentRouter.ts`:
```typescript
// Add import
import { YourAgent } from './yourAgent';

// Add to constructor
this.yourAgent = new YourAgent();

// Add patterns
if (this.matchesPatterns(message, yourPatterns)) {
  return 'your_agent';
}

// Add case
case 'your_agent':
  return await this.yourAgent.processMessage(message);
```

**6. Create tool Lambda (5 minutes) - OPTIONAL**

If you need a tool:
```bash
cd cdk/lambda-functions
mkdir your-tool
cd your-tool
# Copy template from templates/tool-template-python.py
```

### Minute 15-20: Infrastructure

**7. Configure CDK (5 minutes)**

Edit `cdk/lib/main-stack.ts`:
```typescript
// If you created a tool Lambda:
const yourToolFunction = new lambda.Function(this, 'YourToolFunction', {
  functionName: 'your-tool',
  runtime: lambda.Runtime.PYTHON_3_12,
  handler: 'handler.handler',
  code: lambda.Code.fromAsset(path.join(__dirname, '../lambda-functions/your-tool')),
  timeout: cdk.Duration.minutes(5),
  memorySize: 1024
});

storageBucket.grantReadWrite(yourToolFunction);
yourToolFunction.grantInvoke(chatFunction.function);
chatFunction.addEnvironment('YOUR_TOOL_FUNCTION_NAME', yourToolFunction.functionName);
```

### Minute 20-25: Frontend (OPTIONAL)

**8. Create artifact component (5 minutes)**

If your agent returns artifacts:
```bash
cd src/components/artifacts
cp TerrainMapArtifact.tsx YourArtifact.tsx
# Edit YourArtifact.tsx
```

Register in `ChatMessage.tsx`:
```typescript
case 'your_artifact_type':
  return <YourArtifact artifact={artifact} />;
```

### Minute 25-30: Deploy and Test

**9. Deploy (2 minutes)**

```bash
# Stop current sandbox (Ctrl+C)
npx ampx sandbox
# Wait for "Deployed" message
```

**10. Test (3 minutes)**

Open chat interface and test:
```
Your test query here
```

Verify:
- [ ] Response received
- [ ] No errors in console
- [ ] Artifacts render (if applicable)
- [ ] CloudWatch logs clean

## Done! 🎉

Your agent is now live and ready to use!

## What's Next?

### Immediate Next Steps

1. **Test edge cases**
   - Invalid inputs
   - Missing data
   - Error scenarios

2. **Add error handling**
   - Graceful degradation
   - Helpful error messages
   - Retry logic

3. **Improve intent detection**
   - Add more patterns
   - Test with real queries
   - Add exclusion patterns

### Short-term Improvements

1. **Add unit tests**
   ```bash
   cd cdk/lambda-functions/chat/agents/__tests__
   cp weatherAgent.test.ts yourAgent.test.ts
   ```

2. **Improve visualization**
   - Better styling
   - Export functionality
   - Responsive design

3. **Add documentation**
   - Usage examples
   - Configuration guide
   - Troubleshooting tips

### Long-term Enhancements

1. **Optimize performance**
   - Cache common queries
   - Reduce Lambda cold starts
   - Optimize artifact size

2. **Add advanced features**
   - Multi-step workflows
   - Context awareness
   - User preferences

3. **Monitor and iterate**
   - Track usage patterns
   - Gather user feedback
   - Improve based on data

## Troubleshooting Quick Fixes

### Agent not responding?

```bash
# Check CloudWatch logs
aws logs tail /aws/lambda/chat --follow

# Verify environment variables
aws lambda get-function-configuration --function-name chat --query "Environment.Variables"
```

### Artifacts not rendering?

```bash
# Check browser console (F12)
# Verify artifact type matches in:
# - Backend: agent response
# - Frontend: ChatMessage.tsx switch case
```

### Tool Lambda timeout?

```typescript
// Increase timeout in CDK
timeout: cdk.Duration.minutes(10), // Was 5
memorySize: 2048, // Was 1024
```

## Quick Reference Commands

```bash
# Start sandbox
npx ampx sandbox

# Run tests
npm test

# Build CDK
cd cdk && npm run build

# View logs
aws logs tail /aws/lambda/chat --follow

# Test Lambda directly
aws lambda invoke --function-name your-tool --payload '{"test":"data"}' response.json
```

## Quick Links

- [Full Integration Guide](./README.md)
- [Code Templates](./templates/)
- [Examples](./EXAMPLES.md)
- [Decision Tree](./DECISION-TREE.md)
- [Checklist](./INTEGRATION-CHECKLIST.md)

## Need Help?

1. Check [Troubleshooting Guide](./README.md#troubleshooting)
2. Review [Examples](./EXAMPLES.md)
3. Check CloudWatch logs
4. Verify configuration

---

**Remember:** Start simple, test often, iterate quickly!
