# Final Deployment Fix - Disable BuildKit

## The Root Cause

Docker Desktop on Mac uses BuildKit/buildx by default, which creates OCI manifest indexes. Lambda requires simple Docker v2 manifests.

**Image manifest type we're getting:**
```
"imageManifestMediaType": "application/vnd.oci.image.index.v1+json"
```

**What Lambda needs:**
```
"imageManifestMediaType": "application/vnd.docker.distribution.manifest.v2+json"
```

## The Solution

Disable Docker BuildKit to use the legacy builder:

```bash
export DOCKER_BUILDKIT=0
```

Then rebuild and deploy.

## Deploy Now

### Option 1: Use the Fix Script

```bash
./scripts/fix-docker-and-deploy.sh
```

### Option 2: Manual Steps

```bash
# Disable BuildKit
export DOCKER_BUILDKIT=0

# Delete old image
aws ecr batch-delete-image --repository-name agentcore-gateway-lambda-container --image-ids imageTag=latest

# Run deployment
python3 scripts/deploy-using-workshop-utils.py
```

## Why This Works

With `DOCKER_BUILDKIT=0`:
- Uses legacy Docker builder
- Creates simple Docker v2 manifests
- Compatible with Lambda
- No OCI index/multi-platform complexity

## Expected Output

```
Building and pushing Docker image...
[Docker build without BuildKit...]
✅ Lambda function created
```

## Ready?

```bash
export DOCKER_BUILDKIT=0
python3 scripts/deploy-using-workshop-utils.py
```

This should finally work! 🚀
