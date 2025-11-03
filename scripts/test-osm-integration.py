#!/usr/bin/env python3
"""
OSM Integration Validation Script

This script tests the OSM integration functionality to ensure:
1. Real OSM data retrieval with 100+ features for known locations
2. Feature classification and geometry processing
3. Error handling and fallback mechanisms
4. Map rendering with proper overlays

Usage:
    python scripts/test-osm-integration.py
"""

import json
import sys
import os
import time
from datetime import datetime

# Add the handler directories to path
script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(script_dir)
terrain_handler_dir = os.path.join(project_root, 'amplify/functions/renewableTools/terrain')
renewable_tools_dir = os.path.join(project_root, 'amplify/functions/renewableTools')

sys.path.insert(0, terrain_handler_dir)
sys.path.insert(0, renewable_tools_dir)

# Test configuration
TEST_LOCATIONS = [
    {
        'name': 'Manhattan, NYC',
        'lat': 40.7589,
        'lng': -73.9851,
        'expected_min_features': 150,
        'description': 'Dense urban area with many buildings, roads, and infrastructure'
    },
    {
        'name': 'Central London',
        'lat': 51.5074,
        'lng': -0.1278,
        'expected_min_features': 120,
        'description': 'Historic city center with diverse feature types'
    },
    {
        'name': 'Downtown San Francisco',
        'lat': 37.7749,
        'lng': -122.4194,
        'expected_min_features': 100,
        'description': 'Urban area with varied terrain and infrastructure'
    }
]

EXPECTED_FEATURE_TYPES = [
    'building',
    'highway',
    'major_highway',
    'water',
    'railway',
    'power_infrastructure',
    'industrial',
    'forest',
    'protected_area'
]

class MockContext:
    """Mock AWS Lambda context for testing"""
    def __init__(self):
        self.function_name = 'test-terrain-handler'
        self.function_version = '1'
        self.invoked_function_arn = 'arn:aws:lambda:us-east-1:123456789012:function:test'
        self.memory_limit_in_mb = 512
        self.aws_request_id = f'test-{int(time.time())}'
        
    def get_remaining_time_in_millis(self):
        return 30000

def run_terrain_handler_test(event):
    """Run the terrain handler with the given event"""
    try:
        from handler import handler
        context = MockContext()
        return handler(event, context)
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({
                'success': False,
                'error': str(e),
                'error_type': type(e).__name__
            })
        }

def validate_geometry(geometry):
    """Validate GeoJSON geometry"""
    geometry_type = geometry.get('type')
    coordinates = geometry.get('coordinates', [])
    
    if not coordinates:
        return False
    
    if geometry_type == 'Point':
        return (len(coordinates) == 2 and 
                all(isinstance(c, (int, float)) for c in coordinates))
    
    elif geometry_type == 'LineString':
        return (len(coordinates) >= 2 and
                all(len(coord) == 2 and all(isinstance(c, (int, float)) for c in coord) 
                    for coord in coordinates))
    
    elif geometry_type == 'Polygon':
        if not coordinates or len(coordinates) == 0:
            return False
        outer_ring = coordinates[0]
        return (len(outer_ring) >= 4 and
                all(len(coord) == 2 and all(isinstance(c, (int, float)) for c in coord) 
                    for coord in outer_ring))
    
    return False

def test_real_osm_data_retrieval():
    """Test real OSM data retrieval for known locations"""
    print("🌍 Testing Real OSM Data Retrieval")
    print("=" * 50)
    
    results = []
    
    for location in TEST_LOCATIONS:
        print(f"\n📍 Testing {location['name']}")
        print(f"   Coordinates: {location['lat']}, {location['lng']}")
        print(f"   Expected minimum features: {location['expected_min_features']}")
        
        event = {
            'parameters': {
                'latitude': location['lat'],
                'longitude': location['lng'],
                'radius_km': 2.0,
                'project_id': f"test-osm-{int(time.time())}"
            }
        }
        
        start_time = time.time()
        result = run_terrain_handler_test(event)
        query_time = time.time() - start_time
        
        # Validate response
        if result['statusCode'] != 200:
            print(f"   ❌ FAILED: HTTP {result['statusCode']}")
            results.append({'location': location['name'], 'success': False, 'error': 'HTTP error'})
            continue
        
        try:
            response_data = json.loads(result['body'])
            if not response_data.get('success'):
                print(f"   ❌ FAILED: {response_data.get('error', 'Unknown error')}")
                results.append({'location': location['name'], 'success': False, 'error': response_data.get('error')})
                continue
            
            # Validate GeoJSON data
            geojson = response_data['data']['geojson']
            features = geojson['features']
            feature_count = len(features)
            metadata = geojson['metadata']
            
            print(f"   📊 Retrieved {feature_count} features in {query_time:.2f}s")
            print(f"   📡 Data source: {metadata.get('source', 'unknown')}")
            print(f"   🔍 Data quality: {metadata.get('data_quality', {}).get('completeness', 'unknown')}")
            
            # Check if we got real OSM data
            if metadata.get('source') == 'openstreetmap':
                if feature_count >= location['expected_min_features']:
                    print(f"   ✅ SUCCESS: Retrieved {feature_count} real OSM features (>= {location['expected_min_features']})")
                    results.append({
                        'location': location['name'], 
                        'success': True, 
                        'feature_count': feature_count,
                        'query_time': query_time,
                        'data_source': 'real_osm'
                    })
                else:
                    print(f"   ⚠️ WARNING: Only {feature_count} features (expected >= {location['expected_min_features']})")
                    results.append({
                        'location': location['name'], 
                        'success': False, 
                        'feature_count': feature_count,
                        'error': 'Insufficient features'
                    })
            else:
                print(f"   ⚠️ WARNING: Using fallback data source: {metadata.get('source')}")
                print(f"   🚨 REGRESSION ALERT: Not using real OSM data")
                results.append({
                    'location': location['name'], 
                    'success': False, 
                    'feature_count': feature_count,
                    'data_source': metadata.get('source'),
                    'error': 'Fallback data used instead of real OSM'
                })
            
            # Log feature statistics
            feature_stats = metadata.get('feature_statistics', {})
            if feature_stats:
                print(f"   📊 Feature breakdown: {feature_stats}")
            
        except Exception as e:
            print(f"   ❌ FAILED: Error parsing response: {e}")
            results.append({'location': location['name'], 'success': False, 'error': str(e)})
    
    return results

def test_feature_classification():
    """Test feature classification and geometry processing"""
    print("\n🔍 Testing Feature Classification and Geometry Processing")
    print("=" * 60)
    
    event = {
        'parameters': {
            'latitude': 40.7589,  # Manhattan
            'longitude': -73.9851,
            'radius_km': 1.5,
            'project_id': f"test-classification-{int(time.time())}"
        }
    }
    
    result = run_terrain_handler_test(event)
    
    if result['statusCode'] != 200:
        print(f"❌ FAILED: HTTP {result['statusCode']}")
        return False
    
    response_data = json.loads(result['body'])
    features = response_data['data']['geojson']['features']
    
    # Analyze features
    feature_type_count = {}
    geometry_type_count = {}
    valid_geometry_count = 0
    
    for i, feature in enumerate(features):
        # Validate feature structure
        if feature.get('type') != 'Feature':
            print(f"⚠️ Feature {i}: Invalid type")
            continue
        
        if not feature.get('geometry') or not feature.get('properties'):
            print(f"⚠️ Feature {i}: Missing geometry or properties")
            continue
        
        # Count feature types
        feature_type = feature['properties'].get('feature_type')
        if feature_type:
            feature_type_count[feature_type] = feature_type_count.get(feature_type, 0) + 1
        
        # Count geometry types
        geometry_type = feature['geometry'].get('type')
        if geometry_type:
            geometry_type_count[geometry_type] = geometry_type_count.get(geometry_type, 0) + 1
        
        # Validate geometry
        if validate_geometry(feature['geometry']):
            valid_geometry_count += 1
        
        # Validate required properties
        props = feature['properties']
        required_props = ['osm_id', 'data_source', 'wind_impact', 'required_setback_m']
        for prop in required_props:
            if prop not in props:
                print(f"⚠️ Feature {i}: Missing required property '{prop}'")
    
    print(f"📊 Feature type distribution: {feature_type_count}")
    print(f"📊 Geometry type distribution: {geometry_type_count}")
    print(f"✅ Valid geometries: {valid_geometry_count}/{len(features)} ({valid_geometry_count/len(features)*100:.1f}%)")
    
    # Validate diversity
    if len(feature_type_count) >= 3:
        print("✅ Good feature type diversity")
    else:
        print("⚠️ Limited feature type diversity")
    
    # Validate geometry validity
    if valid_geometry_count / len(features) >= 0.95:
        print("✅ High geometry validity rate")
        return True
    else:
        print("❌ Low geometry validity rate")
        return False

def test_error_handling():
    """Test error handling and fallback mechanisms"""
    print("\n🛡️ Testing Error Handling and Fallback Mechanisms")
    print("=" * 55)
    
    # Test invalid coordinates
    print("Testing invalid coordinates...")
    event = {
        'parameters': {
            'latitude': 999,  # Invalid
            'longitude': 999,  # Invalid
            'radius_km': 2.0,
            'project_id': f"test-invalid-{int(time.time())}"
        }
    }
    
    result = run_terrain_handler_test(event)
    
    if result['statusCode'] == 200:
        response_data = json.loads(result['body'])
        if response_data.get('success'):
            geojson = response_data['data']['geojson']
            if geojson['metadata'].get('source') == 'synthetic_fallback':
                print("✅ Invalid coordinates handled with synthetic fallback")
                
                # Validate synthetic data labeling
                for feature in geojson['features']:
                    props = feature['properties']
                    if (props.get('data_source') == 'synthetic_fallback' and 
                        props.get('reliability') == 'low' and
                        'SYNTHETIC DATA' in props.get('warning', '')):
                        continue
                    else:
                        print("⚠️ Synthetic data not properly labeled")
                        return False
                
                print("✅ Synthetic data properly labeled")
                return True
            else:
                print("⚠️ Expected synthetic fallback but got real data")
                return False
        else:
            print(f"❌ Request failed: {response_data.get('error')}")
            return False
    else:
        print(f"❌ HTTP error: {result['statusCode']}")
        return False

def test_map_rendering():
    """Test map HTML generation"""
    print("\n🗺️ Testing Map Rendering")
    print("=" * 30)
    
    event = {
        'parameters': {
            'latitude': 40.7589,
            'longitude': -73.9851,
            'radius_km': 1.0,
            'project_id': f"test-map-{int(time.time())}"
        }
    }
    
    result = run_terrain_handler_test(event)
    
    if result['statusCode'] != 200:
        print(f"❌ FAILED: HTTP {result['statusCode']}")
        return False
    
    response_data = json.loads(result['body'])
    map_html = response_data['data'].get('mapHtml')
    
    if not map_html:
        print("❌ No map HTML generated")
        return False
    
    print(f"📏 Generated HTML length: {len(map_html)} characters")
    
    # Validate HTML structure
    required_elements = [
        '<!DOCTYPE html>',
        '<div id="map"></div>',
        'leaflet@1.9.4',
        'L.map(',
        '.setView(',
        'var markers =',
        'var overlays =',
        'getDefaultOverlayStyle',
        'getMarkerColor'
    ]
    
    missing_elements = []
    for element in required_elements:
        if element not in map_html:
            missing_elements.append(element)
    
    if missing_elements:
        print(f"❌ Missing HTML elements: {missing_elements}")
        return False
    
    # Validate feature-specific styling
    expected_colors = ['#e74c3c', '#f39c12', '#3498db']  # Red, orange, blue
    found_colors = [color for color in expected_colors if color in map_html]
    
    if len(found_colors) >= 2:
        print("✅ Feature-specific styling found")
    else:
        print("⚠️ Limited feature-specific styling")
    
    print("✅ Valid HTML map generated")
    return True

def main():
    """Run all OSM integration tests"""
    print("🧪 OSM Integration Validation Tests")
    print("=" * 40)
    print(f"Started at: {datetime.now().isoformat()}")
    print()
    
    test_results = {
        'osm_data_retrieval': False,
        'feature_classification': False,
        'error_handling': False,
        'map_rendering': False
    }
    
    try:
        # Test 1: Real OSM data retrieval
        osm_results = test_real_osm_data_retrieval()
        successful_locations = [r for r in osm_results if r.get('success')]
        test_results['osm_data_retrieval'] = len(successful_locations) > 0
        
        # Test 2: Feature classification
        test_results['feature_classification'] = test_feature_classification()
        
        # Test 3: Error handling
        test_results['error_handling'] = test_error_handling()
        
        # Test 4: Map rendering
        test_results['map_rendering'] = test_map_rendering()
        
    except Exception as e:
        print(f"\n❌ Test execution failed: {e}")
        import traceback
        traceback.print_exc()
    
    # Summary
    print("\n" + "=" * 50)
    print("📋 TEST SUMMARY")
    print("=" * 50)
    
    total_tests = len(test_results)
    passed_tests = sum(test_results.values())
    
    for test_name, passed in test_results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{test_name.replace('_', ' ').title()}: {status}")
    
    print(f"\nOverall: {passed_tests}/{total_tests} tests passed")
    
    if passed_tests == total_tests:
        print("🎉 ALL TESTS PASSED - OSM Integration is working correctly!")
        return 0
    else:
        print("⚠️ SOME TESTS FAILED - OSM Integration needs attention")
        return 1

if __name__ == '__main__':
    exit_code = main()
    sys.exit(exit_code)