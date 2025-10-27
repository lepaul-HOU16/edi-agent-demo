# Task 11: CloudWatch Monitoring Deployment Checklist

## Pre-Deployment Checklist

Before deploying CloudWatch monitoring and alarms:

- [x] Task 11.1: CloudWatch custom metrics module created
- [x] Task 11.2: CloudWatch alarms CDK construct created
- [x] Lambda handler updated to publish metrics
- [x] Backend.ts updated with alarms construct
- [x] IAM permissions added for CloudWatch
- [x] Test script created
- [x] Documentation created

## Deployment Steps

### 1. Stop Current Sandbox (if running)
```bash
# Press Ctrl+C to stop current sandbox
```

### 2. Deploy Updated Backend
```bash
npx ampx sandbox
```

**Expected output**:
- ✅ Created DynamoDB table for agent progress
- ✅ Created CloudWatch alarms for Strands Agent performance monitoring
- ✅ Granted Strands Agent CloudWatch permissions for custom metrics
- ✅ Deployed successfully

**Wait for**: "Deployed" message (may take 10-15 minutes)

### 3. Verify Deployment

#### Check Lambda Function
```bash
# Get function name
aws lambda list-functions --query "Functions[?contains(FunctionName, 'RenewableAgentsFunction')].FunctionName" --output text

# Check environment variables
aws lambda get-function-configuration \
  --function-name <function-name> \
  --query "Environment.Variables" \
  --output json
```

**Verify**:
- ✅ `AGENT_PROGRESS_TABLE` is set
- ✅ `RENEWABLE_S3_BUCKET` is set

#### Check IAM Permissions
```bash
# Get Lambda role
aws lambda get-function-configuration \
  --function-name <function-name> \
  --query "Role" \
  --output text

# Check role policies
aws iam list-role-policies --role-name <role-name>
```

**Verify**:
- ✅ Policy includes `cloudwatch:PutMetricData`

#### Check CloudWatch Alarms
```bash
# List alarms
aws cloudwatch describe-alarms \
  --alarm-name-prefix "StrandsAgent" \
  --query "MetricAlarms[].AlarmName" \
  --output table
```

**Expected alarms**:
- ✅ StrandsAgent-ColdStartDuration-High
- ✅ StrandsAgent-WarmStartDuration-High
- ✅ StrandsAgent-MemoryUsage-High
- ✅ StrandsAgent-TimeoutRate-High

### 4. Test Metrics Publishing

#### Run Test Script
```bash
node tests/test-cloudwatch-monitoring.js
```

**Expected output**:
- ✅ Lambda invoked successfully
- ✅ Performance metrics logged
- ✅ Metrics published to CloudWatch

#### Wait for Metrics
```bash
# Wait 2-5 minutes for metrics to appear in CloudWatch
sleep 120
```

#### Check Metrics in Console
1. Go to AWS CloudWatch Console
2. Navigate to Metrics → All metrics
3. Look for namespace: `StrandsAgent/Performance`
4. Verify metrics:
   - ✅ ColdStartDuration
   - ✅ WarmStartDuration
   - ✅ MemoryUsed
   - ✅ TimeoutOccurred
   - ✅ InvocationCount

### 5. Verify Alarms

#### Check Alarm Status
```bash
aws cloudwatch describe-alarms \
  --alarm-name-prefix "StrandsAgent" \
  --query "MetricAlarms[].[AlarmName,StateValue,Threshold]" \
  --output table
```

**Expected states**:
- ✅ All alarms in `OK` or `INSUFFICIENT_DATA` state
- ✅ No alarms in `ALARM` state (unless performance is degraded)

#### Check Dashboard
1. Go to AWS CloudWatch Console
2. Navigate to Dashboards
3. Open: `StrandsAgent-Performance-Monitoring`
4. Verify widgets:
   - ✅ Cold Start Duration graph
   - ✅ Warm Start Duration graph
   - ✅ Memory Usage graph
   - ✅ Timeout Rate graph
   - ✅ Alarm Status widget

### 6. Test Alarm Notifications (Optional)

If you configured email notifications:

#### Subscribe to SNS Topic
```bash
# Get SNS topic ARN
aws sns list-topics --query "Topics[?contains(TopicArn, 'strands-agent-performance-alarms')].TopicArn" --output text

# Subscribe email
aws sns subscribe \
  --topic-arn <topic-arn> \
  --protocol email \
  --notification-endpoint your-email@example.com
```

#### Confirm Subscription
- Check your email for confirmation link
- Click link to confirm subscription

#### Test Notification (Optional)
```bash
# Publish test message
aws sns publish \
  --topic-arn <topic-arn> \
  --subject "Test Alarm Notification" \
  --message "This is a test notification from Strands Agent alarms"
```

## Post-Deployment Verification

### Run Comprehensive Tests

#### Test Cold Start
```bash
node tests/test-strands-cold-start.js
```

**Verify**:
- ✅ Cold start completes successfully
- ✅ Performance metrics logged
- ✅ ColdStartDuration metric published

#### Test Warm Start
```bash
node tests/test-strands-warm-start.js
```

**Verify**:
- ✅ Warm start completes successfully
- ✅ Performance metrics logged
- ✅ WarmStartDuration metric published

#### Test All Agents
```bash
node tests/test-strands-all-agents.js
```

**Verify**:
- ✅ All agents work correctly
- ✅ Metrics published for each agent type
- ✅ Memory metrics within limits

### Monitor Metrics

#### Check Metrics After Tests
```bash
# Wait for metrics to be published
sleep 60

# Run monitoring test
node tests/test-cloudwatch-monitoring.js
```

**Verify**:
- ✅ All metrics have data points
- ✅ Metric values are reasonable
- ✅ No alarms triggered

## Troubleshooting

### Metrics Not Appearing

**Problem**: Metrics don't appear in CloudWatch after 5 minutes

**Solutions**:
1. Check Lambda logs for "📊 Published" messages
2. Verify IAM permissions include `cloudwatch:PutMetricData`
3. Check CloudWatch namespace is exactly `StrandsAgent/Performance`
4. Verify Lambda is being invoked successfully

### Alarms Not Created

**Problem**: Alarms don't appear in CloudWatch console

**Solutions**:
1. Verify `npx ampx sandbox` completed successfully
2. Check CloudFormation stack for alarm resources
3. Verify `StrandsAgentAlarms` construct is in backend.ts
4. Check for CDK deployment errors in logs

### Alarms Always in INSUFFICIENT_DATA

**Problem**: Alarms show INSUFFICIENT_DATA state

**Solutions**:
1. Invoke Lambda to generate metrics
2. Wait 5-10 minutes for metrics to accumulate
3. Check that metrics are being published
4. Verify alarm metric names match published metrics

### Permission Denied Errors

**Problem**: Lambda logs show CloudWatch permission errors

**Solutions**:
1. Check IAM role has `cloudwatch:PutMetricData` permission
2. Verify policy condition allows `StrandsAgent/Performance` namespace
3. Redeploy backend to apply IAM changes
4. Check CloudFormation stack for IAM policy resources

## Rollback Plan

If CloudWatch monitoring causes issues:

### Disable Alarms
```typescript
// In amplify/backend.ts
const strandsAgentAlarms = new StrandsAgentAlarms(backend.stack, 'StrandsAgentAlarms', {
  enabled: false // Disable alarms
});
```

### Remove Metrics Publishing
```python
# In lambda_handler.py
# Comment out metrics publishing
# publish_all_performance_metrics(...)
```

### Redeploy
```bash
npx ampx sandbox
```

## Success Criteria

Deployment is successful when:

- ✅ Lambda deploys without errors
- ✅ IAM permissions include CloudWatch
- ✅ All 4 alarms are created
- ✅ All 5 metrics appear in CloudWatch
- ✅ Dashboard is created and shows data
- ✅ Test script passes all checks
- ✅ No alarms in ALARM state (unless performance is degraded)

## Next Steps

After successful deployment:

1. **Monitor Performance**:
   - Check dashboard daily
   - Review alarm notifications
   - Track performance trends

2. **Adjust Thresholds**:
   - Based on actual performance data
   - Update alarm thresholds if needed
   - Document threshold changes

3. **Move to Task 12**:
   - Create comprehensive documentation
   - Document deployment process
   - Document troubleshooting steps

## Related Documentation

- [Task 11 Complete Summary](./TASK_11_CLOUDWATCH_MONITORING_COMPLETE.md)
- [CloudWatch Monitoring Quick Reference](./CLOUDWATCH_MONITORING_QUICK_REFERENCE.md)
- [Strands Agent Test Suite](./STRANDS_AGENT_TEST_SUITE.md)

## Deployment Log

Record your deployment:

```
Date: _______________
Deployed by: _______________
Sandbox URL: _______________
Function Name: _______________
Alarms Created: _______________
Dashboard URL: _______________
Issues: _______________
Resolution: _______________
```
