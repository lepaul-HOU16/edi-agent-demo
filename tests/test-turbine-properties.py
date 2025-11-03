#!/usr/bin/env python3
"""
Test: Verify turbine features have all required properties
Task 3: Add turbine properties to layout features
Requirements: 4.1, 4.2
"""

import json
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'amplify', 'functions', 'renewableTools', 'layout'))

def test_turbine_properties():
    """Test that turbine features have all required properties"""
    
    print("=" * 70)
    print("TEST: Turbine Feature Properties")
    print("=" * 70)
    
    # Import handler
    try:
        from handler import handler
        print("✅ Successfully imported layout handler")
    except ImportError as e:
        print(f"❌ Failed to import handler: {e}")
        return False
    
    # Create test event with coordinates
    test_event = {
        'parameters': {
            'project_id': 'test-turbine-props',
            'latitude': 35.0,
            'longitude': -101.0,
            'num_turbines': 5,
            'turbine_model': 'GE 2.5-120',
            'capacity_mw': 2.5,
            'hub_height': 85.0,
            'rotor_diameter': 120.0,
            'spacing_d': 9.0
        },
        'project_context': {
            'coordinates': {
                'latitude': 35.0,
                'longitude': -101.0
            }
        }
    }
    
    print("\n📋 Test Parameters:")
    print(f"   Project ID: {test_event['parameters']['project_id']}")
    print(f"   Location: ({test_event['parameters']['latitude']}, {test_event['parameters']['longitude']})")
    print(f"   Turbines: {test_event['parameters']['num_turbines']}")
    print(f"   Model: {test_event['parameters']['turbine_model']}")
    print(f"   Capacity: {test_event['parameters']['capacity_mw']} MW")
    print(f"   Hub Height: {test_event['parameters']['hub_height']} m")
    print(f"   Rotor Diameter: {test_event['parameters']['rotor_diameter']} m")
    
    # Call handler
    print("\n🔄 Calling layout handler...")
    try:
        response = handler(test_event, None)
        print(f"✅ Handler returned status code: {response['statusCode']}")
    except Exception as e:
        print(f"❌ Handler failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    # Parse response
    if response['statusCode'] != 200:
        print(f"❌ Handler returned error status: {response['statusCode']}")
        print(f"   Body: {response.get('body', 'No body')}")
        return False
    
    try:
        body = json.loads(response['body'])
        if not body.get('success'):
            print(f"❌ Handler returned success=False")
            print(f"   Error: {body.get('error', 'Unknown error')}")
            return False
        
        data = body.get('data', {})
        geojson = data.get('geojson', {})
        features = geojson.get('features', [])
        
        print(f"\n✅ Handler succeeded")
        print(f"   Total features: {len(features)}")
        
    except json.JSONDecodeError as e:
        print(f"❌ Failed to parse response body: {e}")
        return False
    
    # Filter turbine features
    turbine_features = [f for f in features if f.get('properties', {}).get('type') == 'turbine']
    print(f"   Turbine features: {len(turbine_features)}")
    
    if len(turbine_features) == 0:
        print("❌ No turbine features found in GeoJSON")
        return False
    
    # Verify each turbine has required properties
    print("\n🔍 Verifying Turbine Properties:")
    print("-" * 70)
    
    required_properties = [
        'type',
        'turbine_id',
        'capacity_MW',
        'hub_height_m',
        'rotor_diameter_m'
    ]
    
    all_valid = True
    for i, turbine in enumerate(turbine_features, start=1):
        props = turbine.get('properties', {})
        
        print(f"\nTurbine {i}:")
        print(f"   Geometry: {turbine.get('geometry', {}).get('type', 'Unknown')}")
        print(f"   Coordinates: {turbine.get('geometry', {}).get('coordinates', 'Unknown')}")
        
        # Check each required property
        missing_props = []
        for prop in required_properties:
            if prop in props:
                value = props[prop]
                print(f"   ✅ {prop}: {value}")
            else:
                print(f"   ❌ {prop}: MISSING")
                missing_props.append(prop)
                all_valid = False
        
        # Verify turbine_id format (T001, T002, etc.)
        turbine_id = props.get('turbine_id', '')
        if turbine_id:
            if turbine_id.startswith('T') and len(turbine_id) == 4 and turbine_id[1:].isdigit():
                print(f"   ✅ turbine_id format: Correct (T{i:03d})")
            else:
                print(f"   ❌ turbine_id format: Invalid (expected T{i:03d}, got {turbine_id})")
                all_valid = False
        
        if missing_props:
            print(f"   ⚠️  Missing properties: {', '.join(missing_props)}")
    
    # Summary
    print("\n" + "=" * 70)
    print("TEST SUMMARY")
    print("=" * 70)
    
    if all_valid:
        print("✅ ALL TURBINE FEATURES HAVE REQUIRED PROPERTIES")
        print(f"   - Verified {len(turbine_features)} turbines")
        print(f"   - All have type='turbine'")
        print(f"   - All have turbine_id (T001, T002, T003, ...)")
        print(f"   - All have capacity_MW")
        print(f"   - All have hub_height_m")
        print(f"   - All have rotor_diameter_m")
        print("\n✅ TASK 3 COMPLETE: Turbine properties successfully added")
        return True
    else:
        print("❌ SOME TURBINE FEATURES ARE MISSING REQUIRED PROPERTIES")
        print("   Review the output above for details")
        return False

if __name__ == '__main__':
    success = test_turbine_properties()
    sys.exit(0 if success else 1)
