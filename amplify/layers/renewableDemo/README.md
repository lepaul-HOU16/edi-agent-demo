# Renewable Demo Lambda Layer

This Lambda layer contains the renewable energy demo Python code and all required dependencies.

## Contents

- **renewable-demo/**: Python code from `agentic-ai-for-renewable-site-design-mainline/workshop-assets/`
  - `agents/`: Terrain, layout, simulation, and report agents
  - `MCP_Server/`: Wind farm MCP server
  - `visualization_utils.py`: Folium and matplotlib visualization functions
  - `agentcore_utils.py`: AgentCore utility functions

- **Python dependencies**: All required libraries (pandas, numpy, folium, py-wake, etc.)

## Building the Layer

```bash
./build.sh
```

This will:
1. Install all Python dependencies
2. Create `renewable-demo-layer.zip`

## Publishing to AWS Lambda

```bash
aws lambda publish-layer-version \
  --layer-name renewable-demo-code \
  --description 'Renewable energy demo Python code and dependencies' \
  --zip-file fileb://renewable-demo-layer.zip \
  --compatible-runtimes python3.12 \
  --compatible-architectures x86_64
```

Save the returned `LayerVersionArn` for use in Lambda functions.

## Using in Lambda Functions

### CDK/TypeScript

```typescript
import * as lambda from 'aws-cdk-lib/aws-lambda';

const layer = lambda.LayerVersion.fromLayerVersionArn(
  scope,
  'RenewableDemoLayer',
  'arn:aws:lambda:REGION:ACCOUNT:layer:renewable-demo-code:VERSION'
);

const myFunction = new lambda.Function(scope, 'MyFunction', {
  runtime: lambda.Runtime.PYTHON_3_12,
  handler: 'handler.handler',
  code: lambda.Code.fromAsset(__dirname),
  layers: [layer]
});
```

### Python Handler

```python
import sys
sys.path.insert(0, '/opt/python/renewable-demo')

# Now you can import renewable demo code
from agents.terrain_agent import analyze_terrain
from visualization_utils import create_terrain_map
```

## Layer Size

The layer includes heavy dependencies (pandas, numpy, geopandas, py-wake). Expected size: ~200-300MB.

## Updating the Layer

When the renewable demo code is updated:

1. Copy new code: `cp -r ../../agentic-ai-for-renewable-site-design-mainline/workshop-assets/* python/renewable-demo/`
2. Rebuild: `./build.sh`
3. Republish to AWS Lambda
4. Update Lambda functions to use new layer version
