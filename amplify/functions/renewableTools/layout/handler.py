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
        #map {{ height: 500px; width: 100%; }}
        body {{ margin: 0; padding: 0; }}
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
        
        markers.forEach(function(marker) {{
            var icon = marker.type === 'center' ? 
                L.divIcon({{
                    className: 'center-marker',
                    html: '<div style="background-color: green; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>',
                    iconSize: [16, 16],
                    iconAnchor: [8, 8]
                }}) :
                L.divIcon({{
                    className: 'turbine-marker',
                    html: '<div style="background-color: blue; width: 10px; height: 10px; border-radius: 50%; border: 2px solid white;"></div>',
                    iconSize: [14, 14],
                    iconAnchor: [7, 7]
                }});
            
            L.marker([marker.lat, marker.lng], {{icon: icon}})
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
        project_id = params.get('project_id', 'default-project')
        center_lat = params.get('center_lat')
        center_lon = params.get('center_lon')
        num_turbines = params.get('num_turbines', 10)
        turbine_model = params.get('turbine_model', 'GE 2.5-120')
        capacity_mw = params.get('capacity_mw', 2.5)
        spacing_d = params.get('spacing_d', 9.0)
        rotor_diameter = params.get('rotor_diameter', 120.0)
        
        if center_lat is None or center_lon is None:
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'success': False,
                    'error': 'Missing required parameters'
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
            'message': f'Created grid layout with {len(features)} turbines'
        }
        
        # Add map HTML if available
        if map_html:
            response_data['mapHtml'] = map_html
            logger.info("✅ Added mapHtml to response data")
        else:
            logger.warning("❌ No mapHtml available for response")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'success': True,
                'type': 'layout_optimization',
                'data': response_data
            })
        }
        
        params = event.get('parameters', {})
        project_id = params.get('project_id', 'default-project')
        center_lat = params.get('center_lat')
        center_lon = params.get('center_lon')
        num_turbines = params.get('num_turbines', 10)
        turbine_model = params.get('turbine_model', 'GE 2.5-120')
        capacity_mw = params.get('capacity_mw', 2.5)
        spacing_d = params.get('spacing_d', 9.0)
        rotor_diameter = params.get('rotor_diameter', 120.0)
        
        if center_lat is None or center_lon is None:
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'success': False,
                    'error': 'Missing required parameters'
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
        
        # Create basic HTML map
        logger.info("Creating basic HTML map")
        map_html = create_basic_layout_map(geojson, center_lat, center_lon)
        
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
            'message': f'Created grid layout with {len(features)} turbines'
        }
        
        # Add map HTML if available
        if map_html:
            response_data['mapHtml'] = map_html
            logger.info("✅ Added mapHtml to response data")
        else:
            logger.warning("❌ No mapHtml available for response")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'success': True,
                'type': 'layout_optimization',
                'data': response_data
            })
        }
        
        params = event.get('parameters', {})
        project_id = params.get('project_id', 'default-project')
        center_lat = params.get('center_lat')
        center_lon = params.get('center_lon')
        num_turbines = params.get('num_turbines', 10)
        turbine_model = params.get('turbine_model', 'GE 2.5-120')
        capacity_mw = params.get('capacity_mw', 2.5)
        spacing_d = params.get('spacing_d', 9.0)
        rotor_diameter = params.get('rotor_diameter', 120.0)
        
        if center_lat is None or center_lon is None:
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'success': False,
                    'error': 'Missing required parameters'
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
        
        # Initialize visualization variables
        map_html = None
        map_url = None
        visualizations = {}
        
        # Generate rich visualizations if available
        if VISUALIZATIONS_AVAILABLE:
            try:
                logger.info("Generating rich folium layout map and validation charts")
                
                # Create visualization generator
                viz_generator = RenewableVisualizationGenerator()
                
                # Generate interactive folium map with turbines
                if viz_generator.folium_generator:
                    logger.info("Creating wind farm layout map...")
                    map_html = viz_generator.folium_generator.create_wind_farm_map({}, geojson, center_lat, center_lon)
                    logger.info("Layout map created successfully")
                else:
                    logger.warning("Folium generator not available, creating basic map")
                    # Create basic folium map as fallback
                    map_html = create_basic_layout_map(geojson, center_lat, center_lon)
                
                # Generate layout validation chart
                validation_result = validate_turbine_layout(geojson, min_spacing_m=spacing_m*0.8)
                
                # Save visualizations to S3 if configured
                if viz_generator.s3_client and map_html:
                    # Save folium map
                    map_s3_key = config.get_s3_key(project_id, 'layout_map', 'html')
                    map_url = viz_generator.save_html_to_s3(map_html, map_s3_key)
                    if map_url:
                        visualizations['interactive_map'] = map_url
                        logger.info(f"Saved layout map to S3: {map_url}")
                    
                    # Save validation chart if available
                    if validation_result and 'chart_bytes' in validation_result:
                        chart_s3_key = config.get_s3_key(project_id, 'layout_validation', 'png')
                        chart_url = viz_generator.save_image_to_s3(validation_result['chart_bytes'], chart_s3_key)
                        if chart_url:
                            visualizations['validation_chart'] = chart_url
                            logger.info(f"Saved validation chart to S3: {chart_url}")
                
                logger.info("Successfully generated layout visualizations")
                
            except Exception as e:
                logger.error(f"Error generating visualizations: {e}")
                # Try to create basic map as final fallback
                if not map_html:
                    logger.info("Attempting to create basic fallback map")
                    map_html = create_basic_layout_map(geojson, center_lat, center_lon)
        else:
            # If visualizations not available, create basic HTML map
            logger.info("Visualizations not available, creating basic HTML map")
            map_html = create_basic_layout_map(geojson, center_lat, center_lon)
        
        # Debug map_html status
        logger.info(f"Final map_html status: {'Available' if map_html else 'None'}")
        if map_html:
            logger.info(f"Map HTML length: {len(map_html)} characters")
        
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
            'message': f'Created grid layout with {len(features)} turbines'
        }
        
        # Add visualization data if available
        if map_html:
            response_data['mapHtml'] = map_html
            logger.info("✅ Added mapHtml to response data")
        else:
            logger.warning("❌ No mapHtml available for response")
            
        if map_url:
            response_data['mapUrl'] = map_url
            logger.info("✅ Added mapUrl to response data")
            
        if visualizations:
            response_data['visualizations'] = visualizations
            logger.info(f"✅ Added {len(visualizations)} visualizations to response")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'success': True,
                'type': 'layout_optimization',
                'data': response_data
            })
        }
            
    except Exception as e:
        logger.error(f"Error: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'body': json.dumps({
                'success': False,
                'error': f'Lambda execution error: {str(e)}'
            })
        }
