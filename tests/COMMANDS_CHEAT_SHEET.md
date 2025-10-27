# Testing Commands Cheat Sheet

## 🚀 Quick Copy-Paste Commands

### Start Testing (3 commands)

```bash
# 1. Start sandbox (Terminal 1 - keep open)
npx ampx sandbox

# 2. Verify deployment (Terminal 2 - wait for sandbox to deploy first)
node tests/check-deployment-status.js

# 3. Run smoke test (Terminal 2)
./tests/run-renewable-e2e-tests.sh smoke
```

---

## 📋 Test Commands

### Automated Tests

```bash
# Smoke test (5 min - recommended first test)
./tests/run-renewable-e2e-tests.sh smoke

# All tests (30 min)
./tests/run-renewable-e2e-tests.sh all

# Specific category tests
./tests/run-renewable-e2e-tests.sh terrain
./tests/run-renewable-e2e-tests.sh layout
./tests/run-renewable-e2e-tests.sh windrose
./tests/run-renewable-e2e-tests.sh wake
./tests/run-renewable-e2e-tests.sh report
./tests/run-renewable-e2e-tests.sh persistence
./tests/run-renewable-e2e-tests.sh actions
./tests/run-renewable-e2e-tests.sh dashboards
./tests/run-renewable-e2e-tests.sh errors
```

---

## 🔍 Diagnostic Commands

### Check Deployment Status

```bash
# Quick deployment check
node tests/check-deployment-status.js

# List all Lambda functions
aws lambda list-functions | grep Renewable

# Check specific Lambda configuration
aws lambda get-function-configuration --function-name [FUNCTION_NAME]
```

### Check Logs

```bash
# Tail orchestrator logs (live)
aws logs tail /aws/lambda/[ORCHESTRATOR_NAME] --follow

# Tail simulation logs (live)
aws logs tail /aws/lambda/[SIMULATION_NAME] --follow

# Get recent logs (last 5 minutes)
aws logs tail /aws/lambda/[FUNCTION_NAME] --since 5m

# Get logs from specific time
aws logs tail /aws/lambda/[FUNCTION_NAME] --since 2025-01-14T10:00:00
```

### Check S3 Storage

```bash
# List renewable projects
aws s3 ls s3://[BUCKET_NAME]/renewable/

# List specific project
aws s3 ls s3://[BUCKET_NAME]/renewable/[PROJECT_NAME]/

# Check project data file
aws s3 cp s3://[BUCKET_NAME]/renewable/[PROJECT_NAME]/project_data.json -
```

---

## 🧪 Manual UI Test Prompts

### Copy-Paste These in Chat Interface

```
Test 1: Analyze terrain at coordinates 35.067482, -101.395466 in Texas
```

```
Test 2: Optimize the turbine layout for this site with 25 turbines
```

```
Test 3: Generate a wind rose analysis for this location
```

```
Test 4: Run a wake simulation for this wind farm layout
```

```
Test 5: Generate a comprehensive project report
```

---

## 🛠️ Troubleshooting Commands

### Sandbox Issues

```bash
# Kill existing sandbox processes
pkill -f ampx

# Restart sandbox
npx ampx sandbox

# Check if sandbox is running
ps aux | grep ampx
```

### Lambda Issues

```bash
# Get Lambda function names
aws lambda list-functions --query "Functions[?contains(FunctionName, 'Renewable')].FunctionName" --output table

# Check Lambda environment variables
aws lambda get-function-configuration --function-name [FUNCTION_NAME] --query "Environment.Variables" --output json

# Invoke Lambda directly (test)
aws lambda invoke --function-name [FUNCTION_NAME] --payload '{"test": "data"}' response.json
```

### Network/Connectivity

```bash
# Test NREL API (if using)
curl "https://developer.nrel.gov/api/wind-toolkit/v2/wind/wtk-bchrrr-v1-0-0-download.csv?api_key=[KEY]&wkt=POINT(-101.395466%2035.067482)&attributes=windspeed_100m&years=2023&email=test@example.com"

# Check AWS credentials
aws sts get-caller-identity

# Check AWS region
aws configure get region
```

---

## 📊 Performance Testing

```bash
# Time a specific test
time ./tests/run-renewable-e2e-tests.sh terrain

# Monitor Lambda metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Duration \
  --dimensions Name=FunctionName,Value=[FUNCTION_NAME] \
  --start-time 2025-01-14T00:00:00Z \
  --end-time 2025-01-14T23:59:59Z \
  --period 3600 \
  --statistics Average,Maximum
```

---

## 🔄 Reset/Cleanup Commands

```bash
# Clear S3 test data
aws s3 rm s3://[BUCKET_NAME]/renewable/ --recursive

# Clear CloudWatch logs
aws logs delete-log-group --log-group-name /aws/lambda/[FUNCTION_NAME]

# Stop sandbox
# (Ctrl+C in sandbox terminal)
```

---

## 📝 Documentation Commands

```bash
# View test documentation
cat tests/EXECUTE_TESTS_NOW.md
cat tests/TEST_EXECUTION_CHECKLIST.md
cat tests/RENEWABLE_TEST_CHEAT_SHEET.md

# View test results
cat tests/DASHBOARD_TEST_RESULTS.md
cat tests/RENEWABLE_TESTING_SUMMARY.md

# List all test files
ls -la tests/*.md
ls -la tests/*.sh
ls -la tests/*.js
```

---

## 🎯 Common Workflows

### Daily Testing Workflow

```bash
# 1. Start sandbox
npx ampx sandbox

# 2. Wait for deployment, then verify
node tests/check-deployment-status.js

# 3. Run smoke test
./tests/run-renewable-e2e-tests.sh smoke

# 4. If pass, done! If fail, check logs
aws logs tail /aws/lambda/[FUNCTION_NAME] --follow
```

### Pre-Deployment Workflow

```bash
# 1. Run all automated tests
./tests/run-renewable-e2e-tests.sh all

# 2. Manual UI verification (5 prompts)
# (Use browser)

# 3. Check performance metrics
# (Review test output)

# 4. Review CloudWatch logs
aws logs tail /aws/lambda/[FUNCTION_NAME] --since 30m

# 5. If all pass, deploy!
```

### Debugging Workflow

```bash
# 1. Reproduce issue
./tests/run-renewable-e2e-tests.sh [category]

# 2. Check Lambda logs
aws logs tail /aws/lambda/[FUNCTION_NAME] --follow

# 3. Check S3 data
aws s3 ls s3://[BUCKET_NAME]/renewable/

# 4. Check Lambda config
aws lambda get-function-configuration --function-name [FUNCTION_NAME]

# 5. Test directly
aws lambda invoke --function-name [FUNCTION_NAME] --payload '{}' response.json
```

---

## 🚀 Quick Start (Copy All)

```bash
# Terminal 1: Start sandbox
npx ampx sandbox

# Terminal 2: Wait 5-10 min, then run
node tests/check-deployment-status.js
./tests/run-renewable-e2e-tests.sh smoke
```

---

## 📞 Get Help

```bash
# View test index
cat tests/RENEWABLE_TESTING_INDEX.md

# View execution guide
cat tests/EXECUTE_TESTS_NOW.md

# View checklist
cat tests/TEST_EXECUTION_CHECKLIST.md

# View this cheat sheet
cat tests/COMMANDS_CHEAT_SHEET.md
```

---

**Pro Tip:** Keep this file open in a terminal for quick copy-paste! 🚀
