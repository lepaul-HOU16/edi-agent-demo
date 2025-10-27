/**
 * Unit Tests for useConfirmationState Hook
 * 
 * Tests confirmation state management and action routing.
 * 
 * Requirements: 2.1, 2.6, 4.2, 4.4
 */

import { renderHook, act } from '@testing-library/react';
import { useConfirmationState } from '../../src/hooks/useConfirmationState';

describe('useConfirmationState', () => {
  describe('Initial State', () => {
    it('should initialize with null confirmation state', () => {
      const { result } = renderHook(() => useConfirmationState());

      expect(result.current.confirmationState).toBeNull();
    });
  });

  describe('showConfirmation', () => {
    it('should set confirmation state', () => {
      const { result } = renderHook(() => useConfirmationState());

      act(() => {
        result.current.showConfirmation({
          message: 'Delete project?',
          originalQuery: 'delete project texas-wind-farm',
          action: 'delete',
        });
      });

      expect(result.current.confirmationState).toEqual({
        isActive: true,
        message: 'Delete project?',
        originalQuery: 'delete project texas-wind-farm',
        action: 'delete',
      });
    });

    it('should set confirmation state with options', () => {
      const { result } = renderHook(() => useConfirmationState());

      const options = [
        { label: 'Yes', value: 'yes', variant: 'danger' as const },
        { label: 'No', value: 'no', variant: 'secondary' as const },
      ];

      act(() => {
        result.current.showConfirmation({
          message: 'Delete project?',
          originalQuery: 'delete project texas-wind-farm',
          action: 'delete',
          options,
        });
      });

      expect(result.current.confirmationState?.options).toEqual(options);
    });

    it('should set confirmation state with project list', () => {
      const { result } = renderHook(() => useConfirmationState());

      const projectList = ['project-1', 'project-2', 'project-3'];

      act(() => {
        result.current.showConfirmation({
          message: 'Delete multiple projects?',
          originalQuery: 'delete all projects matching texas',
          action: 'bulk_delete',
          projectList,
        });
      });

      expect(result.current.confirmationState?.projectList).toEqual(projectList);
    });

    it('should set confirmation state with metadata', () => {
      const { result } = renderHook(() => useConfirmationState());

      const metadata = { keepName: 'project-1' };

      act(() => {
        result.current.showConfirmation({
          message: 'Merge projects?',
          originalQuery: 'merge project-1 and project-2',
          action: 'merge',
          metadata,
        });
      });

      expect(result.current.confirmationState?.metadata).toEqual(metadata);
    });
  });

  describe('hideConfirmation', () => {
    it('should clear confirmation state', () => {
      const { result } = renderHook(() => useConfirmationState());

      act(() => {
        result.current.showConfirmation({
          message: 'Delete project?',
          originalQuery: 'delete project texas-wind-farm',
          action: 'delete',
        });
      });

      expect(result.current.confirmationState).not.toBeNull();

      act(() => {
        result.current.hideConfirmation();
      });

      expect(result.current.confirmationState).toBeNull();
    });
  });

  describe('confirmAction', () => {
    describe('Delete Action', () => {
      it('should generate follow-up query for delete confirmation', () => {
        const { result } = renderHook(() => useConfirmationState());

        act(() => {
          result.current.showConfirmation({
            message: 'Delete project?',
            originalQuery: 'delete project texas-wind-farm',
            action: 'delete',
          });
        });

        let followUpQuery: string | null = null;
        act(() => {
          followUpQuery = result.current.confirmAction('yes');
        });

        expect(followUpQuery).toBe('delete project texas-wind-farm --confirmed');
        expect(result.current.confirmationState).toBeNull();
      });

      it('should return null for delete cancellation', () => {
        const { result } = renderHook(() => useConfirmationState());

        act(() => {
          result.current.showConfirmation({
            message: 'Delete project?',
            originalQuery: 'delete project texas-wind-farm',
            action: 'delete',
          });
        });

        let followUpQuery: string | null = null;
        act(() => {
          followUpQuery = result.current.confirmAction('cancel');
        });

        expect(followUpQuery).toBeNull();
        expect(result.current.confirmationState).toBeNull();
      });
    });

    describe('Bulk Delete Action', () => {
      it('should generate follow-up query for bulk delete confirmation', () => {
        const { result } = renderHook(() => useConfirmationState());

        act(() => {
          result.current.showConfirmation({
            message: 'Delete multiple projects?',
            originalQuery: 'delete all projects matching texas',
            action: 'bulk_delete',
          });
        });

        let followUpQuery: string | null = null;
        act(() => {
          followUpQuery = result.current.confirmAction('yes');
        });

        expect(followUpQuery).toBe('delete all projects matching texas --confirmed');
      });
    });

    describe('Merge Action', () => {
      it('should generate follow-up query for merge with keepName', () => {
        const { result } = renderHook(() => useConfirmationState());

        act(() => {
          result.current.showConfirmation({
            message: 'Merge projects?',
            originalQuery: 'merge project-1 and project-2',
            action: 'merge',
            metadata: { keepName: 'project-1' },
          });
        });

        let followUpQuery: string | null = null;
        act(() => {
          followUpQuery = result.current.confirmAction('yes');
        });

        expect(followUpQuery).toBe('merge project-1 and project-2 keep project-1 --confirmed');
      });

      it('should generate follow-up query for merge without keepName', () => {
        const { result } = renderHook(() => useConfirmationState());

        act(() => {
          result.current.showConfirmation({
            message: 'Merge projects?',
            originalQuery: 'merge project-1 and project-2',
            action: 'merge',
          });
        });

        let followUpQuery: string | null = null;
        act(() => {
          followUpQuery = result.current.confirmAction('yes');
        });

        expect(followUpQuery).toBe('merge project-1 and project-2 --confirmed');
      });
    });

    describe('Duplicate Resolution Action', () => {
      it('should generate follow-up query for duplicate resolution', () => {
        const { result } = renderHook(() => useConfirmationState());

        act(() => {
          result.current.showConfirmation({
            message: 'Found duplicate project',
            originalQuery: 'analyze terrain at coordinates',
            action: 'duplicate_resolution',
          });
        });

        let followUpQuery: string | null = null;
        act(() => {
          followUpQuery = result.current.confirmAction('continue');
        });

        expect(followUpQuery).toBe('resolve duplicate: continue');
      });
    });

    describe('Generic Action', () => {
      it('should generate follow-up query for generic confirmation', () => {
        const { result } = renderHook(() => useConfirmationState());

        act(() => {
          result.current.showConfirmation({
            message: 'Confirm action?',
            originalQuery: 'some action',
            action: 'generic',
          });
        });

        let followUpQuery: string | null = null;
        act(() => {
          followUpQuery = result.current.confirmAction('yes');
        });

        expect(followUpQuery).toBe('some action --confirmed');
      });
    });

    describe('Edge Cases', () => {
      it('should return null when no confirmation state exists', () => {
        const { result } = renderHook(() => useConfirmationState());

        let followUpQuery: string | null = null;
        act(() => {
          followUpQuery = result.current.confirmAction('yes');
        });

        expect(followUpQuery).toBeNull();
      });

      it('should handle "no" as cancellation', () => {
        const { result } = renderHook(() => useConfirmationState());

        act(() => {
          result.current.showConfirmation({
            message: 'Confirm?',
            originalQuery: 'some action',
            action: 'generic',
          });
        });

        let followUpQuery: string | null = null;
        act(() => {
          followUpQuery = result.current.confirmAction('no');
        });

        expect(followUpQuery).toBeNull();
        expect(result.current.confirmationState).toBeNull();
      });
    });
  });
});
