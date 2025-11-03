# Time Lock Tool - User Guide

## Overview
The Time Lock Tool allows demo presenters to lock the Minecraft world time to ensure consistent visibility during demonstrations. This is particularly useful when showcasing wellbore trajectories and other visualizations that need to be clearly visible.

## Quick Start

### Lock Time to Daytime
```
"Lock the world time to day"
"Set time to day"
"Keep it daytime"
"Make it always day"
```

### Lock Time to Noon
```
"Lock time to noon"
"Set time to noon"
```

### Unlock Time (Resume Normal Cycle)
```
"Unlock the time"
"Resume normal day/night cycle"
"Enable daylight cycle"
```

## Supported Time Values

| Time Value | Minecraft Time | Description |
|------------|----------------|-------------|
| day, morning | 1000 | Early morning, sun rising |
| noon, midday | 6000 | High noon, brightest time |
| afternoon | 9000 | Late afternoon |
| sunset, dusk | 12000 | Sunset, sun setting |
| night | 13000 | Early night |
| midnight | 18000 | Midnight, darkest time |

## Use Cases

### Demo Preparation
Before starting a demo, lock the time to ensure consistent lighting:
```
"Lock time to noon"
```

### Wellbore Visualization
When building wellbores, lock time for best visibility:
```
"Set time to day and lock it"
```

### Night Demonstrations
For special effects or night-time demonstrations:
```
"Lock time to night"
```

### Resume Normal Gameplay
After demo, resume normal day/night cycle:
```
"Unlock the time"
```

## Response Format

### Success Response
```
✅ World Time Locked

Settings:
- Current Time: Day
- Daylight Cycle: Disabled
- Status: Time is locked

💡 Tip: Visualizations will always be visible in daylight!
```

### Error Response
```
❌ Time Lock Failed

Error Details:
Invalid time value: invalid_time

💡 Recovery Suggestions:
1. Use 'day' or 'morning' for daytime (1000)
2. Use 'noon' or 'midday' for noon (6000)
3. Use 'afternoon' for afternoon (9000)
4. Use 'sunset' or 'dusk' for sunset (12000)
5. Use 'night' for nighttime (13000)
6. Use 'midnight' for midnight (18000)

Would you like to try one of these options?
```

## Technical Details

### RCON Commands Used
- `time set <value>` - Sets the world time
- `gamerule doDaylightCycle false` - Locks the time
- `gamerule doDaylightCycle true` - Unlocks the time

### Requirements
- Minecraft server must be running
- RCON must be enabled and accessible
- User must have operator permissions (for gamerule commands)

## Troubleshooting

### Time Lock Not Working
**Problem:** Time continues to change after locking

**Solutions:**
1. Verify RCON connection is working
2. Check operator permissions
3. Try manual command: `/gamerule doDaylightCycle false`
4. Restart Minecraft server if needed

### Invalid Time Value Error
**Problem:** Received error about invalid time value

**Solutions:**
1. Use one of the supported time values (see table above)
2. Check spelling of time value
3. Use lowercase for time values

### RCON Connection Failed
**Problem:** Cannot connect to Minecraft server

**Solutions:**
1. Verify Minecraft server is running
2. Check RCON is enabled in server.properties
3. Verify RCON port and password are correct
4. Check firewall settings

## Best Practices

### For Demos
1. **Lock time before demo starts** - Ensures consistent lighting throughout
2. **Use noon for best visibility** - Brightest time, no shadows
3. **Unlock after demo** - Return to normal gameplay

### For Development
1. **Lock time during testing** - Consistent conditions for testing
2. **Use day for general work** - Good visibility without being too bright
3. **Test at different times** - Verify visualizations work at all times

### For Presentations
1. **Lock time at start** - No surprises during presentation
2. **Choose appropriate time** - Match the mood/theme of presentation
3. **Document time setting** - Include in presentation notes

## Integration with Other Tools

### With Clear Environment Tool
```
1. Clear the environment
2. Lock time to day
3. Build new visualizations
```

### With Demo Reset Tool
The demo reset tool automatically locks time to day as part of the reset sequence.

### With Wellbore Builder
Lock time before building wellbores for consistent visibility:
```
1. Lock time to noon
2. Build wellbore trajectory
3. Verify visualization
```

## Examples

### Complete Demo Setup
```
User: "Lock time to noon"
Agent: ✅ World Time Locked (noon, cycle disabled)

User: "Build wellbore WELL-007"
Agent: ✅ Wellbore built successfully

User: "Clear the environment"
Agent: ✅ Environment cleared

User: "Unlock the time"
Agent: ✅ World Time Unlocked (cycle enabled)
```

### Quick Time Change
```
User: "Set time to sunset"
Agent: ✅ World Time Locked (sunset, cycle disabled)

User: "Actually, make it noon"
Agent: ✅ World Time Locked (noon, cycle disabled)
```

### Error Recovery
```
User: "Lock time to evening"
Agent: ❌ Invalid time value: evening
       💡 Try: day, noon, afternoon, sunset, night, midnight

User: "Lock time to afternoon"
Agent: ✅ World Time Locked (afternoon, cycle disabled)
```

## FAQ

**Q: Does time lock affect all players?**
A: Yes, time lock affects the entire Minecraft world for all players.

**Q: Can I change the time while it's locked?**
A: Yes, you can change to a different time value while locked. The new time will be locked.

**Q: What happens if I unlock the time?**
A: The day/night cycle resumes from the current time and progresses normally.

**Q: Does time lock persist after server restart?**
A: No, time lock settings are reset when the server restarts. You'll need to lock time again.

**Q: Can I lock time to a specific numeric value?**
A: Currently, only named time values are supported (day, noon, etc.). Use the closest named value.

**Q: Does time lock affect mob spawning?**
A: Yes, locking time to day prevents hostile mob spawning (which requires darkness).

## Summary

The Time Lock Tool is a simple but powerful feature for demo presenters. It ensures consistent lighting conditions, making visualizations always visible and presentations more professional. Use it at the start of demos, unlock it when done, and enjoy worry-free demonstrations!
