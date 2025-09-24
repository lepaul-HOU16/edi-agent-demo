/**
 * CalculationUpdateManager Component - Handles real-time calculation updates
 * Requirements: 3.4
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  LinearProgress,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Collapse,
  Stack
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Refresh,
  Settings,
  CheckCircle,
  Error,
  Warning,
  Info
} from '@mui/icons-material';
import { WellLogData } from '../../types/petrophysics';
import { 
  CalculationParameters,
  CalculationResult,
  PorosityMethod,
  ShaleVolumeMethod,
  SaturationMethod,
  PermeabilityMethod
} from '../../types/petrophysics';

// Cache interface for calculation results
export interface CalculationCache {
  [key: string]: {
    result: CalculationResult;
    timestamp: number;
    parameters: CalculationParameters;
    wellData: string; // Hash of well data
  };
}

// Update status interface
export interface UpdateStatus {
  isUpdating: boolean;
  progress: number;
  currentCalculation: string;
  completedCalculations: string[];
  failedCalculations: Array<{ name: string; error: string }>;
  totalCalculations: number;
}

// Parameter change detection interface
export interface ParameterChange {
  type: 'porosity' | 'shale_volume' | 'saturation' | 'permeability';
  parameter: string;
  oldValue: any;
  newValue: any;
  affectedWells: string[];
}

export interface CalculationUpdateManagerProps {
  wellData: WellLogData[];
  calculationParameters: CalculationParameters;
  enabledCalculations: string[];
  autoUpdate: boolean;
  cacheTimeout: number; // Cache timeout in milliseconds
  onCalculationComplete: (results: { [calculationType: string]: CalculationResult[] }) => void;
  onParameterChange: (changes: ParameterChange[]) => void;
  onCacheUpdate: (cache: CalculationCache) => void;
}

export const CalculationUpdateManager: React.FC<CalculationUpdateManagerProps> = ({
  wellData,
  calculationParameters,
  enabledCalculations,
  autoUpdate,
  cacheTimeout = 300000, // 5 minutes default
  onCalculationComplete,
  onParameterChange,
  onCacheUpdate
}) => {
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>({
    isUpdating: false,
    progress: 0,
    currentCalculation: '',
    completedCalculations: [],
    failedCalculations: [],
    totalCalculations: 0
  });

  const [calculationCache, setCalculationCache] = useState<CalculationCache>({});
  const [showDetails, setShowDetails] = useState(false);
  const [lastParameters, setLastParameters] = useState<CalculationParameters>(calculationParameters);

  // Refs for managing updates
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Generate cache key for calculation
  const generateCacheKey = useCallback((
    wellName: string,
    calculationType: string,
    parameters: CalculationParameters,
    wellDataHash: string
  ): string => {
    const paramStr = JSON.stringify(parameters);
    return `${wellName}_${calculationType}_${btoa(paramStr)}_${wellDataHash}`;
  }, []);

  // Generate hash for well data
  const generateWellDataHash = useCallback((well: WellLogData): string => {
    const dataStr = JSON.stringify({
      curves: well.curves.map(c => ({ name: c.name, data: c.data.slice(0, 10) })), // Sample first 10 points
      depthRange: well.depthRange
    });
    return btoa(dataStr).slice(0, 16); // Short hash
  }, []);

  // Detect parameter changes
  const detectParameterChanges = useCallback((
    oldParams: CalculationParameters,
    newParams: CalculationParameters
  ): ParameterChange[] => {
    const changes: ParameterChange[] = [];
    
    // Check porosity parameters
    if (oldParams.matrixDensity !== newParams.matrixDensity) {
      changes.push({
        type: 'porosity',
        parameter: 'matrixDensity',
        oldValue: oldParams.matrixDensity,
        newValue: newParams.matrixDensity,
        affectedWells: wellData.map(w => w.wellName)
      });
    }

    if (oldParams.fluidDensity !== newParams.fluidDensity) {
      changes.push({
        type: 'porosity',
        parameter: 'fluidDensity',
        oldValue: oldParams.fluidDensity,
        newValue: newParams.fluidDensity,
        affectedWells: wellData.map(w => w.wellName)
      });
    }

    // Check shale volume parameters
    if (oldParams.grClean !== newParams.grClean) {
      changes.push({
        type: 'shale_volume',
        parameter: 'grClean',
        oldValue: oldParams.grClean,
        newValue: newParams.grClean,
        affectedWells: wellData.map(w => w.wellName)
      });
    }

    if (oldParams.grShale !== newParams.grShale) {
      changes.push({
        type: 'shale_volume',
        parameter: 'grShale',
        oldValue: oldParams.grShale,
        newValue: newParams.grShale,
        affectedWells: wellData.map(w => w.wellName)
      });
    }

    // Check saturation parameters
    if (oldParams.rw !== newParams.rw) {
      changes.push({
        type: 'saturation',
        parameter: 'rw',
        oldValue: oldParams.rw,
        newValue: newParams.rw,
        affectedWells: wellData.map(w => w.wellName)
      });
    }

    if (oldParams.a !== newParams.a) {
      changes.push({
        type: 'saturation',
        parameter: 'a',
        oldValue: oldParams.a,
        newValue: newParams.a,
        affectedWells: wellData.map(w => w.wellName)
      });
    }

    if (oldParams.m !== newParams.m) {
      changes.push({
        type: 'saturation',
        parameter: 'm',
        oldValue: oldParams.m,
        newValue: newParams.m,
        affectedWells: wellData.map(w => w.wellName)
      });
    }

    if (oldParams.n !== newParams.n) {
      changes.push({
        type: 'saturation',
        parameter: 'n',
        oldValue: oldParams.n,
        newValue: newParams.n,
        affectedWells: wellData.map(w => w.wellName)
      });
    }

    return changes;
  }, [wellData]);

  // Check cache validity
  const isCacheValid = useCallback((cacheEntry: CalculationCache[string]): boolean => {
    const now = Date.now();
    return (now - cacheEntry.timestamp) < cacheTimeout;
  }, [cacheTimeout]);

  // Get cached result if available and valid
  const getCachedResult = useCallback((
    wellName: string,
    calculationType: string,
    parameters: CalculationParameters,
    wellDataHash: string
  ): CalculationResult | null => {
    const cacheKey = generateCacheKey(wellName, calculationType, parameters, wellDataHash);
    const cacheEntry = calculationCache[cacheKey];
    
    if (cacheEntry && isCacheValid(cacheEntry)) {
      return cacheEntry.result;
    }
    
    return null;
  }, [calculationCache, generateCacheKey, isCacheValid]);

  // Store result in cache
  const setCachedResult = useCallback((
    wellName: string,
    calculationType: string,
    parameters: CalculationParameters,
    wellDataHash: string,
    result: CalculationResult
  ) => {
    const cacheKey = generateCacheKey(wellName, calculationType, parameters, wellDataHash);
    const newCache = {
      ...calculationCache,
      [cacheKey]: {
        result,
        timestamp: Date.now(),
        parameters: { ...parameters },
        wellData: wellDataHash
      }
    };
    
    setCalculationCache(newCache);
    onCacheUpdate(newCache);
  }, [calculationCache, generateCacheKey, onCacheUpdate]);

  // Perform calculations with caching
  const performCalculations = useCallback(async (forceUpdate = false) => {
    if (updateStatus.isUpdating) return;

    // Abort any ongoing calculations
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    const totalCalculations = wellData.length * enabledCalculations.length;
    
    setUpdateStatus({
      isUpdating: true,
      progress: 0,
      currentCalculation: '',
      completedCalculations: [],
      failedCalculations: [],
      totalCalculations
    });

    const results: { [calculationType: string]: CalculationResult[] } = {};
    let completed = 0;

    try {
      for (const well of wellData) {
        if (signal.aborted) break;

        const wellHash = generateWellDataHash(well);
        
        for (const calculationType of enabledCalculations) {
          if (signal.aborted) break;

          setUpdateStatus(prev => ({
            ...prev,
            currentCalculation: `${calculationType} - ${well.wellName}`,
            progress: (completed / totalCalculations) * 100
          }));

          try {
            // Check cache first
            let result: CalculationResult | null = null;
            
            if (!forceUpdate) {
              result = getCachedResult(well.wellName, calculationType, calculationParameters, wellHash);
            }

            if (!result) {
              // Simulate calculation (replace with actual calculation logic)
              await new Promise(resolve => setTimeout(resolve, 100)); // Simulate work
              
              // Mock calculation result
              result = {
                values: Array.from({ length: 100 }, () => Math.random()),
                depths: Array.from({ length: 100 }, (_, i) => well.depthRange[0] + i * 10),
                uncertainty: Array.from({ length: 100 }, () => Math.random() * 0.1),
                quality: {
                  dataCompleteness: 0.95,
                  environmentalCorrections: [],
                  uncertaintyRange: [0, 0.1],
                  confidenceLevel: 'high' as const
                },
                methodology: `${calculationType} calculation`,
                parameters: calculationParameters,
                statistics: {
                  mean: 0.5,
                  median: 0.5,
                  standardDeviation: 0.1,
                  min: 0,
                  max: 1,
                  percentiles: { P10: 0.1, P50: 0.5, P90: 0.9 },
                  count: 100,
                  validCount: 100
                },
                timestamp: new Date()
              };

              // Cache the result
              setCachedResult(well.wellName, calculationType, calculationParameters, wellHash, result);
            }

            if (!results[calculationType]) {
              results[calculationType] = [];
            }
            results[calculationType].push(result);

            setUpdateStatus(prev => ({
              ...prev,
              completedCalculations: [...prev.completedCalculations, `${calculationType} - ${well.wellName}`]
            }));

          } catch (error) {
            setUpdateStatus(prev => ({
              ...prev,
              failedCalculations: [
                ...prev.failedCalculations,
                { name: `${calculationType} - ${well.wellName}`, error: (error as Error).message }
              ]
            }));
          }

          completed++;
          
          setUpdateStatus(prev => ({
            ...prev,
            progress: (completed / totalCalculations) * 100
          }));
        }
      }

      if (!signal.aborted) {
        onCalculationComplete(results);
      }

    } catch (error) {
      console.error('Calculation error:', error);
    } finally {
      setUpdateStatus(prev => ({
        ...prev,
        isUpdating: false,
        currentCalculation: '',
        progress: 100
      }));
    }
  }, [
    wellData,
    enabledCalculations,
    calculationParameters,
    updateStatus.isUpdating,
    generateWellDataHash,
    getCachedResult,
    setCachedResult,
    onCalculationComplete
  ]);

  // Handle parameter changes
  useEffect(() => {
    const changes = detectParameterChanges(lastParameters, calculationParameters);
    
    if (changes.length > 0) {
      onParameterChange(changes);
      setLastParameters(calculationParameters);
      
      if (autoUpdate) {
        // Debounce updates
        if (updateTimeoutRef.current) {
          clearTimeout(updateTimeoutRef.current);
        }
        
        updateTimeoutRef.current = setTimeout(() => {
          performCalculations();
        }, 1000); // 1 second debounce
      }
    }
  }, [calculationParameters, lastParameters, detectParameterChanges, onParameterChange, autoUpdate, performCalculations]);

  // Clean up timeouts
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Manual update trigger
  const handleManualUpdate = useCallback(() => {
    performCalculations(true);
  }, [performCalculations]);

  // Toggle auto-update (this would be controlled by parent component)
  const handleToggleDetails = useCallback(() => {
    setShowDetails(prev => !prev);
  }, []);

  // Calculate cache statistics
  const cacheStats = useMemo(() => {
    const entries = Object.values(calculationCache);
    const validEntries = entries.filter(isCacheValid);
    const totalSize = entries.length;
    const validSize = validEntries.length;
    
    return {
      total: totalSize,
      valid: validSize,
      hitRate: totalSize > 0 ? (validSize / totalSize) * 100 : 0
    };
  }, [calculationCache, isCacheValid]);

  return (
    <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" component="h3">
          Calculation Updates
        </Typography>
        
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            size="small"
            label={`Cache: ${cacheStats.valid}/${cacheStats.total} (${cacheStats.hitRate.toFixed(1)}%)`}
            color={cacheStats.hitRate > 80 ? 'success' : cacheStats.hitRate > 50 ? 'warning' : 'error'}
          />
          
          <Tooltip title="Manual Update">
            <IconButton
              size="small"
              onClick={handleManualUpdate}
              disabled={updateStatus.isUpdating}
            >
              <Refresh />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Show Details">
            <IconButton size="small" onClick={handleToggleDetails}>
              <Settings />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* Progress indicator */}
      {updateStatus.isUpdating && (
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {updateStatus.currentCalculation}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {Math.round(updateStatus.progress)}%
            </Typography>
          </Box>
          <LinearProgress variant="determinate" value={updateStatus.progress} />
        </Box>
      )}

      {/* Status indicators */}
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        {updateStatus.completedCalculations.length > 0 && (
          <Chip
            size="small"
            icon={<CheckCircle />}
            label={`${updateStatus.completedCalculations.length} completed`}
            color="success"
          />
        )}
        
        {updateStatus.failedCalculations.length > 0 && (
          <Chip
            size="small"
            icon={<Error />}
            label={`${updateStatus.failedCalculations.length} failed`}
            color="error"
          />
        )}
        
        {autoUpdate && (
          <Chip
            size="small"
            icon={<PlayArrow />}
            label="Auto-update enabled"
            color="primary"
          />
        )}
      </Stack>

      {/* Detailed status */}
      <Collapse in={showDetails}>
        <Stack spacing={1}>
          {updateStatus.failedCalculations.map((failure, index) => (
            <Alert key={index} severity="error">
              <Typography variant="body2">
                <strong>{failure.name}:</strong> {failure.error}
              </Typography>
            </Alert>
          ))}
          
          {updateStatus.completedCalculations.length > 0 && (
            <Alert severity="success">
              <Typography variant="body2">
                Recently completed: {updateStatus.completedCalculations.slice(-3).join(', ')}
                {updateStatus.completedCalculations.length > 3 && ` and ${updateStatus.completedCalculations.length - 3} more`}
              </Typography>
            </Alert>
          )}
          
          <Alert severity="info">
            <Typography variant="body2">
              Cache contains {cacheStats.total} entries, {cacheStats.valid} valid. 
              Cache timeout: {Math.round(cacheTimeout / 60000)} minutes.
            </Typography>
          </Alert>
        </Stack>
      </Collapse>
    </Paper>
  );
};

export default CalculationUpdateManager;