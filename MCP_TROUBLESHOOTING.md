# MCP Server Troubleshooting Guide

## 🔧 Common Issues and Fixes

### Issue 1: "ModuleNotFoundError: No module named 'pandas'"

**Problem**: MCP server can't find required Python packages.

**Cause**: Kiro is using system Python instead of virtual environment.

**Solution**: ✅ **FIXED** - Updated MCP config to use `./start_mcp_with_venv.sh`

**Manual Fix** (if needed):
```json
// In .kiro/settings/mcp.json
{
  "command": "./start_mcp_with_venv.sh",  // ✅ Correct
  "args": []
}
```

**NOT**:
```json
{
  "command": "python3",  // ❌ Uses system Python
  "args": ["mcp-well-data-server.py"]
}
```

### Issue 2: "can't open file '//mcp-well-data-server.py'"

**Problem**: Wrong working directory or file path.

**Cause**: Kiro starts MCP server from wrong directory.

**Solution**: ✅ **FIXED** - Using startup script that sets correct directory.

**Manual Fix** (if needed):
- Ensure `start_mcp_with_venv.sh` is executable: `chmod +x start_mcp_with_venv.sh`
- Check file exists: `ls -la mcp-well-data-server.py`

### Issue 3: "Connection closed" after enabling

**Problem**: Server starts but immediately crashes.

**Common Causes**:
1. Missing dependencies → Use venv startup script
2. AWS credentials not available → Assume credentials first
3. File permissions → Check script is executable

**Diagnostic Steps**:
```bash
# 1. Test S3 access
isen assume lepaul+fedev
python3 test_s3_access.py

# 2. Test server startup
./start_mcp_with_venv.sh
# Should show loading messages, then wait for input

# 3. Test manual connection
source venv/bin/activate
python3 test_mcp_manual.py
```

## 🚀 **Current Working Configuration**

### MCP Config (`.kiro/settings/mcp.json`)
```json
{
  "mcpServers": {
    "petrophysical-analysis": {
      "command": "./start_mcp_with_venv.sh",
      "args": [],
      "env": {},
      "disabled": true,
      "autoApprove": [...]
    }
  }
}
```

### Startup Script (`start_mcp_with_venv.sh`)
- ✅ Sets correct working directory
- ✅ Uses virtual environment Python
- ✅ Checks for required files
- ✅ Handles errors gracefully

## 📋 **Correct Workflow**

### Step 1: Assume AWS Credentials
```bash
isen assume lepaul+fedev
```

### Step 2: Verify Setup (Optional)
```bash
python3 test_s3_access.py
# Should show: ✅ Found 27 .las files
```

### Step 3: Enable MCP Server
- Go to **MCP Server view** in Kiro
- **Enable** `petrophysical-analysis` server
- **OR** edit config: `"disabled": false`

### Step 4: Test Connection
```
"List available wells"
```
**Expected**: 27 wells listed

## 🔍 **Debug Commands**

### Check Virtual Environment
```bash
./venv/bin/python -c "import pandas, boto3, mcp.server; print('✅ All modules OK')"
```

### Check File Permissions
```bash
ls -la start_mcp_with_venv.sh mcp-well-data-server.py
# Both should be readable, script should be executable (+x)
```

### Check AWS Credentials
```bash
aws sts get-caller-identity
# Should show assumed role ARN
```

### Manual Server Test
```bash
source venv/bin/activate
python3 test_final_mcp.py
# Should show: ✅ Well data loaded: 27 wells
```

## ✅ **Status: FIXED**

The MCP server configuration has been updated to:
- ✅ Use virtual environment Python
- ✅ Set correct working directory  
- ✅ Handle missing dependencies
- ✅ Support manual credential workflow

**Ready for testing with 27 wells!** 🎯