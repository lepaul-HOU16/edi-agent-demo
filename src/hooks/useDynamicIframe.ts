import { useState, useEffect, useRef, useCallback } from 'react';

interface DynamicIframeOptions {
  minHeight?: number;
  maxHeight?: number;
  debounceMs?: number;
  contentPadding?: number;
}

interface DynamicIframeResult {
  iframeRef: React.RefObject<HTMLIFrameElement>;
  height: number;
  isLoading: boolean;
  error: string | null;
}

export const useDynamicIframe = (options: DynamicIframeOptions = {}): DynamicIframeResult => {
  const {
    minHeight = 200,
    maxHeight = window.innerHeight * 0.8,
    debounceMs = 150,
    contentPadding = 20
  } = options;

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(minHeight);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();

  const updateIframeHeight = useCallback(async () => {
    if (!iframeRef.current) return;

    try {
      const iframe = iframeRef.current;
      const iframeDocument = iframe.contentDocument || iframe.contentWindow?.document;

      if (!iframeDocument) {
        setError('Cannot access iframe content');
        return;
      }

      // Get the actual content height
      const body = iframeDocument.body;
      const html = iframeDocument.documentElement;

      if (!body || !html) {
        setError('Iframe content not ready');
        return;
      }

      // Check if content is a standalone SVG file or SVG-only content
      const svgElements = iframeDocument.querySelectorAll('svg');
      const bodyChildren = Array.from(body.children);
      
      // Only apply SVG fix if:
      // 1. The document root is an SVG, OR
      // 2. The body contains only SVG elements (no other significant content)
      const isStandaloneSvg = (
        html.tagName.toLowerCase() === 'svg' || 
        (svgElements.length > 0 && bodyChildren.length <= 2 && 
         bodyChildren.every(child => 
           child.tagName.toLowerCase() === 'svg' || 
           child.tagName.toLowerCase() === 'script' ||
           (child.textContent && child.textContent.trim().length < 50)
         ))
      );
      
      let newHeight;
      
      if (isStandaloneSvg) {
        // Only for standalone SVG files, use a generous fixed height
        newHeight = Math.max(1400, minHeight);
      } else {
        // For regular content, calculate height normally
        const heights = [
          body.scrollHeight,
          body.offsetHeight,
          html.clientHeight,
          html.scrollHeight,
          html.offsetHeight
        ];

        const scrollHeight = Math.max(...heights);
        newHeight = Math.max(minHeight, Math.min(maxHeight, scrollHeight + contentPadding));
      }

      setHeight(newHeight);
      setError(null);
      setIsLoading(false);

      // Inject CSS to prevent horizontal scrolling and improve responsiveness
      injectResponsiveCSS(iframeDocument);

    } catch (err) {
      console.warn('Error calculating iframe height:', err);
      setError('Error calculating content height');
      setIsLoading(false);
    }
  }, [minHeight, maxHeight, contentPadding]);

  const debouncedUpdate = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(updateIframeHeight, debounceMs);
  }, [updateIframeHeight, debounceMs]);

  const injectResponsiveCSS = (doc: Document) => {
    try {
      // Check if our CSS is already injected
      if (doc.getElementById('dynamic-iframe-styles')) return;

      const styleElement = doc.createElement('style');
      styleElement.id = 'dynamic-iframe-styles';
      styleElement.textContent = `
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0 !important;
          padding: 0 !important;
          overflow-x: hidden !important;
          overflow-y: hidden !important;
          word-wrap: break-word !important;
          max-width: 100% !important;
        }

        html {
          overflow-x: hidden !important;
          overflow-y: hidden !important;
          max-width: 100% !important;
        }

        /* Remove all possible scrollbars */
        * {
          overflow-x: hidden !important;
          scrollbar-width: none !important; /* Firefox */
          -ms-overflow-style: none !important; /* IE/Edge */
        }

        *::-webkit-scrollbar {
          display: none !important; /* Chrome/Safari */
        }

        /* Ensure all content fits within iframe width */
        * {
          max-width: 100% !important;
        }

        /* Handle tables responsively */
        table {
          width: 100% !important;
          table-layout: auto !important;
          border-collapse: collapse !important;
        }

        /* Handle images responsively */
        img {
          max-width: 100% !important;
          height: auto !important;
        }

        /* Handle pre/code blocks */
        pre, code {
          white-space: pre-wrap !important;
          word-wrap: break-word !important;
          overflow-wrap: break-word !important;
          max-width: 100% !important;
        }

        /* Handle long words/URLs */
        p, div, span {
          word-wrap: break-word !important;
          overflow-wrap: break-word !important;
        }

        /* Remove any fixed widths that might cause horizontal scroll */
        [style*="width"] {
          max-width: 100% !important;
        }

        /* Make all plot backgrounds transparent */
        svg, .plotly-graph-div, .plot-container {
          background: transparent !important;
          background-color: transparent !important;
        }

        /* Make plotly SVG backgrounds transparent */
        .main-svg, .svg-container, .bg {
          fill: transparent !important;
          background: transparent !important;
        }

        /* Target specific plotly background elements */
        g[class*="bg"], rect[class*="bg"],
        .draglayer .bg, .plot .bg,
        rect[fill="white"], rect[fill="#ffffff"] {
          fill: transparent !important;
        }

        /* General transparent backgrounds for charts */
        .chart, .graph, .plot, .visualization {
          background: transparent !important;
          background-color: transparent !important;
        }
      `;

      doc.head?.appendChild(styleElement);
    } catch (err) {
      console.warn('Failed to inject responsive CSS:', err);
    }
  };

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      // Simple timing for height calculation
      setTimeout(updateIframeHeight, 500); // Single reasonable delay
    };

    iframe.addEventListener('load', handleLoad);

    return () => {
      iframe.removeEventListener('load', handleLoad);
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [updateIframeHeight]);

  return {
    iframeRef,
    height,
    isLoading,
    error
  };
};

export default useDynamicIframe;
