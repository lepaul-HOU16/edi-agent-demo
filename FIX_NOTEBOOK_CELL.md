# 🔧 Fix Jupyter Notebook Cell

**Error**: `TypeError: build_and_push_image() missing 2 required positional arguments`

**Issue**: The notebook is calling `build_and_push_image_runtime()` which doesn't exist. It should call `build_and_push_image()` with arguments.

---

## Fix for Cell [5] or [9]

Replace this line:
```python
ecr_repository = build_and_push_image_runtime()
```

With this:
```python
ecr_repository = build_and_push_image('wind-farm-agent-runtime', 'latest')
```

---

## Complete Fixed Cell

```python
runtime_role_arn = create_agentcore_runtime_role('agentcore-runtime')['Role']['Arn']
ecr_repository = build_and_push_image('wind-farm-agent-runtime', 'latest')

agent_name = "wind_farm_dev_agent"

response = agentcore_control_client.create_agent_runtime(
    agentRuntimeName=agent_name,
    agentRuntimeArtifact={
        'type': 'CONTAINER',
        'containerArtifact': {
            'imageUri': ecr_repository
        }
    },
    agentRuntimeRoleArn=runtime_role_arn,
    agentRuntimeType='CONTAINER',
    description='Wind farm site design agent with MCP tools',
    # authorizerConfiguration=auth_config
)
```

---

## Alternative: Create Function Alias

If you don't want to modify the cell, add this cell before it:

```python
# Create alias for the function
def build_and_push_image_runtime():
    return build_and_push_image('wind-farm-agent-runtime', 'latest')
```

---

## After Fixing

Run the cell again and it should:
1. ✅ Build Docker image
2. ✅ Push to ECR
3. ✅ Create AgentCore runtime
4. ✅ Return runtime ARN

---

## Get the Runtime ARN

After successful execution, get the ARN:

```python
runtime_arn = response['agentRuntimeArn']
print(f"Runtime ARN: {runtime_arn}")
```

Then update your Lambda environment variable with this ARN.
