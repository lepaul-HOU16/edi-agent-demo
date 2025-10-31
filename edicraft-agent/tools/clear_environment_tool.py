#!/usr/bin/env python3
"""
Clear Environment Tool for EDIcraft Agent.
Removes wellbore visualizations, drilling rigs, and markers while preserving terrain.
"""

import logging
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from strands import tool
from config import EDIcraftConfig
from .rcon_executor import RCONExecutor, RCONResult


@dataclass
class ClearOperationResult:
    """Result of clear environment operation."""
    wellbores_cleared: int = 0
    rigs_cleared: int = 0
    markers_cleared: int = 0
    terrain_filled: int = 0
    total_blocks: int = 0
    execution_time: float = 0.0
    errors: List[str] = field(default_factory=list)
    partial_success: bool = False
    
    @property
    def success(self) -> bool:
        """Operation succeeded if no errors or only partial failures."""
        return len(self.errors) == 0 or self.partial_success


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

    def _clear_block_type(
        self, 
        executor: RCONExecutor, 
        block_type: str
    ) -> tuple[int, Optional[str]]:
        """Clear specific block type from the region using batched fill commands.
        
        Args:
            executor: RCONExecutor instance for reliable command execution
            block_type: Minecraft block type to clear
            
        Returns:
            Tuple of (blocks_cleared, error_message)
        """
        region = self.clear_region
        
        # Use execute_fill with automatic batching for large areas
        result = executor.execute_fill(
            region['x1'], region['y1'], region['z1'],
            region['x2'], region['y2'], region['z2'],
            'air',
            replace=block_type
        )
        
        if result.success:
            self.logger.info(
                f"Cleared {result.blocks_affected} {block_type} blocks "
                f"in {result.execution_time:.2f}s (retries: {result.retries})"
            )
            return result.blocks_affected, None
        else:
            error_msg = f"Failed to clear {block_type}: {result.error}"
            self.logger.warning(error_msg)
            return result.blocks_affected, error_msg

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
        import time
        start_time = time.time()
        
        self.logger.info(f"Clearing Minecraft environment: area={area}, preserve_terrain={preserve_terrain}")
        
        # Validate area parameter
        valid_areas = ["all", "wellbores", "rigs", "markers"]
        if area not in valid_areas:
            return f"❌ **Invalid Area Parameter**\n\nArea must be one of: {', '.join(valid_areas)}\n\nYou provided: {area}"
        
        # Initialize RCONExecutor with reliability features
        try:
            executor = RCONExecutor(
                host=self.host,
                port=self.port,
                password=self.password,
                timeout=10,
                max_retries=3,
                chunk_size=32
            )
        except Exception as e:
            self.logger.error(f"Failed to initialize RCON executor: {str(e)}")
            return executor.format_error_response(
                "Connection Error",
                f"Failed to connect to Minecraft server: {str(e)}",
                [
                    "Check that Minecraft server is running",
                    "Verify RCON is enabled in server.properties",
                    f"Verify RCON host ({self.host}) and port ({self.port}) are correct",
                    "Check RCON password is correct",
                    "Check firewall settings allow RCON connections"
                ]
            )
        
        # Track clearing results
        result = ClearOperationResult()
        
        try:
            # Clear wellbore blocks
            if area in ["all", "wellbores"]:
                self.logger.info("Clearing wellbore blocks...")
                for block_type in self.wellbore_blocks:
                    count, error = self._clear_block_type(executor, block_type)
                    result.wellbores_cleared += count
                    result.total_blocks += count
                    
                    if error:
                        result.errors.append(error)
                        # Continue with other blocks even if one fails
                        result.partial_success = True
            
            # Clear rig blocks
            if area in ["all", "rigs"]:
                self.logger.info("Clearing rig blocks...")
                for block_type in self.rig_blocks:
                    count, error = self._clear_block_type(executor, block_type)
                    result.rigs_cleared += count
                    result.total_blocks += count
                    
                    if error:
                        result.errors.append(error)
                        result.partial_success = True
            
            # Clear marker blocks
            if area in ["all", "markers"]:
                self.logger.info("Clearing marker blocks...")
                for block_type in self.marker_blocks:
                    count, error = self._clear_block_type(executor, block_type)
                    result.markers_cleared += count
                    result.total_blocks += count
                    
                    if error:
                        result.errors.append(error)
                        result.partial_success = True
            
            # Repair surface terrain with batched fill commands and smart optimization
            if preserve_terrain:
                self.logger.info("Repairing surface terrain with smart fill optimization...")
                region = self.clear_region
                
                # Fill only surface level (y=61 to y=70) with grass to fix surface holes
                # Underground stays clear so trajectories remain visible
                # Use smart_fill=True to skip layers with no air blocks
                terrain_result = executor.execute_fill(
                    region['x1'], 61, region['z1'],
                    region['x2'], 70, region['z2'],
                    'grass_block',
                    replace='air',
                    smart_fill=True  # Skip layers with no air blocks for better performance
                )
                
                if terrain_result.success:
                    result.terrain_filled = terrain_result.blocks_affected
                    self.logger.info(
                        f"Terrain repair completed: {result.terrain_filled} blocks filled "
                        f"in {terrain_result.execution_time:.2f}s"
                    )
                else:
                    error_msg = f"Terrain fill failed: {terrain_result.error}"
                    result.errors.append(error_msg)
                    result.partial_success = True
                    self.logger.warning(error_msg)
            
            # Calculate total execution time
            result.execution_time = time.time() - start_time
            
            # Log performance statistics
            perf_stats = executor.get_performance_stats()
            self.logger.info(
                f"Clear operation performance: {perf_stats['operations']} operations, "
                f"avg {perf_stats['avg_blocks_per_second']:.0f} blocks/s, "
                f"chunk size: {perf_stats['current_chunk_size']}"
            )
            
            # Build response based on results
            return self._format_clear_response(result, area, preserve_terrain)
            
        except Exception as e:
            self.logger.error(f"Error clearing environment: {str(e)}")
            
            # Build error response with recovery suggestions
            return executor.format_error_response(
                "Clear Environment Failed",
                str(e),
                [
                    "Check Minecraft server connection",
                    "Verify RCON is enabled and accessible",
                    "Try clearing a smaller area",
                    "Check server logs for errors",
                    "Restart Minecraft server if needed"
                ]
            )
    
    def _format_clear_response(
        self,
        result: ClearOperationResult,
        area: str,
        preserve_terrain: bool
    ) -> str:
        """Format clear operation response with detailed results.
        
        Args:
            result: ClearOperationResult with operation details
            area: Area that was cleared
            preserve_terrain: Whether terrain was preserved
            
        Returns:
            Formatted response string
        """
        # Check if operation succeeded
        if not result.success and not result.partial_success:
            # Complete failure
            response = "❌ **Clear Environment Failed**\n\n"
            response += "**Errors:**\n"
            for error in result.errors:
                response += f"- {error}\n"
            response += "\n💡 **Recovery Suggestions:**\n"
            response += "1. Check Minecraft server connection\n"
            response += "2. Verify RCON is enabled and accessible\n"
            response += "3. Try clearing a smaller area\n"
            response += "4. Check server logs for errors\n"
            return response
        
        # Success or partial success
        if result.partial_success:
            response = "⚠️ **Minecraft Environment Partially Cleared**\n\n"
        else:
            response = "✅ **Minecraft Environment Cleared**\n\n"
        
        response += "**Summary:**\n"
        
        if area in ["all", "wellbores"]:
            response += f"- **Wellbore Blocks Cleared:** {result.wellbores_cleared:,}\n"
        
        if area in ["all", "rigs"]:
            response += f"- **Rig Blocks Cleared:** {result.rigs_cleared:,}\n"
        
        if area in ["all", "markers"]:
            response += f"- **Marker Blocks Cleared:** {result.markers_cleared:,}\n"
        
        response += f"- **Total Blocks Cleared:** {result.total_blocks:,}\n"
        response += f"- **Execution Time:** {result.execution_time:.2f} seconds\n"
        
        if preserve_terrain:
            response += f"\n**Terrain Repair:**\n"
            response += f"- **Surface Layer (y=61-70):** {result.terrain_filled:,} grass blocks filled\n"
            response += f"- **Underground (y=0-60):** Kept clear for trajectory visibility\n"
        else:
            response += f"\n**Terrain:** Not Preserved\n"
        
        response += f"\n**Clear Region:**\n"
        response += f"- **X:** {self.clear_region['x1']} to {self.clear_region['x2']}\n"
        response += f"- **Y:** {self.clear_region['y1']} to {self.clear_region['y2']}\n"
        response += f"- **Z:** {self.clear_region['z1']} to {self.clear_region['z2']}\n"
        
        # Add errors if partial success
        if result.partial_success and result.errors:
            response += f"\n⚠️ **Warnings:**\n"
            for error in result.errors[:5]:  # Limit to first 5 errors
                response += f"- {error}\n"
            if len(result.errors) > 5:
                response += f"- ... and {len(result.errors) - 5} more errors\n"
        
        if result.total_blocks == 0:
            response += "\nℹ️ **Note:** No structures found in the clear region. The environment was already clean.\n"
        
        response += "\n💡 **Tip:** The environment is now clear and ready for new visualizations!"
        
        self.logger.info(
            f"Environment cleared: {result.total_blocks} blocks removed, "
            f"{len(result.errors)} errors, {result.execution_time:.2f}s"
        )
        
        return response

    def get_tools(self) -> List:
        """Get list of clear environment tools for agent integration."""
        return [
            self.clear_minecraft_environment
        ]
