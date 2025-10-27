# Root Cause Analysis: Docker Lambda Failure

## The Real Problem

The Docker Lambda has `Runtime: null` and `CodeSize: 0` because **the Docker image never successfully built**.

## Evidence

1. Lambda shows `Runtime: null` (not `python3.12`)
2. Lambda shows `CodeSize: 0` (no code deployed)
3. CloudWatch logs show `Runtime.InvalidEntrypoint`
4. Error: `ProcessSpawnFailed`

## Why Docker Build is Failing

The issue is NOT the Dockerfile COPY commands. The issue is that **Amplify Gen 2 is trying to build a Docker image but the build is failing silently**.

### The Build Process

1. Amplify reads `resource.ts`
2. Sees `DockerImageFunction` with `fromImageAsset(parentDir, { file: 'simulation/Dockerfile' })`
3. Tries to build Docker image from `renewableTools/` directory
4. Build fails (likely during `pip install` or file copying)
5. Deployment continues but Lambda has no code

## Hypothesis: Build is Failing During pip install

The `requirements.txt` likely has dependencies that can't install in the Lambda Python 3.12 base image.

### Test This

Check what's in requirements.txt:

```bash
cat amplify/functions/renewableTools/simulation/requirements.txt
```

Common issues:
- Numpy/scipy requiring compilation
- Matplotlib requiring system libraries
- Plotly dependencies failing
- Memory limits during build

## Alternative Hypothesis: File Paths Are Wrong

The Dockerfile copies files like:
```dockerfile
COPY simulation/handler.py ./handler.py
```

But the build context is `parentDir` (renewableTools/), so Docker is looking for:
- `renewableTools/simulation/handler.py` ✅ (exists)
- `renewableTools/plotly_wind_rose_generator.py` ✅ (exists)

This should work. So it's likely the pip install failing.

## Solution: Check requirements.txt

The requirements.txt probably has packages that need:
1. System libraries (libpng, freetype, etc.)
2. Compilation (gcc, g++)
3. More memory than available during build

### Fix Options

**Option 1: Use Pre-built Wheels**
```dockerfile
RUN pip3 install --no-cache-dir \
    --platform manylinux2014_x86_64 \
    --only-binary=:all: \
    -r requirements.txt
```

**Option 2: Install System Dependencies First**
```dockerfile
RUN yum install -y gcc gcc-c++ freetype-devel libpng-devel
RUN pip3 install -r requirements.txt --no-cache-dir
```

**Option 3: Use Lambda Layer**
Create a layer with numpy/matplotlib/plotly pre-installed.

**Option 4: Multi-stage Build**
Build dependencies in one stage, copy to final stage.

## Next Steps

1. Read requirements.txt to see what's being installed
2. Check if any packages require compilation
3. Add system dependencies to Dockerfile if needed
4. Test Docker build locally before deploying

## The Real Fix

The Dockerfile needs system dependencies BEFORE pip install:

```dockerfile
FROM public.ecr.aws/lambda/python:3.12

# Install system dependencies for numpy, matplotlib, plotly
RUN yum install -y \
    gcc \
    gcc-c++ \
    freetype-devel \
    libpng-devel \
    && yum clean all

WORKDIR ${LAMBDA_TASK_ROOT}

COPY simulation/requirements.txt ./
RUN pip3 install -r requirements.txt --no-cache-dir

# Copy code
COPY simulation/handler.py ./handler.py
COPY simulation/visualization_generator.py ./visualization_generator.py
COPY simulation/visualization_config.py ./visualization_config.py
COPY simulation/matplotlib_generator.py ./matplotlib_generator.py
COPY simulation/folium_generator.py ./folium_generator.py
COPY simulation/wind_client.py ./wind_client.py
COPY plotly_wind_rose_generator.py ./plotly_wind_rose_generator.py
COPY osm_client.py ./osm_client.py

CMD ["handler.handler"]
```

This installs gcc and other build tools BEFORE trying to pip install packages that need compilation.
