import json
import math
from strands import tool

@tool
def build_horizon_surface(corner_points: str, block_type: str = "sandstone") -> str:
    """
    Build complete horizon surface from 4 corner points using bilinear interpolation.
    
    Args:
        corner_points: JSON string with 4 corner coordinates: [{"x": 0, "y": 30, "z": 0}, ...]
        block_type: Minecraft block type. Available options: stone, cobblestone, granite, sandstone, packed_mud
    
    Returns:
        RCON commands to build the complete surface layer by layer
    """
    try:
        points = json.loads(corner_points)
        if len(points) != 4:
            return "Error: Exactly 4 corner points required"
        
        # Extract coordinates
        coords = [(p["x"], p["y"], p["z"]) for p in points]
        
        # Find bounding box
        min_x = min(c[0] for c in coords)
        max_x = max(c[0] for c in coords)
        min_z = min(c[2] for c in coords)
        max_z = max(c[2] for c in coords)
        
        # Generate surface grid using bilinear interpolation
        surface_points = []
        
        for x in range(min_x, max_x + 1):
            for z in range(min_z, max_z + 1):
                # Bilinear interpolation to find Y at this X,Z
                y = interpolate_surface_height(x, z, coords)
                surface_points.append((x, round(y), z))
        
        # Group points by Y level for fill commands
        layers = {}
        for x, y, z in surface_points:
            if y not in layers:
                layers[y] = []
            layers[y].append((x, z))
        
        # Generate RCON commands using fill for solid surfaces
        commands = []
        commands.append(f"# Building horizon surface with {len(surface_points)} blocks using {block_type}")
        
        # Clear area first
        min_y = min(layers.keys())
        max_y = max(layers.keys())
        commands.append(f"fill {min_x} {min_y} {min_z} {max_x} {max_y} {max_z} air")
        
        # Build solid surfaces layer by layer using fill commands
        for y in sorted(layers.keys()):
            layer_points = layers[y]
            
            # Create rectangular fills for each Y level
            x_coords = [p[0] for p in layer_points]
            z_coords = [p[1] for p in layer_points]
            
            if len(layer_points) > 1:
                # Use fill command for the entire layer
                layer_min_x, layer_max_x = min(x_coords), max(x_coords)
                layer_min_z, layer_max_z = min(z_coords), max(z_coords)
                commands.append(f"fill {layer_min_x} {y} {layer_min_z} {layer_max_x} {y} {layer_max_z} {block_type}")
            else:
                # Single block
                x, z = layer_points[0]
                commands.append(f"setblock {x} {y} {z} {block_type}")
        
        # Add completion message
        commands.append("say Horizon surface completed!")
        
        return "\n".join(commands)
        
    except Exception as e:
        return f"Error building surface: {str(e)}"

def interpolate_surface_height(x, z, corner_coords):
    """
    Bilinear interpolation to find Y coordinate at given X,Z from 4 corner points.
    """
    # Sort corners to identify which is which
    corners = sorted(corner_coords, key=lambda c: (c[0], c[2]))
    
    # Identify corners: bottom-left, bottom-right, top-left, top-right
    x_min = min(c[0] for c in corners)
    x_max = max(c[0] for c in corners)
    z_min = min(c[2] for c in corners)
    z_max = max(c[2] for c in corners)
    
    # Find the 4 corners
    bottom_left = next(c for c in corners if c[0] == x_min and c[2] == z_min)
    bottom_right = next(c for c in corners if c[0] == x_max and c[2] == z_min)
    top_left = next(c for c in corners if c[0] == x_min and c[2] == z_max)
    top_right = next(c for c in corners if c[0] == x_max and c[2] == z_max)
    
    # Bilinear interpolation
    if x_max == x_min or z_max == z_min:
        # Degenerate case - return average
        return sum(c[1] for c in corners) / 4
    
    # Normalize coordinates to [0,1]
    u = (x - x_min) / (x_max - x_min)
    v = (z - z_min) / (z_max - z_min)
    
    # Bilinear interpolation formula
    y = (bottom_left[1] * (1 - u) * (1 - v) +
         bottom_right[1] * u * (1 - v) +
         top_left[1] * (1 - u) * v +
         top_right[1] * u * v)
    
    return y
