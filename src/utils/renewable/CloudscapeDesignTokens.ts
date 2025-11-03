/**
 * CloudscapeDesignTokens - Standardized design tokens for renewable energy components
 * 
 * Provides consistent design tokens, color schemes, and styling utilities
 * that align with Cloudscape design system principles.
 */

// ============================================================================
// Color Tokens
// ============================================================================

export const RenewableColors = {
  // Status colors (aligned with Cloudscape)
  success: '#037f0c',
  warning: '#ff9900', 
  error: '#d13212',
  info: '#0073bb',
  
  // Renewable energy specific colors
  wind: {
    primary: '#0073bb',
    secondary: '#5294cf',
    light: '#e1f2ff'
  },
  
  solar: {
    primary: '#ff9900',
    secondary: '#ffb84d',
    light: '#fff4e6'
  },
  
  terrain: {
    buildings: '#d13212',
    roads: '#ff9900',
    water: '#0073bb',
    vegetation: '#037f0c',
    power: '#8c4fff'
  },
  
  // Performance indicators
  performance: {
    excellent: '#037f0c',
    good: '#0073bb',
    moderate: '#ff9900',
    poor: '#d13212'
  },
  
  // Wake analysis colors
  wake: {
    noWake: '#037f0c',
    lowWake: '#0073bb',
    moderateWake: '#ff9900',
    highWake: '#d13212'
  }
} as const;

// ============================================================================
// Typography Tokens
// ============================================================================

export const RenewableTypography = {
  // Metric display
  metric: {
    small: 'heading-s',
    medium: 'heading-l', 
    large: 'heading-xl'
  },
  
  // Content hierarchy
  title: 'heading-xl',
  subtitle: 'heading-l',
  sectionHeader: 'heading-m',
  subsectionHeader: 'heading-s',
  
  // Body text
  body: 'p',
  caption: 'small',
  label: 'awsui-key-label'
} as const;

// ============================================================================
// Spacing Tokens
// ============================================================================

export const RenewableSpacing = {
  // Component spacing
  component: {
    tight: 's',
    normal: 'm',
    loose: 'l',
    extraLoose: 'xl'
  },
  
  // Layout spacing
  layout: {
    section: 'l',
    subsection: 'm',
    item: 's'
  },
  
  // Container padding
  container: {
    compact: 's',
    normal: 'm',
    spacious: 'l'
  }
} as const;

// ============================================================================
// Size Tokens
// ============================================================================

export const RenewableSizes = {
  // Visualization dimensions
  visualization: {
    small: { width: '100%', height: '300px' },
    medium: { width: '100%', height: '400px' },
    large: { width: '100%', height: '500px' },
    extraLarge: { width: '100%', height: '600px' }
  },
  
  // Container dimensions
  container: {
    narrow: '600px',
    medium: '800px',
    wide: '1200px',
    full: '100%'
  },
  
  // Grid breakpoints
  breakpoints: {
    xs: '480px',
    sm: '768px',
    md: '1024px',
    lg: '1280px',
    xl: '1440px'
  }
} as const;

// ============================================================================
// Component Variants
// ============================================================================

export const RenewableVariants = {
  // Alert variants for different scenarios
  alerts: {
    dataUnavailable: {
      type: 'warning' as const,
      header: 'Data Unavailable',
      iconName: 'status-warning'
    },
    processingError: {
      type: 'error' as const,
      header: 'Processing Error',
      iconName: 'status-negative'
    },
    analysisComplete: {
      type: 'success' as const,
      header: 'Analysis Complete',
      iconName: 'status-positive'
    },
    loadingData: {
      type: 'info' as const,
      header: 'Loading Data',
      iconName: 'status-info'
    }
  },
  
  // Button variants for common actions
  buttons: {
    export: {
      variant: 'normal' as const,
      iconName: 'download'
    },
    retry: {
      variant: 'primary' as const,
      iconName: 'refresh'
    },
    analyze: {
      variant: 'primary' as const,
      iconName: 'search'
    },
    optimize: {
      variant: 'primary' as const,
      iconName: 'settings'
    }
  },
  
  // Status indicators for different states
  statusIndicators: {
    healthy: {
      type: 'success' as const,
      children: 'Healthy'
    },
    degraded: {
      type: 'warning' as const,
      children: 'Degraded'
    },
    failed: {
      type: 'error' as const,
      children: 'Failed'
    },
    pending: {
      type: 'pending' as const,
      children: 'Pending'
    }
  }
} as const;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get color based on performance value
 */
export const getPerformanceColor = (value: number, thresholds = {
  excellent: 0.8,
  good: 0.6,
  moderate: 0.4
}): string => {
  if (value >= thresholds.excellent) return RenewableColors.performance.excellent;
  if (value >= thresholds.good) return RenewableColors.performance.good;
  if (value >= thresholds.moderate) return RenewableColors.performance.moderate;
  return RenewableColors.performance.poor;
};

/**
 * Get wake impact color based on loss percentage
 */
export const getWakeImpactColor = (wakeLoss: number): string => {
  if (wakeLoss < 0.05) return RenewableColors.wake.noWake;
  if (wakeLoss < 0.08) return RenewableColors.wake.lowWake;
  if (wakeLoss < 0.15) return RenewableColors.wake.moderateWake;
  return RenewableColors.wake.highWake;
};

/**
 * Get status color based on value and type
 */
export const getStatusColor = (
  value: number,
  type: 'efficiency' | 'loss' | 'score',
  thresholds?: { good: number; moderate: number }
): string => {
  const defaultThresholds = {
    efficiency: { good: 0.8, moderate: 0.6 },
    loss: { good: 0.05, moderate: 0.1 },
    score: { good: 80, moderate: 60 }
  };

  const t = thresholds || defaultThresholds[type];

  if (type === 'loss') {
    // For losses, lower is better
    if (value <= t.good) return RenewableColors.success;
    if (value <= t.moderate) return RenewableColors.warning;
    return RenewableColors.error;
  } else {
    // For efficiency and scores, higher is better
    if (value >= t.good) return RenewableColors.success;
    if (value >= t.moderate) return RenewableColors.warning;
    return RenewableColors.error;
  }
};

/**
 * Get responsive column count based on screen size
 */
export const getResponsiveColumns = (
  screenWidth: number,
  itemMinWidth = 300
): number => {
  return Math.max(1, Math.floor(screenWidth / itemMinWidth));
};

/**
 * Format metric value with appropriate units and precision
 */
export const formatMetricValue = (
  value: number,
  type: 'percentage' | 'power' | 'energy' | 'currency' | 'count',
  precision = 1
): { value: string; unit: string } => {
  switch (type) {
    case 'percentage':
      return { value: value.toFixed(precision), unit: '%' };
    
    case 'power':
      if (value >= 1000) {
        return { value: (value / 1000).toFixed(precision), unit: 'MW' };
      }
      return { value: value.toFixed(precision), unit: 'kW' };
    
    case 'energy':
      if (value >= 1000) {
        return { value: (value / 1000).toFixed(precision), unit: 'GWh' };
      }
      return { value: value.toFixed(precision), unit: 'MWh' };
    
    case 'currency':
      if (value >= 1000000) {
        return { value: (value / 1000000).toFixed(precision), unit: 'M' };
      }
      if (value >= 1000) {
        return { value: (value / 1000).toFixed(precision), unit: 'K' };
      }
      return { value: value.toFixed(precision), unit: '' };
    
    case 'count':
      return { value: Math.round(value).toString(), unit: '' };
    
    default:
      return { value: value.toFixed(precision), unit: '' };
  }
};

/**
 * Get appropriate visualization size based on content type
 */
export const getVisualizationSize = (
  contentType: 'chart' | 'map' | 'table' | 'summary',
  complexity: 'simple' | 'moderate' | 'complex' = 'moderate'
) => {
  const sizeMap = {
    chart: {
      simple: RenewableSizes.visualization.small,
      moderate: RenewableSizes.visualization.medium,
      complex: RenewableSizes.visualization.large
    },
    map: {
      simple: RenewableSizes.visualization.medium,
      moderate: RenewableSizes.visualization.large,
      complex: RenewableSizes.visualization.extraLarge
    },
    table: {
      simple: RenewableSizes.visualization.small,
      moderate: RenewableSizes.visualization.medium,
      complex: RenewableSizes.visualization.large
    },
    summary: {
      simple: RenewableSizes.visualization.small,
      moderate: RenewableSizes.visualization.small,
      complex: RenewableSizes.visualization.medium
    }
  };

  return sizeMap[contentType][complexity];
};

// ============================================================================
// CSS-in-JS Utilities (for when Cloudscape tokens aren't sufficient)
// ============================================================================

/**
 * Generate CSS custom properties for renewable energy themes
 */
export const generateRenewableTheme = () => ({
  '--renewable-color-wind-primary': RenewableColors.wind.primary,
  '--renewable-color-wind-secondary': RenewableColors.wind.secondary,
  '--renewable-color-wind-light': RenewableColors.wind.light,
  
  '--renewable-color-solar-primary': RenewableColors.solar.primary,
  '--renewable-color-solar-secondary': RenewableColors.solar.secondary,
  '--renewable-color-solar-light': RenewableColors.solar.light,
  
  '--renewable-color-success': RenewableColors.success,
  '--renewable-color-warning': RenewableColors.warning,
  '--renewable-color-error': RenewableColors.error,
  '--renewable-color-info': RenewableColors.info
});

/**
 * Responsive breakpoint utilities
 */
export const mediaQueries = {
  xs: `@media (max-width: ${RenewableSizes.breakpoints.xs})`,
  sm: `@media (max-width: ${RenewableSizes.breakpoints.sm})`,
  md: `@media (max-width: ${RenewableSizes.breakpoints.md})`,
  lg: `@media (max-width: ${RenewableSizes.breakpoints.lg})`,
  xl: `@media (max-width: ${RenewableSizes.breakpoints.xl})`
};

// ============================================================================
// Export all tokens and utilities
// ============================================================================

export default {
  colors: RenewableColors,
  typography: RenewableTypography,
  spacing: RenewableSpacing,
  sizes: RenewableSizes,
  variants: RenewableVariants,
  utils: {
    getPerformanceColor,
    getWakeImpactColor,
    getStatusColor,
    getResponsiveColumns,
    formatMetricValue,
    getVisualizationSize,
    generateRenewableTheme,
    mediaQueries
  }
};