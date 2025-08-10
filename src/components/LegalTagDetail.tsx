'use client';

import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Chip,
  Stack,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  Security as SecurityIcon,
  Public as PublicIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  DateRange as DateIcon,
  Description as DescriptionIcon,
  Category as CategoryIcon,
  Flag as FlagIcon
} from '@mui/icons-material';

interface LegalTag {
  id: string;
  name: string;
  description: string;
  properties: {
    countryOfOrigin?: string[];
    contractId?: string;
    expirationDate?: string;
    originator?: string;
    dataType?: string;
    securityClassification?: string;
    personalData?: string;
    exportClassification?: string;
  };
}

interface LegalTagDetailProps {
  legalTag: LegalTag;
}

const LegalTagDetail: React.FC<LegalTagDetailProps> = ({ legalTag }) => {
  const getSecurityClassificationColor = (classification?: string) => {
    switch (classification?.toLowerCase()) {
      case 'public':
        return 'success';
      case 'internal':
        return 'info';
      case 'confidential':
        return 'warning';
      case 'restricted':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not specified';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const getPersonalDataColor = (personalData?: string) => {
    switch (personalData?.toLowerCase()) {
      case 'none':
        return 'success';
      case 'personal':
        return 'warning';
      case 'sensitive personal':
        return 'error';
      case 'anonymous':
        return 'info';
      case 'pseudonymized':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Grid container spacing={3}>
        {/* Header Information */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <SecurityIcon color="primary" sx={{ fontSize: 32 }} />
                <Box>
                  <Typography variant="h5" component="h2" gutterBottom>
                    {legalTag.name}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {legalTag.description || 'No description provided'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Classification Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CategoryIcon color="primary" />
                Data Classification
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <DescriptionIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Data Type"
                    secondary={
                      <Chip
                        label={legalTag.properties.dataType || 'Not specified'}
                        size="small"
                        variant="outlined"
                        color="primary"
                      />
                    }
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <SecurityIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Security Classification"
                    secondary={
                      <Chip
                        label={legalTag.properties.securityClassification || 'Not set'}
                        size="small"
                        color={getSecurityClassificationColor(legalTag.properties.securityClassification)}
                        variant="filled"
                      />
                    }
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <PersonIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Personal Data"
                    secondary={
                      <Chip
                        label={legalTag.properties.personalData || 'Not specified'}
                        size="small"
                        color={getPersonalDataColor(legalTag.properties.personalData)}
                        variant="outlined"
                      />
                    }
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <PublicIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Export Classification"
                    secondary={legalTag.properties.exportClassification || 'Not specified'}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Legal and Geographic Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FlagIcon color="primary" />
                Legal & Geographic
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <BusinessIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Originator"
                    secondary={legalTag.properties.originator || 'Not specified'}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <DescriptionIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Contract ID"
                    secondary={legalTag.properties.contractId || 'Not specified'}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <DateIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Expiration Date"
                    secondary={formatDate(legalTag.properties.expirationDate)}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <FlagIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Countries of Origin"
                    secondary={
                      legalTag.properties.countryOfOrigin?.length ? (
                        <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 0.5 }}>
                          {legalTag.properties.countryOfOrigin.map((country, index) => (
                            <Chip
                              key={index}
                              label={country}
                              size="small"
                              variant="outlined"
                              color="primary"
                            />
                          ))}
                        </Stack>
                      ) : (
                        'No countries specified'
                      )
                    }
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Compliance Summary */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SecurityIcon color="primary" />
                Compliance Summary
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Security Level
                    </Typography>
                    <Chip
                      label={legalTag.properties.securityClassification || 'Not Set'}
                      color={getSecurityClassificationColor(legalTag.properties.securityClassification)}
                      variant="filled"
                    />
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Personal Data
                    </Typography>
                    <Chip
                      label={legalTag.properties.personalData || 'Not Specified'}
                      color={getPersonalDataColor(legalTag.properties.personalData)}
                      variant="outlined"
                    />
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Export Control
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {legalTag.properties.exportClassification || 'Not Specified'}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Jurisdictions
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {legalTag.properties.countryOfOrigin?.length || 0} Countries
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default LegalTagDetail;