'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  Box,
  Button,
  IconButton,
  Collapse,
  Divider,
  LinearProgress,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Schema as SchemaIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  Psychology as AIIcon,
  TrendingUp as SimilarityIcon,
  AccountTree as RelationIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';

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

interface SchemaCardProps {
  schema: Schema;
  similarity?: number;
  relatedSchemas?: Schema[];
  onViewDetails?: (schema: Schema) => void;
}

const SchemaCard: React.FC<SchemaCardProps> = ({
  schema,
  similarity,
  relatedSchemas,
  onViewDetails
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showRelated, setShowRelated] = useState(false);
  const router = useRouter();

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(schema);
    } else {
      router.push(`/schemas/${schema.id}`);
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

  const getScopeColor = (scope: string) => {
    switch (scope.toLowerCase()) {
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

  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 0.8) return 'success';
    if (similarity >= 0.6) return 'warning';
    return 'error';
  };

  const formatVersion = (identity: Schema['schemaIdentity']) => {
    return `${identity.schemaVersionMajor}.${identity.schemaVersionMinor}.${identity.schemaVersionPatch}`;
  };

  const getSchemaProperties = (schemaObj: any) => {
    if (!schemaObj || typeof schemaObj !== 'object') return [];
    
    const properties = schemaObj.properties || {};
    return Object.keys(properties).slice(0, 5); // Show first 5 properties
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        position: 'relative',
        '&:hover': {
          boxShadow: 4,
          transform: 'translateY(-2px)',
          transition: 'all 0.2s ease-in-out'
        }
      }}
    >
      {/* Similarity Indicator */}
      {similarity !== undefined && (
        <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}>
          <Tooltip title={`Similarity: ${(similarity * 100).toFixed(1)}%`}>
            <Chip
              icon={<AIIcon />}
              label={`${(similarity * 100).toFixed(0)}%`}
              size="small"
              color={getSimilarityColor(similarity)}
              variant="filled"
            />
          </Tooltip>
        </Box>
      )}

      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        {/* Header */}
        <Box sx={{ mb: 2, pr: similarity !== undefined ? 6 : 0 }}>
          <Typography variant="h6" component="h3" gutterBottom>
            {schema.schemaIdentity.entityType}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {schema.schemaIdentity.authority}:{schema.schemaIdentity.source}
          </Typography>
        </Box>

        {/* Status and Scope Chips */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Chip
            label={schema.status}
            size="small"
            color={getStatusColor(schema.status)}
            variant="outlined"
          />
          <Chip
            label={schema.scope}
            size="small"
            color={getScopeColor(schema.scope)}
            variant="outlined"
          />
          <Chip
            label={`v${formatVersion(schema.schemaIdentity)}`}
            size="small"
            variant="outlined"
          />
        </Box>

        {/* Schema Properties Preview */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Properties:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {getSchemaProperties(schema.schema).map((prop, index) => (
              <Chip
                key={index}
                label={prop}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.7rem', height: 20 }}
              />
            ))}
            {getSchemaProperties(schema.schema).length === 0 && (
              <Typography variant="body2" color="text.disabled">
                No properties available
              </Typography>
            )}
          </Box>
        </Box>

        {/* Metadata */}
        <Typography variant="caption" color="text.secondary">
          Updated: {formatDate(schema.updatedAt)}
        </Typography>
      </CardContent>

      {/* Actions */}
      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        <Box>
          <Button
            size="small"
            startIcon={<ViewIcon />}
            onClick={handleViewDetails}
          >
            View Details
          </Button>
        </Box>
        
        <Box>
          {relatedSchemas && relatedSchemas.length > 0 && (
            <Tooltip title="View Related Schemas">
              <IconButton
                size="small"
                onClick={() => setShowRelated(!showRelated)}
                color={showRelated ? 'primary' : 'default'}
              >
                <RelationIcon />
              </IconButton>
            </Tooltip>
          )}
          
          <Tooltip title="Expand Details">
            <IconButton
              size="small"
              onClick={handleExpandClick}
              color={expanded ? 'primary' : 'default'}
            >
              {expanded ? <CollapseIcon /> : <ExpandIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      </CardActions>

      {/* Expanded Content */}
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Divider />
        <CardContent sx={{ pt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Schema Details
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>ID:</strong> {schema.id}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Created By:</strong> {schema.createdBy}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Created:</strong> {formatDate(schema.createdAt)}
            </Typography>
          </Box>

          {/* Schema Structure Preview */}
          {schema.schema && (
            <Box>
              <Typography variant="body2" gutterBottom>
                <strong>Schema Structure:</strong>
              </Typography>
              <Box
                sx={{
                  bgcolor: 'grey.50',
                  p: 1,
                  borderRadius: 1,
                  maxHeight: 200,
                  overflow: 'auto',
                  fontSize: '0.75rem',
                  fontFamily: 'monospace'
                }}
              >
                <pre>{JSON.stringify(schema.schema, null, 2).slice(0, 500)}...</pre>
              </Box>
            </Box>
          )}
        </CardContent>
      </Collapse>

      {/* Related Schemas */}
      <Collapse in={showRelated} timeout="auto" unmountOnExit>
        <Divider />
        <CardContent sx={{ pt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Related Schemas
          </Typography>
          
          {relatedSchemas && relatedSchemas.length > 0 ? (
            <List dense>
              {relatedSchemas.slice(0, 3).map((relatedSchema, index) => (
                <ListItem key={index} sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <SchemaIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={relatedSchema.schemaIdentity.entityType}
                    secondary={`${relatedSchema.schemaIdentity.authority}:${relatedSchema.schemaIdentity.source}`}
                    primaryTypographyProps={{ variant: 'body2' }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                </ListItem>
              ))}
              {relatedSchemas.length > 3 && (
                <ListItem sx={{ px: 0 }}>
                  <ListItemText
                    primary={`+${relatedSchemas.length - 3} more related schemas`}
                    primaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                  />
                </ListItem>
              )}
            </List>
          ) : (
            <Typography variant="body2" color="text.disabled">
              No related schemas found
            </Typography>
          )}
        </CardContent>
      </Collapse>
    </Card>
  );
};

export default SchemaCard;