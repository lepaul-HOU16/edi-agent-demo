import React from 'react';
import { Theme } from '@mui/material/styles';
import { Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip } from '@mui/material';
import BarChartIcon from '@mui/icons-material/BarChart';
import { Message } from '@/../utils/types';

interface LightweightPlotComponentProps {
  content: Message['content'];
  theme: Theme;
  chatSessionId: string;
}

const LightweightPlotComponent: React.FC<LightweightPlotComponentProps> = ({ content, theme }) => {
  const [plotData, setPlotData] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    try {
      const parsedData = JSON.parse((content as any)?.text || '{}');
      setPlotData(parsedData);
      setError(null);
    } catch (e: any) {
      setError(`Error parsing plot data: ${e.message}`);
    }
  }, [content]);

  if (error) {
    return (
      <Box sx={{
        padding: theme.spacing(2),
        border: `1px solid ${theme.palette.error.main}`,
        borderRadius: theme.shape.borderRadius,
        backgroundColor: theme.palette.error.light,
      }}>
        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
          Plot Error
        </Typography>
        <Typography variant="body2">{error}</Typography>
      </Box>
    );
  }

  if (!plotData) {
    return (
      <Box sx={{
        padding: theme.spacing(2),
        border: `1px solid ${theme.palette.grey[300]}`,
        borderRadius: theme.shape.borderRadius,
      }}>
        <Typography variant="body2">No plot data available</Typography>
      </Box>
    );
  }

  // Handle wells/seismic data (redirect to table view)
  if (plotData.wells || plotData.seismic) {
    return (
      <Box sx={{
        padding: theme.spacing(2),
        border: `1px solid ${theme.palette.info.main}`,
        borderRadius: theme.shape.borderRadius,
        backgroundColor: theme.palette.info.light,
      }}>
        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
          Map Data Detected
        </Typography>
        <Typography variant="body2">
          Wells: {plotData.wells?.features?.length || 0} | 
          Seismic: {plotData.seismic?.features?.length || 0}
        </Typography>
        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
          Use map visualization tools for geographic data
        </Typography>
      </Box>
    );
  }

  // Create simple data table for regular plot data
  const renderDataTable = () => {
    if (plotData.series && plotData.xAxis?.data) {
      const xData = plotData.xAxis.data;
      const series = plotData.series;

      return (
        <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell><strong>{plotData.xAxis.label || 'X'}</strong></TableCell>
                {series.map((s: any, idx: number) => (
                  <TableCell key={idx}><strong>{s.label}</strong></TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {xData.slice(0, 50).map((x: any, idx: number) => (
                <TableRow key={idx} hover>
                  <TableCell>{x}</TableCell>
                  {series.map((s: any, sIdx: number) => (
                    <TableCell key={sIdx}>
                      {s.data[idx] || 'N/A'}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      );
    }

    return (
      <Typography variant="body2" color="textSecondary">
        No tabular data available for visualization
      </Typography>
    );
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(1),
        marginBottom: theme.spacing(2),
        color: theme.palette.primary.main
      }}>
        <BarChartIcon />
        <Typography variant="h6" fontWeight="medium">
          {plotData.title || 'Data Visualization'}
        </Typography>
        <Chip 
          label="Table View" 
          size="small" 
          variant="outlined"
          sx={{ marginLeft: 'auto' }}
        />
      </Box>

      {/* Data Summary */}
      <Box sx={{ 
        marginBottom: theme.spacing(2),
        padding: theme.spacing(1.5),
        backgroundColor: theme.palette.grey[50],
        borderRadius: theme.shape.borderRadius,
        border: `1px solid ${theme.palette.grey[200]}`
      }}>
        <Typography variant="subtitle2" gutterBottom>Data Summary</Typography>
        <Typography variant="body2">
          X-Axis: {plotData.xAxis?.label || 'Unknown'} ({plotData.xAxis?.data?.length || 0} points)
        </Typography>
        <Typography variant="body2">
          Series: {plotData.series?.length || 0}
        </Typography>
        <Typography variant="body2">
          Plot Type: {plotData.plotType || 'Unknown'}
        </Typography>
      </Box>

      {/* Data Table */}
      {renderDataTable()}

      {/* Footer */}
      <Typography variant="caption" color="textSecondary" display="block" sx={{ marginTop: 2, textAlign: 'center' }}>
        Lightweight visualization - Deployment optimized
      </Typography>
    </Box>
  );
};

export default LightweightPlotComponent;
