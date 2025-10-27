# Strands Agent Test Suite

Comprehensive test suite for the Strands Agent system, covering cold start performance, warm start performance, individual agent functionality, multi-agent orchestration, and graceful fallback mechanisms.

## Overview

This test suite verifies all aspects of the Strands Agent system:

1. **Cold Start Performance** - First invocation after deployment
2. **Warm Start Performance** - Subsequent invocations using warm containers
3. **Individual Agents** - All 4 agents (terrain, layout, simulation, report)
4. **Orchestration** - Multi-agent workflow coordination
5. **Fallback Mechanism** - Graceful degradation when agents timeout

## Requirements

- Node.js 18+ with AWS SDK v3
- AWS credentials configured
- Strands Agent Lambda deployed
- Renewable Orchestrator Lambda deployed

## Quick Start

### Run All Tests

```bash
./tests/run-all-strands-tests.sh
```

### Run Individual Tests

```bash
# Cold start performance
node tests/test-strands-cold-start.js

# Warm start performance
node tests/test-strands-warm-start.js

# Individual agents
node tests/test-strands-all-agents.js

# Orchestration
node tests/test-strands-orchestration.js

# Fallback mechanism
node tests/test-strands-fallback.js
```

### Run Subset of Tests

```bash
# Skip performance tests (faster)
./tests/run-all-strands-tests.sh --fast

# Skip specific tests
./tests/run-all-strands-tests.sh --skip-cold-start --skip-warm-start

# Skip fallback test (requires Lambda config modification)
./tests/run-all-strands-tests.sh --skip-fallback
```

## Test Descriptions

### 1. Cold Start Performance Test

**File**: `test-strands-cold-start.js`

**Purpose**: Measures the time it takes for the Strands Agent Lambda to initialize on first invocation.

**What it tests**:
- Lambda deployment verification
- Docker image pull and initialization
- Python runtime startup
- Dependency loading (PyWake, GeoPandas, Bedrock)
- Agent initialization
- First request processing

**Success criteria**:
- ✅ Excellent: < 5 minutes (300 seconds)
- ⚠️  Acceptable: < 10 minutes (600 seconds)
- ❌ Failed: > 10 minutes

**Output**:
- Total duration
- Detailed timing breakdown
- Performance metrics from Lambda
- Recommendations for optimization

**When to run**:
- After fresh deployment
- After Lambda has been idle (container recycled)
- After Dockerfile changes
- After dependency updates

### 2. Warm Start Performance Test

**File**: `test-strands-warm-start.js`

**Purpose**: Measures the time it takes for subsequent requests using a warm Lambda container.

**What it tests**:
- Container reuse
- Bedrock connection pooling
- Agent state persistence
- Execution time without initialization overhead

**Success criteria**:
- ✅ Excellent: < 30 seconds
- ⚠️  Acceptable: < 60 seconds
- ❌ Failed: > 60 seconds

**Output**:
- Cold start duration (first invocation)
- Warm start duration (second invocation)
- Speedup factor
- Performance comparison

**When to run**:
- After cold start test passes
- To verify container reuse
- To validate Bedrock connection pooling
- Before enabling in production

### 3. Individual Agent Tests

**File**: `test-strands-all-agents.js`

**Purpose**: Verifies that all 4 Strands agents work correctly and generate appropriate artifacts.

**What it tests**:
- **Terrain Agent**: Analyzes terrain features, obstacles, and suitability
- **Layout Agent**: Optimizes turbine placement considering wake effects
- **Simulation Agent**: Runs wake simulation and calculates energy production
- **Report Agent**: Generates comprehensive project reports

**Success criteria**:
- All 4 agents respond successfully
- Each agent generates expected artifacts
- Artifacts are stored in S3
- Response times are reasonable

**Output**:
- Individual agent results
- Artifact generation verification
- Performance metrics per agent
- Success rate summary

**When to run**:
- After warm start test passes
- To verify agent implementations
- After agent code changes
- Before orchestration testing

### 4. Orchestration Tests

**File**: `test-strands-orchestration.js`

**Purpose**: Verifies that the renewable orchestrator correctly routes requests to Strands agents.

**What it tests**:
- Single agent routing (terrain, layout, simulation)
- Multi-agent workflow coordination
- Artifact generation and S3 storage
- End-to-end request/response flow

**Success criteria**:
- Orchestrator routes to Strands agents (not direct tools)
- All expected artifacts generated
- Artifacts stored in S3
- Multi-agent workflows complete successfully

**Output**:
- Routing verification
- Artifact generation and storage
- Performance metrics
- Fallback detection (should be none)

**When to run**:
- After individual agent tests pass
- To verify orchestrator integration
- Before enabling Strands agents in production
- After orchestrator code changes

### 5. Fallback Mechanism Tests

**File**: `test-strands-fallback.js`

**Purpose**: Verifies graceful degradation when Strands agents timeout or fail.

**What it tests**:
- Timeout detection
- Fallback to direct tools
- User warning messages
- Artifact generation in fallback mode

**Success criteria**:
- Fallback triggered when agent times out
- Direct tools invoked successfully
- `fallbackUsed` flag set in response
- User sees appropriate warning message

**Output**:
- Fallback trigger verification
- Direct tool invocation
- User warning detection
- Artifact generation in fallback mode

**When to run**:
- After orchestration tests pass
- To verify graceful degradation
- Before production deployment
- After fallback logic changes

**⚠️  Warning**: This test temporarily modifies the Strands Agent Lambda configuration (sets timeout to 1 second) to simulate failure. Configuration is restored after testing.

## Test Results Interpretation

### All Tests Pass ✅

```
✅ ALL TESTS PASSED

🎉 Strands Agent system is working correctly!

Next steps:
  • Deploy to production
  • Enable Strands agents in orchestrator
  • Monitor performance in production
  • Set up CloudWatch alarms
```

**Action**: System is ready for production use.

### Some Tests Fail ❌

```
❌ SOME TESTS FAILED

Failed tests need to be fixed before deployment.

Troubleshooting:
  • Review test output above for error details
  • Check CloudWatch logs for Lambda errors
  • Verify environment variables are set correctly
  • Run individual tests for more detailed output
```

**Action**: Fix failing tests before proceeding.

### Performance Warnings ⚠️

If cold start or warm start tests show warnings:

```
⚠️  ACCEPTABLE: Cold start completed in 7.5 minutes
   Target: < 5 minutes
   Acceptable: < 10 minutes
   Status: PASSED (with warning)

   💡 Recommendations:
      - Consider implementing lazy loading for heavy dependencies
      - Optimize Docker image size
      - Review dependency loading order
```

**Action**: Consider optimization but system is functional.

## Troubleshooting

### Test Fails to Find Lambda Function

**Error**: `RenewableAgentsFunction not found`

**Solution**:
1. Verify Lambda is deployed: `aws lambda list-functions | grep RenewableAgentsFunction`
2. Check AWS region: `echo $AWS_REGION`
3. Verify AWS credentials: `aws sts get-caller-identity`

### Cold Start Timeout

**Error**: `Lambda exceeded the 900s timeout`

**Solution**:
1. Check Docker image size: Should be < 5GB
2. Implement lazy loading for heavy dependencies
3. Optimize Dockerfile with multi-stage builds
4. Consider increasing Lambda timeout temporarily

### Warm Start Still Slow

**Error**: `Warm start took 45 seconds (> 30 seconds)`

**Solution**:
1. Verify Bedrock connection pooling is working
2. Check for unnecessary re-initialization
3. Review agent execution logic
4. Monitor for memory leaks

### Orchestration Not Routing to Strands

**Error**: `Routed to Strands: NO`

**Solution**:
1. Check `RENEWABLE_AGENTS_FUNCTION_NAME` environment variable
2. Verify `isStrandsAgentAvailable()` returns true
3. Check orchestrator routing logic
4. Review CloudWatch logs for errors

### Fallback Not Triggering

**Error**: `Fallback Used: NO`

**Solution**:
1. Verify timeout detection logic
2. Check error handling in orchestrator
3. Ensure fallback logic is implemented
4. Review error types being caught

## Performance Benchmarks

### Target Performance

| Metric | Target | Acceptable | Current |
|--------|--------|------------|---------|
| Cold Start | < 5 min | < 10 min | TBD |
| Warm Start | < 30 sec | < 60 sec | TBD |
| Memory Usage | < 2.5GB | < 3GB | TBD |
| Success Rate | > 95% | > 90% | TBD |
| Fallback Rate | < 5% | < 10% | TBD |

### Optimization Priorities

1. **Cold Start > 10 minutes**: CRITICAL - Implement lazy loading immediately
2. **Cold Start 5-10 minutes**: HIGH - Optimize Dockerfile and dependencies
3. **Warm Start > 60 seconds**: HIGH - Review Bedrock connection pooling
4. **Warm Start 30-60 seconds**: MEDIUM - Optimize agent execution logic
5. **Memory > 2.8GB**: MEDIUM - Review dependency usage

## Continuous Integration

### Pre-Deployment Checklist

Before deploying Strands Agent changes:

- [ ] Run cold start test
- [ ] Run warm start test
- [ ] Run individual agent tests
- [ ] Run orchestration tests
- [ ] Run fallback tests
- [ ] Review CloudWatch logs
- [ ] Verify performance metrics
- [ ] Update documentation

### Automated Testing

Add to CI/CD pipeline:

```yaml
# .github/workflows/strands-agent-tests.yml
name: Strands Agent Tests

on:
  push:
    paths:
      - 'amplify/functions/renewableAgents/**'
      - 'amplify/functions/renewableOrchestrator/**'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      - name: Run Strands Agent Tests
        run: |
          npm install
          ./tests/run-all-strands-tests.sh --skip-fallback
```

## Monitoring in Production

### CloudWatch Metrics

After deployment, monitor:

- `ColdStartDuration`: Track cold start times
- `WarmStartDuration`: Track warm start times
- `MemoryUsed`: Monitor memory consumption
- `TimeoutRate`: Track timeout frequency
- `FallbackRate`: Monitor fallback usage

### CloudWatch Alarms

Set up alarms for:

- Cold start > 10 minutes
- Warm start > 60 seconds
- Memory > 2.8GB (95% of 3GB)
- Timeout rate > 10%
- Fallback rate > 10%

### Log Analysis

Review CloudWatch logs for:

- Cold start initialization steps
- Dependency loading times
- Bedrock connection times
- Agent execution times
- Error patterns

## Support

For issues or questions:

1. Review test output for detailed error messages
2. Check CloudWatch logs for Lambda errors
3. Review this documentation
4. Consult design document: `.kiro/specs/fix-strands-agent-cold-start/design.md`
5. Consult requirements: `.kiro/specs/fix-strands-agent-cold-start/requirements.md`

## Version History

- **v1.0.0** (2025-01-XX): Initial test suite creation
  - Cold start performance test
  - Warm start performance test
  - Individual agent tests
  - Orchestration tests
  - Fallback mechanism tests
