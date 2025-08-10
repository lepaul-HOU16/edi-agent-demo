'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Alert,
  Paper,
  Grid,
  Stack
} from '@mui/material';
import {
  History as HistoryIcon,
  NewReleases as NewIcon,
  Update as UpdateIcon,
  BugReport as BugIcon,
  Visibility as ViewIcon,
  Compare as CompareIcon,
  Download as DownloadIcon
} from '@mui/icons-material';

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

interface SchemaVersion {
  version: string;
  versionMajor: number;
  versionMinor: number;
  versionPatch: number;
  status: string;
  createdBy: string;
  createdAt: string;
  changeType: 'major' | 'minor' | 'patch';
  changeDescription: string;
  schema?: any;
}

interface SchemaVersionHistoryProps {
  schema: Schema;
  onVersionSelect: (version: SchemaVersion) => void;
}

const SchemaVersionHistory: React.FC<SchemaVersionHistoryProps> = ({
  schema,
  onVersionSelect
}) => {
  const [versions, setVersions] = useState<SchemaVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<SchemaVersion | null>(null);
  const [compareDialogOpen, setCompareDialogOpen] = useState(false);
  const [compareVersion, setCompareVersion] = useState<SchemaVersion | null>(null);

  useEffect(() => {
    if (schema) {
      generateVersionHistory();
    }
  }, [schema]);

  const generateVersionHistory = () => {
    // Mock version history generation
    const currentVersion: SchemaVersion = {
      version: `${schema.schemaIdentity.schemaVersionMajor}.${schema.schemaIdentity.schemaVersionMinor}.${schema.schemaIdentity.schemaVersionPatch}`,
      versionMajor: schema.schemaIdentity.schemaVersionMajor,
      versionMinor: schema.schemaIdentity.schemaVersionMinor,
      versionPatch: schema.schemaIdentity.schemaVersionPatch,
      status: schema.status,
      createdBy: schema.updatedBy,
      createdAt: schema.updatedAt,
      changeType: 'minor',
      changeDescription: 'Updated schema with new field validations and improved documentation',
      schema: schema.schema
    };

    // Generate mock previous versions
    const mockVersions: SchemaVersion[] = [
      currentVersion,
      {
        version: `${schema.schemaIdentity.schemaVersionMajor}.${schema.schemaIdentity.schemaVersionMinor}.${schema.schemaIdentity.schemaVersionPatch - 1}`,
        versionMajor: schema.schemaIdentity.schemaVersionMajor,
        versionMinor: schema.schemaIdentity.schemaVersionMinor,
        versionPatch: schema.schemaIdentity.schemaVersionPatch - 1,
        status: 'published',
        createdBy: 'system.admin',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        changeType: 'patch',
        changeDescription: 'Fixed validation rules for required fields'
      },
      {
        version: `${schema.schemaIdentity.schemaVersionMajor}.${schema.schemaIdentity.schemaVersionMinor - 1}.0`,
        versionMajor: schema.schemaIdentity.schemaVersionMajor,
        versionMinor: schema.schemaIdentity.schemaVersionMinor - 1,
        versionPatch: 0,
        status: 'deprecated',
        createdBy: 'schema.maintainer',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        changeType: 'minor',
        changeDescription: 'Added new optional fields for enhanced data capture'
      },
      {
        version: `${schema.schemaIdentity.schemaVersionMajor - 1}.0.0`,
        versionMajor: schema.schemaIdentity.schemaVersionMajor - 1,
        versionMinor: 0,
        versionPatch: 0,
        status: 'deprecated',
        createdBy: 'initial.creator',
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        changeType: 'major',
        changeDescription: 'Initial schema creation with core data structure'
      }
    ];

    setVersions(mockVersions);
  };

  const getChangeTypeIcon = (changeType: string) => {
    switch (changeType) {
      case 'major':
        return <NewIcon color="error" />;
      case 'minor':
        return <UpdateIcon color="warning" />;
      case 'patch':
        return <BugIcon color="success" />;
      default:
        return <HistoryIcon />;
    }
  };

  const getChangeTypeColor = (changeType: string) => {
    switch (changeType) {
      case 'major':
        return 'error';
      case 'minor':
        return 'warning';
      case 'patch':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handleVersionView = (version: SchemaVersion) => {
    setSelectedVersion(version);
    onVersionSelect(version);
  };

  const handleCompareVersions = (version: SchemaVersion) => {
    setCompareVersion(version);
    setCompareDialogOpen(true);
  };

  const handleDownloadVersion = (version: SchemaVersion) => {
    if (version.schema) {
      const dataStr = JSON.stringify(version.schema, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `${schema.schemaIdentity.entityType}-v${version.version}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    }
  };

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Version History:</strong> Track changes and evolution of this schema over time. 
          Each version shows the type of change (major, minor, patch) and detailed change descriptions.
        </Typography>
      </Alert>

      <Grid container spacing={3}>
        {/* Version Timeline */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Version Timeline
              </Typography>
              
              <Stack spacing={2}>
                {versions.map((version, index) => (
                  <Box key={version.version} sx={{ display: 'flex', gap: 2 }}>
                    {/* Version Icon */}
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center',
                      minWidth: 40
                    }}>
                      <Box sx={{ 
                        width: 40, 
                        height: 40, 
                        borderRadius: '50%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        bgcolor: `${getChangeTypeColor(version.changeType)}.main`,
                        color: 'white'
                      }}>
                        {getChangeTypeIcon(version.changeType)}
                      </Box>
                      {index < versions.length - 1 && (
                        <Box sx={{ 
                          width: 2, 
                          height: 40, 
                          bgcolor: 'divider', 
                          mt: 1 
                        }} />
                      )}
                    </Box>
                    
                    {/* Version Content */}
                    <Box sx={{ flex: 1 }}>
                      <Card 
                        variant="outlined" 
                        sx={{ 
                          border: selectedVersion?.version === version.version ? 2 : 1,
                          borderColor: selectedVersion?.version === version.version ? 'primary.main' : 'divider'
                        }}
                      >
                        <CardContent sx={{ py: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="h6">
                                v{version.version}
                              </Typography>
                              <Chip
                                label={version.changeType}
                                size="small"
                                color={getChangeTypeColor(version.changeType)}
                                variant="outlined"
                              />
                              <Chip
                                label={version.status}
                                size="small"
                                color={getStatusColor(version.status)}
                                variant="filled"
                              />
                            </Box>
                            
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Button
                                size="small"
                                startIcon={<ViewIcon />}
                                onClick={() => handleVersionView(version)}
                                variant={selectedVersion?.version === version.version ? 'contained' : 'outlined'}
                              >
                                View
                              </Button>
                              {version.schema && (
                                <Button
                                  size="small"
                                  startIcon={<DownloadIcon />}
                                  onClick={() => handleDownloadVersion(version)}
                                  variant="outlined"
                                >
                                  Download
                                </Button>
                              )}
                              {index > 0 && (
                                <Button
                                  size="small"
                                  startIcon={<CompareIcon />}
                                  onClick={() => handleCompareVersions(version)}
                                  variant="outlined"
                                >
                                  Compare
                                </Button>
                              )}
                            </Box>
                          </Box>
                          
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            {version.changeDescription}
                          </Typography>
                          
                          <Typography variant="caption" color="text.secondary">
                            Created by {version.createdBy} on {formatDate(version.createdAt)}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Box>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Version Details */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Version Details
              </Typography>
              
              {selectedVersion ? (
                <Box>
                  <Typography variant="body1" gutterBottom>
                    <strong>Version:</strong> {selectedVersion.version}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Change Type:</strong> {selectedVersion.changeType}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Status:</strong> {selectedVersion.status}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Created By:</strong> {selectedVersion.createdBy}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Created At:</strong> {formatDate(selectedVersion.createdAt)}
                  </Typography>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="body2" gutterBottom>
                    <strong>Change Description:</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedVersion.changeDescription}
                  </Typography>
                  
                  {selectedVersion.schema && (
                    <Box sx={{ mt: 2 }}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={() => handleDownloadVersion(selectedVersion)}
                      >
                        Download This Version
                      </Button>
                    </Box>
                  )}
                </Box>
              ) : (
                <Typography variant="body2" color="text.disabled">
                  Select a version to view details
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Compare Dialog */}
      <Dialog
        open={compareDialogOpen}
        onClose={() => setCompareDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Compare Schema Versions
        </DialogTitle>
        <DialogContent>
          {compareVersion && (
            <Box>
              <Typography variant="body1" gutterBottom>
                Comparing v{versions[0].version} (current) with v{compareVersion.version}
              </Typography>
              
              <Alert severity="info" sx={{ mb: 2 }}>
                Schema comparison functionality would show detailed differences between versions here.
                This could include added/removed fields, changed validation rules, and structural modifications.
              </Alert>
              
              <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="body2" color="text.secondary">
                  Detailed schema diff would be displayed here in a future implementation.
                </Typography>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompareDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SchemaVersionHistory;