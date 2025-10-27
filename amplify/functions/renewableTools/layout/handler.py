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
        
        # Check for project context (from orchestrator)
        project_context = event.get('project_context', {})
        logger.info(f"Project context available: {bool(project_context)}")
        
        # Get coordinates from project context first, then fall back to explicit parameters
        center_lat = None
        center_lon = None
        
        # Priority 1: Check project context for coordinates
        if project_context and 'coordinates' in project_context:
            coords = project_context['coordinates']
            center_lat = coords.get('latitude')
            center_lon = coords.get('longitude')
            if center_lat and center_lon:
                logger.info(f"✅ Using coordinates from project context: ({center_lat}, {center_lon})")
        
        # Priority 2: Check explicit parameters (backward compatibility)
        if center_lat is None or center_lon is None:
            center_lat = params.get('latitude') or params.get('center_lat')
            center_lon = params.get('longitude') or params.get('center_lon')
            if center_lat and center_lon:
                logger.info(f"✅ Using coordinates from explicit parameters: ({center_lat}, {center_lon})")
        
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
            
            # Get project name if available
            project_name = params.get('project_name', project_id)
            
            # Generate user-friendly error message
            error_message = f"No coordinates found for {project_name}. Coordinates are required to optimize the turbine layout."
            suggestion = "Run terrain analysis first to establish project coordinates, or provide explicit latitude/longitude parameters."
            
            next_steps = [
                f'Analyze terrain: "analyze terrain at [latitude], [longitude]"',
                f'Or provide coordinates: "optimize layout at [latitude], [longitude] with [N] turbines"'
            ]
            
            if project_name and project_name != project_id:
                next_steps.append(f'View project status: "show project {project_name}"')
            
            logger.error(f"❌ Parameter validation failed: {error_message}")
            logger.error(f"Received parameters: {params}")
            logger.error(f"Project context: {project_context}")
            
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'success': False,
                    'error': error_message,
                    'errorCategory': 'MISSING_PROJECT_DATA',
                    'details': {
                        'projectId': project_id,
                        'projectName': project_name,
                        'missingData': 'coordinates',
                        'requiredOperation': 'terrain_analysis',
                        'missingParameters': missing_params,
                        'receivedParameters': list(params.keys()),
                        'hasProjectContext': bool(project_context),
                        'suggestion': suggestion,
                        'nextSteps': next_steps
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
        
        # INTELLIGENT PLACEMENT: Load terrain data and exclusion zones
        terrain_results = project_context.get('terrain_results', {}) or project_context.get('terrainResults', {})
        exclusion_zones = terrain_results.get('exclusionZones', {})
        terrain_geojson = terrain_results.get('geojson', {})
        
        # Check if we have OSM features for intelligent placement
        has_osm_features = False
        osm_feature_count = 0
        
        if exclusion_zones:
            buildings_count = len(exclusion_zones.get('buildings', []))
            roads_count = len(exclusion_zones.get('roads', []))
            water_count = len(exclusion_zones.get('waterBodies', []))
            osm_feature_count = buildings_count + roads_count + water_count
            has_osm_features = osm_feature_count > 0
            
            logger.info(f"📊 OSM Features Analysis:")
            logger.info(f"   Buildings: {buildings_count}")
            logger.info(f"   Roads: {roads_count}")
            logger.info(f"   Water bodies: {water_count}")
            logger.info(f"   Total OSM features: {osm_feature_count}")
        
        if terrain_geojson and terrain_geojson.get('features'):
            terrain_feature_count = len(terrain_geojson.get('features', []))
            logger.info(f"   Terrain GeoJSON features: {terrain_feature_count}")
        
        # Calculate spacing
        spacing_m = rotor_diameter * spacing_d
        
        # ALGORITHM SELECTION LOGIC (Requirement 2.1, 2.5)
        # Priority: Use intelligent placement when OSM features exist
        # Fallback: Use grid layout only when OSM features are completely unavailable
        try:
            from intelligent_placement import intelligent_turbine_placement, basic_grid_placement
            
            radius_km = params.get('area_km2', 5.0) ** 0.5  # Approximate radius from area
            
            # Decision point: Check for OSM features
            if has_osm_features:
                # INTELLIGENT PLACEMENT: OSM features available
                logger.info("=" * 60)
                logger.info("🎯 ALGORITHM SELECTION: INTELLIGENT PLACEMENT")
                logger.info(f"   Reason: {osm_feature_count} OSM features detected")
                logger.info(f"   Algorithm: intelligent_turbine_placement()")
                logger.info(f"   Constraints: Buildings, roads, water bodies")
                logger.info("=" * 60)
                
                # Get intelligent turbine positions with OSM constraints
                turbine_coords = intelligent_turbine_placement(
                    center_lat=center_lat,
                    center_lon=center_lon,
                    radius_km=radius_km,
                    exclusion_zones=exclusion_zones,
                    spacing_m=spacing_m,
                    num_turbines_target=num_turbines
                )
                
                layout_type = "intelligent_osm_aware"
                logger.info(f"✅ Intelligent placement completed: {len(turbine_coords)} turbines placed")
                logger.info(f"   Turbines avoid {osm_feature_count} terrain constraints")
            else:
                # GRID FALLBACK: No OSM features available
                logger.info("=" * 60)
                logger.info("⚠️ ALGORITHM SELECTION: GRID LAYOUT (FALLBACK)")
                logger.info(f"   Reason: No OSM features available")
                logger.info(f"   Algorithm: basic_grid_placement()")
                logger.info(f"   Note: Intelligent placement requires terrain analysis with OSM data")
                logger.info("=" * 60)
                
                turbine_coords = basic_grid_placement(
                    center_lat=center_lat,
                    center_lon=center_lon,
                    radius_km=radius_km,
                    spacing_m=spacing_m,
                    num_turbines_target=num_turbines
                )
                layout_type = "grid"
                logger.info(f"✅ Grid layout completed: {len(turbine_coords)} turbines placed")
                
        except ImportError as e:
            logger.warning(f"⚠️ Could not import intelligent_placement: {e}")
            logger.info("Falling back to basic grid layout")
            # Fallback to basic grid
            grid_size = math.ceil(math.sqrt(num_turbines))
            lat_per_m = 1 / 111320
            lon_per_m = 1 / (111320 * math.cos(math.radians(center_lat)))
            spacing_lat = spacing_m * lat_per_m
            spacing_lon = spacing_m * lon_per_m
            
            turbine_coords = []
            for i in range(grid_size):
                for j in range(grid_size):
                    if len(turbine_coords) >= num_turbines:
                        break
                    lat = center_lat + (i - grid_size/2) * spacing_lat
                    lon = center_lon + (j - grid_size/2) * spacing_lon
                    turbine_coords.append((lat, lon))
                if len(turbine_coords) >= num_turbines:
                    break
            layout_type = "grid"
        
        # Create GeoJSON features - START WITH TERRAIN FEATURES
        features = []
        
        # CRITICAL: Include terrain features from OSM in the layout map
        if terrain_geojson and terrain_geojson.get('features'):
            logger.info(f"📍 Adding {len(terrain_geojson['features'])} terrain features to layout map")
            for terrain_feature in terrain_geojson['features']:
                # Copy terrain feature and add styling
                feature_copy = terrain_feature.copy()
                feature_type = feature_copy.get('properties', {}).get('type', 'unknown')
                
                # Add visual styling properties
                if 'properties' not in feature_copy:
                    feature_copy['properties'] = {}
                
                if feature_type == 'building':
                    feature_copy['properties']['fill'] = '#ff0000'
                    feature_copy['properties']['fill-opacity'] = 0.3
                    feature_copy['properties']['stroke'] = '#cc0000'
                elif feature_type == 'road':
                    feature_copy['properties']['stroke'] = '#666666'
                    feature_copy['properties']['stroke-width'] = 2
                    feature_copy['properties']['stroke-opacity'] = 0.7
                elif feature_type == 'water':
                    feature_copy['properties']['fill'] = '#0000ff'
                    feature_copy['properties']['fill-opacity'] = 0.4
                    feature_copy['properties']['stroke'] = '#0000cc'
                elif feature_type == 'perimeter':
                    # Perimeter styling: dashed line with transparent fill (Requirement 2.3)
                    feature_copy['properties']['fill'] = 'transparent'
                    feature_copy['properties']['fill-opacity'] = 0
                    feature_copy['properties']['stroke'] = '#333333'
                    feature_copy['properties']['stroke-width'] = 3
                    feature_copy['properties']['stroke-dasharray'] = '10, 5'  # Dashed line pattern
                    feature_copy['properties']['stroke-opacity'] = 0.8
                
                features.append(feature_copy)
        
        # Add turbine features on top of terrain features
        # Get hub height and rotor diameter from parameters
        hub_height_m = params.get('hub_height', 80.0)  # Default 80m hub height
        
        turbine_positions = []
        for turbine_id, (lat, lon) in enumerate(turbine_coords, start=1):
            turbine_feature = {
                'type': 'Feature',
                'geometry': {
                    'type': 'Point',
                    'coordinates': [lon, lat]
                },
                'properties': {
                    'type': 'turbine',
                    'turbine_id': f'T{turbine_id:03d}',
                    'turbine_model': turbine_model,
                    'capacity_MW': capacity_mw,
                    'hub_height_m': hub_height_m,
                    'rotor_diameter_m': rotor_diameter,
                    'marker-color': '#00ff00',
                    'marker-size': 'large',
                    'marker-symbol': 'wind-turbine'
                }
            }
            
            features.append(turbine_feature)
            turbine_positions.append({
                'id': f'T{turbine_id:03d}',
                'lat': lat,
                'lng': lon,
                'model': turbine_model,
                'capacity_mw': capacity_mw,
                'hub_height_m': hub_height_m,
                'rotor_diameter_m': rotor_diameter
            })
        
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
        
        # CRITICAL FIX: Save complete layout JSON to S3 for wake simulation
        # Wake simulation needs this file to run - without it, wake simulation fails
        layout_s3_key = None
        try:
            import boto3
            from datetime import datetime
            s3_bucket = os.environ.get('RENEWABLE_S3_BUCKET')
            if s3_bucket:
                s3_client = boto3.client('s3')
                
                # Extract turbine features only (not terrain features)
                turbine_features = [f for f in features if f.get('properties', {}).get('type') == 'turbine']
                
                # Build turbines array with required fields
                turbines_array = []
                for turbine_feature in turbine_features:
                    coords = turbine_feature['geometry']['coordinates']
                    props = turbine_feature.get('properties', {})
                    turbines_array.append({
                        'id': props.get('turbine_id', 'unknown'),
                        'latitude': coords[1],
                        'longitude': coords[0],
                        'hub_height': params.get('hub_height', 80.0),  # Default hub height
                        'rotor_diameter': rotor_diameter
                    })
                
                # Extract OSM features (terrain features)
                osm_features = [f for f in features if f.get('properties', {}).get('type') != 'turbine']
                
                # Calculate perimeter polygon (bounding box around all turbines)
                if turbines_array:
                    lats = [t['latitude'] for t in turbines_array]
                    lons = [t['longitude'] for t in turbines_array]
                    
                    # Add buffer around turbines (10% of range)
                    lat_range = max(lats) - min(lats)
                    lon_range = max(lons) - min(lons)
                    lat_buffer = max(lat_range * 0.1, 0.01)  # At least 0.01 degrees
                    lon_buffer = max(lon_range * 0.1, 0.01)
                    
                    # Create perimeter as GeoJSON Polygon
                    perimeter = {
                        'type': 'Polygon',
                        'coordinates': [[
                            [min(lons) - lon_buffer, min(lats) - lat_buffer],
                            [max(lons) + lon_buffer, min(lats) - lat_buffer],
                            [max(lons) + lon_buffer, max(lats) + lat_buffer],
                            [min(lons) - lon_buffer, max(lats) + lat_buffer],
                            [min(lons) - lon_buffer, min(lats) - lat_buffer]  # Close the polygon
                        ]]
                    }
                else:
                    # Fallback perimeter if no turbines
                    perimeter = {
                        'type': 'Polygon',
                        'coordinates': [[
                            [center_lon - 0.05, center_lat - 0.05],
                            [center_lon + 0.05, center_lat - 0.05],
                            [center_lon + 0.05, center_lat + 0.05],
                            [center_lon - 0.05, center_lat + 0.05],
                            [center_lon - 0.05, center_lat - 0.05]
                        ]]
                    }
                
                # Calculate site area from perimeter
                # Simple approximation: area of bounding box
                if turbines_array:
                    lat_range_km = (max(lats) - min(lats)) * 111.32  # 1 degree lat ≈ 111.32 km
                    lon_range_km = (max(lons) - min(lons)) * 111.32 * math.cos(math.radians(center_lat))
                    site_area_km2 = lat_range_km * lon_range_km
                else:
                    site_area_km2 = params.get('area_km2', 5.0)
                
                # Prepare complete layout data package per schema
                layout_data = {
                    'project_id': project_id,
                    'algorithm': layout_type,  # 'intelligent_osm_aware' or 'grid'
                    'turbines': turbines_array,
                    'perimeter': perimeter,
                    'features': osm_features,  # OSM terrain features
                    'metadata': {
                        'created_at': datetime.now().isoformat(),
                        'num_turbines': len(turbines_array),
                        'total_capacity_mw': len(turbines_array) * capacity_mw,
                        'site_area_km2': site_area_km2,
                        'turbine_model': turbine_model,
                        'spacing_d': spacing_d,
                        'rotor_diameter': rotor_diameter,
                        'coordinates': {
                            'latitude': center_lat,
                            'longitude': center_lon
                        }
                    }
                }
                
                # Save to S3 at the path wake simulation expects
                layout_s3_key = f"renewable/layout/{project_id}/layout.json"
                s3_client.put_object(
                    Bucket=s3_bucket,
                    Key=layout_s3_key,
                    Body=json.dumps(layout_data),
                    ContentType='application/json',
                    CacheControl='max-age=3600'
                )
                logger.info(f"✅ Saved complete layout JSON to S3: {layout_s3_key}")
                logger.info(f"   - Turbines: {len(turbines_array)}")
                logger.info(f"   - OSM Features: {len(osm_features)}")
                logger.info(f"   - Perimeter: {perimeter['type']}")
                logger.info(f"   - Algorithm: {layout_type}")
                logger.info(f"   Wake simulation can now access layout data for project {project_id}")
            else:
                logger.warning("⚠️ RENEWABLE_S3_BUCKET not configured, cannot save layout JSON")
                logger.warning("   Wake simulation will fail without layout data!")
        except Exception as layout_save_error:
            logger.error(f"❌ CRITICAL: Failed to save layout JSON to S3: {layout_save_error}")
            logger.error("   Wake simulation will not work without this file!")
            import traceback
            logger.error(traceback.format_exc())
        
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
        # Count only turbine features (not terrain features)
        turbine_count = len([f for f in features if f.get('properties', {}).get('type') == 'turbine'])
        
        response_data = {
            'projectId': project_id,
            'layoutType': layout_type,  # 'intelligent_osm_aware' or 'grid'
            'turbineCount': turbine_count,
            'totalCapacity': turbine_count * capacity_mw,
            'turbineModel': turbine_model,
            'turbinePositions': turbine_positions,
            'geojson': geojson,
            'spacing': {
                'downwind': spacing_d,
                'crosswind': spacing_d
            },
            'message': f'Created {layout_type} layout with {turbine_count} turbines' + (f' (including {len(features) - turbine_count} terrain features on map)' if len(features) > turbine_count else ''),
            'visualizations': visualizations
        }
        
        # Add S3 key for downstream tools (wake simulation)
        if layout_s3_key:
            response_data['layoutS3Key'] = layout_s3_key
            logger.info(f"✅ Added layoutS3Key to response: {layout_s3_key}")
        
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
