# Design Document

## Overview

This design addresses two regressions in the data quality assessment feature:

1. **Backend Regression**: The petrophysics calculator Lambda function is missing 8 tools that exist in the MCP server, causing "Unknown tool" errors
2. **Frontend Regression**: The data completeness display changed from a visual progress bar to plain text with a red X icon

The solution involves:
- Porting missing tool implementations from the MCP server (scripts/mcp-well-data-server.py) to the Lambda handler (cdk/lambda-functions/petrophysics-calculator/handler.py)
- Restoring the progress bar component in the CloudscapeDataQualityDisplay component to show data completeness visually

## Architecture

```
User Request
    ↓
Enhanced Strands Agent (intent detection)
    ↓
callMCPTool() method
    ↓
AWS Lambda Invocation
    ↓
Petrophysics Calculator Lambda Handler
    ↓
Tool Router (if/elif chain)
    ↓
Tool Implementation
    ↓
S3 LAS File Fetch
    ↓
Data Processing
    ↓
Response with artifacts
```

### Current State (Broken)

**Lambda Handler Tools:**
- calculate_porosity ✅
- calculate_shale_volume ✅
- calculate_saturation ✅
- assess_well_data_quality ❌ (missing)
- assess_curve_quality ❌ (missing)
- list_wells ❌ (missing)
- get_well_info ❌ (missing)
- get_curve_data ❌ (missing)
- calculate_statistics ❌ (missing)
- calculate_data_completeness ❌ (missing)
- validate_environmental_corrections ❌ (missing)

**Agent Calls:**
- All 11 tools above

**Result:** "Unknown tool" errors for 8 tools

### Target State (Fixed)

**Lambda Handler Tools:**
- All 11 tools implemented ✅

**Agent Calls:**
- All 11 tools above

**Result:** All tools work correctly

## Components and Interfaces

### 1. Lambda Handler Entry Point

**File:** `cdk/lambda-functions/petrophysics-calculator/handler.py`

**Function:** `handler(event, context)`

**Input:**
```python
{
    "tool": str,  # Tool name
    "parameters": {
        "well_name": str,  # Required for most tools
        "wellName": str,   # Alternative parameter name
        # ... tool-specific parameters
    }
}
```

**Output:**
```python
{
    "success": bool,
    "message": str,
    "artifacts": [
        {
            "messageContentType": str,
            "analysisType": str,
            "wellName": str,
            "results": dict
        }
    ],
    "error": str  # Only present when success=False
}
```

### 2. Tool Router

**Current Implementation:**
```python
if tool == 'calculate_porosity':
    # ... implementation
elif tool == 'calculate_shale_volume':
    # ... implementation
elif tool == 'calculate_saturation':
    # ... implementation
else:
    return {'success': False, 'error': f"Unknown tool: {tool}"}
```

**New Implementation:**
```python
if tool == 'calculate_porosity':
    # ... existing implementation
elif tool == 'calculate_shale_volume':
    # ... existing implementation
elif tool == 'calculate_saturation':
    # ... existing implementation
elif tool == 'list_wells':
    # ... NEW implementation
elif tool == 'get_well_info':
    # ... NEW implementation
elif tool == 'get_curve_data':
    # ... NEW implementation
elif tool == 'calculate_statistics':
    # ... NEW implementation
elif tool == 'assess_well_data_quality':
    # ... NEW implementation
elif tool == 'assess_curve_quality':
    # ... NEW implementation
elif tool == 'calculate_data_completeness':
    # ... NEW implementation
elif tool == 'validate_environmental_corrections':
    # ... NEW implementation
else:
    return {'success': False, 'error': f"Unknown tool: {tool}"}
```

### 3. Data Quality Assessment Module

**New Helper Functions:**

```python
def assess_curve_quality_impl(curve_name: str, curve_data: List[float], depths: List[float]) -> dict:
    """
    Assess quality of a single curve
    
    Returns:
        {
            "curve_name": str,
            "quality_flag": str,  # "excellent", "good", "fair", "poor"
            "data_completeness": float,  # 0.0 to 1.0
            "outlier_percentage": float,
            "noise_level": float,
            "environmental_corrections": dict,
            "validation_notes": List[str],
            "statistics": dict
        }
    """
    pass

def calculate_data_completeness_impl(curve_data: List[float]) -> dict:
    """
    Calculate detailed completeness metrics
    
    Returns:
        {
            "total_points": int,
            "valid_points": int,
            "null_points": int,
            "completeness_percentage": float
        }
    """
    pass

def validate_environmental_corrections_impl(curve_name: str, curve_data: List[float]) -> dict:
    """
    Validate environmental corrections for specific curves
    
    Returns:
        {
            "curve_name": str,
            "corrections_applied": bool,
            "correction_type": str,
            "validation_status": str,
            "recommendations": List[str]
        }
    """
    pass
```

## Data Models

### LAS File Structure

```python
{
    "well_info": {
        "WELL": str,
        "UWI": str,
        "FIELD": str,
        # ... other well header info
    },
    "curves": List[str],  # ["DEPT", "GR", "RHOB", "NPHI", ...]
    "data": {
        "DEPT": List[float],
        "GR": List[float],
        "RHOB": List[float],
        # ... other curve data
    }
}
```

### Tool Response Format

All tools return this consistent format:

```python
{
    "success": bool,
    "message": str,
    "artifacts": [
        {
            "messageContentType": str,  # Identifies artifact type
            "analysisType": str,        # "single_well", "multi_well", etc.
            "wellName": str,
            "results": {
                # Tool-specific results
            }
        }
    ],
    "error": str  # Only when success=False
}
```

### Quality Assessment Result

```python
{
    "well_name": str,
    "overall_quality": str,  # "excellent", "good", "fair", "poor"
    "summary": {
        "average_completeness": float,
        "average_outliers": float,
        "average_noise": float,
        "total_curves": int
    },
    "curves": [
        {
            "curve_name": str,
            "quality_flag": str,
            "data_completeness": float,
            "outlier_percentage": float,
            "noise_level": float,
            "statistics": {
                "mean": float,
                "min": float,
                "max": float,
                "std_dev": float
            }
        }
    ]
}
```

## Frontend UI Components

### CloudscapeDataQualityDisplay Component

**File:** `src/components/cloudscape/CloudscapeDataQualityDisplay.tsx`

**Current State (Broken):**
```tsx
<div>
  <h4>Overall Data Completeness</h4>
  <p>Average completeness across 12 curves</p>
  <div>❌ 82.8%</div>  {/* Plain text with icon */}
</div>
```

**Target State (Fixed):**
```tsx
<div>
  <h4>Overall Data Completeness</h4>
  <p>Average completeness across 12 curves</p>
  <ProgressBar
    value={82.8}
    label="82.8%"
    status={82.8 < 90 ? "error" : "success"}
    variant="standalone"
  />
</div>
```

**Component Requirements:**
- Import ProgressBar from @cloudscape-design/components
- Use `value` prop for percentage (0-100)
- Use `label` prop to show percentage text
- Use `status="error"` for completeness < 90%
- Use `status="success"` for completeness >= 90%
- Use `variant="standalone"` for proper spacing

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Tool Recognition

*For any* tool name that exists in the MCP server, invoking that tool in the Lambda should NOT return "Unknown tool" error
**Validates: Requirements 1.1, 2.1, 3.1, 3.2, 3.3, 3.4, 4.1, 5.1, 7.2**

### Property 2: Response Format Consistency

*For any* successful tool invocation, the response should contain success=True, a message string, and an artifacts array
**Validates: Requirements 6.1, 6.2, 6.3**

### Property 3: Error Response Format

*For any* failed tool invocation, the response should contain success=False and an error string describing the failure
**Validates: Requirements 6.4, 6.5, 8.1, 8.2, 8.3, 8.4**

### Property 4: Data Completeness Calculation

*For any* curve data array, the completeness percentage should equal (valid_points / total_points) and be between 0.0 and 1.0
**Validates: Requirements 4.2, 4.3, 4.4, 4.5**

### Property 5: Quality Flag Consistency

*For any* curve quality assessment, if data_completeness > 0.9 and outlier_percentage < 0.05 and noise_level < 0.1, then quality_flag should be "excellent" or "good"
**Validates: Requirements 1.3, 2.2, 2.3, 2.4**

### Property 6: S3 Data Retrieval

*For any* valid well name, fetching the LAS file from S3 should either succeed with data or fail with a clear error message
**Validates: Requirements 3.5, 8.3**

### Property 7: No Mock Data

*For any* tool invocation that fails to retrieve data, the response should contain an error message and NOT contain mock or synthetic data
**Validates: Requirements 8.5**

### Property 8: Parameter Validation

*For any* tool that requires well_name parameter, invoking without well_name should return error "well_name is required"
**Validates: Requirements 7.3**

### Property 9: Curve Existence Check

*For any* tool that requires specific curves (e.g., GR, RHOB), if the curve is missing from the LAS file, the response should list the missing curve names
**Validates: Requirements 8.2**

### Property 10: Statistics Calculation

*For any* curve data with valid values, the calculated statistics (mean, min, max) should be mathematically correct and min ≤ mean ≤ max
**Validates: Requirements 3.4**

### Property 11: Progress Bar Rendering

*For any* data completeness percentage value, the UI should render a ProgressBar component instead of plain text
**Validates: Requirements 9.1, 9.2**

### Property 12: Progress Bar Color

*For any* completeness percentage below 90%, the progress bar status should be "error", and for 90% or above, it should be "success"
**Validates: Requirements 9.4, 9.5**

## Error Handling

### Error Categories

1. **Missing Well**: Well name not found in S3
   - Return: `{"success": False, "error": "Well {well_name} not found in S3"}`

2. **Missing Curve**: Required curve not in LAS file
   - Return: `{"success": False, "error": "Required curves missing: {curve_list}"}`

3. **S3 Access Error**: Cannot fetch LAS file
   - Return: `{"success": False, "error": "Failed to fetch LAS file from s3://{bucket}/{key}: {error}"}`

4. **Parsing Error**: LAS file cannot be parsed
   - Return: `{"success": False, "error": "Failed to parse LAS file: {error}"}`

5. **Missing Parameter**: Required parameter not provided
   - Return: `{"success": False, "error": "{parameter_name} is required"}`

6. **Unknown Tool**: Tool name not recognized
   - Return: `{"success": False, "error": "Unknown tool: {tool_name}"}`

### Error Handling Strategy

```python
try:
    # Validate parameters
    if not well_name:
        return {"success": False, "error": "well_name is required"}
    
    # Fetch LAS file
    try:
        las_content = fetch_from_s3(well_name)
    except Exception as e:
        return {"success": False, "error": f"Failed to fetch LAS file: {str(e)}"}
    
    # Parse LAS file
    try:
        las_data = parse_las_file(las_content)
    except Exception as e:
        return {"success": False, "error": f"Failed to parse LAS file: {str(e)}"}
    
    # Validate required curves
    if required_curve not in las_data['data']:
        return {"success": False, "error": f"{required_curve} curve not found"}
    
    # Process data
    result = process_data(las_data)
    
    return {
        "success": True,
        "message": "Analysis complete",
        "artifacts": [result]
    }
    
except Exception as e:
    print(f"Unexpected error: {str(e)}")
    traceback.print_exc()
    return {"success": False, "error": str(e)}
```

## Testing Strategy

### Unit Tests

1. **Test tool recognition**
   - Input: Each tool name from MCP server
   - Expected: No "Unknown tool" errors

2. **Test response format**
   - Input: Valid tool invocation
   - Expected: Response has success, message, artifacts fields

3. **Test error handling**
   - Input: Invalid well name
   - Expected: Clear error message, no mock data

4. **Test data completeness calculation**
   - Input: Curve with 80 valid points out of 100
   - Expected: completeness_percentage = 0.8

5. **Test quality flag logic**
   - Input: High completeness, low outliers, low noise
   - Expected: quality_flag = "excellent" or "good"

### Property-Based Tests

Property-based tests will be written using Python's `hypothesis` library to verify universal properties across random inputs.

**Configuration:**
- Minimum 100 iterations per property test
- Each test tagged with format: `**Feature: fix-data-quality-tool-regression, Property {N}: {property_text}**`

**Property Test 1: Tool Recognition**
```python
@given(tool_name=sampled_from(MCP_TOOL_NAMES))
def test_tool_recognition(tool_name):
    """
    **Feature: fix-data-quality-tool-regression, Property 1: Tool Recognition**
    
    For any tool name that exists in the MCP server, invoking that tool 
    in the Lambda should NOT return "Unknown tool" error
    """
    event = {"tool": tool_name, "parameters": {"well_name": "WELL-001"}}
    response = handler(event, None)
    assert "Unknown tool" not in response.get("error", "")
```

**Property Test 2: Response Format Consistency**
```python
@given(tool_name=sampled_from(SUCCESSFUL_TOOL_NAMES))
def test_response_format(tool_name):
    """
    **Feature: fix-data-quality-tool-regression, Property 2: Response Format Consistency**
    
    For any successful tool invocation, the response should contain 
    success=True, a message string, and an artifacts array
    """
    event = {"tool": tool_name, "parameters": {"well_name": "WELL-001"}}
    response = handler(event, None)
    if response.get("success"):
        assert "message" in response
        assert isinstance(response["message"], str)
        assert "artifacts" in response
        assert isinstance(response["artifacts"], list)
```

**Property Test 3: Error Response Format**
```python
@given(well_name=text(min_size=1, max_size=20))
def test_error_response_format(well_name):
    """
    **Feature: fix-data-quality-tool-regression, Property 3: Error Response Format**
    
    For any failed tool invocation, the response should contain 
    success=False and an error string describing the failure
    """
    event = {"tool": "assess_well_data_quality", "parameters": {"well_name": well_name}}
    response = handler(event, None)
    if not response.get("success"):
        assert "error" in response
        assert isinstance(response["error"], str)
        assert len(response["error"]) > 0
```

**Property Test 4: Data Completeness Calculation**
```python
@given(
    total_points=integers(min_value=10, max_value=1000),
    null_percentage=floats(min_value=0.0, max_value=1.0)
)
def test_data_completeness_calculation(total_points, null_percentage):
    """
    **Feature: fix-data-quality-tool-regression, Property 4: Data Completeness Calculation**
    
    For any curve data array, the completeness percentage should equal 
    (valid_points / total_points) and be between 0.0 and 1.0
    """
    null_count = int(total_points * null_percentage)
    valid_count = total_points - null_count
    
    curve_data = [1.0] * valid_count + [-999.25] * null_count
    
    result = calculate_data_completeness_impl(curve_data)
    
    expected_completeness = valid_count / total_points
    assert abs(result["completeness_percentage"] - expected_completeness) < 0.01
    assert 0.0 <= result["completeness_percentage"] <= 1.0
```

**Property Test 5: No Mock Data**
```python
@given(well_name=text(min_size=1, max_size=20))
def test_no_mock_data_on_error(well_name):
    """
    **Feature: fix-data-quality-tool-regression, Property 7: No Mock Data**
    
    For any tool invocation that fails to retrieve data, the response 
    should contain an error message and NOT contain mock or synthetic data
    """
    event = {"tool": "assess_well_data_quality", "parameters": {"well_name": well_name}}
    response = handler(event, None)
    
    if not response.get("success"):
        # Should have error message
        assert "error" in response
        # Should NOT have artifacts with data
        if "artifacts" in response:
            assert len(response["artifacts"]) == 0
```

## Implementation Notes

### Code Reuse from MCP Server

The MCP server implementation in `scripts/mcp-well-data-server.py` contains working implementations of all missing tools. These implementations should be ported to the Lambda handler with minimal modifications:

1. Copy the tool logic from MCP server
2. Adapt to Lambda's response format (add artifacts array)
3. Ensure consistent error handling
4. Maintain the same parameter names and validation

### S3 Bucket Configuration

The Lambda uses environment variable `STORAGE_BUCKET` to determine which S3 bucket contains well data. LAS files are expected at path: `global/well-data/{well_name}.las`

### Performance Considerations

- LAS file parsing is done in-memory (no temp files)
- Large LAS files may need streaming or chunking (future enhancement)
- Consider caching parsed LAS files in Lambda memory for repeated requests

### Deployment

After implementation:
1. Deploy Lambda: `cd cdk && npm run deploy`
2. Test on localhost: `npm run dev`
3. Verify all 11 tools work correctly
4. User validates and pushes for CI/CD frontend deployment
