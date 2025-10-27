# Requirements: Fix NREL Real Data Integration

## Introduction

**CRITICAL ISSUE**: The current implementation violates steering rules by using synthetic/mock wind data instead of real NREL Wind Toolkit API data. This must be fixed immediately to comply with:
1. Workshop lab requirements (must match workshop implementation)
2. Steering rule: "NO SYNTHETIC DATA when real data available"
3. PM feedback: "Use real NREL data, not mock data"
4. Steering rule: "NO SHORTCUTS - proper implementation"

Additionally, sub-agent reasoning must be exposed in the chain of thought panel for transparency.

---

## Requirements

### Requirement 1: NREL Wind Toolkit API Integration

**User Story:** As a renewable energy analyst, I want wind rose and simulation data to come from real NREL Wind Toolkit API, so that I have accurate, real-world wind resource data for my site analysis.

#### Acceptance Criteria

1. WHEN a user requests wind rose or wake simulation THEN the system SHALL fetch real wind data from NREL Wind Toolkit API
2. WHEN NREL API is called THEN the system SHALL use proper API key from AWS Secrets Manager or environment variable
3. WHEN wind data is processed THEN the system SHALL use the exact same processing logic as the workshop implementation
4. WHEN NREL API fails THEN the system SHALL return a clear error message (NOT synthetic fallback data)
5. WHEN wind rose is generated THEN it SHALL display "Data Source: NREL Wind Toolkit" in the visualization

### Requirement 2: Remove All Synthetic/Mock Data Generation

**User Story:** As a system administrator, I want to ensure no synthetic wind data is ever used in production, so that all analysis is based on real meteorological data.

#### Acceptance Criteria

1. WHEN code is reviewed THEN there SHALL be zero functions that generate synthetic wind data
2. WHEN NREL API fails THEN the system SHALL NOT fall back to synthetic data
3. WHEN wind data is unavailable THEN the system SHALL return an error with instructions to retry
4. WHEN tests are run THEN mock data SHALL only exist in test files (not production code)
5. WHEN deployment is validated THEN no synthetic data generation code SHALL be deployed

### Requirement 3: Match Workshop Implementation Exactly

**User Story:** As a workshop participant, I want the implementation to match the workshop labs exactly, so that the demo accurately represents what was taught.

#### Acceptance Criteria

1. WHEN wind data is fetched THEN it SHALL use the same NREL API endpoint as workshop code
2. WHEN wind data is processed THEN it SHALL use the same Weibull fitting logic as workshop code
3. WHEN wind rose is generated THEN it SHALL have the same structure as workshop output
4. WHEN errors occur THEN they SHALL be handled the same way as workshop code
5. WHEN API key is retrieved THEN it SHALL follow the same pattern (Secrets Manager → env var → error)

### Requirement 4: Expose Sub-Agent Reasoning in Chain of Thought

**User Story:** As a user, I want to see the sub-agents' internal reasoning steps in the chain of thought panel, so that I understand how the system arrived at its conclusions.

#### Acceptance Criteria

1. WHEN a renewable energy query is processed THEN the chain of thought SHALL show each sub-agent's reasoning
2. WHEN NREL API is called THEN a thought step SHALL show "Fetching wind data from NREL Wind Toolkit API"
3. WHEN data is processed THEN a thought step SHALL show "Processing wind data with Weibull distribution fitting"
4. WHEN sub-agents make decisions THEN their reasoning SHALL be visible in expandable sections
5. WHEN errors occur in sub-agents THEN the error details SHALL be shown in the chain of thought

### Requirement 5: Data Source Transparency

**User Story:** As a renewable energy analyst, I want to know the source and quality of wind data used in my analysis, so that I can assess the reliability of results.

#### Acceptance Criteria

1. WHEN wind data is displayed THEN the visualization SHALL clearly show "Data Source: NREL Wind Toolkit"
2. WHEN wind data quality varies THEN the system SHALL display data quality indicators
3. WHEN API limits are reached THEN the system SHALL show a clear message about rate limiting
4. WHEN data is from a specific year THEN the year SHALL be displayed in the visualization
5. WHEN multiple data sources are available THEN NREL SHALL always be the primary source

---

## Out of Scope

- Creating new wind data APIs
- Implementing alternative wind data sources
- Caching wind data (can be added later)
- Historical wind data analysis beyond what NREL provides

---

## Success Metrics

- Zero synthetic/mock wind data generation in production code
- 100% of wind data comes from NREL Wind Toolkit API
- Wind rose displays "Data Source: NREL Wind Toolkit"
- Sub-agent reasoning visible in chain of thought
- Implementation matches workshop code exactly
- PM approves the fix

---

## Dependencies

- NREL API key (from AWS Secrets Manager or environment variable)
- NREL Wind Toolkit API access
- Workshop reference implementation code
- Existing chain of thought display component

---

## Risks

- **NREL API rate limits**: Mitigate by showing clear error messages
- **API key not configured**: Mitigate by providing clear setup instructions
- **API downtime**: Mitigate by returning error (NOT synthetic data)
- **Breaking existing functionality**: Mitigate by thorough testing

---

## Notes

**CRITICAL**: This is not an enhancement - this is fixing a violation of core steering rules. The current implementation with synthetic data is unacceptable and must be fixed immediately.

**Reference**: Workshop implementation at `agentic-ai-for-renewable-site-design-mainline/workshop-assets/MCP_Server/wind_farm_mcp_server.py`
