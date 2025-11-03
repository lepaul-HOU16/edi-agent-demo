# Provisioned Concurrency Guide for Strands Agent

## Overview

Task 4 implementation adds **optional** provisioned concurrency for the Strands Agent Lambda to eliminate cold starts.

## What is Provisioned Concurrency?

Provisioned concurrency keeps Lambda instances pre-initialized and ready to respond instantly:

- **Without provisioned concurrency**: First request takes 2-3 minutes (cold start)
- **With provisioned concurrency**: All requests respond in < 30 seconds (no cold starts)

## Cost Analysis

### Current Setup (Disabled)
- **Cost**: $0/month
- **Cold start rate**: Variable (depends on usage)
- **First request**: 2-3 minutes
- **Subsequent requests**: < 30 seconds (if warm)

### With Provisioned Concurrency (1 instance)
- **Cost**: ~$32.85/month
- **Cold start rate**: 0%
- **All requests**: < 30 seconds
- **Memory**: 3008 MB (3 GB)

### Cost Calculation
```
Memory: 3008 MB = 3.008 GB
Price: $0.000004167 per GB-second
Per second: 3.008 × $0.000004167 = $0.0000125
Per hour: $0.0000125 × 3600 = $0.045
Per month: $0.045 × 730 hours = $32.85
```

## When to Enable

### ✅ Enable if:
- Doing live demos (need instant response)
- Cold start rate > 10%
- User experience is critical
- Budget allows ~$33/month

### ❌ Keep disabled if:
- Development/testing only
- Low usage (< 10 requests/day)
- Budget is tight
- Cold starts are acceptable

## How to Enable

### Step 1: Set Environment Variable
```bash
export ENABLE_STRANDS_PROVISIONED_CONCURRENCY=true
```

### Step 2: Restart Sandbox
```bash
# Stop current sandbox (Ctrl+C)
npx ampx sandbox
```

### Step 3: Verify Deployment
```bash
# Wait for "Deployed" message
# Check logs for:
# ✅ Provisioned concurrency enabled for Strands Agent (1 warm instance)
# 💰 Estimated cost: ~$32.85/month for zero cold starts
```

### Step 4: Test and Monitor
```bash
# Run the test script
node tests/test-provisioned-concurrency.js
```

## How to Disable

### Step 1: Unset Environment Variable
```bash
unset ENABLE_STRANDS_PROVISIONED_CONCURRENCY
# OR
export ENABLE_STRANDS_PROVISIONED_CONCURRENCY=false
```

### Step 2: Restart Sandbox
```bash
npx ampx sandbox
```

### Step 3: Verify
```bash
# Check logs for:
# ℹ️  Provisioned concurrency DISABLED for Strands Agent
```

## Monitoring

### Check Status
```bash
node tests/test-provisioned-concurrency.js
```

This script will:
1. Check if provisioned concurrency is enabled
2. Measure cold start rate (last 24 hours)
3. Calculate cost impact
4. Provide recommendations

### CloudWatch Metrics

Monitor these metrics in CloudWatch:
- **Invocations**: Total requests
- **Duration**: Response time (should be < 30s with provisioned concurrency)
- **Errors**: Any failures
- **ProvisionedConcurrencyUtilization**: How much of provisioned capacity is used

### Expected Results

#### With Provisioned Concurrency Enabled:
```
✅ Provisioned concurrency is ENABLED
   Requested: 1 instances
   Allocated: 1 instances
   Available: 1 instances
   Status: READY

📊 Measuring cold start rate (last 24 hours)...
   Total invocations: 50
   Estimated cold starts: 0
   Cold start rate: 0.00%
   ✅ EXCELLENT - Zero cold starts!

💰 Calculating cost impact...
   Provisioned instances: 1
   Memory per instance: 3.01 GB
   Cost per instance: $32.85/month
   Total cost: $32.85/month

📋 RECOMMENDATION
🟢 Provisioned concurrency is currently ENABLED
Recommendation: KEEP ENABLED (if budget allows)
Reason: Zero cold starts - excellent user experience
```

#### With Provisioned Concurrency Disabled:
```
ℹ️  Provisioned concurrency is DISABLED

📊 Measuring cold start rate (last 24 hours)...
   Total invocations: 50
   Estimated cold starts: 5
   Cold start rate: 10.00%
   ⚠️  MODERATE - Consider enabling provisioned concurrency

💰 Calculating cost impact...
   Current cost: $0 (provisioned concurrency disabled)
   Potential cost with 1 instance: ~$32.85/month

📋 RECOMMENDATION
🔴 Provisioned concurrency is currently DISABLED
Recommendation: ENABLE provisioned concurrency
Reason: Cold start rate is 10.00% (> 10%)
```

## Implementation Details

### Code Location
- **Configuration**: `amplify/backend.ts` (lines ~438-455)
- **Test script**: `tests/test-provisioned-concurrency.js`

### How It Works

1. **Environment variable check**: Reads `ENABLE_STRANDS_PROVISIONED_CONCURRENCY`
2. **Version creation**: Creates a Lambda version for the function
3. **Alias creation**: Creates an alias named "provisioned" with 1 provisioned instance
4. **Invocation**: Requests to the alias use pre-warmed instances

### Architecture

```
User Request
    ↓
API Gateway / AppSync
    ↓
Orchestrator Lambda
    ↓
Strands Agent Lambda (with provisioned concurrency)
    ↓ (instant - no cold start)
Bedrock Claude 3.7 Sonnet
    ↓
Response
```

## Troubleshooting

### Issue: Provisioned concurrency not working
**Symptoms**: Still seeing cold starts despite enabled provisioned concurrency

**Solutions**:
1. Check alias status: Should be "READY"
2. Verify available instances: Should match requested (1)
3. Check invocation logs: Ensure using "provisioned" alias
4. Wait 5-10 minutes after enabling for instances to warm up

### Issue: High cost
**Symptoms**: AWS bill higher than expected

**Solutions**:
1. Check number of provisioned instances (should be 1)
2. Verify only enabled when needed
3. Disable during development/testing
4. Consider using only for production/demos

### Issue: Still seeing timeouts
**Symptoms**: Requests timing out even with provisioned concurrency

**Solutions**:
1. Check Lambda timeout setting (should be 15 minutes)
2. Verify Bedrock model availability
3. Check CloudWatch logs for actual errors
4. May be operation timeout, not cold start

## Best Practices

### Development
- **Keep disabled**: Save cost during development
- **Test without**: Ensure code works with cold starts
- **Enable for testing**: Only when testing cold start elimination

### Production
- **Enable for demos**: Ensure instant response during presentations
- **Monitor usage**: Check if cold starts are actually a problem
- **Review monthly**: Decide if cost is justified by usage

### Cost Optimization
- **Use only when needed**: Enable for specific events/demos
- **Monitor cold start rate**: Only enable if > 10%
- **Consider alternatives**: Lazy loading, connection pooling (already implemented)

## Decision Matrix

| Scenario | Provisioned Concurrency | Reason |
|----------|------------------------|--------|
| Live demo | ✅ Enable | Need instant response |
| Production (high traffic) | ✅ Enable | Cold start rate > 10% |
| Production (low traffic) | ❌ Disable | Cold starts acceptable |
| Development | ❌ Disable | Save cost |
| Testing | ❌ Disable | Test real cold start behavior |
| Budget < $50/month | ❌ Disable | Cost too high |

## Summary

Provisioned concurrency is **implemented and ready to use** but **disabled by default** to save cost.

**To enable**: Set `ENABLE_STRANDS_PROVISIONED_CONCURRENCY=true` and restart sandbox.

**Cost**: ~$32.85/month for zero cold starts.

**Benefit**: Instant response times, better user experience.

**Recommendation**: Enable only when needed (demos, high-traffic production).
