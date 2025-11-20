# Service Flow Diagrams - Quick Reference

## At a Glance

| Diagram | Purpose | Complexity | Latency | Lines |
|---------|---------|------------|---------|-------|
| 06-authentication-flow | User auth & JWT validation | Low | ~500ms | 95 |
| 07-simple-query-petrophysics | Single-agent query | Medium | 3-5s | 128 |
| 08-complex-orchestration-renewable | Multi-tool async workflow | High | 45-60s | 236 |

## Quick Links

### Authentication Flow
**File**: `06-authentication-flow.mmd`
- **Use Case**: Understanding JWT-based authentication
- **Key Services**: Cognito, API Gateway, Lambda Authorizer
- **Timing**: 500ms total (Cognito: 200ms, Authorizer: 100ms)
- **Errors**: Invalid credentials, expired tokens, rate limiting

### Simple Query - Petrophysics
**File**: `07-simple-query-petrophysics.mmd`
- **Use Case**: Basic agent workflow with tool invocation
- **Key Services**: Chat Lambda, Agent Router, Tool Lambda, Bedrock
- **Timing**: 3-5s total (Calculation: 500ms, AI: 1000ms)
- **Errors**: Data not found, calculation errors, Bedrock throttling

### Complex Orchestration - Renewable
**File**: `08-complex-orchestration-renewable.mmd`
- **Use Case**: Long-running multi-step analysis
- **Key Services**: Orchestrator, 4 Tool Lambdas, S3, DynamoDB
- **Timing**: 45-60s total (Terrain: 15s, Layout: 12s, Sim: 15s, Report: 8s)
- **Errors**: Timeouts, storage failures, partial results

## Common Patterns

### Async Processing Pattern
**Seen in**: Complex Orchestration (08)
```
1. Sync response: "Processing..."
2. Async Lambda invocation
3. Frontend polling (2s interval)
4. Background processing
5. Result detection via polling
```

### Thought Step Pattern
**Seen in**: Simple Query (07), Complex Orchestration (08)
```
1. Intent Detection
2. Parameter Extraction
3. Tool Selection
4. Execution
5. Completion
```

### Error Handling Pattern
**Seen in**: All diagrams
```
1. Detect error
2. Generate error thought step
3. Retry with exponential backoff (if applicable)
4. Return graceful error message
5. Log for monitoring
```

## Timing Benchmarks

### Fast Operations (<100ms)
- API Gateway routing: 50ms
- DynamoDB write: 20ms
- Intent detection: 10ms

### Medium Operations (100ms-1s)
- Lambda authorizer: 100ms
- S3 read: 100ms
- Cognito auth: 200ms
- Tool calculation: 500ms

### Slow Operations (1s-15s)
- Bedrock AI: 1000ms
- Terrain analysis: 15s
- Layout optimization: 12s
- Wake simulation: 15s

### Very Slow Operations (>15s)
- Full renewable analysis: 45-60s (async)

## Error Scenarios by Type

### Authentication (06)
- ❌ Invalid credentials → NotAuthorizedException
- ❌ Expired token → 401 Unauthorized → Auto refresh
- ❌ Network error → Retry with backoff
- ❌ Rate limiting → TooManyRequestsException

### Data Access (07)
- ❌ LAS file not found → 404 → Graceful error
- ❌ S3 access denied → IAM issue → Check permissions
- ❌ Invalid data format → Parsing error → Validation

### Processing (07, 08)
- ❌ Calculation error → Error thought step → Partial results
- ❌ Bedrock throttling → Retry with backoff
- ❌ Lambda timeout → Async pattern prevents user timeout

### Storage (08)
- ❌ S3 PutObject failed → Retry → Fallback to inline
- ❌ DynamoDB throttling → Exponential backoff
- ❌ Artifact too large → Compression → S3 only

## Generation Commands

### Quick Preview (Online)
```bash
# Open in Mermaid Live Editor
open https://mermaid.live/
# Paste .mmd file content
```

### High-Resolution PNG
```bash
mmdc -i 06-authentication-flow.mmd -o output.png -w 2400 -H 1800
```

### Scalable SVG
```bash
mmdc -i 07-simple-query-petrophysics.mmd -o output.svg
```

### Presentation PDF
```bash
mmdc -i 08-complex-orchestration-renewable.mmd -o output.pdf -w 2400 -H 3000
```

### Batch All Formats
```bash
./scripts/generate-diagrams.sh
```

## Presentation Tips

### For Technical Audience
- Focus on timing annotations
- Explain error handling paths
- Discuss optimization opportunities
- Show actual CloudWatch metrics

### For Business Audience
- Emphasize user experience (latency)
- Highlight reliability (error handling)
- Show scalability (async pattern)
- Demonstrate transparency (thought steps)

### For Chalk Talk
- Start with authentication (simple)
- Progress to simple query (medium)
- End with orchestration (complex)
- Use timing to show performance
- Reference error paths for reliability

## Troubleshooting

### Diagram Won't Render
1. Check syntax with online editor
2. Verify participant names are consistent
3. Ensure proper indentation
4. Check for unclosed blocks

### Timing Seems Wrong
1. Measure actual latency in CloudWatch
2. Update annotations with real data
3. Document measurement methodology
4. Review quarterly

### Missing Error Scenario
1. Check CloudWatch logs for actual errors
2. Add to diagram with alt block
3. Document recovery mechanism
4. Update README

## Related Files

- **Detailed README**: `SERVICE-FLOW-README.md`
- **Task Summary**: `../TASK-6-SUMMARY.md`
- **Design Document**: `../design.md`
- **IAM Reference**: `../iam-reference-cards/`

## Version Info

- **Created**: 2025-01-15
- **Diagrams**: 3 (Authentication, Simple Query, Complex Orchestration)
- **Total Lines**: 459
- **Formats**: Mermaid (.mmd), PNG, SVG, PDF
- **Status**: ✅ Complete
