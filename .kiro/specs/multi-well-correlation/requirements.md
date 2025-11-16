# Multi-Well Correlation Workflow Requirements

## Introduction

This feature implements an interactive multi-well correlation workflow for the petrophysics agent, enabling users to visualize data availability, assess data quality, and perform correlation analysis across multiple wells with net pay and NPV calculations.

## Glossary

- **System**: The petrophysics agent and associated calculation services
- **User**: Geoscientist or petrophysicist using the system
- **Data Matrix**: Visual representation of available log curves across all wells
- **Data Quality Plot**: Log plot showing curve data with quality issues highlighted
- **Correlation Analysis**: Multi-well analysis identifying reservoir zones and calculating net pay
- **Net Pay**: Thickness of reservoir rock that can produce hydrocarbons
- **NPV**: Net Present Value - economic value of the reservoir

## Requirements

### Requirement 1: Data Matrix Visualization

**User Story:** As a geoscientist, I want to see a matrix of available data across all wells, so that I can quickly understand data coverage before starting analysis.

#### Acceptance Criteria

1. WHEN THE User requests "show me the data matrix" or "what data is available", THE System SHALL generate a matrix visualization showing all wells and their available log curves
2. THE System SHALL display the matrix with wells as rows and log curve types as columns
3. THE System SHALL use visual indicators (colors/symbols) to show data presence, absence, and quality
4. THE System SHALL include data completeness percentages for each well-curve combination
5. THE System SHALL make the matrix interactive, allowing users to click on wells for detailed analysis

### Requirement 2: Interactive Well Data Quality Assessment

**User Story:** As a geoscientist, I want to click on a well in the matrix and see detailed data quality information, so that I can identify and understand data issues before running correlation.

#### Acceptance Criteria

1. WHEN THE User clicks on a well in the data matrix, THE System SHALL generate a detailed data quality plot for that well
2. THE System SHALL display a log plot showing all available curves for the selected well
3. THE System SHALL highlight data quality issues directly on the log plot with visual markers
4. THE System SHALL annotate each quality issue with a description of the problem (e.g., "Missing data 2500-2600m", "Outliers detected")
5. THE System SHALL provide a summary of data quality metrics including completeness, outlier count, and environmental correction status

### Requirement 3: Multi-Well Correlation Analysis

**User Story:** As a geoscientist, I want to run correlation analysis on selected wells, so that I can identify reservoir zones and calculate net pay across the field.

#### Acceptance Criteria

1. WHEN THE User requests "run correlation on WELL-001, WELL-002, WELL-003", THE System SHALL perform multi-well correlation analysis
2. THE System SHALL identify reservoir zones using porosity, shale volume, and saturation cutoffs
3. THE System SHALL display the cutoff values used for the analysis (e.g., porosity > 10%, Vsh < 40%, Sw < 60%)
4. THE System SHALL calculate net pay thickness for each identified zone in each well
5. THE System SHALL generate a correlation report showing zone depths, thicknesses, and properties across all wells

### Requirement 4: Net Pay and NPV Calculation

**User Story:** As a reservoir engineer, I want to see net pay calculations and NPV estimates for correlated zones, so that I can assess the economic potential of the reservoir.

#### Acceptance Criteria

1. THE System SHALL calculate net pay thickness for each reservoir zone using industry-standard cutoffs
2. THE System SHALL provide zone-by-zone net pay summaries for each well
3. THE System SHALL calculate estimated NPV based on net pay, porosity, and saturation values
4. THE System SHALL present results in a professional report format with tables and visualizations
5. THE System SHALL include assumptions and parameters used in the NPV calculation

### Requirement 5: Interactive Workflow Integration

**User Story:** As a user, I want the workflow to be conversational and interactive, so that I can explore the data naturally through chat.

#### Acceptance Criteria

1. THE System SHALL support natural language queries for each step of the workflow
2. WHEN THE User completes one step, THE System SHALL suggest logical next steps
3. THE System SHALL maintain context across the workflow, remembering selected wells and parameters
4. THE System SHALL allow users to modify parameters and re-run analysis without starting over
5. THE System SHALL provide clear visual artifacts at each step that can be clicked and explored

## Example Workflow

```
User: "Show me the data matrix for all wells"
System: [Generates interactive matrix showing 24 wells x 8 curve types]

User: [Clicks on WELL-001 in the matrix]
System: [Generates detailed log plot with data quality annotations]
        "WELL-001 has 95% data completeness. Minor outliers detected in RHOB curve at 2450-2470m."

User: "Run correlation on WELL-001, WELL-002, and WELL-003"
System: [Performs correlation analysis]
        "Correlation complete. Using cutoffs: Porosity > 12%, Vsh < 35%, Sw < 50%
        
        Zone A (2400-2425m):
        - WELL-001: 18m net pay, NPV: $2.3M
        - WELL-002: 22m net pay, NPV: $2.8M  
        - WELL-003: 15m net pay, NPV: $1.9M
        
        Total field NPV: $7.0M"
```

## Technical Considerations

- Matrix visualization should be generated as an interactive artifact
- Log plots should use Plotly for interactivity
- Data quality assessment should leverage existing MCP petrophysical analysis tools
- Correlation analysis requires new calculation functions in the petrophysics calculator Lambda
- NPV calculations should use configurable economic parameters
