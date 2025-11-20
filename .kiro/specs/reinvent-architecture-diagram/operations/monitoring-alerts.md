# Monitoring and Alert Configurations

## Overview

This document defines CloudWatch alarms, alert thresholds, and notification configurations for the AWS Energy Data Insights platform. Alerts are categorized by severity and routed to appropriate channels.

## Alert Severity Levels

| Severity | Response Time | Notification Channel | Escalation |
|----------|---------------|---------------------|------------|
| **P0 - Critical** | 15 minutes | PagerDuty + Slack + Email | Immediate |
| **P1 - High** | 1 hour | Slack + Email | After 2 hours |
| **P2 - Medium** | 4 hours | Slack | After 8 hours |
| **P3 - Low** | 24 hours | Email | None |

## CloudWatch Alarms

### API Gateway Alarms

#### High Error Rate (P0)

```json
{
  "AlarmName": "API-Gateway-High-Error-Rate",
  "AlarmDescription": "API Gateway error rate exceeds 5% for 5 minutes",
  "MetricName": "5XXError",
  "Namespace": "AWS/ApiGateway",
  "Statistic": "Sum",
  "Period": 300,
  "EvaluationPeriods": 1,
  "Threshold": 5.0,
  "ComparisonOperator": "GreaterThanThreshold",
  "TreatMissingData": "notBreaching",
  "ActionsEnabled": true,
  "AlarmActions": [
    "arn:aws:sns:us-east-1:ACCOUNT_ID:critical-alerts"
  ]
}
```

**Runbook**: [API Gateway High Error Rate](#runbook-api-gateway-high-error-rate)

#### High Latency (P1)

```json
{
  "AlarmName": "API-Gateway-High-Latency",
  "AlarmDescription": "API Gateway p95 latency exceeds 10 seconds",
  "Metrics": [
    {
      "Id": "m1",
      "ReturnData": false,
      "MetricStat": {
        "Metric": {
          "Namespace": "AWS/ApiGateway",
          "MetricName": "Latency",
          "Dimensions": [
            {
              "Name": "ApiName",
              "Value": "energy-insights-api"
            }
          ]
        },
        "Period": 300,
        "Stat": "p95"
      }
    }
  ],
  "EvaluationPeriods": 2,
  "Threshold": 10000,
  "ComparisonOperator": "GreaterThanThreshold",
  "AlarmActions": [
    "arn:aws:sns:us-east-1:ACCOUNT_ID:high-priority-alerts"
  ]
}
```

**Runbook**: [API Gateway High Latency](#runbook-api-gateway-high-latency)

### Lambda Function Alarms

#### Chat Lambda Errors (P0)

```json
{
  "AlarmName": "Chat-Lambda-High-Errors",
  "AlarmDescription": "Chat Lambda error rate exceeds 5%",
  "Metrics": [
    {
      "Id": "e1",
      "Expression": "m1/m2*100",
      "Label": "Error Rate"
    },
    {
      "Id": "m1",
      "ReturnData": false,
      "MetricStat": {
        "Metric": {
          "Namespace": "AWS/Lambda",
          "MetricName": "Errors",
          "Dimensions": [
            {
              "Name": "FunctionName",
              "Value": "chat-lambda"
            }
          ]
        },
        "Period": 300,
        "Stat": "Sum"
      }
    },
    {
      "Id": "m2",
      "ReturnData": false,
      "MetricStat": {
        "Metric": {
          "Namespace": "AWS/Lambda",
          "MetricName": "Invocations",
          "Dimensions": [
            {
              "Name": "FunctionName",
              "Value": "chat-lambda"
            }
          ]
        },
        "Period": 300,
        "Stat": "Sum"
      }
    }
  ],
  "EvaluationPeriods": 1,
  "Threshold": 5.0,
  "ComparisonOperator": "GreaterThanThreshold",
  "AlarmActions": [
    "arn:aws:sns:us-east-1:ACCOUNT_ID:critical-alerts"
  ]
}
```

**Runbook**: [Lambda High Error Rate](#runbook-lambda-high-error-rate)

#### Lambda Throttling (P1)

```json
{
  "AlarmName": "Lambda-Throttling",
  "AlarmDescription": "Lambda functions being throttled",
  "MetricName": "Throttles",
  "Namespace": "AWS/Lambda",
  "Statistic": "Sum",
  "Period": 300,
  "EvaluationPeriods": 1,
  "Threshold": 10,
  "ComparisonOperator": "GreaterThanThreshold",
  "AlarmActions": [
    "arn:aws:sns:us-east-1:ACCOUNT_ID:high-priority-alerts"
  ]
}
```

**Runbook**: [Lambda Throttling](#runbook-lambda-throttling)

#### Lambda Duration (P2)

```json
{
  "AlarmName": "Lambda-High-Duration",
  "AlarmDescription": "Lambda p95 duration exceeds 30 seconds",
  "MetricName": "Duration",
  "Namespace": "AWS/Lambda",
  "Statistic": "p95",
  "Period": 300,
  "EvaluationPeriods": 2,
  "Threshold": 30000,
  "ComparisonOperator": "GreaterThanThreshold",
  "AlarmActions": [
    "arn:aws:sns:us-east-1:ACCOUNT_ID:medium-priority-alerts"
  ]
}
```

**Runbook**: [Lambda High Duration](#runbook-lambda-high-duration)

### DynamoDB Alarms

#### DynamoDB Throttling (P0)

```json
{
  "AlarmName": "DynamoDB-Throttling",
  "AlarmDescription": "DynamoDB requests being throttled",
  "MetricName": "UserErrors",
  "Namespace": "AWS/DynamoDB",
  "Statistic": "Sum",
  "Period": 300,
  "EvaluationPeriods": 1,
  "Threshold": 1,
  "ComparisonOperator": "GreaterThanThreshold",
  "AlarmActions": [
    "arn:aws:sns:us-east-1:ACCOUNT_ID:critical-alerts"
  ]
}
```

**Runbook**: [DynamoDB Throttling](#runbook-dynamodb-throttling)

#### DynamoDB System Errors (P0)

```json
{
  "AlarmName": "DynamoDB-System-Errors",
  "AlarmDescription": "DynamoDB system errors detected",
  "MetricName": "SystemErrors",
  "Namespace": "AWS/DynamoDB",
  "Statistic": "Sum",
  "Period": 300,
  "EvaluationPeriods": 1,
  "Threshold": 1,
  "ComparisonOperator": "GreaterThanThreshold",
  "AlarmActions": [
    "arn:aws:sns:us-east-1:ACCOUNT_ID:critical-alerts"
  ]
}
```

**Runbook**: [DynamoDB System Errors](#runbook-dynamodb-system-errors)

### S3 Alarms

#### S3 High Error Rate (P1)

```json
{
  "AlarmName": "S3-High-Error-Rate",
  "AlarmDescription": "S3 error rate exceeds 5%",
  "Metrics": [
    {
      "Id": "e1",
      "Expression": "(m1+m2)/m3*100",
      "Label": "Error Rate"
    },
    {
      "Id": "m1",
      "ReturnData": false,
      "MetricStat": {
        "Metric": {
          "Namespace": "AWS/S3",
          "MetricName": "4xxErrors"
        },
        "Period": 300,
        "Stat": "Sum"
      }
    },
    {
      "Id": "m2",
      "ReturnData": false,
      "MetricStat": {
        "Metric": {
          "Namespace": "AWS/S3",
          "MetricName": "5xxErrors"
        },
        "Period": 300,
        "Stat": "Sum"
      }
    },
    {
      "Id": "m3",
      "ReturnData": false,
      "MetricStat": {
        "Metric": {
          "Namespace": "AWS/S3",
          "MetricName": "AllRequests"
        },
        "Period": 300,
        "Stat": "Sum"
      }
    }
  ],
  "EvaluationPeriods": 2,
  "Threshold": 5.0,
  "ComparisonOperator": "GreaterThanThreshold",
  "AlarmActions": [
    "arn:aws:sns:us-east-1:ACCOUNT_ID:high-priority-alerts"
  ]
}
```

**Runbook**: [S3 High Error Rate](#runbook-s3-high-error-rate)

### Cost Alarms

#### Daily Cost Anomaly (P1)

```json
{
  "AlarmName": "Daily-Cost-Anomaly",
  "AlarmDescription": "Daily AWS costs exceed $50",
  "MetricName": "EstimatedCharges",
  "Namespace": "AWS/Billing",
  "Statistic": "Maximum",
  "Period": 86400,
  "EvaluationPeriods": 1,
  "Threshold": 50.0,
  "ComparisonOperator": "GreaterThanThreshold",
  "Dimensions": [
    {
      "Name": "Currency",
      "Value": "USD"
    }
  ],
  "AlarmActions": [
    "arn:aws:sns:us-east-1:ACCOUNT_ID:cost-alerts"
  ]
}
```

**Runbook**: [Cost Anomaly Investigation](#runbook-cost-anomaly)

## Custom Metrics and Alarms

### Agent Success Rate (P1)

**Custom Metric**:
```typescript
// In Lambda function
await cloudwatch.putMetricData({
  Namespace: 'EnergyInsights/Agents',
  MetricData: [
    {
      MetricName: 'AgentSuccessRate',
      Value: successRate,
      Unit: 'Percent',
      Dimensions: [
        { Name: 'AgentType', Value: agentType }
      ]
    }
  ]
}).promise();
```

**Alarm**:
```json
{
  "AlarmName": "Agent-Low-Success-Rate",
  "AlarmDescription": "Agent success rate below 90%",
  "MetricName": "AgentSuccessRate",
  "Namespace": "EnergyInsights/Agents",
  "Statistic": "Average",
  "Period": 300,
  "EvaluationPeriods": 2,
  "Threshold": 90.0,
  "ComparisonOperator": "LessThanThreshold",
  "AlarmActions": [
    "arn:aws:sns:us-east-1:ACCOUNT_ID:high-priority-alerts"
  ]
}
```

### Artifact Generation Failures (P2)

**Custom Metric**:
```typescript
await cloudwatch.putMetricData({
  Namespace: 'EnergyInsights/Artifacts',
  MetricData: [
    {
      MetricName: 'ArtifactGenerationFailures',
      Value: 1,
      Unit: 'Count',
      Dimensions: [
        { Name: 'ArtifactType', Value: artifactType }
      ]
    }
  ]
}).promise();
```

**Alarm**:
```json
{
  "AlarmName": "Artifact-Generation-Failures",
  "AlarmDescription": "High rate of artifact generation failures",
  "MetricName": "ArtifactGenerationFailures",
  "Namespace": "EnergyInsights/Artifacts",
  "Statistic": "Sum",
  "Period": 300,
  "EvaluationPeriods": 1,
  "Threshold": 10,
  "ComparisonOperator": "GreaterThanThreshold",
  "AlarmActions": [
    "arn:aws:sns:us-east-1:ACCOUNT_ID:medium-priority-alerts"
  ]
}
```

## SNS Topics and Subscriptions

### Critical Alerts Topic

```bash
# Create SNS topic
aws sns create-topic --name critical-alerts

# Subscribe PagerDuty
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT_ID:critical-alerts \
  --protocol https \
  --notification-endpoint https://events.pagerduty.com/integration/YOUR_KEY/enqueue

# Subscribe Slack
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT_ID:critical-alerts \
  --protocol lambda \
  --notification-endpoint arn:aws:lambda:us-east-1:ACCOUNT_ID:slack-notifier

# Subscribe email
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT_ID:critical-alerts \
  --protocol email \
  --notification-endpoint oncall@example.com
```

### High Priority Alerts Topic

```bash
aws sns create-topic --name high-priority-alerts

aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT_ID:high-priority-alerts \
  --protocol lambda \
  --notification-endpoint arn:aws:lambda:us-east-1:ACCOUNT_ID:slack-notifier

aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT_ID:high-priority-alerts \
  --protocol email \
  --notification-endpoint team@example.com
```

### Medium Priority Alerts Topic

```bash
aws sns create-topic --name medium-priority-alerts

aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT_ID:medium-priority-alerts \
  --protocol lambda \
  --notification-endpoint arn:aws:lambda:us-east-1:ACCOUNT_ID:slack-notifier
```

## Log-Based Alarms

### Error Pattern Detection

**Metric Filter**:
```json
{
  "filterName": "ErrorPatternFilter",
  "filterPattern": "[time, request_id, level = ERROR*, ...]",
  "logGroupName": "/aws/lambda/chat",
  "metricTransformations": [
    {
      "metricName": "ErrorCount",
      "metricNamespace": "EnergyInsights/Logs",
      "metricValue": "1",
      "defaultValue": 0
    }
  ]
}
```

**Alarm**:
```json
{
  "AlarmName": "High-Error-Log-Count",
  "AlarmDescription": "High number of ERROR logs detected",
  "MetricName": "ErrorCount",
  "Namespace": "EnergyInsights/Logs",
  "Statistic": "Sum",
  "Period": 300,
  "EvaluationPeriods": 1,
  "Threshold": 50,
  "ComparisonOperator": "GreaterThanThreshold",
  "AlarmActions": [
    "arn:aws:sns:us-east-1:ACCOUNT_ID:high-priority-alerts"
  ]
}
```

### Timeout Pattern Detection

**Metric Filter**:
```json
{
  "filterName": "TimeoutPatternFilter",
  "filterPattern": "[time, request_id, level, msg = *timeout* || msg = *timed?out*]",
  "logGroupName": "/aws/lambda/chat",
  "metricTransformations": [
    {
      "metricName": "TimeoutCount",
      "metricNamespace": "EnergyInsights/Logs",
      "metricValue": "1",
      "defaultValue": 0
    }
  ]
}
```

## Composite Alarms

### Service Health Composite Alarm (P0)

```json
{
  "AlarmName": "Service-Health-Composite",
  "AlarmDescription": "Overall service health degraded",
  "AlarmRule": "ALARM(API-Gateway-High-Error-Rate) OR ALARM(Chat-Lambda-High-Errors) OR ALARM(DynamoDB-Throttling)",
  "ActionsEnabled": true,
  "AlarmActions": [
    "arn:aws:sns:us-east-1:ACCOUNT_ID:critical-alerts"
  ]
}
```

## Alert Notification Templates

### Slack Notification Format

```json
{
  "channel": "#energy-insights-alerts",
  "username": "CloudWatch Alerts",
  "icon_emoji": ":warning:",
  "attachments": [
    {
      "color": "danger",
      "title": "🚨 CRITICAL: API Gateway High Error Rate",
      "text": "API Gateway error rate has exceeded 5% for 5 minutes",
      "fields": [
        {
          "title": "Alarm",
          "value": "API-Gateway-High-Error-Rate",
          "short": true
        },
        {
          "title": "Severity",
          "value": "P0 - Critical",
          "short": true
        },
        {
          "title": "Current Value",
          "value": "7.3%",
          "short": true
        },
        {
          "title": "Threshold",
          "value": "5.0%",
          "short": true
        },
        {
          "title": "Runbook",
          "value": "<https://wiki.example.com/runbooks/api-gateway-errors|View Runbook>",
          "short": false
        }
      ],
      "footer": "AWS CloudWatch",
      "ts": 1234567890
    }
  ]
}
```

### Email Notification Format

```
Subject: [P0 CRITICAL] API Gateway High Error Rate

Alert Details:
--------------
Alarm Name: API-Gateway-High-Error-Rate
Severity: P0 - Critical
Description: API Gateway error rate has exceeded 5% for 5 minutes

Metrics:
--------
Current Value: 7.3%
Threshold: 5.0%
Duration: 5 minutes

Actions Required:
-----------------
1. Check CloudWatch dashboard: https://console.aws.amazon.com/cloudwatch/
2. Review recent deployments
3. Check Lambda error logs
4. Follow runbook: https://wiki.example.com/runbooks/api-gateway-errors

Escalation:
-----------
If not resolved in 15 minutes, escalate to on-call engineer.

Contact: oncall@example.com
PagerDuty: https://example.pagerduty.com
```

## Monitoring Best Practices

1. **Set Appropriate Thresholds**: Based on historical data and SLOs
2. **Avoid Alert Fatigue**: Only alert on actionable issues
3. **Include Runbooks**: Every alert should link to resolution steps
4. **Test Alerts**: Regularly test alert delivery and escalation
5. **Review and Adjust**: Monthly review of alert effectiveness
6. **Use Composite Alarms**: Reduce noise by combining related alarms
7. **Monitor Costs**: Set budget alerts to avoid surprises
8. **Log Everything**: Comprehensive logging for troubleshooting
9. **Automate Responses**: Use Lambda for auto-remediation where possible
10. **Document Incidents**: Post-mortem for all P0/P1 incidents

## Alert Response Procedures

### P0 - Critical Alert Response

1. **Acknowledge** (within 15 minutes)
   - Acknowledge in PagerDuty
   - Post in #energy-insights-ops Slack channel
   - Notify team lead

2. **Assess** (within 30 minutes)
   - Check CloudWatch dashboard
   - Review recent changes
   - Identify scope of impact

3. **Mitigate** (within 1 hour)
   - Follow runbook procedures
   - Implement temporary fix if needed
   - Rollback if recent deployment

4. **Resolve** (within 2 hours)
   - Implement permanent fix
   - Verify resolution
   - Monitor for 30 minutes

5. **Document** (within 24 hours)
   - Write incident report
   - Update runbooks
   - Schedule post-mortem

### P1 - High Priority Alert Response

1. **Acknowledge** (within 1 hour)
2. **Assess** (within 2 hours)
3. **Mitigate** (within 4 hours)
4. **Resolve** (within 8 hours)
5. **Document** (within 48 hours)

---

**Last Updated**: January 2025  
**Maintained By**: DevOps Team
