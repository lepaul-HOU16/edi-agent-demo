# Agents for Energy - Agent Template Alpha - Building AI Agents with LangGraph and AWS Amplify

This project shows an example implementation of hosting a [LangGraph agent](https://www.langchain.com/langgraph) in an AWS Lambda function to process digital operations related energy workloads. The platform includes:

- **Petrophysical Analysis**: Professional-grade well log analysis, porosity calculations, and data quality assessment
- **Renewable Energy Analysis**: Wind farm site assessment, layout design, wake simulation, and reporting
- **Data Catalog**: Interactive exploration of subsurface data with map visualization
- **Conversational AI**: 24/7 AI companion for energy data workflows

There are a series of [labs](/labs/labs.md) which walk through the process of extending the agent to address a new use case. You'll learn how to persist agent state, create custom tools, build interactive UIs, and deploy agents with AWS Amplify.

## Deploy the Project with AWS Amplify
This option will create a public facing URL which let's users interact with your application.

1. Fork this repository in your company's Github account.

2. Follow the steps in [this tutorial](https://docs.aws.amazon.com/amplify/latest/userguide/getting-started-next.html) to deploy the forked repository with AWS Amplify.


## Deploy the Development Environment
This option let's you rapidly deploy changes to the code repository, so you can quickly add new features.

1. Clone this repository:
```bash
git clone https://github.com/aws-samples/sample-agents4energy-agent-template-alpha
cd sample-agents4energy-agent-template-alpha
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```
Then edit the `.env.local` file to add your actual credentials. See [Environment Variables Setup](./docs/ENVIRONMENT_VARIABLES_SETUP.md) for more details.

3. Deploy the sandbox environment:
```bash
npx ampx sandbox --stream-function-logs
```

4. Start the development server:
```bash
npm run dev
```

## MCP Server Integration

The system includes both local and cloud-native MCP server options for petrophysical analysis:

### Local Development (Python MCP Server)
```bash
# Install Python dependencies
uv pip install mcp pandas numpy

# Run the local MCP server
python mcp-well-data-server.py

# Test the local server
node test-mcp-petrophysics-integration.js
```

### Cloud Deployment (Lambda MCP Server)
```bash
# Deploy to AWS Amplify (includes MCP server)
npx ampx sandbox --stream-function-logs

# After deployment, update MCP configuration
# Edit .kiro/settings/mcp.json with your API Gateway URL and API key

# Test the cloud server
MCP_SERVER_URL=https://your-api-gateway-url.amazonaws.com/prod/mcp \
MCP_API_KEY=your-api-key \
node test-mcp-petrophysics-integration.js
```

### Available MCP Tools
- `list_wells` - List all wells from S3 storage
- `get_well_info` - Get well header information and curves
- `calculate_porosity` - Density, neutron, effective porosity calculations
- `calculate_shale_volume` - Larionov, Clavier, linear methods
- `calculate_saturation` - Archie equation water saturation
- `assess_data_quality` - Comprehensive data quality assessment
- `perform_uncertainty_analysis` - Monte Carlo uncertainty analysis
```

5. Open your browser to the local URL (ex: localhost:3000)

6. Create an account by clicking the "Login" button.

7. Create a new chat session by clicking the "Create" button, and try out (or modify) one of the sample prompts.


## Renewable Energy Integration

The platform includes renewable energy analysis capabilities powered by a Python-based multi-agent system deployed on AWS Bedrock AgentCore.

### Features

- **Terrain Analysis**: USGS elevation data analysis, exclusion zone identification, site suitability scoring
- **Layout Design**: Turbine placement optimization, capacity planning, spacing calculations
- **Wake Simulation**: PyWake simulation engine, AEP estimation, performance optimization
- **Executive Reports**: Professional reports with recommendations and complete analysis

### Quick Start

1. **Deploy Renewable Backend**:
   ```bash
   cd agentic-ai-for-renewable-site-design-mainline/workshop-assets/
   ./deploy-to-agentcore.sh
   ```

2. **Configure EDI Platform**:
   ```bash
   # Add to .env.local
   NEXT_PUBLIC_RENEWABLE_ENABLED=true
   NEXT_PUBLIC_RENEWABLE_AGENTCORE_ENDPOINT=<your-endpoint>
   NEXT_PUBLIC_RENEWABLE_S3_BUCKET=<your-bucket>
   NEXT_PUBLIC_RENEWABLE_AWS_REGION=us-west-2
   ```

3. **Try Sample Queries**:
   ```
   Analyze terrain for wind farm at 35.067482, -101.395466
   Create a 30MW wind farm layout at those coordinates
   Run wake simulation for the layout
   Generate executive report
   ```

### Documentation

- [Integration Guide](./docs/RENEWABLE_INTEGRATION.md) - Architecture and features
- [Deployment Guide](./docs/RENEWABLE_DEPLOYMENT.md) - Step-by-step deployment
- [Configuration Guide](./docs/RENEWABLE_CONFIGURATION.md) - Environment setup
- [Sample Queries](./docs/RENEWABLE_SAMPLE_QUERIES.md) - 50+ example queries
- [Troubleshooting](./docs/RENEWABLE_TROUBLESHOOTING.md) - Common issues and solutions
- [Testing Guide](./docs/RENEWABLE_INTEGRATION_TESTING_GUIDE.md) - Validation procedures

## Model Context Protocol

The tools in this project are also exposed via an MCP server. You can list the tools using a curl command like the one below. Look in the AWS Cloudformation output for the path to the mcp server, and the ARN of the api key. Use the AWS console to find the value of the api key from it's ARN (navigate to https://console.aws.amazon.com/apigateway/main/api-keys and click the copy button by the key called "mcp-tools-key".)

```bash
curl -X POST \
  <Path to MCP Server> \
  -H 'Content-Type: application/json' \
  -H 'X-API-Key: <Api Key for MCP Server>' \
  -H 'accept: application/json' \
  -d '{
    "jsonrpc": "2.0",
    "id": "1",
    "method": "tools/list"
}'
```

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.
