# Use Workshop Deployment (Proven Method)

## Why This Approach

The custom deployment scripts are having Docker manifest issues. The **workshop utilities are proven and tested by AWS** - they handle all the Docker/Lambda complexities correctly.

## What's Different

This uses the exact same utilities from the workshop tutorial that are known to work:
- `create_lambda_function()` - Handles Docker build/push correctly
- `create_agentcore_gateway_role()` - Creates proper IAM roles
- `setup_cognito_user_pool()` - Manages authentication
- `build_and_push_image_runtime()` - For runtime deployment

## Deploy Now

```bash
python3 scripts/deploy-using-workshop-utils.py
```

## What Will Happen

```
STEP 1: Deploying Lambda Function (using workshop utility)
Building and pushing Docker image...
Repository agentcore-gateway-lambda-container already exists
Login Succeeded
[Docker build...]
✅ Lambda deployed

STEP 2: Creating Gateway IAM Role
✅ Gateway role created

STEP 3: Setting Up Cognito
✅ Cognito configured

STEP 4: Creating AgentCore Gateway
✅ Gateway created

STEP 5: Creating Gateway Target
✅ Target created

DEPLOYMENT COMPLETE!
```

## Why This Works

The workshop utilities:
1. ✅ Use the correct Docker build commands
2. ✅ Handle ECR authentication properly
3. ✅ Create Lambda-compatible images
4. ✅ Have been tested extensively by AWS

## Time Estimate

- **Lambda deployment:** 3-5 minutes
- **Gateway setup:** 2-3 minutes
- **Total:** 5-8 minutes (no Runtime in this version)

## After Deployment

You'll have:
- ✅ Lambda function with MCP tools
- ✅ AgentCore Gateway
- ✅ Cognito authentication
- ✅ Configuration in Parameter Store

## Add Runtime Later

Once Gateway + Lambda work, we can add the Runtime separately using the workshop utility:
```python
build_and_push_image_runtime()
```

## Ready?

```bash
python3 scripts/deploy-using-workshop-utils.py
```

This should work! 🚀
