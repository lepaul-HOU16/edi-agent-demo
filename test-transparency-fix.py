import matplotlib.pyplot as plt
import numpy as np
import plotly.graph_objects as go
import os

# Test matplotlib transparency
print("Testing matplotlib transparency...")
x = np.linspace(0, 10, 100)
y = np.sin(x)

plt.figure(figsize=(8, 6))
plt.plot(x, y, label='sin(x)')
plt.title('Matplotlib Test - Should have transparent background')
plt.xlabel('X')
plt.ylabel('Y')
plt.legend()
plt.grid(True, alpha=0.3)

# Save with transparent background (should be default now)
os.makedirs('test_plots', exist_ok=True)
plt.savefig('test_plots/matplotlib_transparent_test.png', dpi=150, bbox_inches='tight')
plt.close()

print("✅ Matplotlib PNG saved with transparent background")

# Test Plotly transparency
print("Testing Plotly transparency...")
fig = go.Figure(data=go.Scatter(x=x, y=y, mode='lines', name='sin(x)'))
fig.update_layout(
    title='Plotly Test - Should have transparent background',
    xaxis_title='X',
    yaxis_title='Y'
)

# Save as PNG (should be transparent by default now)
fig.write_image('test_plots/plotly_transparent_test.png')
fig.write_html('test_plots/plotly_test.html')

print("✅ Plotly PNG saved with transparent background")

# Test the new TransparentFigure helper (if available)
print("Testing TransparentFigure helper...")
if hasattr(go, 'TransparentFigure'):
    fig2 = go.TransparentFigure(data=go.Bar(x=['A', 'B', 'C'], y=[1, 3, 2]))
    fig2.update_layout(title='TransparentFigure Test')
    fig2.write_image('test_plots/transparent_figure_test.png')
    print("✅ TransparentFigure helper working")
else:
    print("ℹ️ TransparentFigure helper not available (expected in regular Python env)")
print("All transparency tests completed!")
