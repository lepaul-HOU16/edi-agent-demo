# Implementation Tasks: Fix Renewable UI/UX Blockers

## VALIDATION-FIRST APPROACH

**This spec uses a different approach**: We will NOT accept "tests pass" as proof. Every task includes **visual validation in the browser** that the user must perform.

---

## TASK 1: Prove Intelligent Placement Actually Works (CRITICAL)

**Priority:** CRITICAL - Never been validated in UI
**Time:** 2 hours
**Goal:** PROVE intelligent placement is running and visible in browser

### Step 1.1: Add Comprehensive Logging to Layout Handler

Modify `amplify/functions/renewableTools/layout/handler.py`:

```python
import logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def handler(event, context):
    logger.info("=" * 80)
    logger.info("LAYOUT OPTIMIZATION STARTING")
    logger.info(f"Algorithm selection: INTELLIGENT PLACEMENT")
    logger.info("=" * 80)
    
    # ... existing code ...
    
    # Before calling placement algorithm
    logger.info(f"Calling intelligent_placement.py with {len(terrain_features)} terrain constraints")
    logger.info(f"Terrain features: {[f['type'] for f in terrain_features]}")
    
    # Call intelligent placement
    turbines = intelligent_placement.place_turbines(...)
    
    # After placement
    logger.info(f"Intelligent placement returned {len(turbines)} turbines")
    for i, turbine in enumerate(turbines):
        logger.info(f"  Turbine {i+1}: ({turbine['lat']}, {turbine['lon']}) - avoided: {turbine.get('avoided_features', [])}")
    
    logger.info("=" * 80)
```

**Validation:**
- Check CloudWatch logs show "INTELLIGENT PLACEMENT" message
- Check logs show terrain constraints being passed
- Check logs show turbine positions with avoided features

### Step 1.2: Add Algorithm Metadata to Response

In `handler.py`, add metadata to the response:

```python
response = {
    'success': True,
    'turbines': turbines,
    'geojson': geojson,
    'metadata': {
        'algorithm': 'intelligent_placement',
        'version': '1.0',
        'constraints_applied': len(terrain_features),
        'terrain_features_considered': [f['type'] for f in terrain_features],
        'placement_decisions': [
            {
                'turbine_id': t['id'],
                'position': (t['lat'], t['lon']),
                'avoided_features': t.get('avoided_features', []),
                'reason': t.get('placement_reason', 'optimal wind exposure')
            }
            for t in turbines
        ]
    }
}
```

**Validation:**
- Response includes `metadata.algorithm = "intelligent_placement"`
- Response includes list of avoided features
- Response includes placement decisions

### Step 1.3: Display Algorithm Info in UI

Modify `src/components/renewable/LayoutMapArtifact.tsx`:

```typescript
// Add algorithm info display
{data.metadata && (
  <Alert severity="info" sx={{ mb: 2 }}>
    <Typography variant="subtitle2">
      <strong>Algorithm:</strong> {data.metadata.algorithm}
    </Typography>
    <Typography variant="body2">
      Constraints applied: {data.metadata.constraints_applied} terrain features
    </Typography>
    <Typography variant="body2">
      Features considered: {data.metadata.terrain_features_considered?.join(', ')}
    </Typography>
  </Alert>
)}
```

**Validation:**
- User SEES algorithm name in UI
- User SEES number of constraints
- User SEES which terrain features were considered

### Step 1.4: Visual Validation Checklist

**Deploy and test:**

```bash
# Deploy backend
npx ampx sandbox

# Wait for deployment
# Check CloudWatch logs for layout Lambda

# Test in browser
# Query: "optimize layout at 35.067482, -101.395466"
```

**User must validate in browser:**
- [x] Algorithm info box shows "intelligent_placement"
- [ ] Turbines are NOT in a regular grid pattern
- [ ] Turbines visibly avoid buildings/roads/water
- [ ] Can see irregular spacing between turbines
- [ ] CloudWatch logs show "INTELLIGENT PLACEMENT" message
- [ ] CloudWatch logs show avoided features for each turbine

**If ANY of these fail, intelligent placement is NOT working.**

---

## TASK 2: Fix Perimeter Circle Clickthrough

**Priority:** CRITICAL - Blocks all map interaction
**Time:** 30 minutes

### Step 2.1: Add pointer-events: none to Perimeter Circle

Modify `src/components/renewable/LayoutMapArtifact.tsx`:

Find where perimeter circle is rendered and add CSS:

```typescript
// When rendering perimeter feature
if (feature.properties.type === 'perimeter') {
  const perimeterLayer = L.geoJSON(feature, {
    style: {
      color: '#333333',
      weight: 3,
      dashArray: '10, 10',
      fillOpacity: 0,
      // ADD THIS:
      className: 'perimeter-non-interactive'
    }
  });
  
  perimeterLayer.addTo(map);
}
```

Add CSS in component or global styles:

```css
.perimeter-non-interactive {
  pointer-events: none !important;
}
```

**Validation:**
- [ ] User can click on turbines through perimeter circle
- [ ] User can click on buildings through perimeter circle
- [ ] Perimeter circle is still visible
- [ ] Perimeter circle doesn't show pointer cursor on hover

---

## TASK 3: Fix Wake Simulation Button

**Priority:** HIGH - Workflow blocker
**Time:** 45 minutes

### Step 3.1: Check Button Event Handler

Modify `src/components/renewable/LayoutMapArtifact.tsx` or `ActionButtons.tsx`:

```typescript
const handleWakeSimulation = async () => {
  console.log('🌊 Wake simulation button clicked');
  console.log('Project data:', projectData);
  console.log('Layout data:', layoutData);
  
  setLoading(true);
  
  try {
    const query = `run wake simulation for ${projectName}`;
    console.log('Sending query:', query);
    
    // Send message through chat interface
    await sendMessage(query);
    
    console.log('✅ Wake simulation request sent');
  } catch (error) {
    console.error('❌ Wake simulation failed:', error);
  } finally {
    setLoading(false);
  }
};
```

**Validation:**
- [ ] Button click logs appear in browser console
- [ ] Wake simulation query is sent
- [ ] Loading state shows during execution
- [ ] Wake analysis results appear
- [ ] No errors in console

---

## TASK 4: Preserve OSM Features Across Workflow (CRITICAL FOR OVERLAY)

**Priority:** HIGH - User needs to see terrain features overlaid with turbines
**Time:** 1 hour

### Step 4.1: Extract OSM Features from Project Context

Modify `amplify/functions/renewableTools/layout/simple_handler.py`:

```python
def handler(event, context):
    logger.info("=" * 80)
    logger.info("EXTRACTING OSM FEATURES FROM PROJECT CONTEXT")
    logger.info("=" * 80)
    
    # Get terrain data from project context
    project_context = event.get('project_context', {})
    terrain_results = project_context.get('terrain_results', {})
    terrain_geojson = terrain_results.get('geojson', {})
    terrain_features = terrain_geojson.get('features', [])
    
    logger.info(f"Received {len(terrain_features)} terrain features from context")
    
    # Log feature types
    feature_types = {}
    for feature in terrain_features:
        ftype = feature.get('properties', {}).get('type', 'unknown')
        feature_types[ftype] = feature_types.get(ftype, 0) + 1
    
    logger.info(f"Feature breakdown: {feature_types}")
    # Example: {'building': 15, 'road': 8, 'water': 3, 'perimeter': 1}
```

### Step 4.2: Merge OSM Features with Turbine Layout

After generating turbine positions, merge with OSM features:

```python
    # Generate turbine GeoJSON features
    turbine_features = []
    for i, turbine in enumerate(turbines):
        turbine_feature = {
            'type': 'Feature',
            'geometry': {
                'type': 'Point',
                'coordinates': [turbine['lon'], turbine['lat']]
            },
            'properties': {
                'type': 'turbine',  # CRITICAL: type for frontend rendering
                'turbine_id': f'T{i+1:03d}',
                'capacity_MW': 2.5,
                'hub_height_m': 80,
                'rotor_diameter_m': 100
            }
        }
        turbine_features.append(turbine_feature)
    
    logger.info(f"Generated {len(turbine_features)} turbine features")
    
    # CRITICAL: Merge terrain features with turbines
    all_features = terrain_features + turbine_features
    
    logger.info(f"Merged features: {len(terrain_features)} terrain + {len(turbine_features)} turbines = {len(all_features)} total")
    
    # Create combined GeoJSON
    combined_geojson = {
        'type': 'FeatureCollection',
        'features': all_features
    }
    
    # Return in response
    return {
        'success': True,
        'data': {
            'geojson': combined_geojson,  # CRITICAL: Combined GeoJSON for frontend
            # ... other fields
        }
    }
```

### Step 4.3: Ensure Frontend Renders All Feature Types

Modify `src/components/renewable/LayoutMapArtifact.tsx`:

```typescript
// Render all features from combined GeoJSON
const renderFeatures = (map: L.Map, geojson: GeoJSON.FeatureCollection) => {
  geojson.features.forEach(feature => {
    const featureType = feature.properties?.type;
    
    switch (featureType) {
      case 'turbine':
        // Render turbine as blue marker
        const coords = feature.geometry.coordinates;
        L.marker([coords[1], coords[0]], {
          icon: L.icon({
            iconUrl: '/turbine-icon.png',
            iconSize: [32, 32]
          })
        })
        .bindPopup(`Turbine ${feature.properties.turbine_id}`)
        .addTo(map);
        break;
        
      case 'building':
        // Render building as red polygon
        L.geoJSON(feature, {
          style: {
            color: '#ff0000',
            fillColor: '#ff0000',
            fillOpacity: 0.3,
            weight: 2
          }
        })
        .bindPopup('Building')
        .addTo(map);
        break;
        
      case 'road':
        // Render road as gray line
        L.geoJSON(feature, {
          style: {
            color: '#666666',
            weight: 3,
            opacity: 0.7
          }
        })
        .bindPopup('Road')
        .addTo(map);
        break;
        
      case 'water':
        // Render water as blue polygon
        L.geoJSON(feature, {
          style: {
            color: '#0000ff',
            fillColor: '#0000ff',
            fillOpacity: 0.3,
            weight: 2
          }
        })
        .bindPopup('Water Body')
        .addTo(map);
        break;
        
      case 'perimeter':
        // Render perimeter with clickthrough
        L.geoJSON(feature, {
          style: {
            color: '#333333',
            weight: 3,
            dashArray: '10, 10',
            fillOpacity: 0,
            className: 'perimeter-non-interactive'
          }
        })
        .addTo(map);
        break;
    }
  });
};
```

**Validation (VISUAL - User must see in browser):**
- [ ] Layout map shows roads as gray lines
- [ ] Layout map shows buildings as red polygons
- [ ] Layout map shows water bodies as blue polygons
- [ ] Layout map shows perimeter as dashed line
- [ ] Turbines render as blue markers
- [ ] All features visible simultaneously on same map
- [ ] Can click on buildings to see popup
- [ ] Can click on roads to see popup
- [ ] Can click on turbines to see popup
- [ ] CloudWatch logs show "Merged features: X terrain + Y turbines = Z total"
- [ ] Browser console shows no errors when rendering features

**If ANY terrain features are missing, the overlay is NOT working.**

---

## TASK 5: Fix Duplicate Action Buttons

**Priority:** MEDIUM - Polish issue
**Time:** 30 minutes

### Step 5.1: Add Key Props and Cleanup

Modify `src/components/renewable/ActionButtons.tsx`:

```typescript
useEffect(() => {
  // Cleanup function to prevent duplicates
  return () => {
    // Clear any button state
  };
}, []);

return (
  <Box>
    {actions.map((action, index) => (
      <Button
        key={`${action.label}-${index}`}  // Unique key
        onClick={() => handleAction(action)}
      >
        {action.label}
      </Button>
    ))}
  </Box>
);
```

**Validation:**
- [ ] Each button appears exactly once
- [ ] No duplicate buttons after re-render
- [ ] No duplicate buttons in React strict mode

---

## TASK 6: Implement Integrated Dashboard (Optional)

**Priority:** MEDIUM - Enhancement
**Time:** 2 hours

### Step 6.1: Create Integrated Dashboard Component

Create `src/components/renewable/IntegratedRenewableDashboard.tsx`:

```typescript
export function IntegratedRenewableDashboard({ 
  layoutData, 
  wakeData, 
  windRoseData 
}) {
  return (
    <Grid container spacing={2}>
      {/* Main map - 2/3 width */}
      <Grid item xs={12} md={8}>
        <LayoutMapArtifact data={layoutData} />
      </Grid>
      
      {/* Side panels - 1/3 width */}
      <Grid item xs={12} md={4}>
        <Stack spacing={2}>
          {wakeData && (
            <Paper>
              <WakeAnalysisArtifact data={wakeData} />
            </Paper>
          )}
          
          {windRoseData && (
            <Paper>
              <WindRoseArtifact data={windRoseData} />
            </Paper>
          )}
        </Stack>
      </Grid>
    </Grid>
  );
}
```

**Validation:**
- [ ] Layout map shows on left (2/3 width)
- [ ] Wake analysis shows on right (top)
- [ ] Wind rose shows on right (bottom)
- [ ] All components visible simultaneously
- [ ] Responsive on different screen sizes

---

## DEPLOYMENT & VALIDATION PROTOCOL

### Phase 1: Deploy Backend Changes

```bash
# Stop current sandbox
Ctrl+C

# Restart sandbox
npx ampx sandbox

# Wait for "Deployed" message (5-10 minutes)

# Verify deployment
aws lambda list-functions | grep layout
```

### Phase 2: Check CloudWatch Logs

```bash
# Get layout Lambda name
LAYOUT_LAMBDA=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'layout')].FunctionName" --output text)

# Tail logs
aws logs tail /aws/lambda/$LAYOUT_LAMBDA --follow
```

### Phase 3: Test in Browser

1. Open application in browser
2. Clear browser cache (Cmd+Shift+R)
3. Run query: "optimize layout at 35.067482, -101.395466"
4. Open browser console (F12)
5. Check for algorithm info display
6. Visually inspect turbine placement

### Phase 4: User Validation Checklist

**Intelligent Placement:**
- [ ] Algorithm info shows "intelligent_placement"
- [ ] Turbines are NOT in a grid
- [ ] Turbines avoid obstacles (visual inspection)
- [ ] CloudWatch logs show "INTELLIGENT PLACEMENT"
- [ ] CloudWatch logs show avoided features

**Perimeter Clickthrough:**
- [ ] Can click turbines through circle
- [ ] Can click terrain features through circle

**Wake Simulation:**
- [ ] Button triggers wake analysis
- [ ] Results display correctly

**OSM Features:**
- [ ] Roads visible on layout map
- [ ] Buildings visible on layout map
- [ ] Water visible on layout map

**No Duplicates:**
- [ ] Each button appears once

### Phase 5: If Validation Fails

**DO NOT PROCEED** if any validation fails.

**Debug steps:**
1. Check CloudWatch logs for actual algorithm called
2. Check browser console for errors
3. Check network tab for response data
4. Verify deployment completed successfully
5. Check if intelligent_placement.py exists and is being imported

**If intelligent placement is NOT running:**
- Find where grid placement is being called instead
- Fix the algorithm selection logic
- Add more logging to trace execution path
- Deploy and test again

---

## SUCCESS CRITERIA

**Task is ONLY complete when:**

1. **USER SEES** intelligent placement in browser (not grid)
2. **USER SEES** algorithm metadata confirming intelligent placement
3. **USER SEES** turbines avoiding obstacles
4. **CLOUDWATCH LOGS** show "INTELLIGENT PLACEMENT" message
5. **CLOUDWATCH LOGS** show avoided features for each turbine
6. All other UI issues are fixed and validated

**NO DOCUMENTATION until user validates in browser.**

