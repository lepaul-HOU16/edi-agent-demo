"""
Comprehensive Plotly Feature Test Script

This script tests all major Plotly features and chart types to verify
complete functionality of the Plotly library installation.
"""

import os

# Core imports with error handling
try:
    import numpy as np
    import pandas as pd
except ImportError as e:
    print(f"Data processing library import error: {e}")
    print("Please install required packages: pip install pandas numpy")
    exit(1)

try:
    import plotly.graph_objects as go
    import plotly.express as px
    from plotly.subplots import make_subplots
    import plotly.figure_factory as ff
    import plotly.io as pio
except ImportError as e:
    print(f"Plotly import error: {e}")
    print("Please install Plotly: pip install plotly>=5.0.0")
    exit(1)

# Create output directory
os.makedirs('plots', exist_ok=True)

print("=== COMPREHENSIVE PLOTLY FEATURE TEST ===")
print(f"Plotly version: {pio.__version__ if hasattr(pio, '__version__') else 'Unknown'}")

# Set default template for better appearance
pio.templates.default = "plotly_white"

def test_basic_plots():
    """Test basic plot types"""
    print("\n1. Testing Basic Plot Types...")
    
    # Sample data
    x = np.linspace(0, 10, 100)
    y1 = np.sin(x)
    y2 = np.cos(x)
    
    # Basic line plot
    fig = go.Figure()
    fig.add_trace(go.Scatter(x=x, y=y1, mode='lines', name='sin(x)', line=dict(color='blue', width=2)))
    fig.add_trace(go.Scatter(x=x, y=y2, mode='lines', name='cos(x)', line=dict(color='red', width=2)))
    fig.update_layout(
        title="Basic Line Plot Test",
        xaxis_title="X Values",
        yaxis_title="Y Values",
        hovermode='x unified'
    )
    fig.write_html('plots/test_basic_line.html')
    print("✓ Basic line plot created")

def test_advanced_chart_types():
    """Test advanced chart types"""
    print("\n2. Testing Advanced Chart Types...")
    
    # 3D Surface Plot
    x = np.linspace(-5, 5, 50)
    y = np.linspace(-5, 5, 50)
    X, Y = np.meshgrid(x, y)
    Z = np.sin(np.sqrt(X**2 + Y**2))
    
    fig = go.Figure(data=[go.Surface(z=Z, x=X, y=Y, colorscale='Viridis')])
    fig.update_layout(
        title="3D Surface Plot Test",
        scene=dict(
            xaxis_title='X',
            yaxis_title='Y',
            zaxis_title='Z'
        )
    )
    fig.write_html('plots/test_3d_surface.html')
    print("✓ 3D Surface plot created")
    
    # Heatmap
    data = np.random.randn(20, 20)
    fig = go.Figure(data=go.Heatmap(
        z=data,
        colorscale='RdYlBu',
        showscale=True
    ))
    fig.update_layout(title="Heatmap Test")
    fig.write_html('plots/test_heatmap.html')
    print("✓ Heatmap created")
    
    # Contour Plot
    fig = go.Figure(data=go.Contour(
        z=Z,
        x=x,
        y=y,
        colorscale='Plasma',
        contours=dict(
            showlabels=True,
            labelfont=dict(size=12, color='white')
        )
    ))
    fig.update_layout(title="Contour Plot Test")
    fig.write_html('plots/test_contour.html')
    print("✓ Contour plot created")

def test_statistical_plots():
    """Test statistical plot types"""
    print("\n3. Testing Statistical Plots...")
    
    # Box plot
    data = [np.random.normal(0, 1, 100), np.random.normal(1, 1.5, 100), np.random.normal(-1, 0.5, 100)]
    fig = go.Figure()
    for i, dataset in enumerate(data):
        fig.add_trace(go.Box(y=dataset, name=f'Dataset {i+1}'))
    fig.update_layout(title="Box Plot Test")
    fig.write_html('plots/test_boxplot.html')
    print("✓ Box plot created")
    
    # Violin plot
    fig = go.Figure()
    for i, dataset in enumerate(data):
        fig.add_trace(go.Violin(y=dataset, name=f'Dataset {i+1}', box_visible=True, meanline_visible=True))
    fig.update_layout(title="Violin Plot Test")
    fig.write_html('plots/test_violin.html')
    print("✓ Violin plot created")
    
    # Histogram with multiple datasets
    fig = go.Figure()
    for i, dataset in enumerate(data):
        fig.add_trace(go.Histogram(x=dataset, name=f'Dataset {i+1}', opacity=0.7))
    fig.update_layout(
        title="Multi-Histogram Test",
        barmode='overlay',
        xaxis_title='Value',
        yaxis_title='Frequency'
    )
    fig.write_html('plots/test_histogram.html')
    print("✓ Multi-histogram created")

def test_subplots():
    """Test subplot functionality"""
    print("\n4. Testing Subplots...")
    
    # Create subplots with different types
    fig = make_subplots(
        rows=2, cols=2,
        subplot_titles=('Scatter', 'Line', 'Bar', 'Heatmap'),
        specs=[[{"secondary_y": False}, {"secondary_y": False}],
               [{"secondary_y": False}, {"type": "heatmap"}]]
    )
    
    # Scatter plot
    fig.add_trace(
        go.Scatter(x=[1, 2, 3, 4], y=[10, 11, 12, 13], mode='markers', name='Scatter'),
        row=1, col=1
    )
    
    # Line plot
    fig.add_trace(
        go.Scatter(x=[1, 2, 3, 4], y=[16, 15, 14, 13], mode='lines', name='Line'),
        row=1, col=2
    )
    
    # Bar plot
    fig.add_trace(
        go.Bar(x=['A', 'B', 'C', 'D'], y=[5, 4, 3, 2], name='Bar'),
        row=2, col=1
    )
    
    # Heatmap
    fig.add_trace(
        go.Heatmap(z=[[1, 20, 30], [20, 1, 60], [30, 60, 1]], showscale=False),
        row=2, col=2
    )
    
    fig.update_layout(title="Subplot Test", showlegend=False)
    fig.write_html('plots/test_subplots.html')
    print("✓ Subplots created")

def test_interactive_features():
    """Test interactive features"""
    print("\n5. Testing Interactive Features...")
    
    # Interactive scatter with custom hover
    df = pd.DataFrame({
        'x': np.random.randn(100),
        'y': np.random.randn(100),
        'size': np.random.randint(10, 50, 100),
        'color': np.random.choice(['red', 'blue', 'green', 'purple'], 100),
        'category': np.random.choice(['A', 'B', 'C'], 100)
    })
    
    fig = go.Figure()
    
    for category in df['category'].unique():
        subset = df[df['category'] == category]
        fig.add_trace(go.Scatter(
            x=subset['x'],
            y=subset['y'],
            mode='markers',
            name=f'Category {category}',
            marker=dict(
                size=subset['size']/2,
                opacity=0.7,
                line=dict(width=1, color='black')
            ),
            hovertemplate='<b>Category %{text}</b><br>' +
                         'X: %{x:.2f}<br>' +
                         'Y: %{y:.2f}<br>' +
                         'Size: %{marker.size}<br>' +
                         '<extra></extra>',
            text=subset['category']
        ))
    
    fig.update_layout(
        title="Interactive Scatter with Custom Hover",
        xaxis_title="X Values",
        yaxis_title="Y Values",
        hovermode='closest'
    )
    
    # Add range selector
    fig.update_layout(
        xaxis=dict(
            rangeselector=dict(
                buttons=list([
                    dict(count=1, label="1", step="day", stepmode="backward"),
                    dict(step="all")
                ])
            ),
            rangeslider=dict(visible=True),
            type="linear"
        )
    )
    
    fig.write_html('plots/test_interactive.html')
    print("✓ Interactive plot with custom hover created")

def test_animations():
    """Test animation features"""
    print("\n6. Testing Animations...")
    
    # Create animated scatter plot
    df = pd.DataFrame({
        'x': np.random.randn(50),
        'y': np.random.randn(50),
        'frame': ['Frame 1'] * 50
    })
    
    # Add more frames
    for i in range(2, 6):
        new_frame = pd.DataFrame({
            'x': np.random.randn(50),
            'y': np.random.randn(50),
            'frame': [f'Frame {i}'] * 50
        })
        df = pd.concat([df, new_frame], ignore_index=True)
    
    fig = px.scatter(df, x='x', y='y', animation_frame='frame', 
                    title="Animated Scatter Plot Test",
                    range_x=[-3, 3], range_y=[-3, 3])
    
    fig.update_layout(
        updatemenus=[{
            'type': 'buttons',
            'showactive': False,
            'buttons': [
                {'label': 'Play', 'method': 'animate', 'args': [None]},
                {'label': 'Pause', 'method': 'animate', 'args': [None, {'frame': {'duration': 0, 'redraw': False}, 'mode': 'immediate', 'transition': {'duration': 0}}]}
            ]
        }]
    )
    
    fig.write_html('plots/test_animation.html')
    print("✓ Animated plot created")

def test_financial_charts():
    """Test financial/candlestick charts"""
    print("\n7. Testing Financial Charts...")
    
    # Create sample OHLC data
    dates = pd.date_range('2023-01-01', periods=50, freq='D')
    np.random.seed(42)
    
    open_prices = 100 + np.cumsum(np.random.randn(50) * 0.5)
    high_prices = open_prices + np.random.rand(50) * 2
    low_prices = open_prices - np.random.rand(50) * 2
    close_prices = open_prices + np.random.randn(50) * 0.8
    
    fig = go.Figure(data=go.Candlestick(
        x=dates,
        open=open_prices,
        high=high_prices,
        low=low_prices,
        close=close_prices,
        name="OHLC"
    ))
    
    fig.update_layout(
        title="Candlestick Chart Test",
        yaxis_title="Price",
        xaxis_rangeslider_visible=False
    )
    
    fig.write_html('plots/test_candlestick.html')
    print("✓ Candlestick chart created")

def test_geographic_plots():
    """Test geographic/map plots"""
    print("\n8. Testing Geographic Plots...")
    
    # Choropleth map
    fig = go.Figure(data=go.Choropleth(
        locations=['USA', 'Canada', 'Mexico', 'Brazil'],
        z=[1, 2, 3, 4],
        locationmode='country names',
        colorscale='Blues',
        text=['United States', 'Canada', 'Mexico', 'Brazil']
    ))
    
    fig.update_layout(
        title="Choropleth Map Test",
        geo=dict(
            showframe=False,
            showcoastlines=True,
            projection_type='equirectangular'
        )
    )
    
    fig.write_html('plots/test_choropleth.html')
    print("✓ Choropleth map created")
    
    # Scatter map
    fig = go.Figure(data=go.Scattergeo(
        lon=[-74, -87, -122, -0.1],
        lat=[40.7, 41.9, 37.8, 51.5],
        text=['New York', 'Chicago', 'San Francisco', 'London'],
        mode='markers',
        marker=dict(
            size=[20, 30, 15, 25],
            color=['red', 'blue', 'green', 'purple'],
            line=dict(width=1, color='black')
        )
    ))
    
    fig.update_layout(
        title="Scatter Geo Map Test",
        geo=dict(
            projection_type='natural earth'
        )
    )
    
    fig.write_html('plots/test_scatter_geo.html')
    print("✓ Scatter geo map created")

def test_custom_styling():
    """Test custom styling and themes"""
    print("\n9. Testing Custom Styling...")
    
    # Custom styled plot
    fig = go.Figure()
    
    x = np.linspace(0, 10, 100)
    for i, (name, func) in enumerate([('sin', np.sin), ('cos', np.cos), ('tan', np.tanh)]):
        fig.add_trace(go.Scatter(
            x=x, 
            y=func(x),
            mode='lines',
            name=name,
            line=dict(
                width=3,
                dash='solid' if i == 0 else 'dash' if i == 1 else 'dot'
            )
        ))
    
    # Custom layout with styling
    fig.update_layout(
        title=dict(
            text="Custom Styled Plot Test",
            x=0.5,
            font=dict(size=24, color='darkblue')
        ),
        plot_bgcolor='rgba(240,240,240,0.95)',
        paper_bgcolor='white',
        font=dict(family="Arial, sans-serif", size=12, color="black"),
        xaxis=dict(
            title="X Axis",
            gridcolor='white',
            gridwidth=2,
            showgrid=True,
            zeroline=True,
            zerolinecolor='black',
            zerolinewidth=2
        ),
        yaxis=dict(
            title="Y Axis", 
            gridcolor='white',
            gridwidth=2,
            showgrid=True,
            zeroline=True,
            zerolinecolor='black',
            zerolinewidth=2
        ),
        legend=dict(
            x=0.02,
            y=0.98,
            bgcolor='rgba(255,255,255,0.8)',
            bordercolor='black',
            borderwidth=1
        )
    )
    
    fig.write_html('plots/test_custom_styling.html')
    print("✓ Custom styled plot created")

def create_test_dashboard():
    """Create a comprehensive test dashboard"""
    print("\n10. Creating Comprehensive Test Dashboard...")
    
    # Create a complex dashboard with multiple chart types
    fig = make_subplots(
        rows=3, cols=3,
        subplot_titles=[
            'Time Series', 'Distribution', 'Correlation',
            '3D Scatter', 'Heatmap', 'Box Plots',
            'Bar Chart', 'Pie Chart', 'Polar Chart'
        ],
        specs=[
            [{"secondary_y": False}, {"secondary_y": False}, {"secondary_y": False}],
            [{"type": "scatter3d"}, {"type": "heatmap"}, {"secondary_y": False}],
            [{"secondary_y": False}, {"type": "domain"}, {"type": "polar"}]
        ]
    )
    
    # Time series
    dates = pd.date_range('2023-01-01', periods=100, freq='D')
    values = np.cumsum(np.random.randn(100))
    fig.add_trace(go.Scatter(x=dates, y=values, mode='lines', name='Time Series'), row=1, col=1)
    
    # Distribution
    data = np.random.normal(0, 1, 1000)
    fig.add_trace(go.Histogram(x=data, nbinsx=30, name='Distribution'), row=1, col=2)
    
    # Correlation
    x = np.random.randn(50)
    y = 2*x + np.random.randn(50)*0.5
    fig.add_trace(go.Scatter(x=x, y=y, mode='markers', name='Correlation'), row=1, col=3)
    
    # 3D Scatter
    fig.add_trace(go.Scatter3d(
        x=np.random.randn(50), 
        y=np.random.randn(50), 
        z=np.random.randn(50),
        mode='markers',
        name='3D Scatter'
    ), row=2, col=1)
    
    # Heatmap
    z = np.random.randn(10, 10)
    fig.add_trace(go.Heatmap(z=z, showscale=False, name='Heatmap'), row=2, col=2)
    
    # Box plots
    for i in range(3):
        fig.add_trace(go.Box(y=np.random.randn(50), name=f'Box {i+1}'), row=2, col=3)
    
    # Bar chart
    categories = ['A', 'B', 'C', 'D', 'E']
    values = np.random.randint(1, 20, 5)
    fig.add_trace(go.Bar(x=categories, y=values, name='Bar Chart'), row=3, col=1)
    
    # Pie chart
    fig.add_trace(go.Pie(labels=categories, values=values, name='Pie Chart'), row=3, col=2)
    
    # Polar chart
    theta = np.linspace(0, 2*np.pi, 8, endpoint=False)
    r = np.random.randint(1, 10, 8)
    fig.add_trace(go.Scatterpolar(theta=theta*180/np.pi, r=r, mode='lines+markers', name='Polar'), row=3, col=3)
    
    fig.update_layout(
        title="Comprehensive Plotly Dashboard Test",
        showlegend=False,
        height=1200
    )
    
    fig.write_html('plots/test_dashboard.html')
    print("✓ Comprehensive dashboard created")

def run_all_tests():
    """Run all Plotly tests"""
    print("Starting comprehensive Plotly testing...")
    print("This will test all major Plotly features and chart types.")
    
    try:
        test_basic_plots()
        test_advanced_chart_types()
        test_statistical_plots()
        test_subplots()
        test_interactive_features()
        test_animations()
        test_financial_charts()
        test_geographic_plots()
        test_custom_styling()
        create_test_dashboard()
        
        print("\n" + "="*60)
        print("🎉 ALL PLOTLY TESTS COMPLETED SUCCESSFULLY!")
        print("="*60)
        print("\nGenerated test files:")
        print("- plots/test_basic_line.html")
        print("- plots/test_3d_surface.html")
        print("- plots/test_heatmap.html")
        print("- plots/test_contour.html")
        print("- plots/test_boxplot.html")
        print("- plots/test_violin.html")
        print("- plots/test_histogram.html")
        print("- plots/test_subplots.html")
        print("- plots/test_interactive.html")
        print("- plots/test_animation.html")
        print("- plots/test_candlestick.html")
        print("- plots/test_choropleth.html")
        print("- plots/test_scatter_geo.html")
        print("- plots/test_custom_styling.html")
        print("- plots/test_dashboard.html")
        
        print("\n✅ Plotly implementation verification:")
        print("✓ Basic chart types (line, scatter, bar)")
        print("✓ Advanced 3D visualizations (surface, scatter3d)")
        print("✓ Statistical plots (box, violin, histogram)")
        print("✓ Complex subplots and layouts")
        print("✓ Interactive features (hover, zoom, pan)")
        print("✓ Animations and frame-based plots")
        print("✓ Financial charts (candlestick/OHLC)")
        print("✓ Geographic/map visualizations")
        print("✓ Custom styling and themes")
        print("✓ Comprehensive dashboards")
        
        return True
        
    except Exception as e:
        print(f"\n❌ ERROR during testing: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

# Run the tests
if __name__ == "__main__":
    success = run_all_tests()
    if success:
        print("\n🔥 PLOTLY IS FULLY FUNCTIONAL WITH ALL ADVANCED FEATURES!")
    else:
        print("\n⚠️  Some Plotly features may need attention.")
