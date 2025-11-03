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
from .response_templates import CloudscapeResponseBuilder


@dataclass
class ChunkClearResult:
    """Result of clearing a single chunk."""
    x_start: int
    z_start: int
    cleared: bool
    ground_restored: bool
    blocks_cleared: int
    blocks_restored: int
    execution_time: float
    error: Optional[str] = None


@dataclass
class ClearOperationResult:
    """Result of clear environment operation."""
    total_chunks: int = 0
    successful_chunks: int = 0
    failed_chunks: int = 0
    total_blocks_cleared: int = 0
    total_blocks_restored: int = 0
    execution_time: float = 0.0
    chunk_results: List[ChunkClearResult] = field(default_factory=list)
    errors: List[str] = field(default_factory=list)
    
    @property
    def success(self) -> bool:
        """Operation succeeded if at least some chunks cleared successfully."""
        return self.successful_chunks > 0


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
        
        # RCON connection retry configuration
        self.rcon_connection_retries = 3
        self.rcon_connection_retry_delay = 2  # seconds
        
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
        # 150x150 area focused on center (25% smaller than 200x200)
        self.clear_region = {
            "x_min": -75,
            "x_max": 75,
            "z_min": -75,
            "z_max": 75,
            "y_clear_start": 10,     # Start clearing from subsurface (includes horizons at Y=50-90 and trajectories)
            "y_clear_end": 130,      # Clear to Y=130 (includes rigs up to 18 blocks tall at Y=118)
            "y_ground_start": 100,   # Ground level (single layer at y=100)
            "y_ground_end": 100      # Ground level (wellhead sits at y=100)
        }
        
        # Chunk configuration - Use 32x32x32 to stay under Minecraft's 32,768 block limit
        # 32x32x32 = 32,768 blocks (exactly at limit)
        # With 150x150x190 region (y=65-255): 25 horizontal chunks × 6 vertical slices = 150 operations
        self.chunk_size = 32
        self.chunk_height = 32  # Vertical slice height
        self.chunk_timeout = 30  # 30 seconds per chunk
        self.max_chunk_retries = 2
        self.total_timeout = 180  # 3 minutes total (reduced from 5)

    def _create_rcon_executor(self) -> RCONExecutor:
        """Create RCON executor with connection retry logic.
        
        Returns:
            RCONExecutor instance
            
        Raises:
            Exception: If connection fails after all retries
        """
        last_error = None
        
        for attempt in range(self.rcon_connection_retries):
            try:
                self.logger.debug(
                    f"Attempting RCON connection (attempt {attempt + 1}/{self.rcon_connection_retries})"
                )
                
                executor = RCONExecutor(
                    host=self.host,
                    port=self.port,
                    password=self.password,
                    timeout=self.chunk_timeout,
                    max_retries=self.max_chunk_retries,
                    chunk_size=32
                )
                
                # Test connection with a simple command
                test_result = executor.execute_command(
                    "list",
                    verify=False,
                    operation="test"
                )
                
                if test_result.success:
                    self.logger.info("RCON connection established successfully")
                    return executor
                else:
                    last_error = f"Connection test failed: {test_result.error}"
                    self.logger.warning(last_error)
                    
            except Exception as e:
                last_error = str(e)
                self.logger.warning(
                    f"RCON connection attempt {attempt + 1}/{self.rcon_connection_retries} failed: {last_error}"
                )
            
            # Retry with delay (except on last attempt)
            if attempt < self.rcon_connection_retries - 1:
                delay = self.rcon_connection_retry_delay * (attempt + 1)  # Increasing delay
                self.logger.info(f"Retrying RCON connection in {delay} seconds...")
                import time
                time.sleep(delay)
        
        # All connection attempts failed
        error_msg = f"Failed to establish RCON connection after {self.rcon_connection_retries} attempts: {last_error}"
        self.logger.error(error_msg)
        raise Exception(error_msg)
    
    def _calculate_chunks(self) -> List[tuple[int, int]]:
        """Calculate 32x32 horizontal chunk coordinates for the clear region.
        
        Each chunk will be cleared in vertical slices of 32 blocks to stay under
        Minecraft's 32,768 block limit (32x32x32 = 32,768).
        
        Returns:
            List of (x_start, z_start) tuples for each chunk
        """
        chunks = []
        region = self.clear_region
        
        x = region['x_min']
        while x <= region['x_max']:
            z = region['z_min']
            while z <= region['z_max']:
                chunks.append((x, z))
                z += self.chunk_size
            x += self.chunk_size
        
        # Calculate total vertical slices per chunk
        vertical_slices = (region['y_clear_end'] - region['y_clear_start'] + 1) // self.chunk_height
        
        self.logger.info(
            f"Calculated {len(chunks)} horizontal chunks ({self.chunk_size}x{self.chunk_size}), "
            f"{vertical_slices} vertical slices each = {len(chunks) * vertical_slices} total operations"
        )
        return chunks
    
    def _clear_chunk(
        self,
        executor: RCONExecutor,
        x_start: int,
        z_start: int,
        preserve_terrain: bool
    ) -> ChunkClearResult:
        """Clear a single 32x32 horizontal chunk in vertical slices.
        
        Clears from ground level to build height in 32-block vertical slices to stay
        under Minecraft's 32,768 block limit per command (32x32x32 = 32,768).
        
        Args:
            executor: RCONExecutor instance
            x_start: Chunk X start coordinate
            z_start: Chunk Z start coordinate
            preserve_terrain: Whether to restore ground after clearing
            
        Returns:
            ChunkClearResult with operation details
        """
        import time
        start_time = time.time()
        
        region = self.clear_region
        
        # Calculate chunk boundaries
        x_end = min(x_start + self.chunk_size - 1, region['x_max'])
        z_end = min(z_start + self.chunk_size - 1, region['z_max'])
        
        blocks_cleared = 0
        blocks_restored = 0
        error = None
        
        try:
            # Step 1: Clear in vertical slices (32x32x32 each to stay under 32,768 limit)
            self.logger.debug(f"Clearing chunk ({x_start}, {z_start}) to ({x_end}, {z_end}) in vertical slices")
            
            y = region['y_clear_start']
            while y <= region['y_clear_end']:
                y_end = min(y + self.chunk_height - 1, region['y_clear_end'])
                
                # Use simple fill command without replace modifier for better compatibility
                clear_command = f"fill {x_start} {y} {z_start} {x_end} {y_end} {z_end} air"
                
                clear_result = executor.execute_command(
                    clear_command,
                    verify=False,  # Don't verify to speed up
                    operation="clear"
                )
                
                if not clear_result.success:
                    error = f"Clear failed at y={y}-{y_end}: {clear_result.error}"
                    self.logger.warning(f"Chunk ({x_start}, {z_start}) slice y={y}-{y_end} failed: {error}")
                    # Continue with other slices even if one fails
                else:
                    blocks_cleared += clear_result.blocks_affected
                
                y += self.chunk_height
            
            # If no blocks were cleared and we have an error, return failure
            if blocks_cleared == 0 and error:
                return ChunkClearResult(
                    x_start=x_start,
                    z_start=z_start,
                    cleared=False,
                    ground_restored=False,
                    blocks_cleared=0,
                    blocks_restored=0,
                    execution_time=time.time() - start_time,
                    error=error
                )
            
            # Step 2: Restore ground level if requested
            if preserve_terrain:
                self.logger.debug(f"Restoring ground for chunk ({x_start}, {z_start})")
                
                restore_command = (
                    f"fill {x_start} {region['y_ground_start']} {z_start} "
                    f"{x_end} {region['y_ground_end']} {z_end} dirt"
                )
                
                restore_result = executor.execute_command(
                    restore_command,
                    verify=True,
                    operation="fill"
                )
                
                if restore_result.success:
                    blocks_restored = restore_result.blocks_affected
                else:
                    # Ground restoration failure is non-fatal
                    error = f"Ground restoration failed: {restore_result.error}"
                    self.logger.warning(f"Chunk ({x_start}, {z_start}) ground restoration failed: {error}")
            
            execution_time = time.time() - start_time
            
            self.logger.info(
                f"Chunk ({x_start}, {z_start}) completed: "
                f"{blocks_cleared} cleared, {blocks_restored} restored in {execution_time:.2f}s"
            )
            
            return ChunkClearResult(
                x_start=x_start,
                z_start=z_start,
                cleared=True,
                ground_restored=preserve_terrain and blocks_restored > 0,
                blocks_cleared=blocks_cleared,
                blocks_restored=blocks_restored,
                execution_time=execution_time,
                error=error
            )
            
        except Exception as e:
            error = f"Exception: {str(e)}"
            self.logger.error(f"Chunk ({x_start}, {z_start}) exception: {error}")
            
            return ChunkClearResult(
                x_start=x_start,
                z_start=z_start,
                cleared=False,
                ground_restored=False,
                blocks_cleared=blocks_cleared,
                blocks_restored=blocks_restored,
                execution_time=time.time() - start_time,
                error=error
            )

    @tool
    def clear_minecraft_environment(
        self, 
        preserve_terrain: bool = True
    ) -> str:
        """Clear Minecraft environment using vertical slice clearing.
        
        This operation divides the clear region into 32x32 horizontal chunks, then
        clears each chunk in 32-block vertical slices (32x32x32 = 32,768 blocks per
        command, staying under Minecraft's limit). This aggressive approach removes
        ALL blocks from bedrock to build height, bypassing block type filtering.
        Optionally restores ground level with grass blocks.
        
        Args:
            preserve_terrain: Whether to restore ground level after clearing (default: True)
            
        Returns:
            Formatted response with clearing results
        """
        import time
        start_time = time.time()
        
        self.logger.info(f"Starting chunk-based clear operation: preserve_terrain={preserve_terrain}")
        
        # Initialize RCONExecutor with connection retry logic
        try:
            executor = self._create_rcon_executor()
        except Exception as e:
            self.logger.error(f"Failed to establish RCON connection: {str(e)}")
            return self._format_error_response(
                "Connection Error",
                f"Failed to connect to Minecraft server after {self.rcon_connection_retries} attempts: {str(e)}",
                [
                    "Check that Minecraft server is running",
                    "Verify RCON is enabled in server.properties (enable-rcon=true)",
                    f"Verify RCON host ({self.host}) and port ({self.port}) are correct",
                    "Check RCON password matches server.properties (rcon.password)",
                    "Check firewall settings allow RCON connections",
                    "Verify server has finished starting up",
                    "Check server logs for RCON-related errors"
                ]
            )
        
        # Calculate chunks
        chunks = self._calculate_chunks()
        
        # Initialize result tracking
        result = ClearOperationResult()
        result.total_chunks = len(chunks)
        
        try:
            # Process each chunk
            for i, (x_start, z_start) in enumerate(chunks):
                # Check total timeout
                elapsed = time.time() - start_time
                if elapsed > self.total_timeout:
                    error_msg = f"Total operation timeout ({self.total_timeout}s) exceeded after {i} chunks"
                    self.logger.warning(error_msg)
                    result.errors.append(error_msg)
                    break
                
                # Clear chunk with retry logic
                chunk_result = self._clear_chunk_with_retry(
                    executor, x_start, z_start, preserve_terrain
                )
                
                # Track results
                result.chunk_results.append(chunk_result)
                
                if chunk_result.cleared:
                    result.successful_chunks += 1
                    result.total_blocks_cleared += chunk_result.blocks_cleared
                    result.total_blocks_restored += chunk_result.blocks_restored
                else:
                    result.failed_chunks += 1
                    if chunk_result.error:
                        result.errors.append(
                            f"Chunk ({x_start}, {z_start}): {chunk_result.error}"
                        )
                
                # Log progress every 10 chunks
                if (i + 1) % 10 == 0:
                    self.logger.info(
                        f"Progress: {i + 1}/{len(chunks)} chunks, "
                        f"{result.successful_chunks} successful, "
                        f"{result.failed_chunks} failed"
                    )
            
            # Calculate total execution time
            result.execution_time = time.time() - start_time
            
            # Log final statistics
            self.logger.info(
                f"Clear operation completed: {result.successful_chunks}/{result.total_chunks} chunks, "
                f"{result.total_blocks_cleared} blocks cleared, "
                f"{result.total_blocks_restored} blocks restored, "
                f"{result.execution_time:.2f}s"
            )
            
            # Build response based on results
            return self._format_clear_response(result, preserve_terrain)
            
        except Exception as e:
            self.logger.error(f"Error clearing environment: {str(e)}")
            
            # Build error response with recovery suggestions
            return self._format_error_response(
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
    
    def _clear_chunk_with_retry(
        self,
        executor: RCONExecutor,
        x_start: int,
        z_start: int,
        preserve_terrain: bool
    ) -> ChunkClearResult:
        """Clear chunk with retry logic.
        
        Args:
            executor: RCONExecutor instance
            x_start: Chunk X start coordinate
            z_start: Chunk Z start coordinate
            preserve_terrain: Whether to restore ground
            
        Returns:
            ChunkClearResult with operation details
        """
        last_result = None
        
        for attempt in range(self.max_chunk_retries):
            result = self._clear_chunk(executor, x_start, z_start, preserve_terrain)
            
            if result.cleared:
                # Success!
                if attempt > 0:
                    self.logger.info(
                        f"Chunk ({x_start}, {z_start}) succeeded on attempt {attempt + 1}"
                    )
                return result
            
            last_result = result
            
            # Retry with exponential backoff
            if attempt < self.max_chunk_retries - 1:
                delay = 2 ** attempt  # 1s, 2s, 4s
                self.logger.warning(
                    f"Chunk ({x_start}, {z_start}) failed (attempt {attempt + 1}/{self.max_chunk_retries}), "
                    f"retrying in {delay}s"
                )
                import time
                time.sleep(delay)
        
        # All retries failed
        self.logger.error(
            f"Chunk ({x_start}, {z_start}) failed after {self.max_chunk_retries} attempts"
        )
        return last_result
    
    def _format_clear_response(
        self,
        result: ClearOperationResult,
        preserve_terrain: bool
    ) -> str:
        """Format clear operation response with detailed results using Cloudscape templates.
        
        Args:
            result: ClearOperationResult with operation details
            preserve_terrain: Whether terrain was preserved
            
        Returns:
            Formatted response string using CloudscapeResponseBuilder
        """
        # Check if operation succeeded
        if not result.success:
            # Complete failure - use error response template
            return CloudscapeResponseBuilder.error_response(
                operation="Clear Environment",
                error_message="\n".join(result.errors[:10]),
                suggestions=[
                    "Check Minecraft server connection",
                    "Verify RCON is enabled and accessible",
                    "Try clearing a smaller area",
                    "Check server logs for errors",
                    "Restart Minecraft server if needed"
                ]
            )
        
        # Success or partial success - use chunk-based clear confirmation template
        response = CloudscapeResponseBuilder.chunk_based_clear_confirmation(
            total_chunks=result.total_chunks,
            successful_chunks=result.successful_chunks,
            failed_chunks=result.failed_chunks,
            total_blocks_cleared=result.total_blocks_cleared,
            total_blocks_restored=result.total_blocks_restored,
            execution_time=result.execution_time,
            preserve_terrain=preserve_terrain,
            clear_region=self.clear_region,
            chunk_size=self.chunk_size,
            errors=result.errors if result.failed_chunks > 0 else None
        )
        
        self.logger.info(
            f"Environment cleared: {result.total_blocks_cleared} blocks removed, "
            f"{result.failed_chunks} failed chunks, {result.execution_time:.2f}s"
        )
        
        return response
    
    def _format_error_response(
        self,
        category: str,
        error: str,
        suggestions: List[str]
    ) -> str:
        """Format user-friendly error response using Cloudscape templates.
        
        Args:
            category: Error category (e.g., "Connection Error")
            error: Error message
            suggestions: List of recovery suggestions
            
        Returns:
            Formatted error response using CloudscapeResponseBuilder
        """
        return CloudscapeResponseBuilder.error_response(
            operation=category,
            error_message=error,
            suggestions=suggestions
        )

    def get_tools(self) -> List:
        """Get list of clear environment tools for agent integration."""
        return [
            self.clear_minecraft_environment
        ]
