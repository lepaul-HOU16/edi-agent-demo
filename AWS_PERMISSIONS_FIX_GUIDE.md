# AWS Permissions Fix for Amplify Deployment

## Current Status ✅ 
- **Credentials**: FIXED - AWS credentials are now working
- **User**: lepaul (Account: 484907533441)
- **Issue**: IAM permissions needed for Amplify deployment

## Current Error
```
SSMCredentialsError: AccessDeniedException: User: arn:aws:iam::484907533441:user/lepaul is not authorized to perform: ssm:GetParameter on resource: arn:aws:ssm:us-east-1:484907533441:parameter/cdk-bootstrap/hnb659fds/version
```

## Root Cause
Your IAM user `lepaul` lacks the necessary permissions to deploy Amplify applications. Amplify uses AWS CDK which requires:
1. **CDK Bootstrap** permissions
2. **Systems Manager Parameter Store** access
3. **CloudFormation** permissions
4. **Various service permissions** (S3, Lambda, IAM, etc.)

## Solutions (Choose One)

### Option 1: Add AWS Managed Policies (Recommended)
The quickest solution is to attach AWS managed policies to your IAM user:

#### Required Policies:
1. **AdministratorAccess** (Full access - easiest for development)
   - OR the following more restrictive policies:
2. **PowerUserAccess** (Most services except IAM management)
3. **IAMFullAccess** (For creating roles and policies)
4. **AWSCloudFormationFullAccess** (For deploying stacks)

#### To Add Policies:
1. Go to **AWS Console → IAM → Users → lepaul**
2. Click **Add permissions** → **Attach policies directly**
3. Search for and select **AdministratorAccess**
4. Click **Add permissions**

### Option 2: Custom Policy (More Secure)
Create a custom policy with minimum required permissions:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ssm:GetParameter",
                "ssm:GetParameters",
                "ssm:PutParameter",
                "ssm:DeleteParameter"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "cloudformation:*",
                "s3:*",
                "lambda:*",
                "iam:*",
                "cognito-identity:*",
                "cognito-idp:*",
                "appsync:*",
                "apigateway:*",
                "logs:*",
                "athena:*",
                "glue:*"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "sts:AssumeRole"
            ],
            "Resource": "*"
        }
    ]
}
```

### Option 3: CDK Bootstrap (Advanced)
If your AWS account hasn't been bootstrapped for CDK:

```bash
# Bootstrap CDK in your AWS account
npx cdk bootstrap aws://484907533441/us-east-1
```

**Note**: This requires administrator permissions to run.

## Quick Test After Adding Permissions

### Step 1: Verify Permissions
```bash
# Test SSM access (should work after permissions are added)
aws ssm get-parameter --name "/cdk-bootstrap/hnb659fds/version" --region us-east-1
```

### Step 2: Try Amplify Deployment Again
```bash
# Deploy Amplify project
npx ampx sandbox --once
```

## Expected Deployment Process
Once permissions are correct, you should see:
1. **CDK synthesis** - Converting your backend to CloudFormation
2. **Stack deployment** - Creating AWS resources
3. **Function deployment** - Deploying Lambda functions
4. **Success message** with endpoints and resource ARNs

## Alternative: Use AWS CloudShell
If you can't get permissions immediately, try deploying from AWS CloudShell:
1. Go to **AWS Console**
2. Click **CloudShell** icon (top right)
3. Clone your repo and run deployment from there

## Summary
**Current Status:**
- ✅ AWS Credentials: WORKING
- ❌ IAM Permissions: MISSING
- ✅ Amplify Configuration: CORRECT
- ✅ CLI Commands: CORRECT

**Next Step:** Add IAM permissions to user `lepaul` in AWS Console, then retry deployment.
