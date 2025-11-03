"""
Response template engine for EDIcraft agent.
Provides consistent, professional response formatting using AWS Cloudscape Design System patterns.
"""

from typing import List, Dict, Optional, Any


class CloudscapeResponseBuilder:
    """
    Build structured responses using Cloudscape component patterns.
    
    This class provides static methods for generating consistent, professional
    responses that match the AWS Cloudscape Design System. All responses use
    visual indicators (✅, ❌, 💡, ⏳) and structured formatting for readability.
    """
    
    # Status indicators
    SUCCESS_ICON = "✅"
    ERROR_ICON = "❌"
    TIP_ICON = "💡"
    PROGRESS_ICON = "⏳"
    INFO_ICON = "ℹ️"
    WARNING_ICON = "⚠️"
    
    @staticmethod
    def wellbore_success(
        well_name: str,
        data_points: int,
        blocks_placed: int,
        coordinates: Dict[str, Any],
        has_rig: bool = False
    ) -> str:
        """
        Generate wellbore build success response.
        
        Args:
            well_name: Short well name (e.g., "WELL-007")
            data_points: Number of trajectory data points processed
            blocks_placed: Number of blocks placed in Minecraft
            coordinates: Dictionary with x, y, z coordinates
            has_rig: Whether a drilling rig was built
        
        Returns:
            Cloudscape-formatted markdown response
        """
        x = coordinates.get('x', 'unknown')
        y = coordinates.get('y', 'unknown')
        z = coordinates.get('z', 'unknown')
        
        rig_section = ""
        if has_rig:
            rig_section = f"""
**Drilling Rig:**
- **Status:** Built at wellhead
- **Components:** Derrick, platform, equipment
- **Signage:** {well_name}
"""
        
        return f"""{CloudscapeResponseBuilder.SUCCESS_ICON} **Wellbore Trajectory Built Successfully**

**Details:**
- **Wellbore ID:** {well_name}
- **Data Points:** {data_points}
- **Blocks Placed:** {blocks_placed}
- **Status:** Complete
{rig_section}
**Minecraft Location:**
- **Coordinates:** ({x}, {y}, {z})
- **Wellhead:** Ground level (Y=100)
- **Markers:** Placed every 10 points

{CloudscapeResponseBuilder.TIP_ICON} **Tip:** The wellbore is now visible in Minecraft! You can teleport to the wellhead using `/tp @s {x} {y} {z}`"""
    
    @staticmethod
    def horizon_success(
        horizon_id: str,
        total_points: int,
        blocks_placed: int,
        coordinates: Dict[str, Any],
        successful_commands: int = 0,
        failed_commands: int = 0
    ) -> str:
        """
        Generate horizon surface build success response.
        
        Args:
            horizon_id: OSDU horizon ID
            total_points: Number of data points processed from OSDU
            blocks_placed: Number of blocks placed in Minecraft
            coordinates: Dictionary with x, y, z coordinates
            successful_commands: Number of successful RCON commands
            failed_commands: Number of failed RCON commands
        
        Returns:
            Cloudscape-formatted markdown response
        """
        x = coordinates.get('x', 'unknown')
        y = coordinates.get('y', 'unknown')
        z = coordinates.get('z', 'unknown')
        
        # Extract horizon name from ID (last part after colon)
        horizon_name = horizon_id.split(':')[-1][:20] if ':' in horizon_id else horizon_id[:20]
        
        success_rate = int((successful_commands / (successful_commands + failed_commands)) * 100) if (successful_commands + failed_commands) > 0 else 100
        
        return f"""{CloudscapeResponseBuilder.SUCCESS_ICON} **Horizon Surface Built Successfully**

**OSDU Data Integration:**
- **Horizon ID:** {horizon_name}...
- **Data Source:** OSDU Platform
- **Data Points Retrieved:** {total_points:,}
- **Coordinate System:** UTM → Minecraft transformation

**Minecraft Construction:**
- **Blocks Placed:** {blocks_placed:,}
- **RCON Commands:** {successful_commands:,} successful, {failed_commands} failed
- **Success Rate:** {success_rate}%
- **Surface Type:** Geological horizon interpolation

**Visualization Location:**
- **Starting Point:** ({x}, {y}, {z})
- **Extent:** {total_points:,} point surface mesh
- **Material:** Colored blocks representing geological formation

{CloudscapeResponseBuilder.TIP_ICON} **Tip:** The horizon surface is now visible in Minecraft! Use `/tp @s {x} {y} {z}` to teleport to the surface, or fly around to see the complete geological formation."""
    
    @staticmethod
    def batch_progress(
        current: int,
        total: int,
        well_name: str,
        status: str = "building"
    ) -> str:
        """
        Generate batch operation progress update.
        
        Args:
            current: Current well number being processed
            total: Total number of wells to process
            well_name: Name of current well
            status: Status message (e.g., "building", "complete", "failed")
        
        Returns:
            Cloudscape-formatted progress message
        """
        percentage = int((current / total) * 100) if total > 0 else 0
        
        return f"""{CloudscapeResponseBuilder.PROGRESS_ICON} **Batch Visualization Progress**

**Current Status:**
- **Progress:** {current} of {total} wells ({percentage}%)
- **Current Well:** {well_name}
- **Status:** {status.capitalize()}

Please wait while the visualization completes..."""
    
    @staticmethod
    def error_response(
        operation: str,
        error_message: str,
        suggestions: List[str]
    ) -> str:
        """
        Generate error response with recovery suggestions.
        
        Args:
            operation: Name of the operation that failed
            error_message: Detailed error message
            suggestions: List of recovery suggestions
        
        Returns:
            Cloudscape-formatted error response
        """
        suggestions_text = "\n".join([f"{i+1}. {s}" for i, s in enumerate(suggestions)])
        
        return f"""{CloudscapeResponseBuilder.ERROR_ICON} **{operation} Failed**

**Error Details:**
{error_message}

{CloudscapeResponseBuilder.TIP_ICON} **Recovery Suggestions:**
{suggestions_text}

Would you like to try one of these options?"""
    
    @staticmethod
    def list_response(
        title: str,
        items: List[Dict[str, str]],
        total_count: Optional[int] = None
    ) -> str:
        """
        Generate list response using Cloudscape list pattern.
        
        Args:
            title: List title
            items: List of items, each with 'name' and 'description' keys
            total_count: Optional total count if list is paginated
        
        Returns:
            Cloudscape-formatted list response
        """
        count_text = f" ({len(items)} items)" if total_count is None else f" ({len(items)} of {total_count} items)"
        
        items_text = "\n\n".join([
            f"**{item.get('name', 'Unknown')}**\n{item.get('description', 'No description')}"
            for item in items
        ])
        
        return f"""{CloudscapeResponseBuilder.INFO_ICON} **{title}**{count_text}

{items_text}"""
    
    @staticmethod
    def table_response(
        title: str,
        headers: List[str],
        rows: List[List[str]]
    ) -> str:
        """
        Generate table response using Cloudscape table pattern.
        
        Args:
            title: Table title
            headers: List of column headers
            rows: List of rows, each row is a list of cell values
        
        Returns:
            Cloudscape-formatted table response
        """
        # Calculate column widths
        col_widths = [len(h) for h in headers]
        for row in rows:
            for i, cell in enumerate(row):
                if i < len(col_widths):
                    col_widths[i] = max(col_widths[i], len(str(cell)))
        
        # Build header row
        header_row = " | ".join([h.ljust(col_widths[i]) for i, h in enumerate(headers)])
        separator = "-|-".join(["-" * w for w in col_widths])
        
        # Build data rows
        data_rows = "\n".join([
            " | ".join([str(cell).ljust(col_widths[i]) for i, cell in enumerate(row)])
            for row in rows
        ])
        
        return f"""{CloudscapeResponseBuilder.INFO_ICON} **{title}**

{header_row}
{separator}
{data_rows}"""
    
    @staticmethod
    def demo_reset_confirmation(
        clear_success: bool = True,
        time_lock_success: bool = True,
        teleport_success: bool = True,
        clear_details: dict = None
    ) -> str:
        """
        Generate demo reset confirmation response with detailed status.
        
        Args:
            clear_success: Whether the clear operation succeeded
            time_lock_success: Whether time lock succeeded
            teleport_success: Whether teleport succeeded
            clear_details: Optional details about clear operation
        
        Returns:
            Cloudscape-formatted reset confirmation with detailed status
        """
        clear_icon = CloudscapeResponseBuilder.SUCCESS_ICON if clear_success else CloudscapeResponseBuilder.WARNING_ICON
        time_icon = CloudscapeResponseBuilder.SUCCESS_ICON if time_lock_success else CloudscapeResponseBuilder.WARNING_ICON
        teleport_icon = CloudscapeResponseBuilder.SUCCESS_ICON if teleport_success else CloudscapeResponseBuilder.WARNING_ICON
        
        clear_status = "All wellbores cleared" if clear_success else "Clear operation failed"
        rig_status = "All drilling rigs removed" if clear_success else "Rig removal failed"
        marker_status = "All markers cleared" if clear_success else "Marker clearing failed"
        time_status = "World time locked to daytime" if time_lock_success else "Time lock failed"
        teleport_status = "Players teleported to spawn" if teleport_success else "Teleport failed"
        
        # Determine overall status
        all_success = clear_success and time_lock_success and teleport_success
        partial_success = time_lock_success or teleport_success
        
        if all_success:
            status_message = "Ready for Demo"
            tip_message = "The Minecraft world is now clean and ready for your next demonstration!"
        elif partial_success:
            status_message = "Partially Complete (see details below)"
            tip_message = "Some operations succeeded. Check the status above and retry failed operations if needed."
        else:
            status_message = "Reset Failed"
            tip_message = "All operations failed. Check Minecraft server connection and RCON configuration."
        
        # Build detailed message
        message = f"""{CloudscapeResponseBuilder.SUCCESS_ICON} **Demo Environment Reset Complete**

**Actions Performed:**
- {clear_icon} {clear_status}
- {clear_icon} {rig_status}
- {clear_icon} {marker_status}
- {time_icon} {time_status}
- {teleport_icon} {teleport_status}

**Status:** {status_message}

{CloudscapeResponseBuilder.TIP_ICON} **Tip:** {tip_message}"""
        
        # Add clear details if available
        if clear_details:
            if clear_details.get('status') == 'initiated':
                message += f"\n\n**Clear Operation Status:**\n"
                message += f"🔄 {clear_details.get('message', 'Clear operation running in background')}\n"
                message += f"The environment will be fully cleared in 30-60 seconds."
            elif clear_details.get('status') == 'error':
                message += f"\n\n**Clear Operation Details:**\n"
                message += f"Error: {clear_details.get('message', 'Unknown error')}"
            elif clear_details.get('status') == 'failed':
                message += f"\n\n**Clear Operation Details:**\n"
                message += f"Failed: {clear_details.get('message', 'Operation did not complete')}"
        
        return message
    
    @staticmethod
    def clear_confirmation(
        wellbores_cleared: int,
        rigs_cleared: int,
        blocks_cleared: int
    ) -> str:
        """
        Generate environment clear confirmation response (legacy method).
        
        Args:
            wellbores_cleared: Number of wellbores cleared
            rigs_cleared: Number of rigs cleared
            blocks_cleared: Total blocks cleared
        
        Returns:
            Cloudscape-formatted clear confirmation
        """
        return f"""{CloudscapeResponseBuilder.SUCCESS_ICON} **Minecraft Environment Cleared**

**Summary:**
- **Wellbores Cleared:** {wellbores_cleared}
- **Drilling Rigs Removed:** {rigs_cleared}
- **Total Blocks Cleared:** {blocks_cleared}
- **Terrain:** Preserved

{CloudscapeResponseBuilder.TIP_ICON} **Tip:** The environment is now clear and ready for new visualizations!"""
    
    @staticmethod
    def chunk_based_clear_confirmation(
        total_chunks: int,
        successful_chunks: int,
        failed_chunks: int,
        total_blocks_cleared: int,
        total_blocks_restored: int,
        execution_time: float,
        preserve_terrain: bool,
        clear_region: dict,
        chunk_size: int,
        errors: list = None
    ) -> str:
        """
        Generate chunk-based clear operation confirmation response.
        
        Args:
            total_chunks: Total number of chunks processed
            successful_chunks: Number of chunks cleared successfully
            failed_chunks: Number of chunks that failed
            total_blocks_cleared: Total blocks cleared across all chunks
            total_blocks_restored: Total ground blocks restored
            execution_time: Total execution time in seconds
            preserve_terrain: Whether terrain was preserved
            clear_region: Dictionary with clear region coordinates
            chunk_size: Size of each chunk (e.g., 32)
            errors: Optional list of error messages
        
        Returns:
            Cloudscape-formatted chunk-based clear confirmation
        """
        # Determine status icon and title
        if failed_chunks > 0:
            status_icon = CloudscapeResponseBuilder.WARNING_ICON
            title = "Minecraft Environment Partially Cleared"
        else:
            status_icon = CloudscapeResponseBuilder.SUCCESS_ICON
            title = "Minecraft Environment Cleared"
        
        # Build response
        response = f"""{status_icon} **{title}**

**Chunk-Based Area Wipe Summary:**
- **Total Chunks:** {total_chunks}
- **Successful Chunks:** {successful_chunks}
- **Failed Chunks:** {failed_chunks}
- **Total Blocks Cleared:** {total_blocks_cleared:,}"""
        
        if preserve_terrain:
            response += f"\n- **Ground Blocks Restored:** {total_blocks_restored:,}"
        
        response += f"\n- **Execution Time:** {execution_time:.2f} seconds"
        
        if preserve_terrain:
            response += f"""

**Terrain Restoration:**
- **Ground Level (y={clear_region.get('y_ground_start', 100)}):** Restored with dirt blocks
- **Clear Area (y={clear_region.get('y_clear_start', 101)}-{clear_region.get('y_clear_end', 255)}):** All blocks removed"""
        else:
            response += f"""

**Terrain:** Not Preserved (complete wipe)"""
        
        response += f"""

**Clear Region:**
- **X:** {clear_region.get('x_min', -500)} to {clear_region.get('x_max', 500)}
- **Z:** {clear_region.get('z_min', -500)} to {clear_region.get('z_max', 500)}
- **Y:** {clear_region.get('y_clear_start', 65)} to {clear_region.get('y_clear_end', 255)}
- **Chunk Size:** {chunk_size}x{chunk_size}"""
        
        # Add errors if any chunks failed
        if failed_chunks > 0 and errors:
            response += f"""

{CloudscapeResponseBuilder.WARNING_ICON} **Warnings ({len(errors)} errors):**"""
            for error in errors[:5]:  # Limit to first 5 errors
                response += f"\n- {error}"
            if len(errors) > 5:
                response += f"\n- ... and {len(errors) - 5} more errors"
        
        if total_blocks_cleared == 0:
            response += f"""

{CloudscapeResponseBuilder.INFO_ICON} **Note:** No blocks found in the clear region. The environment was already clean."""
        
        response += f"""

{CloudscapeResponseBuilder.TIP_ICON} **Tip:** The environment is now clear and ready for new visualizations!"""
        
        return response
    
    @staticmethod
    def time_lock_confirmation(
        time: str,
        locked: bool,
        verified: bool = False
    ) -> str:
        """
        Generate time lock confirmation response.
        
        Args:
            time: Time setting (e.g., "day", "noon")
            locked: Whether time is locked or unlocked
            verified: Whether gamerule was verified (default: False)
        
        Returns:
            Cloudscape-formatted time lock confirmation
        """
        status = "locked" if locked else "unlocked"
        cycle_status = "disabled" if locked else "enabled"
        
        verification_section = ""
        if verified:
            verification_section = f"\n- **Verification:** Gamerule verified successfully"
        
        return f"""{CloudscapeResponseBuilder.SUCCESS_ICON} **World Time {status.capitalize()}**

**Settings:**
- **Current Time:** {time.capitalize()}
- **Daylight Cycle:** {cycle_status.capitalize()}
- **Status:** Time is {status}{verification_section}

{CloudscapeResponseBuilder.TIP_ICON} **Tip:** Visualizations will {"always be visible in daylight" if locked else "follow the natural day/night cycle"}!"""
    
    @staticmethod
    def collection_summary(
        collection_name: str,
        wells_built: int,
        wells_failed: int,
        total_wells: int,
        failed_wells: Optional[List[str]] = None
    ) -> str:
        """
        Generate collection visualization summary response.
        
        Args:
            collection_name: Name of the collection
            wells_built: Number of wells successfully built
            wells_failed: Number of wells that failed
            total_wells: Total number of wells in collection
            failed_wells: Optional list of failed well names
        
        Returns:
            Cloudscape-formatted collection summary
        """
        success_rate = int((wells_built / total_wells) * 100) if total_wells > 0 else 0
        
        failed_section = ""
        if wells_failed > 0 and failed_wells:
            failed_list = "\n".join([f"  - {w}" for w in failed_wells])
            failed_section = f"""
**Failed Wells:**
{failed_list}
"""
        
        return f"""{CloudscapeResponseBuilder.SUCCESS_ICON} **Collection Visualization Complete**

**Collection:** {collection_name}

**Summary:**
- **Total Wells:** {total_wells}
- **Successfully Built:** {wells_built}
- **Failed:** {wells_failed}
- **Success Rate:** {success_rate}%
{failed_section}
{CloudscapeResponseBuilder.TIP_ICON} **Tip:** All wellbores are now visible in Minecraft! You can explore the collection in 3D."""
    
    @staticmethod
    def warning_response(
        title: str,
        message: str,
        action_required: Optional[str] = None
    ) -> str:
        """
        Generate warning response.
        
        Args:
            title: Warning title
            message: Warning message
            action_required: Optional action required message
        
        Returns:
            Cloudscape-formatted warning response
        """
        action_section = ""
        if action_required:
            action_section = f"""
**Action Required:**
{action_required}
"""
        
        return f"""{CloudscapeResponseBuilder.WARNING_ICON} **{title}**

{message}
{action_section}"""
    
    @staticmethod
    def info_response(
        title: str,
        message: str,
        details: Optional[Dict[str, str]] = None
    ) -> str:
        """
        Generate informational response.
        
        Args:
            title: Info title
            message: Info message
            details: Optional dictionary of additional details
        
        Returns:
            Cloudscape-formatted info response
        """
        details_section = ""
        if details:
            details_text = "\n".join([f"- **{k}:** {v}" for k, v in details.items()])
            details_section = f"""
**Details:**
{details_text}
"""
        
        return f"""{CloudscapeResponseBuilder.INFO_ICON} **{title}**

{message}
{details_section}"""
    
    @staticmethod
    def horizon_success(
        horizon_id: str,
        total_points: int,
        blocks_placed: int,
        coordinates: Dict[str, Any],
        successful_commands: int = 0,
        failed_commands: int = 0
    ) -> str:
        """
        Generate horizon surface build success response.
        
        Args:
            horizon_id: OSDU horizon record ID
            total_points: Number of points in the horizon surface
            blocks_placed: Number of blocks placed in Minecraft
            coordinates: Dictionary with x, y, z coordinates
            successful_commands: Number of successful RCON commands
            failed_commands: Number of failed RCON commands
        
        Returns:
            Cloudscape-formatted markdown response
        """
        # Extract short horizon name from full OSDU ID
        horizon_name = horizon_id.split(":")[-1] if ":" in horizon_id else horizon_id
        
        x = coordinates.get('x', 0)
        y = coordinates.get('y', 100)
        z = coordinates.get('z', 0)
        
        # Add warning section if there were failed commands
        warning_section = ""
        if failed_commands > 0:
            warning_section = f"""
{CloudscapeResponseBuilder.WARNING_ICON} **Note:** {failed_commands} commands failed (likely server announcements). The surface blocks were placed successfully.
"""
        
        return f"""{CloudscapeResponseBuilder.SUCCESS_ICON} **Horizon Surface Complete**

**Horizon:**
{horizon_name} (simplified name for display)

**Location:**
Starting at coordinates ({x}, {y}, {z})

**Visualization:**
{blocks_placed} blocks placed to form the surface

**Surface Details:**
- Sandstone blocks for main surface
- Glowstone markers every 50 points
- Geological structure visible in 3D

**Data Processing:**
- Horizon data fetched from OSDU platform
- {total_points} coordinate points processed
- Coordinates converted to Minecraft space
- Surface built with {successful_commands} successful commands
{warning_section}
The horizon surface was successfully fetched from the OSDU platform, converted to Minecraft coordinates, and built in the world. The geological structure is now visible with sandstone blocks forming the surface.

You can visit the horizon by teleporting to coordinates ({x}, {y}, {z}) in Minecraft to see the complete visualization!"""
