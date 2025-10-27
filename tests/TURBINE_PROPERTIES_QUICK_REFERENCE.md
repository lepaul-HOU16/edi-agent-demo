# Turbine Properties Quick Reference

## Task 3 Implementation

### What Was Added

Added two new properties to turbine features in layout optimization:

1. **hub_height_m** - Hub height in meters (default: 80.0m)
2. **rotor_diameter_m** - Rotor diameter in meters (from parameters)

### Complete Turbine Feature Structure

```json
{
  "type": "Feature",
  "geometry": {
    "type": "Point",
    "coordinates": [longitude, latitude]
  },
  "properties": {
    "type": "turbine",
    "turbine_id": "T001",
    "turbine_model": "GE 2.5-120",
    "capacity_MW": 2.5,
    "hub_height_m": 85.0,
    "rotor_diameter_m": 120.0,
    "marker-color": "#00ff00",
    "marker-size": "large",
    "marker-symbol": "wind-turbine"
  }
}
```

### Quick Test

```bash
# Run turbine properties test
python3 tests/test-turbine-properties.py
```

**Expected Output:**
```
✅ ALL TURBINE FEATURES HAVE REQUIRED PROPERTIES
   - Verified N turbines
   - All have type='turbine'
   - All have turbine_id (T001, T002, T003, ...)
   - All have capacity_MW
   - All have hub_height_m
   - All have rotor_diameter_m
```

### Usage in Frontend

```typescript
// Access turbine properties in LayoutMapArtifact
const turbineFeatures = geojson.features.filter(
  f => f.properties.type === 'turbine'
);

turbineFeatures.forEach(turbine => {
  const props = turbine.properties;
  console.log(`Turbine ${props.turbine_id}:`);
  console.log(`  Capacity: ${props.capacity_MW} MW`);
  console.log(`  Hub Height: ${props.hub_height_m} m`);
  console.log(`  Rotor Diameter: ${props.rotor_diameter_m} m`);
});
```

### Turbine ID Format

- **Format:** T001, T002, T003, ..., T999
- **Pattern:** `T` + 3-digit zero-padded number
- **Sequential:** Starts at 1, increments for each turbine

### Default Values

| Property | Default | Source |
|----------|---------|--------|
| hub_height_m | 80.0 | `params.get('hub_height', 80.0)` |
| rotor_diameter_m | 120.0 | `params.get('rotor_diameter', 120.0)` |
| capacity_MW | 2.5 | `params.get('capacity_mw', 2.5)` |

### Requirements Satisfied

- ✅ **4.1** - Each turbine feature has type="turbine" and all required properties
- ✅ **4.2** - Properties include turbine_id, capacity_MW, hub_height_m, rotor_diameter_m

### Files Modified

- `amplify/functions/renewableTools/layout/handler.py` - Added properties to turbine features
- `tests/test-turbine-properties.py` - Verification test

### Status

✅ **COMPLETE** - All turbine features now include required properties
