# Requirements Document

## Introduction

The renewable energy orchestrator is incorrectly routing terrain analysis queries to the project listing handler instead of executing terrain analysis. When a user explicitly selects the "Renewables Agent" and asks "Analyze terrain at coordinates 35.067482, -101.395466 in Texas", the system returns a list of 34 existing projects instead of performing the requested terrain analysis.

**Root Cause:** The `ProjectListHandler.isProjectListQuery()` method uses overly broad regex patterns that incorrectly match terrain analysis queries. Specifically, the pattern `/list.*my.*projects?/i` matches "Analyze terrain **at**..." because the wildcard `.*` between "list" and "my" can match any characters, including the entire phrase "Analyze terrain at coordinates 35.067482, -101.395466 in Texas".

**Impact:** This is a critical routing bug that breaks the core terrain analysis functionality when the Renewables Agent is explicitly selected, creating a confusing user experience where users cannot perform terrain analysis.

## Requirements

### Requirement 1: Fix Project List Query Detection

**User Story:** As a user, when I request terrain analysis, I want the system to perform terrain analysis, not list my projects.

#### Acceptance Criteria

1. WHEN a user submits "Analyze terrain at coordinates X, Y" THEN the system SHALL route to terrain analysis, not project listing
2. WHEN a user submits "analyze terrain at 35.067482, -101.395466 in Texas" THEN the system SHALL invoke the terrain tool Lambda
3. WHEN a user submits "list my projects" THEN the system SHALL route to project listing
4. WHEN a user submits "show my renewable projects" THEN the system SHALL route to project listing
5. IF the query contains "analyze" or "terrain" AND coordinates THEN the system SHALL NOT match project list patterns

### Requirement 2: Improve Pattern Matching Specificity

**User Story:** As a developer, I want regex patterns to be specific and non-overlapping, so that queries route to the correct handler.

#### Acceptance Criteria

1. WHEN defining regex patterns THEN patterns SHALL use word boundaries or specific anchors
2. WHEN a pattern uses wildcards (.*) THEN it SHALL be constrained to prevent false matches
3. WHEN multiple patterns could match THEN the system SHALL prioritize the most specific match
4. IF a query contains renewable energy action verbs (analyze, optimize, simulate, generate) THEN it SHALL NOT match project management patterns

### Requirement 3: Add Routing Validation Tests

**User Story:** As a developer, I want automated tests that verify query routing, so that regressions are caught immediately.

#### Acceptance Criteria

1. WHEN tests run THEN they SHALL verify terrain analysis queries route to terrain handler
2. WHEN tests run THEN they SHALL verify project list queries route to project list handler
3. WHEN tests run THEN they SHALL verify ambiguous queries are handled correctly
4. IF routing logic changes THEN tests SHALL fail if routing behavior regresses

### Requirement 4: Log Routing Decisions

**User Story:** As a developer debugging routing issues, I want detailed logs showing why a query matched a particular pattern, so that I can quickly identify routing problems.

#### Acceptance Criteria

1. WHEN a query is processed THEN the system SHALL log which patterns were tested
2. WHEN a pattern matches THEN the system SHALL log the matched pattern and confidence
3. WHEN routing to a handler THEN the system SHALL log the handler name and reason
4. IF multiple patterns match THEN the system SHALL log all matches and the selection logic
