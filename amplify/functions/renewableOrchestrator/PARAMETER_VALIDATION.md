# Parameter Validation

## Overview

The renewable orchestrator now includes comprehensive parameter validation to ensure all required parameters are present and valid before invoking tool Lambda functions. This prevents tool failures and provides clear, actionable error messages to users.

## Features

### 1. Required Parameter Validation

Each tool type has specific required parameters:

- **Terrain Analysis**: `latitude`, `longitude`
- **Layout Optimization**: `latitude`, `longitude`, `capacity`
- **Wake Simulation**: `project_id`
- **Report Generation**: `project_id`

### 2. Parameter Value Validation

Parameters are validated against constraints:

- **Latitude**: Must be between -90 and 90
- **Longitude**: Must be between -180 and 180
- **Capacity**: Must be between 0 and 1000 MW
- **Radius**: Must be between 0 and 50 km
- **Setback**: Must be between 0 and 1000 m
- **Number of Turbines**: Must be between 0 and 200
- **Project ID**: Must be alphanumeric with hyphens/underscores only

### 3. Default Parameter Application

Optional parameters are automatically filled with sensible defaults:

- **Terrain Analysis**:
  - `radius_km`: 5
  - `setback_m`: 200
  - `project_id`: Auto-generated if not provided

- **Layout Optimization**:
  - `layout_type`: 'grid'
  - `num_turbines`: Calculated from capacity (capacity / 2.5 MW per turbine)
  - `project_id`: Auto-generated if not provided

- **Wake Simulation**:
  - `wind_speed`: 8.5 m/s

### 4. User-Friendly Error Messages

When validation fails, users receive:

- Clear identification of missing parameters
- Specific error messages for invalid values
- Guidance on correct parameter format
- Examples of valid queries

## Error Response Format

```json
{
  "success": false,
  "message": "Missing required parameters: latitude, longitude.\n\nFor terrain analysis, please provide coordinates in the format: \"latitude, longitude\" (e.g., \"35.067482, -101.395466\")",
  "artifacts": [],
  "thoughtSteps": [
    {
      "step": 1,
      "action": "Validating deployment",
      "reasoning": "Checking if renewable energy tools are available"
    },
    {
      "step": 2,
      "action": "Analyzing query",
      "reasoning": "Determining which renewable energy tool to use"
    },
    {
      "step": 3,
      "action": "Validating parameters",
      "reasoning": "Checking that all required parameters are present and valid"
    }
  ],
  "metadata": {
    "executionTime": 45,
    "toolsUsed": [],
    "validationErrors": [
      "Missing required parameter: latitude",
      "Missing required parameter: longitude"
    ],
    "parameterValidation": {
      "missingRequired": ["latitude", "longitude"],
      "invalidValues": []
    }
  }
}
```

## CloudWatch Logging

Validation failures are logged to CloudWatch with structured format:

```json
{
  "level": "ERROR",
  "category": "PARAMETER_VALIDATION",
  "requestId": "req-1234567890-abc123",
  "intentType": "terrain_analysis",
  "validation": {
    "isValid": false,
    "missingRequired": ["latitude", "longitude"],
    "invalidValues": [],
    "errors": [
      "Missing required parameter: latitude",
      "Missing required parameter: longitude"
    ]
  },
  "providedParameters": {},
  "timestamp": "2025-01-10T12:34:56.789Z"
}
```

## Usage Examples

### Valid Terrain Analysis Query

```
Query: "Analyze terrain at 35.067482, -101.395466"

Result: ✅ Validation passes
- latitude: 35.067482
- longitude: -101.395466
- radius_km: 5 (default)
- setback_m: 200 (default)
- project_id: "project-1234567890" (auto-generated)
```

### Invalid Terrain Analysis Query

```
Query: "Analyze terrain for wind farm"

Result: ❌ Validation fails
Error: "Missing required parameters: latitude, longitude.

For terrain analysis, please provide coordinates in the format: 
\"latitude, longitude\" (e.g., \"35.067482, -101.395466\")"
```

### Valid Layout Optimization Query

```
Query: "Create a 30MW wind farm layout at 35.067482, -101.395466"

Result: ✅ Validation passes
- latitude: 35.067482
- longitude: -101.395466
- capacity: 30
- num_turbines: 12 (calculated: 30 / 2.5)
- layout_type: "grid" (default)
- project_id: "project-1234567890" (auto-generated)
```

### Invalid Layout Optimization Query

```
Query: "Create wind farm layout at 35.067482, -101.395466"

Result: ❌ Validation fails
Error: "Missing required parameter: capacity.

For layout optimization, please provide coordinates and capacity 
(e.g., \"Create a 30MW wind farm at 35.067482, -101.395466\")"
```

## Implementation Details

### Files

- `parameterValidator.ts`: Core validation logic
- `handler.ts`: Integration with orchestrator
- `types.ts`: Type definitions for validation results

### Testing

- `__tests__/ParameterValidation.test.ts`: Unit tests for validation logic
- `__tests__/HandlerParameterValidation.test.ts`: Integration tests

### Key Functions

- `validateParameters(intent)`: Validates all parameters for an intent
- `applyDefaultParameters(intent)`: Applies default values for optional parameters
- `formatValidationError(validation, intentType)`: Formats user-friendly error messages
- `logValidationFailure(validation, intent, requestId)`: Logs validation failures to CloudWatch

## Benefits

1. **Early Error Detection**: Catches parameter issues before tool invocation
2. **Clear Error Messages**: Users understand exactly what's wrong and how to fix it
3. **Reduced Tool Failures**: Tools receive valid parameters, reducing runtime errors
4. **Better Debugging**: Structured CloudWatch logs make troubleshooting easier
5. **Improved UX**: Users get immediate feedback on query issues

## Future Enhancements

- Add parameter validation for additional tool types
- Implement parameter suggestions based on query context
- Add parameter validation for nested/complex parameters
- Implement parameter transformation (e.g., unit conversion)
