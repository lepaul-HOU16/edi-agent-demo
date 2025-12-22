import React, { useState, useRef, useEffect, useCallback } from 'react';

interface ResizableSplitViewProps {
  topPanel: React.ReactNode;
  bottomPanel: React.ReactNode;
  onResize?: (topHeight: number, bottomHeight: number) => void;
  minTopHeight?: number; // percentage
  maxTopHeight?: number; // percentage
  defaultTopHeight?: number; // percentage
}

export const ResizableSplitView: React.FC<ResizableSplitViewProps> = ({
  topPanel,
  bottomPanel,
  onResize,
  minTopHeight = 20,
  maxTopHeight = 80,
  defaultTopHeight = 50,
}) => {
  const [topHeight, setTopHeight] = useState(defaultTopHeight);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number>(0);
  const dragStartHeight = useRef<number>(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartY.current = e.clientY;
    dragStartHeight.current = topHeight;
  }, [topHeight]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const containerHeight = containerRef.current.offsetHeight;
    const deltaY = e.clientY - dragStartY.current;
    const deltaPercent = (deltaY / containerHeight) * 100;
    
    let newTopHeight = dragStartHeight.current + deltaPercent;
    
    // Constrain between min and max
    newTopHeight = Math.max(minTopHeight, Math.min(maxTopHeight, newTopHeight));
    
    setTopHeight(newTopHeight);
  }, [isDragging, minTopHeight, maxTopHeight]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      
      // Trigger resize event for graph and map
      if (onResize && containerRef.current) {
        const containerHeight = containerRef.current.offsetHeight;
        const topPx = (topHeight / 100) * containerHeight;
        const bottomPx = containerHeight - topPx;
        onResize(topPx, bottomPx);
      }
    }
  }, [isDragging, topHeight, onResize]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      // Prevent text selection while dragging
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'ns-resize';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const bottomHeight = 100 - topHeight;

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top Panel */}
      <div
        style={{
          height: `${topHeight}%`,
          width: '100%',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {topPanel}
      </div>

      {/* Draggable Divider */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          height: '8px',
          width: '100%',
          cursor: 'ns-resize',
          backgroundColor: isDragging ? '#0972d3' : '#e9ebed',
          position: 'relative',
          flexShrink: 0,
          transition: isDragging ? 'none' : 'background-color 0.2s',
          zIndex: 10,
        }}
        className="resizable-divider"
      >
        {/* Visual grip indicator */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%) rotate(90deg)',
            width: '4px',
            height: '40px',
            borderRadius: '2px',
            backgroundColor: isDragging ? '#ffffff' : '#879596',
            transition: isDragging ? 'none' : 'background-color 0.2s',
          }}
        />
      </div>

      {/* Bottom Panel */}
      <div
        style={{
          height: `${bottomHeight}%`,
          width: '100%',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {bottomPanel}
      </div>
    </div>
  );
};
