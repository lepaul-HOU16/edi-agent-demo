# Deprecated: Incorrectly Converted TypeScript Files

## ⚠️ DO NOT USE THESE FILES

These files were created during an initial attempt to integrate the renewable energy demo by converting Python Strands Agents to TypeScript. This approach was **incorrect** and violated the python-integration guidelines.

## What Went Wrong

1. **Python Strands Agents were converted to TypeScript** instead of being preserved
2. **Lost multi-agent orchestration** (GraphBuilder pattern)
3. **Lost PyWake simulation engine** (replaced with mock data)
4. **Lost GIS processing** (geopandas functionality)
5. **Lost Folium/matplotlib visualizations**

## Files in This Directory

- `renewableEnergyAgent.ts` - Incorrectly converted multi-agent system
- `renewableTerrainAnalysisTool.ts` - Mock terrain analysis (should use Python)
- `renewableLayoutOptimizationTool.ts` - Basic layout logic (should use Python)
- `renewableSimulationTool.ts` - Mock wake simulation (should use PyWake)

## Correct Approach

The correct integration approach is documented in:
- `.kiro/specs/renewable-energy-integration/requirements.md`
- `.kiro/specs/renewable-energy-integration/design.md`

**Key principles:**
1. ✅ Keep all Python Strands Agents as-is
2. ✅ Deploy Python backend using AgentCore
3. ✅ Create lightweight TypeScript integration layer
4. ✅ Use original Folium/matplotlib visualizations
5. ✅ Preserve PyWake simulation engine

## Date Deprecated

October 2, 2025

## Reason for Preservation

These files are kept for reference to:
- Document what was attempted
- Avoid repeating the same mistake
- Provide context for future developers
- Show the evolution of the integration approach
