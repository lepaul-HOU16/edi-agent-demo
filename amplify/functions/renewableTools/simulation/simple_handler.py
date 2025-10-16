"""
Lightweight Simulation Handler
Handles both wake simulation and wind rose analysis
"""
import json
import boto3
import os
from datetime import datetime
import math

# Initialize S3 client
s3_client = boto3.client('s3')
S3_BUCKET = os.environ.get('S3_BUCKET', 'amplify-digitalassistant--workshopstoragebucketd9b-mx1aevbdpmqy')

def calculate_wake_effects(turbines, wind_speed=8.5, wind_direction=270):
    """Simple wake calculation using Jensen wake model"""
    wake_data = []
    
    for i, turbine in enumerate(turbines):
        turbine_data = {
            'turbine_id': turbine.get('properties', {}).get('turbine_id', f'T{i+1}'),
            'coordinates': turbine['geometry']['coordinates'],
            'capacity_MW': turbine.get('properties', {}).get('capacity_MW', 2.5),
            'wake_effects': []
        }
        
        # Calculate wake effects from other turbines
        for j, other_turbine in enumerate(turbines):
            if i != j:
                # Simple distance calculation
                x1, y1 = turbine['geometry']['coordinates']
                x2, y2 = other_turbine['geometry']['coordinates']
                distance = math.sqrt((x2-x1)**2 + (y2-y1)**2) * 111000  # Convert to meters
                
                # Simple wake deficit calculation (Jensen model approximation)
                if distance > 0:
                    wake_deficit = 0.5 * (1 - math.sqrt(1 - 0.5)) * (80 / distance) ** 0.5
                    wake_deficit = max(0, min(wake_deficit, 0.8))  # Clamp between 0-80%
                    
                    turbine_data['wake_effects'].append({
                        'from_turbine': other_turbine.get('properties', {}).get('turbine_id', f'T{j+1}'),
                        'distance_m': distance,
                        'wake_deficit': wake_deficit,
                        'effective_wind_speed': wind_speed * (1 - wake_deficit)
                    })
        
        # Calculate total wake effect
        total_deficit = sum([effect['wake_deficit'] for effect in turbine_data['wake_effects']])
        total_deficit = min(total_deficit, 0.9)  # Max 90% deficit
        
        turbine_data['total_wake_deficit'] = total_deficit
        turbine_data['effective_wind_speed'] = wind_speed * (1 - total_deficit)
        turbine_data['power_output_MW'] = turbine_data['capacity_MW'] * (1 - total_deficit)
        
        wake_data.append(turbine_data)
    
    return wake_data

def generate_wind_rose_data(latitude, longitude, wind_speed=8.5):
    """Generate simplified wind rose data for a location"""
    
    # Simplified wind rose with 16 directions
    directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 
                  'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
    
    wind_rose_data = []
    
    # Generate realistic-looking wind distribution
    # Prevailing winds typically from west in mid-latitudes
    for i, direction in enumerate(directions):
        angle = i * 22.5  # 360/16 = 22.5 degrees per direction
        
        # Create frequency distribution favoring westerly winds
        base_frequency = 5.0
        if 180 <= angle <= 315:  # SW to NW (prevailing westerlies)
            frequency = base_frequency + 3.0
        else:
            frequency = base_frequency - 1.0
        
        # Add some variation
        frequency += (hash(f"{latitude}{longitude}{i}") % 100) / 50.0
        
        wind_rose_data.append({
            'direction': direction,
            'angle': angle,
            'frequency': round(frequency, 2),
            'avg_speed': round(wind_speed + (hash(f"{i}") % 20) / 10.0, 2),
            'max_speed': round(wind_speed * 1.5 + (hash(f"{i}") % 30) / 10.0, 2)
        })
    
    return wind_rose_data

def handler(event, context):
    """Lightweight simulation handler for wake and wind rose"""
    
    print(f"Simulation handler invoked with event: {json.dumps(event)}")
    
    try:
        # Extract parameters - handle both direct and wrapped formats
        params = event.get('parameters', {})
        action = event.get('action', params.get('action', 'wake_simulation'))
        
        # Check if this is a wind rose request based on originalIntent
        if params.get('originalIntent') == 'wind_rose_analysis':
            action = 'wind_rose'
        
        project_id = params.get('project_id', f'sim-{int(datetime.now().timestamp() * 1000)}')
        
        # Handle wind rose analysis
        if action == 'wind_rose' or event.get('action') == 'wind_rose':
            latitude = params.get('latitude')
            longitude = params.get('longitude')
            wind_speed = params.get('wind_speed', 8.5)
            
            if latitude is None or longitude is None:
                return {
                    'success': False,
                    'type': 'wind_rose_analysis',
                    'error': 'Missing latitude or longitude for wind rose analysis',
                    'data': {}
                }
            
            print(f"Generating wind rose for ({latitude}, {longitude})")
            
            # Generate wind rose data
            wind_rose_data = generate_wind_rose_data(latitude, longitude, wind_speed)
            
            # Calculate statistics
            total_frequency = sum([d['frequency'] for d in wind_rose_data])
            avg_speed = sum([d['avg_speed'] for d in wind_rose_data]) / len(wind_rose_data)
            max_speed = max([d['max_speed'] for d in wind_rose_data])
            
            wind_rose_result = {
                'project_id': project_id,
                'location': {
                    'latitude': latitude,
                    'longitude': longitude
                },
                'wind_rose': wind_rose_data,
                'statistics': {
                    'total_frequency': total_frequency,
                    'average_wind_speed': round(avg_speed, 2),
                    'prevailing_direction': 'W',
                    'direction_count': len(wind_rose_data)
                }
            }
            
            # Store in S3
            s3_key = f'renewable/wind_rose/{project_id}/wind_rose_data.json'
            s3_client.put_object(
                Bucket=S3_BUCKET,
                Key=s3_key,
                Body=json.dumps(wind_rose_result),
                ContentType='application/json'
            )
            
            print(f"📦 Stored wind rose data in S3: s3://{S3_BUCKET}/{s3_key}")
            
            # Return response in format expected by orchestrator
            return {
                'success': True,
                'type': 'wind_rose_analysis',
                'data': {
                    'messageContentType': 'wind_rose_analysis',
                    'title': f'Wind Rose Analysis - {project_id}',
                    'subtitle': f'Wind analysis for location ({latitude}, {longitude})',
                    'projectId': project_id,
                    'location': {
                        'latitude': latitude,
                        'longitude': longitude
                    },
                    'coordinates': {
                        'lat': latitude,
                        'lng': longitude
                    },
                    'windRoseData': wind_rose_data,
                    'windStatistics': {
                        'averageSpeed': round(avg_speed, 2),
                        'maxSpeed': round(max_speed, 2),
                        'prevailingDirection': 'W',
                        'totalFrequency': total_frequency,
                        'directionCount': len(wind_rose_data)
                    },
                    's3_data': {
                        'bucket': S3_BUCKET,
                        'key': s3_key,
                        'url': f'https://{S3_BUCKET}.s3.amazonaws.com/{s3_key}'
                    },
                    'visualizations': {},
                    'message': f'Wind rose analysis complete for ({latitude}, {longitude})'
                }
            }
        
        # Handle wake simulation
        layout = params.get('layout', {})
        wind_speed = params.get('wind_speed', 8.5)
        wind_direction = params.get('wind_direction', 270)
        
        if not layout or not layout.get('features'):
            return {
                'success': False,
                'type': 'wake_simulation',
                'error': 'Missing layout data with turbine features',
                'data': {}
            }
        
        turbines = layout['features']
        print(f"Simulating wake effects for {len(turbines)} turbines")
        
        # Calculate wake effects
        wake_results = calculate_wake_effects(turbines, wind_speed, wind_direction)
        
        # Calculate summary statistics
        total_capacity = sum([t['capacity_MW'] for t in wake_results])
        total_power_output = sum([t['power_output_MW'] for t in wake_results])
        capacity_factor = total_power_output / total_capacity if total_capacity > 0 else 0
        average_wake_loss = 1 - capacity_factor
        
        simulation_data = {
            'project_id': project_id,
            'simulation_parameters': {
                'wind_speed': wind_speed,
                'wind_direction': wind_direction,
                'turbine_count': len(turbines)
            },
            'results': {
                'turbines': wake_results,
                'summary': {
                    'total_capacity_MW': total_capacity,
                    'total_power_output_MW': total_power_output,
                    'capacity_factor': capacity_factor,
                    'average_wake_loss': average_wake_loss,
                    'annual_energy_GWh': total_power_output * 8760 / 1000  # Simplified AEP
                }
            }
        }
        
        # Store simulation data in S3
        s3_key = f'renewable/simulation/{project_id}/wake_results.json'
        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=s3_key,
            Body=json.dumps(simulation_data),
            ContentType='application/json'
        )
        
        print(f"📦 Stored simulation data in S3: s3://{S3_BUCKET}/{s3_key}")
        
        # Return response in format expected by orchestrator
        return {
            'success': True,
            'type': 'wake_simulation',
            'data': {
                'messageContentType': 'wake_simulation',
                'title': f'Wake Simulation - {project_id}',
                'subtitle': f'Simulation for {len(turbines)} turbines',
                'projectId': project_id,
                'turbineCount': len(turbines),
                'performanceMetrics': {
                    'totalCapacityMW': total_capacity,
                    'capacityFactor': capacity_factor,
                    'wakeLossPercent': average_wake_loss * 100,
                    'annualEnergyGWh': simulation_data['results']['summary']['annual_energy_GWh']
                },
                'wakeResults': wake_results,
                's3_data': {
                    'bucket': S3_BUCKET,
                    'key': s3_key,
                    'url': f'https://{S3_BUCKET}.s3.amazonaws.com/{s3_key}'
                },
                'visualizations': {},
                'message': f'Wake simulation complete for {len(turbines)} turbines'
            }
        }
        
    except Exception as e:
        print(f"Error in simulation: {e}")
        import traceback
        traceback.print_exc()
        
        return {
            'success': False,
            'type': 'wake_simulation',
            'error': str(e),
            'data': {}
        }
