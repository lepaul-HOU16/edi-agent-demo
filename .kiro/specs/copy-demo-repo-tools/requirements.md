# Requirements: Copy Demo Repo Tools

## Introduction

ALL renewable tool handlers are currently using custom implementations instead of the proven logic from `agentic-ai-for-renewable-site-design-mainline`. This was supposed to be a SIMPLE INTEGRATION where we COPY the demo repo's tool files directly. Instead, everything was reinvented from scratch.

## Glossary

- **Demo Repository**: The `agentic-ai-for-renewable-site-design-mainline` reference implementation with proven algorithms
- **Tool Files**: Python modules in `workshop-assets/agents/tools/` containing the actual implementation logic
- **Handler Files**: Our Lambda handlers in `amplify/functions/renewableTools/*/handler.py` that should call the tool functions

## Requirements

### Requirement 1: Copy ALL Tool Files from Demo Repo

**User Story:** As a developer, I want to use the proven demo repo logic, so that I don't waste time reinventing working algorithms.

#### Acceptance Criteria

1. WHEN copying tool files, THE System SHALL copy `layout_tools.py`, `terrain_tools.py`, `simulation_tools.py`, `report_tools.py`, `shared_tools.py`, and `storage_utils.py` from demo repo to our codebase
2. WHEN copying files, THE System SHALL preserve ALL functions, classes, and logic exactly as they exist in the demo repo
3. WHEN copying files, THE System SHALL place tool files in `amplify/functions/renewableTools/` directory structure
4. WHEN copying is complete, THE System SHALL verify all imports and dependencies are satisfied
5. WHEN tool files are copied, THE System SHALL NOT modify the core algorithms or logic

### Requirement 2: Update Handler Files to Use Tool Functions

**User Story:** As a developer, I want handlers to call the demo repo functions, so that we use the proven implementations instead of custom code.

#### Acceptance Criteria

1. WHEN updating layout handler, THE System SHALL import and call functions from `layout_tools.py` instead of using custom grid logic
2. WHEN updating terrain handler, THE System SHALL import and call functions from `terrain_tools.py` instead of custom OSM logic
3. WHEN updating simulation handler, THE System SHALL import and call functions from `simulation_tools.py` instead of custom wake logic
4. WHEN updating report handler, THE System SHALL import and call functions from `report_tools.py` instead of custom report logic
5. WHEN updating handlers, THE System SHALL maintain backward compatibility with existing parameter formats

### Requirement 3: Preserve Demo Repo Storage Patterns

**User Story:** As a developer, I want to use the demo repo's storage utilities, so that file operations follow proven patterns.

#### Acceptance Criteria

1. WHEN copying storage utilities, THE System SHALL copy `storage_utils.py` with functions like `save_file_with_storage()` and `load_file_from_storage()`
2. WHEN handlers save files, THE System SHALL use storage utility functions instead of direct S3 calls
3. WHEN handlers load files, THE System SHALL use storage utility functions for consistent path handling
4. WHEN storage operations fail, THE System SHALL use the demo repo's error handling patterns
5. WHEN storage paths are constructed, THE System SHALL follow the demo repo's project-specific path conventions

### Requirement 4: Copy Shared Utilities

**User Story:** As a developer, I want to use the demo repo's shared utilities, so that common operations like turbine specs and coordinate transformations are consistent.

#### Acceptance Criteria

1. WHEN copying shared tools, THE System SHALL copy `shared_tools.py` with functions like `get_turbine_specs()`
2. WHEN handlers need turbine specifications, THE System SHALL call `get_turbine_specs()` instead of hardcoding values
3. WHEN handlers need coordinate transformations, THE System SHALL use shared utility functions
4. WHEN handlers need wind direction calculations, THE System SHALL use shared utility functions
5. WHEN shared utilities are used, THE System SHALL import them consistently across all handlers

### Requirement 5: Minimal Handler Wrapper Logic

**User Story:** As a developer, I want handlers to be thin wrappers, so that the demo repo logic does the actual work.

#### Acceptance Criteria

1. WHEN implementing handlers, THE System SHALL extract parameters from Lambda event
2. WHEN parameters are extracted, THE System SHALL call the appropriate tool function with those parameters
3. WHEN tool functions return results, THE System SHALL format the response for the orchestrator
4. WHEN errors occur, THE System SHALL pass through error messages from tool functions
5. WHEN handlers are complete, THE System SHALL contain minimal custom logic beyond parameter extraction and response formatting
