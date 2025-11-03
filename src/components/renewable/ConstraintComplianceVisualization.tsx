/**
 * Constraint Compliance Visualization Component
 * 
 * Shows constraint compliance validation and setback visualization
 * for the optimized turbine layout.
 */

import React, { useMemo } from 'react';
import {
  Container,
  Header,
  SpaceBetween,
  Box,
  ColumnLayout,
  ProgressBar,
  StatusIndicator,
  Badge,
  Alert,
  Table,
  TableProps,
  Button,
  Popover
} from '@cloudscape-design/components';
import {
  ConstraintCompliance,
  ConstraintViolation,
  OptimizedLayout,
  OptimizationConstraint,
  ConstraintType
} from '../../types/layoutOptimization';

// ============================================================================
// Component Props
// ============================================================================

interface ConstraintComplianceVisualizationProps {
  constraintCompliance: ConstraintCompliance;
  layout: OptimizedLayout;
  constraints: OptimizationConstraint[];
  onFixViolation?: (violationId: string) => void;
  onRelaxConstraint?: (constraintId: string) => void;
  onShowViolationDetails?: (violation: ConstraintViolation) => void;
}

// ============================================================================
// Helper Types
// ============================================================================

interface ConstraintSummary {
  type: ConstraintType;
  total: number;
  satisfied: number;
  violated: number;
  compliance: number;
  severity: 'success' | 'warning' | 'error';
}

interface ViolationTableItem {
  id: string;
  constraintType: ConstraintType;
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  description: string;
  affectedTurbines: number;
  violationMagnitude: number;
  penalty: number;
  mitigationOptions: string[];
}

// ============================================================================
// Main Component
// ============================================================================

export const ConstraintComplianceVisualization: React.FC<ConstraintComplianceVisualizationProps> = ({
  constraintCompliance,
  layout,
  constraints,
  onFixViolation,
  onRelaxConstraint,
  onShowViolationDetails
}) => {
  // ============================================================================
  // Computed Values
  // ============================================================================

  const constraintSummary = useMemo(() => {
    const summaryMap = new Map<ConstraintType, ConstraintSummary>();
    
    // Initialize summary for all constraint types
    constraints.forEach(constraint => {
      if (!summaryMap.has(constraint.type)) {
        summaryMap.set(constraint.type, {
          type: constraint.type,
          total: 0,
          satisfied: 0,
          violated: 0,
          compliance: 100,
          severity: 'success'
        });
      }
      const summary = summaryMap.get(constraint.type)!;
      summary.total++;
    });
    
    // Count violations by type
    layout.constraintViolations.forEach(violation => {
      const summary = summaryMap.get(violation.constraintType);
      if (summary) {
        summary.violated++;
      }
    });
    
    // Calculate compliance and severity
    summaryMap.forEach(summary => {
      summary.satisfied = summary.total - summary.violated;
      summary.compliance = summary.total > 0 ? (summary.satisfied / summary.total) * 100 : 100;
      
      if (summary.compliance >= 95) summary.severity = 'success';
      else if (summary.compliance >= 80) summary.severity = 'warning';
      else summary.severity = 'error';
    });
    
    return Array.from(summaryMap.values());
  }, [constraints, layout.constraintViolations]);

  const violationTableItems = useMemo((): ViolationTableItem[] => {
    return layout.constraintViolations.map(violation => ({
      id: violation.constraintId,
      constraintType: violation.constraintType,
      severity: violation.severity,
      description: violation.description,
      affectedTurbines: violation.affectedTurbines.length,
      violationMagnitude: violation.violationMagnitude,
      penalty: violation.penalty,
      mitigationOptions: violation.mitigationOptions
    }));
  }, [layout.constraintViolations]);

  const overallStatus = useMemo(() => {
    const compliance = constraintCompliance.overallCompliance;
    if (compliance >= 95) return { type: 'success' as const, label: 'Excellent', color: 'green' };
    if (compliance >= 85) return { type: 'warning' as const, label: 'Good', color: 'yellow' };
    if (compliance >= 70) return { type: 'error' as const, label: 'Needs Improvement', color: 'red' };
    return { type: 'error' as const, label: 'Poor', color: 'red' };
  }, [constraintCompliance.overallCompliance]);

  // ============================================================================
  // Event Handlers
  // ============================================================================

  const handleFixViolation = (violationId: string) => {
    onFixViolation?.(violationId);
  };

  const handleRelaxConstraint = (constraintId: string) => {
    onRelaxConstraint?.(constraintId);
  };

  const handleShowDetails = (violation: ConstraintViolation) => {
    onShowViolationDetails?.(violation);
  };

  // ============================================================================
  // Render Methods
  // ============================================================================

  const renderOverallCompliance = () => (
    <Container header={<Header variant="h2">Overall Compliance</Header>}>
      <SpaceBetween direction="vertical" size="m">
        <Box>
          <SpaceBetween direction="horizontal" size="s" alignItems="center">
            <Box variant="h1">{constraintCompliance.overallCompliance.toFixed(1)}%</Box>
            <StatusIndicator type={overallStatus.type}>
              {overallStatus.label}
            </StatusIndicator>
            <Badge color={overallStatus.color}>
              {constraintCompliance.hardConstraintViolations === 0 ? 'Feasible' : 'Infeasible'}
            </Badge>
          </SpaceBetween>
        </Box>
        
        <ProgressBar
          value={constraintCompliance.overallCompliance}
          additionalInfo={`${constraintCompliance.hardConstraintViolations} hard violations, ${constraintCompliance.softConstraintViolations} soft violations`}
          description="Percentage of constraints satisfied"
          variant={overallStatus.type === 'error' ? 'error' : undefined}
        />
        
        <ColumnLayout columns={3} variant="text-grid">
          <Box>
            <Box variant="awsui-key-label">Total Constraints</Box>
            <Box variant="h3">{constraints.filter(c => c.active).length}</Box>
          </Box>
          <Box>
            <Box variant="awsui-key-label">Hard Violations</Box>
            <Box variant="h3" color={constraintCompliance.hardConstraintViolations > 0 ? 'text-status-error' : 'text-status-success'}>
              {constraintCompliance.hardConstraintViolations}
            </Box>
          </Box>
          <Box>
            <Box variant="awsui-key-label">Soft Violations</Box>
            <Box variant="h3" color={constraintCompliance.softConstraintViolations > 0 ? 'text-status-warning' : 'text-status-success'}>
              {constraintCompliance.softConstraintViolations}
            </Box>
          </Box>
        </ColumnLayout>
      </SpaceBetween>
    </Container>
  );

  const renderConstraintSummary = () => (
    <Container header={<Header variant="h2">Constraint Summary by Type</Header>}>
      <Table
        columnDefinitions={[
          {
            id: 'type',
            header: 'Constraint Type',
            cell: (item: ConstraintSummary) => (
              <Box>
                {item.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Box>
            )
          },
          {
            id: 'compliance',
            header: 'Compliance',
            cell: (item: ConstraintSummary) => (
              <SpaceBetween direction="horizontal" size="s" alignItems="center">
                <ProgressBar
                  value={item.compliance}
                  variant={item.severity === 'error' ? 'error' : undefined}
                />
                <Box variant="small">{item.compliance.toFixed(1)}%</Box>
              </SpaceBetween>
            )
          },
          {
            id: 'status',
            header: 'Status',
            cell: (item: ConstraintSummary) => (
              <StatusIndicator type={item.severity}>
                {item.satisfied}/{item.total} satisfied
              </StatusIndicator>
            )
          },
          {
            id: 'violations',
            header: 'Violations',
            cell: (item: ConstraintSummary) => (
              <Badge color={item.violated > 0 ? 'red' : 'green'}>
                {item.violated}
              </Badge>
            )
          }
        ]}
        items={constraintSummary}
        variant="embedded"
        empty={
          <Box textAlign="center" color="inherit">
            <Box variant="strong" textAlign="center" color="inherit">
              No constraint data available
            </Box>
          </Box>
        }
      />
    </Container>
  );

  const renderViolationDetails = () => {
    if (violationTableItems.length === 0) {
      return (
        <Container header={<Header variant="h2">Constraint Violations</Header>}>
          <Box textAlign="center" padding="l">
            <StatusIndicator type="success">
              No constraint violations found
            </StatusIndicator>
            <Box variant="p" padding={{ top: 's' }}>
              All turbines are positioned in compliance with the specified constraints.
            </Box>
          </Box>
        </Container>
      );
    }

    return (
      <Container header={<Header variant="h2">Constraint Violations</Header>}>
        <Table
          columnDefinitions={[
            {
              id: 'severity',
              header: 'Severity',
              cell: (item: ViolationTableItem) => {
                const severityConfig = {
                  critical: { type: 'error' as const, color: 'red' },
                  major: { type: 'error' as const, color: 'red' },
                  moderate: { type: 'warning' as const, color: 'yellow' },
                  minor: { type: 'info' as const, color: 'blue' }
                };
                const config = severityConfig[item.severity];
                return (
                  <Badge color={config.color}>
                    {item.severity.toUpperCase()}
                  </Badge>
                );
              }
            },
            {
              id: 'type',
              header: 'Constraint Type',
              cell: (item: ViolationTableItem) => (
                <Box>
                  {item.constraintType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Box>
              )
            },
            {
              id: 'description',
              header: 'Description',
              cell: (item: ViolationTableItem) => (
                <Box variant="small">{item.description}</Box>
              )
            },
            {
              id: 'affected',
              header: 'Affected Turbines',
              cell: (item: ViolationTableItem) => (
                <Badge>{item.affectedTurbines}</Badge>
              )
            },
            {
              id: 'magnitude',
              header: 'Violation Magnitude',
              cell: (item: ViolationTableItem) => (
                <Box>{item.violationMagnitude.toFixed(2)}</Box>
              )
            },
            {
              id: 'penalty',
              header: 'Penalty',
              cell: (item: ViolationTableItem) => (
                <Box>{item.penalty.toLocaleString()}</Box>
              )
            },
            {
              id: 'actions',
              header: 'Actions',
              cell: (item: ViolationTableItem) => (
                <SpaceBetween direction="horizontal" size="xs">
                  <Button
                    variant="link"
                    onClick={() => handleFixViolation(item.id)}
                  >
                    Fix
                  </Button>
                  <Popover
                    dismissButton={false}
                    position="top"
                    size="small"
                    triggerType="custom"
                    content={
                      <SpaceBetween direction="vertical" size="xs">
                        <Box variant="strong">Mitigation Options:</Box>
                        {item.mitigationOptions.map((option, index) => (
                          <Box key={index} variant="small">• {option}</Box>
                        ))}
                      </SpaceBetween>
                    }
                  >
                    <Button variant="link">
                      Options
                    </Button>
                  </Popover>
                </SpaceBetween>
              )
            }
          ]}
          items={violationTableItems}
          sortingDisabled
          variant="embedded"
          empty={
            <Box textAlign="center" color="inherit">
              <Box variant="strong" textAlign="center" color="inherit">
                No violations found
              </Box>
            </Box>
          }
        />
      </Container>
    );
  };

  const renderCriticalViolations = () => {
    const criticalViolations = constraintCompliance.criticalViolations;
    
    if (criticalViolations.length === 0) {
      return null;
    }

    return (
      <Alert
        type="error"
        header="Critical Constraint Violations"
        action={
          <Button onClick={() => handleFixViolation(criticalViolations[0].constraintId)}>
            Fix Critical Issues
          </Button>
        }
      >
        <SpaceBetween direction="vertical" size="s">
          <Box variant="p">
            The following critical violations must be resolved before the layout can be considered feasible:
          </Box>
          <SpaceBetween direction="vertical" size="xs">
            {criticalViolations.slice(0, 3).map((violation, index) => (
              <Box key={index} variant="small">
                • <strong>{violation.constraintType.replace(/_/g, ' ')}:</strong> {violation.description}
              </Box>
            ))}
            {criticalViolations.length > 3 && (
              <Box variant="small" color="text-body-secondary">
                ... and {criticalViolations.length - 3} more critical violations
              </Box>
            )}
          </SpaceBetween>
        </SpaceBetween>
      </Alert>
    );
  };

  const renderRecommendations = () => {
    if (constraintCompliance.recommendations.length === 0) {
      return null;
    }

    return (
      <Container header={<Header variant="h2">Recommendations</Header>}>
        <SpaceBetween direction="vertical" size="s">
          {constraintCompliance.recommendations.map((recommendation, index) => (
            <Box key={index} variant="small">
              • {recommendation}
            </Box>
          ))}
        </SpaceBetween>
      </Container>
    );
  };

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <SpaceBetween direction="vertical" size="l">
      {renderCriticalViolations()}
      {renderOverallCompliance()}
      {renderConstraintSummary()}
      {renderViolationDetails()}
      {renderRecommendations()}
    </SpaceBetween>
  );
};