# OSDU Query Builder Autocomplete - Quick Reference

## What is Autocomplete?

Autocomplete provides intelligent suggestions for field values in the OSDU Query Builder, making it easier to build queries without memorizing exact values.

## Fields with Autocomplete

### Well Data Type
- **Operator** - 14 major operating companies (Shell, BP, Equinor, etc.)
- **Country** - 14 countries with oil & gas operations
- **Basin** - 13 major geological basins worldwide
- **Status** - 10 well status values (Active, Producing, etc.)
- **Well Type** - 10 well classifications (Production, Exploration, etc.)

### Wellbore Data Type
- **Wellbore Type** - 7 wellbore configurations (Vertical, Horizontal, etc.)

### Log Data Type
- **Log Type** - 13 common well log curve types (GR, RHOB, NPHI, etc.)

### Seismic Data Type
- **Survey Type** - 8 seismic acquisition types (2D, 3D, 4D, etc.)

## How to Use Autocomplete

### 1. Select a Field with Autocomplete
When you add a criterion and select a field like "Operator", the Value input will show a dropdown instead of a text box.

### 2. View All Options
Click on the Value dropdown to see all available options. For example, Operator shows:
- Shell
- BP
- Equinor
- TotalEnergies
- ExxonMobil
- Chevron
- ConocoPhillips
- Eni
- Repsol
- Petrobras
- Saudi Aramco
- CNOOC
- Petronas
- ADNOC

### 3. Filter Options
Start typing to filter the list in real-time:
- Type "shell" → Shows only "Shell"
- Type "united" → Shows "United Kingdom" and "United States"
- Type "sea" → Shows "North Sea", "Norwegian Sea", "Barents Sea"

### 4. Select a Value
Click on a value from the filtered list to select it.

## Fields WITHOUT Autocomplete

These fields use free-text input (you can type anything):
- Well Name
- Wellbore Name
- Log Name
- Survey Name
- Depth (numeric)
- Measured Depth (numeric)
- True Vertical Depth (numeric)
- Curve Count (numeric)
- Top Depth (numeric)
- Bottom Depth (numeric)
- Acquisition Date (date)

## Tips

### Case-Insensitive Filtering
Autocomplete filtering is case-insensitive:
- "shell" matches "Shell"
- "NORWAY" matches "Norway"
- "north sea" matches "North Sea"

### Partial Matching
You can type any part of the value:
- "equi" matches "Equinor"
- "mex" matches "Mexico"
- "gulf" matches "Gulf of Mexico"

### Relevance Sorting
Results are sorted by relevance:
1. Exact matches first
2. Starts-with matches second
3. Contains matches last
4. Alphabetical within each group

### Multiple Criteria
You can use autocomplete for multiple criteria in the same query:
```
Operator = Shell
AND Country = Norway
AND Basin = North Sea
```

## Examples

### Example 1: Find Wells by Operator
1. Add criterion
2. Field: Operator
3. Operator: Equals
4. Value: Type "shell" → Select "Shell"
5. Result: `data.operator = "Shell"`

### Example 2: Find Wells in Multiple Countries
1. Add criterion
2. Field: Country
3. Operator: In List
4. Value: Type "norway, united kingdom" (comma-separated)
5. Result: `data.country IN ("Norway", "United Kingdom")`

### Example 3: Find Active Production Wells
1. Add criterion: Status = Active
2. Add criterion: Well Type = Production
3. Result:
```
data.status = "Active"
AND data.wellType = "Production"
```

## Troubleshooting

### Autocomplete not showing?
- Check that you selected a field with autocomplete support
- Fields like "Well Name" don't have autocomplete (by design)
- Try refreshing the page

### Can't find a value?
- Try typing part of the value to filter
- Check spelling (autocomplete is case-insensitive but spelling must match)
- If the value doesn't exist in the list, it may not be a standard value

### Want to add a custom value?
- For fields with autocomplete, you must select from the list
- For fields without autocomplete (like Well Name), you can type any value
- To add new autocomplete values, contact your administrator

## Benefits

✅ **Faster Query Building** - No need to type full values
✅ **Prevents Typos** - Select from valid options only
✅ **Guided Selection** - See all available options
✅ **Real-time Filtering** - Find values quickly
✅ **Case-Insensitive** - Type in any case
✅ **Industry Standards** - Values based on real-world usage

## Need Help?

- See full documentation: `tests/validate-autocomplete-manual.md`
- Implementation details: `tests/TASK_9_AUTOCOMPLETE_COMPLETE.md`
- Data sources: `src/utils/osduAutocompleteData.ts`
