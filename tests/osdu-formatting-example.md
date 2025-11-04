# OSDU Search Result Formatting Examples

## Example 1: Successful Search with Multiple Records

### User Query
```
Show me OSDU wells in the Gulf of Mexico
```

### Formatted Output
```markdown
**🔍 OSDU Search Results**

Found 15 wells in the Gulf of Mexico region matching your criteria. These wells include both active production sites and exploration wells with comprehensive geological data.

📊 **Found 15 records** *(showing first 10)*

**📋 Record Details:**

```json-table-data
[
  {
    "id": "osdu:well:gom-001",
    "name": "Gulf Star Alpha",
    "type": "Offshore Production Well",
    "location": "Gulf of Mexico, Block 123",
    "operator": "Energy Corp",
    "status": "Active",
    "depth": "15,420 ft"
  },
  {
    "id": "osdu:well:gom-002",
    "name": "Deep Horizon Beta",
    "type": "Offshore Exploration Well",
    "location": "Gulf of Mexico, Block 124",
    "operator": "Exploration Inc",
    "status": "Drilling",
    "depth": "18,750 ft"
  },
  {
    "id": "osdu:well:gom-003",
    "name": "Coastal Gamma",
    "type": "Offshore Production Well",
    "location": "Gulf of Mexico, Block 125",
    "operator": "Energy Corp",
    "status": "Active",
    "depth": "12,890 ft"
  }
]
```
```

### Visual Rendering
The above markdown will be rendered as:

**🔍 OSDU Search Results**

Found 15 wells in the Gulf of Mexico region matching your criteria. These wells include both active production sites and exploration wells with comprehensive geological data.

📊 **Found 15 records** *(showing first 10)*

**📋 Record Details:**

| id | name | type | location | operator | status | depth |
|----|------|------|----------|----------|--------|-------|
| osdu:well:gom-001 | Gulf Star Alpha | Offshore Production Well | Gulf of Mexico, Block 123 | Energy Corp | Active | 15,420 ft |
| osdu:well:gom-002 | Deep Horizon Beta | Offshore Exploration Well | Gulf of Mexico, Block 124 | Exploration Inc | Drilling | 18,750 ft |
| osdu:well:gom-003 | Coastal Gamma | Offshore Production Well | Gulf of Mexico, Block 125 | Energy Corp | Active | 12,890 ft |

---

## Example 2: Search with Few Records

### User Query
```
Search OSDU for wells operated by Exploration Inc
```

### Formatted Output
```markdown
**🔍 OSDU Search Results**

Found 3 wells operated by Exploration Inc in the OSDU database. All wells are currently in exploration phase.

📊 **Found 3 records**

**📋 Record Details:**

```json-table-data
[
  {
    "id": "osdu:well:exp-001",
    "name": "Explorer One",
    "type": "Exploration Well",
    "operator": "Exploration Inc"
  },
  {
    "id": "osdu:well:exp-002",
    "name": "Explorer Two",
    "type": "Exploration Well",
    "operator": "Exploration Inc"
  },
  {
    "id": "osdu:well:exp-003",
    "name": "Explorer Three",
    "type": "Exploration Well",
    "operator": "Exploration Inc"
  }
]
```
```

---

## Example 3: No Results Found

### User Query
```
Show me OSDU wells in Antarctica
```

### Formatted Output
```markdown
**🔍 OSDU Search Results**

No wells found in Antarctica region. The OSDU database does not contain any well records for this geographic area.

📊 **No records found**

💡 **Tip**: Try different search terms or check with your OSDU administrator about available data.
```

---

## Example 4: Single Record

### User Query
```
Find OSDU well with ID osdu:well:unique-001
```

### Formatted Output
```markdown
**🔍 OSDU Search Results**

Found the requested well record with detailed information including geological data and production history.

📊 **Found 1 record**

**📋 Record Details:**

```json-table-data
[
  {
    "id": "osdu:well:unique-001",
    "name": "Unique Discovery",
    "type": "Offshore Production Well",
    "location": "North Sea, Block 456",
    "operator": "North Sea Energy",
    "status": "Active",
    "depth": "14,200 ft"
  }
]
```
```

---

## Example 5: Complex Record with Nested Data

### User Query
```
Search OSDU for wells with depth greater than 15000 feet
```

### Formatted Output
```markdown
**🔍 OSDU Search Results**

Found 8 deep wells exceeding 15,000 feet in depth. These ultra-deep wells represent advanced drilling technology and significant geological exploration.

📊 **Found 8 records** *(showing first 8)*

**📋 Record Details:**

```json-table-data
[
  {
    "id": "osdu:well:deep-001",
    "name": "Ultra Deep Alpha",
    "type": "Ultra-Deep Exploration Well",
    "location": "Gulf of Mexico, Block 789",
    "operator": "Deep Drilling Corp",
    "status": "Drilling",
    "depth": "22,450 ft"
  },
  {
    "id": "osdu:well:deep-002",
    "name": "Deep Horizon",
    "type": "Ultra-Deep Production Well",
    "location": "North Sea, Block 890",
    "operator": "North Sea Energy",
    "status": "Active",
    "depth": "19,800 ft"
  }
]
```
```

---

## Formatting Features

### 1. Markdown Formatting ✅
- **Bold headers** for section titles
- *Italic text* for metadata
- Emoji icons for visual appeal
- Structured hierarchy

### 2. Prominent Record Count ✅
- 📊 Icon for visibility
- **Bold text** for emphasis
- Shows "showing first N" when applicable
- Handles singular/plural correctly

### 3. Professional Table Display ✅
- Uses `json-table-data` pattern
- Parsed by existing components
- Rendered in interactive table
- Consistent with catalog results

### 4. Smart Field Extraction ✅
- Primary fields: id, name, type
- Nested data fields: location, operator, status, depth
- Dynamic field inclusion
- Filters internal OSDU fields

### 5. Empty State Handling ✅
- Clear "No records found" message
- Helpful tips with 💡 icon
- Suggests alternative actions
- Professional error messaging

---

## Component Integration

### CatalogChatBoxCloudscape
- Parses `json-table-data` blocks
- Extracts table data from message
- Renders in professional format

### CustomAIMessage
- Renders markdown content
- Displays formatted text
- Handles emoji icons
- Maintains consistent styling

### Message Flow
1. User submits OSDU query
2. Intent detection routes to OSDU API
3. Response formatted with markdown
4. Message added to state
5. Component renders formatted output
6. Table data extracted and displayed

---

## Testing

All formatting examples have been tested and verified:
- ✅ Markdown rendering
- ✅ Record count display
- ✅ Table formatting
- ✅ Empty state handling
- ✅ Component integration
- ✅ UX consistency

Run tests:
```bash
node tests/test-osdu-catalog-integration.js
```

Expected output:
```
✅ All OSDU catalog integration tests passed!
```
