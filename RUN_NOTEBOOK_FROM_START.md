# 🔧 Run Notebook from Beginning

**Error**: `NameError: name 'build_and_push_image' is not defined`

**Issue**: The function `build_and_push_image` is defined in an earlier cell that hasn't been run yet.

---

## Solution: Run All Cells from the Beginning

### Option 1: Restart and Run All (Recommended)

1. **In Jupyter**: Click `Kernel` → `Restart & Run All`
2. This will run all cells in order
3. Wait for all cells to complete

### Option 2: Run Cells Manually in Order

Go back to the beginning of the notebook and run each cell in sequence:

1. **Cell 1**: Imports
2. **Cell 2**: AWS client setup
3. **Cell 3**: Helper function definitions (including `build_and_push_image`)
4. **Cell 4**: More helper functions
5. **Continue through all cells** until you reach the deployment cell

---

## What to Look For

The `build_and_push_image` function should be defined in one of the early cells. It typically looks like:

```python
def build_and_push_image(repository_name, image_tag):
    # Create ECR repository
    # Build Docker image
    # Push to ECR
    # Return image URI
    pass
```

---

## After Running All Cells

Once all cells have run successfully, you should see:

1. ✅ ECR repository created
2. ✅ Docker image built
3. ✅ Image pushed to ECR
4. ✅ AgentCore runtime created
5. ✅ Runtime ARN returned

---

## Get the Runtime ARN

After successful execution, the runtime ARN will be in the response:

```python
runtime_arn = response['agentRuntimeArn']
print(f"Runtime ARN: {runtime_arn}")
```

Copy this ARN and update your Lambda environment variable.

---

## Quick Command

In Jupyter, you can also run:

```python
# Check if function is defined
'build_and_push_image' in dir()
```

If it returns `False`, you need to run the cell that defines it.

---

## Alternative: Use Deployment Script

If the notebook continues to have issues, use the deployment script instead:

```bash
cd agentic-ai-for-renewable-site-design-mainline/workshop-assets
./deploy-to-agentcore.sh
```

This script has all the functions built-in and doesn't require running cells in order.
