import sys
import os
import json
import folium
from folium.raster_layers import TileLayer
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from scipy.spatial.distance import pdist, squareform
from scipy import stats


# Visualization helper functions
def get_geojson_center(geojson_data):
    """Calculate the center point of a GeoJSON feature collection"""
    if not geojson_data.get('features'):
        return 0, 0  # Fallback to our known coordinates
        
    coords = []
    for feature in geojson_data['features']:
        if feature['geometry']['type'] == 'Point':
            coords.append(feature['geometry']['coordinates'])
        elif feature['geometry']['type'] in ['Polygon', 'MultiPolygon']:
            # For polygons, get centroid
            try:
                from shapely.geometry import shape
                geom = shape(feature['geometry'])
                centroid = geom.centroid
                coords.append([centroid.x, centroid.y])
            except:
                pass
    
    if coords:
        coords = np.array(coords)
        center_lon = np.mean(coords[:, 0])
        center_lat = np.mean(coords[:, 1])
        return center_lat, center_lon
    
    return 0, 0

def load_project_data(project_id):
    """Load project data from storage (S3 or local)"""
    from agents.tools.storage_utils import load_file_from_storage
    
    boundaries = None
    turbines = None
    
    try:
        # Load boundary data from terrain_agent folder
        file_path = load_file_from_storage(project_id, "boundaries.geojson", "terrain_agent")
        with open(file_path, 'r') as file:
            boundaries = json.load(file)

    except Exception as e:
        print(f"Could not load boundary data: {e}")
    
    try:
        # Load turbine layout data from layout_agent folder
        file_path = load_file_from_storage(project_id, "turbine_layout.geojson", "layout_agent")
        with open(file_path, 'r') as file:
            turbines = json.load(file)

    except Exception as e:
        print(f"Could not load turbine layout data: {e}")
    
    return boundaries, turbines

# Create terrain boundaries visualization
def create_terrain_map(boundaries_data, center_lat, center_lon):
    """Create interactive map showing terrain boundaries"""
    
    # Create base map
    m = folium.Map(
        location=[center_lat, center_lon],
        zoom_start=12,
        control_scale=True
    )
    
    # Add multiple tile layers
    TileLayer(
        tiles='https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}',
        attr='USGS The National Map',
        name='USGS Topo',
        overlay=False,
        control=True
    ).add_to(m)

    TileLayer(
        tiles='https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/{z}/{y}/{x}',
        attr='USGS The National Map',
        name='USGS Satellite',
        overlay=False,
        control=True
    ).add_to(m)
    
    TileLayer(
        tiles='https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryTopo/MapServer/tile/{z}/{y}/{x}',
        attr='USGS The National Map',
        name='USGS Imagery + Topo',
        overlay=False,
        control=True
    ).add_to(m)
    
    TileLayer(
        tiles='https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attr='Esri',
        name='Satellite',
        overlay=False,
        control=True
    ).add_to(m)
    
    # Add boundary features with consistent colors
    if boundaries_data:
        for feature in boundaries_data.get('features', []):
            feature_type = feature.get('properties', {}).get('feature_type', 'other')
            
            # Use consistent color scheme
            if feature_type == 'water':
                color_style = {'fillColor': 'blue', 'color': 'darkblue', 'weight': 2, 'fillOpacity': 0.6, 'opacity': 0.8}
            elif feature_type == 'roads':
                color_style = {'fillColor': 'orange', 'color': 'darkorange', 'weight': 2, 'fillOpacity': 0.6, 'opacity': 0.8}
            elif feature_type == 'buildings':
                color_style = {'fillColor': 'red', 'color': 'darkred', 'weight': 2, 'fillOpacity': 0.6, 'opacity': 0.8}
            else:
                color_style = {'fillColor': 'purple', 'color': 'darkviolet', 'weight': 2, 'fillOpacity': 0.6, 'opacity': 0.8}
            
            folium.GeoJson(
                feature,
                style_function=lambda x, style=color_style: style,
                popup=folium.Popup(f"Type: {feature_type.title()}", parse_html=True),
                tooltip=f"{feature_type.title()} - Unbuildable Area",
                name=f"{feature_type.title()} - Unbuildable Area"
            ).add_to(m)
    
    # Add center marker
    folium.Marker(
        [center_lat, center_lon],
        popup="Analysis Center",
        icon=folium.Icon(color='green', icon='info-sign'),
        tooltip="Analysis Center",
        name="Analysis Center"
    ).add_to(m)
    
    # Add layer control
    folium.LayerControl().add_to(m)
    
    return m

# Create complete wind farm visualization
def create_wind_farm_map(boundaries_data, turbines_data, center_lat, center_lon):
    """Create interactive map showing both boundaries and turbine layout"""
    
    # Create base map
    m = folium.Map(
        location=[center_lat, center_lon],
        zoom_start=12,
        control_scale=True
    )
    
    # Add multiple tile layers
    TileLayer(
        tiles='https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}',
        attr='USGS The National Map',
        name='USGS Topo',
        overlay=False,
        control=True
    ).add_to(m)

    TileLayer(
        tiles='https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/{z}/{y}/{x}',
        attr='USGS The National Map',
        name='USGS Satellite',
        overlay=False,
        control=True
    ).add_to(m)
    
    TileLayer(
        tiles='https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryTopo/MapServer/tile/{z}/{y}/{x}',
        attr='USGS The National Map',
        name='USGS Imagery + Topo',
        overlay=False,
        control=True
    ).add_to(m)
    
    TileLayer(
        tiles='https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attr='Esri',
        name='Satellite',
        overlay=False,
        control=True
    ).add_to(m)
    
    # Add boundary features (same as terrain map)
    if boundaries_data:
        for feature in boundaries_data.get('features', []):
            feature_type = feature.get('properties', {}).get('feature_type', 'other')
            
            if feature_type == 'water':
                color_style = {'fillColor': 'blue', 'color': 'darkblue', 'weight': 2, 'fillOpacity': 0.4, 'opacity': 0.8}
            elif feature_type == 'roads':
                color_style = {'fillColor': 'orange', 'color': 'darkorange', 'weight': 2, 'fillOpacity': 0.4, 'opacity': 0.8}
            elif feature_type == 'buildings':
                color_style = {'fillColor': 'red', 'color': 'darkred', 'weight': 2, 'fillOpacity': 0.4, 'opacity': 0.8}
            else:
                color_style = {'fillColor': 'purple', 'color': 'darkviolet', 'weight': 2, 'fillOpacity': 0.4, 'opacity': 0.8}
            
            folium.GeoJson(
                feature,
                style_function=lambda x, style=color_style: style,
                popup=folium.Popup(f"Unbuildable: {feature_type.title()}", parse_html=True),
                tooltip=f"{feature_type.title()} - Unbuildable Area",
                name=f"{feature_type.title()} - Unbuildable Area"
            ).add_to(m)
    
    # Add turbine locations
    if turbines_data:
        for feature in turbines_data.get('features', []):
            coords = feature['geometry']['coordinates']
            props = feature.get('properties', {})
            
            folium.Marker(
                [coords[1], coords[0]],
                tooltip=f"Turbine {props.get('turbine_id', 'N/A')}",
                name=f"Turbine {props.get('turbine_id', 'N/A')}"
            ).add_to(m)
    
    # Add center marker
    folium.Marker(
        [center_lat, center_lon],
        popup="Project Center",
        icon=folium.Icon(color='green', icon='info-sign'),
        tooltip="Project Center",
        name="Project Center"
    ).add_to(m)
    
    # Add layer control
    folium.LayerControl().add_to(m)
    
    return m

# Create complete wind farm visualization
def validate_turbine_layout(geojson_data, min_spacing_m=500):
    """Validate the turbine layout by checking the minimum space between the turbines"""
    
    if not geojson_data or 'features' not in geojson_data:
        print("No valid GeoJSON data available for validation")
        return None
    
    # Extract turbine coordinates and properties
    turbine_data = []
    for feature in geojson_data['features']:
        if feature['geometry']['type'] == 'Point':
            lon, lat = feature['geometry']['coordinates']
            turbine_id = feature['properties'].get('turbine_id', 'Unknown')
            turbine_data.append({
                'turbine_id': turbine_id,
                'longitude': lon,
                'latitude': lat,
                'properties': feature['properties']
            })
    
    # Convert to DataFrame for easier analysis
    df = pd.DataFrame(turbine_data)
    
    # Check 1: Number of turbines
    num_turbines = len(df)
    print(f"Number of turbines: {num_turbines}")
    
    # Check 2: Calculate distances between turbines
    # Convert lat/lon to approximate meters (simplified approach)
    earth_radius = 6371000  # meters
    meters_per_lat = 111320  # meters per degree of latitude
    
    # Convert to x, y coordinates (approximate meters)
    mean_lat = df['latitude'].mean()
    meters_per_lon = meters_per_lat * np.cos(np.radians(mean_lat))
    
    df['x'] = (df['longitude'] - df['longitude'].min()) * meters_per_lon
    df['y'] = (df['latitude'] - df['latitude'].min()) * meters_per_lat
    
    # Calculate distance matrix
    coords = df[['x', 'y']].values
    dist_matrix = squareform(pdist(coords))
    
    # Set diagonal to infinity to ignore self-distances
    np.fill_diagonal(dist_matrix, np.inf)
    
    # Find minimum distance between any two turbines
    min_dist = np.min(dist_matrix)
    min_dist_indices = np.unravel_index(np.argmin(dist_matrix), dist_matrix.shape)
    
    print(f"Minimum distance between turbines: {min_dist:.2f} meters")
    print(f"  Between turbines {df.iloc[min_dist_indices[0]]['turbine_id']} and {df.iloc[min_dist_indices[1]]['turbine_id']}")
    
    # Check if minimum spacing requirement is met
    if min_dist < min_spacing_m:
        print(f"⚠️ Warning: Minimum spacing requirement of {min_spacing_m}m not met!")
    else:
        print(f"✅ Minimum spacing requirement of {min_spacing_m}m is met")
    
    # Visualize the layout with distances
    plt.figure(figsize=(10, 8))
    plt.scatter(df['x'], df['y'], s=100, c='blue')
    
    # Add turbine IDs as labels
    for i, row in df.iterrows():
        plt.text(row['x'], row['y'], row['turbine_id'], fontsize=12)
    
    # Highlight the closest pair
    plt.plot([df.iloc[min_dist_indices[0]]['x'], df.iloc[min_dist_indices[1]]['x']], 
             [df.iloc[min_dist_indices[0]]['y'], df.iloc[min_dist_indices[1]]['y']], 'r-', linewidth=2)
    
    plt.title(f"Turbine Layout (min distance: {min_dist:.2f}m)")
    plt.xlabel("X distance (meters)")
    plt.ylabel("Y distance (meters)")
    plt.axis('equal')
    plt.grid(True)
    plt.show()
    
    return df