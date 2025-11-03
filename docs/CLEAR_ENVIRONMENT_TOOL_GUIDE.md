# Clear Environment Tool - User Guide

## Overview

The `clear_minecraft_environment` tool removes wellbore visualizations, drilling rigs, and markers from the Minecraft world to prepare for fresh demonstrations. It provides selective clearing options while preserving the natural terrain.

## Features

- **Selective Clearing**: Clear specific types of structures (wellbores, rigs, markers, or all)
- **Terrain Preservation**: Automatically preserves natural terrain blocks (grass, dirt, stone, water)
- **Professional Responses**: Uses Cloudscape Design System formatting for consistent, clear feedback
- **Error Handling**: Gracefully handles RCON connection failures and partial clears

## Usage

### Basic Usage

Clear all structures:
```
"Clear the Minecraft environment"
"Clean up the world"
"Remove all visualizations"
```

### Selective Clearing

Clear only wellbores:
```
"Clear wellbores"
"Remove all wellbores"
```

Clear only drilling rigs:
```
"Clear rigs"
"Remove drilling rigs"
```

Clear only markers:
```
"Clear markers"
"Remove markers"
```

## Parameters

### `area` (string, default: "all")
Specifies which structures to clear:
- `"all"` - Clear all structures (wellbores, rigs, markers)
- `"wellbores"` - Clear only wellbore blocks (obsidian, glowstone, emerald, diamond)
- `"rigs"` - Clear only rig blocks (iron bars, stone slabs, furnaces, hoppers, chests, signs)
- `"markers"` - Clear only marker blocks (beacons, sea lanterns)

### `preserve_terrain` (boolean, default: True)
Whether to preserve natural terrain blocks:
- `True` - Preserve grass, dirt, stone, water, sand, gravel, clay
- `False` - Clear all blocks (not recommended)

## Block Types

### Wellbore Blocks (Cleared)
- Obsidian (wellbore path)
- Glowstone (markers)
- Emerald blocks (special markers)
- Diamond blocks (wellhead markers)

### Rig Blocks (Cleared)
- Iron bars (derrick structure)
- Smooth stone slabs (platform)
- Furnaces (equipment)
- Hoppers (equipment)
- Chests (equipment)
- Oak signs (signage)

### Marker Blocks (Cleared)
- Beacons (location markers)
- Sea lanterns (lighting)

### Terrain Blocks (Preserved)
- Grass blocks
- Dirt
- Stone
- Water
- Sand
- Gravel
- Clay

## Response Format

### Success Response
```
✅ **Minecraft Environment Cleared**

**Summary:**
- **Wellbores Cleared:** 5
- **Drilling Rigs Removed:** 3
- **Total Blocks Cleared:** 1250
- **Terrain:** Preserved

💡 **Tip:** The environment is now clear and ready for new visualizations!
```

### Error Response
```
❌ **Clear Environment Failed**

**Error Details:**
[Error message]

💡 **Recovery Suggestions:**
1. Check Minecraft server connection
2. Verify RCON is enabled and accessible
3. Try clearing a smaller area
4. Check server logs for errors

Would you like to try one of these options?
```

## Technical Details

### Clear Region
The tool clears a large region centered around spawn:
- X: -500 to 500 (1000 blocks wide)
- Y: 0 to 255 (full height)
- Z: -500 to 500 (1000 blocks deep)

This covers the typical visualization space for most demonstrations.

### RCON Commands
The tool uses Minecraft's `fill` command to replace blocks:
```
fill <x1> <y1> <z1> <x2> <y2> <z2> air replace <block_type>
```

Each block type is cleared individually to ensure accurate tracking of cleared blocks.

### Error Handling
- **RCON Connection Failures**: Tool continues with other block types
- **Partial Clears**: Reports what was successfully cleared
- **Invalid Parameters**: Provides helpful error messages with suggestions

## Integration

### Agent Integration
The tool is integrated into the EDIcraft agent's decision tree:
- Detects keywords: "clear", "remove", "clean", "reset", "delete"
- Routes to `clear_minecraft_environment()` automatically
- Supports both natural language and direct tool calls

### Direct Tool Call Format
```
DIRECT_TOOL_CALL: clear_minecraft_environment("all", True)
DIRECT_TOOL_CALL: clear_minecraft_environment("wellbores", True)
DIRECT_TOOL_CALL: clear_minecraft_environment("rigs", True)
```

## Best Practices

1. **Clear Before Demos**: Always clear the environment before starting a new demonstration
2. **Use Selective Clearing**: Clear only what you need to preserve other structures
3. **Preserve Terrain**: Keep `preserve_terrain=True` to maintain the natural landscape
4. **Verify Results**: Check the response to confirm the number of blocks cleared

## Troubleshooting

### No Blocks Cleared
- **Cause**: No structures exist in the clear region
- **Solution**: This is normal if the environment is already clean

### RCON Connection Errors
- **Cause**: Minecraft server not running or RCON not configured
- **Solution**: Verify server is running and RCON credentials are correct

### Partial Clear
- **Cause**: Some block types failed to clear
- **Solution**: Check server logs and retry the operation

## Requirements Satisfied

This tool satisfies the following requirements from the EDIcraft Demo Enhancements specification:

- **1.1**: Clear environment tool accessible via button and command
- **1.2**: Selective clearing with terrain preservation
- **1.3**: Clear confirmation with block counts
- **1.4**: Area parameter for selective clearing
- **1.5**: Error handling with recovery options
- **11.3**: Cloudscape-formatted responses
- **11.4**: Professional error messages

## Related Tools

- `build_wellbore_trajectory_complete()` - Build wellbore visualizations
- `build_drilling_rig()` - Build drilling rigs (Task 5)
- `reset_demo_environment()` - Complete demo reset (Task 9)
- `lock_world_time()` - Lock world time (Task 4)

## Testing

Run the test suite to verify functionality:
```bash
python3 tests/test-clear-environment.py
```

All tests should pass, even without a Minecraft server (RCON errors are expected and handled gracefully).
