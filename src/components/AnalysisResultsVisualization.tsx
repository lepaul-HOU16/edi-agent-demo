import React, { useMemo } from 'react';
import { 
    Card, 
    CardContent, 
    Typography, 
    Box, 
    Chip, 
    Grid, 
    LinearProgress,
    Divider,
    Stack,
    Paper,
    CircularProgress
} from '@mui/material';
import { Theme } from '@mui/material/styles';
import { 
    TrendingUp, 
    Assessment, 
    DataUsage, 
    CheckCircle, 
    Info,
    Analytics,
    Storage,
    Timeline
} from '@mui/icons-material';

interface AnalysisMethod {
    name: string;
    value: number;
    confidence: string;
    alpha?: number;
    status: 'completed' | 'processing' | 'failed';
    color?: string;
}

interface DatasetInfo {
    totalCount: number;
    analyzedCount: number;
    sourceFiles: string[];
    columns: string[];
    dataTypes: Record<string, string>;
}

interface AnalysisResultsProps {
    methods: AnalysisMethod[];
    bestMethod: string;
    dataset: DatasetInfo;
    plotPath?: string;
    completionTime?: string;
    theme: Theme;
}

export const AnalysisResultsVisualization: React.FC<AnalysisResultsProps> = ({
    methods,
    bestMethod,
    dataset,
    plotPath,
    completionTime,
    theme
}) => {
    // Calculate completion percentage
    const completionPercentage = useMemo(() => {
        const completedMethods = methods.filter(m => m.status === 'completed').length;
        return (completedMethods / methods.length) * 100;
    }, [methods]);

    // Get the best method details
    const bestMethodDetails = useMemo(() => {
        return methods.find(m => m.name === bestMethod);
    }, [methods, bestMethod]);

    // Color mapping for method status
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return theme.palette.success.main;
            case 'processing': return theme.palette.warning.main;
            case 'failed': return theme.palette.error.main;
            default: return theme.palette.grey[500];
        }
    };

    // Format large numbers
    const formatNumber = (num: number) => {
        if (num >= 1000000) {
            return `${(num / 1000000).toFixed(1)}M`;
        } else if (num >= 1000) {
            return `${(num / 1000).toFixed(1)}K`;
        }
        return num.toString();
    };

    return (
        <Box sx={{ width: '100%', p: 2 }}>
            {/* Header */}
            <Box sx={{ mb: 3 }}>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                    <Assessment sx={{ color: theme.palette.primary.main, fontSize: 28 }} />
                    <Typography variant="h5" fontWeight="bold" color={theme.palette.primary.main}>
                        Analysis Results
                    </Typography>
                    <Chip 
                        label={`${completionPercentage.toFixed(0)}% Complete`}
                        color={completionPercentage === 100 ? "success" : "warning"}
                        size="small"
                    />
                </Stack>
                
                {completionTime && (
                    <Typography variant="body2" color="text.secondary">
                        Completed: {completionTime}
                    </Typography>
                )}
            </Box>

            <Grid container spacing={3}>
                {/* Method Results Section */}
                <Grid item xs={12} md={8}>
                    <Card elevation={2} sx={{ height: '100%' }}>
                        <CardContent>
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                                <TrendingUp sx={{ color: theme.palette.secondary.main }} />
                                <Typography variant="h6" fontWeight="medium">
                                    Method Results
                                </Typography>
                            </Stack>

                            <Stack spacing={3}>
                                {methods.map((method, index) => (
                                    <Box key={method.name}>
                                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                                            <Stack direction="row" alignItems="center" spacing={2}>
                                                <Typography variant="subtitle1" fontWeight="medium">
                                                    {method.name}
                                                </Typography>
                                                {method.name === bestMethod && (
                                                    <Chip 
                                                        icon={<CheckCircle />}
                                                        label="Best Result" 
                                                        color="success" 
                                                        size="small" 
                                                    />
                                                )}
                                            </Stack>
                                            <Chip 
                                                label={method.status}
                                                size="small"
                                                sx={{ 
                                                    backgroundColor: getStatusColor(method.status),
                                                    color: 'white',
                                                    textTransform: 'capitalize'
                                                }}
                                            />
                                        </Stack>

                                        <Box sx={{ 
                                            border: method.name === bestMethod ? `2px solid ${theme.palette.success.main}` : `1px solid ${theme.palette.grey[300]}`,
                                            borderRadius: 2,
                                            p: 2,
                                            backgroundColor: method.name === bestMethod ? theme.palette.success.light + '10' : 'transparent'
                                        }}>
                                            <Grid container spacing={2} alignItems="center">
                                                <Grid item xs={4}>
                                                    <Box sx={{ 
                                                        display: 'flex', 
                                                        flexDirection: 'column', 
                                                        alignItems: 'center',
                                                        p: 1
                                                    }}>
                                                        <Typography variant="h3" fontWeight="bold" color={theme.palette.primary.main}>
                                                            {method.value.toFixed(3)}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Primary Value
                                                        </Typography>
                                                    </Box>
                                                </Grid>
                                                
                                                <Grid item xs={8}>
                                                    <Stack spacing={1}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Chip 
                                                                label={`${method.confidence} confidence`}
                                                                color={method.confidence === 'high' ? 'success' : method.confidence === 'medium' ? 'warning' : 'error'}
                                                                size="small"
                                                            />
                                                            {method.alpha && (
                                                                <Typography variant="body2" color="text.secondary">
                                                                    α: {method.alpha.toFixed(3)}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                        
                                                        {method.status === 'completed' && (
                                                            <LinearProgress 
                                                                variant="determinate" 
                                                                value={100} 
                                                                color="success"
                                                                sx={{ height: 6, borderRadius: 3 }}
                                                            />
                                                        )}
                                                        
                                                        {method.status === 'processing' && (
                                                            <LinearProgress 
                                                                color="warning"
                                                                sx={{ height: 6, borderRadius: 3 }}
                                                            />
                                                        )}
                                                    </Stack>
                                                </Grid>
                                            </Grid>
                                        </Box>
                                        
                                        {index < methods.length - 1 && <Divider sx={{ mt: 2 }} />}
                                    </Box>
                                ))}
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Dataset Context Section */}
                <Grid item xs={12} md={4}>
                    <Stack spacing={3}>
                        {/* Dataset Size Card */}
                        <Card elevation={2} sx={{ backgroundColor: theme.palette.success.light + '15' }}>
                            <CardContent>
                                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                                    <DataUsage sx={{ color: theme.palette.success.main }} />
                                    <Typography variant="h6" fontWeight="medium">
                                        Data Context
                                    </Typography>
                                </Stack>

                                <Box sx={{ 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    alignItems: 'center',
                                    p: 2,
                                    backgroundColor: theme.palette.success.main,
                                    borderRadius: 2,
                                    color: 'white',
                                    mb: 2
                                }}>
                                    <Storage sx={{ fontSize: 32, mb: 1 }} />
                                    <Typography variant="h4" fontWeight="bold">
                                        {formatNumber(dataset.totalCount)}
                                    </Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                        DATA RECORDS
                                    </Typography>
                                </Box>

                                <Stack spacing={1}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Analyzed:
                                        </Typography>
                                        <Typography variant="body2" fontWeight="medium">
                                            {formatNumber(dataset.analyzedCount)}
                                        </Typography>
                                    </Box>
                                    
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Sources:
                                        </Typography>
                                        <Typography variant="body2" fontWeight="medium">
                                            {dataset.sourceFiles.length} files
                                        </Typography>
                                    </Box>
                                    
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Columns:
                                        </Typography>
                                        <Typography variant="body2" fontWeight="medium">
                                            {dataset.columns.length}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </CardContent>
                        </Card>

                        {/* Analysis Summary Card */}
                        <Card elevation={2}>
                            <CardContent>
                                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                                    <Analytics sx={{ color: theme.palette.primary.main }} />
                                    <Typography variant="h6" fontWeight="medium">
                                        Analysis Summary
                                    </Typography>
                                </Stack>

                                <Stack spacing={2}>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            Best Method:
                                        </Typography>
                                        <Chip 
                                            icon={<CheckCircle />}
                                            label={bestMethod}
                                            color="success"
                                            sx={{ fontWeight: 'bold' }}
                                        />
                                    </Box>

                                    <Box>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            Methods Tested:
                                        </Typography>
                                        <Typography variant="body1" fontWeight="medium">
                                            {methods.length}
                                        </Typography>
                                    </Box>

                                    {plotPath && (
                                        <Box>
                                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                                Visualization:
                                            </Typography>
                                            <Stack direction="row" alignItems="center" spacing={1}>
                                                <Timeline sx={{ fontSize: 16, color: theme.palette.info.main }} />
                                                <Typography variant="caption" color="info.main">
                                                    Available at {plotPath}
                                                </Typography>
                                            </Stack>
                                        </Box>
                                    )}
                                </Stack>
                            </CardContent>
                        </Card>
                    </Stack>
                </Grid>
            </Grid>

            {/* Source Files Details */}
            <Card elevation={1} sx={{ mt: 3 }}>
                <CardContent>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                        <Info sx={{ color: theme.palette.info.main }} />
                        <Typography variant="h6" fontWeight="medium">
                            Data Sources
                        </Typography>
                    </Stack>
                    
                    <Grid container spacing={2}>
                        {dataset.sourceFiles.map((file, index) => (
                            <Grid item xs={12} sm={6} md={4} key={index}>
                                <Paper 
                                    variant="outlined" 
                                    sx={{ 
                                        p: 1.5, 
                                        backgroundColor: theme.palette.grey[50],
                                        border: `1px solid ${theme.palette.grey[200]}`
                                    }}
                                >
                                    <Typography variant="body2" fontWeight="medium" noWrap>
                                        {file}
                                    </Typography>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                </CardContent>
            </Card>

            {/* Final Status */}
            <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                    Analysis complete with {methods.length} method{methods.length !== 1 ? 's' : ''}. 
                    Best result: <strong>{bestMethod}</strong>
                </Typography>
            </Box>
        </Box>
    );
};

// Default props for demonstration
export const SampleAnalysisResults: React.FC<{ theme: Theme }> = ({ theme }) => {
    const sampleData = {
        methods: [
            {
                name: 'Linear',
                value: 0.000,
                confidence: 'high' as const,
                alpha: 0.164,
                status: 'completed' as const
            },
            {
                name: 'Polynomial',
                value: 0.025,
                confidence: 'medium' as const,
                alpha: 0.089,
                status: 'completed' as const
            },
            {
                name: 'Exponential',
                value: 0.156,
                confidence: 'low' as const,
                alpha: 0.234,
                status: 'completed' as const
            }
        ],
        bestMethod: 'Linear',
        dataset: {
            totalCount: 15420,
            analyzedCount: 15420,
            sourceFiles: [
                'production_data_2024.csv',
                'well_measurements.csv',
                'geological_survey.csv'
            ],
            columns: ['Date', 'Production_Rate', 'Pressure', 'Temperature', 'Flow_Rate'],
            dataTypes: {
                'Date': 'datetime',
                'Production_Rate': 'float64',
                'Pressure': 'float64',
                'Temperature': 'float64',
                'Flow_Rate': 'float64'
            }
        },
        plotPath: 'plots/gamma_analysis_results.html',
        completionTime: new Date().toLocaleString()
    };

    return <AnalysisResultsVisualization {...sampleData} theme={theme} />;
};
