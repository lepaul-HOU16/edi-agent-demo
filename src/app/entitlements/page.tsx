'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Snackbar,
  CircularProgress,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
  Collapse
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Security as SecurityIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Group as GroupIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { useEntitlementOperations, Entitlement } from '../../hooks/useEntitlementOperations';
import EntitlementForm from '../../components/EntitlementForm';
import { useAuth } from '../../contexts/OidcAuthContext';

const EntitlementsPage: React.FC = () => {
  const { isAuthenticated, login } = useAuth();
  
  const {
    entitlements,
    loadingState,
    isLoading,
    error,
    successState,
    loadEntitlements,
    createEntitlement,
    updateEntitlement,
    deleteEntitlement,
    retryOperation,
    clearSuccessMessage,
    clearError,
    dataPartition
  } = useEntitlementOperations({
    autoRefreshEnabled: false,
    dataPartition: 'osdu'
  });

  // Local state for UI
  const [searchTerm, setSearchTerm] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEntitlement, setSelectedEntitlement] = useState<Entitlement | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Load entitlements only after authentication is complete
  useEffect(() => {
    let mounted = true;
    
    const initializeEntitlements = async () => {
      if (mounted && isAuthenticated) {
        try {
          console.log('🔐 Authentication confirmed, loading entitlements...');
          await loadEntitlements(true, 'initial');
          console.log('🔐 Entitlements loading completed');
        } catch (error) {
          console.error('Failed to initialize entitlements:', error);
        }
      }
    };
    
    // Add a small delay to ensure tokens are available
    if (isAuthenticated) {
      // Use a timeout to ensure the authentication tokens are fully available
      const timeoutId = setTimeout(() => {
        if (mounted) {
          initializeEntitlements();
        }
      }, 100);
      
      return () => {
        mounted = false;
        clearTimeout(timeoutId);
      };
    } else {
      console.log('🔐 Not authenticated yet, waiting...');
    }
    
    return () => {
      mounted = false;
    };
  }, [isAuthenticated, loadEntitlements]); // Depend on authentication state and loadEntitlements

  // Debug logging for state changes
  useEffect(() => {
    console.log('🔍 State update:', {
      isAuthenticated,
      loadingState,
      entitlementsCount: entitlements.length,
      error: error ? error.substring(0, 50) + '...' : null
    });
  }, [isAuthenticated, loadingState, entitlements.length, error]);

  // Filter entitlements based on search term
  const filteredEntitlements = entitlements.filter(entitlement =>
    entitlement.groupEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entitlement.actions.some(action => action.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Handle create entitlement
  const handleCreate = async (input: any) => {
    try {
      await createEntitlement(input);
      setCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create entitlement:', error);
    }
  };

  // Handle edit entitlement
  const handleEdit = (entitlement: Entitlement) => {
    setSelectedEntitlement(entitlement);
    setEditDialogOpen(true);
  };

  const handleUpdate = async (input: any) => {
    if (!selectedEntitlement) return;
    
    try {
      await updateEntitlement(selectedEntitlement.id, input);
      setEditDialogOpen(false);
      setSelectedEntitlement(null);
    } catch (error) {
      console.error('Failed to update entitlement:', error);
    }
  };

  // Handle delete entitlement
  const handleDelete = (entitlement: Entitlement) => {
    setSelectedEntitlement(entitlement);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedEntitlement) return;
    
    try {
      await deleteEntitlement(selectedEntitlement.id);
      setDeleteDialogOpen(false);
      setSelectedEntitlement(null);
    } catch (error) {
      console.error('Failed to delete entitlement:', error);
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setSelectedEntitlement(null);
  };

  // Handle row expansion
  const toggleRowExpansion = (entitlementId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(entitlementId)) {
      newExpanded.delete(entitlementId);
    } else {
      newExpanded.add(entitlementId);
    }
    setExpandedRows(newExpanded);
  };

  // Get action color for chips
  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'read': return 'primary';
      case 'write': return 'secondary';
      case 'delete': return 'error';
      case 'admin': return 'warning';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <SecurityIcon sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          Entitlements Management
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
          Data Partition: {dataPartition}
        </Typography>
      </Box>

      {/* Controls */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
        <TextField
          placeholder="Search by group email or actions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ flexGrow: 1 }}
        />
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => loadEntitlements(true, 'refresh')}
          disabled={isLoading}
        >
          Refresh
        </Button>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
          disabled={loadingState.initial || !isAuthenticated} // Only disable during initial load or when not authenticated
        >
          Create Entitlement
        </Button>
      </Box>

      {/* Error Display */}
      {error && (
        <Alert 
          severity={error.includes('Authentication') ? 'warning' : 'error'}
          sx={{ mb: 2 }}
          action={
            !error.includes('Authentication') && (
              <Button color="inherit" size="small" onClick={retryOperation}>
                Retry
              </Button>
            )
          }
          onClose={clearError}
        >
          {error.includes('Authentication') 
            ? 'Authentication required. Please ensure you are logged in with proper permissions.' 
            : error}
        </Alert>
      )}

      {/* Loading State */}
      {isAuthenticated && loadingState.initial && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
          <Typography variant="body2" color="text.secondary" sx={{ ml: 2, alignSelf: 'center' }}>
            Loading entitlements...
          </Typography>
        </Box>
      )}

      {/* Authentication Required - Login Prompt */}
      {!isAuthenticated && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <SecurityIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Authentication Required
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Please log in to access the entitlements management system.
          </Typography>
          <Button
            variant="contained"
            onClick={login}
            startIcon={<SecurityIcon />}
            size="large"
          >
            Log In
          </Button>
        </Paper>
      )}

      {/* Authentication Required Message */}
      {!loadingState.initial && error?.includes('Authentication') && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <SecurityIcon sx={{ fontSize: 64, color: 'warning.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Authentication Required
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            You need to be logged in with proper permissions to view entitlements.
            Please ensure you have the necessary access rights.
          </Typography>
          <Button
            variant="contained"
            onClick={() => window.location.reload()}
            startIcon={<RefreshIcon />}
          >
            Refresh Page
          </Button>
        </Paper>
      )}

      {/* Entitlements Table */}
      {isAuthenticated && !loadingState.initial && !error?.includes('Authentication') && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width="40px"></TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <GroupIcon sx={{ mr: 1 }} />
                    Group Email
                  </Box>
                </TableCell>
                <TableCell>Actions</TableCell>
                <TableCell>Conditions</TableCell>
                <TableCell>Created By</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell width="120px">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredEntitlements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      {searchTerm ? 'No entitlements match your search criteria' : 'No entitlements found'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredEntitlements.map((entitlement) => (
                  <React.Fragment key={entitlement.id}>
                    <TableRow hover>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => toggleRowExpansion(entitlement.id)}
                        >
                          {expandedRows.has(entitlement.id) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {entitlement.groupEmail}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {entitlement.actions.map((action) => (
                            <Chip
                              key={action}
                              label={action}
                              size="small"
                              color={getActionColor(action) as any}
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {entitlement.conditions.length} condition{entitlement.conditions.length !== 1 ? 's' : ''}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {entitlement.createdBy}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(entitlement.createdAt).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => handleEdit(entitlement)}
                              color="primary"
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(entitlement)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                    
                    {/* Expanded Row Content */}
                    <TableRow>
                      <TableCell colSpan={7} sx={{ py: 0 }}>
                        <Collapse in={expandedRows.has(entitlement.id)} timeout="auto" unmountOnExit>
                          <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Conditions Details:
                            </Typography>
                            {entitlement.conditions.length === 0 ? (
                              <Typography variant="body2" color="text.secondary">
                                No conditions specified
                              </Typography>
                            ) : (
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {entitlement.conditions.map((condition, index) => (
                                  <Box key={index} sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                    <Chip label={condition.attribute} size="small" />
                                    <Typography variant="body2">{condition.operator}</Typography>
                                    <Chip label={condition.value} size="small" variant="outlined" />
                                  </Box>
                                ))}
                              </Box>
                            )}
                            {entitlement.updatedAt && (
                              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                Last updated by {entitlement.updatedBy} on {new Date(entitlement.updatedAt).toLocaleString()}
                              </Typography>
                            )}
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AddIcon />
            Create New Entitlement
          </Box>
        </DialogTitle>
        <DialogContent>
          <EntitlementForm
            onSubmit={handleCreate}
            onCancel={() => setCreateDialogOpen(false)}
            loading={loadingState.create}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EditIcon />
            Edit Entitlement
          </Box>
        </DialogTitle>
        <DialogContent>
          <EntitlementForm
            initialData={selectedEntitlement}
            onSubmit={handleUpdate}
            onCancel={() => setEditDialogOpen(false)}
            loading={loadingState.update}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCancelDelete}>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DeleteIcon color="error" />
            Confirm Delete
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Are you sure you want to delete the entitlement for &quot;{selectedEntitlement?.groupEmail}&quot;?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This action cannot be undone. The entitlement will be permanently removed and the group will lose access to the specified resources.
          </Typography>
          {selectedEntitlement && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>Entitlement Details:</Typography>
              <Typography variant="body2">Group: {selectedEntitlement.groupEmail}</Typography>
              <Typography variant="body2">Actions: {selectedEntitlement.actions.join(', ')}</Typography>
              <Typography variant="body2">Conditions: {selectedEntitlement.conditions.length}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} disabled={loadingState.delete}>
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

      {/* Success Snackbar */}
      <Snackbar
        open={successState.show}
        autoHideDuration={4000}
        onClose={clearSuccessMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={clearSuccessMessage} severity="success" sx={{ width: '100%' }}>
          {successState.message}
        </Alert>
      </Snackbar>

      {/* Floating Action Button for Quick Create */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => setCreateDialogOpen(true)}
        disabled={loadingState.initial || !isAuthenticated} // Only disable during initial load or when not authenticated
      >
        <AddIcon />
      </Fab>
    </Box>
  );
};

export default EntitlementsPage;
