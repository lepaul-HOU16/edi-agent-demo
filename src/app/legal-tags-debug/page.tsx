'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Security as SecurityIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

// Debug version of legal tags page without authentication
const LegalTagsDebugPage: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkComponents = async () => {
      const info: any = {
        timestamp: new Date().toISOString(),
        components: {},
        services: {},
        errors: []
      };

      try {
        // Test if osduApiService can be imported
        const osduApiModule = await import('@/services/osduApiService');
        info.services.osduApi = osduApiModule.default ? 'Available' : 'Not available';
      } catch (error) {
        info.errors.push(`osduApiService import failed: ${error}`);
      }

      try {
        // Test if hooks can be imported
        const hooksModule = await import('@/hooks/useLegalTagOperations');
        info.components.useLegalTagOperations = hooksModule.useLegalTagOperations ? 'Available' : 'Not available';
      } catch (error) {
        info.errors.push(`useLegalTagOperations import failed: ${error}`);
      }

      try {
        // Test if components can be imported
        const formModule = await import('@/components/LegalTagForm');
        info.components.LegalTagForm = formModule.default ? 'Available' : 'Not available';
      } catch (error) {
        info.errors.push(`LegalTagForm import failed: ${error}`);
      }

      try {
        const detailModule = await import('@/components/LegalTagDetail');
        info.components.LegalTagDetail = detailModule.default ? 'Available' : 'Not available';
      } catch (error) {
        info.errors.push(`LegalTagDetail import failed: ${error}`);
      }

      try {
        const debugModule = await import('@/components/LegalTagDebug');
        info.components.LegalTagDebug = debugModule.default ? 'Available' : 'Not available';
      } catch (error) {
        info.errors.push(`LegalTagDebug import failed: ${error}`);
      }

      setDebugInfo(info);
      setLoading(false);
    };

    checkComponents();
  }, []);

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
          <CircularProgress size={48} sx={{ mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Running diagnostics...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <SecurityIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h3" component="h1">
            Legal Tags Debug Page
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Diagnostic information for legal tags functionality
        </Typography>
      </Box>

      {debugInfo.errors && debugInfo.errors.length > 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body2" fontWeight="medium">
            Import Errors Detected:
          </Typography>
          <ul style={{ margin: '8px 0', paddingLeft: '16px' }}>
            {debugInfo.errors.map((error: string, index: number) => (
              <li key={index}>
                <Typography variant="body2">{error}</Typography>
              </li>
            ))}
          </ul>
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Component Availability
          </Typography>
          {Object.entries(debugInfo.components || {}).map(([name, status]) => (
            <Box key={name} sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
              <Typography variant="body2">{name}:</Typography>
              <Typography 
                variant="body2" 
                color={status === 'Available' ? 'success.main' : 'error.main'}
              >
                {status as string}
              </Typography>
            </Box>
          ))}
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Service Availability
          </Typography>
          {Object.entries(debugInfo.services || {}).map(([name, status]) => (
            <Box key={name} sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
              <Typography variant="body2">{name}:</Typography>
              <Typography 
                variant="body2" 
                color={status === 'Available' ? 'success.main' : 'error.main'}
              >
                {status as string}
              </Typography>
            </Box>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Debug Information
          </Typography>
          <pre style={{ 
            background: '#f5f5f5', 
            padding: '16px', 
            borderRadius: '4px', 
            overflow: 'auto',
            fontSize: '12px'
          }}>
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Button 
          variant="contained" 
          onClick={() => window.location.href = '/legal-tags'}
          sx={{ mr: 2 }}
        >
          Try Legal Tags Page
        </Button>
        <Button 
          variant="outlined" 
          onClick={() => window.location.reload()}
        >
          Refresh Diagnostics
        </Button>
      </Box>
    </Container>
  );
};

export default LegalTagsDebugPage;