#!/usr/bin/env python3
"""
Test script for trajectory data parser functionality.
Tests the parse_trajectory_data function with various input formats.
"""

import sys
import os
import json

# Add edicraft-agent to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'edicraft-agent'))

from tools.trajectory_tools import parse_trajectory_data

def test_valid_coordinates():
    """Test parsing valid coordinate data"""
    print("Test 1: Valid coordinates format")
    
    test_data = {
        "trajectory_id": "WELL-005",
        "wellbore_id": "WELL-005-WB",
        "data_type": "coordinates",
        "coordinates": [
            {"x": 1.0, "y": 2.0, "z": 3.0},
            {"x": 1.5, "y": 2.1, "z": 3.5},
            {"x": 2.0, "y": 2.2, "z": 4.0}
        ],
        "survey_data": None,
        "metadata": {
            "total_points": 3,
            "source": "OSDU"
        }
    }
    
    result = parse_trajectory_data(json.dumps(test_data))
    
    assert result["valid"] == True, "Should be valid"
    assert result["format"] == "coordinates", "Should detect coordinates format"
    assert len(result["data"]) == 3, "Should have 3 coordinates"
    assert result["error"] is None, "Should have no error"
    
    print("✅ PASS: Valid coordinates parsed correctly")
    print(f"   Format: {result['format']}, Points: {result['metadata']['total_points']}")
    return True

def test_valid_survey_data():
    """Test parsing valid survey data"""
    print("\nTest 2: Valid survey data format")
    
    test_data = {
        "trajectory_id": "WELL-005",
        "wellbore_id": "WELL-005-WB",
        "data_type": "survey",
        "coordinates": None,
        "survey_data": [
            {"tvd": 25.0, "azimuth": 310.2, "inclination": 0.18},
            {"tvd": 50.0, "azimuth": 315.5, "inclination": 0.25},
            {"tvd": 75.0, "azimuth": 320.0, "inclination": 0.30}
        ],
        "metadata": {
            "total_points": 3,
            "source": "OSDU"
        }
    }
    
    result = parse_trajectory_data(json.dumps(test_data))
    
    assert result["valid"] == True, "Should be valid"
    assert result["format"] == "survey", "Should detect survey format"
    assert len(result["data"]) == 3, "Should have 3 survey points"
    assert result["error"] is None, "Should have no error"
    
    print("✅ PASS: Valid survey data parsed correctly")
    print(f"   Format: {result['format']}, Points: {result['metadata']['total_points']}")
    return True

def test_missing_coordinate_fields():
    """Test validation catches missing coordinate fields"""
    print("\nTest 3: Missing coordinate fields")
    
    test_data = {
        "trajectory_id": "WELL-005",
        "coordinates": [
            {"x": 1.0, "y": 2.0},  # Missing z
            {"x": 1.5, "y": 2.1, "z": 3.5}
        ]
    }
    
    result = parse_trajectory_data(json.dumps(test_data))
    
    assert result["valid"] == False, "Should be invalid"
    assert result["format"] == "coordinates", "Should detect coordinates format"
    assert "missing required fields" in result["error"].lower(), "Should mention missing fields"
    assert "z" in result["error"], "Should mention missing z field"
    
    print("✅ PASS: Missing fields detected correctly")
    print(f"   Error: {result['error']}")
    return True

def test_missing_survey_fields():
    """Test validation catches missing survey fields"""
    print("\nTest 4: Missing survey fields")
    
    test_data = {
        "trajectory_id": "WELL-005",
        "survey_data": [
            {"tvd": 25.0, "azimuth": 310.2},  # Missing inclination
            {"tvd": 50.0, "azimuth": 315.5, "inclination": 0.25}
        ]
    }
    
    result = parse_trajectory_data(json.dumps(test_data))
    
    assert result["valid"] == False, "Should be invalid"
    assert result["format"] == "survey", "Should detect survey format"
    assert "missing required fields" in result["error"].lower(), "Should mention missing fields"
    assert "inclination" in result["error"], "Should mention missing inclination field"
    
    print("✅ PASS: Missing survey fields detected correctly")
    print(f"   Error: {result['error']}")
    return True

def test_invalid_json():
    """Test handling of invalid JSON"""
    print("\nTest 5: Invalid JSON input")
    
    invalid_json = "{ this is not valid json }"
    
    result = parse_trajectory_data(invalid_json)
    
    assert result["valid"] == False, "Should be invalid"
    assert result["format"] == "unknown", "Should be unknown format"
    assert "json parsing failed" in result["error"].lower(), "Should mention JSON parsing error"
    
    print("✅ PASS: Invalid JSON handled gracefully")
    print(f"   Error: {result['error']}")
    return True

def test_non_numeric_values():
    """Test validation catches non-numeric coordinate values"""
    print("\nTest 6: Non-numeric coordinate values")
    
    test_data = {
        "trajectory_id": "WELL-005",
        "coordinates": [
            {"x": "not a number", "y": 2.0, "z": 3.0}
        ]
    }
    
    result = parse_trajectory_data(json.dumps(test_data))
    
    assert result["valid"] == False, "Should be invalid"
    assert "non-numeric" in result["error"].lower(), "Should mention non-numeric value"
    
    print("✅ PASS: Non-numeric values detected correctly")
    print(f"   Error: {result['error']}")
    return True

def test_osdu_error_response():
    """Test handling of OSDU error responses"""
    print("\nTest 7: OSDU error response")
    
    test_data = {
        "error": "No trajectory record found for: WELL-999",
        "trajectory_id": "WELL-999",
        "success": False
    }
    
    result = parse_trajectory_data(json.dumps(test_data))
    
    assert result["valid"] == False, "Should be invalid"
    assert "osdu error" in result["error"].lower(), "Should mention OSDU error"
    
    print("✅ PASS: OSDU error response handled correctly")
    print(f"   Error: {result['error']}")
    return True

def test_no_valid_data():
    """Test handling when neither coordinates nor survey_data present"""
    print("\nTest 8: No valid data format")
    
    test_data = {
        "trajectory_id": "WELL-005",
        "some_other_field": "value"
    }
    
    result = parse_trajectory_data(json.dumps(test_data))
    
    assert result["valid"] == False, "Should be invalid"
    assert result["format"] == "unknown", "Should be unknown format"
    assert "no valid coordinates or survey_data" in result["error"].lower(), "Should mention missing data"
    
    print("✅ PASS: Missing data format detected correctly")
    print(f"   Error: {result['error']}")
    return True

def main():
    """Run all tests"""
    print("=" * 60)
    print("Testing Trajectory Data Parser")
    print("=" * 60)
    
    tests = [
        test_valid_coordinates,
        test_valid_survey_data,
        test_missing_coordinate_fields,
        test_missing_survey_fields,
        test_invalid_json,
        test_non_numeric_values,
        test_osdu_error_response,
        test_no_valid_data
    ]
    
    passed = 0
    failed = 0
    
    for test in tests:
        try:
            if test():
                passed += 1
        except AssertionError as e:
            print(f"❌ FAIL: {e}")
            failed += 1
        except Exception as e:
            print(f"❌ ERROR: {e}")
            failed += 1
    
    print("\n" + "=" * 60)
    print(f"Test Results: {passed} passed, {failed} failed")
    print("=" * 60)
    
    return failed == 0

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
