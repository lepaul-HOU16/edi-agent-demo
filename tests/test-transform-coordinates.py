#!/usr/bin/env python3
"""
Test the transform_coordinates_to_minecraft function
"""
import sys
import os
import json

# Add edicraft-agent to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'edicraft-agent'))

from tools.trajectory_tools import transform_coordinates_to_minecraft

def test_basic_transformation():
    """Test basic coordinate transformation"""
    print("Test 1: Basic coordinate transformation")
    
    # Sample coordinates
    coordinates = [
        {"x": 0.0, "y": 0.0, "z": 0.0},
        {"x": 10.0, "y": 5.0, "z": 50.0},
        {"x": 20.0, "y": 10.0, "z": 100.0},
        {"x": 30.0, "y": 15.0, "z": 150.0}
    ]
    
    coordinates_json = json.dumps(coordinates)
    result_json = transform_coordinates_to_minecraft(coordinates_json)
    result = json.loads(result_json)
    
    print(f"Input: {len(coordinates)} coordinates")
    print(f"Output: {json.dumps(result, indent=2)}")
    
    # Verify result structure
    assert result["success"] == True, "Transformation should succeed"
    assert result["total_points"] == 4, "Should have 4 points"
    assert "minecraft_coordinates" in result, "Should have minecraft_coordinates"
    assert "trajectory_stats" in result, "Should have trajectory_stats"
    
    # Verify statistics
    stats = result["trajectory_stats"]
    assert stats["max_depth"] == 150.0, "Max depth should be 150.0"
    assert stats["min_depth"] == 0.0, "Min depth should be 0.0"
    assert stats["depth_range"] == 150.0, "Depth range should be 150.0"
    assert stats["horizontal_displacement"] > 0, "Should have horizontal displacement"
    
    print("✅ Test 1 passed\n")

def test_object_with_coordinates_field():
    """Test with object containing coordinates field"""
    print("Test 2: Object with coordinates field")
    
    data = {
        "trajectory_id": "WELL-005",
        "coordinates": [
            {"x": 1.0, "y": 2.0, "z": 3.0},
            {"x": 2.0, "y": 3.0, "z": 4.0}
        ]
    }
    
    data_json = json.dumps(data)
    result_json = transform_coordinates_to_minecraft(data_json)
    result = json.loads(result_json)
    
    print(f"Output: {json.dumps(result, indent=2)}")
    
    assert result["success"] == True, "Transformation should succeed"
    assert result["total_points"] == 2, "Should have 2 points"
    
    print("✅ Test 2 passed\n")

def test_error_handling():
    """Test error handling"""
    print("Test 3: Error handling")
    
    # Test with invalid JSON
    result_json = transform_coordinates_to_minecraft("invalid json")
    result = json.loads(result_json)
    assert result["success"] == False, "Should fail with invalid JSON"
    assert "error" in result, "Should have error message"
    print(f"Invalid JSON error: {result['error']}")
    
    # Test with missing fields
    invalid_coords = json.dumps([{"x": 1.0, "y": 2.0}])  # Missing z
    result_json = transform_coordinates_to_minecraft(invalid_coords)
    result = json.loads(result_json)
    assert result["success"] == False, "Should fail with missing fields"
    print(f"Missing field error: {result['error']}")
    
    # Test with empty array
    empty_coords = json.dumps([])
    result_json = transform_coordinates_to_minecraft(empty_coords)
    result = json.loads(result_json)
    assert result["success"] == False, "Should fail with empty array"
    print(f"Empty array error: {result['error']}")
    
    print("✅ Test 3 passed\n")

def test_statistics_calculation():
    """Test trajectory statistics calculation"""
    print("Test 4: Statistics calculation")
    
    coordinates = [
        {"x": 0.0, "y": 0.0, "z": 0.0},
        {"x": 100.0, "y": 0.0, "z": 50.0},
        {"x": 200.0, "y": 0.0, "z": 100.0}
    ]
    
    coordinates_json = json.dumps(coordinates)
    result_json = transform_coordinates_to_minecraft(coordinates_json)
    result = json.loads(result_json)
    
    stats = result["trajectory_stats"]
    print(f"Statistics: {json.dumps(stats, indent=2)}")
    
    # Verify statistics
    assert stats["max_depth"] == 100.0, "Max depth should be 100.0"
    assert stats["min_depth"] == 0.0, "Min depth should be 0.0"
    assert stats["horizontal_displacement"] == 200.0, "Horizontal displacement should be 200.0"
    assert stats["total_path_length"] > 0, "Should have total path length"
    assert "x_range" in stats, "Should have x_range"
    assert "y_range" in stats, "Should have y_range"
    assert "z_range" in stats, "Should have z_range"
    
    print("✅ Test 4 passed\n")

if __name__ == "__main__":
    print("Testing transform_coordinates_to_minecraft function\n")
    print("=" * 60)
    
    try:
        test_basic_transformation()
        test_object_with_coordinates_field()
        test_error_handling()
        test_statistics_calculation()
        
        print("=" * 60)
        print("✅ All tests passed!")
        sys.exit(0)
    except AssertionError as e:
        print(f"\n❌ Test failed: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
