# Renewable Energy Integration Spec

## Overview

This spec defines the integration of the AWS renewable energy demo (`agentic-ai-for-renewable-site-design-mainline`) into the EDI Platform. The integration uses a **zero-modification** approach to the demo code, creating only a lightweight integration layer to connect the EDI Platform UI to the deployed renewable backend.

## Problem Statement

Previous integration work incorrectly converted Python Strands Agents to TypeScript, which:
- Violated python-integration guidelines
- Lost the sophisticated multi-agent orchestration
- Replaced real PyWake simulations with mock data
- Removed GIS data processing capabilities
- Created maintenance burden

## Solution

Deploy the renewable demo backend as-is using AWS Bedrock AgentCore, and create a minimal integration layer in the EDI Platform frontend to:
- Route renewable queries to the deployed backend
- Transform AgentCore responses to EDI Platform artifact format
- Render Folium maps and matplotlib charts in the UI
- Provide seamless user experience

## Key Principles

1. **Zero Modifications**: No changes to demo code in `agentic-ai-for-renewable-site-design-mainline/`
2. **Minimal Code**: Integration layer < 500 lines of code
3. **Use Original Visualizations**: Folium maps and matplotlib charts from demo
4. **Preserve Architecture**: Strands multi-agent orchestration with GraphBuilder
5. **Deploy Under EDI Account**: Use EDI Platform's AWS credentials and Cognito

## Architecture

```
EDI Platform UI → Agent Router → Renewable Proxy Agent → AgentCore → Strands Agents
                                                              ↓
                                                         MCP Server
                                                              ↓
                                                    AWS Services (S3, Bedrock)
```

## Documents

- **[requirements.md](./requirements.md)**: Detailed requirements with user stories and acceptance criteria
- **[design.md](./design.md)**: Architecture, components, data models, and deployment strategy
- **[tasks.md](./tasks.md)**: Implementation plan with 14 main tasks

## Quick Start

### For Developers

1. **Review Requirements**: Read [requirements.md](./requirements.md) to understand what we're building
2. **Review Design**: Read [design.md](./design.md) to understand how it works
3. **Start Implementation**: Follow [tasks.md](./tasks.md) in order

### For DevOps

1. **Deploy Backend**: Follow Task 1 in [tasks.md](./tasks.md) to deploy AgentCore
2. **Configure Environment**: Set up environment variables and SSM parameters
3. **Verify Deployment**: Test AgentCore endpoint is accessible

### For QA

1. **Integration Testing**: Follow Task 12 in [tasks.md](./tasks.md)
2. **Sample Queries**: Use queries documented in [design.md](./design.md)
3. **Validation Checklist**: Verify all success criteria

## Key Files to Create

### Integration Layer
- `src/services/renewable-integration/renewableClient.ts` - HTTP client for AgentCore
- `src/services/renewable-integration/responseTransformer.ts` - Transform responses
- `src/services/renewable-integration/types.ts` - TypeScript types
- `src/services/renewable-integration/config.ts` - Configuration management

### Agent
- `amplify/functions/agents/renewableProxyAgent.ts` - Thin proxy to AgentCore

### UI Components
- `src/components/renewable/TerrainMapArtifact.tsx` - Render terrain maps
- `src/components/renewable/LayoutMapArtifact.tsx` - Render layout maps
- `src/components/renewable/SimulationChartArtifact.tsx` - Render simulation charts
- `src/components/renewable/ReportArtifact.tsx` - Render reports

## Files to Remove

- `amplify/functions/agents/renewableEnergyAgent.ts` (incorrectly converted)
- `amplify/functions/tools/renewableTerrainAnalysisTool.ts` (incorrectly converted)
- `amplify/functions/tools/renewableLayoutOptimizationTool.ts` (incorrectly converted)
- `amplify/functions/tools/renewableSimulationTool.ts` (incorrectly converted)

Move these to `docs/deprecated/renewable-typescript-attempt/` for reference.

## Environment Variables

```bash
# Frontend
NEXT_PUBLIC_RENEWABLE_AGENTCORE_ENDPOINT=https://agentcore.us-west-2.amazonaws.com/invoke/renewable-wind-farm
NEXT_PUBLIC_RENEWABLE_ENABLED=true
NEXT_PUBLIC_RENEWABLE_S3_BUCKET=edi-platform-renewable-assets

# Backend (SSM Parameters)
/wind-farm-assistant/s3-bucket-name=edi-platform-renewable-assets
/wind-farm-assistant/use-s3-storage=true
```

## Sample Queries

```
"Analyze terrain for wind farm at 35.067482, -101.395466"
"Create a 30MW wind farm layout at those coordinates"
"Run wake simulation for the layout"
"Generate executive report"
```

## Success Criteria

- [ ] Zero modifications to demo code
- [ ] Integration layer < 500 lines of code
- [ ] Users can type renewable queries in chat
- [ ] Folium maps display correctly with interactive features
- [ ] Matplotlib charts display correctly
- [ ] Response time < 35 seconds
- [ ] Error messages are clear and actionable
- [ ] All existing EDI Platform features continue to work

## Timeline Estimate

- **Task 1 (Backend Deployment)**: 2-4 hours
- **Tasks 2-10 (Core Implementation)**: 2-3 days
- **Task 11 (Unit Tests)**: 1 day (optional)
- **Task 12 (Integration Testing)**: 1 day
- **Task 13 (Documentation)**: 0.5 day
- **Task 14 (Optimization)**: 1 day (optional)

**Total**: 4-6 days for MVP, 6-8 days with optional tasks

## Next Steps

1. **Review and Approve**: Review this spec with stakeholders
2. **Deploy Backend**: Start with Task 1 to deploy AgentCore
3. **Implement Integration**: Follow tasks 2-10 in order
4. **Test and Validate**: Complete Task 12 integration testing
5. **Document**: Complete Task 13 documentation
6. **Deploy to Production**: After successful testing

## Questions or Issues?

- Review the [design.md](./design.md) for detailed architecture
- Check [tasks.md](./tasks.md) for implementation details
- Refer to the original demo's README in `agentic-ai-for-renewable-site-design-mainline/workshop-assets/README.md`

## References

- Original Demo: `agentic-ai-for-renewable-site-design-mainline/`
- AgentCore Docs: https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/
- Strands SDK: https://github.com/awslabs/strands
- PyWake: https://topfarm.pages.windenergy.dtu.dk/PyWake/
