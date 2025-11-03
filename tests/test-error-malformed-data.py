#!/usr/bin/env python3
"""
Test error handling with malformed trajectory data.
Tests Requirements 2.2, 2.3, 2.4 - Data validation and error messages.
"""

import sys
import os
import json

# Add edicraft-agent to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'edicraft-agent'))

from tools.trajectory_tools import parse_trajectory_data, transform_coordinates_to_minecraft

def test_invalid_json():
    """Test with invalid JSON input."""
    print("=" * 80)
    print("TEST: Invalid JSON Error Handling")
    print("=" * 80)
    print()
    
    invalid_json_inputs = [
        "not json at all",
        "{invalid json}",
        "{'single': 'quotes'}",  # Python dict syntax, not JSON
        "{incomplete",
        '{"key": undefined}',  # JavaScript undefined
        "",  # Empty string
        "null",  # Just null
        "[]",  # Empty array
    ]
    
    all_passed = True
    
    for i, invalid_input in enumerate(invalid_json_inputs, 1):
        print(f"\n📋 Test {i}: Testing with invalid JSON: '{invalid_input[:50]}...'")
        print("-" * 80)
        
        try:
            result = parse_trajectory_data(invalid_input)
            
            # Should return error dict, not raise exception
            if isinstance(result, dict):
                print("✅ PASS: Function returned dict (no crash)")
                
                # Check for error indication
                if not result.get("valid", True):
                    print("✅ PASS: Result marked as invalid")
                    
                    error_msg = result.get("error", "")
                    if error_msg:
                        print(f"✅ PASS: Clear error message provided: {error_msg[:100]}...")
                    else:
                        print("❌ FAIL: No error message provided")
                        all_passed = False
                else:
                    print("❌ FAIL: Result marked as valid for invalid JSON")
                    all_passed = False
            else:
                print(f"❌ FAIL: Unexpected return type: {type(result)}")
                all_passed = False
                
        except Exception as e:
            print(f"❌ FAIL: Exception raised (should return error dict): {type(e).__name__}: {str(e)}")
            all_passed = False
    
    print()
    print("=" * 80)
    if all_passed:
        print("✅ ALL TESTS PASSED: Invalid JSON handling works correctly")
    else:
        print("❌ SOME TESTS FAILED: Invalid JSON handling needs improvement")
    print("=" * 80)
    
    return all_passed

def test_missing_required_fields():
    """Test with missing required fields in trajectory data."""
    print()
    print("=" * 80)
    print("TEST: Missing Required Fields Error Handling")
    print("=" * 80)
    print()
    
    test_cases = [
        {
            "name": "Missing x coordinate",
            "data": json.dumps({
                "trajectory_id": "TEST-001",
                "coordinates": [
                    {"y": 2.0, "z": 3.0}  # Missing x
                ]
            }),
            "expected_error": "missing required fields"
        },
        {
            "name": "Missing y coordinate",
            "data": json.dumps({
                "trajectory_id": "TEST-001",
                "coordinates": [
                    {"x": 1.0, "z": 3.0}  # Missing y
                ]
            }),
            "expected_error": "missing required fields"
        },
        {
            "name": "Missing z coordinate",
            "data": json.dumps({
                "trajectory_id": "TEST-001",
                "coordinates": [
                    {"x": 1.0, "y": 2.0}  # Missing z
                ]
            }),
            "expected_error": "missing required fields"
        },
        {
            "name": "Missing tvd in survey data",
            "data": json.dumps({
                "trajectory_id": "TEST-001",
                "survey_data": [
                    {"azimuth": 45.0, "inclination": 10.0}  # Missing tvd
                ]
            }),
            "expected_error": "missing required fields"
        },
        {
            "name": "Missing azimuth in survey data",
            "data": json.dumps({
                "trajectory_id": "TEST-001",
                "survey_data": [
                    {"tvd": 100.0, "inclination": 10.0}  # Missing azimuth
                ]
            }),
            "expected_error": "missing required fields"
        },
        {
            "name": "Missing inclination in survey data",
            "data": json.dumps({
                "trajectory_id": "TEST-001",
                "survey_data": [
                    {"tvd": 100.0, "azimuth": 45.0}  # Missing inclination
                ]
            }),
            "expected_error": "missing required fields"
        },
        {
            "name": "Empty coordinates array",
            "data": json.dumps({
                "trajectory_id": "TEST-001",
                "coordinates": []
            }),
            "expected_error": "no valid"
        },
        {
            "name": "No coordinates or survey_data",
            "data": json.dumps({
                "trajectory_id": "TEST-001"
            }),
            "expected_error": "no valid"
        },
    ]
    
    all_passed = True
    
    for test_case in test_cases:
        print(f"\n📋 Test: {test_case['name']}")
        print("-" * 80)
        
        try:
            result = parse_trajectory_data(test_case['data'])
            
            # Should return error dict
            if isinstance(result, dict):
                print("✅ PASS: Function returned dict (no crash)")
                
                # Check for error indication
                if not result.get("valid", True):
                    print("✅ PASS: Result marked as invalid")
                    
                    error_msg = result.get("error", "").lower()
                    expected = test_case['expected_error'].lower()
                    
                    if expected in error_msg:
                        print(f"✅ PASS: Error message contains expected text: '{test_case['expected_error']}'")
                        print(f"   Full error: {result.get('error', '')[:150]}...")
                    else:
                        print(f"❌ FAIL: Error message doesn't contain expected text")
                        print(f"   Expected: '{test_case['expected_error']}'")
                        print(f"   Got: {result.get('error', '')[:150]}...")
                        all_passed = False
                else:
                    print("❌ FAIL: Result marked as valid despite missing fields")
                    all_passed = False
            else:
                print(f"❌ FAIL: Unexpected return type: {type(result)}")
                all_passed = False
                
        except Exception as e:
            print(f"❌ FAIL: Exception raised: {type(e).__name__}: {str(e)}")
            all_passed = False
    
    print()
    print("=" * 80)
    if all_passed:
        print("✅ ALL TESTS PASSED: Missing fields handling works correctly")
    else:
        print("❌ SOME TESTS FAILED: Missing fields handling needs improvement")
    print("=" * 80)
    
    return all_passed

def test_non_numeric_values():
    """Test with non-numeric values in coordinate fields."""
    print()
    print("=" * 80)
    print("TEST: Non-Numeric Values Error Handling")
    print("=" * 80)
    print()
    
    test_cases = [
        {
            "name": "String value for x coordinate",
            "data": json.dumps({
                "trajectory_id": "TEST-001",
                "coordinates": [
                    {"x": "not a number", "y": 2.0, "z": 3.0}
                ]
            }),
            "expected_error": "non-numeric"
        },
        {
            "name": "Null value for coordinate",
            "data": json.dumps({
                "trajectory_id": "TEST-001",
                "coordinates": [
                    {"x": None, "y": 2.0, "z": 3.0}
                ]
            }),
            "expected_error": "non-numeric"
        },
        {
            "name": "Boolean value for coordinate",
            "data": json.dumps({
                "trajectory_id": "TEST-001",
                "coordinates": [
                    {"x": True, "y": 2.0, "z": 3.0}
                ]
            }),
            "expected_error": "non-numeric"
        },
        {
            "name": "Object value for coordinate",
            "data": json.dumps({
                "trajectory_id": "TEST-001",
                "coordinates": [
                    {"x": {"nested": "object"}, "y": 2.0, "z": 3.0}
                ]
            }),
            "expected_error": "non-numeric"
        },
        {
            "name": "Array value for coordinate",
            "data": json.dumps({
                "trajectory_id": "TEST-001",
                "coordinates": [
                    {"x": [1, 2, 3], "y": 2.0, "z": 3.0}
                ]
            }),
            "expected_error": "non-numeric"
        },
    ]
    
    all_passed = True
    
    for test_case in test_cases:
        print(f"\n📋 Test: {test_case['name']}")
        print("-" * 80)
        
        try:
            result = parse_trajectory_data(test_case['data'])
            
            # Should return error dict
            if isinstance(result, dict):
                print("✅ PASS: Function returned dict (no crash)")
                
                # Check for error indication
                if not result.get("valid", True):
                    print("✅ PASS: Result marked as invalid")
                    
                    error_msg = result.get("error", "").lower()
                    expected = test_case['expected_error'].lower()
                    
                    if expected in error_msg:
                        print(f"✅ PASS: Error message contains expected text: '{test_case['expected_error']}'")
                    else:
                        print(f"⚠️  WARNING: Error message doesn't contain expected text (but still invalid)")
                        print(f"   Expected: '{test_case['expected_error']}'")
                        print(f"   Got: {result.get('error', '')[:150]}...")
                else:
                    print("❌ FAIL: Result marked as valid despite non-numeric values")
                    all_passed = False
            else:
                print(f"❌ FAIL: Unexpected return type: {type(result)}")
                all_passed = False
                
        except Exception as e:
            print(f"❌ FAIL: Exception raised: {type(e).__name__}: {str(e)}")
            all_passed = False
    
    print()
    print("=" * 80)
    if all_passed:
        print("✅ ALL TESTS PASSED: Non-numeric values handling works correctly")
    else:
        print("❌ SOME TESTS FAILED: Non-numeric values handling needs improvement")
    print("=" * 80)
    
    return all_passed

def test_wrong_data_structure():
    """Test with wrong data structure (not array, not object, etc.)."""
    print()
    print("=" * 80)
    print("TEST: Wrong Data Structure Error Handling")
    print("=" * 80)
    print()
    
    test_cases = [
        {
            "name": "Coordinates as string instead of array",
            "data": json.dumps({
                "trajectory_id": "TEST-001",
                "coordinates": "not an array"
            }),
            "expected_error": "must be an array"
        },
        {
            "name": "Coordinates as number instead of array",
            "data": json.dumps({
                "trajectory_id": "TEST-001",
                "coordinates": 123
            }),
            "expected_error": "must be an array"
        },
        {
            "name": "Coordinate point as array instead of object",
            "data": json.dumps({
                "trajectory_id": "TEST-001",
                "coordinates": [
                    [1.0, 2.0, 3.0]  # Array instead of object
                ]
            }),
            "expected_error": "must be an object"
        },
        {
            "name": "Coordinate point as string",
            "data": json.dumps({
                "trajectory_id": "TEST-001",
                "coordinates": [
                    "1.0, 2.0, 3.0"  # String instead of object
                ]
            }),
            "expected_error": "must be an object"
        },
    ]
    
    all_passed = True
    
    for test_case in test_cases:
        print(f"\n📋 Test: {test_case['name']}")
        print("-" * 80)
        
        try:
            result = parse_trajectory_data(test_case['data'])
            
            # Should return error dict
            if isinstance(result, dict):
                print("✅ PASS: Function returned dict (no crash)")
                
                # Check for error indication
                if not result.get("valid", True):
                    print("✅ PASS: Result marked as invalid")
                    
                    error_msg = result.get("error", "").lower()
                    expected = test_case['expected_error'].lower()
                    
                    if expected in error_msg:
                        print(f"✅ PASS: Error message contains expected text: '{test_case['expected_error']}'")
                    else:
                        print(f"⚠️  WARNING: Error message doesn't contain expected text (but still invalid)")
                        print(f"   Expected: '{test_case['expected_error']}'")
                        print(f"   Got: {result.get('error', '')[:150]}...")
                else:
                    print("❌ FAIL: Result marked as valid despite wrong structure")
                    all_passed = False
            else:
                print(f"❌ FAIL: Unexpected return type: {type(result)}")
                all_passed = False
                
        except Exception as e:
            print(f"❌ FAIL: Exception raised: {type(e).__name__}: {str(e)}")
            all_passed = False
    
    print()
    print("=" * 80)
    if all_passed:
        print("✅ ALL TESTS PASSED: Wrong structure handling works correctly")
    else:
        print("❌ SOME TESTS FAILED: Wrong structure handling needs improvement")
    print("=" * 80)
    
    return all_passed

if __name__ == "__main__":
    print("\n" + "=" * 80)
    print("ERROR HANDLING TEST SUITE: Malformed Data")
    print("Testing Requirements 2.2, 2.3, 2.4")
    print("=" * 80)
    
    test1_passed = test_invalid_json()
    test2_passed = test_missing_required_fields()
    test3_passed = test_non_numeric_values()
    test4_passed = test_wrong_data_structure()
    
    print("\n" + "=" * 80)
    print("FINAL RESULTS")
    print("=" * 80)
    print(f"Invalid JSON Test: {'✅ PASSED' if test1_passed else '❌ FAILED'}")
    print(f"Missing Fields Test: {'✅ PASSED' if test2_passed else '❌ FAILED'}")
    print(f"Non-Numeric Values Test: {'✅ PASSED' if test3_passed else '❌ FAILED'}")
    print(f"Wrong Structure Test: {'✅ PASSED' if test4_passed else '❌ FAILED'}")
    print("=" * 80)
    
    all_passed = test1_passed and test2_passed and test3_passed and test4_passed
    sys.exit(0 if all_passed else 1)
