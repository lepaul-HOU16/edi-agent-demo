# Implementation Plan: Fix All Agent Backend Functionality

## Overview

This plan systematically fixes **all agents** by identifying and resolving backend breakages introduced during the Amplify to CDK migration. Focus on **lost configurations, credentials, permissions, MCP servers, and Agent Core deployments**.

**Approach**: Intelligent, pattern-based fixes - not brute force.

**Testing**: Localhost only (`npm run dev`) with deployed Lambda backends.

## Phase 1: Discovery & Audit

- [x] 1. Audit all agent environment variables
  - Check Lambda configuration: `aws lambda get-function-configuration --function-name EnergyInsights-development-chat`
  - List all environment variables currently set
  - Compare with .env files to find missing values
  - Check for placeholder values (`your_*_here`, `TODO`)
  - Document all missing/incorrect configurations
  - _Requirements: 0.1, 0.2, 15.1, 15.2_

- [x] 2. Audit all agent IAM permissions
  - Check Lambda role: `aws iam get-role-policy`
  - List all permissions currently granted
  - Check for `bedrock-agent-runtime:InvokeAgent`
  - Check for `bedrock-agent:GetAgent`
  - Check for MCP-related permissions (VPC, security groups)
  - Document all missing permissions
  - _Requirements: 0.1, 0.2, 9.1, 9.2, 9.3, 9.4_

- [x] 3. Discover all MCP server deployments
  - Check if MCP servers are deployed
  - Find MCP server URLs (environment variables, SSM parameters)
  - Test MCP server connectivity from Lambda
  - Check VPC/security group configurations
  - Document MCP server status for each agent
  - _Requirements: 0.1, 0.2, 4.1, 4.2_

- [x] 4. Discover all Bedrock Agent Core deployments
  - List all Bedrock Agents: `aws bedrock-agent list-agents`
  - Check which agents exist and in which regions
  - Verify agent aliases exist
  - Check agent status (PREPARED, DRAFT, etc.)
  - Document Agent Core status for each agent
  - **CRITICAL FINDING**: Original Amplify code uses `@aws-sdk/client-bedrock-agentcore` NOT `@aws-sdk/client-bedrock-agent-runtime`
  - See `amplify/functions/edicraftAgent/mcpClient.ts` line 8 for correct SDK
  - _Requirements: 0.1, 0.2, 3.1, 3.2_

- [x] 5. Analyze each agent handler implementation
  - Read `edicraftAgent.ts` - check for stubs, missing implementations
  - Read `petrophysicsAgent.ts` - check for stubs, missing implementations
  - Read `maintenanceAgent.ts` - check for stubs, missing implementations
  - Read `renewableAgent.ts` - check for stubs, missing implementations
  - Read `autoAgent.ts` - check for stubs, missing implementations
  - Document implementation status for each agent
  - _Requirements: 0.1, 0.2, 0.3, 15.1, 15.2, 15.3_

- [x] 6. Identify common breakage patterns
  - Analyze findings from tasks 1-5
  - Group issues by pattern (config, permissions, MCP, Agent Core, implementation)
  - Prioritize patterns by impact (how many agents affected)
  - Create fix templates for each pattern
  - Document patterns and affected agents
  - _Requirements: 0.3, 0.4, 15.1, 15.2, 15.3, 15.4, 15.5, 17.1, 17.2_

## Phase 2: Configuration & Credentials

- [x] 7. Restore missing environment variables
  - Add all missing variables to `cdk/lib/main-stack.ts`
  - Set actual values from .env or secure storage
  - Deploy Lambda: `cd cdk && npm run deploy`
  - Verify variables are set in deployed Lambda
  - Test each agent can access its configuration
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 8. Restore missing credentials
  - Identify all credentials needed (API keys, passwords, tokens)
  - Check AWS Secrets Manager for existing secrets
  - Add missing secrets to Secrets Manager
  - Update Lambda to read from Secrets Manager
  - Test credential access works
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 9. Fix IAM permissions
  - Add missing `bedrock-agent-runtime:InvokeAgent` permissions
  - Add missing `bedrock-agent:GetAgent` permissions
  - Add MCP-related permissions (if needed)
  - Add S3/DynamoDB permissions (if missing)
  - Deploy and verify permissions work
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

## Phase 3: MCP & Agent Core

- [ ] 10. Deploy/fix MCP servers
  - For each agent needing MCP, check if server is deployed
  - Deploy missing MCP servers
  - Update MCP server URLs in environment variables
  - Configure VPC/security groups for Lambda access
  - Test MCP connectivity from Lambda
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 11. Deploy/fix Bedrock Agent Cores
  - For each agent needing Bedrock Agent, check if deployed
  - Deploy missing Bedrock Agents
  - Create agent aliases if missing
  - Update agent IDs in environment variables
  - Test agent invocation from Lambda
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

## Phase 4: Implementation Fixes

- [x] 12. Add silent mode to message sending
  - Modify `handleSendMessage` in ChatPage.tsx to accept `silent` parameter
  - When `silent: true`, skip adding user message to UI
  - Update EDIcraft button to call with `{ silent: true }`
  - Test that user message doesn't appear in chat
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 13. Fix EDIcraft agent implementation
  - Verify/create MCP client file exists
  - Implement RCON connection logic
  - Implement clear command execution
  - Add configuration validation
  - Add error handling
  - Deploy and test on localhost
  - _Requirements: 1.1-1.5, 4.1-4.5, 5.1-5.5, 7.1-7.5_

- [x] 14. Fix Petrophysics agent implementation
  - Check if MCP server is deployed
  - Verify calculation logic is implemented
  - Add configuration validation
  - Add error handling
  - Deploy and test on localhost
  - _Requirements: 11.1-11.5_

- [x] 15. Fix Maintenance agent implementation
  - Check if MCP server is deployed
  - Verify equipment data access is implemented
  - Add configuration validation
  - Add error handling
  - Deploy and test on localhost
  - _Requirements: 12.1-12.5_

- [x] 16. Fix Renewable agent implementation
  - Check if orchestrator is properly configured
  - Verify workflow execution is implemented
  - Check renewable tools Lambda connectivity
  - Add configuration validation
  - Add error handling
  - Deploy and test on localhost
  - _Requirements: 13.1-13.5_

- [x] 17. Fix Auto agent implementation
  - Verify intent classification works
  - Check general knowledge model access
  - Add configuration validation
  - Add error handling
  - Deploy and test on localhost
  - _Requirements: 14.1-14.5_

## Phase 5: Testing & Validation

- [ ] 18. Test each agent on localhost
  - Start localhost: `npm run dev`
  - Test EDIcraft agent - verify clear works
  - Test Petrophysics agent - verify calculations work
  - Test Maintenance agent - verify equipment data works
  - Test Renewable agent - verify workflows work
  - Test Auto agent - verify routing works
  - Document any remaining issues
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 18.1-18.5_

- [ ] 19. Test error scenarios for each agent
  - Test with missing configuration
  - Test with invalid credentials
  - Test with unreachable services
  - Test with missing permissions
  - Verify error messages are clear and helpful
  - _Requirements: 7.1-7.5, 16.1-16.5_

- [ ] 20. Document all fixes and patterns
  - Document configuration fixes applied
  - Document permission fixes applied
  - Document MCP server deployments
  - Document Agent Core deployments
  - Document implementation fixes
  - Create troubleshooting guide
  - _Requirements: 17.4, 17.5_

- [ ] 21. Final validation
  - Verify all agents work on localhost
  - Verify all error scenarios handled
  - Verify all thought steps returned
  - Get user acceptance
  - Document any known limitations
  - _Requirements: 18.1-18.5_

## Implementation Notes

### Critical Discovery Phase

**Tasks 1-6 are CRITICAL** - they identify what's actually broken before attempting fixes. Don't skip discovery!

### Configuration Priority

1. **Environment Variables** (Task 7) - Quick wins, deploy immediately
2. **IAM Permissions** (Task 9) - Required for everything else
3. **MCP Servers** (Task 10) - Deploy if missing
4. **Agent Cores** (Task 11) - Deploy if missing
5. **Implementation** (Tasks 12-17) - Fix code issues

### Testing Strategy

- **Test on localhost only** - `npm run dev` at http://localhost:3000
- **Deploy Lambda after each fix** - `cd cdk && npm run deploy`
- **Verify in browser console** - Check logs for errors
- **Iterate quickly** - Fix, deploy, test, repeat

### Common Issues to Watch For

1. **Placeholder Values**: `your_agent_id_here`, `TODO: set this`
2. **Wrong Regions**: Agent in us-west-2 but Lambda configured for us-east-1
3. **Missing Aliases**: Using TSTALIASID but alias doesn't exist
4. **VPC Issues**: Lambda can't reach MCP servers
5. **Secrets Not Migrated**: Amplify had secrets, CDK doesn't

### Estimated Timeline

- **Phase 1** (Discovery): 2-3 hours
- **Phase 2** (Config): 1-2 hours + deployment
- **Phase 3** (MCP/Agent Core): 2-4 hours (depends on what needs deploying)
- **Phase 4** (Implementation): 4-6 hours
- **Phase 5** (Testing): 2-3 hours

**Total**: 11-18 hours depending on how much is missing

### Success Criteria

- ✅ All agents work on localhost
- ✅ All configurations present
- ✅ All permissions correct
- ✅ All MCP servers deployed and accessible
- ✅ All Agent Cores deployed and accessible
- ✅ All error messages clear and helpful
- ✅ All thought steps returned
- ✅ No console errors

## Notes

- **Focus on configuration/credentials first** - Most issues are likely here
- **Don't assume anything works** - Verify everything
- **Document as you go** - Future you will thank you
- **Test incrementally** - Don't wait until the end
- **Ask for help** - If credentials are missing, ask user where to find them

- [ ] 3. Install RCON client dependency
  - Add `rcon-client` package to Lambda dependencies
  - Update `package.json` in `cdk/lambda-functions/chat/`
  - Run `npm install` to install dependency
  - Verify package is available for Lambda build
  - _Requirements: 4.2, 4.3_

- [ ] 4. Implement RCON connection in MCP client
  - Import `rcon-client` package
  - Add `connect()` method to establish RCON connection
  - Add `disconnect()` method to close connection
  - Add connection validation and error handling
  - Test connection with Minecraft server credentials
  - _Requirements: 4.2, 4.3, 4.4, 4.5_

- [ ] 5. Implement clear command execution
  - Add `executeClearCommand()` method to MCP client
  - Generate RCON commands for clearing structures
  - Execute commands via RCON connection
  - Parse and return Minecraft server responses
  - Handle command execution errors
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 6. Integrate Bedrock Agent Runtime
  - Import `@aws-sdk/client-bedrock-agent-runtime`
  - Create Bedrock Agent Runtime client with correct region
  - Implement `InvokeAgentCommand` with agent ID and alias
  - Enable trace to capture thought steps
  - Handle agent invocation errors
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 5.1_

- [ ] 7. Extract and format thought steps
  - Parse Bedrock Agent response trace
  - Extract thought steps from trace events
  - Format thought steps for frontend consumption
  - Include tool calls and observations
  - Return thought steps in response
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 8. Implement complete processMessage flow
  - Validate configuration (agent ID, credentials)
  - Invoke Bedrock Agent with user message
  - Extract thought steps from agent response
  - Connect to Minecraft server via RCON
  - Execute clear commands
  - Return combined response with thought steps
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 6.1_

- [ ] 9. Add comprehensive error handling
  - Handle "agent not configured" error
  - Handle "server unreachable" error
  - Handle "authentication failed" error
  - Handle "permission denied" error
  - Return clear error messages with guidance
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 10. Set environment variables
  - Get BEDROCK_AGENT_ID from AWS Bedrock Console
  - Set MINECRAFT_HOST=edicraft.nigelgardiner.com
  - Set MINECRAFT_RCON_PORT=49001
  - Set MINECRAFT_RCON_PASSWORD (obtain from server admin)
  - Set EDI_PLATFORM_URL and EDI_PARTITION (if needed)
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 11. Deploy backend with configuration
  - Run `cd cdk && npm run deploy`
  - Verify Lambda function updated
  - Verify environment variables set
  - Verify IAM permissions correct
  - Check CloudWatch logs for initialization
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 8.1, 8.2, 8.3, 9.1, 9.2_

- [ ] 12. Test RCON connection
  - Create test script to verify RCON connectivity
  - Test authentication with Minecraft server
  - Verify commands execute successfully
  - Check response parsing
  - Document any connection issues
  - _Requirements: 4.2, 4.3, 4.4, 4.5_

- [ ] 13. Test Bedrock Agent invocation
  - Create test script to invoke agent directly
  - Verify agent processes clear request
  - Check thought steps are returned
  - Validate response format
  - Document any agent issues
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 5.1, 6.1_

- [ ] 14. Test frontend silent mode
  - Start localhost: `npm run dev`
  - Navigate to Chat page, select EDIcraft
  - Click "Clear Minecraft Environment"
  - Verify NO user message appears in chat
  - Verify agent response DOES appear
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 15. Test complete end-to-end flow
  - Click Clear button
  - Verify button shows loading spinner
  - Verify no user message in chat
  - Verify agent response appears
  - Verify thought steps visible in chain-of-thought
  - Verify success alert displays
  - Verify Minecraft world actually clears
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 16. Test error scenarios
  - Test with invalid BEDROCK_AGENT_ID
  - Test with invalid RCON password
  - Test with unreachable Minecraft server
  - Test with missing IAM permissions
  - Verify error messages are clear and helpful
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 17. Performance optimization
  - Measure clear operation duration
  - Optimize RCON command batching if needed
  - Add connection pooling if beneficial
  - Ensure operation completes in < 10 seconds
  - Log performance metrics
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 18. Add logging and monitoring
  - Add structured logging for all operations
  - Log RCON connection attempts
  - Log Bedrock Agent invocations
  - Log clear command execution
  - Set up CloudWatch alarms for failures
  - _Requirements: 3.5, 4.5, 5.5, 9.5_

- [ ] 19. Documentation
  - Document environment variable setup
  - Document Bedrock Agent deployment process
  - Document Minecraft server configuration
  - Create troubleshooting guide
  - Document testing procedures
  - _Requirements: All_

- [ ] 20. Final validation
  - Verify all requirements met
  - Test complete flow multiple times
  - Verify consistent behavior
  - Get user acceptance
  - Document any known limitations
  - _Requirements: All_

## Implementation Notes

### Critical Path

1. **Tasks 1-2**: Quick wins (silent mode, verify files)
2. **Tasks 3-5**: RCON connectivity (core functionality)
3. **Tasks 6-8**: Bedrock Agent integration (AI processing)
4. **Tasks 9-11**: Configuration and deployment
5. **Tasks 12-16**: Testing and validation
6. **Tasks 17-20**: Optimization and documentation

### Dependencies

- **Task 3** must complete before Task 4
- **Task 4** must complete before Task 5
- **Task 6** must complete before Task 7
- **Tasks 4-8** must complete before Task 11 (deployment)
- **Task 11** must complete before Tasks 12-16 (testing)

### Estimated Timeline

- **Phase 1** (Tasks 1-2): 30 minutes
- **Phase 2** (Tasks 3-5): 2 hours
- **Phase 3** (Tasks 6-8): 3 hours
- **Phase 4** (Tasks 9-11): 1 hour + deployment time
- **Phase 5** (Tasks 12-16): 2 hours
- **Phase 6** (Tasks 17-20): 2 hours

**Total**: ~10-12 hours of development + testing time

### Prerequisites

Before starting:
1. Obtain Minecraft RCON password from server administrator
2. Deploy Bedrock Agent in AWS (or get existing agent ID)
3. Verify Minecraft server is accessible from AWS Lambda
4. Ensure IAM permissions are correct (already done in Task 18 of previous spec)

### Testing Strategy

1. **Unit tests**: Test individual components (RCON, Bedrock Agent)
2. **Integration tests**: Test component interactions
3. **End-to-end tests**: Test complete user flow
4. **Error tests**: Test all error scenarios
5. **Performance tests**: Verify operation speed

### Success Criteria

- ✅ Clear button works end-to-end
- ✅ No user message in chat
- ✅ Agent response appears
- ✅ Thought steps visible
- ✅ Minecraft world clears
- ✅ Operation completes in < 10 seconds
- ✅ Error messages are clear
- ✅ Works consistently

## Notes

- Frontend UX is already correct (loading, alerts, state management)
- Backend configuration structure is in place (environment variables, IAM)
- Main work is implementing MCP client connectivity
- RCON connection is critical - must work reliably
- Bedrock Agent must be deployed separately in AWS
- Minecraft server must be accessible from Lambda (check security groups)
