# Operations Runbook

## Overview

This runbook provides step-by-step procedures for common operational tasks in the AWS Energy Data Insights platform. Each procedure includes prerequisites, detailed steps, verification methods, and rollback instructions.

## Table of Contents

1. [User Management](#user-management)
2. [Deployment Operations](#deployment-operations)
3. [Incident Response](#incident-response)
4. [Performance Optimization](#performance-optimization)
5. [Data Management](#data-management)
6. [Monitoring and Alerting](#monitoring-and-alerting)
7. [Backup and Recovery](#backup-and-recovery)
8. [Security Operations](#security-operations)

---

## User Management

### Runbook: Create New User

**Purpose**: Add a new user to the Cognito User Pool

**Prerequisites**:
- AWS CLI configured with appropriate permissions
- Cognito User Pool ID

**Steps**:

1. Create user in Cognito
   ```bash
   aws cognito-idp admin-create-user \
     --user-pool-id us-east-1_XXXXXXX \
     --username user@example.com \
     --user-attributes Name=email,Value=user@example.com Name=email_verified,Value=true \
     --temporary-password TempPass123! \
     --message-action SUPPRESS
   ```

2. Set permanent password (optional)
   ```bash
   aws cognito-idp admin-set-user-password \
     --user-pool-id us-east-1_XXXXXXX \
     --username user@example.com \
     --password PermanentPass123! \
     --permanent
   ```

3. Add user to group (if applicable)
   ```bash
   aws cognito-idp admin-add-user-to-group \
     --user-pool-id us-east-1_XXXXXXX \
     --username user@example.com \
     --group-name Analysts
   ```

**Verification**:
```bash
aws cognito-idp admin-get-user \
  --user-pool-id us-east-1_XXXXXXX \
  --username user@example.com
```

**Rollback**:
```bash
aws cognito-idp admin-delete-user \
  --user-pool-id us-east-1_XXXXXXX \
  --username user@example.com
```

---

### Runbook: Reset User Password

**Purpose**: Reset a user's password when they're locked out

**Prerequisites**:
- User email address
- Cognito User Pool ID

**Steps**:

1. Initiate password reset
   ```bash
   aws cognito-idp admin-reset-user-password \
     --user-pool-id us-east-1_XXXXXXX \
     --username user@example.com
   ```

2. User will receive email with reset code

3. If user doesn't receive email, set temporary password manually
   ```bash
   aws cognito-idp admin-set-user-password \
     --user-pool-id us-east-1_XXXXXXX \
     --username user@example.com \
     --password TempPass123! \
     --temporary
   ```

**Verification**:
- User can sign in with new password
- User is prompted to change password on first sign-in

---

### Runbook: Disable User Account

**Purpose**: Temporarily disable a user account

**Prerequisites**:
- User email address
- Cognito User Pool ID

**Steps**:

1. Disable user
   ```bash
   aws cognito-idp admin-disable-user \
     --user-pool-id us-east-1_XXXXXXX \
     --username user@example.com
   ```

2. Verify user status
   ```bash
   aws cognito-idp admin-get-user \
     --user-pool-id us-east-1_XXXXXXX \
     --username user@example.com \
     | jq '.Enabled'
   ```

**Verification**:
- User cannot sign in
- Existing sessions are invalidated

**Rollback**:
```bash
aws cognito-idp admin-enable-user \
  --user-pool-id us-east-1_XXXXXXX \
  --username user@example.com
```

---

## Deployment Operations

### Runbook: Deploy Infrastructure Changes

**Purpose**: Deploy CDK infrastructure changes to production

**Prerequisites**:
- Code changes merged to main branch
- All tests passing
- Approval from team lead

**Steps**:

1. **Pre-deployment checks**
   ```bash
   # Verify current deployment
   cd cdk
   npx cdk diff --profile production
   
   # Review changes carefully
   # Ensure no unexpected resource deletions
   ```

2. **Create backup**
   ```bash
   # Export DynamoDB tables
   aws dynamodb create-backup \
     --table-name ChatMessage-prod \
     --backup-name pre-deployment-$(date +%Y%m%d-%H%M%S)
   
   aws dynamodb create-backup \
     --table-name ChatSession-prod \
     --backup-name pre-deployment-$(date +%Y%m%d-%H%M%S)
   ```

3. **Deploy infrastructure**
   ```bash
   npx cdk deploy --all --profile production --require-approval never
   ```

4. **Monitor deployment**
   ```bash
   # Watch CloudFormation events
   aws cloudformation describe-stack-events \
     --stack-name EnergyInsightsStack \
     --max-items 20 \
     --profile production
   ```

5. **Post-deployment verification**
   ```bash
   # Run smoke tests
   npm run test:smoke -- --env production
   
   # Check CloudWatch for errors
   aws logs tail /aws/lambda/chat --follow --profile production
   ```

6. **Monitor for 30 minutes**
   - Watch CloudWatch dashboard
   - Check error rates
   - Monitor API latency
   - Review user feedback

**Verification**:
- All CloudFormation stacks show UPDATE_COMPLETE
- Smoke tests pass
- No increase in error rates
- API latency within acceptable range

**Rollback**:
```bash
# Option 1: Rollback via CloudFormation
aws cloudformation rollback-stack \
  --stack-name EnergyInsightsStack \
  --profile production

# Option 2: Redeploy previous version
git checkout <previous-commit>
cd cdk
npx cdk deploy --all --profile production
```

---

### Runbook: Update Lambda Function Code

**Purpose**: Deploy code changes to a specific Lambda function

**Prerequisites**:
- Lambda function name
- New code package ready

**Steps**:

1. **Build deployment package**
   ```bash
   cd cdk/lambda-functions/chat
   npm install
   npm run build
   zip -r function.zip dist/ node_modules/
   ```

2. **Update function code**
   ```bash
   aws lambda update-function-code \
     --function-name chat-lambda \
     --zip-file fileb://function.zip \
     --profile production
   ```

3. **Wait for update to complete**
   ```bash
   aws lambda wait function-updated \
     --function-name chat-lambda \
     --profile production
   ```

4. **Verify new version**
   ```bash
   aws lambda get-function \
     --function-name chat-lambda \
     --profile production \
     | jq '.Configuration.LastModified'
   ```

5. **Test function**
   ```bash
   aws lambda invoke \
     --function-name chat-lambda \
     --payload '{"body":"{\"chatSessionId\":\"test\",\"message\":\"hello\"}"}' \
     --profile production \
     response.json
   ```

**Verification**:
- Function returns successful response
- No errors in CloudWatch logs
- Metrics show normal operation

**Rollback**:
```bash
# List previous versions
aws lambda list-versions-by-function \
  --function-name chat-lambda \
  --profile production

# Rollback to previous version
aws lambda update-function-code \
  --function-name chat-lambda \
  --s3-bucket lambda-deployments \
  --s3-key chat-lambda-previous.zip \
  --profile production
```

---

### Runbook: Update Environment Variables

**Purpose**: Update Lambda function environment variables

**Prerequisites**:
- Lambda function name
- New environment variable values

**Steps**:

1. **Get current configuration**
   ```bash
   aws lambda get-function-configuration \
     --function-name chat-lambda \
     --profile production \
     | jq '.Environment.Variables' > current-env.json
   ```

2. **Update environment variables**
   ```bash
   aws lambda update-function-configuration \
     --function-name chat-lambda \
     --environment Variables="{API_KEY=new-value,OTHER_VAR=value}" \
     --profile production
   ```

3. **Wait for update**
   ```bash
   aws lambda wait function-updated \
     --function-name chat-lambda \
     --profile production
   ```

4. **Verify update**
   ```bash
   aws lambda get-function-configuration \
     --function-name chat-lambda \
     --profile production \
     | jq '.Environment.Variables'
   ```

**Verification**:
- Environment variables show new values
- Function operates correctly with new values

**Rollback**:
```bash
# Restore previous environment variables
aws lambda update-function-configuration \
  --function-name chat-lambda \
  --environment file://current-env.json \
  --profile production
```

---

## Incident Response

### Runbook: API Gateway High Error Rate

**Severity**: P0 - Critical

**Symptoms**:
- API Gateway 5XX error rate > 5%
- Users unable to access application
- CloudWatch alarm triggered

**Immediate Actions**:

1. **Acknowledge incident**
   ```bash
   # Post in Slack
   # Acknowledge in PagerDuty
   ```

2. **Check API Gateway health**
   ```bash
   aws cloudwatch get-metric-statistics \
     --namespace AWS/ApiGateway \
     --metric-name 5XXError \
     --dimensions Name=ApiName,Value=energy-insights-api \
     --start-time $(date -u -d '15 minutes ago' +%Y-%m-%dT%H:%M:%S) \
     --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
     --period 60 \
     --statistics Sum
   ```

3. **Check Lambda backend**
   ```bash
   aws logs tail /aws/lambda/chat --follow | grep ERROR
   ```

4. **Identify root cause**
   - Recent deployment?
   - Lambda errors?
   - DynamoDB throttling?
   - External service outage?

5. **Mitigate**
   - If recent deployment: Rollback
   - If Lambda errors: Fix code or increase resources
   - If throttling: Increase capacity
   - If external service: Implement fallback

**Detailed Investigation**:

```bash
# Check recent deployments
aws cloudformation describe-stack-events \
  --stack-name EnergyInsightsStack \
  --max-items 50

# Check Lambda errors
aws logs filter-log-events \
  --log-group-name /aws/lambda/chat \
  --filter-pattern "ERROR" \
  --start-time $(date -u -d '1 hour ago' +%s)000

# Check DynamoDB throttling
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name UserErrors \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum
```

**Resolution Steps**:

1. Implement fix based on root cause
2. Deploy fix to production
3. Monitor for 30 minutes
4. Verify error rate returns to normal
5. Update incident ticket
6. Schedule post-mortem

**Post-Incident**:
- Document root cause
- Update monitoring/alerting
- Implement preventive measures
- Conduct post-mortem meeting

---

### Runbook: Lambda High Error Rate

**Severity**: P0 - Critical

**Symptoms**:
- Lambda error rate > 5%
- Specific functionality not working
- CloudWatch alarm triggered

**Immediate Actions**:

1. **Identify failing function**
   ```bash
   aws cloudwatch get-metric-statistics \
     --namespace AWS/Lambda \
     --metric-name Errors \
     --start-time $(date -u -d '15 minutes ago' +%Y-%m-%dT%H:%M:%S) \
     --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
     --period 60 \
     --statistics Sum
   ```

2. **Check error logs**
   ```bash
   aws logs tail /aws/lambda/FUNCTION_NAME --follow | grep ERROR
   ```

3. **Identify error pattern**
   - Specific error message?
   - Affecting all invocations or subset?
   - Started after deployment?

4. **Quick fixes**
   ```bash
   # If recent deployment, rollback
   aws lambda update-function-code \
     --function-name FUNCTION_NAME \
     --s3-bucket lambda-deployments \
     --s3-key FUNCTION_NAME-previous.zip
   
   # If environment variable issue, fix
   aws lambda update-function-configuration \
     --function-name FUNCTION_NAME \
     --environment Variables="{VAR=correct-value}"
   
   # If permission issue, add permission
   aws lambda add-permission \
     --function-name FUNCTION_NAME \
     --statement-id AllowS3Invoke \
     --action lambda:InvokeFunction \
     --principal s3.amazonaws.com
   ```

**Resolution**:
- Deploy fix
- Monitor error rate
- Verify functionality restored

---

### Runbook: DynamoDB Throttling

**Severity**: P0 - Critical

**Symptoms**:
- DynamoDB UserErrors > 0
- Slow application performance
- Timeout errors

**Immediate Actions**:

1. **Check throttling metrics**
   ```bash
   aws cloudwatch get-metric-statistics \
     --namespace AWS/DynamoDB \
     --metric-name UserErrors \
     --dimensions Name=TableName,Value=ChatMessage-prod \
     --start-time $(date -u -d '15 minutes ago' +%Y-%m-%dT%H:%M:%S) \
     --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
     --period 60 \
     --statistics Sum
   ```

2. **Check table capacity mode**
   ```bash
   aws dynamodb describe-table \
     --table-name ChatMessage-prod \
     | jq '.Table.BillingModeSummary'
   ```

3. **Temporary mitigation**
   ```bash
   # If provisioned mode, increase capacity
   aws dynamodb update-table \
     --table-name ChatMessage-prod \
     --provisioned-throughput ReadCapacityUnits=100,WriteCapacityUnits=100
   
   # Or switch to on-demand
   aws dynamodb update-table \
     --table-name ChatMessage-prod \
     --billing-mode PAY_PER_REQUEST
   ```

4. **Verify resolution**
   ```bash
   # Check if throttling stopped
   aws cloudwatch get-metric-statistics \
     --namespace AWS/DynamoDB \
     --metric-name UserErrors \
     --dimensions Name=TableName,Value=ChatMessage-prod \
     --start-time $(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%S) \
     --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
     --period 60 \
     --statistics Sum
   ```

**Long-term Solution**:
- Analyze access patterns
- Optimize queries
- Implement caching
- Enable auto-scaling

---

## Performance Optimization

### Runbook: Optimize Lambda Cold Starts

**Purpose**: Reduce Lambda cold start latency

**Steps**:

1. **Measure current cold start time**
   ```bash
   aws logs filter-log-events \
     --log-group-name /aws/lambda/chat \
     --filter-pattern "REPORT" \
     | jq '.events[].message' \
     | grep "Init Duration"
   ```

2. **Enable provisioned concurrency**
   ```bash
   aws lambda put-provisioned-concurrency-config \
     --function-name chat-lambda \
     --provisioned-concurrent-executions 5 \
     --qualifier $LATEST
   ```

3. **Optimize package size**
   ```bash
   # Remove unnecessary dependencies
   npm prune --production
   
   # Use webpack to bundle
   webpack --mode production
   
   # Check package size
   du -sh function.zip
   ```

4. **Use ARM64 architecture**
   ```bash
   aws lambda update-function-configuration \
     --function-name chat-lambda \
     --architectures arm64
   ```

**Verification**:
- Cold start time reduced
- Application feels more responsive

---

### Runbook: Optimize DynamoDB Queries

**Purpose**: Improve query performance and reduce costs

**Steps**:

1. **Analyze query patterns**
   ```bash
   # Enable CloudWatch Contributor Insights
   aws dynamodb update-contributor-insights \
     --table-name ChatMessage-prod \
     --contributor-insights-action ENABLE
   ```

2. **Identify slow queries**
   ```bash
   aws logs filter-log-events \
     --log-group-name /aws/lambda/chat \
     --filter-pattern "DynamoDB query" \
     | jq '.events[].message'
   ```

3. **Add Global Secondary Index if needed**
   ```bash
   aws dynamodb update-table \
     --table-name ChatMessage-prod \
     --attribute-definitions AttributeName=userId,AttributeType=S \
     --global-secondary-index-updates \
       '[{"Create":{"IndexName":"userId-index","KeySchema":[{"AttributeName":"userId","KeyType":"HASH"}],"Projection":{"ProjectionType":"ALL"}}}]'
   ```

4. **Implement query result caching**
   ```typescript
   // In Lambda code
   const cache = new Map();
   
   async function getCachedMessages(sessionId: string) {
     if (cache.has(sessionId)) {
       return cache.get(sessionId);
     }
     
     const messages = await queryDynamoDB(sessionId);
     cache.set(sessionId, messages);
     return messages;
   }
   ```

**Verification**:
- Query latency reduced
- Read capacity consumption decreased

---

## Data Management

### Runbook: Clean Up Old Artifacts

**Purpose**: Remove old S3 artifacts to reduce storage costs

**Steps**:

1. **List old artifacts**
   ```bash
   aws s3 ls s3://storage-bucket/renewable-projects/ --recursive \
     | awk '$1 < "'$(date -d '90 days ago' +%Y-%m-%d)'" {print $4}'
   ```

2. **Create lifecycle policy**
   ```bash
   cat > lifecycle-policy.json <<EOF
   {
     "Rules": [
       {
         "Id": "DeleteOldArtifacts",
         "Status": "Enabled",
         "Prefix": "renewable-projects/",
         "Expiration": {
           "Days": 90
         }
       },
       {
         "Id": "TransitionToGlacier",
         "Status": "Enabled",
         "Prefix": "renewable-projects/",
         "Transitions": [
           {
             "Days": 30,
             "StorageClass": "GLACIER"
           }
         ]
       }
     ]
   }
   EOF
   
   aws s3api put-bucket-lifecycle-configuration \
     --bucket storage-bucket \
     --lifecycle-configuration file://lifecycle-policy.json
   ```

3. **Verify policy**
   ```bash
   aws s3api get-bucket-lifecycle-configuration \
     --bucket storage-bucket
   ```

**Verification**:
- Lifecycle policy active
- Old artifacts automatically deleted

---

### Runbook: Export DynamoDB Data

**Purpose**: Export DynamoDB table data for analysis or backup

**Steps**:

1. **Export to S3**
   ```bash
   aws dynamodb export-table-to-point-in-time \
     --table-arn arn:aws:dynamodb:us-east-1:ACCOUNT_ID:table/ChatMessage-prod \
     --s3-bucket dynamodb-exports \
     --s3-prefix exports/$(date +%Y%m%d) \
     --export-format DYNAMODB_JSON
   ```

2. **Monitor export**
   ```bash
   aws dynamodb describe-export \
     --export-arn <EXPORT_ARN>
   ```

3. **Download exported data**
   ```bash
   aws s3 sync s3://dynamodb-exports/exports/$(date +%Y%m%d)/ ./exports/
   ```

**Verification**:
- Export completes successfully
- Data files available in S3

---

## Monitoring and Alerting

### Runbook: Create Custom CloudWatch Dashboard

**Purpose**: Create a custom dashboard for specific monitoring needs

**Steps**:

1. **Define dashboard JSON**
   ```bash
   cat > custom-dashboard.json <<EOF
   {
     "widgets": [
       {
         "type": "metric",
         "properties": {
           "metrics": [
             ["AWS/Lambda", "Invocations", {"stat": "Sum"}]
           ],
           "period": 300,
           "stat": "Sum",
           "region": "us-east-1",
           "title": "Lambda Invocations"
         }
       }
     ]
   }
   EOF
   ```

2. **Create dashboard**
   ```bash
   aws cloudwatch put-dashboard \
     --dashboard-name CustomDashboard \
     --dashboard-body file://custom-dashboard.json
   ```

3. **Verify dashboard**
   ```bash
   aws cloudwatch get-dashboard \
     --dashboard-name CustomDashboard
   ```

**Verification**:
- Dashboard visible in CloudWatch console
- Metrics displaying correctly

---

## Backup and Recovery

### Runbook: Create DynamoDB Backup

**Purpose**: Create on-demand backup of DynamoDB table

**Steps**:

1. **Create backup**
   ```bash
   aws dynamodb create-backup \
     --table-name ChatMessage-prod \
     --backup-name manual-backup-$(date +%Y%m%d-%H%M%S)
   ```

2. **Monitor backup**
   ```bash
   aws dynamodb describe-backup \
     --backup-arn <BACKUP_ARN>
   ```

3. **List all backups**
   ```bash
   aws dynamodb list-backups \
     --table-name ChatMessage-prod
   ```

**Verification**:
- Backup status shows AVAILABLE
- Backup size matches table size

---

### Runbook: Restore DynamoDB from Backup

**Purpose**: Restore DynamoDB table from backup

**Steps**:

1. **List available backups**
   ```bash
   aws dynamodb list-backups \
     --table-name ChatMessage-prod
   ```

2. **Restore to new table**
   ```bash
   aws dynamodb restore-table-from-backup \
     --target-table-name ChatMessage-restored \
     --backup-arn <BACKUP_ARN>
   ```

3. **Monitor restore**
   ```bash
   aws dynamodb describe-table \
     --table-name ChatMessage-restored
   ```

4. **Verify data**
   ```bash
   aws dynamodb scan \
     --table-name ChatMessage-restored \
     --max-items 10
   ```

**Verification**:
- Table status shows ACTIVE
- Data matches expected state

---

## Security Operations

### Runbook: Rotate API Keys

**Purpose**: Rotate API keys stored in Secrets Manager

**Steps**:

1. **Generate new key**
   ```bash
   NEW_KEY=$(openssl rand -base64 32)
   ```

2. **Update secret**
   ```bash
   aws secretsmanager update-secret \
     --secret-id api-keys/bedrock \
     --secret-string "{\"api_key\":\"$NEW_KEY\"}"
   ```

3. **Update Lambda environment variables**
   ```bash
   aws lambda update-function-configuration \
     --function-name chat-lambda \
     --environment Variables="{API_KEY=$NEW_KEY}"
   ```

4. **Verify new key works**
   ```bash
   # Test Lambda function
   aws lambda invoke \
     --function-name chat-lambda \
     --payload '{"test":"true"}' \
     response.json
   ```

**Verification**:
- Lambda function works with new key
- No authentication errors

---

### Runbook: Review IAM Permissions

**Purpose**: Audit and optimize IAM permissions

**Steps**:

1. **List Lambda execution roles**
   ```bash
   aws lambda list-functions \
     | jq '.Functions[].Role'
   ```

2. **Get role policies**
   ```bash
   aws iam get-role-policy \
     --role-name ChatLambdaRole \
     --policy-name ChatLambdaPolicy
   ```

3. **Analyze permissions**
   ```bash
   # Use IAM Access Analyzer
   aws accessanalyzer create-analyzer \
     --analyzer-name security-audit \
     --type ACCOUNT
   ```

4. **Remove unnecessary permissions**
   ```bash
   # Update policy with minimal permissions
   aws iam put-role-policy \
     --role-name ChatLambdaRole \
     --policy-name ChatLambdaPolicy \
     --policy-document file://minimal-policy.json
   ```

**Verification**:
- All functions work with updated permissions
- No permission denied errors

---

## Emergency Procedures

### Complete System Outage

1. **Assess scope**
   - Check AWS Service Health Dashboard
   - Verify all services down or partial
   - Identify affected regions

2. **Communicate**
   - Post status page update
   - Notify users via email
   - Update Slack channels

3. **Investigate**
   - Check recent deployments
   - Review CloudWatch logs
   - Check AWS service status

4. **Mitigate**
   - Rollback recent changes
   - Failover to backup region (if available)
   - Implement emergency fixes

5. **Restore**
   - Verify all services operational
   - Run comprehensive tests
   - Monitor for 1 hour

6. **Post-incident**
   - Write detailed incident report
   - Conduct post-mortem
   - Implement preventive measures

---

**Last Updated**: January 2025  
**Maintained By**: DevOps Team
