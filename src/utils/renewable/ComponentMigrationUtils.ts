/**
 * ComponentMigrationUtils - Utilities for migrating components to Cloudscape standards
 * 
 * Provides utilities and patterns for converting existing components to use
 * standardized Cloudscape components and design tokens.
 */

import { RenewableColors, RenewableTypography, RenewableSpacing } from './CloudscapeDesignTokens';

// ============================================================================
// Style Migration Utilities
// ============================================================================

/**
 * Convert inline styles to Cloudscape Box props
 */
export const convertInlineStylesToBoxProps = (styles: React.CSSProperties) => {
  const boxProps: any = {};

  // Convert common style properties to Box props
  if (styles.fontSize) {
    if (styles.fontSize === '24px' || styles.fontSize === '1.5rem') {
      boxProps.variant = 'heading-xl';
    } else if (styles.fontSize === '20px' || styles.fontSize === '1.25rem') {
      boxProps.variant = 'heading-l';
    } else if (styles.fontSize === '16px' || styles.fontSize === '1rem') {
      boxProps.variant = 'heading-m';
    } else if (styles.fontSize === '14px' || styles.fontSize === '0.875rem') {
      boxProps.variant = 'heading-s';
    } else if (styles.fontSize === '12px' || styles.fontSize === '0.75rem') {
      boxProps.variant = 'small';
    }
  }

  // Convert colors to Cloudscape color tokens
  if (styles.color) {
    const colorMap: Record<string, string> = {
      '#037f0c': 'text-status-success',
      '#ff9900': 'text-status-warning',
      '#d13212': 'text-status-error',
      '#0073bb': 'text-status-info',
      '#666': 'text-body-secondary',
      '#999': 'text-body-secondary'
    };
    
    if (colorMap[styles.color as string]) {
      boxProps.color = colorMap[styles.color as string];
    }
  }

  // Convert text alignment
  if (styles.textAlign) {
    boxProps.textAlign = styles.textAlign;
  }

  // Convert margins and padding
  if (styles.marginTop || styles.marginBottom) {
    // Convert pixel values to Cloudscape spacing tokens
    const spacing = styles.marginTop || styles.marginBottom;
    if (spacing === '4px') boxProps.margin = { vertical: 'xs' };
    else if (spacing === '8px') boxProps.margin = { vertical: 's' };
    else if (spacing === '12px') boxProps.margin = { vertical: 'm' };
    else if (spacing === '16px') boxProps.margin = { vertical: 'l' };
  }

  if (styles.padding) {
    const padding = styles.padding;
    if (padding === '8px') boxProps.padding = 's';
    else if (padding === '12px') boxProps.padding = 'm';
    else if (padding === '16px') boxProps.padding = 'l';
    else if (padding === '24px') boxProps.padding = 'xl';
  }

  return boxProps;
};

/**
 * Convert CSS class names to Cloudscape component props
 */
export const convertClassNamesToCloudscapeProps = (className: string) => {
  const props: any = {};

  // Common utility class conversions
  if (className.includes('text-center')) {
    props.textAlign = 'center';
  }
  if (className.includes('text-right')) {
    props.textAlign = 'right';
  }
  if (className.includes('font-bold')) {
    props.fontWeight = 'bold';
  }

  return props;
};

// ============================================================================
// Component Pattern Migrations
// ============================================================================

/**
 * Migration patterns for common component structures
 */
export const MigrationPatterns = {
  /**
   * Convert metric display with inline styles to MetricCard
   */
  metricDisplay: {
    before: `
      <div>
        <Box variant="awsui-key-label">Wake Efficiency</Box>
        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#037f0c' }}>
          85.2%
        </div>
      </div>
    `,
    after: `
      <MetricCard
        label="Wake Efficiency"
        value={85.2}
        unit="%"
        status="success"
      />
    `
  },

  /**
   * Convert loading state with inline styles to LoadingState
   */
  loadingState: {
    before: `
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <Spinner />
        <div style={{ marginTop: '16px', color: '#666' }}>
          Loading visualization...
        </div>
      </div>
    `,
    after: `
      <LoadingState message="Loading visualization..." />
    `
  },

  /**
   * Convert error display with inline styles to Alert
   */
  errorDisplay: {
    before: `
      <div style={{ padding: '16px', backgroundColor: '#fdf2f2', border: '1px solid #fca5a5' }}>
        <div style={{ color: '#d13212', fontWeight: 'bold' }}>
          Visualization Error
        </div>
        <div style={{ color: '#666', marginTop: '8px' }}>
          Unable to display visualization content.
        </div>
      </div>
    `,
    after: `
      <Alert
        type="error"
        header="Visualization Error"
      >
        Unable to display visualization content.
      </Alert>
    `
  },

  /**
   * Convert button group with inline styles to ActionButtonGroup
   */
  buttonGroup: {
    before: `
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <Button variant="normal" onClick={onExport}>Export</Button>
        <Button variant="primary" onClick={onAnalyze}>Analyze</Button>
      </div>
    `,
    after: `
      <ActionButtonGroup
        alignment="right"
        actions={[
          { text: 'Export', onClick: onExport, iconName: 'download' },
          { text: 'Analyze', onClick: onAnalyze, variant: 'primary', iconName: 'search' }
        ]}
      />
    `
  }
};

// ============================================================================
// Automated Migration Functions
// ============================================================================

/**
 * Analyze component for migration opportunities
 */
export const analyzeComponentForMigration = (componentCode: string) => {
  const issues: Array<{
    type: 'inline-style' | 'custom-class' | 'non-cloudscape-component';
    line: number;
    description: string;
    suggestion: string;
  }> = [];

  const lines = componentCode.split('\n');

  lines.forEach((line, index) => {
    // Check for inline styles
    if (line.includes('style={{') || line.includes('style={')) {
      issues.push({
        type: 'inline-style',
        line: index + 1,
        description: 'Inline styles found',
        suggestion: 'Convert to Cloudscape Box props or design tokens'
      });
    }

    // Check for custom CSS classes
    if (line.includes('className=') && !line.includes('awsui-')) {
      issues.push({
        type: 'custom-class',
        line: index + 1,
        description: 'Custom CSS classes found',
        suggestion: 'Use Cloudscape component props instead'
      });
    }

    // Check for non-Cloudscape components that could be replaced
    const nonCloudscapePatterns = [
      { pattern: /<div.*textAlign.*center/, suggestion: 'Use Box with textAlign="center"' },
      { pattern: /<span.*color/, suggestion: 'Use Box with color prop' },
      { pattern: /<button/, suggestion: 'Use Cloudscape Button component' }
    ];

    nonCloudscapePatterns.forEach(({ pattern, suggestion }) => {
      if (pattern.test(line)) {
        issues.push({
          type: 'non-cloudscape-component',
          line: index + 1,
          description: 'Non-Cloudscape component found',
          suggestion
        });
      }
    });
  });

  return issues;
};

/**
 * Generate migration suggestions for a component
 */
export const generateMigrationSuggestions = (componentName: string, issues: any[]) => {
  const suggestions = {
    summary: `Found ${issues.length} migration opportunities in ${componentName}`,
    priority: issues.length > 10 ? 'high' : issues.length > 5 ? 'medium' : 'low',
    categories: {
      'inline-style': issues.filter(i => i.type === 'inline-style').length,
      'custom-class': issues.filter(i => i.type === 'custom-class').length,
      'non-cloudscape-component': issues.filter(i => i.type === 'non-cloudscape-component').length
    },
    recommendations: [
      'Import standardized components from CloudscapeStandardComponents',
      'Use design tokens from CloudscapeDesignTokens',
      'Replace inline styles with Box component props',
      'Use Cloudscape spacing and color tokens',
      'Implement responsive design with ResponsiveGrid'
    ]
  };

  return suggestions;
};

// ============================================================================
// Code Generation Utilities
// ============================================================================

/**
 * Generate import statements for migrated components
 */
export const generateImportStatements = (usedComponents: string[]) => {
  const cloudscapeImports = [];
  const standardImports = [];

  // Map components to their import sources
  const componentMap = {
    // Cloudscape components
    'Box': 'cloudscape',
    'Container': 'cloudscape',
    'Header': 'cloudscape',
    'SpaceBetween': 'cloudscape',
    'Alert': 'cloudscape',
    'Button': 'cloudscape',
    'StatusIndicator': 'cloudscape',
    
    // Standard components
    'MetricCard': 'standard',
    'LoadingState': 'standard',
    'EmptyState': 'standard',
    'ActionButtonGroup': 'standard',
    'VisualizationContainer': 'standard'
  };

  usedComponents.forEach(component => {
    if (componentMap[component] === 'cloudscape') {
      cloudscapeImports.push(component);
    } else if (componentMap[component] === 'standard') {
      standardImports.push(component);
    }
  });

  const imports = [];

  if (cloudscapeImports.length > 0) {
    imports.push(`import { ${cloudscapeImports.join(', ')} } from '@cloudscape-design/components';`);
  }

  if (standardImports.length > 0) {
    imports.push(`import { ${standardImports.join(', ')} } from '../CloudscapeStandardComponents';`);
  }

  return imports.join('\n');
};

/**
 * Generate TypeScript interfaces for migrated component props
 */
export const generateComponentInterface = (componentName: string, props: Record<string, string>) => {
  const interfaceName = `${componentName}Props`;
  const propDefinitions = Object.entries(props)
    .map(([key, type]) => `  ${key}: ${type};`)
    .join('\n');

  return `interface ${interfaceName} {
${propDefinitions}
}`;
};

// ============================================================================
// Validation Utilities
// ============================================================================

/**
 * Validate component against Cloudscape standards
 */
export const validateCloudscapeCompliance = (componentCode: string) => {
  const compliance = {
    score: 0,
    maxScore: 100,
    checks: {
      usesCloudscapeComponents: false,
      usesDesignTokens: false,
      noInlineStyles: false,
      noCustomCSS: false,
      responsiveDesign: false,
      accessibilityCompliant: false
    },
    suggestions: [] as string[]
  };

  // Check for Cloudscape component usage
  if (componentCode.includes('@cloudscape-design/components')) {
    compliance.checks.usesCloudscapeComponents = true;
    compliance.score += 25;
  } else {
    compliance.suggestions.push('Import and use Cloudscape components');
  }

  // Check for design token usage
  if (componentCode.includes('CloudscapeDesignTokens') || componentCode.includes('RenewableColors')) {
    compliance.checks.usesDesignTokens = true;
    compliance.score += 20;
  } else {
    compliance.suggestions.push('Use design tokens for colors and spacing');
  }

  // Check for inline styles
  if (!componentCode.includes('style={{') && !componentCode.includes('style={')) {
    compliance.checks.noInlineStyles = true;
    compliance.score += 20;
  } else {
    compliance.suggestions.push('Remove inline styles and use component props');
  }

  // Check for custom CSS
  if (!componentCode.includes('className=') || componentCode.includes('awsui-')) {
    compliance.checks.noCustomCSS = true;
    compliance.score += 15;
  } else {
    compliance.suggestions.push('Replace custom CSS with Cloudscape component props');
  }

  // Check for responsive design
  if (componentCode.includes('ResponsiveGrid') || componentCode.includes('ColumnLayout')) {
    compliance.checks.responsiveDesign = true;
    compliance.score += 10;
  } else {
    compliance.suggestions.push('Implement responsive design patterns');
  }

  // Check for accessibility
  if (componentCode.includes('ariaLabel') || componentCode.includes('aria-')) {
    compliance.checks.accessibilityCompliant = true;
    compliance.score += 10;
  } else {
    compliance.suggestions.push('Add accessibility attributes');
  }

  return compliance;
};

// ============================================================================
// Export utilities
// ============================================================================

export {
  convertInlineStylesToBoxProps,
  convertClassNamesToCloudscapeProps,
  MigrationPatterns,
  analyzeComponentForMigration,
  generateMigrationSuggestions,
  generateImportStatements,
  generateComponentInterface,
  validateCloudscapeCompliance
};