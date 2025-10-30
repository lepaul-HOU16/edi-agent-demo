# Trajectory Coordinate Conversion Test Suite

This directory contains comprehensive tests for the trajectory coordinate conversion fix (Task 5).

## Overview

The test suite validates the complete fix for the trajectory coordinate conversion error that was causing JSON parsing failures when users requested to build wellbore trajectories.

## Test Files

### 1. `test-osdu-data-retrieval.py` (Subtask 5.1)
Tests OSDU data retrieval functionality.

**What it tests:**
- JSON structure is correct
- Coordinates are present in response
- Metadata fields are included
- Data format is valid

**Requirements tested:** 1.1, 1.2

**Run individually:**
```bash
python3 tests/test-osdu-data-retrieval.py
```

### 2. `test-data-parsing.py` (Subtask 5.2)
Tests trajectory data parsing and validation.

**What it tests:**
- Parser detects coordinate format correctly
- Parser detects survey format correctly
- Validation passes for valid data
- Error handling for invalid JSON
- Error handling for missing required fields
- Parsing of actual WELL-005 data

**Requirements tested:** 2.1, 2.2

**Run individually:**
```bash
python3 tests/test-data-parsing.py
```

### 3. `test-coordinate-transformation.py` (Subtask 5.3)
Tests coordinate transformation to Minecraft space.

**What it tests:**
- Minecraft coordinates are generated correctly
- Coordinate ranges are reasonable
- Statistics are calculated (max depth, horizontal displacement, etc.)
- Transformation of actual WELL-005 data

**Requirements tested:** 3.4, 3.5

**Run individually:**
```bash
python3 tests/test-coordinate-transformation.py
```

### 4. `test-well005-complete-workflow.py` (Subtask 5.4)
Tests complete end-to-end workflow.

**What it tests:**
- Complete workflow from user query to Minecraft visualization
- Success message is returned
- No JSON parsing errors occur
- Wellbore is built in Minecraft
- Error handling for invalid wellbore IDs

**Requirements tested:** 1.5, 3.5

**Run individually:**
```bash
python3 tests/test-well005-complete-workflow.py
```

## Running All Tests

Use the master test runner to execute all tests in sequence:

```bash
./tests/run-all-trajectory-tests.sh
```

This will:
1. Run all four test files in order
2. Report results for each test
3. Provide a final summary
4. Exit with code 0 if all tests pass, 1 if any fail

## Test Requirements

### Prerequisites
- Python 3.x installed
- `edicraft-agent` directory present
- EDI credentials configured (for OSDU tests)
- AWS credentials configured (for Cognito authentication)

### Environment Variables
The tests require the following environment variables to be set:
- `EDI_USERNAME` - EDI platform username
- `EDI_PASSWORD` - EDI platform password
- `EDI_CLIENT_ID` - Cognito client ID
- `EDI_CLIENT_SECRET` - Cognito client secret
- `EDI_PARTITION` - OSDU partition (default: 'osdu')
- `EDI_PLATFORM_URL` - EDI platform URL

## Expected Results

When all tests pass, you should see:

```
===============================================================================
✅ ALL TESTS PASSED
===============================================================================

The trajectory coordinate conversion fix is working correctly!

Verified functionality:
  ✅ OSDU data retrieval returns structured JSON (Req 1.1, 1.2)
  ✅ Data parser detects and validates formats (Req 2.1, 2.2)
  ✅ Coordinate transformation works correctly (Req 3.4, 3.5)
  ✅ Complete workflow executes successfully (Req 1.5, 3.5)
  ✅ No JSON parsing errors occur

Task 5: Test with WELL-005 data - ✅ COMPLETE
```

## Troubleshooting

### Authentication Errors
If you see authentication errors:
1. Verify EDI credentials are set correctly
2. Check AWS credentials are configured
3. Ensure Cognito client ID and secret are valid

### OSDU Connection Errors
If OSDU connection fails:
1. Verify `EDI_PLATFORM_URL` is correct
2. Check network connectivity
3. Ensure OSDU platform is accessible

### Import Errors
If you see import errors:
1. Ensure you're running from the project root directory
2. Verify `edicraft-agent` directory exists
3. Check Python path includes the project root

### Test Failures
If specific tests fail:
1. Review the detailed output from the failed test
2. Check the error messages for specific issues
3. Verify the implementation matches the design document
4. Run individual tests for more detailed debugging

## Test Coverage

The test suite covers:

- ✅ OSDU data retrieval (JSON structure, coordinates, metadata)
- ✅ Data parsing (format detection, validation, error handling)
- ✅ Coordinate transformation (Minecraft coords, ranges, statistics)
- ✅ End-to-end workflow (complete user journey)
- ✅ Error handling (invalid data, missing fields, authentication failures)
- ✅ Real data testing (actual WELL-005 trajectory data)

## Success Criteria

All tests must pass to consider Task 5 complete:

1. ✅ OSDU data retrieval returns valid JSON with coordinates
2. ✅ Data parser correctly detects coordinate vs survey format
3. ✅ Validation passes for valid data, fails for invalid data
4. ✅ Coordinate transformation generates Minecraft coordinates
5. ✅ Statistics are calculated correctly
6. ✅ Complete workflow executes without JSON parsing errors
7. ✅ Success message is returned to user
8. ✅ Wellbore is built in Minecraft world

## Related Documentation

- **Requirements:** `.kiro/specs/fix-trajectory-coordinate-conversion/requirements.md`
- **Design:** `.kiro/specs/fix-trajectory-coordinate-conversion/design.md`
- **Tasks:** `.kiro/specs/fix-trajectory-coordinate-conversion/tasks.md`

## Notes

- Tests use actual OSDU data when available
- Some tests may be skipped if OSDU is unavailable (marked as SKIPPED, not FAILED)
- Tests are designed to be idempotent and can be run multiple times
- Each test provides detailed output for debugging purposes
