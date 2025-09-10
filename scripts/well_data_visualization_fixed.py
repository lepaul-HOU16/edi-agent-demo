"""
Well Data Visualization Script

This script downloads LAS files from S3 and creates comprehensive visualizations
of well log data including multi-well comparisons and summary plots.
"""

import os

# Core imports with error handling
try:
    import pandas as pd
    import numpy as np
except ImportError as e:
    print(f"Data processing library import error: {e}")
    print("Please install required packages: pip install pandas numpy")
    exit(1)

try:
    import matplotlib.pyplot as plt
except ImportError as e:
    print(f"Matplotlib import error: {e}")
    print("Please install Matplotlib: pip install matplotlib>=3.3.0")
    # Note: Matplotlib is optional, so we don't exit here
    plt = None

try:
    import plotly.graph_objs as go
    import plotly.io as pio
except ImportError as e:
    print(f"Plotly import error: {e}")
    print("Please install Plotly: pip install plotly>=5.0.0")
    # Note: Plotly is optional, so we don't exit here
    go = None
    pio = None

try:
    import boto3
except ImportError as e:
    print(f"AWS boto3 import error: {e}")
    print("Please install boto3: pip install boto3>=1.17.0")
    # Note: boto3 is optional, so we don't exit here
    boto3 = None

# Optional LAS file processing
try:
    import lasio
except ImportError as e:
    print(f"Lasio import error (optional): {e}")
    print("For LAS file processing, install lasio: pip install lasio>=0.30")
    lasio = None

# Define required variables (these should be set before running the script)
s3BucketName = os.environ.get('S3_BUCKET_NAME', 'your-bucket-name-here')

# Create output directories
os.makedirs('plots', exist_ok=True)


def check_and_download_las_files():
    """
    Check for LAS files in S3 and download them to local directory
    """
    import boto3
    
    print("Checking for LAS files in S3...")
    
    s3_client = boto3.client('s3')
    bucket_name = s3BucketName
    
    # Check both global well-files and global/well-data directories
    prefixes_to_check = ['global/well-files/', 'global/well-data/', 'global/']
    
    downloaded_files = []
    
    for prefix in prefixes_to_check:
        try:
            print(f"Checking S3 prefix: {prefix}")
            
            # List objects in the prefix
            response = s3_client.list_objects_v2(
                Bucket=bucket_name,
                Prefix=prefix,
                MaxKeys=100
            )
            
            if 'Contents' in response:
                las_files = [obj['Key'] for obj in response['Contents'] 
                           if obj['Key'].lower().endswith('.las')]
                
                print(f"Found {len(las_files)} LAS files in {prefix}")
                
                # Download each LAS file
                for s3_key in las_files[:5]:  # Limit to first 5 files for demo
                    local_path = s3_key.replace('/', '_')  # Flatten path for local storage
                    
                    try:
                        print(f"Downloading {s3_key} to {local_path}")
                        s3_client.download_file(bucket_name, s3_key, local_path)
                        downloaded_files.append(local_path)
                        print(f"Successfully downloaded {local_path}")
                    except Exception as download_error:
                        print(f"Error downloading {s3_key}: {str(download_error)}")
                        
        except Exception as list_error:
            print(f"Error listing objects in {prefix}: {str(list_error)}")
    
    print(f"Total downloaded LAS files: {len(downloaded_files)}")
    return downloaded_files

def load_las_files_from_list(las_file_paths):
    """
    Load LAS files from a list of file paths and extract key information
    """
    well_data = {}
    
    if not las_file_paths:
        print("No LAS files provided to load")
        return well_data
    
    print(f"Attempting to load {len(las_file_paths)} LAS files...")
    
    for las_file in las_file_paths:
        try:
            print(f"Loading LAS file: {las_file}")
            
            # Check if file exists
            if not os.path.exists(las_file):
                print(f"File not found: {las_file}")
                continue
            
            # Try to load with lasio
            try:
                import lasio
                las = lasio.read(las_file)
            except Exception as las_error:
                print(f"Error reading LAS file {las_file}: {str(las_error)}")
                continue
            
            # Convert to DataFrame
            try:
                well_df = las.df()
                if well_df.empty:
                    print(f"Warning: Empty dataframe from {las_file}")
                    continue
            except Exception as df_error:
                print(f"Error converting to DataFrame for {las_file}: {str(df_error)}")
                continue
            
            # Extract well metadata with fallbacks
            try:
                # Try different common well name fields
                well_name = None
                for field in ['WELL', 'UWI', 'API']:
                    try:
                        well_name = las.well.get_item(field).value
                        if well_name:
                            break
                    except:
                        continue
                
                # Fallback to filename if no well name found
                if not well_name:
                    well_name = os.path.basename(las_file).replace('.las', '').replace('.LAS', '')
                    
            except Exception as name_error:
                print(f"Error extracting well name for {las_file}: {str(name_error)}")
                well_name = os.path.basename(las_file).replace('.las', '').replace('.LAS', '')
            
            # Identify available curves
            try:
                curves = [curve.mnemonic for curve in las.curves]
                print(f"Well {well_name}: Found {len(curves)} curves: {', '.join(curves[:10])}")
            except Exception as curves_error:
                print(f"Error extracting curves for {las_file}: {str(curves_error)}")
                curves = []
            
            # Get depth range with fallbacks
            try:
                start_depth = getattr(las, 'start', None) or well_df.index.min()
                stop_depth = getattr(las, 'stop', None) or well_df.index.max()
            except:
                start_depth = None
                stop_depth = None
            
            well_data[well_name] = {
                'dataframe': well_df,
                'curves': curves,
                'start_depth': start_depth,
                'stop_depth': stop_depth,
                'file_path': las_file
            }
            
            print(f"Successfully loaded well: {well_name}")
            
        except Exception as outer_error:
            print(f"Unexpected error processing {las_file}: {str(outer_error)}")
            continue
    
    print(f"Successfully loaded {len(well_data)} wells")
    return well_data

def create_multi_well_log_visualization(well_data):
    """
    Create an interactive multi-well log visualization
    """
    if not well_data:
        print("No well data available for visualization")
        return None
        
    print(f"Creating multi-well visualization for {len(well_data)} wells...")
    
    # Prepare data for visualization
    wells = list(well_data.keys())
    curves_to_plot = ['GR', 'RHOB', 'NPHI', 'RT', 'RESDEEP', 'CALI']
    
    # Create subplots
    fig = go.Figure()
    
    # Color palette
    colors = ['red', 'green', 'blue', 'purple', 'orange', 'brown']
    
    # Plot each well
    plotted_any = False
    for i, (well_name, well_info) in enumerate(well_data.items()):
        df = well_info['dataframe']
        
        # Plot available curves
        for j, curve in enumerate(curves_to_plot):
            # Try different variations of curve names
            curve_variants = [curve, curve.upper(), curve.lower()]
            found_curve = None
            
            for variant in curve_variants:
                if variant in df.columns:
                    found_curve = variant
                    break
            
            if found_curve:
                try:
                    # Filter out null/invalid values
                    mask = pd.notna(df[found_curve]) & (df[found_curve] != -999.25)
                    if mask.sum() > 0:  # Only plot if there's valid data
                        fig.add_trace(go.Scatter(
                            x=df[found_curve][mask],
                            y=df.index[mask],
                            mode='lines',
                            name=f'{well_name} - {found_curve}',
                            line=dict(color=colors[j % len(colors)], width=2),
                            legendgroup=well_name,
                            showlegend=j==0
                        ))
                        plotted_any = True
                        print(f"Plotted {found_curve} for well {well_name}")
                except Exception as plot_error:
                    print(f"Error plotting {found_curve} for {well_name}: {str(plot_error)}")
    
    if not plotted_any:
        print("Warning: No valid data was plotted")
        return None
    
    # Update layout
    fig.update_layout(
        title='Multi-Well Log Visualization',
        xaxis_title='Log Values',
        yaxis_title='Depth (m)',
        height=800,
        width=1200,
        template='plotly_white'
    )
    
    # Reverse y-axis for depth
    fig.update_yaxes(autorange="reversed")
    
    # Save the plot
    try:
        fig.write_html('plots/multi_well_log_visualization.html')
        print("Multi-well visualization saved successfully")
    except Exception as save_error:
        print(f"Error saving visualization: {str(save_error)}")
    
    return fig

def create_well_summary_plot(well_data):
    """
    Create a summary plot showing well depths and available curves
    """
    if not well_data:
        print("No well data available for summary plot")
        return
        
    print(f"Creating summary plot for {len(well_data)} wells...")
    
    # Prepare data
    well_names = list(well_data.keys())
    start_depths = []
    stop_depths = []
    
    for well in well_names:
        start = well_data[well]['start_depth']
        stop = well_data[well]['stop_depth']
        
        # Handle None values
        if start is None or stop is None:
            df = well_data[well]['dataframe']
            start = start or df.index.min() if not df.empty else 0
            stop = stop or df.index.max() if not df.empty else 100
            
        start_depths.append(start)
        stop_depths.append(stop)
    
    # Create figure
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(15, 6))
    
    # Well Depth Plot
    try:
        depths = [stop - start for stop, start in zip(stop_depths, start_depths)]
        ax1.barh(well_names, depths, left=start_depths, color='skyblue', alpha=0.7)
        ax1.set_xlabel('Depth (m)')
        ax1.set_title('Well Depths')
        ax1.grid(True, alpha=0.3)
    except Exception as depth_error:
        print(f"Error creating depth plot: {str(depth_error)}")
    
    # Curve Availability Plot
    try:
        curve_availability = {}
        for well, well_info in well_data.items():
            for curve in well_info['curves']:
                if curve not in curve_availability:
                    curve_availability[curve] = 0
                curve_availability[curve] += 1
        
        if curve_availability:
            curves = list(curve_availability.keys())
            counts = list(curve_availability.values())
            
            ax2.bar(curves, counts, color='lightgreen', alpha=0.7)
            ax2.set_title('Curve Availability Across Wells')
            ax2.set_xlabel('Curve Type')
            ax2.set_ylabel('Number of Wells')
            ax2.tick_params(axis='x', rotation=45)
            ax2.grid(True, alpha=0.3)
        else:
            ax2.text(0.5, 0.5, 'No curve data available', 
                    transform=ax2.transAxes, ha='center', va='center')
            ax2.set_title('Curve Availability Across Wells')
            
    except Exception as curve_error:
        print(f"Error creating curve availability plot: {str(curve_error)}")
    
    plt.tight_layout()
    
    try:
        plt.savefig('plots/well_summary_plot.png', dpi=150, bbox_inches='tight', transparent=True)
        plt.close()
        print("Well summary plot saved successfully")
    except Exception as save_error:
        print(f"Error saving summary plot: {str(save_error)}")

# Main Execution
print("Starting well data visualization script...")

try:
    # Download LAS files from S3
    downloaded_las_files = check_and_download_las_files()
    
    if not downloaded_las_files:
        print("No LAS files found or downloaded. Please check if LAS files exist in S3.")
        print("Expected locations:")
        print("- global/well-files/")
        print("- global/well-data/") 
        print("- global/ (root)")
    else:
        print(f"Found {len(downloaded_las_files)} LAS files to process")
        
        # Load the LAS files
        well_data = load_las_files_from_list(downloaded_las_files)
        
        if not well_data:
            print("No wells were successfully loaded")
        else:
            print(f"Successfully loaded {len(well_data)} wells")
            
            # Generate visualizations
            print("Creating visualizations...")
            create_multi_well_log_visualization(well_data)
            create_well_summary_plot(well_data)
            
            # Print well information
            print("\n" + "="*50)
            print("WELL PROCESSING SUMMARY")
            print("="*50)
            
            for well_name, info in well_data.items():
                print(f"\nWell: {well_name}")
                print(f"  File: {info['file_path']}")
                print(f"  Available Curves ({len(info['curves'])}): {', '.join(info['curves'][:10])}")
                if len(info['curves']) > 10:
                    print(f"    ... and {len(info['curves']) - 10} more curves")
                print(f"  Depth Range: {info['start_depth']:.2f} - {info['stop_depth']:.2f} m")
                print(f"  Data Points: {len(info['dataframe'])}")
            
            print(f"\nTotal Wells Processed: {len(well_data)}")
            print("Visualizations saved to plots/ directory")

except Exception as main_error:
    print(f"Error in main execution: {str(main_error)}")
    import traceback
    traceback.print_exc()

print("\nScript execution completed.")
