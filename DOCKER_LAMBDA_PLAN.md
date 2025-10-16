# Docker-Based Lambda Deployment Plan for Wind Rose Visualization

## Context

The original renewable demo used **Docker containers** for Lambda deployment, which allows:
- ✅ **10GB image size limit** (vs 250MB for ZIP)
- ✅ **Full matplotlib support** with all dependencies
- ✅ **System libraries** (libcairo, libpango, etc.)
- ✅ **Complete Python scientific stack**

## Current State

### What We Have
- ✅ ZIP-based Lambda deployment (`lambda.Code.fromAsset`)
- ✅ Python 3.12 runtime
- ✅ Wind rose data generation (working)
- ❌ No matplotlib (visualization fails)
- ❌ 250MB ZIP limit (can't fit matplotlib + dependencies)

### What Original Demo Had
- ✅ Docker-based Lambda deployment
- ✅ Matplotlib, seaborn, folium, geopandas
- ✅ System libraries for visualization
- ✅ Deployed via AWS Bedrock AgentCore OR direct ECR

## Deployment Options

### Option 1: AWS Bedrock AgentCore (Original Demo Approach)
**Pros:**
- Automatic Docker build and deployment
- Handles ECR repository creation
- Built-in monitoring and logging
- Simplified deployment workflow

**Cons:**
- Requires Bedrock AgentCore setup
- Different architecture from current Amplify setup
- May require significant refactoring
- Additional AWS service dependency

### Option 2: Direct Docker Lambda with ECR (Recommended)
**Pros:**
- Works with existing Amplify Gen 2 setup
- Direct control over Docker image
- Standard Lambda container deployment
- No additional services needed
- 10GB image size limit

**Cons:**
- Manual ECR repository management
- Need to build and push Docker images
- Slightly more complex deployment

### Option 3: Lambda Layer with Matplotlib (Previously Considered)
**Pros:**
- Simpler than Docker
- Works with ZIP deployment

**Cons:**
- ❌ 250MB layer size limit
- ❌ Matplotlib + dependencies > 250MB
- ❌ Not viable for full scientific stack

## Recommended Approach: Docker Lambda with ECR

### Architecture

```
amplify/functions/renewableTools/simulation/
├── Dockerfile                    # NEW: Docker image definition
├── requirements.txt              # Python dependencies (matplotlib, etc.)
├── handler.py                    # Lambda handler
├── matplotlib_generator.py       # Visualization generator
├── resource.ts                   # CDK definition (updated for Docker)
└── ...other files
```

### Implementation Steps

#### Step 1: Create Dockerfile
```dockerfile
FROM public.ecr.aws/lambda/python:3.12

# Install system dependencies for matplotlib
RUN yum install -y \
    gcc \
    gcc-c++ \
    freetype-devel \
    libpng-devel \
    && yum clean all

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy function code
COPY *.py ./

# Set handler
CMD [ "handler.handler" ]
```

#### Step 2: Update requirements.txt
```txt
boto3
numpy
matplotlib
pillow
scipy
```

#### Step 3: Update resource.ts for Docker
```typescript
import { defineFunction } from '@aws-amplify/backend';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import { Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { DockerImageCode, DockerImageFunction } from 'aws-cdk-lib/aws-lambda';

export const renewableSimulationTool = defineFunction((scope: Construct) => {
  // Create or reference ECR repository
  const repository = new ecr.Repository(scope, 'SimulationToolRepo', {
    repositoryName: 'renewable-simulation-tool',
    removalPolicy: RemovalPolicy.RETAIN, // Keep images on stack deletion
  });

  // Create Lambda function with Docker image
  const func = new DockerImageFunction(scope, 'RenewableSimulationTool', {
    code: DockerImageCode.fromImageAsset(__dirname, {
      file: 'Dockerfile',
    }),
    timeout: Duration.seconds(90),
    memorySize: 2048,
    environment: {
      RENEWABLE_S3_BUCKET: process.env.RENEWABLE_S3_BUCKET || '',
    },
  });

  return func;
});
```

#### Step 4: Build and Deploy Process
```bash
# Amplify will automatically:
# 1. Build Docker image from Dockerfile
# 2. Push to ECR
# 3. Deploy Lambda with container image
npx ampx sandbox
```

### Comparison with Original Demo

| Aspect | Original Demo | Our Implementation |
|--------|---------------|-------------------|
| **Deployment** | Bedrock AgentCore | Amplify Gen 2 + ECR |
| **Docker Base** | `python:3.12-slim` | `public.ecr.aws/lambda/python:3.12` |
| **Build Tool** | CodeBuild | Amplify (uses Docker) |
| **ECR Management** | Automatic | CDK-managed |
| **Matplotlib** | ✅ Included | ✅ Will be included |
| **Size Limit** | 10GB | 10GB |
| **Integration** | Standalone | Integrated with Amplify |

## Benefits of Docker Approach

### 1. Full Matplotlib Support
- Complete matplotlib installation
- All rendering backends
- Font support
- High-quality PNG generation

### 2. System Libraries
- libcairo for vector graphics
- libpango for text rendering
- libfreetype for fonts
- libpng for PNG output

### 3. Scientific Stack
- numpy, scipy (full versions)
- pandas for data processing
- pillow for image manipulation
- seaborn for enhanced plots

### 4. Future Extensibility
- Can add more visualization libraries
- Can add GIS libraries (geopandas, shapely)
- Can add wind simulation (py-wake)
- Room for growth (10GB limit)

## Migration Path

### Phase 1: Simulation Lambda (Wind Rose)
1. Create Dockerfile for simulation Lambda
2. Update resource.ts for Docker deployment
3. Test wind rose generation
4. Verify S3 upload works
5. Verify frontend displays PNG

### Phase 2: Other Lambdas (Optional)
1. Terrain Lambda (if needs matplotlib)
2. Layout Lambda (if needs matplotlib)
3. Report Lambda (definitely needs matplotlib)

### Phase 3: Optimization
1. Multi-stage Docker builds (reduce size)
2. Layer caching for faster builds
3. Shared base image for multiple Lambdas

## Testing Plan

### Test 1: Docker Build
```bash
cd amplify/functions/renewableTools/simulation
docker build -t simulation-test .
docker run -p 9000:8080 simulation-test
```

### Test 2: Local Lambda Test
```bash
curl -XPOST "http://localhost:9000/2015-03-31/functions/function/invocations" \
  -d '{"action":"wind_rose","parameters":{"latitude":35.0,"longitude":-101.0}}'
```

### Test 3: Deployed Lambda Test
```bash
aws lambda invoke \
  --function-name <function-name> \
  --payload '{"action":"wind_rose","parameters":{"latitude":35.0,"longitude":-101.0}}' \
  response.json
```

### Test 4: End-to-End Test
1. Send wind rose query from UI
2. Verify Lambda generates PNG
3. Verify PNG uploaded to S3
4. Verify frontend displays PNG
5. Verify no "Visualization URL not available"

## Rollback Plan

If Docker deployment fails:
1. Revert resource.ts to ZIP deployment
2. Keep SVG fallback visualization (already implemented)
3. Users see SVG wind rose (functional but not ideal)

## Estimated Timeline

- **Dockerfile creation**: 30 minutes
- **resource.ts update**: 30 minutes
- **Testing locally**: 30 minutes
- **Deploy and test**: 30 minutes
- **Debugging**: 1 hour (buffer)
- **Total**: 3 hours

## Success Criteria

- ✅ Docker image builds successfully
- ✅ Lambda deploys with container image
- ✅ Matplotlib generates wind rose PNG
- ✅ PNG uploads to S3
- ✅ Frontend displays PNG (not SVG fallback)
- ✅ No "Visualization URL not available" message
- ✅ Image size < 10GB
- ✅ Cold start < 10 seconds
- ✅ Execution time < 30 seconds

## Risks and Mitigation

### Risk 1: Docker Build Fails
**Mitigation**: Test locally first, use proven base image

### Risk 2: Image Too Large
**Mitigation**: Multi-stage build, minimal dependencies

### Risk 3: Cold Start Slow
**Mitigation**: Provisioned concurrency if needed, optimize image size

### Risk 4: Amplify Doesn't Support Docker
**Mitigation**: Use CDK DockerImageFunction directly (confirmed supported)

## References

### Original Demo Files
- `agentic-ai-for-renewable-site-design-mainline/workshop-assets/Dockerfile`
- `agentic-ai-for-renewable-site-design-mainline/workshop-assets/requirements.txt`
- `agentic-ai-for-renewable-site-design-mainline/workshop-assets/agent_core/02_host_local_tools_to_lambda_gateway/Dockerfile`

### AWS Documentation
- [Lambda Container Images](https://docs.aws.amazon.com/lambda/latest/dg/images-create.html)
- [Lambda Container Image Size Limits](https://docs.aws.amazon.com/lambda/latest/dg/gettingstarted-limits.html) - 10GB
- [CDK DockerImageFunction](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_lambda.DockerImageFunction.html)

## Next Steps

1. **Review this plan** with team
2. **Confirm approach** (Docker vs alternatives)
3. **Create Dockerfile** for simulation Lambda
4. **Update resource.ts** for Docker deployment
5. **Test locally** with Docker
6. **Deploy to sandbox** and test
7. **Verify end-to-end** functionality

---

**Status**: PLAN READY FOR REVIEW  
**Recommendation**: Proceed with Docker Lambda approach  
**Confidence**: High (proven by original demo)  
**Risk**: Low (standard AWS pattern, well-documented)
