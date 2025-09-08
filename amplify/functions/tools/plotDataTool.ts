import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { readFile, writeFile } from "./s3ToolBox";
import { getChatSessionId } from "./toolUtils";
import * as path from "path";

// Schema for plot data tool
const plotDataToolSchema = z.object({
    filePaths: z.array(z.string()).or(z.string()).describe("Path(s) to the CSV file(s) to plot. Can be a single file path or an array of file paths."),
    dataSeries: z.array(z.object({
        filePath: z.string().describe("The path to the CSV file for this series"),
        xAxisColumn: z.string().describe("The name of the column to use for the x-axis in this file"),
        yAxisColumn: z.string().describe("The name of the column to use for the y-axis in this file"),
        tooltipColumn: z.string().optional().describe("Optional column whose values will be shown in tooltips"),
        label: z.string().optional().describe("Custom label for this data series"),
        color: z.string().optional().describe("Optional color for this data series (hex code or named color)")
    })).optional().describe("Advanced configuration for multiple data series from different files"),
    xAxisColumn: z.string().optional().describe("The name of the column to use for the x-axis (when using a single file)"),
    yAxisColumns: z.array(z.object({
        column: z.string().describe("The name of the column to use for the y-axis"),
        tooltipColumn: z.string().optional().describe("Optional column whose values will be shown in tooltips"),
        label: z.string().optional().describe("Custom label for this data series"),
        color: z.string().optional().describe("Optional color for this data series (hex code or named color)")
    })).or(z.string()).optional().describe("The column(s) to plot on the y-axis for a single file. Can be a single column name or an array of column objects."),
    tooltipColumn: z.string().optional().describe("Optional column whose values will be shown in tooltips for all series (can be overridden per series)"),
    plotType: z.enum(["line", "scatter", "bar"]).optional().default("line").describe("The type of plot to create"),
    title: z.string().optional().describe("Optional title for the plot"),
    xAxisLabel: z.string().optional().describe("Optional label for the x-axis"),
    yAxisLabel: z.string().optional().describe("Optional label for the y-axis"),
});

// Helper function to validate CSV file extension
function validateCsvFileExtension(filePath: string): boolean {
    return filePath.toLowerCase().endsWith('.csv');
}

export const plotDataTool = tool(
    async (params) => {
        const { filePaths, dataSeries, xAxisColumn, yAxisColumns, plotType = "line", title, xAxisLabel, yAxisLabel, tooltipColumn } = params
        try {
            // Check if file paths have .csv extension
            if (filePaths) {
                const paths = Array.isArray(filePaths) ? filePaths : [filePaths];
                for (const path of paths) {
                    if (!validateCsvFileExtension(path)) {
                        return JSON.stringify({
                            error: `Invalid file extension for "${path}". Only CSV files are supported.`,
                            suggestion: "Please provide file paths ending with .csv"
                        });
                    }
                }
            }
            
            // Check dataSeries file paths if they exist
            if (dataSeries && dataSeries.length > 0) {
                for (const series of dataSeries) {
                    if (!validateCsvFileExtension(series.filePath)) {
                        return JSON.stringify({
                            error: `Invalid file extension for "${series.filePath}". Only CSV files are supported.`,
                            suggestion: "Please provide file paths ending with .csv"
                        });
                    }
                }
                
                // Process multiple files and return the result
                const result = await processMultipleFiles(dataSeries, plotType, title, xAxisLabel, yAxisLabel);
                return result;
            }
            
            // Handle single file path or array of file paths with same column structure
            const normalizedFilePaths = Array.isArray(filePaths) ? filePaths : [filePaths];
            
            if (normalizedFilePaths.length > 1) {
                // Multiple files with same column structure
                if (!xAxisColumn || !yAxisColumns) {
                    return JSON.stringify({
                        error: "When using multiple files, you must specify xAxisColumn and yAxisColumns",
                        suggestion: "Provide both xAxisColumn and yAxisColumns parameters"
                    });
                }
                
                // Create dataSeries from multiple files
                const generatedDataSeries = normalizedFilePaths.map((filePath, index) => {
                    // For multiple files, we'll use the same column in each file
                    // but create series names based on the file names
                    const fileBaseName = filePath.split('/').pop()?.split('.')[0] || `Series ${index + 1}`;
                    
                    // If yAxisColumns is a string, use it for all files
                    if (typeof yAxisColumns === 'string') {
                        return {
                            filePath,
                            xAxisColumn,
                            yAxisColumn: yAxisColumns,
                            tooltipColumn,
                            label: fileBaseName
                        };
                    }
                    
                    // If yAxisColumns is already an array, use the first one for simplicity
                    // (advanced users should use dataSeries directly for more complex cases)
                    const yAxisColumn = Array.isArray(yAxisColumns) ? 
                        yAxisColumns[0].column : 
                        yAxisColumns;
                    
                    return {
                        filePath,
                        xAxisColumn,
                        yAxisColumn,
                        tooltipColumn,
                        label: fileBaseName
                    };
                });
                
                // Process multiple files and return the result
                const result = await processMultipleFiles(generatedDataSeries, plotType, title, xAxisLabel, yAxisLabel);
                return result;
            }
            
            // Single file case - use the original implementation
            const singleFilePath = normalizedFilePaths[0];
            const result = await processSingleFile(singleFilePath, xAxisColumn, yAxisColumns, plotType, title, xAxisLabel, yAxisLabel, tooltipColumn);
            return result;
        } catch (error: any) {
            return JSON.stringify({
                error: `Error processing plot data: ${error.message}`,
                suggestion: "Check the file format and column names"
            });
        }
    },
    {
        name: "plotDataTool",
        description: `
Use this tool to create plots from CSV files with support for multiple data series and multiple files.
The tool will validate file existence and column names before returning the plot configuration.
Only CSV files (with .csv extension) are supported.

Example usage:
- Plot temperature vs time from a weather data CSV
- Compare monthly sales for multiple products in a single chart
- Visualize data from multiple CSV files in a single plot
- Display additional information in tooltips using the tooltipColumn parameter

For multiple data series from the same file:
- Provide an array of objects for yAxisColumns to plot multiple columns against the same x-axis
- Optionally specify a tooltipColumn for each series to show custom information in tooltips

For multiple data series from different files:
- Provide an array of file paths to the filePaths parameter
- OR use the dataSeries parameter for more control over how each file's data is plotted
- Use tooltipColumn to specify which column should appear in tooltips

The tool supports line, scatter, and bar plots.
`,
        schema: plotDataToolSchema,
    }
);

// Define interfaces for data structures
interface DataPoint {
    x: string;
    y: Array<{
        column: string;
        label: string;
        color?: string;
        value: string;
        tooltip?: string;
    }>;
}

interface MultiFileDataPoint {
    x: string;
    y: string;
    tooltip?: string;
}

interface SeriesConfig {
    filePath: string;
    xAxisColumn: string;
    yAxisColumn: string;
    tooltipColumn?: string;
    label?: string;
    color?: string;
}

// Helper function to process a single file
async function processSingleFile(filePath: string, xAxisColumn?: string, yAxisColumns?: any, plotType: string = "line", title?: string, xAxisLabel?: string, yAxisLabel?: string, tooltipColumn?: string) {
    // Generate a unique filename for the HTML file
    const fileBaseName = filePath.split('/').pop()?.split('.')[0] || 'data';
    const htmlFileName = `plots/${plotType}_${fileBaseName}_${Date.now()}.html`;
    // Read the CSV file
    const fileContent = await readFile.invoke({ filename: filePath });
    const fileData = JSON.parse(fileContent);

    if (fileData.error) {
        return JSON.stringify({
            error: `Failed to read file: ${fileData.error}`,
            suggestion: "Check if the file exists and is accessible"
        });
    }

    // Parse the CSV content
    const lines = fileData.content.split('\n');
    if (lines.length < 2) {
        return JSON.stringify({
            error: "File is empty or has no data rows",
            suggestion: "Ensure the CSV file contains header and data rows"
        });
    }

    // Get column names from header
    const headers = lines[0].split(',').map((h: string) => h.trim());
    
    // If no x-axis column specified, use the first column
    const finalXAxisColumn = xAxisColumn || headers[0];
    
    // If no y-axis columns specified, use the second column
    const finalYAxisColumns = yAxisColumns || headers.length > 1 ? headers[1] : headers[0];
    
    // Validate x-axis column
    if (!headers.includes(finalXAxisColumn)) {
        return JSON.stringify({
            error: `X-axis column "${finalXAxisColumn}" not found in file`,
            availableColumns: headers,
            suggestion: "Check the column name and try again"
        });
    }
    
    // Normalize yAxisColumns to always be an array of objects
    const normalizedYColumns = Array.isArray(finalYAxisColumns) 
        ? finalYAxisColumns 
        : [{ column: finalYAxisColumns }];
    
    // Validate y-axis columns
    for (const yCol of normalizedYColumns) {
        if (!headers.includes(yCol.column)) {
            return JSON.stringify({
                error: `Y-axis column "${yCol.column}" not found in file`,
                availableColumns: headers,
                suggestion: "Check the column name and try again"
            });
        }
    }

    // Get column indices
    const xIndex = headers.indexOf(finalXAxisColumn);
    const yIndices = normalizedYColumns.map(yCol => ({
        index: headers.indexOf(yCol.column),
        column: yCol.column,
        label: yCol.label || yCol.column,
        color: yCol.color,
        tooltipColumn: yCol.tooltipColumn || tooltipColumn
    }));

    // Add tooltip column indices if specified
    const tooltipIndices: { [columnName: string]: number } = {};
    
    // Process the main tooltipColumn if specified
    if (tooltipColumn && headers.includes(tooltipColumn)) {
        tooltipIndices[tooltipColumn] = headers.indexOf(tooltipColumn);
    }
    
    // Process per-series tooltip columns
    for (const yCol of normalizedYColumns) {
        if (yCol.tooltipColumn && headers.includes(yCol.tooltipColumn)) {
            tooltipIndices[yCol.tooltipColumn] = headers.indexOf(yCol.tooltipColumn);
        }
    }

    // Extract data points
    const dataRows = lines.slice(1)
        .filter((line: string) => line.trim()) // Skip empty lines
        .map((line: string) => {
            const values = line.split(',').map((v: string) => v.trim());
            
            // Extract tooltip data for each row
            const tooltipData: { [column: string]: string } = {};
            Object.entries(tooltipIndices).forEach(([column, index]) => {
                tooltipData[column] = values[index] || '';
            });
            
            return {
                x: values[xIndex],
                y: yIndices.map(y => ({ 
                    column: y.column,
                    label: y.label,
                    color: y.color,
                    value: values[y.index],
                    tooltip: y.tooltipColumn ? tooltipData[y.tooltipColumn] : undefined
                }))
            };
        }) as DataPoint[];

    // Validate data points
    if (dataRows.length === 0) {
        return JSON.stringify({
            error: "No valid data points found",
            suggestion: "Check if the CSV file contains valid data"
        });
    }
    
    // Extract x-axis data
    const xAxisData = dataRows.map(row => row.x);
    
    // Process y-axis data for each series
    const seriesData = normalizedYColumns.map((yCol, index) => {
        return {
            label: yCol.label || yCol.column,
            column: yCol.column,
            color: yCol.color,
            data: dataRows.map(row => row.y[index].value),
            tooltipData: dataRows.map(row => row.y[index].tooltip),
            xData: xAxisData,
            sourceFile: filePath
        };
    });
    
    // Create plot configuration
    const plotConfig = {
        messageContentType: 'plot_data',
        plotType,
        title: title || `${normalizedYColumns.map(y => y.label || y.column).join(', ')} vs ${finalXAxisColumn}`,
        xAxis: {
            label: xAxisLabel || finalXAxisColumn,
            data: xAxisData
        },
        series: seriesData,
        sourceFiles: [filePath],
        isMultiSource: false
    };
    
    // Generate HTML with Plotly
    const htmlContent = await generatePlotlyHtml(plotConfig);
    
    // Save HTML file to S3
    const chatSessionId = getChatSessionId();
    if (!chatSessionId) {
        return JSON.stringify({
            error: "No chat session ID found",
            suggestion: "Make sure you're in a valid chat session"
        });
    }
    
    try {
        // Write the HTML file
        const writeResult = await writeFile.invoke({
            filename: htmlFileName,
            content: htmlContent
        });
        
        const writeResultObj = JSON.parse(writeResult);
        if (writeResultObj.error) {
            throw new Error(writeResultObj.error);
        }
        
        // Return success with file path
        return JSON.stringify({
            ...plotConfig,
            htmlFile: htmlFileName,
            renderType: 'asset'
        });
    } catch (error: any) {
        return JSON.stringify({
            error: `Failed to save HTML file: ${error.message}`,
            suggestion: "Check S3 permissions and try again"
        });
    }
}

// Function to generate HTML with Plotly visualization
async function generatePlotlyHtml(plotConfig: any): Promise<string> {
    const { plotType, title, xAxis, series } = plotConfig;
    
    // Create data array for Plotly
    const plotlyData = series.map((s: any) => {
        // For multi-file data, we need to align the data with the common x-axis
        const xValues = s.xData || xAxis.data;
        const yValues = s.data;
        
        // Create the trace object based on plot type
        const trace: any = {
            name: s.label,
            x: xValues,
            y: yValues,
            type: plotType === 'bar' ? 'bar' : 'scatter',
            mode: plotType === 'scatter' ? 'markers' : 'lines',
        };
        
        // Add color if specified
        if (s.color) {
            trace.marker = { color: s.color };
            trace.line = { color: s.color };
        }
        
        // Add tooltip data if available
        if (s.tooltipData && s.tooltipData.some((t: any) => t !== undefined)) {
            trace.text = s.tooltipData;
            trace.hoverinfo = 'text+name';
        }
        
        return trace;
    });
    
    // Create layout for Plotly
    const layout = {
        title: title || 'Data Visualization',
        xaxis: {
            title: xAxis.label || '',
        },
        yaxis: {
            title: series.length === 1 ? series[0].column : '',
        },
        hovermode: 'closest',
        margin: { t: 50, r: 50, b: 100, l: 100 },
        showlegend: series.length > 1,
    };
    
    // Generate HTML with embedded Plotly
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${title || 'Data Visualization'}</title>
    <script src="https://cdn.plot.ly/plotly-2.24.1.min.js"></script>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .plot-container {
            width: 100%;
            height: 600px;
            background-color: white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            border-radius: 4px;
            overflow: hidden;
        }
        .source-info {
            margin-top: 15px;
            font-size: 12px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="plot-container" id="plot"></div>
    <div class="source-info">
        Source: ${series.map((s: any) => s.sourceFile).filter((v: any, i: number, a: any[]) => a.indexOf(v) === i).join(', ')}
    </div>
    
    <script>
        const data = ${JSON.stringify(plotlyData)};
        const layout = ${JSON.stringify(layout)};
        
        Plotly.newPlot('plot', data, layout, {responsive: true});
    </script>
</body>
</html>
`;
    
    return html;
}

// Helper function to process multiple files
async function processMultipleFiles(dataSeries: SeriesConfig[], plotType: string = "line", title?: string, xAxisLabel?: string, yAxisLabel?: string) {
    // Array to store series data
    const allSeries: any[] = [];
    const sourceFiles: string[] = [];
    let combinedXAxisData: string[] = [];
    
    // Process each file in the dataSeries
    for (const series of dataSeries) {
        const { filePath, xAxisColumn, yAxisColumn, label, color, tooltipColumn } = series;
        
        // Read the CSV file
        const fileContent = await readFile.invoke({ filename: filePath });
        const fileData = JSON.parse(fileContent);

        if (fileData.error) {
            return JSON.stringify({
                error: `Failed to read file ${filePath}: ${fileData.error}`,
                suggestion: "Check if all files exist and are accessible"
            });
        }

        // Track source files
        if (!sourceFiles.includes(filePath)) {
            sourceFiles.push(filePath);
        }

        // Parse the CSV content
        const lines = fileData.content.split('\n');
        if (lines.length < 2) {
            return JSON.stringify({
                error: `File ${filePath} is empty or contains only headers`,
                suggestion: "Ensure all CSV files contain header and data rows"
            });
        }

        // Get column names from header
        const headers = lines[0].split(',').map((h: string) => h.trim());
        
        // Validate columns
        if (!headers.includes(xAxisColumn)) {
            return JSON.stringify({
                error: `X-axis column "${xAxisColumn}" not found in file ${filePath}`,
                availableColumns: headers,
                suggestion: "Check column names in each file"
            });
        }
        
        if (!headers.includes(yAxisColumn)) {
            return JSON.stringify({
                error: `Y-axis column "${yAxisColumn}" not found in file ${filePath}`,
                availableColumns: headers,
                suggestion: "Check column names in each file"
            });
        }

        // Validate tooltip column if specified
        if (tooltipColumn && !headers.includes(tooltipColumn)) {
            return JSON.stringify({
                error: `Tooltip column "${tooltipColumn}" not found in file ${filePath}`,
                availableColumns: headers,
                suggestion: "Check column names in each file"
            });
        }

        // Get column indices
        const xIndex = headers.indexOf(xAxisColumn);
        const yIndex = headers.indexOf(yAxisColumn);
        const tooltipIndex = tooltipColumn ? headers.indexOf(tooltipColumn) : -1;

        // Extract data points
        const dataRows = lines.slice(1)
            .filter((line: string) => line.trim()) // Skip empty lines
            .map((line: string) => {
                const values = line.split(',').map((v: string) => v.trim());
                const dataPoint: MultiFileDataPoint = {
                    x: values[xIndex],
                    y: values[yIndex]
                };
                
                // Add tooltip data if available
                if (tooltipIndex >= 0) {
                    dataPoint.tooltip = values[tooltipIndex];
                }
                
                return dataPoint;
            }) as MultiFileDataPoint[];

        // Validate data points
        if (dataRows.length === 0) {
            return JSON.stringify({
                error: `No valid data points found in file ${filePath}`,
                suggestion: "Check if the CSV files contain valid data"
            });
        }

        // Extract X axis data
        const xAxisData = dataRows.map((p: MultiFileDataPoint) => p.x);
        combinedXAxisData = [...new Set([...combinedXAxisData, ...xAxisData])];
        
        // Create the series
        allSeries.push({
            label: label || `${yAxisColumn} (${filePath.split('/').pop()})`,
            column: yAxisColumn,
            color,
            data: dataRows.map((p: MultiFileDataPoint) => p.y),
            tooltipData: dataRows.map((p: MultiFileDataPoint) => p.tooltip),
            xData: xAxisData, // Keep original x data for each series
            sourceFile: filePath,
            tooltipColumn
        });
    }

    // Sort the combined X axis data if it looks like dates or numbers
    if (combinedXAxisData.length > 0) {
        // Check if the values appear to be numbers
        const areNumbers = combinedXAxisData.every(x => !isNaN(Number(x)));
        
        if (areNumbers) {
            combinedXAxisData.sort((a, b) => Number(a) - Number(b));
        } else {
            // Try to parse as dates, if they seem to be dates
            const datePattern = /^\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{4}|\d{1,2}[-/]\d{1,2}[-/]\d{2}$/;
            const areDates = combinedXAxisData.some(x => datePattern.test(x));
            
            if (areDates) {
                try {
                    combinedXAxisData.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
                } catch {
                    // If date parsing fails, sort alphabetically
                    combinedXAxisData.sort();
                }
            } else {
                // Default to alphabetical sort
                combinedXAxisData.sort();
            }
        }
    }

    // Default title if none provided
    const defaultTitle = dataSeries.length === 1 
        ? `${dataSeries[0].yAxisColumn} vs ${dataSeries[0].xAxisColumn}`
        : `Comparison of multiple data series`;

    // Create plot configuration
    const plotConfig = {
        messageContentType: 'plot_data',
        plotType,
        title: title || defaultTitle,
        xAxis: {
            label: xAxisLabel || dataSeries[0].xAxisColumn,
            data: combinedXAxisData
        },
        series: allSeries,
        sourceFiles,
        isMultiSource: true
    };
    
    // Generate HTML with Plotly
    const htmlContent = await generatePlotlyHtml(plotConfig);
    
    // Generate a unique filename for the HTML file
    const fileBaseName = sourceFiles.map(f => path.basename(f, '.csv')).join('_');
    const htmlFileName = `plots/${plotType}_data_${fileBaseName}_${Date.now()}.html`;
    
    // Save HTML file to S3
    const chatSessionId = getChatSessionId();
    if (!chatSessionId) {
        return JSON.stringify({
            error: "No chat session ID found",
            suggestion: "Make sure you're in a valid chat session"
        });
    }
    
    try {
        // Write the HTML file
        const writeResult = await writeFile.invoke({
            filename: htmlFileName,
            content: htmlContent
        });
        
        const writeResultObj = JSON.parse(writeResult);
        if (writeResultObj.error) {
            throw new Error(writeResultObj.error);
        }
        
        // Return success with file path
        return JSON.stringify({
            ...plotConfig,
            htmlFile: htmlFileName,
            renderType: 'asset'
        });
    } catch (error: any) {
        return JSON.stringify({
            error: `Failed to save HTML file: ${error.message}`,
            suggestion: "Check S3 permissions and try again"
        });
    }
}
