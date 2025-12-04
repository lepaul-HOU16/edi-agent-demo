# Spec Complete: Fix All Agent Backend Functionality

## Status: ✅ APPROVED - Ready for Implementation

**Date**: December 3, 2024

## Spec Summary

This spec addresses **systemic backend breakages** across all agents introduced during the Amplify to CDK migration.

### Scope

**Agents to Fix**:
- EDIcraft Agent (Minecraft/MCP connection)
- Petrophysics Agent (calculation/analysis)
- Maintenance Agent (equipment data)
- Renewable Agent (workflow orchestration)
- Auto Agent (general knowledge routing)

### Root Cause

Amplify provided automatic fallbacks, error handling, and configuration management that weren't properly replicated in the CDK approach, leaving:
- Lost configurations and credentials
- Missing IAM permissions
- Undeployed MCP servers
- Undeployed Agent Cores
- Incomplete backend implementations

### Approach

**Intelligent, Pattern-Based Fixes** - Not brute force:
1. **Discover** what's actually broken (Tasks 1-6)
2. **Fix configurations** and credentials (Tasks 7-9)
3. **Deploy/fix** MCP servers and Agent Cores (Tasks 10-11)
4. **Fix implementations** for each agent (Tasks 12-17)
5. **Test and validate** everything works (Tasks 18-21)

### Testing Strategy

- **Localhost only**: `npm run dev` at http://localhost:3000
- **Deploy Lambda after each fix**: `cd cdk && npm run deploy`
- **Verify in browser console**: Check logs for errors
- **Iterate quickly**: Fix, deploy, test, repeat

## Documents Created

1. **requirements.md** - 18 requirements covering all agents and patterns
2. **design.md** - Systematic analysis methodology, 22 breakage patterns, 6 fix templates
3. **tasks.md** - 21 tasks organized into 5 phases

## Key Features

### Discovery Phase (Critical!)

Tasks 1-6 systematically discover:
- Missing environment variables
- Missing IAM permissions
- MCP server deployment status
- Agent Core deployment status
- Implementation completeness

### Fix Templates

1. **Configuration Discovery** - Find what's missing
2. **Credential Audit** - Validate all credentials present
3. **Permission Validation** - Check IAM permissions
4. **MCP Server Discovery** - Find and test MCP servers
5. **Agent Core Validation** - Verify Bedrock Agents exist
6. **Complete Initialization** - Proper setup with validation

### Emphasis Areas

- ✅ Lost configurations
- ✅ Lost credentials
- ✅ Missing permissions
- ✅ MCP server deployments
- ✅ Agent Core deployments
- ✅ Incomplete implementations

## Next Steps

### Start with Phase 1: Discovery & Audit

**Task 1**: Audit all agent environment variables
```bash
# Check Lambda configuration
aws lambda get-function-configuration \
  --function-name EnergyInsights-development-chat \
  --query 'Environment.Variables' \
  --output json

# Compare with .env files
grep -r "BEDROCK\|MCP\|AGENT" .env* | grep -v ".example"
```

**Task 2**: Audit all agent IAM permissions
```bash
# Check Lambda role
aws iam get-role --role-name <lambda-role-name>
aws iam list-role-policies --role-name <lambda-role-name>
```

**Task 3**: Discover all MCP server deployments

**Task 4**: Discover all Bedrock Agent Core deployments
```bash
aws bedrock-agent list-agents --region us-east-1
aws bedrock-agent list-agents --region us-west-2
```

**Task 5**: Analyze each agent handler implementation

**Task 6**: Identify common breakage patterns

## Estimated Timeline

- **Phase 1** (Discovery): 2-3 hours
- **Phase 2** (Config): 1-2 hours + deployment
- **Phase 3** (MCP/Agent Core): 2-4 hours
- **Phase 4** (Implementation): 4-6 hours
- **Phase 5** (Testing): 2-3 hours

**Total**: 11-18 hours

## Success Criteria

- ✅ All agents work on localhost
- ✅ All configurations present
- ✅ All permissions correct
- ✅ All MCP servers deployed and accessible
- ✅ All Agent Cores deployed and accessible
- ✅ All error messages clear and helpful
- ✅ All thought steps returned
- ✅ No console errors

## Implementation Ready

The spec is complete and approved. Ready to begin implementation with Task 1: Audit all agent environment variables.

To start implementation, open `.kiro/specs/fix-edicraft-e2e/tasks.md` and click "Start task" next to Task 1.
