#!/usr/bin/env python3
"""
Test script for perimeter feature generation
Verifies that the generate_perimeter_feature function creates valid GeoJSON
"""

import sys
import os
import json
import math

# Add the terrain handler directory to path
terrain_dir = os.path.join(os.path.dirname(__file__), '..', 'amplify', 'functions', 'renewableTools', 'terrain')
sys.path.insert(0, terrain_dir)

def test_perimeter_generation():
    """Test the generate_perimeter_feature function"""
    
    print("🧪 Testing perimeter feature generation...")
    
    # Test parameters
    test_lat = 35.067482
    test_lon = -101.395466
    test_radius = 5.0
    
    # Import the function (mock logger if needed)
    import logging
    logging.basicConfig(level=logging.INFO)
    
    # Import the generate_perimeter_feature function
    try:
        from handler import generate_perimeter_feature
        print("✅ Successfully imported generate_perimeter_feature")
    except ImportError as e:
        print(f"❌ Failed to import: {e}")
        return False
    
    # Generate perimeter feature
    try:
        perimeter = generate_perimeter_feature(test_lat, test_lon, test_radius)
        print(f"✅ Generated perimeter feature")
    except Exception as e:
        print(f"❌ Failed to generate perimeter: {e}")
        return False
    
    # Validate structure
    print("\n📋 Validating perimeter feature structure...")
    
    # Check type
    if perimeter.get('type') != 'Feature':
        print(f"❌ Invalid type: {perimeter.get('type')}")
        return False
    print("✅ Type is 'Feature'")
    
    # Check geometry
    geometry = perimeter.get('geometry', {})
    if geometry.get('type') != 'Polygon':
        print(f"❌ Invalid geometry type: {geometry.get('type')}")
        return False
    print("✅ Geometry type is 'Polygon'")
    
    # Check coordinates
    coordinates = geometry.get('coordinates', [])
    if not coordinates or len(coordinates) == 0:
        print("❌ No coordinates found")
        return False
    
    outer_ring = coordinates[0]
    if len(outer_ring) < 4:
        print(f"❌ Insufficient points in polygon: {len(outer_ring)}")
        return False
    print(f"✅ Polygon has {len(outer_ring)} points")
    
    # Check if polygon is closed
    if outer_ring[0] != outer_ring[-1]:
        print("❌ Polygon is not closed (first point != last point)")
        return False
    print("✅ Polygon is properly closed")
    
    # Check properties
    props = perimeter.get('properties', {})
    required_props = ['type', 'feature_type', 'name', 'radius_km', 'area_km2']
    
    for prop in required_props:
        if prop not in props:
            print(f"❌ Missing required property: {prop}")
            return False
    print(f"✅ All required properties present: {required_props}")
    
    # Validate property values
    if props.get('type') != 'perimeter':
        print(f"❌ Invalid type property: {props.get('type')}")
        return False
    
    if props.get('feature_type') != 'perimeter':
        print(f"❌ Invalid feature_type property: {props.get('feature_type')}")
        return False
    
    if props.get('radius_km') != test_radius:
        print(f"❌ Incorrect radius: {props.get('radius_km')} (expected {test_radius})")
        return False
    
    # Validate area calculation
    expected_area = math.pi * test_radius * test_radius
    actual_area = props.get('area_km2')
    if abs(actual_area - expected_area) > 0.1:
        print(f"❌ Incorrect area: {actual_area} (expected ~{expected_area:.2f})")
        return False
    print(f"✅ Area calculation correct: {actual_area:.2f} km²")
    
    # Print feature summary
    print("\n📊 Perimeter Feature Summary:")
    print(f"   Name: {props.get('name')}")
    print(f"   Type: {props.get('type')}")
    print(f"   Radius: {props.get('radius_km')} km")
    print(f"   Area: {props.get('area_km2')} km²")
    print(f"   Points: {len(outer_ring)}")
    print(f"   Data Source: {props.get('data_source')}")
    print(f"   Reliability: {props.get('reliability')}")
    
    # Validate coordinate ranges
    print("\n🗺️ Validating coordinate ranges...")
    lats = [coord[1] for coord in outer_ring]
    lons = [coord[0] for coord in outer_ring]
    
    min_lat, max_lat = min(lats), max(lats)
    min_lon, max_lon = min(lons), max(lons)
    
    print(f"   Latitude range: {min_lat:.6f} to {max_lat:.6f}")
    print(f"   Longitude range: {min_lon:.6f} to {max_lon:.6f}")
    
    # Check that coordinates are within reasonable bounds of center
    lat_range = max_lat - min_lat
    lon_range = max_lon - min_lon
    
    # Approximate: 1 degree ≈ 111 km
    expected_lat_range = (test_radius * 2) / 111.32
    
    if abs(lat_range - expected_lat_range) > 0.01:
        print(f"⚠️ Warning: Latitude range seems off: {lat_range:.6f} (expected ~{expected_lat_range:.6f})")
    else:
        print(f"✅ Latitude range is correct")
    
    print("\n✅ All perimeter generation tests passed!")
    return True

if __name__ == '__main__':
    success = test_perimeter_generation()
    sys.exit(0 if success else 1)
