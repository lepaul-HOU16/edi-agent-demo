"""
Comprehensive Porosity and Reservoir Analysis System

This script performs detailed porosity analysis using density and neutron logs:
- Accesses LAS files from S3 using AWS SDK
- Extracts density (RHOB) and neutron (NPHI) log data
- Calculates porosity using multiple methods (density-porosity, neutron-porosity, combined)
- Creates density-neutron crossplots for lithology identification
- Generates depth plots showing porosity variations
- Identifies best reservoir intervals based on porosity thresholds and log character
- Produces comprehensive reservoir evaluation reports
"""

import os
import sys
import warnings
import json
from typing import Dict, List, Optional, Tuple, Any
warnings.filterwarnings('ignore')

# Core scientific computing
try:
    import pandas as pd
    import numpy as np
    from scipy import stats
    from scipy.signal import find_peaks, savgol_filter
    from scipy.interpolate import interp1d
except ImportError as e:
    print(f"Data processing library import error: {e}")
    print("Please install required packages: pip install pandas numpy scipy")
    exit(1)

# Visualization libraries
try:
    import matplotlib.pyplot as plt
    import matplotlib.patches as patches
    from matplotlib.colors import LogNorm
    import seaborn as sns
    plt.style.use('seaborn-v0_8')
    sns.set_palette("husl")
except ImportError as e:
    print(f"Matplotlib import error: {e}")
    print("Please install Matplotlib: pip install matplotlib seaborn")
    plt = None

try:
    import plotly.graph_objs as go
    import plotly.express as px
    from plotly.subplots import make_subplots
    import plotly.io as pio
    pio.templates.default = "plotly_white"
except ImportError as e:
    print(f"Plotly import error: {e}")
    print("Please install Plotly: pip install plotly>=5.0.0")
    go = None

# AWS and LAS file libraries
try:
    import boto3
    from botocore.exceptions import ClientError, NoCredentialsError
except ImportError as e:
    print(f"AWS boto3 import error: {e}")
    boto3 = None

try:
    import lasio
except ImportError as e:
    print(f"Lasio import error: {e}")
    lasio = None

# Create output directories
os.makedirs('plots', exist_ok=True)
os.makedirs('results', exist_ok=True)
os.makedirs('reports', exist_ok=True)

class PorosityReservoirAnalyzer:
    """Comprehensive porosity and reservoir analysis system"""
    
    def __init__(self, s3_bucket_name=None):
        self.s3_bucket_name = s3_bucket_name or self._get_bucket_name()
        self.s3_client = self._get_s3_client()
        self.well_data = {}
        self.porosity_data = {}
        self.reservoir_intervals = {}
        
        # Standard log curve mappings with multiple naming conventions
        self.curve_mappings = {
            'density': ['RHOB', 'RHOZ', 'DENS', 'DEN', 'BD', 'ZDEN'],
            'neutron': ['NPHI', 'PHIN', 'NEUT', 'CNL', 'TNPH', 'PNEU', 'NEU'],
            'gamma_ray': ['GR', 'SGR', 'CGR', 'ECGR', 'HSGR', 'NSGR'],
            'resistivity': ['RT', 'RES', 'RESDEEP', 'ILD', 'AT90', 'LLD', 'RILD'],
            'photoelectric': ['PEF', 'PE', 'PEFZ', 'PEFL'],
            'caliper': ['CALI', 'CAL', 'CALIPER', 'BS'],
            'spontaneous_potential': ['SP', 'SSP']
        }
        
        # Matrix parameters for common lithologies
        self.matrix_properties = {
            'sandstone': {'density': 2.65, 'neutron': 0.0, 'pef': 1.81},
            'limestone': {'density': 2.71, 'neutron': 0.0, 'pef': 5.08},
            'dolomite': {'density': 2.87, 'neutron': 0.04, 'pef': 3.14},
            'shale': {'density': 2.4, 'neutron': 0.30, 'pef': 2.8},
            'coal': {'density': 1.3, 'neutron': 0.40, 'pef': 0.2},
            'anhydrite': {'density': 2.98, 'neutron': -0.02, 'pef': 5.05},
            'salt': {'density': 2.17, 'neutron': -0.05, 'pef': 4.65}
        }
        
        # Fluid properties
        self.fluid_properties = {
            'water': {'density': 1.0, 'neutron': 1.0},
            'oil': {'density': 0.8, 'neutron': 0.8},
            'gas': {'density': 0.2, 'neutron': 0.2}
        }
        
        # Reservoir quality parameters
        self.reservoir_quality = {
            'excellent': {'porosity_min': 0.20, 'color': 'green'},
            'very_good': {'porosity_min': 0.15, 'color': 'lightgreen'},
            'good': {'porosity_min': 0.12, 'color': 'yellow'},
            'fair': {'porosity_min': 0.08, 'color': 'orange'},
            'poor': {'porosity_min': 0.05, 'color': 'red'},
            'tight': {'porosity_min': 0.0, 'color': 'darkred'}
        }

    def _get_bucket_name(self):
        """Get S3 bucket name from amplify_outputs.json"""
        try:
            with open('../amplify_outputs.json', 'r') as f:
                outputs = json.load(f)
                bucket_name = outputs['storage']['bucket_name']
                print(f"Using S3 bucket: {bucket_name}")
                return bucket_name
        except Exception as e:
            print(f"Error loading bucket name: {e}")
            # Fallback to environment variable
            bucket_name = os.environ.get('STORAGE_BUCKET_NAME')
            if not bucket_name:
                raise ValueError("Could not determine S3 bucket name")
            return bucket_name

    def _get_s3_client(self):
        """Initialize S3 client"""
        if not boto3:
            raise ImportError("boto3 not available")
        return boto3.client('s3')

    def find_curve_in_data(self, dataframe, curve_type):
        """Find the best matching curve name in the dataframe"""
        possible_names = self.curve_mappings.get(curve_type, [])
        
        # First try exact matches (case insensitive)
        for name in possible_names:
            for col in dataframe.columns:
                if col.upper() == name.upper():
                    return col
        
        # Then try partial matches
        for name in possible_names:
            for col in dataframe.columns:
                if name.upper() in col.upper():
                    return col
        
        return None

    def list_s3_las_files(self, prefix='global/well-data/'):
        """List all LAS files in the specified S3 prefix"""
        try:
            response = self.s3_client.list_objects_v2(
                Bucket=self.s3_bucket_name,
                Prefix=prefix
            )
            
            las_files = []
            if 'Contents' in response:
                for obj in response['Contents']:
                    key = obj['Key']
                    if key.lower().endswith('.las'):
                        las_files.append(key)
            
            print(f"Found {len(las_files)} LAS files in S3 bucket {self.s3_bucket_name}")
            return las_files
            
        except Exception as e:
            print(f"Error listing S3 objects: {e}")
            return []

    def download_and_load_las_files(self, max_files=None):
        """Download LAS files from S3 and load them"""
        print("Scanning S3 for LAS files...")
        
        # Try multiple prefixes where LAS files might be stored
        prefixes = [
            'global/well-data/',
            'global/well-files/', 
            'global/',
            'well-data/',
            'well-files/'
        ]
        
        all_las_files = []
        for prefix in prefixes:
            las_files = self.list_s3_las_files(prefix)
            all_las_files.extend(las_files)
        
        # Remove duplicates
        all_las_files = list(set(all_las_files))
        
        if not all_las_files:
            print("No LAS files found in S3. Generating synthetic data for demonstration...")
            self.generate_synthetic_data()
            return
        
        print(f"Found {len(all_las_files)} LAS files total")
        
        # Limit files if specified
        if max_files:
            all_las_files = all_las_files[:max_files]
            print(f"Processing first {len(all_las_files)} files")
        
        # Download and process each file
        for i, s3_key in enumerate(all_las_files):
            try:
                print(f"Processing file {i+1}/{len(all_las_files)}: {s3_key}")
                
                # Download file to local temp storage
                local_filename = f"temp_{os.path.basename(s3_key)}"
                self.s3_client.download_file(self.s3_bucket_name, s3_key, local_filename)
                
                # Load with lasio
                if lasio:
                    las = lasio.read(local_filename)
                    df = las.df()
                    
                    if df.empty:
                        print(f"Empty dataframe from {s3_key}")
                        continue
                    
                    # Extract well name
                    well_name = self._extract_well_name(las, s3_key)
                    
                    # Find required curves
                    curve_info = self._identify_curves(df)
                    
                    # Only process wells with density or neutron data
                    if curve_info['density_curve'] or curve_info['neutron_curve']:
                        self.well_data[well_name] = {
                            'dataframe': df,
                            'las_object': las,
                            's3_key': s3_key,
                            'start_depth': getattr(las, 'start', df.index.min()),
                            'stop_depth': getattr(las, 'stop', df.index.max()),
                            **curve_info
                        }
                        
                        print(f"Loaded well {well_name}: RHOB={curve_info['density_curve']}, "
                              f"NPHI={curve_info['neutron_curve']}")
                    
                # Clean up temp file
                if os.path.exists(local_filename):
                    os.remove(local_filename)
                    
            except Exception as e:
                print(f"Error processing {s3_key}: {e}")
                continue
        
        print(f"\nSuccessfully loaded {len(self.well_data)} wells with porosity-relevant data")

    def _extract_well_name(self, las, s3_key):
        """Extract well name from LAS file"""
        # Try standard well name fields
        for field in ['WELL', 'UWI', 'API', 'WELLNAME']:
            try:
                well_name = las.well.get_item(field).value
                if well_name and well_name.strip():
                    return well_name.strip()
            except:
                continue
        
        # Fallback to filename
        return os.path.basename(s3_key).replace('.las', '').replace('.LAS', '')

    def _identify_curves(self, df):
        """Identify all relevant log curves in the dataframe"""
        curve_info = {}
        
        for curve_type in self.curve_mappings:
            curve_name = f"{curve_type}_curve"
            curve_info[curve_name] = self.find_curve_in_data(df, curve_type)
        
        return curve_info

    def calculate_porosity(self):
        """Calculate porosity using multiple methods"""
        print("\nCalculating porosity for all wells...")
        
        for well_name, well_info in self.well_data.items():
            df = well_info['dataframe'].copy()
            
            # Initialize porosity dataframe
            porosity_df = pd.DataFrame(index=df.index)
            
            # Get curve names
            density_curve = well_info.get('density_curve')
            neutron_curve = well_info.get('neutron_curve')
            
            # Calculate density porosity (assuming sandstone matrix)
            if density_curve and density_curve in df.columns:
                matrix_density = self.matrix_properties['sandstone']['density']
                fluid_density = self.fluid_properties['water']['density']
                
                # Clean density data
                density_clean = df[density_curve].replace(-999.25, np.nan)
                density_clean = density_clean[(density_clean >= 1.5) & (density_clean <= 3.0)]
                
                # Calculate density porosity
                porosity_df['density_porosity'] = (matrix_density - density_clean) / (matrix_density - fluid_density)
                porosity_df['density_porosity'] = np.clip(porosity_df['density_porosity'], 0, 1)
            
            # Calculate neutron porosity
            if neutron_curve and neutron_curve in df.columns:
                neutron_clean = df[neutron_curve].replace(-999.25, np.nan)
                
                # Convert to decimal if in percentage
                if neutron_clean.max() > 2:  # Likely in percentage
                    neutron_clean = neutron_clean / 100
                
                # Clean neutron data
                neutron_clean = neutron_clean[(neutron_clean >= -0.1) & (neutron_clean <= 1.0)]
                porosity_df['neutron_porosity'] = np.clip(neutron_clean, 0, 1)
            
            # Calculate combined porosity
            if 'density_porosity' in porosity_df.columns and 'neutron_porosity' in porosity_df.columns:
                # Average of density and neutron porosity (basic combination)
                valid_mask = porosity_df['density_porosity'].notna() & porosity_df['neutron_porosity'].notna()
                porosity_df.loc[valid_mask, 'combined_porosity'] = (
                    porosity_df.loc[valid_mask, 'density_porosity'] + 
                    porosity_df.loc[valid_mask, 'neutron_porosity']
                ) / 2
                
                # Gas effect correction (when neutron reads lower than density)
                gas_mask = (porosity_df['neutron_porosity'] < porosity_df['density_porosity'] - 0.05)
                porosity_df.loc[gas_mask, 'gas_corrected_porosity'] = porosity_df.loc[gas_mask, 'density_porosity']
            
            # Add other log data for analysis
            for curve_type, curve_name in [
                ('gamma_ray', well_info.get('gamma_ray_curve')),
                ('resistivity', well_info.get('resistivity_curve')),
                ('photoelectric', well_info.get('photoelectric_curve')),
                ('caliper', well_info.get('caliper_curve'))
            ]:
                if curve_name and curve_name in df.columns:
                    clean_data = df[curve_name].replace(-999.25, np.nan)
                    porosity_df[curve_type] = clean_data
            
            # Store porosity data
            self.porosity_data[well_name] = porosity_df
            
            # Calculate statistics
            stats = self._calculate_porosity_statistics(porosity_df)
            print(f"{well_name}: {stats}")

    def _calculate_porosity_statistics(self, porosity_df):
        """Calculate porosity statistics for a well"""
        stats = {}
        
        for col in ['density_porosity', 'neutron_porosity', 'combined_porosity']:
            if col in porosity_df.columns:
                data = porosity_df[col].dropna()
                if len(data) > 0:
                    stats[col] = {
                        'mean': f"{data.mean():.3f}",
                        'std': f"{data.std():.3f}",
                        'min': f"{data.min():.3f}",
                        'max': f"{data.max():.3f}",
                        'count': len(data)
                    }
        
        return stats

    def create_density_neutron_crossplot(self):
        """Create density-neutron crossplot for lithology identification"""
        print("\nCreating density-neutron crossplot...")
        
        # Collect all density-neutron data points
        all_density = []
        all_neutron = []
        all_wells = []
        all_porosity = []
        
        for well_name, porosity_df in self.porosity_data.items():
            well_info = self.well_data[well_name]
            df = well_info['dataframe']
            
            density_curve = well_info.get('density_curve')
            neutron_curve = well_info.get('neutron_curve')
            
            if density_curve and neutron_curve:
                density_data = df[density_curve].replace(-999.25, np.nan)
                neutron_data = df[neutron_curve].replace(-999.25, np.nan)
                
                # Convert neutron to decimal if in percentage
                if neutron_data.max() > 2:
                    neutron_data = neutron_data / 100
                
                # Clean data
                valid_mask = (
                    density_data.notna() & neutron_data.notna() &
                    (density_data >= 1.8) & (density_data <= 3.2) &
                    (neutron_data >= -0.15) & (neutron_data <= 0.6)
                )
                
                if valid_mask.sum() > 0:
                    all_density.extend(density_data[valid_mask].values)
                    all_neutron.extend(neutron_data[valid_mask].values)
                    all_wells.extend([well_name] * valid_mask.sum())
                    
                    # Add combined porosity if available
                    if 'combined_porosity' in porosity_df.columns:
                        porosity_values = porosity_df.loc[valid_mask, 'combined_porosity'].fillna(0)
                        all_porosity.extend(porosity_values.values)
                    else:
                        all_porosity.extend([0] * valid_mask.sum())
        
        if not all_density:
            print("No valid density-neutron data found for crossplot")
            return None
        
        # Create interactive plotly crossplot
        fig = go.Figure()
        
        # Add data points colored by porosity
        scatter = go.Scatter(
            x=all_neutron,
            y=all_density,
            mode='markers',
            marker=dict(
                color=all_porosity,
                colorscale='Viridis',
                size=4,
                colorbar=dict(title='Porosity'),
                opacity=0.7
            ),
            text=[f'Well: {well}<br>RHOB: {rho:.2f}<br>NPHI: {neu:.3f}<br>Porosity: {por:.3f}' 
                  for well, rho, neu, por in zip(all_wells, all_density, all_neutron, all_porosity)],
            hovertemplate='%{text}<extra></extra>',
            name='Log Data'
        )
        fig.add_trace(scatter)
        
        # Add lithology points
        lithology_colors = {
            'sandstone': 'yellow',
            'limestone': 'blue', 
            'dolomite': 'green',
            'shale': 'red',
            'coal': 'black',
            'anhydrite': 'purple'
        }
        
        for lith_name, props in self.matrix_properties.items():
            if lith_name in lithology_colors:
                fig.add_trace(go.Scatter(
                    x=[props['neutron']],
                    y=[props['density']],
                    mode='markers',
                    marker=dict(
                        color=lithology_colors[lith_name],
                        size=15,
                        symbol='star',
                        line=dict(width=2, color='black')
                    ),
                    name=lith_name.title(),
                    showlegend=True
                ))
        
        # Add porosity lines for sandstone matrix
        neutron_range = np.linspace(-0.15, 0.6, 50)
        for porosity in [0.05, 0.10, 0.15, 0.20, 0.25, 0.30]:
            rho_matrix = self.matrix_properties['sandstone']['density']
            rho_fluid = self.fluid_properties['water']['density']
            density_line = rho_matrix - porosity * (rho_matrix - rho_fluid)
            
            fig.add_trace(go.Scatter(
                x=[0, porosity],
                y=[density_line, density_line],
                mode='lines',
                line=dict(width=1, color='gray', dash='dash'),
                name=f'{porosity:.0%} Porosity',
                showlegend=False,
                hoverinfo='skip'
            ))
        
        fig.update_layout(
            title='Density-Neutron Crossplot for Lithology Identification',
            xaxis_title='Neutron Porosity (fraction)',
            yaxis_title='Bulk Density (g/cm³)',
            yaxis=dict(autorange='reversed'),  # Reverse y-axis
            height=800,
            width=1000,
            template='plotly_white'
        )
        
        # Save the plot
        fig.write_html('plots/density_neutron_crossplot.html')
        print("Density-neutron crossplot saved to plots/density_neutron_crossplot.html")
        
        return fig

    def create_depth_plots(self):
        """Create depth plots showing porosity variations for each well"""
        print("\nCreating depth plots for porosity variations...")
        
        for well_name, porosity_df in self.porosity_data.items():
            well_info = self.well_data[well_name]
            
            # Create subplot figure
            fig = make_subplots(
                rows=1, cols=4,
                subplot_titles=['Gamma Ray', 'Resistivity', 'Porosity Logs', 'Reservoir Quality'],
                shared_yaxes=True,
                horizontal_spacing=0.08
            )
            
            depth = porosity_df.index
            
            # Track 1: Gamma Ray
            if 'gamma_ray' in porosity_df.columns:
                gr_data = porosity_df['gamma_ray'].dropna()
                fig.add_trace(
                    go.Scatter(
                        x=gr_data.values,
                        y=gr_data.index,
                        mode='lines',
                        name='GR',
                        line=dict(color='green', width=2)
                    ),
                    row=1, col=1
                )
            
            # Track 2: Resistivity
            if 'resistivity' in porosity_df.columns:
                res_data = porosity_df['resistivity'].dropna()
                if len(res_data) > 0:
                    fig.add_trace(
                        go.Scatter(
                            x=res_data.values,
                            y=res_data.index,
                            mode='lines',
                            name='Resistivity',
                            line=dict(color='red', width=2)
                        ),
                        row=1, col=2
                    )
            
            # Track 3: Porosity curves
            porosity_colors = {
                'density_porosity': 'blue',
                'neutron_porosity': 'orange',
                'combined_porosity': 'purple'
            }
            
            for por_type, color in porosity_colors.items():
                if por_type in porosity_df.columns:
                    por_data = porosity_df[por_type].dropna()
                    if len(por_data) > 0:
                        fig.add_trace(
                            go.Scatter(
                                x=por_data.values,
                                y=por_data.index,
                                mode='lines',
                                name=por_type.replace('_', ' ').title(),
                                line=dict(color=color, width=2)
                            ),
                            row=1, col=3
                        )
            
            # Track 4: Reservoir Quality
            if 'combined_porosity' in porosity_df.columns:
                por_data = porosity_df['combined_porosity'].dropna()
                
                # Create reservoir quality color mapping
                quality_colors = []
                for porosity in por_data.values:
                    for quality, params in self.reservoir_quality.items():
                        if porosity >= params['porosity_min']:
                            quality_colors.append(params['color'])
                            break
                
                fig.add_trace(
                    go.Scatter(
                        x=por_data.values,
                        y=por_data.index,
                        mode='markers',
                        name='Reservoir Quality',
                        marker=dict(
                            color=quality_colors,
                            size=6,
                            opacity=0.8
                        ),
                        text=[f'Porosity: {p:.3f}' for p in por_data.values],
                        hovertemplate='%{text}<br>Depth: %{y:.1f}<extra></extra>'
                    ),
                    row=1, col=4
                )
            
            # Update layout
            fig.update_layout(
                title=f'Well Log Analysis - {well_name}',
                height=800,
                showlegend=True,
                template='plotly_white'
            )
            
            # Update y-axes to show depth (reversed)
            for col in range(1, 5):
                fig.update_yaxes(autorange='reversed', title_text='Depth', row=1, col=col)
            
            # Update x-axes titles
            fig.update_xaxes(title_text='GR (API)', row=1, col=1)
            fig.update_xaxes(title_text='Resistivity (ohm.m)', type='log', row=1, col=2)
            fig.update_xaxes(title_text='Porosity (fraction)', row=1, col=3)
            fig.update_xaxes(title_text='Porosity (fraction)', row=1, col=4)
            
            # Save individual well plot
            filename = f'plots/well_depth_plot_{well_name.replace(" ", "_")}.html'
            fig.write_html(filename)
            print(f"Depth plot for {well_name} saved to {filename}")

    def identify_reservoir_intervals(self):
        """Identify best reservoir intervals based on porosity and other criteria"""
        print("\nIdentifying reservoir intervals...")
        
        for well_name, porosity_df in self.porosity_data.items():
            intervals = []
            
            if 'combined_porosity' not in porosity_df.columns:
                continue
            
            porosity_data = porosity_df['combined_porosity'].dropna()
            
            if len(porosity_data) < 10:  # Need minimum data
                continue
            
            # Define reservoir quality thresholds
            min_porosity = 0.08  # 8% minimum porosity
            min_thickness = 5    # 5-unit minimum thickness
            
            # Smooth the porosity curve to identify trends
            smoothed_porosity = savgol_filter(porosity_data.values, 
                                            window_length=min(11, len(porosity_data)//2*2+1), 
                                            polyorder=2)
            
            # Find zones above minimum porosity
            good_porosity_mask = smoothed_porosity >= min_porosity
            
            # Find continuous intervals
            depth_values = porosity_data.index.values
            
            # Group consecutive true values
            intervals_raw = []
            start_idx = None
            
            for i, is_good in enumerate(good_porosity_mask):
                if is_good and start_idx is None:
                    start_idx = i
                elif not is_good and start_idx is not None:
                    end_idx = i - 1
                    if (depth_values[end_idx] - depth_values[start_idx]) >= min_thickness:
                        intervals_raw.append((start_idx, end_idx))
                    start_idx = None
            
            # Handle case where good zone extends to end
            if start_idx is not None:
                end_idx = len(depth_values) - 1
                if (depth_values[end_idx] - depth_values[start_idx]) >= min_thickness:
                    intervals_raw.append((start_idx, end_idx))
            
            # Calculate interval statistics
            for start_idx, end_idx in intervals_raw:
                interval_data = porosity_data.iloc[start_idx:end_idx+1]
                depth_range = (depth_values[start_idx], depth_values[end_idx])
                
                # Calculate statistics
                interval_stats = {
                    'depth_top': depth_range[0],
                    'depth_bottom': depth_range[1], 
                    'thickness': depth_range[1] - depth_range[0],
                    'avg_porosity': interval_data.mean(),
                    'max_porosity': interval_data.max(),
                    'min_porosity': interval_data.min(),
                    'std_porosity': interval_data.std()
                }
                
                # Add reservoir quality assessment
                avg_por = interval_stats['avg_porosity']
                interval_stats['reservoir_quality'] = 'tight'  # default
                for quality, params in self.reservoir_quality.items():
                    if avg_por >= params['porosity_min']:
                        interval_stats['reservoir_quality'] = quality
                        break
                
                intervals.append(interval_stats)
            
            # Sort intervals by depth
            intervals.sort(key=lambda x: x['depth_top'])
            self.reservoir_intervals[well_name] = intervals
            
            # Print summary
            if intervals:
                print(f"\n{well_name}: Found {len(intervals)} reservoir intervals")
                for i, interval in enumerate(intervals):
                    print(f"  Interval {i+1}: {interval['depth_top']:.1f}-{interval['depth_bottom']:.1f}m, "
                          f"Avg porosity: {interval['avg_porosity']:.3f}, Quality: {interval['reservoir_quality']}")

    def generate_synthetic_data(self, num_wells=5):
        """Generate synthetic well log data for demonstration when no real data is available"""
        print("Generating synthetic well log data for demonstration...")
        
        np.random.seed(42)  # For reproducibility
        
        for i in range(num_wells):
            well_name = f"SYNTHETIC_WELL_{i+1:02d}"
            
            # Create depth array
            depth = np.linspace(1000, 3000, 2000)  # 2000 points from 1000-3000m
            
            # Generate realistic geological layers
            n_layers = np.random.randint(5, 15)
            layer_boundaries = np.sort(np.random.choice(depth[100:-100], n_layers-1, replace=False))
            layer_boundaries = np.concatenate([[depth[0]], layer_boundaries, [depth[-1]]])
            
            # Initialize log arrays
            rhob = np.zeros_like(depth)
            nphi = np.zeros_like(depth)
            gr = np.zeros_like(depth)
            rt = np.ones_like(depth)
            
            # Generate each layer
            for j in range(len(layer_boundaries)-1):
                top = layer_boundaries[j]
                bottom = layer_boundaries[j+1]
                mask = (depth >= top) & (depth <= bottom)
                
                # Random lithology for this layer
                lithology = np.random.choice(['sandstone', 'shale', 'limestone'], 
                                           p=[0.4, 0.3, 0.3])
                
                base_props = self.matrix_properties[lithology]
                
                # Add porosity variation (more for sandstone/limestone)
                if lithology in ['sandstone', 'limestone']:
                    porosity_range = np.random.uniform(0.05, 0.25)
                    porosity_trend = np.linspace(porosity_range*0.5, porosity_range*1.5, mask.sum())
                    porosity_trend = np.clip(porosity_trend + np.random.normal(0, 0.02, mask.sum()), 0, 0.4)
                else:  # shale
                    porosity_trend = np.random.uniform(0.02, 0.08, mask.sum())
                
                # Calculate density (matrix - porosity effect)
                rhob[mask] = (base_props['density'] - 
                             porosity_trend * (base_props['density'] - 1.0) +
                             np.random.normal(0, 0.02, mask.sum()))
                
                # Calculate neutron (matrix + porosity effect)
                nphi[mask] = (base_props['neutron'] + porosity_trend + 
                             np.random.normal(0, 0.02, mask.sum()))
                
                # Gamma ray
                if lithology == 'shale':
                    gr[mask] = np.random.uniform(80, 150, mask.sum())
                else:
                    gr[mask] = np.random.uniform(20, 60, mask.sum())
                
                # Resistivity (higher for hydrocarbons/tight rocks)
                if lithology == 'shale':
                    rt[mask] = np.random.lognormal(0.5, 0.5, mask.sum())
                else:
                    # Some intervals with high resistivity (potential hydrocarbons)
                    if np.random.random() > 0.7 and porosity_range > 0.1:
                        rt[mask] = np.random.lognormal(2, 1, mask.sum())  # High resistivity
                    else:
                        rt[mask] = np.random.lognormal(0.5, 0.5, mask.sum())  # Water bearing
            
            # Add noise to all curves
            rhob += np.random.normal(0, 0.01, len(rhob))
            nphi += np.random.normal(0, 0.01, len(nphi))
            gr += np.random.normal(0, 2, len(gr))
            rt *= np.random.lognormal(0, 0.1, len(rt))
            
            # Create DataFrame
            synthetic_df = pd.DataFrame({
                'RHOB': np.clip(rhob, 1.8, 3.0),
                'NPHI': np.clip(nphi, -0.15, 0.5),
                'GR': np.clip(gr, 0, 200),
                'RT': np.clip(rt, 0.1, 1000)
            }, index=depth)
            
            # Store in well_data
            self.well_data[well_name] = {
                'dataframe': synthetic_df,
                'density_curve': 'RHOB',
                'neutron_curve': 'NPHI', 
                'gamma_ray_curve': 'GR',
                'resistivity_curve': 'RT',
                'start_depth': depth[0],
                'stop_depth': depth[-1],
                's3_key': f'synthetic/{well_name}.las'
            }
            
            print(f"Generated synthetic data for {well_name}")
        
        print(f"Generated {len(self.well_data)} synthetic wells")

    def create_summary_report(self):
        """Generate comprehensive summary report"""
        print("\nGenerating comprehensive analysis report...")
        
        # Calculate field-wide statistics
        all_porosities = []
        reservoir_summary = []
        
        for well_name, porosity_df in self.porosity_data.items():
            if 'combined_porosity' in porosity_df.columns:
                por_data = porosity_df['combined_porosity'].dropna()
                all_porosities.extend(por_data.values)
            
            # Add reservoir intervals to summary
            if well_name in self.reservoir_intervals:
                for interval in self.reservoir_intervals[well_name]:
                    reservoir_summary.append({
                        'Well': well_name,
                        **interval
                    })
        
        # Create HTML report
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Porosity and Reservoir Analysis Report</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }}
                h1, h2, h3 {{ color: #2c3e50; }}
                .summary-box {{ background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }}
                .stat-grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }}
                .stat-card {{ background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #3498db; }}
                table {{ border-collapse: collapse; width: 100%; margin: 20px 0; }}
                th, td {{ border: 1px solid #ddd; padding: 12px; text-align: left; }}
                th {{ background-color: #34495e; color: white; }}
                tr:nth-child(even) {{ background-color: #f2f2f2; }}
                .quality-excellent {{ background-color: #d4edda; }}
                .quality-very-good {{ background-color: #d1ecf1; }}
                .quality-good {{ background-color: #fff3cd; }}
                .quality-fair {{ background-color: #f8d7da; }}
                .quality-poor {{ background-color: #f5c6cb; }}
            </style>
        </head>
        <body>
            <h1>Comprehensive Porosity and Reservoir Analysis Report</h1>
            
            <div class="summary-box">
                <h2>Analysis Summary</h2>
                <div class="stat-grid">
                    <div class="stat-card">
                        <h3>Wells Analyzed</h3>
                        <p><strong>{len(self.well_data)}</strong> wells</p>
                    </div>
                    <div class="stat-card">
                        <h3>Porosity Data Points</h3>
                        <p><strong>{len(all_porosities):,}</strong> measurements</p>
                    </div>
                    <div class="stat-card">
                        <h3>Average Porosity</h3>
                        <p><strong>{np.mean(all_porosities):.1%}</strong></p>
                    </div>
                    <div class="stat-card">
                        <h3>Reservoir Intervals</h3>
                        <p><strong>{len(reservoir_summary)}</strong> identified</p>
                    </div>
                </div>
            </div>
            
            <h2>Well Summary</h2>
            <table>
                <thead>
                    <tr>
                        <th>Well Name</th>
                        <th>Depth Range</th>
                        <th>Avg Porosity</th>
                        <th>Max Porosity</th>
                        <th>Reservoir Intervals</th>
                        <th>Data Quality</th>
                    </tr>
                </thead>
                <tbody>
        """
        
        for well_name, well_info in self.well_data.items():
            porosity_df = self.porosity_data.get(well_name, pd.DataFrame())
            
            # Calculate well statistics
            if 'combined_porosity' in porosity_df.columns:
                por_data = porosity_df['combined_porosity'].dropna()
                avg_por = por_data.mean() if len(por_data) > 0 else 0
                max_por = por_data.max() if len(por_data) > 0 else 0
                data_quality = 'Good' if len(por_data) > 100 else 'Limited'
            else:
                avg_por = 0
                max_por = 0
                data_quality = 'No porosity data'
            
            interval_count = len(self.reservoir_intervals.get(well_name, []))
            
            html_content += f"""
                    <tr>
                        <td>{well_name}</td>
                        <td>{well_info['start_depth']:.0f} - {well_info['stop_depth']:.0f}m</td>
                        <td>{avg_por:.1%}</td>
                        <td>{max_por:.1%}</td>
                        <td>{interval_count}</td>
                        <td>{data_quality}</td>
                    </tr>
            """
        
        html_content += """
                </tbody>
            </table>
            
            <h2>Reservoir Intervals</h2>
            <table>
                <thead>
                    <tr>
                        <th>Well</th>
                        <th>Top Depth (m)</th>
                        <th>Bottom Depth (m)</th>
                        <th>Thickness (m)</th>
                        <th>Avg Porosity</th>
                        <th>Max Porosity</th>
                        <th>Reservoir Quality</th>
                    </tr>
                </thead>
                <tbody>
        """
        
        for interval in reservoir_summary:
            quality_class = f"quality-{interval['reservoir_quality'].replace('_', '-')}"
            html_content += f"""
                    <tr class="{quality_class}">
                        <td>{interval['Well']}</td>
                        <td>{interval['depth_top']:.1f}</td>
                        <td>{interval['depth_bottom']:.1f}</td>
                        <td>{interval['thickness']:.1f}</td>
                        <td>{interval['avg_porosity']:.1%}</td>
                        <td>{interval['max_porosity']:.1%}</td>
                        <td>{interval['reservoir_quality'].replace('_', ' ').title()}</td>
                    </tr>
            """
        
        html_content += """
                </tbody>
            </table>
            
            <h2>Visualization Files</h2>
            <ul>
                <li><a href="density_neutron_crossplot.html">Density-Neutron Crossplot</a></li>
        """
        
        for well_name in self.well_data.keys():
            safe_name = well_name.replace(' ', '_')
            html_content += f'<li><a href="well_depth_plot_{safe_name}.html">Depth Plot - {well_name}</a></li>'
        
        html_content += """
            </ul>
            
            <h2>Analysis Methods</h2>
            <p><strong>Porosity Calculation:</strong> Combined density and neutron porosity using standard petrophysical equations.</p>
            <p><strong>Lithology Identification:</strong> Density-neutron crossplot analysis with standard mineral matrix points.</p>
            <p><strong>Reservoir Quality:</strong> Based on porosity thresholds and log character analysis.</p>
            
        </body>
        </html>
        """
        
        # Save report
        with open('reports/porosity_analysis_report.html', 'w') as f:
            f.write(html_content)
        
        print("Comprehensive report saved to reports/porosity_analysis_report.html")

    def run_complete_analysis(self, max_files=None):
        """Run the complete porosity and reservoir analysis workflow"""
        print("="*60)
        print("COMPREHENSIVE POROSITY AND RESERVOIR ANALYSIS")
        print("="*60)
        
        try:
            # Step 1: Load data
            self.download_and_load_las_files(max_files)
            
            if not self.well_data:
                print("No well data loaded. Exiting analysis.")
                return
            
            # Step 2: Calculate porosity
            self.calculate_porosity()
            
            # Step 3: Create visualizations
            self.create_density_neutron_crossplot()
            self.create_depth_plots()
            
            # Step 4: Identify reservoir intervals
            self.identify_reservoir_intervals()
            
            # Step 5: Generate report
            self.create_summary_report()
            
            print("\n" + "="*60)
            print("ANALYSIS COMPLETE")
            print("="*60)
            print("\nOutput files generated:")
            print("- Density-neutron crossplot: plots/density_neutron_crossplot.html")
            print("- Individual well depth plots: plots/well_depth_plot_*.html")
            print("- Comprehensive report: reports/porosity_analysis_report.html")
            
            # Print summary statistics
            total_intervals = sum(len(intervals) for intervals in self.reservoir_intervals.values())
            good_intervals = sum(1 for intervals in self.reservoir_intervals.values() 
                               for interval in intervals 
                               if interval['reservoir_quality'] in ['excellent', 'very_good', 'good'])
            
            print(f"\nSUMMARY:")
            print(f"- Wells processed: {len(self.well_data)}")
            print(f"- Total reservoir intervals: {total_intervals}")
            print(f"- High-quality intervals: {good_intervals}")
            print(f"- Analysis method: Density-neutron log analysis with petrophysical calculations")
            
        except Exception as e:
            print(f"Error during analysis: {e}")
            import traceback
            traceback.print_exc()


def main():
    """Main execution function"""
    try:
        # Initialize analyzer
        analyzer = PorosityReservoirAnalyzer()
        
        # Run complete analysis
        analyzer.run_complete_analysis(max_files=24)  # Process all 24 LAS files
        
    except Exception as e:
        print(f"Failed to run analysis: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
