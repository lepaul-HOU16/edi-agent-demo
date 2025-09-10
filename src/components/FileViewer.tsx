"use client"
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getUrl } from 'aws-amplify/storage';
import { CircularProgress } from '@mui/material';
import AceEditor from 'react-ace';
import { useViewport, calculateOptimalIframeDimensions, getFileTypeFromExtension } from '../hooks/useViewport';

import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/mode-yaml';
import 'ace-builds/src-noconflict/mode-html';
import 'ace-builds/src-noconflict/mode-text';
import 'ace-builds/src-noconflict/theme-github';

interface FileViewerProps {
  s3Key: string;
  onUrlChange?: (url: URL | undefined) => void;
  isEditMode?: boolean;
  onContentChange?: (content: string) => void;
  onContentTypeChange?: (contentType: string | null) => void;
  content?: string;
}

export default function FileViewer({
  s3Key,
  onUrlChange,
  isEditMode = false,
  onContentChange,
  onContentTypeChange,
  content
}: FileViewerProps) {
  const [selectedFileUrl, setSelectedFileUrl] = useState<URL>();
  const [loading, setLoading] = useState<boolean>(true);
  const [iframeLoading, setIframeLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileContentType, setFileContentType] = useState<string | null>(null);
  
  // Use viewport hook for responsive sizing
  const viewport = useViewport();
  
  // Create refs for iframes
  const nonTextIframeRef = useRef<HTMLIFrameElement>(null);
  const htmlIframeRef = useRef<HTMLIFrameElement>(null);
  
  // Function to resize iframe based on content
  const resizeIframeToContent = useCallback((iframe: HTMLIFrameElement | null) => {
    if (!iframe) return;
    
    try {
      // Try to access iframe content - this will work for same-origin iframes
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (iframeDoc) {
        // Set height based on the scroll height of the document body or documentElement
        const height = Math.max(
          iframeDoc.body?.scrollHeight || 0,
          iframeDoc.documentElement?.scrollHeight || 0
        );
        
        if (height > 0) {
          // Add 5 extra pixels to prevent scrollbars
          iframe.style.height = `${height + 5}px`;
        }
      }
    } catch (e) {
      // For cross-origin iframes, we can't access the content directly
      // Set a reasonable default height
      console.warn('Could not resize iframe (likely cross-origin):', e);
      iframe.style.height = '800px';
    }
  }, []);

  const fileExtension = s3Key.split('.').pop()?.toLowerCase() || 'text';
  const isHtmlFile = fileExtension === 'html';

  // Add event listener for messages from iframe - MUST be at top level, not conditional
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'resize') {
        const iframe = isHtmlFile ? htmlIframeRef.current : nonTextIframeRef.current;
        if (iframe && event.data.height) {
          // Add a small buffer to account for potential margins/padding
          // Increased by 5 extra pixels to prevent scrollbars
          const heightWithBuffer = event.data.height + 25;
          iframe.style.height = `${heightWithBuffer}px`;
        }
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isHtmlFile]);

  useEffect(() => {
    console.log('s3Key: ', s3Key);

    if (!s3Key) {
      setError('Invalid file path');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const s3KeyDecoded = s3Key.split('/').map((item: string) => decodeURIComponent(item)).join('/');
    console.log('getting file from s3 Key: ', s3KeyDecoded);

    // Check if this is an HTML file that needs special handling
    const isHtmlFile = s3Key.toLowerCase().endsWith('.html');
    if (isHtmlFile) {
      console.log('Loading HTML file with special handling');
    }

    getUrl({
      path: s3KeyDecoded,
    }).then(async (response: { url: URL }) => {
      setSelectedFileUrl(response.url);
      onUrlChange?.(response.url);

      try {
        // For HTML files, fetch content through our route handler
        if (isHtmlFile) {
          // Create a direct file URL that will use our route handler with proper content type
          const directFileUrl = `/file/${s3KeyDecoded}`;
          console.log('Using direct file URL for HTML file:', directFileUrl);
          setSelectedFileUrl(new URL(directFileUrl, window.location.origin));
          setFileContentType('text/html');
          onContentTypeChange?.('text/html');
          
          // Fetch the HTML content through our route handler
          try {
            const htmlResponse = await fetch(directFileUrl);
            if (htmlResponse.ok) {
              const htmlContent = await htmlResponse.text();
              setFileContent(htmlContent);
              if (!content) {
                onContentChange?.(htmlContent);
              }
            } else {
              console.error('Failed to fetch HTML content:', htmlResponse.status, htmlResponse.statusText);
              setError('Failed to load HTML file content');
            }
          } catch (htmlError) {
            console.error('Error fetching HTML content:', htmlError);
            setError('Failed to load HTML file content');
          }
          
          setLoading(false);
          return;
        }

        // Normal handling for other files
        const fileResponse = await fetch(response.url);
        const contentType = fileResponse.headers.get('Content-Type');
        setFileContentType(contentType)

        // Pass content type back to parent
        onContentTypeChange?.(contentType);

        const text = await fileResponse.text();
        setFileContent(text);

        // If content is not already set, set it for edit mode
        if (!content) {
          onContentChange?.(text);
        }
      } catch (error) {
        console.error('Error fetching file content:', error);
        setError('Failed to load file content. Please try again later.');
      }

      setLoading(false);
    }).catch((error) => {
      console.error('Error fetching file:', error);
      setError('Failed to load file. Please try again later.');
      setLoading(false);
    });
  }, [s3Key, onUrlChange]);

  if (loading) {
    return <div className="flex justify-center items-center h-full">Loading file...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-full text-red-500">{error}</div>;
  }

  if (!selectedFileUrl) {
    return <div className="flex justify-center items-center h-full">No file selected</div>;
  }

    // For HTML files, render differently based on edit mode
    if (isHtmlFile) {
        if (isEditMode) {
            return (
                <div className="relative w-full h-full flex flex-col">
                    <AceEditor
                        mode="html"
                        theme="github"
                        name="file-editor"
                        value={content || fileContent || ''}
                        onChange={onContentChange}
                        width="100%"
                        height="100%"
                        fontSize={14}
                        showPrintMargin={false}
                        showGutter={true}
                        highlightActiveLine={true}
                        setOptions={{
                            enableBasicAutocompletion: true,
                            enableLiveAutocompletion: true,
                            enableSnippets: true,
                            showLineNumbers: true,
                            tabSize: 2,
                        }}
                    />
                </div>
            );
        }

        // Use enhanced sizing for HTML files containing Plotly charts
        const htmlDimensions = calculateOptimalIframeDimensions(viewport, 'html');
        console.log('Rendering HTML file with viewport-aware sizing:', htmlDimensions);
        
        return (
            <div className="w-full relative html-iframe">
                {iframeLoading && (
                    <div className="iframe-loading">
                        <CircularProgress />
                    </div>
                )}
                <iframe
                    ref={htmlIframeRef}
                    src={`/file/${s3Key.split('/').map((item: string) => decodeURIComponent(item)).join('/')}`}
                    style={{
                        border: 'none',
                        margin: 0,
                        padding: 0,
                        width: '100%',
                        height: '600px', // Increased height for better Plotly display
                        minHeight: '600px',
                        overflow: 'visible' // Allow content to expand
                    }}
                    className="w-full plotly-iframe"
                    title="HTML File Viewer"
                    sandbox="allow-same-origin allow-scripts allow-forms allow-downloads"
                    onLoad={() => {
                        setIframeLoading(false);
                        console.log('HTML iframe loaded successfully');
                        
                        // Enhanced resizing for Plotly content
                        const iframe = htmlIframeRef.current;
                        if (iframe) {
                            try {
                                const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                                if (iframeDoc) {
                                    // Wait for Plotly to render
                                    setTimeout(() => {
                                        // Look for Plotly elements and ensure proper sizing
                                        const plotlyElements = iframeDoc.querySelectorAll('.js-plotly-plot, .plotly-graph-div');
                                        if (plotlyElements.length > 0) {
                                            console.log('Found Plotly elements, applying enhanced sizing');
                                            // Set a larger height for Plotly content
                                            iframe.style.height = '700px';
                                            iframe.style.minHeight = '700px';
                                        }
                                        resizeIframeToContent(iframe);
                                    }, 1000); // Give Plotly time to render
                                }
                            } catch (e) {
                                console.warn('Could not access iframe content for enhanced sizing:', e);
                                resizeIframeToContent(iframe);
                            }
                        }
                    }}
                />
            </div>
        );
    }

  // If we have text content for non-HTML files, display it
  if (
    fileContentType?.startsWith('text/') ||
    fileContentType === 'application/octet-stream' ||
    ['csv', 'xml', 'json', 'txt', 'md', 'html'].includes(fileExtension)
  ) {
    console.log('Rendering text content');

    // Determine the editor mode based on file extension
    let editorMode = 'text';
    if (fileExtension === 'js' || fileExtension === 'jsx' || fileExtension === 'ts' || fileExtension === 'tsx') {
      editorMode = 'javascript';
    } else if (fileExtension === 'json') {
      editorMode = 'json';
    } else if (fileExtension === 'yaml' || fileExtension === 'yml') {
      editorMode = 'yaml';
    }

    if (isEditMode) {
      return (
        <div className="relative w-full h-full flex flex-col">
          <AceEditor
            mode={editorMode}
            theme="github"
            name="file-editor"
            value={content || fileContent || ''}
            onChange={onContentChange}
            width="100%"
            height="100%"
            fontSize={14}
            showPrintMargin={false}
            showGutter={true}
            highlightActiveLine={true}
            setOptions={{
              enableBasicAutocompletion: true,
              enableLiveAutocompletion: true,
              enableSnippets: true,
              showLineNumbers: true,
              tabSize: 2,
            }}
          />
        </div>
      );
    }

    return (
      <div className="relative w-full h-full flex flex-col">
        <pre
          className="w-full h-full overflow-auto p-4 whitespace-pre font-mono text-sm"
          style={{
            // backgroundColor: '#f5f5f5',
            // border: '1px solid #e0e0e0',
            // borderRadius: '4px',
          }}
        >
          {fileContent}
        </pre>
      </div>
    );
  }

  // For non-text files, handle images differently from other content types
  const contentType = getFileTypeFromExtension(s3Key);
  
  // For images, use direct img tag instead of iframe to avoid scrolling
  if (contentType === 'image') {
    console.log('Rendering image with direct img tag for no-scroll display');
    
    return (
      <div className="w-full relative image-container">
        {iframeLoading && (
          <div className="iframe-loading">
            <CircularProgress />
          </div>
        )}
        <img
          src={selectedFileUrl?.toString()}
          alt="File content"
          className="w-full"
          style={{
            width: '100%',
            height: 'auto',
            maxWidth: '100%',
            display: 'block',
            borderRadius: '4px',
            background: '#f8f9fa'
          }}
          onLoad={() => {
            setIframeLoading(false);
            console.log('Image loaded successfully with auto height');
          }}
          onError={() => {
            setIframeLoading(false);
            setError('Failed to load image');
          }}
        />
      </div>
    );
  }

  // For non-image files, use iframe with viewport-aware sizing
  const dimensions = calculateOptimalIframeDimensions(viewport, contentType);
  
  // Get appropriate CSS classes for the content type
  const containerClass = contentType === 'pdf' ? 'pdf-iframe' : 'iframe-container';
  
  console.log('Rendering non-image file with viewport-aware sizing:', { contentType, dimensions });
  
  return (
    <div className={`w-full relative ${containerClass}`}>
      {iframeLoading && (
        <div className="iframe-loading">
          <CircularProgress />
        </div>
      )}
      <div 
        className="w-full"
        style={{
          overflow: 'hidden',
          position: 'relative',
          height: dimensions.height,
          maxHeight: dimensions.maxHeight,
        }}
      >
        <iframe
          ref={nonTextIframeRef}
          src={selectedFileUrl?.toString()}
          className="w-full"
          style={{
            border: 'none',
            margin: 0,
            padding: 0,
            width: dimensions.width,
            height: dimensions.height,
            maxWidth: dimensions.maxWidth,
            maxHeight: dimensions.maxHeight,
            overflow: 'hidden'
          }}
          title="File Viewer"
          onLoad={() => {
            setIframeLoading(false);
            console.log(`${contentType} iframe loaded successfully`);
            
            // Try to resize based on content for same-origin iframes
            resizeIframeToContent(nonTextIframeRef.current);
            
            // Apply content-specific optimizations
            const iframe = nonTextIframeRef.current;
            if (iframe && contentType === 'pdf') {
              // For PDFs, ensure minimum readable height
              const minPdfHeight = Math.max(
                parseInt(dimensions.height as string) || 600,
                viewport.isMobile ? 400 : 600
              );
              iframe.style.height = `${minPdfHeight}px`;
            }
          }}
        />
      </div>
    </div>
  );
}
