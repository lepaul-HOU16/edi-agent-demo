"""
Enhanced Wake Simulation Tool Lambda
Simplified simulation handler with rich visualizations
"""
import json
import sys
import os
import logging
import numpy as np

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
    VISUALIZATIONS_AVAILABLE = True
    logger.info("Visualization modules loaded successfully")
except ImportError as e:
    logger.warning(f"Visualization modules not available: {e}")
    VISUALIZATIONS_AVAILABLE = False

def generate_wake_heat_map_data(layout, wind_speed):
    """Generate wake heat map data for visualization"""
    try:
        import numpy as np
    except ImportError:
        logger.error("NumPy not available, returning basic wake data")
        return {
            'heat_zones': [],
            'interaction_lines': [],
            'wind_arrows': []
        }
    
    features = layout.get('features', [])
    if not features:
        return {
            'heat_zones': [],
            'interaction_lines': [],
            'wind_arrows': []
        }
    
    # Extract turbine coordinates
    turbine_coords = []
    for feature in features:
        coords = feature['geometry']['coordinates']
        turbine_coords.append([coords[1], coords[0]])  # lat, lon
    
    # Generate heat zones based on turbine positions
    heat_zones = []
    interaction_lines = []
    wind_arrows = []
    
    for i, coord in enumerate(turbine_coords):
        # Create wake deficit zone for each turbine
        deficit = np.random.uniform(5, 20)  # Random wake deficit
        
        # Create circular wake zone (simplified)
        center_lat, center_lon = coord
        radius_deg = 0.01  # Approximate radius in degrees
        
        # Generate circular polygon
        angles = np.linspace(0, 2*np.pi, 12)
        zone_coords = []
        for angle in angles:
            lat_offset = radius_deg * np.sin(angle)
            lon_offset = radius_deg * np.cos(angle)
            zone_coords.append([center_lon + lon_offset, center_lat + lat_offset])
        zone_coords.append(zone_coords[0])  # Close polygon
        
        heat_zones.append({
            'deficit': deficit,
            'affected_turbines': f'T{i+1:02d}',
            'wind_direction': np.random.uniform(0, 360),
            'geometry': {
                'type': 'Polygon',
                'coordinates': [zone_coords]
            }
        })
        
        # Create interaction lines to nearby turbines
        for j, other_coord in enumerate(turbine_coords):
            if i != j:
                distance = np.sqrt((coord[0] - other_coord[0])**2 + (coord[1] - other_coord[1])**2) * 111000  # Rough distance in meters
                if distance < 1000:  # Only show interactions within 1km
                    interaction_deficit = max(0, 20 - distance/50)  # Deficit decreases with distance
                    if interaction_deficit > 3:  # Only show significant interactions
                        interaction_lines.append({
                            'coordinates': [coord, other_coord],
                            'deficit': interaction_deficit,
                            'distance': distance,
                            'source_turbine': f'T{i+1:02d}',
                            'target_turbine': f'T{j+1:02d}'
                        })
        
        # Add wind direction arrow
        if i < 5:  # Only add arrows for first few turbines to avoid clutter
            arrow_length = 0.005  # Length in degrees
            wind_dir_rad = np.radians(225)  # SW wind direction
            end_lat = center_lat + arrow_length * np.sin(wind_dir_rad)
            end_lon = center_lon + arrow_length * np.cos(wind_dir_rad)
            
            wind_arrows.append({
                'start': [center_lat, center_lon],
                'end': [end_lat, end_lon],
                'wind_speed': wind_speed,
                'direction': 225
            })
    
    return {
        'heat_zones': heat_zones,
        'interaction_lines': interaction_lines,
        'wind_arrows': wind_arrows
    }

def handler(event, context):
    """
    Lambda handler for wake simulation
    
    Expected event structure:
    {
        "query": "user query string",
        "parameters": {
            "project_id": str,
            "layout": dict (GeoJSON layout from layout tool),
            "wind_speed": float (optional, default 8.0 m/s),
            "air_density": float (optional, default 1.225 kg/m³)
        }
    }
    """
    try:
        logger.info(f"Wake simulation Lambda invoked")
        
        # Extract parameters
        params = event.get('parameters', {})
        project_id = params.get('project_id', 'default-project')
        layout = params.get('layout', {})
        wind_speed = params.get('wind_speed', 8.0)
        air_density = params.get('air_density', 1.225)
        
        # Validate required parameters
        if not layout or not layout.get('features'):
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'success': False,
                    'error': 'Missing required parameter: layout with turbine positions'
                })
            }
        
        logger.info(f"Running wake simulation for project {project_id}")
        
        # Extract turbine data
        features = layout.get('features', [])
        num_turbines = len(features)
        
        # Get turbine capacity from first turbine
        capacity_mw = features[0]['properties'].get('capacity_MW', 2.5) if features else 2.5
        total_capacity = num_turbines * capacity_mw
        
        # Simplified performance calculations
        # These are rough estimates - real simulation would use py-wake
        hours_per_year = 8760
        capacity_factor = 0.35  # Typical for wind farms
        wake_loss_percent = 5.0  # Typical wake losses
        
        # Calculate annual energy production
        gross_aep_gwh = total_capacity * hours_per_year * capacity_factor / 1000
        net_aep_gwh = gross_aep_gwh * (1 - wake_loss_percent / 100)
        
        # Monthly production (simplified - seasonal variation)
        seasonal_factors = [0.9, 0.85, 1.0, 1.1, 1.15, 1.2, 1.25, 1.2, 1.1, 1.0, 0.9, 0.85]
        monthly_production = [(net_aep_gwh / 12) * factor for factor in seasonal_factors]
        
        logger.info(f"Simulation completed: AEP={net_aep_gwh:.2f} GWh, CF={capacity_factor:.2%}")
        
        # Generate rich visualizations if available
        map_html = None
        visualizations = {}
        
        if VISUALIZATIONS_AVAILABLE:
            try:
                logger.info("Generating wake simulation visualizations")
                
                # Create visualization generators
                viz_generator = RenewableVisualizationGenerator()
                matplotlib_generator = MatplotlibChartGenerator()
                
                # Generate wind rose diagram
                wind_data = {
                    'speeds': np.random.weibull(2, 1000) * 15,  # Sample wind speeds
                    'directions': np.random.uniform(0, 360, 1000)  # Sample directions
                }
                wind_rose_bytes = matplotlib_generator.create_wind_rose(wind_data, f"Wind Rose - {project_id}")
                
                # Generate seasonal wind analysis data
                seasonal_wind_data = {
                    'spring': {
                        'directions': np.random.normal(225, 45, 500) % 360,  # SW winds
                        'speeds': np.random.weibull(2, 500) * 12
                    },
                    'summer': {
                        'directions': np.random.normal(270, 30, 500) % 360,  # W winds
                        'speeds': np.random.weibull(2, 500) * 8
                    },
                    'fall': {
                        'directions': np.random.normal(315, 60, 500) % 360,  # NW winds
                        'speeds': np.random.weibull(2, 500) * 14
                    },
                    'winter': {
                        'directions': np.random.normal(0, 45, 500) % 360,  # N winds
                        'speeds': np.random.weibull(2, 500) * 16
                    },
                    'monthly_speeds': [8.5, 9.2, 9.8, 9.5, 8.8, 7.5, 6.8, 7.2, 8.1, 8.9, 9.3, 8.7],
                    'monthly_max': [12.1, 13.2, 14.1, 13.6, 12.5, 10.8, 9.7, 10.3, 11.6, 12.7, 13.3, 12.4],
                    'monthly_min': [5.9, 6.4, 6.8, 6.6, 6.1, 5.2, 4.7, 5.0, 5.6, 6.2, 6.5, 6.1]
                }
                
                # Generate wind resource variability data
                variability_data = {
                    'yearly_data': {
                        'years': list(range(2014, 2024)),
                        'speeds': [8.5 + i * 0.02 + np.random.normal(0, 0.3) for i in range(10)]
                    },
                    'capacity_factors': {
                        'monthly': {
                            'months': ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                            'values': [0.32, 0.35, 0.38, 0.36, 0.33, 0.28, 0.25, 0.27, 0.31, 0.34, 0.36, 0.33]
                        }
                    }
                }
                
                # Generate wake heat map data
                wake_heat_data = generate_wake_heat_map_data(layout, wind_speed)
                
                # Generate performance charts
                performance_data = {
                    'months': list(range(1, 13)),
                    'monthly_production': monthly_production,
                    'turbine_ids': [f'T{i:02d}' for i in range(1, min(num_turbines + 1, 21))],
                    'turbine_performance': np.random.uniform(85, 105, min(num_turbines, 20)),
                    'capacity_factors': np.random.normal(capacity_factor, 0.05, 100),
                    'wind_speeds': np.linspace(3, 25, 50),
                    'availability': np.random.uniform(95, 99.5, 12),
                    'wake_losses': np.random.uniform(3, 12, 12)
                }
                
                performance_charts = []
                
                # Monthly performance chart
                monthly_chart = matplotlib_generator.create_performance_chart(performance_data, 'monthly')
                performance_charts.append(monthly_chart)
                
                # Individual turbine performance chart
                if num_turbines <= 20:  # Only for smaller wind farms
                    individual_chart = matplotlib_generator.create_performance_chart(performance_data, 'individual')
                    performance_charts.append(individual_chart)
                
                # Performance comparison chart
                comparison_chart = matplotlib_generator.create_performance_chart(performance_data, 'comparison')
                performance_charts.append(comparison_chart)
                
                # Wake deficit chart
                wake_data = {
                    'deficit_grid': np.random.uniform(0, 20, (50, 50)),
                    'x_coords': np.linspace(-1000, 1000, 50),
                    'y_coords': np.linspace(-1000, 1000, 50),
                    'wake_profile': {
                        'distances': np.linspace(0, 2000, 100),
                        'deficits': 25 * np.exp(-np.linspace(0, 2000, 100) / 800)
                    }
                }
                wake_chart = matplotlib_generator.create_wake_deficit_chart(wake_data)
                
                # Generate seasonal wind analysis chart
                seasonal_chart = matplotlib_generator.create_seasonal_wind_analysis(seasonal_wind_data)
                
                # Generate wind resource variability chart
                variability_chart = matplotlib_generator.create_wind_resource_variability_chart(variability_data)
                
                # Generate comprehensive wake analysis map with heat overlays
                folium_generator = FoliumMapGenerator()
                wake_analysis_map_html = folium_generator.create_comprehensive_wake_analysis_map(
                    wake_heat_data, layout
                )
                
                # Save visualizations to S3 if configured
                if viz_generator.s3_client:
                    # Save wind rose
                    wind_rose_key = config.get_s3_key(project_id, 'wind_rose', 'png')
                    wind_rose_url = viz_generator.save_image_to_s3(wind_rose_bytes, wind_rose_key)
                    if wind_rose_url:
                        visualizations['wind_rose'] = wind_rose_url
                        logger.info(f"Saved wind rose to S3: {wind_rose_url}")
                    
                    # Save performance charts
                    chart_urls = []
                    for i, chart_bytes in enumerate(performance_charts):
                        chart_key = config.get_s3_key(project_id, f'performance_chart_{i}', 'png')
                        chart_url = viz_generator.save_image_to_s3(chart_bytes, chart_key)
                        if chart_url:
                            chart_urls.append(chart_url)
                    
                    if chart_urls:
                        visualizations['performance_charts'] = chart_urls
                        logger.info(f"Saved {len(chart_urls)} performance charts to S3")
                    
                    # Save wake analysis chart
                    wake_key = config.get_s3_key(project_id, 'wake_analysis', 'png')
                    wake_url = viz_generator.save_image_to_s3(wake_chart, wake_key)
                    if wake_url:
                        visualizations['wake_analysis'] = wake_url
                        logger.info(f"Saved wake analysis chart to S3: {wake_url}")
                    
                    # Save seasonal wind analysis chart
                    seasonal_key = config.get_s3_key(project_id, 'seasonal_wind_analysis', 'png')
                    seasonal_url = viz_generator.save_image_to_s3(seasonal_chart, seasonal_key)
                    if seasonal_url:
                        visualizations['seasonal_analysis'] = seasonal_url
                        logger.info(f"Saved seasonal analysis to S3: {seasonal_url}")
                    
                    # Save wind resource variability chart
                    variability_key = config.get_s3_key(project_id, 'wind_variability', 'png')
                    variability_url = viz_generator.save_image_to_s3(variability_chart, variability_key)
                    if variability_url:
                        visualizations['variability_analysis'] = variability_url
                        logger.info(f"Saved variability analysis to S3: {variability_url}")
                    
                    # Save comprehensive wake analysis map
                    wake_map_key = config.get_s3_key(project_id, 'wake_heat_map', 'html')
                    wake_map_url = viz_generator.save_html_to_s3(wake_analysis_map_html, wake_map_key)
                    if wake_map_url:
                        visualizations['wake_heat_map'] = wake_map_url
                        logger.info(f"Saved wake heat map to S3: {wake_map_url}")
                    
                    # Create comprehensive report package
                    project_data = {
                        'project_id': project_id,
                        'turbine_count': num_turbines,
                        'total_capacity_mw': total_capacity,
                        'annual_energy_gwh': net_aep_gwh,
                        'capacity_factor': capacity_factor * 100,
                        'location': f"Wind Farm Analysis"
                    }
                    
                    # Prepare visualization data for report
                    viz_data = {
                        'wind_rose': {'type': 'matplotlib_chart', 'image_bytes': wind_rose_bytes, 'title': 'Wind Rose Analysis'},
                        'wake_heat_map': {'type': 'folium_map', 'html_content': wake_analysis_map_html, 'title': 'Wake Analysis Heat Map'},
                        'seasonal_analysis': {'type': 'matplotlib_chart', 'image_bytes': seasonal_chart, 'title': 'Seasonal Wind Analysis'},
                        'variability_analysis': {'type': 'matplotlib_chart', 'image_bytes': variability_chart, 'title': 'Wind Resource Variability'}
                    }
                    
                    # Add performance charts to visualization data
                    for i, chart_bytes in enumerate(performance_charts):
                        viz_data[f'performance_chart_{i}'] = {
                            'type': 'matplotlib_chart', 
                            'image_bytes': chart_bytes, 
                            'title': f'Performance Analysis {i+1}'
                        }
                    
                    # Create report package
                    report_url = viz_generator.create_report_package(project_data, viz_data)
                    if report_url:
                        visualizations['complete_report'] = report_url
                        logger.info(f"Created complete report package: {report_url}")
                
                logger.info("Successfully generated simulation visualizations")
                
            except Exception as e:
                logger.error(f"Error generating visualizations: {e}")
                # Continue without visualizations
        
        # Prepare response data
        response_data = {
            'projectId': project_id,
            'performanceMetrics': {
                'annualEnergyProduction': net_aep_gwh,
                'capacityFactor': capacity_factor,
                'wakeLosses': wake_loss_percent,
                'grossAEP': gross_aep_gwh,
                'netAEP': net_aep_gwh
            },
            'turbineMetrics': {
                'count': num_turbines,
                'totalCapacity': total_capacity,
                'averageWindSpeed': wind_speed
            },
            'monthlyProduction': monthly_production,
            'chartImages': {},  # For backward compatibility
            'message': f'Simulation completed for {num_turbines} turbines'
        }
        
        # Add visualization data if available
        if visualizations:
            response_data['visualizations'] = visualizations
            # Also populate chartImages for backward compatibility
            if 'wake_analysis' in visualizations:
                response_data['chartImages']['wakeMap'] = visualizations['wake_analysis']
            if 'performance_charts' in visualizations and visualizations['performance_charts']:
                response_data['chartImages']['performanceChart'] = visualizations['performance_charts'][0]
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'success': True,
                'type': 'wake_simulation',
                'data': response_data
            })
        }
            
    except Exception as e:
        logger.error(f"Error in wake simulation Lambda: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'body': json.dumps({
                'success': False,
                'error': f'Lambda execution error: {str(e)}'
            })
        }
