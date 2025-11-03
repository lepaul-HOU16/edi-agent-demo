"""
Visualization Configuration for Renewable Energy Tools

This module provides configuration settings for all visualization components,
ensuring consistency across different tools and environments.
"""

import os
from typing import Dict, List, Tuple

class VisualizationConfig:
    """Configuration class for renewable energy visualizations"""
    
    # S3 Storage Configuration
    S3_BUCKET = os.environ.get('RENEWABLE_S3_BUCKET', 'renewable-energy-artifacts')
    AWS_REGION = os.environ.get('RENEWABLE_AWS_REGION', 'us-west-2')
    S3_PREFIX = 'visualizations'
    CACHE_CONTROL = 'max-age=86400'  # 24 hours
    
    # Folium Map Configuration
    FOLIUM_CONFIG = {
        'default_zoom': 12,
        'tile_layers': [
            {
                'tiles': 'https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}',
                'attr': 'USGS The National Map',
                'name': 'USGS Topo'
            },
            {
                'tiles': 'https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/{z}/{y}/{x}',
                'attr': 'USGS The National Map',
                'name': 'USGS Satellite'
            },
            {
                'tiles': 'https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryTopo/MapServer/tile/{z}/{y}/{x}',
                'attr': 'USGS The National Map',
                'name': 'USGS Imagery + Topo'
            },
            {
                'tiles': 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                'attr': 'Esri',
                'name': 'Satellite'
            }
        ],
        'marker_styles': {
            'turbine': {'color': 'blue', 'icon': 'flash', 'prefix': 'fa'},
            'center': {'color': 'green', 'icon': 'info-sign'},
            'obstacle': {'color': 'red', 'icon': 'warning-sign'}
        }
    }
    
    # Matplotlib Configuration
    MATPLOTLIB_CONFIG = {
        'style': 'seaborn-v0_8-whitegrid',
        'figure_size': (12, 8),
        'dpi': 100,
        'save_dpi': 300,
        'font_size': 12,
        'title_size': 16,
        'label_size': 12,
        'tick_size': 10,
        'legend_size': 11,
        'grid_alpha': 0.3
    }
    
    # Color Schemes
    TERRAIN_COLORS = {
        'water': {'fillColor': 'blue', 'color': 'darkblue', 'weight': 2, 'fillOpacity': 0.6, 'opacity': 0.8},
        'highway': {'fillColor': 'orange', 'color': 'darkorange', 'weight': 2, 'fillOpacity': 0.6, 'opacity': 0.8},
        'building': {'fillColor': 'red', 'color': 'darkred', 'weight': 2, 'fillOpacity': 0.6, 'opacity': 0.8},
        'other': {'fillColor': 'purple', 'color': 'darkviolet', 'weight': 2, 'fillOpacity': 0.6, 'opacity': 0.8}
    }
    
    # Wind Rose Configuration
    WIND_ROSE_CONFIG = {
        'bins': 16,
        'speed_bins': [0, 5, 10, 15, 20, 25, 50],
        'speed_labels': ['0-5', '5-10', '10-15', '15-20', '20-25', '25+ m/s'],
        'colors': ['#3498db', '#2ecc71', '#f1c40f', '#e67e22', '#e74c3c', '#9b59b6'],
        'calm_limit': 0.5
    }
    
    # Performance Chart Configuration
    PERFORMANCE_CONFIG = {
        'colors': {
            'good': '#2ecc71',      # Green for good performance
            'warning': '#f1c40f',   # Yellow for warning
            'critical': '#e74c3c'   # Red for critical
        },
        'thresholds': {
            'good': 100,
            'warning': 90,
            'critical': 80
        }
    }
    
    @classmethod
    def get_s3_key(cls, project_id: str, visualization_type: str, file_extension: str) -> str:
        """
        Generate S3 key for visualization assets
        
        Args:
            project_id: Project identifier
            visualization_type: Type of visualization (terrain_map, wind_rose, etc.)
            file_extension: File extension (html, png, etc.)
            
        Returns:
            S3 object key
        """
        return f"{cls.S3_PREFIX}/{project_id}/{visualization_type}.{file_extension}"
    
    @classmethod
    def get_s3_url(cls, key: str) -> str:
        """
        Generate S3 URL for a given key
        
        Args:
            key: S3 object key
            
        Returns:
            Full S3 URL
        """
        return f"https://{cls.S3_BUCKET}.s3.{cls.AWS_REGION}.amazonaws.com/{key}"
    
    @classmethod
    def get_terrain_color_style(cls, feature_type: str) -> Dict:
        """
        Get color style for terrain feature type
        
        Args:
            feature_type: Type of terrain feature
            
        Returns:
            Color style dictionary
        """
        return cls.TERRAIN_COLORS.get(feature_type, cls.TERRAIN_COLORS['other'])
    
    @classmethod
    def get_performance_color(cls, performance_value: float) -> str:
        """
        Get color for performance value based on thresholds
        
        Args:
            performance_value: Performance percentage
            
        Returns:
            Color hex code
        """
        if performance_value >= cls.PERFORMANCE_CONFIG['thresholds']['good']:
            return cls.PERFORMANCE_CONFIG['colors']['good']
        elif performance_value >= cls.PERFORMANCE_CONFIG['thresholds']['warning']:
            return cls.PERFORMANCE_CONFIG['colors']['warning']
        else:
            return cls.PERFORMANCE_CONFIG['colors']['critical']

# Global configuration instance
config = VisualizationConfig()