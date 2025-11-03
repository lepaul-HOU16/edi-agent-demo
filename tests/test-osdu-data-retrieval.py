#!/usr/bin/env python3
"""
Test OSDU data retrieval for WELL-005 trajectory.
Tests subtask 5.1: Verify JSON structure, coordinates presence, and metadata fields.
"""

import sys
import os
import json

# Add edicraft-agent to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'edicraft-agent'))

from tools.osdu_client import get_trajectory_coordinates_live

def test_osdu_data_retrieval():
    """Test OSDU data retrieval for WELL-005."""
    print("=" * 80)
    print("TEST 5.1: OSDU Data Retrieval for WELL-005")
    print("=" * 80)
    print()
    
    # Test with WELL-005 trajectory ID
    # Note: You may need to adjust this ID based on actual OSDU data
    trajectory_id = "WELL-005"
    
    print(f"📡 Fetching trajectory data for: {trajectory_id}")
    print()
    
    try:
        # Call OSDU client
        result = get_trajectory_coordinates_live(trajectory_id)
        
        print("✅ OSDU call completed")
        print()
        
        # Parse JSON response
        try:
            data = json.loads(result)
            print("✅ Response is valid JSON")
            print()
        except json.JSONDecodeError as e:
            print(f"❌ FAILED: Response is not valid JSON")
            print(f"   Error: {e}")
            print(f"   Response: {result[:500]}...")
            return False
        
        # Check for success field
        if "success" in data:
            print(f"📊 Success field: {data['success']}")
        
        # Check for error
        if "error" in data:
            print(f"⚠️  Error field present: {data['error']}")
            if not data.get("success", False):
                print(f"❌ FAILED: OSDU returned error")
                return False
        
        print()
        print("=" * 80)
        print("JSON STRUCTURE VALIDATION")
        print("=" * 80)
        print()
        
        # Verify required top-level fields
        required_fields = ["trajectory_id", "data_type", "metadata"]
        missing_fields = [f for f in required_fields if f not in data]
        
        if missing_fields:
            print(f"❌ FAILED: Missing required fields: {', '.join(missing_fields)}")
            print(f"   Available fields: {', '.join(data.keys())}")
            return False
        
        print("✅ All required top-level fields present:")
        for field in required_fields:
            print(f"   - {field}: {type(data[field]).__name__}")
        print()
        
        # Verify trajectory_id matches
        if data["trajectory_id"] != trajectory_id:
            print(f"⚠️  WARNING: trajectory_id mismatch")
            print(f"   Expected: {trajectory_id}")
            print(f"   Got: {data['trajectory_id']}")
        else:
            print(f"✅ trajectory_id matches: {data['trajectory_id']}")
        print()
        
        # Verify data_type
        print(f"📊 data_type: {data['data_type']}")
        if data["data_type"] not in ["coordinates", "survey"]:
            print(f"⚠️  WARNING: Unexpected data_type: {data['data_type']}")
        else:
            print(f"✅ data_type is valid")
        print()
        
        print("=" * 80)
        print("COORDINATES VALIDATION")
        print("=" * 80)
        print()
        
        # Check for coordinates or survey_data
        has_coordinates = "coordinates" in data and data["coordinates"]
        has_survey = "survey_data" in data and data["survey_data"]
        
        if not has_coordinates and not has_survey:
            print(f"❌ FAILED: No coordinates or survey_data found")
            print(f"   Available fields: {', '.join(data.keys())}")
            return False
        
        if has_coordinates:
            coordinates = data["coordinates"]
            print(f"✅ Coordinates field present")
            print(f"   Type: {type(coordinates).__name__}")
            print(f"   Count: {len(coordinates)}")
            print()
            
            # Verify coordinates structure
            if not isinstance(coordinates, list):
                print(f"❌ FAILED: Coordinates is not a list")
                return False
            
            if len(coordinates) == 0:
                print(f"❌ FAILED: Coordinates list is empty")
                return False
            
            print(f"✅ Coordinates is a non-empty list")
            print()
            
            # Check first coordinate structure
            first_coord = coordinates[0]
            print(f"📊 First coordinate structure:")
            print(f"   Type: {type(first_coord).__name__}")
            
            if isinstance(first_coord, dict):
                print(f"   Fields: {', '.join(first_coord.keys())}")
                
                # Verify x, y, z fields
                required_coord_fields = ["x", "y", "z"]
                missing_coord_fields = [f for f in required_coord_fields if f not in first_coord]
                
                if missing_coord_fields:
                    print(f"❌ FAILED: First coordinate missing fields: {', '.join(missing_coord_fields)}")
                    return False
                
                print(f"✅ First coordinate has all required fields (x, y, z)")
                print()
                
                # Show sample coordinates
                print(f"📊 Sample coordinates (first 3):")
                for i, coord in enumerate(coordinates[:3]):
                    print(f"   Point {i+1}: x={coord['x']:.2f}, y={coord['y']:.2f}, z={coord['z']:.2f}")
                print()
            else:
                print(f"⚠️  WARNING: First coordinate is not a dict: {first_coord}")
        
        if has_survey:
            survey_data = data["survey_data"]
            print(f"✅ Survey data field present")
            print(f"   Type: {type(survey_data).__name__}")
            print(f"   Count: {len(survey_data)}")
            print()
        
        print("=" * 80)
        print("METADATA VALIDATION")
        print("=" * 80)
        print()
        
        metadata = data["metadata"]
        print(f"📊 Metadata fields:")
        for key, value in metadata.items():
            print(f"   - {key}: {value}")
        print()
        
        # Verify expected metadata fields
        expected_metadata = ["total_points", "source"]
        missing_metadata = [f for f in expected_metadata if f not in metadata]
        
        if missing_metadata:
            print(f"⚠️  WARNING: Missing expected metadata fields: {', '.join(missing_metadata)}")
        else:
            print(f"✅ All expected metadata fields present")
        print()
        
        # Verify total_points matches coordinates length
        if has_coordinates:
            expected_count = len(coordinates)
            actual_count = metadata.get("total_points", 0)
            
            if expected_count != actual_count:
                print(f"⚠️  WARNING: total_points mismatch")
                print(f"   Metadata says: {actual_count}")
                print(f"   Actual count: {expected_count}")
            else:
                print(f"✅ total_points matches coordinates length: {actual_count}")
        print()
        
        print("=" * 80)
        print("TEST SUMMARY")
        print("=" * 80)
        print()
        print("✅ ALL CHECKS PASSED")
        print()
        print(f"   - JSON structure: Valid")
        print(f"   - Required fields: Present")
        print(f"   - Coordinates: Present ({len(coordinates) if has_coordinates else 0} points)")
        print(f"   - Metadata: Valid")
        print()
        print("Requirements 1.1, 1.2: ✅ SATISFIED")
        print()
        
        return True
        
    except Exception as e:
        print(f"❌ FAILED: Unexpected error")
        print(f"   Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_osdu_data_retrieval()
    sys.exit(0 if success else 1)
