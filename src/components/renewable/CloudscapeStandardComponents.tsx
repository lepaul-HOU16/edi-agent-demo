/**
 * CloudscapeStandardComponents - Standardized Cloudscape components for renewable energy
 * 
 * Provides consistent, reusable components that follow Cloudscape design system
 * patterns and eliminate custom styling conflicts.
 */

import React from 'react';
import { 
  Box, 
  Container, 
  Header, 
  SpaceBetween, 
  ColumnLayout,
  StatusIndicator,
  Badge,
  Button,
  Alert,
  ProgressBar,
  Spinner
} from '@cloudscape-design/components';

// ============================================================================
// Metric Display Components
// ============================================================================

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  status?: 'success' | 'warning' | 'error' | 'info';
  description?: string;
  trend?: 'up' | 'down' | 'stable';
  size?: 'small' | 'medium' | 'large';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  unit,
  status = 'info',
  description,
  trend,
  size = 'medium'
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-status-success';
      case 'warning': return 'text-status-warning';
      case 'error': return 'text-status-error';
      default: return 'text-status-info';
    }
  };

  const getFontSize = (size: string) => {
    switch (size) {
      case 'small': return 'heading-s';
      case 'large': return 'heading-xl';
      default: return 'heading-l';
    }
  };

  return (
    <Box padding="s">
      <SpaceBetween direction="vertical" size="xs">
        <Box variant="awsui-key-label">{label}</Box>
        <Box variant={getFontSize(size)} color={getStatusColor(status)}>
          {value}{unit && <Box variant="span" color="text-body-secondary"> {unit}</Box>}
        </Box>
        {description && (
          <Box variant="small" color="text-body-secondary">
            {description}
          </Box>
        )}
        {trend && (
          <StatusIndicator type={
            trend === 'up' ? 'success' : 
            trend === 'down' ? 'error' : 'info'
          }>
            {trend === 'up' ? 'Improving' : 
             trend === 'down' ? 'Declining' : 'Stable'}
          </StatusIndicator>
        )}
      </SpaceBetween>
    </Box>
  );
};

interface MetricGridProps {
  metrics: Array<{
    label: string;
    value: string | number;
    unit?: string;
    status?: 'success' | 'warning' | 'error' | 'info';
    description?: string;
  }>;
  columns?: number;
}

export const MetricGrid: React.FC<MetricGridProps> = ({ 
  metrics, 
  columns = 4 
}) => (
  <ColumnLayout columns={columns} variant="text-grid">
    {metrics.map((metric, index) => (
      <MetricCard key={index} {...metric} />
    ))}
  </ColumnLayout>
);

// ============================================================================
// Status and Progress Components
// ============================================================================

interface StatusBadgeProps {
  status: 'success' | 'warning' | 'error' | 'info' | 'pending';
  children: React.ReactNode;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, children }) => {
  const getColor = (status: string) => {
    switch (status) {
      case 'success': return 'green';
      case 'warning': return 'yellow';
      case 'error': return 'red';
      case 'pending': return 'grey';
      default: return 'blue';
    }
  };

  return <Badge color={getColor(status)}>{children}</Badge>;
};

interface ProgressIndicatorProps {
  stage: string;
  progress?: number;
  description?: string;
  variant?: 'default' | 'flash';
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  stage,
  progress,
  description,
  variant = 'default'
}) => (
  <SpaceBetween direction="vertical" size="s">
    <Box variant="h4">{stage}</Box>
    {progress !== undefined && (
      <ProgressBar
        value={progress}
        variant={variant}
        label="Progress"
        description={description}
      />
    )}
    {description && progress === undefined && (
      <Box variant="p" color="text-body-secondary">
        {description}
      </Box>
    )}
  </SpaceBetween>
);

// ============================================================================
// Loading and Error States
// ============================================================================

interface LoadingStateProps {
  message?: string;
  size?: 'normal' | 'big';
}

export const LoadingState: React.FC<LoadingStateProps> = ({ 
  message = 'Loading...', 
  size = 'normal' 
}) => (
  <Box textAlign="center" padding="xl">
    <SpaceBetween direction="vertical" size="m">
      <Spinner size={size} />
      <Box variant="p" color="text-body-secondary">
        {message}
      </Box>
    </SpaceBetween>
  </Box>
);

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: {
    text: string;
    onClick: () => void;
    variant?: 'primary' | 'normal';
  };
  icon?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  action,
  icon = '📊'
}) => (
  <Box textAlign="center" padding="xl">
    <SpaceBetween direction="vertical" size="m">
      <Box variant="h2" color="text-body-secondary">
        {icon}
      </Box>
      <Box variant="h3">{title}</Box>
      {description && (
        <Box variant="p" color="text-body-secondary">
          {description}
        </Box>
      )}
      {action && (
        <Button
          variant={action.variant || 'primary'}
          onClick={action.onClick}
        >
          {action.text}
        </Button>
      )}
    </SpaceBetween>
  </Box>
);

// ============================================================================
// Data Display Components
// ============================================================================

interface DataSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  variant?: 'default' | 'stacked';
}

export const DataSection: React.FC<DataSectionProps> = ({
  title,
  description,
  children,
  actions,
  variant = 'default'
}) => (
  <Container
    header={
      <Header
        variant="h2"
        description={description}
        actions={actions}
      >
        {title}
      </Header>
    }
    variant={variant}
  >
    {children}
  </Container>
);

interface KeyValuePairProps {
  label: string;
  value: React.ReactNode;
  copyable?: boolean;
}

export const KeyValuePair: React.FC<KeyValuePairProps> = ({
  label,
  value,
  copyable = false
}) => (
  <SpaceBetween direction="horizontal" size="s" alignItems="center">
    <Box variant="awsui-key-label" flex="0 0 auto">
      {label}
    </Box>
    <Box flex="1 1 auto">
      {value}
    </Box>
    {copyable && (
      <Button
        variant="icon"
        iconName="copy"
        ariaLabel={`Copy ${label}`}
        onClick={() => {
          navigator.clipboard.writeText(String(value));
        }}
      />
    )}
  </SpaceBetween>
);

interface KeyValueGridProps {
  data: Record<string, React.ReactNode>;
  columns?: number;
  copyable?: boolean;
}

export const KeyValueGrid: React.FC<KeyValueGridProps> = ({
  data,
  columns = 2,
  copyable = false
}) => (
  <ColumnLayout columns={columns} variant="text-grid">
    {Object.entries(data).map(([key, value]) => (
      <KeyValuePair
        key={key}
        label={key}
        value={value}
        copyable={copyable}
      />
    ))}
  </ColumnLayout>
);

// ============================================================================
// Visualization Container Components
// ============================================================================

interface VisualizationContainerProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  height?: string;
}

export const VisualizationContainer: React.FC<VisualizationContainerProps> = ({
  title,
  description,
  children,
  actions,
  loading = false,
  error,
  onRetry,
  height = 'auto'
}) => {
  if (loading) {
    return (
      <Container
        header={<Header variant="h3" description={description}>{title}</Header>}
      >
        <LoadingState message="Generating visualization..." />
      </Container>
    );
  }

  if (error) {
    return (
      <Container
        header={<Header variant="h3" description={description}>{title}</Header>}
      >
        <Alert
          type="error"
          header="Visualization Error"
          action={onRetry && (
            <Button onClick={onRetry} variant="primary">
              Retry
            </Button>
          )}
        >
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container
      header={
        <Header
          variant="h3"
          description={description}
          actions={actions}
        >
          {title}
        </Header>
      }
    >
      <Box minHeight={height}>
        {children}
      </Box>
    </Container>
  );
};

// ============================================================================
// Action Components
// ============================================================================

interface ActionButtonGroupProps {
  actions: Array<{
    text: string;
    onClick: () => void;
    variant?: 'primary' | 'normal' | 'link';
    iconName?: string;
    disabled?: boolean;
    loading?: boolean;
  }>;
  alignment?: 'left' | 'right' | 'center';
}

export const ActionButtonGroup: React.FC<ActionButtonGroupProps> = ({
  actions,
  alignment = 'left'
}) => (
  <Box float={alignment === 'right' ? 'right' : undefined} textAlign={alignment}>
    <SpaceBetween direction="horizontal" size="xs">
      {actions.map((action, index) => (
        <Button
          key={index}
          variant={action.variant || 'normal'}
          iconName={action.iconName}
          onClick={action.onClick}
          disabled={action.disabled}
          loading={action.loading}
        >
          {action.text}
        </Button>
      ))}
    </SpaceBetween>
  </Box>
);

// ============================================================================
// Responsive Layout Components
// ============================================================================

interface ResponsiveGridProps {
  children: React.ReactNode;
  minItemWidth?: string;
  gap?: 's' | 'm' | 'l' | 'xl';
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  minItemWidth = '300px',
  gap = 'm'
}) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: `repeat(auto-fit, minmax(${minItemWidth}, 1fr))`,
      gap: `var(--space-${gap})`
    }}
  >
    {children}
  </div>
);

interface ResponsiveContainerProps {
  children: React.ReactNode;
  breakpoint?: 'xs' | 's' | 'm' | 'l' | 'xl';
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  breakpoint = 'm'
}) => {
  const getMaxWidth = (bp: string) => {
    switch (bp) {
      case 'xs': return '480px';
      case 's': return '768px';
      case 'm': return '1024px';
      case 'l': return '1280px';
      case 'xl': return '1440px';
      default: return '100%';
    }
  };

  return (
    <Box maxWidth={getMaxWidth(breakpoint)} margin="0 auto">
      {children}
    </Box>
  );
};

// ============================================================================
// Export all components
// ============================================================================

export {
  // Metric components
  MetricCard,
  MetricGrid,
  
  // Status components
  StatusBadge,
  ProgressIndicator,
  
  // State components
  LoadingState,
  EmptyState,
  
  // Data components
  DataSection,
  KeyValuePair,
  KeyValueGrid,
  
  // Visualization components
  VisualizationContainer,
  
  // Action components
  ActionButtonGroup,
  
  // Layout components
  ResponsiveGrid,
  ResponsiveContainer
};