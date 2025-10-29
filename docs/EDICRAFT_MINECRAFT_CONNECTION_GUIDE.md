# EDIcraft Minecraft Connection Guide

## Overview

This guide explains how to connect to the Minecraft server to view EDIcraft visualizations. EDIcraft builds 3D structures in Minecraft, so you need to connect to the server to see your subsurface data visualizations.

---

## Understanding Where Visualizations Appear

### Critical Concept

**EDIcraft visualizations do NOT appear in the web chat interface.**

- ✅ Visualizations are built in the Minecraft server
- ✅ Chat shows text confirmations and coordinates
- ✅ You must connect to Minecraft to see 3D structures
- ❌ No visual artifacts render in the web UI

### The Complete Workflow

```
1. Open web chat → Select EDIcraft agent
   ↓
2. Send command → "Build wellbore trajectory for WELL-001"
   ↓
3. Agent processes → Connects to OSDU, retrieves data
   ↓
4. Agent builds → Creates 3D structure in Minecraft
   ↓
5. Agent confirms → Shows coordinates in chat
   ↓
6. You connect → Open Minecraft and navigate to coordinates
   ↓
7. You explore → See and interact with 3D visualization
```

---

## Connecting to the Minecraft Server

### Prerequisites

**Required:**
- Minecraft Java Edition (version 1.19 or later)
- Valid Minecraft account
- Network access to server

**Optional:**
- Minecraft client mods (for enhanced visualization)
- Voice chat for collaboration

### Connection Steps

#### Step 1: Open Minecraft Java Edition

1. Launch Minecraft Java Edition
2. Click "Multiplayer"
3. Click "Add Server" or "Direct Connect"

#### Step 2: Enter Server Details

**Server Address:**
```
edicraft.nigelgardiner.com:49000
```

**Server Name:** (optional, for your reference)
```
EDIcraft Subsurface Visualization
```

#### Step 3: Connect

1. Click "Done" (if adding server) or "Join Server" (if direct connect)
2. Select the server from your list
3. Click "Join Server"
4. Wait for connection to establish

#### Step 4: Verify Connection

**You should see:**
- Server MOTD (Message of the Day)
- Your player spawns in the world
- Chat messages from server
- Other players (if any)

**If connection fails:**
- Check server address and port
- Verify network connectivity
- See [Troubleshooting](#troubleshooting) section

---

## Navigating to Visualizations

### Using Coordinates from Chat

When EDIcraft builds a visualization, it provides coordinates in the chat response:

**Example Response:**
```
✅ Wellbore trajectory for WELL-001 has been built in Minecraft!

Location: X: 1234, Y: 100, Z: 5678
```

### Teleport Command

**Fastest method to reach visualization:**

```
/tp @s 1234 100 5678
```

**Command breakdown:**
- `/tp` - Teleport command
- `@s` - Yourself (the player)
- `1234` - X coordinate
- `100` - Y coordinate (height)
- `5678` - Z coordinate

**Note:** You may need operator permissions to use teleport commands. Ask server administrator if needed.

### Manual Navigation

**If teleport is not available:**

1. **Check Your Position**
   - Press F3 (or Fn+F3 on Mac)
   - Look for "XYZ" coordinates in debug screen
   - Note your current position

2. **Calculate Direction**
   - Compare your coordinates to target coordinates
   - Positive X = East, Negative X = West
   - Positive Z = South, Negative Z = North

3. **Navigate**
   - Walk, fly, or use elytra
   - Check F3 screen periodically
   - Adjust direction as needed

### Using Waypoints (Optional)

**If you have a waypoint mod installed:**

1. Create waypoint at visualization coordinates
2. Name it (e.g., "WELL-001 Trajectory")
3. Follow waypoint marker
4. Save for future reference

---

## Viewing Visualizations

### Wellbore Trajectories

**What to look for:**
- Colored block path starting at surface (Y=100)
- Path extends downward underground
- Follows wellbore survey data
- Different colors may indicate formations

**Best viewing methods:**
1. **Surface View**
   - Stand at surface coordinates
   - Look down to see entry point
   - Observe trajectory direction

2. **Underground View**
   - Fly down alongside trajectory
   - Use spectator mode: `/gamemode spectator`
   - Follow path through formations

3. **Overview**
   - Fly high above (Y=200+)
   - Look down to see full trajectory
   - Compare with nearby wellbores

### Horizon Surfaces

**What to look for:**
- Solid surface underground
- Represents geological formation boundary
- Color variations indicate depth changes
- Large area coverage (100x100+ blocks)

**Best viewing methods:**
1. **Top View**
   - Fly above surface
   - Look down to see extent
   - Observe color patterns

2. **Cross-Section View**
   - Use spectator mode
   - Fly through surface
   - See depth variations

3. **Edge View**
   - Navigate to surface edge
   - Look across surface
   - Observe topography

### Multiple Visualizations

**When viewing multiple wellbores or horizons:**

1. **Get Overview**
   - Fly high above area
   - Identify all visualizations
   - Note spatial relationships

2. **Compare Features**
   - Navigate between visualizations
   - Observe patterns
   - Identify correlations

3. **Take Screenshots**
   - Press F2 to capture
   - Document findings
   - Share with team

---

## Minecraft Commands for Visualization

### Essential Commands

**Teleport to coordinates:**
```
/tp @s <x> <y> <z>
```

**Change game mode:**
```
/gamemode survival    # Normal mode
/gamemode creative    # Fly and build
/gamemode spectator   # Fly through blocks
```

**Set time of day:**
```
/time set day         # Better visibility
/time set night       # See lighting effects
```

**Set weather:**
```
/weather clear        # Clear visibility
/weather rain         # Atmospheric
```

**Get your position:**
```
/tp @s ~ ~ ~          # Shows current coordinates
```

### Visualization-Specific Commands

**Find nearby visualizations:**
```
/locate structure     # May show custom structures
```

**Mark location:**
```
/setworldspawn        # Set spawn point
```

**Clear area (admin only):**
```
/fill <x1> <y1> <z1> <x2> <y2> <z2> air
```

---

## Collaboration Features

### Viewing with Team Members

**Multiple players can:**
- Connect to server simultaneously
- View same visualizations
- Discuss findings in chat
- Point out features
- Take synchronized screenshots

**Collaboration tips:**
1. **Coordinate viewing times**
   - Schedule sessions
   - Use voice chat
   - Share screen if needed

2. **Use markers**
   - Place blocks to mark features
   - Use signs for labels
   - Create reference points

3. **Document together**
   - Take screenshots
   - Record videos
   - Share observations

### Voice Chat (Optional)

**If server has voice chat mod:**
- Press V to talk (default)
- Proximity-based communication
- Useful for real-time discussion
- Enhances collaboration

---

## Troubleshooting

### Cannot Connect to Server

**Error: "Connection refused"**

**Solutions:**
1. Verify server address: `edicraft.nigelgardiner.com:49000`
2. Check server is running: `telnet edicraft.nigelgardiner.com 49000`
3. Check firewall settings
4. Try direct IP address instead of hostname
5. Contact server administrator

**Error: "Connection timed out"**

**Solutions:**
1. Check internet connection
2. Verify port 49000 is not blocked
3. Try different network (e.g., mobile hotspot)
4. Check with network administrator

**Error: "Outdated client"**

**Solutions:**
1. Update Minecraft to version 1.19+
2. Check server version compatibility
3. Use correct Minecraft edition (Java, not Bedrock)

### Cannot Find Visualization

**Issue: Teleport command doesn't work**

**Solutions:**
1. Check if you have operator permissions
2. Ask administrator for permissions
3. Use manual navigation instead
4. Verify coordinates are correct

**Issue: Visualization not at coordinates**

**Solutions:**
1. Verify you're in correct dimension (Overworld)
2. Check Y coordinate (may be underground)
3. Reload chunks: Press F3+A
4. Verify visualization was built successfully
5. Check chat for error messages

**Issue: Blocks not rendering**

**Solutions:**
1. Increase render distance: Options → Video Settings
2. Reload chunks: F3+A
3. Restart Minecraft client
4. Check graphics settings
5. Update graphics drivers

### Performance Issues

**Issue: Low FPS near visualizations**

**Solutions:**
1. Reduce render distance
2. Lower graphics settings
3. Close other applications
4. Allocate more RAM to Minecraft
5. Use Optifine or performance mods

**Issue: Lag when viewing large surfaces**

**Solutions:**
1. Use spectator mode instead of creative
2. Reduce particle effects
3. Lower render distance temporarily
4. View in sections rather than all at once

---

## Best Practices

### Before Connecting

1. **Get coordinates from chat**
   - Copy coordinates from EDIcraft response
   - Note visualization type (wellbore, horizon, etc.)
   - Save for reference

2. **Plan your viewing**
   - Decide on viewing method (overview, detail, etc.)
   - Prepare commands
   - Set aside adequate time

3. **Check server status**
   - Verify server is online
   - Check for maintenance windows
   - Coordinate with team if needed

### While Connected

1. **Document findings**
   - Take screenshots (F2)
   - Record videos if needed
   - Note observations in chat or external document

2. **Respect server resources**
   - Don't modify visualizations
   - Don't place unnecessary blocks
   - Follow server rules

3. **Collaborate effectively**
   - Share coordinates with team
   - Discuss findings
   - Mark important features

### After Viewing

1. **Save coordinates**
   - Keep record of visualization locations
   - Note what each represents
   - Share with team

2. **Provide feedback**
   - Report any issues
   - Suggest improvements
   - Document use cases

3. **Clean up (if needed)**
   - Remove temporary markers
   - Restore modified areas
   - Leave server tidy

---

## Advanced Viewing Techniques

### Using Spectator Mode

**Benefits:**
- Fly through blocks
- See underground features
- No collision with structures
- Fast navigation

**How to use:**
```
/gamemode spectator
```

**Controls:**
- Fly: Double-tap space
- Speed: Scroll wheel or sprint key
- Phase through blocks: Just fly
- Return to normal: `/gamemode creative` or `/gamemode survival`

### Recording and Screenshots

**Screenshots:**
- Press F2 to capture
- Files saved to `.minecraft/screenshots/`
- Share with team
- Document findings

**Video recording:**
- Use OBS Studio or similar
- Record exploration
- Create tutorials
- Share presentations

**Replay Mod (optional):**
- Install Replay Mod
- Record entire session
- Review later
- Create cinematic views

### Custom Resource Packs

**Enhance visualization:**
- Custom block textures for formations
- Better lighting
- Clearer depth perception
- Professional appearance

**Installation:**
1. Download resource pack
2. Place in `.minecraft/resourcepacks/`
3. Select in Options → Resource Packs
4. Restart Minecraft

---

## Server Information

### Server Details

**Address:** `edicraft.nigelgardiner.com`
**Port:** `49000`
**Version:** Minecraft Java Edition 1.19+
**Game Mode:** Creative/Spectator (for viewing)
**Difficulty:** Peaceful (no mobs)

### Server Rules

1. **Do not modify visualizations**
   - Visualizations are for viewing only
   - Don't break or place blocks in visualization areas
   - Report issues instead of fixing yourself

2. **Respect other players**
   - Don't interfere with others' viewing
   - Use chat appropriately
   - Collaborate professionally

3. **Performance considerations**
   - Don't create lag-inducing structures
   - Limit entity spawning
   - Follow administrator guidance

### Getting Help

**In-game:**
- Ask in chat
- Contact server operators
- Use `/help` command

**External:**
- Check [Troubleshooting Guide](EDICRAFT_TROUBLESHOOTING_GUIDE.md)
- Review [User Workflows](EDICRAFT_USER_WORKFLOWS.md)
- Contact support team

---

## Frequently Asked Questions

### Q: Do I need to connect to Minecraft every time?

**A:** Yes, visualizations only exist in the Minecraft server. The web chat shows confirmations and coordinates, but you must connect to Minecraft to see the actual 3D structures.

### Q: Can I view visualizations offline?

**A:** No, visualizations are built on the live server. You must be connected to the server to view them.

### Q: How long do visualizations persist?

**A:** Visualizations remain in the Minecraft world until manually removed. They persist across server restarts.

### Q: Can I modify visualizations?

**A:** Generally no, unless you have specific permissions. Visualizations should be viewed, not modified.

### Q: What if I don't have Minecraft?

**A:** You need Minecraft Java Edition to view visualizations. The web chat alone cannot display 3D structures.

### Q: Can I use Minecraft Bedrock Edition?

**A:** No, the server requires Minecraft Java Edition. Bedrock Edition is not compatible.

### Q: How do I get operator permissions?

**A:** Contact the server administrator. Operator permissions are required for some commands like teleport.

### Q: Can I invite others to view visualizations?

**A:** Yes, anyone with server access can connect and view visualizations. Share coordinates with team members.

---

## Summary

**Key Points to Remember:**

1. ✅ **Visualizations are in Minecraft, not web chat**
2. ✅ **Connect to server:** `edicraft.nigelgardiner.com:49000`
3. ✅ **Use coordinates from chat response**
4. ✅ **Teleport command:** `/tp @s <x> <y> <z>`
5. ✅ **Spectator mode for best viewing:** `/gamemode spectator`
6. ✅ **Take screenshots to document:** Press F2
7. ✅ **Collaborate with team members**
8. ✅ **Report issues, don't modify visualizations**

**The Complete Process:**

```
Web Chat → Send Command → Agent Builds → Get Coordinates → 
Connect to Minecraft → Navigate to Location → View Visualization
```

**For more information:**
- [User Workflows](EDICRAFT_USER_WORKFLOWS.md) - Complete workflows
- [Quick Start Guide](EDICRAFT_QUICK_START.md) - Getting started
- [Troubleshooting Guide](EDICRAFT_TROUBLESHOOTING_GUIDE.md) - Common issues

---

**Happy exploring! 🎮⛏️**
