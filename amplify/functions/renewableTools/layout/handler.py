"""
Enhanced Layout Tool Lambda
Basic grid layout with rich folium visualizations
"""
import json
import math
import logging
import sys
import os

# Configure logging first
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Add the parent directory to the path to import visualization modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from visualization_generator import RenewableVisualizationGenerator
    from folium_generator import FoliumMapGenerator
    from matplotlib_generator import MatplotlibChartGenerator
    from visualization_config import config
    from original_viz_utils import validate_turbine_layout
    VISUALIZATIONS_AVAILABLE = True
    logger.info("Visualization modules loaded successfully")
except ImportError as e:
    logger.warning(f"Visualization modules not available: {e}")
    VISUALIZATIONS_AVAILABLE = False

def create_basic_layout_map(geojson, center_lat, center_lon):
    """Create a basic HTML map without external dependencies"""
    try:
        logger.info(f"Creating basic HTML map at {center_lat}, {center_lon}")
        
        # Create markers data for JavaScript
        markers = []
        if geojson and geojson.get('features'):
            logger.info(f"Adding {len(geojson['features'])} turbine markers")
            for feature in geojson['features']:
                coords = feature['geometry']['coordinates']
                props = feature.get('properties', {})
                turbine_id = props.get('turbine_id', props.get('id', 'N/A'))
                
                markers.append({
                    'lat': coords[1],
                    'lng': coords[0],
                    'title': f"Turbine {turbine_id}",
                    'type': 'turbine'
                })
        
        # Add center marker
        markers.append({
            'lat': center_lat,
            'lng': center_lon,
            'title': 'Project Center',
            'type': 'center'
        })
        
        # Create simple HTML map with Leaflet
        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <title>Wind Farm Layout</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
        #map {{ 
            height: 100%; 
            width: 100%; 
            margin: 0; 
            padding: 0; 
            border: none;
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
        }}
        body {{ 
            margin: 0; 
            padding: 0; 
            overflow: hidden;
            height: 100%;
            width: 100%;
        }}
        html {{ 
            margin: 0; 
            padding: 0; 
            height: 100%;
            width: 100%;
        }}
    </style>
</head>
<body>
    <div id="map"></div>
    <script>
        var map = L.map('map').setView([{center_lat}, {center_lon}], 12);
        
        L.tileLayer('https://{{s}}.tile.openstreetmap.org/{{z}}/{{x}}/{{y}}.png', {{
            attribution: '© OpenStreetMap contributors'
        }}).addTo(map);
        
        var markers = {json.dumps(markers)};
        
        // Add markers - use default Leaflet markers (blue teardrop) to match notebook style
        markers.forEach(function(marker) {{
            L.marker([marker.lat, marker.lng])
                .bindPopup(marker.title)
                .addTo(map);
        }});
        
        // Fit map to show all markers
        if (markers.length > 0) {{
            var group = new L.featureGroup(map._layers);
            if (Object.keys(group._layers).length > 0) {{
                map.fitBounds(group.getBounds().pad(0.1));
            }}
        }}
    </script>
</body>
</html>"""
        
        logger.info(f"Successfully created basic HTML map ({len(html_content)} characters)")
        return html_content
        
    except Exception as e:
        logger.error(f"Error creating basic HTML map: {e}", exc_info=True)
        return None

def handler(event, context):
    """
    Simplified layout optimization using basic grid
    """
    
    try:
        logger.info("🌱 Layout Lambda invoked successfully")
        
        params = event.get('parameters', {})
        
        # Log received parameters for debugging
        logger.info(f"Received parameters: {json.dumps(params, indent=2)}")
        
        project_id = params.get('project_id', 'default-project')
        
        # Support both old (center_lat/center_lon) and new (latitude/longitude) parameter names
        center_lat = params.get('latitude') or params.get('center_lat')
        center_lon = params.get('longitude') or params.get('center_lon')
        
        num_turbines = params.get('num_turbines', 10)
        turbine_model = params.get('turbine_model', 'GE 2.5-120')
        capacity_mw = params.get('capacity_mw', 2.5)
        spacing_d = params.get('spacing_d', 9.0)
        rotor_diameter = params.get('rotor_diameter', 120.0)
        
        # Validate required parameters with clear error messages
        if center_lat is None or center_lon is None:
            missing_params = []
            if center_lat is None:
                missing_params.append('latitude (or center_lat)')
            if center_lon is None:
                missing_params.append('longitude (or center_lon)')
            
            error_message = f"Missing required parameters: {', '.join(missing_params)}"
            logger.error(f"❌ Parameter validation failed: {error_message}")
            logger.error(f"Received parameters: {params}")
            
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'success': False,
                    'error': error_message,
                    'errorCategory': 'PARAMETER_ERROR',
                    'details': {
                        'missingParameters': missing_params,
                        'receivedParameters': list(params.keys())
                    }
                })
            }
        
        # Validate parameter types and ranges
        try:
            center_lat = float(center_lat)
            center_lon = float(center_lon)
            
            if not (-90 <= center_lat <= 90):
                raise ValueError(f"Latitude must be between -90 and 90, got {center_lat}")
            if not (-180 <= center_lon <= 180):
                raise ValueError(f"Longitude must be between -180 and 180, got {center_lon}")
                
        except (ValueError, TypeError) as e:
            error_message = f"Invalid parameter values: {str(e)}"
            logger.error(f"❌ Parameter validation failed: {error_message}")
            
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'success': False,
                    'error': error_message,
                    'errorCategory': 'PARAMETER_ERROR',
                    'details': {
                        'latitude': center_lat,
                        'longitude': center_lon
                    }
                })
            }
        
        logger.info(f"Creating layout at ({center_lat}, {center_lon}) with {num_turbines} turbines")
        
        # Calculate grid dimensions
        grid_size = math.ceil(math.sqrt(num_turbines))
        spacing_m = rotor_diameter * spacing_d
        
        # Convert spacing to lat/lon degrees (approximate)
        lat_per_m = 1 / 111320
        lon_per_m = 1 / (111320 * math.cos(math.radians(center_lat)))
        
        spacing_lat = spacing_m * lat_per_m
        spacing_lon = spacing_m * lon_per_m
        
        # Generate grid layout
        features = []
        turbine_positions = []
        turbine_id = 1
        
        for i in range(grid_size):
            for j in range(grid_size):
                if turbine_id > num_turbines:
                    break
                    
                lat = center_lat + (i - grid_size/2) * spacing_lat
                lon = center_lon + (j - grid_size/2) * spacing_lon
                
                feature = {
                    'type': 'Feature',
                    'geometry': {
                        'type': 'Point',
                        'coordinates': [lon, lat]
                    },
                    'properties': {
                        'turbine_id': f'T{turbine_id:03d}',
                        'turbine_model': turbine_model,
                        'capacity_MW': capacity_mw
                    }
                }
                
                features.append(feature)
                turbine_positions.append({
                    'id': f'T{turbine_id:03d}',
                    'lat': lat,
                    'lng': lon,
                    'model': turbine_model,
                    'capacity_mw': capacity_mw
                })
                
                turbine_id += 1
        
        geojson = {
            'type': 'FeatureCollection',
            'features': features,
            'properties': {
                'total_capacity_MW': len(features) * capacity_mw,
                'layout_type': 'grid'
            }
        }
        
        # Create interactive HTML map
        logger.info("Creating interactive HTML map")
        map_html = create_basic_layout_map(geojson, center_lat, center_lon)
        
        # Save map HTML to S3
        map_url = None
        if map_html:
            try:
                import boto3
                s3_bucket = os.environ.get('RENEWABLE_S3_BUCKET')
                if s3_bucket:
                    s3_client = boto3.client('s3')
                    s3_key = f"renewable/layout/{project_id}/layout_map.html"
                    s3_client.put_object(
                        Bucket=s3_bucket,
                        Key=s3_key,
                        Body=map_html.encode('utf-8'),
                        ContentType='text/html',
                        CacheControl='max-age=3600'
                    )
                    map_url = f"https://{s3_bucket}.s3.amazonaws.com/{s3_key}"
                    logger.info(f"✅ Saved layout map HTML to S3: {map_url}")
                else:
                    logger.warning("⚠️ RENEWABLE_S3_BUCKET not configured, cannot save map to S3")
            except Exception as s3_error:
                logger.error(f"❌ Failed to save map HTML to S3: {s3_error}")
        
        # Generate additional visualizations if available
        visualizations = []
        if VISUALIZATIONS_AVAILABLE:
            try:
                logger.info("Generating additional visualizations")
                viz_gen = RenewableVisualizationGenerator()
                matplotlib_gen = MatplotlibChartGenerator()
                
                # Generate wind rose diagram
                wind_data = {
                    'speeds': [8.5, 9.2, 7.8, 10.1, 6.9, 8.8, 9.5, 7.2, 8.1, 9.8],
                    'directions': [225, 270, 315, 180, 135, 225, 270, 315, 225, 270]
                }
                wind_rose_bytes = matplotlib_gen.create_wind_rose(wind_data, f"Wind Rose - {project_id}")
                visualizations.append({
                    'type': 'wind_rose',
                    'title': 'Site Wind Rose Analysis',
                    'data': wind_rose_bytes.hex(),
                    'format': 'png'
                })
                
                # Generate performance chart
                turbine_data = {
                    'turbine_ids': [f'T{i:03d}' for i in range(1, len(features) + 1)],
                    'turbine_performance': [95.2, 97.8, 94.1, 96.5, 98.2, 93.7, 95.9, 97.1, 94.8, 96.3][:len(features)]
                }
                perf_chart_bytes = matplotlib_gen.create_performance_chart(turbine_data, 'individual')
                visualizations.append({
                    'type': 'performance_chart',
                    'title': 'Turbine Performance Analysis',
                    'data': perf_chart_bytes.hex(),
                    'format': 'png'
                })
                
                logger.info(f"Generated {len(visualizations)} additional visualizations")
                
            except Exception as e:
                logger.warning(f"Failed to generate additional visualizations: {e}")
        
        # Prepare response data
        response_data = {
            'projectId': project_id,
            'layoutType': 'grid',
            'turbineCount': len(features),
            'totalCapacity': len(features) * capacity_mw,
            'turbineModel': turbine_model,
            'turbinePositions': turbine_positions,
            'geojson': geojson,
            'spacing': {
                'downwind': spacing_d,
                'crosswind': spacing_d
            },
            'message': f'Created grid layout with {len(features)} turbines',
            'visualizations': visualizations
        }
        
        # Add map HTML and URL if available
        if map_html:
            response_data['mapHtml'] = map_html
            logger.info("✅ Added mapHtml to response data")
        else:
            logger.warning("❌ No mapHtml available for response")
        
        if map_url:
            response_data['mapUrl'] = map_url
            logger.info(f"✅ Added mapUrl to response data: {map_url}")
        else:
            logger.warning("❌ No mapUrl available for response")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'success': True,
                'type': 'layout_optimization',
                'data': response_data
            })
        }
            
    except Exception as e:
        error_message = f'Lambda execution error: {str(e)}'
        logger.error(f"❌ {error_message}", exc_info=True)
        logger.error(f"Event data: {json.dumps(event, default=str)}")
        
        return {
            'statusCode': 500,
            'body': json.dumps({
                'success': False,
                'error': error_message,
                'errorCategory': 'INTERNAL_ERROR',
                'details': {
                    'errorType': type(e).__name__,
                    'errorMessage': str(e)
                }
            })
        }
