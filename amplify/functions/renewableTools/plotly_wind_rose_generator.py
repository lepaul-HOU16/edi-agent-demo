"""
Plotly Wind Rose Data Generator for Renewable Energy Analysis

This module generates structured wind rose data optimized for Plotly.js
barpolar chart rendering with 16 directional bins and 7 speed ranges.
"""

import numpy as np
import logging
from typing import Dict, List, Tuple, Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class PlotlyWindRoseGenerator:
    """
    Generate wind rose data structured for Plotly.js barpolar charts
    
    Provides:
    - 16 directional bins (22.5° sectors)
    - 7 wind speed ranges (0-1, 1-2, 2-3, 3-4, 4-5, 5-6, 6+ m/s)
    - Frequency percentages for each direction/speed combination
    - Color mapping for speed ranges
    """
    
    # 16 compass directions (22.5° sectors)
    DIRECTIONS = [
        'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
        'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'
    ]
    
    # Wind speed bins (m/s)
    SPEED_BINS = [0, 1, 2, 3, 4, 5, 6, float('inf')]
    SPEED_LABELS = ['0-1', '1-2', '2-3', '3-4', '4-5', '5-6', '6+']
    
    # Color gradient: Yellow → Orange → Pink → Purple
    SPEED_COLORS = [
        '#ffff00',  # 0-1 m/s: Yellow
        '#ffcc00',  # 1-2 m/s: Light orange
        '#ff9900',  # 2-3 m/s: Orange
        '#ff6600',  # 3-4 m/s: Dark orange
        '#ff3366',  # 4-5 m/s: Pink
        '#cc33cc',  # 5-6 m/s: Purple
        '#9933ff'   # 6+ m/s: Deep purple
    ]
    
    def __init__(self):
        """Initialize the Plotly wind rose generator"""
        logger.info("Initialized PlotlyWindRoseGenerator")
    
    def generate_wind_rose_data(
        self, 
        wind_speeds: np.ndarray, 
        wind_directions: np.ndarray
    ) -> Dict:
        """
        Generate structured wind rose data for Plotly.js
        
        Args:
            wind_speeds: Array of wind speeds in m/s
            wind_directions: Array of wind directions in degrees (0-360)
            
        Returns:
            Dictionary containing:
            - directions: List of 16 compass directions
            - angles: List of angles for each direction (0-360)
            - speed_ranges: List of speed range labels
            - colors: List of colors for each speed range
            - frequency_data: 2D array [direction][speed_range] of frequencies
            - plotly_traces: Pre-formatted data for Plotly barpolar chart
        """
        logger.info(f"Generating Plotly wind rose data from {len(wind_speeds)} observations")
        
        # Validate input
        if len(wind_speeds) != len(wind_directions):
            raise ValueError("Wind speeds and directions must have same length")
        
        if len(wind_speeds) == 0:
            logger.warning("No wind data provided, returning empty structure")
            return self._empty_wind_rose_data()
        
        # Bin wind data
        direction_bins = self._bin_directions(wind_directions)
        speed_bins = self._bin_speeds(wind_speeds)
        
        # Calculate frequency percentages
        frequency_data = self._calculate_frequencies(
            direction_bins, 
            speed_bins, 
            len(wind_speeds)
        )
        
        # Generate Plotly traces
        plotly_traces = self._generate_plotly_traces(frequency_data)
        
        # Calculate statistics
        statistics = self._calculate_statistics(
            wind_speeds, 
            wind_directions, 
            frequency_data
        )
        
        result = {
            'directions': self.DIRECTIONS,
            'angles': [i * 22.5 for i in range(16)],
            'speed_ranges': self.SPEED_LABELS,
            'colors': self.SPEED_COLORS,
            'frequency_data': frequency_data.tolist(),
            'plotly_traces': plotly_traces,
            'statistics': statistics,
            'total_observations': len(wind_speeds)
        }
        
        logger.info(f"✅ Generated wind rose data with {len(plotly_traces)} speed ranges")
        return result
    
    def _bin_directions(self, wind_directions: np.ndarray) -> np.ndarray:
        """
        Bin wind directions into 16 sectors (22.5° each)
        
        Args:
            wind_directions: Array of directions in degrees (0-360)
            
        Returns:
            Array of direction bin indices (0-15)
        """
        # Normalize directions to 0-360
        directions = np.mod(wind_directions, 360)
        
        # Calculate bin index (0-15)
        # Add 11.25° offset so North (0°) is centered in bin 0
        bin_indices = np.floor((directions + 11.25) / 22.5).astype(int)
        
        # Handle wrap-around (bin 16 → bin 0)
        bin_indices = np.mod(bin_indices, 16)
        
        return bin_indices
    
    def _bin_speeds(self, wind_speeds: np.ndarray) -> np.ndarray:
        """
        Bin wind speeds into 7 ranges
        
        Args:
            wind_speeds: Array of speeds in m/s
            
        Returns:
            Array of speed bin indices (0-6)
        """
        # Use numpy digitize for binning
        bin_indices = np.digitize(wind_speeds, self.SPEED_BINS[1:-1])
        
        # Ensure indices are in valid range (0-6)
        bin_indices = np.clip(bin_indices, 0, 6)
        
        return bin_indices
    
    def _calculate_frequencies(
        self, 
        direction_bins: np.ndarray, 
        speed_bins: np.ndarray,
        total_count: int
    ) -> np.ndarray:
        """
        Calculate frequency percentages for each direction/speed combination
        
        Args:
            direction_bins: Array of direction bin indices
            speed_bins: Array of speed bin indices
            total_count: Total number of observations
            
        Returns:
            2D array [16 directions][7 speed ranges] of frequency percentages
        """
        # Initialize frequency matrix
        frequencies = np.zeros((16, 7))
        
        # Count occurrences for each direction/speed combination
        for dir_bin, speed_bin in zip(direction_bins, speed_bins):
            frequencies[dir_bin, speed_bin] += 1
        
        # Convert counts to percentages
        frequencies = (frequencies / total_count) * 100
        
        return frequencies
    
    def _generate_plotly_traces(self, frequency_data: np.ndarray) -> List[Dict]:
        """
        Generate Plotly barpolar traces for stacked bar chart
        
        Args:
            frequency_data: 2D array [16 directions][7 speed ranges]
            
        Returns:
            List of trace dictionaries for Plotly
        """
        traces = []
        angles = [i * 22.5 for i in range(16)]
        
        # Create one trace per speed range (for stacked bars)
        for speed_idx in range(7):
            trace = {
                'type': 'barpolar',
                'r': frequency_data[:, speed_idx].tolist(),
                'theta': angles,
                'name': self.SPEED_LABELS[speed_idx] + ' m/s',
                'marker': {
                    'color': self.SPEED_COLORS[speed_idx],
                    'line': {
                        'color': '#333',
                        'width': 1
                    }
                },
                'hovertemplate': (
                    '<b>%{theta}°</b><br>' +
                    f'Speed: {self.SPEED_LABELS[speed_idx]} m/s<br>' +
                    'Frequency: %{r:.2f}%<br>' +
                    '<extra></extra>'
                )
            }
            traces.append(trace)
        
        return traces
    
    def _calculate_statistics(
        self, 
        wind_speeds: np.ndarray, 
        wind_directions: np.ndarray,
        frequency_data: np.ndarray
    ) -> Dict:
        """
        Calculate wind rose statistics
        
        Args:
            wind_speeds: Array of wind speeds
            wind_directions: Array of wind directions
            frequency_data: 2D frequency array
            
        Returns:
            Dictionary of statistics
        """
        # Basic statistics
        avg_speed = float(np.mean(wind_speeds))
        max_speed = float(np.max(wind_speeds))
        min_speed = float(np.min(wind_speeds))
        std_speed = float(np.std(wind_speeds))
        
        # Find prevailing direction (direction with highest total frequency)
        direction_totals = np.sum(frequency_data, axis=1)
        prevailing_idx = int(np.argmax(direction_totals))
        prevailing_direction = self.DIRECTIONS[prevailing_idx]
        prevailing_frequency = float(direction_totals[prevailing_idx])
        
        # Calculate calm percentage (speeds < 1 m/s)
        calm_percentage = float(np.sum(wind_speeds < 1) / len(wind_speeds) * 100)
        
        # Calculate speed distribution
        speed_distribution = {}
        for i, label in enumerate(self.SPEED_LABELS):
            count = np.sum(frequency_data[:, i])
            speed_distribution[label] = float(count)
        
        return {
            'average_speed': round(avg_speed, 2),
            'max_speed': round(max_speed, 2),
            'min_speed': round(min_speed, 2),
            'std_speed': round(std_speed, 2),
            'prevailing_direction': prevailing_direction,
            'prevailing_frequency': round(prevailing_frequency, 2),
            'calm_percentage': round(calm_percentage, 2),
            'speed_distribution': speed_distribution
        }
    
    def _empty_wind_rose_data(self) -> Dict:
        """Return empty wind rose data structure"""
        return {
            'directions': self.DIRECTIONS,
            'angles': [i * 22.5 for i in range(16)],
            'speed_ranges': self.SPEED_LABELS,
            'colors': self.SPEED_COLORS,
            'frequency_data': np.zeros((16, 7)).tolist(),
            'plotly_traces': [],
            'statistics': {
                'average_speed': 0.0,
                'max_speed': 0.0,
                'min_speed': 0.0,
                'std_speed': 0.0,
                'prevailing_direction': 'N',
                'prevailing_frequency': 0.0,
                'calm_percentage': 0.0,
                'speed_distribution': {label: 0.0 for label in self.SPEED_LABELS}
            },
            'total_observations': 0
        }
    
    def generate_layout_config(
        self, 
        title: str = "Wind Rose",
        dark_background: bool = True
    ) -> Dict:
        """
        Generate Plotly layout configuration for wind rose
        
        Args:
            title: Chart title
            dark_background: Use dark background styling
            
        Returns:
            Plotly layout dictionary
        """
        bg_color = '#1a1a1a' if dark_background else '#ffffff'
        text_color = '#ffffff' if dark_background else '#000000'
        grid_color = '#444444' if dark_background else '#e9ebed'
        
        layout = {
            'title': {
                'text': title,
                'font': {
                    'size': 18,
                    'color': text_color,
                    'family': 'Arial, sans-serif'
                },
                'x': 0.5,
                'xanchor': 'center'
            },
            'polar': {
                'radialaxis': {
                    'visible': True,
                    'range': [0, None],  # Auto-scale
                    'showticklabels': True,
                    'ticksuffix': '%',
                    'gridcolor': grid_color,
                    'tickfont': {'color': text_color}
                },
                'angularaxis': {
                    'direction': 'clockwise',
                    'rotation': 90,  # North at top
                    'gridcolor': grid_color,
                    'tickfont': {'color': text_color}
                },
                'bgcolor': 'rgba(0,0,0,0)'
            },
            'paper_bgcolor': bg_color,
            'plot_bgcolor': bg_color,
            'font': {'color': text_color},
            'showlegend': True,
            'legend': {
                'title': {'text': 'Wind Speed (m/s)'},
                'orientation': 'v',
                'x': 1.05,
                'y': 0.5,
                'font': {'color': text_color}
            },
            'barmode': 'stack',  # Stack bars for each speed range
            'height': 600,
            'margin': {'t': 80, 'b': 60, 'l': 60, 'r': 150}
        }
        
        return layout


# Convenience function for direct use
def generate_plotly_wind_rose(
    wind_speeds: np.ndarray,
    wind_directions: np.ndarray,
    title: str = "Wind Rose",
    dark_background: bool = True
) -> Dict:
    """
    Generate complete Plotly wind rose data and layout
    
    Args:
        wind_speeds: Array of wind speeds in m/s
        wind_directions: Array of wind directions in degrees
        title: Chart title
        dark_background: Use dark background styling
        
    Returns:
        Dictionary with 'data', 'layout', and 'statistics'
    """
    generator = PlotlyWindRoseGenerator()
    
    wind_rose_data = generator.generate_wind_rose_data(wind_speeds, wind_directions)
    layout = generator.generate_layout_config(title, dark_background)
    
    return {
        'data': wind_rose_data['plotly_traces'],
        'layout': layout,
        'statistics': wind_rose_data['statistics'],
        'raw_data': wind_rose_data
    }
