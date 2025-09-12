import React, { useMemo } from 'react';
import { Theme } from '@mui/material/styles';
import { Typography, CircularProgress } from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import { getUrl } from 'aws-amplify/storage';
import dynamic from 'next/dynamic';

// Dynamically import Plotly with memory optimization and error boundary
const Plot = dynamic(
    () => import('react-plotly.js').then((mod) => {
        // Force garbage collection if available after loading heavy library
        if (typeof window !== 'undefined' && (window as any).gc) {
            setTimeout(() => (window as any).gc(), 100);
        }
        return mod.default;
    }).catch((error) => {
        console.error('Failed to load react-plotly.js:', error);
        // Fallback to a simple div if Plotly fails to load
        return () => React.createElement('div', { 
            style: { 
                padding: '20px', 
                textAlign: 'center',
                border: '1px dashed #ccc',
                borderRadius: '4px'
            }
        }, 'Chart unavailable - Plotly failed to load');
    }), 
    {
        ssr: false,
        loading: () => (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '400px'
            }}>
                <CircularProgress />
            </div>
        )
    }
) as React.ComponentType<any>;

// Import Message type for content prop
import { Message } from '@/../utils/types';

// Declare a more specific type for the series data
interface SeriesData {
    label: string;
    column: string;
    color?: string;
    data: string[];
    sourceFile?: string;
    xData?: string[]; // For multi-file datasets
    tooltipData?: string[]; // Custom tooltip data
    tooltipColumn?: string; // Name of column used for tooltips
}

export const PlotDataToolComponent = ({ content, theme, chatSessionId }: { 
    content: Message['content'], 
    theme: Theme,
    chatSessionId: string
}) => {
    const [plotData, setPlotData] = React.useState<{
        messageContentType?: string;
        filePath?: string;
        plotType?: 'line' | 'scatter' | 'bar';
        title?: string;
        xAxis?: { label?: string; data?: string[] };
        series?: Array<SeriesData>;
        xAxisColumn?: string;
        yAxisColumns?: Array<{
            column: string;
            label?: string;
            color?: string;
            tooltipColumn?: string;
        }>;
        dataRows?: Array<any>;
        error?: string;
        suggestion?: string;
        availableColumns?: string[];
        isMultiSource?: boolean;
        sourceFiles?: string[];
        tooltipColumn?: string;
    } | null>(null);
    const [error, setError] = React.useState<boolean>(false);
    const [errorMessage, setErrorMessage] = React.useState<string>('');
    const [csvData, setCsvData] = React.useState<Array<{ [key: string]: string }> | null>(null);
    const [loading, setLoading] = React.useState(false);
    
    // Get array of standard colors to use for series
    const seriesColors = React.useMemo(() => [
        theme.palette.primary.main,
        theme.palette.secondary.main,
        '#FF5722', // deep orange
        '#2196F3', // blue
        '#4CAF50', // green
        '#9C27B0', // purple
        '#FFC107', // amber
        '#795548', // brown
        '#00BCD4', // cyan
        '#E91E63', // pink
        '#673AB7', // deep purple
        '#CDDC39'  // lime
    ], [theme]);

    // Parse the plot data when the component mounts or content changes
    React.useEffect(() => {
        try {
            const parsedData = JSON.parse((content as any)?.text || '{}');
            console.log('Parsed plot data:', parsedData);
            setPlotData(parsedData);
            setError(false);
            setErrorMessage('');
        } catch (e: any) {
            console.error('Error parsing plot data:', e);
            setPlotData(null);
            setError(true);
            setErrorMessage(`Error parsing plot data: ${e.message || 'Unknown error'}`);
        }
    }, [content]);

    // Function to manually parse CSV data from the file content
    const parseCSV = React.useCallback((fileContent: string) => {
        try {
            // Split into lines and remove empty lines
            const lines = fileContent.trim().split('\n');
            
            if (lines.length <= 1) {
                throw new Error('CSV file is empty or contains only headers');
            }
            
            // Extract headers
            const headers = lines[0].split(',').map(h => h.trim());
            
            // Process all rows
            const rows = lines.slice(1).map(line => {
                const values = line.split(',').map(v => v.trim());
                const row: { [key: string]: string } = {};
                
                // Map each value to its column header
                headers.forEach((header, index) => {
                    row[header] = values[index] || '';
                });
                
                return row;
            });
            
            return { headers, rows };
        } catch (error: any) {
            throw new Error(`Failed to parse CSV: ${error.message}`);
        }
    }, []);

    // Process the data when plotData is updated
    React.useEffect(() => {
        if (!plotData?.filePath) return;

        const processData = async () => {
            setLoading(true);
            try {
                // Get file content directly from HTML instead of fetching
                const fileContentEl = document.querySelector(`.file-content[data-file="${plotData.filePath}"]`);
                if (fileContentEl) {
                    const fileContent = fileContentEl.textContent || '';
                    if (!fileContent) {
                        throw new Error('Empty file content');
                    }

                    // Parse CSV data
                    const { headers, rows } = parseCSV(fileContent);
                    setCsvData(rows);
                    console.log('Parsed CSV data from DOM:', rows);
                } else {
                    // Fall back to using the data already in plotData.series
                    if (plotData.series && plotData.series.length > 0) {
                        console.log('Using pre-parsed data from plotData');
                        setCsvData([]); // Just set to empty array to indicate success
                    } else {
                        throw new Error('Cannot find file content in the DOM and no pre-parsed data available');
                    }
                }
            } catch (error: any) {
                console.error('Error processing data:', error);
                setError(true);
                setErrorMessage(`Error processing data: ${error.message}`);
            } finally {
                setLoading(false);
            }
        };

        processData();
    }, [plotData, parseCSV]);

    // Prepare Plotly data from multiple sources or direct data
    const plotlyData = React.useMemo(() => {
        // If we have csvData and need to extract specific columns
        if (csvData && plotData?.xAxisColumn && plotData.yAxisColumns && plotData.yAxisColumns.length > 0) {
            const xValues = csvData.map(row => row[plotData.xAxisColumn || ''] || '');
            
            // Print sample of the CSV data for debugging
            console.log('CSV data sample:', csvData.slice(0, 2));
            console.log('Available columns in CSV:', csvData.length > 0 ? Object.keys(csvData[0]) : []);
            
            console.log('Creating Plotly chart with columns:', { 
                xAxisColumn: plotData.xAxisColumn, 
                yAxisColumns: plotData.yAxisColumns,
                xValuesCount: xValues.length,
                csvDataCount: csvData.length
            });
            
            // Create Plotly traces for each y-axis column
            const traces = plotData.yAxisColumns.map((col, index) => {
                // Check if the column actually exists in the data
                const columnExists = csvData.length > 0 && col.column in csvData[0];
                if (!columnExists) {
                    console.warn(`Column "${col.column}" not found in CSV data. Available columns:`, 
                        csvData.length > 0 ? Object.keys(csvData[0]) : []);
                }
                
                const dataPoints = csvData.map(row => {
                    // Get the numeric value, parse it correctly
                    const rawValue = row[col.column];
                    if (rawValue === undefined) {
                        console.warn(`Value for column "${col.column}" is undefined in row:`, row);
                        return 0;
                    }
                    const value = parseFloat(rawValue);
                    return isNaN(value) ? 0 : value;
                });
                
                console.log(`Column data for "${col.column}":`, { 
                    label: col.label, 
                    dataPoints: dataPoints.slice(0, 5), // Just show first 5 for debugging
                    columnName: col.column,
                    exists: columnExists
                });
                
                const plotType = plotData?.plotType || 'line';
                const traceType = plotType === 'bar' ? 'bar' : plotType === 'scatter' ? 'scatter' : 'scatter';
                const mode = plotType === 'line' ? 'lines+markers' : 'markers';
                
                return {
                    x: xValues,
                    y: dataPoints,
                    type: traceType as any,
                    mode: mode as any,
                    name: col.label || col.column,
                    line: {
                        color: col.color || seriesColors[index % seriesColors.length],
                        width: 2
                    },
                    marker: {
                        color: col.color || seriesColors[index % seriesColors.length],
                        size: 6
                    },
                    // Use secondary y-axis for additional series
                    yaxis: index === 0 ? 'y' : 'y2'
                };
            });
            
            return traces;
        }
        
        // If we have plotData with series already prepared
        if (plotData?.series && plotData.xAxis?.data) {
            const plotType = plotData?.plotType || 'line';
            const traceType = plotType === 'bar' ? 'bar' : plotType === 'scatter' ? 'scatter' : 'scatter';
            const mode = plotType === 'line' ? 'lines+markers' : 'markers';
            
            // Check if this is multi-file data
            if (plotData.isMultiSource) {
                // For multi-file data, we need to map each series to the common x-axis
                const commonXLabels = plotData.xAxis.data;
                
                return plotData.series.map((series, index) => {
                    // For each x value in the common axis, find the corresponding y value from this series
                    // or use null if no match (to create gaps in the line)
                    const alignedData = commonXLabels.map(xValue => {
                        // Find the index of this x value in the series' original x data
                        if (!series.xData) {
                            return null;
                        }
                        const seriesIndex = series.xData.findIndex((x: string) => x === xValue);
                        // Return the y value if found, or null if not
                        return seriesIndex >= 0 ? Number(series.data[seriesIndex]) || 0 : null;
                    });
                    
                    return {
                        x: commonXLabels,
                        y: alignedData,
                        type: traceType as any,
                        mode: mode as any,
                        name: series.label || `Series ${index + 1}`,
                        line: {
                            color: series.color || seriesColors[index % seriesColors.length],
                            width: 2
                        },
                        marker: {
                            color: series.color || seriesColors[index % seriesColors.length],
                            size: 6
                        },
                        connectgaps: true, // Allow gaps in line for missing data points
                        // Use secondary y-axis for additional series
                        yaxis: index === 0 ? 'y' : 'y2'
                    };
                });
            }
            
            // Single file with multiple series
            return plotData.series.map((series, index) => ({
                x: plotData.xAxis?.data || [],
                y: series.data.map(y => Number(y) || 0),
                type: traceType as any,
                mode: mode as any,
                name: series.label,
                line: {
                    color: series.color || seriesColors[index % seriesColors.length],
                    width: 2
                },
                marker: {
                    color: series.color || seriesColors[index % seriesColors.length],
                    size: 6
                },
                // Use secondary y-axis for additional series
                yaxis: index === 0 ? 'y' : 'y2'
            }));
        }
        
        // Default empty data
        return [];
    }, [plotData, csvData, seriesColors]);

    // Create Plotly layout options
    const plotlyLayout = React.useMemo(() => {
        // Determine if we need dual y-axes
        const needsDualAxes = plotlyData && plotlyData.length > 1;
        
        console.log('Plotly needs dual axes:', needsDualAxes, 'with traces:', plotlyData?.length);
        
        const layout: any = {
            autosize: true,
            margin: { l: 60, r: 60, t: 60, b: 60 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            title: {
                text: plotData?.title || 'Data Plot',
                font: { size: 16 },
                x: 0.5
            },
            xaxis: {
                title: {
                    text: plotData?.xAxis?.label || 'X',
                    font: { size: 14 }
                },
                gridcolor: 'rgba(0,0,0,0.1)',
                tickfont: { color: theme.palette.text.secondary }
            },
            yaxis: {
                title: {
                    text: needsDualAxes && plotData?.yAxisColumns && plotData.yAxisColumns.length > 0
                        ? (plotData.yAxisColumns[0].label || plotData.yAxisColumns[0].column)
                        : 'Value',
                    font: { size: 14 }
                },
                gridcolor: 'rgba(0,0,0,0.1)',
                tickfont: { color: theme.palette.text.secondary },
                side: 'left'
            },
            showlegend: true,
            legend: {
                orientation: 'h',
                y: -0.2,
                x: 0.5,
                xanchor: 'center'
            }
        };
        
        // Add right y-axis if we need dual axes
        if (needsDualAxes && plotData?.yAxisColumns && plotData.yAxisColumns.length > 1) {
            layout.yaxis2 = {
                title: {
                    text: plotData.yAxisColumns[1].label || plotData.yAxisColumns[1].column,
                    font: { size: 14 }
                },
                tickfont: { color: theme.palette.text.secondary },
                side: 'right',
                overlaying: 'y'
            };
            
            console.log('Added secondary Y axis for:', plotData.yAxisColumns[1].column);
        } else {
            console.log('No secondary Y axis needed');
        }
        
        return layout;
    }, [plotData, theme, plotlyData?.length]);

    // Render the Plotly chart
    const renderChart = () => {
        // Ensure we have data to display
        const hasData = plotlyData && plotlyData.length > 0;
        
        if (!hasData) {
            return (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%',
                    color: theme.palette.text.secondary
                }}>
                    <Typography variant="body1" gutterBottom>
                        No data to display
                    </Typography>
                    <Typography variant="caption">
                        Data structure received: {JSON.stringify({
                            series: plotData?.series?.length || 0,
                            xAxis: plotData?.xAxis?.data?.length || 0,
                            csvData: csvData?.length || 0,
                            filePath: plotData?.filePath,
                            plotlyTraces: plotlyData?.length || 0
                        })}
                    </Typography>
                </div>
            );
        }
        
        return (
            <Plot
                data={plotlyData}
                layout={plotlyLayout}
                style={{ width: '100%', height: '100%' }}
                config={{
                    responsive: true,
                    displayModeBar: true,
                    modeBarButtonsToRemove: ['pan2d', 'lasso2d'],
                    displaylogo: false
                }}
            />
        );
    };

    // If there's an error processing the plot data
    if (error || !plotData) {
        return (
            <div style={{ 
                backgroundColor: theme.palette.error.light,
                color: theme.palette.error.contrastText,
                padding: theme.spacing(2),
                borderRadius: theme.shape.borderRadius,
                margin: theme.spacing(1, 0)
            }}>
                <Typography variant="subtitle2" fontWeight="bold">
                    Error processing plot data
                </Typography>
                
                {errorMessage && (
                    <Typography variant="body2" style={{ marginTop: theme.spacing(1), marginBottom: theme.spacing(1) }}>
                        {errorMessage}
                    </Typography>
                )}
                
                <div style={{
                    backgroundColor: 'rgba(0,0,0,0.05)',
                    padding: theme.spacing(1.5),
                    borderRadius: theme.shape.borderRadius,
                    maxHeight: '200px',
                    overflow: 'auto'
                }}>
                    <Typography variant="caption" component="div">
                        <strong>Debug information:</strong>
                    </Typography>
                    <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.75rem', margin: theme.spacing(0.5, 0, 0, 0) }}>
                        Raw content: {(content as any)?.text}
                    </pre>
                    <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.75rem', margin: theme.spacing(0.5, 0, 0, 0) }}>
                        Plot data: {plotData ? JSON.stringify(plotData, null, 2) : 'null'}
                    </pre>
                    <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.75rem', margin: theme.spacing(0.5, 0, 0, 0) }}>
                        CSV data: {csvData ? `${csvData.length} rows` : 'null'}
                    </pre>
                </div>
                
                <Typography variant="caption" color="textSecondary" style={{ marginTop: theme.spacing(1), display: 'block' }}>
                    Try reloading the page or check the console for more details.
                </Typography>
            </div>
        );
    }

    // If there's an error in the data itself
    if (plotData.error) {
        return (
            <div style={{ 
                backgroundColor: theme.palette.warning.light,
                padding: theme.spacing(2),
                borderRadius: theme.shape.borderRadius,
                margin: theme.spacing(1, 0)
            }}>
                <Typography variant="subtitle2" fontWeight="bold" color={theme.palette.warning.dark}>
                    Plot Error: {plotData.error}
                </Typography>
                {plotData.suggestion && (
                    <Typography variant="body2" style={{ marginTop: theme.spacing(1) }}>
                        Suggestion: {plotData.suggestion}
                    </Typography>
                )}
                {plotData.availableColumns && (
                    <div style={{ marginTop: theme.spacing(1) }}>
                        <Typography variant="body2" fontWeight="medium">
                            Available columns:
                        </Typography>
                        <ul style={{ margin: theme.spacing(0.5, 0, 0, 2) }}>
                            {plotData.availableColumns.map((col, idx) => (
                                <li key={idx}>
                                    <Typography variant="body2" component="span">
                                        {col}
                                    </Typography>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        );
    }

    // Show loading state while fetching CSV
    if (loading) {
        return (
            <div style={{
                backgroundColor: 'transparent',
                padding: theme.spacing(2),
                borderRadius: theme.shape.borderRadius,
                border: `1px solid ${theme.palette.grey[300]}`,
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '350px'
            }}>
                <CircularProgress size={40} />
                <Typography variant="body2" style={{ marginTop: theme.spacing(2) }}>
                    Loading data from {plotData.filePath}...
                </Typography>
            </div>
        );
    }

    // Render the complete chart
    return (
        <div style={{
            borderRadius: theme.shape.borderRadius,
            width: '100%',
            overflow: 'hidden'
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing(1),
                marginBottom: theme.spacing(1),
                color: theme.palette.primary.main
            }}>
                <DescriptionIcon />
                <Typography variant="subtitle1" fontWeight="medium">
                    {plotData.title || 'Data Plot'}
                </Typography>
            </div>
            
            <div style={{
                border: `1px solid ${theme.palette.grey[300]}`,
                borderRadius: theme.shape.borderRadius,
                padding: theme.spacing(1),
                backgroundColor: 'rgba(0,0,0,0)',
                height: '500px',
                width: '100%',
                overflow: 'visible',
                position: 'relative',
                minHeight: '500px'
            }}>
                <div style={{
                    height: '100%',
                    width: '100%',
                    backgroundColor: 'rgba(0,0,0,0)',
                    overflow: 'hidden',
                    position: 'relative'
                }}>
                    <div style={{
                        height: '100%',
                        width: '100%',
                        position: 'absolute',
                        top: 0,
                        left: 0
                    }}>
                        {renderChart()}
                    </div>
                </div>
            </div>

            <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: theme.spacing(1)
            }}>
                <Typography variant="caption" color="textSecondary">
                    Source: {plotData.filePath}
                </Typography>
                
                <Typography variant="caption" color="textSecondary">
                    {plotlyData && plotlyData.length > 1 
                        ? `${plotlyData.length} series, ${plotlyData[0]?.x?.length || 0} data points`
                        : `${plotlyData?.[0]?.x?.length || 0} data points`}
                </Typography>
            </div>
        </div>
    );
};
