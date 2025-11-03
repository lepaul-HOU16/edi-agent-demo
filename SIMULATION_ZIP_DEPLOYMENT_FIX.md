# Simulation Lambda - Switch to ZIP Deployment

## Root Cause

The simulation Lambda was configured to use Docker deployment, but:
1. Docker configuration was complex and error-prone
2. The working Lambdas (terrain, layout) use ZIP deployment
3. Docker kept failing with InvalidEntrypoint errors

## The Solution

**Switch from Docker to ZIP deployment** - matching the pattern used by terrain and layout.

## Changes Made

### 1. Updated resource.ts
Changed from `DockerImageFunction` to regular `Function` with ZIP deployment:

```typescript
// BEFORE (Docker - not working):
new lambda.DockerImageFunction(scope, 'RenewableSimulationTool', {
  code: lambda.DockerImageCode.fromImageAsset(dirname(__dirname), {
    file: 'simulation/Dockerfile'
  }),
  ...
});

// AFTER (ZIP - working pattern):
new lambda.Function(scope, 'RenewableSimulationTool', {
  runtime: lambda.Runtime.PYTHON_3_12,
  handler: 'handler.handler',
  code: lambda.Code.fromAsset(__dirname),
  ...
});
```

### 2. Copied Required Dependencies
Copied missing Python modules into simulation directory:
- `visualization_generator.py` - Required by handler
- `wind_client.py` - Required for wind data

### 3. Removed Docker Files
- Deleted `Dockerfile` - not needed for ZIP deployment
- Deleted `test_minimal_handler.py` - test file

## Why This Works

ZIP deployment with `lambda.Code.fromAsset(__dirname)`:
- Packages everything in the `simulation/` directory
- Simpler than Docker
- Same pattern as terrain and layout (which work)
- No Docker build complexity

## Files in simulation/ Directory

Now includes all required modules:
- `handler.py` - Main handler
- `visualization_generator.py` - Visualization utilities
- `wind_client.py` - Wind data fetching
- `matplotlib_generator.py` - Chart generation
- `folium_generator.py` - Map generation
- `visualization_config.py` - Configuration
- `requirements.txt` - Python dependencies

## Deployment

```bash
npx ampx sandbox
```

Wait for deployment, then test:

```bash
bash tests/test-wind-rose.sh
```

## Expected Result

Lambda should:
- ✅ Deploy as ZIP package (not Docker image)
- ✅ Start without InvalidEntrypoint error
- ✅ Import all required modules
- ✅ Process wind rose requests
- ✅ Generate visualizations

## Why Docker Failed

Docker deployment issues:
1. Complex file copying in Dockerfile
2. Build context confusion
3. Missing dependencies in image
4. Harder to debug

ZIP deployment advantages:
1. Simple - just package the directory
2. Proven pattern (terrain/layout work)
3. Easy to debug
4. Faster deployment

## Validation

After deployment, check:
- [ ] Lambda package type is "Zip" (not "Image")
- [ ] Handler responds without InvalidEntrypoint
- [ ] Wind rose analysis returns success
- [ ] Visualizations generated

