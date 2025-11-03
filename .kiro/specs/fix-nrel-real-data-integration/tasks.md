# Implementation Plan: Fix NREL Real Data Integration

## Overview

This implementation plan removes all synthetic/mock wind data generation and implements real NREL Wind Toolkit API integration, matching the workshop implementation exactly. It also exposes sub-agent reasoning in the chain of thought panel.

**CRITICAL**: This fixes a violation of steering rules. NO SYNTHETIC DATA. REAL NREL API ONLY.

---

## Implementation Tasks

- [x] 1. Create NREL Wind Client (matching workshop code)
  - Create `amplify/functions/renewableTools/nrel_wind_client.py` with exact workshop implementation
  - Implement `get_nrel_api_key()` function (Secrets Manager → env var → error, NO DEMO KEY fallback)
  - Implement `fetch_wind_data()` function with NREL API endpoint
  - Implement `process_wind_data()` function with Weibull fitting
  - Add proper error handling (NO synthetic fallbacks)
  - _Requirements: 1.1, 1.2, 1.3, 3.1, 3.2, 3.3_

- [x] 2. Remove all synthetic data generation code
  - [x] 2.1 Delete synthetic data functions from wind_client.py files
    - Remove `_generate_realistic_wind_data()` from all wind_client.py files
    - Remove `create_synthetic_wind_fallback()` from all wind_client.py files
    - Delete `amplify/functions/renewableTools/wind_client.py` (has synthetic fallbacks)
    - Delete `amplify/functions/renewableTools/simulation/wind_client.py` (has synthetic fallbacks)
    - Delete `amplify/functions/renewableTools/terrain/wind_client.py` (has synthetic fallbacks)
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [x] 2.2 Remove synthetic data from handler files
    - Remove synthetic wind generation from `simulation/handler.py`
    - Remove synthetic wind generation from `terrain/handler.py`
    - Remove any `generate_wind_rose_data()` functions that create mock data
    - _Requirements: 2.1, 2.2_

- [x] 3. Update simulation handler to use NREL client
  - Update `amplify/functions/renewableTools/simulation/handler.py`
  - Replace wind_client imports with nrel_wind_client
  - Remove all synthetic data fallback logic
  - Add proper error handling that returns errors (not synthetic data)
  - Add data source metadata to response (`data_source: 'NREL Wind Toolkit'`, `data_year: 2023`)
  - _Requirements: 1.1, 1.4, 1.5, 2.2, 3.4_

- [x] 4. Update terrain handler to use NREL client
  - Update `amplify/functions/renewableTools/terrain/handler.py`
  - Replace wind_client imports with nrel_wind_client
  - Remove all synthetic data fallback logic
  - Add proper error handling that returns errors (not synthetic data)
  - Add data source metadata to response
  - _Requirements: 1.1, 1.4, 1.5, 2.2, 3.4_

- [x] 5. Add NREL API key configuration
  - Set environment variable `NREL_API_KEY=Fkh6pFT1SPsn9SBw8TDMSl7EnjEe` in Lambda configuration
  - Update `amplify/backend.ts` to add NREL_API_KEY to simulation and terrain Lambdas
  - Document API key setup in deployment guide
  - _Requirements: 1.2, 3.5_

- [x] 6. Enhance chain of thought with sub-agent reasoning
  - [x] 6.1 Add NREL API call thought steps
    - Update `amplify/functions/renewableOrchestrator/handler.ts`
    - Add thought step: "Fetching wind data from NREL Wind Toolkit API"
    - Add thought step: "Processing wind data with Weibull distribution fitting"
    - Include details: data source, year, data points, mean wind speed
    - _Requirements: 4.1, 4.2, 4.3_
  
  - [x] 6.2 Expose sub-agent decision reasoning
    - Add thought steps for parameter validation decisions
    - Add thought steps for tool selection reasoning
    - Add thought steps for data processing steps
    - Ensure all sub-agent reasoning is visible in expandable sections
    - _Requirements: 4.1, 4.4_

- [x] 7. Update UI to show data source transparency
  - [x] 7.1 Add data source labels to wind rose
    - Update `src/components/renewable/PlotlyWindRose.tsx`
    - Add "Data Source: NREL Wind Toolkit (2023)" label
    - Add data quality indicator badge
    - _Requirements: 5.1, 5.2_
  
  - [x] 7.2 Add data source labels to wind rose artifact
    - Update `src/components/renewable/WindRoseArtifact.tsx`
    - Display data source prominently
    - Show data year and quality indicators
    - _Requirements: 5.1, 5.4_
  
  - [x] 7.3 Update error displays
    - Update error message components to show NREL-specific errors
    - Display clear instructions for API key setup
    - Show "No synthetic data used" message in error states
    - _Requirements: 2.4, 5.3_

- [x] 8. Update Plotly wind rose generator
  - Update `amplify/functions/renewableTools/plotly_wind_rose_generator.py`
  - Ensure it works with real NREL data structure
  - Remove any synthetic data generation
  - Add data source metadata to output
  - _Requirements: 1.1, 2.1, 5.1_

- [x] 9. Test NREL integration end-to-end
  - Test wind rose generation with real NREL API
  - Test wake simulation with real NREL API
  - Verify no synthetic data is used anywhere
  - Verify data source labels display correctly
  - Verify chain of thought shows sub-agent reasoning
  - Test error handling (invalid coordinates, API errors)
  - _Requirements: 1.1, 1.4, 2.2, 4.1, 5.1_

- [x] 10. Deploy and validate
  - Deploy updated Lambda functions
  - Verify NREL_API_KEY environment variable is set
  - Test in deployed environment
  - Verify PM requirements are met
  - Get PM approval
  - _Requirements: All_

---

## Task Execution Notes

### Critical Rules
- **NO SYNTHETIC DATA** - If NREL API fails, return error (not mock data)
- **MATCH WORKSHOP** - Use exact same implementation as workshop code
- **NO SHORTCUTS** - Proper implementation only
- **TEST THOROUGHLY** - Verify no synthetic data exists anywhere

### Testing Checklist
- [ ] Wind rose uses real NREL data
- [ ] Wake simulation uses real NREL data
- [ ] No synthetic data generation functions exist in production code
- [ ] Data source "NREL Wind Toolkit" displays in UI
- [ ] Chain of thought shows sub-agent reasoning
- [ ] Errors are clear and helpful (no silent fallbacks)
- [ ] Implementation matches workshop code

### Validation Commands
```bash
# Search for synthetic data (should find ZERO results in production code)
grep -r "synthetic" amplify/functions/renewableTools/*.py
grep -r "mock.*wind" amplify/functions/renewableTools/*.py
grep -r "generate.*wind.*data" amplify/functions/renewableTools/*.py

# Verify NREL client exists
ls -la amplify/functions/renewableTools/nrel_wind_client.py

# Test NREL API integration
python -c "from amplify.functions.renewableTools.nrel_wind_client import NRELWindClient; client = NRELWindClient(); print(client.fetch_wind_data(35.067482, -101.395466))"
```

---

## Reference Files

- Workshop implementation: `agentic-ai-for-renewable-site-design-mainline/workshop-assets/MCP_Server/wind_farm_mcp_server.py`
- Steering rules: `.kiro/steering/no-shortcuts-ever.md`, `.kiro/steering/regression-protection.md`
- Requirements: `.kiro/specs/fix-nrel-real-data-integration/requirements.md`
- Design: `.kiro/specs/fix-nrel-real-data-integration/design.md`

---

## Success Criteria

- ✅ Zero synthetic data generation in production code
- ✅ All wind data from NREL Wind Toolkit API
- ✅ Wind rose displays "Data Source: NREL Wind Toolkit"
- ✅ Sub-agent reasoning visible in chain of thought
- ✅ Implementation matches workshop exactly
- ✅ Clear error messages (no silent fallbacks)
- ✅ PM approves the fix

---

**REMEMBER**: This is fixing a critical violation of steering rules. NO SYNTHETIC DATA. REAL NREL API ONLY.
