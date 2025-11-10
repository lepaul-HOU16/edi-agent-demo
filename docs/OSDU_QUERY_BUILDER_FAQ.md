# OSDU Query Builder - Frequently Asked Questions (FAQ)

## Table of Contents

1. [General Questions](#general-questions)
2. [Getting Started](#getting-started)
3. [Building Queries](#building-queries)
4. [Templates](#templates)
5. [Query History](#query-history)
6. [Results and Performance](#results-and-performance)
7. [Troubleshooting](#troubleshooting)
8. [Advanced Features](#advanced-features)
9. [Mobile Usage](#mobile-usage)
10. [Technical Questions](#technical-questions)

---

## General Questions

### What is the OSDU Query Builder?

The OSDU Query Builder is a visual tool that lets you search OSDU data using dropdown menus and form inputs instead of writing complex query syntax. It provides instant, deterministic search results with real-time validation.

### How is it different from conversational search?

| Feature | Query Builder | Conversational Search |
|---------|---------------|----------------------|
| **Speed** | Instant (< 2 seconds) | Slower (AI processing) |
| **Accuracy** | Deterministic, exact matches | Interpreted by AI |
| **Use Case** | Precise field-based searches | Exploratory, analytical questions |
| **Learning Curve** | Easy, visual interface | Natural language |
| **Results** | Raw data records | Analysis + insights |

### When should I use the Query Builder vs conversational search?

**Use Query Builder when**:
- You know exactly what fields you want to search
- You need precise, repeatable results
- You want instant results without AI latency
- You're building complex multi-criteria queries

**Use Conversational Search when**:
- You're exploring data and don't know exact field names
- You need analysis or insights, not just data
- You have a complex question requiring interpretation
- You want AI-powered recommendations

### Can I use both?

Yes! They complement each other. Use the Query Builder for precise searches and conversational search for exploratory analysis.

---

## Getting Started

### How do I open the Query Builder?

1. Navigate to the **Catalog** page
2. Click the **"Query Builder"** button in the chat header
3. The query builder panel expands below the chat interface

### Do I need special permissions?

No, if you have access to the Catalog page and OSDU search, you can use the Query Builder.

### Is there a tutorial or walkthrough?

Yes! See the [User Guide](./OSDU_QUERY_BUILDER_USER_GUIDE.md) for a step-by-step tutorial on building your first query.

### What data types can I search?

The Query Builder supports four OSDU data types:
- **Well**: Well header information (operator, location, depth, status, etc.)
- **Wellbore**: Wellbore details (type, measured depth, true vertical depth, etc.)
- **Log**: Well log information (log type, curves, depth range, etc.)
- **Seismic**: Seismic survey data (survey type, acquisition date, etc.)

---

## Building Queries

### How many criteria can I add to a query?

You can add up to **10 criteria** per query. This limit ensures queries remain manageable and performant.

### What's the difference between AND and OR?

- **AND**: Both conditions must be true
  - Example: `Country = "Norway" AND Depth > 3000`
  - Result: Only Norwegian wells deeper than 3000m

- **OR**: At least one condition must be true
  - Example: `Operator = "Shell" OR Operator = "BP"`
  - Result: Wells operated by Shell OR BP (or both)

### How do I search for partial matches?

Use the **LIKE** operator with wildcards:
- `*` = any sequence of characters
- `?` = any single character

**Examples**:
- `North*` matches "North Sea", "Northern", "North-15H"
- `*Test*` matches anything containing "Test"
- `?ell` matches "Shell", "Well", "Bell"

### How do I search for multiple values?

Use the **IN** operator:

**Example**: Find wells operated by Shell, BP, or Equinor
- Field: Operator
- Operator: IN
- Value: `Shell, BP, Equinor` (comma-separated)

### How do I search for a range of values?

Use the **BETWEEN** operator:

**Example**: Find wells between 2000m and 5000m depth
- Field: Depth
- Operator: BETWEEN
- Value: `2000, 5000` (comma-separated min, max)

### Can I search across multiple data types?

No, each query searches one data type (Well, Wellbore, Log, or Seismic). To search multiple data types, run separate queries.

### Why is my criterion showing a red error badge?

Red badges indicate validation errors. Common causes:
- **"Value is required"**: You haven't entered a value
- **"Must be a valid number"**: You entered text in a numeric field
- **"Date must be in YYYY-MM-DD format"**: Date format is incorrect
- **"BETWEEN requires exactly two values"**: You need two comma-separated values

Click on the error badge to see the specific issue.

### How do I know if my query is valid?

Look for these indicators:
- **Green checkmark (✓)** next to each criterion = valid
- **Green "Query Valid" alert** at the top = entire query is valid
- **"Execute Query ✓" button** is enabled = ready to run

### What does the Query Preview show?

The Query Preview shows the actual OSDU query syntax that will be executed. It updates in real-time as you build your query and includes syntax highlighting for readability.

---

## Templates

### What are query templates?

Templates are pre-built queries for common search scenarios. They provide a starting point that you can customize with your own values.

### How many templates are available?

The Query Builder includes:
- **5 Common templates**: Frequently used searches
- **5 Advanced templates**: More complex searches
- **Unlimited Custom templates**: Your saved queries

### How do I use a template?

1. Click **"Templates"** button in Advanced Options
2. Browse templates by category (Common, Advanced, Custom)
3. Click on a template to apply it
4. Modify the pre-filled values as needed
5. Execute the query

### Can I modify built-in templates?

You cannot edit built-in templates, but you can:
1. Apply a built-in template
2. Modify the criteria
3. Save it as your own custom template

### How do I save a custom template?

1. Build your query with all criteria
2. Ensure the query is valid (green checkmark)
3. Click **"Save as Template"** in Advanced Options
4. Enter template name, description, and tags
5. Click **"Save"**

### Where are my custom templates stored?

Custom templates are stored in your browser's local storage. They persist across sessions but are specific to your browser and device.

### Can I share templates with my team?

Currently, templates are stored locally. You can:
1. Export templates as JSON
2. Share the JSON file with teammates
3. Teammates can import the JSON file

### How do I delete a custom template?

1. Open the Templates panel
2. Navigate to the Custom category
3. Find your template
4. Click the delete icon (trash can)

### Can I export/import templates?

Yes! Use the export/import functionality in the Templates panel to:
- Export templates as JSON files
- Import templates from JSON files
- Share templates with teammates

---

## Query History

### What is Query History?

Query History automatically saves your last 20 executed queries for easy reuse.

### How do I view my query history?

Click the **"View History"** button in the Advanced Options section.

### What information is saved in history?

For each query, the history stores:
- Query text (OSDU syntax)
- All criteria (fields, operators, values)
- Timestamp
- Data type
- Result count (if available)

### How long is history kept?

The last **20 queries** are kept. When you execute a 21st query, the oldest query is removed.

### Can I delete queries from history?

Yes, you can delete individual queries from the history panel.

### Is my query history shared with others?

No, query history is stored locally in your browser and is not shared with other users.

### Can I export my query history?

Currently, there's no direct export function for history, but you can:
1. Load a query from history
2. Save it as a custom template
3. Export the template

---

## Results and Performance

### How many results will I get?

The Query Builder returns up to **100 results** by default. For more results, make your query more specific and run multiple queries.

### Why don't I see any results?

Common reasons:
1. **Too restrictive**: Your criteria are too specific
   - **Solution**: Remove some criteria or use OR instead of AND
2. **Wrong data type**: Searching in the wrong data type
   - **Solution**: Verify you selected the correct data type
3. **Typo in value**: Misspelled operator name or field value
   - **Solution**: Use autocomplete suggestions
4. **No data exists**: The data you're searching for doesn't exist
   - **Solution**: Try a broader search first

### How fast are query results?

Query Builder queries execute in **under 2 seconds** because they:
- Go directly to the OSDU API (no AI processing)
- Are pre-validated (no syntax errors)
- Use optimized query syntax

### Can I export the results?

Results are displayed in the chat interface using the OSDU Search Response component. Use the existing export functionality in that component.

### Why is my query slow?

Possible causes:
1. **Too broad**: Query matches too many records
   - **Solution**: Add more specific criteria
2. **Complex wildcards**: Using `*` at beginning and end
   - **Solution**: Use more specific patterns like `North*` instead of `*North*`
3. **Multiple OR conditions**: Many OR conditions can be slow
   - **Solution**: Use IN operator instead of multiple ORs

### How can I make my queries faster?

**Performance Tips**:
1. Use exact matches (`=`) instead of LIKE when possible
2. Put most selective criteria first
3. Use IN operator for multiple values instead of multiple ORs
4. Avoid leading wildcards (`*Test` is faster than `*Test*`)
5. Be as specific as possible

---

## Troubleshooting

### "Value is required" error

**Problem**: You haven't entered a value for a criterion.

**Solution**: Fill in the Value field for each criterion.

### "Must be a valid number" error

**Problem**: You entered text in a numeric field.

**Solution**: Enter only numbers (e.g., `3000` not `3000m`).

### "Date must be in YYYY-MM-DD format" error

**Problem**: Date format is incorrect.

**Solution**: Use format `2023-01-15` (year-month-day with dashes).

### "BETWEEN requires exactly two values" error

**Problem**: BETWEEN operator needs two comma-separated values.

**Solution**: Enter as `min, max` (e.g., `2000, 5000`).

### "Use comma to separate multiple values" error

**Problem**: IN operator needs comma-separated values.

**Solution**: Enter as `value1, value2, value3` (e.g., `Shell, BP, Equinor`).

### Query Preview shows "// Error generating query"

**Problem**: There's an issue with your query structure.

**Solution**:
1. Check that all criteria have values
2. Verify numeric fields have numbers
3. Verify date fields have correct format
4. Check for validation errors (red badges)

### Execute button is disabled

**Problem**: Your query has validation errors.

**Solution**: Look for red error badges (✗) next to criteria and fix the issues.

### Results don't match what I expected

**Possible Causes**:
1. **AND vs OR confusion**: Check your logic operators
2. **Wildcard issues**: Verify your wildcard patterns
3. **Data type mismatch**: Ensure you're searching the right data type
4. **Field value mismatch**: Check for typos or case sensitivity

**Solution**: Review the Query Preview to see the exact query being executed.

---

## Advanced Features

### What is the Analytics Dashboard?

The Analytics Dashboard shows usage metrics and insights:
- Most popular templates
- Most used fields
- Query success rates
- Common error patterns

Access it by clicking **"View Analytics"** in Advanced Options.

### Can I use keyboard shortcuts?

Yes! Desktop users can use:
- **Ctrl/Cmd + Enter**: Execute query
- **Ctrl/Cmd + N**: Add new criterion
- **Ctrl/Cmd + H**: Toggle query history

### What is query optimization?

The Query Builder automatically optimizes your queries by:
- Removing unnecessary parentheses
- Ordering criteria for better performance
- Using efficient operator syntax

### Can I copy the generated query?

Yes! Click the **"Copy Query"** button in the Query Preview section to copy the OSDU query syntax to your clipboard.

### Can I edit the query syntax directly?

No, the Query Builder is a visual tool. The query syntax is generated automatically from your criteria. If you need to write queries manually, use the conversational search interface.

---

## Mobile Usage

### Does the Query Builder work on mobile?

Yes! The Query Builder is fully responsive and optimized for mobile devices.

### What's different on mobile?

Mobile-specific features:
- Touch-friendly controls (44px minimum tap targets)
- Native date and number pickers
- Stacked layout for better readability
- Collapsible sections to save space
- Full-width buttons for easy access

### Are keyboard shortcuts available on mobile?

No, keyboard shortcuts are desktop-only. Mobile users should use the touch interface.

### Can I use autocomplete on mobile?

Yes, autocomplete works on mobile and is actually easier than typing on mobile keyboards.

### Should I use landscape or portrait mode?

**Portrait mode**: Good for simple queries with 1-2 criteria

**Landscape mode**: Better for complex queries with multiple criteria (more screen space)

---

## Technical Questions

### What browsers are supported?

All modern browsers:
- Chrome (recommended)
- Firefox
- Safari
- Edge

Mobile browsers are also fully supported.

### Does the Query Builder work offline?

No, it requires an internet connection to query the OSDU API. However:
- Templates are stored locally (work offline)
- Query history is stored locally (work offline)
- You can build queries offline but cannot execute them

### Where is my data stored?

- **Query History**: Browser local storage (your device)
- **Custom Templates**: Browser local storage (your device)
- **Query Results**: Not stored (fetched from OSDU API each time)

### Is my data secure?

Yes:
- All queries go through the same secure OSDU API
- Query history is stored locally (not on servers)
- Templates are stored locally (not shared)
- Results are fetched securely from OSDU API

### Can I clear my local data?

Yes, you can:
- Delete individual queries from history
- Delete individual custom templates
- Clear all browser data (clears everything)

### What happens if I clear my browser cache?

Clearing browser cache will delete:
- Query history
- Custom templates

Built-in templates will remain (they're part of the application).

### Can I use the Query Builder with different OSDU instances?

The Query Builder uses the OSDU instance configured for your application. Contact your system administrator to change OSDU instances.

### What OSDU API version is supported?

The Query Builder is compatible with OSDU R3 and later versions. Check with your system administrator for your specific OSDU version.

---

## Still Have Questions?

### Where can I find more help?

- **User Guide**: [OSDU Query Builder User Guide](./OSDU_QUERY_BUILDER_USER_GUIDE.md)
- **Syntax Reference**: [OSDU Query Syntax Reference](./OSDU_QUERY_SYNTAX_REFERENCE.md)
- **Query Patterns**: [Common Query Patterns](./OSDU_COMMON_QUERY_PATTERNS.md)
- **In-App Help**: Click the Help button (ℹ️) in the Query Builder

### How do I report a bug or request a feature?

Contact your system administrator or submit a support ticket through your organization's IT support system.

### Is there a video tutorial?

Video tutorials are planned for future releases. For now, refer to the [User Guide](./OSDU_QUERY_BUILDER_USER_GUIDE.md) for step-by-step instructions with examples.

---

**Last Updated**: January 2024

**Version**: 1.0

**Need Help?** Click the Help button (ℹ️) in the Query Builder or contact your system administrator.
