#!/bin/bash
# Quick update of renewable-terrain-simple with complete code
# Uses AWS Lambda console code editor for small updates
set -e

echo "🔄 Updating renewable-terrain-simple with complete terrain_tools.py"
echo "===================================================================="

# Create a minimal package
rm -rf lambda-deployment/terrain-minimal
mkdir -p lambda-deployment/terrain-minimal/agents/tools

# Copy only the essential files
cp cdk/lambda-functions/renewable-tools/agents/tools/__init__.py lambda-deployment/terrain-minimal/agents/tools/
touch lambda-deployment/terrain-minimal/agents/__init__.py

# Create the lite version inline
cat > lambda-deployment/terrain-minimal/agents/tools/terrain_tools_lite.py << 'LITEPY'
"""
Lightweight terrain analysis - focuses on data collection including water features
"""
import requests
import json
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_unbuildable_areas(latitude: float, longitude: float, project_id: str, 
                         radius_km: float = 5.0, setback_m: int = 100) -> dict:
    """Analyze terrain with COMPLETE water feature queries"""
    try:
        lat_offset = radius_km / 111.0
        lon_offset = radius_km / (111.0 * abs(float(latitude)))
        north, south = latitude + lat_offset, latitude - lat_offset
        east, west = longitude + lon_offset, longitude - lon_offset
        
        logger.info(f"Querying OSM for bbox: {south},{west},{north},{east}")
        
        # COMPLETE OSM query with ALL water features
        overpass_query = f"""
        [out:json][timeout:60];
        (
          way["natural"="water"]({south},{west},{north},{east});
          relation["natural"="water"]({south},{west},{north},{east});
          way["waterway"="river"]({south},{west},{north},{east});
          way["waterway"="stream"]({south},{west},{north},{east});
          way["waterway"="canal"]({south},{west},{north},{east});
          way["water"="lake"]({south},{west},{north},{east});
          way["water"="pond"]({south},{west},{north},{east});
          way["water"="reservoir"]({south},{west},{north},{east});
          way["natural"="wetland"]({south},{west},{north},{east});
          way["natural"="coastline"]({south},{west},{north},{east});
          node["natural"="spring"]({south},{west},{north},{east});
          node["natural"="hot_spring"]({south},{west},{north},{east});
          node["waterway"="waterfall"]({south},{west},{north},{east});
          way["building"]({south},{west},{north},{east});
          way["highway"]({south},{west},{north},{east});
        );
        out geom;
        """
        
        response = requests.post("http://overpass-api.de/api/interpreter", 
                               data={'data': overpass_query}, timeout=60)
        response.raise_for_status()
        osm_data = response.json()
        
        logger.info(f"Received {len(osm_data.get('elements', []))} OSM elements")
        
        features = []
        for element in osm_data.get('elements', []):
            tags = element.get('tags', {})
            feature_type = 'other'
            if tags.get('natural') == 'water' or tags.get('waterway') or tags.get('water'):
                feature_type = 'water'
            elif tags.get('building'):
                feature_type = 'buildings'
            elif tags.get('highway'):
                feature_type = 'roads'
            
            geometry = None
            if element['type'] == 'way' and 'geometry' in element:
                coords = [[node['lon'], node['lat']] for node in element['geometry']]
                if len(coords) > 2:
                    geometry = {
                        'type': 'Polygon' if coords[0] == coords[-1] else 'LineString',
                        'coordinates': [coords] if coords[0] == coords[-1] else coords
                    }
            elif element['type'] == 'node':
                geometry = {'type': 'Point', 'coordinates': [element['lon'], element['lat']]}
            
            if geometry:
                features.append({
                    'type': 'Feature',
                    'geometry': geometry,
                    'properties': {'feature_type': feature_type, 'osm_id': element.get('id'), **tags}
                })
        
        water_count = sum(1 for f in features if f['properties']['feature_type'] == 'water')
        building_count = sum(1 for f in features if f['properties']['feature_type'] == 'buildings')
        road_count = sum(1 for f in features if f['properties']['feature_type'] == 'roads')
        
        logger.info(f"Features: {water_count} water, {building_count} buildings, {road_count} roads")
        
        return {
            'success': True,
            'GeoJSON_data': {'type': 'FeatureCollection', 'features': features},
            'project_id': project_id,
            'message': f'Analysis complete: {water_count} water features, {building_count} buildings, {road_count} roads',
            'feature_counts': {'water': water_count, 'buildings': building_count, 'roads': road_count, 'total': len(features)}
        }
    except Exception as e:
        logger.error(f"Terrain analysis failed: {e}", exc_info=True)
        return {'success': False, 'error': str(e), 'message': f'Terrain analysis failed: {str(e)}'}
LITEPY

# Install minimal dependencies
echo "📦 Installing dependencies..."
pip3 install requests overpy -t lambda-deployment/terrain-minimal --quiet

# Create handler
cat > lambda-deployment/terrain-minimal/handler.py << 'EOF'
import json
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from agents.tools.terrain_tools import get_unbuildable_areas

def handler(event, context):
    print(f"Terrain handler: {json.dumps(event)}")
    try:
        params = event.get('parameters', {})
        result = get_unbuildable_areas(
            latitude=params.get('latitude'),
            longitude=params.get('longitude'),
            project_id=params.get('project_id', 'terrain'),
            radius_km=params.get('radius_km', 5.0),
            setback_m=params.get('setback_m', 100)
        )
        return {'statusCode': 200, 'body': json.dumps({'success': True, 'result': result}, default=str)}
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return {'statusCode': 500, 'body': json.dumps({'success': False, 'error': str(e)})}
EOF

# Package it (remove old zip first)
rm -f lambda-deployment/terrain-minimal.zip
cd lambda-deployment/terrain-minimal
zip -r ../terrain-minimal.zip . -q
cd -

SIZE=$(du -h lambda-deployment/terrain-minimal.zip | cut -f1)
echo "📦 Package size: $SIZE"

# Upload to S3
echo "📤 Uploading to S3..."
aws s3 cp lambda-deployment/terrain-minimal.zip \
  s3://amplify-digitalassistant--workshopstoragebucketd9b-mx1aevbdpmqy/lambda-deployments/terrain-minimal.zip

# Update Lambda
echo "🔄 Updating Lambda..."
aws lambda update-function-code \
  --function-name renewable-terrain-simple \
  --s3-bucket amplify-digitalassistant--workshopstoragebucketd9b-mx1aevbdpmqy \
  --s3-key lambda-deployments/terrain-minimal.zip \
  --output json | jq -r '{FunctionName, LastModified, CodeSize}'

echo ""
echo "✅ Update complete!"
echo "🧪 Test with terrain analysis query"
