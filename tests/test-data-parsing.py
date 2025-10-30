#!/usr/bin/env python3
"""
Test trajectory data parsing functionality.
Tests subtask 5.2: Verify parser detects format, validates data, and handles errors.
"""

import sys
import os
import json

# Add edicraft-agent to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'edicraft-agent'))

from tools.trajectory_tools import parse_trajectory_data
from tools.osdu_client import get_trajectory_coordinates_live

def test_parse_valid_coordinate_data():
    """Test parsing valid coordinate data."""
    print("=" * 80)
    print("TEST 5.2.1: Parse Valid Coordinate Data")
    print("=" * 80)
    print()
    
    # Create valid coordinate data
    valid_data = {
        "trajectory_id": "TEST-001",
        "wellbore_id": "WELL-001",
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
    
    trajectory_json = json.dumps(valid_data)
    
    print(f"📊 Input data:")
    print(f"   Format: coordinates")
    print(f"   Points: {len(valid_data['coordinates'])}")
    print()
    
    try:
        result = parse_trajectory_data(trajectory_json)
        
        print(f"📊 Parser result:")
        print(f"   Format detected: {result['format']}")
        print(f"   Valid: {result['valid']}")
        print(f"   Error: {result['error']}")
        print()
        
        # Verify format detection
        if result['format'] != 'coordinates':
            print(f"❌ FAILED: Expected format 'coordinates', got '{result['format']}'")
            return False
        
        print(f"✅ Format correctly detected as 'coordinates'")
        print()
        
        # Verify validation passes
        if not result['valid']:
            print(f"❌ FAILED: Validation failed for valid data")
            print(f"   Error: {result['error']}")
            return False
        
        print(f"✅ Validation passed for valid data")
        print()
        
        # Verify data is returned
        if not result['data']:
            print(f"❌ FAILED: No data returned")
            return False
        
        if len(result['data']) != 3:
            print(f"❌ FAILED: Expected 3 coordinates, got {len(result['data'])}")
            return False
        
        print(f"✅ Data returned correctly ({len(result['data'])} points)")
        print()
        
        # Verify metadata
        metadata = result.get('metadata', {})
        if metadata.get('total_points') != 3:
            print(f"⚠️  WARNING: Metadata total_points mismatch")
        else:
            print(f"✅ Metadata correct (total_points: {metadata['total_points']})")
        print()
        
        print("✅ TEST PASSED: Valid coordinate data parsed correctly")
        print()
        return True
        
    except Exception as e:
        print(f"❌ FAILED: Unexpected error")
        print(f"   Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_parse_valid_survey_data():
    """Test parsing valid survey data."""
    print("=" * 80)
    print("TEST 5.2.2: Parse Valid Survey Data")
    print("=" * 80)
    print()
    
    # Create valid survey data
    valid_data = {
        "trajectory_id": "TEST-002",
        "wellbore_id": "WELL-002",
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
    
    trajectory_json = json.dumps(valid_data)
    
    print(f"📊 Input data:")
    print(f"   Format: survey")
    print(f"   Points: {len(valid_data['survey_data'])}")
    print()
    
    try:
        result = parse_trajectory_data(trajectory_json)
        
        print(f"📊 Parser result:")
        print(f"   Format detected: {result['format']}")
        print(f"   Valid: {result['valid']}")
        print(f"   Error: {result['error']}")
        print()
        
        # Verify format detection
        if result['format'] != 'survey':
            print(f"❌ FAILED: Expected format 'survey', got '{result['format']}'")
            return False
        
        print(f"✅ Format correctly detected as 'survey'")
        print()
        
        # Verify validation passes
        if not result['valid']:
            print(f"❌ FAILED: Validation failed for valid data")
            print(f"   Error: {result['error']}")
            return False
        
        print(f"✅ Validation passed for valid data")
        print()
        
        print("✅ TEST PASSED: Valid survey data parsed correctly")
        print()
        return True
        
    except Exception as e:
        print(f"❌ FAILED: Unexpected error")
        print(f"   Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_parse_invalid_json():
    """Test error handling for invalid JSON."""
    print("=" * 80)
    print("TEST 5.2.3: Parse Invalid JSON")
    print("=" * 80)
    print()
    
    invalid_json = "{ this is not valid JSON }"
    
    print(f"📊 Input: Invalid JSON string")
    print()
    
    try:
        result = parse_trajectory_data(invalid_json)
        
        print(f"📊 Parser result:")
        print(f"   Format: {result['format']}")
        print(f"   Valid: {result['valid']}")
        print(f"   Error: {result['error']}")
        print()
        
        # Verify format is unknown
        if result['format'] != 'unknown':
            print(f"❌ FAILED: Expected format 'unknown', got '{result['format']}'")
            return False
        
        print(f"✅ Format correctly set to 'unknown'")
        print()
        
        # Verify validation fails
        if result['valid']:
            print(f"❌ FAILED: Validation should fail for invalid JSON")
            return False
        
        print(f"✅ Validation correctly failed")
        print()
        
        # Verify error message is present
        if not result['error']:
            print(f"❌ FAILED: No error message provided")
            return False
        
        if "JSON parsing failed" not in result['error']:
            print(f"⚠️  WARNING: Error message doesn't mention JSON parsing")
            print(f"   Error: {result['error']}")
        else:
            print(f"✅ Error message mentions JSON parsing")
        print()
        
        print("✅ TEST PASSED: Invalid JSON handled correctly")
        print()
        return True
        
    except Exception as e:
        print(f"❌ FAILED: Unexpected exception (should be caught)")
        print(f"   Error: {str(e)}")
        return False

def test_parse_missing_fields():
    """Test error handling for missing required fields."""
    print("=" * 80)
    print("TEST 5.2.4: Parse Data with Missing Fields")
    print("=" * 80)
    print()
    
    # Create data with missing z field in coordinates
    invalid_data = {
        "trajectory_id": "TEST-003",
        "data_type": "coordinates",
        "coordinates": [
            {"x": 1.0, "y": 2.0},  # Missing z
            {"x": 1.5, "y": 2.1, "z": 3.5}
        ],
        "metadata": {"total_points": 2}
    }
    
    trajectory_json = json.dumps(invalid_data)
    
    print(f"📊 Input data:")
    print(f"   Format: coordinates")
    print(f"   Issue: First coordinate missing 'z' field")
    print()
    
    try:
        result = parse_trajectory_data(trajectory_json)
        
        print(f"📊 Parser result:")
        print(f"   Format: {result['format']}")
        print(f"   Valid: {result['valid']}")
        print(f"   Error: {result['error']}")
        print()
        
        # Verify validation fails
        if result['valid']:
            print(f"❌ FAILED: Validation should fail for missing fields")
            return False
        
        print(f"✅ Validation correctly failed")
        print()
        
        # Verify error message mentions missing field
        if not result['error']:
            print(f"❌ FAILED: No error message provided")
            return False
        
        if "missing" not in result['error'].lower():
            print(f"⚠️  WARNING: Error message doesn't mention missing fields")
            print(f"   Error: {result['error']}")
        else:
            print(f"✅ Error message mentions missing fields")
        print()
        
        print("✅ TEST PASSED: Missing fields detected correctly")
        print()
        return True
        
    except Exception as e:
        print(f"❌ FAILED: Unexpected exception")
        print(f"   Error: {str(e)}")
        return False

def test_parse_well005_data():
    """Test parsing actual WELL-005 data from OSDU."""
    print("=" * 80)
    print("TEST 5.2.5: Parse Actual WELL-005 Data")
    print("=" * 80)
    print()
    
    trajectory_id = "WELL-005"
    
    print(f"📡 Fetching data for: {trajectory_id}")
    print()
    
    try:
        # Get real data from OSDU
        trajectory_data = get_trajectory_coordinates_live(trajectory_id)
        
        # Parse the data
        result = parse_trajectory_data(trajectory_data)
        
        print(f"📊 Parser result:")
        print(f"   Format detected: {result['format']}")
        print(f"   Valid: {result['valid']}")
        print(f"   Error: {result['error']}")
        print()
        
        if result['metadata']:
            print(f"📊 Metadata:")
            for key, value in result['metadata'].items():
                print(f"   - {key}: {value}")
            print()
        
        # Verify validation passes
        if not result['valid']:
            print(f"❌ FAILED: Validation failed for WELL-005 data")
            print(f"   Error: {result['error']}")
            return False
        
        print(f"✅ Validation passed for WELL-005 data")
        print()
        
        # Verify format is recognized
        if result['format'] not in ['coordinates', 'survey']:
            print(f"❌ FAILED: Unrecognized format: {result['format']}")
            return False
        
        print(f"✅ Format recognized: {result['format']}")
        print()
        
        # Verify data is present
        if not result['data']:
            print(f"❌ FAILED: No data returned")
            return False
        
        print(f"✅ Data returned: {len(result['data'])} points")
        print()
        
        print("✅ TEST PASSED: WELL-005 data parsed successfully")
        print()
        return True
        
    except Exception as e:
        print(f"❌ FAILED: Unexpected error")
        print(f"   Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def run_all_tests():
    """Run all data parsing tests."""
    print()
    print("=" * 80)
    print("TRAJECTORY DATA PARSING TEST SUITE")
    print("Testing Requirements 2.1, 2.2")
    print("=" * 80)
    print()
    
    tests = [
        ("Valid Coordinate Data", test_parse_valid_coordinate_data),
        ("Valid Survey Data", test_parse_valid_survey_data),
        ("Invalid JSON", test_parse_invalid_json),
        ("Missing Fields", test_parse_missing_fields),
        ("WELL-005 Real Data", test_parse_well005_data)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            success = test_func()
            results.append((test_name, success))
        except Exception as e:
            print(f"❌ Test '{test_name}' crashed: {str(e)}")
            results.append((test_name, False))
    
    # Print summary
    print()
    print("=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    print()
    
    passed = sum(1 for _, success in results if success)
    total = len(results)
    
    for test_name, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
    
    print()
    print(f"Results: {passed}/{total} tests passed")
    print()
    
    if passed == total:
        print("✅ ALL TESTS PASSED")
        print()
        print("Requirements 2.1, 2.2: ✅ SATISFIED")
        print()
        return True
    else:
        print(f"❌ {total - passed} TEST(S) FAILED")
        print()
        return False

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
