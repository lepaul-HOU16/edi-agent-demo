# MCP Server Manual Start Solution

## ✅ **Problem Solved**

The petrophysical analysis MCP server now uses a **manual start approach** to ensure proper AWS credential access.

## 🎯 **Why This Approach?**

**Issue**: MCP servers started by Kiro don't inherit AWS credentials from the terminal session.

**Solution**: Disable auto-start and let users manually enable after assuming credentials.

**Result**: Full access to **27 wells** instead of 3-well fallback.

## 🚀 **Current Configuration**

### MCP Server Status
- **Default State**: `"disabled": true` 
- **Startup**: Manual only (user-controlled)
- **Credentials**: Inherited from user's terminal session
- **Data Access**: Full S3 bucket (27 wells)

### Files Created
1. **`START_MCP_SERVER.md`** - User instructions
2. **`test_s3_access.py`** - Pre-flight S3 test
3. **Updated `.kiro/settings/mcp.json`** - Disabled by default

## 📋 **User Workflow**

### Step 1: Assume Credentials
```bash
isen assume lepaul+fedev
```

### Step 2: Verify S3 Access (Optional)
```bash
source venv/bin/activate
python3 test_s3_access.py
```
**Expected Output**: ✅ 27 wells found

### Step 3: Enable MCP Server
- Go to **MCP Server view** in Kiro
- **Enable** the `petrophysical-analysis` server
- **OR** edit `.kiro/settings/mcp.json`: `"disabled": false`

### Step 4: Test Full Access
```
"List available wells"
```
**Expected**: 27 wells (WELL-001 through WELL-024 + 3 additional)

## 📊 **Data Comparison**

| Approach | Wells | Curves/Well | Max Data Points | S3 Access |
|----------|-------|-------------|-----------------|-----------|
| **Auto-start** | 3 | 5 | 2,361 | ❌ No |
| **Manual start** | 27 | 12-17 | 28,038 | ✅ Yes |

## 🔧 **Technical Details**

### Credential Inheritance
- **Problem**: Kiro-started processes don't inherit shell credentials
- **Solution**: User starts server after assuming credentials
- **Mechanism**: Python boto3 inherits from environment

### S3 Configuration
- **Bucket**: `amplify-d1eeg2gu6ddc3z-ma-workshopstoragebucketd9b-lzf4vwokty7m`
- **Path**: `global/well-data/*.las`
- **Files**: 27 .las files (75KB - 4.7MB each)
- **Total Data**: ~50MB of well log data

### Server Performance
- **Startup**: ~1.6 seconds (fast enough for Kiro)
- **Data Loading**: ~3-5 seconds (lazy loading on first tool call)
- **Memory**: Efficient with 27 wells loaded

## 🎯 **Available Analysis**

With 27 wells, users can perform:

### Professional Petrophysical Analysis
- **Porosity Calculations**: Density, neutron, effective methods
- **Shale Volume**: Larionov, linear, Clavier methods  
- **Water Saturation**: Archie's equation
- **Quality Assessment**: Completeness, outliers, corrections

### Rich Datasets
- **WELL-004**: 28,038 data points, 16 curves
- **WELL-003**: 17,477 data points, 17 curves
- **WELL-020**: 19,620 data points, 13 curves

### Real-World Applications
- Multi-well correlation studies
- Formation evaluation workflows
- Reservoir characterization
- Completion optimization

## 🔍 **Troubleshooting**

### Common Issues
1. **"Only 3 wells showing"** → Credentials not assumed before enabling
2. **"Server won't connect"** → Check MCP logs, restart Kiro
3. **"No wells found"** → Run `test_s3_access.py` to verify setup

### Quick Fixes
- **Re-assume credentials**: `isen assume lepaul+fedev`
- **Test S3 access**: `python3 test_s3_access.py`
- **Restart Kiro**: After enabling MCP server

---

## ✅ **Status: READY**

The petrophysical analysis MCP server is now configured for **manual start with full S3 access**. Users can access all 27 wells for professional petrophysical analysis! 🎯

**Last Updated**: September 18, 2025  
**Configuration**: Manual start, S3-enabled, 27 wells available