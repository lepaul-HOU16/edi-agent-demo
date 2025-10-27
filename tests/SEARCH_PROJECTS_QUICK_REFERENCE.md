# Project Search Quick Reference

**Task 21: Deploy and test search functionality**  
**Requirements: 5.1, 5.2, 5.3, 5.4, 5.5**

## Quick Test Commands

### Unit Tests
```bash
npm test -- tests/unit/test-search-projects.test.ts --run
```

### Integration Tests
```bash
npm test -- tests/integration/test-search-projects-integration.test.ts --run
```

### Verification Script
```bash
npx ts-node tests/verify-search-projects.ts
```

### Full Deployment and Testing
```bash
./tests/deploy-and-test-search.sh
```

---

## Search Filter Examples

### Location Filtering (Requirement 5.1)
```typescript
// Search for Texas projects
const filters: ProjectSearchFilters = {
  location: 'texas'
};
const results = await lifecycleManager.searchProjects(filters);
```

**Natural Language:**
- "list projects in texas"
- "show california wind farms"
- "find projects in oklahoma"

---

### Date Range Filtering (Requirement 5.2)
```typescript
// Projects from last 30 days
const filters: ProjectSearchFilters = {
  dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
};
const results = await lifecycleManager.searchProjects(filters);

// Projects in specific date range
const filters: ProjectSearchFilters = {
  dateFrom: '2024-01-01T00:00:00Z',
  dateTo: '2024-12-31T23:59:59Z'
};
const results = await lifecycleManager.searchProjects(filters);
```

**Natural Language:**
- "list projects created today"
- "show projects from last week"
- "find projects created this month"

---

### Incomplete Project Filtering (Requirement 5.3)
```typescript
// Find incomplete projects
const filters: ProjectSearchFilters = {
  incomplete: true
};
const results = await lifecycleManager.searchProjects(filters);
```

**Natural Language:**
- "list incomplete projects"
- "show projects missing analysis"
- "find unfinished projects"

**Incomplete Criteria:**
A project is incomplete if it's missing ANY of:
- Terrain analysis
- Layout optimization
- Wake simulation
- Final report

---

### Coordinate Proximity Filtering (Requirement 5.4)
```typescript
// Projects within 5km (default)
const filters: ProjectSearchFilters = {
  coordinates: { latitude: 35.067482, longitude: -101.395466 },
  radiusKm: 5
};
const results = await lifecycleManager.searchProjects(filters);

// Projects within 50km
const filters: ProjectSearchFilters = {
  coordinates: { latitude: 35.067482, longitude: -101.395466 },
  radiusKm: 50
};
const results = await lifecycleManager.searchProjects(filters);
```

**Natural Language:**
- "list projects at coordinates 35.067482, -101.395466"
- "show projects within 50km of 35.0, -101.0"
- "find nearby projects"

---

### Archived Status Filtering (Requirement 5.5)
```typescript
// Archived projects only
const filters: ProjectSearchFilters = {
  archived: true
};
const results = await lifecycleManager.searchProjects(filters);

// Active (non-archived) projects only
const filters: ProjectSearchFilters = {
  archived: false
};
const results = await lifecycleManager.searchProjects(filters);
```

**Natural Language:**
- "list archived projects"
- "show active projects"
- "find non-archived projects"

---

### Combined Filters
```typescript
// Complex search: incomplete Texas projects from last 30 days
const filters: ProjectSearchFilters = {
  location: 'texas',
  dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  incomplete: true,
  archived: false
};
const results = await lifecycleManager.searchProjects(filters);

// All filters combined
const filters: ProjectSearchFilters = {
  location: 'wind',
  dateFrom: '2024-01-01T00:00:00Z',
  dateTo: '2024-12-31T23:59:59Z',
  incomplete: true,
  coordinates: { latitude: 35.0, longitude: -101.0 },
  radiusKm: 100,
  archived: false
};
const results = await lifecycleManager.searchProjects(filters);
```

**Natural Language:**
- "list incomplete projects in texas created this week"
- "show non-archived wind farms within 50km of 35.0, -101.0"
- "find incomplete texas projects from last month"

---

## Implementation Details

### Search Method Signature
```typescript
async searchProjects(filters: ProjectSearchFilters): Promise<ProjectData[]>
```

### Filter Interface
```typescript
interface ProjectSearchFilters {
  location?: string;           // Partial match on project name
  dateFrom?: string;           // ISO date string
  dateTo?: string;             // ISO date string
  incomplete?: boolean;        // Missing any analysis step
  coordinates?: Coordinates;   // Geographic coordinates
  radiusKm?: number;          // Search radius in kilometers
  archived?: boolean;          // Archived status
}
```

### Filter Logic
1. **Location**: Case-insensitive partial match on project_name
2. **Date Range**: Filters by created_at timestamp
3. **Incomplete**: Checks for missing terrain/layout/simulation/report
4. **Coordinates**: Uses Haversine formula for distance calculation
5. **Archived**: Checks metadata.archived flag (defaults to false)

---

## Testing Checklist

### Unit Tests
- [ ] Location filtering works
- [ ] Date range filtering works
- [ ] Incomplete filtering works
- [ ] Coordinate proximity filtering works
- [ ] Archived status filtering works
- [ ] Combined filters work
- [ ] Edge cases handled

### Integration Tests
- [ ] Real ProjectStore integration works
- [ ] Search performance is acceptable
- [ ] Error handling works
- [ ] Data consistency maintained

### E2E Tests
- [ ] Natural language queries work
- [ ] Search results display correctly
- [ ] Filter combinations work
- [ ] User experience is good

---

## Common Issues and Solutions

### Issue: No results found
**Solution:** Check if:
- Projects exist in the system
- Filters are too restrictive
- Spelling is correct
- Date format is valid

### Issue: Too many results
**Solution:** Add more filters:
- Narrow date range
- Add location filter
- Filter by completion status
- Use coordinate proximity

### Issue: Slow performance
**Solution:**
- Check project count (>1000 may be slow)
- Simplify filter combinations
- Use coordinate proximity to reduce search space

### Issue: Invalid coordinates
**Solution:**
- Latitude: -90 to 90
- Longitude: -180 to 180
- Use decimal degrees format

---

## Performance Benchmarks

### Expected Performance
- **< 100 projects**: < 100ms
- **100-1000 projects**: < 500ms
- **1000+ projects**: < 2s

### Optimization Tips
- Use coordinate proximity to reduce search space
- Cache frequently used searches
- Index projects by location
- Paginate large result sets

---

## Error Messages

### No Projects Found
```
No projects found matching: [criteria]

Suggestions:
• Try broader search criteria
• Remove some filters
• Use 'list projects' to see all projects
• Check if projects are archived: 'list archived projects'
```

### Invalid Date Range
```
Invalid date range: [dateFrom] to [dateTo]. Start date must be before end date.
```

### Invalid Search Radius
```
Invalid search radius: [radius]km. Radius must be between 0.1 and 100 km.
```

### No Location Match
```
No projects found in location: [location]
```

### No Incomplete Projects
```
No incomplete projects found. All projects have completed analysis.
```

### No Archived Projects
```
No archived projects found.
```

---

## Next Steps

After completing Task 21:
1. Mark task as complete in tasks.md
2. Update TASK_21_COMPLETE_SUMMARY.md
3. Proceed to Task 22: Deploy and test merge operations

---

## Related Documentation

- **Requirements**: `.kiro/specs/renewable-project-lifecycle-management/requirements.md`
- **Design**: `.kiro/specs/renewable-project-lifecycle-management/design.md`
- **Tasks**: `.kiro/specs/renewable-project-lifecycle-management/tasks.md`
- **Unit Tests**: `tests/unit/test-search-projects.test.ts`
- **Integration Tests**: `tests/integration/test-search-projects-integration.test.ts`
- **Verification**: `tests/verify-search-projects.ts`
- **E2E Guide**: `tests/e2e-search-manual-test.md`

