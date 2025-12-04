/**
 * Consolidated Analysis View Component
 * AI-powered analysis of ALL wells highlighting noteworthy conditions
 * 
 * Features:
 * - Executive Summary Card with fleet-wide metrics
 * - Noteworthy Conditions Panel with AI insights
 * - Critical issues, declining health trends, top performers
 * - Expandable sections for each category
 * - Fleet health visualizations
 * - Priority action items
 * - Comparative performance table
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */

import React, { useState } from 'react';
import {
  Container,
  Header,
  SpaceBetween,
  Box,
  Badge,
  ColumnLayout,
  StatusIndicator,
  Icon,
  ExpandableSection,
  Grid
} from '@cloudscape-design/components';

// Type definitions
interface FleetSummary {
  totalWells: number;
  operational: number;
  degraded: number;
  critical: number;
  offline: number;
  fleetHealthScore: number;
  criticalAlerts: number;
  wellsNeedingAttention: number;
  upcomingMaintenance: number;
}

interface NoteworthyItem {
  wellId: string;
  wellName: string;
  severity: 'critical' | 'high' | 'medium' | 'info';
  title: string;
  description: string;
  recommendation?: string;
  metrics?: Record<string, any>;
}

interface NoteworthyConditions {
  criticalIssues: NoteworthyItem[];
  decliningHealth: NoteworthyItem[];
  maintenanceOverdue: NoteworthyItem[];
  topPerformers: NoteworthyItem[];
  unusualPatterns: NoteworthyItem[];
}

interface WellSummary {
  id: string;
  name: string;
  healthScore: number;
  status: 'operational' | 'degraded' | 'critical' | 'offline';
  alertCount: number;
  criticalAlertCount: number;
  lastMaintenance: string;
  nextMaintenance: string;
  location: string;
  keyMetrics: {
    temperature?: number;
    pressure?: number;
    flowRate?: number;
    production?: number;
  };
}

interface ConsolidatedAnalysisViewProps {
  summary: FleetSummary;
  noteworthyConditions: NoteworthyConditions;
  comparativePerformance: {
    topByHealth: WellSummary[];
    bottomByHealth: WellSummary[];
    topByProduction: WellSummary[];
    bottomByProduction: WellSummary[];
  };
}

/**
 * Get severity badge color
 */
const getSeverityColor = (severity: 'critical' | 'high' | 'medium' | 'info'): 'red' | 'blue' | 'grey' => {
  switch (severity) {
    case 'critical':
      return 'red';
    case 'high':
      return 'red';
    case 'medium':
      return 'blue';
    case 'info':
      return 'grey';
    default:
      return 'grey';
  }
};

/**
 * Get severity icon
 */
const getSeverityIcon = (severity: 'critical' | 'high' | 'medium' | 'info'): string => {
  switch (severity) {
    case 'critical':
      return 'status-negative';
    case 'high':
      return 'status-warning';
    case 'medium':
      return 'status-info';
    case 'info':
      return 'status-positive';
    default:
      return 'status-info';
  }
};

/**
 * Get health score color
 */
const getHealthScoreColor = (score: number): string => {
  if (score >= 80) return '#22c55e'; // Green
  if (score >= 60) return '#f59e0b'; // Orange
  return '#dc2626'; // Red
};

/**
 * Executive Summary Card Component
 */
const ExecutiveSummaryCard: React.FC<{ summary: FleetSummary }> = ({ summary }) => {
  return (
    <Container
      header={
        <Header variant="h2">
          <SpaceBetween direction="horizontal" size="xs">
            <Icon name="status-info" />
            <span>Executive Summary</span>
          </SpaceBetween>
        </Header>
      }
    >
      <Grid gridDefinition={[
        { colspan: { default: 12, xs: 6, s: 3 } },
        { colspan: { default: 12, xs: 6, s: 3 } },
        { colspan: { default: 12, xs: 6, s: 3 } },
        { colspan: { default: 12, xs: 6, s: 3 } }
      ]}>
        {/* Total Wells */}
        <Box textAlign="center" padding="m">
          <Box variant="awsui-key-label">Total Wells Monitored</Box>
          <Box fontSize="heading-xl" fontWeight="bold" padding={{ top: 'xs' }}>
            {summary.totalWells}
          </Box>
          <Box variant="small" color="text-body-secondary" padding={{ top: 'xxs' }}>
            Across all locations
          </Box>
        </Box>

        {/* Fleet Health Score */}
        <Box textAlign="center" padding="m">
          <Box variant="awsui-key-label">Fleet Health Score</Box>
          <Box 
            fontSize="heading-xl" 
            fontWeight="bold" 
            padding={{ top: 'xs' }}
          >
            <span style={{ color: getHealthScoreColor(summary.fleetHealthScore) }}>
              {summary.fleetHealthScore}/100
            </span>
          </Box>
          <Box variant="small" color="text-body-secondary" padding={{ top: 'xxs' }}>
            Weighted average
          </Box>
        </Box>

        {/* Critical Alerts */}
        <Box textAlign="center" padding="m">
          <Box variant="awsui-key-label">Critical Alerts</Box>
          <Box fontSize="heading-xl" fontWeight="bold" padding={{ top: 'xs' }} color="text-status-error">
            {summary.criticalAlerts}
          </Box>
          <Box variant="small" color="text-body-secondary" padding={{ top: 'xxs' }}>
            Require immediate action
          </Box>
        </Box>

        {/* Wells Needing Attention */}
        <Box textAlign="center" padding="m">
          <Box variant="awsui-key-label">Wells Needing Attention</Box>
          <Box fontSize="heading-xl" fontWeight="bold" padding={{ top: 'xs' }} color="text-status-warning">
            {summary.wellsNeedingAttention}
          </Box>
          <Box variant="small" color="text-body-secondary" padding={{ top: 'xxs' }}>
            Health score &lt; 70
          </Box>
        </Box>
      </Grid>

      {/* Status Breakdown */}
      <Box padding={{ top: 'm' }}>
        <ColumnLayout columns={4} variant="text-grid">
          <div>
            <Box variant="awsui-key-label">
              <SpaceBetween direction="horizontal" size="xxs">
                <span style={{ color: '#22c55e' }}>●</span>
                <span>Operational</span>
              </SpaceBetween>
            </Box>
            <Box fontSize="heading-m" fontWeight="bold">
              {summary.operational}
            </Box>
          </div>

          <div>
            <Box variant="awsui-key-label">
              <SpaceBetween direction="horizontal" size="xxs">
                <span style={{ color: '#f59e0b' }}>●</span>
                <span>Degraded</span>
              </SpaceBetween>
            </Box>
            <Box fontSize="heading-m" fontWeight="bold">
              {summary.degraded}
            </Box>
          </div>

          <div>
            <Box variant="awsui-key-label">
              <SpaceBetween direction="horizontal" size="xxs">
                <span style={{ color: '#dc2626' }}>●</span>
                <span>Critical</span>
              </SpaceBetween>
            </Box>
            <Box fontSize="heading-m" fontWeight="bold">
              {summary.critical}
            </Box>
          </div>

          <div>
            <Box variant="awsui-key-label">
              <SpaceBetween direction="horizontal" size="xxs">
                <span style={{ color: '#6b7280' }}>●</span>
                <span>Offline</span>
              </SpaceBetween>
            </Box>
            <Box fontSize="heading-m" fontWeight="bold">
              {summary.offline}
            </Box>
          </div>
        </ColumnLayout>
      </Box>

      {/* Upcoming Maintenance */}
      {summary.upcomingMaintenance > 0 && (
        <Box padding={{ top: 'm' }}>
          <StatusIndicator type="info">
            {summary.upcomingMaintenance} well{summary.upcomingMaintenance !== 1 ? 's' : ''} scheduled for maintenance in the next 7 days
          </StatusIndicator>
        </Box>
      )}
    </Container>
  );
};

/**
 * Noteworthy Item Component
 */
const NoteworthyItemComponent: React.FC<{ item: NoteworthyItem }> = ({ item }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Box
      padding="m"
      variant="div"
      margin={{ bottom: 's' }}
    >
      <SpaceBetween size="s">
        {/* Header */}
        <SpaceBetween direction="horizontal" size="s" alignItems="center">
          <Badge color={getSeverityColor(item.severity)}>
            <SpaceBetween direction="horizontal" size="xxs">
              <span>{item.severity.toUpperCase()}</span>
            </SpaceBetween>
          </Badge>

          <Box variant="span" fontWeight="bold">
            {item.wellName}
          </Box>

          <Box variant="small" color="text-body-secondary">
            <code>{item.wellId}</code>
          </Box>
        </SpaceBetween>

        {/* Title */}
        <Box variant="h4" fontWeight="bold">
          {item.title}
        </Box>

        {/* Description */}
        <Box variant="p" color="text-body-secondary">
          {item.description}
        </Box>

        {/* Recommendation */}
        {item.recommendation && (
          <Box>
            <Box variant="awsui-key-label">Recommendation</Box>
            <Box variant="p">
              {item.recommendation}
            </Box>
          </Box>
        )}

        {/* Metrics */}
        {item.metrics && Object.keys(item.metrics).length > 0 && (
          <Box>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setExpanded(!expanded);
              }}
              style={{ textDecoration: 'underline', cursor: 'pointer', fontSize: '14px' }}
            >
              {expanded ? 'Hide' : 'Show'} metrics
            </a>

            {expanded && (
              <Box padding={{ top: 's' }}>
                <ColumnLayout columns={2} variant="text-grid">
                  {Object.entries(item.metrics).map(([key, value]) => (
                    <div key={key}>
                      <Box variant="awsui-key-label">{key}</Box>
                      <Box variant="p">{String(value)}</Box>
                    </div>
                  ))}
                </ColumnLayout>
              </Box>
            )}
          </Box>
        )}
      </SpaceBetween>
    </Box>
  );
};

/**
 * Noteworthy Conditions Panel Component
 */
const NoteworthyConditionsPanel: React.FC<{ conditions: NoteworthyConditions }> = ({ conditions }) => {
  return (
    <Container
      header={
        <Header
          variant="h2"
          description="AI-powered insights highlighting conditions requiring attention"
        >
          <SpaceBetween direction="horizontal" size="xs">
            <Icon name="search" />
            <span>Noteworthy Conditions</span>
          </SpaceBetween>
        </Header>
      }
    >
      <SpaceBetween size="m">
        {/* Critical Issues */}
        {conditions.criticalIssues.length > 0 && (
          <ExpandableSection
            headerText={
              <SpaceBetween direction="horizontal" size="s">
                <Icon name="status-negative" variant="error" />
                <span>Critical Issues ({conditions.criticalIssues.length})</span>
              </SpaceBetween>
            }
            defaultExpanded={true}
          >
            <SpaceBetween size="s">
              {conditions.criticalIssues.map((item, index) => (
                <NoteworthyItemComponent key={index} item={item} />
              ))}
            </SpaceBetween>
          </ExpandableSection>
        )}

        {/* Declining Health Trends */}
        {conditions.decliningHealth.length > 0 && (
          <ExpandableSection
            headerText={
              <SpaceBetween direction="horizontal" size="s">
                <Icon name="status-warning" />
                <span>Declining Health Trends ({conditions.decliningHealth.length})</span>
              </SpaceBetween>
            }
            defaultExpanded={true}
          >
            <SpaceBetween size="s">
              {conditions.decliningHealth.map((item, index) => (
                <NoteworthyItemComponent key={index} item={item} />
              ))}
            </SpaceBetween>
          </ExpandableSection>
        )}

        {/* Maintenance Overdue */}
        {conditions.maintenanceOverdue.length > 0 && (
          <ExpandableSection
            headerText={
              <SpaceBetween direction="horizontal" size="s">
                <Icon name="calendar" />
                <span>Maintenance Overdue ({conditions.maintenanceOverdue.length})</span>
              </SpaceBetween>
            }
            defaultExpanded={false}
          >
            <SpaceBetween size="s">
              {conditions.maintenanceOverdue.map((item, index) => (
                <NoteworthyItemComponent key={index} item={item} />
              ))}
            </SpaceBetween>
          </ExpandableSection>
        )}

        {/* Unusual Patterns */}
        {conditions.unusualPatterns.length > 0 && (
          <ExpandableSection
            headerText={
              <SpaceBetween direction="horizontal" size="s">
                <Icon name="status-info" />
                <span>Unusual Patterns ({conditions.unusualPatterns.length})</span>
              </SpaceBetween>
            }
            defaultExpanded={false}
          >
            <SpaceBetween size="s">
              {conditions.unusualPatterns.map((item, index) => (
                <NoteworthyItemComponent key={index} item={item} />
              ))}
            </SpaceBetween>
          </ExpandableSection>
        )}

        {/* Top Performers */}
        {conditions.topPerformers.length > 0 && (
          <ExpandableSection
            headerText={
              <SpaceBetween direction="horizontal" size="s">
                <Icon name="status-positive" />
                <span>Top Performers ({conditions.topPerformers.length})</span>
              </SpaceBetween>
            }
            defaultExpanded={false}
          >
            <SpaceBetween size="s">
              {conditions.topPerformers.map((item, index) => (
                <NoteworthyItemComponent key={index} item={item} />
              ))}
            </SpaceBetween>
          </ExpandableSection>
        )}

        {/* No noteworthy conditions */}
        {conditions.criticalIssues.length === 0 &&
         conditions.decliningHealth.length === 0 &&
         conditions.maintenanceOverdue.length === 0 &&
         conditions.unusualPatterns.length === 0 &&
         conditions.topPerformers.length === 0 && (
          <Box textAlign="center" padding="l">
            <StatusIndicator type="success">
              No noteworthy conditions detected. All wells are operating within normal parameters.
            </StatusIndicator>
          </Box>
        )}
      </SpaceBetween>
    </Container>
  );
};

/**
 * Comparative Performance Table Component
 */
const ComparativePerformanceTable: React.FC<{
  comparativePerformance: {
    topByHealth: WellSummary[];
    bottomByHealth: WellSummary[];
    topByProduction: WellSummary[];
    bottomByProduction: WellSummary[];
  };
}> = ({ comparativePerformance }) => {
  return (
    <Container
      header={
        <Header
          variant="h2"
          description="Comparative analysis of well performance"
        >
          <SpaceBetween direction="horizontal" size="xs">
            <Icon name="status-info" />
            <span>Comparative Performance</span>
          </SpaceBetween>
        </Header>
      }
    >
      <Grid gridDefinition={[
        { colspan: { default: 12, s: 6 } },
        { colspan: { default: 12, s: 6 } }
      ]}>
        {/* Top 5 by Health */}
        <Box>
          <ExpandableSection
            headerText={
              <SpaceBetween direction="horizontal" size="s">
                <Icon name="status-positive" />
                <span>Top 5 by Health Score</span>
              </SpaceBetween>
            }
            defaultExpanded={true}
          >
            <SpaceBetween size="xs">
              {comparativePerformance.topByHealth.slice(0, 5).map((well, index) => (
                <Box key={well.id} padding="s">
                  <SpaceBetween direction="horizontal" size="s" alignItems="center">
                    <Box fontSize="heading-m" fontWeight="bold" color="text-body-secondary">
                      {index + 1}.
                    </Box>
                    <Box>
                      <Box variant="span" fontWeight="bold">{well.name}</Box>
                      <Box variant="small" color="text-body-secondary"> ({well.id})</Box>
                    </Box>
                    <Box fontSize="heading-m" fontWeight="bold">
                      <span style={{ color: getHealthScoreColor(well.healthScore) }}>
                        {well.healthScore}
                      </span>
                    </Box>
                  </SpaceBetween>
                </Box>
              ))}
            </SpaceBetween>
          </ExpandableSection>
        </Box>

        {/* Bottom 5 by Health */}
        <Box>
          <ExpandableSection
            headerText={
              <SpaceBetween direction="horizontal" size="s">
                <Icon name="status-warning" />
                <span>Bottom 5 by Health Score</span>
              </SpaceBetween>
            }
            defaultExpanded={true}
          >
            <SpaceBetween size="xs">
              {comparativePerformance.bottomByHealth.slice(0, 5).map((well, index) => (
                <Box key={well.id} padding="s">
                  <SpaceBetween direction="horizontal" size="s" alignItems="center">
                    <Box fontSize="heading-m" fontWeight="bold" color="text-body-secondary">
                      {index + 1}.
                    </Box>
                    <Box>
                      <Box variant="span" fontWeight="bold">{well.name}</Box>
                      <Box variant="small" color="text-body-secondary"> ({well.id})</Box>
                    </Box>
                    <Box fontSize="heading-m" fontWeight="bold">
                      <span style={{ color: getHealthScoreColor(well.healthScore) }}>
                        {well.healthScore}
                      </span>
                    </Box>
                  </SpaceBetween>
                </Box>
              ))}
            </SpaceBetween>
          </ExpandableSection>
        </Box>

        {/* Top 5 by Production */}
        <Box>
          <ExpandableSection
            headerText={
              <SpaceBetween direction="horizontal" size="s">
                <Icon name="status-positive" />
                <span>Top 5 by Production</span>
              </SpaceBetween>
            }
            defaultExpanded={false}
          >
            <SpaceBetween size="xs">
              {comparativePerformance.topByProduction.slice(0, 5).map((well, index) => (
                <Box key={well.id} padding="s">
                  <SpaceBetween direction="horizontal" size="s" alignItems="center">
                    <Box fontSize="heading-m" fontWeight="bold" color="text-body-secondary">
                      {index + 1}.
                    </Box>
                    <Box>
                      <Box variant="span" fontWeight="bold">{well.name}</Box>
                      <Box variant="small" color="text-body-secondary"> ({well.id})</Box>
                    </Box>
                    <Box fontSize="heading-m" fontWeight="bold">
                      {well.keyMetrics?.production?.toFixed(1) || 'N/A'} BPD
                    </Box>
                  </SpaceBetween>
                </Box>
              ))}
            </SpaceBetween>
          </ExpandableSection>
        </Box>

        {/* Bottom 5 by Production */}
        <Box>
          <ExpandableSection
            headerText={
              <SpaceBetween direction="horizontal" size="s">
                <Icon name="status-warning" />
                <span>Bottom 5 by Production</span>
              </SpaceBetween>
            }
            defaultExpanded={false}
          >
            <SpaceBetween size="xs">
              {comparativePerformance.bottomByProduction.slice(0, 5).map((well, index) => (
                <Box key={well.id} padding="s">
                  <SpaceBetween direction="horizontal" size="s" alignItems="center">
                    <Box fontSize="heading-m" fontWeight="bold" color="text-body-secondary">
                      {index + 1}.
                    </Box>
                    <Box>
                      <Box variant="span" fontWeight="bold">{well.name}</Box>
                      <Box variant="small" color="text-body-secondary"> ({well.id})</Box>
                    </Box>
                    <Box fontSize="heading-m" fontWeight="bold">
                      {well.keyMetrics?.production?.toFixed(1) || 'N/A'} BPD
                    </Box>
                  </SpaceBetween>
                </Box>
              ))}
            </SpaceBetween>
          </ExpandableSection>
        </Box>
      </Grid>
    </Container>
  );
};

/**
 * Main Consolidated Analysis View Component
 */
export const ConsolidatedAnalysisView: React.FC<ConsolidatedAnalysisViewProps> = ({
  summary,
  noteworthyConditions,
  comparativePerformance
}) => {
  console.log('🔍 Rendering Consolidated Analysis View');
  console.log(`   Total Wells: ${summary.totalWells}`);
  console.log(`   Fleet Health: ${summary.fleetHealthScore}`);
  console.log(`   Critical Alerts: ${summary.criticalAlerts}`);
  console.log(`   Critical Issues: ${noteworthyConditions.criticalIssues.length}`);
  console.log(`   Declining Health: ${noteworthyConditions.decliningHealth.length}`);

  return (
    <SpaceBetween size="l">
      {/* Executive Summary */}
      <ExecutiveSummaryCard summary={summary} />

      {/* Noteworthy Conditions */}
      <NoteworthyConditionsPanel conditions={noteworthyConditions} />

      {/* Comparative Performance */}
      <ComparativePerformanceTable comparativePerformance={comparativePerformance} />
    </SpaceBetween>
  );
};

export default ConsolidatedAnalysisView;
