/**
 * OSM Integration Validation Tests
 * 
 * Tests the complete OSM integration pipeline to ensure:
 * 1. Real OSM data retrieval with 100+ features for known locations
 * 2. Feature classification and geometry processing
 * 3. Error handling and fallback mechanisms
 * 4. Map rendering with proper overlays
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_LOCATIONS = [
    {
        name: 'Manhattan, NYC',
        lat: 40.7589,
        lng: -73.9851,
        expectedMinFeatures: 150,
        description: 'Dense urban area with many buildings, roads, and infrastructure'
    },
    {
        name: 'Central London',
        lat: 51.5074,
        lng: -0.1278,
        expectedMinFeatures: 120,
        description: 'Historic city center with diverse feature types'
    },
    {
        name: 'Downtown San Francisco',
        lat: 37.7749,
        lng: -122.4194,
        expectedMinFeatures: 100,
        description: 'Urban area with varied terrain and infrastructure'
    }
];

const EXPECTED_FEATURE_TYPES = [
    'building',
    'highway',
    'major_highway',
    'water',
    'railway',
    'power_infrastructure',
    'industrial',
    'forest',
    'protected_area'
];

describe('OSM Integration Validation', () => {
    let lambdaFunction;
    
    beforeAll(() => {
        // Ensure the Lambda function is available for testing
        const handlerPath = path.join(__dirname, '../amplify/functions/renewableTools/terrain/handler.py');
        expect(fs.existsSync(handlerPath)).toBe(true);
    });

    describe('Real OSM Data Retrieval', () => {
        TEST_LOCATIONS.forEach(location => {
            test(`should retrieve 100+ features for ${location.name}`, async () => {
                console.log(`🌍 Testing OSM data retrieval for ${location.name}`);
                console.log(`📍 Coordinates: ${location.lat}, ${location.lng}`);
                console.log(`🎯 Expected minimum features: ${location.expectedMinFeatures}`);
                
                const event = {
                    parameters: {
                        latitude: location.lat,
                        longitude: location.lng,
                        radius_km: 2.0,
                        project_id: `test-osm-${Date.now()}`
                    }
                };

                try {
                    // Invoke the terrain handler
                    const result = await invokeLambdaFunction(event);
                    
                    // Validate response structure
                    expect(result.statusCode).toBe(200);
                    expect(result.body).toBeDefined();
                    
                    const responseData = JSON.parse(result.body);
                    expect(responseData.success).toBe(true);
                    expect(responseData.type).toBe('terrain_analysis');
                    expect(responseData.data).toBeDefined();
                    
                    // Validate GeoJSON data
                    const geojson = responseData.data.geojson;
                    expect(geojson).toBeDefined();
                    expect(geojson.type).toBe('FeatureCollection');
                    expect(geojson.features).toBeDefined();
                    expect(Array.isArray(geojson.features)).toBe(true);
                    
                    // Check feature count
                    const featureCount = geojson.features.length;
                    console.log(`📊 Retrieved ${featureCount} features`);
                    
                    expect(featureCount).toBeGreaterThanOrEqual(location.expectedMinFeatures);
                    
                    // Validate metadata
                    const metadata = geojson.metadata;
                    expect(metadata).toBeDefined();
                    expect(metadata.source).toBe('openstreetmap');
                    expect(metadata.feature_count).toBe(featureCount);
                    expect(metadata.data_quality).toBeDefined();
                    expect(metadata.data_quality.completeness).toBe('high');
                    
                    // Log success metrics
                    console.log(`✅ SUCCESS: Retrieved ${featureCount} real OSM features`);
                    console.log(`📊 Feature statistics: ${JSON.stringify(metadata.feature_statistics)}`);
                    console.log(`🔍 Data quality: ${JSON.stringify(metadata.data_quality)}`);
                    
                } catch (error) {
                    console.error(`❌ Test failed for ${location.name}:`, error);
                    throw error;
                }
            }, 60000); // 60 second timeout for network requests
        });
    });

    describe('Feature Classification and Geometry Processing', () => {
        test('should properly classify and process different feature types', async () => {
            console.log('🔍 Testing feature classification and geometry processing');
            
            const event = {
                parameters: {
                    latitude: 40.7589, // Manhattan
                    longitude: -73.9851,
                    radius_km: 1.5,
                    project_id: `test-classification-${Date.now()}`
                }
            };

            const result = await invokeLambdaFunction(event);
            const responseData = JSON.parse(result.body);
            const features = responseData.data.geojson.features;
            
            // Validate feature structure and classification
            const featureTypeCount = {};
            const geometryTypeCount = {};
            let validGeometryCount = 0;
            
            features.forEach((feature, index) => {
                // Validate feature structure
                expect(feature.type).toBe('Feature');
                expect(feature.geometry).toBeDefined();
                expect(feature.properties).toBeDefined();
                
                // Count feature types
                const featureType = feature.properties.feature_type;
                expect(featureType).toBeDefined();
                featureTypeCount[featureType] = (featureTypeCount[featureType] || 0) + 1;
                
                // Count geometry types
                const geometryType = feature.geometry.type;
                expect(geometryType).toBeDefined();
                expect(['Point', 'LineString', 'Polygon']).toContain(geometryType);
                geometryTypeCount[geometryType] = (geometryTypeCount[geometryType] || 0) + 1;
                
                // Validate geometry coordinates
                const coordinates = feature.geometry.coordinates;
                expect(coordinates).toBeDefined();
                expect(Array.isArray(coordinates)).toBe(true);
                
                if (validateGeometry(feature.geometry)) {
                    validGeometryCount++;
                }
                
                // Validate properties
                const props = feature.properties;
                expect(props.osm_id).toBeDefined();
                expect(props.data_source).toBe('openstreetmap');
                expect(props.reliability).toBe('high');
                expect(props.wind_impact).toBeDefined();
                expect(props.required_setback_m).toBeDefined();
                expect(typeof props.required_setback_m).toBe('number');
            });
            
            console.log(`📊 Feature type distribution: ${JSON.stringify(featureTypeCount)}`);
            console.log(`📊 Geometry type distribution: ${JSON.stringify(geometryTypeCount)}`);
            console.log(`✅ Valid geometries: ${validGeometryCount}/${features.length}`);
            
            // Validate that we have diverse feature types
            expect(Object.keys(featureTypeCount).length).toBeGreaterThanOrEqual(3);
            
            // Validate that most geometries are valid
            expect(validGeometryCount / features.length).toBeGreaterThanOrEqual(0.95);
            
            // Validate that we have expected feature types for urban area
            const expectedUrbanTypes = ['building', 'highway', 'water'];
            expectedUrbanTypes.forEach(expectedType => {
                expect(featureTypeCount[expectedType]).toBeGreaterThan(0);
            });
        }, 45000);
    });

    describe('Error Handling and Fallback Mechanisms', () => {
        test('should handle invalid coordinates gracefully', async () => {
            console.log('🔍 Testing error handling for invalid coordinates');
            
            const event = {
                parameters: {
                    latitude: 999, // Invalid latitude
                    longitude: 999, // Invalid longitude
                    radius_km: 2.0,
                    project_id: `test-invalid-coords-${Date.now()}`
                }
            };

            const result = await invokeLambdaFunction(event);
            
            // Should still return a valid response with fallback data
            expect(result.statusCode).toBe(200);
            
            const responseData = JSON.parse(result.body);
            expect(responseData.success).toBe(true);
            
            // Should use synthetic fallback data
            const geojson = responseData.data.geojson;
            expect(geojson.metadata.source).toBe('synthetic_fallback');
            expect(geojson.metadata.warning).toContain('SYNTHETIC DATA');
            
            console.log('✅ Invalid coordinates handled with synthetic fallback');
        }, 30000);

        test('should provide clear synthetic data labeling', async () => {
            console.log('🔍 Testing synthetic data labeling');
            
            // Use coordinates that might trigger fallback (remote ocean location)
            const event = {
                parameters: {
                    latitude: 0.0, // Equator in Atlantic Ocean
                    longitude: -30.0,
                    radius_km: 1.0,
                    project_id: `test-synthetic-${Date.now()}`
                }
            };

            const result = await invokeLambdaFunction(event);
            const responseData = JSON.parse(result.body);
            const geojson = responseData.data.geojson;
            
            // If synthetic data is used, validate proper labeling
            if (geojson.metadata.source === 'synthetic_fallback') {
                expect(geojson.metadata.warning).toContain('SYNTHETIC DATA');
                expect(geojson.metadata.error_reason).toBeDefined();
                
                // Validate that synthetic features are properly labeled
                geojson.features.forEach(feature => {
                    expect(feature.properties.data_source).toBe('synthetic_fallback');
                    expect(feature.properties.reliability).toBe('low');
                    expect(feature.properties.warning).toContain('SYNTHETIC DATA');
                });
                
                console.log('✅ Synthetic data properly labeled');
            } else {
                console.log('✅ Real OSM data retrieved (no synthetic fallback needed)');
            }
        }, 30000);
    });

    describe('Map Rendering Validation', () => {
        test('should generate valid HTML map with overlays', async () => {
            console.log('🗺️ Testing map HTML generation');
            
            const event = {
                parameters: {
                    latitude: 40.7589,
                    longitude: -73.9851,
                    radius_km: 1.0,
                    project_id: `test-map-${Date.now()}`
                }
            };

            const result = await invokeLambdaFunction(event);
            const responseData = JSON.parse(result.body);
            
            // Validate map HTML is generated
            expect(responseData.data.mapHtml).toBeDefined();
            expect(typeof responseData.data.mapHtml).toBe('string');
            expect(responseData.data.mapHtml.length).toBeGreaterThan(1000);
            
            const mapHtml = responseData.data.mapHtml;
            
            // Validate HTML structure
            expect(mapHtml).toContain('<!DOCTYPE html>');
            expect(mapHtml).toContain('<div id="map"></div>');
            expect(mapHtml).toContain('leaflet@1.9.4');
            expect(mapHtml).toContain('L.map(');
            expect(mapHtml).toContain('.setView(');
            
            // Validate JavaScript data injection
            expect(mapHtml).toContain('var markers =');
            expect(mapHtml).toContain('var overlays =');
            
            // Validate styling functions
            expect(mapHtml).toContain('getDefaultOverlayStyle');
            expect(mapHtml).toContain('getMarkerColor');
            
            // Validate feature-specific styling
            expect(mapHtml).toContain('#e74c3c'); // Building red
            expect(mapHtml).toContain('#f39c12'); // Highway orange
            expect(mapHtml).toContain('#3498db'); // Water blue
            
            console.log(`✅ Valid HTML map generated (${mapHtml.length} characters)`);
            
            // Validate debug information
            const debug = responseData.data.debug;
            expect(debug).toBeDefined();
            expect(debug.map_generation_method).toBeDefined();
            expect(debug.map_html_length).toBe(mapHtml.length);
            
        }, 45000);
    });

    describe('Performance and Reliability', () => {
        test('should complete queries within reasonable time limits', async () => {
            console.log('⏱️ Testing query performance');
            
            const startTime = Date.now();
            
            const event = {
                parameters: {
                    latitude: 51.5074,
                    longitude: -0.1278,
                    radius_km: 1.5,
                    project_id: `test-performance-${Date.now()}`
                }
            };

            const result = await invokeLambdaFunction(event);
            const endTime = Date.now();
            const queryTime = endTime - startTime;
            
            console.log(`⏱️ Query completed in ${queryTime}ms`);
            
            // Should complete within 30 seconds
            expect(queryTime).toBeLessThan(30000);
            
            // Validate successful response
            expect(result.statusCode).toBe(200);
            const responseData = JSON.parse(result.body);
            expect(responseData.success).toBe(true);
            
            console.log(`✅ Performance test passed (${queryTime}ms)`);
        }, 35000);
    });
});

// Helper functions
async function invokeLambdaFunction(event) {
    // For testing, we'll use a Python subprocess to invoke the handler
    // In a real AWS environment, this would use the AWS SDK
    
    const tempEventFile = path.join(__dirname, `temp-event-${Date.now()}.json`);
    const tempResultFile = path.join(__dirname, `temp-result-${Date.now()}.json`);
    
    try {
        // Write event to temporary file
        fs.writeFileSync(tempEventFile, JSON.stringify(event));
        
        // Create a test script to invoke the handler
        const testScript = `
import json
import sys
import os

# Add the handler directory to path
sys.path.insert(0, '${path.join(__dirname, '../amplify/functions/renewableTools/terrain')}')
sys.path.insert(0, '${path.join(__dirname, '../amplify/functions/renewableTools')}')

try:
    from handler import handler
    
    # Load event
    with open('${tempEventFile}', 'r') as f:
        event = json.load(f)
    
    # Create mock context
    class MockContext:
        def __init__(self):
            self.function_name = 'test-terrain-handler'
            self.function_version = '1'
            self.invoked_function_arn = 'arn:aws:lambda:us-east-1:123456789012:function:test'
            self.memory_limit_in_mb = 512
            self.remaining_time_in_millis = lambda: 30000
    
    context = MockContext()
    
    # Invoke handler
    result = handler(event, context)
    
    # Write result
    with open('${tempResultFile}', 'w') as f:
        json.dump(result, f)
        
except Exception as e:
    error_result = {
        'statusCode': 500,
        'body': json.dumps({
            'success': False,
            'error': str(e),
            'error_type': type(e).__name__
        })
    }
    with open('${tempResultFile}', 'w') as f:
        json.dump(error_result, f)
`;
        
        const tempScriptFile = path.join(__dirname, `temp-script-${Date.now()}.py`);
        fs.writeFileSync(tempScriptFile, testScript);
        
        // Execute the test script
        execSync(`cd ${__dirname} && python ${tempScriptFile}`, {
            timeout: 60000,
            stdio: 'pipe'
        });
        
        // Read result
        const result = JSON.parse(fs.readFileSync(tempResultFile, 'utf8'));
        
        // Cleanup
        fs.unlinkSync(tempEventFile);
        fs.unlinkSync(tempResultFile);
        fs.unlinkSync(tempScriptFile);
        
        return result;
        
    } catch (error) {
        // Cleanup on error
        [tempEventFile, tempResultFile].forEach(file => {
            if (fs.existsSync(file)) {
                fs.unlinkSync(file);
            }
        });
        
        throw error;
    }
}

function validateGeometry(geometry) {
    const { type, coordinates } = geometry;
    
    if (!coordinates || !Array.isArray(coordinates)) {
        return false;
    }
    
    switch (type) {
        case 'Point':
            return coordinates.length === 2 && 
                   coordinates.every(coord => typeof coord === 'number');
        
        case 'LineString':
            return coordinates.length >= 2 &&
                   coordinates.every(coord => 
                       Array.isArray(coord) && 
                       coord.length === 2 && 
                       coord.every(c => typeof c === 'number')
                   );
        
        case 'Polygon':
            return coordinates.length > 0 &&
                   coordinates[0].length >= 4 &&
                   coordinates[0].every(coord => 
                       Array.isArray(coord) && 
                       coord.length === 2 && 
                       coord.every(c => typeof c === 'number')
                   );
        
        default:
            return false;
    }
}