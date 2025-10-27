/**
 * useConfirmationState Hook
 * 
 * Manages confirmation dialog state in the chat interface.
 * Handles:
 * - Displaying confirmation prompts
 * - Tracking pending confirmations
 * - Routing confirmed actions back to lifecycle manager
 * 
 * Requirements: 2.1, 2.6, 4.2, 4.4
 */

import { useState, useCallback } from 'react';

export interface ConfirmationState {
  isActive: boolean;
  message: string;
  confirmationPrompt?: string;
  options?: Array<{
    label: string;
    value: string;
    variant?: 'primary' | 'danger' | 'secondary';
  }>;
  projectList?: string[];
  originalQuery: string;
  action: string;
  metadata?: Record<string, any>;
}

export interface UseConfirmationStateReturn {
  confirmationState: ConfirmationState | null;
  showConfirmation: (state: Omit<ConfirmationState, 'isActive'>) => void;
  hideConfirmation: () => void;
  confirmAction: (value: string) => string | null;
}

/**
 * Hook to manage confirmation dialog state
 * 
 * Usage:
 * ```typescript
 * const { confirmationState, showConfirmation, hideConfirmation, confirmAction } = useConfirmationState();
 * 
 * // When backend returns requiresConfirmation
 * showConfirmation({
 *   message: 'Are you sure?',
 *   originalQuery: 'delete project texas-wind-farm',
 *   action: 'delete',
 * });
 * 
 * // When user confirms
 * const confirmedQuery = confirmAction('yes');
 * if (confirmedQuery) {
 *   sendMessage(confirmedQuery);
 * }
 * ```
 */
export const useConfirmationState = (): UseConfirmationStateReturn => {
  const [confirmationState, setConfirmationState] = useState<ConfirmationState | null>(null);

  /**
   * Show confirmation dialog
   */
  const showConfirmation = useCallback((state: Omit<ConfirmationState, 'isActive'>) => {
    console.log('🔔 useConfirmationState: Showing confirmation dialog', state);
    setConfirmationState({
      ...state,
      isActive: true,
    });
  }, []);

  /**
   * Hide confirmation dialog
   */
  const hideConfirmation = useCallback(() => {
    console.log('🔕 useConfirmationState: Hiding confirmation dialog');
    setConfirmationState(null);
  }, []);

  /**
   * Confirm action and generate follow-up query
   * 
   * @param value - User's confirmation choice ('yes', 'no', 'continue', etc.)
   * @returns Follow-up query to send to backend, or null if cancelled
   */
  const confirmAction = useCallback((value: string): string | null => {
    if (!confirmationState) {
      console.warn('⚠️ useConfirmationState: No active confirmation state');
      return null;
    }

    console.log('✅ useConfirmationState: User confirmed action', {
      action: confirmationState.action,
      value,
      originalQuery: confirmationState.originalQuery,
    });

    // Handle cancellation
    if (value === 'cancel' || value === 'no') {
      hideConfirmation();
      return null;
    }

    // Generate follow-up query based on action type
    let followUpQuery: string;

    switch (confirmationState.action) {
      case 'delete':
        // For deletion, append confirmation to original query
        followUpQuery = `${confirmationState.originalQuery} --confirmed`;
        break;

      case 'bulk_delete':
        // For bulk deletion, append confirmation
        followUpQuery = `${confirmationState.originalQuery} --confirmed`;
        break;

      case 'merge':
        // For merge, include which name to keep if provided
        if (confirmationState.metadata?.keepName) {
          followUpQuery = `${confirmationState.originalQuery} keep ${confirmationState.metadata.keepName} --confirmed`;
        } else {
          followUpQuery = `${confirmationState.originalQuery} --confirmed`;
        }
        break;

      case 'duplicate_resolution':
        // For duplicate resolution, send the user's choice
        followUpQuery = `resolve duplicate: ${value}`;
        break;

      default:
        // Generic confirmation
        followUpQuery = `${confirmationState.originalQuery} --confirmed`;
    }

    // Clear confirmation state
    hideConfirmation();

    return followUpQuery;
  }, [confirmationState, hideConfirmation]);

  return {
    confirmationState,
    showConfirmation,
    hideConfirmation,
    confirmAction,
  };
};

export default useConfirmationState;
