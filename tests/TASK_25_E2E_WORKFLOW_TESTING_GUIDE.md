# Task 25: End-to-End User Workflow Testing Guide

## Overview

This guide provides step-by-step instructions for manually testing the complete user workflows for the renewable project lifecycle management system.

## Prerequisites

- Sandbox environment deployed and running
- Access to chat interface
- Test coordinates: `35.067482, -101.395466` (Amarillo, TX area)

## Workflow 1: Create Duplicate → Detect → Delete Old → Rename New

### Objective
Test the complete workflow of creating a duplicate project, detecting it, deleting the old one, and renaming the new one.

### Steps

#### 1. Create First Project
```
User: Analyze terrain at coordinates 35.067482, -101.395466 in Amarillo
```

**Expected Result:**
- System creates project (e.g., `amarillo-tx-wind-farm`)
- Terrain analysis completes
- Project is saved

**Verification:**
- Check that project appears in project list
- Note the project name for next steps

#### 2. Attempt to Create Duplicate
```
User: Analyze terrain at coordinates 35.067482, -101.395466
```

**Expected Result:**
- System detects existing project within 1km
- System prompts: "Found existing project 'amarillo-tx-wind-farm' at these coordinates. Would you like to: (1) Continue with existing project, (2) Create new project, (3) View existing project details?"

**Verification:**
- Duplicate detection message appears
- Three options are presented
- Distance is shown (should be ~0 km)

#### 3. Choose to Create New Project
```
User: Create new project
```

**Expected Result:**
- System creates new project with numbered suffix (e.g., `amarillo-tx-wind-farm-2`)
- New terrain analysis runs
- Both projects now exist

**Verification:**
- List projects to see both projects
- Both should have same/similar coordinates

#### 4. Delete Old Project
```
User: Delete project amarillo-tx-wind-farm
```

**Expected Result:**
- System asks for confirmation: "Are you sure you want to delete 'amarillo-tx-wind-farm'? This will remove all analysis data. Type 'yes' to confirm."

**Verification:**
- Confirmation prompt appears
- Project is NOT deleted yet

#### 5. Confirm Deletion
```
User: yes
```

**Expected Result:**
- System deletes project
- Confirmation message: "Project 'amarillo-tx-wind-farm' has been deleted."

**Verification:**
- List projects - old project should be gone
- Only new project remains

#### 6. Rename New Project
```
User: Rename project amarillo-tx-wind-farm-2 to amarillo-pilot-project
```

**Expected Result:**
- System renames project
- Message: "Project renamed from 'amarillo-tx-wind-farm-2' to 'amarillo-pilot-project'"

**Verification:**
- List projects - should show new name
- Old name should not exist
- All project data preserved

### Success Criteria
- ✅ Duplicate detection works
- ✅ User can choose to create new project
- ✅ Deletion requires confirmation
- ✅ Deletion removes project
- ✅ Rename updates project name
- ✅ All data preserved through rename

---

## Workflow 2: Search → Find Duplicates → Merge

### Objective
Test searching for projects, finding duplicates, and merging them.

### Steps

#### 1. Create Multiple Projects
Create 3 projects at similar locations:

```
User: Analyze terrain at 35.067482, -101.395466 in Amarillo
```
Wait for completion, then:
```
User: Create new project at 35.067500, -101.395500 in Amarillo
```
Wait for completion, then:
```
User: Analyze terrain at 33.577863, -101.855166 in Lubbock
```

**Expected Result:**
- Three projects created
- Two in Amarillo area (close together)
- One in Lubbock (far away)

#### 2. Search for Projects in Amarillo
```
User: List projects in Amarillo
```

**Expected Result:**
- Shows 2 projects with "amarillo" in name
- Does not show Lubbock project

**Verification:**
- Only Amarillo projects listed
- Project details shown (name, location, status)

#### 3. Find Duplicate Projects
```
User: Show duplicate projects
```

**Expected Result:**
- System lists projects within 1km of each other
- Amarillo projects grouped together
- Shows distance between duplicates

**Verification:**
- Duplicate group shown
- Both Amarillo projects in same group
- Distance shown (should be ~50m)

#### 4. Merge Duplicate Projects
```
User: Merge projects amarillo-tx-wind-farm-1 and amarillo-tx-wind-farm-2
```

**Expected Result:**
- System asks: "Keep name 'amarillo-tx-wind-farm-1' or 'amarillo-tx-wind-farm-2'?"

**Verification:**
- Name choice prompt appears
- Both names shown as options

#### 5. Choose Name to Keep
```
User: Keep amarillo-tx-wind-farm-1
```

**Expected Result:**
- Projects merged
- Message: "Projects merged into 'amarillo-tx-wind-farm-1'. Deleted 'amarillo-tx-wind-farm-2'."
- Merged project has data from both

**Verification:**
- List projects - only one Amarillo project remains
- Merged project has complete data
- Second project deleted

### Success Criteria
- ✅ Search filters by location
- ✅ Duplicate finder groups nearby projects
- ✅ Merge combines project data
- ✅ Merge deletes duplicate
- ✅ User chooses which name to keep

---

## Workflow 3: Natural Language Command Variations

### Objective
Test that the system understands different ways of expressing the same intent.

### Deletion Command Variations

Test each of these commands (create a test project first):

```
User: Delete project test-project
User: Remove project test-project
User: Get rid of test-project
User: Trash test-project
```

**Expected Result:**
- All variations recognized as deletion intent
- All trigger confirmation prompt

### Rename Command Variations

```
User: Rename project old-name to new-name
User: Change name of old-name to new-name
User: Call old-name new-name instead
```

**Expected Result:**
- All variations recognized as rename intent
- All perform rename operation

### List Command Variations

```
User: List projects
User: Show projects
User: Display projects
User: What are my projects
User: Show me all projects
```

**Expected Result:**
- All variations show project list
- Same information displayed

### Archive Command Variations

```
User: Archive project test-project
User: Archive test-project
User: Move test-project to archive
```

**Expected Result:**
- All variations recognized as archive intent
- Project moved to archived status

### Success Criteria
- ✅ Multiple phrasings understood
- ✅ Intent correctly detected
- ✅ Same action performed
- ✅ Natural conversation flow

---

## Workflow 4: Confirmation Prompts

### Objective
Test that all destructive operations require confirmation.

### Test Cases

#### Single Project Deletion
```
User: Delete project test-project
```

**Expected:**
- Confirmation prompt appears
- Project NOT deleted yet
- Clear instructions on how to confirm

#### Bulk Deletion
```
User: Delete all projects matching test-
```

**Expected:**
- List of matching projects shown
- Count displayed
- Confirmation required
- Projects NOT deleted yet

#### Merge Operation
```
User: Merge projects project-1 and project-2
```

**Expected:**
- Name choice prompt appears
- Both names shown as options
- Merge NOT performed yet

### Success Criteria
- ✅ All destructive operations require confirmation
- ✅ Clear confirmation prompts
- ✅ Operations not performed without confirmation
- ✅ Easy to confirm or cancel

---

## Workflow 5: Error Scenarios

### Objective
Test that errors are handled gracefully with helpful messages.

### Test Cases

#### Project Not Found
```
User: Delete project nonexistent-project
```

**Expected Error:**
```
Project 'nonexistent-project' not found. Use 'list projects' to see available projects.
```

**Verification:**
- Clear error message
- Helpful suggestion provided
- System remains functional

#### Name Already Exists
```
User: Rename project old-name to existing-name
```

**Expected Error:**
```
Project name 'existing-name' already exists. Please choose a different name.
```

**Verification:**
- Explains why operation failed
- Suggests solution
- Original project unchanged

#### Project In Progress
Create a project and immediately try to delete it while processing:

```
User: Delete project in-progress-project
```

**Expected Error:**
```
Cannot delete 'in-progress-project' - project is currently being processed. Please wait for completion.
```

**Verification:**
- Explains why deletion blocked
- Suggests waiting
- Project protected from deletion

#### Invalid Coordinates
```
User: Analyze terrain at coordinates 999, -999
```

**Expected Error:**
```
Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180.
```

**Verification:**
- Clear validation error
- Explains valid ranges
- No project created

#### Invalid Merge Name
```
User: Merge projects project-1 and project-2, keep name project-3
```

**Expected Error:**
```
Keep name must be either 'project-1' or 'project-2'.
```

**Verification:**
- Explains constraint
- Shows valid options
- Merge not performed

### Success Criteria
- ✅ All errors caught and handled
- ✅ Clear, helpful error messages
- ✅ Suggestions for resolution
- ✅ System remains stable
- ✅ No data corruption

---

## Complete Test Checklist

### Workflow 1: Duplicate → Delete → Rename
- [ ] Create first project
- [ ] Duplicate detection triggers
- [ ] User can create new project
- [ ] Deletion requires confirmation
- [ ] Deletion removes project
- [ ] Rename updates name
- [ ] Data preserved

### Workflow 2: Search → Find → Merge
- [ ] Create multiple projects
- [ ] Search filters correctly
- [ ] Duplicate finder works
- [ ] Merge combines data
- [ ] Merge deletes duplicate
- [ ] Name choice works

### Workflow 3: Natural Language
- [ ] Delete variations work
- [ ] Rename variations work
- [ ] List variations work
- [ ] Archive variations work

### Workflow 4: Confirmations
- [ ] Single deletion confirmation
- [ ] Bulk deletion confirmation
- [ ] Merge name choice
- [ ] Operations blocked without confirmation

### Workflow 5: Error Handling
- [ ] Project not found
- [ ] Name already exists
- [ ] Project in progress
- [ ] Invalid coordinates
- [ ] Invalid merge name

---

## Reporting Issues

If any test fails, report with:

1. **Test Name**: Which workflow/test case
2. **Steps**: What you did
3. **Expected**: What should happen
4. **Actual**: What actually happened
5. **Screenshots**: If applicable
6. **Logs**: Any error messages

---

## Success Criteria Summary

All workflows must:
- ✅ Complete successfully end-to-end
- ✅ Handle user input correctly
- ✅ Provide clear feedback
- ✅ Require confirmation for destructive operations
- ✅ Handle errors gracefully
- ✅ Preserve data integrity
- ✅ Update session context correctly
- ✅ Clear caches appropriately

---

## Notes

- Test in a clean environment
- Use consistent test coordinates
- Clean up test projects after testing
- Test both success and failure paths
- Verify data persistence
- Check CloudWatch logs for errors
