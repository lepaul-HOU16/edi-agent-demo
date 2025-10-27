"""
Lightweight Layout Optimization Handler
Generates turbine layouts without heavy dependencies
"""
import json
import boto3
import os
from datetime import datetime
import math

# Initialize S3 client
s3_client = boto3.client('s3')
S3_BUCKET = os.environ.get('S3_BUCKET', 'amplify-digitalassistant--workshopstoragebucketd9b-mx1aevbdpmqy')

def generate_grid_layout(center_lat, center_lon, area_km2, turbine_spacing_m=500):
    """Generate a simple grid layout of turbines"""
    
    # Calculate grid dimensions
    area_m2 = area_km2 * 1000000
    side_length_m = math.sqrt(area_m2)
    
    # Number of turbines per side
    turbines_per_side = int(side_length_m / turbine_spacing_m)
    
    # Convert spacing to lat/lon offsets (approximate)
    lat_offset_per_m = 1 / 111000  # 1 degree lat ≈ 111km
    lon_offset_per_m = 1 / (111000 * math.cos(math.radians(center_lat)))
    
    turbines = []
    turbine_id = 1
    
    # Generate grid
    start_offset = -(turbines_per_side - 1) * turbine_spacing_m / 2
    
    for i in range(turbines_per_side):
        for j in range(turbines_per_side):
            # Calculate position
            x_offset = start_offset + i * turbine_spacing_m
            y_offset = start_offset + j * turbine_spacing_m
            
            lat = center_lat + y_offset * lat_offset_per_m
            lon = center_lon + x_offset * lon_offset_per_m
            
            turbine = {
                'type': 'Feature',
                'geometry': {
                    'type': 'Point',
                    'coordinates': [lon, lat]
                },
                'properties': {
                    'turbine_id': f'T{turbine_id:03d}',
                    'capacity_MW': 2.5,
                    'hub_height_m': 80,
                    'rotor_diameter_m': 100,
                    'spacing_m': turbine_spacing_m
                }
            }
            
            turbines.append(turbine)
            turbine_id += 1
    
    return turbines

def optimize_layout_simple(turbines, constraints=None):
    """Simple layout optimization - remove turbines that are too close to constraints"""
    
    if not constraints:
        return turbines
    
    optimized_turbines = []
    min_setback_m = 500  # Minimum setback distance
    
    for turbine in turbines:
        turbine_lat, turbine_lon = turbine['geometry']['coordinates'][1], turbine['geometry']['coordinates'][0]
        
        # Check distance to constraints
        valid_position = True
        
        for constraint in constraints:
            # Simple distance check (this would be more sophisticated in real implementation)
            if constraint.get('geometry', {}).get('type') == 'Point':
                const_lon, const_lat = constraint['geometry']['coordinates']
                distance_m = math.sqrt(
                    ((turbine_lat - const_lat) * 111000) ** 2 + 
                    ((turbine_lon - const_lon) * 111000 * math.cos(math.radians(turbine_lat))) ** 2
                )
                
                if distance_m < min_setback_m:
                    valid_position = False
                    break
        
        if valid_position:
            optimized_turbines.append(turbine)
    
    return optimized_turbines

def create_layout_map_html(turbines, center_lat, center_lon):
    """Create interactive HTML map for wind farm layout"""
    try:
        # Create markers data for JavaScript
        markers = []
        for turbine in turbines:
            coords = turbine['geometry']['coordinates']
            props = turbine.get('properties', {})
            turbine_id = props.get('turbine_id', 'N/A')
            
            markers.append({
                'lat': coords[1],
                'lng': coords[0],
                'title': f"Turbine {turbine_id}",
                'type': 'turbine',
                'properties': props
            })
        
        # Add center marker
        markers.append({
            'lat': center_lat,
            'lng': center_lon,
            'title': 'Project Center',
            'type': 'center'
        })
        
        # Create HTML map with Leaflet - matching notebook style
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
        
        // Add satellite basemap (matching notebook)
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{{z}}/{{y}}/{{x}}', {{
            attribution: 'Esri',
            maxZoom: 19
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
        
        return html_content
        
    except Exception as e:
        print(f"Error creating layout map HTML: {e}")
        return None

def handler(event, context):
    """Lightweight layout optimization handler"""
    
    print(f"Layout optimization handler invoked with event: {json.dumps(event)}")
    
    try:
        # Extract parameters
        params = event.get('parameters', {})
        project_id = params.get('project_id', f'layout-{int(datetime.now().timestamp() * 1000)}')
        center_lat = params.get('latitude')
        center_lon = params.get('longitude')
        area_km2 = params.get('area_km2', 5.0)
        turbine_spacing_m = params.get('turbine_spacing_m', 500)
        constraints = params.get('constraints', [])
        
        if center_lat is None or center_lon is None:
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'success': False,
                    'error': 'Missing latitude or longitude for layout center'
                })
            }
        
        print(f"Generating layout at ({center_lat}, {center_lon}), area={area_km2}km²")
        
        # Generate initial grid layout
        turbines = generate_grid_layout(center_lat, center_lon, area_km2, turbine_spacing_m)
        
        # Apply constraints optimization
        optimized_turbines = optimize_layout_simple(turbines, constraints)
        
        # Calculate layout statistics
        total_capacity = len(optimized_turbines) * 2.5  # 2.5 MW per turbine
        removed_count = len(turbines) - len(optimized_turbines)
        
        layout_data = {
            'project_id': project_id,
            'layout_parameters': {
                'center_coordinates': [center_lon, center_lat],
                'area_km2': area_km2,
                'turbine_spacing_m': turbine_spacing_m,
                'constraints_applied': len(constraints)
            },
            'layout': {
                'type': 'FeatureCollection',
                'features': optimized_turbines
            },
            'statistics': {
                'turbine_count': len(optimized_turbines),
                'total_capacity_MW': total_capacity,
                'turbines_removed': removed_count,
                'capacity_density_MW_km2': total_capacity / area_km2,
                'average_spacing_m': turbine_spacing_m
            }
        }
        
        # Store layout data in S3 (legacy format for backward compatibility)
        s3_key = f'renewable/layout/{project_id}/layout_results.json'
        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=s3_key,
            Body=json.dumps(layout_data),
            ContentType='application/json'
        )
        
        print(f"📦 Stored layout data in S3: s3://{S3_BUCKET}/{s3_key}")
        
        # CRITICAL: Save complete layout JSON for wake simulation
        # Wake simulation requires this specific format with turbines array, perimeter, and features
        try:
            # Build turbines array with required fields
            turbines_array = []
            for turbine in optimized_turbines:
                coords = turbine['geometry']['coordinates']
                props = turbine.get('properties', {})
                turbines_array.append({
                    'id': props.get('turbine_id', 'unknown'),
                    'latitude': coords[1],
                    'longitude': coords[0],
                    'hub_height': props.get('hub_height_m', 80.0),
                    'rotor_diameter': props.get('rotor_diameter_m', 100.0)
                })
            
            # Calculate perimeter polygon (bounding box around all turbines)
            if turbines_array:
                lats = [t['latitude'] for t in turbines_array]
                lons = [t['longitude'] for t in turbines_array]
                
                # Add buffer around turbines (10% of range)
                lat_range = max(lats) - min(lats) if len(lats) > 1 else 0.01
                lon_range = max(lons) - min(lons) if len(lons) > 1 else 0.01
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
            if turbines_array and len(turbines_array) > 1:
                lat_range_km = (max(lats) - min(lats)) * 111.32  # 1 degree lat ≈ 111.32 km
                lon_range_km = (max(lons) - min(lons)) * 111.32 * math.cos(math.radians(center_lat))
                site_area_km2 = lat_range_km * lon_range_km
            else:
                site_area_km2 = area_km2
            
            # Extract OSM features from constraints (if any)
            osm_features = []
            for constraint in constraints:
                if constraint.get('type') == 'Feature':
                    osm_features.append(constraint)
            
            # Prepare complete layout data package per schema
            complete_layout_data = {
                'project_id': project_id,
                'algorithm': 'grid',  # Simple handler uses grid algorithm
                'turbines': turbines_array,
                'perimeter': perimeter,
                'features': osm_features,  # OSM terrain features
                'metadata': {
                    'created_at': datetime.now().isoformat(),
                    'num_turbines': len(turbines_array),
                    'total_capacity_mw': total_capacity,
                    'site_area_km2': site_area_km2,
                    'turbine_model': 'GE 2.5-120',  # Default model
                    'spacing_d': turbine_spacing_m / 100.0,  # Convert to rotor diameters
                    'rotor_diameter': 100.0,
                    'coordinates': {
                        'latitude': center_lat,
                        'longitude': center_lon
                    }
                }
            }
            
            # Save to S3 at the path wake simulation expects
            layout_json_key = f"renewable/layout/{project_id}/layout.json"
            s3_client.put_object(
                Bucket=S3_BUCKET,
                Key=layout_json_key,
                Body=json.dumps(complete_layout_data),
                ContentType='application/json',
                CacheControl='max-age=3600'
            )
            print(f"✅ Saved complete layout JSON to S3: {layout_json_key}")
            print(f"   - Turbines: {len(turbines_array)}")
            print(f"   - OSM Features: {len(osm_features)}")
            print(f"   - Perimeter: {perimeter['type']}")
            print(f"   - Algorithm: grid")
            print(f"   Wake simulation can now access layout data for project {project_id}")
            
        except Exception as layout_save_error:
            print(f"❌ CRITICAL: Failed to save layout JSON to S3: {layout_save_error}")
            print(f"   Wake simulation will not work without this file!")
            import traceback
            traceback.print_exc()
        
        # Generate interactive map HTML
        map_html = create_layout_map_html(optimized_turbines, center_lat, center_lon)
        map_url = None
        
        if map_html:
            # Save map HTML to S3 (bucket policy handles public access)
            map_s3_key = f'renewable/layout/{project_id}/layout_map.html'
            s3_client.put_object(
                Bucket=S3_BUCKET,
                Key=map_s3_key,
                Body=map_html.encode('utf-8'),
                ContentType='text/html',
                CacheControl='max-age=3600'
            )
            map_url = f"https://{S3_BUCKET}.s3.amazonaws.com/{map_s3_key}"
            print(f"✅ Saved layout map HTML to S3: {map_url}")
        
        # Extract turbine positions for frontend
        turbine_positions = []
        for turbine in optimized_turbines:
            coords = turbine['geometry']['coordinates']
            turbine_positions.append({
                'lat': coords[1],
                'lng': coords[0],
                'id': turbine['properties'].get('turbine_id')
            })
        
        # Return lightweight response matching expected format
        # CRITICAL: Flatten structure to match LayoutMapArtifact component expectations
        return {
            'success': True,
            'type': 'layout_optimization',  # Type for orchestrator routing
            'data': {
                'messageContentType': 'wind_farm_layout',  # CRITICAL: Add messageContentType
                'projectId': project_id,
                'title': f'Wind Farm Layout - {project_id}',
                'subtitle': f'{len(optimized_turbines)} turbines, {total_capacity:.1f}MW',
                # Flatten metrics to top level for component compatibility
                'turbineCount': len(optimized_turbines),
                'totalCapacity': total_capacity,
                'turbinePositions': turbine_positions,
                'layoutType': 'Grid',
                'spacing': {
                    'downwind': turbine_spacing_m / 100,  # Convert to rotor diameters (assuming 100m rotor)
                    'crosswind': turbine_spacing_m / 100
                },
                'geojson': layout_data['layout'],  # Include full GeoJSON
                'mapHtml': map_html if map_html else None,  # Include map HTML
                'mapUrl': map_url if map_url else None,  # Include map URL
                's3Data': {
                    'bucket': S3_BUCKET,
                    'key': s3_key,
                    'url': f'https://{S3_BUCKET}.s3.amazonaws.com/{s3_key}'
                },
                'layoutS3Key': f"renewable/layout/{project_id}/layout.json",  # CRITICAL: S3 key for wake simulation
                'visualization_available': map_html is not None,
                'message': f'Generated layout with {len(optimized_turbines)} turbines ({removed_count} removed due to constraints)'
            }
        }
        
    except Exception as e:
        print(f"Error in layout optimization: {e}")
        import traceback
        traceback.print_exc()
        
        return {
            'statusCode': 500,
            'body': json.dumps({
                'success': False,
                'error': str(e)
            })
        }
