# Syntax Highlighting Example

## Query Preview with Syntax Highlighting

This document shows what the syntax-highlighted query preview looks like in the OSDU Query Builder.

### Example 1: Simple Query

**Input Criteria:**
- Field: Operator
- Operator: Equals
- Value: Shell

**Query Preview:**
```
data.operator = "Shell"
```

**Syntax Highlighting:**
- `data.operator` → Teal (field name)
- `=` → White (operator)
- `"Shell"` → Orange (string value)

### Example 2: Multiple Criteria with AND

**Input Criteria:**
1. Operator = "Shell" (AND)
2. Country = "Norway" (AND)
3. Depth > 3000

**Query Preview:**
```
data.operator = "Shell"
AND data.country = "Norway"
AND data.depth > 3000
```

**Syntax Highlighting:**
- `data.operator`, `data.country`, `data.depth` → Teal (field names)
- `AND` → Purple/Magenta (logical operator)
- `=`, `>` → White (comparison operators)
- `"Shell"`, `"Norway"` → Orange (string values)
- `3000` → Light Green (number)

### Example 3: Complex Query with Grouping

**Input Criteria:**
1. Operator = "Shell" (AND)
2. Country = "Norway" (OR)
3. Depth > 3000 (AND)
4. Status = "Active"

**Query Preview:**
```
(data.operator = "Shell" AND data.country = "Norway")
OR (data.depth > 3000 AND data.status = "Active")
```

**Syntax Highlighting:**
- `(` `)` → Gold (parentheses)
- `data.operator`, `data.country`, `data.depth`, `data.status` → Teal (field names)
- `AND`, `OR` → Purple/Magenta (logical operators)
- `=`, `>` → White (comparison operators)
- `"Shell"`, `"Norway"`, `"Active"` → Orange (string values)
- `3000` → Light Green (number)

### Example 4: LIKE Operator

**Input Criteria:**
- Field: Well Name
- Operator: Contains (LIKE)
- Value: North

**Query Preview:**
```
data.wellName LIKE "%North%"
```

**Syntax Highlighting:**
- `data.wellName` → Teal (field name)
- `LIKE` → White (operator)
- `"%North%"` → Orange (string value with wildcards)

### Example 5: IN Operator

**Input Criteria:**
- Field: Operator
- Operator: In List
- Value: Shell, BP, Equinor

**Query Preview:**
```
data.operator IN ("Shell", "BP", "Equinor")
```

**Syntax Highlighting:**
- `data.operator` → Teal (field name)
- `IN` → White (operator)
- `(` `)` → Gold (parentheses)
- `"Shell"`, `"BP"`, `"Equinor"` → Orange (string values)

### Example 6: BETWEEN Operator

**Input Criteria:**
- Field: Depth
- Operator: Between
- Value: 1000, 5000

**Query Preview:**
```
data.depth BETWEEN 1000 AND 5000
```

**Syntax Highlighting:**
- `data.depth` → Teal (field name)
- `BETWEEN`, `AND` → White/Purple (operators)
- `1000`, `5000` → Light Green (numbers)

### Example 7: Empty Query

**Input Criteria:**
- (none)

**Query Preview:**
```
// Add criteria to build your query
```

**Syntax Highlighting:**
- `// Add criteria to build your query` → Green Italic (comment)

## Color Palette

The syntax highlighting uses a dark theme with the following colors:

| Element | Color | Hex Code | Example |
|---------|-------|----------|---------|
| Background | Dark Blue | `#232f3e` | (code block background) |
| Field Names | Teal | `#4ec9b0` | `data.operator` |
| Keywords (AND/OR) | Purple/Magenta | `#c586c0` | `AND`, `OR` |
| Operators | White | `#d4d4d4` | `=`, `>`, `LIKE` |
| String Values | Orange | `#ce9178` | `"Shell"` |
| Numbers | Light Green | `#b5cea8` | `3000` |
| Parentheses | Gold | `#ffd700` | `(`, `)` |
| Comments | Green Italic | `#6a9955` | `// comment` |

## Visual Indicators

### Valid Query
- **Border**: Green (`#037f0c`)
- **Badge**: Green with ✓ symbol
- **Alert**: Success (green) "Query Valid"

### Invalid Query
- **Border**: Red (`#d13212`)
- **Badge**: Red with ✗ symbol
- **Alert**: Warning (yellow) or Error (red)

## Implementation Details

The syntax highlighting is implemented using a `syntaxHighlightQuery()` function that:

1. Detects comments and styles them in green italic
2. Highlights logical operators (AND/OR) in purple
3. Highlights comparison operators in white
4. Highlights field names (data.*) in teal
5. Highlights string values (quoted text) in orange
6. Highlights numbers in light green
7. Highlights parentheses in gold

The function uses regex patterns to identify each syntax element and wraps them in `<span>` tags with inline styles. The result is rendered using `dangerouslySetInnerHTML` in a `<code>` element within a `<pre>` block.

## Browser Compatibility

The syntax highlighting works in all modern browsers:
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ✅ Opera

No external libraries required - pure CSS and JavaScript.

## Accessibility

- Color is not the only indicator (text labels also used)
- High contrast ratios for readability
- Monospace font for code clarity
- Proper semantic HTML (`<pre>`, `<code>`)

## Performance

- Lightweight implementation (no external libraries)
- Fast regex-based highlighting
- Minimal DOM manipulation
- No performance impact on large queries
