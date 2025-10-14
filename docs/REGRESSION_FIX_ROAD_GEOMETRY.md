# Regression Fix: Road Geometry Handling

## Issue Identified
During the real data integration implementation, a regression was introduced where roads (highways) were being incorrectly treated as closed polygons instead of LineStrings, even when they should remain linear features.

## Root Cause
The `_extract_geometry` method in `osm_client.py` was automatically converting any closed way (where first coordinate equals last coordinate) into a Polygon, regardless of the feature type. This caused roads like roundabouts or closed residential streets to be rendered as filled polygons instead of lines.

## Fix Implemented

### 1. Enhanced Geometry Detection Logic
```python
def _extract_geometry(self, element: Dict) -> Optional[Dict]:
    # Determine if this should be a polygon or linestring based on tags
    tags = element.get('tags', {})
    is_area = self._should_be_polygon(tags)
    is_closed = len(coordinates) >= 4 and coordinates[0] == coordinates[-1]
    
    if is_area and is_closed:
        # This is an area feature (building, water, etc.)
        return {'type': 'Polygon', 'coordinates': [coordinates]}
    else:
        # This is a linear feature (highway, railway, etc.) or open way
        return {'type': 'LineString', 'coordinates': coordinates}
```

### 2. Smart Feature Type Classification
```python
def _should_be_polygon(self, tags: Dict) -> bool:
    """Determine if an OSM way should be treated as a polygon based on its tags"""
    
    # Features that should always be polygons (area features)
    polygon_tags = {'building', 'landuse', 'natural', 'leisure', 'amenity', ...}
    
    # Features that should always be linestrings (linear features)  
    linestring_tags = {'highway', 'railway', 'waterway', 'power', 'barrier', ...}
    
    # Check for explicit area tags
    if tags.get('area') == 'yes': return True
    if tags.get('area') == 'no': return False
    
    # Apply smart classification based on OSM tagging conventions
```

## Key Improvements

### ✅ Correct Geometry Types
- **Roads/Highways**: Always rendered as LineStrings (even closed loops like roundabouts)
- **Buildings**: Rendered as Polygons (filled areas)
- **Water Bodies**: Rendered as Polygons (filled areas)
- **Railways**: Rendered as LineStrings (linear paths)
- **Power Lines**: Rendered as LineStrings (linear infrastructure)

### ✅ OSM Tagging Compliance
- Follows OpenStreetMap tagging conventions for area vs. linear features
- Respects explicit `area=yes/no` tags when present
- Handles special cases (e.g., `man_made=works` as polygon, `man_made=pipeline` as linestring)

### ✅ Visual Correctness
- Roads now appear as lines/paths on the map (not filled shapes)
- Buildings appear as filled polygons (area features)
- Water bodies appear as filled blue areas
- Power lines appear as linear features

## Testing Verified

### Road Features (LineString)
- ✅ Residential streets render as lines
- ✅ Highways render as lines  
- ✅ Roundabouts render as circular lines (not filled circles)
- ✅ Railway tracks render as lines

### Area Features (Polygon)
- ✅ Buildings render as filled rectangles/shapes
- ✅ Water bodies render as filled blue areas
- ✅ Industrial areas render as filled zones
- ✅ Protected areas render as filled boundaries

## Impact
- **Fixed Regression**: Roads no longer appear as filled polygons
- **Maintained Functionality**: All existing terrain overlay features still work
- **Improved Accuracy**: Geometry types now match real-world feature characteristics
- **OSM Compliance**: Follows OpenStreetMap data model conventions

## Files Modified
- `amplify/functions/renewableTools/osm_client.py` - Enhanced geometry extraction logic
- Added `_should_be_polygon()` method for smart feature classification
- Updated `_extract_geometry()` to use tag-based geometry determination

The regression has been fully resolved while maintaining all the real data integration improvements. Roads and linear features now render correctly as lines, while area features render as filled polygons.