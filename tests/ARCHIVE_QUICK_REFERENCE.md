# Archive Functionality - Quick Reference

## Commands

### Archive a Project
```
archive project [project-name]
```
**Effect:** Hides project from default list, clears if active

### Unarchive a Project
```
unarchive project [project-name]
```
**Effect:** Restores project to active list

### List Archived Projects
```
list archived projects
```
**Effect:** Shows only archived projects

### List Active Projects
```
list projects
```
**Effect:** Shows only active (non-archived) projects

### Search with Archive Filter
```
search projects archived:true   # Only archived
search projects archived:false  # Only active
search projects                 # All projects
```

---

## Use Cases

### Clean Up Old Projects
```
1. list projects
2. archive project old-project-name
3. Verify: list projects (should not show archived)
```

### Temporarily Hide Projects
```
1. archive project temporary-project
2. Work on other projects
3. unarchive project temporary-project (when needed)
```

### Find Archived Projects
```
1. list archived projects
2. show project [archived-project-name]
3. unarchive project [name] (if needed)
```

---

## Behavior

### When Archiving:
- ✅ Project hidden from default `list projects`
- ✅ Active project cleared if archiving the active one
- ✅ All project data preserved
- ✅ Can still access by explicit name
- ✅ Appears in `list archived projects`

### When Unarchiving:
- ✅ Project restored to active list
- ✅ Removed from archived list
- ✅ All data intact
- ✅ Can set as active again

---

## Requirements

- **8.1:** Archive project functionality
- **8.2:** Archived projects hidden from default list
- **8.3:** List archived projects explicitly
- **8.4:** Unarchive project functionality
- **8.5:** Active project cleared when archiving
- **8.6:** Archived projects accessible by name

---

## Testing

### Quick Test:
```bash
# Run unit tests
npm test -- tests/unit/test-archive-unarchive.test.ts

# Verify deployment
node tests/verify-archive-deployment.js

# Manual testing guide
cat tests/e2e-archive-manual-test.md
```

### Manual Test Flow:
1. Create a test project
2. Archive it → verify hidden from list
3. List archived → verify appears
4. Unarchive it → verify restored
5. Verify all data intact

---

## Error Messages

### Project Not Found
```
Project '[name]' not found. Use 'list projects' to see available projects.
```

### Already Archived
- Operation succeeds (idempotent)
- No error thrown

### Already Active
- Operation succeeds (idempotent)
- No error thrown

---

## Implementation

### Core Methods:
- `ProjectLifecycleManager.archiveProject()`
- `ProjectLifecycleManager.unarchiveProject()`
- `ProjectLifecycleManager.listActiveProjects()`
- `ProjectLifecycleManager.listArchivedProjects()`

### Data Model:
```typescript
metadata: {
  archived?: boolean;      // Archive flag
  archived_at?: string;    // Archive timestamp
}
```

---

## Tips

1. **Archive old projects** to keep your list clean
2. **Use search filters** to find specific projects
3. **Archive is reversible** - you can always unarchive
4. **Data is preserved** - nothing is deleted
5. **Active project auto-clears** when archiving it

---

## See Also

- Full manual test guide: `tests/e2e-archive-manual-test.md`
- Complete summary: `tests/TASK_23_COMPLETE_SUMMARY.md`
- Unit tests: `tests/unit/test-archive-unarchive.test.ts`
