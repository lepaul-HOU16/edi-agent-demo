# Requirements Document

## Introduction

This specification defines a visual query builder component for OSDU search that enables users to construct properly formatted OSDU queries through dropdown selections and form inputs. Unlike conversational AI search which requires natural language processing and has inherent latency, this query builder provides instant, deterministic search results by constructing SQL-like queries directly from user selections.

## Glossary

- **Visual Query Builder**: A UI component with dropdowns, inputs, and hierarchical selectors for building OSDU queries
- **OSDU Query DSL**: The domain-specific language used by OSDU API for structured queries
- **Deterministic Search**: Search that produces consistent results without AI interpretation
- **Zero-Latency Query**: Query construction that happens client-side without API calls
- **Hierarchical Selector**: Cascading dropdown menus where child options depend on parent selections
- **Query Template**: Pre-built query structure that users fill in with specific values
- **CatalogChatBoxCloudscape**: The chat component where the query builder will be integrated

## Requirements

### Requirement 1: Provide Visual Query Builder UI

**User Story:** As a geoscientist, I want to build OSDU queries using dropdown menus and form inputs, so that I can search without typing natural language queries.

#### Acceptance Criteria

1. THE System SHALL provide a visual query builder component accessible from the catalog chat interface
2. WHEN the System displays the query builder, THE System SHALL show hierarchical dropdown menus for query construction
3. WHEN the user opens the query builder, THE System SHALL display common query templates as starting points
4. WHERE the user selects a query template, THE System SHALL populate the builder with appropriate fields
5. WHILE building a query, THE System SHALL show a live preview of the generated OSDU query syntax

### Requirement 2: Support Hierarchical Field Selection

**User Story:** As a geoscientist, I want dropdown options to update based on my previous selections, so that I only see relevant choices at each step.

#### Acceptance Criteria

1. WHEN the System displays field dropdowns, THE System SHALL organize fields by category (Well, Wellbore, Log, Seismic)
2. WHEN the user selects a data type, THE System SHALL update available field options to match that type
3. WHERE the user selects a field, THE System SHALL display appropriate operators for that field type
4. WHEN the user selects an operator, THE System SHALL show the appropriate input control (text, number, date, dropdown)
5. WHILE the user builds criteria, THE System SHALL validate selections and disable invalid combinations

### Requirement 3: Generate Properly Formatted OSDU Queries

**User Story:** As a geoscientist, I want the query builder to generate syntactically correct OSDU queries, so that searches execute without errors.

#### Acceptance Criteria

1. WHEN the user completes query selections, THE System SHALL generate a properly formatted OSDU query string
2. WHEN the System generates queries, THE System SHALL use correct OSDU query DSL syntax
3. WHERE multiple criteria are specified, THE System SHALL combine them with proper AND/OR logic
4. WHEN the System constructs queries, THE System SHALL properly escape special characters and quote strings
5. THE System SHALL validate the generated query before allowing execution

### Requirement 4: Execute Queries with Zero AI Latency

**User Story:** As a geoscientist, I want query results returned instantly, so that I can iterate quickly through different search criteria.

#### Acceptance Criteria

1. WHEN the user executes a query builder query, THE System SHALL send the formatted query directly to OSDU API
2. WHEN the System sends queries, THE System SHALL bypass all AI agent processing
3. WHERE queries are properly formatted, THE System SHALL return results in under 2 seconds
4. WHEN the System receives results, THE System SHALL display them using existing OSDU result components
5. THE System SHALL NOT use natural language processing for query builder searches

### Requirement 5: Provide Common Query Templates

**User Story:** As a geoscientist, I want pre-built query templates for common searches, so that I can start quickly without building from scratch.

#### Acceptance Criteria

1. THE System SHALL provide at least 5 common query templates
2. WHEN the System displays templates, THE System SHALL include: Wells by Operator, Wells by Location, Wells by Depth Range, Logs by Type, Recent Data
3. WHERE the user selects a template, THE System SHALL pre-populate the query builder with template fields
4. WHEN the user applies a template, THE System SHALL allow modification of all template parameters
5. THE System SHALL allow users to save custom queries as personal templates

### Requirement 6: Support Multiple Filter Criteria

**User Story:** As a geoscientist, I want to combine multiple search criteria with AND/OR logic, so that I can create complex queries.

#### Acceptance Criteria

1. THE System SHALL allow users to add multiple filter criteria to a single query
2. WHEN the System combines criteria, THE System SHALL provide AND/OR toggle for each criterion
3. WHERE criteria are combined, THE System SHALL show proper grouping with parentheses in query preview
4. WHEN the user adds criteria, THE System SHALL support at least 10 criteria per query
5. THE System SHALL allow users to reorder criteria via drag-and-drop

### Requirement 7: Validate Query Inputs

**User Story:** As a geoscientist, I want immediate feedback on invalid inputs, so that I don't waste time on queries that will fail.

#### Acceptance Criteria

1. WHEN the user enters field values, THE System SHALL validate data types (string, number, date)
2. WHERE validation fails, THE System SHALL display inline error messages
3. WHEN the System detects invalid queries, THE System SHALL disable the execute button
4. THE System SHALL validate required fields before allowing query execution
5. WHILE the user types, THE System SHALL provide real-time validation feedback

### Requirement 8: Display Query Preview

**User Story:** As a geoscientist, I want to see the actual OSDU query being generated, so that I can learn the query syntax and verify correctness.

#### Acceptance Criteria

1. THE System SHALL display a live preview of the generated OSDU query
2. WHEN the user changes selections, THE System SHALL update the query preview in real-time
3. WHERE the query is complex, THE System SHALL format the preview with proper indentation
4. WHEN the System shows the preview, THE System SHALL use syntax highlighting for readability
5. THE System SHALL allow users to copy the generated query to clipboard

### Requirement 9: Integrate with Existing Chat Interface

**User Story:** As a geoscientist, I want the query builder to feel like a natural part of the chat interface, so that I can switch between conversational and visual search seamlessly.

#### Acceptance Criteria

1. WHEN the System displays the query builder, THE System SHALL show it as an expandable panel in the chat interface
2. WHERE the user executes a query, THE System SHALL add the query and results to the chat message history
3. WHEN the System displays results, THE System SHALL use existing OSDUSearchResponse component
4. THE System SHALL allow users to toggle between conversational search and query builder
5. WHILE using the query builder, THE System SHALL maintain chat context and history

### Requirement 10: Support Query History and Reuse

**User Story:** As a geoscientist, I want to access my previous queries, so that I can rerun or modify them without rebuilding from scratch.

#### Acceptance Criteria

1. THE System SHALL store the last 20 query builder queries in browser local storage
2. WHEN the user opens query history, THE System SHALL display previous queries with timestamps
3. WHERE the user selects a historical query, THE System SHALL load it into the query builder
4. WHEN the System stores queries, THE System SHALL include query parameters and result counts
5. THE System SHALL allow users to delete queries from history

### Requirement 11: Provide Field Autocomplete

**User Story:** As a geoscientist, I want autocomplete suggestions for field values, so that I can select from known values rather than guessing.

#### Acceptance Criteria

1. WHERE field values have known options, THE System SHALL provide autocomplete dropdown
2. WHEN the user types in autocomplete fields, THE System SHALL filter suggestions in real-time
3. THE System SHALL provide autocomplete for: Operator names, Country names, Basin names, Well types, Log types
4. WHERE autocomplete data is unavailable, THE System SHALL fall back to free-text input
5. WHEN the System provides suggestions, THE System SHALL show at least 10 most common values

### Requirement 12: Support Advanced Query Features

**User Story:** As a geoscientist, I want to use advanced query features like wildcards and ranges, so that I can create sophisticated searches.

#### Acceptance Criteria

1. THE System SHALL support wildcard searches using * and ? characters
2. WHEN the user specifies numeric fields, THE System SHALL provide range inputs (min/max)
3. WHERE date fields are selected, THE System SHALL provide date range pickers
4. THE System SHALL support IN operator for selecting multiple values from a list
5. THE System SHALL support NOT operator for exclusion criteria

### Requirement 13: Optimize for Mobile and Desktop

**User Story:** As a geoscientist, I want the query builder to work on both desktop and mobile devices, so that I can search from anywhere.

#### Acceptance Criteria

1. WHEN the System displays on mobile, THE System SHALL use responsive layout with stacked fields
2. WHERE screen space is limited, THE System SHALL collapse advanced options into expandable sections
3. WHEN the user interacts on touch devices, THE System SHALL provide touch-friendly controls (minimum 44px tap targets)
4. THE System SHALL use native mobile controls for dates and numbers on mobile devices
5. WHILE on desktop, THE System SHALL support keyboard shortcuts for common actions

### Requirement 14: Provide Query Builder Help

**User Story:** As a geoscientist, I want contextual help for query builder features, so that I can learn how to use it effectively.

#### Acceptance Criteria

1. THE System SHALL provide tooltip help for each query builder field
2. WHEN the user hovers over field labels, THE System SHALL display field descriptions
3. WHERE operators are shown, THE System SHALL provide examples of their usage
4. THE System SHALL include a help button that opens query builder documentation
5. WHEN the System detects user confusion (multiple validation errors), THE System SHALL offer guided help

### Requirement 15: Track Query Performance Metrics

**User Story:** As a system administrator, I want to track query builder usage and performance, so that I can optimize the feature.

#### Acceptance Criteria

1. THE System SHALL log query builder usage events (opens, executions, template selections)
2. WHEN queries execute, THE System SHALL record execution time and result counts
3. THE System SHALL track which query templates are most popular
4. WHERE queries fail, THE System SHALL log error types and frequencies
5. THE System SHALL provide analytics dashboard for query builder metrics
