/**
 * VisualizationRenderer - Automatic rendering component for renewable energy visualizations
 * 
 * Handles display of charts, interactive maps, and reports with proper error handling
 * and responsive design.
 */

import React, { useState, useEffect } from 'react';
import { Box, Button, Spinner, ButtonDropdown } from '@cloudscape-design/components';
import FullScreenVisualizationModal from './FullScreenVisualizationModal';
import VisualizationExporter from '@/utils/VisualizationExporter';

export interface VisualizationRendererProps {
  imageUrl?: string;
  htmlContent?: string;
  title: string;
  description?: string;
  category: 'chart' | 'map' | 'report';
  fallbackContent?: React.ReactNode;
  height?: string;
  className?: string;
  enableFullScreen?: boolean;
  enableExport?: boolean;
}

export const VisualizationRenderer: React.FC<VisualizationRendererProps> = ({
  imageUrl,
  htmlContent,
  title,
  description,
  category,
  fallbackContent,
  height = '600px',
  className = '',
  enableFullScreen = true,
  enableExport = true
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isFullScreenOpen, setIsFullScreenOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleImageLoad = () => {
    setLoading(false);
    setError(null);
  };

  const handleImageError = () => {
    setLoading(false);
    setError('Failed to load visualization');
  };

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    setRetryCount(prev => prev + 1);
  };

  // Export functionality
  const handleExport = async (format: string) => {
    if (!VisualizationExporter.isExportSupported()) {
      alert('Export is not supported in your browser. Please try a different browser.');
      return;
    }

    setIsExporting(true);
    try {
      const filename = VisualizationExporter.generateFilename(title, category);
      
      if (category === 'chart' && imageUrl) {
        if (format === 'high-res') {
          const highResUrl = VisualizationExporter.getHighResolutionUrl(imageUrl, 2);
          await VisualizationExporter.exportImage(highResUrl, { filename, format: 'png' });
        } else {
          await VisualizationExporter.exportImage(imageUrl, { filename, format: format as any });
        }
      } else if (category === 'map' && htmlContent) {
        if (format === 'html') {
          VisualizationExporter.exportHTML(htmlContent, filename);
        } else if (format === 'pdf') {
          await VisualizationExporter.exportHTMLAsPDF(htmlContent, filename);
        }
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Get export options based on category
  const getExportOptions = () => {
    const exportType = category === 'chart' ? 'image' : category;
    const formats = VisualizationExporter.getAvailableFormats(exportType as 'image' | 'map' | 'report');
    const options = formats.map(format => ({
      id: format,
      text: format.toUpperCase(),
      description: `Export as ${format.toUpperCase()}`
    }));

    // Add high-resolution option for charts
    if (category === 'chart') {
      options.push({
        id: 'high-res',
        text: 'High Resolution PNG',
        description: 'Export as high-resolution PNG (2x scale)'
      });
    }

    return options;
  };

  // Reset loading state when URL changes
  useEffect(() => {
    if (imageUrl) {
      setLoading(true);
      setError(null);
    }
  }, [imageUrl, retryCount]);

  // Interactive Map Rendering
  if (category === 'map' && htmlContent) {
    return (
      <>
        <div className={`visualization-container ${className}`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <Box variant="awsui-key-label">
              {title}
            </Box>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {enableExport && (
                <ButtonDropdown
                  variant="icon"
                  items={getExportOptions()}
                  onItemClick={({ detail }) => handleExport(detail.id)}
                  loading={isExporting}
                  ariaLabel="Export visualization"
                >
                  <Button variant="icon" iconName="download" />
                </ButtonDropdown>
              )}
              {enableFullScreen && (
                <Button
                  variant="icon"
                  iconName="expand"
                  onClick={() => setIsFullScreenOpen(true)}
                  ariaLabel="View in full screen"
                />
              )}
            </div>
          </div>
          {description && (
            <Box variant="small" color="text-body-secondary" margin={{ bottom: 's' }}>
              {description}
            </Box>
          )}
          <div
            style={{
              width: '100%',
              height: height,
              border: '1px solid #e9ebed',
              borderRadius: '8px',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <iframe
              srcDoc={htmlContent}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
              }}
              title={title}
              sandbox="allow-scripts allow-same-origin allow-popups"
              loading="lazy"
            />
          </div>
        </div>
        
        {enableFullScreen && (
          <FullScreenVisualizationModal
            isOpen={isFullScreenOpen}
            onClose={() => setIsFullScreenOpen(false)}
            title={title}
            visualizationType="html"
            content={htmlContent}
            description={description}
          />
        )}
      </>
    );
  }

  // Chart/Image Rendering
  if (category === 'chart' && imageUrl) {
    return (
      <>
        <div className={`visualization-container ${className}`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <Box variant="awsui-key-label">
              {title}
            </Box>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {enableExport && !loading && !error && (
                <ButtonDropdown
                  variant="icon"
                  items={getExportOptions()}
                  onItemClick={({ detail }) => handleExport(detail.id)}
                  loading={isExporting}
                  ariaLabel="Export visualization"
                >
                  <Button variant="icon" iconName="download" />
                </ButtonDropdown>
              )}
              {enableFullScreen && !loading && !error && (
                <Button
                  variant="icon"
                  iconName="expand"
                  onClick={() => setIsFullScreenOpen(true)}
                  ariaLabel="View in full screen"
                />
              )}
            </div>
          </div>
          {description && (
            <Box variant="small" color="text-body-secondary" margin={{ bottom: 's' }}>
              {description}
            </Box>
          )}
          <div
            style={{
              width: '100%',
              border: '1px solid #e9ebed',
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: '#fff',
              padding: '16px',
              textAlign: 'center',
              position: 'relative',
              minHeight: '200px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
          {loading && !error && (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              gap: '12px',
              color: '#666' 
            }}>
              <Spinner size="normal" />
              <div>Loading {title.toLowerCase()}...</div>
            </div>
          )}
          
          {error && (
            <div style={{ 
              padding: '40px', 
              color: '#d13212',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px'
            }}>
              <div>⚠️ {error}</div>
              <div style={{ fontSize: '14px', color: '#666' }}>
                Unable to load {title.toLowerCase()}
              </div>
              <Button
                variant="primary"
                onClick={handleRetry}
              >
                Retry
              </Button>
              {fallbackContent && (
                <div style={{ marginTop: '16px', borderTop: '1px solid #e9ebed', paddingTop: '16px' }}>
                  {fallbackContent}
                </div>
              )}
            </div>
          )}
          
          <img
            src={`${imageUrl}${retryCount > 0 ? `?retry=${retryCount}` : ''}`}
            alt={title}
            style={{
              maxWidth: '100%',
              height: 'auto',
              display: loading || error ? 'none' : 'block',
            }}
            onLoad={handleImageLoad}
            onError={handleImageError}
            loading="lazy"
          />
        </div>
        </div>
        
        {enableFullScreen && !loading && !error && (
          <FullScreenVisualizationModal
            isOpen={isFullScreenOpen}
            onClose={() => setIsFullScreenOpen(false)}
            title={title}
            visualizationType="image"
            content={imageUrl}
            description={description}
          />
        )}
      </>
    );
  }

  // Report/Download Rendering
  if (category === 'report' && imageUrl) {
    return (
      <div className={`visualization-container ${className}`}>
        <Box variant="awsui-key-label" margin={{ bottom: 'xs' }}>
          {title}
        </Box>
        {description && (
          <Box variant="small" color="text-body-secondary" margin={{ bottom: 's' }}>
            {description}
          </Box>
        )}
        <div style={{ 
          padding: '16px',
          border: '1px solid #e9ebed',
          borderRadius: '8px',
          backgroundColor: '#f9f9f9',
          textAlign: 'center'
        }}>
          <div style={{ marginBottom: '12px', color: '#666' }}>
            📄 Report ready for download
          </div>
          <Button
            variant="primary"
            iconName="download"
            onClick={() => {
              try {
                window.open(imageUrl, '_blank', 'noopener,noreferrer');
              } catch (error) {
                console.error('Failed to open report:', error);
              }
            }}
          >
            Download {title}
          </Button>
        </div>
      </div>
    );
  }

  // Fallback rendering
  if (fallbackContent) {
    return (
      <div className={`visualization-container ${className}`}>
        <Box variant="awsui-key-label" margin={{ bottom: 'xs' }}>
          {title}
        </Box>
        {description && (
          <Box variant="small" color="text-body-secondary" margin={{ bottom: 's' }}>
            {description}
          </Box>
        )}
        <div style={{
          border: '1px solid #e9ebed',
          borderRadius: '8px',
          padding: '16px',
          backgroundColor: '#f9f9f9'
        }}>
          {fallbackContent}
        </div>
      </div>
    );
  }

  // No content available
  return (
    <div className={`visualization-container ${className}`}>
      <Box variant="awsui-key-label" margin={{ bottom: 'xs' }}>
        {title}
      </Box>
      {description && (
        <Box variant="small" color="text-body-secondary" margin={{ bottom: 's' }}>
          {description}
        </Box>
      )}
      <div style={{
        border: '1px solid #e9ebed',
        borderRadius: '8px',
        padding: '40px',
        textAlign: 'center',
        color: '#666',
        backgroundColor: '#fafafa'
      }}>
        <div>📊 Visualization Not Available</div>
        <div style={{ fontSize: '14px', marginTop: '8px' }}>
          {category === 'chart' ? 'Chart data not provided' : 
           category === 'map' ? 'Map content not available' : 
           'Report not generated'}
        </div>
      </div>
    </div>
  );
};

export default VisualizationRenderer;