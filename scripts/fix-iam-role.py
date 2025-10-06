#!/usr/bin/env python3
"""
Fix the IAM role by attaching the necessary policy
"""

import boto3
import json

ROLE_NAME = "agentcore-runtime-role"
POLICY_NAME = "agentcore-runtime-policy"
REGION = "us-east-1"

def attach_policy():
    iam_client = boto3.client('iam')
    account_id = boto3.client("sts").get_caller_identity()["Account"]
    
    # Define the policy
    role_policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "BedrockPermissions",
                "Effect": "Allow",
                "Action": [
                    "bedrock:InvokeModel",
                    "bedrock:InvokeModelWithResponseStream"
                ],
                "Resource": "*"
            },
            {
                "Sid": "ECRImageAccess",
                "Effect": "Allow",
                "Action": [
                    "ecr:BatchGetImage",
                    "ecr:GetDownloadUrlForLayer",
                    "ecr:GetAuthorizationToken"
                ],
                "Resource": [
                    f"arn:aws:ecr:{REGION}:{account_id}:repository/*"
                ]
            },
            {
                "Effect": "Allow",
                "Action": [
                    "logs:DescribeLogStreams",
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents",
                    "logs:DescribeLogGroups"
                ],
                "Resource": [
                    f"arn:aws:logs:{REGION}:{account_id}:log-group:/aws/bedrock-agentcore/runtimes/*",
                    f"arn:aws:logs:{REGION}:{account_id}:log-group:/aws/bedrock-agentcore/runtimes/*:log-stream:*",
                    f"arn:aws:logs:{REGION}:{account_id}:log-group:*"
                ]
            },
            {
                "Sid": "ECRTokenAccess",
                "Effect": "Allow",
                "Action": [
                    "ecr:GetAuthorizationToken"
                ],
                "Resource": "*"
            },
            {
                "Effect": "Allow",
                "Action": [
                    "xray:PutTraceSegments",
                    "xray:PutTelemetryRecords",
                    "xray:GetSamplingRules",
                    "xray:GetSamplingTargets"
                ],
                "Resource": ["*"]
            },
            {
                "Effect": "Allow",
                "Resource": "*",
                "Action": "cloudwatch:PutMetricData",
                "Condition": {
                    "StringEquals": {
                        "cloudwatch:namespace": "bedrock-agentcore"
                    }
                }
            },
            {
                "Sid": "GetAgentAccessToken",
                "Effect": "Allow",
                "Action": [
                    "bedrock-agentcore:GetWorkloadAccessToken",
                    "bedrock-agentcore:GetWorkloadAccessTokenForJWT",
                    "bedrock-agentcore:GetWorkloadAccessTokenForUserId"
                ],
                "Resource": [
                    f"arn:aws:bedrock-agentcore:{REGION}:{account_id}:workload-identity-directory/default",
                    f"arn:aws:bedrock-agentcore:{REGION}:{account_id}:workload-identity-directory/default/workload-identity/*"
                ]
            },
            {
                "Sid": "SecretsManagerAccess",
                "Effect": "Allow",
                "Action": [
                    "secretsmanager:GetSecretValue",
                    "secretsmanager:DescribeSecret",
                    "secretsmanager:UpdateSecret",
                    "secretsmanager:CreateSecret"
                ],
                "Resource": f"arn:aws:secretsmanager:{REGION}:{account_id}:secret:*"
            },
            {
                "Sid": "ParameterStoreAccess",
                "Effect": "Allow",
                "Action": [
                    "ssm:GetParameter",
                    "ssm:GetParameters",
                    "ssm:GetParametersByPath"
                ],
                "Resource": f"arn:aws:ssm:{REGION}:{account_id}:parameter/*"
            },
            {
                "Sid": "S3Access",
                "Effect": "Allow",
                "Action": [
                    "s3:GetObject",
                    "s3:PutObject",
                    "s3:ListBucket"
                ],
                "Resource": [
                    f"arn:aws:s3:::amplify-d1eeg2gu6ddc3z-ma-workshopstoragebucketd9b-lzf4vwokty7m/*",
                    f"arn:aws:s3:::amplify-d1eeg2gu6ddc3z-ma-workshopstoragebucketd9b-lzf4vwokty7m"
                ]
            }
        ]
    }
    
    try:
        # Put inline policy
        iam_client.put_role_policy(
            RoleName=ROLE_NAME,
            PolicyName=POLICY_NAME,
            PolicyDocument=json.dumps(role_policy)
        )
        print(f"✅ Policy '{POLICY_NAME}' attached to role '{ROLE_NAME}'")
        
        # Verify
        response = iam_client.get_role_policy(
            RoleName=ROLE_NAME,
            PolicyName=POLICY_NAME
        )
        print(f"✅ Policy verified successfully")
        
        return True
        
    except Exception as e:
        print(f"❌ Error attaching policy: {e}")
        return False

if __name__ == "__main__":
    print("=" * 70)
    print("  Fixing IAM Role for AgentCore")
    print("=" * 70)
    
    if attach_policy():
        print("\n✅ IAM role fixed successfully!")
        print("\nThe role now has permissions for:")
        print("  - Bedrock model invocation")
        print("  - ECR image access")
        print("  - CloudWatch logging")
        print("  - Secrets Manager access")
        print("  - SSM Parameter Store access")
        print("  - S3 bucket access")
        print("\nYou can now try invoking the agent again:")
        print("  python3 scripts/invoke-renewable-agent.py")
    else:
        print("\n❌ Failed to fix IAM role")
