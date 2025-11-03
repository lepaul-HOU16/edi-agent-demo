# Requirements Document

## Introduction

This spec addresses two critical issues with the renewable energy workflow:
1. Wake simulation queries are not working properly
2. Title/content duplication appearing in wake simulation results

## Glossary

- **Wake Simulation**: Analysis of wind turbine wake effects on energy production
- **Orchestrator**: Backend service that routes requests and formats responses
- **Artifact**: UI component that displays analysis results
- **Frontend Component**: React component that renders artifacts in the UI

## Requirements

### Requirement 1: Wake Simulation Functionality

**User Story:** As a user, I want to run wake simulations on my wind farm layout so I can understand energy production and wake losses.

#### Acceptance Criteria

1. WHEN a user requests wake simulation THEN the system SHALL execute the simulation and return results
2. WHEN the backend generates wake simulation data THEN the orchestrator SHALL map it to the correct artifact type
3. WHEN the frontend receives wake simulation data THEN it SHALL render the WakeAnalysisArtifact component
4. WHEN wake simulation completes THEN the user SHALL see performance metrics, wake losses, and visualizations
5. WHEN wake simulation fails THEN the user SHALL receive a clear error message

### Requirement 2: Eliminate Title/Content Duplication

**User Story:** As a user viewing wake simulation results, I want to see clean, non-duplicated content so the interface is professional and easy to read.

#### Acceptance Criteria

1. WHEN viewing wake simulation results THEN the title SHALL appear only once in the artifact header
2. WHEN the backend generates response data THEN it SHALL NOT include duplicate title fields
3. WHEN the orchestrator formats artifacts THEN it SHALL NOT add duplicate titles
4. WHEN the frontend renders artifacts THEN it SHALL NOT display duplicate content sections
5. WHEN multiple data sources provide titles THEN only one SHALL be displayed to the user
