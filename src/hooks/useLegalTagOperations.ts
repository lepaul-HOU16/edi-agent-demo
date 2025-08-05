/**
 * Legal Tag Operations Hook
 * 
 * Custom hook for managing legal tag operations with enhanced loading states,
 * automatic refresh, and retry mechanisms.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import osduApi from '../services/osduApiService';
import { useLegalTagErrorHandler } from './useLegalTagErrorHandler';

export interface LegalTag {
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

export interface UseLegalTagOperationsOptions {
  autoRefreshEnabled?: boolean;
  autoRefreshInterval?: number;
  dataPartition?: string;
}

export function useLegalTagOperations(options: UseLegalTagOperationsOptions = {}) {
  const {
    autoRefreshEnabled = true,
    autoRefreshInterval = 30000,
    dataPartition = 'osdu'
  } = options;

  // State management
  const [legalTags, setLegalTags] = useState<LegalTag[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    initial: false,
    refresh: false,
    retry: false,
    create: false,
    update: false,
    delete: false
  });
  const [successState, setSuccessState] = useState<SuccessState>({
    show: false,
    message: '',
    type: 'refresh'
  });

  // Refs for auto-refresh management
  const autoRefreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSuccessfulLoadRef = useRef<number>(0);

  // Error handling with retry capabilities
  const {
    errorState,
    hasError,
    formattedError,
    isRetrying,
    retryCount,
    handleError,
    clearError,
    retry,
    executeWithErrorHandling
  } = useLegalTagErrorHandler({
    defaultRetryOptions: {
      maxRetries: 3,
      baseDelay: 2000,
      exponentialBackoff: true,
      onRetry: (attempt, error) => {
        console.log(`🔄 Retry attempt ${attempt} for legal tags operation`);
        setLoadingState(prev => ({ ...prev, retry: true }));
      },
      onMaxRetriesReached: (error) => {
        console.log('❌ Max retries reached for legal tags operation');
        setLoadingState(prev => ({ ...prev, retry: false }));
      }
    },
    logErrors: true,
    autoRetry: true
  });

  /**
   * Load legal tags with enhanced state management
   */
  const loadLegalTags = useCallback(async (
    isInitialLoad: boolean = false,
    loadType: 'initial' | 'refresh' | 'retry' | 'auto-refresh' = 'refresh'
  ) => {
    // Clear any previous errors
    clearError();

    // Set appropriate loading state
    setLoadingState(prev => ({
      ...prev,
      initial: isInitialLoad,
      refresh: loadType === 'refresh' || loadType === 'auto-refresh',
      retry: loadType === 'retry'
    }));

    const result = await executeWithErrorHandling(
      'getLegalTags',
      async () => {
        console.log(`🔄 Loading legal tags (${loadType})...`);
        const response = await osduApi.getLegalTags(dataPartition);
        console.log('✅ Legal tags response received:', response);
        
        // Handle various response structures
        let tags: LegalTag[] = [];
        
        if (response?.listLegalTags?.items) {
          tags = response.listLegalTags.items;
        } else if (response?.getLegalTags) {
          tags = Array.isArray(response.getLegalTags) ? response.getLegalTags : [response.getLegalTags];
        } else if (Array.isArray(response)) {
          tags = response;
        } else {
          // Check for any property that contains an array of legal tags
          const responseKeys = Object.keys(response || {});
          for (const key of responseKeys) {
            if (Array.isArray(response[key])) {
              tags = response[key];
              break;
            } else if (response[key]?.items && Array.isArray(response[key].items)) {
              tags = response[key].items;
              break;
            }
          }
        }
        
        // Filter out null/undefined items and ensure proper structure
        const validTags = tags.filter(tag => tag && tag.id).map(tag => ({
          id: tag.id,
          name: tag.name || 'Unnamed',
          description: tag.description || '',
          properties: {
            countryOfOrigin: tag.properties?.countryOfOrigin || [],
            contractId: tag.properties?.contractId || '',
            expirationDate: tag.properties?.expirationDate || '',
            originator: tag.properties?.originator || '',
            dataType: tag.properties?.dataType || '',
            securityClassification: tag.properties?.securityClassification || '',
            personalData: tag.properties?.personalData || '',
            exportClassification: tag.properties?.exportClassification || ''
          }
        }));
        
        return validTags;
      },
      { loadType, isInitialLoad, dataPartition },
      {
        maxRetries: loadType === 'retry' ? 1 : 3,
        baseDelay: loadType === 'auto-refresh' ? 5000 : 2000,
        onRetry: (attempt) => {
          console.log(`🔄 Retrying legal tags load (attempt ${attempt})`);
        }
      }
    );

    // Reset loading states
    setLoadingState(prev => ({
      ...prev,
      initial: false,
      refresh: false,
      retry: false
    }));

    if (result) {
      setLegalTags(result);
      lastSuccessfulLoadRef.current = Date.now();
      
      // Show success message for manual refresh
      if (loadType === 'refresh' && !isInitialLoad) {
        setSuccessState({
          show: true,
          message: `Legal tags refreshed successfully (${result.length} tags loaded)`,
          type: 'refresh'
        });
      }
      
      console.log(`✅ Legal tags loaded successfully (${loadType}):`, result.length, 'tags');
    } else if (hasError) {
      console.error(`❌ Failed to load legal tags (${loadType})`);
      setLegalTags([]);
    }
  }, [executeWithErrorHandling, clearError, hasError, dataPartition]);

  /**
   * Create a new legal tag
   */
  const createLegalTag = useCallback(async (formData: any) => {
    setLoadingState(prev => ({ ...prev, create: true }));

    try {
      const result = await executeWithErrorHandling(
        'createLegalTag',
        async () => {
          console.log('Creating legal tag:', formData);
          return await osduApi.createLegalTag(formData, dataPartition);
        },
        { formData, operationType: 'create', dataPartition },
        {
          maxRetries: 2,
          baseDelay: 1000
        }
      );

      if (result) {
        // Show success message
        setSuccessState({
          show: true,
          message: `Legal tag created successfully: ${formData.name}`,
          type: 'create'
        });
        
        // Automatically refresh the list after successful creation
        console.log('✅ Legal tag creation successful, refreshing list...');
        await loadLegalTags(false, 'refresh');
        
        return result;
      }
    } catch (error) {
      console.error('❌ Error creating legal tag:', error);
      throw error;
    } finally {
      setLoadingState(prev => ({ ...prev, create: false }));
    }
  }, [executeWithErrorHandling, loadLegalTags, dataPartition]);

  /**
   * Update an existing legal tag
   */
  const updateLegalTag = useCallback(async (legalTagId: string, formData: any) => {
    setLoadingState(prev => ({ ...prev, update: true }));

    try {
      const result = await executeWithErrorHandling(
        'updateLegalTag',
        async () => {
          console.log('Updating legal tag:', formData);
          return await osduApi.updateLegalTag(legalTagId, formData, dataPartition);
        },
        { formData, legalTagId, operationType: 'update', dataPartition },
        {
          maxRetries: 2,
          baseDelay: 1000
        }
      );

      if (result) {
        // Show success message
        setSuccessState({
          show: true,
          message: `Legal tag updated successfully: ${formData.name}`,
          type: 'update'
        });
        
        // Automatically refresh the list after successful update
        console.log('✅ Legal tag update successful, refreshing list...');
        await loadLegalTags(false, 'refresh');
        
        return result;
      }
    } catch (error) {
      console.error('❌ Error updating legal tag:', error);
      throw error;
    } finally {
      setLoadingState(prev => ({ ...prev, update: false }));
    }
  }, [executeWithErrorHandling, loadLegalTags, dataPartition]);

  /**
   * Delete a legal tag
   */
  const deleteLegalTag = useCallback(async (legalTagId: string) => {
    setLoadingState(prev => ({ ...prev, delete: true }));

    try {
      const result = await executeWithErrorHandling(
        'deleteLegalTag',
        async () => {
          console.log('Deleting legal tag:', legalTagId);
          return await osduApi.deleteLegalTag(legalTagId, dataPartition);
        },
        { legalTagId, operationType: 'delete', dataPartition },
        {
          maxRetries: 2,
          baseDelay: 1000
        }
      );

      if (result) {
        // Show success message
        setSuccessState({
          show: true,
          message: `Legal tag deleted successfully`,
          type: 'delete'
        });
        
        // Automatically refresh the list after successful deletion
        console.log('✅ Legal tag deletion successful, refreshing list...');
        await loadLegalTags(false, 'refresh');
        
        return result;
      }
    } catch (error) {
      console.error('❌ Error deleting legal tag:', error);
      throw error;
    } finally {
      setLoadingState(prev => ({ ...prev, delete: false }));
    }
  }, [executeWithErrorHandling, loadLegalTags, dataPartition]);

  /**
   * Manual refresh
   */
  const refreshLegalTags = useCallback(() => {
    loadLegalTags(false, 'refresh');
  }, [loadLegalTags]);

  /**
   * Retry failed operation
   */
  const retryOperation = useCallback(async () => {
    if (hasError && errorState.error?.canRetry) {
      await retry(
        () => loadLegalTags(false, 'retry'),
        {
          maxRetries: 2,
          baseDelay: 1000
        }
      );
    }
  }, [hasError, errorState.error, retry, loadLegalTags]);

  /**
   * Clear success notification
   */
  const clearSuccessNotification = useCallback(() => {
    setSuccessState(prev => ({ ...prev, show: false }));
  }, []);

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefreshEnabled && lastSuccessfulLoadRef.current > 0) {
      // Clear any existing timeout
      if (autoRefreshTimeoutRef.current) {
        clearTimeout(autoRefreshTimeoutRef.current);
      }

      // Schedule auto-refresh
      autoRefreshTimeoutRef.current = setTimeout(() => {
        if (Date.now() - lastSuccessfulLoadRef.current > autoRefreshInterval) {
          loadLegalTags(false, 'auto-refresh');
        }
      }, autoRefreshInterval);
    }

    return () => {
      if (autoRefreshTimeoutRef.current) {
        clearTimeout(autoRefreshTimeoutRef.current);
      }
    };
  }, [legalTags, autoRefreshEnabled, autoRefreshInterval, loadLegalTags]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoRefreshTimeoutRef.current) {
        clearTimeout(autoRefreshTimeoutRef.current);
      }
    };
  }, []);

  // Computed values
  const isAnyLoading = Object.values(loadingState).some(loading => loading) || isRetrying;
  const lastUpdateTime = lastSuccessfulLoadRef.current;

  return {
    // Data
    legalTags,
    
    // Loading states
    loadingState,
    isAnyLoading,
    isRetrying,
    retryCount,
    
    // Success state
    successState,
    
    // Error state
    hasError,
    errorState,
    formattedError,
    
    // Operations
    loadLegalTags,
    createLegalTag,
    updateLegalTag,
    deleteLegalTag,
    refreshLegalTags,
    retryOperation,
    clearError,
    clearSuccessNotification,
    
    // Metadata
    lastUpdateTime
  };
}

// Export types
export type { LoadingState, SuccessState, UseLegalTagOperationsOptions };