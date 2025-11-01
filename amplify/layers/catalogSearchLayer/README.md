# Catalog Search Lambda Layer

This Lambda layer provides Python dependencies for the catalogSearch function.

## Building the Layer

The layer must be built before deploying:

```bash
./build-layer.sh
```

This will:
1. Create a `python/` directory
2. Install all dependencies from `amplify/functions/catalogSearch/requirements.txt`
3. Use ARM64 architecture for Lambda compatibility

## Dependencies Included

- requests: HTTP client for OSDU API
- boto3: AWS SDK
- strands-agents: AI agent framework
- strands-agents-tools: Agent tools
- mcp: Model Context Protocol
- And all transitive dependencies

## Deployment

The layer is automatically deployed when you run:

```bash
npx ampx sandbox
```

The `python/` directory is gitignored and must be built locally before deployment.
