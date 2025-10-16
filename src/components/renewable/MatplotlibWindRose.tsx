/**
 * MatplotlibWindRose Component
 * Runs actual matplotlib Python code in the browser using Pyodide (WebAssembly)
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Box, Spinner } from '@cloudscape-design/components';

interface WindRoseData {
  direction: string;
  angle: number;
  frequency: number;
  avg_speed: number;
  max_speed: number;
}

interface MatplotlibWindRoseProps {
  windRoseData: WindRoseData[];
  projectId: string;
}

const MatplotlibWindRose: React.FC<MatplotlibWindRoseProps> = ({ windRoseData, projectId }) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadPyodideScript = () => {
      return new Promise((resolve, reject) => {
        if ((window as any).loadPyodide) {
          resolve((window as any).loadPyodide);
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js';
        script.onload = () => resolve((window as any).loadPyodide);
        script.onerror = reject;
        document.head.appendChild(script);
      });
    };

    const generateWindRose = async () => {
      try {
        setLoading(true);
        setError(null);

        // Set a timeout to show error if loading takes too long
        const timeout = setTimeout(() => {
          if (mounted) {
            setError('Pyodide is taking longer than expected to load. This may be due to a slow connection. Please refresh the page to try again.');
            setLoading(false);
          }
        }, 60000); // 60 second timeout

        // Load Pyodide script first
        await loadPyodideScript();
        
        clearTimeout(timeout);

        // Load Pyodide (Python in WebAssembly)
        const pyodide = await (window as any).loadPyodide({
          indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/'
        });

        // Install matplotlib
        await pyodide.loadPackage(['matplotlib', 'numpy']);

        // Prepare data for Python
        const directions = windRoseData.map(d => d.angle);
        const frequencies = windRoseData.map(d => d.frequency);
        const speeds = windRoseData.map(d => d.avg_speed);

        // Python code using actual matplotlib
        const pythonCode = `
import matplotlib.pyplot as plt
import numpy as np
from io import BytesIO
import base64

# Data from JavaScript
directions = ${JSON.stringify(directions)}
frequencies = ${JSON.stringify(frequencies)}
speeds = ${JSON.stringify(speeds)}

# Create wind rose using matplotlib
fig = plt.figure(figsize=(10, 10))
ax = fig.add_subplot(111, projection='polar')

# Convert to radians
theta = np.radians(directions)

# Create bars
bars = ax.bar(theta, frequencies, width=np.radians(22.5), bottom=0.0)

# Color bars by wind speed
colors = plt.cm.viridis(np.array(speeds) / max(speeds))
for bar, color in zip(bars, colors):
    bar.set_facecolor(color)
    bar.set_alpha(0.8)

# Formatting
ax.set_theta_zero_location('N')
ax.set_theta_direction(-1)
ax.set_title('Wind Rose - ${projectId}', pad=20, fontsize=14, fontweight='bold')
ax.set_xlabel('Frequency (%)', fontsize=10)

# Add legend
sm = plt.cm.ScalarMappable(cmap=plt.cm.viridis, norm=plt.Normalize(vmin=min(speeds), vmax=max(speeds)))
sm.set_array([])
cbar = plt.colorbar(sm, ax=ax, pad=0.1)
cbar.set_label('Wind Speed (m/s)', rotation=270, labelpad=20)

# Convert to base64 image
buf = BytesIO()
plt.savefig(buf, format='png', dpi=150, bbox_inches='tight', facecolor='white')
buf.seek(0)
img_base64 = base64.b64encode(buf.read()).decode('utf-8')
plt.close()

img_base64
`;

        // Run Python code
        const imageBase64 = await pyodide.runPythonAsync(pythonCode);

        if (mounted && canvasRef.current) {
          // Clear any existing content first
          while (canvasRef.current.firstChild) {
            canvasRef.current.removeChild(canvasRef.current.firstChild);
          }
          
          // Display the matplotlib-generated image
          const img = document.createElement('img');
          img.src = `data:image/png;base64,${imageBase64}`;
          img.style.width = '100%';
          img.style.height = 'auto';
          canvasRef.current.appendChild(img);
          setLoading(false);
        }

      } catch (err) {
        console.error('Error generating wind rose with matplotlib:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to generate wind rose');
          setLoading(false);
        }
      }
    };

    generateWindRose();

    return () => {
      mounted = false;
    };
  }, [windRoseData, projectId]);

  if (loading) {
    return (
      <Box textAlign="center" padding="xl">
        <Spinner size="large" />
        <Box variant="p" padding={{ top: 's' }}>
          Loading matplotlib (Python WebAssembly)...
        </Box>
        <Box variant="small" color="text-body-secondary" padding={{ top: 'xs' }}>
          First load may take 10-20 seconds to download Python + matplotlib (~30MB)
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box textAlign="center" padding="xl" color="text-status-error">
        <Box variant="p">Error: {error}</Box>
      </Box>
    );
  }

  return (
    <div 
      ref={canvasRef} 
      style={{ 
        width: '100%', 
        minHeight: '500px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    />
  );
};

export default MatplotlibWindRose;
