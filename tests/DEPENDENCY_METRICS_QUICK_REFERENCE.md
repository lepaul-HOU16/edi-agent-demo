# Dependency Loading Metrics - Quick Reference

## Task 10: Enhanced Performance Monitoring

Quick reference for dependency loading time metrics added to Strands Agent Lambda.

## What's New

### 5 New Metrics Tracked

1. **boto3**: AWS SDK import time
2. **psutil**: Memory monitoring library import time
3. **agents**: All agent modules import time (terrain, layout, simulation, report)
4. **cloudwatch_metrics**: Metrics publishing module import time
5. **total_imports**: Total time for all imports

## How to View Metrics

### 1. In Lambda Response

Invoke Lambda and check the `performance.dependencyLoadTimes` field:

```json
{
  "performance": {
    "coldStart": true,
    "dependencyLoadTimes": {
      "boto3": 0.123,
      "psutil": 0.045,
      "agents": 2.456,
      "cloudwatch_metrics": 0.012,
      "total_imports": 2.636
    }
  }
}
```

### 2. In Lambda Logs

Check CloudWatch Logs for the Lambda function:

```
📦 Dependency loading times:
  - boto3: 0.123s
  - psutil: 0.045s
  - agents: 2.456s
  - cloudwatch_metrics: 0.012s
  - TOTAL: 2.636s
```

### 3. In CloudWatch Metrics

Go to CloudWatch → Metrics → StrandsAgent/Performance:
- Metric: `DependencyLoadTime`
- Dimensions: `AgentType`, `Dependency`

### 4. In CloudWatch Dashboard

Go to CloudWatch → Dashboards → "StrandsAgent-Performance-Monitoring":
- Look for "Dependency Loading Times (Cold Start)" widget
- Shows all 5 dependencies on one graph

## Quick Test

```bash
# Set your Lambda function name
export STRANDS_AGENT_FUNCTION_NAME=amplify-digitalassistant-renewableAgentsFunction-...

# Run the test
node tests/test-dependency-load-metrics.js
```

## Typical Values

| Dependency | Expected Time | Status |
|------------|---------------|--------|
| boto3 | 0.1 - 0.2s | ✅ Normal |
| psutil | 0.03 - 0.05s | ✅ Normal |
| agents | 2.0 - 3.0s | ⚠️ Slowest |
| cloudwatch_metrics | 0.01 - 0.02s | ✅ Normal |
| **TOTAL** | **2.5 - 3.5s** | ✅ Normal |

## When to Optimize

### ⚠️ Optimization Needed If:
- **agents** > 3.5s: Consider lazy loading individual agents
- **boto3** > 0.3s: Check for unnecessary imports
- **total_imports** > 5s: Review all dependencies

### ✅ No Optimization Needed If:
- All values within expected ranges
- Total import time < 3.5s
- Cold start time acceptable

## Optimization Strategies

### 1. Lazy Load Agents
Instead of importing all agents at module level:
```python
# Current (loads all agents)
from terrain_agent import terrain_agent
from layout_agent import layout_agent
from simulation_agent import simulation_agent
from report_agent import report_agent

# Optimized (load only when needed)
def get_agent(agent_type):
    if agent_type == 'terrain':
        from terrain_agent import terrain_agent
        return terrain_agent
    # ... etc
```

### 2. Reduce boto3 Imports
Only import specific services:
```python
# Current
import boto3

# Optimized
from boto3 import client
```

### 3. Conditional Imports
Only import what's needed:
```python
# Only import psutil if memory tracking is enabled
if os.environ.get('ENABLE_MEMORY_TRACKING') == 'true':
    import psutil
```

## Troubleshooting

### Metrics not appearing
- **Wait**: Metrics take 2-5 minutes to appear in CloudWatch
- **Check logs**: Look for "📊 Published" messages
- **Verify IAM**: Ensure Lambda has `cloudwatch:PutMetricData` permission

### Dashboard widget missing
- **Deploy**: Run `npx ampx sandbox` to deploy dashboard changes
- **Check name**: Dashboard must be named "StrandsAgent-Performance-Monitoring"
- **Verify**: Check CloudFormation stack for dashboard resource

### Dependency times not in response
- **Cold start**: Metrics only included on cold starts, not warm starts
- **Check logs**: Look for "📦 Dependency loading times:" message
- **Deploy**: Ensure latest code is deployed

## Related Commands

```bash
# Deploy changes
npx ampx sandbox

# Test dependency metrics
node tests/test-dependency-load-metrics.js

# Test cold start
node tests/test-strands-cold-start.js

# View Lambda logs
aws logs tail /aws/lambda/YOUR_FUNCTION_NAME --follow

# View CloudWatch metrics
aws cloudwatch get-metric-statistics \
  --namespace StrandsAgent/Performance \
  --metric-name DependencyLoadTime \
  --dimensions Name=Dependency,Value=agents \
  --start-time $(date -u -d '10 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average
```

## Success Indicators

✅ **Logs show dependency times** on cold start
✅ **Response includes** `dependencyLoadTimes` field
✅ **CloudWatch has** `DependencyLoadTime` metrics
✅ **Dashboard shows** dependency loading time widget
✅ **All values** within expected ranges

## Next Steps

1. Deploy changes: `npx ampx sandbox`
2. Run test: `node tests/test-dependency-load-metrics.js`
3. Review metrics in CloudWatch
4. Optimize if needed based on actual values
5. Monitor trends over time

## Related Documentation

- [Task 10 Complete Summary](./TASK_10_DEPENDENCY_METRICS_COMPLETE.md)
- [CloudWatch Monitoring Quick Reference](./CLOUDWATCH_MONITORING_QUICK_REFERENCE.md)
- [Performance Monitoring Quick Reference](./PERFORMANCE_MONITORING_QUICK_REFERENCE.md)
- [Strands Agent Test Suite](./STRANDS_AGENT_TEST_SUITE.md)

