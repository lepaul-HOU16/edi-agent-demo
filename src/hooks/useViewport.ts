import { useState, useEffect } from 'react';

interface ViewportDimensions {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

export const useViewport = (): ViewportDimensions => {
  const [viewport, setViewport] = useState<ViewportDimensions>({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
    isMobile: false,
    isTablet: false,
    isDesktop: true,
  });

  useEffect(() => {
    const updateViewport = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setViewport({
        width,
        height,
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
      });
    };

    // Initial update
    updateViewport();

    // Add event listener
    window.addEventListener('resize', updateViewport);
    
    // Cleanup
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  return viewport;
};

interface ContentDimensions {
  width: string | number;
  height: string | number;
  maxWidth?: string | number;
  maxHeight?: string | number;
}

export const calculateOptimalIframeDimensions = (
  viewport: ViewportDimensions,
  contentType: 'html' | 'image' | 'pdf' | 'other',
  containerPadding = 32
): ContentDimensions => {
  const availableWidth = viewport.width - containerPadding;
  const availableHeight = viewport.height - containerPadding - 100; // Account for header/navigation

  switch (contentType) {
    case 'image':
      // For images, prioritize fitting within viewport while maintaining aspect ratio
      return {
        width: '100%',
        height: 'auto',
        maxWidth: `${availableWidth}px`,
        maxHeight: `${Math.min(availableHeight, viewport.height * 0.8)}px`,
      };
    
    case 'html':
      // For HTML, use responsive height with reasonable constraints
      const minHeight = viewport.isMobile ? 400 : 500;
      const maxHeight = Math.min(availableHeight, viewport.height * 0.9);
      
      return {
        width: '100%',
        height: `${Math.max(minHeight, maxHeight * 0.7)}px`,
        maxHeight: `${maxHeight}px`,
      };
    
    case 'pdf':
      // PDFs typically need more height
      return {
        width: '100%',
        height: `${Math.min(availableHeight * 0.9, 1000)}px`,
        maxHeight: `${availableHeight}px`,
      };
    
    default:
      // Default case for other content types
      return {
        width: '100%',
        height: `${Math.min(availableHeight * 0.8, 600)}px`,
        maxHeight: `${availableHeight}px`,
      };
  }
};

export const getFileTypeFromExtension = (filename: string): 'html' | 'image' | 'pdf' | 'other' => {
  const extension = filename.toLowerCase().split('.').pop() || '';
  
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp'].includes(extension)) {
    return 'image';
  }
  
  if (extension === 'html') {
    return 'html';
  }
  
  if (extension === 'pdf') {
    return 'pdf';
  }
  
  return 'other';
};
