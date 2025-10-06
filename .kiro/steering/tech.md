# Technology Stack

## Frontend
- **Framework**: Next.js 14 with React 18 (TypeScript)
- **UI Libraries**: 
  - AWS Cloudscape Design System (primary UI components)
  - Material-UI (MUI) for advanced components
  - Plotly.js for scientific visualizations
- **Styling**: Tailwind CSS + SCSS
- **State Management**: AWS Amplify client-side state

## Backend
- **Platform**: AWS Amplify Gen 2
- **Runtime**: Node.js Lambda functions
- **Database**: AWS AppSync (GraphQL) with DynamoDB
- **Storage**: S3 for file storage (LAS files, reports, artifacts)
- **Authentication**: AWS Cognito

## AI/ML Stack
- **Agent Framework**: LangGraph for conversational AI agents
- **Models**: AWS Bedrock (Claude 3.5 Sonnet)
- **Tools Integration**: Model Context Protocol (MCP) servers
- **Petrophysical Engine**: Custom TypeScript calculation modules

## Development Tools
- **Language**: TypeScript (strict mode disabled for flexibility)
- **Testing**: Jest with React Testing Library
- **Linting**: ESLint + Prettier
- **Build**: Next.js with custom webpack optimization
- **Package Manager**: npm

## Key Dependencies
- `aws-amplify`: AWS services integration
- `@langchain/core`: AI agent framework
- `plotly.js`: Scientific data visualization
- `@aws-sdk/*`: AWS service clients
- `@modelcontextprotocol/sdk`: MCP integration

## Common Commands

### Development
```bash
# Start development server
npm run dev

# Deploy sandbox environment
npx ampx sandbox --stream-function-logs

# Run tests
npm test
npm run test:coverage
```

### Build & Deploy
```bash
# Build for production (memory optimized)
npm run build

# Deploy to AWS Amplify
# (Handled automatically via CI/CD or manual Amplify console)
```

### MCP Server Management
```bash
# Start local MCP server
python mcp-well-data-server.py

# Test MCP integration
node test-mcp-petrophysics-integration.js
```

## Performance Considerations
- Memory-optimized builds with custom webpack config
- Lazy loading for large datasets (50,000+ data points)
- LRU caching for calculation results
- Code splitting for heavy libraries (Plotly, AWS SDK)