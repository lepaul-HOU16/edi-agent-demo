"""
Professional Matplotlib Chart Generator for Renewable Energy Analysis

This module provides comprehensive matplotlib chart generation capabilities with
professional styling, publication-quality formatting, and scientific visualizations.
"""

import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.colors import LinearSegmentedColormap
import numpy as np
import pandas as pd
import seaborn as sns
import io
import logging
from typing import Dict, List, Optional, Tuple, Any, Union

from visualization_config import config

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MatplotlibChartGenerator:
    """
    Generate matplotlib charts with professional styling
    
    Provides publication-quality scientific charts including:
    - Wind rose diagrams with directional patterns
    - Performance analysis charts and comparisons
    - Wake deficit visualization charts
    - Elevation profiles and terrain analysis
    """
    
    def __init__(self):
        """Initialize the matplotlib chart generator"""
        self.config = config
        self._setup_style()
        logger.info("Initialized MatplotlibChartGenerator")
    
    def _setup_style(self):
        """Configure matplotlib for professional appearance"""
        plt.style.use(self.config.MATPLOTLIB_CONFIG['style'])
        plt.rcParams.update({
            'figure.figsize': self.config.MATPLOTLIB_CONFIG['figure_size'],
            'figure.dpi': self.config.MATPLOTLIB_CONFIG['dpi'],
            'savefig.dpi': self.config.MATPLOTLIB_CONFIG['save_dpi'],
            'font.size': self.config.MATPLOTLIB_CONFIG['font_size'],
            'axes.titlesize': self.config.MATPLOTLIB_CONFIG['title_size'],
            'axes.labelsize': self.config.MATPLOTLIB_CONFIG['label_size'],
            'xtick.labelsize': self.config.MATPLOTLIB_CONFIG['tick_size'],
            'ytick.labelsize': self.config.MATPLOTLIB_CONFIG['tick_size'],
            'legend.fontsize': self.config.MATPLOTLIB_CONFIG['legend_size'],
            'figure.titlesize': self.config.MATPLOTLIB_CONFIG['title_size'],
            'axes.grid': True,
            'grid.alpha': self.config.MATPLOTLIB_CONFIG['grid_alpha']
        })
        logger.info("Configured matplotlib for professional styling")
    
    def create_wind_rose(self, wind_data: Dict, title: str = "Wind Rose", bins: int = 16) -> bytes:
        """
        Generate wind rose diagram showing directional patterns
        
        Args:
            wind_data: Dictionary containing wind speed and direction data
            title: Title for the wind rose chart
            bins: Number of direction bins (default 16 for 22.5° sectors)
            
        Returns:
            PNG image as bytes
        """
        logger.info(f"Creating wind rose diagram: {title}")
        
        # Create figure and polar axis
        fig, ax = plt.subplots(figsize=(10, 10), subplot_kw=dict(projection='polar'))
        
        # Extract wind data
        wind_speeds = wind_data.get('speeds', [])
        wind_directions = wind_data.get('directions', [])
        
        # Generate sample data if none provided
        if not wind_speeds or not wind_directions:
            logger.info("No wind data provided, generating sample data")
            np.random.seed(42)
            wind_directions = np.random.uniform(0, 360, 1000)
            wind_speeds = np.random.weibull(2, 1000) * 15  # Weibull distribution for realistic wind speeds
        
        # Convert directions to radians
        directions_rad = np.radians(wind_directions)
        
        # Use configuration for speed bins and colors
        speed_bins = self.config.WIND_ROSE_CONFIG['speed_bins']
        speed_labels = self.config.WIND_ROSE_CONFIG['speed_labels']
        colors = self.config.WIND_ROSE_CONFIG['colors']
        
        # Create direction bins
        dir_bins = np.arange(0, 361, 360/bins)
        dir_centers = dir_bins[:-1] + (360/bins)/2
        
        # Calculate frequency for each direction and speed bin
        bottom_values = np.zeros(len(dir_centers))
        
        for i, (speed_min, speed_max) in enumerate(zip(speed_bins[:-1], speed_bins[1:])):
            mask = (wind_speeds >= speed_min) & (wind_speeds < speed_max)
            if np.any(mask):
                hist, _ = np.histogram(wind_directions[mask], bins=dir_bins)
                freq = hist / len(wind_directions) * 100  # Convert to percentage
                
                # Plot bars
                bars = ax.bar(np.radians(dir_centers), freq, width=np.radians(360/bins), 
                             bottom=bottom_values,
                             color=colors[i % len(colors)], alpha=0.8, label=speed_labels[i])
                
                bottom_values += freq
        
        # Customize the plot
        ax.set_theta_zero_location('N')
        ax.set_theta_direction(-1)
        ax.set_title(title, pad=20, fontsize=16, fontweight='bold')
        
        # Set radial limits
        max_freq = np.max(bottom_values) if len(bottom_values) > 0 else 10
        ax.set_ylim(0, max(10, max_freq * 1.1))
        
        # Add legend
        ax.legend(loc='upper left', bbox_to_anchor=(1.1, 1), title='Wind Speed (m/s)')
        
        # Add grid and labels
        ax.grid(True, alpha=0.3)
        ax.set_rlabel_position(45)
        ax.set_ylabel('Frequency (%)', labelpad=30)
        
        plt.tight_layout()
        
        # Save to bytes
        return self._save_figure_to_bytes(fig)
    
    def create_performance_chart(self, turbine_data: Dict, chart_type: str = 'monthly') -> bytes:
        """
        Generate turbine performance visualization
        
        Args:
            turbine_data: Dictionary containing performance data
            chart_type: Type of chart ('monthly', 'individual', 'comparison')
            
        Returns:
            PNG image as bytes
        """
        logger.info(f"Creating {chart_type} performance chart")
        
        if chart_type == 'monthly':
            return self._create_monthly_performance_chart(turbine_data)
        elif chart_type == 'individual':
            return self._create_individual_turbine_chart(turbine_data)
        elif chart_type == 'comparison':
            return self._create_performance_comparison_chart(turbine_data)
        else:
            logger.warning(f"Unknown chart type: {chart_type}, defaulting to monthly")
            return self._create_monthly_performance_chart(turbine_data)
    
    def _create_monthly_performance_chart(self, turbine_data: Dict) -> bytes:
        """Create monthly energy production chart"""
        fig, ax = plt.subplots(figsize=(12, 6))
        
        months = turbine_data.get('months', list(range(1, 13)))
        production = turbine_data.get('monthly_production', np.random.uniform(80, 120, 12))
        
        # Create month labels
        month_labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        
        bars = ax.bar(month_labels, production, color=self.config.PERFORMANCE_CONFIG['colors']['good'], alpha=0.8)
        ax.set_xlabel('Month')
        ax.set_ylabel('Energy Production (MWh)')
        ax.set_title('Monthly Energy Production', fontsize=14, fontweight='bold')
        ax.grid(True, alpha=0.3)
        
        # Add value labels on bars
        for bar, value in zip(bars, production):
            ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + max(production)*0.01,
                   f'{value:.1f}', ha='center', va='bottom', fontweight='bold')
        
        # Add average line
        avg_production = np.mean(production)
        ax.axhline(y=avg_production, color='red', linestyle='--', alpha=0.7, 
                  label=f'Average: {avg_production:.1f} MWh')
        ax.legend()
        
        plt.tight_layout()
        return self._save_figure_to_bytes(fig)
    
    def _create_individual_turbine_chart(self, turbine_data: Dict) -> bytes:
        """Create individual turbine performance comparison chart"""
        fig, ax = plt.subplots(figsize=(14, 8))
        
        turbine_ids = turbine_data.get('turbine_ids', [f'T{i:02d}' for i in range(1, 21)])
        turbine_performance = turbine_data.get('turbine_performance', np.random.uniform(85, 105, len(turbine_ids)))
        
        # Color bars based on performance thresholds
        colors = [self.config.get_performance_color(perf) for perf in turbine_performance]
        
        bars = ax.bar(range(len(turbine_ids)), turbine_performance, color=colors, alpha=0.8)
        
        ax.set_xlabel('Turbine ID')
        ax.set_ylabel('Performance (%)')
        ax.set_title('Individual Turbine Performance', fontsize=14, fontweight='bold')
        ax.set_xticks(range(len(turbine_ids)))
        ax.set_xticklabels(turbine_ids, rotation=45)
        ax.grid(True, alpha=0.3)
        
        # Add performance threshold lines
        thresholds = self.config.PERFORMANCE_CONFIG['thresholds']
        ax.axhline(y=thresholds['good'], color='green', linestyle='--', alpha=0.7, 
                  label=f'Target Performance ({thresholds["good"]}%)')
        ax.axhline(y=thresholds['warning'], color='orange', linestyle='--', alpha=0.7, 
                  label=f'Minimum Performance ({thresholds["warning"]}%)')
        
        # Add statistics text
        avg_perf = np.mean(turbine_performance)
        min_perf = np.min(turbine_performance)
        max_perf = np.max(turbine_performance)
        
        stats_text = f'Avg: {avg_perf:.1f}% | Min: {min_perf:.1f}% | Max: {max_perf:.1f}%'
        ax.text(0.02, 0.98, stats_text, transform=ax.transAxes, fontsize=10,
               verticalalignment='top', bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.8))
        
        ax.legend()
        plt.tight_layout()
        return self._save_figure_to_bytes(fig)
    
    def _create_performance_comparison_chart(self, turbine_data: Dict) -> bytes:
        """Create performance comparison chart with multiple metrics"""
        fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(15, 10))
        
        # Chart 1: Capacity Factor Distribution
        capacity_factors = turbine_data.get('capacity_factors', np.random.normal(0.35, 0.05, 100))
        ax1.hist(capacity_factors, bins=20, color=self.config.PERFORMANCE_CONFIG['colors']['good'], alpha=0.7)
        ax1.set_xlabel('Capacity Factor')
        ax1.set_ylabel('Frequency')
        ax1.set_title('Capacity Factor Distribution')
        ax1.axvline(np.mean(capacity_factors), color='red', linestyle='--', 
                   label=f'Mean: {np.mean(capacity_factors):.3f}')
        ax1.legend()
        ax1.grid(True, alpha=0.3)
        
        # Chart 2: Wind Speed vs Power Output
        wind_speeds = turbine_data.get('wind_speeds', np.linspace(3, 25, 50))
        power_output = turbine_data.get('power_output', self._power_curve(wind_speeds))
        ax2.plot(wind_speeds, power_output, 'b-', linewidth=2, label='Power Curve')
        ax2.set_xlabel('Wind Speed (m/s)')
        ax2.set_ylabel('Power Output (MW)')
        ax2.set_title('Turbine Power Curve')
        ax2.grid(True, alpha=0.3)
        ax2.legend()
        
        # Chart 3: Monthly Availability
        months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        availability = turbine_data.get('availability', np.random.uniform(95, 99.5, 12))
        ax3.bar(months, availability, color=self.config.PERFORMANCE_CONFIG['colors']['good'], alpha=0.8)
        ax3.set_ylabel('Availability (%)')
        ax3.set_title('Monthly Turbine Availability')
        ax3.set_ylim(90, 100)
        ax3.grid(True, alpha=0.3)
        plt.setp(ax3.xaxis.get_majorticklabels(), rotation=45)
        
        # Chart 4: Wake Loss Analysis
        directions = np.arange(0, 360, 30)
        wake_losses = turbine_data.get('wake_losses', np.random.uniform(5, 15, len(directions)))
        ax4.bar(directions, wake_losses, width=25, color=self.config.PERFORMANCE_CONFIG['colors']['warning'], alpha=0.8)
        ax4.set_xlabel('Wind Direction (°)')
        ax4.set_ylabel('Wake Loss (%)')
        ax4.set_title('Wake Losses by Wind Direction')
        ax4.grid(True, alpha=0.3)
        
        plt.tight_layout()
        return self._save_figure_to_bytes(fig)
    
    def create_wake_deficit_chart(self, wake_data: Dict) -> bytes:
        """
        Generate wake deficit analysis chart
        
        Args:
            wake_data: Dictionary containing wake analysis data
            
        Returns:
            PNG image as bytes
        """
        logger.info("Creating wake deficit analysis chart")
        
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(15, 6))
        
        # Chart 1: Wake Deficit Heat Map
        if 'deficit_grid' in wake_data:
            deficit_grid = np.array(wake_data['deficit_grid'])
            x_coords = wake_data.get('x_coords', np.arange(deficit_grid.shape[1]))
            y_coords = wake_data.get('y_coords', np.arange(deficit_grid.shape[0]))
        else:
            # Generate sample wake deficit data
            x_coords = np.linspace(-1000, 1000, 50)
            y_coords = np.linspace(-1000, 1000, 50)
            X, Y = np.meshgrid(x_coords, y_coords)
            deficit_grid = 20 * np.exp(-(X**2 + Y**2) / 500000)  # Sample wake pattern
        
        im1 = ax1.imshow(deficit_grid, extent=[x_coords[0], x_coords[-1], y_coords[0], y_coords[-1]], 
                        cmap='Reds', alpha=0.8, origin='lower')
        ax1.set_xlabel('Distance (m)')
        ax1.set_ylabel('Distance (m)')
        ax1.set_title('Wake Deficit Heat Map')
        cbar1 = plt.colorbar(im1, ax=ax1)
        cbar1.set_label('Wake Deficit (%)')
        
        # Chart 2: Wake Profile
        if 'wake_profile' in wake_data:
            distances = wake_data['wake_profile']['distances']
            deficits = wake_data['wake_profile']['deficits']
        else:
            # Generate sample wake profile
            distances = np.linspace(0, 2000, 100)
            deficits = 25 * np.exp(-distances / 800)  # Exponential decay
        
        ax2.plot(distances, deficits, 'r-', linewidth=2, label='Wake Deficit')
        ax2.fill_between(distances, deficits, alpha=0.3, color='red')
        ax2.set_xlabel('Downstream Distance (m)')
        ax2.set_ylabel('Wake Deficit (%)')
        ax2.set_title('Wake Deficit Profile')
        ax2.grid(True, alpha=0.3)
        ax2.legend()
        
        plt.tight_layout()
        return self._save_figure_to_bytes(fig)
    
    def create_elevation_profile(self, elevation_data: Dict, distance_data: Optional[List] = None) -> bytes:
        """
        Generate comprehensive terrain elevation profile with gradient analysis
        
        Args:
            elevation_data: Dictionary containing elevation data
            distance_data: Optional distance data for x-axis
            
        Returns:
            PNG image as bytes
        """
        logger.info("Creating comprehensive terrain elevation profile")
        
        fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(14, 10))
        
        elevations = elevation_data.get('elevations', np.random.uniform(100, 300, 100))
        distances = distance_data or elevation_data.get('distances', np.linspace(0, 5000, len(elevations)))
        
        # Calculate gradients
        gradients = np.gradient(elevations, distances) * 100  # Convert to percentage
        
        # Plot elevation profile (top subplot)
        ax1.plot(distances, elevations, 'b-', linewidth=2, label='Elevation Profile')
        ax1.fill_between(distances, elevations, alpha=0.3, color='brown')
        
        # Add turbine positions if available
        if 'turbine_positions' in elevation_data:
            turbine_distances = elevation_data['turbine_positions']['distances']
            turbine_elevations = elevation_data['turbine_positions']['elevations']
            ax1.scatter(turbine_distances, turbine_elevations, color='red', s=100, 
                       marker='^', label='Turbine Positions', zorder=5)
            
            # Add turbine labels
            for i, (dist, elev) in enumerate(zip(turbine_distances, turbine_elevations)):
                ax1.annotate(f'T{i+1:02d}', (dist, elev), xytext=(5, 10), 
                           textcoords='offset points', fontsize=8, fontweight='bold')
        
        # Add road network if available
        if 'roads' in elevation_data:
            road_distances = elevation_data['roads']['distances']
            road_elevations = elevation_data['roads']['elevations']
            ax1.plot(road_distances, road_elevations, 'g--', linewidth=1.5, 
                    label='Access Roads', alpha=0.8)
        
        ax1.set_xlabel('Distance (m)')
        ax1.set_ylabel('Elevation (m)')
        ax1.set_title('Terrain Elevation Profile with Infrastructure', fontsize=14, fontweight='bold')
        ax1.grid(True, alpha=0.3)
        ax1.legend()
        
        # Plot gradient analysis (bottom subplot)
        gradient_colors = ['green' if abs(g) <= 5 else 'orange' if abs(g) <= 15 else 'red' for g in gradients]
        ax2.bar(distances[:-1], gradients[:-1], width=(distances[1]-distances[0]), 
               color=gradient_colors, alpha=0.7, edgecolor='none')
        
        # Add gradient threshold lines
        ax2.axhline(y=5, color='orange', linestyle='--', alpha=0.7, label='Moderate Slope (5%)')
        ax2.axhline(y=-5, color='orange', linestyle='--', alpha=0.7)
        ax2.axhline(y=15, color='red', linestyle='--', alpha=0.7, label='Steep Slope (15%)')
        ax2.axhline(y=-15, color='red', linestyle='--', alpha=0.7)
        
        ax2.set_xlabel('Distance (m)')
        ax2.set_ylabel('Gradient (%)')
        ax2.set_title('Terrain Gradient Analysis', fontsize=14, fontweight='bold')
        ax2.grid(True, alpha=0.3)
        ax2.legend()
        
        # Add comprehensive statistics
        min_elev = np.min(elevations)
        max_elev = np.max(elevations)
        avg_elev = np.mean(elevations)
        elevation_range = max_elev - min_elev
        
        max_gradient = np.max(np.abs(gradients))
        avg_gradient = np.mean(np.abs(gradients))
        steep_sections = np.sum(np.abs(gradients) > 15) / len(gradients) * 100
        
        stats_text = (f'Elevation - Min: {min_elev:.1f}m | Max: {max_elev:.1f}m | '
                     f'Avg: {avg_elev:.1f}m | Range: {elevation_range:.1f}m\n'
                     f'Gradient - Max: {max_gradient:.1f}% | Avg: {avg_gradient:.1f}% | '
                     f'Steep Sections: {steep_sections:.1f}%')
        
        ax1.text(0.02, 0.98, stats_text, transform=ax1.transAxes, fontsize=9,
                verticalalignment='top', bbox=dict(boxstyle='round', facecolor='lightblue', alpha=0.8))
        
        plt.tight_layout()
        return self._save_figure_to_bytes(fig)
    
    def create_terrain_accessibility_chart(self, terrain_data: Dict) -> bytes:
        """
        Generate terrain accessibility and construction feasibility analysis
        
        Args:
            terrain_data: Dictionary containing terrain analysis data
            
        Returns:
            PNG image as bytes
        """
        logger.info("Creating terrain accessibility analysis chart")
        
        fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(16, 12))
        
        # Chart 1: Slope Distribution
        slopes = terrain_data.get('slopes', np.random.exponential(5, 1000))
        slopes = np.clip(slopes, 0, 30)  # Limit to reasonable slope range
        
        ax1.hist(slopes, bins=30, color='skyblue', alpha=0.7, edgecolor='black')
        ax1.axvline(5, color='orange', linestyle='--', label='Moderate Slope (5%)')
        ax1.axvline(15, color='red', linestyle='--', label='Steep Slope (15%)')
        ax1.set_xlabel('Slope (%)')
        ax1.set_ylabel('Frequency')
        ax1.set_title('Terrain Slope Distribution')
        ax1.legend()
        ax1.grid(True, alpha=0.3)
        
        # Chart 2: Construction Difficulty Assessment
        difficulty_categories = ['Easy\n(0-5%)', 'Moderate\n(5-10%)', 'Difficult\n(10-15%)', 'Very Difficult\n(>15%)']
        easy_count = np.sum(slopes <= 5)
        moderate_count = np.sum((slopes > 5) & (slopes <= 10))
        difficult_count = np.sum((slopes > 10) & (slopes <= 15))
        very_difficult_count = np.sum(slopes > 15)
        
        counts = [easy_count, moderate_count, difficult_count, very_difficult_count]
        colors = ['green', 'yellow', 'orange', 'red']
        
        wedges, texts, autotexts = ax2.pie(counts, labels=difficulty_categories, colors=colors, 
                                          autopct='%1.1f%%', startangle=90)
        ax2.set_title('Construction Difficulty Distribution')
        
        # Chart 3: Access Route Analysis
        if 'access_routes' in terrain_data:
            route_data = terrain_data['access_routes']
            route_lengths = route_data.get('lengths', np.random.uniform(500, 3000, 10))
            route_difficulties = route_data.get('difficulties', np.random.choice(['Easy', 'Moderate', 'Difficult'], 10))
        else:
            route_lengths = np.random.uniform(500, 3000, 10)
            route_difficulties = np.random.choice(['Easy', 'Moderate', 'Difficult'], 10)
        
        difficulty_colors = {'Easy': 'green', 'Moderate': 'orange', 'Difficult': 'red'}
        colors = [difficulty_colors[d] for d in route_difficulties]
        
        bars = ax3.bar(range(len(route_lengths)), route_lengths, color=colors, alpha=0.7)
        ax3.set_xlabel('Access Route ID')
        ax3.set_ylabel('Route Length (m)')
        ax3.set_title('Access Route Analysis')
        ax3.grid(True, alpha=0.3)
        
        # Add legend for route difficulties
        from matplotlib.patches import Patch
        legend_elements = [Patch(facecolor='green', label='Easy'),
                          Patch(facecolor='orange', label='Moderate'),
                          Patch(facecolor='red', label='Difficult')]
        ax3.legend(handles=legend_elements)
        
        # Chart 4: Turbine Site Suitability
        if 'turbine_sites' in terrain_data:
            site_data = terrain_data['turbine_sites']
            site_slopes = site_data.get('slopes', np.random.uniform(0, 20, 20))
            site_accessibility = site_data.get('accessibility', np.random.uniform(0.3, 1.0, 20))
        else:
            site_slopes = np.random.uniform(0, 20, 20)
            site_accessibility = np.random.uniform(0.3, 1.0, 20)
        
        # Color points based on suitability
        suitability_scores = (1 - site_slopes/30) * site_accessibility
        scatter = ax4.scatter(site_slopes, site_accessibility, c=suitability_scores, 
                            cmap='RdYlGn', s=100, alpha=0.7, edgecolors='black')
        
        ax4.set_xlabel('Site Slope (%)')
        ax4.set_ylabel('Accessibility Score')
        ax4.set_title('Turbine Site Suitability Analysis')
        ax4.grid(True, alpha=0.3)
        
        # Add colorbar
        cbar = plt.colorbar(scatter, ax=ax4)
        cbar.set_label('Suitability Score')
        
        # Add suitability zones
        ax4.axvline(5, color='orange', linestyle='--', alpha=0.5)
        ax4.axvline(15, color='red', linestyle='--', alpha=0.5)
        ax4.axhline(0.7, color='blue', linestyle='--', alpha=0.5)
        
        plt.tight_layout()
        return self._save_figure_to_bytes(fig)
    
    def _power_curve(self, wind_speeds: np.ndarray) -> np.ndarray:
        """Generate realistic turbine power curve"""
        power = np.zeros_like(wind_speeds)
        
        # Cut-in speed: 3 m/s
        # Rated speed: 12 m/s
        # Cut-out speed: 25 m/s
        # Rated power: 2.5 MW
        
        mask1 = (wind_speeds >= 3) & (wind_speeds < 12)
        power[mask1] = 2.5 * ((wind_speeds[mask1] - 3) / 9) ** 3
        
        mask2 = (wind_speeds >= 12) & (wind_speeds < 25)
        power[mask2] = 2.5
        
        return power
    
    def _save_figure_to_bytes(self, fig) -> bytes:
        """
        Convert matplotlib figure to bytes for web display
        
        Args:
            fig: Matplotlib figure object
            
        Returns:
            PNG image as bytes
        """
        img_buffer = io.BytesIO()
        fig.savefig(img_buffer, format='png', dpi=self.config.MATPLOTLIB_CONFIG['save_dpi'], 
                   bbox_inches='tight', facecolor='white', edgecolor='none')
        img_buffer.seek(0)
        plt.close(fig)
        return img_buffer.getvalue()
    
    def save_chart_to_bytes(self, fig) -> bytes:
        """
        Convert matplotlib figure to bytes for web display (public method)
        
        Args:
            fig: Matplotlib figure object
            
        Returns:
            PNG image as bytes
        """
        return self._save_figure_to_bytes(fig)    

    def create_seasonal_wind_analysis(self, seasonal_wind_data: Dict) -> bytes:
        """
        Generate comprehensive seasonal wind pattern analysis
        
        Args:
            seasonal_wind_data: Dictionary containing seasonal wind data
            
        Returns:
            PNG image as bytes
        """
        logger.info("Creating seasonal wind pattern analysis")
        
        fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(16, 12))
        
        # Chart 1: Seasonal Wind Rose Comparison
        seasons = ['Spring', 'Summer', 'Fall', 'Winter']
        colors = ['green', 'red', 'orange', 'blue']
        
        # Create polar subplot for wind roses
        ax1.remove()
        ax1 = fig.add_subplot(2, 2, 1, projection='polar')
        
        for i, season in enumerate(seasons):
            season_data = seasonal_wind_data.get(season.lower(), {})
            directions = season_data.get('directions', np.random.uniform(0, 360, 100))
            speeds = season_data.get('speeds', np.random.weibull(2, 100) * 10)
            
            # Create wind rose for each season
            dir_bins = np.arange(0, 361, 30)
            dir_centers = dir_bins[:-1] + 15
            
            hist, _ = np.histogram(directions, bins=dir_bins)
            freq = hist / len(directions) * 100
            
            bars = ax1.bar(np.radians(dir_centers), freq, width=np.radians(30), 
                          alpha=0.6, color=colors[i], label=season)
        
        ax1.set_theta_zero_location('N')
        ax1.set_theta_direction(-1)
        ax1.set_title('Seasonal Wind Rose Comparison', pad=20, fontweight='bold')
        ax1.legend(loc='upper left', bbox_to_anchor=(1.1, 1))
        
        # Chart 2: Monthly Wind Speed Variation
        months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        
        if 'monthly_speeds' in seasonal_wind_data:
            monthly_avg = seasonal_wind_data['monthly_speeds']
            monthly_max = seasonal_wind_data.get('monthly_max', [s * 1.5 for s in monthly_avg])
            monthly_min = seasonal_wind_data.get('monthly_min', [s * 0.7 for s in monthly_avg])
        else:
            # Generate realistic monthly wind speed data
            base_speeds = [8.5, 9.2, 9.8, 9.5, 8.8, 7.5, 6.8, 7.2, 8.1, 8.9, 9.3, 8.7]
            monthly_avg = [s + np.random.normal(0, 0.5) for s in base_speeds]
            monthly_max = [s * 1.4 + np.random.normal(0, 0.3) for s in monthly_avg]
            monthly_min = [s * 0.6 + np.random.normal(0, 0.2) for s in monthly_avg]
        
        ax2.plot(months, monthly_avg, 'b-o', linewidth=2, markersize=6, label='Average Wind Speed')
        ax2.fill_between(months, monthly_min, monthly_max, alpha=0.3, color='blue', label='Min-Max Range')
        ax2.set_ylabel('Wind Speed (m/s)')
        ax2.set_title('Monthly Wind Speed Variation', fontweight='bold')
        ax2.grid(True, alpha=0.3)
        ax2.legend()
        plt.setp(ax2.xaxis.get_majorticklabels(), rotation=45)
        
        # Chart 3: Wind Direction Frequency by Season
        direction_bins = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
        x = np.arange(len(direction_bins))
        width = 0.2
        
        for i, season in enumerate(seasons):
            season_data = seasonal_wind_data.get(season.lower(), {})
            directions = season_data.get('directions', np.random.uniform(0, 360, 100))
            
            # Calculate frequency for each direction bin
            dir_freq = []
            for j, dir_name in enumerate(direction_bins):
                angle_start = j * 45 - 22.5
                angle_end = j * 45 + 22.5
                if angle_start < 0:
                    angle_start += 360
                if angle_end > 360:
                    angle_end -= 360
                
                if angle_start < angle_end:
                    count = np.sum((directions >= angle_start) & (directions < angle_end))
                else:  # Handle wrap-around for North
                    count = np.sum((directions >= angle_start) | (directions < angle_end))
                
                dir_freq.append(count / len(directions) * 100)
            
            ax3.bar(x + i * width, dir_freq, width, alpha=0.8, color=colors[i], label=season)
        
        ax3.set_xlabel('Wind Direction')
        ax3.set_ylabel('Frequency (%)')
        ax3.set_title('Wind Direction Frequency by Season', fontweight='bold')
        ax3.set_xticks(x + width * 1.5)
        ax3.set_xticklabels(direction_bins)
        ax3.legend()
        ax3.grid(True, alpha=0.3)
        
        # Chart 4: Wind Resource Variability Analysis
        if 'hourly_data' in seasonal_wind_data:
            hourly_data = seasonal_wind_data['hourly_data']
        else:
            # Generate realistic hourly wind pattern
            hours = np.arange(24)
            base_pattern = 8 + 2 * np.sin((hours - 6) * np.pi / 12)  # Peak in afternoon
            hourly_data = {
                'spring': base_pattern + np.random.normal(0, 0.5, 24),
                'summer': base_pattern * 0.8 + np.random.normal(0, 0.4, 24),
                'fall': base_pattern * 1.1 + np.random.normal(0, 0.6, 24),
                'winter': base_pattern * 1.2 + np.random.normal(0, 0.7, 24)
            }
        
        for i, season in enumerate(seasons):
            season_hourly = hourly_data.get(season.lower(), hourly_data['spring'])
            ax4.plot(hours, season_hourly, color=colors[i], linewidth=2, 
                    marker='o', markersize=4, alpha=0.8, label=season)
        
        ax4.set_xlabel('Hour of Day')
        ax4.set_ylabel('Average Wind Speed (m/s)')
        ax4.set_title('Diurnal Wind Pattern by Season', fontweight='bold')
        ax4.set_xticks(range(0, 24, 3))
        ax4.grid(True, alpha=0.3)
        ax4.legend()
        
        plt.tight_layout()
        return self._save_figure_to_bytes(fig)
    
    def create_wind_resource_variability_chart(self, variability_data: Dict) -> bytes:
        """
        Generate wind resource variability and trend analysis
        
        Args:
            variability_data: Dictionary containing wind resource variability data
            
        Returns:
            PNG image as bytes
        """
        logger.info("Creating wind resource variability analysis")
        
        fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(15, 10))
        
        # Chart 1: Long-term Wind Speed Trends
        if 'yearly_data' in variability_data:
            years = variability_data['yearly_data']['years']
            annual_speeds = variability_data['yearly_data']['speeds']
        else:
            # Generate 10 years of data with trend
            years = list(range(2014, 2024))
            base_speed = 8.5
            trend = 0.02  # Slight increasing trend
            annual_speeds = [base_speed + i * trend + np.random.normal(0, 0.3) for i in range(len(years))]
        
        # Fit trend line
        z = np.polyfit(years, annual_speeds, 1)
        p = np.poly1d(z)
        
        ax1.plot(years, annual_speeds, 'bo-', linewidth=2, markersize=6, label='Annual Average')
        ax1.plot(years, p(years), 'r--', linewidth=2, alpha=0.8, 
                label=f'Trend: {z[0]:.3f} m/s/year')
        ax1.set_xlabel('Year')
        ax1.set_ylabel('Annual Average Wind Speed (m/s)')
        ax1.set_title('Long-term Wind Speed Trends', fontweight='bold')
        ax1.grid(True, alpha=0.3)
        ax1.legend()
        
        # Chart 2: Wind Speed Distribution by Year
        if 'speed_distributions' in variability_data:
            distributions = variability_data['speed_distributions']
        else:
            # Generate wind speed distributions for recent years
            distributions = {}
            for year in years[-5:]:  # Last 5 years
                distributions[str(year)] = np.random.weibull(2, 1000) * 12
        
        colors = plt.cm.viridis(np.linspace(0, 1, len(distributions)))
        for i, (year, speeds) in enumerate(distributions.items()):
            ax2.hist(speeds, bins=20, alpha=0.6, color=colors[i], 
                    label=year, density=True)
        
        ax2.set_xlabel('Wind Speed (m/s)')
        ax2.set_ylabel('Probability Density')
        ax2.set_title('Wind Speed Distribution by Year', fontweight='bold')
        ax2.legend()
        ax2.grid(True, alpha=0.3)
        
        # Chart 3: Capacity Factor Variability
        if 'capacity_factors' in variability_data:
            monthly_cf = variability_data['capacity_factors']['monthly']
            annual_cf = variability_data['capacity_factors']['annual']
        else:
            # Generate capacity factor data
            monthly_cf = {
                'months': months,
                'values': [0.32, 0.35, 0.38, 0.36, 0.33, 0.28, 0.25, 0.27, 0.31, 0.34, 0.36, 0.33]
            }
            annual_cf = [0.32 + np.random.normal(0, 0.02) for _ in years]
        
        # Monthly capacity factors
        ax3.bar(monthly_cf['months'], monthly_cf['values'], 
               color='skyblue', alpha=0.8, edgecolor='navy')
        ax3.set_ylabel('Capacity Factor')
        ax3.set_title('Monthly Capacity Factor Variation', fontweight='bold')
        ax3.grid(True, alpha=0.3)
        plt.setp(ax3.xaxis.get_majorticklabels(), rotation=45)
        
        # Add average line
        avg_cf = np.mean(monthly_cf['values'])
        ax3.axhline(y=avg_cf, color='red', linestyle='--', alpha=0.7, 
                   label=f'Annual Average: {avg_cf:.3f}')
        ax3.legend()
        
        # Chart 4: Wind Resource Uncertainty Analysis
        if 'uncertainty_data' in variability_data:
            uncertainty = variability_data['uncertainty_data']
        else:
            # Generate uncertainty analysis data
            confidence_levels = [50, 75, 90, 95, 99]
            wind_speed_ranges = []
            energy_ranges = []
            
            base_speed = 8.5
            base_energy = 100  # GWh
            
            for conf in confidence_levels:
                speed_uncertainty = (100 - conf) / 100 * 2  # Higher confidence = lower uncertainty
                energy_uncertainty = speed_uncertainty * 1.5  # Energy more sensitive
                
                wind_speed_ranges.append([
                    base_speed - speed_uncertainty,
                    base_speed + speed_uncertainty
                ])
                energy_ranges.append([
                    base_energy - energy_uncertainty * base_energy / 2,
                    base_energy + energy_uncertainty * base_energy / 2
                ])
            
            uncertainty = {
                'confidence_levels': confidence_levels,
                'wind_speed_ranges': wind_speed_ranges,
                'energy_ranges': energy_ranges
            }
        
        # Plot uncertainty ranges
        x_pos = np.arange(len(uncertainty['confidence_levels']))
        
        # Wind speed uncertainty
        wind_ranges = np.array(uncertainty['wind_speed_ranges'])
        wind_errors = [wind_ranges[:, 0], wind_ranges[:, 1]]
        
        ax4_twin = ax4.twinx()
        
        bars1 = ax4.bar(x_pos - 0.2, [r[1] - r[0] for r in uncertainty['wind_speed_ranges']], 
                       0.4, color='blue', alpha=0.6, label='Wind Speed Range')
        bars2 = ax4_twin.bar(x_pos + 0.2, [r[1] - r[0] for r in uncertainty['energy_ranges']], 
                            0.4, color='red', alpha=0.6, label='Energy Range')
        
        ax4.set_xlabel('Confidence Level (%)')
        ax4.set_ylabel('Wind Speed Range (m/s)', color='blue')
        ax4_twin.set_ylabel('Energy Range (GWh)', color='red')
        ax4.set_title('Wind Resource Uncertainty Analysis', fontweight='bold')
        ax4.set_xticks(x_pos)
        ax4.set_xticklabels([f'{c}%' for c in uncertainty['confidence_levels']])
        ax4.grid(True, alpha=0.3)
        
        # Combine legends
        lines1, labels1 = ax4.get_legend_handles_labels()
        lines2, labels2 = ax4_twin.get_legend_handles_labels()
        ax4.legend(lines1 + lines2, labels1 + labels2, loc='upper right')
        
        plt.tight_layout()
        return self._save_figure_to_bytes(fig)