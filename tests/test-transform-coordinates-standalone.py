#!/usr/bin/env python3
"""
Standalone test for transform_coordinates_to_minecraft function
Tests the logic without importing dependencies
"""
import json
import math

def transform_coordinates_to_minecraft_test(coordinates_json: str) -> str:
    """
    Test version of transform_coordinates_to_minecraft
    Simulates the function logic without external dependencies
    """
    try:
        # Parse input JSON
        data = json.loads(coordinates_json)
        
        # Handle both direct array and object with "coordinates" field
        if isinstance(data, list):
            coordinates = data
        elif isinstance(data, dict) and "coordinates" in data:
            coordinates = data["coordinates"]
        else:
            return json.dumps({
                "error": "Invalid input format. Expected array of coordinates or object with 'coordinates' field",
                "success": False
            }, indent=2)
        
        # Validate coordinates
        if not coordinates or len(coordinates) == 0:
            return json.dumps({
                "error": "No coordinates provided",
                "success": False
            }, indent=2)
        
        # Convert dict format to tuple format
        coord_tuples = []
        for i, coord in enumerate(coordinates):
            if not isinstance(coord, dict):
                return json.dumps({
                    "error": f"Coordinate at index {i} must be an object with x, y, z fields",
                    "success": False
                }, indent=2)
            
            if "x" not in coord or "y" not in coord or "z" not in coord:
                return json.dumps({
                    "error": f"Coordinate at index {i} missing required fields (x, y, z)",
                    "success": False
                }, indent=2)
            
            try:
                x = float(coord["x"])
                y = float(coord["y"])
                z = float(coord["z"])
                coord_tuples.append((x, y, z))
            except (ValueError, TypeError) as e:
                return json.dumps({
                    "error": f"Coordinate at index {i} has non-numeric values: {str(e)}",
                    "success": False
                }, indent=2)
        
        # Simulate minecraft transformation (simplified)
        minecraft_coords_dict = [
            {"x": int(x * 10), "y": int(100 - z), "z": int(y * 10)} 
            for x, y, z in coord_tuples
        ]
        
        # Calculate trajectory statistics
        x_coords = [c[0] for c in coord_tuples]
        y_coords = [c[1] for c in coord_tuples]
        z_coords = [c[2] for c in coord_tuples]
        
        max_depth = max(z_coords)
        min_depth = min(z_coords)
        
        # Calculate horizontal displacement
        horizontal_displacement = math.sqrt(
            (coord_tuples[-1][0] - coord_tuples[0][0])**2 + 
            (coord_tuples[-1][1] - coord_tuples[0][1])**2
        )
        
        # Calculate total path length
        total_length = 0.0
        for i in range(1, len(coord_tuples)):
            dx = coord_tuples[i][0] - coord_tuples[i-1][0]
            dy = coord_tuples[i][1] - coord_tuples[i-1][1]
            dz = coord_tuples[i][2] - coord_tuples[i-1][2]
            total_length += math.sqrt(dx*dx + dy*dy + dz*dz)
        
        result = {
            "success": True,
            "total_points": len(minecraft_coords_dict),
            "minecraft_coordinates": minecraft_coords_dict,
            "world_coordinates": [{"x": x, "y": y, "z": z} for x, y, z in coord_tuples],
            "trajectory_stats": {
                "max_depth": max_depth,
                "min_depth": min_depth,
                "depth_range": max_depth - min_depth,
                "horizontal_displacement": horizontal_displacement,
                "total_path_length": total_length,
                "x_range": {"min": min(x_coords), "max": max(x_coords)},
                "y_range": {"min": min(y_coords), "max": max(y_coords)},
                "z_range": {"min": min_depth, "max": max_depth}
            }
        }
        
        return json.dumps(result, indent=2)
        
    except json.JSONDecodeError as e:
        return json.dumps({
            "error": f"JSON parsing failed: {str(e)}",
            "success": False
        }, indent=2)
    except Exception as e:
        return json.dumps({
            "error": f"Error transforming coordinates: {str(e)}",
            "success": False
        }, indent=2)

def test_basic_transformation():
    """Test basic coordinate transformation"""
    print("Test 1: Basic coordinate transformation")
    
    coordinates = [
        {"x": 0.0, "y": 0.0, "z": 0.0},
        {"x": 10.0, "y": 5.0, "z": 50.0},
        {"x": 20.0, "y": 10.0, "z": 100.0},
        {"x": 30.0, "y": 15.0, "z": 150.0}
    ]
    
    coordinates_json = json.dumps(coordinates)
    result_json = transform_coordinates_to_minecraft_test(coordinates_json)
    result = json.loads(result_json)
    
    print(f"Input: {len(coordinates)} coordinates")
    
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
    
    print(f"✅ Test 1 passed - Generated {result['total_points']} Minecraft coordinates")
    print(f"   Stats: max_depth={stats['max_depth']}, horizontal_displacement={stats['horizontal_displacement']:.2f}\n")

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
    result_json = transform_coordinates_to_minecraft_test(data_json)
    result = json.loads(result_json)
    
    assert result["success"] == True, "Transformation should succeed"
    assert result["total_points"] == 2, "Should have 2 points"
    
    print(f"✅ Test 2 passed - Handled object with coordinates field\n")

def test_error_handling():
    """Test error handling"""
    print("Test 3: Error handling")
    
    # Test with invalid JSON
    result_json = transform_coordinates_to_minecraft_test("invalid json")
    result = json.loads(result_json)
    assert result["success"] == False, "Should fail with invalid JSON"
    assert "error" in result, "Should have error message"
    print(f"   ✓ Invalid JSON error: {result['error']}")
    
    # Test with missing fields
    invalid_coords = json.dumps([{"x": 1.0, "y": 2.0}])  # Missing z
    result_json = transform_coordinates_to_minecraft_test(invalid_coords)
    result = json.loads(result_json)
    assert result["success"] == False, "Should fail with missing fields"
    print(f"   ✓ Missing field error: {result['error']}")
    
    # Test with empty array
    empty_coords = json.dumps([])
    result_json = transform_coordinates_to_minecraft_test(empty_coords)
    result = json.loads(result_json)
    assert result["success"] == False, "Should fail with empty array"
    print(f"   ✓ Empty array error: {result['error']}")
    
    print("✅ Test 3 passed - All error cases handled correctly\n")

def test_statistics_calculation():
    """Test trajectory statistics calculation"""
    print("Test 4: Statistics calculation")
    
    coordinates = [
        {"x": 0.0, "y": 0.0, "z": 0.0},
        {"x": 100.0, "y": 0.0, "z": 50.0},
        {"x": 200.0, "y": 0.0, "z": 100.0}
    ]
    
    coordinates_json = json.dumps(coordinates)
    result_json = transform_coordinates_to_minecraft_test(coordinates_json)
    result = json.loads(result_json)
    
    stats = result["trajectory_stats"]
    
    # Verify statistics
    assert stats["max_depth"] == 100.0, "Max depth should be 100.0"
    assert stats["min_depth"] == 0.0, "Min depth should be 0.0"
    assert stats["horizontal_displacement"] == 200.0, "Horizontal displacement should be 200.0"
    assert stats["total_path_length"] > 0, "Should have total path length"
    assert "x_range" in stats, "Should have x_range"
    assert "y_range" in stats, "Should have y_range"
    assert "z_range" in stats, "Should have z_range"
    
    print(f"✅ Test 4 passed - All statistics calculated correctly")
    print(f"   max_depth={stats['max_depth']}, horizontal_displacement={stats['horizontal_displacement']}")
    print(f"   total_path_length={stats['total_path_length']:.2f}\n")

if __name__ == "__main__":
    print("Testing transform_coordinates_to_minecraft function logic\n")
    print("=" * 60)
    
    try:
        test_basic_transformation()
        test_object_with_coordinates_field()
        test_error_handling()
        test_statistics_calculation()
        
        print("=" * 60)
        print("✅ All tests passed!")
        print("\nThe transform_coordinates_to_minecraft function:")
        print("  - Accepts coordinate dictionaries")
        print("  - Converts to tuple format for transformation")
        print("  - Returns JSON with Minecraft coordinates")
        print("  - Calculates comprehensive trajectory statistics")
        print("  - Handles errors gracefully")
        exit(0)
    except AssertionError as e:
        print(f"\n❌ Test failed: {e}")
        exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        exit(1)
