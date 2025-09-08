"use client"
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getUrl } from 'aws-amplify/storage';
import { CircularProgress } from '@mui/material';
import AceEditor from 'react-ace';

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

    // Use direct iframe loading for HTML files - this resolves blank content issues
    console.log('Rendering HTML file with direct URL loading');
    return (
      <div className="w-full relative">
        {iframeLoading && (
          <div className="absolute inset-0 flex justify-center items-center bg-white bg-opacity-75 z-10">
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
            minHeight: '600px',
            height: '100vh',
            overflow: 'auto'
          }}
          className="w-full"
          title="HTML File Viewer"
          sandbox="allow-same-origin allow-scripts allow-forms allow-downloads"
          onLoad={() => {
            setIframeLoading(false);
            console.log('HTML iframe loaded successfully');
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

  // For non-text files, we still need to use an iframe
  
  // Add event listener for messages from iframe
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
  
  // For non-HTML files, create a wrapper with CSS to ensure content fits
  return (
    <div className="w-full relative">
      {iframeLoading && (
        <div className="absolute inset-0 flex justify-center items-center bg-white bg-opacity-75 z-10">
          <CircularProgress />
        </div>
      )}
      <div 
        className="w-full"
        style={{
          overflow: 'hidden',
          position: 'relative'
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
            width: '100%',
            height: '500px', // Initial height
            overflow: 'hidden', // Hide scrollbars to prevent scrolling
            transform: 'scale(1)', // Initial scale
            transformOrigin: 'top left',
            background: 'transparent' // Make iframe background transparent
          }}
          title="File Viewer"
          onLoad={() => {
            setIframeLoading(false);
            // For non-HTML files loaded via URL, we can try to resize but it may not work for cross-origin content
            resizeIframeToContent(nonTextIframeRef.current);
            
            // Try to add a load event listener to handle cross-origin iframe content
            try {
              const iframe = nonTextIframeRef.current;
              if (iframe) {
                // For PDF files, set a taller default height
                if (s3Key.toLowerCase().endsWith('.pdf')) {
                  iframe.style.height = '1200px';
                }
                
                // For image files, try to scale to fit
                if (/\.(jpg|jpeg|png|gif|svg|webp)$/i.test(s3Key)) {
                  iframe.style.width = '100%';
                  iframe.style.height = 'auto';
                  iframe.style.maxHeight = '90vh';
                }
              }
            } catch (e) {
              console.warn('Error handling iframe content:', e);
            }
          }}
        />
      </div>
    </div>
  );
}
