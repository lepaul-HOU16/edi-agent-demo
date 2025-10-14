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
        
        # Store layout data in S3
        s3_key = f'renewable/layout/{project_id}/layout_results.json'
        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=s3_key,
            Body=json.dumps(layout_data),
            ContentType='application/json'
        )
        
        print(f"📦 Stored layout data in S3: s3://{S3_BUCKET}/{s3_key}")
        
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
        return {
            'success': True,
            'type': 'layout_optimization',  # Type for orchestrator routing
            'data': {
                'projectId': project_id,
                'title': f'Wind Farm Layout - {project_id}',
                'subtitle': f'{len(optimized_turbines)} turbines, {total_capacity:.1f}MW',
                'metrics': {
                    'turbineCount': len(optimized_turbines),
                    'totalCapacity': total_capacity,
                    'turbinePositions': turbine_positions,
                    'layoutType': 'Grid',
                    'spacing': {
                        'downwind': turbine_spacing_m / 100,  # Convert to rotor diameters (assuming 100m rotor)
                        'crosswind': turbine_spacing_m / 100
                    }
                },
                'geojson': layout_data['layout'],  # Include full GeoJSON
                's3Data': {
                    'bucket': S3_BUCKET,
                    'key': s3_key,
                    'url': f'https://{S3_BUCKET}.s3.amazonaws.com/{s3_key}'
                },
                'visualization_available': False,
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
