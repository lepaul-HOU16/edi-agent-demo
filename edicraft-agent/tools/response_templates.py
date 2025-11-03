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
    def demo_reset_confirmation() -> str:
        """
        Generate demo reset confirmation response.
        
        Returns:
            Cloudscape-formatted reset confirmation
        """
        return f"""{CloudscapeResponseBuilder.SUCCESS_ICON} **Demo Environment Reset Complete**

**Actions Performed:**
- {CloudscapeResponseBuilder.SUCCESS_ICON} All wellbores cleared
- {CloudscapeResponseBuilder.SUCCESS_ICON} All drilling rigs removed
- {CloudscapeResponseBuilder.SUCCESS_ICON} All markers cleared
- {CloudscapeResponseBuilder.SUCCESS_ICON} World time locked to daytime
- {CloudscapeResponseBuilder.SUCCESS_ICON} Players teleported to spawn

**Status:** Ready for Demo

{CloudscapeResponseBuilder.TIP_ICON} **Tip:** The Minecraft world is now clean and ready for your next demonstration!"""
    
    @staticmethod
    def clear_confirmation(
        wellbores_cleared: int,
        rigs_cleared: int,
        blocks_cleared: int
    ) -> str:
        """
        Generate environment clear confirmation response.
        
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
