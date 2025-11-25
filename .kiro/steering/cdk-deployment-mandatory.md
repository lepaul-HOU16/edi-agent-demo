# CDK DEPLOYMENT - MANDATORY PROTOCOL

## CRITICAL RULE: CODE CHANGES DO NOT AUTO-DEPLOY

**THIS PROJECT USES AWS CDK. CHANGES TO CODE DO NOT AUTOMATICALLY DEPLOY TO AWS.**

## THE PROBLEM THAT KEEPS REPEATING

Every single fix follows this pattern:
1. Make code changes
2. Claim "fix is deployed"
3. User tests - NOTHING CHANGED
4. Discover code was never deployed
5. Waste hours rediscovering the same deployment issue

**THIS MUST STOP NOW.**

## MANDATORY DEPLOYMENT PROTOCOL

### AFTER EVERY CODE CHANGE TO CDK LAMBDA FUNCTIONS:

```bash
# 1. Navigate to CDK directory
cd cdk

# 2. Build ALL Lambda functions
npm run build:all

# 3. Deploy to AWS
cdk deploy --all --require-approval never

# 4. Wait for deployment to complete (5-10 minutes)
# DO NOT PROCEED until you see "✅ Stack deployed successfully"

# 5. Verify deployment timestamp
aws lambda get-function --function-name EnergyInsights-development-chat \
  --query 'Configuration.LastModified' --output text
```

### FILES THAT REQUIRE CDK DEPLOYMENT:

- `cdk/lambda-functions/chat/**/*` - Chat Lambda
- `cdk/lambda-functions/renewable-orchestrator/**/*` - Orchestrator
- `cdk/lambda-functions/renewable-tools/**/*` - Tool Lambdas
- `cdk/lambda-functions/authorizer/**/*` - Authorizer
- `cdk/lib/**/*` - Infrastructure changes
- `cdk/package.json` - Dependency changes

**IF YOU CHANGE ANY OF THESE FILES, YOU MUST RUN CDK DEPLOY.**

## VERIFICATION CHECKLIST

Before claiming a fix is deployed:

```bash
# ✅ 1. Code changes committed
git status

# ✅ 2. Lambda functions built
ls -la cdk/lambda-functions/chat/dist/
ls -la cdk/lambda-functions/renewable-orchestrator/dist/

# ✅ 3. CDK deployed
# Check CloudFormation console or run:
aws cloudformation describe-stacks --stack-name EnergyInsights-development

# ✅ 4. Lambda updated (check timestamp is recent)
aws lambda get-function --function-name EnergyInsights-development-chat \
  --query 'Configuration.LastModified'

# ✅ 5. Test the actual deployed Lambda
# Run integration test or invoke Lambda directly
```

## COMMON MISTAKES TO AVOID

### ❌ MISTAKE 1: "I changed the code, it should work now"
**REALITY**: Code changes in your editor do NOT deploy to AWS automatically.

### ❌ MISTAKE 2: "I ran npm run build, it's deployed"
**REALITY**: Building locally does NOT deploy to AWS. You must run `cdk deploy`.

### ❌ MISTAKE 3: "The test passed locally, so it's fixed"
**REALITY**: Local tests use local code. AWS uses deployed code. They are different.

### ❌ MISTAKE 4: "I deployed yesterday, the changes should be there"
**REALITY**: Each code change requires a new deployment. Old deployments don't include new changes.

### ❌ MISTAKE 5: "The deployment said 'no changes', so it's deployed"
**REALITY**: If CDK says "no changes", your build didn't run or code wasn't updated.

## THE DEPLOYMENT WORKFLOW

```
1. Make code changes
   ↓
2. cd cdk && npm run build:all
   ↓
3. cdk deploy --all --require-approval never
   ↓
4. Wait 5-10 minutes for deployment
   ↓
5. Verify Lambda timestamp is recent
   ↓
6. Test in actual AWS environment
   ↓
7. ONLY THEN claim fix is deployed
```

## FRONTEND CHANGES

**⚠️ CRITICAL: Frontend changes require MANUAL deployment to S3 + CloudFront invalidation.**

**See `cdk-frontend-deployment-mandatory.md` for complete frontend deployment protocol.**

Frontend changes (React/TypeScript in `src/`) require:

```bash
# 1. Build frontend
npm run build

# 2. Deploy to S3
aws s3 sync dist/ s3://energyinsights-development-frontend-development/ --delete

# 3. Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id E18FPAPGJR8ZNO --paths "/*"

# 4. Wait 1-2 minutes for invalidation to complete
```

**Frontend changes DO NOT auto-deploy. You MUST manually deploy to S3 and invalidate CloudFront.**

## WHEN TO DEPLOY

**ALWAYS deploy after:**
- Changing Lambda function code
- Changing Lambda dependencies
- Changing infrastructure (CDK constructs)
- Changing environment variables
- Changing IAM permissions
- Changing API Gateway configuration

**NEVER assume:**
- Code changes auto-deploy
- Local tests prove deployment
- Previous deployments include new changes

## DEPLOYMENT VERIFICATION

After deployment, ALWAYS verify:

```bash
# 1. Check Lambda was updated
aws lambda get-function --function-name EnergyInsights-development-chat \
  --query 'Configuration.LastModified'

# 2. Check environment variables are set
aws lambda get-function-configuration \
  --function-name EnergyInsights-development-renewable-orchestrator \
  --query 'Environment.Variables'

# 3. Test actual Lambda invocation
aws lambda invoke \
  --function-name EnergyInsights-development-chat \
  --payload '{"test": true}' \
  response.json

# 4. Check CloudWatch logs show recent execution
aws logs tail /aws/lambda/EnergyInsights-development-chat --since 5m
```

## EMERGENCY DEPLOYMENT CHECKLIST

If user reports "nothing changed after fix":

```bash
# 1. STOP claiming it's fixed
# 2. Check when Lambda was last modified
aws lambda get-function --function-name EnergyInsights-development-chat \
  --query 'Configuration.LastModified'

# 3. If timestamp is old (more than 1 hour ago), CODE WAS NOT DEPLOYED
# 4. Run deployment NOW:
cd cdk
npm run build:all
cdk deploy --all --require-approval never

# 5. Wait for completion
# 6. Verify new timestamp
# 7. Test again
# 8. ONLY THEN tell user to test
```

## SUCCESS CRITERIA

A fix is ONLY deployed when:

✅ Code changes committed to git
✅ `npm run build:all` completed successfully
✅ `cdk deploy --all` completed successfully
✅ Lambda LastModified timestamp is within last 10 minutes
✅ Environment variables are correct (if changed)
✅ CloudWatch logs show recent execution with new code
✅ Integration test passes against deployed Lambda
✅ User can test in actual application

## REMEMBER

**CODE IN YOUR EDITOR ≠ CODE IN AWS**

**LOCAL TESTS ≠ DEPLOYED TESTS**

**"I CHANGED IT" ≠ "IT'S DEPLOYED"**

**ALWAYS DEPLOY. ALWAYS VERIFY. ALWAYS TEST DEPLOYED CODE.**

---

*This document was created after repeatedly wasting hours on undeployed fixes. Read it. Follow it. Stop wasting time.*
