"""
Lightweight Terrain Analysis Handler
Returns raw data without heavy visualization dependencies
"""
import json
import urllib.request
import urllib.parse
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def query_osm_terrain(latitude, longitude, radius_km):
    """Query OSM Overpass API for terrain features"""
    
    # Calculate bounding box
    lat_offset = radius_km / 111.0  # 1 degree latitude ≈ 111 km
    lon_offset = radius_km / (111.0 * abs(math.cos(math.radians(latitude))))
    
    bbox = f"{latitude - lat_offset},{longitude - lon_offset},{latitude + lat_offset},{longitude + lon_offset}"
    
    # Overpass query for terrain features
    overpass_query = f"""
    [out:json][timeout:25];
    (
      way["highway"](around:{radius_km * 1000},{latitude},{longitude});
      way["railway"](around:{radius_km * 1000},{latitude},{longitude});
      way["building"](around:{radius_km * 1000},{latitude},{longitude});
      way["natural"="water"](around:{radius_km * 1000},{latitude},{longitude});
      way["landuse"="industrial"](around:{radius_km * 1000},{latitude},{longitude});
      way["power"](around:{radius_km * 1000},{latitude},{longitude});
    );
    out geom;
    """
    
    url = "https://overpass-api.de/api/interpreter"
    data = urllib.parse.urlencode({'data': overpass_query}).encode()
    
    try:
        with urllib.request.urlopen(url, data, timeout=30) as response:
            result = json.loads(response.read().decode())
            return result
    except Exception as e:
        logger.error(f"OSM query failed: {e}")
        return {"elements": []}

def handler(event, context):
    """
    Lightweight terrain analysis - returns data only, no visualizations
    """
    try:
        logger.info("Terrain analysis Lambda invoked")
        
        # Extract parameters
        params = event.get('parameters', {})
        latitude = params.get('latitude')
        longitude = params.get('longitude')
        project_id = params.get('project_id') or f'terrain-{int(datetime.now().timestamp() * 1000)}'
        radius_km = params.get('radius_km', 5.0)
        
        if latitude is None or longitude is None:
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'success': False,
                    'error': 'Missing required parameters: latitude and longitude'
                })
            }
        
        logger.info(f"Analyzing terrain at ({latitude}, {longitude}) with radius {radius_km}km")
        
        # Query OSM data
        osm_data = query_osm_terrain(latitude, longitude, radius_km)
        
        # Process features
        features = []
        feature_stats = {}
        
        for element in osm_data.get('elements', []):
            tags = element.get('tags', {})
            
            # Classify feature
            feature_type = 'unknown'
            if 'highway' in tags:
                feature_type = 'highway'
            elif 'railway' in tags:
                feature_type = 'railway'
            elif 'building' in tags:
                feature_type = 'building'
            elif 'natural' in tags:
                feature_type = 'water'
            elif 'landuse' in tags:
                feature_type = 'industrial'
            elif 'power' in tags:
                feature_type = 'power_infrastructure'
            
            feature_stats[feature_type] = feature_stats.get(feature_type, 0) + 1
            
            # Create GeoJSON feature
            geometry = element.get('geometry', [])
            if geometry:
                features.append({
                    'type': 'Feature',
                    'geometry': {
                        'type': 'LineString' if element['type'] == 'way' else 'Point',
                        'coordinates': [[coord['lon'], coord['lat']] for coord in geometry]
                    },
                    'properties': {
                        'feature_type': feature_type,
                        'osm_id': element.get('id'),
                        'tags': tags
                    }
                })
        
        # Return lightweight response with data only
        response_data = {
            'success': True,
            'project_id': project_id,
            'feature_count': len(features),
            'feature_statistics': feature_stats,
            'coordinates': {
                'latitude': latitude,
                'longitude': longitude,
                'radius_km': radius_km
            },
            'geojson': {
                'type': 'FeatureCollection',
                'features': features
            },
            'message': f'Found {len(features)} terrain features',
            'visualization_note': 'Visualizations can be generated client-side from GeoJSON data'
        }
        
        return {
            'statusCode': 200,
            'body': json.dumps(response_data)
        }
        
    except Exception as e:
        logger.error(f"Error in terrain analysis: {e}")
        import traceback
        traceback.print_exc()
        
        return {
            'statusCode': 500,
            'body': json.dumps({
                'success': False,
                'error': str(e)
            })
        }
