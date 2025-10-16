# Restored Working Dockerfile

## What Was Wrong

I was trying to selectively copy individual files, but the working version simply copies ALL Python files from the parent directory.

## The Working Pattern (Restored)

```dockerfile
# Copy ALL Python files from parent directory
COPY *.py ${LAMBDA_TASK_ROOT}/

# Copy the handler from simulation subdirectory
COPY simulation/handler.py ${LAMBDA_TASK_ROOT}/handler.py
```

This ensures:
- All visualization modules are included (visualization_generator.py, matplotlib_generator.py, folium_generator.py, etc.)
- All utility modules are included (wind_client.py, osm_client.py, etc.)
- The handler can import everything it needs

## What I Did Wrong

I tried to be "smart" and only copy specific files:
- `COPY simulation/*.py` - only simulation directory files
- `COPY visualization_generator.py` - manually adding files one by one

This broke because I didn't copy ALL the dependencies.

## The Fix

Restored the exact Dockerfile from the working commit (68fa0e9).

## Deploy

```bash
npx ampx sandbox
```

Wait for deployment, then test:

```bash
bash tests/test-wind-rose.sh
```

## No More Shortcuts

This is the ACTUAL working configuration from git history, not a simplified version.

