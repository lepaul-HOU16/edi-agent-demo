/**
 * Artifact Component Template
 * 
 * This template provides a starting point for creating React components
 * that render agent artifacts in the chat interface.
 */

import React, { useState, useEffect } from 'react';
import { Box, Container, Alert, SpaceBetween, Button } from '@cloudscape-design/components';

interface YourArtifactProps {
  artifact: {
    type: string;
    data: {
      messageContentType: string;
      title: string;
      content?: any;
      s3Key?: string;
      bucket?: string;
      metadata?: Record<string, any>;
    };
  };
}

/**
 * YourArtifact - Component for rendering [artifact type]
 * 
 * Displays [description of what this component shows]
 */
export const YourArtifact: React.FC<YourArtifactProps> = ({ artifact }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    loadArtifactData();
  }, [artifact]);

  /**
   * Load artifact data (from S3 if needed)
   */
  const loadArtifactData = async () => {
    try {
      setLoading(true);
      setError(null);

      // If data is embedded in artifact
      if (artifact.data.content) {
        setData(artifact.data.content);
        setLoading(false);
        return;
      }

      // If data needs to be fetched from S3
      if (artifact.data.s3Key && artifact.data.bucket) {
        const fetchedData = await fetchFromS3(
          artifact.data.bucket,
          artifact.data.s3Key
        );
        setData(fetchedData);
      } else {
        throw new Error('No data source available');
      }

      setLoading(false);
    } catch (err: any) {
      console.error('Error loading artifact data:', err);
      setError(err.message || 'Failed to load artifact data');
      setLoading(false);
    }
  };

  /**
   * Fetch data from S3
   */
  const fetchFromS3 = async (bucket: string, key: string): Promise<any> => {
    // Implement S3 fetch logic
    // This might involve calling an API endpoint that has S3 access
    const response = await fetch(`/api/artifacts/${bucket}/${key}`);
    if (!response.ok) {
      throw new Error('Failed to fetch artifact from S3');
    }
    return await response.json();
  };

  /**
   * Export artifact data
   */
  const handleExport = () => {
    if (!data) return;

    // Export as JSON
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${artifact.data.title.replace(/\s+/g, '-')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  /**
   * Render loading state
   */
  if (loading) {
    return (
      <Box padding="l" textAlign="center">
        <div className="loading-spinner">Loading artifact...</div>
      </Box>
    );
  }

  /**
   * Render error state
   */
  if (error) {
    return (
      <Alert type="error" header="Error Loading Artifact">
        {error}
        <Button onClick={loadArtifactData}>Retry</Button>
      </Alert>
    );
  }

  /**
   * Render empty state
   */
  if (!data) {
    return (
      <Alert type="info" header="No Data Available">
        This artifact does not contain any data to display.
      </Alert>
    );
  }

  /**
   * Main render
   */
  return (
    <Container
      header={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>{artifact.data.title}</h3>
          <Button onClick={handleExport} iconName="download">
            Export
          </Button>
        </div>
      }
    >
      <SpaceBetween size="l">
        {/* Metadata Section */}
        {artifact.data.metadata && (
          <Box>
            <h4>Metadata</h4>
            <div className="metadata-grid">
              {Object.entries(artifact.data.metadata).map(([key, value]) => (
                <div key={key} className="metadata-item">
                  <strong>{formatKey(key)}:</strong> {formatValue(value)}
                </div>
              ))}
            </div>
          </Box>
        )}

        {/* Main Content Section */}
        <Box>
          <h4>Results</h4>
          {renderContent(data)}
        </Box>

        {/* Visualization Section (if applicable) */}
        {data.visualization && (
          <Box>
            <h4>Visualization</h4>
            {renderVisualization(data.visualization)}
          </Box>
        )}

        {/* Statistics Section (if applicable) */}
        {data.statistics && (
          <Box>
            <h4>Statistics</h4>
            {renderStatistics(data.statistics)}
          </Box>
        )}
      </SpaceBetween>
    </Container>
  );
};

/**
 * Render main content based on data type
 */
const renderContent = (data: any): React.ReactNode => {
  // Handle different data types
  if (typeof data === 'string') {
    return <pre>{data}</pre>;
  }

  if (Array.isArray(data)) {
    return (
      <div className="data-table">
        <table>
          <thead>
            <tr>
              {Object.keys(data[0] || {}).map(key => (
                <th key={key}>{formatKey(key)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx}>
                {Object.values(row).map((value, vidx) => (
                  <td key={vidx}>{formatValue(value)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (typeof data === 'object') {
    return (
      <div className="data-object">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="data-row">
            <strong>{formatKey(key)}:</strong> {formatValue(value)}
          </div>
        ))}
      </div>
    );
  }

  return <div>{String(data)}</div>;
};

/**
 * Render visualization (chart, map, etc.)
 */
const renderVisualization = (visualization: any): React.ReactNode => {
  // Handle different visualization types
  
  // HTML visualization
  if (typeof visualization === 'string' && visualization.includes('<')) {
    return (
      <div 
        dangerouslySetInnerHTML={{ __html: visualization }}
        className="visualization-container"
      />
    );
  }

  // Chart data (use Plotly, Chart.js, etc.)
  if (visualization.type === 'chart') {
    // Import and use your charting library
    // Example with Plotly:
    // return <Plot data={visualization.data} layout={visualization.layout} />;
    return <div>Chart visualization (implement with your charting library)</div>;
  }

  // Map data (use Leaflet, Mapbox, etc.)
  if (visualization.type === 'map') {
    // Import and use your mapping library
    return <div>Map visualization (implement with your mapping library)</div>;
  }

  return <div>Unsupported visualization type</div>;
};

/**
 * Render statistics table
 */
const renderStatistics = (statistics: Record<string, any>): React.ReactNode => {
  return (
    <div className="statistics-grid">
      {Object.entries(statistics).map(([key, value]) => (
        <div key={key} className="stat-card">
          <div className="stat-label">{formatKey(key)}</div>
          <div className="stat-value">{formatValue(value)}</div>
        </div>
      ))}
    </div>
  );
};

/**
 * Format object key for display
 */
const formatKey = (key: string): string => {
  return key
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
};

/**
 * Format value for display
 */
const formatValue = (value: any): string => {
  if (value === null || value === undefined) {
    return 'N/A';
  }

  if (typeof value === 'number') {
    // Format numbers with appropriate precision
    if (Number.isInteger(value)) {
      return value.toLocaleString();
    }
    return value.toFixed(2);
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }

  return String(value);
};

/**
 * CSS Styles (add to your global CSS or styled-components)
 */
const styles = `
.metadata-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 4px;
}

.metadata-item {
  padding: 0.5rem;
}

.data-table {
  overflow-x: auto;
}

.data-table table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.data-table th {
  background: #f5f5f5;
  font-weight: bold;
}

.data-object {
  padding: 1rem;
  background: #f9f9f9;
  border-radius: 4px;
}

.data-row {
  padding: 0.5rem 0;
  border-bottom: 1px solid #eee;
}

.data-row:last-child {
  border-bottom: none;
}

.visualization-container {
  width: 100%;
  min-height: 400px;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 1rem;
}

.statistics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.stat-card {
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 4px;
  text-align: center;
}

.stat-label {
  font-size: 0.875rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
}

.loading-spinner {
  padding: 2rem;
  text-align: center;
  color: #666;
}
`;

export default YourArtifact;
