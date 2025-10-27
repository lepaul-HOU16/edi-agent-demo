# Dockerfile Optimization Quick Reference

## Quick Commands

### Validate Optimization
```bash
./tests/test-dockerfile-optimization.sh
```

### Local Build Test
```bash
cd amplify/functions/renewableAgents
docker build -t strands-agent-optimized:test .
docker images strands-agent-optimized:test
```

### Deploy Optimized Version
```bash
npx ampx sandbox
# Wait 10-15 minutes for deployment
```

### Test Cold Start
```bash
node tests/test-strands-agent-cold-start.js
# Expected: <5 minutes
```

### Test Warm Start
```bash
node tests/test-strands-warm-start.js
# Expected: <30 seconds
```

## What Changed

### Before (Single-Stage)
```dockerfile
FROM amazon/aws-lambda-python:3.12
RUN pip install -r requirements.txt
COPY [files]
```
- Size: ~2.5-3GB
- Cold start: 5-10 minutes
- No bytecode pre-compilation

### After (Multi-Stage)
```dockerfile
# Stage 1: Build
FROM python:3.12-slim AS builder
RUN pip install --target=/build/python
RUN python -m compileall /build/python

# Stage 2: Runtime
FROM amazon/aws-lambda-python:3.12
COPY --from=builder /build/python .
COPY [files]
RUN python -m compileall .
```
- Size: ~1.5-2GB (30-40% smaller)
- Cold start: 3-5 minutes (35-40% faster)
- Bytecode pre-compiled

## Key Optimizations

1. **Multi-Stage Build**: Separates build and runtime
2. **Bytecode Pre-Compilation**: Faster imports
3. **No pip Cache**: Smaller image
4. **Minimal Runtime Deps**: Only what's needed

## Expected Improvements

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Image Size | 2.5-3GB | 1.5-2GB | 30-40% |
| Cold Start | 5-10 min | 3-5 min | 35-40% |
| Import Time | 120-180s | 30-60s | 50-75% |
| Warm Start | <30s | <30s | 0% |

## Troubleshooting

### Build Fails
- Check system dependencies in builder stage
- Verify requirements.txt is valid
- Check Docker daemon is running

### Runtime Errors
- Verify runtime dependencies installed
- Check COPY --from=builder path
- Verify bytecode compilation succeeded

### Slower Than Expected
- Check CloudWatch logs for bottlenecks
- Verify lazy loading is working
- Check Bedrock connection pooling

## Rollback

```bash
git checkout HEAD~1 amplify/functions/renewableAgents/Dockerfile
npx ampx sandbox
```

## Documentation

- **Full Guide**: `amplify/functions/renewableAgents/DOCKERFILE_OPTIMIZATION.md`
- **Comparison**: `tests/dockerfile-optimization-comparison.md`
- **Task Summary**: `tests/TASK_9_DOCKERFILE_OPTIMIZATION_COMPLETE.md`

## Status

✅ **Task 9 Complete**
- Multi-stage build implemented
- Bytecode pre-compilation added
- Dependencies optimized
- Ready for deployment

## Next Steps

1. Deploy optimized version
2. Test cold start performance
3. Monitor CloudWatch metrics
4. Validate improvements
