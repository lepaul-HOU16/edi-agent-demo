#!/usr/bin/env python3
"""
Test script for horizon visualization workflow.
Tests OSDU data fetching, coordinate parsing, transformation, and RCON commands.
"""

import sys
import os
import json
import logging

# Add parent directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'edicraft-agent'))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def test_coordinate_parsing():
    """Test horizon file parsing with sample data."""
    logger.info("=" * 60)
    logger.info("TEST 1: Coordinate Parsing")
    logger.info("=" * 60)
    
    from tools.horizon_tools import parse_horizon_file
    
    # Sample horizon file content (CSV format)
    sample_data = """# Horizon Surface Data
# Point_ID, Line_Number, Easting, Northing, Elevation
1, 100, 500000.0, 4500000.0, -1500.0
2, 100, 500010.0, 4500000.0, -1505.0
3, 100, 500020.0, 4500000.0, -1510.0
4, 101, 500000.0, 4500010.0, -1502.0
5, 101, 500010.0, 4500010.0, -1507.0
6, 101, 500020.0, 4500010.0, -1512.0
7, 102, 500000.0, 4500020.0, -1504.0
8, 102, 500010.0, 4500020.0, -1509.0
9, 102, 500020.0, 4500020.0, -1514.0
"""
    
    result = parse_horizon_file(sample_data)
    
    try:
        parsed = json.loads(result)
        logger.info(f"✅ Parsed {parsed['total_points']} coordinate points")
        logger.info(f"   Coordinate system: {parsed['coordinate_system']}")
        logger.info(f"   Bounds: X[{parsed['bounds']['x_min']:.2f}, {parsed['bounds']['x_max']:.2f}], "
                   f"Y[{parsed['bounds']['y_min']:.2f}, {parsed['bounds']['y_max']:.2f}], "
                   f"Z[{parsed['bounds']['z_min']:.2f}, {parsed['bounds']['z_max']:.2f}]")
        return True, parsed
    except Exception as e:
        logger.error(f"❌ Parsing failed: {e}")
        logger.error(f"   Result: {result}")
        return False, None


def test_coordinate_transformation(parsed_data):
    """Test coordinate transformation to Minecraft space."""
    logger.info("=" * 60)
    logger.info("TEST 2: Coordinate Transformation")
    logger.info("=" * 60)
    
    from tools.horizon_tools import convert_horizon_to_minecraft
    
    # Convert parsed data back to JSON string
    horizon_json = json.dumps(parsed_data)
    
    result = convert_horizon_to_minecraft(
        horizon_coordinates_json=horizon_json,
        sample_rate=1,  # Use all points for test
        base_x=0,
        base_y=100,
        base_z=0
    )
    
    try:
        converted = json.loads(result)
        logger.info(f"✅ Converted {converted['total_minecraft_points']} points to Minecraft coordinates")
        logger.info(f"   Blocks to place: {converted['blocks_to_place']}")
        logger.info(f"   Commands generated: {len(converted['build_commands'])}")
        
        # Show sample Minecraft coordinates
        if converted['minecraft_coordinates']:
            sample = converted['minecraft_coordinates'][0]
            logger.info(f"   Sample point: MC({sample['x']}, {sample['y']}, {sample['z']}) "
                       f"from Real({sample['original_x']:.2f}, {sample['original_y']:.2f}, {sample['original_z']:.2f})")
        
        return True, converted
    except Exception as e:
        logger.error(f"❌ Transformation failed: {e}")
        logger.error(f"   Result: {result}")
        return False, None


def test_rcon_command_generation(converted_data):
    """Test RCON command generation."""
    logger.info("=" * 60)
    logger.info("TEST 3: RCON Command Generation")
    logger.info("=" * 60)
    
    commands = converted_data.get('build_commands', [])
    
    if not commands:
        logger.error("❌ No commands generated")
        return False
    
    # Analyze commands
    setblock_commands = [cmd for cmd in commands if cmd.startswith('setblock')]
    say_commands = [cmd for cmd in commands if cmd.startswith('say')]
    comment_lines = [cmd for cmd in commands if cmd.startswith('#')]
    
    logger.info(f"✅ Generated {len(commands)} total commands:")
    logger.info(f"   - {len(setblock_commands)} setblock commands")
    logger.info(f"   - {len(say_commands)} say commands")
    logger.info(f"   - {len(comment_lines)} comment lines")
    
    # Validate command format
    invalid_commands = []
    for cmd in setblock_commands[:10]:  # Check first 10
        parts = cmd.split()
        if len(parts) < 5:
            invalid_commands.append(cmd)
        else:
            try:
                x, y, z = int(parts[1]), int(parts[2]), int(parts[3])
                block = parts[4]
                
                # Validate coordinates are in reasonable range
                if not (-30000000 <= x <= 30000000 and 0 <= y <= 255 and -30000000 <= z <= 30000000):
                    invalid_commands.append(f"{cmd} (coordinates out of bounds)")
            except ValueError:
                invalid_commands.append(f"{cmd} (invalid coordinate format)")
    
    if invalid_commands:
        logger.warning(f"⚠️  Found {len(invalid_commands)} invalid commands:")
        for cmd in invalid_commands[:5]:
            logger.warning(f"   - {cmd}")
        return False
    else:
        logger.info("✅ All sampled commands have valid format")
        
        # Show sample commands
        logger.info("   Sample commands:")
        for cmd in setblock_commands[:3]:
            logger.info(f"   - {cmd}")
    
    return True


def test_error_handling():
    """Test error handling for invalid inputs."""
    logger.info("=" * 60)
    logger.info("TEST 4: Error Handling")
    logger.info("=" * 60)
    
    from tools.horizon_tools import parse_horizon_file, convert_horizon_to_minecraft
    
    # Test 1: Empty file content
    result = parse_horizon_file("")
    if "Error" in result:
        logger.info("✅ Empty file content handled correctly")
    else:
        logger.error("❌ Empty file content not handled")
        return False
    
    # Test 2: Invalid JSON for conversion
    result = convert_horizon_to_minecraft("invalid json")
    if "Error" in result:
        logger.info("✅ Invalid JSON handled correctly")
    else:
        logger.error("❌ Invalid JSON not handled")
        return False
    
    # Test 3: No coordinates in data
    result = convert_horizon_to_minecraft('{"coordinates": []}')
    if "Error" in result:
        logger.info("✅ Empty coordinates handled correctly")
    else:
        logger.error("❌ Empty coordinates not handled")
        return False
    
    logger.info("✅ All error handling tests passed")
    return True


def test_coordinate_scaling():
    """Test that coordinate scaling produces reasonable Minecraft coordinates."""
    logger.info("=" * 60)
    logger.info("TEST 5: Coordinate Scaling Validation")
    logger.info("=" * 60)
    
    from tools.coordinates import transform_surface_to_minecraft, calculate_surface_scaling
    
    # Test with realistic UTM coordinates
    test_coords = [
        (500000.0, 4500000.0, -1500.0),
        (500100.0, 4500000.0, -1550.0),
        (500000.0, 4500100.0, -1520.0),
        (500100.0, 4500100.0, -1570.0),
    ]
    
    # Calculate scaling
    scaling = calculate_surface_scaling(test_coords)
    logger.info(f"   Scale factor: {scaling['scale_factor']:.6f}")
    logger.info(f"   Original X range: {scaling['x_max'] - scaling['x_min']:.2f} m")
    logger.info(f"   Original Y range: {scaling['y_max'] - scaling['y_min']:.2f} m")
    logger.info(f"   Original Z range: {scaling['z_max'] - scaling['z_min']:.2f} m")
    
    # Transform coordinates
    mc_coords = transform_surface_to_minecraft(test_coords)
    
    # Validate Minecraft coordinates
    mc_x_vals = [c[0] for c in mc_coords]
    mc_y_vals = [c[1] for c in mc_coords]
    mc_z_vals = [c[2] for c in mc_coords]
    
    logger.info(f"   Minecraft X range: [{min(mc_x_vals)}, {max(mc_x_vals)}]")
    logger.info(f"   Minecraft Y range: [{min(mc_y_vals)}, {max(mc_y_vals)}]")
    logger.info(f"   Minecraft Z range: [{min(mc_z_vals)}, {max(mc_z_vals)}]")
    
    # Validate ranges are reasonable
    if max(mc_x_vals) - min(mc_x_vals) > 200:
        logger.warning("⚠️  X range seems too large (>200 blocks)")
        return False
    
    if max(mc_z_vals) - min(mc_z_vals) > 200:
        logger.warning("⚠️  Z range seems too large (>200 blocks)")
        return False
    
    if not (20 <= min(mc_y_vals) <= 50 and 20 <= max(mc_y_vals) <= 50):
        logger.warning(f"⚠️  Y range outside expected bounds (20-50): [{min(mc_y_vals)}, {max(mc_y_vals)}]")
        return False
    
    logger.info("✅ Coordinate scaling produces reasonable Minecraft coordinates")
    return True


def main():
    """Run all horizon visualization tests."""
    logger.info("\n" + "=" * 60)
    logger.info("HORIZON VISUALIZATION TEST SUITE")
    logger.info("=" * 60 + "\n")
    
    results = []
    
    # Test 1: Coordinate parsing
    success, parsed_data = test_coordinate_parsing()
    results.append(("Coordinate Parsing", success))
    
    if not success:
        logger.error("\n❌ Coordinate parsing failed, cannot continue with remaining tests")
        return False
    
    # Test 2: Coordinate transformation
    success, converted_data = test_coordinate_transformation(parsed_data)
    results.append(("Coordinate Transformation", success))
    
    if not success:
        logger.error("\n❌ Coordinate transformation failed, cannot continue with remaining tests")
        return False
    
    # Test 3: RCON command generation
    success = test_rcon_command_generation(converted_data)
    results.append(("RCON Command Generation", success))
    
    # Test 4: Error handling
    success = test_error_handling()
    results.append(("Error Handling", success))
    
    # Test 5: Coordinate scaling
    success = test_coordinate_scaling()
    results.append(("Coordinate Scaling", success))
    
    # Summary
    logger.info("\n" + "=" * 60)
    logger.info("TEST SUMMARY")
    logger.info("=" * 60)
    
    passed = sum(1 for _, success in results if success)
    total = len(results)
    
    for test_name, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        logger.info(f"{status} - {test_name}")
    
    logger.info("=" * 60)
    logger.info(f"Results: {passed}/{total} tests passed")
    logger.info("=" * 60 + "\n")
    
    return passed == total


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
