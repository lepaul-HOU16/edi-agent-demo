# Task 1: Environment Variables Audit

## Status: ✅ COMPLETE

**Date**: December 3, 2024

## Summary

Audited all environment variables for agent configuration. Found **critical missing values** that explain why agents are broken.

## Current Lambda Environment Variables

```json
{
  "BEDROCK_AGENT_ID": "",                    // ❌ EMPTY - Critical!
  "BEDROCK_AGENT_ALIAS_ID": "TSTALIASID",   // ✅ Set
  "BEDROCK_REGION": "us-east-1",            // ✅ Set
  "MINECRAFT_HOST": "",                      // ❌ EMPTY - Critical for EDIcraft!
  "MINECRAFT_PORT": "49001",                 // ✅ Set
  "MINECRAFT_RCON_PASSWORD": "",             // ❌ EMPTY - Critical for EDIcraft!
  "EDI_PLATFORM_URL": "",                    // ❌ EMPTY - Needed for OSDU
  "EDI_PARTITION": "",                       // ❌ EMPTY - Needed for OSDU
  "PETROPHYSICS_CALCULATOR_FUNCTION_NAME": "EnergyInsights-development-petrophysics-calculator", // ✅ Set
  "RENEWABLE_ORCHESTRATOR_FUNCTION_NAME": "EnergyInsights-development-renewable-orchestrator",   // ✅ Set
  "STORAGE_BUCKET": "amplify-digitalassistant--workshopstoragebucketd9b-mx1aevbdpmqy",          // ✅ Set
  "CHAT_MESSAGE_TABLE": "ChatMessage-fhzj4la45fevdnax5s2o4hbuqy-NONE",                          // ✅ Set
  "SESSION_CONTEXT_TABLE": "RenewableSessionContext"                                             // ✅ Set
}
```

## Values in .env Files

```bash
# Bedrock Agent
BEDROCK_AGENT_ID=your_agent_id_here          # ❌ PLACEHOLDER
BEDROCK_AGENT_ALIAS_ID=TSTALIASID            # ✅ Valid
BEDROCK_REGION=us-east-1                     # ✅ Valid

# Minecraft (EDIcraft)
MINECRAFT_HOST=edicraft.nigelgardiner.com    # ✅ Valid - NOT in Lambda!
MINECRAFT_RCON_PORT=49001                    # ✅ Valid
MINECRAFT_RCON_PASSWORD=your_rcon_password_here  # ❌ PLACEHOLDER

# OSDU/EDI
EDI_PLATFORM_URL=https://your-osdu-platform-url.com  # ❌ PLACEHOLDER
EDI_PARTITION=your_partition_name            # ❌ PLACEHOLDER
EDI_CLIENT_ID=your_edi_client_id             # ❌ PLACEHOLDER
EDI_CLIENT_SECRET=your_edi_client_secret     # ❌ PLACEHOLDER
EDI_USERNAME=your_edi_username               # ❌ PLACEHOLDER
EDI_PASSWORD=your_edi_password               # ❌ PLACEHOLDER

# MCP Server
MCP_SERVER_URL=http://localhost:8000/mcp     # ❌ LOCALHOST - Won't work from Lambda!
```

## Environment Variables Referenced in Code

Found in `cdk/lambda-functions/chat/agents/`:
- `process.env.BEDROCK_AGENT_ID` ✅ In Lambda (but empty)
- `process.env.BEDROCK_AGENT_ALIAS_ID` ✅ In Lambda
- `process.env.BEDROCK_REGION` ✅ In Lambda
- `process.env.MINECRAFT_HOST` ✅ In Lambda (but empty)
- `process.env.MINECRAFT_PORT` ✅ In Lambda
- `process.env.EDI_PLATFORM_URL` ✅ In Lambda (but empty)
- `process.env.PETROPHYSICS_CALCULATOR_FUNCTION_NAME` ✅ In Lambda
- `process.env.RENEWABLE_ORCHESTRATOR_FUNCTION_NAME` ✅ In Lambda
- `process.env.AWS_REGION` ✅ Always available in Lambda

## Critical Issues Found

### Issue 1: Empty Values in Lambda ❌

**Variables set in CDK but with empty values:**
1. `BEDROCK_AGENT_ID` = "" (should be actual agent ID)
2. `MINECRAFT_HOST` = "" (should be edicraft.nigelgardiner.com)
3. `MINECRAFT_RCON_PASSWORD` = "" (should be actual password)
4. `EDI_PLATFORM_URL` = "" (should be actual OSDU URL)
5. `EDI_PARTITION` = "" (should be actual partition)

**Root Cause**: CDK reads from `process.env.*` but these aren't set when deploying.

### Issue 2: Placeholder Values in .env ❌

**Variables in .env with placeholder values:**
1. `BEDROCK_AGENT_ID=your_agent_id_here`
2. `MINECRAFT_RCON_PASSWORD=your_rcon_password_here`
3. `EDI_PLATFORM_URL=https://your-osdu-platform-url.com`
4. `EDI_PARTITION=your_partition_name`
5. All EDI credentials (CLIENT_ID, CLIENT_SECRET, USERNAME, PASSWORD)

**Root Cause**: Never set actual values after migration.

### Issue 3: Missing Variables ❌

**Variables in .env but NOT in Lambda:**
1. `MCP_SERVER_URL` - Not passed to Lambda at all
2. `EDI_CLIENT_ID` - Not passed to Lambda
3. `EDI_CLIENT_SECRET` - Not passed to Lambda
4. `EDI_USERNAME` - Not passed to Lambda
5. `EDI_PASSWORD` - Not passed to Lambda

**Root Cause**: CDK doesn't include these in environment configuration.

### Issue 4: Localhost MCP URL ❌

`MCP_SERVER_URL=http://localhost:8000/mcp`

**Problem**: Lambda can't reach localhost. MCP server needs to be:
- Deployed as a separate Lambda/service
- Or accessible via VPC endpoint
- Or use Bedrock Agent directly (no separate MCP server)

## Impact Analysis

### EDIcraft Agent: 🔴 BROKEN
**Missing**:
- `BEDROCK_AGENT_ID` (empty)
- `MINECRAFT_HOST` (empty)
- `MINECRAFT_RCON_PASSWORD` (empty)
- `MCP_SERVER_URL` (not in Lambda)

**Impact**: Cannot connect to Bedrock Agent OR Minecraft server. Completely non-functional.

### Petrophysics Agent: 🟡 PARTIALLY BROKEN
**Has**:
- `PETROPHYSICS_CALCULATOR_FUNCTION_NAME` ✅

**Missing**:
- `MCP_SERVER_URL` (if needed)
- `BEDROCK_AGENT_ID` (if using Bedrock Agent)

**Impact**: Calculator Lambda exists, but may not have MCP connectivity.

### Maintenance Agent: 🟡 PARTIALLY BROKEN
**Missing**:
- `BEDROCK_AGENT_ID` (if using Bedrock Agent)
- `MCP_SERVER_URL` (if needed)

**Impact**: Depends on implementation - may be stub only.

### Renewable Agent: 🟢 LIKELY WORKING
**Has**:
- `RENEWABLE_ORCHESTRATOR_FUNCTION_NAME` ✅
- `SESSION_CONTEXT_TABLE` ✅
- `STORAGE_BUCKET` ✅

**Missing**:
- `BEDROCK_AGENT_ID` (if using Bedrock Agent)

**Impact**: Orchestrator exists and is configured. May work without Bedrock Agent.

### Auto Agent: 🟡 UNKNOWN
**Missing**:
- `BEDROCK_AGENT_ID` (if using Bedrock Agent)

**Impact**: Depends on implementation.

## Required Actions

### Immediate (Task 7):
1. Set `MINECRAFT_HOST=edicraft.nigelgardiner.com` in .env
2. Get actual `MINECRAFT_RCON_PASSWORD` from server admin
3. Get actual `BEDROCK_AGENT_ID` from AWS Bedrock Console (or deploy agent)
4. Redeploy Lambda with actual values

### Short-term (Task 8):
1. Get actual EDI/OSDU credentials
2. Add to AWS Secrets Manager
3. Update Lambda to read from Secrets Manager

### Medium-term (Task 10):
1. Determine if MCP servers are needed
2. If yes, deploy MCP servers as Lambda functions or containers
3. Update `MCP_SERVER_URL` to actual endpoints
4. Configure VPC/security groups for connectivity

## Recommendations

### Priority 1: EDIcraft
1. **Get Minecraft RCON password** - Ask server admin
2. **Deploy Bedrock Agent** - Or get existing agent ID
3. **Set environment variables** - Update .env with actual values
4. **Redeploy Lambda** - `cd cdk && npm run deploy`

### Priority 2: MCP Architecture Decision
**Option A**: Use Bedrock Agent directly (no separate MCP server)
- Simpler architecture
- Bedrock Agent has built-in tool calling
- No need for separate MCP server deployment

**Option B**: Deploy MCP servers
- More flexible
- Can use custom tools
- Requires additional infrastructure

**Recommendation**: Start with Option A (Bedrock Agent direct). Add MCP servers later if needed.

### Priority 3: Credentials Management
- Move sensitive credentials to AWS Secrets Manager
- Update Lambda to read from Secrets Manager
- Remove credentials from .env files

## Next Steps

1. ✅ **Task 1 Complete** - Environment audit done
2. ➡️ **Task 2** - Audit IAM permissions
3. ➡️ **Task 3** - Discover MCP server deployments
4. ➡️ **Task 4** - Discover Bedrock Agent deployments
5. ➡️ **Task 7** - Restore missing environment variables (after discovery)

## Files to Update

1. `.env` - Set actual values (get from user/admin)
2. `cdk/lib/main-stack.ts` - Already configured ✅ (from Task 18)
3. Redeploy: `cd cdk && npm run deploy`
