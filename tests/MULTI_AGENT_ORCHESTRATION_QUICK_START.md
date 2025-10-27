# Multi-Agent Orchestration Test - Quick Start

## Run the Test

```bash
node tests/test-multi-agent-orchestration.js
```

## What It Tests

✅ **Complete Workflow**: Terrain → Layout → Simulation → Report  
✅ **Agent Communication**: Data flows between steps  
✅ **Artifact Generation**: Each step produces artifacts  
✅ **Context Management**: Project data persists across steps

## Expected Results

```
Step 1: Terrain Analysis ✅
  - Duration: ~6s
  - Artifacts: 1 (terrain analysis)
  - Creates project "for-wind-farm"

Step 2: Layout Optimization ✅
  - Duration: ~4s
  - Artifacts: 1 (layout map)
  - Uses project from step 1

Step 3: Wake Simulation ⚠️
  - Duration: ~12s
  - Executes successfully
  - Artifact format may vary

Step 4: Report Generation
  - Duration: ~10s
  - Generates comprehensive report
  - Includes all previous results
```

## Success Criteria

- ✅ All steps execute in sequence
- ✅ Data flows between steps
- ✅ Artifacts generated at each step
- ✅ No critical failures

## Troubleshooting

**"Strands Agents not available"**
- This is expected - system uses fallback to direct tools
- Functionality works correctly

**"Missing required information"**
- Ensure project name propagates from terrain step
- Check context updates between steps

**Timeout errors**
- Increase Lambda timeout if needed
- Check CloudWatch logs for details

## Documentation

See `tests/TASK_6_MULTI_AGENT_ORCHESTRATION_COMPLETE.md` for full details.
