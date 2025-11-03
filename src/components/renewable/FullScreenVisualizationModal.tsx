/**
 * FullScreenVisualizationModal Component
 * 
 * Provides full-screen viewing mode for renewable energy visualizations
 * with zoom, pan, and enhanced interaction capabilities.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Modal, Box, Button, SpaceBetween, Header, Icon } from '@cloudscape-design/components';

interface FullScreenVisualizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  visualizationType: 'image' | 'html' | 'iframe';
  content: string;
  description?: string;
}

export const FullScreenVisualizationModal: React.FC<FullScreenVisualizationModalProps> = ({
  isOpen,
  onClose,
  title,
  visualizationType,
  content,
  description
}) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const contentRef = useRef<HTMLDivElement>(null);

  // Reset zoom and pan when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setZoomLevel(1);
      setPanPosition({ x: 0, y: 0 });
      setIsZoomed(false);
    }
  }, [isOpen]);

  // Handle zoom in
  const handleZoomIn = () => {
    const newZoom = Math.min(zoomLevel * 1.2, 3);
    setZoomLevel(newZoom);
    setIsZoomed(newZoom > 1);
  };

  // Handle zoom out
  const handleZoomOut = () => {
    const newZoom = Math.max(zoomLevel / 1.2, 0.5);
    setZoomLevel(newZoom);
    setIsZoomed(newZoom > 1);
  };

  // Reset zoom and pan
  const handleResetView = () => {
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
    setIsZoomed(false);
  };

  // Handle mouse down for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isZoomed) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - panPosition.x,
        y: e.clientY - panPosition.y
      });
    }
  };

  // Handle mouse move for dragging
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && isZoomed) {
      setPanPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  // Handle mouse up to stop dragging
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.min(Math.max(zoomLevel * delta, 0.5), 3);
    setZoomLevel(newZoom);
    setIsZoomed(newZoom > 1);
  };

  // Render content based on type
  const renderContent = () => {
    const transform = `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoomLevel})`;
    const cursor = isZoomed ? (isDragging ? 'grabbing' : 'grab') : 'default';

    switch (visualizationType) {
      case 'image':
        return (
          <div
            ref={contentRef}
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              overflow: 'hidden',
              cursor
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
          >
            <img
              src={content}
              alt={title}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                transform,
                transformOrigin: 'center center',
                transition: isDragging ? 'none' : 'transform 0.2s ease',
                userSelect: 'none',
                pointerEvents: 'none'
              }}
            />
          </div>
        );

      case 'html':
        return (
          <div
            ref={contentRef}
            style={{
              width: '100%',
              height: '100%',
              overflow: 'hidden',
              cursor
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
          >
            <div
              style={{
                transform,
                transformOrigin: 'center center',
                transition: isDragging ? 'none' : 'transform 0.2s ease',
                width: '100%',
                height: '100%'
              }}
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </div>
        );

      case 'iframe':
        return (
          <div
            ref={contentRef}
            style={{
              width: '100%',
              height: '100%',
              overflow: 'hidden',
              cursor
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
          >
            <iframe
              src={content}
              title={title}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                transform,
                transformOrigin: 'center center',
                transition: isDragging ? 'none' : 'transform 0.2s ease'
              }}
            />
          </div>
        );

      default:
        return <div>Unsupported visualization type</div>;
    }
  };

  return (
    <Modal
      visible={isOpen}
      onDismiss={onClose}
      size="max"
      header={
        <Header
          variant="h2"
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                iconName="zoom-in"
                variant="icon"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 3}
                ariaLabel="Zoom in"
              />
              <Button
                iconName="zoom-out"
                variant="icon"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 0.5}
                ariaLabel="Zoom out"
              />
              <Button
                iconName="refresh"
                variant="icon"
                onClick={handleResetView}
                ariaLabel="Reset view"
              />
              <Button
                iconName="close"
                variant="icon"
                onClick={onClose}
                ariaLabel="Close full screen"
              />
            </SpaceBetween>
          }
        >
          {title}
        </Header>
      }
    >
      <Box>
        <div style={{ height: '80vh', position: 'relative' }}>
          {renderContent()}
          
          {/* Zoom level indicator */}
          {isZoomed && (
            <div
              style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                background: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                zIndex: 1000
              }}
            >
              {Math.round(zoomLevel * 100)}%
            </div>
          )}

          {/* Instructions overlay */}
          {isZoomed && (
            <div
              style={{
                position: 'absolute',
                bottom: '10px',
                left: '10px',
                background: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                zIndex: 1000
              }}
            >
              Drag to pan • Scroll to zoom
            </div>
          )}
        </div>

        {description && (
          <Box padding={{ top: 's' }}>
            <div style={{ fontSize: '14px', color: '#666' }}>
              {description}
            </div>
          </Box>
        )}
      </Box>
    </Modal>
  );
};

export default FullScreenVisualizationModal;