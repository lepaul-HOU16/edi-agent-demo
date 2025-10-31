# EDIcraft Agent User Workflows

## Overview

This document describes the complete user workflows for the EDIcraft agent, from submitting a query to seeing visualizations in Minecraft. It covers all major use cases and provides step-by-step instructions for each workflow.

**Important:** EDIcraft visualizations appear in Minecraft, not in the web chat interface. The chat provides text confirmations and coordinates, but you must connect to the Minecraft server to see the actual 3D visualizations.

## Table of Contents

1. [Getting Started - Welcome Message](#getting-started---welcome-message)
2. [Demo Environment Management](#demo-environment-management)
3. [Collection-Based Visualization](#collection-based-visualization)
4. [Wellbore Trajectory Visualization](#wellbore-trajectory-visualization)
5. [Horizon Surface Rendering](#horizon-surface-rendering)
6. [Player Position Tracking](#player-position-tracking)
7. [Coordinate Transformation](#coordinate-transformation)
8. [Multi-Wellbore Visualization](#multi-wellbore-visualization)
9. [OSDU Data Exploration](#osdu-data-exploration)
10. [Troubleshooting Workflows](#troubleshooting-workflows)

---

## Getting Started - Welcome Message

### First Interaction

When you first open the EDIcraft chat or send an initial greeting, you'll see a professional welcome message that explains the agent's capabilities.

#### What to Expect

**Example Welcome Message:**

```
Hello! 🎮⛏️ I'm your EDIcraft agent, ready to bring subsurface data to life in Minecraft.

**What I Can Help With:**

🔍 **Wellbore Trajectories**
   • Search and retrieve wellbore data from OSDU
   • Calculate 3D paths from survey data
   • Build complete wellbore visualizations in Minecraft

🌍 **Geological Horizons**
   • Find horizon surface data
   • Process large coordinate datasets
   • Create solid underground surfaces

🎮 **Minecraft Integration**
   • Transform real-world coordinates to Minecraft space
   • Track player positions
   • Build structures in real-time

I'm connected and ready to visualize your subsurface data. What would you like to explore?
```

#### Understanding the Welcome Message

**Key Points:**

1. **No Server Details Exposed**
   - The welcome message does NOT show server URLs or ports
   - Technical details are hidden for professional presentation
   - Focus is on capabilities, not infrastructure

2. **Capabilities Overview**
   - Clear categories of what the agent can do
   - Examples of specific tasks
   - Friendly, accessible language

3. **Ready Status**
   - Confirms agent is connected
   - Indicates readiness to process requests
   - Invites you to start exploring

#### When You See the Welcome Message

The welcome message appears when:
- You first open the EDIcraft chat
- You send an empty or greeting message (e.g., "hello", "hi")
- The agent hasn't received a specific task command yet

**This is normal!** The welcome message means the agent is ready and waiting for your command.

#### Moving Beyond the Welcome Message

To trigger actual visualization, send a specific command:

**Example Commands:**
```
Build wellbore trajectory for WELL-001
```

```
Visualize horizon surface in Minecraft
```

```
Search for wellbores in the area
```

**Remember:** The welcome message is just the starting point. To see visualizations, you need to:
1. Give a specific command
2. Wait for the agent to build in Minecraft
3. Connect to Minecraft to see the results

---

## Demo Environment Management

### Overview

EDIcraft provides powerful tools for managing the Minecraft demo environment, making it easy to prepare for demonstrations, clear visualizations, and maintain a clean workspace.

### Clear Environment Button

The chat interface includes a "Clear Minecraft Environment" button when the EDIcraft agent is active. This button provides quick access to environment clearing without typing commands.

#### Using the Clear Button

1. **Locate the Button**
   - Appears in the chat interface when EDIcraft agent is selected
   - Positioned prominently for easy access during demos
   - Shows loading state while clearing

2. **Click to Clear**
   - Click the button to clear the environment
   - Confirmation message appears in chat
   - Shows number of blocks cleared

3. **View Results**
   - Chat displays summary of cleared structures
   - Minecraft environment is immediately clean
   - Ready for new visualizations

#### When to Use the Clear Button

✅ **Use the clear button when:**
- Testing the same wellbore repeatedly
- Switching between different visualizations
- Preparing for a new demonstration
- Removing visual clutter

❌ **Don't use when:**
- You want to preserve some structures
- Multiple users are working simultaneously
- You need selective clearing (use commands instead)

### Clear Environment Command

For more control, use text commands to clear the environment:

#### Basic Clear Commands

**Clear Everything:**
```
"Clear the Minecraft environment"
"Clean up the world"
"Remove all visualizations"
```

**Clear Specific Elements:**
```
"Clear wellbores"
"Remove drilling rigs"
"Clear markers"
```

#### Clear Options

The clear environment tool supports several options:

**Selective Clearing:**
- `"all"` - Clear all structures (wellbores, rigs, markers)
- `"wellbores"` - Clear only wellbore blocks
- `"rigs"` - Clear only drilling rig structures
- `"markers"` - Clear only depth and ground markers

**Terrain Preservation:**
- Automatically preserves natural terrain (grass, dirt, stone, water)
- Ensures landscape remains intact
- Only removes visualization structures

#### Clear Response Format

```
✅ **Minecraft Environment Cleared**

**Summary:**
- **Wellbores Cleared:** 5
- **Drilling Rigs Removed:** 3
- **Total Blocks Cleared:** 1250
- **Terrain:** Preserved

💡 **Tip:** The environment is now clear and ready for new visualizations!
```

### Time Lock Command

Lock the Minecraft world time to ensure consistent visibility during demonstrations.

#### Time Lock Commands

**Lock to Daytime:**
```
"Lock the world time to day"
"Set time to day"
"Keep it daytime"
```

**Lock to Noon:**
```
"Lock time to noon"
"Set time to noon"
```

**Unlock Time:**
```
"Unlock the time"
"Resume normal day/night cycle"
```

#### Supported Time Values

| Command | Minecraft Time | Description |
|---------|----------------|-------------|
| day, morning | 1000 | Early morning |
| noon, midday | 6000 | High noon (brightest) |
| afternoon | 9000 | Late afternoon |
| sunset, dusk | 12000 | Sunset |
| night | 13000 | Early night |
| midnight | 18000 | Midnight |

#### Time Lock Response

```
✅ **World Time Locked**

**Settings:**
- **Current Time:** Day
- **Daylight Cycle:** Disabled
- **Status:** Time is locked

💡 **Tip:** Visualizations will always be visible in daylight!
```

### Collection Visualization

Visualize all wellbores from a collection in a single command.

#### Collection Visualization Commands

**Visualize Entire Collection:**
```
"Visualize all wells from collection-123"
"Show me all wellbores in the collection"
"Build all wells from this collection"
```

**Custom Spacing:**
```
"Visualize collection with 75-block spacing"
"Show collection wells with wide spacing"
```

#### Collection Visualization Features

**Grid Layout:**
- Wellbores arranged in organized grid pattern
- Automatic spacing calculation
- Centered around origin (0, 0)
- Prevents overlapping structures

**Batch Processing:**
- Processes wells in batches (default: 5 at a time)
- Shows real-time progress updates
- Continues even if individual wells fail
- Provides detailed summary at completion

**Progress Updates:**
```
⏳ **Building Well 5 of 24**

**Current Well:** WELL-005
**Status:** Processing trajectory data...
**Progress:** 21% complete
```

**Completion Summary:**
```
✅ **Collection Visualization Complete**

**Collection:** collection-123

**Summary:**
- **Total Wells:** 24
- **Successfully Built:** 24
- **Failed:** 0
- **Success Rate:** 100%

💡 **Tip:** All wellbores are now visible in Minecraft! You can explore the collection in 3D.
```

### Demo Reset Command

Reset the entire demo environment with a single command.

#### Demo Reset Commands

**Full Reset:**
```
"Reset the demo environment"
"Reset everything"
"Prepare for demo"
```

#### What Demo Reset Does

The demo reset performs a complete reset sequence:

1. **Clears All Wellbores** - Removes all trajectory visualizations
2. **Removes All Drilling Rigs** - Clears all rig structures
3. **Clears All Markers** - Removes depth and ground markers
4. **Locks World Time** - Sets to daytime and locks cycle
5. **Teleports Players** - Moves all players to spawn (0, 100, 0)

#### Demo Reset Response

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

#### Safety Confirmation

Demo reset requires confirmation to prevent accidental resets:

**Without Confirmation:**
```
⚠️ **Demo Reset Confirmation Required**

**Warning:** This operation will clear ALL structures and reset the world.

**To proceed:** Confirm the reset when prompted.
```

### Demo Workflow Best Practices

#### Before Demo

1. **Reset Environment:**
   ```
   "Reset the demo environment"
   ```

2. **Verify Clean State:**
   - Check Minecraft world is clear
   - Confirm time is locked to day
   - Verify spawn point is accessible

3. **Prepare Collection (if needed):**
   - Load collection context in chat
   - Verify collection data is accessible

#### During Demo

1. **Build Visualizations:**
   ```
   "Visualize all wells from collection-123"
   ```
   Or:
   ```
   "Build wellbore WELL-007"
   ```

2. **Show Features:**
   - Navigate to visualizations in Minecraft
   - Explain structures and data
   - Demonstrate drilling rigs and markers

3. **Clear Between Sections:**
   - Use clear button for quick cleanup
   - Or use selective clearing commands

#### After Demo

1. **Optional Cleanup:**
   ```
   "Clear the Minecraft environment"
   ```

2. **Or Keep for Review:**
   - Leave visualizations for stakeholder review
   - Document coordinates for future reference

#### Between Demos

1. **Full Reset:**
   ```
   "Reset the demo environment"
   ```

2. **Verify Ready State:**
   - Clean environment
   - Daytime locked
   - Players at spawn

### Enhanced Wellbore Visualizations

All wellbore visualizations now include enhanced features:

#### Drilling Rigs

Every wellbore automatically includes a drilling rig at the wellhead:

**Rig Components:**
- **Derrick:** 15-block high iron bar tower
- **Platform:** 5×5 smooth stone slab base
- **Equipment:** Furnaces, hoppers, chests for detail
- **Signage:** Oak signs with simplified well names
- **Lighting:** Glowstone blocks for visibility

**Rig Styles:**
- Standard: Full-featured rig with all components
- Compact: Smaller rig for dense visualizations
- Detailed: Extra equipment and visual detail

#### Simplified Well Names

Wellbores display user-friendly names instead of long OSDU IDs:

**Name Simplification:**
- `osdu:work-product--Wellbore:WELL-007:...` → `WELL-007`
- `osdu:master-data--Wellbore:12345...` → `WELL-12345`

**Benefits:**
- Easier to read and reference
- Better for demonstrations
- Clearer signage in Minecraft
- Maintains mapping to full OSDU IDs

#### Color Coding

Wellbores use color-coded blocks for easy identification:

**Color Scheme:**
- Different colors for different wells
- Consistent colors per well
- Easy visual distinction
- Professional appearance

#### Depth Markers

Wellbores include depth markers at regular intervals:

**Marker Features:**
- Placed every 500 meters (25 blocks)
- Show depth labels on signs
- Use glowstone for visibility
- Help understand well depth

#### Ground-Level Markers

Surface markers show well locations:

**Surface Markers:**
- Distinct blocks at wellhead
- Easy to spot from distance
- Show well name on signs
- Connect to drilling rig

### Collection Context Retention

When working with collections, the "Create New Chat" button retains collection context:

#### How It Works

1. **Open Collection Canvas:**
   - Create canvas from collection
   - Collection context loads automatically
   - Badge displays collection name

2. **Create New Chat:**
   - Click "Create New Chat" button
   - New canvas inherits collection context
   - Badge appears immediately
   - Same collection scope maintained

3. **Multiple Canvases:**
   - Create multiple canvases from same collection
   - Each has independent chat history
   - All share same collection scope
   - Easy to organize work by topic

#### Benefits

**Faster Workflow:**
- No need to reload collection context
- Quick canvas creation
- Seamless context switching

**Better Organization:**
- Separate canvases for different analyses
- Maintain collection scope across canvases
- Easy to find related work

**Consistent Experience:**
- Collection badge always visible
- Same data access across canvases
- Predictable behavior

---

## Understanding Visualization Location

### Critical Concept: Where Visualizations Appear

**EDIcraft visualizations do NOT appear in the web chat interface.**

Instead:
- ✅ Visualizations appear in the Minecraft server
- ✅ Chat shows text confirmations and coordinates
- ✅ You must connect to Minecraft to see 3D structures
- ❌ No visual artifacts render in the web UI

### The Workflow

```
1. You send command in web chat
   ↓
2. Agent processes request
   ↓
3. Agent builds structure in Minecraft
   ↓
4. Agent confirms in chat with coordinates
   ↓
5. You connect to Minecraft to see it
```

### Example Interaction

**You type in chat:**
```
Build wellbore trajectory for WELL-001
```

**Agent responds in chat:**
```
✅ Wellbore trajectory for WELL-001 has been built in Minecraft!

The wellbore path starts at ground level and extends 2,500 meters underground,
following the survey data from OSDU.

🎮 Connect to the Minecraft server to explore the visualization in 3D.

Coordinates: X: 1234, Y: 100, Z: 5678
```

**What you see in chat:** Text confirmation only
**What you see in Minecraft:** Actual 3D wellbore structure

### Connecting to Minecraft

To see your visualizations:

1. **Open Minecraft Client**
   - Java Edition required
   - Version 1.19 or later

2. **Connect to Server**
   - Server: `edicraft.nigelgardiner.com`
   - Port: `49000`

3. **Navigate to Coordinates**
   - Use coordinates from chat response
   - Command: `/tp @s 1234 100 5678`
   - Or fly/walk to location

4. **View Visualization**
   - See 3D structure
   - Explore from different angles
   - Interact with environment

---

## Wellbore Trajectory Visualization

### Use Case

Visualize a wellbore's 3D trajectory in Minecraft to understand its path through subsurface formations.

### Prerequisites

- EDIcraft agent deployed and configured
- Access to OSDU platform with wellbore data
- Minecraft server running at `edicraft.nigelgardiner.com`
- Minecraft client connected to server (optional, for viewing)

### Workflow Steps

#### Step 1: Open Chat Interface

1. Navigate to the web application
2. Click on the chat interface
3. Verify you're logged in

#### Step 2: Select EDIcraft Agent (Optional)

The agent router will automatically select EDIcraft for Minecraft queries, but you can manually select it:

1. Click the agent switcher dropdown
2. Select "EDIcraft"
3. The agent icon should update to show EDIcraft

#### Step 3: Submit Query

Enter one of these queries:

**Option A: Specific Wellbore**
```
Get wellbore data from well001 and visualize it in minecraft
```

**Option B: Search and Visualize**
```
Find wellbores in the North Sea and show the first one in minecraft
```

**Option C: With Location**
```
Build wellbore trajectory for well001 at spawn in minecraft
```

#### Step 4: Monitor Execution

Watch the thought steps appear in real-time:

1. **Analysis Phase**
   - "Analyzing query..."
   - "Determining required OSDU data..."
   - Status: Complete

2. **Data Retrieval Phase**
   - "Connecting to OSDU platform..."
   - "Searching for wellbore: well001..."
   - "Retrieving wellbore trajectory data..."
   - Status: Complete

3. **Processing Phase**
   - "Transforming UTM coordinates to Minecraft coordinates..."
   - "Calculating trajectory path..."
   - "Preparing build commands..."
   - Status: Complete

4. **Execution Phase**
   - "Connecting to Minecraft server via RCON..."
   - "Building wellbore trajectory..."
   - "Placing blocks at coordinates..."
   - Status: Complete

#### Step 5: Review Response

The agent will return a message like:

```
✅ Wellbore trajectory for WELL-001 has been built in Minecraft!

The wellbore path starts at ground level and extends 2,500 meters underground,
following the survey data from OSDU.

🎮 Connect to the Minecraft server to explore the visualization in 3D.

Location: X: 1234, Y: 100, Z: 5678
Depth: 100 blocks (representing 3000m true vertical depth)
Blocks used: 150 (representing trajectory path)

The wellbore starts at surface level (Y=100) and extends downward to Y=0.
Each block represents approximately 20 meters of depth.
```

**Important Notes:**
- ✅ Text confirmation appears in chat
- ✅ Coordinates provided for navigation
- ❌ No visual artifacts in web UI
- 🎮 Visualization exists only in Minecraft

#### Step 6: View in Minecraft

1. **Connect to Minecraft Server**
   - Server: `edicraft.nigelgardiner.com`
   - Port: `49000`

2. **Navigate to Coordinates**
   - Use the coordinates from the response
   - Command: `/tp @s 1234 100 5678`
   - Or fly/walk to the location

3. **Inspect the Visualization**
   - Wellbore appears as a colored block path
   - Starts at surface (Y=100)
   - Extends downward following trajectory
   - Different colors may indicate different formations

### Expected Results

- ✅ Query routes to EDIcraft agent
- ✅ Thought steps display execution progress
- ✅ Response includes Minecraft coordinates
- ✅ Wellbore appears in Minecraft at specified location
- ✅ Trajectory matches OSDU data
- ✅ No errors in execution

### Troubleshooting

**Issue: "Wellbore not found"**
- Verify wellbore ID exists in OSDU
- Try searching first: "Search for wellbores"
- Check OSDU permissions

**Issue: "Cannot connect to Minecraft server"**
- Verify server is running
- Check RCON configuration
- See [Troubleshooting Guide](EDICRAFT_TROUBLESHOOTING_GUIDE.md#minecraft-server-connection-refused)

**Issue: "Visualization not appearing"**
- Verify coordinates are correct
- Check if you're in the right dimension (Overworld)
- Try reloading chunks (F3+A)

---

## Horizon Surface Rendering

### Use Case

Render a geological horizon surface in Minecraft to visualize formation boundaries.

### Prerequisites

- EDIcraft agent deployed and configured
- Access to OSDU platform with horizon data
- Minecraft server running
- Understanding of geological horizons

### Workflow Steps

#### Step 1: Submit Query

Enter one of these queries:

**Option A: Specific Horizon**
```
Render the horizon surface for formation XYZ in minecraft
```

**Option B: Search and Render**
```
Find horizons in the Gulf of Mexico and visualize the top one in minecraft
```

**Option C: With Depth**
```
Show me the horizon at 2000m depth in minecraft
```

#### Step 2: Monitor Execution

Watch thought steps:

1. **Analysis**
   - "Analyzing horizon query..."
   - "Determining surface parameters..."

2. **Data Retrieval**
   - "Connecting to OSDU platform..."
   - "Searching for horizon: formation XYZ..."
   - "Retrieving horizon surface data..."
   - "Loading depth points..."

3. **Processing**
   - "Transforming coordinates..."
   - "Interpolating surface..."
   - "Generating mesh..."

4. **Execution**
   - "Building horizon surface..."
   - "Placing blocks at depth Y=50..."
   - "Surface complete!"

#### Step 3: Review Response

```
✅ Horizon surface for formation XYZ has been rendered in Minecraft!

The geological horizon has been built underground, representing the top of formation XYZ.

🎮 Connect to the Minecraft server to explore the surface in 3D.

Location: Center at X: 2000, Z: 3000
Depth Range: Y: 45-55 (representing 1800m-2200m TVD)
Surface Area: 100x100 blocks (2km x 2km)
Blocks used: 10,000

Different colors indicate depth variations:
- Light blue: Shallow (Y=55)
- Dark blue: Deep (Y=45)
```

**Remember:** The horizon surface is built in Minecraft, not displayed in the chat interface.

#### Step 4: View in Minecraft

1. **Navigate to Location**
   - Teleport to center coordinates
   - Fly to appropriate Y level

2. **Inspect Surface**
   - Surface appears as colored blocks
   - Colors indicate depth variations
   - Smooth interpolation between points

3. **Explore**
   - Fly around to see full extent
   - Use spectator mode to see through blocks
   - Compare with wellbore trajectories

### Expected Results

- ✅ Horizon surface renders correctly
- ✅ Depth variations visible
- ✅ Surface matches OSDU data
- ✅ Colors indicate depth
- ✅ Smooth interpolation

### Use Cases

**Geological Interpretation:**
- Visualize formation tops
- Understand structural features
- Identify faults and folds
- Plan well trajectories

**Education:**
- Teach subsurface geology
- Demonstrate formation concepts
- Interactive learning

---

## Player Position Tracking

### Use Case

Track player positions in Minecraft for coordinate reference and navigation.

### Prerequisites

- EDIcraft agent deployed
- Minecraft server running
- Player connected to server

### Workflow Steps

#### Step 1: Submit Query

```
What is my current position in minecraft?
```

Or:

```
Where am I in minecraft?
```

#### Step 2: Monitor Execution

Thought steps:

1. **Analysis**
   - "Analyzing position query..."

2. **Execution**
   - "Connecting to Minecraft server..."
   - "Querying player positions..."
   - "Found player: YourUsername"

#### Step 3: Review Response

```
Your current position in Minecraft:

Player: YourUsername
Coordinates: X: 1234, Y: 64, Z: 5678
Dimension: Overworld
Biome: Plains

Nearby features:
- Wellbore well001: 50 blocks north
- Horizon surface XYZ: 20 blocks below

To share your location with others:
/tp @s 1234 64 5678
```

#### Step 4: Use Coordinates

- Navigate to nearby features
- Share location with team
- Mark important locations
- Plan visualization placements

### Expected Results

- ✅ Fast response (<2 seconds)
- ✅ Accurate coordinates
- ✅ Nearby features listed
- ✅ Dimension identified

---

## Coordinate Transformation

### Use Case

Transform real-world UTM coordinates to Minecraft coordinates for accurate placement.

### Prerequisites

- EDIcraft agent deployed
- UTM coordinates from OSDU or other source

### Workflow Steps

#### Step 1: Submit Query

```
Transform UTM coordinates 500000, 4500000 to minecraft coordinates
```

Or:

```
What are the minecraft coordinates for UTM 500000, 4500000?
```

#### Step 2: Review Response

```
Coordinate Transformation:

Input (UTM):
- Easting: 500000
- Northing: 4500000
- Zone: 15N

Output (Minecraft):
- X: 1234
- Z: 5678
- Y: 100 (surface level)

Transformation Details:
- Scale: 1 block = 10 meters
- Origin: UTM 450000, 4450000 = Minecraft 0, 0
- Rotation: 0 degrees

To use these coordinates:
/tp @s 1234 100 5678
```

#### Step 3: Use Coordinates

- Place visualizations at correct locations
- Navigate to real-world locations
- Verify coordinate accuracy

### Expected Results

- ✅ Accurate transformation
- ✅ Consistent scale
- ✅ Proper origin alignment

---

## Multi-Wellbore Visualization

### Use Case

Visualize multiple wellbores simultaneously to understand field development.

### Prerequisites

- EDIcraft agent deployed
- Multiple wellbores in OSDU
- Minecraft server with sufficient space

### Workflow Steps

#### Step 1: Submit Query

```
Show me all wellbores in the North Sea field in minecraft
```

Or:

```
Visualize wellbores well001, well002, and well003 in minecraft
```

#### Step 2: Monitor Execution

Thought steps show progress for each wellbore:

1. **Analysis**
   - "Analyzing multi-wellbore query..."
   - "Found 3 wellbores to visualize"

2. **Data Retrieval**
   - "Retrieving well001 trajectory..."
   - "Retrieving well002 trajectory..."
   - "Retrieving well003 trajectory..."

3. **Processing**
   - "Transforming coordinates for well001..."
   - "Transforming coordinates for well002..."
   - "Transforming coordinates for well003..."

4. **Execution**
   - "Building well001 at X: 1000, Z: 2000..."
   - "Building well002 at X: 1100, Z: 2100..."
   - "Building well003 at X: 1200, Z: 2200..."

#### Step 3: Review Response

```
Successfully visualized 3 wellbores in Minecraft!

Wellbore Locations:
1. well001: X: 1000, Y: 100, Z: 2000 (Color: Red)
2. well002: X: 1100, Y: 100, Z: 2100 (Color: Blue)
3. well003: X: 1200, Y: 100, Z: 2200 (Color: Green)

Field Overview:
- Total depth range: 0-3500m TVD
- Spacing: ~100 blocks between wells
- All wellbores start at surface (Y=100)

To view the field:
1. Teleport to center: /tp @s 1100 150 2100
2. Fly up for overview
3. Use spectator mode for best view
```

#### Step 4: View in Minecraft

1. **Navigate to Field Center**
   - Use provided coordinates
   - Fly up for overview

2. **Inspect Each Wellbore**
   - Different colors for each well
   - Compare trajectories
   - Identify patterns

3. **Analyze Field Development**
   - Understand well spacing
   - See trajectory relationships
   - Plan future wells

### Expected Results

- ✅ All wellbores visualized
- ✅ Different colors for each
- ✅ Correct spacing
- ✅ Accurate trajectories

---

## OSDU Data Exploration

### Use Case

Explore available OSDU data before visualization.

### Prerequisites

- EDIcraft agent deployed
- Access to OSDU platform

### Workflow Steps

#### Step 1: Search for Data

**Search Wellbores:**
```
Search for wellbores in the North Sea
```

**Search Horizons:**
```
Find horizons in formation ABC
```

**Search by Location:**
```
What wellbores are near coordinates 500000, 4500000?
```

#### Step 2: Review Results

```
Found 5 wellbores in the North Sea:

1. well001
   - Location: UTM 500000, 4500000
   - Depth: 3000m TVD
   - Status: Producing
   - Formation: Sandstone

2. well002
   - Location: UTM 501000, 4501000
   - Depth: 3200m TVD
   - Status: Producing
   - Formation: Sandstone

[... more results ...]

To visualize a wellbore, use:
"Visualize well001 in minecraft"
```

#### Step 3: Select Data for Visualization

Choose a wellbore or horizon from results and submit visualization query.

### Expected Results

- ✅ Relevant data found
- ✅ Detailed information provided
- ✅ Easy to select for visualization

---

## Troubleshooting Workflows

### Workflow: Diagnose Connection Issues

#### Step 1: Check Configuration

```
Show me the EDIcraft configuration
```

Response shows:
- Minecraft server status
- OSDU platform status
- Agent status
- Environment variables (redacted)

#### Step 2: Test Minecraft Connection

```
Test connection to minecraft server
```

Response shows:
- Connection status
- RCON status
- Server version
- Online players

#### Step 3: Test OSDU Connection

```
Test connection to OSDU platform
```

Response shows:
- Authentication status
- Platform accessibility
- User permissions
- Available data

### Workflow: Verify Visualization

#### Step 1: Get Current Visualizations

```
What visualizations are currently in minecraft?
```

Response lists:
- All wellbores
- All horizons
- Coordinates for each
- Creation timestamps

#### Step 2: Navigate to Visualization

```
Take me to wellbore well001 in minecraft
```

Response provides:
- Teleport command
- Coordinates
- Viewing instructions

#### Step 3: Verify Accuracy

```
Compare wellbore well001 in minecraft with OSDU data
```

Response shows:
- OSDU trajectory points
- Minecraft block locations
- Accuracy metrics
- Any discrepancies

---

## Best Practices

### Query Formulation

**Good Queries:**
- ✅ "Visualize wellbore well001 in minecraft"
- ✅ "Show me the horizon surface for formation XYZ"
- ✅ "What is my position in minecraft?"

**Avoid:**
- ❌ "Show me data" (too vague)
- ❌ "Build something" (not specific)
- ❌ "Minecraft" (no action specified)

### Workflow Tips

1. **Start with Search**
   - Search for data before visualizing
   - Verify data exists
   - Choose appropriate data

2. **Monitor Thought Steps**
   - Watch for errors
   - Understand execution
   - Learn agent capabilities

3. **Verify in Minecraft**
   - Always check visualizations
   - Compare with OSDU data
   - Report discrepancies

4. **Use Coordinates**
   - Save important coordinates
   - Share with team
   - Document locations

5. **Iterate**
   - Refine queries based on results
   - Try different approaches
   - Learn from experience

### Performance Tips

1. **Batch Operations**
   - Visualize multiple wellbores at once
   - More efficient than one-by-one

2. **Specific Queries**
   - Provide wellbore IDs when known
   - Reduces search time

3. **Coordinate Reference**
   - Use coordinate transformation for planning
   - Verify locations before building

4. **Server Management**
   - Keep Minecraft server optimized
   - Clear old visualizations periodically
   - Monitor server performance

---

## Advanced Workflows

### Custom Visualization Placement

```
Build wellbore well001 at coordinates X: 5000, Z: 6000 in minecraft
```

Allows precise placement for:
- Field layout planning
- Educational displays
- Presentation preparation

### Comparative Analysis

```
Show me wellbores well001 and well002 side by side in minecraft
```

Useful for:
- Comparing trajectories
- Understanding field development
- Training and education

### Dynamic Updates

```
Update wellbore well001 visualization with latest OSDU data
```

Keeps visualizations current:
- Reflects data changes
- Updates trajectories
- Refreshes displays

---

## Workflow Checklist

Use this checklist for each visualization workflow:

### Pre-Visualization
- [ ] EDIcraft agent deployed
- [ ] Environment variables configured
- [ ] Minecraft server running
- [ ] OSDU credentials valid
- [ ] Data exists in OSDU

### During Visualization
- [ ] Query submitted
- [ ] Agent routes correctly
- [ ] Thought steps display
- [ ] No errors occur
- [ ] Response received

### Post-Visualization
- [ ] Coordinates noted
- [ ] Minecraft checked
- [ ] Visualization accurate
- [ ] Team notified
- [ ] Documentation updated

---

## Conclusion

The EDIcraft agent provides powerful workflows for visualizing subsurface data in Minecraft. By following these workflows, users can:

- Visualize wellbore trajectories
- Render horizon surfaces
- Track player positions
- Transform coordinates
- Explore OSDU data
- Troubleshoot issues

For more information:
- **Deployment:** `edicraft-agent/DEPLOYMENT_GUIDE.md`
- **Troubleshooting:** `docs/EDICRAFT_TROUBLESHOOTING_GUIDE.md`
- **Validation:** `tests/manual/EDICRAFT_VALIDATION_GUIDE.md`

**Remember:** The EDIcraft agent bridges the gap between subsurface data and interactive 3D visualization, making geological exploration more intuitive and engaging.
