# How to Start the Petrophysical Analysis MCP Server

The MCP server is **disabled by default** to allow you to assume AWS credentials first and get access to all **27 wells** from S3.

## 🚀 Quick Start (Full S3 Access)

### Step 1: Assume AWS Credentials
```bash
isen assume lepaul+fedev
```

### Step 2: Enable MCP Server
In Kiro, go to the **MCP Server view** in the feature panel and **enable** the `petrophysical-analysis` server.

**OR** manually edit `.kiro/settings/mcp.json` and change:
```json
"disabled": true
```
to:
```json
"disabled": false
```

### Step 3: Test Connection
Try these commands in Kiro chat:
- `"List available wells"` → Should show **27 wells**
- `"Get info for WELL-001"` → Rich dataset with 13 curves

## 📊 What You Get

**With S3 Access (Recommended)**:
- ✅ **27 wells**: WELL-001 through WELL-024 + 3 additional wells
- ✅ **Rich datasets**: 12-17 curves per well, up to 28,038 data points
- ✅ **Professional data**: Real petrophysical analysis capabilities

**Without S3 Access (Fallback)**:
- ⚠️ **3 wells only**: Local fallback data
- ⚠️ **Limited curves**: 5 curves per well
- ⚠️ **Smaller datasets**: 1,656-2,361 data points per well

## 🔧 Alternative: Manual Server Start

If you prefer to run the server manually in terminal:

```bash
# 1. Assume credentials
isen assume lepaul+fedev

# 2. Start MCP server manually (uses venv automatically)
./start_mcp_with_venv.sh
```

Or with explicit venv activation:
```bash
# 1. Assume credentials
isen assume lepaul+fedev

# 2. Activate virtual environment
source venv/bin/activate

# 3. Start MCP server manually
python3 mcp-well-data-server.py
```

Then in another terminal, you can test it or connect Kiro to it.

## 🎯 Available Tools

Once connected, you'll have access to **11 petrophysical analysis tools**:

### Data Access
- `list_wells` - List all available wells
- `get_well_info` - Get well header information and available curves
- `get_curve_data` - Extract specific curve data for depth ranges

### Calculations
- `calculate_porosity` - Density, neutron, effective, total porosity methods
- `calculate_shale_volume` - Larionov, linear, Clavier methods
- `calculate_saturation` - Archie's equation and advanced methods

### Quality Assessment
- `assess_curve_quality` - Data completeness, outliers, noise analysis
- `calculate_data_completeness` - Detailed completeness metrics
- `validate_environmental_corrections` - Correction validation
- `assess_well_data_quality` - Comprehensive well quality assessment

### Statistics
- `calculate_statistics` - Min, max, mean, median for any curve

## 🔍 Troubleshooting

**Server won't connect?**
1. Make sure you ran `isen assume lepaul+fedev` first
2. Check that the server is enabled in MCP settings
3. Restart Kiro after enabling the server

**Only seeing 3 wells?**
- The server is running without S3 credentials
- Follow Step 1 above to assume credentials first

**Server starts but no data?**
- Check the MCP logs in Kiro for specific error messages
- Try running `python3 test_final_mcp.py` in terminal to test manually

---

**Ready to analyze 27 wells of professional petrophysical data!** 🎯