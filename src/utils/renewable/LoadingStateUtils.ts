/**
 * Standardized loading state management utilities for renewable energy components
 * Provides consistent loading patterns, progress tracking, and state management
 */

import { useState, useCallback, useRef, useEffect } from 'react';

export interface LoadingState {
  isLoading: boolean;
  progress?: number;
  stage?: string;
  error?: string;
}

export interface LoadingOptions {
  timeout?: number;
  stages?: string[];
  onTimeout?: () => void;
  onStageChange?: (stage: string) => void;
}

/**
 * Standardized loading state hook for renewable components
 */
export const useRenewableLoading = (options: LoadingOptions = {}) => {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    progress: 0,
    stage: undefined,
    error: undefined
  });

  const timeoutRef = useRef<NodeJS.Timeout>();
  const stageIndexRef = useRef(0);

  const startLoading = useCallback((initialStage?: string) => {
    setLoadingState({
      isLoading: true,
      progress: 0,
      stage: initialStage || options.stages?.[0],
      error: undefined
    });

    stageIndexRef.current = 0;

    // Set timeout if specified
    if (options.timeout) {
      timeoutRef.current = setTimeout(() => {
        setLoadingState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Operation timed out'
        }));
        options.onTimeout?.();
      }, options.timeout);
    }
  }, [options]);

  const updateProgress = useCallback((progress: number, stage?: string) => {
    setLoadingState(prev => ({
      ...prev,
      progress: Math.min(100, Math.max(0, progress)),
      stage: stage || prev.stage
    }));

    if (stage && options.onStageChange) {
      options.onStageChange(stage);
    }
  }, [options]);

  const nextStage = useCallback(() => {
    if (options.stages && stageIndexRef.current < options.stages.length - 1) {
      stageIndexRef.current++;
      const nextStage = options.stages[stageIndexRef.current];
      updateProgress(
        ((stageIndexRef.current + 1) / options.stages.length) * 100,
        nextStage
      );
    }
  }, [options.stages, updateProgress]);

  const finishLoading = useCallback((error?: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setLoadingState({
      isLoading: false,
      progress: error ? undefined : 100,
      stage: undefined,
      error
    });
  }, []);

  const resetLoading = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setLoadingState({
      isLoading: false,
      progress: 0,
      stage: undefined,
      error: undefined
    });
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    ...loadingState,
    startLoading,
    updateProgress,
    nextStage,
    finishLoading,
    resetLoading
  };
};

/**
 * Standardized loading state for export operations
 */
export const useExportLoading = () => {
  return useRenewableLoading({
    timeout: 30000, // 30 second timeout for exports
    stages: [
      'Preparing data...',
      'Generating export...',
      'Finalizing...'
    ]
  });
};

/**
 * Standardized loading state for visualization generation
 */
export const useVisualizationLoading = () => {
  return useRenewableLoading({
    timeout: 15000, // 15 second timeout for visualizations
    stages: [
      'Loading data...',
      'Processing...',
      'Rendering visualization...'
    ]
  });
};

/**
 * Standardized loading state for analysis operations
 */
export const useAnalysisLoading = () => {
  return useRenewableLoading({
    timeout: 60000, // 60 second timeout for complex analysis
    stages: [
      'Initializing analysis...',
      'Processing data...',
      'Running calculations...',
      'Generating results...'
    ]
  });
};

/**
 * Loading state manager for multiple concurrent operations
 */
export class LoadingStateManager {
  private operations = new Map<string, LoadingState>();
  private listeners = new Set<(states: Map<string, LoadingState>) => void>();

  public startOperation(id: string, stage?: string): void {
    this.operations.set(id, {
      isLoading: true,
      progress: 0,
      stage,
      error: undefined
    });
    this.notifyListeners();
  }

  public updateOperation(id: string, updates: Partial<LoadingState>): void {
    const current = this.operations.get(id);
    if (current) {
      this.operations.set(id, { ...current, ...updates });
      this.notifyListeners();
    }
  }

  public finishOperation(id: string, error?: string): void {
    this.operations.set(id, {
      isLoading: false,
      progress: error ? undefined : 100,
      stage: undefined,
      error
    });
    this.notifyListeners();
  }

  public removeOperation(id: string): void {
    this.operations.delete(id);
    this.notifyListeners();
  }

  public getOperation(id: string): LoadingState | undefined {
    return this.operations.get(id);
  }

  public getAllOperations(): Map<string, LoadingState> {
    return new Map(this.operations);
  }

  public isAnyLoading(): boolean {
    return Array.from(this.operations.values()).some(state => state.isLoading);
  }

  public subscribe(listener: (states: Map<string, LoadingState>) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.getAllOperations()));
  }
}

/**
 * Global loading state manager instance
 */
export const globalLoadingManager = new LoadingStateManager();

/**
 * Hook to use the global loading state manager
 */
export const useGlobalLoadingState = () => {
  const [states, setStates] = useState<Map<string, LoadingState>>(new Map());

  useEffect(() => {
    const unsubscribe = globalLoadingManager.subscribe(setStates);
    setStates(globalLoadingManager.getAllOperations());
    return unsubscribe;
  }, []);

  return {
    states,
    startOperation: globalLoadingManager.startOperation.bind(globalLoadingManager),
    updateOperation: globalLoadingManager.updateOperation.bind(globalLoadingManager),
    finishOperation: globalLoadingManager.finishOperation.bind(globalLoadingManager),
    removeOperation: globalLoadingManager.removeOperation.bind(globalLoadingManager),
    isAnyLoading: globalLoadingManager.isAnyLoading.bind(globalLoadingManager)
  };
};