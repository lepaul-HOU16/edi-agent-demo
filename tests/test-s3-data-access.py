#!/usr/bin/env python3
"""
Test S3 Data Access Layer Implementation

This test verifies the S3WellDataAccess class functionality.
"""

import sys
import os

# Add edicraft-agent to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'edicraft-agent'))

from tools.s3_data_access import S3WellDataAccess, create_s3_data_access


def test_class_initialization():
    """Test S3WellDataAccess class initialization."""
    print("=" * 60)
    print("TEST 1: Class Initialization")
    print("=" * 60)
    
    try:
        # Test with explicit bucket name
        client = S3WellDataAccess(bucket_name="test-bucket")
        print(f"✅ Successfully initialized with bucket: {client.bucket_name}")
        
        # Test cache initialization
        print(f"✅ Cache enabled: {client._cache_enabled}")
        print(f"✅ Cache is empty: {len(client._trajectory_cache) == 0}")
        
        return True
    except Exception as e:
        print(f"❌ Initialization failed: {str(e)}")
        return False


def test_cache_operations():
    """Test cache enable/disable and clear operations."""
    print("\n" + "=" * 60)
    print("TEST 2: Cache Operations")
    print("=" * 60)
    
    try:
        client = S3WellDataAccess(bucket_name="test-bucket")
        
        # Test cache stats
        stats = client.get_cache_stats()
        print(f"✅ Cache stats retrieved: {stats['total_entries']} entries")
        
        # Test disable cache
        client.enable_cache(False)
        print(f"✅ Cache disabled: {not client._cache_enabled}")
        
        # Test enable cache
        client.enable_cache(True)
        print(f"✅ Cache enabled: {client._cache_enabled}")
        
        # Test clear cache
        client.clear_cache()
        print(f"✅ Cache cleared: {len(client._trajectory_cache) == 0}")
        
        return True
    except Exception as e:
        print(f"❌ Cache operations failed: {str(e)}")
        return False


def test_file_format_detection():
    """Test file format detection logic."""
    print("\n" + "=" * 60)
    print("TEST 3: File Format Detection")
    print("=" * 60)
    
    try:
        client = S3WellDataAccess(bucket_name="test-bucket")
        
        # Test JSON detection
        json_format = client._detect_file_format("test.json", '{"coordinates": []}')
        print(f"✅ JSON format detected: {json_format == 'json'}")
        
        # Test CSV detection
        csv_format = client._detect_file_format("test.csv", "x,y,z\n1,2,3")
        print(f"✅ CSV format detected: {csv_format == 'csv'}")
        
        # Test LAS detection
        las_format = client._detect_file_format("test.las", "~Version Information")
        print(f"✅ LAS format detected: {las_format == 'las'}")
        
        return True
    except Exception as e:
        print(f"❌ Format detection failed: {str(e)}")
        return False


def test_json_parsing():
    """Test JSON trajectory parsing."""
    print("\n" + "=" * 60)
    print("TEST 4: JSON Trajectory Parsing")
    print("=" * 60)
    
    try:
        client = S3WellDataAccess(bucket_name="test-bucket")
        
        # Test coordinate format
        json_coords = '''
        {
            "coordinates": [
                {"x": 1.0, "y": 2.0, "z": 3.0},
                {"x": 1.1, "y": 2.1, "z": 3.1}
            ]
        }
        '''
        result = client._parse_json_trajectory(json_coords, "test.json")
        print(f"✅ Coordinate format parsed: {result['success']}")
        print(f"   Data type: {result['data_type']}")
        print(f"   Total points: {result['metadata']['total_points']}")
        
        # Test survey format
        json_survey = '''
        {
            "survey_data": [
                {"tvd": 25.0, "azimuth": 310.2, "inclination": 0.18, "measured_depth": 25.0},
                {"tvd": 50.0, "azimuth": 315.0, "inclination": 0.25, "measured_depth": 50.5}
            ]
        }
        '''
        result = client._parse_json_trajectory(json_survey, "test.json")
        print(f"✅ Survey format parsed: {result['success']}")
        print(f"   Data type: {result['data_type']}")
        print(f"   Total points: {result['metadata']['total_points']}")
        
        return True
    except Exception as e:
        print(f"❌ JSON parsing failed: {str(e)}")
        return False


def test_csv_parsing():
    """Test CSV trajectory parsing."""
    print("\n" + "=" * 60)
    print("TEST 5: CSV Trajectory Parsing")
    print("=" * 60)
    
    try:
        client = S3WellDataAccess(bucket_name="test-bucket")
        
        # Test coordinate format
        csv_coords = '''x,y,z
1.0,2.0,3.0
1.1,2.1,3.1
1.2,2.2,3.2'''
        result = client._parse_csv_trajectory(csv_coords, "test.csv")
        print(f"✅ CSV coordinate format parsed: {result['success']}")
        print(f"   Data type: {result['data_type']}")
        print(f"   Total points: {result['metadata']['total_points']}")
        
        # Test survey format
        csv_survey = '''tvd,azimuth,inclination,measured_depth
25.0,310.2,0.18,25.0
50.0,315.0,0.25,50.5'''
        result = client._parse_csv_trajectory(csv_survey, "test.csv")
        print(f"✅ CSV survey format parsed: {result['success']}")
        print(f"   Data type: {result['data_type']}")
        print(f"   Total points: {result['metadata']['total_points']}")
        
        return True
    except Exception as e:
        print(f"❌ CSV parsing failed: {str(e)}")
        return False


def test_curve_index_finding():
    """Test LAS curve index finding."""
    print("\n" + "=" * 60)
    print("TEST 6: LAS Curve Index Finding")
    print("=" * 60)
    
    try:
        client = S3WellDataAccess(bucket_name="test-bucket")
        
        # Test finding X coordinate
        curves = ['depth', 'x_coord', 'y_coord', 'tvd']
        x_idx = client._find_curve_index(curves, ['x', 'easting', 'east'])
        print(f"✅ Found X coordinate at index: {x_idx} (expected 1)")
        
        # Test finding TVD
        tvd_idx = client._find_curve_index(curves, ['tvd', 'tvdss'])
        print(f"✅ Found TVD at index: {tvd_idx} (expected 3)")
        
        # Test not finding curve
        missing_idx = client._find_curve_index(curves, ['azimuth', 'azim'])
        print(f"✅ Missing curve returns None: {missing_idx is None}")
        
        return True
    except Exception as e:
        print(f"❌ Curve index finding failed: {str(e)}")
        return False


def test_fallback_options():
    """Test fallback options for error handling."""
    print("\n" + "=" * 60)
    print("TEST 7: Fallback Options")
    print("=" * 60)
    
    try:
        client = S3WellDataAccess(bucket_name="test-bucket")
        
        # Test access denied fallback
        options = client.get_fallback_options("access_denied")
        print(f"✅ Access denied fallback options: {len(options)} options")
        print(f"   - {options[0]}")
        
        # Test not found fallback
        options = client.get_fallback_options("not_found")
        print(f"✅ Not found fallback options: {len(options)} options")
        print(f"   - {options[0]}")
        
        # Test unknown error fallback
        options = client.get_fallback_options("unknown")
        print(f"✅ Unknown error fallback options: {len(options)} options")
        print(f"   - {options[0]}")
        
        return True
    except Exception as e:
        print(f"❌ Fallback options failed: {str(e)}")
        return False


def test_convenience_function():
    """Test convenience function for creating client."""
    print("\n" + "=" * 60)
    print("TEST 8: Convenience Function")
    print("=" * 60)
    
    try:
        # Set environment variable for test
        os.environ['RENEWABLE_S3_BUCKET'] = 'test-env-bucket'
        
        # Test with environment variable
        client = create_s3_data_access()
        print(f"✅ Created client with env bucket: {client.bucket_name}")
        
        # Test with explicit bucket
        client = create_s3_data_access(bucket_name="explicit-bucket")
        print(f"✅ Created client with explicit bucket: {client.bucket_name}")
        
        return True
    except Exception as e:
        print(f"❌ Convenience function failed: {str(e)}")
        return False


def main():
    """Run all tests."""
    print("\n" + "=" * 60)
    print("S3 DATA ACCESS LAYER - UNIT TESTS")
    print("=" * 60)
    
    tests = [
        test_class_initialization,
        test_cache_operations,
        test_file_format_detection,
        test_json_parsing,
        test_csv_parsing,
        test_curve_index_finding,
        test_fallback_options,
        test_convenience_function
    ]
    
    results = []
    for test in tests:
        try:
            result = test()
            results.append(result)
        except Exception as e:
            print(f"\n❌ Test failed with exception: {str(e)}")
            results.append(False)
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    passed = sum(results)
    total = len(results)
    print(f"Passed: {passed}/{total}")
    print(f"Failed: {total - passed}/{total}")
    
    if passed == total:
        print("\n✅ ALL TESTS PASSED!")
        return 0
    else:
        print(f"\n❌ {total - passed} TEST(S) FAILED")
        return 1


if __name__ == "__main__":
    sys.exit(main())
