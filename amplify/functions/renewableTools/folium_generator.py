"""
Professional Folium Map Generator for Renewable Energy Analysis

This module provides comprehensive folium map generation capabilities with
professional styling, multiple tile layers, and interactive controls.
"""

import folium
from folium.raster_layers import TileLayer
from folium import plugins
import json
import logging
from typing import Dict, List, Optional, Tuple, Any

from visualization_config import config

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FoliumMapGenerator:
    """
    Generate folium maps using original demo styling and functionality
    
    Provides professional-grade interactive maps with:
    - Multiple tile layers (satellite, topo, street)
    - Consistent styling and color schemes
    - Interactive markers and popups
    - Layer controls and professional appearance
    """
    
    def __init__(self):
        """Initialize the folium map generator"""
        self.config = config
        logger.info("Initialized FoliumMapGenerator")
    
    def create_base_map(self, center_lat: float, center_lon: float, zoom: int = 12) -> folium.Map:
        """
        Create base map with multiple tile layers
        
        Args:
            center_lat: Center latitude for the map
            center_lon: Center longitude for the map
            zoom: Initial zoom level
            
        Returns:
            Folium map object with base configuration
        """
        logger.info(f"Creating base map centered at {center_lat}, {center_lon}")
        
        # Create base map
        m = folium.Map(
            location=[center_lat, center_lon],
            zoom_start=zoom,
            control_scale=True,
            prefer_canvas=True  # Better performance for complex maps
        )
        
        # Add multiple tile layers for professional mapping
        for layer_config in self.config.FOLIUM_CONFIG['tile_layers']:
            TileLayer(
                tiles=layer_config['tiles'],
                attr=layer_config['attr'],
                name=layer_config['name'],
                overlay=False,
                control=True
            ).add_to(m)
        
        return m
    
    def add_terrain_features(self, map_obj: folium.Map, boundaries_data: Dict) -> folium.Map:
        """
        Add terrain boundaries with consistent color scheme
        
        Args:
            map_obj: Folium map object
            boundaries_data: GeoJSON data containing terrain boundaries
            
        Returns:
            Updated folium map object
        """
        if not boundaries_data or not boundaries_data.get('features'):
            logger.warning("No terrain boundary data provided")
            return map_obj
        
        logger.info(f"Adding {len(boundaries_data['features'])} terrain features")
        
        for feature in boundaries_data['features']:
            feature_type = feature.get('properties', {}).get('feature_type', 'other')
            
            # Get color style for feature type
            color_style = self.config.get_terrain_color_style(feature_type)
            
            # Create detailed popup content
            props = feature.get('properties', {})
            popup_content = self._create_terrain_popup(feature_type, props)
            
            folium.GeoJson(
                feature,
                style_function=lambda x, style=color_style: style,
                popup=folium.Popup(popup_content, max_width=300, parse_html=True),
                tooltip=f"{feature_type.title()} - Unbuildable Area"
            ).add_to(map_obj)
        
        return map_obj
    
    def add_turbine_markers(self, map_obj: folium.Map, turbines_data: Dict) -> folium.Map:
        """
        Add turbine markers with popups and tooltips
        
        Args:
            map_obj: Folium map object
            turbines_data: GeoJSON data containing turbine positions
            
        Returns:
            Updated folium map object
        """
        if not turbines_data or not turbines_data.get('features'):
            logger.warning("No turbine data provided")
            return map_obj
        
        logger.info(f"Adding {len(turbines_data['features'])} turbine markers")
        
        for feature in turbines_data['features']:
            coords = feature['geometry']['coordinates']
            props = feature.get('properties', {})
            
            # Get turbine information
            turbine_id = props.get('turbine_id', props.get('id', 'N/A'))
            capacity = props.get('capacity_mw', props.get('capacity', 'N/A'))
            
            # Create detailed popup content
            popup_content = self._create_turbine_popup(turbine_id, coords, props)
            
            # Add turbine marker
            folium.Marker(
                [coords[1], coords[0]],  # lat, lon
                popup=folium.Popup(popup_content, max_width=350, parse_html=True),
                tooltip=f"Turbine {turbine_id}",
                icon=folium.Icon(
                    color=self.config.FOLIUM_CONFIG['marker_styles']['turbine']['color'],
                    icon=self.config.FOLIUM_CONFIG['marker_styles']['turbine']['icon'],
                    prefix=self.config.FOLIUM_CONFIG['marker_styles']['turbine'].get('prefix', 'glyphicon')
                )
            ).add_to(map_obj)
        
        return map_obj
    
    def add_wake_overlay(self, map_obj: folium.Map, wake_data: Dict) -> folium.Map:
        """
        Add wake analysis visualization overlay
        
        Args:
            map_obj: Folium map object
            wake_data: Wake analysis data
            
        Returns:
            Updated folium map object
        """
        if not wake_data:
            logger.warning("No wake data provided")
            return map_obj
        
        logger.info("Adding wake analysis overlay")
        
        # Add wake deficit contours if available
        if 'contours' in wake_data:
            for contour in wake_data['contours']:
                folium.GeoJson(
                    contour,
                    style_function=lambda x: {
                        'fillColor': 'red',
                        'color': 'darkred',
                        'weight': 1,
                        'fillOpacity': 0.3,
                        'opacity': 0.7
                    },
                    tooltip="Wake Deficit Zone"
                ).add_to(map_obj)
        
        # Add wake lines between turbines if available
        if 'wake_lines' in wake_data:
            for line in wake_data['wake_lines']:
                folium.PolyLine(
                    locations=line['coordinates'],
                    color='orange',
                    weight=2,
                    opacity=0.8,
                    tooltip=f"Wake Effect: {line.get('deficit', 'N/A')}%"
                ).add_to(map_obj)
        
        return map_obj
    
    def add_wake_heat_map_overlay(self, map_obj: folium.Map, wake_heat_data: Dict) -> folium.Map:
        """
        Add comprehensive wake analysis heat map overlays
        
        Args:
            map_obj: Folium map object
            wake_heat_data: Dictionary containing wake heat map data
            
        Returns:
            Updated folium map object
        """
        if not wake_heat_data:
            logger.warning("No wake heat map data provided")
            return map_obj
        
        logger.info("Adding wake analysis heat map overlays")
        
        # Add wake deficit heat map zones
        if 'heat_zones' in wake_heat_data:
            for zone in wake_heat_data['heat_zones']:
                deficit_percentage = zone.get('deficit', 0)
                
                # Color intensity based on wake deficit
                if deficit_percentage >= 20:
                    color = 'darkred'
                    opacity = 0.7
                    label = f"High Wake Loss ({deficit_percentage:.1f}%)"
                elif deficit_percentage >= 10:
                    color = 'red'
                    opacity = 0.5
                    label = f"Moderate Wake Loss ({deficit_percentage:.1f}%)"
                elif deficit_percentage >= 5:
                    color = 'orange'
                    opacity = 0.4
                    label = f"Low Wake Loss ({deficit_percentage:.1f}%)"
                else:
                    color = 'yellow'
                    opacity = 0.3
                    label = f"Minimal Wake Loss ({deficit_percentage:.1f}%)"
                
                folium.GeoJson(
                    zone['geometry'],
                    style_function=lambda x, color=color, opacity=opacity: {
                        'fillColor': color,
                        'color': color,
                        'weight': 1,
                        'fillOpacity': opacity,
                        'opacity': 0.8
                    },
                    popup=folium.Popup(
                        f"""
                        <div style="font-family: Arial, sans-serif;">
                            <h4 style="color: #2c3e50;">{label}</h4>
                            <p><strong>Energy Loss:</strong> {deficit_percentage:.1f}%</p>
                            <p><strong>Affected Turbines:</strong> {zone.get('affected_turbines', 'N/A')}</p>
                            <p><strong>Wind Direction:</strong> {zone.get('wind_direction', 'N/A')}°</p>
                            <p><strong>Impact Level:</strong> 
                            {'High' if deficit_percentage >= 20 else 'Moderate' if deficit_percentage >= 10 else 'Low'}</p>
                        </div>
                        """, 
                        max_width=300, parse_html=True
                    ),
                    tooltip=label
                ).add_to(map_obj)
        
        # Add turbine wake interaction lines
        if 'interaction_lines' in wake_heat_data:
            for interaction in wake_heat_data['interaction_lines']:
                deficit = interaction.get('deficit', 0)
                
                # Line style based on wake strength
                if deficit >= 15:
                    color = 'darkred'
                    weight = 4
                    opacity = 0.9
                elif deficit >= 8:
                    color = 'red'
                    weight = 3
                    opacity = 0.7
                elif deficit >= 3:
                    color = 'orange'
                    weight = 2
                    opacity = 0.6
                else:
                    color = 'yellow'
                    weight = 1
                    opacity = 0.4
                
                folium.PolyLine(
                    locations=interaction['coordinates'],
                    color=color,
                    weight=weight,
                    opacity=opacity,
                    popup=f"""
                    <div style="font-family: Arial, sans-serif;">
                        <h4>Turbine Wake Interaction</h4>
                        <p><strong>Wake Deficit:</strong> {deficit:.1f}%</p>
                        <p><strong>Distance:</strong> {interaction.get('distance', 'N/A')}m</p>
                        <p><strong>Source Turbine:</strong> {interaction.get('source_turbine', 'N/A')}</p>
                        <p><strong>Affected Turbine:</strong> {interaction.get('target_turbine', 'N/A')}</p>
                    </div>
                    """,
                    tooltip=f"Wake Effect: {deficit:.1f}%"
                ).add_to(map_obj)
        
        # Add wind direction arrows for context
        if 'wind_arrows' in wake_heat_data:
            for arrow in wake_heat_data['wind_arrows']:
                start_coords = arrow['start']
                end_coords = arrow['end']
                wind_speed = arrow.get('wind_speed', 0)
                
                # Arrow style based on wind speed
                if wind_speed >= 12:
                    color = 'blue'
                    weight = 3
                elif wind_speed >= 8:
                    color = 'lightblue'
                    weight = 2
                else:
                    color = 'lightgray'
                    weight = 1
                
                folium.PolyLine(
                    locations=[start_coords, end_coords],
                    color=color,
                    weight=weight,
                    opacity=0.8,
                    tooltip=f"Wind: {wind_speed:.1f} m/s"
                ).add_to(map_obj)
                
                # Add arrowhead marker
                folium.Marker(
                    end_coords,
                    icon=folium.Icon(
                        color='blue',
                        icon='arrow-up',
                        prefix='glyphicon'
                    ),
                    tooltip=f"Wind Direction: {arrow.get('direction', 'N/A')}°"
                ).add_to(map_obj)
        
        return map_obj
    
    def add_center_marker(self, map_obj: folium.Map, center_lat: float, center_lon: float, 
                         label: str = "Analysis Center") -> folium.Map:
        """
        Add center marker to the map
        
        Args:
            map_obj: Folium map object
            center_lat: Center latitude
            center_lon: Center longitude
            label: Label for the center marker
            
        Returns:
            Updated folium map object
        """
        folium.Marker(
            [center_lat, center_lon],
            popup=label,
            icon=folium.Icon(
                color=self.config.FOLIUM_CONFIG['marker_styles']['center']['color'],
                icon=self.config.FOLIUM_CONFIG['marker_styles']['center']['icon']
            ),
            tooltip=label
        ).add_to(map_obj)
        
        return map_obj
    
    def add_layer_control(self, map_obj: folium.Map) -> folium.Map:
        """
        Add layer control to the map
        
        Args:
            map_obj: Folium map object
            
        Returns:
            Updated folium map object
        """
        folium.LayerControl().add_to(map_obj)
        return map_obj
    
    def style_feature(self, feature_type: str) -> Dict:
        """
        Return consistent styling for different feature types
        
        Args:
            feature_type: Type of feature (water, highway, building, etc.)
            
        Returns:
            Style dictionary for folium
        """
        return self.config.get_terrain_color_style(feature_type)
    
    def _create_terrain_popup(self, feature_type: str, properties: Dict) -> str:
        """
        Create detailed popup content for terrain features
        
        Args:
            feature_type: Type of terrain feature
            properties: Feature properties
            
        Returns:
            HTML string for popup content
        """
        popup_html = f"""
        <div style="font-family: Arial, sans-serif; min-width: 200px;">
            <h4 style="color: #2c3e50; margin-bottom: 10px;">{feature_type.title()} Feature</h4>
            <p><strong>Type:</strong> {feature_type}</p>
        """
        
        # Add relevant properties
        if 'name' in properties:
            popup_html += f"<p><strong>Name:</strong> {properties['name']}</p>"
        
        if 'osm_id' in properties:
            popup_html += f"<p><strong>OSM ID:</strong> {properties['osm_id']}</p>"
        
        # Add tags if available
        tags = properties.get('tags', {})
        if tags:
            popup_html += "<p><strong>Details:</strong></p><ul>"
            for key, value in tags.items():
                if key in ['name', 'highway', 'building', 'natural', 'waterway']:
                    popup_html += f"<li>{key.title()}: {value}</li>"
            popup_html += "</ul>"
        
        popup_html += """
            <p style="color: #e74c3c; font-weight: bold;">⚠️ Unbuildable Area</p>
        </div>
        """
        
        return popup_html
    
    def _create_turbine_popup(self, turbine_id: str, coords: List[float], properties: Dict) -> str:
        """
        Create detailed popup content for turbine markers
        
        Args:
            turbine_id: Turbine identifier
            coords: Turbine coordinates [lon, lat]
            properties: Turbine properties
            
        Returns:
            HTML string for popup content
        """
        popup_html = f"""
        <div style="font-family: Arial, sans-serif; min-width: 250px;">
            <h4 style="color: #2980b9; margin-bottom: 10px;">🌪️ Turbine {turbine_id}</h4>
            <p><strong>Coordinates:</strong> {coords[1]:.6f}, {coords[0]:.6f}</p>
        """
        
        # Add capacity information
        capacity = properties.get('capacity_mw', properties.get('capacity', 'N/A'))
        if capacity != 'N/A':
            popup_html += f"<p><strong>Capacity:</strong> {capacity} MW</p>"
        
        # Add hub height if available
        hub_height = properties.get('hub_height', properties.get('height', 'N/A'))
        if hub_height != 'N/A':
            popup_html += f"<p><strong>Hub Height:</strong> {hub_height} m</p>"
        
        # Add rotor diameter if available
        rotor_diameter = properties.get('rotor_diameter', properties.get('diameter', 'N/A'))
        if rotor_diameter != 'N/A':
            popup_html += f"<p><strong>Rotor Diameter:</strong> {rotor_diameter} m</p>"
        
        # Add performance data if available
        if 'performance' in properties:
            perf = properties['performance']
            popup_html += f"<p><strong>Performance:</strong> {perf}%</p>"
        
        popup_html += "</div>"
        
        return popup_html
    
    def create_terrain_map(self, boundaries_data: Dict, center_lat: float, center_lon: float) -> str:
        """
        Create complete terrain analysis map
        
        Args:
            boundaries_data: GeoJSON data containing terrain boundaries
            center_lat: Center latitude for the map
            center_lon: Center longitude for the map
            
        Returns:
            HTML string of the folium map
        """
        logger.info("Creating complete terrain analysis map")
        
        # Create base map
        m = self.create_base_map(center_lat, center_lon)
        
        # Add terrain features
        m = self.add_terrain_features(m, boundaries_data)
        
        # Add center marker
        m = self.add_center_marker(m, center_lat, center_lon, "Analysis Center")
        
        # Add layer control
        m = self.add_layer_control(m)
        
        return m._repr_html_()
    
    def create_wind_farm_map(self, boundaries_data: Dict, turbines_data: Dict, 
                           center_lat: float, center_lon: float) -> str:
        """
        Create complete wind farm visualization map
        
        Args:
            boundaries_data: GeoJSON data containing terrain boundaries
            turbines_data: GeoJSON data containing turbine positions
            center_lat: Center latitude for the map
            center_lon: Center longitude for the map
            
        Returns:
            HTML string of the folium map
        """
        logger.info("Creating complete wind farm visualization map")
        
        # Create base map
        m = self.create_base_map(center_lat, center_lon)
        
        # Add terrain features (with reduced opacity for turbine visibility)
        if boundaries_data:
            # Temporarily modify opacity for better turbine visibility
            original_colors = self.config.TERRAIN_COLORS.copy()
            for feature_type in self.config.TERRAIN_COLORS:
                self.config.TERRAIN_COLORS[feature_type] = self.config.TERRAIN_COLORS[feature_type].copy()
                self.config.TERRAIN_COLORS[feature_type]['fillOpacity'] = 0.4
            
            m = self.add_terrain_features(m, boundaries_data)
            
            # Restore original colors
            self.config.TERRAIN_COLORS = original_colors
        
        # Add turbine markers
        m = self.add_turbine_markers(m, turbines_data)
        
        # Add center marker
        m = self.add_center_marker(m, center_lat, center_lon, "Project Center")
        
        # Add layer control
        m = self.add_layer_control(m)
        
        return m._repr_html_()
    
    def create_wake_analysis_map(self, wake_data: Dict, turbines_data: Dict) -> str:
        """
        Create wake analysis visualization map
        
        Args:
            wake_data: Wake analysis data
            turbines_data: GeoJSON data containing turbine positions
            
        Returns:
            HTML string of the folium map
        """
        logger.info("Creating wake analysis visualization map")
        
        # Get center from turbine data
        if turbines_data and turbines_data.get('features'):
            coords = [feature['geometry']['coordinates'] for feature in turbines_data['features']]
            center_lon = sum(coord[0] for coord in coords) / len(coords)
            center_lat = sum(coord[1] for coord in coords) / len(coords)
        else:
            center_lat, center_lon = 0, 0
        
        # Create base map
        m = self.create_base_map(center_lat, center_lon)
        
        # Add turbine markers
        m = self.add_turbine_markers(m, turbines_data)
        
        # Add wake overlay
        m = self.add_wake_overlay(m, wake_data)
        
        # Add center marker
        m = self.add_center_marker(m, center_lat, center_lon, "Wind Farm Center")
        
        # Add layer control
        m = self.add_layer_control(m)
        
        return m._repr_html_()  
  def add_elevation_contours(self, map_obj: folium.Map, elevation_data: Dict) -> folium.Map:
        """
        Add elevation contour overlays to the map
        
        Args:
            map_obj: Folium map object
            elevation_data: Dictionary containing elevation contour data
            
        Returns:
            Updated folium map object
        """
        if not elevation_data or 'contours' not in elevation_data:
            logger.warning("No elevation contour data provided")
            return map_obj
        
        logger.info("Adding elevation contour overlays")
        
        contours = elevation_data['contours']
        min_elevation = elevation_data.get('min_elevation', 0)
        max_elevation = elevation_data.get('max_elevation', 1000)
        
        # Create color scale for elevation
        elevation_range = max_elevation - min_elevation
        
        for contour in contours:
            elevation = contour.get('elevation', 0)
            
            # Calculate color based on elevation
            normalized_elevation = (elevation - min_elevation) / elevation_range if elevation_range > 0 else 0
            color_intensity = int(255 * (1 - normalized_elevation))  # Higher elevation = darker
            color = f'rgb({color_intensity}, {100 + color_intensity//2}, {50})'
            
            folium.GeoJson(
                contour['geometry'],
                style_function=lambda x, color=color: {
                    'fillColor': color,
                    'color': color,
                    'weight': 1,
                    'fillOpacity': 0.4,
                    'opacity': 0.8
                },
                popup=folium.Popup(f"Elevation: {elevation}m", max_width=200),
                tooltip=f"Elevation: {elevation}m"
            ).add_to(map_obj)
        
        return map_obj
    
    def add_slope_gradient_overlay(self, map_obj: folium.Map, slope_data: Dict) -> folium.Map:
        """
        Add slope gradient heat map visualization
        
        Args:
            map_obj: Folium map object
            slope_data: Dictionary containing slope gradient data
            
        Returns:
            Updated folium map object
        """
        if not slope_data:
            logger.warning("No slope data provided")
            return map_obj
        
        logger.info("Adding slope gradient overlay")
        
        # Add slope zones with different colors
        slope_zones = slope_data.get('zones', [])
        
        for zone in slope_zones:
            slope_percentage = zone.get('slope', 0)
            
            # Determine color based on slope
            if slope_percentage <= 5:
                color = 'green'
                opacity = 0.3
                label = f"Gentle Slope ({slope_percentage:.1f}%)"
            elif slope_percentage <= 15:
                color = 'orange'
                opacity = 0.4
                label = f"Moderate Slope ({slope_percentage:.1f}%)"
            else:
                color = 'red'
                opacity = 0.5
                label = f"Steep Slope ({slope_percentage:.1f}%)"
            
            folium.GeoJson(
                zone['geometry'],
                style_function=lambda x, color=color, opacity=opacity: {
                    'fillColor': color,
                    'color': color,
                    'weight': 1,
                    'fillOpacity': opacity,
                    'opacity': 0.8
                },
                popup=folium.Popup(
                    f"""
                    <div style="font-family: Arial, sans-serif;">
                        <h4 style="color: #2c3e50;">{label}</h4>
                        <p><strong>Construction Difficulty:</strong> 
                        {'Easy' if slope_percentage <= 5 else 'Moderate' if slope_percentage <= 15 else 'Difficult'}</p>
                        <p><strong>Access Requirements:</strong> 
                        {'Standard' if slope_percentage <= 5 else 'Enhanced' if slope_percentage <= 15 else 'Specialized'}</p>
                    </div>
                    """, 
                    max_width=300, parse_html=True
                ),
                tooltip=label
            ).add_to(map_obj)
        
        return map_obj
    
    def add_terrain_suitability_zones(self, map_obj: folium.Map, suitability_data: Dict) -> folium.Map:
        """
        Add terrain suitability analysis with color-coded zones
        
        Args:
            map_obj: Folium map object
            suitability_data: Dictionary containing suitability analysis data
            
        Returns:
            Updated folium map object
        """
        if not suitability_data:
            logger.warning("No suitability data provided")
            return map_obj
        
        logger.info("Adding terrain suitability zones")
        
        zones = suitability_data.get('zones', [])
        
        for zone in zones:
            suitability_score = zone.get('suitability', 0.5)
            
            # Determine color and label based on suitability score
            if suitability_score >= 0.8:
                color = 'darkgreen'
                label = 'Excellent'
                opacity = 0.6
            elif suitability_score >= 0.6:
                color = 'green'
                label = 'Good'
                opacity = 0.5
            elif suitability_score >= 0.4:
                color = 'yellow'
                label = 'Fair'
                opacity = 0.4
            elif suitability_score >= 0.2:
                color = 'orange'
                label = 'Poor'
                opacity = 0.4
            else:
                color = 'red'
                label = 'Unsuitable'
                opacity = 0.5
            
            folium.GeoJson(
                zone['geometry'],
                style_function=lambda x, color=color, opacity=opacity: {
                    'fillColor': color,
                    'color': color,
                    'weight': 2,
                    'fillOpacity': opacity,
                    'opacity': 0.8
                },
                popup=folium.Popup(
                    f"""
                    <div style="font-family: Arial, sans-serif;">
                        <h4 style="color: #2c3e50;">Suitability: {label}</h4>
                        <p><strong>Score:</strong> {suitability_score:.2f}/1.00</p>
                        <p><strong>Factors:</strong></p>
                        <ul>
                            <li>Slope: {zone.get('slope_factor', 'N/A')}</li>
                            <li>Access: {zone.get('access_factor', 'N/A')}</li>
                            <li>Environmental: {zone.get('env_factor', 'N/A')}</li>
                        </ul>
                    </div>
                    """, 
                    max_width=300, parse_html=True
                ),
                tooltip=f"Suitability: {label} ({suitability_score:.2f})"
            ).add_to(map_obj)
        
        return map_obj
    
    def create_topographic_analysis_map(self, elevation_data: Dict, slope_data: Dict, 
                                      suitability_data: Dict, center_lat: float, center_lon: float) -> str:
        """
        Create comprehensive topographic analysis map
        
        Args:
            elevation_data: Dictionary containing elevation contour data
            slope_data: Dictionary containing slope gradient data
            suitability_data: Dictionary containing suitability analysis data
            center_lat: Center latitude for the map
            center_lon: Center longitude for the map
            
        Returns:
            HTML string of the folium map
        """
        logger.info("Creating comprehensive topographic analysis map")
        
        # Create base map
        m = self.create_base_map(center_lat, center_lon, zoom=13)
        
        # Add elevation contours
        if elevation_data:
            m = self.add_elevation_contours(m, elevation_data)
        
        # Add slope gradient overlay
        if slope_data:
            m = self.add_slope_gradient_overlay(m, slope_data)
        
        # Add terrain suitability zones
        if suitability_data:
            m = self.add_terrain_suitability_zones(m, suitability_data)
        
        # Add center marker
        m = self.add_center_marker(m, center_lat, center_lon, "Topographic Analysis Center")
        
        # Add layer control
        m = self.add_layer_control(m)
        
        # Add custom legend
        legend_html = '''
        <div style="position: fixed; 
                    bottom: 50px; left: 50px; width: 200px; height: 120px; 
                    background-color: white; border:2px solid grey; z-index:9999; 
                    font-size:14px; padding: 10px">
        <h4>Topographic Legend</h4>
        <p><i class="fa fa-square" style="color:darkgreen"></i> Excellent Suitability</p>
        <p><i class="fa fa-square" style="color:green"></i> Good Suitability</p>
        <p><i class="fa fa-square" style="color:orange"></i> Moderate Slope</p>
        <p><i class="fa fa-square" style="color:red"></i> Steep Slope</p>
        </div>
        '''
        m.get_root().html.add_child(folium.Element(legend_html))
        
        return m._repr_html_()  
  
    def create_comprehensive_wake_analysis_map(self, wake_heat_data: Dict, turbines_data: Dict, 
                                             boundaries_data: Optional[Dict] = None) -> str:
        """
        Create comprehensive wake analysis map with heat map overlays
        
        Args:
            wake_heat_data: Dictionary containing wake heat map analysis data
            turbines_data: GeoJSON data containing turbine positions
            boundaries_data: Optional terrain boundaries data
            
        Returns:
            HTML string of the folium map
        """
        logger.info("Creating comprehensive wake analysis map with heat overlays")
        
        # Get center from turbine data
        if turbines_data and turbines_data.get('features'):
            coords = [feature['geometry']['coordinates'] for feature in turbines_data['features']]
            center_lon = sum(coord[0] for coord in coords) / len(coords)
            center_lat = sum(coord[1] for coord in coords) / len(coords)
        else:
            center_lat, center_lon = 0, 0
        
        # Create base map
        m = self.create_base_map(center_lat, center_lon, zoom=14)
        
        # Add terrain boundaries with reduced opacity
        if boundaries_data:
            original_colors = self.config.TERRAIN_COLORS.copy()
            for feature_type in self.config.TERRAIN_COLORS:
                self.config.TERRAIN_COLORS[feature_type] = self.config.TERRAIN_COLORS[feature_type].copy()
                self.config.TERRAIN_COLORS[feature_type]['fillOpacity'] = 0.2
            
            m = self.add_terrain_features(m, boundaries_data)
            self.config.TERRAIN_COLORS = original_colors
        
        # Add turbine markers
        m = self.add_turbine_markers(m, turbines_data)
        
        # Add comprehensive wake heat map overlays
        m = self.add_wake_heat_map_overlay(m, wake_heat_data)
        
        # Add center marker
        m = self.add_center_marker(m, center_lat, center_lon, "Wake Analysis Center")
        
        # Add layer control
        m = self.add_layer_control(m)
        
        # Add wake analysis legend
        legend_html = '''
        <div style="position: fixed; 
                    bottom: 50px; left: 50px; width: 220px; height: 160px; 
                    background-color: white; border:2px solid grey; z-index:9999; 
                    font-size:12px; padding: 10px">
        <h4>Wake Analysis Legend</h4>
        <p><i class="fa fa-square" style="color:darkred"></i> High Wake Loss (>20%)</p>
        <p><i class="fa fa-square" style="color:red"></i> Moderate Wake Loss (10-20%)</p>
        <p><i class="fa fa-square" style="color:orange"></i> Low Wake Loss (5-10%)</p>
        <p><i class="fa fa-square" style="color:yellow"></i> Minimal Wake Loss (<5%)</p>
        <p><i class="fa fa-arrow-up" style="color:blue"></i> Wind Direction</p>
        <p><i class="fa fa-map-marker" style="color:red"></i> Wind Turbines</p>
        </div>
        '''
        m.get_root().html.add_child(folium.Element(legend_html))
        
        return m._repr_html_()