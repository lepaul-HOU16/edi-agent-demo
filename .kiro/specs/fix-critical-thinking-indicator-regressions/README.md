# Fix Critical Thinking Indicator Regressions

## Overview

This spec addresses four critical regressions in the Chain of Thought streaming system that were introduced in recent changes:

1. **Multiple Thinking Indicators** - Duplicate indicators appearing simultaneously
2. **Persistent Indicators** - Indicators not disappearing after responses complete
3. **Batched CoT** - Thought steps appearing all at once instead of streaming incrementally
4. **Broken Project Context** - Workflow buttons not using correct project information

## Status

- ✅ Requirements: Complete
- ✅ Design: Complete
- ✅ Tasks: Complete
- ⏳ Implementation: Ready to start

## Quick Start

To begin implementation, open `tasks.md` and click "Start task" next to Task 1.

## Key Files

- `requirements.md` - User stories and acceptance criteria
- `design.md` - Technical design with 9 correctness properties
- `tasks.md` - 26 implementation tasks organized in 4 phases

## Implementation Approach

The implementation follows a phased approach to minimize risk:

1. **Phase 1**: Fix duplicate indicators (frontend only, low risk)
2. **Phase 2**: Implement cleanup (backend + frontend, medium risk)
3. **Phase 3**: Restore streaming (backend revert, high risk)
4. **Phase 4**: Fix project context (investigate then fix, medium risk)

Each phase includes deployment and verification steps before moving to the next phase.

## Testing Strategy

- Unit tests for individual components and functions
- Property-based tests using fast-check (marked optional)
- Integration tests for end-to-end flows (marked optional)
- Manual testing checklist before and after deployment
- 24-hour production monitoring after all fixes deployed

## Success Criteria

- Only one Thinking indicator appears during processing
- Indicator disappears when response completes
- No stale indicators after page reload
- General Knowledge Agent shows incremental thought steps (3-5 second intervals)
- No streaming messages remain in DynamoDB after completion
- Workflow buttons include correct project context
- Actions execute on the correct project

## Next Steps

1. Review the requirements, design, and tasks
2. Start with Task 1: Fix ChainOfThoughtDisplay
3. Follow the phased implementation plan
4. Deploy and verify after each phase
5. Monitor production for 24 hours after completion
