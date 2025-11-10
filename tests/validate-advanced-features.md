# Advanced Query Features Validation Guide

## Task 10: Implement Advanced Query Features

This guide helps you manually validate the three advanced query features implemented in Task 10.

---

## Task 10.1: Wildcard Support ✓

### Feature Description
- Supports `*` wildcard (matches any sequence of characters)
- Supports `?` wildcard (matches any single character)
- Automatically converts to SQL wildcards (% and _)

### How to Test

1. **Open the Query Builder** in the catalog chat interface
2. **Add a criterion** with these settings:
   - Field: `Operator`
   - Operator: `Contains` (LIKE)
   - Value: `Sh*ll`

3. **Check the Query Preview**:
   - Should show: `data.operator LIKE "Sh%ll"`
   - The `*` should be converted to `%`

4. **Test single character wildcard**:
   - Value: `?ell`
   - Should show: `data.operator LIKE "_ell"`
   - The `?` should be converted to `_`

5. **Test without wildcards**:
   - Value: `Shell`
   - Should show: `data.operator LIKE "%Shell%"`
   - Automatically adds `%` on both sides

### Expected Behavior
- ✓ Wildcards are converted correctly (* → %, ? → _)
- ✓ Help text shows: "Use * for any characters, ? for single character"
- ✓ Query preview displays the converted wildcards
- ✓ No validation errors for wildcard characters

---

## Task 10.2: Range Inputs ✓

### Feature Description
- Dedicated range input component for BETWEEN operator
- Separate min/max fields for numeric ranges
- Date picker for date ranges

### How to Test - Numeric Range

1. **Add a criterion** with these settings:
   - Field: `Depth (m)`
   - Operator: `Between`

2. **Check the UI**:
   - Should show TWO separate input fields
   - One labeled "Minimum" (Lower bound)
   - One labeled "Maximum" (Upper bound)

3. **Enter values**:
   - Minimum: `1000`
   - Maximum: `5000`

4. **Check the Query Preview**:
   - Should show: `data.depth BETWEEN 1000 AND 5000`

### How to Test - Date Range

1. **Change data type** to `Seismic`
2. **Add a criterion** with these settings:
   - Field: `Acquisition Date`
   - Operator: `Between Dates`

3. **Check the UI**:
   - Should show TWO date pickers
   - One labeled "Start Date"
   - One labeled "End Date"

4. **Select dates**:
   - Start Date: `2020-01-01`
   - End Date: `2023-12-31`

5. **Check the Query Preview**:
   - Should show: `data.acquisitionDate BETWEEN "2020-01-01" AND "2023-12-31"`

### Expected Behavior
- ✓ Range inputs appear for BETWEEN operator
- ✓ Numeric fields show number inputs
- ✓ Date fields show date pickers
- ✓ Values are properly formatted in query
- ✓ Validation ensures min < max

---

## Task 10.3: Multi-Value Selection ✓

### Feature Description
- Multi-select dropdown for IN operator
- Support for NOT IN operator (exclusion)
- Support for NOT LIKE operator (exclusion)
- Allows selecting multiple values from autocomplete list

### How to Test - IN Operator

1. **Add a criterion** with these settings:
   - Field: `Operator`
   - Operator: `In List`

2. **Check the UI**:
   - Should show a multi-select dropdown
   - Can select multiple values
   - Shows selected values as tokens

3. **Select multiple values**:
   - Select: `Shell`
   - Select: `BP`
   - Select: `Equinor`

4. **Check the Query Preview**:
   - Should show: `data.operator IN ("Shell", "BP", "Equinor")`

### How to Test - NOT IN Operator

1. **Add a criterion** with these settings:
   - Field: `Status`
   - Operator: `Not In List`

2. **Select values**:
   - Select: `Abandoned`
   - Select: `Plugged`

3. **Check the Query Preview**:
   - Should show: `data.status NOT IN ("Abandoned", "Plugged")`

### How to Test - NOT LIKE Operator

1. **Add a criterion** with these settings:
   - Field: `Well Name`
   - Operator: `Does Not Contain`
   - Value: `Test*`

2. **Check the Query Preview**:
   - Should show: `data.wellName NOT LIKE "Test%"`

### Expected Behavior
- ✓ Multi-select dropdown appears for IN/NOT IN operators
- ✓ Can select multiple values
- ✓ Selected values shown as tokens
- ✓ NOT IN operator available in dropdown
- ✓ NOT LIKE operator available in dropdown
- ✓ Query preview shows correct syntax

---

## Complex Query Test

### Test All Features Together

Create a query that uses all three advanced features:

1. **Criterion 1** (Multi-value):
   - Field: `Operator`
   - Operator: `In List`
   - Values: `Shell, BP`

2. **Criterion 2** (Range):
   - Logic: `AND`
   - Field: `Depth (m)`
   - Operator: `Between`
   - Min: `2000`, Max: `4000`

3. **Criterion 3** (Wildcard):
   - Logic: `OR`
   - Field: `Well Name`
   - Operator: `Contains`
   - Value: `*-A` (ends with -A)

4. **Criterion 4** (Exclusion):
   - Logic: `AND`
   - Field: `Status`
   - Operator: `Not In List`
   - Values: `Abandoned`

### Expected Query Preview

```
data.operator IN ("Shell", "BP")
AND data.depth BETWEEN 2000 AND 4000
OR data.wellName LIKE "%-A"
AND data.status NOT IN ("Abandoned")
```

### Expected Behavior
- ✓ All operators work together
- ✓ Query is properly formatted
- ✓ Validation passes
- ✓ Execute button is enabled
- ✓ Query can be copied and executed

---

## Validation Checklist

### Task 10.1: Wildcard Support
- [ ] `*` wildcard converts to `%`
- [ ] `?` wildcard converts to `_`
- [ ] Help text mentions wildcards
- [ ] No validation errors for wildcards
- [ ] Query preview shows converted wildcards

### Task 10.2: Range Inputs
- [ ] BETWEEN operator shows range inputs
- [ ] Numeric ranges show two number inputs
- [ ] Date ranges show two date pickers
- [ ] Values formatted correctly in query
- [ ] Validation ensures min < max

### Task 10.3: Multi-Value Selection
- [ ] IN operator shows multi-select
- [ ] NOT IN operator available
- [ ] NOT LIKE operator available
- [ ] Can select multiple values
- [ ] Query preview shows correct syntax

### Integration
- [ ] All features work together
- [ ] Complex queries validate correctly
- [ ] Query can be executed
- [ ] Query can be saved as template
- [ ] Query appears in history

---

## Success Criteria

All three sub-tasks are complete when:

1. **Wildcard support** allows `*` and `?` characters in LIKE operators
2. **Range inputs** provide dedicated UI for BETWEEN operator
3. **Multi-value selection** supports IN, NOT IN, and NOT LIKE operators
4. All features integrate seamlessly with existing query builder
5. Query validation works correctly for all new operators
6. Query generation produces syntactically correct OSDU queries

---

## Requirements Met

- ✓ Requirement 12.1: Wildcard searches using * and ? characters
- ✓ Requirement 12.2: Range inputs for numeric fields
- ✓ Requirement 12.3: Date range pickers for date fields
- ✓ Requirement 12.4: IN operator with multi-select dropdown
- ✓ Requirement 12.5: NOT operator for exclusion criteria

---

## Notes

- All three features are implemented and ready for testing
- TypeScript compilation passes with no errors
- Components are properly integrated into the query builder
- Query generator handles all new operators correctly
- Validation logic updated to support new operators
