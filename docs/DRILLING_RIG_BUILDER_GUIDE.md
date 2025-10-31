# Drilling Rig Builder Tool Guide

## Overview

The `build_drilling_rig()` tool creates realistic drilling rig structures in Minecraft at wellhead locations. This enhances the visual appeal of wellbore visualizations and makes demonstrations more impressive.

## Features

- **Derrick Tower**: 12-18 block high iron bar structure
- **Platform**: 3x3 to 7x7 smooth stone slab base
- **Equipment**: Furnaces, hoppers, and chests for realism
- **Signage**: Oak signs with well names
- **Lighting**: Glowstone blocks for visibility
- **Style Variations**: Compact, standard, and detailed options

## Usage

### Basic Usage

```python
from tools.workflow_tools import build_drilling_rig

# Build a standard rig at wellhead
result = build_drilling_rig(
    x=100,
    y=100,
    z=100,
    well_name="WELL-007",
    rig_style="standard"
)
```

### Parameters

- **x** (int): X coordinate of wellhead
- **y** (int): Y coordinate (ground level, typically 100)
- **z** (int): Z coordinate of wellhead
- **well_name** (str): Short well name for signage (e.g., "WELL-007")
- **rig_style** (str): "standard" (default), "compact", or "detailed"

### Rig Styles

#### Compact
- **Platform**: 3x3 smooth stone slabs
- **Derrick**: 12 blocks high
- **Equipment**: Furnace, hopper
- **Best for**: Limited space, multiple wells close together

#### Standard (Default)
- **Platform**: 5x5 smooth stone slabs
- **Derrick**: 15 blocks high
- **Equipment**: Furnace, hopper, chest
- **Best for**: General use, balanced size

#### Detailed
- **Platform**: 7x7 smooth stone slabs
- **Derrick**: 18 blocks high
- **Equipment**: Furnace, hopper, chest
- **Best for**: Showcase demonstrations, single well focus

## Structure Components

### 1. Platform
- Built at ground level (Y coordinate)
- Smooth stone slabs for clean appearance
- Includes stairs for access
- Size varies by rig style

### 2. Derrick
- Iron bar frame structure
- 4 corner posts
- Horizontal cross-beams at top
- Height varies by rig style

### 3. Equipment
- **Furnace**: Represents drilling equipment
- **Hopper**: Represents material handling
- **Chest**: Represents storage (standard/detailed only)

### 4. Signage
- Oak sign at platform edge
- Displays well name
- Automatically uses simplified names

### 5. Lighting
- Glowstone at platform corners
- Glowstone at derrick top
- Ensures visibility at all times

## Integration with Other Tools

### With Wellbore Builder

The drilling rig builder is designed to work seamlessly with the wellbore trajectory builder:

```python
# Build wellbore trajectory
wellbore_result = build_wellbore_trajectory_complete("WELL-007")

# Add drilling rig at wellhead
rig_result = build_drilling_rig(
    x=wellhead_x,
    y=100,
    z=wellhead_z,
    well_name="WELL-007",
    rig_style="standard"
)
```

### With Name Simplification

The tool automatically simplifies OSDU IDs:

```python
# Full OSDU ID is automatically simplified
result = build_drilling_rig(
    x=100,
    y=100,
    z=100,
    well_name="osdu:work-product-component--WellboreTrajectory:WELL-007:abc123",
    rig_style="standard"
)
# Signage will show "WELL-007"
```

## Response Format

The tool returns a Cloudscape-formatted response with:

- **Success indicator** (✅)
- **Details section**: Well name, rig style, blocks placed, commands executed
- **Structure section**: Platform size, derrick height, equipment list, lighting, signage
- **Location section**: Coordinates, platform level, derrick top
- **Tip section**: Teleport command for easy access

### Example Response

```
✅ **Drilling Rig Built Successfully**

**Details:**
- **Well Name:** WELL-007
- **Rig Style:** Standard
- **Blocks Placed:** 45
- **Commands Executed:** 17

**Structure:**
- **Platform:** 5x5 smooth stone slabs
- **Derrick:** 15 blocks high, iron bars
- **Equipment:** furnace, hopper, chest
- **Lighting:** Glowstone at corners and top
- **Signage:** Oak sign with well name

**Location:**
- **Coordinates:** (100, 100, 100)
- **Platform Level:** Y=100
- **Derrick Top:** Y=115

💡 **Tip:** The drilling rig is now visible in Minecraft! You can teleport to it using `/tp @s 100 102 100`
```

## Error Handling

### Invalid Rig Style

```python
result = build_drilling_rig(
    x=100, y=100, z=100,
    well_name="WELL-007",
    rig_style="invalid"
)
# Returns error with suggestions for valid styles
```

### RCON Connection Issues

If the Minecraft server is not accessible, the tool will:
- Continue executing commands (graceful degradation)
- Track what was attempted
- Return error response with recovery suggestions

## Best Practices

### 1. Spacing Between Rigs

When building multiple rigs, maintain adequate spacing:
- **Compact rigs**: 10-15 blocks apart
- **Standard rigs**: 20-30 blocks apart
- **Detailed rigs**: 40-50 blocks apart

### 2. Ground Level Consistency

Always use Y=100 for ground level to maintain consistency across visualizations.

### 3. Style Selection

- Use **compact** for collections with many wells
- Use **standard** for general demonstrations
- Use **detailed** for single well showcases

### 4. Naming Convention

Use simplified well names (e.g., "WELL-007") for clarity in signage.

## Demo Workflow

### Complete Wellbore + Rig Workflow

```python
# 1. Build wellbore trajectory
wellbore_result = build_wellbore_trajectory_complete("WELL-007")

# 2. Extract wellhead coordinates from result
# (Typically at ground level, Y=100)

# 3. Build drilling rig at wellhead
rig_result = build_drilling_rig(
    x=wellhead_x,
    y=100,
    z=wellhead_z,
    well_name="WELL-007",
    rig_style="standard"
)

# 4. Lock world time for visibility
time_result = lock_world_time(time="day", enabled=True)
```

### Collection Visualization with Rigs

```python
# Visualize multiple wells with rigs
wells = ["WELL-001", "WELL-002", "WELL-003"]
spacing = 30  # blocks between wells

for i, well in enumerate(wells):
    x = i * spacing
    z = 0
    
    # Build wellbore
    build_wellbore_trajectory_complete(well)
    
    # Build rig
    build_drilling_rig(x, 100, z, well, "standard")
```

## Troubleshooting

### Rig Not Visible

1. Check coordinates are correct
2. Verify Y=100 is ground level in your world
3. Ensure world time is set to day
4. Check RCON connection

### Signage Not Showing Text

Sign text setting via RCON may not work on all servers. The sign block will be placed, but text may need manual setting.

### Equipment Missing

If equipment blocks don't place, check:
- Server has required block types
- No existing blocks at those positions
- RCON permissions are correct

## Related Tools

- `build_wellbore_trajectory_complete()`: Build wellbore trajectories
- `clear_minecraft_environment()`: Clear rigs and wellbores
- `lock_world_time()`: Set consistent lighting
- `WellNameSimplifier`: Simplify well names for signage

## Testing

Run the test suite to verify functionality:

```bash
python3 tests/test-drilling-rig-builder.py
```

This tests:
- Standard, compact, and detailed rig styles
- Invalid style error handling
- OSDU ID simplification
- Cloudscape response formatting
