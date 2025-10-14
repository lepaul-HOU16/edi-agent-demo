"""
Ultra-simple terrain handler for ZIP deployment
No external dependencies except boto3 (included in Lambda runtime)
"""
import json
import urllib.request
import urllib.parse
from datetime import datetime
import boto3
import os

# Initialize S3 client
s3_client = boto3.client('s3')
S3_BUCKET = os.environ.get('S3_BUCKET', 'amplify-digitalassistant--workshopstoragebucketd9b-mx1aevbdpmqy')

def handler(event, context):
    """Simple terrain analysis using only standard library + boto3"""
    
    print(f"Terrain handler invoked with event: {json.dumps(event)}")
    
    try:
        # Extract parameters
        params = event.get('parameters', {})
        latitude = params.get('latitude')
        longitude = params.get('longitude')
        project_id = params.get('project_id', f'terrain-{int(datetime.now().timestamp() * 1000)}')
        radius_km = params.get('radius_km', 5.0)
        
        if latitude is None or longitude is None:
            return {
                'success': False,
                'type': 'terrain_analysis',
                'error': 'Missing latitude or longitude',
                'data': {}
            }
        
        print(f"Analyzing terrain at ({latitude}, {longitude}), radius={radius_km}km")
        
        # Enhanced OSM query - comprehensive features for rural Texas towns like Claude
        # Use full radius to get all features (was capped at 3km, now using full radius)
        query_radius = int(radius_km * 1000)  # Use full radius - no cap
        
        # Simplified query for faster response - focus on essential features only
        overpass_query = f"""
        [out:json][timeout:15];
        (
          way["highway"](around:{query_radius},{latitude},{longitude});
          way["building"](around:{query_radius},{latitude},{longitude});
          way["natural"="water"](around:{query_radius},{latitude},{longitude});
          way["waterway"](around:{query_radius},{latitude},{longitude});
          relation["natural"~"^(water|wetland)$"](around:{query_radius},{latitude},{longitude});
          way["landuse"](around:{query_radius},{latitude},{longitude});
          way["power"](around:{query_radius},{latitude},{longitude});
          way["railway"](around:{query_radius},{latitude},{longitude});
          way["amenity"](around:{query_radius},{latitude},{longitude});
          node["amenity"](around:{query_radius},{latitude},{longitude});
          node["place"](around:{query_radius},{latitude},{longitude});
          way["man_made"~"^(silo|water_tower|windmill)$"](around:{query_radius},{latitude},{longitude});
          way["barrier"](around:{query_radius},{latitude},{longitude});
          way["boundary"](around:{query_radius},{latitude},{longitude});
        );
        out geom;
        """
        
        url = "https://overpass-api.de/api/interpreter"
        data = urllib.parse.urlencode({'data': overpass_query}).encode()
        
        # Retry logic for OSM API (can be flaky)
        max_retries = 2
        retry_count = 0
        osm_data = None
        last_error = None
        
        while retry_count <= max_retries and osm_data is None:
            try:
                print(f"Querying OSM API (attempt {retry_count + 1}/{max_retries + 1})...")
                with urllib.request.urlopen(url, data, timeout=45) as response:
                    osm_data = json.loads(response.read().decode())
                    feature_count = len(osm_data.get('elements', []))
                    break
            except Exception as e:
                last_error = e
                retry_count += 1
                if retry_count <= max_retries:
                    print(f"OSM query failed (attempt {retry_count}), retrying...")
                    import time
                    time.sleep(2)  # Wait 2 seconds before retry
        
        if osm_data is None:
            raise last_error
        
        print(f"✅ Retrieved {feature_count} features from OSM")
        
        # Store large OSM data in S3
        osm_s3_key = f'renewable/terrain/{project_id}/osm_data.json'
        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=osm_s3_key,
            Body=json.dumps(osm_data),
            ContentType='application/json'
        )
        
        print(f"📦 Stored OSM data in S3: s3://{S3_BUCKET}/{osm_s3_key}")
        
        # Convert OSM elements to GeoJSON format
        geojson_features = []
        for element in osm_data.get('elements', []):
            # Convert OSM geometry to proper GeoJSON geometry
            geometry = None
            tags = element.get('tags', {})
            
            if 'geometry' in element:
                # OSM returns geometry as array of {lat, lon} objects
                coords = [[pt['lon'], pt['lat']] for pt in element['geometry']]
                
                if element.get('type') == 'way':
                    # Check if this is a closed way (polygon) - first and last coords match
                    is_closed = len(coords) > 2 and coords[0] == coords[-1]
                    
                    # Buildings and water bodies should be polygons if closed
                    is_polygon_feature = 'building' in tags or tags.get('natural') == 'water' or 'waterway' in tags
                    
                    if is_closed and is_polygon_feature:
                        # Closed way representing an area (building, water body, etc.)
                        geometry = {
                            'type': 'Polygon',
                            'coordinates': [coords]  # Polygon needs array of rings
                        }
                    else:
                        # Open way or linear feature (road, path, etc.)
                        geometry = {
                            'type': 'LineString',
                            'coordinates': coords
                        }
                elif element.get('type') == 'relation':
                    # Relations can be multipolygons (complex buildings, water bodies)
                    # For simplicity, treat as polygon if we have geometry
                    if len(coords) > 2:
                        geometry = {
                            'type': 'Polygon',
                            'coordinates': [coords]
                        }
                else:
                    # Node or other type
                    geometry = {
                        'type': 'Point',
                        'coordinates': coords[0] if coords else [0, 0]
                    }
            elif 'lat' in element and 'lon' in element:
                # Node with just lat/lon
                geometry = {
                    'type': 'Point',
                    'coordinates': [element['lon'], element['lat']]
                }
            
            if geometry:
                # Determine feature label for display
                feature_label = 'Unknown'
                if 'building' in tags:
                    feature_label = 'Building'
                elif tags.get('natural') == 'water':
                    feature_label = 'Water Body'
                elif 'waterway' in tags:
                    waterway_type = tags.get('waterway', 'waterway')
                    feature_label = f'{waterway_type.capitalize()}'
                elif 'highway' in tags:
                    highway_type = tags.get('highway', 'road')
                    feature_label = f'{highway_type.capitalize()} Road'
                
                feature = {
                    'type': 'Feature',
                    'geometry': geometry,
                    'properties': {
                        'feature_type': element.get('type'),
                        'feature_label': feature_label,  # Human-readable label
                        'osm_id': element.get('id'),
                        'tags': tags
                    }
                }
                geojson_features.append(feature)
        
        geojson = {
            'type': 'FeatureCollection',
            'features': geojson_features
        }
        
        print(f"✅ Converted {len(geojson_features)} OSM elements to GeoJSON features")
        
        # Store GeoJSON in S3 (too large for DynamoDB with 143+ features)
        geojson_s3_key = f'renewable/terrain/{project_id}/geojson.json'
        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=geojson_s3_key,
            Body=json.dumps(geojson),
            ContentType='application/json'
        )
        
        print(f"📦 Stored GeoJSON in S3: s3://{S3_BUCKET}/{geojson_s3_key}")
        
        # Return response with S3 reference instead of full GeoJSON
        response_data = {
            'success': True,
            'type': 'terrain_analysis',
            'data': {
                'projectId': project_id,
                'title': f'Terrain Analysis - {project_id}',
                'subtitle': f'Found {feature_count} terrain features within {radius_km}km radius',
                'coordinates': {
                    'lat': latitude,
                    'lng': longitude
                },
                'metrics': {
                    'totalFeatures': feature_count,
                    'radiusKm': radius_km
                },
                'geojsonS3Key': geojson_s3_key,  # S3 reference instead of full data
                'geojsonS3Bucket': S3_BUCKET,
                'message': f'Successfully analyzed terrain: {feature_count} features found',
                'visualizations': {},
                'visualization_available': False
            }
        }
        
        return response_data
            
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        
        return {
            'success': False,
            'type': 'terrain_analysis',
            'error': str(e),
            'data': {}
        }
