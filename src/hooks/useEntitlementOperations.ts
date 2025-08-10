/**
 * Entitlement Operations Hook
 * 
 * Custom hook for managing entitlement operations with enhanced loading states,
 * automatic refresh, and retry mechanisms.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import osduApi from '../services/osduApiService';

export interface EntitlementCondition {
  attribute: string;
  operator: string;
  value: string;
}

export interface Entitlement {
  id: string;
  groupEmail: string;
  actions: string[];
  conditions: EntitlementCondition[];
  createdBy: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt?: string;
}

export interface CreateEntitlementInput {
  groupEmail: string;
  actions: string[];
  conditions?: EntitlementCondition[];
}

export interface UpdateEntitlementInput {
  groupEmail?: string;
  actions?: string[];
  conditions?: EntitlementCondition[];
}

export interface LoadingState {
  initial: boolean;
  refresh: boolean;
  retry: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
}

export interface SuccessState {
  show: boolean;
  message: string;
  type: 'create' | 'update' | 'delete' | 'refresh';
}

export interface UseEntitlementOperationsOptions {
  autoRefreshEnabled?: boolean;
  autoRefreshInterval?: number;
  dataPartition?: string;
}

export function useEntitlementOperations(options: UseEntitlementOperationsOptions = {}) {
  const {
    autoRefreshEnabled = false,
    autoRefreshInterval = 30000,
    dataPartition = 'osdu'
  } = options;

  // State management
  const [entitlements, setEntitlements] = useState<Entitlement[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    initial: false,
    refresh: false,
    retry: false,
    create: false,
    update: false,
    delete: false
  });
  const [error, setError] = useState<string | null>(null);
  const [successState, setSuccessState] = useState<SuccessState>({
    show: false,
    message: '',
    type: 'refresh'
  });

  // Refs for cleanup and state management
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // Error handling with retry mechanism
  const executeWithErrorHandling = useCallback(async (
    operationName: string,
    operation: () => Promise<any>,
    context: any = {},
    retryOptions: { maxRetries?: number; baseDelay?: number } = {}
  ) => {
    const { maxRetries = 3, baseDelay = 1000 } = retryOptions;
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Attempting ${operationName} (attempt ${attempt}/${maxRetries})`, context);
        const result = await operation();
        console.log(`✅ ${operationName} successful`, result);
        return result;
      } catch (error) {
        lastError = error as Error;
        console.error(`❌ ${operationName} failed (attempt ${attempt}/${maxRetries}):`, error);

        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1);
          console.log(`⏳ Retrying ${operationName} in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError!;
  }, []);

  // Load entitlements with enhanced error handling
  const loadEntitlements = useCallback(async (
    showLoading = true, 
    loadType: 'initial' | 'refresh' | 'retry' = 'initial'
  ) => {
    if (showLoading) {
      setLoadingState(prev => ({ ...prev, [loadType]: true }));
    }
    setError(null);

    try {
      const result = await executeWithErrorHandling(
        'loadEntitlements',
        async () => {
          console.log('Loading entitlements for partition:', dataPartition);
          return await osduApi.getEntitlements(dataPartition);
        },
        { dataPartition, loadType },
        {
          maxRetries: loadType === 'retry' ? 5 : 3,
          baseDelay: 1000
        }
      );

      console.log('✅ Entitlements loaded successfully:', result);
      // Handle null result or missing items array - this is normal for empty systems
      const items = result?.items || [];
      setEntitlements(items);
      
      if (loadType === 'refresh') {
        setSuccessState({
          show: true,
          message: `Loaded ${items.length} entitlements`,
          type: 'refresh'
        });
      }
      
      // Log for debugging
      if (items.length === 0) {
        console.log('ℹ️  No entitlements found - this is normal for a new system');
      }

      return result;
    } catch (error) {
      console.error('❌ Failed to load entitlements:', error);
      // Handle authentication errors gracefully
      const errorMessage = error instanceof Error ? error.message : 'Failed to load entitlements';
      setError(errorMessage);
      
      // For authentication errors, set empty entitlements to prevent loops
      if (errorMessage.includes('Unauthorized') || errorMessage.includes('Not Authorized') || errorMessage.includes('Authentication required')) {
        console.log('🔒 Authentication error detected, setting empty entitlements list');
        setEntitlements([]);
      }
      
      // Don't re-throw error to prevent unhandled promise rejections
      return { items: [], pagination: { nextToken: null } };
    } finally {
      // Always reset loading state if we set it, regardless of mount status
      if (showLoading) {
        console.log('🔧 Resetting loading state for:', loadType);
        setLoadingState(prev => ({ ...prev, [loadType]: false }));
      }
    }
  }, [dataPartition, executeWithErrorHandling]);

  // Create entitlement
  const createEntitlement = useCallback(async (input: CreateEntitlementInput) => {
    setLoadingState(prev => ({ ...prev, create: true }));

    try {
      const result = await executeWithErrorHandling(
        'createEntitlement',
        async () => {
          console.log('Creating entitlement:', input);
          return await osduApi.createEntitlement(input, dataPartition);
        },
        { input, dataPartition },
        {
          maxRetries: 2,
          baseDelay: 1000
        }
      );

      if (result) {
        setSuccessState({
          show: true,
          message: `Entitlement created for ${input.groupEmail}`,
          type: 'create'
        });
        
        // Automatically refresh the list after successful creation
        await loadEntitlements(false, 'refresh');
        
        return result;
      }
    } catch (error) {
      console.error('❌ Error creating entitlement:', error);
      throw error;
    } finally {
      setLoadingState(prev => ({ ...prev, create: false }));
    }
  }, [executeWithErrorHandling, loadEntitlements, dataPartition]);

  // Update entitlement
  const updateEntitlement = useCallback(async (entitlementId: string, input: UpdateEntitlementInput) => {
    setLoadingState(prev => ({ ...prev, update: true }));

    try {
      const result = await executeWithErrorHandling(
        'updateEntitlement',
        async () => {
          console.log('Updating entitlement:', entitlementId, input);
          return await osduApi.updateEntitlement(entitlementId, input, dataPartition);
        },
        { entitlementId, input, dataPartition },
        {
          maxRetries: 2,
          baseDelay: 1000
        }
      );

      if (result) {
        setSuccessState({
          show: true,
          message: `Entitlement updated successfully`,
          type: 'update'
        });
        
        // Automatically refresh the list after successful update
        await loadEntitlements(false, 'refresh');
        
        return result;
      }
    } catch (error) {
      console.error('❌ Error updating entitlement:', error);
      throw error;
    } finally {
      setLoadingState(prev => ({ ...prev, update: false }));
    }
  }, [executeWithErrorHandling, loadEntitlements, dataPartition]);

  // Delete entitlement
  const deleteEntitlement = useCallback(async (entitlementId: string) => {
    setLoadingState(prev => ({ ...prev, delete: true }));

    try {
      const result = await executeWithErrorHandling(
        'deleteEntitlement',
        async () => {
          console.log('Deleting entitlement:', entitlementId);
          return await osduApi.deleteEntitlement(entitlementId, dataPartition);
        },
        { entitlementId, dataPartition },
        {
          maxRetries: 2,
          baseDelay: 1000
        }
      );

      if (result) {
        setSuccessState({
          show: true,
          message: `Entitlement deleted successfully`,
          type: 'delete'
        });
        
        // Automatically refresh the list after successful deletion
        await loadEntitlements(false, 'refresh');
        
        return result;
      }
    } catch (error) {
      console.error('❌ Error deleting entitlement:', error);
      throw error;
    } finally {
      setLoadingState(prev => ({ ...prev, delete: false }));
    }
  }, [executeWithErrorHandling, loadEntitlements, dataPartition]);

  // Retry failed operations
  const retryOperation = useCallback(async () => {
    await loadEntitlements(true, 'retry');
  }, [loadEntitlements]);

  // Clear success message
  const clearSuccessMessage = useCallback(() => {
    setSuccessState(prev => ({ ...prev, show: false }));
  }, []);

  // Clear error message
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-refresh setup
  useEffect(() => {
    if (autoRefreshEnabled && autoRefreshInterval > 0) {
      refreshIntervalRef.current = setInterval(() => {
        // Don't auto-refresh if there's an authentication error or if loading
        if (mountedRef.current && 
            !Object.values(loadingState).some(Boolean) && 
            !error?.includes('Authentication') &&
            !error?.includes('Not Authorized')) {
          loadEntitlements(false, 'refresh');
        }
      }, autoRefreshInterval);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [autoRefreshEnabled, autoRefreshInterval, loadingState, error]); // Remove loadEntitlements to prevent loops

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true; // Ensure it's set to true on mount
    return () => {
      mountedRef.current = false;
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  return {
    // Data
    entitlements,
    
    // Loading states
    loadingState,
    isLoading: Object.values(loadingState).some(Boolean),
    
    // Error handling
    error,
    
    // Success handling
    successState,
    
    // Operations
    loadEntitlements,
    createEntitlement,
    updateEntitlement,
    deleteEntitlement,
    retryOperation,
    
    // Utility functions
    clearSuccessMessage,
    clearError,
    
    // Configuration
    dataPartition
  };
}

export default useEntitlementOperations;
