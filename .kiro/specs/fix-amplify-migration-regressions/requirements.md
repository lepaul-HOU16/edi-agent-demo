# Requirements Document

## Introduction

During the Amplify Gen2 to CDK migration (commit ab01226 "massive rearchitecture away from amplify gen2 and nextjs to pure CDK approach"), multiple features broke. The migration was supposed to ONLY replace Amplify/Next.js infrastructure with CDK/React Router, but instead introduced numerous regressions where working functionality was changed or broken. This spec aims to systematically identify and fix ALL regressions by comparing pre-migration code (commit 925b396 "working minecraft demo") with post-migration code and restoring the correct behavior.

## Glossary

- **Pre-Migration Code**: The last stable build before migration (commit 925b396 "working minecraft demo")
- **Post-Migration Code**: Current code after the Amplify to CDK migration (commit ab01226 and later)
- **Regression**: Any feature that worked pre-migration but is broken or behaves differently post-migration
- **Migration Boundary**: Changes that should have been limited to Amplify/CDK infrastructure only
- **Behavioral Regression**: When the user-facing behavior changed during migration (NOT ALLOWED)
- **Infrastructure Change**: Replacing Amplify calls with CDK/REST API calls (ALLOWED)

## Requirements

### Requirement 1: EDIcraft Clear Button Regression

**User Story:** As a user, I want the EDIcraft Clear button to work exactly as it did pre-migration, so that I can clear the Minecraft environment without seeing user messages in chat.

#### Acceptance Criteria

1. WHEN comparing pre-migration EDIcraftAgentLanding.tsx (commit 925b396) with post-migration THEN the system SHALL identify all behavioral differences
2. WHEN the Clear button is clicked THEN the system SHALL execute the clear action with a loading spinner on the button (pre-migration behavior)
3. WHEN the Clear button is clicked THEN the system SHALL NOT display a user message in the chat interface (pre-migration behavior)
4. WHEN the clear operation completes THEN the system SHALL display only the agent's response in chat (pre-migration behavior)
5. WHEN the clear operation is in progress THEN the button SHALL show loading state and be disabled (pre-migration behavior)

### Requirement 2: Systematic Code Comparison

**User Story:** As a developer, I want to systematically compare all files changed during migration, so that I can identify every regression introduced.

#### Acceptance Criteria

1. WHEN analyzing the migration THEN the system SHALL identify all files modified between commit 925b396 and commit ab01226
2. WHEN comparing each file THEN the system SHALL distinguish between infrastructure changes (allowed) and behavioral changes (regressions)
3. WHEN a behavioral change is found THEN the system SHALL document it as a regression requiring fix
4. WHEN an infrastructure change is found THEN the system SHALL verify it maintains the same user-facing behavior
5. WHEN all files are analyzed THEN the system SHALL produce a complete list of regressions to fix

### Requirement 3: Infrastructure-Only Changes

**User Story:** As a developer, I want to ensure migration changes were limited to infrastructure, so that user-facing behavior remains unchanged.

#### Acceptance Criteria

1. WHEN replacing Amplify calls THEN the system SHALL use equivalent CDK/REST API calls that produce identical results
2. WHEN replacing Next.js routing THEN the system SHALL use React Router with identical navigation behavior
3. WHEN replacing Amplify authentication THEN the system SHALL use Cognito directly with identical auth flow
4. WHEN replacing any infrastructure THEN the system SHALL maintain exact same component props, state, and behavior
5. WHEN migration is complete THEN users SHALL NOT notice any difference in functionality

### Requirement 4: Component Behavior Preservation

**User Story:** As a developer, I want all React components to behave identically pre and post-migration, so that no user-facing functionality is lost.

#### Acceptance Criteria

1. WHEN comparing component state management THEN pre-migration and post-migration SHALL be identical
2. WHEN comparing component props THEN pre-migration and post-migration SHALL be identical
3. WHEN comparing event handlers THEN pre-migration and post-migration SHALL produce identical results
4. WHEN comparing UI rendering THEN pre-migration and post-migration SHALL display identically
5. WHEN comparing user interactions THEN pre-migration and post-migration SHALL respond identically

### Requirement 5: API Call Equivalence

**User Story:** As a developer, I want all API calls to produce identical results pre and post-migration, so that backend integration remains unchanged.

#### Acceptance Criteria

1. WHEN an Amplify mutation was called pre-migration THEN an equivalent REST API call SHALL be made post-migration
2. WHEN an Amplify query was called pre-migration THEN an equivalent REST API call SHALL be made post-migration
3. WHEN API responses are received THEN they SHALL be processed identically pre and post-migration
4. WHEN API errors occur THEN they SHALL be handled identically pre and post-migration
5. WHEN API calls complete THEN the UI SHALL update identically pre and post-migration

### Requirement 6: Regression Fix Process

**User Story:** As a developer, I want a systematic process for fixing each regression, so that I restore exact pre-migration behavior.

#### Acceptance Criteria

1. WHEN fixing a regression THEN the system SHALL compare pre-migration code line-by-line with post-migration code
2. WHEN behavioral differences are found THEN the system SHALL restore pre-migration behavior exactly
3. WHEN infrastructure calls need updating THEN the system SHALL wrap them to maintain pre-migration behavior
4. WHEN fixes are applied THEN the system SHALL verify behavior matches pre-migration exactly
5. WHEN all regressions are fixed THEN the system SHALL have identical user-facing behavior to pre-migration

### Requirement 7: Testing Against Pre-Migration Baseline

**User Story:** As a developer, I want to test post-migration code against pre-migration behavior, so that I can verify all regressions are fixed.

#### Acceptance Criteria

1. WHEN testing a component THEN the system SHALL compare its behavior to pre-migration baseline
2. WHEN testing user interactions THEN the system SHALL verify they produce pre-migration results
3. WHEN testing API calls THEN the system SHALL verify they produce pre-migration responses
4. WHEN testing UI rendering THEN the system SHALL verify it matches pre-migration display
5. WHEN all tests pass THEN the system SHALL have successfully restored pre-migration behavior

### Requirement 8: Documentation of Changes

**User Story:** As a developer, I want documentation of what was changed during migration, so that I understand what needs to be fixed.

#### Acceptance Criteria

1. WHEN analyzing migration THEN the system SHALL document every file that changed
2. WHEN documenting changes THEN the system SHALL categorize as infrastructure or behavioral
3. WHEN documenting regressions THEN the system SHALL include pre-migration behavior description
4. WHEN documenting fixes THEN the system SHALL include what was restored and why
5. WHEN documentation is complete THEN it SHALL serve as a reference for future migrations

### Requirement 9: No New Features During Regression Fix

**User Story:** As a developer, I want to ensure regression fixes only restore pre-migration behavior, so that no new bugs are introduced.

#### Acceptance Criteria

1. WHEN fixing a regression THEN the system SHALL NOT add new features
2. WHEN fixing a regression THEN the system SHALL NOT refactor working code
3. WHEN fixing a regression THEN the system SHALL NOT change behavior beyond restoring pre-migration
4. WHEN fixing a regression THEN the system SHALL use pre-migration code as the source of truth
5. WHEN all fixes are complete THEN the codebase SHALL match pre-migration behavior exactly

### Requirement 10: Verification of Complete Restoration

**User Story:** As a user, I want all features to work exactly as they did pre-migration, so that I can use the application without issues.

#### Acceptance Criteria

1. WHEN using the application post-fix THEN all features SHALL work identically to pre-migration
2. WHEN clicking buttons post-fix THEN they SHALL behave identically to pre-migration
3. WHEN viewing UI post-fix THEN it SHALL display identically to pre-migration
4. WHEN interacting with agents post-fix THEN they SHALL respond identically to pre-migration
5. WHEN the user compares pre and post-migration THEN they SHALL NOT notice any functional differences
