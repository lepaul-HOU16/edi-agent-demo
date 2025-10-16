"""
Enhanced Terrain Analysis Tool Lambda
Uses OSM Overpass API with rich folium visualizations
Version: 2.0 - Using Lambda Layer for dependencies
"""
import json
import urllib.request
import urllib.parse
import logging
import sys
import os
from datetime import datetime

# Configure logging first
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Add the parent directory to the path to import visualization modules
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, parent_dir)

try:
    from visualization_generator import RenewableVisualizationGenerator
    from folium_generator import FoliumMapGenerator
    from matplotlib_generator import MatplotlibChartGenerator
    from visualization_config import config
    from original_viz_utils import validate_turbine_layout
    VISUALIZATIONS_AVAILABLE = True
    logger.info("✅ Visualization modules loaded successfully")
except ImportError as e:
    logger.warning(f"⚠️ Visualization modules not available: {e}")
    VISUALIZATIONS_AVAILABLE = False

def validate_map_html(html_content: str) -> dict:
    """Validate that the generated HTML contains all required elements"""
    validation_result = {
        'is_valid': False,
        'has_leaflet_css': False,
        'has_leaflet_js': False,
        'has_map_div': False,
        'has_map_initialization': False,
        'has_markers': False,
        'issues': []
    }
    
    if not html_content:
        validation_result['issues'].append('HTML content is empty')
        return validation_result
    
    # Check for Leaflet CSS
    if 'leaflet@1.9.4/dist/leaflet.css' in html_content:
        validation_result['has_leaflet_css'] = True
    else:
        validation_result['issues'].append('Missing Leaflet CSS')
    
    # Check for Leaflet JS
    if 'leaflet@1.9.4/dist/leaflet.js' in html_content:
        validation_result['has_leaflet_js'] = True
    else:
        validation_result['issues'].append('Missing Leaflet JS')
    
    # Check for map div
    if '<div id="map"></div>' in html_content:
        validation_result['has_map_div'] = True
    else:
        validation_result['issues'].append('Missing map div element')
    
    # Check for map initialization
    if 'L.map(' in html_content and '.setView(' in html_content:
        validation_result['has_map_initialization'] = True
    else:
        validation_result['issues'].append('Missing map initialization')
    
    # Check for markers and overlays
    has_markers = 'markers.forEach' in html_content and 'L.marker(' in html_content
    has_overlays = 'overlays.forEach' in html_content and ('L.polygon(' in html_content or 'L.polyline(' in html_content)
    
    if has_markers:
        validation_result['has_markers'] = True
    else:
        validation_result['issues'].append('Missing marker rendering')
    
    # Add overlay validation
    validation_result['has_overlays'] = has_overlays
    if not has_overlays:
        validation_result['issues'].append('Missing overlay rendering')
    
    # Overall validation (overlays are optional, so not required for validity)
    validation_result['is_valid'] = (
        validation_result['has_leaflet_css'] and
        validation_result['has_leaflet_js'] and
        validation_result['has_map_div'] and
        validation_result['has_map_initialization'] and
        validation_result['has_markers']
    )
    
    return validation_result

def get_wind_impact_assessment(feature_type):
    """Assess how terrain feature impacts wind flow for turbine placement"""
    impact_assessments = {
        'building': 'high_turbulence',
        'major_highway': 'moderate_turbulence', 
        'highway': 'low_turbulence',
        'railway': 'low_turbulence',
        'water': 'smooth_flow',
        'industrial': 'high_turbulence',
        'power_infrastructure': 'electromagnetic_interference',
        'forest': 'high_roughness',
        'protected_area': 'regulatory_restriction'
    }
    return impact_assessments.get(feature_type, 'unknown_impact')

def get_required_setback(feature_type):
    """Get minimum setback distance in meters for different feature types"""
    setback_distances = {
        'building': 500,  # Typical residential setback
        'major_highway': 150,  # Major road setback
        'highway': 100,  # Minor road setback
        'railway': 100,  # Railway setback
        'water': 50,  # Water body setback (foundation considerations)
        'industrial': 300,  # Industrial facility setback
        'power_infrastructure': 200,  # Power line setback
        'forest': 0,  # No setback but consider access
        'protected_area': 0  # Regulatory dependent
    }
    return setback_distances.get(feature_type, 100)

def validate_feature_geometry(feature):
    """Validate that feature geometry is valid for analysis"""
    try:
        geometry = feature.get('geometry', {})
        geom_type = geometry.get('type')
        coordinates = geometry.get('coordinates', [])
        
        if not geom_type or not coordinates:
            return False
        
        if geom_type == 'Point':
            return len(coordinates) == 2 and all(isinstance(c, (int, float)) for c in coordinates)
        
        elif geom_type == 'LineString':
            return (len(coordinates) >= 2 and 
                   all(len(coord) == 2 and all(isinstance(c, (int, float)) for c in coord) 
                       for coord in coordinates))
        
        elif geom_type == 'Polygon':
            if not coordinates or len(coordinates) == 0:
                return False
            
            # Check outer ring
            outer_ring = coordinates[0]
            if len(outer_ring) < 4:  # Minimum for closed polygon
                return False
            
            # Check if polygon is closed
            if outer_ring[0] != outer_ring[-1]:
                return False
            
            # Validate coordinate format
            return all(len(coord) == 2 and all(isinstance(c, (int, float)) for c in coord) 
                      for coord in outer_ring)
        
        return False
        
    except Exception as e:
        logger.warning(f"Geometry validation error: {e}")
        return False

def _create_feature_popup_content(feature_type, properties):
    """Create rich popup content with wind impact assessment"""
    name = properties.get('name', f"{feature_type.title()} Feature")
    wind_impact = properties.get('wind_impact', get_wind_impact_assessment(feature_type))
    setback_distance = properties.get('required_setback_m', get_required_setback(feature_type))
    data_source = properties.get('data_source', 'unknown')
    reliability = properties.get('reliability', 'unknown')
    
    # Create detailed popup content
    popup_html = f"""
    <div style="min-width: 200px;">
        <h4 style="margin: 0 0 8px 0; color: #2c3e50;">{name}</h4>
        <div style="font-size: 12px; line-height: 1.4;">
            <p style="margin: 4px 0;"><strong>Type:</strong> {feature_type.replace('_', ' ').title()}</p>
            <p style="margin: 4px 0;"><strong>Wind Impact:</strong> {wind_impact.replace('_', ' ').title()}</p>
            <p style="margin: 4px 0;"><strong>Required Setback:</strong> {setback_distance}m</p>
            <p style="margin: 4px 0;"><strong>Data Source:</strong> {data_source.replace('_', ' ').title()}</p>
            <p style="margin: 4px 0;"><strong>Reliability:</strong> {reliability.title()}</p>
    """
    
    # Add warning for synthetic data
    if data_source == 'synthetic_fallback':
        popup_html += f"""
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 4px; margin: 4px 0; border-radius: 3px;">
                <small style="color: #856404;"><strong>⚠️ Warning:</strong> This is synthetic fallback data</small>
            </div>
        """
    
    # Add OSM tags if available
    tags = properties.get('tags', {})
    if tags and isinstance(tags, dict):
        relevant_tags = {k: v for k, v in tags.items() if k in ['highway', 'building', 'natural', 'landuse', 'power', 'railway']}
        if relevant_tags:
            popup_html += f"""
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee;">
                <strong style="font-size: 11px;">OSM Tags:</strong>
                <ul style="margin: 2px 0; padding-left: 16px; font-size: 11px;">
            """
            for key, value in relevant_tags.items():
                popup_html += f"<li>{key}: {value}</li>"
            popup_html += "</ul>"
    
    popup_html += """
        </div>
    </div>
    """
    
    return popup_html

def _get_polygon_style_config(feature_type):
    """Get Leaflet style configuration for polygon features"""
    style_configs = {
        'building': {
            'fillColor': '#e74c3c',  # Red for buildings
            'color': '#c0392b',      # Dark red border
            'weight': 2,
            'fillOpacity': 0.6,
            'opacity': 0.9
        },
        'water': {
            'fillColor': '#3498db',  # Blue for water
            'color': '#2980b9',      # Dark blue border
            'weight': 2,
            'fillOpacity': 0.5,
            'opacity': 0.8
        },
        'industrial': {
            'fillColor': '#95a5a6',  # Gray for industrial
            'color': '#7f8c8d',      # Dark gray border
            'weight': 2,
            'fillOpacity': 0.5,
            'opacity': 0.8
        },
        'forest': {
            'fillColor': '#27ae60',  # Green for forest
            'color': '#229954',      # Dark green border
            'weight': 2,
            'fillOpacity': 0.4,
            'opacity': 0.7
        },
        'protected_area': {
            'fillColor': '#f39c12',  # Orange for protected areas
            'color': '#e67e22',      # Dark orange border
            'weight': 3,
            'fillOpacity': 0.3,
            'opacity': 0.9,
            'dashArray': '5, 5'      # Dashed border for protected areas
        }
    }
    
    # Default style for unknown feature types
    default_style = {
        'fillColor': '#9b59b6',  # Purple for unknown
        'color': '#8e44ad',      # Dark purple border
        'weight': 2,
        'fillOpacity': 0.4,
        'opacity': 0.8
    }
    
    return style_configs.get(feature_type, default_style)

def _get_polyline_style_config(feature_type):
    """Get Leaflet style configuration for polyline features"""
    style_configs = {
        'highway': {
            'color': '#f39c12',      # Orange for highways
            'weight': 4,
            'opacity': 0.8,
            'fill': False
        },
        'major_highway': {
            'color': '#e67e22',      # Dark orange for major highways
            'weight': 6,
            'opacity': 0.9,
            'fill': False
        },
        'railway': {
            'color': '#34495e',      # Dark gray for railways
            'weight': 3,
            'opacity': 0.8,
            'fill': False,
            'dashArray': '10, 5'     # Dashed line for railways
        },
        'power_infrastructure': {
            'color': '#e74c3c',      # Red for power lines
            'weight': 3,
            'opacity': 0.9,
            'fill': False,
            'dashArray': '8, 4'      # Dashed line for power lines
        }
    }
    
    # Default style for unknown line types
    default_style = {
        'color': '#9b59b6',      # Purple for unknown
        'weight': 3,
        'opacity': 0.7,
        'fill': False
    }
    
    return style_configs.get(feature_type, default_style)

def create_fallback_terrain_data(latitude, longitude, radius_km, error_reason):
    """Create clearly labeled synthetic terrain data as fallback"""
    logger.info(f"🔄 Creating synthetic fallback terrain data due to: {error_reason}")
    
    # Create basic synthetic features around the location
    features = [
        {
            'type': 'Feature',
            'geometry': {
                'type': 'LineString',
                'coordinates': [
                    [longitude - 0.01, latitude - 0.01],
                    [longitude - 0.005, latitude + 0.005],
                    [longitude + 0.005, latitude + 0.01]
                ]
            },
            'properties': {
                'feature_type': 'highway',
                'osm_id': 'synthetic_1',
                'name': 'Synthetic Road (Fallback)',
                'tags': {'highway': 'residential', 'synthetic': 'true'},
                'data_source': 'synthetic_fallback',
                'reliability': 'low',
                'warning': 'This is synthetic data - real OSM data unavailable'
            }
        },
        {
            'type': 'Feature',
            'geometry': {
                'type': 'Polygon',
                'coordinates': [[
                    [longitude + 0.002, latitude - 0.002],
                    [longitude + 0.002, latitude + 0.002],
                    [longitude - 0.002, latitude + 0.002],
                    [longitude - 0.002, latitude - 0.002],
                    [longitude + 0.002, latitude - 0.002]
                ]]
            },
            'properties': {
                'feature_type': 'building',
                'osm_id': 'synthetic_2',
                'name': 'Synthetic Building (Fallback)',
                'tags': {'building': 'yes', 'synthetic': 'true'},
                'data_source': 'synthetic_fallback',
                'reliability': 'low',
                'warning': 'This is synthetic data - real OSM data unavailable'
            }
        },
        {
            'type': 'Feature',
            'geometry': {
                'type': 'Polygon',
                'coordinates': [[
                    [longitude - 0.008, latitude + 0.003],
                    [longitude - 0.006, latitude + 0.008],
                    [longitude - 0.012, latitude + 0.008],
                    [longitude - 0.010, latitude + 0.003],
                    [longitude - 0.008, latitude + 0.003]
                ]]
            },
            'properties': {
                'feature_type': 'water',
                'osm_id': 'synthetic_3',
                'name': 'Synthetic Water Body (Fallback)',
                'tags': {'natural': 'water', 'synthetic': 'true'},
                'data_source': 'synthetic_fallback',
                'reliability': 'low',
                'warning': 'This is synthetic data - real OSM data unavailable'
            }
        }
    ]
    
    return {
        'type': 'FeatureCollection',
        'features': features,
        'metadata': {
            'source': 'synthetic_fallback',
            'query_location': {'lat': latitude, 'lon': longitude},
            'query_radius_km': radius_km,
            'query_time': datetime.utcnow().isoformat(),
            'feature_count': len(features),
            'feature_statistics': {'highway': 1, 'building': 1, 'water': 1},
            'data_quality': {
                'completeness': 'synthetic',
                'accuracy': 'low',
                'freshness': 'generated'
            },
            'error_reason': error_reason,
            'warning': 'SYNTHETIC DATA - Real terrain data unavailable'
        }
    }

def create_basic_terrain_map(geojson, center_lat, center_lon):
    """Create a basic HTML map without external dependencies"""
    try:
        logger.info(f"🗺️ Creating basic terrain map at {center_lat}, {center_lon}")
        logger.info(f"📊 Input data - GeoJSON type: {type(geojson)}, Features: {len(geojson.get('features', [])) if geojson else 0}")
        
        # Create markers and overlays data for JavaScript with enhanced geometry processing
        markers = []
        overlays = []
        geometry_stats = {'Point': 0, 'LineString': 0, 'Polygon': 0, 'invalid': 0}
        
        if geojson and geojson.get('features'):
            feature_count = len(geojson['features'])
            logger.info(f"🎯 Processing {feature_count} terrain features for map rendering")
            
            for i, feature in enumerate(geojson['features']):
                try:
                    geometry = feature.get('geometry', {})
                    geometry_type = geometry.get('type', 'unknown')
                    coordinates = geometry.get('coordinates', [])
                    props = feature.get('properties', {})
                    feature_type = props.get('feature_type', 'unknown')
                    feature_name = props.get('name', f"{feature_type.title()} Feature")
                    
                    # Validate geometry before processing
                    if not coordinates:
                        logger.warning(f"⚠️ Feature {i} has no coordinates, skipping")
                        geometry_stats['invalid'] += 1
                        continue
                    
                    if geometry_type == 'Point':
                        # Process Point geometry
                        if len(coordinates) >= 2:
                            markers.append({
                                'lat': coordinates[1],
                                'lng': coordinates[0],
                                'title': feature_name,
                                'type': feature_type,
                                'properties': props,
                                'popup_content': _create_feature_popup_content(feature_type, props)
                            })
                            geometry_stats['Point'] += 1
                            logger.debug(f"    Added point marker: {feature_type} at {coordinates}")
                        else:
                            logger.warning(f"⚠️ Invalid Point coordinates for feature {i}")
                            geometry_stats['invalid'] += 1
                    
                    elif geometry_type == 'Polygon':
                        # Process Polygon geometry with proper validation
                        if coordinates and len(coordinates) > 0:
                            outer_ring = coordinates[0]  # Get outer ring
                            if len(outer_ring) >= 4:  # Minimum for valid polygon
                                # Convert to lat/lng format for Leaflet
                                latlngs = [[coord[1], coord[0]] for coord in outer_ring if len(coord) >= 2]
                                
                                if len(latlngs) >= 4:
                                    overlays.append({
                                        'type': 'polygon',
                                        'coordinates': latlngs,
                                        'feature_type': feature_type,
                                        'title': feature_name,
                                        'properties': props,
                                        'popup_content': _create_feature_popup_content(feature_type, props),
                                        'style_config': _get_polygon_style_config(feature_type)
                                    })
                                    geometry_stats['Polygon'] += 1
                                    logger.debug(f"    Added polygon overlay: {feature_type} with {len(latlngs)} points")
                                else:
                                    logger.warning(f"⚠️ Insufficient valid coordinates for polygon feature {i}")
                                    geometry_stats['invalid'] += 1
                            else:
                                logger.warning(f"⚠️ Polygon outer ring too short for feature {i}")
                                geometry_stats['invalid'] += 1
                        else:
                            logger.warning(f"⚠️ Empty polygon coordinates for feature {i}")
                            geometry_stats['invalid'] += 1
                    
                    elif geometry_type == 'LineString':
                        # Process LineString geometry with proper validation
                        if len(coordinates) >= 2:  # Minimum for valid line
                            # Convert to lat/lng format for Leaflet
                            latlngs = [[coord[1], coord[0]] for coord in coordinates if len(coord) >= 2]
                            
                            if len(latlngs) >= 2:
                                overlays.append({
                                    'type': 'polyline',
                                    'coordinates': latlngs,
                                    'feature_type': feature_type,
                                    'title': feature_name,
                                    'properties': props,
                                    'popup_content': _create_feature_popup_content(feature_type, props),
                                    'style_config': _get_polyline_style_config(feature_type)
                                })
                                geometry_stats['LineString'] += 1
                                logger.debug(f"    Added polyline overlay: {feature_type} with {len(latlngs)} points")
                            else:
                                logger.warning(f"⚠️ Insufficient valid coordinates for linestring feature {i}")
                                geometry_stats['invalid'] += 1
                        else:
                            logger.warning(f"⚠️ LineString too short for feature {i}")
                            geometry_stats['invalid'] += 1
                    
                    else:
                        logger.warning(f"⚠️ Unsupported geometry type '{geometry_type}' for feature {i}")
                        geometry_stats['invalid'] += 1
                
                except Exception as feature_error:
                    logger.warning(f"⚠️ Error processing feature {i}: {feature_error}")
                    geometry_stats['invalid'] += 1
                    continue
            
            # Log geometry processing statistics
            logger.info(f"📊 Geometry processing stats: {geometry_stats}")
            
        else:
            logger.warning("⚠️ No GeoJSON features provided for map")
        
        # Add center marker
        center_marker = {
            'lat': center_lat,
            'lng': center_lon,
            'title': 'Analysis Center',
            'type': 'center'
        }
        markers.append(center_marker)
        logger.info(f"📍 Added center marker at {center_lat}, {center_lon}")
        logger.info(f"🎯 Total markers to render: {len(markers)}")
        logger.info(f"🗺️ Total overlays to render: {len(overlays)}")
        
        # Log overlay breakdown
        if overlays:
            overlay_types = {}
            for overlay in overlays:
                overlay_type = overlay['feature_type']
                overlay_types[overlay_type] = overlay_types.get(overlay_type, 0) + 1
            logger.info(f"📊 Overlay breakdown: {overlay_types}")
        else:
            logger.warning("⚠️ No overlays found - terrain features may not be visible")
        
        # NOTE: No need to limit features anymore since we're using S3 URLs
        # The HTML will be stored in S3, not in the artifact
        logger.info(f"✅ Rendering all {len(overlays)} overlays and {len(markers)} markers")
        
        # Create simple HTML map with Leaflet
        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <title>Terrain Analysis Map</title>
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
        
        /* Enhanced popup styling */
        .terrain-feature-popup .leaflet-popup-content-wrapper {{
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }}
        
        .terrain-feature-popup .leaflet-popup-content {{
            margin: 12px 16px;
            line-height: 1.4;
        }}
        
        .terrain-feature-popup h4 {{
            color: #2c3e50;
            margin: 0 0 8px 0;
            font-size: 14px;
            font-weight: 600;
        }}
        
        .terrain-feature-popup p {{
            margin: 4px 0;
            font-size: 12px;
            color: #34495e;
        }}
        
        .terrain-feature-popup strong {{
            color: #2c3e50;
        }}
        
        /* Marker hover effects */
        .terrain-marker:hover {{
            transform: scale(1.1);
            transition: transform 0.2s ease;
        }}
        
        /* Legend styling */
        .legend {{
            background: white;
            padding: 10px;
            border-radius: 5px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            font-size: 12px;
            line-height: 1.4;
        }}
        
        .legend-item {{
            margin: 4px 0;
            display: flex;
            align-items: center;
        }}
        
        .legend-color {{
            width: 16px;
            height: 16px;
            margin-right: 8px;
            border: 1px solid #ccc;
            border-radius: 2px;
        }}
    </style>
</head>
<body>
    <div id="map"></div>
    <script>
        // Initialize map with minimal options
        var map = L.map('map', {{
            center: [{center_lat}, {center_lon}],
            zoom: 12,
            zoomAnimation: false,  // Disable zoom animation to prevent position errors
            fadeAnimation: false,  // Disable fade animation
            markerZoomAnimation: false  // Disable marker zoom animation
        }});
        
        // Add tile layer
        L.tileLayer('https://{{s}}.tile.openstreetmap.org/{{z}}/{{x}}/{{y}}.png', {{
            attribution: '© OpenStreetMap contributors'
        }}).addTo(map);
        
        var markers = {json.dumps(markers)};
        var overlays = {json.dumps(overlays)};
        
        // Wait for map to be completely ready before adding any layers
        map.whenReady(function() {{
            console.log('Map is ready, adding layers...');
            
            // Array to collect all layers for bounds calculation
            var allLayers = [];
            
            // Add markers - use default Leaflet markers (blue teardrop) to match notebook style
            markers.forEach(function(marker) {{
                var popupContent = marker.popup_content || marker.title;
                
                // Use default Leaflet marker for all markers (matches notebook visualization)
                var markerLayer = L.marker([marker.lat, marker.lng]])
                    .bindPopup(popupContent, {{
                        maxWidth: 300,
                        className: 'terrain-feature-popup'
                    }})
                    .addTo(map);
                
                // Add hover effect for markers
                markerLayer.on('mouseover', function(e) {{
                    this.openPopup();
                }});
                
                // Collect layer for bounds
                allLayers.push(markerLayer);
            }});

            
            // Add overlays (polygons and polylines) with enhanced styling
            overlays.forEach(function(overlay) {{
                var style = overlay.style_config || getDefaultOverlayStyle(overlay.feature_type);
                var layer;
                
                if (overlay.type === 'polygon') {{
                    layer = L.polygon(overlay.coordinates, style);
                }} else if (overlay.type === 'polyline') {{
                    layer = L.polyline(overlay.coordinates, style);
                }}
                
                if (layer) {{
                    // Use rich popup content if available, otherwise fallback to simple
                    var popupContent = overlay.popup_content || (overlay.title + '<br><small>' + overlay.feature_type + '</small>');
                    layer.bindPopup(popupContent, {{
                        maxWidth: 300,
                        className: 'terrain-feature-popup'
                    }});
                    
                    // Add hover effects
                    layer.on('mouseover', function(e) {{
                        var hoverStyle = Object.assign({{}}, style);
                        if (overlay.type === 'polygon') {{
                            hoverStyle.fillOpacity = Math.min(1.0, (hoverStyle.fillOpacity || 0.4) + 0.2);
                        }}
                        hoverStyle.opacity = Math.min(1.0, (hoverStyle.opacity || 0.8) + 0.2);
                        hoverStyle.weight = (hoverStyle.weight || 2) + 1;
                        layer.setStyle(hoverStyle);
                    }});
                    
                    layer.on('mouseout', function(e) {{
                        layer.setStyle(style);
                    }});
                    
                    layer.addTo(map);
                    
                    // Collect layer for bounds
                    allLayers.push(layer);
                }}
            }});
        
        // Enhanced style function for overlays with feature-specific styling
        function getDefaultOverlayStyle(featureType) {{
            switch (featureType) {{
                case 'water':
                    return {{
                        fillColor: '#3498db',
                        color: '#2980b9',
                        weight: 2,
                        fillOpacity: 0.5,
                        opacity: 0.8
                    }};
                case 'highway':
                    return {{
                        color: '#f39c12',
                        weight: 4,
                        opacity: 0.8,
                        fill: false
                    }};
                case 'major_highway':
                    return {{
                        color: '#e67e22',
                        weight: 6,
                        opacity: 0.9,
                        fill: false
                    }};
                case 'building':
                    return {{
                        fillColor: '#e74c3c',
                        color: '#c0392b',
                        weight: 2,
                        fillOpacity: 0.6,
                        opacity: 0.9
                    }};
                case 'railway':
                    return {{
                        color: '#34495e',
                        weight: 3,
                        opacity: 0.8,
                        fill: false,
                        dashArray: '10, 5'
                    }};
                case 'power_infrastructure':
                    return {{
                        color: '#e74c3c',
                        weight: 3,
                        opacity: 0.9,
                        fill: false,
                        dashArray: '8, 4'
                    }};
                case 'industrial':
                    return {{
                        fillColor: '#95a5a6',
                        color: '#7f8c8d',
                        weight: 2,
                        fillOpacity: 0.5,
                        opacity: 0.8
                    }};
                case 'forest':
                    return {{
                        fillColor: '#27ae60',
                        color: '#229954',
                        weight: 2,
                        fillOpacity: 0.4,
                        opacity: 0.7
                    }};
                case 'protected_area':
                    return {{
                        fillColor: '#f39c12',
                        color: '#e67e22',
                        weight: 3,
                        fillOpacity: 0.3,
                        opacity: 0.9,
                        dashArray: '5, 5'
                    }};
                case 'other':
                    return {{
                        color: '#8B4513',
                        weight: 3,
                        opacity: 0.8,
                        fill: false,
                        dashArray: '5, 5'
                    }};
                default:
                    return {{
                        fillColor: '#9b59b6',
                        color: '#8e44ad',
                        weight: 2,
                        fillOpacity: 0.4,
                        opacity: 0.8
                    }};
            }}
        }}
        
            // Fit bounds after all layers are added (still inside whenReady)
            setTimeout(function() {{
                if (allLayers.length > 1) {{
                    try {{
                        var group = new L.featureGroup(allLayers);
                        map.fitBounds(group.getBounds().pad(0.1), {{
                            animate: false,  // Disable animation to prevent position errors
                            duration: 0      // No animation duration
                        }});
                        console.log('Bounds fitted successfully');
                    }} catch (e) {{
                        console.warn('Could not fit bounds:', e);
                        // Fallback to center view if fitBounds fails
                        map.setView([{center_lat}, {center_lon}], 12, {{animate: false}});
                    }}
                }}
                
                // Invalidate size to ensure proper rendering after bounds fit
                setTimeout(function() {{
                    map.invalidateSize({{animate: false}});
                    console.log('Map size invalidated');
                }}, 100);
            }}, 300);  // Wait 300ms for layers to be fully added
        }});  // End of map.whenReady()
    </script>
</body>
</html>
"""
        
        logger.info("✅ Basic terrain map HTML generated successfully")
        logger.info(f"📏 Generated HTML length: {len(html_content)} characters")
        
        # Validate the generated HTML
        validation_result = validate_map_html(html_content)
        logger.info(f"🔍 HTML validation result: {validation_result}")
        
        if validation_result['is_valid']:
            logger.info("✅ HTML validation passed - map should render correctly")
        else:
            logger.warning(f"⚠️ HTML validation issues: {validation_result['issues']}")
        
        return html_content
        
    except Exception as e:
        logger.error(f"❌ Error creating basic terrain map: {e}", exc_info=True)
        return None

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
        project_id = params.get('project_id') or f'terrain-{int(datetime.now().timestamp() * 1000)}'
        radius_km = params.get('radius_km', 5.0)  # 5km radius provides ~150 features in typical areas
        
        if latitude is None or longitude is None:
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'success': False,
                    'error': 'Missing required parameters: latitude and longitude'
                })
            }
        
        logger.info(f"Analyzing terrain at ({latitude}, {longitude})")
        
        # Query real terrain data from OpenStreetMap
        logger.info("🌍 Querying real terrain data from OpenStreetMap")
        
        try:
            logger.info("🔄 Attempting to import OSM client for real data integration")
            
            # Import the OSM client with proper path handling
            try:
                from osm_client import query_osm_terrain_sync, OSMAPIError, validate_osm_response
                logger.info("✅ OSM client imported successfully")
            except ImportError as import_error:
                logger.error(f"❌ Failed to import OSM client: {import_error}")
                logger.error(f"📂 Current working directory: {os.getcwd()}")
                logger.error(f"📁 Directory contents: {os.listdir('.')}")
                logger.error(f"📂 Python path: {sys.path}")
                raise import_error
            
            # Query real OSM data
            logger.info(f"🌍 Querying real OSM data for coordinates ({latitude}, {longitude}) with radius {radius_km}km")
            geojson = query_osm_terrain_sync(latitude, longitude, radius_km)
            logger.info(f"📡 OSM query completed, received response with {len(geojson.get('features', []))} features")
            
            # Validate the OSM response
            validation_result = validate_osm_response(geojson)
            
            if not validation_result['is_valid']:
                logger.warning(f"⚠️ OSM data validation issues: {validation_result['issues']}")
                # Continue with potentially incomplete data but log issues
            
            # Log successful data retrieval
            feature_count = len(geojson.get('features', []))
            metadata = geojson.get('metadata', {})
            feature_stats = metadata.get('feature_statistics', {})
            data_quality = metadata.get('data_quality', {})
            
            logger.info(f"✅ Retrieved {feature_count} real terrain features from OSM")
            logger.info(f"📊 Feature breakdown: {feature_stats}")
            logger.info(f"🔍 Data quality: {data_quality}")
            
            # Log success metrics for monitoring
            if feature_count > 50:
                logger.info(f"🎉 SUCCESS: Retrieved substantial real data ({feature_count} features)")
            elif feature_count > 10:
                logger.info(f"✅ SUCCESS: Retrieved moderate real data ({feature_count} features)")
            else:
                logger.warning(f"⚠️ LOW FEATURE COUNT: Only {feature_count} features retrieved")
            
            # Process features for wind farm analysis
            processed_features = []
            for feature in geojson.get('features', []):
                try:
                    # Validate feature geometry
                    if not validate_feature_geometry(feature):
                        logger.warning(f"⚠️ Invalid geometry for feature {feature.get('properties', {}).get('osm_id', 'unknown')}")
                        continue
                    
                    # Add wind farm specific properties
                    props = feature.get('properties', {})
                    feature_type = props.get('feature_type', 'unknown')
                    
                    # Add wind impact assessment
                    props['wind_impact'] = get_wind_impact_assessment(feature_type)
                    props['required_setback_m'] = get_required_setback(feature_type)
                    props['data_source'] = 'openstreetmap'
                    props['reliability'] = 'high'
                    
                    processed_features.append(feature)
                    
                except Exception as feature_error:
                    logger.warning(f"⚠️ Error processing feature: {feature_error}")
                    continuegger.info(f"✅ SUCCESS: Retrieved moderate real data ({feature_count} features)")
            else:
                logger.warning(f"⚠️ LOW FEATURE COUNT: Only {feature_count} features retrieved - may indicate data quality issues")
            
            # Process and enhance features
            processed_features = []
            for feature in geojson.get('features', []):
                # Add data source information
                feature['properties']['data_source'] = 'openstreetmap_real'
                feature['properties']['reliability'] = 'high'
                
                # Add wind farm specific analysis
                feature_type = feature['properties'].get('feature_type', 'other')
                feature['properties']['wind_impact'] = get_wind_impact_assessment(feature_type)
                feature['properties']['setback_distance_m'] = get_required_setback(feature_type)
                
                # Validate geometry
                if validate_feature_geometry(feature):
                    processed_features.append(feature)
                else:
                    logger.warning(f"⚠️ Invalid geometry for feature {feature['properties'].get('osm_id')}")
            
            # Update geojson with processed features
            geojson['features'] = processed_features
            geojson['metadata']['processed_feature_count'] = len(processed_features)
            geojson['metadata']['validation_result'] = validation_result
            
        except ImportError as import_error:
            logger.error(f"❌ OSM client import error: {import_error}")
            logger.error(f"📍 Import error details: {type(import_error).__name__}: {str(import_error)}")
            logger.error(f"🔍 Python path: {sys.path}")
            logger.error(f"📂 Current directory: {os.getcwd()}")
            logger.error(f"📁 Directory contents: {os.listdir('.')}")
            
            # Create fallback synthetic data
            logger.warning("🔄 OSM client unavailable, using synthetic terrain data")
            logger.warning(f"🚨 REGRESSION ALERT: Using synthetic data instead of real OSM data due to import failure")
            geojson = create_fallback_terrain_data(latitude, longitude, radius_km, f"OSM client import failed: {str(import_error)}")
            
        except OSMAPIError as osm_error:
            # Handle OSM API specific errors
            logger.error(f"❌ OSM API Error: {osm_error}")
            logger.error(f"📍 OSM API error details: {str(osm_error)}")
            
            # Log specific OSM error context
            if hasattr(osm_error, 'status_code'):
                logger.error(f"🌐 HTTP status code: {osm_error.status_code}")
            if hasattr(osm_error, 'retry_after'):
                logger.error(f"⏳ Retry after: {osm_error.retry_after}")
            
            # Create fallback synthetic data with clear labeling
            logger.warning("🔄 Falling back to synthetic terrain data due to OSM API error")
            logger.warning(f"🚨 REGRESSION ALERT: Using synthetic data instead of real OSM data")
            geojson = create_fallback_terrain_data(latitude, longitude, radius_km, f"OSM API Error: {str(osm_error)}")
            
        except Exception as general_error:
            # Handle any other unexpected errors
            error_type = type(general_error).__name__
            logger.error(f"❌ Unexpected error in OSM integration: {error_type}: {general_error}")
            logger.error(f"📍 Error details: {str(general_error)}")
            logger.error(f"🔍 Error traceback:", exc_info=True)
            
            # Create fallback synthetic data with clear labeling
            logger.warning("🔄 Falling back to synthetic terrain data due to unexpected error")
            logger.warning(f"🚨 REGRESSION ALERT: Using synthetic data instead of real OSM data")
            geojson = create_fallback_terrain_data(latitude, longitude, radius_km, f"Unexpected error: {error_type}: {str(general_error)}")
        
        # Save geojson to S3 for frontend access
        geojson_s3_key = None
        geojson_s3_bucket = None
        if VISUALIZATIONS_AVAILABLE and geojson:
            try:
                from visualization_config import config
                geojson_s3_key = config.get_s3_key(project_id, 'geojson', 'json')
                geojson_s3_bucket = config.s3_bucket
                
                # Save to S3
                viz_generator = RenewableVisualizationGenerator(s3_bucket=geojson_s3_bucket)
                if viz_generator.s3_client:
                    import boto3
                    s3_client = viz_generator.s3_client
                    s3_client.put_object(
                        Bucket=geojson_s3_bucket,
                        Key=geojson_s3_key,
                        Body=json.dumps(geojson),
                        ContentType='application/json'
                    )
                    logger.info(f"✅ Saved geojson to S3: s3://{geojson_s3_bucket}/{geojson_s3_key}")
            except Exception as e:
                logger.warning(f"⚠️ Failed to save geojson to S3: {e}")
        
        # Generate rich visualizations if available
        map_html = None
        map_url = None
        visualizations = {}
        elevation_profile_url = None
        accessibility_chart_url = None
        topographic_map_url = None
        
        # Always try to generate a basic map first
        debug_info = {
            'map_generation_method': 'none',
            'map_html_length': 0,
            'map_validation': {},
            'generation_time': 0,
            'errors': []
        }
        
        import time
        start_time = time.time()
        
        try:
            logger.info("🚀 Starting basic terrain map generation")
            map_html = create_basic_terrain_map(geojson, latitude, longitude)
            generation_time = time.time() - start_time
            
            if map_html:
                debug_info['map_generation_method'] = 'basic'
                debug_info['map_html_length'] = len(map_html)
                debug_info['generation_time'] = generation_time
                logger.info(f"✅ Basic terrain map created successfully in {generation_time:.2f}s")
                
                # Save basic map HTML to S3 (bucket policy handles public access)
                try:
                    import boto3
                    s3_bucket = os.environ.get('RENEWABLE_S3_BUCKET')
                    if s3_bucket:
                        s3_client = boto3.client('s3')
                        s3_key = f"renewable/terrain/{project_id}/terrain_map.html"
                        s3_client.put_object(
                            Bucket=s3_bucket,
                            Key=s3_key,
                            Body=map_html.encode('utf-8'),
                            ContentType='text/html',
                            CacheControl='max-age=3600'
                        )
                        map_url = f"https://{s3_bucket}.s3.amazonaws.com/{s3_key}"
                        logger.info(f"✅ Saved basic map HTML to S3: {map_url}")
                    else:
                        logger.warning("⚠️ RENEWABLE_S3_BUCKET not configured, cannot save map to S3")
                except Exception as s3_error:
                    logger.error(f"❌ Failed to save map HTML to S3: {s3_error}")
            else:
                debug_info['errors'].append('Basic map generation returned None')
                logger.error("❌ Basic terrain map generation returned None")
        except Exception as e:
            debug_info['errors'].append(f"Basic map generation failed: {str(e)}")
            logger.error(f"❌ Failed to create basic terrain map: {e}", exc_info=True)
        
        if VISUALIZATIONS_AVAILABLE:
            try:
                logger.info("Generating comprehensive terrain visualizations")
                
                # Create visualization generator with explicit S3 configuration
                s3_bucket = os.environ.get('RENEWABLE_S3_BUCKET')
                aws_region = os.environ.get('RENEWABLE_AWS_REGION', 'us-west-2')
                logger.info(f"🔧 S3 Configuration - Bucket: {s3_bucket}, Region: {aws_region}")
                
                viz_generator = RenewableVisualizationGenerator(s3_bucket=s3_bucket, aws_region=aws_region)
                
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
        
        # If basic map creation failed, create minimal HTML fallback
        if not map_html:
            logger.info("Creating minimal HTML fallback")
            map_html = f"""
            <div style="padding: 20px; text-align: center; background: #f5f5f5; border-radius: 8px;">
                <h3>Terrain Analysis Location</h3>
                <p><strong>Coordinates:</strong> {latitude}, {longitude}</p>
                <p><strong>Project:</strong> {project_id}</p>
                <p>Interactive map temporarily unavailable. Analysis data is available below.</p>
            </div>
            """
        
        # Extract features and calculate metrics from geojson
        features = geojson.get('features', []) if geojson else []
        feature_counts = {}
        
        # Calculate feature type counts
        for feature in features:
            feature_type = feature.get('properties', {}).get('feature_type', 'unknown')
            feature_counts[feature_type] = feature_counts.get(feature_type, 0) + 1
        
        # CRITICAL: Always include geojson for map rendering
        # The frontend Leaflet map requires geojson data to render
        # Size optimization is handled by S3 storage, not by removing data
        
        # Prepare response data
        response_data = {
            'coordinates': {'lat': latitude, 'lng': longitude},
            'projectId': project_id,
            'exclusionZones': features,  # Include ALL features for table display
            'metrics': {
                'totalFeatures': len(features),
                'featuresByType': feature_counts,
                'radiusKm': radius_km
            },
            'geojson': geojson,  # ALWAYS include geojson - required for Leaflet map
            'geojsonS3Key': geojson_s3_key,  # Also provide S3 reference for backup
            'geojsonS3Bucket': geojson_s3_bucket,
            'mapHtml': map_html,  # CRITICAL: Include pre-rendered HTML to prevent frontend Leaflet initialization
            'message': f'Found {len(features)} terrain features',
            'debug': debug_info
        }
        
        # Add visualization data if available
        logger.info("📦 Preparing response data...")
        
        # Docker Lambda has 10GB response limit - we can include full mapHtml!
        # No more size restrictions like ZIP Lambda (6MB limit)
        if map_html:
            map_html_size = len(map_html.encode('utf-8'))
            response_data['mapHtml'] = map_html
            logger.info(f"✅ Including mapHtml in response ({map_html_size} bytes) - Docker Lambda 10GB limit")
        
        # Add mapUrl as backup
        if map_url:
            response_data['mapUrl'] = map_url
        if visualizations:
            response_data['visualizations'] = visualizations
        
        # Log final response structure
        response_keys = list(response_data.keys())
        logger.info(f"📋 Final response data keys: {response_keys}")
        logger.info(f"🎯 Response has mapUrl: {'mapUrl' in response_data}")
        logger.info(f"🎯 Response has visualizations: {'visualizations' in response_data}")
        logger.info(f"🎯 Response has debug info: {'debug' in response_data}")
        
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
