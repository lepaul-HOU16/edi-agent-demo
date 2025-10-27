# CloudWatch Monitoring Quick Reference

## Task 11: CloudWatch Monitoring and Alarms

This document provides a quick reference for the CloudWatch monitoring and alarms implemented for Strands Agent performance tracking.

## Custom Metrics

All metrics are published to the `StrandsAgent/Performance` namespace.

### 1. ColdStartDuration
- **Description**: Time taken for cold start initialization
- **Unit**: Seconds
- **Dimensions**: AgentType, StartType=Cold
- **Target**: < 5 minutes (300 seconds)
- **Acceptable**: < 10 minutes (600 seconds)

### 2. WarmStartDuration
- **Description**: Time taken for warm start execution
- **Unit**: Seconds
- **Dimensions**: AgentType, StartType=Warm
- **Target**: < 30 seconds
- **Acceptable**: < 60 seconds

### 3. MemoryUsed
- **Description**: Peak memory usage during execution
- **Unit**: Megabytes (MB)
- **Dimensions**: AgentType
- **Target**: < 2500 MB
- **Maximum**: 3008 MB (3GB allocated)

### 4. TimeoutOccurred
- **Description**: Whether a timeout occurred (1) or not (0)
- **Unit**: Count
- **Dimensions**: AgentType
- **Used for**: Calculating timeout rate

### 5. InvocationCount
- **Description**: Total number of invocations
- **Unit**: Count
- **Dimensions**: AgentType
- **Used for**: Calculating timeout rate

## CloudWatch Alarms

### 1. StrandsAgent-ColdStartDuration-High
- **Threshold**: 600 seconds (10 minutes)
- **Evaluation**: 1 period of 5 minutes
- **Action**: Send SNS notification
- **Description**: Alerts when cold start exceeds 10 minutes

### 2. StrandsAgent-WarmStartDuration-High
- **Threshold**: 60 seconds
- **Evaluation**: 2 consecutive periods of 5 minutes
- **Action**: Send SNS notification
- **Description**: Alerts when warm start exceeds 60 seconds

### 3. StrandsAgent-MemoryUsage-High
- **Threshold**: 2867 MB (95% of 3GB)
- **Evaluation**: 1 period of 5 minutes
- **Action**: Send SNS notification
- **Description**: Alerts when memory usage exceeds 95% of allocated memory

### 4. StrandsAgent-TimeoutRate-High
- **Threshold**: 10% (calculated as: timeouts / invocations * 100)
- **Evaluation**: 2 consecutive periods of 5 minutes
- **Action**: Send SNS notification
- **Description**: Alerts when timeout rate exceeds 10%

## CloudWatch Dashboard

A dashboard named `StrandsAgent-Performance-Monitoring` is automatically created with:

1. **Cold Start Duration Graph**: Shows average cold start times over time
2. **Warm Start Duration Graph**: Shows average warm start times over time
3. **Memory Usage Graph**: Shows maximum memory usage over time
4. **Timeout Rate Graph**: Shows calculated timeout rate percentage over time
5. **Alarm Status Widget**: Shows current state of all alarms

## Testing

### Run the test script:
```bash
node tests/test-cloudwatch-monitoring.js
```

This will:
1. Invoke the Strands Agent Lambda
2. Wait for metrics to be published
3. Check that metrics appear in CloudWatch
4. Verify alarms are configured correctly
5. Validate alarm thresholds

### Manual verification:

1. **View Metrics in AWS Console**:
   - Go to CloudWatch → Metrics → StrandsAgent/Performance
   - You should see: ColdStartDuration, WarmStartDuration, MemoryUsed, TimeoutOccurred, InvocationCount

2. **View Alarms in AWS Console**:
   - Go to CloudWatch → Alarms
   - Filter by "StrandsAgent"
   - You should see 4 alarms

3. **View Dashboard in AWS Console**:
   - Go to CloudWatch → Dashboards
   - Open "StrandsAgent-Performance-Monitoring"
   - You should see graphs and alarm status

## Troubleshooting

### Metrics not appearing
- **Wait 2-5 minutes**: CloudWatch metrics can take a few minutes to appear
- **Check Lambda logs**: Verify metrics are being published (look for "📊 Published" messages)
- **Check IAM permissions**: Verify Lambda has `cloudwatch:PutMetricData` permission

### Alarms not created
- **Deploy backend**: Run `npx ampx sandbox` to deploy alarms
- **Check CDK stack**: Verify StrandsAgentAlarms construct is in backend.ts
- **Check CloudFormation**: Look for alarm resources in CloudFormation stack

### Alarms always in INSUFFICIENT_DATA state
- **Invoke Lambda**: Alarms need data points to evaluate
- **Wait for metrics**: Metrics must be published before alarms can evaluate
- **Check metric names**: Verify alarm metric names match published metrics

## Configuration

### Enable/Disable Alarms
In `amplify/backend.ts`:
```typescript
const strandsAgentAlarms = new StrandsAgentAlarms(backend.stack, 'StrandsAgentAlarms', {
  enabled: true // Set to false to disable alarms
});
```

### Add Email Notifications
In `amplify/backend.ts`:
```typescript
const strandsAgentAlarms = new StrandsAgentAlarms(backend.stack, 'StrandsAgentAlarms', {
  alarmEmail: 'your-email@example.com', // Add your email
  enabled: true
});
```

### Adjust Alarm Thresholds
Edit `amplify/custom/strandsAgentAlarms.ts` and modify the threshold values:
```typescript
threshold: 600, // Change to desired value
```

## Performance Targets

### Cold Start
- **Target**: < 5 minutes (300 seconds)
- **Acceptable**: < 10 minutes (600 seconds)
- **Alarm**: > 10 minutes

### Warm Start
- **Target**: < 30 seconds
- **Acceptable**: < 60 seconds
- **Alarm**: > 60 seconds

### Memory Usage
- **Target**: < 2500 MB
- **Maximum**: 3008 MB (3GB allocated)
- **Alarm**: > 2867 MB (95%)

### Timeout Rate
- **Target**: < 5%
- **Acceptable**: < 10%
- **Alarm**: > 10%

## Monitoring Best Practices

1. **Check dashboard daily**: Review performance trends
2. **Investigate alarms immediately**: Don't ignore alarm notifications
3. **Track cold start frequency**: High cold start rate indicates need for provisioned concurrency
4. **Monitor memory trends**: Increasing memory usage may indicate memory leak
5. **Analyze timeout patterns**: Frequent timeouts may indicate need for optimization

## Related Documentation

- Task 2: Performance Monitoring (tests/PERFORMANCE_MONITORING_QUICK_REFERENCE.md)
- Task 7: Bedrock Connection Pooling (tests/BEDROCK_CONNECTION_POOLING_QUICK_REFERENCE.md)
- Task 9: Dockerfile Optimization (tests/DOCKERFILE_OPTIMIZATION_QUICK_REFERENCE.md)
- Task 10: Comprehensive Test Suite (tests/STRANDS_AGENT_TEST_SUITE.md)

## Success Criteria

✅ **Metrics Published**: All 5 custom metrics appear in CloudWatch
✅ **Alarms Created**: All 4 alarms are configured correctly
✅ **Dashboard Created**: Dashboard shows all metrics and alarms
✅ **Thresholds Correct**: All alarm thresholds match requirements
✅ **Notifications Work**: SNS topic receives alarm notifications (if email configured)

## Next Steps

After verifying CloudWatch monitoring:
1. Run comprehensive test suite (Task 10)
2. Create documentation (Task 12)
3. Deploy to production
4. Monitor performance in production
5. Adjust thresholds based on actual performance data
