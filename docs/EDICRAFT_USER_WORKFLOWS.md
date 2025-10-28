# EDIcraft Agent User Workflows

## Overview

This document describes the complete user workflows for the EDIcraft agent, from submitting a query to seeing visualizations in Minecraft. It covers all major use cases and provides step-by-step instructions for each workflow.

## Table of Contents

1. [Wellbore Trajectory Visualization](#wellbore-trajectory-visualization)
2. [Horizon Surface Rendering](#horizon-surface-rendering)
3. [Player Position Tracking](#player-position-tracking)
4. [Coordinate Transformation](#coordinate-transformation)
5. [Multi-Wellbore Visualization](#multi-wellbore-visualization)
6. [OSDU Data Exploration](#osdu-data-exploration)
7. [Troubleshooting Workflows](#troubleshooting-workflows)

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
Wellbore trajectory for well001 has been successfully built in Minecraft!

Location: X: 1234, Y: 64, Z: 5678
Depth: 100 blocks (representing 3000m true vertical depth)
Blocks used: 150 (representing trajectory path)

The wellbore starts at surface level (Y=100) and extends downward to Y=0.
Each block represents approximately 20 meters of depth.

To view the wellbore:
1. Connect to edicraft.nigelgardiner.com:49000
2. Teleport to coordinates: /tp @s 1234 100 5678
3. Look down to see the full trajectory
```

**Note:** No visual artifacts appear in the web UI. The visualization exists only in Minecraft.

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
Horizon surface for formation XYZ has been rendered in Minecraft!

Location: Center at X: 2000, Z: 3000
Depth Range: Y: 45-55 (representing 1800m-2200m TVD)
Surface Area: 100x100 blocks (2km x 2km)
Blocks used: 10,000

The horizon surface represents the top of formation XYZ.
Different colors indicate depth variations:
- Light blue: Shallow (Y=55)
- Dark blue: Deep (Y=45)

To view the surface:
1. Teleport to: /tp @s 2000 100 3000
2. Fly down to Y=50 to see the surface
3. Use spectator mode for best view: /gamemode spectator
```

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
