# Task 4: Bedrock Agent Core Discovery

## Status: ✅ COMPLETE

**Date**: December 3, 2024

## Summary

Discovered all Bedrock Agent deployments across AWS regions. Found **4 agents in us-east-1**, all in PREPARED status with proper aliases.

## Agents Found

### Region: us-east-1 ✅

#### 1. Maintenance Agent
- **Agent ID**: `UZIMUIUEGG`
- **Name**: `A4E-Maintenance-4b5`
- **Status**: `PREPARED` ✅
- **Description**: Agent for energy industry maintenance workflows
- **Latest Version**: `1`
- **Updated**: 2025-02-07

**Aliases**:
- `TSTALIASID` (AgentTestAlias) → DRAFT version
- `U5UDPF00FT` (agent-alias) → Version 1

#### 2. Petrophysics Agent (Primary)
- **Agent ID**: `QUQKELPKM2`
- **Name**: `A4E-Petrophysics-agent-e9a`
- **Status**: `PREPARED` ✅
- **Latest Version**: `1`
- **Updated**: 2025-11-05

**Aliases**:
- `S5YWIUZOGB` (A4E-Petrophysics-agent-alias-e9a) → Version 1
- `TSTALIASID` (AgentTestAlias) → DRAFT version

#### 3. Petrophysics Agent (Secondary)
- **Agent ID**: `XYFNFVBDNE`
- **Name**: `petrophysics-agent`
- **Status**: `PREPARED` ✅
- **Description**: Petrophysical analysis agent with calculation tools
- **Updated**: 2025-11-05

**Aliases**:
- `TSTALIASID` (AgentTestAlias) → DRAFT version

#### 4. Regulatory Agent
- **Agent ID**: `2CVHG4QHQ1`
- **Name**: `regulatory-agent-3b7`
- **Status**: `PREPARED` ✅
- **Description**: This agent is designed to help with regulatory compliance.
- **Latest Version**: `1`
- **Updated**: 2025-02-26

**Aliases**:
- `GOFIQ5RJUQ` (regulatory-agent-alias-3b7) → Version 1
- `TSTALIASID` (AgentTestAlias) → DRAFT version

### Other Regions Checked

- **us-west-2**: No agents ❌
- **eu-west-1**: No agents ❌

## Key Findings

### ✅ Good News

1. **All agents are PREPARED** - Ready for invocation
2. **All agents have TSTALIASID alias** - Standard test alias exists
3. **Most agents have production aliases** - Version 1 aliases available
4. **All in us-east-1** - Matches Lambda configuration (`BEDROCK_REGION=us-east-1`)

### ❌ Issues Found

#### Issue 1: No EDIcraft Agent Deployed
**Problem**: No agent found for EDIcraft/Minecraft functionality.

**Expected**: Agent with name like "edicraft-agent" or "minecraft-agent"

**Impact**: EDIcraft agent handler references `BEDROCK_AGENT_ID` but no agent exists for this purpose.

**Options**:
1. Deploy new EDIcraft Bedrock Agent
2. Use one of existing agents (not recommended - wrong domain)
3. Implement EDIcraft without Bedrock Agent (direct RCON)

#### Issue 2: Multiple Petrophysics Agents
**Problem**: Two petrophysics agents exist:
- `QUQKELPKM2` (A4E-Petrophysics-agent-e9a) - Newer, has production alias
- `XYFNFVBDNE` (petrophysics-agent) - Older, only test alias

**Recommendation**: Use `QUQKELPKM2` (newer agent with production alias)

#### Issue 3: No Renewable Agent
**Problem**: No dedicated renewable/wind farm agent found.

**Impact**: Renewable agent may not use Bedrock Agent at all (uses orchestrator Lambda directly).

**Status**: This may be intentional - renewable workflow uses orchestrator, not Bedrock Agent.

#### Issue 4: Empty BEDROCK_AGENT_ID in Lambda
**Problem**: Lambda has `BEDROCK_AGENT_ID=""` (empty string).

**Impact**: All agents that try to invoke Bedrock Agent will fail.

**Solution**: Set specific agent ID per agent type in Lambda configuration.

## Agent Mapping Recommendations

Based on discovery, here's the recommended agent ID mapping:

### EDIcraft Agent
**Current**: `BEDROCK_AGENT_ID=""` ❌
**Recommended**: 
- **Option A**: Deploy new EDIcraft agent
- **Option B**: Implement without Bedrock Agent (direct RCON)
- **Option C**: Use general knowledge model (not ideal)

**Decision Needed**: Does EDIcraft need AI reasoning, or just RCON execution?

### Petrophysics Agent
**Current**: `BEDROCK_AGENT_ID=""` ❌
**Recommended**: `BEDROCK_AGENT_ID=QUQKELPKM2` ✅
**Alias**: `S5YWIUZOGB` (production) or `TSTALIASID` (test)

### Maintenance Agent
**Current**: `BEDROCK_AGENT_ID=""` ❌
**Recommended**: `BEDROCK_AGENT_ID=UZIMUIUEGG` ✅
**Alias**: `U5UDPF00FT` (production) or `TSTALIASID` (test)

### Renewable Agent
**Current**: `BEDROCK_AGENT_ID=""` ❌
**Recommended**: No Bedrock Agent needed (uses orchestrator Lambda)
**Status**: Likely working without Bedrock Agent

### Auto Agent
**Current**: `BEDROCK_AGENT_ID=""` ❌
**Recommended**: Use general knowledge model (no specific agent)
**Status**: May not need Bedrock Agent

## Architecture Insights

### Current Lambda Configuration
```typescript
// From cdk/lib/main-stack.ts
environment: {
  BEDROCK_AGENT_ID: process.env.BEDROCK_AGENT_ID || '',  // ❌ Empty
  BEDROCK_AGENT_ALIAS_ID: 'TSTALIASID',                  // ✅ Valid
  BEDROCK_REGION: 'us-east-1',                            // ✅ Correct
}
```

### Problem: Single Agent ID for All Agents
**Current Design**: One `BEDROCK_AGENT_ID` for all agent types.

**Issue**: Different agents need different Bedrock Agents:
- Petrophysics → `QUQKELPKM2`
- Maintenance → `UZIMUIUEGG`
- EDIcraft → (needs deployment)

**Solutions**:

#### Option A: Agent-Specific Environment Variables
```typescript
environment: {
  PETROPHYSICS_AGENT_ID: 'QUQKELPKM2',
  MAINTENANCE_AGENT_ID: 'UZIMUIUEGG',
  EDICRAFT_AGENT_ID: '',  // To be deployed
  BEDROCK_REGION: 'us-east-1',
}
```

#### Option B: Agent Routing Logic
```typescript
// In agent handler
function getAgentIdForType(agentType: string): string {
  const agentMap = {
    'petrophysics': 'QUQKELPKM2',
    'maintenance': 'UZIMUIUEGG',
    'edicraft': '',  // To be deployed
  };
  return agentMap[agentType] || '';
}
```

#### Option C: Configuration File
```json
// agents-config.json
{
  "petrophysics": {
    "agentId": "QUQKELPKM2",
    "aliasId": "S5YWIUZOGB",
    "region": "us-east-1"
  },
  "maintenance": {
    "agentId": "UZIMUIUEGG",
    "aliasId": "U5UDPF00FT",
    "region": "us-east-1"
  }
}
```

**Recommendation**: Option A (agent-specific env vars) - Simplest and most explicit.

## Alias Strategy

### TSTALIASID (Test Alias)
- **Purpose**: Testing and development
- **Routes to**: DRAFT version
- **Status**: Available on all agents
- **Use for**: Localhost testing

### Production Aliases
- **Maintenance**: `U5UDPF00FT` → Version 1
- **Petrophysics**: `S5YWIUZOGB` → Version 1
- **Regulatory**: `GOFIQ5RJUQ` → Version 1

**Recommendation**: Use `TSTALIASID` for development, production aliases for deployed environment.

## Impact on Each Agent

### EDIcraft Agent: 🔴 CRITICAL ISSUE
**Status**: No Bedrock Agent deployed for EDIcraft

**Options**:
1. **Deploy EDIcraft Bedrock Agent** (recommended if AI reasoning needed)
   - Create agent with Minecraft/RCON tools
   - Configure action groups for clear/build commands
   - Deploy and get agent ID

2. **Implement without Bedrock Agent** (recommended if just RCON execution)
   - Direct RCON connection from Lambda
   - No AI reasoning, just command execution
   - Simpler architecture

**Decision Point**: Does EDIcraft need AI to interpret user requests, or just execute predefined commands?

### Petrophysics Agent: 🟢 AGENT EXISTS
**Status**: Agent `QUQKELPKM2` ready to use

**Action Required**:
1. Set `PETROPHYSICS_AGENT_ID=QUQKELPKM2` in Lambda
2. Use alias `S5YWIUZOGB` for production or `TSTALIASID` for testing
3. Verify agent handler uses correct environment variable

### Maintenance Agent: 🟢 AGENT EXISTS
**Status**: Agent `UZIMUIUEGG` ready to use

**Action Required**:
1. Set `MAINTENANCE_AGENT_ID=UZIMUIUEGG` in Lambda
2. Use alias `U5UDPF00FT` for production or `TSTALIASID` for testing
3. Verify agent handler uses correct environment variable

### Renewable Agent: 🟢 NO AGENT NEEDED
**Status**: Uses orchestrator Lambda, not Bedrock Agent

**Action Required**: None - orchestrator already configured

### Auto Agent: 🟡 DECISION NEEDED
**Status**: May use general knowledge model, not specific agent

**Action Required**: Verify implementation doesn't require Bedrock Agent

## Next Steps

### Immediate (Task 5):
1. Analyze each agent handler implementation
2. Determine which agents actually use Bedrock Agent
3. Identify stub implementations vs. real implementations

### Short-term (Task 6):
1. Identify common patterns across agents
2. Create fix templates for agent configuration
3. Prioritize fixes by impact

### Medium-term (Task 11):
1. **EDIcraft**: Decide on Bedrock Agent vs. direct RCON
2. **Petrophysics**: Set `PETROPHYSICS_AGENT_ID=QUQKELPKM2`
3. **Maintenance**: Set `MAINTENANCE_AGENT_ID=UZIMUIUEGG`
4. **Update CDK**: Add agent-specific environment variables
5. **Redeploy**: `cd cdk && npm run deploy`

## Configuration Changes Needed

### Update cdk/lib/main-stack.ts

```typescript
// Current (single agent ID)
environment: {
  BEDROCK_AGENT_ID: process.env.BEDROCK_AGENT_ID || '',
  BEDROCK_AGENT_ALIAS_ID: 'TSTALIASID',
  BEDROCK_REGION: 'us-east-1',
}

// Recommended (agent-specific IDs)
environment: {
  // Petrophysics
  PETROPHYSICS_AGENT_ID: 'QUQKELPKM2',
  PETROPHYSICS_AGENT_ALIAS_ID: 'S5YWIUZOGB',  // or TSTALIASID for testing
  
  // Maintenance
  MAINTENANCE_AGENT_ID: 'UZIMUIUEGG',
  MAINTENANCE_AGENT_ALIAS_ID: 'U5UDPF00FT',  // or TSTALIASID for testing
  
  // EDIcraft (to be deployed or removed)
  EDICRAFT_AGENT_ID: process.env.EDICRAFT_AGENT_ID || '',
  EDICRAFT_AGENT_ALIAS_ID: 'TSTALIASID',
  
  // Common
  BEDROCK_REGION: 'us-east-1',
}
```

### Update Agent Handlers

Each agent handler should read its specific environment variable:

```typescript
// petrophysicsAgent.ts
const agentId = process.env.PETROPHYSICS_AGENT_ID;
const aliasId = process.env.PETROPHYSICS_AGENT_ALIAS_ID || 'TSTALIASID';

// maintenanceAgent.ts
const agentId = process.env.MAINTENANCE_AGENT_ID;
const aliasId = process.env.MAINTENANCE_AGENT_ALIAS_ID || 'TSTALIASID';

// edicraftAgent.ts
const agentId = process.env.EDICRAFT_AGENT_ID;
const aliasId = process.env.EDICRAFT_AGENT_ALIAS_ID || 'TSTALIASID';
```

## Summary

### Discovered
- ✅ 4 Bedrock Agents in us-east-1
- ✅ All agents in PREPARED status
- ✅ All agents have TSTALIASID alias
- ✅ Most agents have production aliases

### Issues
- ❌ No EDIcraft agent deployed
- ❌ Empty BEDROCK_AGENT_ID in Lambda
- ❌ Single agent ID for multiple agent types
- ⚠️ Multiple petrophysics agents (use newer one)

### Recommendations
1. Use agent-specific environment variables
2. Set Petrophysics → `QUQKELPKM2`
3. Set Maintenance → `UZIMUIUEGG`
4. Decide on EDIcraft architecture (Bedrock Agent vs. direct RCON)
5. Update CDK configuration
6. Redeploy Lambda

### Next Task
➡️ **Task 5**: Analyze each agent handler implementation to see which actually use Bedrock Agent and which are stubs.

