# Strands Agent Tests - Quick Start Guide

## TL;DR

```bash
# Run all tests
./tests/run-all-strands-tests.sh

# Run fast (skip performance tests)
./tests/run-all-strands-tests.sh --fast

# Run individual test
node tests/test-strands-cold-start.js
```

## Test Files

| Test | File | Duration | Purpose |
|------|------|----------|---------|
| Cold Start | `test-strands-cold-start.js` | 2-10 min | First invocation performance |
| Warm Start | `test-strands-warm-start.js` | 1-2 min | Subsequent invocation performance |
| All Agents | `test-strands-all-agents.js` | 3-5 min | Individual agent functionality |
| Orchestration | `test-strands-orchestration.js` | 3-5 min | Multi-agent workflows |
| Fallback | `test-strands-fallback.js` | 2-3 min | Graceful degradation |

## Common Commands

### Run All Tests
```bash
./tests/run-all-strands-tests.sh
```

### Skip Performance Tests (Faster)
```bash
./tests/run-all-strands-tests.sh --fast
```

### Run Specific Test
```bash
node tests/test-strands-cold-start.js
node tests/test-strands-warm-start.js
node tests/test-strands-all-agents.js
node tests/test-strands-orchestration.js
node tests/test-strands-fallback.js
```

### Skip Specific Tests
```bash
./tests/run-all-strands-tests.sh --skip-cold-start
./tests/run-all-strands-tests.sh --skip-warm-start
./tests/run-all-strands-tests.sh --skip-agents
./tests/run-all-strands-tests.sh --skip-orchestration
./tests/run-all-strands-tests.sh --skip-fallback
```

## Expected Results

### ✅ All Pass
```
✅ ALL TESTS PASSED

🎉 Strands Agent system is working correctly!
```

### ⚠️  Performance Warning
```
⚠️  ACCEPTABLE: Cold start completed in 7.5 minutes
   Target: < 5 minutes
   Status: PASSED (with warning)
```

### ❌ Test Failure
```
❌ SOME TESTS FAILED

Failed tests need to be fixed before deployment.
```

## Performance Targets

| Metric | Target | Acceptable |
|--------|--------|------------|
| Cold Start | < 5 min | < 10 min |
| Warm Start | < 30 sec | < 60 sec |
| Memory | < 2.5GB | < 3GB |
| Success Rate | > 95% | > 90% |

## Troubleshooting

### Lambda Not Found
```bash
# Check if deployed
aws lambda list-functions | grep RenewableAgentsFunction

# Check region
echo $AWS_REGION

# Check credentials
aws sts get-caller-identity
```

### Cold Start Timeout
- Check Docker image size (should be < 5GB)
- Implement lazy loading
- Optimize Dockerfile
- Increase Lambda timeout

### Warm Start Slow
- Verify Bedrock connection pooling
- Check for re-initialization
- Review agent execution logic

### Orchestration Not Routing
- Check `RENEWABLE_AGENTS_FUNCTION_NAME` env var
- Verify `isStrandsAgentAvailable()` returns true
- Review orchestrator routing logic

## When to Run Tests

### Before Deployment
- [ ] Cold start test
- [ ] Warm start test
- [ ] Individual agent tests
- [ ] Orchestration tests
- [ ] Fallback tests

### After Code Changes
- Agent code: Run all tests
- Orchestrator code: Run orchestration + fallback
- Dockerfile changes: Run cold start + warm start
- Dependencies: Run cold start test

### Regular Monitoring
- Weekly: Run all tests
- After deployment: Run orchestration test
- After idle period: Run cold start test

## Quick Validation

### 1-Minute Smoke Test
```bash
# Just verify agents work
node tests/test-strands-all-agents.js
```

### 5-Minute Full Test
```bash
# Skip performance tests
./tests/run-all-strands-tests.sh --fast
```

### 15-Minute Complete Test
```bash
# Run everything
./tests/run-all-strands-tests.sh
```

## Next Steps

After all tests pass:

1. ✅ Deploy to production
2. ✅ Enable Strands agents in orchestrator
3. ✅ Set up CloudWatch alarms
4. ✅ Monitor performance metrics
5. ✅ Review logs regularly

## Documentation

- Full documentation: `tests/STRANDS_AGENT_TEST_SUITE.md`
- Design document: `.kiro/specs/fix-strands-agent-cold-start/design.md`
- Requirements: `.kiro/specs/fix-strands-agent-cold-start/requirements.md`
- Tasks: `.kiro/specs/fix-strands-agent-cold-start/tasks.md`
