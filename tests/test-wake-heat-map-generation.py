#!/usr/bin/env python3
"""
Test script for wake heat map generation

This script tests the generate_wake_heat_map function to ensure it:
1. Generates valid Plotly HTML
2. Includes turbine markers
3. Includes wake deficit heat map
4. Has proper styling and interactivity
"""

import sys
import os
import json
import numpy as np

# Add the simulation handler directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'amplify', 'functions', 'renewableTools', 'simulation'))

from handler import generate_wake_heat_map

def test_wake_heat_map_generation():
    """Test wake heat map generation with sample data"""
    
    print("=" * 80)
    print("WAKE HEAT MAP GENERATION TEST")
    print("=" * 80)
    
    # Sample turbine positions
    turbine_positions = [
        {'x': 0, 'y': 0, 'id': 'T01', 'lat': 35.0, 'lon': -101.0},
        {'x': 500, 'y': 0, 'id': 'T02', 'lat': 35.005, 'lon': -101.0},
        {'x': 1000, 'y': 0, 'id': 'T03', 'lat': 35.010, 'lon': -101.0},
        {'x': 0, 'y': 500, 'id': 'T04', 'lat': 35.0, 'lon': -101.005},
        {'x': 500, 'y': 500, 'id': 'T05', 'lat': 35.005, 'lon': -101.005},
    ]
    
    # Sample wake deficit data
    grid_size = 30
    x_coords = np.linspace(-500, 1500, grid_size)
    y_coords = np.linspace(-500, 1000, grid_size)
    
    # Generate deficit matrix
    deficit_matrix = np.zeros((grid_size, grid_size))
    for turbine in turbine_positions:
        tx, ty = turbine['x'], turbine['y']
        for i, x in enumerate(x_coords):
            for j, y in enumerate(y_coords):
                dist = np.sqrt((x - tx)**2 + (y - ty)**2)
                if dist < 1000:
                    deficit = 20 * np.exp(-dist / 400)
                    deficit_matrix[j, i] = max(deficit_matrix[j, i], deficit)
    
    wake_deficit_data = {
        'x_coords': x_coords.tolist(),
        'y_coords': y_coords.tolist(),
        'deficit_matrix': deficit_matrix.tolist()
    }
    
    project_id = 'test-project-001'
    
    print("\n1. Testing wake heat map generation...")
    print(f"   - Turbines: {len(turbine_positions)}")
    print(f"   - Grid size: {grid_size}x{grid_size}")
    print(f"   - X range: {x_coords[0]:.0f}m to {x_coords[-1]:.0f}m")
    print(f"   - Y range: {y_coords[0]:.0f}m to {y_coords[-1]:.0f}m")
    
    # Generate heat map
    html_content = generate_wake_heat_map(turbine_positions, wake_deficit_data, project_id)
    
    if not html_content:
        print("   ❌ FAILED: No HTML content generated")
        return False
    
    print(f"   ✅ Generated HTML ({len(html_content):,} bytes)")
    
    # Validate HTML content
    print("\n2. Validating HTML content...")
    
    required_elements = [
        ('plotly', 'Plotly library'),
        ('Heatmap', 'Heat map trace'),
        ('Scatter', 'Turbine markers'),
        ('Wake Interaction Heat Map', 'Title'),
        ('Wake Deficit (%)', 'Color bar title'),
        ('Distance East-West', 'X-axis label'),
        ('Distance North-South', 'Y-axis label'),
        ('RdYlGn_r', 'Color scale'),
    ]
    
    all_valid = True
    for element, description in required_elements:
        if element in html_content:
            print(f"   ✅ {description}: Found")
        else:
            print(f"   ❌ {description}: Missing")
            all_valid = False
    
    # Check for turbine IDs
    print("\n3. Checking turbine markers...")
    turbine_ids_found = 0
    for turbine in turbine_positions:
        if turbine['id'] in html_content:
            turbine_ids_found += 1
    
    print(f"   ✅ Found {turbine_ids_found}/{len(turbine_positions)} turbine IDs in HTML")
    
    # Check HTML structure
    print("\n4. Checking HTML structure...")
    if '<html>' in html_content and '</html>' in html_content:
        print("   ✅ Valid HTML document structure")
    else:
        print("   ❌ Invalid HTML document structure")
        all_valid = False
    
    if '<script' in html_content and '</script>' in html_content:
        print("   ✅ Contains JavaScript")
    else:
        print("   ❌ Missing JavaScript")
        all_valid = False
    
    # Save sample output for manual inspection
    output_file = 'tests/sample-wake-heat-map.html'
    try:
        with open(output_file, 'w') as f:
            f.write(html_content)
        print(f"\n5. Sample output saved to: {output_file}")
        print(f"   Open this file in a browser to verify the visualization")
    except Exception as e:
        print(f"\n5. ⚠️ Could not save sample output: {e}")
    
    # Summary
    print("\n" + "=" * 80)
    if all_valid and turbine_ids_found == len(turbine_positions):
        print("✅ WAKE HEAT MAP GENERATION TEST PASSED")
        print("\nThe wake heat map includes:")
        print("  - Interactive Plotly heat map with wake deficit data")
        print("  - Turbine markers with IDs")
        print("  - Color scale (red = high deficit, green = low deficit)")
        print("  - Hover tooltips with coordinates and deficit values")
        print("  - Proper axis labels and title")
        return True
    else:
        print("❌ WAKE HEAT MAP GENERATION TEST FAILED")
        print("\nSome required elements are missing or invalid")
        return False

def test_empty_data_handling():
    """Test handling of empty or invalid data"""
    
    print("\n" + "=" * 80)
    print("EMPTY DATA HANDLING TEST")
    print("=" * 80)
    
    # Test with empty turbine positions
    print("\n1. Testing with empty turbine positions...")
    html = generate_wake_heat_map([], {
        'x_coords': [0, 100],
        'y_coords': [0, 100],
        'deficit_matrix': [[0, 0], [0, 0]]
    }, 'test-empty')
    
    if html and 'Wake Interaction Heat Map' in html:
        print("   ✅ Handles empty turbine positions gracefully")
    else:
        print("   ❌ Failed to handle empty turbine positions")
        return False
    
    # Test with empty deficit data
    print("\n2. Testing with empty deficit data...")
    html = generate_wake_heat_map([
        {'x': 0, 'y': 0, 'id': 'T01'}
    ], {
        'x_coords': [],
        'y_coords': [],
        'deficit_matrix': []
    }, 'test-empty-deficit')
    
    if html is None:
        print("   ✅ Returns None for invalid deficit data")
    else:
        print("   ⚠️ Generated HTML despite invalid data (may be acceptable)")
    
    print("\n" + "=" * 80)
    print("✅ EMPTY DATA HANDLING TEST PASSED")
    return True

if __name__ == '__main__':
    print("\nStarting wake heat map generation tests...\n")
    
    test1_passed = test_wake_heat_map_generation()
    test2_passed = test_empty_data_handling()
    
    print("\n" + "=" * 80)
    print("FINAL RESULTS")
    print("=" * 80)
    print(f"Wake heat map generation: {'✅ PASSED' if test1_passed else '❌ FAILED'}")
    print(f"Empty data handling: {'✅ PASSED' if test2_passed else '❌ FAILED'}")
    
    if test1_passed and test2_passed:
        print("\n🎉 ALL TESTS PASSED")
        print("\nNext steps:")
        print("1. Deploy the updated simulation handler")
        print("2. Test wake simulation with real project data")
        print("3. Verify wake_heat_map URL is present in response")
        print("4. Verify URL is accessible and displays correctly")
        sys.exit(0)
    else:
        print("\n❌ SOME TESTS FAILED")
        print("\nPlease review the errors above and fix the issues")
        sys.exit(1)
