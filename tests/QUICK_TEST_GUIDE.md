# Quick Test Guide - Trajectory Coordinate Conversion

## Run All Tests (Recommended)

```bash
./tests/run-all-trajectory-tests.sh
```

This runs all four test suites in sequence and provides a comprehensive report.

## Run Individual Tests

### Test 5.1: OSDU Data Retrieval
```bash
python3 tests/test-osdu-data-retrieval.py
```
Verifies JSON structure, coordinates presence, and metadata fields.

### Test 5.2: Data Parsing
```bash
python3 tests/test-data-parsing.py
```
Verifies format detection, validation, and error handling.

### Test 5.3: Coordinate Transformation
```bash
python3 tests/test-coordinate-transformation.py
```
Verifies Minecraft coordinate generation, ranges, and statistics.

### Test 5.4: Complete Workflow
```bash
python3 tests/test-well005-complete-workflow.py
```
Verifies end-to-end workflow from user query to Minecraft visualization.

## Prerequisites

1. **Set environment variables:**
   ```bash
   export EDI_USERNAME="your-username"
   export EDI_PASSWORD="your-password"
   export EDI_CLIENT_ID="your-client-id"
   export EDI_CLIENT_SECRET="your-client-secret"
   export EDI_PARTITION="osdu"
   export EDI_PLATFORM_URL="https://your-platform-url"
   ```

2. **Ensure you're in the project root directory**

3. **Python 3.x must be installed**

## Expected Output

When all tests pass:
```
✅ ALL TESTS PASSED

Results: 4/4 tests passed

Task 5: Test with WELL-005 data - ✅ COMPLETE
```

## Troubleshooting

**Authentication errors?**
- Check EDI credentials are set correctly
- Verify AWS credentials are configured

**Import errors?**
- Run from project root directory
- Verify `edicraft-agent` directory exists

**Test failures?**
- Review detailed output from failed test
- Check error messages for specific issues
- Run individual tests for debugging

## What Gets Tested

✅ OSDU data retrieval returns structured JSON  
✅ Data parser detects coordinate/survey formats  
✅ Validation passes for valid data  
✅ Error handling for invalid data  
✅ Coordinate transformation to Minecraft space  
✅ Statistics calculation (depth, displacement, etc.)  
✅ Complete workflow executes successfully  
✅ No JSON parsing errors occur  
✅ Success messages returned to user  

## Requirements Coverage

- **Requirements 1.1, 1.2:** OSDU data retrieval ✅
- **Requirements 2.1, 2.2:** Data parsing and validation ✅
- **Requirements 3.4, 3.5:** Coordinate transformation ✅
- **Requirements 1.5, 3.5:** End-to-end workflow ✅

## Next Steps

After all tests pass:
1. Review test output for any warnings
2. Verify WELL-005 trajectory builds in Minecraft
3. Test with other wellbore IDs
4. Deploy to production environment
5. Validate with real user queries
