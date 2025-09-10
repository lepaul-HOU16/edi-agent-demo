"""
Comprehensive Density-Neutron Porosity Analysis Demonstration

This script demonstrates the complete workflow for density-neutron porosity analysis:
1. Generate realistic synthetic well log data (LAS format simulation)
2. Calculate porosity using density and neutron logs
3. Create density-neutron crossplots for lithology identification
4. Generate depth plots showing porosity variations
5. Identify reservoir intervals based on porosity thresholds
6. Produce comprehensive analysis reports

This serves as a complete tutorial and demonstration of petrophysical analysis techniques.
"""

import os
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from scipy.signal import savgol_filter, find_peaks
from scipy import stats
import json
from typing import Dict, List, Tuple, Optional
import warnings
warnings.filterwarnings('ignore')

# Try to import plotly for interactive plots
try:
    import plotly.graph_objs as go
    import plotly.express as px
    from plotly.subplots import make_subplots
    import plotly.io as pio
    PLOTLY_AVAILABLE = True
    pio.templates.default = "plotly_white"
except ImportError:
    print("Plotly not available. Using matplotlib for all plots.")
    PLOTLY_AVAILABLE = False

# Create output directories
os.makedirs('plots', exist_ok=True)
os.makedirs('results', exist_ok=True)
os.makedirs('reports', exist_ok=True)

class DensityNeutronAnalyzer:
    """Comprehensive density-neutron porosity analysis system"""
    
    def __init__(self):
        self.wells = {}
        self.porosity_results = {}
        self.reservoir_intervals = {}
        
        # Matrix properties for common rock types (standard petrophysical values)
        self.matrix_properties = {
            'sandstone': {'density': 2.65, 'neutron': 0.0, 'pe': 1.81, 'description': 'Clean Quartz Sandstone'},
            'limestone': {'density': 2.71, 'neutron': 0.0, 'pe': 5.08, 'description': 'Pure Calcite Limestone'},
            'dolomite': {'density': 2.87, 'neutron': 0.04, 'pe': 3.14, 'description': 'Pure Dolomite'},
            'shale': {'density': 2.4, 'neutron': 0.30, 'pe': 2.8, 'description': 'Typical Shale'},
            'coal': {'density': 1.3, 'neutron': 0.40, 'pe': 0.2, 'description': 'Bituminous Coal'},
            'anhydrite': {'density': 2.98, 'neutron': -0.02, 'pe': 5.05, 'description': 'Anhydrite'},
            'salt': {'density': 2.17, 'neutron': -0.05, 'pe': 4.65, 'description': 'Halite Salt'}
        }
        
        # Fluid properties
        self.fluid_density = 1.0  # Water density (g/cm3)
        self.fluid_neutron = 1.0  # Water neutron response
        
        # Porosity quality thresholds
        self.porosity_quality = {
            'excellent': {'min': 0.20, 'color': '#2ecc71', 'description': 'Excellent (>20%)'},
            'very_good': {'min': 0.15, 'color': '#27ae60', 'description': 'Very Good (15-20%)'},
            'good': {'min': 0.12, 'color': '#f39c12', 'description': 'Good (12-15%)'},
            'fair': {'min': 0.08, 'color': '#e67e22', 'description': 'Fair (8-12%)'},
            'poor': {'min': 0.05, 'color': '#e74c3c', 'description': 'Poor (5-8%)'},
            'tight': {'min': 0.0, 'color': '#8b0000', 'description': 'Tight (<5%)'}
        }
    
    def generate_realistic_well_data(self, num_wells: int = 3) -> None:
        """Generate realistic synthetic well log data with geological complexity"""
        print(f"Generating {num_wells} realistic synthetic wells...")
        
        np.random.seed(42)  # For reproducible results
        
        well_scenarios = [
            {'name': 'SANDSTONE_RESERVOIR_001', 'primary_lithology': 'sandstone', 'hydrocarbon_zones': True},
            {'name': 'CARBONATE_PLATFORM_002', 'primary_lithology': 'limestone', 'hydrocarbon_zones': True},
            {'name': 'MIXED_LITHOLOGY_003', 'primary_lithology': 'mixed', 'hydrocarbon_zones': False}
        ]
        
        for i in range(num_wells):
            scenario = well_scenarios[i % len(well_scenarios)]
            well_name = scenario['name']
            
            print(f"  Creating {well_name}...")
            
            # Define depth range (typical well logging interval)
            depth_start = 2000 + np.random.uniform(-200, 200)
            depth_end = depth_start + 800 + np.random.uniform(0, 400)
            depth = np.arange(depth_start, depth_end, 0.5)  # 0.5m sampling
            n_points = len(depth)
            
            # Initialize log arrays
            rhob = np.zeros(n_points)  # Bulk density
            nphi = np.zeros(n_points)  # Neutron porosity
            gr = np.zeros(n_points)    # Gamma ray
            rt = np.ones(n_points)     # Resistivity
            pe = np.zeros(n_points)    # Photoelectric factor
            
            # Create geological layers with realistic properties
            self._create_geological_layers(
                depth, rhob, nphi, gr, rt, pe,
                scenario['primary_lithology'],
                scenario['hydrocarbon_zones']
            )
            
            # Add realistic measurement noise and tool responses
            self._add_measurement_noise(rhob, nphi, gr, rt, pe)
            
            # Create DataFrame with proper index
            well_df = pd.DataFrame({
                'DEPTH': depth,
                'RHOB': rhob,
                'NPHI': nphi,
                'GR': gr,
                'RT': rt,
                'PE': pe
            })
            well_df.set_index('DEPTH', inplace=True)
            
            # Store well data
            self.wells[well_name] = {
                'data': well_df,
                'scenario': scenario,
                'depth_range': (depth_start, depth_end),
                'total_thickness': depth_end - depth_start
            }
        
        print(f"Successfully generated {len(self.wells)} wells with realistic log responses")
    
    def _create_geological_layers(self, depth: np.ndarray, rhob: np.ndarray, 
                                nphi: np.ndarray, gr: np.ndarray, 
                                rt: np.ndarray, pe: np.ndarray,
                                primary_lithology: str, has_hydrocarbons: bool) -> None:
        """Create realistic geological layers with proper log responses"""
        
        n_points = len(depth)
        
        if primary_lithology == 'sandstone':
            # Sandstone reservoir with shale interbeds
            layers = [
                {'lithology': 'shale', 'fraction': 0.3},
                {'lithology': 'sandstone', 'fraction': 0.7}
            ]
        elif primary_lithology == 'limestone':
            # Carbonate platform
            layers = [
                {'lithology': 'limestone', 'fraction': 0.6},
                {'lithology': 'dolomite', 'fraction': 0.2},
                {'lithology': 'shale', 'fraction': 0.2}
            ]
        else:  # mixed
            layers = [
                {'lithology': 'sandstone', 'fraction': 0.4},
                {'lithology': 'shale', 'fraction': 0.3},
                {'lithology': 'limestone', 'fraction': 0.3}
            ]
        
        # Create layer boundaries
        layer_thicknesses = []
        for layer in layers:
            thickness = int(n_points * layer['fraction'])
            layer_thicknesses.append(thickness)
        
        # Adjust to match total points
        diff = n_points - sum(layer_thicknesses)
        layer_thicknesses[0] += diff
        
        # Generate each layer
        start_idx = 0
        for i, (layer, thickness) in enumerate(zip(layers, layer_thicknesses)):
            end_idx = start_idx + thickness
            if end_idx > n_points:
                end_idx = n_points
            
            layer_indices = np.arange(start_idx, end_idx)
            if len(layer_indices) == 0:
                continue
                
            lithology = layer['lithology']
            matrix_props = self.matrix_properties[lithology]
            
            # Generate porosity for this layer
            if lithology == 'shale':
                porosity = np.random.uniform(0.02, 0.08, len(layer_indices))
            elif lithology in ['sandstone', 'limestone', 'dolomite']:
                # Create reservoir zones
                base_porosity = np.random.uniform(0.08, 0.25, len(layer_indices))
                
                # Add porosity trends and heterogeneity
                trend = np.linspace(0.8, 1.2, len(layer_indices))
                porosity = base_porosity * trend
                porosity += np.random.normal(0, 0.02, len(layer_indices))
                porosity = np.clip(porosity, 0.01, 0.35)
            
            # Calculate log responses based on porosity and lithology
            self._calculate_log_responses(
                layer_indices, rhob, nphi, gr, rt, pe,
                lithology, porosity, has_hydrocarbons and (lithology != 'shale')
            )
            
            start_idx = end_idx
    
    def _calculate_log_responses(self, indices: np.ndarray, rhob: np.ndarray,
                               nphi: np.ndarray, gr: np.ndarray, rt: np.ndarray,
                               pe: np.ndarray, lithology: str, porosity: np.ndarray,
                               hydrocarbon_zone: bool) -> None:
        """Calculate realistic log responses for given lithology and porosity"""
        
        matrix_props = self.matrix_properties[lithology]
        
        # Bulk density calculation (standard mixing law)
        fluid_density = 0.7 if hydrocarbon_zone else self.fluid_density  # Oil/gas vs water
        rhob[indices] = (matrix_props['density'] * (1 - porosity) + 
                        fluid_density * porosity)
        
        # Neutron porosity (affected by lithology and fluid type)
        matrix_neutron = matrix_props['neutron']
        if hydrocarbon_zone:
            # Gas effect - neutron reads lower than true porosity
            fluid_neutron = 0.3 if np.random.random() > 0.5 else 0.6  # Gas vs oil
            apparent_porosity = porosity * fluid_neutron
        else:
            apparent_porosity = porosity * self.fluid_neutron
        
        nphi[indices] = matrix_neutron + apparent_porosity
        
        # Gamma ray
        if lithology == 'shale':
            gr[indices] = np.random.uniform(80, 150, len(indices))
        elif lithology in ['sandstone', 'limestone', 'dolomite']:
            gr[indices] = np.random.uniform(15, 45, len(indices))
        else:
            gr[indices] = np.random.uniform(30, 70, len(indices))
        
        # Resistivity (Archie's equation approximation)
        if hydrocarbon_zone and porosity.mean() > 0.1:
            # High resistivity for hydrocarbon-bearing rocks
            rt[indices] = np.random.lognormal(2.0, 0.8, len(indices))  # 10-100+ ohm.m
        else:
            # Water-bearing rocks
            rt[indices] = np.random.lognormal(0.5, 0.5, len(indices))  # 1-10 ohm.m
        
        # Photoelectric factor
        pe[indices] = matrix_props['pe'] + np.random.normal(0, 0.1, len(indices))
    
    def _add_measurement_noise(self, rhob: np.ndarray, nphi: np.ndarray,
                             gr: np.ndarray, rt: np.ndarray, pe: np.ndarray) -> None:
        """Add realistic measurement noise and tool characteristics"""
        
        # Density: ±0.01-0.02 g/cm³ precision
        rhob += np.random.normal(0, 0.015, len(rhob))
        rhob = np.clip(rhob, 1.5, 3.2)  # Physical limits
        
        # Neutron: ±0.01-0.02 porosity units
        nphi += np.random.normal(0, 0.015, len(nphi))
        nphi = np.clip(nphi, -0.15, 0.6)  # Tool range
        
        # Gamma ray: ±2-5 API units
        gr += np.random.normal(0, 3, len(gr))
        gr = np.clip(gr, 0, 300)
        
        # Resistivity: log-normal distribution of errors
        rt *= np.random.lognormal(0, 0.1, len(rt))
        rt = np.clip(rt, 0.1, 10000)
        
        # Photoelectric: ±0.1 barns/electron
        pe += np.random.normal(0, 0.08, len(pe))
        pe = np.clip(pe, 0, 10)
    
    def calculate_porosity(self) -> None:
        """Calculate porosity using density and neutron logs"""
        print("\nCalculating porosity using density and neutron logs...")
        
        for well_name, well_info in self.wells.items():
            df = well_info['data'].copy()
            
            # Extract log data
            rhob = df['RHOB']
            nphi = df['NPHI']
            
            # Calculate density porosity (assuming sandstone matrix)
            matrix_density = self.matrix_properties['sandstone']['density']
            density_porosity = (matrix_density - rhob) / (matrix_density - self.fluid_density)
            density_porosity = np.clip(density_porosity, 0, 1)
            
            # Neutron porosity (already apparent porosity)
            neutron_porosity = nphi.copy()
            neutron_porosity = np.clip(neutron_porosity, 0, 1)
            
            # Combined porosity (average method)
            combined_porosity = (density_porosity + neutron_porosity) / 2
            
            # Gas correction (when neutron < density porosity)
            gas_effect_mask = neutron_porosity < (density_porosity - 0.05)
            gas_corrected_porosity = combined_porosity.copy()
            gas_corrected_porosity[gas_effect_mask] = density_porosity[gas_effect_mask]
            
            # Store results
            porosity_results = pd.DataFrame({
                'DEPTH': df.index,
                'RHOB': rhob,
                'NPHI': nphi,
                'DENSITY_POROSITY': density_porosity,
                'NEUTRON_POROSITY': neutron_porosity,
                'COMBINED_POROSITY': combined_porosity,
                'GAS_CORRECTED_POROSITY': gas_corrected_porosity,
                'GR': df['GR'],
                'RT': df['RT']
            })
            porosity_results.set_index('DEPTH', inplace=True)
            
            self.porosity_results[well_name] = porosity_results
            
            # Print statistics
            stats = {
                'density': f"{density_porosity.mean():.1%} ± {density_porosity.std():.1%}",
                'neutron': f"{neutron_porosity.mean():.1%} ± {neutron_porosity.std():.1%}",
                'combined': f"{combined_porosity.mean():.1%} ± {combined_porosity.std():.1%}"
            }
            print(f"  {well_name}: Density={stats['density']}, Neutron={stats['neutron']}, Combined={stats['combined']}")
    
    def create_density_neutron_crossplot(self) -> None:
        """Create comprehensive density-neutron crossplot for lithology identification"""
        print("\nCreating density-neutron crossplot for lithology identification...")
        
        if PLOTLY_AVAILABLE:
            self._create_interactive_crossplot()
        else:
            self._create_matplotlib_crossplot()
    
    def _create_interactive_crossplot(self) -> None:
        """Create interactive Plotly density-neutron crossplot"""
        
        fig = go.Figure()
        
        # Collect all data points
        all_data = []
        colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd']
        
        for i, (well_name, results) in enumerate(self.porosity_results.items()):
            # Clean data
            clean_data = results.dropna(subset=['RHOB', 'NPHI'])
            
            color = colors[i % len(colors)]
            
            # Add scatter plot for this well
            fig.add_trace(go.Scatter(
                x=clean_data['NPHI'],
                y=clean_data['RHOB'],
                mode='markers',
                name=well_name,
                marker=dict(
                    size=4,
                    color=clean_data['COMBINED_POROSITY'],
                    colorscale='Viridis',
                    showscale=True if i == 0 else False,
                    colorbar=dict(title='Porosity (fraction)', x=1.1) if i == 0 else None,
                    opacity=0.7,
                    line=dict(width=0.5, color='white')
                ),
                text=[f'Well: {well_name}<br>Depth: {d:.1f}m<br>RHOB: {r:.2f}<br>NPHI: {n:.3f}<br>Porosity: {p:.1%}' 
                      for d, r, n, p in zip(clean_data.index, clean_data['RHOB'], 
                                          clean_data['NPHI'], clean_data['COMBINED_POROSITY'])],
                hovertemplate='%{text}<extra></extra>'
            ))
        
        # Add lithology matrix points
        lithology_colors = {
            'sandstone': '#FFD700',  # Gold
            'limestone': '#4169E1',  # Royal Blue
            'dolomite': '#32CD32',   # Lime Green
            'shale': '#8B0000',      # Dark Red
            'coal': '#000000',       # Black
            'anhydrite': '#9370DB',  # Medium Purple
            'salt': '#FF69B4'        # Hot Pink
        }
        
        for lith_name, props in self.matrix_properties.items():
            if lith_name in lithology_colors:
                fig.add_trace(go.Scatter(
                    x=[props['neutron']],
                    y=[props['density']],
                    mode='markers+text',
                    name=lith_name.title(),
                    marker=dict(
                        size=20,
                        color=lithology_colors[lith_name],
                        symbol='star',
                        line=dict(width=3, color='black')
                    ),
                    text=[lith_name.title()],
                    textposition='top center',
                    textfont=dict(size=10, color='black'),
                    showlegend=True
                ))
        
        # Add porosity lines for sandstone
        neutron_range = np.linspace(-0.1, 0.5, 100)
        matrix_density = self.matrix_properties['sandstone']['density']
        
        for porosity in [0.05, 0.10, 0.15, 0.20, 0.25, 0.30]:
            density_line = matrix_density - porosity * (matrix_density - self.fluid_density)
            
            fig.add_trace(go.Scatter(
                x=[0, porosity],
                y=[density_line, density_line],
                mode='lines',
                line=dict(width=1, color='gray', dash='dash'),
                name=f'{porosity:.0%} Porosity',
                showlegend=False,
                hoverinfo='skip'
            ))
            
            # Add porosity labels
            fig.add_annotation(
                x=porosity * 0.8,
                y=density_line + 0.02,
                text=f'{porosity:.0%}',
                showarrow=False,
                font=dict(size=8, color='gray')
            )
        
        # Update layout
        fig.update_layout(
            title=dict(
                text='Density-Neutron Crossplot for Lithology Identification',
                x=0.5,
                font=dict(size=16)
            ),
            xaxis=dict(
                title='Neutron Porosity (fraction)',
                range=[-0.15, 0.6],
                gridcolor='lightgray'
            ),
            yaxis=dict(
                title='Bulk Density (g/cm³)',
                range=[3.2, 1.8],  # Reversed for standard presentation
                gridcolor='lightgray'
            ),
            width=1000,
            height=800,
            template='plotly_white',
            paper_bgcolor='rgba(0,0,0,0)',
            plot_bgcolor='rgba(0,0,0,0)',
            legend=dict(
                x=1.02,
                y=1,
                bgcolor='rgba(255,255,255,0.8)'
            )
        )
        
        # Save plot
        fig.write_html('plots/density_neutron_crossplot.html')
        print("  Interactive crossplot saved to: plots/density_neutron_crossplot.html")
    
    def _create_matplotlib_crossplot(self) -> None:
        """Create matplotlib version of density-neutron crossplot"""
        
        plt.figure(figsize=(12, 10))
        
        # Plot data points
        colors = ['blue', 'orange', 'green', 'red', 'purple']
        
        for i, (well_name, results) in enumerate(self.porosity_results.items()):
            clean_data = results.dropna(subset=['RHOB', 'NPHI'])
            
            scatter = plt.scatter(
                clean_data['NPHI'], clean_data['RHOB'],
                c=clean_data['COMBINED_POROSITY'],
                cmap='viridis', alpha=0.7, s=20,
                label=well_name, edgecolors='white', linewidth=0.5
            )
        
        # Add colorbar
        cbar = plt.colorbar(scatter)
        cbar.set_label('Combined Porosity (fraction)', fontsize=12)
        
        # Add lithology points
        lithology_markers = {
            'sandstone': ('s', 'gold', 'Sandstone'),
            'limestone': ('o', 'blue', 'Limestone'),
            'dolomite': ('^', 'green', 'Dolomite'),
            'shale': ('D', 'red', 'Shale')
        }
        
        for lith_name, props in self.matrix_properties.items():
            if lith_name in lithology_markers:
                marker, color, label = lithology_markers[lith_name]
                plt.scatter(
                    props['neutron'], props['density'],
                    marker=marker, s=200, c=color,
                    edgecolors='black', linewidth=2,
                    label=label, zorder=10
                )
        
        # Add porosity lines
        for porosity in [0.05, 0.10, 0.15, 0.20, 0.25, 0.30]:
            matrix_density = self.matrix_properties['sandstone']['density']
            density_val = matrix_density - porosity * (matrix_density - self.fluid_density)
            plt.axhline(y=density_val, color='gray', linestyle='--', alpha=0.5, linewidth=1)
            plt.text(0.45, density_val + 0.01, f'{porosity:.0%}', 
                    fontsize=8, color='gray', ha='center')
        
        plt.xlabel('Neutron Porosity (fraction)', fontsize=14)
        plt.ylabel('Bulk Density (g/cm³)', fontsize=14)
        plt.title('Density-Neutron Crossplot for Lithology Identification', fontsize=16)
        plt.gca().invert_yaxis()  # Reverse y-axis
        plt.xlim(-0.15, 0.6)
        plt.ylim(3.2, 1.8)
        plt.grid(True, alpha=0.3)
        plt.legend(bbox_to_anchor=(1.05, 1), loc='upper left')
        plt.tight_layout()
        
        plt.savefig('plots/density_neutron_crossplot.png', dpi=300, bbox_inches='tight')
        plt.savefig('plots/density_neutron_crossplot.pdf', bbox_inches='tight')
        plt.close()
        
        print("  Crossplot saved to: plots/density_neutron_crossplot.png and .pdf")
    
    def create_depth_plots(self) -> None:
        """Create comprehensive depth plots for each well"""
        print("\nCreating depth plots showing porosity variations...")
        
        for well_name, results in self.porosity_results.items():
            if PLOTLY_AVAILABLE:
                self._create_interactive_depth_plot(well_name, results)
            else:
                self._create_matplotlib_depth_plot(well_name, results)
    
    def _create_interactive_depth_plot(self, well_name: str, results: pd.DataFrame) -> None:
        """Create interactive Plotly depth plot"""
        
        # Create subplot with 5 tracks
        fig = make_subplots(
            rows=1, cols=5,
            subplot_titles=['Gamma Ray', 'Resistivity', 'Density', 'Neutron', 'Porosity Analysis'],
            shared_yaxes=True,
            horizontal_spacing=0.05,
            column_widths=[0.15, 0.15, 0.2, 0.2, 0.3]
        )
        
        depth = results.index
        
        # Track 1: Gamma Ray
        fig.add_trace(
            go.Scatter(
                x=results['GR'], y=depth,
                mode='lines', name='GR',
                line=dict(color='green', width=2),
                fill='tonextx', fillcolor='rgba(0,255,0,0.1)'
            ), row=1, col=1
        )
        
        # Track 2: Resistivity (log scale)
        fig.add_trace(
            go.Scatter(
                x=results['RT'], y=depth,
                mode='lines', name='Resistivity',
                line=dict(color='red', width=2)
            ), row=1, col=2
        )
        
        # Track 3: Density
        fig.add_trace(
            go.Scatter(
                x=results['RHOB'], y=depth,
                mode='lines', name='RHOB',
                line=dict(color='black', width=2)
            ), row=1, col=3
        )
        
        # Track 4: Neutron
        fig.add_trace(
            go.Scatter(
                x=results['NPHI'], y=depth,
                mode='lines', name='NPHI',
                line=dict(color='blue', width=2),
                fill='tonextx', fillcolor='rgba(0,0,255,0.1)'
            ), row=1, col=4
        )
        
        # Track 5: Porosity comparison
        porosity_curves = {
            'Density Porosity': ('DENSITY_POROSITY', 'purple'),
            'Neutron Porosity': ('NEUTRON_POROSITY', 'orange'),
            'Combined Porosity': ('COMBINED_POROSITY', 'red')
        }
        
        for label, (col_name, color) in porosity_curves.items():
            fig.add_trace(
                go.Scatter(
                    x=results[col_name], y=depth,
                    mode='lines', name=label,
                    line=dict(color=color, width=2)
                ), row=1, col=5
            )
        
        # Add reservoir quality shading
        for quality, params in self.porosity_quality.items():
            if quality == 'tight':
                continue
            
            good_intervals = results[results['COMBINED_POROSITY'] >= params['min']]
            if len(good_intervals) > 0:
                fig.add_trace(
                    go.Scatter(
                        x=good_intervals['COMBINED_POROSITY'],
                        y=good_intervals.index,
                        mode='markers',
                        name=f'{quality.replace("_", " ").title()} Reservoir',
                        marker=dict(
                            color=params['color'],
                            size=4,
                            opacity=0.7
                        )
                    ), row=1, col=5
                )
        
        # Update layout
        fig.update_layout(
            title=f'Comprehensive Log Analysis - {well_name}',
            height=1000,
            showlegend=True,
            template='plotly_white',
            paper_bgcolor='rgba(0,0,0,0)',
            plot_bgcolor='rgba(0,0,0,0)'
        )
        
        # Update y-axes (depth - reversed)
        for col in range(1, 6):
            fig.update_yaxes(autorange='reversed', title_text='Depth (m)', row=1, col=col)
        
        # Update x-axes
        fig.update_xaxes(title_text='GR (API)', range=[0, 200], row=1, col=1)
        fig.update_xaxes(title_text='Resistivity (ohm.m)', type='log', range=[0.1, 1000], row=1, col=2)
        fig.update_xaxes(title_text='Density (g/cm³)', range=[1.8, 3.0], row=1, col=3)
        fig.update_xaxes(title_text='Neutron Porosity', range=[0.6, -0.1], row=1, col=4)  # Reversed
        fig.update_xaxes(title_text='Porosity (fraction)', range=[0, 0.4], row=1, col=5)
        
        # Save plot
        filename = f"plots/well_depth_plot_{well_name.replace(' ', '_')}.html"
        fig.write_html(filename)
        print(f"  Interactive depth plot saved: {filename}")
    
    def _create_matplotlib_depth_plot(self, well_name: str, results: pd.DataFrame) -> None:
        """Create matplotlib depth plot"""
        
        fig, axes = plt.subplots(1, 5, figsize=(20, 12), sharey=True)
        fig.suptitle(f'Comprehensive Log Analysis - {well_name}', fontsize=16, y=0.95)
        
        depth = results.index
        
        # Track 1: Gamma Ray
        axes[0].plot(results['GR'], depth, 'g-', linewidth=1.5)
        axes[0].fill_betweenx(depth, results['GR'], 0, alpha=0.2, color='green')
        axes[0].set_xlabel('Gamma Ray (API)')
        axes[0].set_xlim(0, 200)
        axes[0].grid(True, alpha=0.3)
        
        # Track 2: Resistivity (log scale)
        axes[1].semilogx(results['RT'], depth, 'r-', linewidth=1.5)
        axes[1].set_xlabel('Resistivity (ohm.m)')
        axes[1].set_xlim(0.1, 1000)
        axes[1].grid(True, alpha=0.3)
        
        # Track 3: Density
        axes[2].plot(results['RHOB'], depth, 'k-', linewidth=1.5)
        axes[2].set_xlabel('Bulk Density (g/cm³)')
        axes[2].set_xlim(1.8, 3.0)
        axes[2].grid(True, alpha=0.3)
        
        # Track 4: Neutron
        axes[3].plot(results['NPHI'], depth, 'b-', linewidth=1.5)
        axes[3].fill_betweenx(depth, results['NPHI'], 0, alpha=0.2, color='blue')
        axes[3].set_xlabel('Neutron Porosity (fraction)')
        axes[3].set_xlim(0.6, -0.1)  # Reversed for standard presentation
        axes[3].grid(True, alpha=0.3)
        
        # Track 5: Porosity comparison
        axes[4].plot(results['DENSITY_POROSITY'], depth, 'purple', linewidth=2, label='Density Porosity')
        axes[4].plot(results['NEUTRON_POROSITY'], depth, 'orange', linewidth=2, label='Neutron Porosity')
        axes[4].plot(results['COMBINED_POROSITY'], depth, 'red', linewidth=2, label='Combined Porosity')
        axes[4].set_xlabel('Porosity (fraction)')
        axes[4].set_xlim(0, 0.4)
        axes[4].legend()
        axes[4].grid(True, alpha=0.3)
        
        # Set common y-axis properties (depth)
        for ax in axes:
            ax.invert_yaxis()
            ax.set_ylabel('Depth (m)')
        
        plt.tight_layout()
        
        # Save plot
        filename = f"plots/well_depth_plot_{well_name.replace(' ', '_')}.png"
        plt.savefig(filename, dpi=300, bbox_inches='tight')
        plt.close()
        print(f"  Depth plot saved: {filename}")
    
    def identify_reservoir_intervals(self) -> None:
        """Identify reservoir intervals based on porosity and log characteristics"""
        print("\nIdentifying reservoir intervals...")
        
        min_porosity_threshold = 0.08  # 8% minimum porosity
        min_thickness = 5.0  # 5m minimum thickness
        
        for well_name, results in self.porosity_results.items():
            intervals = []
            
            porosity_data = results['COMBINED_POROSITY'].dropna()
            if len(porosity_data) < 10:
                continue
            
            # Smooth porosity curve to identify major trends
            window_size = min(21, len(porosity_data) // 4)
            if window_size < 5:
                window_size = 5
            if window_size % 2 == 0:
                window_size += 1
            
            smoothed_porosity = savgol_filter(porosity_data.values, window_size, 2)
            
            # Identify zones above threshold
            good_zones = smoothed_porosity >= min_porosity_threshold
            depth_values = porosity_data.index.values
            
            # Find continuous intervals
            in_interval = False
            start_depth = None
            
            for i, (depth, is_good) in enumerate(zip(depth_values, good_zones)):
                if is_good and not in_interval:
                    # Start of new interval
                    start_depth = depth
                    start_idx = i
                    in_interval = True
                elif not is_good and in_interval:
                    # End of interval
                    end_depth = depth_values[i-1]
                    thickness = abs(end_depth - start_depth)
                    
                    if thickness >= min_thickness:
                        # Valid interval - calculate statistics
                        interval_data = porosity_data.iloc[start_idx:i]
                        
                        interval_info = self._analyze_reservoir_interval(
                            well_name, start_depth, end_depth, interval_data, results
                        )
                        intervals.append(interval_info)
                    
                    in_interval = False
            
            # Handle case where interval extends to end
            if in_interval:
                end_depth = depth_values[-1]
                thickness = abs(end_depth - start_depth)
                
                if thickness >= min_thickness:
                    interval_data = porosity_data.iloc[start_idx:]
                    interval_info = self._analyze_reservoir_interval(
                        well_name, start_depth, end_depth, interval_data, results
                    )
                    intervals.append(interval_info)
            
            self.reservoir_intervals[well_name] = intervals
            
            # Print summary
            if intervals:
                print(f"\n  {well_name}: Found {len(intervals)} reservoir intervals")
                for i, interval in enumerate(intervals, 1):
                    print(f"    Interval {i}: {interval['top_depth']:.1f}-{interval['bottom_depth']:.1f}m, "
                          f"Thickness: {interval['thickness']:.1f}m, "
                          f"Avg Porosity: {interval['avg_porosity']:.1%}, "
                          f"Quality: {interval['quality']}")
            else:
                print(f"  {well_name}: No significant reservoir intervals identified")
    
    def _analyze_reservoir_interval(self, well_name: str, start_depth: float, 
                                  end_depth: float, porosity_data: pd.Series, 
                                  full_results: pd.DataFrame) -> Dict:
        """Analyze a single reservoir interval"""
        
        # Get corresponding log data
        depth_mask = (full_results.index >= start_depth) & (full_results.index <= end_depth)
        interval_logs = full_results[depth_mask]
        
        # Calculate statistics
        avg_porosity = porosity_data.mean()
        max_porosity = porosity_data.max()
        min_porosity = porosity_data.min()
        std_porosity = porosity_data.std()
        
        # Determine reservoir quality
        quality = 'tight'
        for qual_name, qual_params in self.porosity_quality.items():
            if avg_porosity >= qual_params['min']:
                quality = qual_name
                break
        
        # Calculate average log values
        avg_gr = interval_logs['GR'].mean() if len(interval_logs) > 0 else np.nan
        avg_rt = interval_logs['RT'].mean() if len(interval_logs) > 0 else np.nan
        
        # Assess hydrocarbon potential (high resistivity + good porosity)
        hc_potential = 'Water' 
        if avg_porosity > 0.10 and avg_rt > 10:
            hc_potential = 'Hydrocarbon'
        elif avg_porosity > 0.08 and avg_rt > 5:
            hc_potential = 'Possible HC'
        
        return {
            'well_name': well_name,
            'top_depth': start_depth,
            'bottom_depth': end_depth,
            'thickness': abs(end_depth - start_depth),
            'avg_porosity': avg_porosity,
            'max_porosity': max_porosity,
            'min_porosity': min_porosity,
            'std_porosity': std_porosity,
            'quality': quality,
            'avg_gamma_ray': avg_gr,
            'avg_resistivity': avg_rt,
            'hc_potential': hc_potential
        }
    
    def create_summary_report(self) -> None:
        """Generate comprehensive HTML summary report"""
        print("\nGenerating comprehensive analysis report...")
        
        # Collect all reservoir intervals
        all_intervals = []
        for well_intervals in self.reservoir_intervals.values():
            all_intervals.extend(well_intervals)
        
        # Calculate field statistics
        total_thickness = sum(interval['thickness'] for interval in all_intervals)
        avg_porosity_field = np.mean([interval['avg_porosity'] for interval in all_intervals]) if all_intervals else 0
        
        # Count intervals by quality
        quality_counts = {}
        for quality in self.porosity_quality.keys():
            quality_counts[quality] = len([i for i in all_intervals if i['quality'] == quality])
        
        # Generate HTML report
        html_content = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Density-Neutron Porosity Analysis Report</title>
            <style>
                body {{
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    margin: 0;
                    padding: 20px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    min-height: 100vh;
                }}
                .container {{
                    max-width: 1200px;
                    margin: 0 auto;
                    background: white;
                    border-radius: 15px;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                    overflow: hidden;
                }}
                .header {{
                    background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
                    color: white;
                    padding: 30px;
                    text-align: center;
                }}
                .header h1 {{
                    margin: 0;
                    font-size: 2.5em;
                    font-weight: 300;
                }}
                .header p {{
                    margin: 10px 0 0 0;
                    opacity: 0.8;
                    font-size: 1.1em;
                }}
                .content {{
                    padding: 30px;
                }}
                .summary-grid {{
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 20px;
                    margin: 30px 0;
                }}
                .summary-card {{
                    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                    padding: 25px;
                    border-radius: 10px;
                    text-align: center;
                    border-left: 5px solid #3498db;
                }}
                .summary-card h3 {{
                    margin: 0 0 10px 0;
                    color: #2c3e50;
                    font-size: 1.1em;
                }}
                .summary-card .value {{
                    font-size: 2em;
                    font-weight: bold;
                    color: #3498db;
                }}
                .summary-card .unit {{
                    font-size: 0.9em;
                    color: #7f8c8d;
                }}
                table {{
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px 0;
                    background: white;
                    border-radius: 10px;
                    overflow: hidden;
                    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                }}
                th {{
                    background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
                    color: white;
                    padding: 15px;
                    text-align: left;
                    font-weight: 500;
                }}
                td {{
                    padding: 12px 15px;
                    border-bottom: 1px solid #ecf0f1;
                }}
                tr:nth-child(even) {{
                    background-color: #f8f9fa;
                }}
                tr:hover {{
                    background-color: #e3f2fd;
                    transition: background-color 0.3s;
                }}
                .quality-excellent {{ background-color: #d4edda !important; }}
                .quality-very-good {{ background-color: #cce7ff !important; }}
                .quality-good {{ background-color: #fff3cd !important; }}
                .quality-fair {{ background-color: #f8d7da !important; }}
                .quality-poor {{ background-color: #f5c6cb !important; }}
                .quality-tight {{ background-color: #e2e3e5 !important; }}
                
                .section {{
                    margin: 40px 0;
                }}
                .section h2 {{
                    color: #2c3e50;
                    border-bottom: 3px solid #3498db;
                    padding-bottom: 10px;
                    margin-bottom: 20px;
                }}
                .methodology {{
                    background: #f8f9fa;
                    padding: 25px;
                    border-radius: 10px;
                    border-left: 5px solid #17a2b8;
                }}
                .file-links {{
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 15px;
                    margin: 20px 0;
                }}
                .file-link {{
                    background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
                    color: white;
                    padding: 15px 20px;
                    border-radius: 8px;
                    text-decoration: none;
                    text-align: center;
                    transition: transform 0.3s;
                }}
                .file-link:hover {{
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(0,0,0,0.15);
                }}
                .quality-legend {{
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                    margin: 20px 0;
                }}
                .quality-item {{
                    padding: 8px 15px;
                    border-radius: 20px;
                    font-size: 0.9em;
                    font-weight: 500;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Density-Neutron Porosity Analysis</h1>
                    <p>Comprehensive Petrophysical Evaluation Report</p>
                </div>
                
                <div class="content">
                    <div class="section">
                        <h2>📊 Executive Summary</h2>
                        <div class="summary-grid">
                            <div class="summary-card">
                                <h3>Wells Analyzed</h3>
                                <div class="value">{len(self.wells)}</div>
                                <div class="unit">wells</div>
                            </div>
                            <div class="summary-card">
                                <h3>Reservoir Intervals</h3>
                                <div class="value">{len(all_intervals)}</div>
                                <div class="unit">intervals</div>
                            </div>
                            <div class="summary-card">
                                <h3>Total Net Reservoir</h3>
                                <div class="value">{total_thickness:.1f}</div>
                                <div class="unit">meters</div>
                            </div>
                            <div class="summary-card">
                                <h3>Average Porosity</h3>
                                <div class="value">{avg_porosity_field:.1%}</div>
                                <div class="unit">field-wide</div>
                            </div>
                        </div>
                        
                        <div class="quality-legend">
                            <h3 style="width: 100%; margin-bottom: 10px;">Reservoir Quality Legend:</h3>
        """
        
        # Add quality legend
        for quality, params in self.porosity_quality.items():
            html_content += f"""
                            <div class="quality-item quality-{quality.replace('_', '-')}" 
                                 style="background-color: {params['color']}; color: white;">
                                {params['description']} ({quality_counts.get(quality, 0)} intervals)
                            </div>
            """
        
        html_content += """
                        </div>
                    </div>
                    
                    <div class="section">
                        <h2>🏗️ Well Summary</h2>
                        <table>
                            <thead>
                                <tr>
                                    <th>Well Name</th>
                                    <th>Depth Range (m)</th>
                                    <th>Scenario</th>
                                    <th>Intervals Found</th>
                                    <th>Best Porosity</th>
                                    <th>Total Net Pay (m)</th>
                                </tr>
                            </thead>
                            <tbody>
        """
        
        # Add well summary rows
        for well_name, well_info in self.wells.items():
            intervals = self.reservoir_intervals.get(well_name, [])
            interval_count = len(intervals)
            total_net_pay = sum(interval['thickness'] for interval in intervals)
            best_porosity = max([interval['max_porosity'] for interval in intervals], default=0)
            
            html_content += f"""
                                <tr>
                                    <td><strong>{well_name}</strong></td>
                                    <td>{well_info['depth_range'][0]:.0f} - {well_info['depth_range'][1]:.0f}</td>
                                    <td>{well_info['scenario']['primary_lithology'].title()}</td>
                                    <td>{interval_count}</td>
                                    <td>{best_porosity:.1%}</td>
                                    <td>{total_net_pay:.1f}</td>
                                </tr>
            """
        
        html_content += """
                            </tbody>
                        </table>
                    </div>
                    
                    <div class="section">
                        <h2>🎯 Reservoir Intervals Details</h2>
                        <table>
                            <thead>
                                <tr>
                                    <th>Well</th>
                                    <th>Depth Range (m)</th>
                                    <th>Thickness (m)</th>
                                    <th>Avg Porosity</th>
                                    <th>Max Porosity</th>
                                    <th>Quality</th>
                                    <th>HC Potential</th>
                                    <th>Avg GR (API)</th>
                                    <th>Avg RT (Ω.m)</th>
                                </tr>
                            </thead>
                            <tbody>
        """
        
        # Add reservoir interval rows
        for interval in sorted(all_intervals, key=lambda x: (x['well_name'], x['top_depth'])):
            quality_class = f"quality-{interval['quality'].replace('_', '-')}"
            
            html_content += f"""
                                <tr class="{quality_class}">
                                    <td><strong>{interval['well_name']}</strong></td>
                                    <td>{interval['top_depth']:.1f} - {interval['bottom_depth']:.1f}</td>
                                    <td>{interval['thickness']:.1f}</td>
                                    <td>{interval['avg_porosity']:.1%}</td>
                                    <td>{interval['max_porosity']:.1%}</td>
                                    <td>{interval['quality'].replace('_', ' ').title()}</td>
                                    <td>{interval['hc_potential']}</td>
                                    <td>{interval['avg_gamma_ray']:.1f}</td>
                                    <td>{interval['avg_resistivity']:.1f}</td>
                                </tr>
            """
        
        html_content += f"""
                            </tbody>
                        </table>
                    </div>
                    
                    <div class="section">
                        <h2>📈 Generated Visualizations</h2>
                        <div class="file-links">
                            <a href="density_neutron_crossplot.html" class="file-link" target="_blank">
                                🎯 Interactive Density-Neutron Crossplot
                            </a>
        """
        
        # Add well-specific depth plots
        for well_name in self.wells.keys():
            safe_name = well_name.replace(' ', '_')
            if PLOTLY_AVAILABLE:
                html_content += f"""
                            <a href="well_depth_plot_{safe_name}.html" class="file-link" target="_blank">
                                📊 {well_name} - Depth Analysis
                            </a>
                """
            else:
                html_content += f"""
                            <a href="well_depth_plot_{safe_name}.png" class="file-link" target="_blank">
                                📊 {well_name} - Depth Analysis
                            </a>
                """
        
        html_content += """
                        </div>
                    </div>
                    
                    <div class="section">
                        <div class="methodology">
                            <h2>🔬 Analysis Methodology</h2>
                            <h3>Porosity Calculation Methods:</h3>
                            <ul>
                                <li><strong>Density Porosity:</strong> φ<sub>D</sub> = (ρ<sub>ma</sub> - ρ<sub>b</sub>) / (ρ<sub>ma</sub> - ρ<sub>f</sub>)</li>
                                <li><strong>Neutron Porosity:</strong> Direct measurement from neutron log (φ<sub>N</sub>)</li>
                                <li><strong>Combined Porosity:</strong> φ<sub>avg</sub> = (φ<sub>D</sub> + φ<sub>N</sub>) / 2</li>
                                <li><strong>Gas Correction:</strong> Applied when φ<sub>N</sub> < φ<sub>D</sub> - 0.05</li>
                            </ul>
                            
                            <h3>Lithology Identification:</h3>
                            <ul>
                                <li>Density-neutron crossplot analysis</li>
                                <li>Matrix points for major rock types</li>
                                <li>Porosity line overlay for quantitative assessment</li>
                            </ul>
                            
                            <h3>Reservoir Quality Assessment:</h3>
                            <ul>
                                <li>Minimum porosity threshold: 8%</li>
                                <li>Minimum thickness: 5 meters</li>
                                <li>Quality ranking based on average porosity</li>
                                <li>Hydrocarbon potential from resistivity analysis</li>
                            </ul>
                            
                            <h3>Data Processing:</h3>
                            <ul>
                                <li>Realistic synthetic data generation</li>
                                <li>Tool response simulation with measurement noise</li>
                                <li>Geological layering with proper log characteristics</li>
                                <li>Smoothing filters for interval identification</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Save the report
        with open('reports/density_neutron_analysis_report.html', 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        print("  Comprehensive report saved: reports/density_neutron_analysis_report.html")
    
    def export_results_to_csv(self) -> None:
        """Export analysis results to CSV files for further analysis"""
        print("\nExporting results to CSV files...")
        
        # Export well summary
        well_summary = []
        for well_name, well_info in self.wells.items():
            intervals = self.reservoir_intervals.get(well_name, [])
            porosity_data = self.porosity_results[well_name]['COMBINED_POROSITY']
            
            well_summary.append({
                'Well_Name': well_name,
                'Primary_Lithology': well_info['scenario']['primary_lithology'],
                'Has_Hydrocarbons': well_info['scenario']['hydrocarbon_zones'],
                'Depth_Start': well_info['depth_range'][0],
                'Depth_End': well_info['depth_range'][1],
                'Total_Thickness': well_info['total_thickness'],
                'Avg_Porosity': porosity_data.mean(),
                'Max_Porosity': porosity_data.max(),
                'Std_Porosity': porosity_data.std(),
                'Reservoir_Intervals': len(intervals),
                'Total_Net_Pay': sum(interval['thickness'] for interval in intervals)
            })
        
        well_summary_df = pd.DataFrame(well_summary)
        well_summary_df.to_csv('results/well_summary.csv', index=False)
        
        # Export reservoir intervals
        intervals_list = []
        for well_intervals in self.reservoir_intervals.values():
            intervals_list.extend(well_intervals)
        
        if intervals_list:
            intervals_df = pd.DataFrame(intervals_list)
            intervals_df.to_csv('results/reservoir_intervals.csv', index=False)
        
        # Export detailed porosity data
        for well_name, results in self.porosity_results.items():
            safe_name = well_name.replace(' ', '_')
            results.to_csv(f'results/porosity_data_{safe_name}.csv')
        
        print(f"  Exported {len(well_summary)} well summaries to: results/well_summary.csv")
        print(f"  Exported {len(intervals_list)} reservoir intervals to: results/reservoir_intervals.csv")
        print(f"  Exported detailed porosity data for {len(self.porosity_results)} wells")
    
    def run_complete_analysis(self) -> None:
        """Execute the complete density-neutron porosity analysis workflow"""
        print("=" * 80)
        print("COMPREHENSIVE DENSITY-NEUTRON POROSITY ANALYSIS")
        print("=" * 80)
        print("This demonstration shows the complete workflow for petrophysical analysis")
        print("using density and neutron logs for porosity calculation and lithology identification.\n")
        
        try:
            # Step 1: Generate realistic synthetic data
            self.generate_realistic_well_data(num_wells=3)
            
            # Step 2: Calculate porosity using multiple methods
            self.calculate_porosity()
            
            # Step 3: Create density-neutron crossplot
            self.create_density_neutron_crossplot()
            
            # Step 4: Generate depth plots for each well
            self.create_depth_plots()
            
            # Step 5: Identify reservoir intervals
            self.identify_reservoir_intervals()
            
            # Step 6: Create comprehensive report
            self.create_summary_report()
            
            # Step 7: Export results for further analysis
            self.export_results_to_csv()
            
            print("\n" + "=" * 80)
            print("ANALYSIS COMPLETE - SUMMARY")
            print("=" * 80)
            
            # Print final summary
            total_intervals = sum(len(intervals) for intervals in self.reservoir_intervals.values())
            good_intervals = sum(1 for intervals in self.reservoir_intervals.values()
                               for interval in intervals 
                               if interval['quality'] in ['excellent', 'very_good', 'good'])
            
            total_net_pay = sum(interval['thickness'] 
                              for intervals in self.reservoir_intervals.values()
                              for interval in intervals)
            
            print(f"✅ Wells Processed: {len(self.wells)}")
            print(f"✅ Reservoir Intervals Identified: {total_intervals}")
            print(f"✅ High-Quality Intervals: {good_intervals}")
            print(f"✅ Total Net Reservoir Thickness: {total_net_pay:.1f}m")
            
            print(f"\n📁 Output Files Generated:")
            print(f"   📊 Interactive crossplot: plots/density_neutron_crossplot.html")
            print(f"   📈 Well depth plots: plots/well_depth_plot_*.html")
            print(f"   📋 Comprehensive report: reports/density_neutron_analysis_report.html")
            print(f"   📄 CSV exports: results/*.csv")
            
            print(f"\n🔬 Analysis Methods Demonstrated:")
            print(f"   • Realistic synthetic well log generation")
            print(f"   • Density-porosity calculation (ρ-matrix mixing law)")
            print(f"   • Neutron-porosity analysis (fluid and lithology effects)")
            print(f"   • Combined porosity calculation with gas correction")
            print(f"   • Density-neutron crossplot lithology identification")
            print(f"   • Reservoir interval detection and quality assessment")
            print(f"   • Interactive visualization with Plotly")
            
        except Exception as e:
            print(f"\n❌ Error during analysis: {e}")
            import traceback
            traceback.print_exc()


def main():
    """Main execution function for density-neutron porosity analysis"""
    print("Starting Comprehensive Density-Neutron Porosity Analysis...")
    print("This script demonstrates standard petrophysical analysis workflows\n")
    
    try:
        # Initialize the analyzer
        analyzer = DensityNeutronAnalyzer()
        
        # Run the complete analysis workflow
        analyzer.run_complete_analysis()
        
        print(f"\n🎉 Analysis completed successfully!")
        print(f"📂 Check the following directories for results:")
        print(f"   • plots/     - Interactive visualizations")
        print(f"   • reports/   - HTML analysis report") 
        print(f"   • results/   - CSV data exports")
        
    except Exception as e:
        print(f"\n❌ Failed to complete analysis: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0


if __name__ == "__main__":
    import sys
    sys.exit(main())
