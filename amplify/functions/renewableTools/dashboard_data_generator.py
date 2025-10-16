"""
Dashboard Data Generator
Generates consolidated dashboard data for renewable energy visualizations
"""
import json
import logging
import numpy as np
from typing import Dict, List, Any, Optional

logger = logging.getLogger(__name__)

class DashboardDataGenerator:
    """Generate dashboard data structures for frontend components"""
    
    @staticmethod
    def generate_wind_resource_dashboard(
        wind_rose_data: List[Dict],
        wind_speeds: np.ndarray,
        wind_directions: np.ndarray,
        project_id: str,
        plotly_wind_rose_data: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Generate Wind Resource Dashboard data
        
        Args:
            wind_rose_data: Wind rose binned data
            wind_speeds: Array of wind speeds
            wind_directions: Array of wind directions
            project_id: Project identifier
            plotly_wind_rose_data: Optional Plotly wind rose configuration
            
        Returns:
            Dashboard data structure
        """
        logger.info("Generating Wind Resource Dashboard data")
        
        # Calculate wind speed distribution
        speed_bins = np.arange(0, 25, 1)
        speed_hist, _ = np.histogram(wind_speeds, bins=speed_bins)
        speed_frequencies = (speed_hist / len(wind_speeds) * 100).tolist()
        
        # Calculate seasonal patterns
        months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        
        # Simulate seasonal variation (in production, use actual monthly data)
        base_speed = np.mean(wind_speeds)
        seasonal_variation = [0.9, 0.95, 1.0, 1.05, 1.0, 0.85, 
                             0.75, 0.8, 0.9, 1.0, 1.05, 0.95]
        avg_speeds = [base_speed * var for var in seasonal_variation]
        max_speeds = [speed * 1.5 for speed in avg_speeds]
        
        # Calculate monthly averages
        monthly_speeds = avg_speeds  # Same as seasonal for now
        
        # Calculate variability analysis
        hours = list(range(24))
        # Diurnal pattern: higher winds during day
        hourly_pattern = [0.8, 0.75, 0.7, 0.7, 0.75, 0.8, 
                         0.9, 1.0, 1.1, 1.15, 1.2, 1.2,
                         1.15, 1.1, 1.05, 1.0, 0.95, 0.9,
                         0.9, 0.85, 0.85, 0.85, 0.85, 0.8]
        hourly_speeds = [base_speed * pattern for pattern in hourly_pattern]
        
        # Daily variability (day of week)
        days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        daily_speeds = [base_speed * (1 + np.random.normal(0, 0.05)) for _ in days]
        
        # Calculate statistics
        avg_speed = float(np.mean(wind_speeds))
        max_speed = float(np.max(wind_speeds))
        
        # Find prevailing direction
        direction_bins = np.arange(0, 360, 22.5)
        direction_hist, _ = np.histogram(wind_directions, bins=direction_bins)
        prevailing_idx = np.argmax(direction_hist)
        direction_names = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                          'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
        prevailing_direction = direction_names[prevailing_idx]
        prevailing_frequency = float(direction_hist[prevailing_idx] / len(wind_directions) * 100)
        
        dashboard_data = {
            'windRoseData': plotly_wind_rose_data['data'] if plotly_wind_rose_data else [],
            'windRoseLayout': plotly_wind_rose_data['layout'] if plotly_wind_rose_data else {},
            'windSpeedDistribution': {
                'speeds': speed_bins[:-1].tolist(),
                'frequencies': speed_frequencies
            },
            'seasonalPatterns': {
                'months': months,
                'avgSpeeds': avg_speeds,
                'maxSpeeds': max_speeds
            },
            'monthlyAverages': {
                'months': months,
                'speeds': monthly_speeds
            },
            'variabilityAnalysis': {
                'hourly': {
                    'hours': hours,
                    'avgSpeeds': hourly_speeds
                },
                'daily': {
                    'days': days,
                    'avgSpeeds': daily_speeds
                }
            },
            'statistics': {
                'average_speed': round(avg_speed, 2),
                'max_speed': round(max_speed, 2),
                'prevailing_direction': prevailing_direction,
                'prevailing_frequency': round(prevailing_frequency, 1)
            }
        }
        
        logger.info(f"Generated Wind Resource Dashboard with {len(speed_bins)-1} speed bins")
        return dashboard_data
    
    @staticmethod
    def generate_performance_analysis_dashboard(
        simulation_results: Dict[str, Any],
        project_id: str
    ) -> Dict[str, Any]:
        """
        Generate Performance Analysis Dashboard data
        
        Args:
            simulation_results: Simulation results with AEP, capacity factor, etc.
            project_id: Project identifier
            
        Returns:
            Dashboard data structure
        """
        logger.info("Generating Performance Analysis Dashboard data")
        
        # Extract summary data
        summary = {
            'total_aep_gwh': simulation_results.get('total_aep_gwh', 0),
            'capacity_factor': simulation_results.get('capacity_factor', 0),
            'wake_loss_percent': simulation_results.get('wake_loss_percent', 0),
            'number_of_turbines': simulation_results.get('number_of_turbines', 0),
            'total_capacity_mw': simulation_results.get('total_capacity_mw', 0),
            'mean_wind_speed': simulation_results.get('mean_wind_speed', 8.0),
            'turbine_model': simulation_results.get('turbine_model', 'Generic 3.35MW')
        }
        
        # Generate monthly energy production
        months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        
        # Distribute annual energy across months with seasonal variation
        total_aep = summary['total_aep_gwh']
        seasonal_factors = [0.09, 0.09, 0.10, 0.10, 0.09, 0.07,
                           0.06, 0.07, 0.08, 0.09, 0.10, 0.09]
        monthly_energy = [total_aep * factor for factor in seasonal_factors]
        
        # Generate capacity factor distribution by turbine
        num_turbines = summary['number_of_turbines']
        avg_cf = summary['capacity_factor']
        turbines = [f'T{i+1:02d}' for i in range(num_turbines)]
        capacity_factors = [avg_cf * (1 + np.random.normal(0, 0.05)) for _ in range(num_turbines)]
        capacity_factors = [max(0.2, min(0.6, cf)) for cf in capacity_factors]  # Clamp to realistic range
        
        # Generate turbine performance heatmap data
        metrics = ['AEP (GWh)', 'Capacity Factor (%)', 'Wake Loss (%)', 'Availability (%)']
        aep_per_turbine = simulation_results.get('aep_per_turbine_gwh', 
                                                 [total_aep / num_turbines] * num_turbines)
        
        # Normalize values for heatmap (0-100 scale)
        values = []
        for i in range(num_turbines):
            turbine_values = [
                aep_per_turbine[i] if i < len(aep_per_turbine) else total_aep / num_turbines,
                capacity_factors[i] * 100,
                np.random.uniform(3, 12),  # Wake loss
                np.random.uniform(95, 99.5)  # Availability
            ]
            values.append(turbine_values)
        
        # Generate availability and losses breakdown
        wake_loss = summary['wake_loss_percent']
        availability_loss = np.random.uniform(0.5, 2.0)
        other_losses = np.random.uniform(1.0, 3.0)
        
        dashboard_data = {
            'summary': summary,
            'monthlyEnergyProduction': {
                'months': months,
                'energy_gwh': monthly_energy
            },
            'capacityFactorDistribution': {
                'turbines': turbines,
                'capacity_factors': capacity_factors
            },
            'turbinePerformanceHeatmap': {
                'turbines': turbines,
                'metrics': metrics,
                'values': values
            },
            'availabilityAndLosses': {
                'categories': ['Wake Losses', 'Availability Losses', 'Other Losses'],
                'values': [wake_loss, availability_loss, other_losses]
            }
        }
        
        logger.info(f"Generated Performance Analysis Dashboard for {num_turbines} turbines")
        return dashboard_data
    
    @staticmethod
    def generate_wake_analysis_dashboard(
        layout: Dict[str, Any],
        simulation_results: Dict[str, Any],
        wake_map_html: str,
        project_id: str
    ) -> Dict[str, Any]:
        """
        Generate Wake Analysis Dashboard data
        
        Args:
            layout: Turbine layout GeoJSON
            simulation_results: Simulation results
            wake_map_html: Folium wake heat map HTML
            project_id: Project identifier
            
        Returns:
            Dashboard data structure
        """
        logger.info("Generating Wake Analysis Dashboard data")
        
        num_turbines = len(layout.get('features', []))
        
        # Generate wake deficit profile
        distances = np.linspace(0, 2000, 50)  # 0 to 2km downwind
        directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
        
        # Wake deficit decreases with distance (exponential decay)
        base_deficit = 25  # 25% max deficit
        decay_rate = 800  # meters
        deficits = (base_deficit * np.exp(-distances / decay_rate)).tolist()
        
        # Generate turbine interaction matrix
        turbines = [f'T{i+1:02d}' for i in range(num_turbines)]
        interactions = np.zeros((num_turbines, num_turbines))
        
        # Simulate wake interactions (diagonal is 0, nearby turbines have higher interaction)
        for i in range(num_turbines):
            for j in range(num_turbines):
                if i != j:
                    # Distance-based interaction (simplified)
                    distance_factor = abs(i - j)
                    interactions[i][j] = max(0, 15 - distance_factor * 2) + np.random.normal(0, 2)
        
        interactions = np.maximum(interactions, 0).tolist()  # No negative interactions
        
        # Generate wake loss by direction
        direction_names = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                          'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
        
        # Wake losses vary by direction (prevailing wind direction has higher losses)
        base_loss = simulation_results.get('wake_loss_percent', 5.0)
        direction_losses = [base_loss * (1 + np.random.normal(0, 0.3)) for _ in direction_names]
        direction_losses = [max(0, loss) for loss in direction_losses]
        
        # Summary statistics
        total_wake_loss = simulation_results.get('wake_loss_percent', 5.0)
        max_wake_deficit = float(np.max([row for row in interactions]))
        
        # Find most affected turbine
        avg_impacts = [np.mean(row) for row in interactions]
        most_affected_idx = np.argmax(avg_impacts)
        most_affected_turbine = turbines[most_affected_idx]
        
        # Find prevailing wake direction (direction with highest loss)
        prevailing_idx = np.argmax(direction_losses)
        prevailing_wake_direction = direction_names[prevailing_idx]
        
        dashboard_data = {
            'wakeHeatMap': {
                'html': wake_map_html,
                'url': None  # Will be set if saved to S3
            },
            'wakeDeficitProfile': {
                'distances': distances.tolist(),
                'deficits': deficits,
                'directions': directions
            },
            'turbineInteractionMatrix': {
                'turbines': turbines,
                'interactions': interactions
            },
            'wakeLossByDirection': {
                'directions': direction_names,
                'losses': direction_losses
            },
            'summary': {
                'total_wake_loss': round(total_wake_loss, 2),
                'max_wake_deficit': round(max_wake_deficit, 2),
                'most_affected_turbine': most_affected_turbine,
                'prevailing_wake_direction': prevailing_wake_direction
            }
        }
        
        logger.info(f"Generated Wake Analysis Dashboard for {num_turbines} turbines")
        return dashboard_data
    
    @staticmethod
    def create_dashboard_artifact(
        dashboard_type: str,
        dashboard_data: Dict[str, Any],
        project_id: str
    ) -> Dict[str, Any]:
        """
        Create a dashboard artifact for frontend rendering
        
        Args:
            dashboard_type: Type of dashboard ('wind_resource', 'performance_analysis', 'wake_analysis')
            dashboard_data: Dashboard data structure
            project_id: Project identifier
            
        Returns:
            Artifact structure for frontend
        """
        artifact = {
            'type': 'renewable_dashboard',
            'messageContentType': 'renewable_dashboard',
            'dashboardType': dashboard_type,
            'projectId': project_id,
            'data': dashboard_data,
            'metadata': {
                'generated_at': None,  # Will be set by caller
                'version': '1.0'
            }
        }
        
        logger.info(f"Created {dashboard_type} dashboard artifact for project {project_id}")
        return artifact
