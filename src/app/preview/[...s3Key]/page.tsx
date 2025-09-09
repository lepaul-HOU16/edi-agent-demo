"use client"

import React, { useState, useEffect, useRef } from 'react';
import { uploadData } from 'aws-amplify/storage';
import FileViewer from '@/components/FileViewer';
import { Button, Typography, Box, Paper, Stack, Snackbar, Alert } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import PrintIcon from '@mui/icons-material/Print';
import Head from 'next/head';

interface PageProps {
  params: {
    s3Key: string[];
  };
}

export default function FilePage({ params }: PageProps) {
  const s3Key = params.s3Key.join('/');
  const s3KeyDecoded = s3Key.split('/').map((item: string) => decodeURIComponent(item)).join('/');
  const [fileUrl, setFileUrl] = useState<URL>();
  const [isEditMode, setIsEditMode] = useState(false);
  const [fileContent, setFileContent] = useState<string>('');
  const [contentType, setContentType] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });
  const isPdfYaml = s3Key.endsWith('.pdf.yaml');
  const pdfS3Key = isPdfYaml ? s3Key.replace('.yaml', '') : '';
  const fileViewerRef = useRef<HTMLDivElement>(null);

  const isEditableFile = () => {
    const editableTextTypes = [
      'text/plain', 
      'text/html', 
      'application/json', 
      'text/markdown', 
      'application/x-yaml'
    ];
    
    const editableExtensions = [
      'txt', 'md', 'json', 'yaml', 'yml', 'html'
    ];

    const fileExtension = s3Key.split('.').pop()?.toLowerCase();
    
    return (
      (contentType && editableTextTypes.some(type => contentType.startsWith(type))) || 
      (fileExtension && editableExtensions.includes(fileExtension))
    );
  };

  const handleSave = async () => {
    try {
      const blob = new Blob([fileContent], { 
        type: contentType || 'text/plain'
      });

      console.log('Uploading file to s3 key: ', s3KeyDecoded)
      
      await uploadData({
        path: s3KeyDecoded,
        data: blob,
        options: {
          contentType: contentType || 'text/plain'
        }
      }).result;

      setSaveStatus({
        open: true,
        message: 'File saved successfully',
        severity: 'success'
      });

      setIsEditMode(false);
    } catch (error) {
      console.error('File upload error:', error);
      setSaveStatus({
        open: true,
        message: 'Failed to save file',
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSaveStatus(prev => ({ ...prev, open: false }));
  };

  // Add print-specific CSS to ensure plots are properly sized and not clipped
  const printStyles = `
    @media print {
      /* Reset all elements to ensure proper printing */
      * {
        box-sizing: border-box !important;
        max-height: none !important;
        overflow: visible !important;
      }
      
      /* Ensure the content takes up the full page */
      body, html {
        height: auto !important;
        width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: visible !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      /* Hide UI elements not needed for printing */
      header, nav, button, .MuiPaper-root, .MuiSnackbar-root, .MuiAppBar-root {
        display: none !important;
      }
      
      /* Make sure the content area takes full width and height */
      #print-content {
        display: block !important;
        width: 100% !important;
        height: auto !important;
        overflow: visible !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      
      /* Ensure images and plots fit within the page */
      img, svg, canvas {
        max-width: 100% !important;
        width: 650px !important; /* Fixed width to prevent overflow */
        height: auto !important;
        display: block !important;
        margin: 0 auto !important;
        page-break-inside: avoid !important;
      }
      
      /* Give iframes a fixed width and height to ensure content is visible */
      iframe {
        max-width: 100% !important;
        width: 650px !important; /* Fixed width to prevent overflow */
        min-width: 650px !important;
        min-height: 800px !important;
        height: 800px !important;
        display: block !important;
        margin: 0 auto !important;
        page-break-inside: avoid !important;
        border: none !important;
      }
      
      /* Specific styling for plots - NO TRANSFORM SCALING */
      .plot-container, .plotly, .js-plotly-plot, .plot-container--plotly {
        width: 650px !important; /* Fixed width to prevent overflow */
        max-width: 100% !important;
        height: auto !important;
        max-height: none !important;
        margin: 0 auto !important;
        page-break-inside: avoid !important;
        page-break-before: auto !important;
        page-break-after: auto !important;
        display: block !important;
        position: relative !important;
        overflow-x: hidden !important; /* Prevent horizontal overflow */
      }
      
      /* Ensure SVG plots render correctly */
      svg, svg.main-svg {
        width: 650px !important; /* Fixed width to prevent overflow */
        max-width: 100% !important;
        height: auto !important;
        max-height: none !important;
        display: block !important;
        page-break-inside: avoid !important;
        overflow-y: visible !important;
        overflow-x: hidden !important;
      }
      
      /* Force all plot elements to be visible */
      .plot-container *, .js-plotly-plot * {
        visibility: visible !important;
        opacity: 1 !important;
        overflow-y: visible !important;
        overflow-x: hidden !important;
      }
      
      /* Ensure chart labels and axes are visible */
      .xaxislayer-above, .yaxislayer-above, .zaxislayer-above {
        visibility: visible !important;
      }
      
      /* Allow page breaks between sections but not within them */
      .section {
        page-break-inside: avoid !important;
        margin-bottom: 20px !important;
      }
      
      /* Ensure proper page breaks for key elements */
      h1, h2, h3, h4, h5, h6, img, figure, figcaption, .key-insight, .recommendation {
        page-break-after: avoid !important;
        page-break-inside: avoid !important;
      }
      
      /* Ensure lists stay together */
      ul, ol {
        page-break-inside: avoid !important;
      }
      
      /* Ensure paragraphs don't break across pages if possible */
      p {
        orphans: 3 !important;
        widows: 3 !important;
      }
      
      /* Ensure tables fit on one page and are properly sized */
      table {
        page-break-inside: avoid !important;
        width: 650px !important; /* Fixed width to prevent overflow */
        max-width: 100% !important;
        font-size: 0.9em !important;
        border-collapse: collapse !important;
        margin: 0 auto !important;
      }
      
      /* Table cells should be properly sized */
      th, td {
        padding: 4px !important;
        word-break: break-word !important;
      }
      
      /* Remove any fixed heights that might cause clipping */
      [style*="height:"], [style*="min-height:"], [style*="max-height:"] {
        height: auto !important;
        min-height: 0 !important;
        max-height: none !important;
      }
      
      /* Ensure divs expand to fit content */
      div {
        height: auto !important;
        min-height: 0 !important;
        max-height: none !important;
        overflow-y: visible !important;
        overflow-x: hidden !important;
      }
    }
  `;

  const handlePrint = () => {
    const fileExtension = s3Key.split('.').pop()?.toLowerCase();
    const isHtmlFile = fileExtension === 'html';
    
    // Create a print-friendly version in a new window for all file types
    const printWindow = window.open('', '_blank', 'width=1000,height=800');
    if (!printWindow) {
      alert('Please allow pop-ups for printing functionality');
      return;
    }
    
    // Setup the print window with proper styling
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Print - ${s3KeyDecoded}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          ${printStyles}
          
          /* Additional runtime styles */
          body {
            padding: 0;
            margin: 0;
            font-family: Arial, sans-serif;
            overflow: visible !important;
          }
          
          .print-container {
            width: 650px !important; /* Fixed width to prevent overflow */
            max-width: 100% !important;
            margin: 0 auto !important;
            overflow-y: visible !important;
            overflow-x: hidden !important;
            height: auto !important;
            display: block !important;
            page-break-inside: avoid !important;
          }
          
          @page {
            size: auto; /* Default to portrait, browser will use landscape when appropriate */
            margin: 10mm; /* Small margin from page border */
          }
          
          /* Ensure content fits within page */
          .plot-container {
            width: 650px !important; /* Fixed width to prevent overflow */
            max-width: 100% !important;
            height: auto !important;
            max-height: none !important;
            overflow-y: visible !important;
            overflow-x: hidden !important; /* Prevent horizontal overflow */
            page-break-inside: avoid !important;
            display: block !important;
            margin: 0 auto !important;
            padding: 0 !important;
          }
        </style>
      </head>
      <body id="print-content">
        <div class="print-container">
    `);
    
    if (isHtmlFile) {
      // For HTML files
      const iframe = fileViewerRef.current?.querySelector('iframe');
      if (iframe && iframe.contentDocument) {
        // Extract styles from the original document to maintain formatting
        const originalStyles = Array.from(iframe.contentDocument.querySelectorAll('style, link[rel="stylesheet"]'))
          .map(el => el.outerHTML)
          .join('\n');
        
          printWindow.document.write(`
          ${originalStyles}
          <div class="plot-container">
            ${iframe.contentDocument.body ? iframe.contentDocument.body.innerHTML : ''}
          </div>
        `);
      } else if (fileContent) {
        // If we have the raw HTML content
        printWindow.document.write(`
          <div class="plot-container">
            ${fileContent}
          </div>
        `);
      }
    } else {
      // For non-HTML files (plots, images, etc.)
      const iframe = fileViewerRef.current?.querySelector('iframe');
      const img = fileViewerRef.current?.querySelector('img');
      const canvas = fileViewerRef.current?.querySelector('canvas');
      const svg = fileViewerRef.current?.querySelector('svg');
      const plotContainer = fileViewerRef.current?.querySelector('.js-plotly-plot, .plot-container, [class*="plot"]');
      
      if (iframe && iframe.contentDocument) {
        // Try to extract plot-specific elements from iframe
        const iframePlot = iframe.contentDocument.querySelector('.js-plotly-plot, svg, canvas, .plot-container, [class*="plot"]');
        if (iframePlot) {
          printWindow.document.write(`
            <div class="plot-container">
              ${iframePlot.outerHTML}
            </div>
          `);
        } else {
          // If no specific plot element found, use the whole body
          printWindow.document.write(`
            <div class="plot-container">
              ${iframe.contentDocument.body ? iframe.contentDocument.body.innerHTML : ''}
            </div>
          `);
        }
      } else if (plotContainer) {
        // Direct plot container found
        printWindow.document.write(`
          <div class="plot-container">
            ${plotContainer.outerHTML}
          </div>
        `);
      } else if (svg) {
        // SVG element (common for plots)
        printWindow.document.write(`
          <div class="plot-container">
            ${svg.outerHTML}
          </div>
        `);
      } else if (canvas) {
        // Canvas element
        // For canvas, we need to capture its content as an image
        try {
          const dataUrl = canvas.toDataURL('image/png');
          printWindow.document.write(`
            <div class="plot-container">
              <img src="${dataUrl}" style="width:650px; max-width:100%; height:auto;" />
            </div>
          `);
        } catch (e) {
          // If we can't get canvas data (e.g., CORS issues), use the element itself
          printWindow.document.write(`
            <div class="plot-container">
              ${canvas.outerHTML}
            </div>
          `);
        }
      } else if (img) {
        // Image element
        printWindow.document.write(`
          <div class="plot-container">
            <img src="${img.src}" style="width:650px; max-width:100%; height:auto;" />
          </div>
        `);
      } else if (fileUrl) {
        // If we have a direct URL to the file
        const isImage = /\.(png|jpg|jpeg|gif|svg)$/i.test(s3Key);
        const isPdf = /\.pdf$/i.test(s3Key);
        
        if (isImage) {
          printWindow.document.write(`
            <div class="plot-container">
              <img src="${fileUrl.toString()}" style="width:650px; max-width:100%; height:auto;" />
            </div>
          `);
        } else if (isPdf) {
          printWindow.document.write(`
            <div class="plot-container">
              <embed src="${fileUrl.toString()}" type="application/pdf" width="650px" height="1000px" style="max-width:100%;" />
            </div>
          `);
        } else {
          printWindow.document.write(`
            <div class="plot-container">
              <iframe src="${fileUrl.toString()}" width="650" height="800" style="width:650px; max-width:100%; min-width:650px; min-height:800px; height:800px; border:none; display:block; margin:0 auto;" frameBorder="0"></iframe>
            </div>
          `);
        }
      }
    }
    
    // Close the HTML structure
    printWindow.document.write(`
        </div>
        <script>
          // Wait for all content to load before printing
          window.onload = function() {
            // Add a longer delay for complex plots
            setTimeout(function() {
              // Force recalculation of layout before printing
              document.querySelectorAll('.plot-container, svg, .js-plotly-plot').forEach(function(el) {
                if (el) {
                  // Force a reflow
                  void el.offsetHeight;
                  
                  // If this is an SVG, ensure it's fully visible
                  if (el.tagName === 'SVG') {
                    el.setAttribute('width', '650px');
                    el.setAttribute('height', 'auto');
                    el.style.maxWidth = '100%';
                    el.style.maxHeight = 'none';
                    el.style.overflowY = 'visible';
                    el.style.overflowX = 'hidden';
                  }
                }
              });
              
              // Final check before printing
              var allSvgs = document.querySelectorAll('svg');
              allSvgs.forEach(function(svg) {
                svg.setAttribute('width', '650px');
                svg.setAttribute('height', 'auto');
                svg.style.maxWidth = '100%';
                svg.style.maxHeight = 'none';
                svg.style.overflowY = 'visible';
                svg.style.overflowX = 'hidden';
              });
              
              // Ensure all plot containers don't overflow horizontally
              document.querySelectorAll('.plot-container, .plotly, .js-plotly-plot').forEach(function(el) {
                el.style.width = '650px';
                el.style.maxWidth = '100%';
                el.style.margin = '0 auto';
                el.style.overflowX = 'hidden';
                el.style.overflowY = 'visible';
              });
              
              window.print();
            }, 5000); // Longer timeout for better rendering
          };
        </script>
      </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
  };
  
  return (
    <Box sx={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
      <Head>
        <style>{printStyles}</style>
        <style>{`
          @media print {
            @page {
              size: auto; /* Default to portrait, browser will use landscape when appropriate */
              margin: 10mm; /* Small margin from page border */
            }
          }
        `}</style>
      </Head>
      <Paper elevation={1} sx={{ px: 3, py: 2, borderRadius: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" component="h1" sx={{ 
            color: 'text.primary',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {s3KeyDecoded}
          </Typography>
          {fileUrl && (
            <Stack direction="row" spacing={2}>
              {!isEditMode ? (
                <>
                  {isEditableFile() && (
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<EditIcon />}
                      onClick={() => setIsEditMode(true)}
                    >
                      Edit
                    </Button>
                  )}
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<DownloadIcon />}
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = fileUrl.toString();
                      link.download = s3Key.split('/').pop() || '';
                      link.click();
                    }}
                  >
                    Download
                  </Button>
                </>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                >
                  Save
                </Button>
              )}
              <Button
                variant="contained"
                color="primary"
                startIcon={<OpenInNewIcon />}
                onClick={() => window.open(fileUrl.toString(), '_blank')}
              >
                Open in New Tab
              </Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={<PrintIcon />}
                onClick={handlePrint}
              >
                Print
              </Button>
              {isPdfYaml && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<PictureAsPdfIcon />}
                  onClick={() => window.open(`/preview/${pdfS3Key}`, '_blank')}
                >
                  Open PDF
                </Button>
              )}
            </Stack>
          )}
        </Box>
      </Paper>
      <Box sx={{ 
        flexGrow: 1, 
        position: 'relative',
        height: 'auto', // Allow natural height instead of constraining
        minHeight: 0,   // Remove minimum height constraint
        overflow: 'visible' // Allow content to overflow if needed
      }} ref={fileViewerRef}>
        <FileViewer 
          s3Key={s3Key} 
          onUrlChange={setFileUrl} 
          isEditMode={isEditMode}
          onContentChange={setFileContent}
          content={fileContent}
          onContentTypeChange={setContentType}
        />
      </Box>
      <Snackbar
        open={saveStatus.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar}
          severity={saveStatus.severity}
          sx={{ width: '100%' }}
        >
          {saveStatus.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
