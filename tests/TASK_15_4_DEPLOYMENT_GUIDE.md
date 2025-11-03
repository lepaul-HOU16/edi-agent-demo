# Task 15.4: Deploy Code Changes - Deployment Guide

## Overview

This guide covers deploying the project persistence code changes including:
- Updated orchestrator Lambda with project name resolution, session context, and S3 persistence
- Updated tool Lambdas (terrain, layout, simulation, report)
- Frontend changes for action buttons, dashboards, and chain of thought display
- Infrastructure (DynamoDB session context table, AWS Location Service place index)

## Prerequisites

1. **AWS Credentials Configured**
   ```bash
   aws sts get-caller-identity
   ```

2. **Node.js and npm Installed**
   ```bash
   node --version  # Should be v18 or higher
   npm --version
   ```

3. **TypeScript Compiles Without Errors**
   ```bash
   npx tsc --noEmit
   ```

## Deployment Steps

### Step 1: Build Frontend

Build the Next.js application with all frontend changes:

```bash
npm run build
```

**Expected Output:**
- ✓ Compiled successfully
- Build artifacts in `.next/` directory

**What This Deploys:**
- Action buttons component (`src/components/renewable/ActionButtons.tsx`)
- Dashboard components (Wind Resource, Performance Analysis, Wake Analysis)
- Plotly wind rose component
- Simplified chain of thought display
- Updated ChatMessage component with artifact rendering

### Step 2: Deploy Backend Changes

Backend deployment requires restarting the Amplify sandbox to apply changes.

#### Option A: Using Deployment Script (Recommended)

```bash
chmod +x scripts/deploy-project-persistence-code.sh
./scripts/deploy-project-persistence-code.sh
```

The script will:
1. Run pre-deployment checks (AWS credentials, TypeScript compilation)
2. Build frontend
3. Prompt to start Amplify sandbox

#### Option B: Manual Deployment

1. **Stop Current Sandbox** (if running)
   ```bash
   # Press Ctrl+C in the terminal running sandbox
   ```

2. **Start Sandbox**
   ```bash
   npx ampx sandbox
   ```

3. **Wait for Deployment**
   - Deployment takes ~5-10 minutes
   - Watch for "Deployed" message
   - CloudFormation stacks will be created/updated

**What This Deploys:**

**Lambda Functions:**
- `renewableOrchestrator` - Updated with project persistence logic
- `renewableTerrainTool` - Python Lambda for terrain analysis
- `renewableLayoutTool` - Python Lambda for layout optimization
- `renewableSimulationTool` - Python Lambda for wake simulation
- `renewableReportTool` - Python Lambda for report generation

**Infrastructure:**
- DynamoDB table: `RenewableSessionContext` (session tracking)
- AWS Location Service Place Index: `RenewableProjectPlaceIndex` (reverse geocoding)
- IAM permissions for S3, DynamoDB, Location Service

**Environment Variables Added:**
- `SESSION_CONTEXT_TABLE` - DynamoDB table name
- `AWS_LOCATION_PLACE_INDEX` - Place index name
- `RENEWABLE_S3_BUCKET` - S3 bucket for project storage
- `RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME` - Terrain Lambda name
- `RENEWABLE_LAYOUT_TOOL_FUNCTION_NAME` - Layout Lambda name
- `RENEWABLE_SIMULATION_TOOL_FUNCTION_NAME` - Simulation Lambda name
- `RENEWABLE_REPORT_TOOL_FUNCTION_NAME` - Report Lambda name

### Step 3: Verify Deployment

After sandbox deployment completes, verify the deployment:

```bash
# Check Lambda functions are deployed
aws lambda list-functions --query "Functions[?contains(FunctionName, 'renewable')].FunctionName"

# Check DynamoDB table exists
aws dynamodb describe-table --table-name RenewableSessionContext

# Check Location Service place index exists
aws location describe-place-index --index-name RenewableProjectPlaceIndex
```

### Step 4: Run Smoke Tests

Run comprehensive smoke tests to validate deployment:

```bash
npm run test:project-persistence-smoke
```

**Smoke Tests Include:**

1. **Infrastructure Tests:**
   - ✅ Orchestrator Lambda is deployed
   - ✅ Orchestrator has required environment variables
   - ✅ Tool Lambdas are deployed
   - ✅ DynamoDB session context table exists
   - ✅ AWS Location Service place index exists
   - ✅ S3 bucket is accessible
   - ✅ S3 bucket is writable

2. **Functional Tests:**
   - ✅ Orchestrator health check
   - ✅ End-to-end project creation
   - ✅ Project listing works

**Expected Output:**
```
═══════════════════════════════════════════════════════════
🧪 PROJECT PERSISTENCE SMOKE TESTS
═══════════════════════════════════════════════════════════

📦 Infrastructure Tests
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ 1. Orchestrator Lambda is deployed
✅ 2. Orchestrator has required environment variables
✅ 3. Tool Lambdas are deployed
✅ 4. DynamoDB session context table exists
✅ 5. AWS Location Service place index exists
✅ 6. S3 bucket is accessible
✅ 7. S3 bucket is writable

⚙️  Functional Tests
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ 8. Orchestrator health check
✅ 9. End-to-end project creation
✅ 10. Project listing works

═══════════════════════════════════════════════════════════
📊 TEST SUMMARY
═══════════════════════════════════════════════════════════
Total Tests: 10
Passed: 10
Failed: 0
Duration: 5234ms

✅ All smoke tests passed!
```

### Step 5: Manual Testing

Test the deployed functionality in the UI:

1. **Open Chat Interface**
   ```
   http://localhost:3000/chat/[session-id]
   ```

2. **Test Project Creation**
   ```
   Query: "analyze terrain in West Texas at 35.0675, -101.3954"
   
   Expected:
   - Project name generated: "west-texas-wind-farm"
   - Terrain analysis completes
   - Action buttons appear: "Optimize Turbine Layout", "View Project Details"
   - Project status checklist shows: ✓ Terrain Analysis
   ```

3. **Test Session Context**
   ```
   Query: "optimize layout"
   
   Expected:
   - Uses active project from previous query
   - Auto-loads coordinates from project data
   - Layout optimization completes
   - Action buttons appear: "Run Wake Simulation", "Adjust Layout"
   ```

4. **Test Project Listing**
   ```
   Query: "list my renewable projects"
   
   Expected:
   - Shows all projects with status
   - Displays active project marker
   - Shows completion status for each step
   ```

5. **Test Dashboards**
   ```
   Query: "run wake simulation for west-texas-wind-farm"
   
   Expected:
   - Consolidated dashboard displays
   - Wind rose visualization (Plotly)
   - Performance metrics
   - Action buttons: "Generate Report", "View Performance Dashboard"
   ```

6. **Test Chain of Thought**
   ```
   Expected during any query:
   - Clean, minimal thought steps display
   - Cloudscape components (ExpandableSection, StatusIndicator)
   - Actual timing data (milliseconds)
   - Collapsed by default for completed steps
   - Expanded for in-progress and error steps
   ```

## Rollback Procedure

If deployment fails or issues are detected:

### Option 1: Revert Code Changes

```bash
# Revert to previous commit
git revert HEAD

# Restart sandbox
npx ampx sandbox
```

### Option 2: Delete and Recreate Sandbox

```bash
# Delete sandbox
npx ampx sandbox delete

# Checkout previous working commit
git checkout <previous-commit-hash>

# Recreate sandbox
npx ampx sandbox
```

## Troubleshooting

### Issue: TypeScript Compilation Errors

**Symptom:** `npx tsc --noEmit` fails

**Solution:**
1. Check error messages for specific files
2. Fix TypeScript errors
3. Re-run compilation check
4. Retry deployment

### Issue: Frontend Build Fails

**Symptom:** `npm run build` fails

**Solution:**
1. Check for missing dependencies: `npm install`
2. Clear Next.js cache: `rm -rf .next`
3. Retry build
4. Check for import errors in new components

### Issue: Sandbox Deployment Fails

**Symptom:** CloudFormation stack creation fails

**Solution:**
1. Check CloudWatch logs for specific errors
2. Verify AWS credentials have sufficient permissions
3. Check for resource naming conflicts
4. Delete failed stack and retry

### Issue: Environment Variables Not Set

**Symptom:** Smoke tests fail with "Missing environment variables"

**Solution:**
1. Verify sandbox deployment completed successfully
2. Check Lambda function configuration:
   ```bash
   aws lambda get-function-configuration \
     --function-name <orchestrator-function-name> \
     --query "Environment.Variables"
   ```
3. If missing, restart sandbox to apply changes

### Issue: DynamoDB Table Not Found

**Symptom:** Smoke test fails: "Session context table not found"

**Solution:**
1. Verify table exists:
   ```bash
   aws dynamodb list-tables | grep RenewableSessionContext
   ```
2. If missing, check CloudFormation stack for errors
3. Restart sandbox to recreate table

### Issue: Location Service Place Index Not Found

**Symptom:** Smoke test fails: "Place index not found"

**Solution:**
1. Verify place index exists:
   ```bash
   aws location list-place-indexes
   ```
2. If missing, check CloudFormation stack for errors
3. Restart sandbox to recreate place index

### Issue: S3 Access Denied

**Symptom:** Smoke test fails: "Access denied to S3 bucket"

**Solution:**
1. Verify IAM permissions are attached to Lambda role
2. Check bucket policy allows Lambda access
3. Restart sandbox to apply IAM changes

## Deployment Checklist

Use this checklist to ensure complete deployment:

- [ ] Pre-deployment checks passed
  - [ ] AWS credentials configured
  - [ ] TypeScript compiles without errors
  - [ ] Node.js and npm installed

- [ ] Frontend built successfully
  - [ ] `npm run build` completed
  - [ ] No build errors
  - [ ] `.next/` directory created

- [ ] Backend deployed successfully
  - [ ] Amplify sandbox restarted
  - [ ] CloudFormation stacks created/updated
  - [ ] "Deployed" message received

- [ ] Infrastructure verified
  - [ ] Orchestrator Lambda deployed
  - [ ] Tool Lambdas deployed
  - [ ] DynamoDB table created
  - [ ] Location Service place index created
  - [ ] Environment variables set

- [ ] Smoke tests passed
  - [ ] All 10 smoke tests passed
  - [ ] No errors in test output

- [ ] Manual testing completed
  - [ ] Project creation works
  - [ ] Session context works
  - [ ] Project listing works
  - [ ] Dashboards display correctly
  - [ ] Action buttons work
  - [ ] Chain of thought displays correctly

- [ ] Documentation updated
  - [ ] Deployment guide reviewed
  - [ ] Known issues documented
  - [ ] Rollback procedure tested

## Success Criteria

Deployment is considered successful when:

1. ✅ All smoke tests pass (10/10)
2. ✅ Manual testing confirms functionality works
3. ✅ No errors in CloudWatch logs
4. ✅ Frontend displays correctly
5. ✅ Project persistence works end-to-end
6. ✅ Session context persists across requests
7. ✅ Action buttons appear and work
8. ✅ Dashboards display with visualizations
9. ✅ Chain of thought displays cleanly

## Post-Deployment

After successful deployment:

1. **Monitor CloudWatch Logs**
   - Watch for errors in orchestrator Lambda
   - Monitor tool Lambda execution
   - Check for DynamoDB throttling

2. **Collect User Feedback**
   - Test with real user workflows
   - Gather feedback on project naming
   - Validate session context behavior

3. **Performance Monitoring**
   - Monitor S3 operation latency
   - Track DynamoDB read/write units
   - Measure end-to-end response times

4. **Update Documentation**
   - Document any deployment issues encountered
   - Update troubleshooting guide
   - Add new known issues

## Next Steps

After deployment is complete and validated:

1. **Task 15.1**: Update API documentation (if not already done)
2. **Task 15.2**: Create migration guide (if not already done)
3. **User Acceptance Testing**: Have users test the new functionality
4. **Performance Optimization**: Monitor and optimize based on usage patterns
5. **Feature Iteration**: Collect feedback and plan improvements

## Support

If you encounter issues during deployment:

1. Check this troubleshooting guide
2. Review CloudWatch logs for specific errors
3. Consult the design document: `.kiro/specs/renewable-project-persistence/design.md`
4. Review the requirements: `.kiro/specs/renewable-project-persistence/requirements.md`
5. Check previous task completion documents in `tests/` directory

## References

- **Design Document**: `.kiro/specs/renewable-project-persistence/design.md`
- **Requirements**: `.kiro/specs/renewable-project-persistence/requirements.md`
- **Tasks**: `.kiro/specs/renewable-project-persistence/tasks.md`
- **Infrastructure Setup**: `tests/TASK_15_3_INFRASTRUCTURE_DEPLOYMENT_COMPLETE.md`
- **Testing Guide**: `tests/TASK_14_TESTING_VALIDATION_COMPLETE.md`
