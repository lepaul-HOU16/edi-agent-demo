# Agent Integration Checklist

## Quick Reference Poster

Print this checklist and keep it visible during agent integration!

---

## 📋 PHASE 1: PLANNING

### Define Agent Purpose
- [ ] Domain clearly identified
- [ ] Query types documented
- [ ] Data sources identified
- [ ] Output types specified
- [ ] Tool requirements determined

### Design Intent Detection
- [ ] Regex patterns created
- [ ] Patterns tested with sample queries
- [ ] Exclusion patterns added (if needed)
- [ ] Pattern priority determined
- [ ] False positive scenarios tested

### Define Artifacts
- [ ] Artifact types specified
- [ ] Data structures defined
- [ ] Visualization types chosen
- [ ] Metadata requirements documented

**✅ Planning Complete - Proceed to Implementation**

---

## 💻 PHASE 2: BACKEND

### Create Agent Class
- [ ] File created: `agents/yourAgent.ts`
- [ ] Extends `BaseEnhancedAgent`
- [ ] `processMessage()` implemented
- [ ] Intent detection logic added
- [ ] Parameter extraction implemented
- [ ] Parameter validation added
- [ ] Thought steps generated
- [ ] Error handling implemented
- [ ] Response formatting complete

### Register with Router
- [ ] Agent imported in `agentRouter.ts`
- [ ] Agent instantiated in constructor
- [ ] Patterns added to `determineAgentType()`
- [ ] Routing case added to `routeQuery()`
- [ ] Priority order verified

### Create Tool Lambda (if needed)
- [ ] Directory created: `lambda-functions/your-tool/`
- [ ] Handler file created
- [ ] Tool logic implemented
- [ ] S3 integration added (if needed)
- [ ] Error handling implemented
- [ ] Logging added
- [ ] Dependencies listed

### Configure Infrastructure
- [ ] Lambda function defined in CDK
- [ ] Runtime specified correctly
- [ ] Handler path correct
- [ ] Timeout configured
- [ ] Memory size set
- [ ] Environment variables added
- [ ] S3 permissions granted
- [ ] Invoke permissions granted
- [ ] Function name env var added to chat Lambda

**✅ Backend Complete - Proceed to Frontend**

---

## 🎨 PHASE 3: FRONTEND

### Create Artifact Component
- [ ] File created: `components/artifacts/YourArtifact.tsx`
- [ ] Props interface defined
- [ ] Loading state implemented
- [ ] Error state implemented
- [ ] Empty state implemented
- [ ] Data rendering implemented
- [ ] Visualization rendering added
- [ ] Export functionality added
- [ ] Responsive design verified
- [ ] Accessibility checked

### Register Renderer
- [ ] Component imported in `ChatMessage.tsx`
- [ ] Case added to `renderArtifact()` switch
- [ ] Artifact type matches backend

### Add Type Definitions
- [ ] Interface created in `types/artifacts.ts`
- [ ] Added to Artifact union type
- [ ] Type exports verified

**✅ Frontend Complete - Proceed to Testing**

---

## 🧪 PHASE 4: TESTING

### Unit Tests
- [ ] Agent tests created
- [ ] Intent detection tested
- [ ] Parameter extraction tested
- [ ] Error handling tested
- [ ] Tool tests created (if applicable)
- [ ] Component tests created
- [ ] All tests passing

### Integration Tests
- [ ] Agent routing tested
- [ ] Tool invocation tested
- [ ] End-to-end flow tested
- [ ] Error scenarios tested

### Manual Testing
- [ ] Deployed to sandbox
- [ ] Test queries executed
- [ ] Artifacts render correctly
- [ ] No console errors
- [ ] CloudWatch logs checked
- [ ] Performance acceptable

**✅ Testing Complete - Proceed to Documentation**

---

## 📚 PHASE 5: DOCUMENTATION

### Agent Documentation
- [ ] Purpose documented
- [ ] Supported queries listed
- [ ] Example usage provided
- [ ] Artifacts described
- [ ] Configuration documented

### Update Main Docs
- [ ] README.md updated
- [ ] Architecture docs updated
- [ ] API reference updated

**✅ Documentation Complete - Proceed to Deployment**

---

## 🚀 PHASE 6: DEPLOYMENT

### Pre-Deployment
- [ ] All tests passing
- [ ] CDK builds without errors
- [ ] Changes reviewed with `cdk diff`
- [ ] Deployment plan documented
- [ ] Rollback plan prepared

### Deploy to Dev
- [ ] Deployed to dev environment
- [ ] Smoke tests pass
- [ ] CloudWatch logs clean
- [ ] Performance verified
- [ ] User acceptance testing complete

### Deploy to Production
- [ ] Deployed to production
- [ ] Smoke tests pass
- [ ] Monitoring configured
- [ ] Alerts configured
- [ ] Documentation published

**✅ Deployment Complete - Agent Live!**

---

## 🎯 SUCCESS CRITERIA

Your agent integration is complete when:

- ✅ All checklist items checked
- ✅ All tests passing
- ✅ Deployed to production
- ✅ Monitoring active
- ✅ Documentation complete
- ✅ User can successfully use agent
- ✅ No errors in CloudWatch
- ✅ Artifacts render correctly

---

## ⚠️ COMMON PITFALLS

### Don't Skip These!

❌ **Forgetting to restart sandbox** after CDK changes
- Always restart after modifying `backend.ts`

❌ **Missing environment variables**
- Verify all env vars are set after deployment

❌ **Not testing error cases**
- Test with invalid inputs, missing data, timeouts

❌ **Ignoring CloudWatch logs**
- Always check logs for hidden errors

❌ **Skipping regression tests**
- Verify existing agents still work

❌ **Not documenting configuration**
- Future you will thank present you

---

## 🆘 NEED HELP?

If stuck, check:
1. CloudWatch logs for detailed errors
2. Existing agent implementations
3. Architecture documentation
4. Integration guide examples
5. Troubleshooting section

---

## 📊 ESTIMATED TIME

| Phase | Simple Agent | Agent + Tool | Orchestrator |
|-------|-------------|--------------|--------------|
| Planning | 1-2 hours | 2-4 hours | 4-8 hours |
| Backend | 2-4 hours | 4-8 hours | 1-2 days |
| Frontend | 2-4 hours | 4-8 hours | 1-2 days |
| Testing | 1-2 hours | 2-4 hours | 4-8 hours |
| Documentation | 1 hour | 1-2 hours | 2-4 hours |
| Deployment | 1 hour | 1-2 hours | 2-4 hours |
| **TOTAL** | **8-14 hours** | **1-2 days** | **1-2 weeks** |

---

**Print this checklist and check off items as you complete them!**

**Remember:** Quality over speed. A well-tested agent is better than a rushed one.
