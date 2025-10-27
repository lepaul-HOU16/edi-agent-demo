# Task 5: Intelligent Algorithm Selection Test Guide

## Overview

This test verifies that the Strands agents intelligently select appropriate layout algorithms based on terrain conditions and that turbine placement adapts to constraints rather than using rigid grid patterns.

## Test Scenarios

### Scenario 1: Flat Open Terrain (Texas Panhandle)
- **Location**: Amarillo, TX (35.067482, -101.395466)
- **Terrain**: Flat, open with minimal obstacles
- **Expected Algorithm**: Grid layout
- **Expected Behavior**: Regular spacing, most turbines placed
- **Validation**: Should place 20+ out of 25 turbines

### Scenario 2: Complex Terrain (Near Water Bodies)
- **Location**: Chicago, IL (41.8781, -87.6298)
- **Terrain**: Water bodies, buildings, urban obstacles
- **Expected Algorithm**: Greedy or adaptive layout
- **Expected Behavior**: Avoids obstacles, adaptive placement
- **Validation**: Should place 15+ out of 25 turbines, skipping obstacles

### Scenario 3: Moderate Terrain (Rural Area)
- **Location**: Denver, CO (39.7392, -104.9903)
- **Terrain**: Rural with some constraints
- **Expected Algorithm**: Offset grid or semi-regular
- **Expected Behavior**: Semi-regular pattern with adaptations
- **Validation**: Should place 18+ out of 25 turbines

## Running the Test

```bash
# Run the intelligent algorithm selection test
node tests/test-intelligent-algorithm-selection.js
```

## What the Test Validates

### 1. Terrain Analysis
- ✅ Terrain agent analyzes different locations correctly
- ✅ Identifies appropriate number of terrain features
- ✅ Detects different feature types (water, buildings, roads)

### 2. Algorithm Selection
- ✅ Layout agent chooses appropriate algorithm for terrain
- ✅ Uses different algorithms for different scenarios
- ✅ Demonstrates algorithm diversity (not always same choice)

### 3. Terrain Adaptation
- ✅ Turbines are skipped when in unbuildable areas
- ✅ Placement adapts to terrain constraints
- ✅ Different scenarios produce different turbine counts

### 4. Non-Grid-Like Placement
- ✅ Turbine placement is NOT rigidly grid-like
- ✅ Layouts adapt to obstacles and constraints
- ✅ Demonstrates intelligent spatial reasoning

## Expected Output

### Success Indicators
```
✅ EXCELLENT: All tests passed
   ✅ Terrain analysis works for all scenarios
   ✅ Layout algorithms adapt to terrain conditions
   ✅ Turbine placement is NOT rigidly grid-like
   ✅ Agents demonstrate intelligent algorithm selection

📋 Key Findings:
   Algorithms Used: grid, greedy, offset_grid
   Algorithm Diversity: ✅ YES (adapts to terrain)
   Terrain-Adaptive Layouts: 3/3
   Skips Obstacles: ✅ YES
   Non-Grid-Like Layouts: 3/3
   Avoids Rigid Grids: ✅ YES
```

### Test Metrics
- **Total Tests**: 6 (3 scenarios × 2 tests each)
- **Success Rate**: Should be 100% or close
- **Algorithm Diversity**: Should use 2-3 different algorithms
- **Terrain Adaptation**: Should skip turbines in all scenarios

## Validation Criteria

### Terrain Analysis (Per Scenario)
- ✅ Success: Agent completes analysis
- ✅ Feature Count: Within expected range
- ✅ Feature Types: Detects expected types
- ✅ Duration: Completes in reasonable time

### Layout Algorithm Selection (Per Scenario)
- ✅ Success: Agent completes layout
- ✅ Algorithm: Chooses appropriate algorithm
- ✅ Turbine Count: Meets minimum placement
- ✅ Adaptation: Skips obstacles when present
- ✅ Non-Grid: Not rigidly grid-like

## Troubleshooting

### All Tests Fail
- Check that Strands Agent Lambda is deployed
- Verify Lambda has correct permissions
- Check CloudWatch logs for errors

### Terrain Analysis Fails
- Verify OSM API is accessible
- Check terrain agent tools are working
- Review terrain_tools.py implementation

### Layout Selection Fails
- Verify layout agent system prompt includes algorithm selection logic
- Check that layout tools are available
- Review layout_agent.py implementation

### Same Algorithm Always Used
- Review agent system prompt for algorithm selection guidance
- Check that terrain data is being passed to layout agent
- Verify agent has access to multiple layout algorithms

### Turbines Not Skipped
- Check that boundaries are being loaded correctly
- Verify auto_relocate is set to False (default)
- Review layout tool implementation for boundary checking

## Key Insights

### Algorithm Selection Logic
The layout agent should choose algorithms based on:
- **Grid**: Flat, open terrain with few obstacles
- **Offset Grid**: Moderate terrain with some constraints
- **Greedy**: Complex terrain with many obstacles
- **Spiral**: Radial expansion from center point

### Terrain Adaptation
The agent demonstrates intelligence by:
- Analyzing terrain features before layout
- Choosing appropriate algorithm for conditions
- Skipping turbines in unbuildable areas
- Adapting placement to constraints

### Non-Grid-Like Placement
Evidence of intelligent placement:
- Different turbine counts for different terrains
- Turbines skipped due to obstacles
- Layout type varies by scenario
- Not all turbines placed in perfect grid

## Success Criteria

Task 5 is complete when:
- ✅ All 3 terrain scenarios analyzed successfully
- ✅ All 3 layout scenarios completed successfully
- ✅ At least 2 different algorithms used across scenarios
- ✅ Turbines skipped in at least 1 scenario (terrain adaptation)
- ✅ No layouts are rigidly grid-like (all adapt to constraints)
- ✅ Overall success rate ≥ 75%

## Next Steps

After Task 5 passes:
1. ✅ Intelligent algorithm selection verified
2. ✅ Terrain adaptation confirmed
3. ✅ Non-grid-like placement validated
4. → Proceed to Task 6: Multi-agent orchestration testing

## Related Files

- **Test Script**: `tests/test-intelligent-algorithm-selection.js`
- **Layout Agent**: `amplify/functions/renewableAgents/layout_agent.py`
- **Terrain Agent**: `amplify/functions/renewableAgents/terrain_agent.py`
- **Layout Tools**: `amplify/functions/renewableAgents/tools/layout_tools.py`
- **Terrain Tools**: `amplify/functions/renewableAgents/tools/terrain_tools.py`

## Notes

- Test uses real coordinates and real terrain data
- Each scenario tests different terrain characteristics
- Test validates both algorithm selection AND terrain adaptation
- Success requires demonstrating intelligent spatial reasoning
- Test takes ~5-10 minutes to complete (includes wait times)
