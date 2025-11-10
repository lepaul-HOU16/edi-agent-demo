# Quick Start Guide - AWS Energy Data Insights Platform

**For teams taking over this project - Read this first!**

---

## 🚀 Get Running in 15 Minutes

### 1. Prerequisites
```bash
# Install Node.js 20.x
node --version  # Should be v20.x

# Install AWS CLI
aws --version

# Configure AWS credentials
aws configure
```

### 2. Clone & Install
```bash
git clone <repository-url>
cd digital-assistant
npm install
```

### 3. Configure Environment
```bash
cp .env.local.example .env.local
# Edit .env.local with your AWS account details
```

### 4. Start Development
```bash
# Terminal 1: Start backend
npx ampx sandbox

# Terminal 2: Start frontend (after sandbox is ready)
npm run dev

# Open browser: http://localhost:3000
```

### 5. Test It Works
```
Sign in → Type "list wells" → Should see well list
```

---

## 📚 Full Documentation

See **[INSTALLATION_AND_ARCHITECTURE.md](./INSTALLATION_AND_ARCHITECTURE.md)** for:
- Complete architecture diagrams
- Detailed installation steps
- How to add new agents (step-by-step with code examples)
- Current agent implementations
- Known issues & workarounds
- Testing strategy
- Deployment guide
- Troubleshooting

---

## 🎯 What This Platform Does

**Multi-agent AI platform for energy data analysis:**

✅ **Working:**
- Petrophysical analysis (porosity, shale, saturation)
- Well data discovery & correlation
- Professional Cloudscape visualizations
- Chain of thought transparency
- OSDU search integration

⚠️ **In Progress:**
- EDIcraft (Minecraft visualization)
- Renewable energy agents
- Collection system

❌ **Known Broken:**
- Some renewable visualizations
- EDIcraft horizon interpolation
- MCP server cold starts (2-3 min)

---

## 🏗️ Architecture Overview

```
Frontend (Next.js) 
    ↓ GraphQL
Backend (Amplify Gen 2)
    ↓
Agent Router (enhancedStrandsAgent)
    ↓
Specialized Agents:
    - Petrophysics Agent ✅
    - Maintenance Agent ✅
    - EDIcraft Agent ⚠️
    - Renewable Agents ⚠️
    ↓
Tool Layer (MCP Tools)
    ↓
Data Sources (S3, DynamoDB, OSDU, Minecraft)
```

---

## 🔧 Adding a New Agent (Quick Version)

### 1. Create Handler
```typescript
// amplify/functions/myAgent/handler.ts
export const handler = async (event, context) => {
  const agent = new MyAgent();
  return await agent.processMessage(event.arguments.message);
};
```

### 2. Create Agent Logic
```typescript
// amplify/functions/myAgent/myAgent.ts
import { BaseEnhancedAgent } from '../agents/BaseEnhancedAgent';

export class MyAgent extends BaseEnhancedAgent {
  async processMessage(message: string) {
    // Add thought steps for transparency
    const step = this.addThoughtStep(
      'intent_detection',
      'Analyzing Request',
      'Understanding what user wants'
    );
    
    // Do work...
    const result = await this.doWork(message);
    
    // Complete thought step
    this.completeThoughtStep(step.id);
    
    // Return response
    return {
      success: true,
      message: 'Done!',
      artifacts: [],
      thoughtSteps: this.getThoughtSteps()
    };
  }
}
```

### 3. Register in Backend
```typescript
// amplify/backend.ts
import { myAgentFunction } from './functions/myAgent/resource';

const backend = defineBackend({
  // ... other functions
  myAgentFunction,
});

// Add permissions
backend.myAgentFunction.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    actions: ['s3:GetObject', 's3:PutObject'],
    resources: [`${backend.storage.resources.bucket.bucketArn}/*`]
  })
);
```

### 4. Add GraphQL Mutation
```typescript
// amplify/data/resource.ts
invokeMyAgent: a.mutation()
  .arguments({
    chatSessionId: a.id().required(),
    message: a.string().required(),
  })
  .returns(a.customType({
    success: a.boolean().required(),
    message: a.string().required(),
    artifacts: a.json().array(),
    thoughtSteps: a.json().array()
  }))
  .handler(a.handler.function(myAgentFunction))
  .authorization((allow) => [allow.authenticated()]),
```

### 5. Test
```bash
# Restart sandbox
npx ampx sandbox

# Test Lambda
node tests/test-my-agent.js

# Test in browser
npm run dev
```

**Full details with code examples:** See INSTALLATION_AND_ARCHITECTURE.md → "Agent Integration Pattern"

---

## ⚠️ Critical Rules

### ALWAYS:
1. ✅ Extend `BaseEnhancedAgent` for all agents
2. ✅ Add thought steps for transparency
3. ✅ Restart sandbox after backend changes
4. ✅ Test before committing
5. ✅ Verify environment variables after deployment

### NEVER:
1. ❌ Change working code without testing
2. ❌ Skip sandbox restart after backend changes
3. ❌ Assume environment variables updated without restart
4. ❌ Deploy without testing
5. ❌ Break working features (run regression tests!)

---

## 🐛 Common Issues

### Issue: Lambda not found
```bash
# Solution: Restart sandbox
npx ampx sandbox
```

### Issue: Environment variables not updating
```bash
# Solution: Stop and restart sandbox
Ctrl+C
npx ampx sandbox
```

### Issue: Artifacts not rendering
```typescript
// Solution: Check artifact type is registered in ChatMessage.tsx
case 'my_artifact_type':
  return <MyArtifactComponent artifact={artifact} />;
```

### Issue: Cold start delays (2-3 minutes)
```typescript
// Solution: Enable provisioned concurrency (costs ~$33/month)
// See INSTALLATION_AND_ARCHITECTURE.md → "Known Issues"
```

---

## 📖 Key Files

```
amplify/backend.ts              # Main backend config
amplify/data/resource.ts        # GraphQL schema
amplify/functions/agents/       # Agent implementations
src/components/ChatMessage.tsx  # Message rendering
src/components/AgentSwitcher.tsx # Agent selection
.kiro/steering/                 # Development guidelines
tests/                          # Test files
```

---

## 🆘 Getting Help

1. **Read full docs:** INSTALLATION_AND_ARCHITECTURE.md
2. **Check guidelines:** `.kiro/steering/` directory
3. **Review examples:** `tests/` directory
4. **Check CloudWatch logs:** `aws logs tail /aws/lambda/<function-name> --follow`

---

## 📊 Project Status

**Lines of Code:** ~50,000+  
**Agents Implemented:** 4 (Petrophysics, Maintenance, EDIcraft, Renewable)  
**Test Coverage:** ~60%  
**Known Issues:** 6 major, 10 minor  
**Documentation:** Comprehensive  

**Overall Status:** 🟢 Production-ready for petrophysics, 🟡 Needs work for other agents

---

**Next Steps:**
1. Read INSTALLATION_AND_ARCHITECTURE.md (30 min)
2. Set up development environment (15 min)
3. Test existing agents (30 min)
4. Fix known issues (prioritize by impact)
5. Add new agents as needed

Good luck! 🚀
