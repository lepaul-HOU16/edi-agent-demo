#!/usr/bin/env python3
"""
Standalone test for trajectory data parser functionality.
Tests the parse_trajectory_data function logic directly.
"""

import json
from typing import Dict, Any

def parse_trajectory_data(trajectory_json: str) -> Dict[str, Any]:
    """
    Parse trajectory data and determine format.
    Validates structure and detects whether data is in coordinates or survey format.
    
    This is a copy of the implementation for testing purposes.
    """
    try:
        # Parse JSON input
        data = json.loads(trajectory_json)
        
        # Check if we have coordinates format
        if "coordinates" in data and data["coordinates"]:
            coordinates = data["coordinates"]
            
            # Validate coordinates structure
            if not isinstance(coordinates, list):
                return {
                    "format": "unknown",
                    "data": None,
                    "valid": False,
                    "error": "Coordinates field must be an array",
                    "metadata": {}
                }
            
            # Validate each coordinate has x, y, z fields
            required_fields = ["x", "y", "z"]
            for i, coord in enumerate(coordinates):
                if not isinstance(coord, dict):
                    return {
                        "format": "unknown",
                        "data": None,
                        "valid": False,
                        "error": f"Coordinate at index {i} must be an object with x, y, z fields",
                        "metadata": {}
                    }
                
                missing_fields = [field for field in required_fields if field not in coord]
                if missing_fields:
                    return {
                        "format": "coordinates",
                        "data": None,
                        "valid": False,
                        "error": f"Coordinate at index {i} missing required fields: {', '.join(missing_fields)}",
                        "metadata": {"total_points": len(coordinates)}
                    }
                
                # Validate that values are numeric
                for field in required_fields:
                    try:
                        float(coord[field])
                    except (ValueError, TypeError):
                        return {
                            "format": "coordinates",
                            "data": None,
                            "valid": False,
                            "error": f"Coordinate at index {i} has non-numeric value for field '{field}': {coord[field]}",
                            "metadata": {"total_points": len(coordinates)}
                        }
            
            # Valid coordinates format
            return {
                "format": "coordinates",
                "data": coordinates,
                "valid": True,
                "error": None,
                "metadata": {
                    "total_points": len(coordinates),
                    "trajectory_id": data.get("trajectory_id", "unknown"),
                    "wellbore_id": data.get("wellbore_id", "unknown"),
                    "source": data.get("metadata", {}).get("source", "unknown")
                }
            }
        
        # Check if we have survey data format
        if "survey_data" in data and data["survey_data"]:
            survey_data = data["survey_data"]
            
            # Validate survey data structure
            if not isinstance(survey_data, list):
                return {
                    "format": "unknown",
                    "data": None,
                    "valid": False,
                    "error": "Survey_data field must be an array",
                    "metadata": {}
                }
            
            # Validate each survey point has required fields
            required_fields = ["tvd", "azimuth", "inclination"]
            for i, point in enumerate(survey_data):
                if not isinstance(point, dict):
                    return {
                        "format": "unknown",
                        "data": None,
                        "valid": False,
                        "error": f"Survey point at index {i} must be an object with tvd, azimuth, inclination fields",
                        "metadata": {}
                    }
                
                missing_fields = [field for field in required_fields if field not in point]
                if missing_fields:
                    return {
                        "format": "survey",
                        "data": None,
                        "valid": False,
                        "error": f"Survey point at index {i} missing required fields: {', '.join(missing_fields)}",
                        "metadata": {"total_points": len(survey_data)}
                    }
                
                # Validate that values are numeric
                for field in required_fields:
                    try:
                        float(point[field])
                    except (ValueError, TypeError):
                        return {
                            "format": "survey",
                            "data": None,
                            "valid": False,
                            "error": f"Survey point at index {i} has non-numeric value for field '{field}': {point[field]}",
                            "metadata": {"total_points": len(survey_data)}
                        }
            
            # Valid survey data format
            return {
                "format": "survey",
                "data": survey_data,
                "valid": True,
                "error": None,
                "metadata": {
                    "total_points": len(survey_data),
                    "trajectory_id": data.get("trajectory_id", "unknown"),
                    "wellbore_id": data.get("wellbore_id", "unknown"),
                    "source": data.get("metadata", {}).get("source", "unknown")
                }
            }
        
        # Check if this is an error response from OSDU
        if "error" in data:
            return {
                "format": "unknown",
                "data": None,
                "valid": False,
                "error": f"OSDU error: {data['error']}",
                "metadata": {
                    "trajectory_id": data.get("trajectory_id", "unknown"),
                    "wellbore_id": data.get("wellbore_id", "unknown")
                }
            }
        
        # No valid data format found
        available_keys = list(data.keys())
        return {
            "format": "unknown",
            "data": None,
            "valid": False,
            "error": f"No valid coordinates or survey_data found. Available keys: {', '.join(available_keys)}",
            "metadata": {
                "available_keys": available_keys,
                "trajectory_id": data.get("trajectory_id", "unknown")
            }
        }
    
    except json.JSONDecodeError as e:
        return {
            "format": "unknown",
            "data": None,
            "valid": False,
            "error": f"JSON parsing failed: {str(e)}. Input must be valid JSON string.",
            "metadata": {}
        }
    except Exception as e:
        return {
            "format": "unknown",
            "data": None,
            "valid": False,
            "error": f"Unexpected error parsing trajectory data: {str(e)}",
            "metadata": {}
        }

def run_tests():
    """Run all validation tests"""
    print("=" * 60)
    print("Testing Trajectory Data Parser")
    print("=" * 60)
    
    passed = 0
    failed = 0
    
    # Test 1: Valid coordinates
    print("\nTest 1: Valid coordinates format")
    test_data = {
        "trajectory_id": "WELL-005",
        "coordinates": [
            {"x": 1.0, "y": 2.0, "z": 3.0},
            {"x": 1.5, "y": 2.1, "z": 3.5}
        ],
        "metadata": {"source": "OSDU"}
    }
    result = parse_trajectory_data(json.dumps(test_data))
    if result["valid"] and result["format"] == "coordinates" and len(result["data"]) == 2:
        print("✅ PASS")
        passed += 1
    else:
        print(f"❌ FAIL: {result}")
        failed += 1
    
    # Test 2: Valid survey data
    print("\nTest 2: Valid survey data format")
    test_data = {
        "trajectory_id": "WELL-005",
        "survey_data": [
            {"tvd": 25.0, "azimuth": 310.2, "inclination": 0.18},
            {"tvd": 50.0, "azimuth": 315.5, "inclination": 0.25}
        ]
    }
    result = parse_trajectory_data(json.dumps(test_data))
    if result["valid"] and result["format"] == "survey" and len(result["data"]) == 2:
        print("✅ PASS")
        passed += 1
    else:
        print(f"❌ FAIL: {result}")
        failed += 1
    
    # Test 3: Missing coordinate field
    print("\nTest 3: Missing coordinate field (z)")
    test_data = {
        "coordinates": [{"x": 1.0, "y": 2.0}]
    }
    result = parse_trajectory_data(json.dumps(test_data))
    if not result["valid"] and "missing required fields" in result["error"].lower() and "z" in result["error"]:
        print(f"✅ PASS - Error: {result['error']}")
        passed += 1
    else:
        print(f"❌ FAIL: {result}")
        failed += 1
    
    # Test 4: Missing survey field
    print("\nTest 4: Missing survey field (inclination)")
    test_data = {
        "survey_data": [{"tvd": 25.0, "azimuth": 310.2}]
    }
    result = parse_trajectory_data(json.dumps(test_data))
    if not result["valid"] and "missing required fields" in result["error"].lower() and "inclination" in result["error"]:
        print(f"✅ PASS - Error: {result['error']}")
        passed += 1
    else:
        print(f"❌ FAIL: {result}")
        failed += 1
    
    # Test 5: Invalid JSON
    print("\nTest 5: Invalid JSON")
    result = parse_trajectory_data("{ invalid json }")
    if not result["valid"] and "json parsing failed" in result["error"].lower():
        print(f"✅ PASS - Error: {result['error']}")
        passed += 1
    else:
        print(f"❌ FAIL: {result}")
        failed += 1
    
    # Test 6: Non-numeric value
    print("\nTest 6: Non-numeric coordinate value")
    test_data = {
        "coordinates": [{"x": "not a number", "y": 2.0, "z": 3.0}]
    }
    result = parse_trajectory_data(json.dumps(test_data))
    if not result["valid"] and "non-numeric" in result["error"].lower():
        print(f"✅ PASS - Error: {result['error']}")
        passed += 1
    else:
        print(f"❌ FAIL: {result}")
        failed += 1
    
    # Test 7: OSDU error response
    print("\nTest 7: OSDU error response")
    test_data = {
        "error": "No trajectory record found",
        "trajectory_id": "WELL-999"
    }
    result = parse_trajectory_data(json.dumps(test_data))
    if not result["valid"] and "osdu error" in result["error"].lower():
        print(f"✅ PASS - Error: {result['error']}")
        passed += 1
    else:
        print(f"❌ FAIL: {result}")
        failed += 1
    
    # Test 8: No valid data
    print("\nTest 8: No valid data format")
    test_data = {
        "trajectory_id": "WELL-005",
        "some_field": "value"
    }
    result = parse_trajectory_data(json.dumps(test_data))
    if not result["valid"] and "no valid coordinates or survey_data" in result["error"].lower():
        print(f"✅ PASS - Error: {result['error']}")
        passed += 1
    else:
        print(f"❌ FAIL: {result}")
        failed += 1
    
    print("\n" + "=" * 60)
    print(f"Test Results: {passed} passed, {failed} failed")
    print("=" * 60)
    
    return failed == 0

if __name__ == "__main__":
    import sys
    success = run_tests()
    sys.exit(0 if success else 1)
