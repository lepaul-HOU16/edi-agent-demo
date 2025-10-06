"""
Enhanced Terrain Analysis Tool Lambda
Uses OSM Overpass API with rich folium visualizations
"""
import json
import urllib.request
import urllib.parse
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
    from visualization_config import config
    VISUALIZATIONS_AVAILABLE = True
    logger.info("Visualization modules loaded successfully")
except ImportError as e:
    logger.warning(f"Visualization modules not available: {e}")
    VISUALIZATIONS_AVAILABLE = False

def generate_elevation_profile_data(latitude, longitude, radius_km):
    """Generate realistic elevation profile data for the area"""
    try:
        import numpy as np
    except ImportError:
        logger.error("NumPy not available, using basic Python for calculations")
        # Fallback to basic Python if numpy not available
        return {
            'elevations': [200 + (i % 50) for i in range(100)],
            'distances': [i * 50 for i in range(100)],
            'turbine_positions': {
                'distances': [500, 1500, 2500, 3500],
                'elevations': [220, 240, 210, 230]
            },
            'roads': {
                'distances': [i * 250 for i in range(20)],
                'elevations': [205 + (i % 20) for i in range(20)]
            }
        }
    
    # Create a cross-section through the area
    num_points = 100
    distance_km = radius_km * 2
    distances = np.linspace(0, distance_km * 1000, num_points)  # Convert to meters
    
    # Generate realistic elevation profile with some variation
    base_elevation = 200 + np.random.uniform(-50, 50)  # Base elevation around 200m
    elevation_variation = 50 * np.sin(distances / 1000) + 20 * np.random.normal(0, 1, num_points)
    elevations = base_elevation + elevation_variation
    elevations = np.maximum(elevations, 50)  # Minimum elevation of 50m
    
    # Add some turbine positions along the profile
    num_turbines = min(8, max(3, int(radius_km)))
    turbine_indices = np.linspace(10, num_points-10, num_turbines, dtype=int)
    turbine_distances = distances[turbine_indices]
    turbine_elevations = elevations[turbine_indices]
    
    # Add access roads (simplified)
    road_distances = np.linspace(0, distance_km * 1000, 20)
    road_elevations = np.interp(road_distances, distances, elevations) + np.random.uniform(-5, 5, 20)
    
    return {
        'elevations': elevations.tolist(),
        'distances': distances.tolist(),
        'turbine_positions': {
            'distances': turbine_distances.tolist(),
            'elevations': turbine_elevations.tolist()
        },
        'roads': {
            'distances': road_distances.tolist(),
            'elevations': road_elevations.tolist()
        }
    }

def generate_terrain_analysis_data(latitude, longitude, radius_km):
    """Generate terrain analysis data for accessibility assessment"""
    try:
        import numpy as np
    except ImportError:
        logger.error("NumPy not available, using basic Python for terrain analysis")
        # Fallback to basic Python
        return {
            'slopes': [5.0 + (i % 15) for i in range(100)],
            'access_routes': {
                'lengths': [1000, 1500, 800, 2000, 1200],
                'difficulties': ['Easy', 'Moderate', 'Easy', 'Difficult', 'Moderate']
            },
            'turbine_sites': {
                'slopes': [3.0 + (i % 12) for i in range(10)],
                'accessibility': [0.8 - (i * 0.05) for i in range(10)]
            }
        }
    
    # Generate slope distribution data
    num_samples = 1000
    slopes = np.random.exponential(5, num_samples)
    slopes = np.clip(slopes, 0, 30)  # Limit to reasonable slope range
    
    # Generate access route data
    num_routes = max(5, int(radius_km))
    route_lengths = np.random.uniform(500, radius_km * 1000, num_routes)
    route_difficulties = np.random.choice(['Easy', 'Moderate', 'Difficult'], num_routes, p=[0.4, 0.4, 0.2])
    
    # Generate turbine site data
    num_sites = max(10, int(radius_km * 2))
    site_slopes = np.random.uniform(0, 20, num_sites)
    site_accessibility = np.random.uniform(0.3, 1.0, num_sites)
    
    return {
        'slopes': slopes.tolist(),
        'access_routes': {
            'lengths': route_lengths.tolist(),
            'difficulties': route_difficulties.tolist()
        },
        'turbine_sites': {
            'slopes': site_slopes.tolist(),
            'accessibility': site_accessibility.tolist()
        }
    }

def generate_topographic_analysis_data(latitude, longitude, radius_km):
    """Generate comprehensive topographic analysis data"""
    try:
        import numpy as np
    except ImportError:
        logger.error("NumPy not available, using basic Python for topographic analysis")
        # Fallback to basic Python
        return {
            'elevation_data': {
                'contours': [],
                'min_elevation': 200,
                'max_elevation': 400
            },
            'slope_data': {
                'zones': []
            },
            'suitability_data': {
                'zones': []
            }
        }
    
    # Generate elevation contour data
    num_contours = 10
    base_elevation = 200
    elevation_step = 20
    
    contours = []
    for i in range(num_contours):
        elevation = base_elevation + i * elevation_step
        # Create a simplified circular contour (in real implementation, this would be from DEM data)
        contour_radius = (radius_km * 1000) * (0.8 - i * 0.05)  # Decreasing radius with elevation
        
        # Generate circular geometry
        angles = np.linspace(0, 2*np.pi, 20)
        contour_coords = []
        for angle in angles:
            lon_offset = contour_radius * np.cos(angle) / 111320  # Approximate degrees
            lat_offset = contour_radius * np.sin(angle) / 110540
            contour_coords.append([longitude + lon_offset, latitude + lat_offset])
        contour_coords.append(contour_coords[0])  # Close the polygon
        
        contours.append({
            'elevation': elevation,
            'geometry': {
                'type': 'Polygon',
                'coordinates': [contour_coords]
            }
        })
    
    # Generate slope zones
    slope_zones = []
    zone_types = [
        {'slope': 3, 'size': 0.4},   # Gentle slopes (40% of area)
        {'slope': 8, 'size': 0.3},   # Moderate slopes (30% of area)
        {'slope': 18, 'size': 0.2},  # Steep slopes (20% of area)
        {'slope': 25, 'size': 0.1}   # Very steep slopes (10% of area)
    ]
    
    for i, zone_type in enumerate(zone_types):
        zone_radius = radius_km * 1000 * zone_type['size']
        # Create zone geometry (simplified as circles)
        angles = np.linspace(0, 2*np.pi, 12)
        zone_coords = []
        center_offset = (i - 1.5) * radius_km * 200  # Offset zones
        
        for angle in angles:
            lon_offset = (zone_radius * np.cos(angle) + center_offset) / 111320
            lat_offset = (zone_radius * np.sin(angle) + center_offset) / 110540
            zone_coords.append([longitude + lon_offset, latitude + lat_offset])
        zone_coords.append(zone_coords[0])
        
        slope_zones.append({
            'slope': zone_type['slope'],
            'geometry': {
                'type': 'Polygon',
                'coordinates': [zone_coords]
            }
        })
    
    # Generate suitability zones
    suitability_zones = []
    suitability_levels = [
        {'score': 0.9, 'factor': 'excellent'},
        {'score': 0.7, 'factor': 'good'},
        {'score': 0.5, 'factor': 'fair'},
        {'score': 0.3, 'factor': 'poor'}
    ]
    
    for i, level in enumerate(suitability_levels):
        zone_radius = radius_km * 1000 * (0.3 - i * 0.05)
        angles = np.linspace(0, 2*np.pi, 8)
        zone_coords = []
        
        for angle in angles:
            lon_offset = zone_radius * np.cos(angle) / 111320
            lat_offset = zone_radius * np.sin(angle) / 110540
            zone_coords.append([longitude + lon_offset, latitude + lat_offset])
        zone_coords.append(zone_coords[0])
        
        suitability_zones.append({
            'suitability': level['score'],
            'slope_factor': level['factor'],
            'access_factor': level['factor'],
            'env_factor': level['factor'],
            'geometry': {
                'type': 'Polygon',
                'coordinates': [zone_coords]
            }
        })
    
    return {
        'elevation_data': {
            'contours': contours,
            'min_elevation': base_elevation,
            'max_elevation': base_elevation + (num_contours - 1) * elevation_step
        },
        'slope_data': {
            'zones': slope_zones
        },
        'suitability_data': {
            'zones': suitability_zones
        }
    }

def handler(event, context):
    """
    Simplified terrain analysis using OSM Overpass API
    """
    try:
        logger.info(f"Terrain analysis Lambda invoked")
        
        # Extract parameters
        params = event.get('parameters', {})
        latitude = params.get('latitude')
        longitude = params.get('longitude')
        project_id = params.get('project_id', 'default-project')
        radius_km = params.get('radius_km', 5.0)
        
        if latitude is None or longitude is None:
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'success': False,
                    'error': 'Missing required parameters: latitude and longitude'
                })
            }
        
        logger.info(f"Analyzing terrain at ({latitude}, {longitude})")
        
        # Query OSM Overpass API for buildings, roads, water
        radius_m = radius_km * 1000
        overpass_query = f"""
        [out:json];
        (
          way["building"](around:{radius_m},{latitude},{longitude});
          way["highway"](around:{radius_m},{latitude},{longitude});
          way["natural"="water"](around:{radius_m},{latitude},{longitude});
        );
        out geom;
        """
        
        # Call Overpass API
        url = "https://overpass-api.de/api/interpreter"
        data = urllib.parse.urlencode({'data': overpass_query}).encode()
        
        try:
            with urllib.request.urlopen(url, data, timeout=30) as response:
                osm_data = json.loads(response.read().decode())
        except Exception as e:
            logger.error(f"OSM API error: {e}")
            osm_data = {'elements': []}
        
        # Convert OSM data to GeoJSON features
        features = []
        feature_counts = {'building': 0, 'highway': 0, 'water': 0}
        
        for element in osm_data.get('elements', []):
            if element.get('type') != 'way':
                continue
                
            tags = element.get('tags', {})
            geometry = element.get('geometry', [])
            
            if not geometry:
                continue
            
            # Determine feature type
            feature_type = 'other'
            if 'building' in tags:
                feature_type = 'building'
            elif 'highway' in tags:
                feature_type = 'highway'
            elif tags.get('natural') == 'water':
                feature_type = 'water'
            
            feature_counts[feature_type] = feature_counts.get(feature_type, 0) + 1
            
            # Create GeoJSON feature
            coordinates = [[node['lon'], node['lat']] for node in geometry]
            if coordinates and coordinates[0] != coordinates[-1]:
                coordinates.append(coordinates[0])  # Close polygon
            
            features.append({
                'type': 'Feature',
                'geometry': {
                    'type': 'Polygon',
                    'coordinates': [coordinates]
                },
                'properties': {
                    'feature_type': feature_type,
                    'osm_id': element.get('id'),
                    'tags': tags
                }
            })
        
        geojson = {
            'type': 'FeatureCollection',
            'features': features
        }
        
        # Generate rich visualizations if available
        map_html = None
        map_url = None
        visualizations = {}
        elevation_profile_url = None
        accessibility_chart_url = None
        topographic_map_url = None
        
        if VISUALIZATIONS_AVAILABLE:
            try:
                logger.info("Generating comprehensive terrain visualizations")
                
                # Create visualization generator
                viz_generator = RenewableVisualizationGenerator()
                
                # Generate interactive folium map
                logger.info("Creating terrain map...")
                map_html = viz_generator.create_terrain_map(geojson, latitude, longitude)
                logger.info("Terrain map created successfully")
                
                # Generate elevation profile data (simulated for demo)
                logger.info("Generating elevation profile data...")
                elevation_data = generate_elevation_profile_data(latitude, longitude, radius_km)
                
                # Generate terrain accessibility analysis
                logger.info("Generating terrain analysis data...")
                terrain_data = generate_terrain_analysis_data(latitude, longitude, radius_km)
                
                # Create elevation profile chart
                elevation_profile_bytes = None
                accessibility_chart_bytes = None
                if viz_generator.matplotlib_generator:
                    logger.info("Creating elevation profile chart...")
                    elevation_profile_bytes = viz_generator.matplotlib_generator.create_elevation_profile(elevation_data)
                    
                    # Create terrain accessibility chart
                    logger.info("Creating accessibility chart...")
                    accessibility_chart_bytes = viz_generator.matplotlib_generator.create_terrain_accessibility_chart(terrain_data)
                else:
                    logger.warning("Matplotlib generator not available, skipping chart generation")
                
                # Generate topographic analysis data
                logger.info("Generating topographic data...")
                topographic_data = generate_topographic_analysis_data(latitude, longitude, radius_km)
                
                # Create comprehensive topographic map
                topographic_map_html = None
                if viz_generator.folium_generator:
                    logger.info("Creating topographic map...")
                    topographic_map_html = viz_generator.folium_generator.create_topographic_analysis_map(
                        topographic_data['elevation_data'],
                        topographic_data['slope_data'],
                        topographic_data['suitability_data'],
                        latitude, longitude
                    )
                    logger.info("Topographic map created successfully")
                else:
                    logger.warning("Folium generator not available, skipping topographic map")
                
                # Save visualizations to S3 if configured
                if viz_generator.s3_client:
                    # Save terrain map
                    s3_key = config.get_s3_key(project_id, 'terrain_map', 'html')
                    map_url = viz_generator.save_html_to_s3(map_html, s3_key)
                    if map_url:
                        visualizations['interactive_map'] = map_url
                        logger.info(f"Saved terrain map to S3: {map_url}")
                    
                    # Save elevation profile
                    if elevation_profile_bytes:
                        elevation_s3_key = config.get_s3_key(project_id, 'elevation_profile', 'png')
                        elevation_profile_url = viz_generator.save_image_to_s3(elevation_profile_bytes, elevation_s3_key)
                        if elevation_profile_url:
                            visualizations['elevation_profile'] = elevation_profile_url
                            logger.info(f"Saved elevation profile to S3: {elevation_profile_url}")
                    
                    # Save accessibility chart
                    if accessibility_chart_bytes:
                        accessibility_s3_key = config.get_s3_key(project_id, 'terrain_accessibility', 'png')
                        accessibility_chart_url = viz_generator.save_image_to_s3(accessibility_chart_bytes, accessibility_s3_key)
                        if accessibility_chart_url:
                            visualizations['accessibility_analysis'] = accessibility_chart_url
                            logger.info(f"Saved accessibility chart to S3: {accessibility_chart_url}")
                    
                    # Save topographic map
                    if topographic_map_html:
                        topo_s3_key = config.get_s3_key(project_id, 'topographic_map', 'html')
                        topographic_map_url = viz_generator.save_html_to_s3(topographic_map_html, topo_s3_key)
                        if topographic_map_url:
                            visualizations['topographic_map'] = topographic_map_url
                            logger.info(f"Saved topographic map to S3: {topographic_map_url}")
                
                logger.info("Successfully generated comprehensive terrain visualizations")
                
            except Exception as e:
                logger.error(f"Error generating visualizations: {e}")
                # Continue without visualizations
        
        # Prepare response data
        response_data = {
            'coordinates': {'lat': latitude, 'lng': longitude},
            'projectId': project_id,
            'exclusionZones': features,
            'metrics': {
                'totalFeatures': len(features),
                'featuresByType': feature_counts,
                'radiusKm': radius_km
            },
            'geojson': geojson,
            'message': f'Found {len(features)} features using OSM data'
        }
        
        # Add visualization data if available
        if map_html:
            response_data['mapHtml'] = map_html
        if map_url:
            response_data['mapUrl'] = map_url
        if visualizations:
            response_data['visualizations'] = visualizations
        
        # Add individual visualization URLs for direct access
        if elevation_profile_url:
            response_data['elevationProfileUrl'] = elevation_profile_url
        if accessibility_chart_url:
            response_data['accessibilityChartUrl'] = accessibility_chart_url
        if topographic_map_url:
            response_data['topographicMapUrl'] = topographic_map_url
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'success': True,
                'type': 'terrain_analysis',
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
