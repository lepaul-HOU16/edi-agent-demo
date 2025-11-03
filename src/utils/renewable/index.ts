/**
 * Standardized utilities for renewable energy components
 * Provides consistent patterns for error handling, loading states, validation, exports,
 * Cloudscape design system compliance, and component migration.
 */

// Error handling utilities
export {
  RenewableErrorHandler,
  handleRenewableError,
  useRenewableErrorHandler,
  type ErrorContext,
  type FormattedError
} from './ErrorHandlingUtils';

// Loading state utilities
export {
  useRenewableLoading,
  useExportLoading,
  useVisualizationLoading,
  useAnalysisLoading,
  LoadingStateManager,
  globalLoadingManager,
  useGlobalLoadingState,
  type LoadingState,
  type LoadingOptions
} from './LoadingStateUtils';

// Data validation utilities
export {
  RenewableDataValidator,
  RenewableValidators,
  ValidationUtils,
  useRenewableValidation,
  type ValidationRule,
  type ValidationResult,
  type ValidationError,
  type ValidationWarning
} from './DataValidationUtils';

// Export utilities
export {
  RenewableExportService,
  useRenewableExport,
  ExportUtils,
  type ExportOptions,
  type ExportData,
  type ExportResult
} from './ExportUtils';

// Cloudscape design tokens and utilities
export {
  RenewableColors,
  RenewableTypography,
  RenewableSpacing,
  RenewableSizes,
  RenewableVariants,
  getPerformanceColor,
  getWakeImpactColor,
  getStatusColor,
  getResponsiveColumns,
  formatMetricValue,
  getVisualizationSize,
  generateRenewableTheme,
  mediaQueries
} from './CloudscapeDesignTokens';

// Component migration utilities
export {
  convertInlineStylesToBoxProps,
  convertClassNamesToCloudscapeProps,
  MigrationPatterns,
  analyzeComponentForMigration,
  generateMigrationSuggestions,
  generateImportStatements,
  generateComponentInterface,
  validateCloudscapeCompliance
} from './ComponentMigrationUtils';