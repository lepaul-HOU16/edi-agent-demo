# Reset as Workaround for Clear Failure

## Problem

The `clear_minecraft_environment()` operation was failing (hanging, timing out, or erroring), which caused the `reset_demo_environment()` to also fail since it calls clear internally.

Users wanted to use reset as an alternative to clear, but reset was failing at the same point.

## Solution

Modified `reset_demo_environment()` to **treat clear failures as non-critical** with a **15-second timeout**, similar to how it already handles time lock and teleport failures.

### Key Features

1. **15-second timeout** - Clear operation is forcibly stopped after 15 seconds
2. **Non-critical failure** - Reset continues even if clear times out or fails
3. **Clear feedback** - User knows if clear succeeded, failed, or timed out

### Changes Made

#### 1. workflow_tools.py - Make Clear Non-Critical

**Before:**
```python
clear_result = clear_minecraft_environment(area="all", preserve_terrain=True)

if CloudscapeResponseBuilder.ERROR_ICON in clear_result:
    print(f"[DEMO_RESET] Clear operation failed: {clear_result}")
    return CloudscapeResponseBuilder.error_response(...)  # FAILS ENTIRE RESET
```

**After:**
```python
clear_success = False
try:
    # Use a timeout to prevent clear from hanging the entire reset
    import signal
    
    def timeout_handler(signum, frame):
        raise TimeoutError("Clear operation timed out")
    
    # Set 15 second timeout for clear operation
    signal.signal(signal.SIGALRM, timeout_handler)
    signal.alarm(15)
    
    try:
        clear_result = clear_minecraft_environment(area="all", preserve_terrain=True)
        signal.alarm(0)  # Cancel the alarm
        
        if CloudscapeResponseBuilder.ERROR_ICON in clear_result:
            print(f"[DEMO_RESET] Clear operation failed (non-critical): {clear_result}")
        else:
            print(f"[DEMO_RESET] Environment cleared successfully")
            clear_success = True
    except TimeoutError:
        signal.alarm(0)  # Cancel the alarm
        print(f"[DEMO_RESET] Clear operation timed out after 15 seconds (non-critical)")
        
except Exception as e:
    print(f"[DEMO_RESET] Error during clear (non-critical): {str(e)}")
```

#### 2. response_templates.py - Add Clear Status Parameter

**Before:**
```python
def demo_reset_confirmation() -> str:
    return f"""✅ **Demo Environment Reset Complete**
    
**Actions Performed:**
- ✅ All wellbores cleared
- ✅ All drilling rigs removed
- ✅ All markers cleared
...
```

**After:**
```python
def demo_reset_confirmation(clear_success: bool = True) -> str:
    clear_icon = SUCCESS_ICON if clear_success else WARNING_ICON
    clear_status = "All wellbores cleared" if clear_success else "Clear operation skipped (failed)"
    
    return f"""✅ **Demo Environment Reset Complete**
    
**Actions Performed:**
- {clear_icon} {clear_status}
- {clear_icon} {rig_status}
- {clear_icon} {marker_status}
- ✅ World time locked to daytime
- ✅ Players teleported to spawn

**Status:** Ready for Demo{' (manual clear may be needed)' if not clear_success else ''}
```

#### 3. workflow_tools.py - Pass Clear Status

```python
return CloudscapeResponseBuilder.demo_reset_confirmation(clear_success=clear_success)
```

## Behavior

### When Clear Succeeds

```
✅ Demo Environment Reset Complete

Actions Performed:
- ✅ All wellbores cleared
- ✅ All drilling rigs removed
- ✅ All markers cleared
- ✅ World time locked to daytime
- ✅ Players teleported to spawn

Status: Ready for Demo

💡 Tip: The Minecraft world is now clean and ready for your next demonstration!
```

### When Clear Fails

```
✅ Demo Environment Reset Complete

Actions Performed:
- ⚠️  Clear operation skipped (failed)
- ⚠️  Rig removal skipped (clear failed)
- ⚠️  Marker clearing skipped (clear failed)
- ✅ World time locked to daytime
- ✅ Players teleported to spawn

Status: Ready for Demo (manual clear may be needed)

💡 Tip: The world time is locked and players are at spawn. You may need to manually clear structures if needed.
```

## Benefits

1. **Reset always completes** - Even if clear fails, time lock and teleport still work
2. **Useful for demos** - Time lock and spawn position are often more important than clearing
3. **Clear feedback** - User knows exactly what succeeded and what failed
4. **Manual fallback** - User can manually clear if needed
5. **No hanging** - Reset won't hang waiting for clear to complete

## Use Cases

### Scenario 1: Clear Hangs
- User clicks "Reset the demo environment"
- Clear operation times out after **15 seconds** (forced timeout)
- Reset continues with time lock and teleport
- User gets feedback that clear timed out
- Demo can proceed with time locked and players at spawn
- **Total reset time: ~20 seconds** (15s timeout + 5s for other operations)

### Scenario 2: RCON Connection Issues
- RCON connection is unstable
- Clear commands fail intermittently
- Reset still locks time and teleports players
- User can retry clear separately or manually

### Scenario 3: Demo Preparation
- User needs consistent lighting for demo
- User needs players at spawn
- Clearing structures is secondary
- Reset provides the critical functionality even if clear fails

## Testing

Run the test documentation:
```bash
node tests/test-reset-with-clear-failure.js
```

Manual test:
1. In EDIcraft chat: "Reset the demo environment"
2. If clear fails, verify:
   - ⚠️  Clear operations show warning icons
   - ✅ Time lock succeeds
   - ✅ Teleport succeeds
   - Response indicates manual clear may be needed
3. Verify in Minecraft:
   - Time is locked to daytime
   - Players are at spawn (0, 100, 0)

## Future Improvements

1. **Retry clear with smaller batches** - If full clear fails, try clearing in smaller chunks
2. **Partial clear** - Clear what can be cleared, report what failed
3. **Clear status check** - Query Minecraft to see what structures exist before/after
4. **Alternative clear methods** - Use different RCON commands or approaches

## Related Issues

- `.kiro/specs/fix-edicraft-rcon-reliability/` - RCON reliability improvements
- `CLEAR_OPERATION_TROUBLESHOOTING.md` - Clear operation debugging
- `RCON_RELIABILITY_DEPLOYMENT_READY.md` - RCON executor enhancements

## Conclusion

This change makes `reset_demo_environment()` more resilient by treating clear failures as non-critical, allowing the reset to complete its other important functions (time lock, teleport) even when clear fails.

Users can now use reset as a workaround when clear fails, getting at least partial functionality for their demos.
