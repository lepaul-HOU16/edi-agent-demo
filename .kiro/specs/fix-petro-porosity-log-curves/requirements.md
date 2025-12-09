# Requirements Document

## Introduction

The petrophysics agent's porosity analysis is missing critical visualization data. When users request porosity calculations, the response includes statistics and analysis but lacks the raw log curve data (DEPT, RHOB, NPHI) needed to render the log plots. Additionally, the porosity column names in the artifact structure need adjustment to match frontend expectations.

## Glossary

- **Log Curve**: Time-series measurement data from well logging tools (e.g., RHOB for bulk density, NPHI for neutron porosity)
- **logData**: Object containing arrays of curve values indexed by curve name (e.g., `{ DEPT: [...], RHOB: [...], NPHI: [...] }`)
- **Porosity Analysis Artifact**: Response object containing porosity calculations, statistics, and visualization data
- **Frontend Component**: React component that renders the porosity analysis visualization
- **MCP Tool**: Model Context Protocol tool that performs petrophysical calculations

## Requirements

### Requirement 1

**User Story:** As a petrophysicist, I want to see log curve visualizations alongside porosity calculations, so that I can validate the analysis against the raw data.

#### Acceptance Criteria

1. WHEN a user requests porosity analysis THEN the system SHALL include logData with DEPT, RHOB, and NPHI curves in the artifact
2. WHEN the artifact contains logData THEN the system SHALL ensure all curve arrays have matching lengths
3. WHEN log curves are included THEN the system SHALL preserve the original depth registration
4. WHEN the frontend receives the artifact THEN the system SHALL render interactive log curve plots
5. WHEN curve data is missing THEN the system SHALL handle gracefully without breaking the visualization

### Requirement 2

**User Story:** As a petrophysicist, I want porosity column names to be consistent and clear, so that I can easily understand which porosity type is displayed.

#### Acceptance Criteria

1. WHEN porosity results are returned THEN the system SHALL use standardized column names (densityPorosity, neutronPorosity, effectivePorosity)
2. WHEN the artifact structure is created THEN the system SHALL match frontend expectations for property paths
3. WHEN multiple porosity types are calculated THEN the system SHALL clearly distinguish between them in the artifact
4. WHEN the frontend renders porosity data THEN the system SHALL display correct values without undefined errors

### Requirement 3

**User Story:** As a petrophysicist, I want the porosity analysis to include calculated porosity curves, so that I can see the computed values alongside the input curves.

#### Acceptance Criteria

1. WHEN porosity is calculated THEN the system SHALL include the calculated porosity values in logData
2. WHEN multiple porosity methods are used THEN the system SHALL include all calculated curves (PHID, PHIN, PHIE)
3. WHEN calculated curves are added THEN the system SHALL maintain depth alignment with input curves
4. WHEN the frontend renders curves THEN the system SHALL display calculated porosity alongside raw log data

### Requirement 4

**User Story:** As a developer, I want the porosity artifact structure to be well-documented, so that I can maintain and extend the visualization components.

#### Acceptance Criteria

1. WHEN the artifact is created THEN the system SHALL follow a consistent structure across all porosity analysis types
2. WHEN new fields are added THEN the system SHALL maintain backward compatibility with existing visualizations
3. WHEN the structure changes THEN the system SHALL update TypeScript interfaces to match
4. WHEN debugging issues THEN the system SHALL log artifact structure for troubleshooting
