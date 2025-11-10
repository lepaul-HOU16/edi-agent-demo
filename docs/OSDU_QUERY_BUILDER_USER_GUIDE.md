# OSDU Visual Query Builder - User Guide

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Building Your First Query](#building-your-first-query)
4. [Using Templates](#using-templates)
5. [Advanced Features](#advanced-features)
6. [Query History](#query-history)
7. [Tips and Best Practices](#tips-and-best-practices)
8. [Troubleshooting](#troubleshooting)

---

## Introduction

The OSDU Visual Query Builder is a powerful tool that lets you search OSDU data using dropdown menus and form inputs instead of writing complex query syntax. It provides:

- **Instant Results**: Direct OSDU API calls with no AI processing latency
- **Zero Errors**: Real-time validation ensures your queries will execute successfully
- **Easy to Learn**: Visual interface with helpful tooltips and examples
- **Reusable Queries**: Save custom templates and access query history

### When to Use the Query Builder

Use the Query Builder when you:
- Need precise, deterministic search results
- Want to search by specific field values (operator, country, depth, etc.)
- Need to combine multiple search criteria with AND/OR logic
- Want to reuse common queries frequently

### When to Use Conversational Search

Use conversational search (chat) when you:
- Have a complex question that requires interpretation
- Need analysis or insights, not just data retrieval
- Want to explore data without knowing exact field names
- Need AI-powered recommendations

---

## Getting Started

### Opening the Query Builder

1. Navigate to the **Catalog** page
2. Click the **"Query Builder"** button in the chat header
3. The query builder panel will expand below the chat interface

### Understanding the Interface

The query builder has four main sections:

1. **Templates & History** (top): Quick access to pre-built queries and previous searches
2. **Data Type Selector**: Choose what type of data to search (Well, Wellbore, Log, Seismic)
3. **Filter Criteria**: Build your search criteria with fields, operators, and values
4. **Query Preview**: See the generated OSDU query and execute it

---

## Building Your First Query

### Example: Find Wells by Operator

Let's build a simple query to find all wells operated by Shell:

#### Step 1: Select Data Type
- In the **Data Type** dropdown, select **"Well"**
- This determines which fields are available to search

#### Step 2: Add a Criterion
- Click **"Add Criterion"** button
- A new criterion row appears with three dropdowns

#### Step 3: Configure the Criterion
- **Field**: Select **"Operator"** from the dropdown
- **Operator**: Select **"Equals"** (already selected by default)
- **Value**: Type **"Shell"** or select from autocomplete suggestions

#### Step 4: Review and Execute
- The **Query Preview** section shows: `data.operator = "Shell"`
- A green checkmark (✓) appears indicating the query is valid
- Click **"Execute Query"** to run the search

**Result**: You'll see all wells operated by Shell in the chat interface below.

---

## Using Templates

Templates are pre-built queries that you can customize for common searches.

### Applying a Template

1. Click the **"Templates"** button in the Advanced Options section
2. Browse available templates by category:
   - **Common**: Frequently used searches (Wells by Operator, Wells by Location, etc.)
   - **Advanced**: More complex searches (Deep Exploration Wells, North Sea Operators, etc.)
   - **Custom**: Your saved templates
3. Click on a template to apply it
4. Modify the pre-filled values as needed
5. Execute the query

### Popular Templates

#### Wells by Operator
Find all wells operated by a specific company.
- **Fields**: Operator
- **Use Case**: Identify all assets operated by your company or competitors

#### Wells by Depth Range
Find wells within a specific depth range.
- **Fields**: Depth (minimum and maximum)
- **Use Case**: Find shallow wells (<1000m) or ultra-deep wells (>5000m)

#### Active Production Wells
Find all currently producing wells.
- **Fields**: Status = "Active", Well Type = "Production"
- **Use Case**: Identify active production assets

#### Logs by Type
Find well logs of a specific type (GR, RHOB, NPHI, etc.).
- **Fields**: Log Type
- **Use Case**: Find all gamma ray logs or density logs

### Saving Custom Templates

Once you've built a query you want to reuse:

1. Build your query with all criteria
2. Ensure the query is valid (green checkmark)
3. Click **"Save as Template"** in Advanced Options
4. Enter:
   - **Template Name**: Descriptive name (e.g., "My Company Wells")
   - **Description**: What this template searches for
   - **Tags**: Keywords for easy searching (comma-separated)
5. Click **"Save"**

Your template is now available in the Custom category and will persist across sessions.

---

## Advanced Features

### Multiple Criteria with AND/OR Logic

You can combine multiple search criteria to create complex queries.

#### Example: Deep Wells in Norway

Find wells in Norway that are deeper than 3000 meters:

1. **Criterion 1**:
   - Field: Country
   - Operator: Equals
   - Value: Norway
   - Logic: **AND**

2. **Criterion 2**:
   - Field: Depth
   - Operator: Greater Than
   - Value: 3000

**Generated Query**: `data.country = "Norway" AND data.depth > 3000`

#### Understanding AND vs OR

- **AND**: Both conditions must be true
  - Example: `Country = "Norway" AND Depth > 3000`
  - Result: Only Norwegian wells deeper than 3000m

- **OR**: Either condition can be true
  - Example: `Country = "Norway" OR Country = "UK"`
  - Result: Wells in Norway OR UK (or both)

#### Complex Queries with Grouping

When you mix AND and OR operators, the query builder automatically adds parentheses for correct evaluation:

**Example**: Find Shell OR BP wells in Norway
- Criterion 1: Operator = "Shell", Logic: OR
- Criterion 2: Operator = "BP", Logic: AND
- Criterion 3: Country = "Norway"

**Generated Query**: `(data.operator = "Shell" OR data.operator = "BP") AND data.country = "Norway"`

### Special Operators

#### LIKE (Contains)
Use wildcards to search for partial matches:
- `*` matches any sequence of characters
- `?` matches any single character

**Examples**:
- `North*` matches "North Sea", "North Atlantic", "Northern"
- `?ell` matches "Shell", "Well", "Bell"
- `*Test*` matches anything containing "Test"

#### IN (Multiple Values)
Search for records matching any value in a list:

**Example**: Find wells operated by Shell, BP, or Equinor
- Field: Operator
- Operator: IN
- Value: `Shell, BP, Equinor` (comma-separated)

**Generated Query**: `data.operator IN ("Shell", "BP", "Equinor")`

#### BETWEEN (Range)
Search for values within a range:

**Example**: Find wells between 2000m and 4000m depth
- Field: Depth
- Operator: BETWEEN
- Value: `2000, 4000` (comma-separated min, max)

**Generated Query**: `data.depth BETWEEN 2000 AND 4000`

### Field-Specific Features

#### Autocomplete
Many fields provide autocomplete suggestions based on common values:
- **Operator**: Shell, BP, Equinor, TotalEnergies, etc.
- **Country**: Norway, United Kingdom, United States, Brazil, etc.
- **Basin**: North Sea, Gulf of Mexico, Permian Basin, etc.
- **Status**: Active, Inactive, Producing, Abandoned, etc.

Start typing and select from the dropdown, or type your own value.

#### Date Fields
For date fields (e.g., Acquisition Date), use **YYYY-MM-DD** format:
- Example: `2023-01-15`
- BETWEEN example: `2022-01-01, 2023-12-31`

#### Numeric Fields
For numeric fields (e.g., Depth, Measured Depth):
- Enter numbers without units
- Use comparison operators: =, !=, >, <, >=, <=
- Use BETWEEN for ranges

---

## Query History

The query builder automatically saves your last 20 queries for easy reuse.

### Viewing Query History

1. Click **"View History"** button in Advanced Options
2. Browse your previous queries with:
   - Query text
   - Timestamp
   - Result count (if available)
   - Data type

### Reusing a Query

1. Open Query History
2. Click on any previous query
3. The query builder loads with all criteria pre-filled
4. Modify if needed and execute

### Managing History

- **Automatic Saving**: Every executed query is saved automatically
- **Storage Limit**: Last 20 queries are kept
- **Persistence**: History is stored in your browser (local storage)
- **Privacy**: History is local to your browser and not shared

---

## Tips and Best Practices

### Building Effective Queries

1. **Start Simple**: Begin with one criterion, test it, then add more
2. **Use Templates**: Don't reinvent the wheel - start with a template
3. **Validate First**: Always check for the green checkmark before executing
4. **Test Incrementally**: Add criteria one at a time to ensure each works

### Performance Tips

1. **Be Specific**: More specific queries return faster results
2. **Limit Wildcards**: `*Test*` searches are slower than `Test*`
3. **Use Exact Matches**: `=` is faster than `LIKE` when you know the exact value
4. **Combine Criteria**: Use AND to narrow results instead of multiple separate queries

### Common Patterns

#### Find Recent Data
Use date fields with "greater than" operator:
```
data.createdDate > "2023-01-01"
```

#### Exclude Test Data
Use "NOT LIKE" to exclude test wells:
```
data.wellName NOT LIKE "*Test*"
```

#### Find Multiple Operators
Use IN operator for multiple values:
```
data.operator IN ("Shell", "BP", "Equinor")
```

#### Depth Range Search
Use BETWEEN for ranges:
```
data.depth BETWEEN 2000 AND 5000
```

### Keyboard Shortcuts (Desktop)

Speed up your workflow with keyboard shortcuts:
- **Ctrl/Cmd + Enter**: Execute query
- **Ctrl/Cmd + N**: Add new criterion
- **Ctrl/Cmd + H**: Toggle query history

---

## Troubleshooting

### Common Issues and Solutions

#### "Value is required" Error
**Problem**: You haven't entered a value for a criterion.
**Solution**: Fill in the Value field for each criterion.

#### "Must be a valid number" Error
**Problem**: You entered text in a numeric field.
**Solution**: Enter only numbers (e.g., `3000` not `3000m`).

#### "Date must be in YYYY-MM-DD format" Error
**Problem**: Date format is incorrect.
**Solution**: Use format `2023-01-15` (year-month-day with dashes).

#### "BETWEEN requires exactly two values" Error
**Problem**: BETWEEN operator needs two comma-separated values.
**Solution**: Enter as `min, max` (e.g., `2000, 5000`).

#### "Use comma to separate multiple values" Error
**Problem**: IN operator needs comma-separated values.
**Solution**: Enter as `value1, value2, value3` (e.g., `Shell, BP, Equinor`).

#### No Results Returned
**Possible Causes**:
1. **Too Restrictive**: Your criteria are too specific
   - **Solution**: Remove some criteria or use OR instead of AND
2. **Wrong Data Type**: Searching in wrong data type
   - **Solution**: Verify you selected the correct data type (Well, Wellbore, Log, Seismic)
3. **Typo in Value**: Misspelled operator name or field value
   - **Solution**: Use autocomplete suggestions to avoid typos
4. **No Data Exists**: The data you're searching for doesn't exist in OSDU
   - **Solution**: Try a broader search first to see what data is available

#### Query Takes Too Long
**Possible Causes**:
1. **Too Broad**: Query matches too many records
   - **Solution**: Add more specific criteria to narrow results
2. **Complex Wildcards**: Using `*` at beginning and end
   - **Solution**: Use more specific patterns like `North*` instead of `*North*`

### Getting Help

#### Contextual Help
- **Field Tooltips**: Hover over the info icon (ℹ️) next to field labels
- **Operator Help**: Hover over operator info icons for usage examples
- **Validation Messages**: Red badges show exactly what needs to be fixed

#### Help Modal
Click the **Help** button (ℹ️) in the top-right corner for:
- Quick reference guide
- OSDU query syntax reference
- Common query patterns
- FAQ

#### Analytics Dashboard
View usage metrics and insights:
- Most popular templates
- Most used fields
- Query success rates
- Common error patterns

---

## Mobile Usage

The query builder is fully responsive and optimized for mobile devices:

### Mobile-Specific Features

1. **Touch-Friendly Controls**: All buttons are at least 44px for easy tapping
2. **Native Inputs**: Date and number fields use native mobile controls
3. **Stacked Layout**: Criteria fields stack vertically for better readability
4. **Collapsible Sections**: Advanced options collapse by default to save space
5. **Full-Width Buttons**: All action buttons span full width for easy access

### Mobile Tips

1. **Use Templates**: Faster than building queries from scratch on mobile
2. **Use Autocomplete**: Easier than typing on mobile keyboards
3. **Landscape Mode**: Rotate to landscape for more screen space
4. **Query History**: Reuse previous queries instead of rebuilding

---

## Frequently Asked Questions

### General Questions

**Q: What's the difference between the Query Builder and conversational search?**
A: The Query Builder provides direct, deterministic searches with instant results. Conversational search uses AI to interpret natural language and can provide analysis and insights.

**Q: Can I use both the Query Builder and conversational search?**
A: Yes! Use the Query Builder for precise searches and conversational search for exploratory analysis.

**Q: Are my queries and templates saved?**
A: Yes, query history (last 20 queries) and custom templates are saved in your browser's local storage.

### Query Building

**Q: How many criteria can I add?**
A: You can add up to 10 criteria per query.

**Q: Can I search across multiple data types?**
A: No, each query searches one data type (Well, Wellbore, Log, or Seismic). Run separate queries for different data types.

**Q: What's the difference between AND and OR?**
A: AND requires all conditions to be true. OR requires at least one condition to be true.

**Q: How do I search for partial matches?**
A: Use the LIKE operator with wildcards: `*` for any characters, `?` for single character.

### Templates

**Q: Can I edit built-in templates?**
A: No, but you can apply a template, modify it, and save it as your own custom template.

**Q: Can I share templates with my team?**
A: Currently, templates are stored locally. You can export templates as JSON and share the file with teammates who can import it.

**Q: How do I delete a custom template?**
A: Open the Templates panel, find your custom template, and click the delete icon.

### Results

**Q: Why don't I see any results?**
A: Your query may be too restrictive, or the data doesn't exist. Try removing some criteria or using OR instead of AND.

**Q: How many results will I get?**
A: The query builder returns up to 100 results by default. For more results, make your query more specific and run multiple queries.

**Q: Can I export the results?**
A: Results are displayed in the chat interface. Use the existing export functionality in the OSDU Search Response component.

### Technical

**Q: Does the Query Builder work offline?**
A: No, it requires an internet connection to query the OSDU API. However, templates and history are stored locally.

**Q: What browsers are supported?**
A: All modern browsers (Chrome, Firefox, Safari, Edge). Mobile browsers are also supported.

**Q: Is my data secure?**
A: Yes, all queries go through the same secure OSDU API as conversational search. Query history is stored locally in your browser.

---

## Next Steps

Now that you understand the Query Builder, try these workflows:

1. **Explore Templates**: Browse all available templates to see what's possible
2. **Build a Complex Query**: Combine 3+ criteria with AND/OR logic
3. **Save Your First Template**: Create a template for a query you use frequently
4. **Review Analytics**: Check the analytics dashboard to see usage patterns

For more information, see:
- [OSDU Query Syntax Reference](./OSDU_QUERY_SYNTAX_REFERENCE.md)
- [Common Query Patterns](./OSDU_COMMON_QUERY_PATTERNS.md)
- [Query Builder FAQ](./OSDU_QUERY_BUILDER_FAQ.md)

---

**Need Help?** Click the Help button (ℹ️) in the Query Builder or contact your system administrator.
