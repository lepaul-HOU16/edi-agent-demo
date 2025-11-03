# Demo Reset Tool Guide

## Overview

The `reset_demo_environment()` tool provides a complete reset of the EDIcraft Minecraft demo environment, preparing it for fresh demonstrations by clearing all visualizations and resetting world settings.

## Purpose

This tool is designed for demo presenters who need to quickly reset the Minecraft environment between demonstrations without manually clearing individual elements.

## What It Does

The demo reset tool executes a complete reset sequence:

1. **Clears All Wellbores** - Removes all wellbore trajectory visualizations
2. **Removes All Drilling Rigs** - Clears all drilling rig structures
3. **Clears All Markers** - Removes depth markers and ground-level markers
4. **Locks World Time** - Sets world time to daytime and locks the daylight cycle
5. **Teleports Players** - Moves all players to spawn point (0, 100, 0)

## Usage

### Basic Usage

```python
from tools.workflow_tools import reset_demo_environment

# Reset requires confirmation for safety
result = reset_demo_environment(confirm=True)
```

### Safety Confirmation

The tool requires `confirm=True` to execute. This prevents accidental resets during active demonstrations.

**Without confirmation:**
```python
result = reset_demo_environment(confirm=False)
# Returns warning message, does not execute reset
```

**With confirmation:**
```python
result = reset_demo_environment(confirm=True)
# Executes full reset sequence
```

## User Queries

The EDIcraft agent will use this tool when users say:

- "Reset the demo environment"
- "Reset everything"
- "Prepare for demo"
- "Clean up for new demo"
- "Start fresh"
- "Clear everything and reset"

## Response Format

### Warning Response (No Confirmation)

When called without confirmation, returns a Cloudscape-formatted warning:

```
⚠️ **Demo Reset Confirmation Required**

**Warning:** This operation will:
- Clear ALL wellbores from Minecraft
- Remove ALL drilling rigs
- Clear ALL markers and structures
- Reset world time to daytime
- Teleport all players to spawn

**To proceed, confirm the reset:**
Set `confirm=True` when calling this tool.

💡 **Tip:** This is a safety check to prevent accidental resets during active demonstrations.
```

### Success Response (With Confirmation)

When reset completes successfully:

```
✅ **Demo Environment Reset Complete**

**Actions Performed:**
- ✅ All wellbores cleared
- ✅ All drilling rigs removed
- ✅ All markers cleared
- ✅ World time locked to daytime
- ✅ Players teleported to spawn

**Status:** Ready for Demo

💡 **Tip:** The Minecraft world is now clean and ready for your next demonstration!
```

## Error Handling

The tool handles errors gracefully:

### Clear Operation Failure

If clearing the environment fails:
- Returns error response with details
- Suggests checking Minecraft server connection
- Provides troubleshooting steps

### Time Lock Failure (Non-Critical)

If time lock fails:
- Continues with reset sequence
- Logs warning but doesn't fail entire operation
- Time can be set manually if needed

### Player Teleport Failure (Non-Critical)

If player teleport fails:
- Continues with reset sequence
- Logs warning but doesn't fail entire operation
- Players can teleport manually if needed

## Implementation Details

### Reset Sequence

1. **Confirmation Check**
   - Validates `confirm=True` parameter
   - Returns warning if not confirmed

2. **Clear Environment**
   - Calls `clear_minecraft_environment(area="all", preserve_terrain=True)`
   - Removes wellbore blocks, rig blocks, and markers
   - Preserves natural terrain

3. **Lock World Time**
   - Calls `lock_world_time(time="day", enabled=True)`
   - Sets time to 1000 (daytime)
   - Disables daylight cycle

4. **Teleport Players**
   - Executes RCON command: `tp @a 0 100 0`
   - Moves all players to spawn point

5. **Return Confirmation**
   - Uses `CloudscapeResponseBuilder.demo_reset_confirmation()`
   - Provides formatted success message

### Dependencies

The tool depends on:
- `clear_minecraft_environment()` - For clearing visualizations
- `lock_world_time()` - For setting world time
- `execute_rcon_command()` - For RCON commands
- `CloudscapeResponseBuilder` - For response formatting

## Testing

### Unit Tests

Run the test suite:

```bash
python3 tests/test-demo-reset.py
```

Tests verify:
- Confirmation requirement
- Response format
- Error handling
- Integration with other tools

### Manual Testing

To test manually with a running Minecraft server:

```python
# Test without confirmation (safe)
result = reset_demo_environment(confirm=False)
print(result)  # Should show warning

# Test with confirmation (executes reset)
result = reset_demo_environment(confirm=True)
print(result)  # Should show success confirmation
```

## Best Practices

### When to Use

✅ **Use demo reset when:**
- Starting a new demonstration
- Switching between different demo scenarios
- Cleaning up after testing
- Preparing for stakeholder presentations

### When NOT to Use

❌ **Don't use demo reset when:**
- Demonstrations are in progress
- Multiple users are actively working
- You only need to clear specific elements (use `clear_minecraft_environment` instead)
- You want to preserve some visualizations

### Demo Workflow

Recommended workflow for demonstrations:

1. **Before Demo:**
   ```python
   reset_demo_environment(confirm=True)
   ```

2. **During Demo:**
   - Build visualizations as needed
   - Show features to stakeholders

3. **Between Demos:**
   ```python
   reset_demo_environment(confirm=True)
   ```

4. **After Demo:**
   - Optional: Keep visualizations for review
   - Or reset for next session

## Troubleshooting

### Reset Fails to Clear Environment

**Symptoms:**
- Error message about clearing environment
- Visualizations remain after reset

**Solutions:**
1. Check Minecraft server is running
2. Verify RCON connection
3. Try manual clear: `clear_minecraft_environment(area="all")`
4. Check server logs for errors

### Time Lock Doesn't Work

**Symptoms:**
- World time continues to change
- Night falls after reset

**Solutions:**
1. Manually set time: `/time set day`
2. Manually lock cycle: `/gamerule doDaylightCycle false`
3. Check RCON permissions
4. Verify server operator status

### Players Not Teleported

**Symptoms:**
- Players remain at current location
- Teleport command fails

**Solutions:**
1. Manually teleport: `/tp @a 0 100 0`
2. Check player permissions
3. Verify RCON connection
4. Check server logs

### Reset Takes Too Long

**Symptoms:**
- Reset operation times out
- Partial reset completion

**Solutions:**
1. Reduce area size in clear operation
2. Clear in smaller batches
3. Check server performance
4. Increase timeout settings

## Related Tools

- **clear_minecraft_environment()** - Clear specific areas or elements
- **lock_world_time()** - Control world time independently
- **build_wellbore_trajectory_complete()** - Build wellbore visualizations
- **visualize_collection_wells()** - Batch visualization of multiple wells

## Examples

### Example 1: Quick Demo Reset

```python
# Simple reset for quick demo preparation
result = reset_demo_environment(confirm=True)
print(result)
```

### Example 2: Reset with Verification

```python
# Reset and verify status
result = reset_demo_environment(confirm=True)

if "✅" in result:
    print("Reset successful!")
    # Proceed with demo
else:
    print("Reset failed, check errors")
    # Troubleshoot
```

### Example 3: Conditional Reset

```python
# Only reset if user confirms
user_input = input("Reset demo environment? (yes/no): ")

if user_input.lower() == "yes":
    result = reset_demo_environment(confirm=True)
    print(result)
else:
    print("Reset cancelled")
```

## Summary

The demo reset tool provides a safe, comprehensive way to reset the EDIcraft Minecraft environment for demonstrations. It combines multiple operations into a single command with built-in safety checks and professional response formatting.

**Key Features:**
- ✅ Complete environment reset
- ✅ Safety confirmation requirement
- ✅ Professional Cloudscape formatting
- ✅ Graceful error handling
- ✅ Non-critical operation tolerance
- ✅ Ready-for-demo confirmation

**Use this tool to:**
- Prepare for demonstrations
- Clean up between sessions
- Reset to known good state
- Ensure consistent demo experience
