# Manual Testing Guide: Archive Functionality

## Task 23: Deploy and Test Archive Functionality

This guide provides step-by-step instructions for manually testing the archive/unarchive functionality.

**Requirements Tested:** 8.1, 8.2, 8.3, 8.4, 8.5, 8.6

---

## Prerequisites

- Sandbox is running (`npx ampx sandbox`)
- Chat interface is accessible
- At least one renewable energy project exists

---

## Test Scenario 1: Archive a Project (Requirement 8.1)

### Steps:

1. **List current projects:**
   ```
   list projects
   ```
   
   **Expected:** See list of active projects

2. **Archive a project:**
   ```
   archive project [project-name]
   ```
   
   **Expected:** 
   - Success message: "Project '[project-name]' has been archived."
   - No errors

3. **Verify project archived:**
   ```
   list projects
   ```
   
   **Expected:** Archived project should NOT appear in the list

---

## Test Scenario 2: Archived Projects Hidden from Default List (Requirement 8.2)

### Steps:

1. **Create a new project:**
   ```
   analyze terrain at 35.067482, -101.395466
   ```
   
   **Expected:** New project created

2. **List projects (should show new project):**
   ```
   list projects
   ```
   
   **Expected:** New project appears in list

3. **Archive the new project:**
   ```
   archive project [new-project-name]
   ```
   
   **Expected:** Success message

4. **List projects again:**
   ```
   list projects
   ```
   
   **Expected:** Archived project does NOT appear in list

---

## Test Scenario 3: List Archived Projects Explicitly (Requirement 8.3)

### Steps:

1. **List archived projects:**
   ```
   list archived projects
   ```
   
   **Expected:** 
   - Shows only archived projects
   - Previously archived projects appear in the list
   - Each project marked as archived

2. **Verify archived project details:**
   ```
   show project [archived-project-name]
   ```
   
   **Expected:** 
   - Project details displayed
   - Shows archived status
   - Shows archived_at timestamp

---

## Test Scenario 4: Unarchive a Project (Requirement 8.4)

### Steps:

1. **List archived projects:**
   ```
   list archived projects
   ```
   
   **Expected:** See list of archived projects

2. **Unarchive a project:**
   ```
   unarchive project [archived-project-name]
   ```
   
   **Expected:** 
   - Success message: "Project '[project-name]' has been unarchived."
   - No errors

3. **Verify project restored:**
   ```
   list projects
   ```
   
   **Expected:** Unarchived project now appears in active list

4. **Verify not in archived list:**
   ```
   list archived projects
   ```
   
   **Expected:** Unarchived project does NOT appear in archived list

---

## Test Scenario 5: Active Project Cleared When Archiving (Requirement 8.5)

### Steps:

1. **Set a project as active:**
   ```
   continue with project [project-name]
   ```
   
   **Expected:** Project set as active

2. **Verify active project:**
   ```
   show active project
   ```
   
   **Expected:** Shows the active project name

3. **Archive the active project:**
   ```
   archive project [active-project-name]
   ```
   
   **Expected:** Success message

4. **Check active project:**
   ```
   show active project
   ```
   
   **Expected:** 
   - No active project set
   - OR message indicating no active project

5. **Try to continue analysis:**
   ```
   optimize layout
   ```
   
   **Expected:** 
   - Prompt to select a project
   - OR error indicating no active project

---

## Test Scenario 6: Archived Projects Accessible by Name (Requirement 8.6)

### Steps:

1. **Archive a project:**
   ```
   archive project [project-name]
   ```
   
   **Expected:** Success message

2. **Try to access archived project by name:**
   ```
   show project [archived-project-name]
   ```
   
   **Expected:** 
   - Project details displayed
   - Shows archived status
   - All project data accessible

3. **Try to continue with archived project:**
   ```
   continue with project [archived-project-name]
   ```
   
   **Expected:** 
   - Either: Prompt to unarchive first
   - OR: Project set as active (implementation dependent)

---

## Test Scenario 7: Search with Archived Filter

### Steps:

1. **Search for active projects only:**
   ```
   search projects archived:false
   ```
   
   **Expected:** Only active (non-archived) projects shown

2. **Search for archived projects only:**
   ```
   search projects archived:true
   ```
   
   **Expected:** Only archived projects shown

3. **Search all projects:**
   ```
   search projects
   ```
   
   **Expected:** Both active and archived projects shown

---

## Test Scenario 8: Complete Archive/Unarchive Workflow

### Steps:

1. **Create a test project:**
   ```
   analyze terrain at 35.5, -101.5
   ```
   
   **Expected:** New project created

2. **Set as active:**
   ```
   continue with project [new-project-name]
   ```
   
   **Expected:** Project set as active

3. **Archive the project:**
   ```
   archive project [new-project-name]
   ```
   
   **Expected:** 
   - Success message
   - Active project cleared

4. **Verify hidden from active list:**
   ```
   list projects
   ```
   
   **Expected:** Project not in list

5. **Verify in archived list:**
   ```
   list archived projects
   ```
   
   **Expected:** Project in archived list

6. **Unarchive the project:**
   ```
   unarchive project [new-project-name]
   ```
   
   **Expected:** Success message

7. **Verify restored to active list:**
   ```
   list projects
   ```
   
   **Expected:** Project back in active list

8. **Verify removed from archived list:**
   ```
   list archived projects
   ```
   
   **Expected:** Project not in archived list

---

## Edge Cases to Test

### Edge Case 1: Archive Non-Existent Project

```
archive project nonexistent-project
```

**Expected:** Error message: "Project 'nonexistent-project' not found."

### Edge Case 2: Unarchive Non-Existent Project

```
unarchive project nonexistent-project
```

**Expected:** Error message: "Project 'nonexistent-project' not found."

### Edge Case 3: Archive Already Archived Project

1. Archive a project
2. Try to archive it again

**Expected:** Success (idempotent operation)

### Edge Case 4: Unarchive Already Active Project

1. Ensure project is active (not archived)
2. Try to unarchive it

**Expected:** Success (idempotent operation)

### Edge Case 5: Archive Project Not Set as Active

1. Set project A as active
2. Archive project B (different project)

**Expected:** 
- Project B archived successfully
- Project A still active

---

## Verification Checklist

After completing all tests, verify:

- [ ] Can archive a project successfully
- [ ] Archived projects hidden from default `list projects`
- [ ] Can list archived projects explicitly
- [ ] Can unarchive a project successfully
- [ ] Active project cleared when archiving that project
- [ ] Active project NOT cleared when archiving different project
- [ ] Archived projects accessible by explicit name
- [ ] Search filters work correctly (archived:true/false)
- [ ] Complete workflow works end-to-end
- [ ] Error handling works for non-existent projects
- [ ] Idempotent operations work correctly

---

## Success Criteria

All requirements verified:

✅ **Requirement 8.1:** Archive project functionality works
✅ **Requirement 8.2:** Archived projects hidden from default listings
✅ **Requirement 8.3:** Can list archived projects explicitly
✅ **Requirement 8.4:** Unarchive project functionality works
✅ **Requirement 8.5:** Active project cleared when archiving
✅ **Requirement 8.6:** Archived projects accessible by explicit name

---

## Troubleshooting

### Issue: "Project not found" when archiving

**Solution:** 
- Verify project name is correct
- Use `list projects` to see available projects
- Check for typos in project name

### Issue: Archived project still appears in active list

**Solution:**
- Clear browser cache
- Refresh the page
- Check if archive operation succeeded
- Verify archived flag in project data

### Issue: Cannot unarchive project

**Solution:**
- Verify project is actually archived
- Use `list archived projects` to confirm
- Check project name spelling
- Verify S3 permissions

### Issue: Active project not cleared when archiving

**Solution:**
- Verify you're archiving the active project
- Check session context
- Refresh the page
- Try setting a different project as active first

---

## Notes

- Archive functionality is designed to keep project data while hiding it from default views
- Archived projects can always be accessed by explicit name
- Archiving is reversible - projects can be unarchived at any time
- Archive status is stored in project metadata
- Active project is automatically cleared when that specific project is archived

---

## Report Issues

If you encounter any issues during testing:

1. Note the exact steps to reproduce
2. Capture any error messages
3. Check browser console for errors
4. Check CloudWatch logs for backend errors
5. Document expected vs actual behavior

Report issues with:
- Test scenario number
- Steps performed
- Expected result
- Actual result
- Error messages (if any)
