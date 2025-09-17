# Requirements Document

## Introduction

This feature transforms the current well analysis agent into a comprehensive, industry-standard petrophysical analysis platform that matches the expectations of professional petroleum engineers and geoscientists. The system will provide advanced log visualization, comprehensive petrophysical calculations, professional reporting capabilities, and multi-well correlation analysis to support critical formation evaluation and completion design decisions.

## Requirements

### Requirement 1

**User Story:** As a petroleum engineer, I want to view industry-standard log displays with proper formatting and color schemes, so that I can analyze well data using familiar visualization standards.

#### Acceptance Criteria

1. WHEN displaying well logs THEN the system SHALL render triple combo logs with three distinct tracks
2. WHEN showing Track 1 THEN the system SHALL display Gamma Ray (0-150 API) with green fill for clean sand (GR < 75 API) and brown fill for shale (GR > 75 API)
3. WHEN showing Track 2 THEN the system SHALL display porosity logs (0-40% NPHI, 1.95-2.95 g/cc RHOB) with NPHI curve (blue line) and RHOB curve (red line, inverted scale)
4. WHEN showing Track 3 THEN the system SHALL display resistivity (0.2-2000 ohm-m, log scale) with RT curve (black line) and high resistivity fill (green for hydrocarbon indication)
5. WHEN displaying quad combo logs THEN the system SHALL add Track 4 with calculated parameters (Vsh, Sw, porosity, net pay flags)
6. WHEN rendering logs THEN the system SHALL follow API RP 40 industry-standard color schemes
7. WHEN displaying depth THEN the system SHALL show proper depth registration and scaling with depth scale on left axis

### Requirement 2

**User Story:** As a petrophysicist, I want access to multiple advanced calculation methods for porosity, shale volume, and water saturation, so that I can apply the most appropriate methodology for different geological conditions.

#### Acceptance Criteria

1. WHEN calculating porosity THEN the system SHALL provide density porosity calculation using formula (2.65 - RHOB) / (2.65 - 1.0)
2. WHEN calculating porosity THEN the system SHALL provide neutron porosity calculation using NPHI / 100
3. WHEN calculating porosity THEN the system SHALL provide effective porosity as average of density and neutron porosity
4. WHEN calculating shale volume THEN the system SHALL provide Larionov method for Tertiary rocks using 0.083 * (2^(3.7 * IGR) - 1)
5. WHEN calculating shale volume THEN the system SHALL provide Larionov method for Pre-Tertiary rocks using 0.33 * (2^(2 * IGR) - 1)
6. WHEN calculating shale volume THEN the system SHALL provide linear method using IGR
7. WHEN calculating shale volume THEN the system SHALL provide Clavier method using 1.7 - sqrt(3.38 - (IGR + 0.7)^2)
8. WHEN calculating water saturation THEN the system SHALL provide Archie equation using ((1.0 * Rw) / (porosity^2 * RT))^0.5
9. WHEN calculating water saturation THEN the system SHALL provide Waxman-Smits method for shaly sands
10. WHEN calculating permeability THEN the system SHALL provide Kozeny-Carman equation
11. WHEN calculating permeability THEN the system SHALL provide Timur correlation using 0.136 * (porosity^4.4 / Swi^2)

### Requirement 3

**User Story:** As a reservoir engineer, I want interactive log visualization with zoom, pan, and curve selection capabilities, so that I can efficiently analyze specific depth intervals and compare different log responses.

#### Acceptance Criteria

1. WHEN viewing log plots THEN the system SHALL provide zoom functionality with depth synchronization across all tracks
2. WHEN viewing log plots THEN the system SHALL provide pan functionality maintaining proper scaling
3. WHEN interacting with logs THEN the system SHALL allow curve selection and overlay capabilities
4. WHEN parameters change THEN the system SHALL update calculations in real-time
5. WHEN viewing logs THEN the system SHALL highlight completion intervals and geological markers
6. WHEN displaying data THEN the system SHALL show quality control flags and data validation indicators
7. WHEN viewing multiple wells THEN the system SHALL provide correlation capabilities with geological ties

### Requirement 4

**User Story:** As a completion engineer, I want comprehensive statistical analysis and reservoir quality metrics, so that I can make informed decisions about completion design and target selection.

#### Acceptance Criteria

1. WHEN analyzing reservoir quality THEN the system SHALL calculate net-to-gross ratio as cleanSandThickness / totalThickness
2. WHEN analyzing porosity THEN the system SHALL calculate weighted mean porosity by thickness
3. WHEN analyzing permeability THEN the system SHALL provide log-normal statistical distribution
4. WHEN analyzing completions THEN the system SHALL calculate completion efficiency as perforatedLength / netPayLength
5. WHEN providing uncertainty analysis THEN the system SHALL report porosity uncertainty as ±2% (density), ±3% (neutron)
6. WHEN providing uncertainty analysis THEN the system SHALL report saturation uncertainty as ±15% (Archie), ±10% (advanced methods)
7. WHEN providing uncertainty analysis THEN the system SHALL report permeability uncertainty as ±50% (correlations), ±20% (core data)
8. WHEN performing quality control THEN the system SHALL validate environmental corrections
9. WHEN performing quality control THEN the system SHALL assess curve quality and detect statistical outliers
10. WHEN performing quality control THEN the system SHALL check geological consistency

### Requirement 5

**User Story:** As a project manager, I want professional reporting capabilities with industry-standard formats, so that I can present results to stakeholders and regulatory bodies.

#### Acceptance Criteria

1. WHEN generating reports THEN the system SHALL create formation evaluation summaries
2. WHEN generating reports THEN the system SHALL provide completion design recommendations
3. WHEN generating reports THEN the system SHALL create reservoir characterization reports
4. WHEN generating reports THEN the system SHALL provide multi-well correlation analysis
5. WHEN exporting data THEN the system SHALL support high-resolution log plots in PDF and PNG formats
6. WHEN exporting data THEN the system SHALL support data tables in CSV and Excel formats
7. WHEN exporting data THEN the system SHALL support LAS file output with calculated curves
8. WHEN exporting visualizations THEN the system SHALL provide PowerPoint-ready formats
9. WHEN generating reports THEN the system SHALL include technical summary reports with methodology documentation

### Requirement 6

**User Story:** As a geoscientist, I want environmental correction capabilities and data validation, so that I can ensure the accuracy and reliability of petrophysical interpretations.

#### Acceptance Criteria

1. WHEN processing log data THEN the system SHALL apply environmental corrections for borehole conditions
2. WHEN processing log data THEN the system SHALL normalize curves to standard conditions
3. WHEN validating data THEN the system SHALL flag questionable data points and provide quality indicators
4. WHEN displaying results THEN the system SHALL show confidence intervals and uncertainty ranges
5. WHEN comparing methods THEN the system SHALL validate results against industry benchmarks
6. WHEN processing multiple wells THEN the system SHALL ensure consistent methodology application
7. WHEN generating outputs THEN the system SHALL include methodology documentation and assumptions

### Requirement 7

**User Story:** As a senior petrophysicist, I want the system to match results from commercial software packages, so that I can confidently use it for critical business decisions.

#### Acceptance Criteria

1. WHEN comparing calculations THEN the system SHALL match results from Techlog within ±5% for standard calculations
2. WHEN comparing calculations THEN the system SHALL match results from Geolog within ±5% for standard calculations  
3. WHEN comparing calculations THEN the system SHALL match results from Interactive Petrophysics within ±5% for standard calculations
4. WHEN following industry practices THEN the system SHALL implement calculations according to established SPE and SPWLA standards
5. WHEN generating visualizations THEN the system SHALL meet professional presentation standards suitable for technical conferences
6. WHEN creating reports THEN the system SHALL generate outputs suitable for regulatory submission
7. WHEN documenting methodology THEN the system SHALL provide complete traceability of calculations and assumptions