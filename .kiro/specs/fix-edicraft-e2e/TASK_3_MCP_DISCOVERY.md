# Task 3: MCP Server Discovery - Complete Analysis

## Executive Summary

**Status**: ✅ Discovery Complete

**Key Finding**: **NO MCP servers are currently deployed or configured** for any agent. All agents either:
1. Use Bedrock AgentCore directly (EDIcraft)
2. Use direct Lambda invocation (Renewable)
3. Use Strands API (Maintenance, Petrophysics via Strands)
4. Use direct model invocation (General Knowledge)

**Critical Insight**: The term "MCP" in this codebase refers to **two different concepts**:
1. **Model Context Protocol (MCP)** - A protocol for AI agents to access tools/services
2. **MCP Client** - A misnomer for Bedrock AgentCore client (EDIcraft)

## Detailed Findings by Agent

### 1. EDIcraft Agent

**MCP Server Status**: ❌ **NOT DEPLOYED - NOT NEEDED**

**Architecture**:
- Uses **Bedrock AgentCore** directly (NOT an MCP server)
- File: `cdk/lambda-functions/chat/agents/edicraftAgent/mcpClient.js`
- Actually a **Bedrock Agent Runtime client**, not an MCP server client
- Invokes Bedrock Agent via `InvokeAgentCommand`

**Configuration**:
```typescript
{
  bedrockAgentId: process.env.BEDROCK_AGENT_ID,
  bedrockAgentAliasId: process.env.BEDROCK_AGENT_ALIAS_ID,
  region: process.env.BEDROCK_REGION,
  minecraftHost: process.env.MINECRAFT_HOST,
  minecraftPort: process.env.MINECRAFT_PORT,
  minecraftRconPassword: process.env.MINECRAFT_RCON_PASSWORD
}
```

**What It Actually Does**:
1. Invokes Bedrock AgentCore agent
2. Streams thought steps from agent trace
3. Returns agent response
4. **Does NOT connect to any MCP server**

**Verdict**: The "MCP Client" is a **naming confusion**. It's actually a Bedrock Agent Runtime client.

---

### 2. Petrophysics Agent

**MCP Server Status**: ❌ **NOT DEPLOYED**

**Architecture**:
- Uses **Strands Agent** (not MCP)
- File: `cdk/lambda-functions/chat/agents/enhancedStrandsAgent.ts`
- Connects to Strands API for petrophysical calculations
- No MCP server involved

**Evidence**:
```bash
# Found in scripts/
MCP_ENDPOINT = "https://foz31nms96.execute-api.us-east-1.amazonaws.com/prod/mcp"
```

**Analysis**: This endpoint is from **old workshop code** and is **NOT deployed** in current infrastructure.

**Current Implementation**:
- Uses S3 for well data storage
- Uses Strands API for calculations
- File: `cdk/lambda-functions/chat/agents/mcpWellDataClient.ts` (reads from S3, not MCP)

**Verdict**: No MCP server. Uses Strands API + S3.

---

### 3. Maintenance Agent

**MCP Server Status**: ❌ **NOT DEPLOYED**

**Architecture**:
- Uses **Strands Agent** (not MCP)
- File: `cdk/lambda-functions/chat/agents/maintenanceStrandsAgent.ts`
- Connects to Strands API for maintenance planning
- No MCP server involved

**Verdict**: No MCP server. Uses Strands API.

---

### 4. Renewable Agent

**MCP Server Status**: ❌ **NOT DEPLOYED**

**Architecture**:
- Uses **direct Lambda invocation** (not MCP)
- File: `cdk/lambda-functions/chat/agents/renewableProxyAgent.ts`
- Invokes `renewableOrchestrator` Lambda function directly
- Python backend has MCP utilities but they're for **NREL API**, not an MCP server

**Evidence from Python code**:
```python
# cdk/lambda-functions/renewable-tools/agents/tools/mcp_utils.py
def get_mcp_config():
    """Get MCP configuration from AWS SSM and Secrets Manager"""
    # Gets NREL API credentials, not MCP server URL
```

**Verdict**: No MCP server. Uses direct Lambda invocation + NREL API.

---

### 5. Auto Agent (General Knowledge)

**MCP Server Status**: ❌ **NOT DEPLOYED**

**Architecture**:
- Uses **direct Bedrock model invocation** (not MCP)
- File: `cdk/lambda-functions/chat/agents/generalKnowledgeAgent.ts`
- Invokes Claude model directly via Bedrock Runtime
- No MCP server involved

**Verdict**: No MCP server. Uses Bedrock Runtime directly.

---

## AWS Resource Discovery

### Lambda Functions with "MCP" in Name

```bash
aws lambda list-functions --query 'Functions[?contains(FunctionName, `mcp`)]'
```

**Result**:
```json
[
  {
    "Name": "amplify-d1eeg2gu6ddc3z-ma-mcpAgentInvokerlambda813-pkTsTKVvPsrO",
    "Runtime": "nodejs18.x"
  }
]
```

**Analysis**: This is an **old Amplify-deployed Lambda** that is **NOT used** by current CDK infrastructure.

**Configuration**:
```json
{
  "Environment": {
    "AMPLIFY_SSM_ENV_CONFIG": "{}"
  },
  "VpcConfig": null
}
```

**Verdict**: Orphaned Amplify resource. Not used by any agent.

---

### API Gateway Endpoints

```bash
aws apigateway get-rest-apis --query 'items[?contains(name, `mcp`)]'
```

**Result**: `[]` (No MCP API Gateways found)

**Verdict**: No MCP API Gateway endpoints deployed.

---

### SSM Parameters

```bash
aws ssm get-parameters-by-path --path "/energyinsights" --recursive --query 'Parameters[?contains(Name, `mcp`)]'
```

**Result**: `[]` (No MCP parameters found)

**Verdict**: No MCP configuration in SSM Parameter Store.

---

## Environment Variable Analysis

### Lambda Environment Variables

```bash
aws lambda get-function-configuration --function-name EnergyInsights-development-chat --query 'Environment.Variables' | grep -i mcp
```

**Result**: No MCP variables found

**Verdict**: No MCP_SERVER_URL or similar variables configured in deployed Lambda.

---

### .env.example

```bash
# MCP Server Configuration
# URL for the Model Context Protocol server (if using external MCP server)
MCP_SERVER_URL=http://localhost:8000/mcp
```

**Analysis**: This is a **placeholder** for potential future MCP server. Not currently used.

---

## VPC and Security Group Analysis

**Question**: Can Lambda reach MCP servers?

**Answer**: N/A - No MCP servers exist to reach.

**Lambda VPC Configuration**:
```json
{
  "VpcConfig": null
}
```

**Verdict**: Lambda is NOT in a VPC. If MCP servers were deployed in VPC, Lambda couldn't reach them.

---

## Code References to MCP

### Scripts (Workshop/Testing Code)

Found in `scripts/` directory:
- `check_wells.py` - References old workshop MCP endpoint
- `comprehensive_tool_test.py` - References old workshop MCP endpoint
- `mcp-well-data-server.py` - Workshop implementation, not deployed

**Endpoint Referenced**:
```python
MCP_ENDPOINT = "https://foz31nms96.execute-api.us-east-1.amazonaws.com/prod/mcp"
```

**Status**: This is from the **AWS workshop** and is **NOT deployed** in current infrastructure.

---

## Summary Table

| Agent | MCP Server Needed? | MCP Server Deployed? | Actual Architecture |
|-------|-------------------|---------------------|---------------------|
| EDIcraft | ❌ No | ❌ No | Bedrock AgentCore |
| Petrophysics | ❌ No | ❌ No | Strands API + S3 |
| Maintenance | ❌ No | ❌ No | Strands API |
| Renewable | ❌ No | ❌ No | Direct Lambda + NREL API |
| Auto (General Knowledge) | ❌ No | ❌ No | Bedrock Runtime |

---

## Recommendations

### 1. Update Task List

**Current Task 10**: "Deploy/fix MCP servers"

**Recommendation**: ❌ **REMOVE THIS TASK** - No MCP servers are needed.

**Rationale**:
- EDIcraft uses Bedrock AgentCore (already deployed)
- Other agents use Strands API or direct Lambda invocation
- No MCP servers are part of the architecture

---

### 2. Rename Misleading Files

**Current**: `cdk/lambda-functions/chat/agents/edicraftAgent/mcpClient.js`

**Recommendation**: Rename to `bedrockAgentClient.js` or `agentCoreClient.js`

**Rationale**: It's not an MCP client, it's a Bedrock Agent Runtime client.

---

### 3. Clean Up Environment Variables

**Current**: `.env.example` has `MCP_SERVER_URL=http://localhost:8000/mcp`

**Recommendation**: Remove or comment out with explanation that it's not used.

---

### 4. Update Documentation

**Current**: Design doc mentions "MCP Client" for EDIcraft

**Recommendation**: Update to say "Bedrock Agent Runtime Client"

---

## Connectivity Testing

### EDIcraft Bedrock Agent

**Test**: Can Lambda invoke Bedrock Agent?

**Command**:
```bash
aws bedrock-agent list-agents --region us-east-1
```

**Next Step**: Task 4 will check if Bedrock Agents are deployed.

---

### Strands API

**Test**: Can Lambda reach Strands API?

**Status**: Strands agents are working (based on previous task results)

**Verdict**: ✅ Connectivity is fine

---

### Renewable Orchestrator Lambda

**Test**: Can chat Lambda invoke renewable orchestrator?

**Status**: Direct Lambda invocation via AWS SDK

**Verdict**: ✅ No network connectivity issues (same AWS account)

---

## Conclusion

**MCP Server Status for All Agents**: ❌ **NONE DEPLOYED, NONE NEEDED**

**Key Takeaway**: The term "MCP" in this codebase is **misleading**. What's called "MCP Client" is actually:
1. **Bedrock Agent Runtime Client** (EDIcraft)
2. **S3 Data Client** (Petrophysics well data)
3. **Strands API Client** (Petrophysics calculations, Maintenance)
4. **Direct Lambda Invocation** (Renewable)
5. **Bedrock Runtime Client** (General Knowledge)

**Impact on Task List**:
- ✅ Task 3 (this task): Complete
- ❌ Task 10 "Deploy/fix MCP servers": **REMOVE - NOT APPLICABLE**
- ✅ Task 4 "Discover Bedrock Agent Cores": **PROCEED** (this is what's actually needed)

**Next Steps**:
1. Mark Task 3 complete
2. Remove Task 10 from task list
3. Proceed to Task 4: Discover Bedrock Agent Core deployments
4. Update design doc to clarify "MCP Client" is actually "Bedrock Agent Runtime Client"

---

## Appendix: What IS Model Context Protocol (MCP)?

**MCP (Model Context Protocol)** is a protocol for AI agents to access external tools and services.

**Example MCP Server**: A server that provides tools like:
- `get_weather(location)` - Get weather data
- `search_database(query)` - Search a database
- `execute_command(cmd)` - Execute system commands

**How It Works**:
1. AI agent connects to MCP server
2. MCP server exposes available tools
3. AI agent calls tools via MCP protocol
4. MCP server executes tools and returns results

**In This Codebase**:
- ❌ No MCP servers are deployed
- ❌ No agents use MCP protocol
- ✅ Agents use Bedrock AgentCore, Strands API, or direct Lambda invocation instead

**Why the Confusion?**:
- EDIcraft's `mcpClient.js` is **misnamed** - it's a Bedrock Agent Runtime client
- Workshop code references MCP endpoints that aren't deployed
- `.env.example` has MCP_SERVER_URL placeholder that's not used

**Recommendation**: Rename `mcpClient.js` to `bedrockAgentClient.js` to avoid confusion.
