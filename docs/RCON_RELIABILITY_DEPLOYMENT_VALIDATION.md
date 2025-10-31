# RCON Reliability Fixes - Deployment & Validation Guide

## Overview

This document provides comprehensive deployment and validation procedures for the RCON reliability fixes implemented for the EDIcraft agent.

## What Was Fixed

### 1. Enhanced RCON Executor (`rcon_executor.py`)
- ✅ Timeout mechanism (10 seconds per command)
- ✅ Retry logic with exponential backoff (3 attempts: 1s, 2s, 4s)
- ✅ Command result verification and parsing
- ✅ RCONResult dataclass for structured results
- ✅ Comprehensive error handling with categorization

### 2. Command Batching
- ✅ Automatic batching for large fill operations (32x32x32 chunks)
- ✅ Adaptive chunk size based on server performance
- ✅ Parallel and sequential execution modes
- ✅ Smart terrain fill (skips layers with no air blocks)

### 3. Result Parsers
- ✅ `parse_fill_response()` - extracts blocks filled count
- ✅ `parse_gamerule_response()` - extracts gamerule values
- ✅ `is_success_response()` - detects success/failure

### 4. Updated Clear Environment Tool
- ✅ Uses RCONExecutor for reliable command execution
- ✅ Batched fill commands for clearing large areas
- ✅ Verification of each block type clearing operation
- ✅ Tracks blocks cleared per category
- ✅ Handles partial success gracefully

### 5. Updated Time Lock Tool
- ✅ Uses RCONExecutor for command execution
- ✅ Gamerule verification after setting
- ✅ Retry logic if gamerule verification fails (up to 3 attempts)
- ✅ Logs gamerule state before and after changes

### 6. Clear Button UI Behavior
- ✅ Invokes agent directly without creating chat message
- ✅ Displays result as Alert notification on landing page
- ✅ Auto-dismisses success messages after 5 seconds
- ✅ Keeps error messages visible until user dismisses

### 7. Response Deduplication
- ✅ Stable content hash generation
- ✅ `data-content-hash` attribute to track rendered responses
- ✅ Processing lock to prevent concurrent processing
- ✅ Skips render if content hash already exists

### 8. Error Handling and Recovery
- ✅ `format_error_response()` with categorized errors
- ✅ Connection error handling with troubleshooting steps
- ✅ Timeout error handling with operation-specific messages
- ✅ Command error handling with syntax and permission checks
- ✅ Verification error handling with retry suggestions

### 9. Performance Optimizations
- ✅ Parallel command execution using ThreadPoolExecutor
- ✅ Smart terrain fill (skip layers with no air blocks)
- ✅ Response caching for gamerule queries (60 second TTL)
- ✅ Adaptive batch size tuning based on server performance
- ✅ Execution time tracking and logging

### 10. Complete Workflow Tests
- ✅ Clear operation workflow
- ✅ Time lock workflow
- ✅ Terrain fill workflow
- ✅ Clear button workflow
- ✅ Error recovery workflow
- ✅ Performance workflow

## Deployment Steps

### Prerequisites

1. **Minecraft Server Requirements:**
   - Minecraft server running and accessible
   - RCON enabled in `server.properties`:
     ```properties
     enable-rcon=true
     rcon.port=25575
     rcon.password=your_password
     ```
   - Server has operator permissions for RCON user

2. **Environment Variables:**
   ```bash
   export MINECRAFT_HOST="your-server-host"
   export MINECRAFT_RCON_PORT="25575"
   export MINECRAFT_RCON_PASSWORD="your-password"
   ```

3. **AWS Credentials:**
   - AWS CLI configured with appropriate credentials
   - Permissions to deploy Lambda functions
   - Permissions to deploy frontend to Amplify/S3

### Step 1: Deploy Python Tools to Lambda

```bash
# Navigate to edicraft-agent directory
cd edicraft-agent

# Build Docker image
docker build -t edicraft-agent:latest .

# Tag for ECR (replace with your ECR repository)
docker tag edicraft-agent:latest <account-id>.dkr.ecr.<region>.amazonaws.com/edicraft-agent:latest

# Push to ECR
aws ecr get-login-password --region <region> | docker login --username AWS --password-stdin <account-id>.dkr.ecr.<region>.amazonaws.com
docker push <account-id>.dkr.ecr.<region>.amazonaws.com/edicraft-agent:latest

# Update Lambda function
aws lambda update-function-code \
  --function-name edicraft-agent \
  --image-uri <account-id>.dkr.ecr.<region>.amazonaws.com/edicraft-agent:latest

# Wait for update to complete
aws lambda wait function-updated \
  --function-name edicraft-agent

cd ..
```

### Step 2: Deploy React Components to Frontend

```bash
# Build frontend
npm run build

# Deploy via Amplify
npx ampx pipeline-deploy --branch main

# Or deploy to S3 (if using S3 hosting)
aws s3 sync .next/static s3://your-bucket/static
aws s3 sync .next/server s3://your-bucket/server
```

### Step 3: Verify Deployment

```bash
# Check Lambda function status
aws lambda get-function --function-name edicraft-agent

# Check frontend deployment
curl https://your-frontend-url/

# Verify environment variables
aws lambda get-function-configuration \
  --function-name edicraft-agent \
  --query "Environment.Variables"
```

## Validation Procedures

### Automated Validation

Run the comprehensive test suite:

```bash
# Run complete test suite
python3 tests/test-rcon-reliability-complete.py

# Or run the deployment validation script
bash tests/deploy-and-validate-rcon-fixes.sh
```

### Manual Validation Checklist

#### 1. RCON Connection Test
- [ ] Connect to Minecraft server via RCON
- [ ] Execute simple command (e.g., `list`)
- [ ] Verify response is received within timeout
- [ ] Check logs for connection success

#### 2. Timeout Mechanism Test
- [ ] Execute command that should complete quickly
- [ ] Verify command completes within timeout (10s)
- [ ] Check execution time is logged
- [ ] Verify timeout error handling for slow commands

#### 3. Retry Logic Test
- [ ] Execute invalid command
- [ ] Verify command is retried 3 times
- [ ] Check exponential backoff delays (1s, 2s, 4s)
- [ ] Verify final error message after retries exhausted

#### 4. Command Batching Test
- [ ] Execute large fill operation (>32,768 blocks)
- [ ] Verify operation is automatically batched
- [ ] Check batch size is appropriate (32x32x32)
- [ ] Verify all chunks complete successfully
- [ ] Check total blocks affected matches expected

#### 5. Result Verification Test
- [ ] Execute fill command
- [ ] Verify blocks filled count is extracted from response
- [ ] Check count matches expected value
- [ ] Verify success/failure detection works correctly

#### 6. Gamerule Verification Test
- [ ] Set gamerule `doDaylightCycle` to `false`
- [ ] Verify gamerule is actually set
- [ ] Wait 60 seconds
- [ ] Verify gamerule is still set (persistence)
- [ ] Check logs show verification steps

#### 7. Clear Environment Test
- [ ] Build test structures (wellbores, rigs, markers)
- [ ] Click "Clear Minecraft Environment" button
- [ ] Verify structures are removed
- [ ] Check terrain is preserved (if option enabled)
- [ ] Verify operation completes within 30 seconds
- [ ] Check detailed results are returned

#### 8. Terrain Fill Test
- [ ] Create holes in terrain (remove grass blocks)
- [ ] Execute terrain fill operation
- [ ] Verify holes are filled with grass blocks
- [ ] Check smart fill optimization is used
- [ ] Verify surface is repaired correctly

#### 9. Clear Button UI Test
- [ ] Open EDIcraft agent landing page
- [ ] Click "Clear Minecraft Environment" button
- [ ] Verify:
  - [ ] No user prompt appears in chat
  - [ ] Loading indicator shows on button
  - [ ] Alert notification appears on landing page (not in chat)
  - [ ] Success alert auto-dismisses after 5 seconds
  - [ ] Error alerts stay visible until dismissed

#### 10. Response Deduplication Test
- [ ] Open chat interface
- [ ] Send message to EDIcraft agent
- [ ] Wait for response
- [ ] Verify:
  - [ ] Response appears only once
  - [ ] No duplicate messages
  - [ ] No duplicate artifacts
  - [ ] Content hash is stable (check browser console)

#### 11. Error Handling Test
- [ ] Test connection error (stop Minecraft server)
- [ ] Verify error message includes troubleshooting steps
- [ ] Test timeout error (very large operation)
- [ ] Verify timeout error message is operation-specific
- [ ] Test command error (invalid syntax)
- [ ] Verify error message includes syntax help
- [ ] Test permission error (if possible)
- [ ] Verify error message includes permission help

#### 12. Performance Optimization Test
- [ ] Execute multiple independent commands
- [ ] Verify parallel execution is used
- [ ] Check execution time is faster than sequential
- [ ] Test smart terrain fill
- [ ] Verify layers with no air blocks are skipped
- [ ] Check performance metrics are logged

## Expected Results

### Success Criteria

All of the following must be true for deployment to be considered successful:

1. **RCON Connection:** ✅ Connects successfully within 10 seconds
2. **Timeout Mechanism:** ✅ Commands complete within timeout or fail gracefully
3. **Retry Logic:** ✅ Failed commands are retried up to 3 times with backoff
4. **Command Batching:** ✅ Large operations are automatically batched
5. **Result Verification:** ✅ Command results are parsed and verified
6. **Gamerule Verification:** ✅ Gamerules are verified after setting
7. **Clear Environment:** ✅ Structures are removed, terrain is preserved
8. **Terrain Fill:** ✅ Surface holes are repaired with smart optimization
9. **Clear Button UI:** ✅ Works without showing prompt in chat
10. **Response Deduplication:** ✅ No duplicate responses in chat
11. **Error Handling:** ✅ Errors are categorized with helpful messages
12. **Performance:** ✅ Operations complete within expected time

### Performance Benchmarks

- **Clear Operation:** < 30 seconds for typical area (500x255x500)
- **Time Lock:** < 5 seconds including verification
- **Terrain Fill:** < 15 seconds for surface layer (500x10x500)
- **Command Timeout:** 10 seconds per command
- **Total Retry Time:** Max 21 seconds (1s + 2s + 4s + 10s final attempt)
- **Parallel Speedup:** 2-4x faster than sequential for 4+ commands

## Troubleshooting

### Common Issues

#### 1. RCON Connection Failed

**Symptoms:**
- "Connection refused" error
- "Connection timeout" error
- "Authentication failed" error

**Solutions:**
1. Verify Minecraft server is running: `systemctl status minecraft` or `docker ps`
2. Check RCON is enabled in `server.properties`:
   ```properties
   enable-rcon=true
   rcon.port=25575
   rcon.password=your_password
   ```
3. Verify firewall allows RCON port: `sudo ufw allow 25575`
4. Check RCON password is correct
5. Restart Minecraft server after configuration changes

#### 2. Commands Timing Out

**Symptoms:**
- "Command timed out after 10 seconds" error
- Operations never complete

**Solutions:**
1. Check server TPS (ticks per second): `/tps` command
2. Reduce operation size (smaller regions)
3. Increase timeout value if server is slow
4. Check server logs for performance issues
5. Restart server if frozen or crashed

#### 3. Gamerule Not Persisting

**Symptoms:**
- Time lock doesn't work
- Daylight cycle continues despite being locked
- Gamerule verification fails

**Solutions:**
1. Check gamerule is actually set: `/gamerule doDaylightCycle`
2. Verify server permissions allow gamerule changes
3. Check server logs for gamerule errors
4. Try setting gamerule manually in server console
5. Restart server if gamerule changes don't persist

#### 4. Clear Button Shows Prompt in Chat

**Symptoms:**
- User prompt appears in chat when clicking clear button
- Clear operation creates chat message

**Solutions:**
1. Verify frontend code is deployed (check browser cache)
2. Clear browser cache and reload page
3. Check `EDIcraftAgentLanding.tsx` is using direct agent invocation
4. Verify `invokeEDIcraftAgent` mutation is called with silent flag
5. Check browser console for errors

#### 5. Response Duplication in Chat

**Symptoms:**
- Same response appears multiple times
- Duplicate artifacts rendered

**Solutions:**
1. Verify frontend code is deployed (check browser cache)
2. Clear browser cache and reload page
3. Check `ChatMessage.tsx` is using content hash
4. Verify `data-content-hash` attribute is set
5. Check browser console for duplicate render warnings

#### 6. Terrain Fill Not Working

**Symptoms:**
- Surface holes not filled
- No blocks placed
- Operation completes but terrain unchanged

**Solutions:**
1. Check coordinates are correct (y=61-70 for surface)
2. Verify blocks to replace are correct (air for holes)
3. Check server logs for fill command errors
4. Try manual fill command to test: `/fill x1 61 z1 x2 70 z2 grass_block replace air`
5. Verify smart fill optimization is not skipping all layers

## Rollback Procedure

If deployment fails or issues are found, rollback to previous version:

### Rollback Lambda Function

```bash
# List previous versions
aws lambda list-versions-by-function --function-name edicraft-agent

# Rollback to previous version
aws lambda update-function-configuration \
  --function-name edicraft-agent \
  --environment Variables={...previous_env_vars...}

# Or rollback Docker image
docker pull <account-id>.dkr.ecr.<region>.amazonaws.com/edicraft-agent:previous-tag
docker tag <account-id>.dkr.ecr.<region>.amazonaws.com/edicraft-agent:previous-tag <account-id>.dkr.ecr.<region>.amazonaws.com/edicraft-agent:latest
docker push <account-id>.dkr.ecr.<region>.amazonaws.com/edicraft-agent:latest

aws lambda update-function-code \
  --function-name edicraft-agent \
  --image-uri <account-id>.dkr.ecr.<region>.amazonaws.com/edicraft-agent:latest
```

### Rollback Frontend

```bash
# Revert to previous commit
git revert HEAD

# Rebuild and redeploy
npm run build
npx ampx pipeline-deploy --branch main
```

## Post-Deployment Monitoring

### Metrics to Monitor

1. **RCON Connection Success Rate:** Should be > 99%
2. **Command Timeout Rate:** Should be < 1%
3. **Retry Rate:** Should be < 5%
4. **Clear Operation Success Rate:** Should be > 95%
5. **Time Lock Persistence Rate:** Should be 100%
6. **Terrain Fill Success Rate:** Should be > 95%
7. **Average Operation Time:** Should be within benchmarks
8. **Error Rate:** Should be < 2%

### CloudWatch Logs

Monitor the following log groups:

- `/aws/lambda/edicraft-agent` - Lambda function logs
- Check for:
  - RCON connection errors
  - Command timeout errors
  - Retry attempts
  - Performance metrics
  - Error messages

### Alerts to Configure

1. **High Error Rate:** Alert if error rate > 5% over 5 minutes
2. **High Timeout Rate:** Alert if timeout rate > 2% over 5 minutes
3. **RCON Connection Failures:** Alert if connection fails 3+ times in 1 minute
4. **Slow Operations:** Alert if average operation time > 2x benchmark

## Success Confirmation

Deployment is successful when:

- ✅ All automated tests pass
- ✅ All manual validation checks pass
- ✅ Performance benchmarks are met
- ✅ No errors in CloudWatch logs
- ✅ User workflows work end-to-end
- ✅ No regressions in existing functionality

## Documentation Updates

After successful deployment, update:

1. **User Documentation:** Add clear button usage instructions
2. **API Documentation:** Document new RCONExecutor methods
3. **Troubleshooting Guide:** Add new error messages and solutions
4. **Release Notes:** Document all changes and improvements

## Contact

For issues or questions:

- Check CloudWatch logs first
- Review this validation guide
- Check Minecraft server logs
- Contact system administrator if issues persist

---

**Last Updated:** 2025-01-15
**Version:** 1.0.0
**Status:** Ready for Deployment
