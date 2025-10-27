#!/usr/bin/env python3
"""
Integration test for perimeter feature in terrain analysis
Verifies that terrain analysis includes perimeter in GeoJSON output
"""

import sys
import os
import json

# Add the terrain handler directory to path
terrain_dir = os.path.join(os.path.dirname(__file__), '..', 'amplify', 'functions', 'renewableTools', 'terrain')
sys.path.insert(0, terrain_dir)

def test_terrain_perimeter_integration():
    """Test that terrain analysis includes perimeter feature"""
    
    print("🧪 Testing terrain analysis perimeter integration...")
    
    # Mock event
    test_event = {
        'parameters': {
            'latitude': 35.067482,
            'longitude': -101.395466,
            'radius_km': 5.0,
            'project_id': 'test-perimeter-integration'
        }
    }
    
    # Mock context
    class MockContext:
        pass
    
    # Set required environment variables
    os.environ['RENEWABLE_S3_BUCKET'] = 'test-bucket'
    os.environ['RENEWABLE_AWS_REGION'] = 'us-west-2'
    
    # Import handler
    try:
        from handler import handler
        print("✅ Successfully imported handler")
    except ImportError as e:
        print(f"❌ Failed to import handler: {e}")
        return False
    
    # Execute handler
    print("\n🚀 Executing terrain analysis handler...")
    try:
        response = handler(test_event, MockContext())
        print("✅ Handler executed successfully")
    except Exception as e:
        print(f"❌ Handler execution failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    # Parse response
    if response.get('statusCode') != 200:
        print(f"❌ Handler returned error status: {response.get('statusCode')}")
        print(f"   Body: {response.get('body')}")
        return False
    
    try:
        body = json.loads(response.get('body', '{}'))
    except json.JSONDecodeError as e:
        print(f"❌ Failed to parse response body: {e}")
        return False
    
    if not body.get('success'):
        print(f"❌ Handler returned success=False")
        print(f"   Error: {body.get('error')}")
        return False
    
    print("✅ Handler returned success response")
    
    # Extract data
    data = body.get('data', {})
    geojson = data.get('geojson')
    
    if not geojson:
        print("❌ No geojson in response data")
        return False
    
    print("✅ GeoJSON present in response")
    
    # Check features
    features = geojson.get('features', [])
    if not features:
        print("❌ No features in GeoJSON")
        return False
    
    print(f"✅ GeoJSON has {len(features)} features")
    
    # Find perimeter feature
    print("\n🔍 Looking for perimeter feature...")
    perimeter_features = [
        f for f in features 
        if f.get('properties', {}).get('type') == 'perimeter' or
           f.get('properties', {}).get('feature_type') == 'perimeter'
    ]
    
    if not perimeter_features:
        print("❌ No perimeter feature found in GeoJSON")
        print(f"   Feature types present: {[f.get('properties', {}).get('feature_type') for f in features]}")
        return False
    
    print(f"✅ Found {len(perimeter_features)} perimeter feature(s)")
    
    # Validate perimeter feature
    perimeter = perimeter_features[0]
    props = perimeter.get('properties', {})
    
    print("\n📊 Perimeter Feature Details:")
    print(f"   Name: {props.get('name')}")
    print(f"   Type: {props.get('type')}")
    print(f"   Feature Type: {props.get('feature_type')}")
    print(f"   Radius: {props.get('radius_km')} km")
    print(f"   Area: {props.get('area_km2')} km²")
    print(f"   Data Source: {props.get('data_source')}")
    
    # Check metadata
    metadata = geojson.get('metadata', {})
    if metadata.get('includes_perimeter'):
        print("✅ Metadata indicates perimeter is included")
    else:
        print("⚠️ Warning: Metadata does not indicate perimeter inclusion")
    
    # Validate geometry
    geometry = perimeter.get('geometry', {})
    if geometry.get('type') != 'Polygon':
        print(f"❌ Invalid perimeter geometry type: {geometry.get('type')}")
        return False
    
    coordinates = geometry.get('coordinates', [])
    if not coordinates or len(coordinates[0]) < 4:
        print(f"❌ Invalid perimeter coordinates")
        return False
    
    print(f"✅ Perimeter has valid polygon geometry with {len(coordinates[0])} points")
    
    # Check that perimeter is the last feature (added after OSM features)
    last_feature = features[-1]
    if last_feature.get('properties', {}).get('type') == 'perimeter':
        print("✅ Perimeter is the last feature (added after OSM features)")
    else:
        print("⚠️ Warning: Perimeter is not the last feature")
    
    print("\n✅ All terrain perimeter integration tests passed!")
    print(f"\n📋 Summary:")
    print(f"   Total features: {len(features)}")
    print(f"   Perimeter features: {len(perimeter_features)}")
    print(f"   Other features: {len(features) - len(perimeter_features)}")
    
    return True

if __name__ == '__main__':
    success = test_terrain_perimeter_integration()
    sys.exit(0 if success else 1)
