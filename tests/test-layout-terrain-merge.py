#!/usr/bin/env python3
"""
Test: Layout Tool Terrain Feature Merging
Verifies that terrain features (including perimeter) are merged into layout GeoJSON
Requirements: 3.1, 3.2, 3.3
"""

import json
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'amplify', 'functions', 'renewableTools', 'layout'))

def test_terrain_feature_merging():
    """Test that layout handler merges terrain features with turbine features"""
    
    print("=" * 70)
    print("TEST: Layout Tool Terrain Feature Merging")
    print("=" * 70)
    
    # Create mock event with terrain results in project context
    event = {
        'parameters': {
            'project_id': 'test-project',
            'latitude': 35.0,
            'longitude': -101.0,
            'num_turbines': 5,
            'turbine_model': 'GE 2.5-120',
            'capacity_mw': 2.5,
            'spacing_d': 9.0,
            'rotor_diameter': 120.0
        },
        'project_context': {
            'coordinates': {
                'latitude': 35.0,
                'longitude': -101.0
            },
            'terrain_results': {
                'geojson': {
                    'type': 'FeatureCollection',
                    'features': [
                        {
                            'type': 'Feature',
                            'geometry': {
                                'type': 'Polygon',
                                'coordinates': [[
                                    [-101.01, 35.01],
                                    [-101.01, 35.02],
                                    [-101.00, 35.02],
                                    [-101.00, 35.01],
                                    [-101.01, 35.01]
                                ]]
                            },
                            'properties': {
                                'type': 'building',
                                'name': 'Test Building'
                            }
                        },
                        {
                            'type': 'Feature',
                            'geometry': {
                                'type': 'LineString',
                                'coordinates': [
                                    [-101.02, 35.00],
                                    [-101.00, 35.00]
                                ]
                            },
                            'properties': {
                                'type': 'road',
                                'name': 'Test Road'
                            }
                        },
                        {
                            'type': 'Feature',
                            'geometry': {
                                'type': 'Polygon',
                                'coordinates': [[
                                    [-101.03, 35.03],
                                    [-101.03, 35.04],
                                    [-101.02, 35.04],
                                    [-101.02, 35.03],
                                    [-101.03, 35.03]
                                ]]
                            },
                            'properties': {
                                'type': 'water',
                                'name': 'Test Water Body'
                            }
                        },
                        {
                            'type': 'Feature',
                            'geometry': {
                                'type': 'Polygon',
                                'coordinates': [[
                                    [-101.05, 34.95],
                                    [-101.05, 35.05],
                                    [-100.95, 35.05],
                                    [-100.95, 34.95],
                                    [-101.05, 34.95]
                                ]]
                            },
                            'properties': {
                                'type': 'perimeter',
                                'name': 'Site Perimeter',
                                'radius_km': 5.0,
                                'area_km2': 78.5
                            }
                        }
                    ]
                },
                'exclusionZones': {
                    'buildings': [{'lat': 35.01, 'lon': -101.01}],
                    'roads': [{'lat': 35.00, 'lon': -101.01}],
                    'waterBodies': [{'lat': 35.03, 'lon': -101.03}]
                }
            }
        }
    }
    
    # Import handler
    try:
        from handler import handler
    except ImportError as e:
        print(f"❌ Failed to import handler: {e}")
        return False
    
    # Call handler
    print("\n📞 Calling layout handler with terrain features...")
    try:
        response = handler(event, {})
        print(f"✅ Handler returned status code: {response['statusCode']}")
    except Exception as e:
        print(f"❌ Handler execution failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    # Parse response
    if response['statusCode'] != 200:
        print(f"❌ Handler returned error status: {response['statusCode']}")
        print(f"Response body: {response.get('body', 'No body')}")
        return False
    
    try:
        body = json.loads(response['body'])
    except json.JSONDecodeError as e:
        print(f"❌ Failed to parse response body: {e}")
        return False
    
    if not body.get('success'):
        print(f"❌ Handler returned success=False")
        print(f"Error: {body.get('error', 'Unknown error')}")
        return False
    
    data = body.get('data', {})
    geojson = data.get('geojson', {})
    
    # Verify GeoJSON structure
    print("\n🔍 Verifying GeoJSON structure...")
    if geojson.get('type') != 'FeatureCollection':
        print(f"❌ GeoJSON type is not FeatureCollection: {geojson.get('type')}")
        return False
    print("✅ GeoJSON is a FeatureCollection")
    
    features = geojson.get('features', [])
    if not features:
        print("❌ No features in GeoJSON")
        return False
    print(f"✅ GeoJSON contains {len(features)} features")
    
    # Count feature types
    feature_types = {}
    for feature in features:
        feature_type = feature.get('properties', {}).get('type', 'unknown')
        feature_types[feature_type] = feature_types.get(feature_type, 0) + 1
    
    print(f"\n📊 Feature type breakdown:")
    for ftype, count in feature_types.items():
        print(f"   - {ftype}: {count}")
    
    # Verify terrain features are present (Requirement 3.1)
    print("\n✅ Requirement 3.1: Terrain features included in layout GeoJSON")
    required_terrain_types = ['building', 'road', 'water', 'perimeter']
    missing_types = []
    for terrain_type in required_terrain_types:
        if terrain_type not in feature_types:
            missing_types.append(terrain_type)
    
    if missing_types:
        print(f"❌ Missing terrain feature types: {missing_types}")
        return False
    print(f"✅ All terrain feature types present: {required_terrain_types}")
    
    # Verify turbine features are present
    if 'turbine' not in feature_types:
        print("❌ No turbine features in GeoJSON")
        return False
    turbine_count = feature_types['turbine']
    print(f"✅ {turbine_count} turbine features present")
    
    # Verify feature properties are preserved (Requirement 3.2)
    print("\n✅ Requirement 3.2: Feature properties preserved")
    for feature in features:
        props = feature.get('properties', {})
        feature_type = props.get('type')
        
        if feature_type == 'building':
            if 'name' not in props:
                print(f"❌ Building feature missing 'name' property")
                return False
            # Check styling properties
            if 'fill' not in props or 'stroke' not in props:
                print(f"❌ Building feature missing styling properties")
                return False
            print(f"✅ Building feature has name='{props['name']}' and styling")
            
        elif feature_type == 'road':
            if 'name' not in props:
                print(f"❌ Road feature missing 'name' property")
                return False
            if 'stroke' not in props:
                print(f"❌ Road feature missing stroke styling")
                return False
            print(f"✅ Road feature has name='{props['name']}' and styling")
            
        elif feature_type == 'water':
            if 'name' not in props:
                print(f"❌ Water feature missing 'name' property")
                return False
            if 'fill' not in props or 'stroke' not in props:
                print(f"❌ Water feature missing styling properties")
                return False
            print(f"✅ Water feature has name='{props['name']}' and styling")
            
        elif feature_type == 'perimeter':
            if 'name' not in props:
                print(f"❌ Perimeter feature missing 'name' property")
                return False
            if 'radius_km' not in props or 'area_km2' not in props:
                print(f"❌ Perimeter feature missing radius_km or area_km2")
                return False
            # Check perimeter styling (dashed line, transparent fill)
            if props.get('fill') != 'transparent':
                print(f"❌ Perimeter fill should be transparent, got: {props.get('fill')}")
                return False
            if 'stroke-dasharray' not in props:
                print(f"❌ Perimeter missing dashed line styling (stroke-dasharray)")
                return False
            print(f"✅ Perimeter feature has name='{props['name']}', radius={props['radius_km']}km, area={props['area_km2']}km²")
            print(f"   Styling: fill={props['fill']}, stroke={props.get('stroke')}, dasharray={props.get('stroke-dasharray')}")
            
        elif feature_type == 'turbine':
            if 'turbine_id' not in props:
                print(f"❌ Turbine feature missing 'turbine_id' property")
                return False
            if 'turbine_model' not in props or 'capacity_MW' not in props:
                print(f"❌ Turbine feature missing model or capacity")
                return False
    
    # Verify terrain features render before turbines (Requirement 3.3)
    print("\n✅ Requirement 3.3: Terrain features before turbines in feature array")
    first_turbine_index = None
    last_terrain_index = None
    
    for i, feature in enumerate(features):
        feature_type = feature.get('properties', {}).get('type')
        if feature_type == 'turbine' and first_turbine_index is None:
            first_turbine_index = i
        if feature_type in ['building', 'road', 'water', 'perimeter']:
            last_terrain_index = i
    
    if first_turbine_index is not None and last_terrain_index is not None:
        if last_terrain_index > first_turbine_index:
            print(f"❌ Terrain features found after turbines (last terrain at index {last_terrain_index}, first turbine at {first_turbine_index})")
            return False
        print(f"✅ All terrain features ({last_terrain_index}) come before turbines ({first_turbine_index})")
    
    print("\n" + "=" * 70)
    print("✅ ALL TESTS PASSED")
    print("=" * 70)
    print("\nSummary:")
    print(f"  - Total features: {len(features)}")
    print(f"  - Terrain features: {sum(feature_types.get(t, 0) for t in ['building', 'road', 'water', 'perimeter'])}")
    print(f"  - Turbine features: {feature_types.get('turbine', 0)}")
    print(f"  - Perimeter styling: dashed line with transparent fill ✅")
    print(f"  - Feature order: terrain → turbines ✅")
    
    return True

if __name__ == '__main__':
    success = test_terrain_feature_merging()
    sys.exit(0 if success else 1)
