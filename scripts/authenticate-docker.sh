#!/bin/bash

# Authenticate Docker with AWS ECR Public
# This is needed to pull AWS Lambda base images

echo "🔐 Authenticating Docker with AWS ECR Public..."

aws ecr-public get-login-password --region us-east-1 | docker login --username AWS --password-stdin public.ecr.aws

if [ $? -eq 0 ]; then
    echo "✅ Docker authenticated with ECR Public"
    exit 0
else
    echo "❌ Failed to authenticate Docker with ECR Public"
    echo "Please check your AWS credentials and try again"
    exit 1
fi
