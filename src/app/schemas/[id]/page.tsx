'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Box,
  Chip,
  Button,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  Breadcrumbs,
  Link,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Paper
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  Edit as EditIcon,
  Psychology as AIIcon,
  AccountTree as RelationIcon,
  Code as CodeIcon,
  Info as InfoIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { withAuth } from '@/components/WithAuth';
import osduApi from '@/services/osduApiService';
import RelatedSchemas from '@/components/RelatedSchemas';
import SchemaVersionHistory from '@/components/SchemaVersionHistory';

interface Schema {
  id: string;
  schemaIdentity: {
    authority: string;
    source: string;
    entityType: string;
    schemaVersionMajor: number;
    schemaVersionMinor: number;
    schemaVersionPatch: number;
    id: string;
  };
  schema: any;
  status: string;
  scope: string;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`schema-tabpanel-${index}`}
      aria-labelledby={`schema-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const SchemaDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const schemaId = params.id as string;
  
  const [schema, setSchema] = useState<Schema | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [relatedSchemas, setRelatedSchemas] = useState<Schema[]>([]);

  useEffect(() => {
    if (schemaId) {
      loadSchema();
      loadRelatedSchemas();
    }
  }, [schemaId]);

  const loadSchema = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await osduApi.getSchema(schemaId);
      
      if (response?.getSchema) {
        setSchema(response.getSchema);
      } else {
        setError('Schema not found');
      }
    } catch (err) {
      console.error('Error loading schema:', err);
      setError('Failed to load schema. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadRelatedSchemas = async () => {
    try {
      // Use the semantic search API to find related schemas
      const response = await osduApi.findRelatedSchemas(schemaId, 8);
      
      if (response?.findRelatedSchemas?.results) {
        const related = response.findRelatedSchemas.results.map(result => result.schema);
        setRelatedSchemas(related);
      } else {
        // Fallback to regular schema listing
        const fallbackResponse = await osduApi.listSchemas('osdu', {}, { limit: 8 });
        
        if (fallbackResponse?.listSchemas?.items) {
          // Filter out current schema and take first 7 as related
          const related = fallbackResponse.listSchemas.items
            .filter(s => s.id !== schemaId)
            .slice(0, 7);
          setRelatedSchemas(related);
        }
      }
    } catch (err) {
      console.error('Error loading related schemas:', err);
      // Fallback to empty array
      setRelatedSchemas([]);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const handleDownload = () => {
    if (schema) {
      const dataStr = JSON.stringify(schema.schema, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `${schema.schemaIdentity.entityType}-schema.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `OSDU Schema: ${schema?.schemaIdentity.entityType}`,
          text: `Check out this OSDU schema: ${schema?.schemaIdentity.entityType}`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback to copying URL to clipboard
      navigator.clipboard.writeText(window.location.href);
      // You could show a toast notification here
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'published':
        return 'success';
      case 'development':
        return 'warning';
      case 'deprecated':
        return 'error';
      default:
        return 'default';
    }
  };

  const getScopeColor = (scope: string) => {
    switch (scope?.toLowerCase()) {
      case 'shared':
        return 'primary';
      case 'internal':
        return 'secondary';
      case 'private':
        return 'default';
      default:
        return 'default';
    }
  };

  const formatVersion = (identity: Schema['schemaIdentity']) => {
    return `${identity.schemaVersionMajor}.${identity.schemaVersionMinor}.${identity.schemaVersionPatch}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !schema) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'Schema not found'}
        </Alert>
        <Button
          startIcon={<BackIcon />}
          onClick={() => router.push('/schemas')}
        >
          Back to Schemas
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link
          component="button"
          variant="body1"
          onClick={() => router.push('/schemas')}
          sx={{ textDecoration: 'none' }}
        >
          Schemas
        </Link>
        <Typography color="text.primary">
          {schema.schemaIdentity.entityType}
        </Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => router.push('/schemas')}>
              <BackIcon />
            </IconButton>
            <Typography variant="h3" component="h1">
              {schema.schemaIdentity.entityType}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Download Schema">
              <IconButton onClick={handleDownload}>
                <DownloadIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Share Schema">
              <IconButton onClick={handleShare}>
                <ShareIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Typography variant="body1" color="text.secondary" gutterBottom>
          {schema.schemaIdentity.authority}:{schema.schemaIdentity.source}
        </Typography>

        {/* Status Chips */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            label={schema.status}
            color={getStatusColor(schema.status)}
            variant="filled"
          />
          <Chip
            label={schema.scope}
            color={getScopeColor(schema.scope)}
            variant="outlined"
          />
          <Chip
            label={`Version ${formatVersion(schema.schemaIdentity)}`}
            variant="outlined"
          />
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={selectedTab} onChange={handleTabChange}>
          <Tab icon={<InfoIcon />} label="Overview" iconPosition="start" />
          <Tab icon={<CodeIcon />} label="Schema Definition" iconPosition="start" />
          <Tab icon={<RelationIcon />} label="Related Schemas" iconPosition="start" />
          <Tab icon={<HistoryIcon />} label="Version History" iconPosition="start" />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      <TabPanel value={selectedTab} index={0}>
        {/* Overview */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Schema Information
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Schema ID:</strong>
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {schema.id}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Authority:</strong>
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {schema.schemaIdentity.authority}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Source:</strong>
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {schema.schemaIdentity.source}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Entity Type:</strong>
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {schema.schemaIdentity.entityType}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Created By:</strong>
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {schema.createdBy}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Created At:</strong>
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {formatDate(schema.createdAt)}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Updated By:</strong>
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {schema.updatedBy}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Updated At:</strong>
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {formatDate(schema.updatedAt)}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Quick Actions
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Button
                    startIcon={<DownloadIcon />}
                    onClick={handleDownload}
                    variant="outlined"
                    fullWidth
                  >
                    Download Schema
                  </Button>
                  
                  <Button
                    startIcon={<ShareIcon />}
                    onClick={handleShare}
                    variant="outlined"
                    fullWidth
                  >
                    Share Schema
                  </Button>
                  
                  <Button
                    startIcon={<AIIcon />}
                    onClick={() => setSelectedTab(2)}
                    variant="outlined"
                    fullWidth
                  >
                    Find Related Schemas
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={selectedTab} index={1}>
        {/* Schema Definition */}
        <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
          <Typography variant="h6" gutterBottom>
            JSON Schema Definition
          </Typography>
          <Box
            sx={{
              bgcolor: 'white',
              p: 2,
              borderRadius: 1,
              border: 1,
              borderColor: 'grey.300',
              maxHeight: 600,
              overflow: 'auto',
              fontFamily: 'monospace',
              fontSize: '0.875rem'
            }}
          >
            <pre>{JSON.stringify(schema.schema, null, 2)}</pre>
          </Box>
        </Paper>
      </TabPanel>

      <TabPanel value={selectedTab} index={2}>
        {/* Related Schemas */}
        <RelatedSchemas
          currentSchema={schema}
          relatedSchemas={relatedSchemas}
          onSchemaClick={(relatedSchema) => router.push(`/schemas/${relatedSchema.id}`)}
        />
      </TabPanel>

      <TabPanel value={selectedTab} index={3}>
        {/* Version History */}
        <SchemaVersionHistory
          schema={schema}
          onVersionSelect={(version) => {
            // In a real implementation, this would load the specific version
            console.log('Selected version:', version);
          }}
        />
      </TabPanel>
    </Container>
  );
};

export default withAuth(SchemaDetailPage);