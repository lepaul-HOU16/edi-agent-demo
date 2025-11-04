# Requirements Document

## Introduction

This specification defines the integration of an external OSDU Search API into the existing Data Catalog search functionality. The integration must preserve all existing catalog features (map visualization, table display, filtering, collection creation, chain of thought) while adding the ability to query an external OSDU data source through a dedicated API endpoint.

## Glossary

- **OSDU Search API**: External REST API endpoint that provides natural language search capabilities over OSDU (Open Subsurface Data Universe) data
- **Data Catalog**: The existing catalog page component that displays well data on maps and tables
- **CatalogSearch**: The current backend GraphQL query that processes catalog search requests
- **Catalog Chat Component**: The CatalogChatBoxCloudscape component that handles user input and displays results
- **Map Component**: The MapComponent that renders geographic data with Leaflet
- **Analysis Panel**: The Data Analysis & Visualization panel (seg-2) that shows GeoscientistDashboard
- **Chain of Thought Panel**: The panel (seg-3) that displays AI reasoning steps

## Requirements

### Requirement 1: Preserve Existing Catalog Functionality

**User Story:** As a geoscientist using the data catalog, I want all existing search, filter, map, and visualization features to continue working exactly as they do now, so that the OSDU integration does not disrupt my current workflows.

#### Acceptance Criteria

1. WHEN the System receives a catalog search query, THE System SHALL continue to use the existing catalogSearch GraphQL query for non-OSDU searches
2. WHEN the System displays search results on the map, THE System SHALL maintain the existing map state persistence and panel switching behavior
3. WHEN the System filters existing results, THE System SHALL preserve the context-aware filtering with existingContext parameter
4. WHEN the System creates collections, THE System SHALL maintain the existing collection creation modal and workflow
5. WHERE the user switches between Map, Analysis, and Chain of Thought panels, THE System SHALL preserve all existing panel state and data

### Requirement 2: Add OSDU Search Capability

**User Story:** As a geoscientist, I want to search OSDU data sources through natural language queries, so that I can access external subsurface data alongside my existing catalog data.

#### Acceptance Criteria

1. WHEN the System detects an OSDU search intent in the user query, THE System SHALL call the OSDU Search API at https://mye6os9wfa.execute-api.us-east-1.amazonaws.com/prod/search
2. WHEN the System calls the OSDU Search API, THE System SHALL include the x-api-key header with the configured API key from environment variables
3. WHEN the System sends an OSDU search request, THE System SHALL include query, dataPartition (default: "osdu"), and maxResults (default: 10) parameters
4. WHEN the System receives an OSDU search response, THE System SHALL extract the answer, recordCount, and records fields
5. WHERE the OSDU search returns results, THE System SHALL display the AI-generated answer text and the record count to the user

### Requirement 3: Implement Search Intent Detection

**User Story:** As a geoscientist, I want the system to automatically determine whether to search the local catalog or OSDU data based on my query, so that I don't need to manually specify the data source.

#### Acceptance Criteria

1. WHEN the System receives a user query containing "OSDU" keyword, THE System SHALL route the query to the OSDU Search API
2. WHEN the System receives a user query without "OSDU" keyword, THE System SHALL route the query to the existing catalogSearch
3. WHEN the System detects ambiguous search intent, THE System SHALL default to the existing catalogSearch behavior
4. WHERE the user explicitly requests OSDU data, THE System SHALL prioritize OSDU Search API over catalogSearch
5. WHILE processing a query, THE System SHALL log the detected search intent for debugging purposes

### Requirement 4: Display OSDU Search Results

**User Story:** As a geoscientist, I want OSDU search results displayed in a clear, readable format within the chat interface, so that I can quickly understand the search findings.

#### Acceptance Criteria

1. WHEN the System receives OSDU search results, THE System SHALL display the AI-generated answer as formatted markdown text
2. WHEN the System displays OSDU results, THE System SHALL show the record count prominently
3. WHERE OSDU returns multiple records, THE System SHALL display a summary table of the records
4. WHEN the System encounters an OSDU API error, THE System SHALL display a user-friendly error message
5. WHILE loading OSDU results, THE System SHALL show a loading indicator with "Searching OSDU data..." message

### Requirement 5: Maintain API Security

**User Story:** As a system administrator, I want the OSDU API key stored securely and never exposed to end users, so that unauthorized users cannot access the OSDU API.

#### Acceptance Criteria

1. THE System SHALL NOT include the OSDU API key in any frontend code, configuration files, or environment variables accessible to the browser
2. WHEN the System stores the OSDU API key, THE System SHALL use backend-only environment variables in AWS Lambda configuration
3. WHEN the System makes OSDU API calls, THE System SHALL proxy ALL requests through a backend Lambda function that adds the API key server-side
4. THE System SHALL NOT log the OSDU API key in console output, CloudWatch logs, or any debugging output
5. THE System SHALL NOT commit the OSDU API key to version control in any file
6. WHERE the OSDU API key is missing from backend configuration, THE System SHALL fail gracefully with an error message that does not reveal the key
7. WHEN the System handles OSDU API errors, THE System SHALL sanitize error messages to remove any API key information
8. THE System SHALL add the OSDU API key to .gitignore patterns and .env.example files with placeholder values only

### Requirement 6: Handle Cross-Origin Requests

**User Story:** As a developer, I want OSDU API requests to work from the frontend without CORS issues, so that the integration functions reliably in all deployment environments.

#### Acceptance Criteria

1. WHEN the System makes OSDU API requests from the frontend, THE System SHALL handle CORS headers correctly
2. WHERE CORS issues occur, THE System SHALL proxy requests through a backend service
3. WHEN the System proxies OSDU requests, THE System SHALL preserve all request parameters and headers
4. THE System SHALL return OSDU responses in the same format as direct API calls
5. WHILE processing proxied requests, THE System SHALL maintain request timeout limits of 30 seconds

### Requirement 7: Integrate with Existing Chat UI

**User Story:** As a geoscientist, I want OSDU search results to appear in the same chat interface as catalog results, so that I have a consistent user experience.

#### Acceptance Criteria

1. WHEN the System displays OSDU results, THE System SHALL use the existing ChatMessage component
2. WHEN the System formats OSDU responses, THE System SHALL use the CustomAIMessage component with markdown rendering
3. WHERE OSDU returns tabular data, THE System SHALL use the existing ProfessionalGeoscientistDisplay component
4. WHEN the System adds OSDU messages to chat, THE System SHALL maintain the existing message state management
5. WHILE displaying OSDU results, THE System SHALL preserve auto-scroll and user interaction behaviors

### Requirement 8: Support Incremental Enhancement

**User Story:** As a developer, I want the OSDU integration implemented with minimal code changes, so that we can deploy quickly and reduce regression risk.

#### Acceptance Criteria

1. THE System SHALL add OSDU search capability without modifying existing catalogSearch logic
2. THE System SHALL implement OSDU integration as an additive feature, not a replacement
3. WHERE OSDU search fails, THE System SHALL fall back to existing catalog search
4. WHEN the System detects OSDU unavailability, THE System SHALL continue functioning with catalog-only search
5. THE System SHALL require fewer than 200 lines of new code for the complete integration

### Requirement 9: Provide Clear User Feedback

**User Story:** As a geoscientist, I want to know which data source (catalog or OSDU) is being searched, so that I understand the context of my results.

#### Acceptance Criteria

1. WHEN the System searches OSDU, THE System SHALL display "Searching OSDU data..." in the loading indicator
2. WHEN the System displays OSDU results, THE System SHALL include "OSDU Search Results" in the response header
3. WHERE the System searches the catalog, THE System SHALL display "Catalog Search Results" in the response header
4. WHEN the System encounters errors, THE System SHALL clearly indicate whether the error is from OSDU or catalog
5. WHILE processing queries, THE System SHALL log search source decisions for debugging

### Requirement 10: Enable Testing and Validation

**User Story:** As a developer, I want to easily test the OSDU integration, so that I can verify it works correctly before deployment.

#### Acceptance Criteria

1. THE System SHALL provide example OSDU search queries in the documentation
2. THE System SHALL log OSDU API requests and responses for debugging
3. WHERE OSDU integration is disabled, THE System SHALL log the reason clearly
4. WHEN the System makes OSDU API calls, THE System SHALL include request timing metrics
5. THE System SHALL provide a test script to validate OSDU API connectivity
