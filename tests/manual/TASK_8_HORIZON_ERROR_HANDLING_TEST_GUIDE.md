# Task 8: Horizon Query Error Handling - Manual Test Guide

## Overview
This guide provides step-by-step instructions for manually testing error handling for horizon queries in the EDIcraft agent.

**Requirements:** 2.5, 5.4

## Test Environment Setup

### Prerequisites
- EDIcraft agent deployed (or intentionally not deployed for some tests)
- Access to AWS Lambda console for environment variable manipulation
- Access to chat interface
- Minecraft server (or intentionally unreachable for some tests)

## Test Scenarios

### Test 1: Invalid Horizon Query

**Objective:** Verify that invalid horizon queries produce user-friendly error messages with troubleshooting steps.

**Steps:**
1. Open the chat interface
2. Select "EDIcraft" agent
3. Send an empty or malformed query:
   - Empty: Just press enter without typing
   - Malformed: "find horizon @#$%^&*"

**Expected Results:**
- ❌ Error message displayed
- Error title: "Invalid Horizon Query"
- Troubleshooting steps include:
  - Verify horizon name or ID is correct
  - Check horizon data exists in OSDU platform
  - Try a simpler query: "find a horizon"
  - Specify horizon name explicitly if known
- Error details provided

**Pass Criteria:**
- [ ] Error message is user-friendly (not technical stack trace)
- [ ] Troubleshooting steps are clear and actionable
- [ ] Error includes emoji for visual clarity
- [ ] Numbered troubleshooting steps provided

---

### Test 2: Horizon Not Found

**Objective:** Verify that queries for non-existent horizons produce helpful error messages.

**Steps:**
1. Open the chat interface
2. Select "EDIcraft" agent
3. Send query: "find horizon NONEXISTENT-HORIZON-XYZ-123"

**Expected Results:**
- ❌ Error message displayed
- Error title: "Horizon Not Found"
- Troubleshooting steps include:
  - Verify horizon name or ID is correct
  - Check horizon data exists in OSDU partition
  - Confirm user has permissions to access horizon data
  - Try searching for available horizons: "list horizons"
  - Contact data administrator if horizon should exist
- Current partition name displayed in error message

**Pass Criteria:**
- [ ] Error message is user-friendly
- [ ] Troubleshooting steps are comprehensive
- [ ] Partition name is shown in error message
- [ ] Suggests alternative actions (list horizons)

---

### Test 3: Missing OSDU Credentials

**Objective:** Verify that missing OSDU credentials produce clear configuration error messages.

**Steps:**
1. Access AWS Lambda console
2. Find the EDIcraft handler Lambda function
3. Remove or clear OSDU environment variables:
   - EDI_USERNAME
   - EDI_PASSWORD
   - EDI_CLIENT_ID
   - EDI_CLIENT_SECRET
4. Open chat interface
5. Select "EDIcraft" agent
6. Send query: "find a horizon"

**Expected Results:**
- ❌ Error message displayed
- Error title: "OSDU Platform Error" or "Authentication Failed"
- Troubleshooting steps include:
  - Verify OSDU platform credentials are correct
  - Check EDI_USERNAME and EDI_PASSWORD
  - Check EDI_CLIENT_ID and EDI_CLIENT_SECRET
  - Confirm user has necessary permissions
  - Check platform URL is accessible
- Platform URL and partition name displayed

**Pass Criteria:**
- [ ] Error message clearly indicates credential issue
- [ ] Specific environment variables mentioned
- [ ] Platform URL shown in error message
- [ ] Troubleshooting steps guide user to fix credentials

**Cleanup:**
1. Restore OSDU environment variables
2. Restart Lambda function or wait for cold start

---

### Test 4: OSDU Platform Unreachable

**Objective:** Verify that OSDU platform connectivity issues produce helpful error messages.

**Steps:**
1. Access AWS Lambda console
2. Find the EDIcraft handler Lambda function
3. Set EDI_PLATFORM_URL to an invalid URL:
   - Example: "https://invalid-osdu-platform-that-does-not-exist.com"
4. Open chat interface
5. Select "EDIcraft" agent
6. Send query: "find a horizon"

**Expected Results:**
- ❌ Error message displayed
- Error title: "OSDU Platform Error"
- Troubleshooting steps include:
  - Verify OSDU platform credentials are correct
  - Check platform URL is accessible
  - Confirm user has necessary permissions
  - Verify partition name is correct
  - Check platform status and availability
  - Verify horizon data exists in the platform
- Invalid platform URL displayed in error message

**Pass Criteria:**
- [ ] Error message indicates platform connectivity issue
- [ ] Platform URL shown in error message
- [ ] Troubleshooting steps cover network and configuration
- [ ] Suggests checking platform status

**Cleanup:**
1. Restore correct EDI_PLATFORM_URL
2. Restart Lambda function or wait for cold start

---

### Test 5: Unreachable Minecraft Server

**Objective:** Verify that Minecraft server connectivity issues produce clear error messages.

**Steps:**
1. Access AWS Lambda console
2. Find the EDIcraft handler Lambda function
3. Set MINECRAFT_HOST to an invalid hostname:
   - Example: "invalid-minecraft-server-that-does-not-exist.com"
4. Open chat interface
5. Select "EDIcraft" agent
6. Send query: "build horizon surface"

**Expected Results:**
- ❌ Error message displayed
- Error title: "Unable to Connect to Minecraft Server"
- Troubleshooting steps include:
  - Verify the Minecraft server is running
  - Check RCON is enabled in server.properties
  - Confirm the server is accessible from this network
  - Verify firewall rules allow connections
  - Test connection: telnet [host] [port]
- Minecraft host and port displayed in error message

**Pass Criteria:**
- [ ] Error message clearly indicates Minecraft connectivity issue
- [ ] Minecraft host and port shown in error message
- [ ] Troubleshooting steps cover server, RCON, and network
- [ ] Provides specific command to test connection (telnet)

**Cleanup:**
1. Restore correct MINECRAFT_HOST
2. Restart Lambda function or wait for cold start

---

### Test 6: Minecraft Server Timeout

**Objective:** Verify that Minecraft server timeout issues produce helpful error messages.

**Steps:**
1. This test requires a Minecraft server that is slow to respond or under heavy load
2. Alternatively, use network throttling or firewall rules to simulate timeout
3. Open chat interface
4. Select "EDIcraft" agent
5. Send query: "convert horizon to minecraft coordinates"

**Expected Results:**
- ⏱️ Error message displayed
- Error title: "Connection Timeout"
- Troubleshooting steps include:
  - Check network connectivity to [host]
  - Verify server is not under heavy load
  - Check firewall or security group settings
  - Increase timeout if server is slow to respond
- Minecraft host displayed in error message

**Pass Criteria:**
- [ ] Error message indicates timeout issue
- [ ] Minecraft host shown in error message
- [ ] Troubleshooting steps cover network and server load
- [ ] Suggests checking firewall settings

---

### Test 7: Minecraft RCON Authentication Failed

**Objective:** Verify that RCON authentication failures produce clear error messages.

**Steps:**
1. Access AWS Lambda console
2. Find the EDIcraft handler Lambda function
3. Set MINECRAFT_RCON_PASSWORD to an incorrect value:
   - Example: "wrong-password-123"
4. Open chat interface
5. Select "EDIcraft" agent
6. Send query: "build horizon surface"

**Expected Results:**
- 🔐 Error message displayed
- Error title: "Authentication Failed"
- Troubleshooting steps include:
  - **For Minecraft RCON:**
    - Verify RCON password is correct (MINECRAFT_RCON_PASSWORD)
    - Check RCON is enabled in server.properties
    - Confirm RCON port matches server configuration
  - **For OSDU Platform:**
    - Verify EDI_USERNAME and EDI_PASSWORD are correct
    - Check EDI_CLIENT_ID and EDI_CLIENT_SECRET are valid
    - Confirm user has necessary permissions

**Pass Criteria:**
- [ ] Error message clearly indicates authentication failure
- [ ] Separate sections for Minecraft RCON and OSDU Platform
- [ ] Specific environment variables mentioned
- [ ] Troubleshooting steps cover both authentication systems

**Cleanup:**
1. Restore correct MINECRAFT_RCON_PASSWORD
2. Restart Lambda function or wait for cold start

---

### Test 8: Missing Bedrock Agent Configuration

**Objective:** Verify that missing Bedrock AgentCore configuration produces deployment guidance.

**Steps:**
1. Access AWS Lambda console
2. Find the EDIcraft handler Lambda function
3. Remove or clear Bedrock environment variables:
   - BEDROCK_AGENT_ID
   - BEDROCK_AGENT_ALIAS_ID
4. Open chat interface
5. Select "EDIcraft" agent
6. Send query: "find a horizon"

**Expected Results:**
- ❌ Error message displayed
- Error title: "EDIcraft Agent Configuration Error"
- Troubleshooting steps include:
  - Deploy the Bedrock AgentCore agent: cd edicraft-agent && make deploy
  - Set the environment variables in .env.local
  - Restart the sandbox: npx ampx sandbox
  - Refer to: edicraft-agent/DEPLOYMENT_GUIDE.md
- Missing environment variables listed

**Pass Criteria:**
- [ ] Error message indicates configuration issue
- [ ] Missing environment variables listed
- [ ] Deployment steps provided
- [ ] References deployment guide documentation

**Cleanup:**
1. Restore BEDROCK_AGENT_ID and BEDROCK_AGENT_ALIAS_ID
2. Restart Lambda function or wait for cold start

---

## Automated Test Verification

After completing manual tests, run the automated test suite:

```bash
node tests/test-edicraft-horizon-error-handling.js
```

**Expected Output:**
```
=== Testing EDIcraft Horizon Query Error Handling ===

Task 8: Test Error Handling for Horizon Queries
Requirements: 2.5, 5.4

=== Test 1: Error Categorization ===
[All tests should pass]

=== Test 2: User-Friendly Error Messages ===
[All tests should pass]

=== Test 3: Troubleshooting Steps Present ===
[All tests should pass]

=== Test 4: Error Messages Are User-Friendly ===
[All tests should pass]

=== Test 5: Specific Horizon Error Scenarios ===
[All tests should pass]

=== Test Summary ===
Total Tests: 34
Passed: 34
Failed: 0
Success Rate: 100.0%

✅ All horizon error handling tests passed!
```

## Success Criteria Summary

Task 8 is complete when:

- [ ] All 8 manual test scenarios pass
- [ ] Error messages are user-friendly (no technical jargon)
- [ ] Troubleshooting steps are clear and actionable
- [ ] Error messages include emojis for visual clarity
- [ ] Numbered troubleshooting steps provided
- [ ] Specific configuration values shown in error messages
- [ ] Alternative actions suggested (e.g., "list horizons")
- [ ] Automated test suite passes with 100% success rate

## Notes

- Some tests require intentionally breaking configuration - always restore original values after testing
- Error messages should be helpful to non-technical users
- Troubleshooting steps should be specific and actionable
- Error categorization should be accurate for proper message routing

## Related Documentation

- [EDIcraft Deployment Guide](../../edicraft-agent/DEPLOYMENT_GUIDE.md)
- [EDIcraft Troubleshooting Guide](../../docs/EDICRAFT_TROUBLESHOOTING_GUIDE.md)
- [Task 8 Requirements](.kiro/specs/fix-edicraft-horizon-routing/requirements.md)
- [Task 8 Design](.kiro/specs/fix-edicraft-horizon-routing/design.md)
