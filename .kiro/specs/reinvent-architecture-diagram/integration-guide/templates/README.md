# Code Templates

This directory contains ready-to-use code templates for agent integration.

## Available Templates

### 1. Agent Class Template
**File:** `agent-template.ts`  
**Use for:** Creating new AI agents  
**Includes:**
- BaseEnhancedAgent extension
- Intent detection
- Parameter extraction and validation
- Tool Lambda invocation
- Thought step generation
- Error handling
- Response formatting

### 2. Tool Lambda Template (Python)
**File:** `tool-template-python.py`  
**Use for:** Creating Python-based tool Lambdas  
**Includes:**
- Lambda handler
- Parameter validation
- Data fetching from S3
- Computation logic
- Visualization generation
- Artifact storage
- Error handling

### 3. Tool Lambda Template (TypeScript)
**File:** `tool-template-typescript.ts`  
**Use for:** Creating TypeScript-based tool Lambdas  
**Includes:**
- Lambda handler
- Type definitions
- AWS SDK integration
- Error handling
- Response formatting

### 4. Artifact Component Template
**File:** `artifact-component-template.tsx`  
**Use for:** Creating React components for artifact rendering  
**Includes:**
- Loading states
- Error states
- Empty states
- Data rendering
- Visualization rendering
- Export functionality
- Responsive design

### 5. Test Template
**File:** `test-template.ts`  
**Use for:** Creating unit tests for agents and tools  
**Includes:**
- Agent tests
- Tool tests
- Integration tests
- Mock data
- Assertions

## How to Use Templates

### Step 1: Copy Template

```bash
# Copy agent template
cp templates/agent-template.ts cdk/lambda-functions/chat/agents/yourAgent.ts

# Copy tool template
cp templates/tool-template-python.py cdk/lambda-functions/your-tool/handler.py

# Copy component template
cp templates/artifact-component-template.tsx src/components/artifacts/YourArtifact.tsx
```

### Step 2: Find and Replace

Replace these placeholders throughout the file:

| Placeholder | Replace With | Example |
|-------------|--------------|---------|
| `YourAgent` | Your agent class name | `GeologyAgent` |
| `yourAgent` | Your agent instance name | `geologyAgent` |
| `your_agent` | Your agent type | `geology` |
| `YourTool` | Your tool class name | `FaciesClassifier` |
| `your-tool` | Your tool function name | `geology-tool` |
| `YOUR_TOOL_FUNCTION_NAME` | Environment variable name | `GEOLOGY_TOOL_FUNCTION_NAME` |
| `your_artifact_type` | Your artifact type | `facies_log` |
| `YourArtifact` | Your component name | `FaciesLogArtifact` |

### Step 3: Customize Logic

Replace placeholder logic with your implementation:

```typescript
// Replace this:
private detectIntent(message: string): string {
  // Add your intent detection patterns here
}

// With this:
private detectIntent(message: string): string {
  if (/facies|lithology/.test(message.toLowerCase())) {
    return 'facies_classification';
  }
  return 'general';
}
```

### Step 4: Test

```bash
npm test
```

## Template Customization Guide

### Agent Template Customization

**1. Intent Detection**
```typescript
// Customize patterns for your domain
const yourPatterns = [
  /domain.*specific.*keyword/i,
  /another.*pattern/i
];
```

**2. Parameter Extraction**
```typescript
// Extract domain-specific parameters
const wellName = message.match(/WELL[-_]?\d+/i);
const depth = message.match(/(\d+)\s*(?:ft|feet)/i);
```

**3. Tool Invocation**
```typescript
// Customize tool parameters
const result = await this.invokeToolLambda({
  yourParam1: value1,
  yourParam2: value2
});
```

### Tool Template Customization

**1. Validation Logic**
```python
def _validate_parameters(self, parameters):
    # Add your validation rules
    if 'required_param' not in parameters:
        return {'valid': False, 'error': 'Missing required_param'}
    return {'valid': True}
```

**2. Computation Logic**
```python
def _compute(self, data, parameters):
    # Add your computation
    result = your_algorithm(data, parameters)
    return result
```

**3. Visualization**
```python
def _generate_visualization(self, results, parameters):
    # Generate your visualization
    html = create_plot(results)
    return html
```

### Component Template Customization

**1. Data Rendering**
```typescript
const renderContent = (data: any): React.ReactNode => {
  // Customize for your data structure
  return <YourCustomVisualization data={data} />;
};
```

**2. Styling**
```typescript
// Add custom styles
const customStyles = {
  container: { /* your styles */ },
  visualization: { /* your styles */ }
};
```

## Template Checklist

Before using a template, verify:

- [ ] All placeholders replaced
- [ ] Logic customized for your use case
- [ ] Imports updated
- [ ] Type definitions added
- [ ] Error handling appropriate
- [ ] Logging added
- [ ] Comments updated
- [ ] Tests created

## Common Customizations

### Adding Authentication

```typescript
// In agent template
private async validateUser(userId: string): Promise<boolean> {
  // Add user validation logic
  return true;
}
```

### Adding Caching

```typescript
// In agent template
private cache = new Map<string, any>();

private async getCachedResult(key: string): Promise<any> {
  if (this.cache.has(key)) {
    return this.cache.get(key);
  }
  const result = await this.computeResult();
  this.cache.set(key, result);
  return result;
}
```

### Adding Rate Limiting

```python
# In tool template
from functools import lru_cache
import time

@lru_cache(maxsize=100)
def rate_limited_operation(param):
    time.sleep(0.1)  # Rate limit
    return perform_operation(param)
```

### Adding Metrics

```typescript
// In agent template
private recordMetric(metricName: string, value: number): void {
  console.log(JSON.stringify({
    metric: metricName,
    value: value,
    timestamp: Date.now()
  }));
}
```

## Template Versions

| Template | Version | Last Updated | Changes |
|----------|---------|--------------|---------|
| agent-template.ts | 1.0 | 2025-01-15 | Initial version |
| tool-template-python.py | 1.0 | 2025-01-15 | Initial version |
| artifact-component-template.tsx | 1.0 | 2025-01-15 | Initial version |

## Contributing

To improve these templates:

1. Identify common patterns in your implementations
2. Extract reusable code
3. Add to templates with clear comments
4. Update this README
5. Test with new integrations

## Support

For questions about templates:
- Review [Integration Guide](../README.md)
- Check [Examples](../EXAMPLES.md)
- See [Visual Guide](../VISUAL-GUIDE.md)

---

**Remember:** Templates are starting points, not final solutions. Customize for your specific needs!
