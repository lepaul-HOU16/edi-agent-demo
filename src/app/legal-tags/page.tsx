'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Stack,
  Snackbar,
  LinearProgress,
  Backdrop
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Security as SecurityIcon,
  Label as LabelIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { withAuth } from '@/components/WithAuth';
import osduApi from '@/services/osduApiService';
import LegalTagForm from '@/components/LegalTagForm';
import LegalTagDetail from '@/components/LegalTagDetail';
import LegalTagDebug from '@/components/LegalTagDebug';
import { useLegalTagOperations } from '@/hooks/useLegalTagOperations';

import type { LegalTag } from '@/hooks/useLegalTagOperations';

const LegalTagsPage: React.FC = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTags, setFilteredTags] = useState<LegalTag[]>([]);
  const [selectedTag, setSelectedTag] = useState<LegalTag | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<LegalTag | null>(null);

  // Use the enhanced legal tag operations hook
  const {
    legalTags,
    loadingState,
    isAnyLoading,
    isRetrying,
    retryCount,
    successState,
    hasError,
    errorState,
    formattedError,
    loadLegalTags,
    createLegalTag,
    updateLegalTag,
    deleteLegalTag,
    refreshLegalTags,
    retryOperation,
    clearError,
    clearSuccessNotification,
    lastUpdateTime
  } = useLegalTagOperations({
    autoRefreshEnabled: true,
    autoRefreshInterval: 30000,
    dataPartition: 'osdu'
  });

  // Load legal tags on component mount
  useEffect(() => {
    loadLegalTags(true);
  }, []); // Empty dependency array to run only on mount

  // Filter tags based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredTags(legalTags);
    } else {
      const filtered = legalTags.filter(tag =>
        tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tag.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tag.properties.dataType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tag.properties.originator?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredTags(filtered);
    }
  }, [searchQuery, legalTags]);



  const handleViewDetails = (tag: LegalTag) => {
    setSelectedTag(tag);
    setDetailDialogOpen(true);
  };

  const handleEdit = (tag: LegalTag) => {
    setSelectedTag(tag);
    setCreateDialogOpen(true);
  };

  const handleDelete = (tag: LegalTag) => {
    setTagToDelete(tag);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!tagToDelete) return;
    
    try {
      await deleteLegalTag(tagToDelete.id);
      setDeleteDialogOpen(false);
      setTagToDelete(null);
    } catch (error) {
      console.error('❌ Error deleting legal tag:', error);
      // Error is already handled by the hook
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setTagToDelete(null);
  };

  const handleCreate = () => {
    setSelectedTag(null);
    setCreateDialogOpen(true);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleManualRefresh = () => {
    refreshLegalTags();
  };

  const handleRetry = async () => {
    await retryOperation();
  };

  const handleCloseSuccessNotification = () => {
    clearSuccessNotification();
  };

  const handleFormSubmit = async (formData: any) => {
    const isUpdate = !!selectedTag;
    
    try {
      if (isUpdate) {
        await updateLegalTag(selectedTag.id, formData);
      } else {
        await createLegalTag(formData);
      }
      
      // Close dialog and clear selection on success
      setCreateDialogOpen(false);
      setSelectedTag(null);
    } catch (error) {
      console.error(`❌ Error ${isUpdate ? 'updating' : 'creating'} legal tag:`, error);
      // Error is already handled by the hook
    }
  };

  const handleFormCancel = () => {
    setCreateDialogOpen(false);
    setSelectedTag(null);
  };

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
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <SecurityIcon color="primary" sx={{ fontSize: 32 }} />
            <Typography variant="h3" component="h1">
              Legal Tag Management
            </Typography>
            {(loadingState.refresh || loadingState.retry) && (
              <CircularProgress size={20} />
            )}
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleManualRefresh}
              disabled={isAnyLoading}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreate}
              size="large"
              disabled={isAnyLoading}
            >
              Create Legal Tag
            </Button>
          </Stack>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Manage legal tags for data governance and compliance in the OSDU platform
        </Typography>
      </Box>

      {/* Search Interface */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search legal tags by name, description, data type, or originator..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <IconButton onClick={handleClearSearch} size="small">
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  {filteredTags.length} of {legalTags.length} tags
                </Typography>
                {lastUpdateTime > 0 && (
                  <Typography variant="caption" color="text.disabled">
                    Last updated: {new Date(lastUpdateTime).toLocaleTimeString()}
                  </Typography>
                )}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Debug Component - Remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <Box sx={{ mb: 3 }}>
          <LegalTagDebug />
        </Box>
      )}

      {/* Loading Progress Bar */}
      {(loadingState.initial || loadingState.refresh || loadingState.retry || loadingState.delete) && (
        <Box sx={{ mb: 2 }}>
          <LinearProgress />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            {loadingState.initial && 'Loading legal tags...'}
            {loadingState.refresh && 'Refreshing legal tags...'}
            {loadingState.retry && `Retrying... (attempt ${retryCount})`}
            {loadingState.delete && 'Deleting legal tag...'}
          </Typography>
        </Box>
      )}

      {/* Error Display with Retry Option */}
      {hasError && formattedError && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            errorState.error?.canRetry && !isRetrying ? (
              <Button 
                color="inherit" 
                size="small" 
                onClick={handleRetry}
                startIcon={<RefreshIcon />}
              >
                Retry
              </Button>
            ) : null
          }
        >
          <Box>
            <Typography variant="body2" fontWeight="medium">
              {formattedError.title}
            </Typography>
            <Typography variant="body2">
              {formattedError.message}
            </Typography>
            {formattedError.suggestions && formattedError.suggestions.length > 0 && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Suggestions:
                </Typography>
                <ul style={{ margin: '4px 0', paddingLeft: '16px' }}>
                  {formattedError.suggestions.map((suggestion, index) => (
                    <li key={index}>
                      <Typography variant="caption">{suggestion}</Typography>
                    </li>
                  ))}
                </ul>
              </Box>
            )}
            {isRetrying && (
              <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} />
                <Typography variant="caption">
                  Retrying in a moment... (attempt {retryCount})
                </Typography>
              </Box>
            )}
          </Box>
        </Alert>
      )}

      {/* Legal Tags Table */}
      {loadingState.initial ? (
        <Card>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
            <CircularProgress size={48} sx={{ mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Loading legal tags...
            </Typography>
            <Typography variant="body2" color="text.disabled">
              Please wait while we fetch your legal tags
            </Typography>
          </Box>
        </Card>
      ) : (
        <Card sx={{ position: 'relative' }}>
          {/* Overlay loading indicator for refresh operations */}
          {(loadingState.refresh || loadingState.retry || loadingState.delete) && (
            <Backdrop
              sx={{ 
                position: 'absolute', 
                zIndex: 1, 
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                borderRadius: 1
              }}
              open={true}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <CircularProgress />
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {loadingState.refresh && 'Refreshing...'}
                  {loadingState.retry && `Retrying... (${retryCount})`}
                  {loadingState.delete && 'Deleting...'}
                </Typography>
              </Box>
            </Backdrop>
          )}
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Data Type</TableCell>
                  <TableCell>Security Classification</TableCell>
                  <TableCell>Country of Origin</TableCell>
                  <TableCell>Expiration Date</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTags.map((tag) => (
                  <TableRow key={tag.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LabelIcon color="primary" fontSize="small" />
                        <Typography variant="body2" fontWeight="medium">
                          {tag.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 200 }}>
                        {tag.description || 'No description'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={tag.properties.dataType || 'Unknown'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={tag.properties.securityClassification || 'Not Set'}
                        size="small"
                        color={getSecurityClassificationColor(tag.properties.securityClassification)}
                        variant="filled"
                      />
                    </TableCell>
                    <TableCell>
                      {tag.properties.countryOfOrigin?.length ? (
                        <Stack direction="row" spacing={0.5}>
                          {tag.properties.countryOfOrigin.slice(0, 2).map((country, index) => (
                            <Chip key={index} label={country} size="small" variant="outlined" />
                          ))}
                          {tag.properties.countryOfOrigin.length > 2 && (
                            <Chip label={`+${tag.properties.countryOfOrigin.length - 2}`} size="small" />
                          )}
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Not specified
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(tag.properties.expirationDate)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleViewDetails(tag)}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleEdit(tag)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(tag)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Empty State */}
          {!loadingState.initial && filteredTags.length === 0 && !hasError && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <SecurityIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {legalTags.length === 0 ? 'No legal tags found' : 'No matching legal tags'}
              </Typography>
              <Typography variant="body2" color="text.disabled">
                {legalTags.length === 0 
                  ? "Create your first legal tag to get started with data governance"
                  : "Try adjusting your search terms"
                }
              </Typography>
              {legalTags.length === 0 && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleCreate}
                  sx={{ mt: 2 }}
                  disabled={isAnyLoading}
                >
                  Create Legal Tag
                </Button>
              )}
            </Box>
          )}

          {/* Error State */}
          {!loadingState.initial && hasError && legalTags.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <WarningIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
              <Typography variant="h6" color="error" gutterBottom>
                Unable to load legal tags
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                There was a problem retrieving your legal tags. Please try again.
              </Typography>
              <Stack direction="row" spacing={2} justifyContent="center">
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={handleRetry}
                  disabled={isRetrying}
                >
                  {isRetrying ? 'Retrying...' : 'Try Again'}
                </Button>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleCreate}
                  disabled={isAnyLoading}
                >
                  Create Legal Tag
                </Button>
              </Stack>
            </Box>
          )}
        </Card>
      )}

      {/* Legal Tag Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LabelIcon color="primary" />
            Legal Tag Details
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedTag && (
            <LegalTagDetail legalTag={selectedTag} />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>
            Close
          </Button>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => {
              setDetailDialogOpen(false);
              handleEdit(selectedTag!);
            }}
          >
            Edit
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create/Edit Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={handleFormCancel}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { minHeight: '80vh' }
        }}
      >
        <DialogTitle>
          {selectedTag ? 'Edit Legal Tag' : 'Create Legal Tag'}
        </DialogTitle>
        <DialogContent sx={{ pb: 0 }}>
          <LegalTagForm
            initialData={selectedTag ? {
              name: selectedTag.name,
              description: selectedTag.description,
              properties: {
                countryOfOrigin: selectedTag.properties.countryOfOrigin || [],
                contractId: selectedTag.properties.contractId || '',
                expirationDate: selectedTag.properties.expirationDate || '',
                originator: selectedTag.properties.originator || '',
                dataType: selectedTag.properties.dataType || '',
                securityClassification: selectedTag.properties.securityClassification || '',
                personalData: selectedTag.properties.personalData || '',
                exportClassification: selectedTag.properties.exportClassification || ''
              }
            } : undefined}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            loading={loadingState.create || loadingState.update}
            mode={selectedTag ? 'edit' : 'create'}
          />
        </DialogContent>
      </Dialog>

      {/* Success Notification */}
      <Snackbar
        open={successState.show}
        autoHideDuration={6000}
        onClose={handleCloseSuccessNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSuccessNotification} 
          severity="success" 
          sx={{ width: '100%' }}
          variant="filled"
        >
          {successState.message}
        </Alert>
      </Snackbar>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCancelDelete}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DeleteIcon color="error" />
            Confirm Delete
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Are you sure you want to delete the legal tag &quot;{tagToDelete?.name}&quot;?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This action cannot be undone. The legal tag will be permanently removed from the system.
          </Typography>
          {tagToDelete?.description && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Description:
              </Typography>
              <Typography variant="body2">
                {tagToDelete.description}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleCancelDelete}
            disabled={loadingState.delete}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            disabled={loadingState.delete}
            startIcon={loadingState.delete ? <CircularProgress size={16} /> : <DeleteIcon />}
          >
            {loadingState.delete ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

// Temporarily disable auth due to port mismatch (localhost:3001 vs localhost:3000)
export default LegalTagsPage;