#!/usr/bin/env python3
"""
Coordinate transformation tools for EDIcraft Agent.
Includes all coordinate transformation utilities.
"""

import logging
import math
from typing import Dict, List, Any, Optional, Tuple
from strands import tool


def utm_to_minecraft(utm_x: float, utm_y: float, utm_z: float = 0.0, 
                    origin_utm_x: float = 0.0, origin_utm_y: float = 0.0, origin_utm_z: float = 0.0,
                    scale_factor: float = 1.0) -> Tuple[float, float, float]:
    """
    Convert UTM coordinates to Minecraft coordinates.
    
    Args:
        utm_x: UTM X coordinate (easting) in meters
        utm_y: UTM Y coordinate (northing) in meters  
        utm_z: UTM Z coordinate (elevation) in meters (default: 0.0)
        origin_utm_x: UTM X coordinate of Minecraft origin (default: 0.0)
        origin_utm_y: UTM Y coordinate of Minecraft origin (default: 0.0)
        origin_utm_z: UTM Z coordinate of Minecraft origin (default: 0.0)
        scale_factor: Scale factor for coordinate conversion (default: 1.0)
        
    Returns:
        Tuple of (minecraft_x, minecraft_y, minecraft_z) coordinates
        
    Notes:
        - Minecraft X corresponds to UTM X (easting)
        - Minecraft Z corresponds to UTM Y (northing) 
        - Minecraft Y corresponds to UTM Z (elevation)
        - Minecraft coordinates are relative to the specified origin
        - Scale factor allows for coordinate scaling (e.g., 0.1 for 10:1 scale)
    """
    # Calculate relative coordinates from origin
    relative_x = utm_x - origin_utm_x
    relative_y = utm_y - origin_utm_y
    relative_z = utm_z - origin_utm_z
    
    # Apply scale factor
    minecraft_x = relative_x * scale_factor
    minecraft_z = relative_y * scale_factor  # Note: UTM Y becomes Minecraft Z
    minecraft_y = relative_z * scale_factor  # Note: UTM Z becomes Minecraft Y
    
    return minecraft_x, minecraft_y, minecraft_z


def minecraft_to_utm(minecraft_x: float, minecraft_y: float, minecraft_z: float,
                    origin_utm_x: float = 0.0, origin_utm_y: float = 0.0, origin_utm_z: float = 0.0,
                    scale_factor: float = 1.0) -> Tuple[float, float, float]:
    """
    Convert Minecraft coordinates to UTM coordinates.
    
    Args:
        minecraft_x: Minecraft X coordinate
        minecraft_y: Minecraft Y coordinate (elevation)
        minecraft_z: Minecraft Z coordinate
        origin_utm_x: UTM X coordinate of Minecraft origin (default: 0.0)
        origin_utm_y: UTM Y coordinate of Minecraft origin (default: 0.0)
        origin_utm_z: UTM Z coordinate of Minecraft origin (default: 0.0)
        scale_factor: Scale factor for coordinate conversion (default: 1.0)
        
    Returns:
        Tuple of (utm_x, utm_y, utm_z) coordinates
    """
    # Reverse scale factor
    scaled_x = minecraft_x / scale_factor
    scaled_y = minecraft_y / scale_factor
    scaled_z = minecraft_z / scale_factor
    
    # Convert back to UTM (note coordinate axis mapping)
    utm_x = scaled_x + origin_utm_x
    utm_y = scaled_z + origin_utm_y  # Note: Minecraft Z becomes UTM Y
    utm_z = scaled_y + origin_utm_z  # Note: Minecraft Y becomes UTM Z
    
    return utm_x, utm_y, utm_z


def calculate_optimal_origin_and_scale(utm_coordinates: list, 
                                     minecraft_world_size: int = 30000000) -> Dict[str, Any]:
    """
    Calculate optimal origin and scale factor for a set of UTM coordinates.
    
    Args:
        utm_coordinates: List of (utm_x, utm_y, utm_z) tuples
        minecraft_world_size: Maximum Minecraft world coordinate (default: 30,000,000)
        
    Returns:
        Dictionary with optimal origin coordinates and scale factor
    """
    if not utm_coordinates:
        return {
            "origin_utm_x": 0.0,
            "origin_utm_y": 0.0, 
            "origin_utm_z": 0.0,
            "scale_factor": 1.0,
            "message": "No coordinates provided"
        }
    
    # Extract X, Y, Z coordinates
    x_coords = [coord[0] for coord in utm_coordinates]
    y_coords = [coord[1] for coord in utm_coordinates]
    z_coords = [coord[2] if len(coord) > 2 else 0.0 for coord in utm_coordinates]
    
    # Calculate bounds
    min_x, max_x = min(x_coords), max(x_coords)
    min_y, max_y = min(y_coords), max(y_coords)
    min_z, max_z = min(z_coords), max(z_coords)
    
    # Calculate center as origin
    origin_x = (min_x + max_x) / 2
    origin_y = (min_y + max_y) / 2
    origin_z = (min_z + max_z) / 2
    
    # Calculate extents
    extent_x = max_x - min_x
    extent_y = max_y - min_y
    extent_z = max_z - min_z
    
    # Calculate scale factor to fit within Minecraft world
    max_extent = max(extent_x, extent_y)
    if max_extent > 0:
        # Leave some margin (use 80% of world size)
        scale_factor = (minecraft_world_size * 0.8) / max_extent
    else:
        scale_factor = 1.0
    
    return {
        "origin_utm_x": origin_x,
        "origin_utm_y": origin_y,
        "origin_utm_z": origin_z,
        "scale_factor": scale_factor,
        "utm_bounds": {
            "x_range": [min_x, max_x],
            "y_range": [min_y, max_y], 
            "z_range": [min_z, max_z]
        },
        "utm_extents": {
            "x_extent": extent_x,
            "y_extent": extent_y,
            "z_extent": extent_z
        },
        "minecraft_extents": {
            "x_extent": extent_x * scale_factor,
            "z_extent": extent_y * scale_factor,
            "y_extent": extent_z * scale_factor
        },
        "message": f"Optimal scale: {scale_factor:.6f} (1 Minecraft block = {1/scale_factor:.2f} meters)"
    }


def transform_geological_coordinates(coordinates: list, coordinate_type: str = "fault",
                                   origin_utm_x: float = 0.0, origin_utm_y: float = 0.0, origin_utm_z: float = 0.0,
                                   scale_factor: float = 1.0) -> Dict[str, Any]:
    """
    Transform a list of geological coordinates (fault, wellbore, horizon) to Minecraft coordinates.
    
    Args:
        coordinates: List of coordinate dictionaries with 'x', 'y', 'z' keys
        coordinate_type: Type of geological feature ("fault", "wellbore", "horizon")
        origin_utm_x: UTM X coordinate of Minecraft origin
        origin_utm_y: UTM Y coordinate of Minecraft origin
        origin_utm_z: UTM Z coordinate of Minecraft origin
        scale_factor: Scale factor for coordinate conversion
        
    Returns:
        Dictionary with transformed coordinates and metadata
    """
    if not coordinates:
        return {
            "status": "error",
            "message": "No coordinates provided"
        }
    
    transformed_coords = []
    
    for i, coord in enumerate(coordinates):
        try:
            utm_x = float(coord.get('x', 0))
            utm_y = float(coord.get('y', 0))
            utm_z = float(coord.get('z', 0))
            
            mc_x, mc_y, mc_z = utm_to_minecraft(
                utm_x, utm_y, utm_z,
                origin_utm_x, origin_utm_y, origin_utm_z,
                scale_factor
            )
            
            transformed_coord = {
                "station": coord.get('station', i + 1),
                "utm_coordinates": {"x": utm_x, "y": utm_y, "z": utm_z},
                "minecraft_coordinates": {"x": mc_x, "y": mc_y, "z": mc_z}
            }
            
            # Preserve any additional metadata
            for key, value in coord.items():
                if key not in ['x', 'y', 'z', 'station']:
                    transformed_coord[key] = value
            
            transformed_coords.append(transformed_coord)
            
        except (ValueError, TypeError) as e:
            continue  # Skip invalid coordinates
    
    return {
        "status": "success",
        "coordinate_type": coordinate_type,
        "total_points": len(transformed_coords),
        "origin": {"utm_x": origin_utm_x, "utm_y": origin_utm_y, "utm_z": origin_utm_z},
        "scale_factor": scale_factor,
        "scale_description": f"1 Minecraft block = {1/scale_factor:.2f} meters",
        "coordinates": transformed_coords,
        "message": f"Successfully transformed {len(transformed_coords)} {coordinate_type} coordinates"
    }


class CoordinateTools:
    """Coordinate transformation and mapping tools."""
    
    def __init__(self):
        """Initialize coordinate tools."""
        self.logger = logging.getLogger(__name__)

    @tool
    def transform_utm_to_minecraft(self, utm_x: float, utm_y: float, utm_z: float = 0.0,
                                 origin_utm_x: float = 0.0, origin_utm_y: float = 0.0, origin_utm_z: float = 0.0,
                                 scale_factor: float = 1.0) -> Dict[str, Any]:
        """Transform UTM coordinates to Minecraft coordinates.
        
        Args:
            utm_x: UTM X coordinate (easting) in meters
            utm_y: UTM Y coordinate (northing) in meters
            utm_z: UTM Z coordinate (elevation) in meters (default: 0.0)
            origin_utm_x: UTM X coordinate of Minecraft origin (default: 0.0)
            origin_utm_y: UTM Y coordinate of Minecraft origin (default: 0.0)
            origin_utm_z: UTM Z coordinate of Minecraft origin (default: 0.0)
            scale_factor: Scale factor for coordinate conversion (default: 1.0)
            
        Returns:
            Dictionary with transformed coordinates and transformation details
        """
        try:
            mc_x, mc_y, mc_z = utm_to_minecraft(
                utm_x, utm_y, utm_z,
                origin_utm_x, origin_utm_y, origin_utm_z,
                scale_factor
            )
            
            return {
                "status": "success",
                "utm_coordinates": {"x": utm_x, "y": utm_y, "z": utm_z},
                "minecraft_coordinates": {"x": mc_x, "y": mc_y, "z": mc_z},
                "transformation": {
                    "origin": {"utm_x": origin_utm_x, "utm_y": origin_utm_y, "utm_z": origin_utm_z},
                    "scale_factor": scale_factor,
                    "scale_description": f"1 Minecraft block = {1/scale_factor:.2f} meters"
                },
                "message": f"Transformed UTM({utm_x}, {utm_y}, {utm_z}) to Minecraft({mc_x:.1f}, {mc_y:.1f}, {mc_z:.1f})"
            }
        except Exception as e:
            return {
                "status": "error",
                "message": f"Coordinate transformation failed: {str(e)}"
            }

    @tool
    def calculate_minecraft_transform(self, utm_coordinates: List[List[float]], 
                                    minecraft_world_size: int = 30000000) -> Dict[str, Any]:
        """Calculate optimal origin and scale factor for transforming UTM coordinates to Minecraft.
        
        Args:
            utm_coordinates: List of UTM coordinate lists [[x1,y1,z1], [x2,y2,z2], ...]
            minecraft_world_size: Maximum Minecraft world coordinate (default: 30,000,000)
            
        Returns:
            Dictionary with optimal transformation parameters
        """
        try:
            # Convert list of lists to list of tuples
            coord_tuples = []
            for coord in utm_coordinates:
                if len(coord) >= 2:
                    x, y = coord[0], coord[1]
                    z = coord[2] if len(coord) > 2 else 0.0
                    coord_tuples.append((x, y, z))
            
            if not coord_tuples:
                return {
                    "status": "error",
                    "message": "No valid coordinates provided"
                }
            
            result = calculate_optimal_origin_and_scale(coord_tuples, minecraft_world_size)
            result["status"] = "success"
            
            return result
            
        except Exception as e:
            return {
                "status": "error",
                "message": f"Transform calculation failed: {str(e)}"
            }

    @tool
    def transform_geological_data(self, coordinates: List[Dict[str, Any]], coordinate_type: str = "geological",
                                origin_utm_x: float = 0.0, origin_utm_y: float = 0.0, origin_utm_z: float = 0.0,
                                scale_factor: float = 1.0) -> Dict[str, Any]:
        """Transform geological coordinate data (faults, wellbores, horizons) to Minecraft coordinates.
        
        Args:
            coordinates: List of coordinate dictionaries with 'x', 'y', 'z' keys
            coordinate_type: Type of geological feature ("fault", "wellbore", "horizon", "geological")
            origin_utm_x: UTM X coordinate of Minecraft origin (default: 0.0)
            origin_utm_y: UTM Y coordinate of Minecraft origin (default: 0.0)
            origin_utm_z: UTM Z coordinate of Minecraft origin (default: 0.0)
            scale_factor: Scale factor for coordinate conversion (default: 1.0)
            
        Returns:
            Dictionary with transformed geological coordinates
        """
        try:
            result = transform_geological_coordinates(
                coordinates, coordinate_type,
                origin_utm_x, origin_utm_y, origin_utm_z,
                scale_factor
            )
            
            return result
            
        except Exception as e:
            return {
                "status": "error",
                "message": f"Geological data transformation failed: {str(e)}"
            }

    def get_tools(self) -> List:
        """Get list of coordinate tools for agent integration."""
        return [
            self.transform_utm_to_minecraft,
            self.calculate_minecraft_transform,
            self.transform_geological_data
        ]