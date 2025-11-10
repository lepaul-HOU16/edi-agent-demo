# OSDU Query Syntax Reference

## Overview

This document provides a complete reference for OSDU query syntax as used by the Visual Query Builder. Understanding this syntax helps you:
- Interpret generated queries
- Troubleshoot query issues
- Learn advanced query patterns
- Build queries manually if needed

---

## Basic Syntax

### Query Structure

```
field operator value [logic field operator value ...]
```

**Components**:
- **field**: OSDU data field path (e.g., `data.operator`)
- **operator**: Comparison operator (e.g., `=`, `>`, `LIKE`)
- **value**: The value to compare against
- **logic**: Logical operator connecting criteria (`AND`, `OR`)

### Simple Query Example

```
data.operator = "Shell"
```

This query finds all records where the operator field equals "Shell".

---

## Field Paths

### Well Fields

| Field Path | Description | Type | Example Values |
|------------|-------------|------|----------------|
| `data.operator` | Operating company | string | Shell, BP, Equinor |
| `data.country` | Country location | string | Norway, United States |
| `data.basin` | Geological basin | string | North Sea, Gulf of Mexico |
| `data.wellName` | Well identifier | string | WELL-001, North-15H |
| `data.depth` | Total depth (m) | number | 3000, 5000 |
| `data.status` | Well status | string | Active, Inactive, Abandoned |
| `data.wellType` | Well classification | string | Production, Exploration |
| `data.createdDate` | Creation date | date | 2023-01-15 |

### Wellbore Fields

| Field Path | Description | Type | Example Values |
|------------|-------------|------|----------------|
| `data.wellboreName` | Wellbore identifier | string | WB-001, Main-A |
| `data.wellboreType` | Wellbore configuration | string | Vertical, Horizontal |
| `data.md` | Measured depth (m) | number | 2500, 4000 |
| `data.tvd` | True vertical depth (m) | number | 2000, 3500 |

### Log Fields

| Field Path | Description | Type | Example Values |
|------------|-------------|------|----------------|
| `data.logType` | Log measurement type | string | GR, RHOB, NPHI |
| `data.logName` | Log identifier | string | GR-001, Resistivity-A |
| `data.curveCount` | Number of curves | number | 5, 10, 15 |
| `data.topDepth` | Top depth (m) | number | 1000, 500 |
| `data.bottomDepth` | Bottom depth (m) | number | 3000, 5000 |

### Seismic Fields

| Field Path | Description | Type | Example Values |
|------------|-------------|------|----------------|
| `data.surveyName` | Survey identifier | string | Survey-2023, North-3D |
| `data.surveyType` | Survey type | string | 2D, 3D, 4D, VSP |
| `data.acquisitionDate` | Acquisition date | date | 2023-01-15 |

---

## Comparison Operators

### String Operators

#### Equals (=)
Exact match (case-sensitive).

```
data.operator = "Shell"
```

**Use When**: You know the exact value.

#### Not Equals (!=)
Excludes exact match.

```
data.status != "Abandoned"
```

**Use When**: You want to exclude specific values.

#### LIKE
Pattern matching with wildcards.

**Wildcards**:
- `*` = any sequence of characters
- `?` = any single character

```
data.wellName LIKE "North*"      # Starts with "North"
data.wellName LIKE "*Test*"      # Contains "Test"
data.wellName LIKE "?ell"        # Second letter is 'e', ends with 'll'
```

**Use When**: You need partial matches or pattern matching.

#### NOT LIKE
Excludes pattern matches.

```
data.wellName NOT LIKE "*Test*"  # Excludes wells with "Test" in name
```

**Use When**: You want to exclude patterns.

#### IN
Matches any value in a list.

```
data.operator IN ("Shell", "BP", "Equinor")
```

**Use When**: You have multiple acceptable values.

#### NOT IN
Excludes all values in a list.

```
data.status NOT IN ("Abandoned", "Inactive")
```

**Use When**: You want to exclude multiple values.

### Numeric Operators

#### Equals (=)
Exact numeric match.

```
data.depth = 3000
```

#### Not Equals (!=)
Excludes exact numeric value.

```
data.depth != 0
```

#### Greater Than (>)
Value must be larger.

```
data.depth > 3000
```

#### Less Than (<)
Value must be smaller.

```
data.depth < 5000
```

#### Greater or Equal (>=)
Value must be larger or equal.

```
data.depth >= 3000
```

#### Less or Equal (<=)
Value must be smaller or equal.

```
data.depth <= 5000
```

#### BETWEEN
Value must be within range (inclusive).

```
data.depth BETWEEN 2000 AND 5000
```

**Equivalent to**: `data.depth >= 2000 AND data.depth <= 5000`

### Date Operators

Date operators work the same as numeric operators but require **YYYY-MM-DD** format.

#### Equals (=)
Exact date match.

```
data.acquisitionDate = "2023-01-15"
```

#### After (>)
Date must be later.

```
data.acquisitionDate > "2022-01-01"
```

#### Before (<)
Date must be earlier.

```
data.acquisitionDate < "2024-01-01"
```

#### On or After (>=)
Date must be on or later.

```
data.acquisitionDate >= "2023-01-01"
```

#### On or Before (<=)
Date must be on or earlier.

```
data.acquisitionDate <= "2023-12-31"
```

#### BETWEEN
Date must be within range (inclusive).

```
data.acquisitionDate BETWEEN "2022-01-01" AND "2023-12-31"
```

---

## Logical Operators

### AND
Both conditions must be true.

```
data.country = "Norway" AND data.depth > 3000
```

**Result**: Only Norwegian wells deeper than 3000m.

**Truth Table**:
| Condition 1 | Condition 2 | Result |
|-------------|-------------|--------|
| True | True | True |
| True | False | False |
| False | True | False |
| False | False | False |

### OR
At least one condition must be true.

```
data.operator = "Shell" OR data.operator = "BP"
```

**Result**: Wells operated by Shell OR BP (or both).

**Truth Table**:
| Condition 1 | Condition 2 | Result |
|-------------|-------------|--------|
| True | True | True |
| True | False | True |
| False | True | True |
| False | False | False |

### Combining AND and OR

When mixing AND and OR, use parentheses for clarity:

```
(data.operator = "Shell" OR data.operator = "BP") AND data.country = "Norway"
```

**Result**: Wells operated by Shell OR BP, but ONLY in Norway.

**Without Parentheses** (incorrect):
```
data.operator = "Shell" OR data.operator = "BP" AND data.country = "Norway"
```

This would be interpreted as:
```
data.operator = "Shell" OR (data.operator = "BP" AND data.country = "Norway")
```

**Result**: ALL Shell wells (any country) OR BP wells in Norway.

---

## Value Formatting

### String Values

Always enclose in double quotes:

```
data.operator = "Shell"
data.wellName = "North-15H"
```

**Special Characters**: Escape with backslash:
```
data.wellName = "Well \"A\""  # Contains quotes
data.operator = "Shell\\BP"   # Contains backslash
```

### Numeric Values

No quotes, just the number:

```
data.depth = 3000
data.md = 2500.5
```

**Invalid**:
```
data.depth = "3000"     # Wrong: quoted number
data.depth = 3000m      # Wrong: includes unit
```

### Date Values

Use **YYYY-MM-DD** format in quotes:

```
data.acquisitionDate = "2023-01-15"
```

**Invalid**:
```
data.acquisitionDate = "01/15/2023"  # Wrong: US format
data.acquisitionDate = "15-01-2023"  # Wrong: day-first format
data.acquisitionDate = "2023-1-15"   # Wrong: missing leading zeros
```

### List Values (IN operator)

Comma-separated values in parentheses:

```
data.operator IN ("Shell", "BP", "Equinor")
```

**Spacing**: Spaces after commas are optional but recommended for readability.

### Range Values (BETWEEN operator)

Two values with AND:

```
data.depth BETWEEN 2000 AND 5000
```

**Order**: First value must be less than second value.

---

## Query Examples

### Simple Queries

#### Find Wells by Operator
```
data.operator = "Shell"
```

#### Find Deep Wells
```
data.depth > 3000
```

#### Find Wells by Country
```
data.country = "Norway"
```

### Intermediate Queries

#### Find Active Production Wells
```
data.status = "Active" AND data.wellType = "Production"
```

#### Find Wells in Depth Range
```
data.depth BETWEEN 2000 AND 5000
```

#### Find Multiple Operators
```
data.operator IN ("Shell", "BP", "Equinor")
```

#### Find Wells with Name Pattern
```
data.wellName LIKE "North*"
```

### Advanced Queries

#### Find Deep Exploration Wells in Norway
```
data.country = "Norway" AND data.wellType = "Exploration" AND data.depth > 3000
```

#### Find Shell or BP Wells in North Sea
```
(data.operator = "Shell" OR data.operator = "BP") AND data.basin = "North Sea"
```

#### Find Recent Active Wells
```
data.status = "Active" AND data.createdDate > "2022-01-01"
```

#### Exclude Test and Temporary Wells
```
data.wellName NOT LIKE "*Test*" AND data.wellName NOT LIKE "*Temp*"
```

#### Find Horizontal Wellbores in Depth Range
```
data.wellboreType = "Horizontal" AND data.md BETWEEN 2000 AND 4000
```

---

## Wildcard Patterns

### Asterisk (*) - Multiple Characters

#### Starts With
```
data.wellName LIKE "North*"
```
Matches: North-1, North Sea, Northern, North-15H

#### Ends With
```
data.wellName LIKE "*-15H"
```
Matches: North-15H, South-15H, Well-15H

#### Contains
```
data.wellName LIKE "*Test*"
```
Matches: Test-1, MyTest, TestWell, PreTestPost

### Question Mark (?) - Single Character

#### Single Character Wildcard
```
data.wellName LIKE "Well-?"
```
Matches: Well-A, Well-1, Well-B
Does NOT match: Well-15, Well-AB

#### Multiple Single Characters
```
data.wellName LIKE "Well-??"
```
Matches: Well-15, Well-AB, Well-1A
Does NOT match: Well-1, Well-ABC

### Combining Wildcards

```
data.wellName LIKE "North-*-?H"
```
Matches: North-Sea-1H, North-Atlantic-5H
Does NOT match: North-1H, North-Sea-15H

---

## Operator Precedence

When multiple operators are used, they are evaluated in this order:

1. **Parentheses** `( )`
2. **Comparison Operators** `=`, `!=`, `>`, `<`, `>=`, `<=`, `LIKE`, `IN`, `BETWEEN`
3. **AND**
4. **OR**

### Example

```
data.operator = "Shell" OR data.operator = "BP" AND data.country = "Norway"
```

**Evaluation Order**:
1. `data.operator = "BP" AND data.country = "Norway"` (AND first)
2. `data.operator = "Shell" OR (result from step 1)` (OR second)

**Result**: ALL Shell wells OR BP wells in Norway

**To Get Different Result** (Shell OR BP, all in Norway):
```
(data.operator = "Shell" OR data.operator = "BP") AND data.country = "Norway"
```

---

## Common Patterns

### Find Records by Multiple Values

**Pattern**: Use IN operator
```
data.operator IN ("Shell", "BP", "Equinor", "TotalEnergies")
```

**Alternative** (less efficient):
```
data.operator = "Shell" OR data.operator = "BP" OR data.operator = "Equinor" OR data.operator = "TotalEnergies"
```

### Exclude Multiple Values

**Pattern**: Use NOT IN operator
```
data.status NOT IN ("Abandoned", "Inactive", "Plugged")
```

**Alternative** (less efficient):
```
data.status != "Abandoned" AND data.status != "Inactive" AND data.status != "Plugged"
```

### Range Queries

**Pattern**: Use BETWEEN
```
data.depth BETWEEN 2000 AND 5000
```

**Alternative** (equivalent):
```
data.depth >= 2000 AND data.depth <= 5000
```

### Partial String Matching

**Pattern**: Use LIKE with wildcards
```
data.wellName LIKE "North*"
```

**Alternative** (if you know all possible values):
```
data.wellName IN ("North-1", "North-2", "North-3", ...)
```

### Date Range Queries

**Pattern**: Use BETWEEN for dates
```
data.acquisitionDate BETWEEN "2022-01-01" AND "2023-12-31"
```

**Alternative** (equivalent):
```
data.acquisitionDate >= "2022-01-01" AND data.acquisitionDate <= "2023-12-31"
```

---

## Query Optimization Tips

### Use Specific Operators

**Slow**:
```
data.operator LIKE "*Shell*"
```

**Fast**:
```
data.operator = "Shell"
```

**Reason**: Exact matches are faster than pattern matching.

### Minimize Wildcards

**Slow**:
```
data.wellName LIKE "*Test*"
```

**Faster**:
```
data.wellName LIKE "Test*"
```

**Reason**: Leading wildcards require full table scans.

### Use IN for Multiple Values

**Slow**:
```
data.operator = "Shell" OR data.operator = "BP" OR data.operator = "Equinor"
```

**Fast**:
```
data.operator IN ("Shell", "BP", "Equinor")
```

**Reason**: IN operator is optimized for multiple value matching.

### Order Criteria by Selectivity

**Less Efficient**:
```
data.depth > 1000 AND data.operator = "Shell"
```

**More Efficient**:
```
data.operator = "Shell" AND data.depth > 1000
```

**Reason**: More selective criteria (operator) should come first to reduce the dataset early.

---

## Error Messages and Solutions

### "Unmatched quotes in query"

**Cause**: Missing closing quote
```
data.operator = "Shell
```

**Solution**: Add closing quote
```
data.operator = "Shell"
```

### "Unmatched parentheses in query"

**Cause**: Missing closing parenthesis
```
(data.operator = "Shell" OR data.operator = "BP"
```

**Solution**: Add closing parenthesis
```
(data.operator = "Shell" OR data.operator = "BP")
```

### "Invalid numeric value"

**Cause**: Non-numeric value in numeric field
```
data.depth = "3000m"
```

**Solution**: Remove non-numeric characters
```
data.depth = 3000
```

### "Invalid date format"

**Cause**: Wrong date format
```
data.acquisitionDate = "01/15/2023"
```

**Solution**: Use YYYY-MM-DD format
```
data.acquisitionDate = "2023-01-15"
```

---

## Best Practices

### 1. Use Quotes Consistently

**Good**:
```
data.operator = "Shell"
data.country = "Norway"
```

**Bad**:
```
data.operator = Shell      # Missing quotes
data.country = 'Norway'    # Wrong quote type
```

### 2. Use Parentheses for Clarity

**Good**:
```
(data.operator = "Shell" OR data.operator = "BP") AND data.country = "Norway"
```

**Unclear**:
```
data.operator = "Shell" OR data.operator = "BP" AND data.country = "Norway"
```

### 3. Format Multi-Line Queries

**Good**:
```
data.operator = "Shell"
AND data.country = "Norway"
AND data.depth > 3000
```

**Hard to Read**:
```
data.operator = "Shell" AND data.country = "Norway" AND data.depth > 3000
```

### 4. Use Meaningful Field Names

**Good**:
```
data.operator = "Shell"
```

**Confusing**:
```
data.op = "Shell"  # Abbreviated field name
```

### 5. Test Incrementally

Build complex queries step by step:

1. Start: `data.operator = "Shell"`
2. Add: `data.operator = "Shell" AND data.country = "Norway"`
3. Add: `data.operator = "Shell" AND data.country = "Norway" AND data.depth > 3000`

Test after each addition to ensure it works.

---

## Additional Resources

- [OSDU Query Builder User Guide](./OSDU_QUERY_BUILDER_USER_GUIDE.md)
- [Common Query Patterns](./OSDU_COMMON_QUERY_PATTERNS.md)
- [Query Builder FAQ](./OSDU_QUERY_BUILDER_FAQ.md)

---

**Need Help?** Click the Help button (ℹ️) in the Query Builder or contact your system administrator.
