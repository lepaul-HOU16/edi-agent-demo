# Design Document

## Overview

This design addresses the trajectory coordinate conversion failure in the EDIcraft agent by fixing the data format mismatch between OSDU data retrieval and coordinate conversion functions. The solution involves creating a proper data transformation pipeline that handles both coordinate-based and survey-based trajectory data.

## Architecture

### Current (Broken) Flow

```
User Request: "Build trajectory for WELL-005"
    ↓
build_wellbore_trajectory_complete(wellbore_id)
    ↓
get_trajectory_coordinates_live(wellbore_id)
    → Returns: "SUCCESS! Trajectory coordinates...\nPoint 1: X=1.0, Y=2.0, Z=3.0\n..."
    ↓
calculate_trajectory_coordinates(trajectory_data)
    → Expects: '[{"tvd": 25, "azimuth": 310.2, "inclination": 0.18}, ...]'
    → Receives: Human-readable text string
    → ERROR: "Expecting value: line 1 column 1 (char 0)"
```

### Proposed (Fixed) Flow

```
User Request: "Build trajectory for WELL-005"
    ↓
build_wellbore_trajectory_complete(wellbore_id)
    ↓
get_trajectory_coordinates_live(wellbore_id)
    → Returns: JSON string with structured data
    ↓
parse_trajectory_data(trajectory_json)
    → Extracts coordinates or survey data
    → Validates required fields
    ↓
[Branch A: If coordinates available]
    transform_coordinates_to_minecraft(coordinates)
    → Direct transformation to Minecraft space
    ↓
[Branch B: If survey data available]
    calculate_trajectory_coordinates(survey_json)
    → Calculate 3D coordinates from survey
    → Transform to Minecraft space
    ↓
build_wellbore_in_minecraft(minecraft_coords_json)
    → Build visualization
    ↓
Success message returned to user
```

## Components and Interfaces

### 1. OSDU Data Retrieval (Modified)

**File:** `edicraft-agent/tools/osdu_client.py`

**Function:** `get_trajectory_coordinates_live(trajectory_id: str) -> str`

**Changes:**
- Return structured JSON instead of human-readable text
- Include both raw coordinates and survey data if available
- Add metadata about data format

**Output Format:**
```json
{
  "trajectory_id": "WELL-005",
  "data_type": "coordinates",
  "coordinates": [
    {"x": 1.0, "y": 2.0, "z": 3.0},
    {"x": 1.5, "y": 2.1, "z": 3.5}
  ],
  "survey_data": null,
  "metadata": {
    "total_points": 150,
    "source": "OSDU",
    "wellbore_id": "WELL-005"
  }
}
```

### 2. Data Parser (New)

**File:** `edicraft-agent/tools/trajectory_tools.py`

**Function:** `parse_trajectory_data(trajectory_json: str) -> dict`

**Purpose:** Parse and validate trajectory data from OSDU

**Logic:**
```python
def parse_trajectory_data(trajectory_json: str) -> dict:
    """
    Parse trajectory data and determine format.
    
    Returns:
        {
            "format": "coordinates" | "survey",
            "data": [...],
            "valid": True/False,
            "error": None | "error message"
        }
    """
    try:
        data = json.loads(trajectory_json)
        
        # Check if we have coordinates
        if "coordinates" in data and data["coordinates"]:
            return {
                "format": "coordinates",
                "data": data["coordinates"],
                "valid": True,
                "error": None
            }
        
        # Check if we have survey data
        if "survey_data" in data and data["survey_data"]:
            # Validate survey data has required fields
            required = ["tvd", "azimuth", "inclination"]
            if all(field in data["survey_data"][0] for field in required):
                return {
                    "format": "survey",
                    "data": data["survey_data"],
                    "valid": True,
                    "error": None
                }
        
        return {
            "format": "unknown",
            "data": None,
            "valid": False,
            "error": "No valid coordinates or survey data found"
        }
    
    except json.JSONDecodeError as e:
        return {
            "format": "unknown",
            "data": None,
            "valid": False,
            "error": f"JSON parsing failed: {str(e)}"
        }
```

### 3. Coordinate Transformer (New)

**File:** `edicraft-agent/tools/trajectory_tools.py`

**Function:** `transform_coordinates_to_minecraft(coordinates: list) -> str`

**Purpose:** Direct transformation of XYZ coordinates to Minecraft space

**Logic:**
```python
def transform_coordinates_to_minecraft(coordinates: list) -> str:
    """
    Transform raw XYZ coordinates directly to Minecraft coordinates.
    
    Args:
        coordinates: List of {"x": float, "y": float, "z": float}
    
    Returns:
        JSON string with minecraft coordinates
    """
    from .coordinates import transform_trajectory_to_minecraft
    
    # Convert dict format to tuple format
    coord_tuples = [(c["x"], c["y"], c["z"]) for c in coordinates]
    
    # Transform to Minecraft space
    minecraft_coords = transform_trajectory_to_minecraft(coord_tuples)
    
    # Convert back to dict format
    minecraft_coords_dict = [
        {"x": x, "y": y, "z": z} 
        for x, y, z in minecraft_coords
    ]
    
    result = {
        "total_points": len(minecraft_coords_dict),
        "minecraft_coordinates": minecraft_coords_dict,
        "trajectory_stats": {
            "max_depth": max(c["z"] for c in coordinates),
            "horizontal_displacement": (
                (coordinates[-1]["x"] - coordinates[0]["x"])**2 + 
                (coordinates[-1]["y"] - coordinates[0]["y"])**2
            )**0.5
        }
    }
    
    return json.dumps(result, indent=2)
```

### 4. Workflow Orchestrator (Modified)

**File:** `edicraft-agent/tools/workflow_tools.py`

**Function:** `build_wellbore_trajectory_complete(wellbore_id: str) -> str`

**Changes:**
- Add data parsing step
- Branch based on data format
- Improve error handling

**New Logic:**
```python
def build_wellbore_trajectory_complete(wellbore_id: str) -> str:
    try:
        # Step 1: Get trajectory data from OSDU
        trajectory_data = get_trajectory_coordinates_live(wellbore_id)
        
        if "error" in trajectory_data.lower():
            return f"Failed to fetch trajectory: {trajectory_data}"
        
        # Step 2: Parse and validate data
        parsed = parse_trajectory_data(trajectory_data)
        
        if not parsed["valid"]:
            return f"Invalid trajectory data: {parsed['error']}"
        
        # Step 3: Convert to Minecraft coordinates
        if parsed["format"] == "coordinates":
            # Direct coordinate transformation
            minecraft_coords = transform_coordinates_to_minecraft(parsed["data"])
        elif parsed["format"] == "survey":
            # Calculate from survey data
            survey_json = json.dumps(parsed["data"])
            minecraft_coords = calculate_trajectory_coordinates(survey_json)
        else:
            return f"Unknown data format: {parsed['format']}"
        
        if "error" in minecraft_coords.lower():
            return f"Coordinate conversion failed: {minecraft_coords}"
        
        # Step 4: Build in Minecraft
        build_result = build_wellbore_in_minecraft(minecraft_coords)
        
        return f"✅ Wellbore Trajectory Built Successfully!\n\n{build_result}"
        
    except Exception as e:
        return f"Error building wellbore trajectory: {str(e)}"
```

## Data Models

### Trajectory Data (from OSDU)

```python
{
    "trajectory_id": str,
    "data_type": "coordinates" | "survey",
    "coordinates": [
        {"x": float, "y": float, "z": float}
    ] | None,
    "survey_data": [
        {
            "measured_depth": float,
            "tvd": float,
            "azimuth": float,
            "inclination": float
        }
    ] | None,
    "metadata": {
        "total_points": int,
        "source": str,
        "wellbore_id": str
    }
}
```

### Parsed Trajectory Data

```python
{
    "format": "coordinates" | "survey" | "unknown",
    "data": list | None,
    "valid": bool,
    "error": str | None
}
```

### Minecraft Coordinates

```python
{
    "total_points": int,
    "minecraft_coordinates": [
        {"x": int, "y": int, "z": int}
    ],
    "trajectory_stats": {
        "max_depth": float,
        "horizontal_displacement": float
    }
}
```

## Error Handling

### Error Categories

1. **Authentication Errors**
   - OSDU authentication fails
   - Return: "Authentication failed. Check EDI credentials."

2. **Data Retrieval Errors**
   - Trajectory record not found
   - No datasets available
   - Return: "No trajectory data found for {wellbore_id}"

3. **Data Format Errors**
   - JSON parsing fails
   - Missing required fields
   - Return: "Invalid trajectory data: {specific error}"

4. **Coordinate Conversion Errors**
   - Calculation fails
   - Transformation fails
   - Return: "Coordinate conversion failed: {specific error}"

5. **Minecraft Building Errors**
   - RCON connection fails
   - Block placement fails
   - Return: "Failed to build in Minecraft: {specific error}"

### Error Handling Strategy

```python
try:
    # Step with specific error context
    result = risky_operation()
except SpecificException as e:
    return f"Step X failed: {str(e)}"
except Exception as e:
    return f"Unexpected error in Step X: {str(e)}"
```

## Testing Strategy

### Unit Tests

1. **Test `parse_trajectory_data`**
   - Valid coordinate data → returns coordinates format
   - Valid survey data → returns survey format
   - Invalid JSON → returns error
   - Missing fields → returns error

2. **Test `transform_coordinates_to_minecraft`**
   - Valid coordinates → returns Minecraft coords
   - Empty list → returns error
   - Invalid format → returns error

3. **Test `calculate_trajectory_coordinates`**
   - Valid survey JSON → returns Minecraft coords
   - Invalid JSON → returns error
   - Missing fields → returns error

### Integration Tests

1. **Test complete workflow with coordinate data**
   - Mock OSDU to return coordinate data
   - Verify transformation to Minecraft
   - Verify building commands generated

2. **Test complete workflow with survey data**
   - Mock OSDU to return survey data
   - Verify calculation and transformation
   - Verify building commands generated

3. **Test error handling**
   - Mock OSDU to return invalid data
   - Verify appropriate error messages
   - Verify no crashes

### Manual Tests

1. **Test with real WELL-005 data**
   - Run: "Build trajectory for WELL-005"
   - Verify: Success message returned
   - Verify: Wellbore visible in Minecraft

2. **Test with different well IDs**
   - Test multiple wells
   - Verify consistent behavior

## Implementation Notes

### Backward Compatibility

- Existing `calculate_trajectory_coordinates` function remains unchanged
- New functions added alongside existing ones
- Workflow function modified to use new pipeline

### Performance Considerations

- Coordinate transformation is O(n) where n = number of points
- Typical trajectory has 100-500 points
- Expected processing time: < 1 second

### Deployment

- Changes are in Python files only
- No infrastructure changes required
- Deploy via standard Lambda deployment process

## Success Criteria

1. ✅ User can request "Build trajectory for WELL-005" and receive success message
2. ✅ Trajectory data is correctly parsed from OSDU
3. ✅ Coordinates are correctly transformed to Minecraft space
4. ✅ Wellbore is visible in Minecraft world
5. ✅ Error messages are clear and actionable
6. ✅ No JSON parsing errors occur
