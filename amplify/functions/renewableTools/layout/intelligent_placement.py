"""
Intelligent Turbine Placement Algorithm
Uses OSM data to avoid buildings, roads, and water bodies
Pure Python implementation - no numpy/shapely required
"""
import math
import random
from typing import List, Tuple, Dict, Any

def intelligent_turbine_placement(
    center_lat: float,
    center_lon: float,
    radius_km: float,
    exclusion_zones: Dict[str, List[Dict]],
    spacing_m: float = 500,
    num_turbines_target: int = 25
) -> List[Tuple[float, float]]:
    """
    Intelligently place turbines avoiding exclusion zones from OSM data
    Pure Python implementation without external dependencies
    
    Args:
        center_lat: Center latitude
        center_lon: Center longitude
        radius_km: Radius in kilometers
        exclusion_zones: Dict with 'buildings', 'roads', 'waterBodies' lists
        spacing_m: Minimum spacing between turbines in meters
        num_turbines_target: Target number of turbines
    
    Returns:
        List of (lat, lon) tuples for turbine positions
    """
    print("=" * 60)
    print("🎯 INTELLIGENT TURBINE PLACEMENT (Pure Python)")
    print(f"   Target: {num_turbines_target} turbines")
    print(f"   Spacing: {spacing_m}m between turbines")
    print(f"   Radius: {radius_km}km")
    print("=" * 60)
    
    # Check if OSM features are actually provided
    buildings = exclusion_zones.get('buildings', [])
    roads = exclusion_zones.get('roads', [])
    water_bodies = exclusion_zones.get('waterBodies', [])
    total_features = len(buildings) + len(roads) + len(water_bodies)
    
    print(f"   Exclusion zones: {len(buildings)} buildings, {len(roads)} roads, {len(water_bodies)} water bodies")
    
    if total_features == 0:
        print("⚠️ No OSM features - using basic grid")
        print("=" * 60)
        return basic_grid_placement(center_lat, center_lon, radius_km, spacing_m, num_turbines_target)
    
    # Pure Python implementation - no Shapely required
    # Generate candidate positions using hexagonal grid
    candidates = []
    lat_per_m = 1 / 111000
    lon_per_m = 1 / (111000 * math.cos(math.radians(center_lat)))
    
    # Create hexagonal grid of candidates
    grid_spacing_m = spacing_m * 0.8  # Slightly tighter for more candidates
    grid_spacing_lat = grid_spacing_m * lat_per_m
    grid_spacing_lon = grid_spacing_m * lon_per_m
    
    radius_deg = radius_km / 111.0  # Approximate conversion
    grid_size = int(radius_km * 1000 / grid_spacing_m) + 1
    
    print(f"   Generating {grid_size}x{grid_size} candidate grid...")
    
    for i in range(-grid_size, grid_size + 1):
        for j in range(-grid_size, grid_size + 1):
            # Hexagonal offset
            offset = (grid_spacing_lon / 2) if i % 2 == 1 else 0
            lat = center_lat + i * grid_spacing_lat * 0.866  # sqrt(3)/2 for hex
            lon = center_lon + j * grid_spacing_lon + offset
            
            # Check if within radius
            dist = math.sqrt((lat - center_lat)**2 + (lon - center_lon)**2)
            if dist <= radius_deg:
                candidates.append((lat, lon))
    
    print(f"   Generated {len(candidates)} candidate positions")
    
    # Filter candidates that are too close to exclusion zones
    valid_candidates = []
    safety_margin_deg = 0.001  # ~100m safety margin
    
    for lat, lon in candidates:
        is_valid = True
        
        # Check distance to buildings
        for building in buildings:
            if not is_valid:
                break
            geom = building.get('geometry', {})
            if geom.get('type') == 'Polygon':
                coords = geom.get('coordinates', [[]])[0]
                if _point_near_polygon(lat, lon, coords, safety_margin_deg):
                    is_valid = False
                    break
        
        # Check distance to roads
        if is_valid:
            for road in roads:
                if not is_valid:
                    break
                geom = road.get('geometry', {})
                if geom.get('type') == 'LineString':
                    coords = geom.get('coordinates', [])
                    if _point_near_linestring(lat, lon, coords, safety_margin_deg * 1.5):
                        is_valid = False
                        break
                elif geom.get('type') == 'Polygon':
                    coords = geom.get('coordinates', [[]])[0]
                    if _point_near_polygon(lat, lon, coords, safety_margin_deg):
                        is_valid = False
                        break
        
        # Check distance to water bodies
        if is_valid:
            for water in water_bodies:
                if not is_valid:
                    break
                geom = water.get('geometry', {})
                if geom.get('type') == 'Polygon':
                    coords = geom.get('coordinates', [[]])[0]
                    if _point_near_polygon(lat, lon, coords, safety_margin_deg):
                        is_valid = False
                        break
        
        if is_valid:
            valid_candidates.append((lat, lon))
    
    print(f"   {len(valid_candidates)} candidates avoid exclusion zones")
    
    # If we don't have enough valid candidates, fall back to grid
    if len(valid_candidates) < num_turbines_target * 0.5:
        print(f"⚠️ Insufficient valid positions ({len(valid_candidates)} < {num_turbines_target * 0.5})")
        print("   Falling back to basic grid placement")
        print("=" * 60)
        return basic_grid_placement(center_lat, center_lon, radius_km, spacing_m, num_turbines_target)
    
    # Select best positions with minimum spacing
    selected_positions = []
    min_spacing_deg = spacing_m * lat_per_m
    
    # Sort candidates by distance from center (prefer central positions)
    valid_candidates.sort(key=lambda pos: (pos[0] - center_lat)**2 + (pos[1] - center_lon)**2)
    
    for candidate in valid_candidates:
        if len(selected_positions) >= num_turbines_target:
            break
        
        # Check spacing with existing turbines
        too_close = False
        for existing in selected_positions:
            dist = math.sqrt((candidate[0] - existing[0])**2 + (candidate[1] - existing[1])**2)
            if dist < min_spacing_deg:
                too_close = True
                break
        
        if not too_close:
            selected_positions.append(candidate)
    
    print(f"✅ Placed {len(selected_positions)} turbines intelligently")
    print(f"   Avoided {total_features} terrain constraints")
    print("=" * 60)
    
    return selected_positions


def _point_near_polygon(lat: float, lon: float, coords: List, margin: float) -> bool:
    """Check if point is within margin of polygon (simplified bounding box check)"""
    if not coords or len(coords) < 3:
        return False
    
    lats = [c[1] for c in coords if len(c) >= 2]
    lons = [c[0] for c in coords if len(c) >= 2]
    
    if not lats or not lons:
        return False
    
    min_lat, max_lat = min(lats), max(lats)
    min_lon, max_lon = min(lons), max(lons)
    
    # Check if point is within bounding box + margin
    return (min_lat - margin <= lat <= max_lat + margin and
            min_lon - margin <= lon <= max_lon + margin)


def _point_near_linestring(lat: float, lon: float, coords: List, margin: float) -> bool:
    """Check if point is within margin of linestring"""
    if not coords or len(coords) < 2:
        return False
    
    # Check distance to each line segment
    for i in range(len(coords) - 1):
        if len(coords[i]) < 2 or len(coords[i+1]) < 2:
            continue
        
        lat1, lon1 = coords[i][1], coords[i][0]
        lat2, lon2 = coords[i+1][1], coords[i+1][0]
        
        # Simple bounding box check for line segment
        min_lat = min(lat1, lat2) - margin
        max_lat = max(lat1, lat2) + margin
        min_lon = min(lon1, lon2) - margin
        max_lon = max(lon1, lon2) + margin
        
        if min_lat <= lat <= max_lat and min_lon <= lon <= max_lon:
            return True
    
    return False


def basic_grid_placement(
    center_lat: float,
    center_lon: float,
    radius_km: float,
    spacing_m: float,
    num_turbines_target: int
) -> List[Tuple[float, float]]:
    """
    Fallback: Basic grid placement without exclusion zones
    Pure Python implementation
    
    This is used when:
    - No OSM features are available
    - Insufficient valid positions after constraint checking
    """
    print(f"📐 BASIC GRID PLACEMENT ALGORITHM")
    print(f"   Target: {num_turbines_target} turbines")
    print(f"   Spacing: {spacing_m}m between turbines")
    print(f"   Note: No terrain constraints applied")
    
    lat_per_m = 1 / 111000
    lon_per_m = 1 / (111000 * math.cos(math.radians(center_lat)))
    
    spacing_lat = spacing_m * lat_per_m
    spacing_lon = spacing_m * lon_per_m
    
    # Calculate grid dimensions
    grid_size = int(math.sqrt(num_turbines_target))
    
    positions = []
    for i in range(grid_size):
        for j in range(grid_size):
            lat = center_lat + (i - grid_size/2) * spacing_lat
            lon = center_lon + (j - grid_size/2) * spacing_lon
            positions.append((lat, lon))
            
            if len(positions) >= num_turbines_target:
                break
        if len(positions) >= num_turbines_target:
            break
    
    return positions
