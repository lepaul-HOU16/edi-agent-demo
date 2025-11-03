#!/usr/bin/env python3
"""
Minecraft RCON tools for EDIcraft Agent.
"""

import logging
from typing import Dict, List, Any, Optional
from strands import tool
from rcon.source import Client
from config import EDIcraftConfig


class MinecraftTools:
    """Minecraft server interaction tools via RCON."""
    
    def __init__(self, config: EDIcraftConfig):
        """Initialize Minecraft tools with configuration.
        
        Args:
            config: EDIcraft configuration instance
        """
        self.config = config
        self.logger = logging.getLogger(__name__)
        
        # Extract Minecraft configuration
        minecraft_config = config.get_minecraft_config()
        self.host = minecraft_config["host"]
        self.port = minecraft_config["rcon_port"]
        self.password = minecraft_config["rcon_password"]

    @tool
    def rcon_command(self, command: str) -> str:
        """Execute RCON commands on Minecraft server."""
        try:
            with Client(self.host, self.port, passwd=self.password) as client:
                response = client.run(command)
                self.logger.debug(f"RCON command '{command}' executed successfully")
                return f"Command executed successfully. Response: '{response}'"
        except Exception as e:
            self.logger.error(f"RCON command '{command}' failed: {str(e)}")
            return f"RCON Error: {str(e)}"

    @tool
    def list_players(self) -> str:
        """List all currently online players."""
        return self.rcon_command("list")

    @tool
    def get_player_position(self, player_name: str) -> str:
        """Get the current position of a specific player."""
        return self.rcon_command(f"data get entity {player_name} Pos")

    @tool
    def build_wellbore_trajectory(
        self, start_x: float, start_y: float, start_z: float,
        end_x: float, end_y: float, end_z: float,
        inflection_points: str = "",
        block_type: str = "obsidian",
        segments_per_section: int = 20
    ) -> str:
        """Build a wellbore trajectory from start to end with optional inflection points."""
        
        # Parse inflection points
        points = []
        if inflection_points:
            for point_str in inflection_points.split(';'):
                if point_str.strip():
                    coords = [float(x) for x in point_str.split(',')]
                    points.append(coords)
        
        # Build trajectory using fill commands
        commands = []
        
        # If no inflection points, direct line
        if not points:
            # Simple line from start to end
            commands.append(f"fill {int(start_x)} {int(start_y)} {int(start_z)} {int(end_x)} {int(end_y)} {int(end_z)} {block_type}")
        else:
            # Build segments between points
            current = [start_x, start_y, start_z]
            
            for point in points:
                commands.append(f"fill {int(current[0])} {int(current[1])} {int(current[2])} {int(point[0])} {int(point[1])} {int(point[2])} {block_type}")
                current = point
            
            # Final segment to end
            commands.append(f"fill {int(current[0])} {int(current[1])} {int(current[2])} {int(end_x)} {int(end_y)} {int(end_z)} {block_type}")
        
        # Execute commands
        results = []
        for cmd in commands:
            result = self.rcon_command(cmd)
            results.append(result)
        
        self.logger.info(f"Built wellbore trajectory with {len(commands)} segments from ({start_x},{start_y},{start_z}) to ({end_x},{end_y},{end_z})")
        return f"Wellbore trajectory built with {len(commands)} segments. Results: {'; '.join(results)}"

    @tool
    def build_drill_rig(self, center_x: float, center_y: float, center_z: float, rig_size: str = "medium") -> str:
        """Build a drill rig structure at specified location."""
        
        # Define rig sizes
        sizes = {
            "small": {"base": 3, "height": 8, "tower": 2},
            "medium": {"base": 5, "height": 12, "tower": 3},
            "large": {"base": 7, "height": 16, "tower": 4}
        }
        
        if rig_size not in sizes:
            rig_size = "medium"
        
        config = sizes[rig_size]
        base_size = config["base"]
        height = config["height"]
        tower_size = config["tower"]
        
        commands = []
        
        # Base platform
        x1, z1 = int(center_x - base_size//2), int(center_z - base_size//2)
        x2, z2 = int(center_x + base_size//2), int(center_z + base_size//2)
        commands.append(f"fill {x1} {int(center_y)} {z1} {x2} {int(center_y)} {z2} iron_block")
        
        # Tower legs (corners)
        for dx in [-base_size//2, base_size//2]:
            for dz in [-base_size//2, base_size//2]:
                x, z = int(center_x + dx), int(center_z + dz)
                commands.append(f"fill {x} {int(center_y+1)} {z} {x} {int(center_y+height)} {z} iron_bars")
        
        # Top platform
        tx1, tz1 = int(center_x - tower_size//2), int(center_z - tower_size//2)
        tx2, tz2 = int(center_x + tower_size//2), int(center_z + tower_size//2)
        commands.append(f"fill {tx1} {int(center_y+height)} {tz1} {tx2} {int(center_y+height)} {tz2} iron_block")
        
        # Execute commands
        results = []
        for cmd in commands:
            result = self.rcon_command(cmd)
            results.append(result)
        
        self.logger.info(f"Built {rig_size} drill rig at ({center_x}, {center_y}, {center_z}) with {len(commands)} commands")
        return f"{rig_size.title()} drill rig built at ({center_x}, {center_y}, {center_z}). Commands executed: {len(commands)}"

    @tool
    def build_surface(
        self, corner1_x: float, corner1_y: float, corner1_z: float,
        corner2_x: float, corner2_y: float, corner2_z: float,
        block_type: str = "sandstone",
        surface_type: str = "flat"
    ) -> str:
        """Build surface or reservoir layers between two corner points."""
        
        x1, y1, z1 = int(corner1_x), int(corner1_y), int(corner1_z)
        x2, y2, z2 = int(corner2_x), int(corner2_y), int(corner2_z)
        
        if surface_type == "hollow":
            cmd = f"fill {x1} {y1} {z1} {x2} {y2} {z2} {block_type} hollow"
        elif surface_type == "solid":
            cmd = f"fill {x1} {y1} {z1} {x2} {y2} {z2} {block_type}"
        else:  # flat
            cmd = f"fill {x1} {y1} {z1} {x2} {y1} {z2} {block_type}"
        
        result = self.rcon_command(cmd)
        self.logger.info(f"Built {surface_type} surface with {block_type} from ({x1},{y1},{z1}) to ({x2},{y2},{z2})")
        return f"Surface built: {surface_type} {block_type} layer. Result: {result}"

    @tool
    def clear_area(
        self, corner1_x: float, corner1_y: float, corner1_z: float,
        corner2_x: float, corner2_y: float, corner2_z: float
    ) -> str:
        """Clear an area by filling it with air."""
        
        x1, y1, z1 = int(corner1_x), int(corner1_y), int(corner1_z)
        x2, y2, z2 = int(corner2_x), int(corner2_y), int(corner2_z)
        
        cmd = f"fill {x1} {y1} {z1} {x2} {y2} {z2} air"
        result = self.rcon_command(cmd)
        
        self.logger.info(f"Cleared area from ({x1},{y1},{z1}) to ({x2},{y2},{z2})")
        return f"Area cleared from ({x1},{y1},{z1}) to ({x2},{y2},{z2}). Result: {result}"

    def get_tools(self) -> List:
        """Get list of Minecraft tools for agent integration."""
        return [
            self.rcon_command,
            self.list_players,
            self.get_player_position,
            self.build_wellbore_trajectory,
            self.build_drill_rig,
            self.build_surface,
            self.clear_area
        ]