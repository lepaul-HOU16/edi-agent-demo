# Python Integration Guidelines

## Core Principle: Preserve Existing Architecture

When integrating Python components from the `agentic-ai-for-renewable-site-design-mainline` repository, **maintain the existing Strands Agents architecture** with minimal refactoring. Use wrapper patterns and bridge components rather than rewriting existing functionality.

## Python File Handling Rules

### 1. Preserve Python Files As-Is
- **All `.py` files should remain Python** - do not convert to TypeScript/JavaScript
- Maintain existing imports, dependencies, and module structure
- Keep Strands Agents framework intact (`strands-agents`, `strands-agents-tools`)
- Preserve MCP server implementations in Python
- Maintain Jupyter notebook workflows (`.ipynb` files)

### 2. Strands Agents Architecture
- **Primary Framework**: Use Strands Agents with AgentCore for AI agent implementations
- **Agent Pattern**: Follow existing `Agent()` class instantiation with system prompts, models, and tools
- **Tool Integration**: Maintain `@tool()` decorator pattern for custom functions
- **Model Integration**: Preserve existing model configurations (Ollama, Bedrock)

### 3. Dependency Management
- **Python Dependencies**: Use existing `pyproject.toml` configurations
- **Key Libraries**: Maintain dependencies on:
  - `strands-agents` and `strands-agents-tools`
  - `bedrock-agentcore` and `bedrock-agentcore-starter-toolkit`
  - Scientific libraries: `pandas`, `numpy`, `scipy`, `geopandas`, `py-wake`
  - Visualization: `folium`, `matplotlib`, `seaborn`
  - MCP: `mcp` package

## Integration Patterns

### 1. Wrapper Approach (Preferred)
Create TypeScript/JavaScript wrappers that call Python services:

```typescript
// TypeScript wrapper for Python agent
export class RenewableEnergyAgent {
  async analyzeWindFarm(data: WindFarmData) {
    // Call Python MCP server or subprocess
    return await this.callPythonAgent('wind_farm_analysis', data);
  }
}
```

### 2. MCP Server Bridge
- Keep existing Python MCP servers (`MCP_Server/` directory)
- Integrate via Model Context Protocol rather than direct code conversion
- Maintain existing server implementations for wind farm analysis, data processing

### 3. Subprocess Integration
For complex Python workflows:
- Use Node.js `child_process` to execute Python scripts
- Pass data via JSON serialization
- Maintain existing Python virtual environment setup

## File Organization

### Python Components Location
```
agentic-ai-for-renewable-site-design-mainline/
├── exploratory/           # Keep existing Python modules
│   ├── data_assistant.py  # Strands Agent implementations
│   ├── layout_assistant.py
│   └── utils.py
├── workshop-assets/       # Preserve workshop structure
│   ├── agents/           # Strands Agents
│   ├── MCP_Server/       # Python MCP servers
│   └── *.ipynb          # Jupyter notebooks
└── pyproject.toml        # Python dependencies
```

### Integration Points
```
src/
├── services/
│   └── python-bridge/    # TypeScript wrappers for Python services
├── components/
│   └── renewable/        # UI components for renewable energy features
└── utils/
    └── python-interop/   # Utilities for Python integration
```

## Specific Integration Guidelines

### 1. Wind Farm Analysis
- **Keep**: Existing `layout_assistant.py` and related Strands Agents
- **Integrate**: Via MCP server or API wrapper
- **UI**: Build TypeScript components that consume Python analysis results

### 2. Data Processing
- **Keep**: Existing `data_assistant.py` with GIS and wind resource processing
- **Integrate**: Through file-based or API communication
- **Visualization**: Use existing Python plotting, display in React components

### 3. Jupyter Notebooks
- **Preserve**: All `.ipynb` files for workshop and tutorial content
- **Location**: Keep in `workshop-assets/` and `exploratory/` directories
- **Integration**: Reference from documentation, don't convert to web components

### 4. MCP Servers
- **Maintain**: Existing Python MCP server implementations
- **Configuration**: Update MCP client configuration to include renewable energy servers
- **Tools**: Keep existing tool definitions and agent configurations

## Development Workflow

### 1. Python Environment
- Use existing `pyproject.toml` and `uv.lock` files
- Maintain separate Python virtual environment
- Keep existing development scripts and makefiles

### 2. Testing Strategy
- **Python Tests**: Keep existing Python test files and patterns
- **Integration Tests**: Create TypeScript tests for wrapper functionality
- **E2E Tests**: Test full workflow from TypeScript UI to Python backend

### 3. Deployment Considerations
- **Python Runtime**: Ensure AWS Lambda supports Python dependencies
- **Container Strategy**: Consider containerized deployment for complex Python dependencies
- **MCP Servers**: Deploy as separate services or Lambda functions

## Migration Strategy

### Phase 1: Minimal Integration
1. Keep all Python files in existing structure
2. Create basic TypeScript wrappers for key functionality
3. Integrate via MCP servers where possible

### Phase 2: Enhanced Integration
1. Build React components for renewable energy workflows
2. Improve data flow between TypeScript and Python components
3. Optimize performance and error handling

### Phase 3: Production Optimization
1. Optimize deployment and scaling
2. Enhance monitoring and logging
3. Improve user experience and performance

## Anti-Patterns to Avoid

❌ **Don't Convert Python to TypeScript**: Preserve existing Strands Agents implementations
❌ **Don't Refactor Agent Architecture**: Keep existing agent patterns and tool definitions
❌ **Don't Merge Dependencies**: Maintain separate Python and Node.js dependency management
❌ **Don't Break Jupyter Workflows**: Preserve notebook-based tutorials and workshops
❌ **Don't Rewrite MCP Servers**: Use existing Python MCP implementations

## Success Criteria

✅ **Preserve Functionality**: All existing Python features work unchanged
✅ **Minimal Refactoring**: Less than 10% of existing Python code modified
✅ **Clean Integration**: Clear separation between Python and TypeScript components
✅ **Maintainable**: Easy to update Python components independently
✅ **Workshop Compatible**: Jupyter notebooks and tutorials remain functional