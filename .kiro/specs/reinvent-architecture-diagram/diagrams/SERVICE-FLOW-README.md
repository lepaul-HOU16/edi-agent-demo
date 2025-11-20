# Service Call Flow Diagrams

This directory contains detailed sequence diagrams showing the complete service call flows for different types of queries in the AWS Energy Data Insights platform.

## Diagrams Overview

### 1. Authentication Flow (`06-authentication-flow.mmd`)
**Purpose**: Shows the complete authentication and authorization flow from user sign-in through API request validation.

**Key Components**:
- User sign-in with Cognito
- JWT token generation and storage
- Lambda authorizer validation
- Token refresh mechanism
- Error handling for various auth scenarios

**Typical Latency**: ~500ms total
- Cognito authentication: 200ms
- API Gateway: 50ms
- Lambda authorizer: 100ms
- Token validation: 50ms

**Use Cases**:
- Understanding JWT-based authentication
- Debugging authorization issues
- Implementing similar auth patterns
- Security audit and compliance

### 2. Simple Query - Petrophysics (`07-simple-query-petrophysics.mmd`)
**Purpose**: Demonstrates a straightforward query flow with single-agent processing and tool invocation.

**Key Components**:
- Intent detection and agent routing
- S3 data retrieval (LAS files)
- Tool Lambda invocation (petrophysics calculator)
- Bedrock AI response generation
- Thought step generation for transparency
- DynamoDB message persistence

**Typical Latency**: 3-5 seconds total
- API Gateway: 50ms
- Intent detection: 10ms
- S3 read: 100ms
- Calculation: 500ms
- AI generation: 1000ms
- DynamoDB writes: 40ms

**Use Cases**:
- Understanding basic agent workflow
- Implementing simple tool integrations
- Debugging calculation issues
- Performance optimization

### 3. Complex Orchestration - Renewable Energy (`08-complex-orchestration-renewable.mmd`)
**Purpose**: Shows the complete async orchestration pattern for long-running, multi-tool workflows.

**Key Components**:
- Async invocation pattern (fire-and-forget)
- Multi-tool orchestration
- Project lifecycle management
- Progressive thought step updates
- Frontend polling mechanism
- S3 artifact storage and retrieval
- Error handling and partial results

**Typical Latency**: 45-60 seconds total
- Sync response: 2s
- Terrain analysis: 15s
- Layout optimization: 12s
- Wake simulation: 15s
- Report generation: 8s
- DynamoDB operations: 5s
- Polling overhead: 0-2s

**Use Cases**:
- Understanding async processing patterns
- Implementing multi-step workflows
- Debugging orchestration issues
- Capacity planning and scaling

## Timing Annotations

All diagrams include detailed timing annotations showing:
- **Individual service latencies**: Time spent in each service
- **Network overhead**: API Gateway and inter-service communication
- **Processing time**: Actual computation and data processing
- **Total end-to-end latency**: Complete user-perceived response time

### Latency Breakdown by Service

| Service | Typical Latency | Notes |
|---------|----------------|-------|
| API Gateway | 50ms | HTTP API routing |
| Lambda Authorizer | 100ms | JWT validation (with JWKS cache) |
| Cognito Auth | 200ms | User authentication |
| DynamoDB Write | 20ms | Single item put |
| DynamoDB Query | 30ms | GSI query with 10 items |
| S3 GetObject | 100ms | Small file (<1MB) |
| S3 PutObject | 150ms | Medium file (1-5MB) |
| Bedrock InvokeModel | 1000ms | Claude 3.5 Sonnet (500 tokens) |
| Tool Lambda (simple) | 500ms | Calculation only |
| Tool Lambda (complex) | 15s | Data fetching + processing + viz |

## Error Handling Paths

Each diagram includes comprehensive error handling scenarios:

### Authentication Flow Errors
- Invalid credentials
- Expired tokens
- Network failures
- Cognito service errors
- Rate limiting

### Simple Query Errors
- Data not found (404)
- Calculation errors
- Bedrock throttling
- DynamoDB failures

### Complex Orchestration Errors
- Tool Lambda timeouts
- S3 storage failures
- DynamoDB throttling
- Orchestrator failures
- Partial result handling

## Generating Diagrams

### Online Generation (Recommended)
Use the Mermaid Live Editor for quick previews:

```bash
# Generate HTML previews
cd .kiro/specs/reinvent-architecture-diagram
./scripts/generate-html-previews.js

# Open in browser
open diagrams/06-authentication-flow.html
open diagrams/07-simple-query-petrophysics.html
open diagrams/08-complex-orchestration-renewable.html
```

### Command Line Generation
Using mermaid-cli (mmdc):

```bash
# Install mermaid-cli
npm install -g @mermaid-js/mermaid-cli

# Generate PNG images (high resolution)
mmdc -i diagrams/06-authentication-flow.mmd -o output/06-authentication-flow.png -w 2400 -H 1800

mmdc -i diagrams/07-simple-query-petrophysics.mmd -o output/07-simple-query-petrophysics.png -w 2400 -H 2400

mmdc -i diagrams/08-complex-orchestration-renewable.mmd -o output/08-complex-orchestration-renewable.png -w 2400 -H 3000

# Generate SVG (scalable)
mmdc -i diagrams/06-authentication-flow.mmd -o output/06-authentication-flow.svg

mmdc -i diagrams/07-simple-query-petrophysics.mmd -o output/07-simple-query-petrophysics.svg

mmdc -i diagrams/08-complex-orchestration-renewable.mmd -o output/08-complex-orchestration-renewable.svg

# Generate PDF (presentation ready)
mmdc -i diagrams/06-authentication-flow.mmd -o output/06-authentication-flow.pdf -w 2400 -H 1800

mmdc -i diagrams/07-simple-query-petrophysics.mmd -o output/07-simple-query-petrophysics.pdf -w 2400 -H 2400

mmdc -i diagrams/08-complex-orchestration-renewable.mmd -o output/08-complex-orchestration-renewable.pdf -w 2400 -H 3000
```

### Batch Generation
Use the provided script:

```bash
cd .kiro/specs/reinvent-architecture-diagram
./scripts/generate-diagrams.sh
```

This will generate all formats (PNG, SVG, PDF) for all service flow diagrams.

## Using in Presentations

### PowerPoint/Keynote
1. Generate PNG at 2400x1800 (or higher) resolution
2. Insert as image in slide
3. Crop to focus on specific sections if needed
4. Add speaker notes referencing timing annotations

### Web/HTML
1. Generate SVG for scalable graphics
2. Embed in HTML using `<img>` or `<object>` tags
3. Add interactive tooltips for timing details
4. Link to live Mermaid editor for exploration

### Documentation
1. Generate PNG or SVG
2. Include in markdown with alt text
3. Reference specific error paths in troubleshooting guides
4. Link to source `.mmd` files for updates

### Printed Materials
1. Generate PDF at high resolution
2. Print on 11x17 or A3 paper for readability
3. Include timing annotations table separately
4. Add QR codes linking to interactive versions

## Customization

### Modifying Diagrams
1. Edit the `.mmd` source files
2. Update timing annotations based on actual measurements
3. Add new error scenarios as discovered
4. Regenerate outputs using scripts

### Adding New Flows
1. Create new `.mmd` file in `diagrams/` directory
2. Follow naming convention: `##-descriptive-name.mmd`
3. Include timing annotations
4. Document error handling paths
5. Update this README with description
6. Add to generation scripts

### Timing Annotations Format
```mermaid
Note over Service1,Service2: Operation Name (~Xms)
Note right of Service: Latency: ~Xms<br/>- Breakdown 1: Xms<br/>- Breakdown 2: Xms
```

## Performance Optimization

Use these diagrams to identify optimization opportunities:

### High-Impact Optimizations
1. **Cache JWKS keys**: Reduce authorizer latency from 100ms to 10ms
2. **Parallel tool invocations**: Reduce orchestration time by 30-40%
3. **S3 Transfer Acceleration**: Reduce artifact upload time by 50%
4. **DynamoDB batch operations**: Reduce write latency by 60%
5. **Bedrock response streaming**: Improve perceived latency

### Monitoring Points
- Track actual latencies vs. diagram annotations
- Alert on latencies exceeding 2x typical values
- Identify bottlenecks in critical paths
- Measure end-to-end user experience

## Troubleshooting

### Common Issues

**Diagram doesn't render**:
- Check Mermaid syntax with online editor
- Verify all participant names are consistent
- Ensure proper indentation

**Timing annotations unclear**:
- Use consistent format across diagrams
- Include units (ms, s) in all annotations
- Add breakdown for complex operations

**Error paths missing**:
- Review CloudWatch logs for actual errors
- Add error scenarios as discovered
- Document recovery mechanisms

## Related Documentation

- **Architecture Overview**: `design.md`
- **IAM Permissions**: `iam-reference-cards/`
- **Integration Guide**: `integration-guide/`
- **Starter Kit**: `starter-kit/`

## Feedback and Updates

These diagrams should be living documents that evolve with the platform:

1. **Measure actual latencies** in production
2. **Update timing annotations** quarterly
3. **Add new error scenarios** as discovered
4. **Refine based on user feedback**
5. **Keep synchronized with code changes**

## Version History

- **v1.0** (2025-01-15): Initial service flow diagrams
  - Authentication flow
  - Simple query (petrophysics)
  - Complex orchestration (renewable)
  - Timing annotations
  - Error handling paths
