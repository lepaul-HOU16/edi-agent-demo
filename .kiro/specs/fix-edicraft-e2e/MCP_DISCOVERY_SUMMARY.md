# MCP Server Discovery - Executive Summary

## 🎯 Key Finding

**NO MCP servers are deployed or needed for any agent.**

## 📊 Agent Architecture Summary

| Agent | Uses MCP? | Actual Architecture |
|-------|-----------|---------------------|
| **EDIcraft** | ❌ No | Bedrock AgentCore (direct invocation) |
| **Petrophysics** | ❌ No | Strands API + S3 well data |
| **Maintenance** | ❌ No | Strands API |
| **Renewable** | ❌ No | Direct Lambda invocation + NREL API |
| **General Knowledge** | ❌ No | Bedrock Runtime (Claude model) |

## 🔍 What We Discovered

### 1. Naming Confusion
The file `cdk/lambda-functions/chat/agents/edicraftAgent/mcpClient.js` is **misnamed**:
- ❌ It's NOT an MCP (Model Context Protocol) client
- ✅ It's a **Bedrock Agent Runtime client**
- Invokes Bedrock AgentCore via `InvokeAgentCommand`
- No MCP server involved

### 2. AWS Resources
- **Lambda Functions**: Found 1 old Amplify Lambda with "mcp" in name (orphaned, not used)
- **API Gateways**: None with MCP endpoints
- **SSM Parameters**: No MCP configuration
- **Environment Variables**: No MCP_SERVER_URL in deployed Lambda

### 3. Workshop Code
Found references to MCP endpoints in `scripts/` directory:
```python
MCP_ENDPOINT = "https://foz31nms96.execute-api.us-east-1.amazonaws.com/prod/mcp"
```
**Status**: This is from AWS workshop materials, **NOT deployed** in current infrastructure.

## ✅ What Actually Works

### EDIcraft Agent
```
User → Chat Lambda → EDIcraft Agent → Bedrock AgentCore → Minecraft RCON
```
- Uses Bedrock Agent Runtime SDK
- No MCP server in the chain

### Petrophysics Agent
```
User → Chat Lambda → Strands Agent → Strands API → Calculations
                                   → S3 → Well Data
```
- Uses Strands API for calculations
- Uses S3 for well data storage
- No MCP server involved

### Maintenance Agent
```
User → Chat Lambda → Strands Agent → Strands API → Maintenance Planning
```
- Uses Strands API
- No MCP server involved

### Renewable Agent
```
User → Chat Lambda → Renewable Proxy → Renewable Orchestrator Lambda → NREL API
```
- Direct Lambda-to-Lambda invocation
- NREL API for wind data
- No MCP server involved

### General Knowledge Agent
```
User → Chat Lambda → General Knowledge Agent → Bedrock Runtime → Claude Model
```
- Direct Bedrock Runtime invocation
- No MCP server involved

## 📝 Recommendations

### 1. Update Task List
- ✅ Task 3 (MCP Discovery): **COMPLETE**
- ❌ Task 10 (Deploy/fix MCP servers): **REMOVE** - Not applicable

### 2. Rename Files
- `mcpClient.js` → `bedrockAgentClient.js` (clarify what it actually is)

### 3. Clean Up Documentation
- Update design doc to say "Bedrock Agent Runtime Client" not "MCP Client"
- Remove or clarify MCP_SERVER_URL in .env.example

### 4. Next Steps
- ✅ Proceed to Task 4: Discover Bedrock Agent Core deployments
- This is what EDIcraft actually needs (not MCP servers)

## 🎓 What IS MCP?

**Model Context Protocol (MCP)** is a protocol for AI agents to access external tools:
- Example: Weather API, database queries, system commands
- Server exposes tools via MCP protocol
- AI agent calls tools through MCP

**In this codebase**: No MCP servers are used. Agents use:
- Bedrock AgentCore (EDIcraft)
- Strands API (Petrophysics, Maintenance)
- Direct Lambda invocation (Renewable)
- Bedrock Runtime (General Knowledge)

## 📄 Full Details

See `TASK_3_MCP_DISCOVERY.md` for complete analysis including:
- Detailed agent-by-agent breakdown
- AWS resource discovery commands
- Code references and evidence
- VPC/security group analysis
- Connectivity testing results
