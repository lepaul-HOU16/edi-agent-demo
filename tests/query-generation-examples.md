# OSDU Query Generation Examples

## Overview

This document provides visual examples of how the query generation engine transforms structured criteria into OSDU queries.

---

## Example 1: Simple Equality Query

### Input Criteria
```
Field: data.operator
Operator: =
Value: Shell
```

### Generated Query
```
data.operator = "Shell"
```

---

## Example 2: Numeric Comparison

### Input Criteria
```
Field: data.depth
Operator: >
Value: 3000
```

### Generated Query
```
data.depth > 3000
```

---

## Example 3: LIKE Operator (Contains)

### Input Criteria
```
Field: data.wellName
Operator: LIKE
Value: North
```

### Generated Query
```
data.wellName LIKE "%North%"
```

**Note:** Wildcards are automatically added for LIKE operator.

---

## Example 4: IN Operator (Multiple Values)

### Input Criteria
```
Field: data.operator
Operator: IN
Value: Shell, BP, Equinor
```

### Generated Query
```
data.operator IN ("Shell", "BP", "Equinor")
```

**Note:** Comma-separated values are automatically parsed and quoted.

---

## Example 5: BETWEEN Operator (Range)

### Input Criteria
```
Field: data.depth
Operator: BETWEEN
Value: 1000, 5000
```

### Generated Query
```
data.depth BETWEEN 1000 AND 5000
```

**Note:** Two comma-separated values are required for BETWEEN.

---

## Example 6: Multiple Criteria with AND

### Input Criteria
```
1. Field: data.operator, Operator: =, Value: Shell
2. Field: data.country, Operator: =, Value: Norway, Logic: AND
3. Field: data.depth, Operator: >, Value: 3000, Logic: AND
```

### Generated Query
```
data.operator = "Shell" AND data.country = "Norway" AND data.depth > 3000
```

**Note:** All criteria connected with AND operator.

---

## Example 7: Multiple Criteria with OR

### Input Criteria
```
1. Field: data.operator, Operator: =, Value: Shell
2. Field: data.operator, Operator: =, Value: BP, Logic: OR
3. Field: data.operator, Operator: =, Value: Equinor, Logic: OR
```

### Generated Query
```
data.operator = "Shell" OR data.operator = "BP" OR data.operator = "Equinor"
```

**Note:** All criteria connected with OR operator.

---

## Example 8: Mixed AND/OR with Grouping

### Input Criteria
```
1. Field: data.operator, Operator: =, Value: Shell
2. Field: data.operator, Operator: =, Value: BP, Logic: OR
3. Field: data.country, Operator: =, Value: Norway, Logic: AND
```

### Generated Query
```
(data.operator = "Shell" OR data.operator = "BP") AND data.country = "Norway"
```

**Note:** Parentheses automatically added to group OR criteria.

**Evaluation Order:**
1. First: `(data.operator = "Shell" OR data.operator = "BP")` - Either Shell OR BP
2. Then: `AND data.country = "Norway"` - AND must be in Norway

**Result:** Wells operated by Shell OR BP that are in Norway.

---

## Example 9: Complex Multi-Group Query

### Input Criteria
```
1. Field: data.operator, Operator: =, Value: Shell
2. Field: data.operator, Operator: =, Value: BP, Logic: OR
3. Field: data.depth, Operator: >, Value: 3000, Logic: AND
4. Field: data.depth, Operator: <, Value: 5000, Logic: AND
5. Field: data.status, Operator: =, Value: Active, Logic: AND
```

### Generated Query
```
(data.operator = "Shell" OR data.operator = "BP") AND data.depth > 3000 AND data.depth < 5000 AND data.status = "Active"
```

**Evaluation Order:**
1. First: `(data.operator = "Shell" OR data.operator = "BP")` - Either Shell OR BP
2. Then: `AND data.depth > 3000` - AND depth greater than 3000
3. Then: `AND data.depth < 5000` - AND depth less than 5000
4. Then: `AND data.status = "Active"` - AND status is Active

**Result:** Active wells operated by Shell OR BP with depth between 3000-5000 meters.

---

## Example 10: String Escaping

### Input Criteria
```
Field: data.wellName
Operator: =
Value: Well "A-1"
```

### Generated Query
```
data.wellName = "Well \"A-1\""
```

**Note:** Double quotes inside the value are automatically escaped.

---

## Example 11: Date Range Query

### Input Criteria
```
1. Field: data.acquisitionDate, Operator: >, Value: 2020-01-01
2. Field: data.acquisitionDate, Operator: <, Value: 2023-12-31, Logic: AND
```

### Generated Query
```
data.acquisitionDate > "2020-01-01" AND data.acquisitionDate < "2023-12-31"
```

**Note:** Dates are automatically formatted and quoted.

---

## Example 12: Complex Real-World Query

### Scenario
Find all active production wells operated by Shell or BP in Norway with depth between 2000-4000 meters.

### Input Criteria
```
1. Field: data.operator, Operator: =, Value: Shell
2. Field: data.operator, Operator: =, Value: BP, Logic: OR
3. Field: data.country, Operator: =, Value: Norway, Logic: AND
4. Field: data.wellType, Operator: =, Value: Production, Logic: AND
5. Field: data.status, Operator: =, Value: Active, Logic: AND
6. Field: data.depth, Operator: BETWEEN, Value: 2000, 4000, Logic: AND
```

### Generated Query
```
(data.operator = "Shell" OR data.operator = "BP") AND data.country = "Norway" AND data.wellType = "Production" AND data.status = "Active" AND data.depth BETWEEN 2000 AND 4000
```

**Breakdown:**
- `(data.operator = "Shell" OR data.operator = "BP")` - Operated by Shell OR BP
- `AND data.country = "Norway"` - Located in Norway
- `AND data.wellType = "Production"` - Production wells only
- `AND data.status = "Active"` - Currently active
- `AND data.depth BETWEEN 2000 AND 4000` - Depth between 2000-4000 meters

---

## Grouping Rules

### Rule 1: Same Logic Operator
When all criteria use the same logic operator (all AND or all OR), no parentheses are needed:
```
A AND B AND C
A OR B OR C
```

### Rule 2: Mixed Logic Operators
When mixing AND and OR, consecutive criteria with the same operator are grouped:
```
(A OR B) AND C
A AND (B OR C)
(A OR B) AND (C OR D)
```

### Rule 3: Evaluation Order
Standard boolean logic evaluation order:
1. Parentheses (highest priority)
2. AND operators
3. OR operators (lowest priority)

---

## Special Characters Handling

### Characters That Are Escaped
- `"` → `\"`
- `'` → `\'`
- `\` → `\\`
- `\n` → `\\n`
- `\r` → `\\r`
- `\t` → `\\t`

### Example
```
Input:  Company "A&B" with 'quotes'
Output: "Company \"A&B\" with 'quotes'"
```

---

## Validation Rules

### Valid Queries Must Have:
1. ✅ At least one criterion
2. ✅ All criteria have non-empty values
3. ✅ Numeric fields have valid numbers
4. ✅ Date fields have valid dates (YYYY-MM-DD)
5. ✅ BETWEEN operator has exactly two values
6. ✅ Matched quotes and parentheses

### Invalid Query Examples:
```
❌ Empty value: data.operator = ""
❌ Invalid number: data.depth > "abc"
❌ Invalid date: data.date > "not-a-date"
❌ BETWEEN with one value: data.depth BETWEEN 1000
❌ Unmatched quotes: data.operator = "Shell
```

---

## Performance Notes

- Query generation is **instant** (client-side)
- No API calls during query building
- Real-time validation as you type
- Optimized for queries up to 10 criteria
- Query execution time depends on OSDU API (~500ms-2s)

---

## Best Practices

### 1. Use Templates for Common Queries
Start with a template and modify as needed.

### 2. Test Simple Queries First
Build and test simple queries before adding complexity.

### 3. Use Autocomplete When Available
Select from suggested values to avoid typos.

### 4. Verify Query Preview
Always check the generated query before executing.

### 5. Start Broad, Then Narrow
Begin with fewer criteria, then add more to narrow results.

---

## Troubleshooting

### Query Returns No Results
- Check if criteria are too restrictive
- Verify field values exist in OSDU data
- Try removing criteria one at a time

### Query Syntax Error
- Check for special characters in values
- Verify BETWEEN has exactly two values
- Ensure IN has comma-separated values

### Unexpected Results
- Review parentheses grouping
- Verify AND/OR logic is correct
- Check operator selection (= vs LIKE)

---

## Summary

The query generation engine provides:
- ✅ Automatic string escaping
- ✅ Support for all common operators
- ✅ Intelligent AND/OR grouping
- ✅ Real-time validation
- ✅ Query optimization
- ✅ User-friendly error messages

**Result:** Build complex OSDU queries without writing any query syntax!
