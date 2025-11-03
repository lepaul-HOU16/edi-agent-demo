# Lifecycle Error Messages Quick Reference

## Overview

This document provides a quick reference for the error message templates used in project lifecycle operations. All error messages are designed to be user-friendly, provide context, and suggest next actions.

## Error Message Constants

### Basic Error Messages

```typescript
// Project not found
ERROR_MESSAGES.PROJECT_NOT_FOUND('project-name')
// → "Project 'project-name' not found. Use 'list projects' to see available projects."

// Name already exists
ERROR_MESSAGES.NAME_ALREADY_EXISTS('duplicate-name')
// → "Project name 'duplicate-name' already exists. Please choose a different name."

// Project in progress
ERROR_MESSAGES.PROJECT_IN_PROGRESS('active-project')
// → "Cannot delete 'active-project' - project is currently being processed. Please wait for completion."

// Confirmation required
ERROR_MESSAGES.CONFIRMATION_REQUIRED('delete', 'project-name')
// → "Are you sure you want to delete 'project-name'? Type 'yes' to confirm."
```

### Search and Filter Error Messages (Requirements 5.1-5.5)

```typescript
// No projects found
ERROR_MESSAGES.NO_PROJECTS_FOUND('location: Texas')
// → "No projects found matching: location: Texas"

// Invalid date range
ERROR_MESSAGES.INVALID_DATE_RANGE('2024-01-01', '2023-01-01')
// → "Invalid date range: 2024-01-01 to 2023-01-01. Start date must be before end date."

// Invalid search radius
ERROR_MESSAGES.INVALID_SEARCH_RADIUS(150)
// → "Invalid search radius: 150km. Radius must be between 0.1 and 100 km."

// No location match
ERROR_MESSAGES.NO_LOCATION_MATCH('California')
// → "No projects found in location: California"

// No incomplete projects
ERROR_MESSAGES.NO_INCOMPLETE_PROJECTS()
// → "No incomplete projects found. All projects have completed analysis."

// No archived projects
ERROR_MESSAGES.NO_ARCHIVED_PROJECTS()
// → "No archived projects found."
```

### Storage and Import/Export Errors

```typescript
// S3 error
ERROR_MESSAGES.S3_ERROR('save project data')
// → "Failed to save project data due to storage error. Please try again."

// Export error
ERROR_MESSAGES.EXPORT_ERROR('project-name', 'S3 access denied')
// → "Failed to export project 'project-name': S3 access denied"

// Import error
ERROR_MESSAGES.IMPORT_ERROR('Invalid JSON format')
// → "Failed to import project: Invalid JSON format"

// Unsupported version
ERROR_MESSAGES.UNSUPPORTED_VERSION('2.0')
// → "Unsupported export version: 2.0. This system supports version 1.0."
```

### Validation Errors

```typescript
// Invalid coordinates
ERROR_MESSAGES.INVALID_COORDINATES('100, 200')
// → "Invalid coordinates: 100, 200. Latitude must be between -90 and 90, longitude between -180 and 180."

// Invalid project name
ERROR_MESSAGES.INVALID_PROJECT_NAME('Invalid Name!')
// → "Invalid project name: 'Invalid Name!'. Project names must be lowercase with hyphens (kebab-case)."

// Merge conflict
ERROR_MESSAGES.MERGE_CONFLICT('project-1', 'project-2')
// → "Cannot merge projects 'project-1' and 'project-2'. Both projects must exist and have compatible data."
```

## LifecycleErrorFormatter Class

### Format Project Not Found

```typescript
LifecycleErrorFormatter.formatProjectNotFound(
  'missing-project',
  ['project-1', 'project-2', 'project-3']
)
```

**Output:**
```
❌ Project 'missing-project' not found.

**Available projects:**
1. project-1
2. project-2
3. project-3

**Suggestions:**
• Use 'list projects' to see all projects
• Check spelling of project name
• Try searching: 'search projects in [location]'
```

### Format Search Results

```typescript
LifecycleErrorFormatter.formatSearchResults(
  [project1, project2],
  { location: 'Texas', incomplete: true }
)
```

**Output:**
```
**Found 2 project(s)**

**Filters:** Location: Texas | Status: Incomplete

1. **texas-wind-farm-1**
   Status: Layout Complete (50% complete)
   Created: 1/15/2024
   Location: 35.0674, -101.3954

2. **texas-wind-farm-2**
   Status: Terrain Complete (25% complete)
   Created: 1/16/2024
   Location: 35.1234, -101.4567
```

### Format No Search Results

```typescript
LifecycleErrorFormatter.formatNoSearchResults({
  location: 'California',
  incomplete: true
})
```

**Output:**
```
❌ No projects found matching your search criteria.

**Your search:**
• Location: California
• Status: Incomplete only

**Suggestions:**
• Try broader search criteria
• Remove some filters
• Use 'list projects' to see all projects
• Check if projects are archived: 'list archived projects'
```

### Format Duplicate Groups

```typescript
LifecycleErrorFormatter.formatDuplicateGroups([
  {
    centerCoordinates: { latitude: 35.0, longitude: -101.0 },
    projects: [project1, project2],
    count: 2,
    radiusKm: 1.0
  }
])
```

**Output:**
```
**Found 1 group(s) of duplicate projects:**

**Group 1** (2 projects within 1km):
Location: 35.0000, -101.0000

  1. texas-wind-farm-1 (50% complete)
  2. texas-wind-farm-2 (25% complete)

**Actions:**
• Merge projects: 'merge projects texas-wind-farm-1 and texas-wind-farm-2'
• Delete duplicates: 'delete project texas-wind-farm-2'
• View details: 'show project texas-wind-farm-1'
```

### Format Delete Confirmation

```typescript
LifecycleErrorFormatter.formatDeleteConfirmation(project)
```

**Output:**
```
⚠️  **Confirm Deletion**

You are about to delete:
• Project: **texas-wind-farm**
• Status: Simulation Complete (75% complete)
• Created: 1/15/2024
• Location: 35.0674, -101.3954

**This will permanently remove:**
• Terrain analysis data
• Layout optimization data
• Wake simulation results

**Type 'yes' to confirm deletion, or 'no' to cancel.**
```

### Format Bulk Delete Confirmation

```typescript
LifecycleErrorFormatter.formatBulkDeleteConfirmation(
  [project1, project2, project3],
  'texas-*'
)
```

**Output:**
```
⚠️  **Confirm Bulk Deletion**

You are about to delete 3 project(s) matching pattern: **texas-***

**Projects to be deleted:**
1. texas-wind-farm-1 (50% complete)
2. texas-wind-farm-2 (25% complete)
3. texas-wind-farm-3 (75% complete)

**This action cannot be undone.**
**Type 'yes' to confirm deletion, or 'no' to cancel.**
```

### Format Merge Confirmation

```typescript
LifecycleErrorFormatter.formatMergeConfirmation(sourceProject, targetProject)
```

**Output:**
```
🔀 **Confirm Project Merge**

Merging: **source-project** → **target-project**

**Source Project (will be deleted):**
• Name: source-project
• Completion: 50%
• Terrain: ✓
• Layout: ✓
• Simulation: ✗
• Report: ✗

**Target Project (will be kept):**
• Name: target-project
• Completion: 50%
• Terrain: ✗
• Layout: ✗
• Simulation: ✓
• Report: ✓

**Merge strategy:**
• Keep most complete data from both projects
• Preserve all analysis results
• Delete source project after merge

**Which name would you like to keep?**
1. source-project
2. target-project
```

### Format Archive Suggestion

```typescript
LifecycleErrorFormatter.formatArchiveSuggestion([oldProject1, oldProject2])
```

**Output:**
```
💡 **Suggestion:** You have 2 project(s) older than 30 days with no recent activity.

**Consider archiving:**
1. old-project-1 (35 days old)
2. old-project-2 (42 days old)

**Archive projects to:**
• Keep your project list clean
• Preserve historical data
• Improve performance

**Example:** 'archive project old-project-1'
```

### Format Validation Error

```typescript
// Invalid coordinates
LifecycleErrorFormatter.formatValidationError(
  ProjectLifecycleError.INVALID_COORDINATES,
  { coordinates: '100, 200' }
)
```

**Output:**
```
❌ Invalid coordinates: 100, 200

**Requirements:**
• Latitude: -90 to 90
• Longitude: -180 to 180

**Example:** 'analyze terrain at 35.067482, -101.395466'
```

```typescript
// Invalid project name
LifecycleErrorFormatter.formatValidationError(
  ProjectLifecycleError.INVALID_PROJECT_NAME,
  { name: 'Invalid Name!' }
)
```

**Output:**
```
❌ Invalid project name: 'Invalid Name!'

**Requirements:**
• Lowercase letters only
• Use hyphens (-) instead of spaces
• No special characters

**Examples:**
• west-texas-wind-farm ✓
• West Texas Wind Farm ✗
• west_texas_wind_farm ✗
```

```typescript
// Invalid search radius
LifecycleErrorFormatter.formatValidationError(
  ProjectLifecycleError.INVALID_SEARCH_RADIUS,
  { radius: 150 }
)
```

**Output:**
```
❌ Invalid search radius: 150km

**Requirements:**
• Minimum: 0.1 km
• Maximum: 100 km

**Example:** 'search projects within 5km of 35.067482, -101.395466'
```

## Usage Examples

### In ProjectLifecycleManager

```typescript
// Example 1: Project not found with suggestions
async deleteProject(projectName: string) {
  const project = await this.projectStore.load(projectName);
  if (!project) {
    const availableProjects = (await this.projectStore.list())
      .map(p => p.project_name);
    
    return {
      success: false,
      message: LifecycleErrorFormatter.formatProjectNotFound(
        projectName,
        availableProjects
      )
    };
  }
  // ... continue with deletion
}

// Example 2: Search with formatted results
async searchProjects(filters: ProjectSearchFilters) {
  const projects = await this.performSearch(filters);
  
  return {
    success: true,
    message: LifecycleErrorFormatter.formatSearchResults(projects, filters)
  };
}

// Example 3: Delete confirmation
async deleteProject(projectName: string, confirmed: boolean) {
  const project = await this.projectStore.load(projectName);
  
  if (!confirmed) {
    return {
      success: false,
      message: LifecycleErrorFormatter.formatDeleteConfirmation(project),
      requiresConfirmation: true
    };
  }
  // ... proceed with deletion
}
```

### In Orchestrator

```typescript
// Example: Handle search intent
async handleSearchIntent(query: string, filters: ProjectSearchFilters) {
  try {
    const results = await lifecycleManager.searchProjects(filters);
    
    if (results.length === 0) {
      return {
        message: LifecycleErrorFormatter.formatNoSearchResults(filters)
      };
    }
    
    return {
      message: LifecycleErrorFormatter.formatSearchResults(results, filters)
    };
  } catch (error) {
    return {
      message: ERROR_MESSAGES.SEARCH_ERROR(error.message)
    };
  }
}
```

## Key Features

### 1. User-Friendly Language
- No technical error codes
- Clear, conversational language
- Explains what went wrong and why

### 2. Context-Specific
- Includes relevant project details
- Shows applied filters
- Displays completion status

### 3. Actionable Suggestions
- Provides next steps
- Suggests alternative actions
- Includes example commands

### 4. Visual Formatting
- Uses emojis for visual cues (❌, ✓, ✗, 💡, ⚠️, 🔀)
- Bullet points for lists
- Bold text for emphasis
- Clear section headers

### 5. Comprehensive Coverage
- All lifecycle operations
- Search and filtering (Requirements 5.1-5.5)
- Validation errors
- Confirmation prompts

## Testing

Run the unit tests to verify error message templates:

```bash
npm test tests/unit/test-lifecycle-error-messages.test.ts
```

All 30 tests should pass, covering:
- Error message constants
- Formatted error messages
- Search result formatting
- Confirmation prompts
- Validation errors
- Suggestions and next steps

## Requirements Coverage

This implementation satisfies Requirements 5.1-5.5:

- **5.1**: Location filtering with clear error messages
- **5.2**: Date range filtering with validation
- **5.3**: Incomplete project filtering with helpful messages
- **5.4**: Coordinate proximity filtering with radius validation
- **5.5**: Combined filters with comprehensive error handling

All error messages include:
- Clear description of the problem
- Context about what was attempted
- Suggestions for resolution
- Example commands to try next
