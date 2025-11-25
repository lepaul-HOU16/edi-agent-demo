# Requirements Document

## Introduction

The renewable energy workflow has several critical issues preventing users from completing the full wind farm analysis workflow. Users report that the detailed report appears broken, the "Optimize Layout" button is a step backwards, and financial analysis/compare scenarios buttons are not working. Additionally, wind rose visualizations are missing.

## Glossary

- **Renewable Energy Workflow**: The multi-step process for analyzing wind farm sites (terrain → layout → simulation → wind rose → report)
- **Artifact**: A visualization or data component rendered in the chat interface
- **ChatMessage Component**: The React component responsible for rendering AI responses and artifacts
- **WorkflowCTAButtons**: The component that displays next-step action buttons
- **Orchestrator**: The Lambda function that routes renewable energy queries to appropriate tools

## Requirements

### Requirement 1: Fix Report Artifact Rendering

**User Story:** As a user, I want to see the detailed wind farm report when I request it, so that I can review the comprehensive analysis.

#### Acceptance Criteria

1. WHEN THE System receives a `wind_farm_report` artifact, THE ChatMessage Component SHALL render the ReportArtifact component
2. WHEN THE ReportArtifact renders, THE System SHALL display the executive summary, recommendations, and all report sections
3. WHEN THE report contains a PDF URL, THE System SHALL provide a download link
4. WHEN THE report rendering fails, THE System SHALL display a meaningful error message with troubleshooting steps
5. WHEN THE user clicks "Generate Report", THE System SHALL create and display the report artifact within 30 seconds

### Requirement 2: Fix Wind Rose Artifact Rendering

**User Story:** As a user, I want to see the wind rose visualization after wake simulation, so that I can understand wind patterns at the site.

#### Acceptance Criteria

1. WHEN THE System receives a `wind_rose` or `wind_rose_analysis` artifact, THE ChatMessage Component SHALL render the WindRoseArtifact component
2. WHEN THE WindRoseArtifact renders, THE System SHALL display the wind direction and speed distribution
3. WHEN THE wind rose contains interactive elements, THE System SHALL enable user interaction
4. WHEN THE wind rose data is missing, THE System SHALL display a fallback message
5. WHEN THE user requests wind rose analysis, THE System SHALL generate and display the visualization within 15 seconds

### Requirement 3: Remove "Optimize Layout" from Post-Terrain CTAs

**User Story:** As a user, I don't want to see "Optimize Layout" after terrain analysis, because layout optimization should come after initial layout generation.

#### Acceptance Criteria

1. WHEN THE terrain analysis completes, THE WorkflowCTAButtons SHALL NOT display "Optimize Layout"
2. WHEN THE terrain analysis completes, THE WorkflowCTAButtons SHALL display "Generate Initial Layout" or "Create Turbine Layout"
3. WHEN THE initial layout completes, THE WorkflowCTAButtons SHALL display "Run Wake Simulation"
4. WHEN THE wake simulation completes, THE WorkflowCTAButtons SHALL display "Generate Wind Rose"
5. WHEN THE wind rose completes, THE WorkflowCTAButtons SHALL display "Generate Report"

### Requirement 4: Implement Financial Analysis Action

**User Story:** As a user, I want to perform financial analysis on my wind farm project, so that I can evaluate economic viability.

#### Acceptance Criteria

1. WHEN THE user clicks "Financial Analysis", THE System SHALL send a query to analyze project economics
2. WHEN THE financial analysis completes, THE System SHALL display cost breakdown, revenue projections, and ROI
3. WHEN THE financial analysis artifact renders, THE System SHALL show charts for LCOE, NPV, and payback period
4. WHEN THE financial data is unavailable, THE System SHALL use reasonable industry defaults
5. WHEN THE user requests financial analysis before layout completion, THE System SHALL display a helpful error message

### Requirement 5: Implement Compare Scenarios Action

**User Story:** As a user, I want to compare different wind farm scenarios, so that I can choose the optimal configuration.

#### Acceptance Criteria

1. WHEN THE user clicks "Compare Scenarios", THE System SHALL prompt for scenario parameters
2. WHEN THE user provides scenario parameters, THE System SHALL generate comparison artifacts
3. WHEN THE comparison completes, THE System SHALL display side-by-side metrics for each scenario
4. WHEN THE comparison includes multiple layouts, THE System SHALL show turbine count, capacity, and energy production differences
5. WHEN THE user has only one project, THE System SHALL suggest creating alternative scenarios first

### Requirement 6: Fix Workflow Button Logic

**User Story:** As a user, I want the workflow buttons to guide me through the correct sequence of steps, so that I don't get confused about what to do next.

#### Acceptance Criteria

1. WHEN THE System determines completed steps, THE WorkflowCTAButtons SHALL check for actual artifact types (not just step names)
2. WHEN THE terrain artifact exists, THE System SHALL mark 'terrain' as complete
3. WHEN THE layout artifact exists, THE System SHALL mark 'layout' as complete
4. WHEN THE simulation artifact exists, THE System SHALL mark 'simulation' as complete
5. WHEN THE wind rose artifact exists, THE System SHALL mark 'windrose' as complete
6. WHEN THE report artifact exists, THE System SHALL mark 'report' as complete
7. WHEN THE user clicks a workflow button, THE System SHALL auto-run missing prerequisites before executing the requested action

### Requirement 7: Add Artifact Type Logging

**User Story:** As a developer, I want detailed logging of artifact types, so that I can debug rendering issues quickly.

#### Acceptance Criteria

1. WHEN THE EnhancedArtifactProcessor receives artifacts, THE System SHALL log the count and types
2. WHEN THE System checks for artifact rendering, THE System SHALL log which checks are being performed
3. WHEN THE artifact rendering succeeds, THE System SHALL log which component was rendered
4. WHEN THE artifact rendering fails, THE System SHALL log the failure reason and artifact structure
5. WHEN THE artifact is missing expected fields, THE System SHALL log the available fields for debugging
