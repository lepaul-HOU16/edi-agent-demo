# Dockerfile Optimization for Strands Agent Lambda

## Overview

This document describes the multi-stage Dockerfile optimization implemented to reduce cold start times for the Strands Agent Lambda function.

## Optimization Strategy

### 1. Multi-Stage Build (Task 9.1)

**Before**: Single-stage build with all dependencies and build tools in final image
**After**: Two-stage build separating build and runtime environments

#### Stage 1: Builder (python:3.12-slim)
- Uses lightweight Python 3.12 slim image
- Installs build tools (gcc, g++, make)
- Installs geospatial system dependencies (libgeos, libproj, libgdal)
- Builds all Python packages
- Pre-compiles Python bytecode
- Discarded after build completes

#### Stage 2: Runtime (amazon/aws-lambda-python:3.12)
- Uses AWS Lambda Python runtime
- Installs only runtime system dependencies (geos, proj)
- Copies pre-built Python packages from builder
- Copies application code
- No build tools in final image

### 2. Python Bytecode Pre-Compilation (Task 9.2)

**Purpose**: Reduce import time during cold starts

**Implementation**:
```dockerfile
# In builder stage - compile dependencies
RUN python -m compileall /build/python

# In runtime stage - compile application code
RUN python -m compileall .
```

**Benefits**:
- Python doesn't need to compile .py files to .pyc on first import
- Faster module loading during cold start
- Reduced CPU usage during initialization

### 3. Dependency Optimization (Task 9.3)

**pip flags used**:
- `--no-cache-dir`: Don't store pip cache (reduces image size)
- `--timeout=300`: Increased timeout for large packages (PyWake, GeoPandas)
- `--target=/build/python`: Install to specific directory for multi-stage copy

**System dependencies**:
- **Build stage**: gcc, g++, make, libgeos-dev, libproj-dev, libgdal-dev
- **Runtime stage**: Only geos, proj (no -dev packages, no build tools)

## Size Reduction

### Before Optimization
- Single-stage build
- All build tools included
- No bytecode pre-compilation
- Estimated size: ~2.5-3GB

### After Optimization
- Multi-stage build
- Build tools removed
- Bytecode pre-compiled
- Estimated size: ~1.5-2GB (30-40% reduction)

## Cold Start Performance Impact

### Expected Improvements

1. **Smaller Image Size**
   - Faster image pull from ECR
   - Less data to load into Lambda execution environment
   - Estimated improvement: 20-30 seconds

2. **Pre-Compiled Bytecode**
   - No compilation during import
   - Faster module loading
   - Estimated improvement: 10-20 seconds

3. **Minimal Runtime Dependencies**
   - Fewer files to scan/load
   - Reduced memory footprint
   - Estimated improvement: 5-10 seconds

**Total Expected Cold Start Reduction**: 35-60 seconds

### Performance Targets

- **Before optimization**: 5-10 minutes (estimated)
- **After optimization**: 4-9 minutes (target: <5 minutes)
- **Warm start**: <30 seconds (unchanged)

## Build Process

### Local Build (for testing)
```bash
cd amplify/functions/renewableAgents
docker build -t strands-agent-optimized:test .
```

### Amplify Deployment
```bash
# Amplify automatically builds and deploys the Docker image
npx ampx sandbox
```

### Build Time
- **Stage 1 (Builder)**: 5-8 minutes (installs and compiles all dependencies)
- **Stage 2 (Runtime)**: 1-2 minutes (copies files and compiles app code)
- **Total**: 6-10 minutes

## Verification

### Validate Dockerfile Structure
```bash
./tests/test-dockerfile-optimization.sh
```

### Check Image Size
```bash
docker images strands-agent-optimized:test
```

### Test Cold Start Performance
```bash
node tests/test-strands-agent-cold-start.js
```

## Troubleshooting

### Build Failures

**Issue**: Missing system dependencies
**Solution**: Ensure all required -dev packages in builder stage

**Issue**: Import errors at runtime
**Solution**: Verify runtime system dependencies (geos, proj) are installed

**Issue**: Bytecode compilation fails
**Solution**: Check Python syntax errors in application code

### Runtime Issues

**Issue**: Module not found errors
**Solution**: Verify COPY --from=builder includes all dependencies

**Issue**: Slower than expected cold start
**Solution**: Check CloudWatch logs for initialization bottlenecks

## Maintenance

### Adding New Dependencies

1. Add to `requirements.txt`
2. If requires system libraries, add to builder stage:
   ```dockerfile
   RUN apt-get install -y libfoo-dev
   ```
3. Add runtime library to runtime stage:
   ```dockerfile
   RUN yum install -y libfoo
   ```
4. Rebuild and test

### Updating Python Version

1. Update builder stage: `FROM python:3.X-slim AS builder`
2. Update runtime stage: `FROM amazon/aws-lambda-python:3.X`
3. Test thoroughly

## Best Practices

1. **Keep builder and runtime stages in sync**
   - Same Python version
   - Compatible system libraries

2. **Minimize runtime dependencies**
   - Only install what's needed to run
   - No build tools, no -dev packages

3. **Pre-compile everything**
   - Dependencies in builder stage
   - Application code in runtime stage

4. **Use .dockerignore**
   - Exclude unnecessary files
   - Reduces build context size

5. **Test locally before deploying**
   - Build image locally
   - Test with sample invocations
   - Verify cold start improvements

## References

- [Docker Multi-Stage Builds](https://docs.docker.com/build/building/multi-stage/)
- [Python Bytecode Compilation](https://docs.python.org/3/library/compileall.html)
- [AWS Lambda Container Images](https://docs.aws.amazon.com/lambda/latest/dg/images-create.html)
- [Optimizing Lambda Cold Starts](https://aws.amazon.com/blogs/compute/operating-lambda-performance-optimization-part-1/)

## Related Tasks

- Task 2: Performance Monitoring (tracks cold start metrics)
- Task 6: Lazy Loading (complements Dockerfile optimization)
- Task 7: Bedrock Connection Pooling (reduces initialization time)
- Task 10: Comprehensive Testing (validates optimization effectiveness)
