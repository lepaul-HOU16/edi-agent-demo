#!/usr/bin/env python3
"""
Clear Environment Tool for EDIcraft Agent.
Removes wellbore visualizations, drilling rigs, and markers while preserving terrain.
"""

import logging
from typing import Dict, List, Any, Optional
from strands import tool
from rcon.source import Client
from config import EDIcraftConfig


class ClearEnvironmentTool:
    """Tool for clearing Minecraft environment while preserving terrain."""
    
    def __init__(self, config: EDIcraftConfig):
        """Initialize clear environment tool with configuration.
        
        Args:
            config: EDIcraft configuration instance
        """
        self.config = config
        self.logger = logging.getLogger(__name__)
        
        # Extract Minecraft configuration directly from config
        self.host = config.minecraft_host
        self.port = config.minecraft_rcon_port
        self.password = config.minecraft_rcon_password
        
        # Define block types for selective clearing
        self.wellbore_blocks = [
            "obsidian",
            "glowstone",
            "emerald_block",
            "diamond_block",
            "gold_block",
            "iron_block",
            "lapis_block",
            "redstone_block"
        ]
        
        self.rig_blocks = [
            "iron_bars",
            "smooth_stone_slab",
            "furnace",
            "hopper",
            "chest",
            # All sign variants (standing and wall-mounted)
            "oak_sign",
            "oak_wall_sign",
            "spruce_sign",
            "spruce_wall_sign",
            "birch_sign",
            "birch_wall_sign",
            "jungle_sign",
            "jungle_wall_sign",
            "acacia_sign",
            "acacia_wall_sign",
            "dark_oak_sign",
            "dark_oak_wall_sign",
            "crimson_sign",
            "crimson_wall_sign",
            "warped_sign",
            "warped_wall_sign",
            "wall_sign",  # Generic wall sign
            "ladder",
            "rail",
            "powered_rail"
        ]
        
        self.marker_blocks = [
            "beacon",
            "sea_lantern",
            "end_rod",
            "torch",
            "wall_torch"
        ]
        
        # Define clear region (centered around spawn)
        self.clear_region = {
            "x1": -500,
            "y1": 0,
            "z1": -500,
            "x2": 500,
            "y2": 255,
            "z2": 500
        }

    def _execute_rcon_command(self, command: str) -> str:
        """Execute RCON command on Minecraft server.
        
        Args:
            command: Minecraft command to execute
            
        Returns:
            Command response or error message
        """
        try:
            with Client(self.host, self.port, passwd=self.password) as client:
                response = client.run(command)
                self.logger.debug(f"RCON command '{command}' executed successfully")
                return response
        except Exception as e:
            self.logger.error(f"RCON command '{command}' failed: {str(e)}")
            return f"ERROR: {str(e)}"

    def _clear_block_type(self, block_type: str) -> int:
        """Clear specific block type from the region.
        
        Args:
            block_type: Minecraft block type to clear
            
        Returns:
            Number of blocks cleared (estimated)
        """
        region = self.clear_region
        command = f"fill {region['x1']} {region['y1']} {region['z1']} {region['x2']} {region['y2']} {region['z2']} air replace {block_type}"
        
        response = self._execute_rcon_command(command)
        
        # Parse response to get block count
        # Minecraft returns "Filled X blocks" or similar
        if "ERROR" in response:
            self.logger.warning(f"Failed to clear {block_type}: {response}")
            return 0
        
        # Try to extract number from response
        try:
            # Response format: "Successfully filled X blocks"
            if "filled" in response.lower():
                parts = response.split()
                for i, part in enumerate(parts):
                    if part.lower() == "filled" and i + 1 < len(parts):
                        return int(parts[i + 1])
        except (ValueError, IndexError):
            pass
        
        # If we can't parse, assume some blocks were cleared
        return 1 if "success" in response.lower() else 0

    @tool
    def clear_minecraft_environment(
        self, 
        area: str = "all", 
        preserve_terrain: bool = True
    ) -> str:
        """Clear Minecraft environment by removing wellbores, rigs, and markers.
        
        Args:
            area: Which structures to clear - "all", "wellbores", "rigs", or "markers"
            preserve_terrain: Whether to preserve natural terrain blocks (default: True)
            
        Returns:
            Formatted response with clearing results
        """
        self.logger.info(f"Clearing Minecraft environment: area={area}, preserve_terrain={preserve_terrain}")
        
        # Validate area parameter
        valid_areas = ["all", "wellbores", "rigs", "markers"]
        if area not in valid_areas:
            return f"❌ **Invalid Area Parameter**\n\nArea must be one of: {', '.join(valid_areas)}\n\nYou provided: {area}"
        
        # Track clearing results
        wellbores_cleared = 0
        rigs_cleared = 0
        markers_cleared = 0
        total_blocks = 0
        errors = []
        
        try:
            # Clear wellbore blocks
            if area in ["all", "wellbores"]:
                self.logger.info("Clearing wellbore blocks...")
                for block_type in self.wellbore_blocks:
                    count = self._clear_block_type(block_type)
                    wellbores_cleared += count
                    total_blocks += count
                    if count > 0:
                        self.logger.info(f"Cleared {count} {block_type} blocks")
            
            # Clear rig blocks
            if area in ["all", "rigs"]:
                self.logger.info("Clearing rig blocks...")
                for block_type in self.rig_blocks:
                    count = self._clear_block_type(block_type)
                    rigs_cleared += count
                    total_blocks += count
                    if count > 0:
                        self.logger.info(f"Cleared {count} {block_type} blocks")
            
            # Clear marker blocks
            if area in ["all", "markers"]:
                self.logger.info("Clearing marker blocks...")
                for block_type in self.marker_blocks:
                    count = self._clear_block_type(block_type)
                    markers_cleared += count
                    total_blocks += count
                    if count > 0:
                        self.logger.info(f"Cleared {count} {block_type} blocks")
            
            # Repair surface terrain only - keep underground clear for trajectory visibility
            terrain_filled = 0
            if preserve_terrain:
                self.logger.info("Repairing surface terrain only...")
                region = self.clear_region
                
                # Fill only surface level (y=61 to y=70) with grass to fix surface holes
                # Underground stays clear so trajectories remain visible
                surface_command = f"fill {region['x1']} 61 {region['z1']} {region['x2']} 70 {region['z2']} grass_block replace air"
                surface_response = self._execute_rcon_command(surface_command)
                self.logger.info(f"Surface terrain repair: {surface_response}")
                
                # Parse surface fill count
                try:
                    if "filled" in surface_response.lower():
                        parts = surface_response.split()
                        for i, part in enumerate(parts):
                            if part.lower() == "filled" and i + 1 < len(parts):
                                terrain_filled = int(parts[i + 1])
                                break
                except (ValueError, IndexError):
                    pass
            
            # Build success response
            response = "✅ **Minecraft Environment Cleared**\n\n"
            response += "**Summary:**\n"
            
            if area in ["all", "wellbores"]:
                response += f"- **Wellbore Blocks Cleared:** {wellbores_cleared}\n"
            
            if area in ["all", "rigs"]:
                response += f"- **Rig Blocks Cleared:** {rigs_cleared}\n"
            
            if area in ["all", "markers"]:
                response += f"- **Marker Blocks Cleared:** {markers_cleared}\n"
            
            response += f"- **Total Blocks Cleared:** {total_blocks}\n"
            
            if preserve_terrain:
                response += f"\n**Terrain Repair:**\n"
                response += f"- **Surface Layer (y=61-70):** {terrain_filled} grass blocks filled\n"
                response += f"- **Underground (y=0-60):** Kept clear for trajectory visibility\n"
            else:
                response += f"- **Terrain:** Not Preserved\n"
            
            response += f"\n- **Clear Region:** X: {self.clear_region['x1']} to {self.clear_region['x2']}, "
            response += f"Y: {self.clear_region['y1']} to {self.clear_region['y2']}, "
            response += f"Z: {self.clear_region['z1']} to {self.clear_region['z2']}\n\n"
            
            if total_blocks == 0:
                response += "ℹ️ **Note:** No structures found in the clear region. The environment was already clean.\n\n"
            
            response += "💡 **Tip:** The environment is now clear and ready for new visualizations!"
            
            self.logger.info(f"Environment cleared successfully: {total_blocks} blocks removed")
            return response
            
        except Exception as e:
            self.logger.error(f"Error clearing environment: {str(e)}")
            
            # Build error response
            error_response = "❌ **Clear Environment Failed**\n\n"
            error_response += f"**Error Details:**\n{str(e)}\n\n"
            error_response += "💡 **Recovery Suggestions:**\n"
            error_response += "1. Check Minecraft server connection\n"
            error_response += "2. Verify RCON is enabled and accessible\n"
            error_response += "3. Try clearing a smaller area\n"
            error_response += "4. Check server logs for errors\n\n"
            error_response += "Would you like to try one of these options?"
            
            return error_response

    def get_tools(self) -> List:
        """Get list of clear environment tools for agent integration."""
        return [
            self.clear_minecraft_environment
        ]
