# OSDU Common Query Patterns

## Overview

This document provides ready-to-use query patterns for common OSDU search scenarios. Each pattern includes:
- Use case description
- Query syntax
- Expected results
- Variations and alternatives

---

## Table of Contents

1. [Well Queries](#well-queries)
2. [Wellbore Queries](#wellbore-queries)
3. [Log Queries](#log-queries)
4. [Seismic Queries](#seismic-queries)
5. [Geographic Queries](#geographic-queries)
6. [Temporal Queries](#temporal-queries)
7. [Operational Queries](#operational-queries)
8. [Data Quality Queries](#data-quality-queries)

---

## Well Queries

### Find Wells by Operator

**Use Case**: Identify all wells operated by a specific company.

**Query**:
```
data.operator = "Shell"
```

**Variations**:
```
# Multiple operators
data.operator IN ("Shell", "BP", "Equinor")

# Exclude specific operator
data.operator != "Unknown"

# Operator name pattern
data.operator LIKE "Shell*"
```

---

### Find Wells by Status

**Use Case**: Find wells with specific operational status.

**Query**:
```
data.status = "Active"
```

**Variations**:
```
# Multiple statuses
data.status IN ("Active", "Producing")

# Exclude abandoned wells
data.status != "Abandoned"

# All non-active wells
data.status NOT IN ("Active", "Producing")
```

---

### Find Wells by Type

**Use Case**: Find wells of a specific classification.

**Query**:
```
data.wellType = "Production"
```

**Variations**:
```
# Multiple types
data.wellType IN ("Production", "Development")

# Exploration wells only
data.wellType = "Exploration"

# Non-production wells
data.wellType != "Production"
```

---

### Find Wells by Depth Range

**Use Case**: Find wells within a specific depth range.

**Query**:
```
data.depth BETWEEN 2000 AND 5000
```

**Variations**:
```
# Shallow wells (< 1000m)
data.depth < 1000

# Deep wells (> 5000m)
data.depth > 5000

# Ultra-deep wells (> 7500m)
data.depth > 7500

# Specific depth range
data.depth >= 3000 AND data.depth <= 4000
```

---

### Find Active Production Wells

**Use Case**: Identify currently producing wells.

**Query**:
```
data.status = "Active" AND data.wellType = "Production"
```

**Variations**:
```
# Active production or injection
(data.wellType = "Production" OR data.wellType = "Injection") AND data.status = "Active"

# Active wells excluding test wells
data.status = "Active" AND data.wellName NOT LIKE "*Test*"
```

---

### Find Wells by Name Pattern

**Use Case**: Find wells matching a naming pattern.

**Query**:
```
data.wellName LIKE "North*"
```

**Variations**:
```
# Wells starting with specific prefix
data.wellName LIKE "WELL-*"

# Wells containing specific text
data.wellName LIKE "*Test*"

# Wells with specific suffix
data.wellName LIKE "*-15H"

# Exclude test wells
data.wellName NOT LIKE "*Test*" AND data.wellName NOT LIKE "*Temp*"
```

---

## Wellbore Queries

### Find Horizontal Wellbores

**Use Case**: Identify all horizontal wellbores.

**Query**:
```
data.wellboreType = "Horizontal"
```

**Variations**:
```
# Horizontal or extended reach
data.wellboreType IN ("Horizontal", "Extended Reach")

# Non-vertical wellbores
data.wellboreType != "Vertical"

# Deviated wellbores
data.wellboreType = "Deviated"
```

---

### Find Wellbores by Measured Depth

**Use Case**: Find wellbores within a measured depth range.

**Query**:
```
data.md BETWEEN 2000 AND 4000
```

**Variations**:
```
# Long reach wellbores (> 5000m MD)
data.md > 5000

# Short wellbores (< 1000m MD)
data.md < 1000

# Extended reach (MD > 2x TVD)
data.md > 2 * data.tvd
```

---

### Find Wellbores by True Vertical Depth

**Use Case**: Find wellbores by vertical depth.

**Query**:
```
data.tvd BETWEEN 1500 AND 3500
```

**Variations**:
```
# Shallow TVD (< 1000m)
data.tvd < 1000

# Deep TVD (> 4000m)
data.tvd > 4000

# Specific TVD range
data.tvd >= 2000 AND data.tvd <= 3000
```

---

## Log Queries

### Find Logs by Type

**Use Case**: Find well logs of a specific measurement type.

**Query**:
```
data.logType = "GR"
```

**Variations**:
```
# Multiple log types
data.logType IN ("GR", "RHOB", "NPHI")

# Resistivity logs
data.logType LIKE "*Resistivity*"

# All logs except gamma ray
data.logType != "GR"
```

---

### Find Logs by Curve Count

**Use Case**: Find logs with a specific number of curves.

**Query**:
```
data.curveCount >= 5
```

**Variations**:
```
# Logs with many curves (> 10)
data.curveCount > 10

# Logs with few curves (< 3)
data.curveCount < 3

# Logs with specific curve count range
data.curveCount BETWEEN 5 AND 15
```

---

### Find Logs by Depth Range

**Use Case**: Find logs covering a specific depth interval.

**Query**:
```
data.topDepth <= 1000 AND data.bottomDepth >= 3000
```

**Variations**:
```
# Logs starting shallow (< 500m)
data.topDepth < 500

# Logs extending deep (> 5000m)
data.bottomDepth > 5000

# Logs within specific interval
data.topDepth >= 1000 AND data.bottomDepth <= 2000
```

---

### Find Complete Log Suites

**Use Case**: Find wells with complete petrophysical log suites.

**Query**:
```
data.logType IN ("GR", "RHOB", "NPHI", "RT")
```

**Note**: This finds logs of these types. To find wells with ALL these log types, you would need to run separate queries and intersect results.

---

## Seismic Queries

### Find 3D Seismic Surveys

**Use Case**: Identify all 3D seismic surveys.

**Query**:
```
data.surveyType = "3D"
```

**Variations**:
```
# 3D or 4D surveys
data.surveyType IN ("3D", "4D")

# All surveys except 2D
data.surveyType != "2D"

# Advanced survey types
data.surveyType IN ("Multi-component", "Wide Azimuth")
```

---

### Find Recent Seismic Surveys

**Use Case**: Find surveys acquired in the last year.

**Query**:
```
data.acquisitionDate > "2023-01-01"
```

**Variations**:
```
# Surveys in specific year
data.acquisitionDate BETWEEN "2023-01-01" AND "2023-12-31"

# Surveys before specific date
data.acquisitionDate < "2020-01-01"

# Recent surveys (last 6 months)
data.acquisitionDate > "2023-07-01"
```

---

## Geographic Queries

### Find Wells by Country

**Use Case**: Find all wells in a specific country.

**Query**:
```
data.country = "Norway"
```

**Variations**:
```
# Multiple countries
data.country IN ("Norway", "United Kingdom", "Netherlands")

# Exclude specific country
data.country != "Unknown"

# Country name pattern
data.country LIKE "United*"
```

---

### Find Wells by Basin

**Use Case**: Find wells in a specific geological basin.

**Query**:
```
data.basin = "North Sea"
```

**Variations**:
```
# Multiple basins
data.basin IN ("North Sea", "Norwegian Sea", "Barents Sea")

# Basin name pattern
data.basin LIKE "*Sea"

# Exclude specific basin
data.basin != "Unknown"
```

---

### Find Wells in Specific Region

**Use Case**: Find wells in a specific geographic region.

**Query**:
```
data.country = "Norway" AND data.basin = "North Sea"
```

**Variations**:
```
# Multiple countries in same basin
data.basin = "North Sea" AND data.country IN ("Norway", "United Kingdom", "Netherlands")

# Specific operator in specific region
data.country = "Norway" AND data.operator = "Equinor"
```

---

## Temporal Queries

### Find Recently Created Wells

**Use Case**: Find wells created in the last year.

**Query**:
```
data.createdDate > "2023-01-01"
```

**Variations**:
```
# Wells created in specific year
data.createdDate BETWEEN "2023-01-01" AND "2023-12-31"

# Wells created before specific date
data.createdDate < "2020-01-01"

# Wells created in last 6 months
data.createdDate > "2023-07-01"
```

---

### Find Wells by Date Range

**Use Case**: Find wells created within a specific date range.

**Query**:
```
data.createdDate BETWEEN "2022-01-01" AND "2023-12-31"
```

**Variations**:
```
# Specific quarter
data.createdDate BETWEEN "2023-01-01" AND "2023-03-31"

# Specific month
data.createdDate BETWEEN "2023-06-01" AND "2023-06-30"

# Last 2 years
data.createdDate > "2022-01-01"
```

---

## Operational Queries

### Find Wells by Operator and Status

**Use Case**: Find active wells for a specific operator.

**Query**:
```
data.operator = "Shell" AND data.status = "Active"
```

**Variations**:
```
# Multiple operators, active status
data.operator IN ("Shell", "BP") AND data.status = "Active"

# Specific operator, multiple statuses
data.operator = "Shell" AND data.status IN ("Active", "Producing")

# Specific operator, exclude abandoned
data.operator = "Shell" AND data.status != "Abandoned"
```

---

### Find Deep Exploration Wells

**Use Case**: Find exploration wells deeper than 3000m.

**Query**:
```
data.wellType = "Exploration" AND data.depth > 3000
```

**Variations**:
```
# Ultra-deep exploration (> 5000m)
data.wellType = "Exploration" AND data.depth > 5000

# Exploration in specific region
data.wellType = "Exploration" AND data.country = "Norway" AND data.depth > 3000

# Recent deep exploration
data.wellType = "Exploration" AND data.depth > 3000 AND data.createdDate > "2022-01-01"
```

---

### Find Production Wells by Depth

**Use Case**: Find production wells in a specific depth range.

**Query**:
```
data.wellType = "Production" AND data.depth BETWEEN 2000 AND 4000
```

**Variations**:
```
# Shallow production wells
data.wellType = "Production" AND data.depth < 2000

# Deep production wells
data.wellType = "Production" AND data.depth > 4000

# Production wells in specific region and depth
data.wellType = "Production" AND data.country = "Norway" AND data.depth > 3000
```

---

### Find Injection Wells

**Use Case**: Find all injection wells (water or gas).

**Query**:
```
data.wellType = "Injection"
```

**Variations**:
```
# Active injection wells
data.wellType = "Injection" AND data.status = "Active"

# Injection wells by operator
data.wellType = "Injection" AND data.operator = "Shell"

# Injection wells in specific field
data.wellType = "Injection" AND data.basin = "North Sea"
```

---

## Data Quality Queries

### Find Wells with Complete Data

**Use Case**: Find wells with all required fields populated.

**Query**:
```
data.operator != "" AND data.country != "" AND data.depth > 0
```

**Note**: This assumes empty strings or zero values indicate missing data.

---

### Find Wells Missing Critical Data

**Use Case**: Find wells with missing operator information.

**Query**:
```
data.operator = "" OR data.operator = "Unknown"
```

**Variations**:
```
# Missing country
data.country = "" OR data.country = "Unknown"

# Missing depth
data.depth = 0 OR data.depth = null

# Missing status
data.status = "" OR data.status = "Unknown"
```

---

### Exclude Test and Temporary Wells

**Use Case**: Find production wells excluding test/temporary wells.

**Query**:
```
data.wellType = "Production" AND data.wellName NOT LIKE "*Test*" AND data.wellName NOT LIKE "*Temp*"
```

**Variations**:
```
# Exclude test wells only
data.wellName NOT LIKE "*Test*"

# Exclude temporary wells only
data.wellName NOT LIKE "*Temp*"

# Exclude multiple patterns
data.wellName NOT LIKE "*Test*" AND data.wellName NOT LIKE "*Temp*" AND data.wellName NOT LIKE "*Demo*"
```

---

## Complex Multi-Criteria Queries

### Find Operator's Active Deep Wells in Region

**Use Case**: Find Shell's active production wells deeper than 3000m in Norway.

**Query**:
```
data.operator = "Shell" AND data.status = "Active" AND data.wellType = "Production" AND data.depth > 3000 AND data.country = "Norway"
```

---

### Find Recent Exploration Wells by Multiple Operators

**Use Case**: Find exploration wells drilled by Shell or BP in the last 2 years.

**Query**:
```
data.operator IN ("Shell", "BP") AND data.wellType = "Exploration" AND data.createdDate > "2022-01-01"
```

---

### Find Horizontal Production Wells in Depth Range

**Use Case**: Find horizontal production wellbores with MD between 2000-4000m.

**Query**:
```
data.wellboreType = "Horizontal" AND data.wellType = "Production" AND data.md BETWEEN 2000 AND 4000
```

---

### Find Wells with Complete Log Suite

**Use Case**: Find wells with GR, RHOB, and NPHI logs.

**Note**: This requires multiple queries as you need to find wells that have ALL three log types:

1. Query for GR logs: `data.logType = "GR"`
2. Query for RHOB logs: `data.logType = "RHOB"`
3. Query for NPHI logs: `data.logType = "NPHI"`
4. Intersect the well IDs from all three queries

---

## Query Pattern Best Practices

### 1. Start Broad, Then Narrow

**Step 1**: Find all wells in Norway
```
data.country = "Norway"
```

**Step 2**: Add operator filter
```
data.country = "Norway" AND data.operator = "Equinor"
```

**Step 3**: Add depth filter
```
data.country = "Norway" AND data.operator = "Equinor" AND data.depth > 3000
```

### 2. Use Templates as Starting Points

Instead of building from scratch, start with a template and modify:
- "Wells by Operator" → Add depth filter
- "Wells by Location" → Add status filter
- "Active Production Wells" → Add depth range

### 3. Test Each Criterion Separately

Before combining criteria, test each one individually:
1. Test: `data.operator = "Shell"` → 500 results
2. Test: `data.country = "Norway"` → 1000 results
3. Combine: `data.operator = "Shell" AND data.country = "Norway"` → 50 results

### 4. Use Appropriate Operators

- **Exact match**: Use `=` when you know the exact value
- **Pattern match**: Use `LIKE` for partial matches
- **Multiple values**: Use `IN` for multiple acceptable values
- **Range**: Use `BETWEEN` for numeric or date ranges

### 5. Optimize for Performance

**Slow**:
```
data.wellName LIKE "*Test*" AND data.operator = "Shell"
```

**Fast**:
```
data.operator = "Shell" AND data.wellName LIKE "*Test*"
```

**Reason**: More selective criteria (operator) should come first.

---

## Additional Resources

- [OSDU Query Builder User Guide](./OSDU_QUERY_BUILDER_USER_GUIDE.md)
- [OSDU Query Syntax Reference](./OSDU_QUERY_SYNTAX_REFERENCE.md)
- [Query Builder FAQ](./OSDU_QUERY_BUILDER_FAQ.md)

---

**Need Help?** Click the Help button (ℹ️) in the Query Builder or contact your system administrator.
