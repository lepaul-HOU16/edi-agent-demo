# Docker ECR Authentication Fix

## Problem

Docker build fails with error:
```
ERROR: unexpected status from HEAD request to https://public.ecr.aws/v2/lambda/python/manifests/3.12: 403 Forbidden
```

## Cause

Docker needs to authenticate with AWS ECR Public to pull AWS Lambda base images.

## Solution

### Quick Fix

Run this command before deploying:

```bash
aws ecr-public get-login-password --region us-east-1 | docker login --username AWS --password-stdin public.ecr.aws
```

You should see:
```
Login Succeeded
```

### Automated Fix

The deployment scripts now handle this automatically. Just run:

```bash
./scripts/quick-deploy.sh
```

### Manual Authentication Script

Or use the dedicated authentication script:

```bash
./scripts/authenticate-docker.sh
```

## Verify Authentication

Test that you can pull the base image:

```bash
docker pull public.ecr.aws/lambda/python:3.12
```

Should start downloading the image layers.

## Why This Happens

AWS Lambda base images are hosted on AWS ECR Public, which requires authentication even though it's "public". This is an AWS security measure.

## Troubleshooting

### Authentication Fails

If authentication fails, check:

1. **AWS Credentials**
   ```bash
   aws sts get-caller-identity
   ```

2. **AWS Region**
   ```bash
   aws configure get region
   ```
   ECR Public requires `us-east-1` region for authentication.

3. **IAM Permissions**
   Your AWS user/role needs:
   - `ecr-public:GetAuthorizationToken`
   - `ecr-public:BatchCheckLayerAvailability`
   - `ecr-public:GetDownloadUrlForLayer`
   - `ecr-public:BatchGetImage`

### Still Failing?

Try authenticating with verbose output:

```bash
aws ecr-public get-login-password --region us-east-1 --debug
```

## Alternative: Use Different Base Image

If ECR Public authentication continues to fail, you can modify the Dockerfile to use Docker Hub instead:

```dockerfile
# Instead of:
FROM public.ecr.aws/lambda/python:3.12

# Use:
FROM amazon/aws-lambda-python:3.12
```

However, the AWS ECR Public images are recommended and more up-to-date.

## After Authentication

Once authenticated, run the deployment:

```bash
./scripts/quick-deploy.sh
```

The authentication token is valid for 12 hours.
