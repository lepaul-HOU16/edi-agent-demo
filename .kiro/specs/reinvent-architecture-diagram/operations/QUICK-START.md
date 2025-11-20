# Operations Quick Start Guide

## Essential Commands

### Check System Health

```bash
# API Gateway health
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApiGateway \
  --metric-name Count \
  --start-time $(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum

# Lambda errors
aws logs filter-log-events \
  --log-group-name /aws/lambda/chat \
  --filter-pattern "ERROR" \
  --start-time $(date -u -d '15 minutes ago' +%s)000

# DynamoDB throttling
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name UserErrors \
  --start-time $(date -u -d '15 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum
```

### Deploy Changes

```bash
# Deploy infrastructure
cd cdk
npx cdk deploy --all --profile production

# Update Lambda function
aws lambda update-function-code \
  --function-name FUNCTION_NAME \
  --zip-file fileb://function.zip

# Update environment variable
aws lambda update-function-configuration \
  --function-name FUNCTION_NAME \
  --environment Variables="{KEY=value}"
```

### User Management

```bash
# Create user
aws cognito-idp admin-create-user \
  --user-pool-id us-east-1_XXXXXXX \
  --username user@example.com \
  --user-attributes Name=email,Value=user@example.com

# Reset password
aws cognito-idp admin-reset-user-password \
  --user-pool-id us-east-1_XXXXXXX \
  --username user@example.com

# Disable user
aws cognito-idp admin-disable-user \
  --user-pool-id us-east-1_XXXXXXX \
  --username user@example.com
```

### Troubleshooting

```bash
# View Lambda logs
aws logs tail /aws/lambda/FUNCTION_NAME --follow

# Test Lambda function
aws lambda invoke \
  --function-name FUNCTION_NAME \
  --payload '{"test":"data"}' \
  response.json

# Query DynamoDB
aws dynamodb query \
  --table-name ChatMessage-prod \
  --key-condition-expression "id = :id" \
  --expression-attribute-values '{":id":{"S":"MESSAGE_ID"}}'

# Check S3 artifacts
aws s3 ls s3://storage-bucket/renewable-projects/ --recursive
```

### Backup and Recovery

```bash
# Create DynamoDB backup
aws dynamodb create-backup \
  --table-name ChatMessage-prod \
  --backup-name backup-$(date +%Y%m%d-%H%M%S)

# Restore from backup
aws dynamodb restore-table-from-backup \
  --target-table-name ChatMessage-restored \
  --backup-arn BACKUP_ARN

# Export to S3
aws dynamodb export-table-to-point-in-time \
  --table-arn TABLE_ARN \
  --s3-bucket exports-bucket \
  --export-format DYNAMODB_JSON
```

## Emergency Contacts

- **On-Call Engineer**: +1-555-0100
- **DevOps Team**: devops@example.com
- **Slack**: #energy-insights-ops
- **PagerDuty**: https://example.pagerduty.com

## Quick Links

- [CloudWatch Dashboard](https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=EnergyInsights)
- [Lambda Functions](https://console.aws.amazon.com/lambda/home?region=us-east-1)
- [DynamoDB Tables](https://console.aws.amazon.com/dynamodb/home?region=us-east-1)
- [S3 Buckets](https://console.aws.amazon.com/s3/home?region=us-east-1)
- [Cognito User Pools](https://console.aws.amazon.com/cognito/home?region=us-east-1)

## Severity Levels

| Level | Response Time | Action |
|-------|---------------|--------|
| P0 - Critical | 15 minutes | Page on-call engineer |
| P1 - High | 1 hour | Notify team in Slack |
| P2 - Medium | 4 hours | Create ticket |
| P3 - Low | 24 hours | Add to backlog |

## Common Issues

### Users Can't Sign In
1. Check Cognito user status
2. Verify API Gateway health
3. Check Lambda authorizer logs

### API Errors
1. Check Lambda function logs
2. Verify recent deployments
3. Check DynamoDB throttling

### Slow Performance
1. Check Lambda duration metrics
2. Review DynamoDB query patterns
3. Check for cold starts

### Artifacts Not Displaying
1. Verify S3 upload succeeded
2. Check CORS configuration
3. Verify artifact metadata in DynamoDB

## Rollback Procedures

### Infrastructure Rollback
```bash
aws cloudformation rollback-stack \
  --stack-name EnergyInsightsStack
```

### Lambda Rollback
```bash
aws lambda update-function-code \
  --function-name FUNCTION_NAME \
  --s3-bucket lambda-deployments \
  --s3-key FUNCTION_NAME-previous.zip
```

### Environment Variable Rollback
```bash
aws lambda update-function-configuration \
  --function-name FUNCTION_NAME \
  --environment file://previous-env.json
```

---

**For detailed procedures, see**:
- [Deployment Pipeline](./deployment-pipeline.md)
- [Monitoring Alerts](./monitoring-alerts.md)
- [Troubleshooting Tree](./troubleshooting-tree.md)
- [Operations Runbook](./operations-runbook.md)
