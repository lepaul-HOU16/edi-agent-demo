# from strands import tool  # Not needed for standalone Lambda
import json
import os
import logging
import uuid
import math
from typing import Dict, List, Any
import geopandas as gpd
from shapely.geometry import Point
from .shared_tools import list_project_files, load_file_from_storage

logger = logging.getLogger(__name__)

# @tool  # Removed for standalone Lambda
def generate_project_id() -> dict:
    """
    Generate a unique project ID for a new wind farm project.
    
    This tool creates a unique identifier that should be used consistently throughout
    a single project's analysis workflow. Generate a new ID only when starting a
    completely new project, location, or wind farm analysis.
    
    Returns:
        dict: Contains the generated unique project ID
            - project_id (str): unique identifier for the project
            - message (str): Confirmation message
    """
    logger.info("Generating new project ID")
    
    try:
        project_id = str(uuid.uuid4())[:8]
        logger.info(f"Generated project ID: {project_id}")
        return {
            "project_id": project_id,
            "message": f"Generated new project ID: {project_id}"
        }
    except Exception as e:
        logger.error(f"Failed to generate project ID: {e}")
        return {
            "error": f"Failed to generate project ID: {str(e)}"
        }

# @tool  # Removed for standalone Lambda
def validate_layout_quality(project_id: str, min_spacing_m: float = 1170) -> Dict[str, Any]:
    """
    Validate turbine layout for boundary conflicts and minimum spacing violations.
    Loads layout and boundaries from project files and validates placement quality.
    
    Args:
        project_id (str): Project identifier to load layout and boundary data
        min_spacing_m (float): Minimum spacing between turbines in meters (default: 1170m for 9D spacing)
        
    Returns:
        Dict with validation results, boundary/spacing violations, and all turbine distances
    """
    logger.info(f"Validating layout quality for project: {project_id}, min_spacing_m={min_spacing_m}")
    
    try:
        # Load layout data
        try:
            file_path = load_file_from_storage(project_id, "turbine_layout.geojson", "layout_agent")
            with open(file_path, 'r') as file:
                layout = json.load(file)
        except FileNotFoundError:
            return {
                "status": "error",
                "validation_passed": False,
                "message": f"No turbine layout found for project {project_id}. Create a layout first.",
                "boundary_violations": [],
                "spacing_violations": [],
                "turbine_distances": []
            }
        
        features = layout.get('features', [])
        if not features:
            return {
                "status": "error",
                "validation_passed": False,
                "message": "No turbines found in layout",
                "boundary_violations": [],
                "spacing_violations": [],
                "turbine_distances": []
            }
        
        # Load boundaries (optional)
        boundaries = None
        try:
            file_path = load_file_from_storage(project_id, "boundaries.geojson", "terrain_agent")
            with open(file_path, 'r') as file:
                boundaries = json.load(file)
        except FileNotFoundError:
            logger.info(f"No boundaries file found for project {project_id} - skipping boundary validation")
        
        boundaries_gdf = None
        if boundaries and boundaries.get('features'):
            boundaries_gdf = gpd.GeoDataFrame.from_features(boundaries['features'])
            boundaries_gdf.crs = 'EPSG:4326'
        
        boundary_violations = []
        spacing_violations = []
        turbine_positions = []
        
        # Extract positions and check boundary violations
        for feature in features:
            coords = feature['geometry']['coordinates']
            lon, lat = coords[0], coords[1]
            turbine_id = feature['properties'].get('turbine_id')
            turbine_positions.append((turbine_id, lat, lon))
            
            # Check if turbine is in unbuildable area
            if boundaries_gdf is not None:
                point = Point(lon, lat)
                if any(point.intersects(geom) for geom in boundaries_gdf.geometry):
                    boundary_violations.append({
                        "turbine_id": turbine_id,
                        "coordinates": [lat, lon],
                        "issue": "Located in unbuildable area (water, roads, buildings, or protected zone)"
                    })
        
        # Check spacing violations and collect all distances
        turbine_distances = []
        for i, (id1, lat1, lon1) in enumerate(turbine_positions):
            for j, (id2, lat2, lon2) in enumerate(turbine_positions[i+1:], i+1):
                # Calculate distance
                meters_per_lat = 111320
                meters_per_lon = 111320 * math.cos(math.radians((lat1 + lat2) / 2))
                dx = (lon2 - lon1) * meters_per_lon
                dy = (lat2 - lat1) * meters_per_lat
                distance = math.sqrt(dx**2 + dy**2)
                
                turbine_distances.append({
                    "turbine1": id1,
                    "turbine2": id2,
                    "distance_m": round(distance, 1)
                })
                
                if distance < min_spacing_m:
                    spacing_violations.append({
                        "turbine1": id1,
                        "turbine2": id2,
                        "actual_distance_m": round(distance, 1),
                        "required_distance_m": min_spacing_m,
                        "shortfall_m": round(min_spacing_m - distance, 1)
                    })
        
        total_violations = len(boundary_violations) + len(spacing_violations)
        validation_passed = total_violations == 0
        
        return {
            "status": "success",
            "validation_passed": validation_passed,
            "total_turbines": len(features),
            "total_violations": total_violations,
            "boundary_violations": boundary_violations,
            "spacing_violations": spacing_violations,
            "turbine_distances": turbine_distances,
            "min_spacing_required_m": min_spacing_m,
            "spacing_validation_applied": True
        }
        
    except Exception as e:
        logger.error(f"Error validating layout: {e}")
        return {
            "status": "error",
            "validation_passed": False,
            "message": f"Validation failed: {str(e)}",
            "boundary_violations": [],
            "spacing_violations": [],
            "turbine_distances": []
        }

# @tool  # Removed for standalone Lambda
def get_project_status(project_id: str) -> Dict[str, Any]:
    """
    Get the current status of a wind farm development project.
    
    Args:
        project_id (str): unique project identifier
        
    Returns:
        Dict containing project status and completion progress
    """
    logger.info(f"Getting project status for: {project_id}")
    
    try:
        logger.info(f"Listing project files for status check")
        files = list_project_files(project_id)
        if not files['success']:
            logger.warning(f"Failed to list project files: {files.get('error', 'Unknown error')}")
            return files
        
        status = {
            'terrain_analysis': False,
            'layout_design': False,
            'simulation': False,
            'reporting': False,
            'completion_percentage': 0
        }
        
        # Check each stage based on file patterns
        all_files = files['files']['all_files']
        logger.info(f"Found {len(all_files)} total files for project {project_id}")
        
        # Check for terrain analysis files
        if any('terrain_agent' in f for f in all_files):
            status['terrain_analysis'] = True
        
        # Check for layout design files
        if any('layout_agent' in f for f in all_files):
            status['layout_design'] = True
        
        # Check for simulation files
        if any('simulation_agent' in f for f in all_files):
            status['simulation'] = True
        
        # Check for report files
        if any('report_agent' in f for f in all_files):
            status['reporting'] = True
        
        # Calculate completion percentage
        completed_stages = sum([
            status['terrain_analysis'],
            status['layout_design'], 
            status['simulation'],
            status['reporting']
        ])
        status['completion_percentage'] = (completed_stages / 4) * 100
        
        # Determine next step
        if not status['terrain_analysis']:
            next_step = "Run terrain analysis to identify unbuildable areas"
        elif not status['layout_design']:
            next_step = "Create turbine layout design"
        elif not status['simulation']:
            next_step = "Run wake simulation and energy calculations"
        elif not status['reporting']:
            next_step = "Generate executive report"
        else:
            next_step = "Project complete - all stages finished"
        
        return {
            'success': True,
            'project_id': project_id,
            'status': status,
            'next_step': next_step,
            'total_files': len(all_files),
            'message': f"Project {status['completion_percentage']:.0f}% complete"
        }
        
    except Exception as e:
        logger.error(f"Error getting project status: {e}")
        return {
            'success': False,
            'error': f"Failed to get project status: {str(e)}"
        }

# @tool  # Removed for standalone Lambda
def analyze_simulation_results(project_id: str) -> Dict[str, Any]:
    """
    Analyze simulation results to determine if layout optimization is needed.
    
    Args:
        project_id (str): unique project identifier
        
    Returns:
        Dict containing simulation analysis and optimization recommendations
    """
    logger.info(f"Analyzing simulation results for project: {project_id}")
    
    try:
        # This would typically load simulation results from cache or files
        # For now, return a template structure
        
        analysis = {
            'capacity_factor': None,
            'wake_losses': None,
            'aep_gwh': None,
            'num_turbines': None,
            'mean_wind_speed': None,
            'performance_rating': 'unknown',
            'optimization_needed': False,
            'recommendations': [],
            'has_simulation_data': False
        }
        
        # Try to extract metrics from simulation cache or files
        try:
            from .simulation_tools import SIMULATION_CACHE
            
            # Find simulation for this project (improved lookup)
            for sim_id, sim_data in SIMULATION_CACHE.items():
                if project_id in str(sim_data) or project_id in sim_id:  # Better matching
                    if 'capacity_factor' in sim_data:
                        analysis['capacity_factor'] = sim_data['capacity_factor']
                    if 'wake_loss_percent' in sim_data:
                        analysis['wake_losses'] = sim_data['wake_loss_percent']
                    if 'total_aep_gwh' in sim_data:
                        analysis['aep_gwh'] = sim_data['total_aep_gwh']
                    if 'number_of_turbines' in sim_data:
                        analysis['num_turbines'] = sim_data['number_of_turbines']
                    if 'mean_wind_speed' in sim_data:
                        analysis['mean_wind_speed'] = sim_data['mean_wind_speed']
                    analysis['has_simulation_data'] = True
                    break
        except Exception as e:
            logger.warning(f"Could not access simulation cache: {e}")
        
        # Analyze performance with detailed recommendations
        if analysis['capacity_factor'] is not None:
            cf = analysis['capacity_factor']
            if cf > 40:
                analysis['performance_rating'] = 'excellent'
                analysis['recommendations'].append(f"Excellent capacity factor ({cf:.1f}%) - layout is well optimized")
            elif cf > 35:
                analysis['performance_rating'] = 'good'
                analysis['recommendations'].append(f"Good capacity factor ({cf:.1f}%) - minor optimizations possible")
            elif cf > 30:
                analysis['performance_rating'] = 'acceptable'
                analysis['recommendations'].append(f"Acceptable capacity factor ({cf:.1f}%) - consider layout improvements")
                analysis['optimization_needed'] = True
            else:
                analysis['performance_rating'] = 'poor'
                analysis['optimization_needed'] = True
                analysis['recommendations'].append(f"Poor capacity factor ({cf:.1f}%) - layout optimization strongly recommended")
                analysis['recommendations'].append("Consider: alternative sites, different layout algorithm, or increased spacing")
        
        if analysis['wake_losses'] is not None:
            wl = analysis['wake_losses']
            if wl > 15:
                analysis['optimization_needed'] = True
                analysis['recommendations'].append(f"High wake losses ({wl:.1f}%) - increase turbine spacing or try offset grid layout")
            elif wl > 10:
                analysis['recommendations'].append(f"Moderate wake losses ({wl:.1f}%) - spacing optimization could improve performance")
            else:
                analysis['recommendations'].append(f"Low wake losses ({wl:.1f}%) - good turbine spacing")
        
        # Add summary message
        if not analysis['has_simulation_data']:
            analysis['recommendations'].append("No simulation data found - run simulation first")
        
        return {
            'success': True,
            'project_id': project_id,
            'analysis': analysis,
            'message': f"Simulation analysis complete - Performance: {analysis['performance_rating']}",
            'optimization_needed': analysis['optimization_needed']
        }
        
    except Exception as e:
        logger.error(f"Error analyzing simulation results: {e}")
        return {
            'success': False,
            'error': f"Failed to analyze simulation: {str(e)}"
        }
    
# @tool  # Removed for standalone Lambda
def load_layout_image(
    project_id: str
) -> dict:
    """
    Load and display the most recent or specific layout map image for visual validation.
    
    Args:
        project_id: Project identifier for loading the layout image
        
    Returns:
        Dict containing image data for agent visual inspection
    """
    logger.info(f"load_layout_image: project_id={project_id}")
    try:
        filename = f"layout_final.png"
        
        # Load image from storage
        try:
            file_path = load_file_from_storage(project_id, filename, "layout_agent")
            
            # Read image as bytes
            with open(file_path, 'rb') as f:
                image_bytes = f.read()
            
            return {
                "status": "success",
                "message": f"Loaded layout map {filename} for visual validation",
                "content": [{
                    "image": {
                        "format": "png",
                        "source": {
                            "bytes": image_bytes
                        }
                    }
                }]
            }
            
        except FileNotFoundError:
            return {
                "status": "error",
                "message": f"Layout map {filename} not found. Create a layout first."
            }
        
    except Exception as e:
        return {"status": "error", "message": str(e)}