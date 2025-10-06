from strands import tool
import requests
import json
import os
import folium
from shapely.geometry import shape, Point
from shapely.ops import unary_union
import geopandas as gpd
import numpy as np
from .storage_utils import save_file_with_storage

import matplotlib
matplotlib.use('Agg')  # Use non-GUI backend
import matplotlib.pyplot as plt
import tempfile
import io
import math
from PIL import Image

import logging
logger = logging.getLogger(__name__)


def query_overpass(lat, lon, radius_km=5, setback_distance_m=100):
    """Query Overpass API for terrain features around a location with adjustable setback"""
    
    logger.debug(f"Starting Overpass query for lat={lat}, lon={lon}, radius={radius_km}km")
    
    # Convert radius to degrees (approximate)
    radius_deg = radius_km / 111.32
    
    # Calculate bounding box
    south = lat - radius_deg
    north = lat + radius_deg
    west = lon - radius_deg
    east = lon + radius_deg
    
    # Overpass query with geometry output
    query = f"""
    [out:json][timeout:25];
    (
      // Water Bodies
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

      // Buildings and Structures
      way["building"]({south},{west},{north},{east});
      relation["building"]({south},{west},{north},{east});
      way["man_made"]({south},{west},{north},{east});
      node["man_made"]({south},{west},{north},{east});
      way["building"="residential"]({south},{west},{north},{east});
      way["building"="commercial"]({south},{west},{north},{east});
      way["building"="industrial"]({south},{west},{north},{east});
      way["building"="retail"]({south},{west},{north},{east});
      way["building"="warehouse"]({south},{west},{north},{east});
      way["building"="church"]({south},{west},{north},{east});
      way["building"="mosque"]({south},{west},{north},{east});
      way["building"="temple"]({south},{west},{north},{east});
      way["building"="school"]({south},{west},{north},{east});
      way["building"="hospital"]({south},{west},{north},{east});

      // Infrastructure
      way["highway"]({south},{west},{north},{east});
      way["railway"]({south},{west},{north},{east});
      way["bridge"]({south},{west},{north},{east});
      way["tunnel"]({south},{west},{north},{east});

      // Other structures
      way["leisure"]({south},{west},{north},{east});
      way["amenity"]({south},{west},{north},{east});
      node["amenity"]({south},{west},{north},{east});
      way["landuse"="industrial"]({south},{west},{north},{east});
      way["landuse"="commercial"]({south},{west},{north},{east});
    );
    out geom;
    """
    
    # Make request to Overpass API
    url = "https://overpass-api.de/api/interpreter"
    
    response = requests.post(url, data=query, timeout=30)
    logger.debug(f"Overpass API response status: {response.status_code}")
    
    if response.status_code != 200:
        logger.error(f"Overpass API error: {response.status_code}, response: {response.text[:500]}")
        raise Exception(f"Overpass API error: {response.status_code}")
    
    # Convert to GeoJSON
    osm_data = response.json()
    logger.debug(f"OSM data contains {len(osm_data.get('elements', []))} elements")
    
    geojson_data = osm_to_geojson(osm_data)
    logger.debug(f"Converted to GeoJSON with {len(geojson_data.get('features', []))} features")
    
    # Filter features within radius
    geojson_data = filter_by_radius(geojson_data, lat, lon, radius_km)
    logger.debug(f"After radius filter: {len(geojson_data.get('features', []))} features")
    
    # Apply setback if specified
    if setback_distance_m > 0:
        geojson_data = apply_setback(geojson_data, setback_distance_m)
        logger.debug(f"After setback: {len(geojson_data.get('features', []))} features")
    
    # Simplify by merging geometries
    geojson_data = simplify_geojson_union(geojson_data)
    logger.debug(f"After simplification: {len(geojson_data.get('features', []))} features")
    
    return geojson_data

def filter_by_radius(geojson_data, center_lat, center_lon, radius_km):
    """Filter features to only include those within radius of center point"""
    
    gdf = gpd.GeoDataFrame.from_features(geojson_data['features'])
    if gdf.empty:
        return geojson_data
    
    # Create center point
    center_point = Point(center_lon, center_lat)
    
    # Set CRS and convert to UTM for accurate distance
    gdf.crs = 'EPSG:4326'
    gdf_utm = gdf.to_crs('EPSG:32614')
    center_utm = gpd.GeoSeries([center_point], crs='EPSG:4326').to_crs('EPSG:32614').iloc[0]
    
    # Filter by distance
    radius_m = radius_km * 1000
    gdf_filtered = gdf_utm[gdf_utm.distance(center_utm) <= radius_m]
    
    # Convert back to WGS84
    gdf_filtered = gdf_filtered.to_crs('EPSG:4326')
    
    return json.loads(gdf_filtered.to_json())

def osm_to_geojson(osm_data):
    """Convert OSM data to GeoJSON format"""
    
    features = []
    
    for element in osm_data['elements']:
        if element['type'] == 'way' and 'geometry' in element:
            coords = [[pt['lon'], pt['lat']] for pt in element['geometry']]
            
            if len(coords) > 1:
                geom_type = "Polygon" if coords[0] == coords[-1] and len(coords) > 3 else "LineString"
                if geom_type == "Polygon":
                    coords = [coords]
                
                features.append({
                    "type": "Feature",
                    "geometry": {"type": geom_type, "coordinates": coords},
                    "properties": element.get('tags', {})
                })
    
    return {"type": "FeatureCollection", "features": features}

def apply_setback(geojson_data, setback_distance_m):
    """Apply setback buffer to non-buildable features"""
    
    # Convert to GeoDataFrame for easier processing
    gdf = gpd.GeoDataFrame.from_features(geojson_data['features'])
    
    if gdf.empty:
        return geojson_data
    
    # Set CRS to WGS84
    gdf.crs = 'EPSG:4326'
    
    # Convert to UTM for accurate distance calculations
    # Use UTM zone 14N for Texas (approximate)
    gdf_utm = gdf.to_crs('EPSG:32614')
    
    # Apply buffer (setback) to all geometries
    gdf_utm['geometry'] = gdf_utm.geometry.buffer(setback_distance_m)
    
    # Convert back to WGS84
    gdf_buffered = gdf_utm.to_crs('EPSG:4326')
    
    # Add setback information to properties
    gdf_buffered['setback_applied'] = True
    gdf_buffered['setback_distance_m'] = setback_distance_m
    
    # Convert back to GeoJSON
    return json.loads(gdf_buffered.to_json())

def simplify_geojson_union(geojson_data):
    """Reduce GeoJSON size by merging overlapping/adjacent polygons by type"""
    
    try:
        gdf = gpd.GeoDataFrame.from_features(geojson_data['features'])
        if gdf.empty:
            return geojson_data
        
        # Medium simplification (tolerance ~25m) + remove small areas
        gdf['geometry'] = gdf.geometry.simplify(tolerance=0.0003, preserve_topology=True)
        
        # Remove tiny polygons (less than ~1000 sq meters)
        gdf = gdf[gdf.geometry.area > 0.00001]
        
        # Group by feature type
        groups = {
            'buildings': gdf[gdf['building'].notna()],
            'roads': gdf[gdf['highway'].notna()], 
            'water': gdf[(gdf['natural'] == 'water') | (gdf['waterway'].notna())],
            'other': gdf[(gdf['building'].isna()) & (gdf['highway'].isna()) & 
                        (gdf['natural'] != 'water') & (gdf['waterway'].isna())]
        }
        
        merged_features = []
        for group_name, group_gdf in groups.items():
            if not group_gdf.empty:
                merged_geom = unary_union(group_gdf.geometry)
                # Post-union simplification
                merged_geom = merged_geom.simplify(tolerance=0.0005, preserve_topology=True)
                merged_features.append({
                    "type": "Feature",
                    "geometry": merged_geom.__geo_interface__,
                    "properties": {
                        "feature_type": group_name,
                        "original_count": len(group_gdf)
                    }
                })
        
        return {"type": "FeatureCollection", "features": merged_features}
    except Exception as e:
        print(f"Simplification failed: {e}")
        return geojson_data

def save_analysis_results(geojson_data, latitude, longitude, project_id):
    """Save GeoJSON data and create interactive map"""
    
    try:
        # Define filenames without project_id
        geojson_filename = "boundaries.geojson"
        map_filename = "boundaries.html"
        png_filename = "boundaries.png"
        
        # Save GeoJSON using storage utility
        save_file_with_storage(
            json.dumps(geojson_data, indent=2),
            project_id,
            geojson_filename,
            "text",
            "terrain_agent"
        )
        
        # Create interactive map with ArcGIS World Imagery basemap
        m = folium.Map(location=[latitude, longitude], zoom_start=12)
        
        # Add ArcGIS World Imagery basemap
        folium.TileLayer(
            tiles='https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            attr='Esri',
            name='Satellite',
            overlay=False,
            control=True
        ).add_to(m)
        
        # Add features with different colors based on type
        for feature in geojson_data.get('features', []):
            feature_type = feature.get('properties', {}).get('feature_type', 'other')
            
            if feature_type == 'water':
                color_style = {'fillColor': 'blue', 'color': 'darkblue', 'weight': 2, 'fillOpacity': 0.4, 'opacity': 0.8}
            elif feature_type == 'roads':
                color_style = {'fillColor': 'orange', 'color': 'darkorange', 'weight': 2, 'fillOpacity': 0.4, 'opacity': 0.8}
            elif feature_type == 'buildings':
                color_style = {'fillColor': 'red', 'color': 'darkred', 'weight': 2, 'fillOpacity': 0.4, 'opacity': 0.8}
            else:
                color_style = {'fillColor': 'purple', 'color': 'darkviolet', 'weight': 2, 'fillOpacity': 0.4, 'opacity': 0.8}
            
            folium.GeoJson(feature, style_function=lambda x, style=color_style: style).add_to(m)
        
        # Add center marker
        folium.Marker([latitude, longitude], popup="Analysis Center").add_to(m)
        
        # Save HTML map to temp file and use storage utility
        with tempfile.NamedTemporaryFile(suffix='.html', delete=False) as temp_file:
            m.save(temp_file.name)
            save_file_with_storage(
                temp_file.name,
                project_id,
                map_filename,
                "file_copy",
                "terrain_agent"
            )
            os.unlink(temp_file.name)
        
        # Create and save PNG image using ArcGIS satellite imagery
        try:
            # Calculate bounding box for satellite imagery
            radius_m = 5000  # 5km radius for terrain visualization
            meters_per_degree = 111319.9
            radius_deg_lat = radius_m / meters_per_degree
            radius_deg_lon = radius_m / (meters_per_degree * abs(math.cos(math.radians(latitude))))
            
            bbox_west = longitude - radius_deg_lon
            bbox_east = longitude + radius_deg_lon
            bbox_south = latitude - radius_deg_lat
            bbox_north = latitude + radius_deg_lat
            
            # Get satellite imagery from ArcGIS
            service_url = "https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/export"
            params = {
                'bbox': f'{bbox_west},{bbox_south},{bbox_east},{bbox_north}',
                'bboxSR': '4326',
                'imageSR': '4326',
                'size': '1024,1024',
                'format': 'jpg',
                'f': 'image'
            }
            
            response = requests.get(service_url, params=params, timeout=60)
            
            logger.debug(f"Requesting satellite imagery from ArcGIS: {response.status_code}")
            if response.status_code == 200:
                # Load base satellite image
                base_image = Image.open(io.BytesIO(response.content))
                if base_image.mode in ('RGBA', 'LA'):
                    base_image = base_image.convert('RGB')
                
                # Create figure with satellite background
                fig, ax = plt.subplots(figsize=(12, 8))
                extent = [bbox_west, bbox_east, bbox_south, bbox_north]
                ax.imshow(base_image, extent=extent, aspect='auto')
                
                # Overlay exclusion zones
                gdf_plot = gpd.GeoDataFrame.from_features(geojson_data['features'])
                if not gdf_plot.empty:
                    gdf_plot.crs = 'EPSG:4326'
                    
                    for feature_type in gdf_plot['feature_type'].unique():
                        subset = gdf_plot[gdf_plot['feature_type'] == feature_type]
                        if feature_type == 'water':
                            subset.plot(ax=ax, color='blue', alpha=0.6, edgecolor='darkblue', linewidth=1)
                        elif feature_type == 'roads':
                            subset.plot(ax=ax, color='orange', alpha=0.6, edgecolor='darkorange', linewidth=1)
                        elif feature_type == 'buildings':
                            subset.plot(ax=ax, color='red', alpha=0.6, edgecolor='darkred', linewidth=1)
                        else:
                            subset.plot(ax=ax, color='purple', alpha=0.6, edgecolor='darkviolet', linewidth=1)
                
                # Add center point
                # ax.scatter(longitude, latitude, c='white', s=100, marker='o', linewidths=3, edgecolors='black', zorder=5)
                
                ax.set_title(f'Unbuildable Areas - {latitude:.4f}, {longitude:.4f}', fontsize=12)
                ax.set_xlabel('Longitude')
                ax.set_ylabel('Latitude')
                
                # Format axis labels
                ax.tick_params(axis='both', which='major', labelsize=8)
                ax.xaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f'{x:.2f}'))
                ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda y, p: f'{y:.2f}'))
                ax.set_xlim(extent[0], extent[1])
                ax.set_ylim(extent[2], extent[3])
                
                # Save PNG to temp file and use storage utility
                with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as temp_file:
                    plt.savefig(temp_file.name, dpi=250, bbox_inches='tight', facecolor='white')
                    plt.close()
                    
                    save_file_with_storage(
                        temp_file.name,
                        project_id,
                        png_filename,
                        "file_copy",
                        "terrain_agent"
                    )
                    os.unlink(temp_file.name)
            else:
                logger.warning(f"Failed to get satellite imagery: HTTP {response.status_code}")
                logger.debug(f"Response content: {response.text[:200]}")
                    
        except Exception as e:
            logger.error(f"PNG export failed: {e}", exc_info=True)
        
        return {
            "geojson_filename": geojson_filename,
            "map_filename": map_filename,
            "png_filename": png_filename,
            "message": "Files saved successfully"
        }
        
    except Exception as e:
        logger.error(f"Failed to save results: {str(e)}", exc_info=True)
        return {"error": f"Failed to save results: {str(e)}"}

@tool
def get_unbuildable_areas(latitude: float, longitude: float, project_id: str, 
                         radius_km: float = 5.0, setback_m: int = 100) -> dict:
    """
    Analyze terrain and identify unbuildable areas (exclusion zones) for renewable energy projects.
    
    This tool queries geographic databases to find terrain features that create constraints for 
    wind and solar installations, including water bodies, buildings, roads, and other infrastructure.
    Safety setbacks are automatically applied to create buffer zones around identified features.
    Results are automatically saved to the assets folder as both GeoJSON and interactive map.
    
    Args:
        latitude (float): Latitude coordinate for the analysis center point (required)
        longitude (float): Longitude coordinate for the analysis center point (required)
        project_id (str): unique project identifier (required)
        radius_km (float): Analysis radius in kilometers (default: 5.0, max recommended: 10.0)
        setback_m (int): Safety setback distance from features in meters (default: 100)
    
    Returns:
        dict: Analysis results containing:
            - success (bool): Whether analysis completed successfully
            - GeoJSON_data (dict): Boundary data for unbuildable areas
            - project_id (str): The project identifier used for saved files
            - saved_files (dict): Paths to saved GeoJSON and map files
            - message (str): Status message with file information
            - error (str): Error details if analysis failed
    
    Note: Files are saved as '<project_id>_boundaries.geojson' and '<project_id>_map.html'
    Map colors: Blue=Water, Orange=Roads, Red=Buildings, Purple=Other
    """
    
    try:
        logger.info(f"Starting terrain analysis for coordinates {latitude}, {longitude}")
        logger.info(f"Parameters: radius_km={radius_km}, setback_m={setback_m}, project_id={project_id}")
        
        # Query terrain features with setback
        terrain_data = query_overpass(latitude, longitude, radius_km, setback_m)
        logger.debug(f"Overpass query completed. Found {len(terrain_data.get('features', []))} features")
        
        # Save results to assets folder
        save_result = save_analysis_results(terrain_data, latitude, longitude, project_id)
        
        if "error" in save_result:
            logger.error(f"Save failed: {save_result['error']}")
            return {
                "success": False,
                "error": save_result["error"]
            }
        
        return {
            "success": True,
            "GeoJSON_data": terrain_data,
            "project_id": project_id,
            "saved_files": save_result,
            "message": f"Analysis completed. Files saved with ID: {project_id}"
        }
        
    except Exception as e:
        logger.error(f"Terrain analysis failed: {str(e)}", exc_info=True)
        return {
            "success": False,
            "error": f"Analysis failed: {str(e)}"
        }


