import React from 'react';
import { Theme } from '@mui/material/styles';
import { Typography } from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { Message } from '@/../utils/types';

// Import Cloudscape components directly
import Table from '@cloudscape-design/components/table';
import Pagination from '@cloudscape-design/components/pagination';

const TextToTableToolComponent = ({ content, theme }: {
    content: Message['content'],
    theme: Theme
}) => {
    const [currentPage, setCurrentPage] = React.useState(0);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [tableData, setTableData] = React.useState<{
        columns?: string[];
        data?: Array<Record<string, string | undefined>>;
        matchedFileCount?: number;
        messageContentType?: string;
    } | null>(null);
    const [error, setError] = React.useState<boolean>(false);

    // Parse the table data when the component mounts or content changes
    React.useEffect(() => {
        try {
            const parsedData = JSON.parse((content as any)?.text || '{}');
            // Filter out relevanceScore and relevanceExplanation columns
            if (parsedData.columns) {
                parsedData.columns = parsedData.columns.filter((col: string) =>
                    col !== 'relevanceScore' && col !== 'relevanceExplanation'
                );
                // Also remove these fields from the data objects
                if (parsedData.data) {
                    parsedData.data = parsedData.data.map((row: Record<string, string | undefined>) => {
                        const newRow = { ...row };
                        delete newRow.relevanceScore;
                        delete newRow.relevanceExplanation;
                        return newRow;
                    });
                }
            }
            setTableData(parsedData);
            setError(false);
        } catch {
            setTableData(null);
            setError(true);
        }
    }, [content]);

    const rowsPerPage = 5;
    const totalPages = React.useMemo(() =>
        Math.ceil((tableData?.data?.length || 0) / rowsPerPage),
        [tableData]
    );

    const handlePageChange = React.useCallback((newPage: number) => {
        // Ensure the new page is within bounds
        const boundedPage = Math.max(0, Math.min(newPage, totalPages - 1));
        setCurrentPage(boundedPage);
    }, [totalPages]);

    const paginatedData = React.useMemo(() =>
        tableData?.data?.slice(
            currentPage * rowsPerPage,
            (currentPage + 1) * rowsPerPage
        ) || [],
        [tableData, currentPage, rowsPerPage]
    );

    // Effect to maintain scroll position
    React.useEffect(() => {
        if (containerRef.current) {
            const container = containerRef.current;
            const rect = container.getBoundingClientRect();
            const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;

            if (!isVisible) {
                container.scrollIntoView({ behavior: 'instant', block: 'nearest' });
            }
        }
    }, [currentPage]);

    // If there's an error processing the table data
    if (error) {
        return (
            <div style={{
                backgroundColor: theme.palette.error.light,
                color: theme.palette.error.contrastText,
                padding: theme.spacing(2),
                borderRadius: theme.shape.borderRadius,
                margin: theme.spacing(1, 0)
            }}>
                <Typography variant="subtitle2" fontWeight="bold">
                    Error processing table data
                </Typography>
                <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem' }}>
                    {(content as any)?.text}
                </pre>
            </div>
        );
    }

    // If there's no valid table data
    if (!tableData || !tableData.columns || !tableData.data) {
        return (
            <div style={{
                backgroundColor: theme.palette.grey[100],
                padding: theme.spacing(2),
                borderRadius: theme.shape.borderRadius
            }}>
                <Typography variant="body2" color="error">
                    Invalid table data format
                </Typography>
                <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem' }}>
                    {(content as any)?.text}
                </pre>
            </div>
        );
    }

    // Render the table
    return (
        <div ref={containerRef} style={{
            width: '100%',
            overflowX: 'auto'
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: theme.spacing(1.5),
                color: theme.palette.primary.main
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: theme.spacing(1)
                }}>
                    <DescriptionIcon />
                    <Typography variant="subtitle1" fontWeight="medium">
                        {tableData.messageContentType === 'tool_table' ? 'Table Data' : 'Table View'}
                    </Typography>
                </div>
            </div>

            {/* Cloudscape Table */}
            <div className="cloudscape-table-wrapper">
                <Table
                    variant="borderless"
                    stripedRows={false}
                    columnDefinitions={tableData.columns?.map((col: string) => ({
                        id: col,
                        header: col,
                        cell: (item: Record<string, string | undefined>) => {
                            const cellValue = String(item[col] || '');
                            const hasFilePath = !!item.FilePath;
                            
                            return (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '4px',
                                    maxHeight: '100px',
                                    overflow: 'auto',
                                    whiteSpace: 'pre-wrap'
                                }}>
                                    {item.error && col === tableData.columns?.[0] ? (
                                        <span style={{ color: '#d13212' }}>
                                            {item.error}
                                        </span>
                                    ) : (
                                        <>
                                            {cellValue}
                                            {hasFilePath && col === tableData.columns?.[0] && (
                                                <VisibilityIcon
                                                    fontSize="small"
                                                    style={{
                                                        fontSize: '14px',
                                                        opacity: 0.6,
                                                        color: theme.palette.primary.main,
                                                        flexShrink: 0
                                                    }}
                                                />
                                            )}
                                        </>
                                    )}
                                </div>
                            );
                        },
                        width: col === 'FilePath' ? 200 : undefined,
                        minWidth: 120
                    })) || []}
                    items={paginatedData}
                    onRowClick={({ detail }) => {
                        const item = detail.item as Record<string, string | undefined>;
                        const hasFilePath = !!item.FilePath;
                        if (hasFilePath && item.FilePath) {
                            const pathWithOriginRemoved = item.FilePath.startsWith('http')
                                ? new URL(item.FilePath).pathname
                                : item.FilePath;
                            const encodedPath = pathWithOriginRemoved.split('/').map((segment: string) => encodeURIComponent(segment)).join('/');
                            window.open(`${encodedPath}`, '_blank');
                        }
                    }}
                    trackBy="FilePath"
                    empty="No data available"
                    pagination={
                        totalPages > 1 ? (
                            <Pagination
                                currentPageIndex={currentPage + 1}
                                pagesCount={totalPages}
                                onChange={({ detail }) => handlePageChange(detail.currentPageIndex - 1)}
                            />
                        ) : undefined
                    }
                />
            </div>

            {tableData.matchedFileCount && (
                <Typography variant="caption" color="textSecondary" style={{
                    display: 'block',
                    marginTop: theme.spacing(1),
                    textAlign: 'right'
                }}>
                    Showing results from {tableData.matchedFileCount} matched files
                </Typography>
            )}
        </div>
    );
};

export default TextToTableToolComponent;
