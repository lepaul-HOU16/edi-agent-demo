def calculate_surface_scaling(coordinates: list) -> dict:
    """Calculate scaling parameters for surface data to fit in 100x100 blocks, depth 10-20."""
    if not coordinates:
        return {}
    
    x_coords = [c[0] for c in coordinates]
    y_coords = [c[1] for c in coordinates]
    z_coords = [c[2] for c in coordinates]
    
    x_min, x_max = min(x_coords), max(x_coords)
    y_min, y_max = min(y_coords), max(y_coords)
    z_min, z_max = min(z_coords), max(z_coords)
    
    x_span = x_max - x_min
    y_span = y_max - y_min
    z_span = z_max - z_min
    
    # Scale factor based on longest horizontal dimension
    max_span = max(x_span, y_span)
    scale_factor = 100.0 / max_span if max_span > 0 else 1.0
    
    return {
        'x_min': x_min, 'x_max': x_max, 'y_min': y_min, 'y_max': y_max,
        'z_min': z_min, 'z_max': z_max, 'scale_factor': scale_factor
    }

def calculate_trajectory_scaling(coordinates: list) -> dict:
    """Calculate scaling for trajectory to fit in 20x20 blocks, start at (20,100,20), depth to 50."""
    if not coordinates:
        return {}
    
    x_coords = [c[0] for c in coordinates]
    y_coords = [c[1] for c in coordinates]
    z_coords = [c[2] for c in coordinates]
    
    x_min, x_max = min(x_coords), max(x_coords)
    y_min, y_max = min(y_coords), max(y_coords)
    z_min, z_max = min(z_coords), max(z_coords)
    
    x_span = x_max - x_min
    y_span = y_max - y_min
    
    # Scale to fit in 20x20
    max_span = max(x_span, y_span)
    scale_factor = 20.0 / max_span if max_span > 0 else 1.0
    
    return {
        'x_min': x_min, 'x_max': x_max, 'y_min': y_min, 'y_max': y_max,
        'z_min': z_min, 'z_max': z_max, 'scale_factor': scale_factor
    }

def transform_surface_to_minecraft(coordinates: list) -> list:
    """Transform surface coordinates to Minecraft. Real (x,y,z) -> MC (x,y,z) where real z->MC y."""
    scaling = calculate_surface_scaling(coordinates)
    if not scaling:
        return []
    
    result = []
    for x, y, z in coordinates:
        mc_x = int((x - scaling['x_min']) * scaling['scale_factor'])
        mc_z = int((y - scaling['y_min']) * scaling['scale_factor'])  # Real Y -> MC Z
        mc_y = int(30 + (z - scaling['z_min']) / (scaling['z_max'] - scaling['z_min']) * 20)  # Real Z -> MC Y
        result.append((mc_x, mc_y, mc_z))
    
    return result

def transform_trajectory_to_minecraft(coordinates: list) -> list:
    """Transform trajectory coordinates to Minecraft. Real (x,y,z) -> MC (x,y,z) where real z->MC y."""
    scaling = calculate_trajectory_scaling(coordinates)
    if not scaling:
        return []
    
    result = []
    for x, y, z in coordinates:
        mc_x = int(20 + (x - scaling['x_min']) * scaling['scale_factor'])
        mc_z = int(20 + (y - scaling['y_min']) * scaling['scale_factor'])  # Real Y -> MC Z
        # Map z range to Y=50-100: z_min (shallowest/surface) -> Y=100, z_max (deepest) -> Y=50
        mc_y = int(100 - (z - scaling['z_min']) / (scaling['z_max'] - scaling['z_min']) * 50)
        result.append((mc_x, mc_y, mc_z))
    
    return result

def transform_utm_to_minecraft(x: float, y: float, z: float) -> tuple:
    """Legacy function - use transform_surface_to_minecraft or transform_trajectory_to_minecraft instead."""
    return transform_surface_to_minecraft([(x, y, z)])[0]

def build_wellbore_path(coordinates: list) -> str:
    """Build a wellbore path in Minecraft using coordinates."""
    if not coordinates:
        return "No coordinates provided"
    
    commands = []
    for i, (x, y, z) in enumerate(coordinates):
        mc_x, mc_y, mc_z = transform_utm_to_minecraft(x, y, z)
        commands.append(f"setblock {mc_x} {mc_y} {mc_z} obsidian")
    
    return f"Generated {len(commands)} setblock commands for wellbore path"
