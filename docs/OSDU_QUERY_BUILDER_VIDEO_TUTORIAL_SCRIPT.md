# OSDU Query Builder - Video Tutorial Script

## Overview

This document provides scripts and storyboards for video tutorials covering common OSDU Query Builder workflows. Each tutorial is designed to be 2-5 minutes long and focuses on a specific use case.

---

## Tutorial 1: Getting Started (2 minutes)

### Learning Objectives
- Open the Query Builder
- Understand the interface
- Build and execute a simple query

### Script

**[0:00-0:15] Introduction**
```
NARRATOR: "Welcome to the OSDU Query Builder. In this tutorial, you'll learn how to build your first query in under 2 minutes."

SCREEN: Show Catalog page with chat interface
```

**[0:15-0:30] Opening the Query Builder**
```
NARRATOR: "To open the Query Builder, navigate to the Catalog page and click the 'Query Builder' button in the chat header."

SCREEN: 
- Cursor moves to "Query Builder" button
- Click button
- Query Builder panel expands
- Highlight the four main sections:
  1. Templates & History (top)
  2. Data Type Selector
  3. Filter Criteria
  4. Query Preview
```

**[0:30-1:00] Building a Simple Query**
```
NARRATOR: "Let's build a simple query to find all wells operated by Shell. First, ensure 'Well' is selected as the data type."

SCREEN:
- Show Data Type dropdown with "Well" selected
- Highlight the dropdown

NARRATOR: "Next, click 'Add Criterion' to add your first filter."

SCREEN:
- Cursor clicks "Add Criterion" button
- New criterion row appears
- Highlight the three dropdowns: Field, Operator, Value
```

**[1:00-1:30] Configuring the Criterion**
```
NARRATOR: "Select 'Operator' from the Field dropdown, keep 'Equals' as the operator, and type 'Shell' in the Value field. Notice how autocomplete suggestions appear as you type."

SCREEN:
- Select "Operator" from Field dropdown
- Show "Equals" already selected in Operator dropdown
- Type "Shell" in Value field
- Show autocomplete dropdown with "Shell" highlighted
- Select "Shell" from autocomplete
- Green checkmark (✓) appears next to criterion
```

**[1:30-1:45] Reviewing the Query**
```
NARRATOR: "The Query Preview shows the generated OSDU query syntax. Notice the green checkmark indicating your query is valid and ready to execute."

SCREEN:
- Scroll to Query Preview section
- Highlight the query: data.operator = "Shell"
- Show green "Query Valid" alert
- Highlight syntax highlighting in the preview
```

**[1:45-2:00] Executing the Query**
```
NARRATOR: "Click 'Execute Query' to run your search. Results appear in the chat interface below, showing all wells operated by Shell."

SCREEN:
- Cursor clicks "Execute Query" button
- Query Builder closes
- Results appear in chat interface
- Show OSDU Search Response component with results
- Highlight result count: "Found 150 records"
```

**[2:00] Closing**
```
NARRATOR: "Congratulations! You've built and executed your first OSDU query. In the next tutorial, we'll explore templates and more advanced features."

SCREEN: Show end card with links to other tutorials
```

---

## Tutorial 2: Using Templates (3 minutes)

### Learning Objectives
- Browse and apply templates
- Customize template values
- Save custom templates

### Script

**[0:00-0:15] Introduction**
```
NARRATOR: "Templates are pre-built queries for common search scenarios. In this tutorial, you'll learn how to use templates to speed up your workflow."

SCREEN: Show Query Builder with Templates section highlighted
```

**[0:15-0:45] Browsing Templates**
```
NARRATOR: "Click the 'Templates' button in the Advanced Options section to browse available templates."

SCREEN:
- Cursor clicks "Templates" button
- Template selector modal opens
- Show three categories: Common, Advanced, Custom
- Highlight "Common" category

NARRATOR: "Templates are organized by category. Common templates include frequently used searches like 'Wells by Operator' and 'Wells by Location'."

SCREEN:
- Show list of Common templates
- Hover over each template to show description
```

**[0:45-1:15] Applying a Template**
```
NARRATOR: "Let's apply the 'Wells by Depth Range' template. Click on the template to apply it."

SCREEN:
- Cursor clicks "Wells by Depth Range" template
- Template selector closes
- Query Builder shows two pre-filled criteria:
  1. Depth > (empty value)
  2. Depth < (empty value)
- Highlight the empty value fields

NARRATOR: "The template provides the structure, but you need to fill in the values. Let's find wells between 2000 and 5000 meters."

SCREEN:
- Type "2000" in first value field
- Type "5000" in second value field
- Green checkmarks appear
- Query Preview updates: data.depth > 2000 AND data.depth < 5000
```

**[1:15-1:45] Customizing the Template**
```
NARRATOR: "You can customize templates by adding more criteria. Let's add a country filter to find deep wells in Norway."

SCREEN:
- Click "Add Criterion" button
- Select "Country" from Field dropdown
- Keep "Equals" as operator
- Type "Norway" in Value field
- Select from autocomplete
- Query Preview updates: data.depth > 2000 AND data.depth < 5000 AND data.country = "Norway"
```

**[1:45-2:30] Saving a Custom Template**
```
NARRATOR: "If you use this query frequently, save it as a custom template. Click 'Save as Template' in the Advanced Options."

SCREEN:
- Cursor clicks "Save as Template" button
- Save Template modal opens
- Show form fields: Name, Description, Tags

NARRATOR: "Give your template a descriptive name, add a description, and optionally add tags for easy searching."

SCREEN:
- Type "Deep Wells in Norway" in Name field
- Type "Find wells between 2000-5000m depth in Norway" in Description
- Type "norway, deep, depth" in Tags field
- Cursor clicks "Save" button
- Success message appears: "Template 'Deep Wells in Norway' saved successfully!"
```

**[2:30-3:00] Using Your Custom Template**
```
NARRATOR: "Your custom template is now available in the Custom category. You can reuse it anytime by selecting it from the Templates panel."

SCREEN:
- Open Templates panel
- Navigate to Custom category
- Show "Deep Wells in Norway" template
- Highlight the template with user's name/timestamp
- Click template to apply it
- Query Builder loads with all criteria pre-filled
```

**[3:00] Closing**
```
NARRATOR: "Templates save time and ensure consistency. Explore the built-in templates and create your own for queries you use frequently."

SCREEN: Show end card with links to other tutorials
```

---

## Tutorial 3: Advanced Multi-Criteria Queries (4 minutes)

### Learning Objectives
- Add multiple criteria
- Use AND/OR logic
- Understand query grouping
- Use special operators (LIKE, IN, BETWEEN)

### Script

**[0:00-0:20] Introduction**
```
NARRATOR: "In this tutorial, you'll learn how to build complex queries with multiple criteria and advanced operators."

SCREEN: Show Query Builder with empty criteria
```

**[0:20-1:00] Building a Multi-Criteria Query**
```
NARRATOR: "Let's find active production wells operated by Shell or BP in Norway. We'll need four criteria with a mix of AND and OR logic."

SCREEN: Show plan on screen:
1. Operator = Shell OR
2. Operator = BP AND
3. Status = Active AND
4. Country = Norway

NARRATOR: "Start by adding the first criterion: Operator equals Shell."

SCREEN:
- Add criterion: Operator = Shell
- Green checkmark appears
```

**[1:00-1:45] Adding OR Logic**
```
NARRATOR: "Add a second criterion for BP. This time, change the logic operator to OR because we want wells operated by Shell OR BP."

SCREEN:
- Add criterion: Operator = BP
- Highlight the Logic dropdown (shows "AND" by default)
- Change Logic to "OR"
- Query Preview updates: data.operator = "Shell" OR data.operator = "BP"

NARRATOR: "Notice how the Query Preview shows the OR operator between the two criteria."

SCREEN:
- Highlight "OR" in the query preview
```

**[1:45-2:30] Adding AND Logic**
```
NARRATOR: "Now add criteria for status and country. These should use AND logic because we want wells that match ALL these conditions."

SCREEN:
- Add criterion: Status = Active, Logic = AND
- Add criterion: Country = Norway, Logic = AND
- Query Preview updates with parentheses:
  (data.operator = "Shell" OR data.operator = "BP") AND data.status = "Active" AND data.country = "Norway"

NARRATOR: "The Query Builder automatically adds parentheses to group the OR conditions together. This ensures the query is evaluated correctly."

SCREEN:
- Highlight the parentheses in the query preview
- Show info alert explaining grouping
```

**[2:30-3:00] Using the IN Operator**
```
NARRATOR: "There's a more efficient way to search for multiple operators. Let's rebuild this query using the IN operator."

SCREEN:
- Remove the two operator criteria
- Add new criterion: Operator, IN operator
- Type "Shell, BP" in value field
- Query Preview updates: data.operator IN ("Shell", "BP") AND data.status = "Active" AND data.country = "Norway"

NARRATOR: "The IN operator is cleaner and more efficient for multiple values."

SCREEN:
- Highlight the IN clause in the query preview
```

**[3:00-3:30] Using LIKE with Wildcards**
```
NARRATOR: "Let's add one more criterion to exclude test wells using the LIKE operator with wildcards."

SCREEN:
- Add criterion: Well Name, NOT LIKE operator
- Type "*Test*" in value field
- Show tooltip explaining wildcards: * = any characters, ? = single character
- Query Preview updates with NOT LIKE clause

NARRATOR: "The asterisks are wildcards that match any characters. This excludes any well with 'Test' in its name."

SCREEN:
- Highlight the NOT LIKE clause
- Show examples: "Test-1", "MyTest", "TestWell" would all be excluded
```

**[3:30-4:00] Executing and Reviewing Results**
```
NARRATOR: "Your complex query is now complete and validated. Execute it to see the results."

SCREEN:
- Show final query in preview
- Highlight green "Query Valid" alert
- Click "Execute Query" button
- Results appear showing filtered wells
- Highlight result count and sample records
```

**[4:00] Closing**
```
NARRATOR: "You've learned how to build complex queries with multiple criteria, AND/OR logic, and special operators. Practice these techniques to master the Query Builder."

SCREEN: Show end card with links to other tutorials
```

---

## Tutorial 4: Query History and Reuse (2 minutes)

### Learning Objectives
- View query history
- Reuse previous queries
- Manage history

### Script

**[0:00-0:15] Introduction**
```
NARRATOR: "The Query Builder automatically saves your last 20 queries. In this tutorial, you'll learn how to reuse previous queries."

SCREEN: Show Query Builder with History button highlighted
```

**[0:15-0:45] Viewing Query History**
```
NARRATOR: "Click 'View History' in the Advanced Options to see your previous queries."

SCREEN:
- Cursor clicks "View History" button
- Query History panel opens
- Show list of previous queries with:
  - Query text
  - Timestamp
  - Result count
  - Data type badge

NARRATOR: "Each query shows when it was executed, how many results it returned, and what data type it searched."

SCREEN:
- Hover over each query to highlight information
```

**[0:45-1:15] Reusing a Query**
```
NARRATOR: "To reuse a query, simply click on it. The Query Builder loads with all criteria pre-filled."

SCREEN:
- Cursor clicks on a previous query
- Query History panel closes
- Query Builder loads with criteria from history
- All fields are populated
- Query Preview shows the query
- Green checkmarks appear

NARRATOR: "You can modify the criteria if needed, or execute it as-is."

SCREEN:
- Show modifying one value
- Query Preview updates
- Execute the query
```

**[1:15-1:45] Managing History**
```
NARRATOR: "You can delete queries you no longer need. Open the history panel and click the delete icon next to any query."

SCREEN:
- Open Query History panel
- Hover over a query to show delete icon
- Click delete icon
- Confirmation dialog appears
- Click "Delete"
- Query is removed from list

NARRATOR: "The Query Builder keeps your last 20 queries. Older queries are automatically removed when you execute new ones."

SCREEN:
- Show history count: "Showing 15 of 20 queries"
```

**[1:45-2:00] Closing**
```
NARRATOR: "Query History makes it easy to reuse and refine your searches. Use it to build on previous work and save time."

SCREEN: Show end card with links to other tutorials
```

---

## Tutorial 5: Mobile Usage (3 minutes)

### Learning Objectives
- Use Query Builder on mobile devices
- Understand mobile-specific features
- Navigate touch-friendly interface

### Script

**[0:00-0:15] Introduction**
```
NARRATOR: "The Query Builder is fully optimized for mobile devices. In this tutorial, you'll learn how to use it on your phone or tablet."

SCREEN: Show mobile device (phone) with Query Builder open
```

**[0:15-0:45] Mobile Interface Overview**
```
NARRATOR: "On mobile, the Query Builder uses a stacked layout for better readability. All controls are touch-friendly with minimum 44-pixel tap targets."

SCREEN:
- Show mobile Query Builder interface
- Highlight stacked layout (fields stack vertically)
- Show touch-friendly buttons (large, full-width)
- Demonstrate scrolling through the interface
```

**[0:45-1:15] Using Native Mobile Controls**
```
NARRATOR: "Mobile devices use native controls for dates and numbers, making data entry easier."

SCREEN:
- Add criterion with Date field
- Tap on date value field
- Native date picker appears
- Select a date
- Date populates in YYYY-MM-DD format

NARRATOR: "For numeric fields, the mobile keyboard automatically shows the number pad."

SCREEN:
- Add criterion with Depth field
- Tap on value field
- Number keyboard appears
- Type a number
```

**[1:15-1:45] Using Autocomplete on Mobile**
```
NARRATOR: "Autocomplete is especially helpful on mobile, reducing the need to type on small keyboards."

SCREEN:
- Add criterion with Operator field
- Tap on value field
- Autocomplete dropdown appears
- Scroll through suggestions
- Tap "Shell" to select
- Value populates automatically
```

**[1:45-2:15] Collapsible Sections**
```
NARRATOR: "To save screen space, advanced options are collapsed by default on mobile. Tap to expand them when needed."

SCREEN:
- Show "Advanced Options" section collapsed
- Tap to expand
- Show Templates, History, Analytics buttons
- Tap to collapse again

NARRATOR: "The Query Preview section is also collapsible. Expand it to review your query before executing."

SCREEN:
- Show Query Preview section
- Tap to expand
- Show query with syntax highlighting
- Tap to collapse
```

**[2:15-2:45] Landscape Mode**
```
NARRATOR: "For complex queries with multiple criteria, rotate to landscape mode for more screen space."

SCREEN:
- Show device in portrait mode with 3 criteria (cramped)
- Rotate device to landscape mode
- Show same query with more space
- Demonstrate easier navigation in landscape
```

**[2:45-3:00] Closing**
```
NARRATOR: "The Query Builder works seamlessly on mobile devices. Use templates and autocomplete to build queries quickly on the go."

SCREEN: Show end card with links to other tutorials
```

---

## Tutorial 6: Troubleshooting Common Issues (3 minutes)

### Learning Objectives
- Identify validation errors
- Fix common mistakes
- Understand error messages

### Script

**[0:00-0:15] Introduction**
```
NARRATOR: "In this tutorial, you'll learn how to identify and fix common query building errors."

SCREEN: Show Query Builder with several validation errors
```

**[0:15-0:45] Understanding Validation Badges**
```
NARRATOR: "Validation badges appear next to each criterion. A green checkmark means valid, a red X means there's an error."

SCREEN:
- Show criterion with green checkmark (✓ Valid)
- Show criterion with red X (✗ Value is required)
- Highlight the error message in the red badge

NARRATOR: "Click on the red badge to see the specific error message."

SCREEN:
- Cursor hovers over red badge
- Tooltip shows full error message
```

**[0:45-1:15] Fixing "Value is Required" Error**
```
NARRATOR: "The most common error is 'Value is required'. This means you haven't entered a value for a criterion."

SCREEN:
- Show criterion with empty value field
- Red badge shows "✗ Value is required"
- Type a value in the field
- Badge changes to green checkmark (✓ Valid)
- Query Preview updates
```

**[1:15-1:45] Fixing "Must be a valid number" Error**
```
NARRATOR: "If you enter text in a numeric field, you'll see 'Must be a valid number'. Remove any non-numeric characters."

SCREEN:
- Show Depth field with value "3000m"
- Red badge shows "✗ Must be a valid number"
- Delete the "m"
- Value now shows "3000"
- Badge changes to green checkmark
```

**[1:45-2:15] Fixing Date Format Errors**
```
NARRATOR: "Date fields require YYYY-MM-DD format. If you use a different format, you'll see an error."

SCREEN:
- Show date field with value "01/15/2023"
- Red badge shows "✗ Date must be in YYYY-MM-DD format"
- Change to "2023-01-15"
- Badge changes to green checkmark

NARRATOR: "On mobile, use the native date picker to avoid format errors."

SCREEN:
- Show mobile device
- Tap date field
- Native date picker appears
- Select date
- Correct format populates automatically
```

**[2:15-2:45] Fixing BETWEEN and IN Operator Errors**
```
NARRATOR: "BETWEEN and IN operators require specific value formats. BETWEEN needs two comma-separated values."

SCREEN:
- Show BETWEEN operator with value "2000"
- Red badge shows "✗ BETWEEN requires exactly two values"
- Change to "2000, 5000"
- Badge changes to green checkmark

NARRATOR: "IN operator also needs comma-separated values."

SCREEN:
- Show IN operator with value "Shell"
- Red badge shows "✗ Use comma to separate multiple values"
- Change to "Shell, BP, Equinor"
- Badge changes to green checkmark
```

**[2:45-3:00] Closing**
```
NARRATOR: "Pay attention to validation badges and error messages. They tell you exactly what needs to be fixed. With practice, you'll avoid these errors entirely."

SCREEN: Show end card with links to other tutorials
```

---

## Production Notes

### Video Format
- **Resolution**: 1920x1080 (1080p)
- **Frame Rate**: 30 fps
- **Duration**: 2-5 minutes per tutorial
- **Format**: MP4 (H.264 codec)

### Screen Recording
- **Tool**: OBS Studio, Camtasia, or similar
- **Cursor**: Highlight cursor clicks and movements
- **Zoom**: Zoom in on important UI elements
- **Annotations**: Add arrows, highlights, and callouts

### Audio
- **Narration**: Clear, professional voice
- **Background Music**: Subtle, non-distracting
- **Sound Effects**: Minimal (click sounds, success chimes)

### Accessibility
- **Captions**: Include closed captions for all narration
- **Transcripts**: Provide full text transcripts
- **Audio Description**: Describe visual elements for screen readers

### Distribution
- **Platform**: Internal video hosting, YouTube (unlisted), or LMS
- **Embedding**: Embed in documentation and help system
- **Playlist**: Create playlist with all tutorials in sequence

---

## Tutorial Series Roadmap

### Phase 1: Basics (Completed Above)
1. Getting Started ✓
2. Using Templates ✓
3. Advanced Multi-Criteria Queries ✓
4. Query History and Reuse ✓
5. Mobile Usage ✓
6. Troubleshooting Common Issues ✓

### Phase 2: Advanced Topics (Future)
7. Query Optimization Techniques
8. Working with Large Result Sets
9. Combining Query Builder with Conversational Search
10. Analytics Dashboard Deep Dive

### Phase 3: Use Case Specific (Future)
11. Geoscientist Workflows
12. Petrophysicist Workflows
13. Data Manager Workflows
14. Executive Dashboard Queries

---

**Last Updated**: January 2024

**Version**: 1.0

**Contact**: For video production questions, contact the documentation team.
