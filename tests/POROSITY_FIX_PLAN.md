# Porosity Calculation Fix Plan

## Problem Identified

The porosity calculation is failing because of an **architecture mismatch**:

1. **MCP Server Location**: The Python MCP server (`mcp-well-data-server.py`) runs in **Kiro's IDE environment**
2. **Agent Location**: The Enhanced Strands Agent runs in **AWS Lambda**
3. **Communication Gap**: Lambda functions cannot directly call Kiro's local MCP servers

## Current Flow (BROKEN)

```
User Query
  ↓
Chat Interface (Browser)
  ↓
AWS Lambda (enhancedStrandsAgent)
  ↓
❌ Tries to call local MCP tools (petrophysicsTools.ts)
  ↓
❌ These tools don't have the Python calculation logic
  ↓
❌ Returns empty/mock data
```

## Solution Options

### Option 1: Python Lambda Function (RECOMMENDED)
Move the Python calculation logic into a separate Lambda function.

**Pros:**
- Reuses existing Python code
- Real calculations with proper libraries (pandas, numpy)
- Clean separation of concerns

**Implementation:**
1. Create `amplify/functions/petrophysicsCalculator/` with Python runtime
2. Copy calculation logic from `scripts/petrophysics_calculators.py`
3. Update `petrophysicsTools.ts` to invoke the Python Lambda
4. Configure IAM permissions for Lambda-to-Lambda invocation

### Option 2: TypeScript Implementation
Rewrite the Python calculations in TypeScript.

**Pros:**
- Everything in one language
- No Lambda-to-Lambda calls

**Cons:**
- Need to reimplement complex calculations
- Harder to maintain
- May have numerical precision differences

### Option 3: HTTP MCP Bridge
Create an HTTP endpoint that bridges to the MCP server.

**Cons:**
- Complex architecture
- MCP server still needs to run somewhere
- Network latency

## Recommended Solution: Option 1

Create a Python Lambda function with the calculation logic:

```
amplify/functions/petrophysicsCalculator/
├── handler.py              # Lambda entry point
├── petrophysics_calculators.py  # Calculation logic
├── data_quality_assessment.py   # Quality checks
├── requirements.txt        # Python dependencies
└── resource.ts            # Amplify function definition
```

### Implementation Steps

1. **Create Python Lambda Function**
   - Copy calculation modules from `scripts/`
   - Create Lambda handler that accepts calculation requests
   - Return JSON with statistics and curve data

2. **Update petrophysicsTools.ts**
   - Change `calculate_porosity` tool to invoke Python Lambda
   - Pass parameters (wellName, method, etc.)
   - Parse and return Lambda response

3. **Configure Permissions**
   - Add Lambda invoke permission to agent role
   - Pass Python Lambda ARN as environment variable

4. **Test End-to-End**
   - Verify calculations match Python MCP server results
   - Confirm curve data is returned correctly
   - Test frontend display

## Why MCP Server Still Matters

The MCP server configuration in Kiro is still useful for:
- **Local development/testing** of calculation logic
- **Direct Kiro tool calls** (if we add that feature later)
- **Debugging** calculation issues

But for production chat queries, we need the Lambda-based solution.

## Next Steps

1. Create the Python Lambda function structure
2. Implement the handler with calculation logic
3. Update the TypeScript tools to call the Lambda
4. Test the complete flow
5. Deploy and verify

## Estimated Effort

- Python Lambda setup: 30 minutes
- Tool integration: 15 minutes
- Testing: 15 minutes
- **Total: ~1 hour**

## Alternative Quick Fix

If we want a faster solution, we could:
1. Keep the current TypeScript tools
2. Add basic porosity calculation logic in TypeScript
3. Return reasonable mock data with proper structure

But this wouldn't give us real calculations - just properly formatted mock data.
