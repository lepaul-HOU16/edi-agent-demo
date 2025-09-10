"use client";

import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Container, Box, Typography, Paper } from '@mui/material';
import { AnalysisResultsVisualization, SampleAnalysisResults } from '../../components/AnalysisResultsVisualization';
import { RealAnalysisResultsVisualization } from '../../components/RealAnalysisResultsVisualization';

// Create a theme that matches your application
const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#1976d2',
        },
        secondary: {
            main: '#dc004e',
        },
        success: {
            main: '#2e7d32',
        },
        warning: {
            main: '#ed6c02',
        },
        error: {
            main: '#d32f2f',
        },
        info: {
            main: '#0288d1',
        },
    },
});

// Sample data for different scenarios
const complexAnalysisData = {
    methods: [
        {
            name: 'Linear Regression',
            value: 0.000,
            confidence: 'high' as const,
            alpha: 0.164,
            status: 'completed' as const
        },
        {
            name: 'Polynomial (2nd Order)',
            value: 0.025,
            confidence: 'medium' as const,
            alpha: 0.089,
            status: 'completed' as const
        },
        {
            name: 'Exponential Decay',
            value: 0.156,
            confidence: 'low' as const,
            alpha: 0.234,
            status: 'completed' as const
        },
        {
            name: 'Neural Network',
            value: 0.078,
            confidence: 'medium' as const,
            alpha: 0.112,
            status: 'processing' as const
        },
        {
            name: 'Random Forest',
            value: 0.0,
            confidence: 'high' as const,
            status: 'failed' as const
        }
    ],
    bestMethod: 'Linear Regression',
    dataset: {
        totalCount: 1547821,
        analyzedCount: 1547821,
        sourceFiles: [
            'production_data_2024_Q1.csv',
            'production_data_2024_Q2.csv',
            'well_measurements_jan_mar.csv',
            'geological_survey_north_field.csv',
            'pressure_readings_2024.csv',
            'flow_rate_sensors_data.csv'
        ],
        columns: [
            'Date', 'Well_ID', 'Production_Rate', 'Pressure', 'Temperature', 
            'Flow_Rate', 'Gas_Oil_Ratio', 'Water_Cut', 'Choke_Size', 'Pump_Speed'
        ],
        dataTypes: {
            'Date': 'datetime64[ns]',
            'Well_ID': 'object',
            'Production_Rate': 'float64',
            'Pressure': 'float64',
            'Temperature': 'float64',
            'Flow_Rate': 'float64',
            'Gas_Oil_Ratio': 'float64',
            'Water_Cut': 'float64',
            'Choke_Size': 'int64',
            'Pump_Speed': 'float64'
        }
    },
    plotPath: 'plots/gamma_regression_analysis.html',
    completionTime: new Date().toLocaleString()
};

const smallDatasetAnalysis = {
    methods: [
        {
            name: 'Linear',
            value: 0.045,
            confidence: 'medium' as const,
            alpha: 0.089,
            status: 'completed' as const
        },
        {
            name: 'Quadratic',
            value: 0.023,
            confidence: 'high' as const,
            alpha: 0.156,
            status: 'completed' as const
        }
    ],
    bestMethod: 'Quadratic',
    dataset: {
        totalCount: 342,
        analyzedCount: 342,
        sourceFiles: [
            'test_well_data.csv'
        ],
        columns: ['Time', 'Rate', 'Pressure'],
        dataTypes: {
            'Time': 'datetime64[ns]',
            'Rate': 'float64',
            'Pressure': 'float64'
        }
    },
    plotPath: 'plots/small_dataset_analysis.html',
    completionTime: new Date().toLocaleString()
};

export default function AnalysisDemoPage() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Container maxWidth="xl" sx={{ py: 4 }}>
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h3" component="h1" gutterBottom align="center">
                        Enhanced Analysis Results Visualization
                    </Typography>
                    <Typography variant="h6" color="text.secondary" align="center" sx={{ mb: 4 }}>
                        Comprehensive data analysis dashboard with proper dataset size display
                    </Typography>
                </Box>

                {/* Real Data Analysis - Shows actual LAS files from global directory */}
                <Paper elevation={3} sx={{ mb: 6, p: 2, border: '3px solid #2e7d32' }}>
                    <Typography variant="h4" gutterBottom sx={{ mb: 1, textAlign: 'center', color: 'success.main' }}>
                        🔍 Real Data Analysis - Live Global Directory Scan
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary" align="center" sx={{ mb: 3 }}>
                        This connects to your actual global directory and shows the real count of LAS files
                    </Typography>
                    <RealAnalysisResultsVisualization theme={theme} />
                </Paper>

                {/* Large Dataset Example */}
                <Paper elevation={3} sx={{ mb: 6, p: 2 }}>
                    <Typography variant="h4" gutterBottom sx={{ mb: 3, textAlign: 'center' }}>
                        Large Dataset Analysis (1.5M+ Records) - Sample Data
                    </Typography>
                    <AnalysisResultsVisualization {...complexAnalysisData} theme={theme} />
                </Paper>

                {/* Small Dataset Example */}
                <Paper elevation={3} sx={{ mb: 6, p: 2 }}>
                    <Typography variant="h4" gutterBottom sx={{ mb: 3, textAlign: 'center' }}>
                        Small Dataset Analysis (342 Records)
                    </Typography>
                    <AnalysisResultsVisualization {...smallDatasetAnalysis} theme={theme} />
                </Paper>

                {/* Default Sample */}
                <Paper elevation={3} sx={{ mb: 6, p: 2 }}>
                    <Typography variant="h4" gutterBottom sx={{ mb: 3, textAlign: 'center' }}>
                        Standard Analysis Example
                    </Typography>
                    <SampleAnalysisResults theme={theme} />
                </Paper>

                {/* Features Highlight */}
                <Box sx={{ mt: 6 }}>
                    <Typography variant="h4" gutterBottom align="center">
                        Key Features
                    </Typography>
                    <Box sx={{ mt: 3, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 3 }}>
                        <Paper elevation={2} sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom color="primary">
                                Dataset Size Display
                            </Typography>
                            <Typography variant="body2">
                                Clear visualization of total records, analyzed count, and source files with 
                                intelligent number formatting (K, M notation for large datasets).
                            </Typography>
                        </Paper>
                        
                        <Paper elevation={2} sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom color="primary">
                                Method Comparison
                            </Typography>
                            <Typography variant="body2">
                                Side-by-side comparison of different analysis methods with confidence levels,
                                statistical parameters, and clear indication of the best performing method.
                            </Typography>
                        </Paper>
                        
                        <Paper elevation={2} sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom color="primary">
                                Progress Tracking
                            </Typography>
                            <Typography variant="body2">
                                Real-time status indication for each method (completed, processing, failed)
                                with visual progress indicators and completion percentages.
                            </Typography>
                        </Paper>
                        
                        <Paper elevation={2} sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom color="primary">
                                Data Source Details
                            </Typography>
                            <Typography variant="body2">
                                Comprehensive overview of data sources, column information, and data types
                                for full transparency in the analysis process.
                            </Typography>
                        </Paper>
                    </Box>
                </Box>
            </Container>
        </ThemeProvider>
    );
}
