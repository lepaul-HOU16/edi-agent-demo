# Well Data Context Integration Test

## Test Overview
This test verifies that the well-data context integration and fake data confirmation mechanism are working correctly.

## Test Steps

### 1. Test Global Well Data Context Loading
- Start a new chat session
- Check if global well-data context is automatically loaded
- Verify that well information from `global/well-data/well-context.json` is available

### 2. Test Context-Aware Responses
- Ask about specific wells or formations mentioned in the context
- Verify agent references the global well database information
- Check if analysis guidelines are properly applied

### 3. Test Fake Data Confirmation Mechanism
- Request generation of synthetic well data
- Verify that fakeDataConfirmationTool is triggered
- Confirm that user approval is requested before generating fake data

## Expected Results

### Global Context Loading
```
Loading global data context and checking for recent uploads...
Global data context loaded successfully - found X files
```

### Context-Aware Responses
When asked about Eagle Ford or Wolfcamp formations, the agent should reference:
- Formation characteristics from the well database
- Typical porosity and permeability ranges
- Production characteristics
- Appropriate analysis guidelines

### Fake Data Confirmation
When requesting fake data, the agent should:
1. Use fakeDataConfirmationTool before generating any synthetic data
2. Display a confirmation dialog with:
   - Data type being generated
   - Purpose of the fake data
   - Warning about synthetic nature
   - Option to provide real data instead

## Test Queries

### Context Awareness Test
"Tell me about the Eagle Ford Shale formation and typical production characteristics"

Expected: Agent should reference the global well database information about Eagle Ford Shale including:
- Type: Unconventional
- Lithology: Shale/Carbonate
- Porosity range: 8-12%
- Permeability range: 0.001-0.1 mD
- Production characteristics

### Fake Data Test
"Create some sample well log data for demonstration purposes"

Expected: Agent should use fakeDataConfirmationTool and request user approval before generating any synthetic data.

## Implementation Status
- ✅ Global well-data context file created
- ✅ Fake data confirmation tool implemented  
- ✅ Agent handler updated to include both features
- ✅ System message updated with instructions
- ✅ Updated system message to reference existing 24 .las files
- ✅ Added explicit checks to prevent "no data" claims when files exist
- ✅ Fixed search tools to include global/well-data/ directory
- ✅ Updated both searchFiles and textToTableTool to find .las files
- ✅ Ready for testing with real well log data

## Real Data Available
The global/well-data directory contains 24 actual .las files that should be available to the agent at all times. The search tools now properly scan:
- `global/well-data/` (where the .las files are located)
- `global/well-files/` (existing directory)
- `global/production-data/` (existing directory)

## Search Pattern Examples
- `".*\.las$"` - finds all LAS files
- `"well-data"` - finds files in well-data directory
- `"las"` - simple search for files containing "las"
