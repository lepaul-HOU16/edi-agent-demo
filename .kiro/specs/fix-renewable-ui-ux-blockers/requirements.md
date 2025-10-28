# Requirements Document: Fix Renewable UI/UX Blockers

## Introduction

This specification addresses critical UI/UX blockers in the renewable energy workflow that prevent users from completing their analysis. These are specific, high-impact issues that block workflow progression and create user frustration.

## Glossary

- **Perimeter Circle**: The circular boundary overlay on maps showing the project site area
- **Intelligent Placement**: Algorithm that places turbines based on terrain constraints and wind patterns
- **Grid Placement**: Simple algorithm that places turbines in a regular grid pattern
- **Action Buttons**: Interactive buttons that trigger the next workflow step
- **Wake Simulation**: Analysis of wind turbine wake effects and energy losses
- **Orchestrator**: Backend Lambda function that routes queries and generates artifacts

## Requirements

### Requirement 1: Fix Perimeter Circle Clickthrough

**User Story:** As a renewable energy analyst, I want to click on map features through the perimeter circle, so that I can interact with terrain features and turbines.

#### Acceptance Criteria

1. WHEN the perimeter circle is rendered on the map, THE System SHALL apply CSS `pointer-events: none` to the circle overlay
2. WHEN the user clicks within the perimeter circle area, THE System SHALL allow the click to pass through to underlying map elements
3. WHEN the user hovers over the perimeter circle, THE System SHALL NOT show a pointer cursor
4. WHEN the perimeter circle is visible, THE System SHALL maintain its visual appearance (dashed border, transparent fill)
5. WHEN underlying map features are clicked through the circle, THE System SHALL display their popups normally

### Requirement 2: Validate Intelligent Turbine Placement Actually Works

**User Story:** As a renewable energy analyst, I want to SEE intelligent turbine placement working in the UI (not just claimed in tests), so that I can trust the system is using terrain-aware algorithms.

#### Acceptance Criteria

1. WHEN layout optimization is requested, THE System SHALL log which placement algorithm is being called (intelligent vs grid)
2. WHEN the layout is displayed in the UI, THE System SHALL show turbines that are NOT in a regular grid pattern
3. WHEN turbines are placed, THE System SHALL visibly avoid obstacles (buildings, roads, water bodies)
4. WHEN the user inspects turbine positions, THE System SHALL show evidence of constraint-based placement (irregular spacing, obstacle avoidance)
5. WHEN the layout is generated, THE System SHALL include metadata showing which algorithm was used and why turbines are positioned where they are

**Validation Requirements:**
- User must be able to SEE in the browser that turbines avoid obstacles
- User must be able to SEE that turbines are NOT in a grid
- System must LOG which algorithm is actually being called
- System must PROVE intelligent placement is running (not just return success=true)

### Requirement 3: Fix Duplicate Action Buttons

**User Story:** As a renewable energy analyst, I want to see each action button only once, so that the interface is clean and professional.

#### Acceptance Criteria

1. WHEN an artifact is rendered, THE System SHALL display each action button exactly once
2. WHEN the component re-renders, THE System SHALL NOT duplicate existing buttons
3. WHEN React strict mode is enabled, THE System SHALL properly clean up button state
4. WHEN buttons are generated, THE System SHALL use unique keys to prevent duplication
5. WHEN the user scrolls, THE System SHALL NOT create additional button instances

### Requirement 4: Fix Wake Simulation Button

**User Story:** As a renewable energy analyst, I want the wake simulation button to trigger wake analysis, so that I can proceed with the workflow.

#### Acceptance Criteria

1. WHEN the user clicks "Run Wake Simulation" button, THE System SHALL send a wake simulation query to the orchestrator
2. WHEN the wake simulation query is received, THE Orchestrator SHALL route it to the simulation Lambda
3. WHEN the simulation Lambda completes, THE System SHALL return wake analysis artifacts
4. WHEN wake analysis artifacts are returned, THE System SHALL display wake visualizations
5. WHEN the button is clicked, THE System SHALL show loading state until results are ready

### Requirement 5: Preserve OSM Features Across Workflow

**User Story:** As a renewable energy analyst, I want to see terrain features on all maps throughout the workflow, so that I maintain context about site constraints.

#### Acceptance Criteria

1. WHEN terrain analysis completes, THE System SHALL store OSM features in project data
2. WHEN layout optimization runs, THE System SHALL include OSM features from terrain analysis in the layout GeoJSON
3. WHEN the layout map renders, THE System SHALL display roads, buildings, and water bodies
4. WHEN the perimeter is defined, THE System SHALL display it on both terrain and layout maps
5. WHEN features are rendered, THE System SHALL apply consistent styling across all maps

### Requirement 6: Implement Integrated Dashboard View (Optional Enhancement)

**User Story:** As a renewable energy analyst, I want to see wake analysis and wind rose as components within the layout dashboard, so that I have a consolidated view of all analyses.

#### Acceptance Criteria

1. WHEN layout optimization completes, THE System SHALL offer an option to view integrated dashboard
2. WHEN integrated dashboard is requested, THE System SHALL display layout map as the primary component
3. WHEN integrated dashboard is displayed, THE System SHALL show wake analysis in a side panel
4. WHEN integrated dashboard is displayed, THE System SHALL show wind rose in a side panel
5. WHEN dashboard components are rendered, THE System SHALL maintain visual cohesion and responsive layout

## Validation-First Approach

**CRITICAL**: This spec focuses on **proving functionality works in the UI**, not just claiming it works in tests.

For intelligent placement specifically:
- We will NOT accept "tests pass" as proof
- We WILL require visual evidence in the browser
- We WILL require logging that shows which algorithm ran
- We WILL require the user to validate they see intelligent placement

## Technical Requirements

### TR-1: CSS Pointer Events
- Apply `pointer-events: none` to perimeter circle SVG/div element
- Ensure underlying Leaflet layers remain interactive
- Test clickthrough on all browsers (Chrome, Firefox, Safari)

### TR-2: Algorithm Validation (PROVE IT WORKS)
- Add explicit logging: "Using intelligent_placement algorithm with X constraints"
- Log each turbine position decision: "Turbine T001 placed at (x,y) - avoided building at (x2,y2)"
- Return algorithm metadata in response: `{ algorithm: "intelligent", constraints_applied: [...], avoided_features: [...] }`
- Display algorithm info in UI so user can see what ran
- Make it IMPOSSIBLE to claim success without actually running intelligent placement

### TR-3: React State Management
- Use `useEffect` cleanup functions for button rendering
- Implement proper key props for button lists
- Prevent duplicate renders in strict mode
- Add defensive checks for existing buttons

### TR-4: Action Button Event Handling
- Implement proper onClick handlers for wake simulation button
- Pass correct query parameters to orchestrator
- Handle loading and error states
- Provide user feedback during execution

### TR-5: Data Persistence
- Store terrain GeoJSON in project data after terrain analysis
- Retrieve terrain GeoJSON when generating layout
- Merge terrain and turbine features in layout response
- Maintain feature properties and styling attributes

### TR-6: Dashboard Component Architecture (Optional)
- Create `IntegratedRenewableDashboard.tsx` component
- Implement responsive grid layout (main + 2 side panels)
- Embed existing artifact components
- Ensure data flows between components

## Success Criteria

### Phase 1: Critical Fixes (Must Have)
- ✅ Users can click through perimeter circle to interact with map
- ✅ **USER VALIDATES** they see intelligent placement in browser (turbines avoid obstacles, not in grid)
- ✅ **USER VALIDATES** they see algorithm metadata showing intelligent placement ran
- ✅ No duplicate action buttons appear
- ✅ Wake simulation button triggers wake analysis
- ✅ OSM features visible on all maps

### Phase 2: Enhancement (Nice to Have)
- ✅ Integrated dashboard view available as option
- ✅ All analyses visible in consolidated view
- ✅ Dashboard is responsive and visually cohesive

## Out of Scope

- New analysis features or algorithms
- Performance optimization beyond basic fixes
- Complete UI redesign
- Mobile-specific optimizations
- Real-time collaboration features
- Advanced dashboard customization

## Constraints

1. **Maintain Backend Functionality**: Don't break existing Lambda functions
2. **Preserve Data Accuracy**: Ensure all calculations remain correct
3. **Keep Performance**: Don't introduce significant slowdowns
4. **Backward Compatibility**: Existing workflows must continue to work

## Priority Order

1. **CRITICAL**: Fix perimeter clickthrough (blocks all interaction)
2. **CRITICAL**: Fix intelligent turbine placement (core functionality broken)
3. **HIGH**: Fix wake simulation button (workflow blocker)
4. **HIGH**: Preserve OSM features (user experience issue)
5. **MEDIUM**: Fix duplicate buttons (polish issue)
6. **MEDIUM**: Implement dashboard integration (enhancement)

## Definition of Done

- [ ] All critical fixes (1-4) are implemented and tested
- [ ] **USER SEES intelligent placement working in browser** (not just tests passing)
- [ ] **USER SEES turbines avoiding obstacles** (visual proof)
- [ ] **USER SEES algorithm metadata** confirming intelligent placement ran
- [ ] User can complete full workflow without UI blockers
- [ ] No regressions in existing functionality
- [ ] Code is clean and maintainable
- [ ] **USER VALIDATES** the fixes work as expected (not AI claiming they work)

