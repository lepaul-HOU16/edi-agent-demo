/**
 * Priority Action Items Component
 * Displays ranked list of recommended actions with priority levels and action buttons
 * 
 * Features:
 * - Ranked list of recommended actions
 * - Priority level (urgent/high/medium/low) with color coding
 * - Estimated time and due date
 * - Action buttons (Schedule, View Details)
 * - Expandable sections for more details
 * 
 * Requirements: 2.4, 3.1, 3.2
 */

import React, { useState } from 'react';
import {
  Container,
  Header,
  SpaceBetween,
  Box,
  Badge,
  Button,
  ColumnLayout,
  StatusIndicator,
  Icon
} from '@cloudscape-design/components';

// Type definitions
export interface PriorityAction {
  id: string;
  wellId: string;
  wellName: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  estimatedTime?: string;
  dueDate?: string;
  actionType: 'inspection' | 'maintenance' | 'diagnostic' | 'repair';
}

interface PriorityActionItemsProps {
  actions: PriorityAction[];
  onSchedule?: (action: PriorityAction) => void;
  onViewDetails?: (action: PriorityAction) => void;
}

/**
 * Get priority badge color
 */
const getPriorityColor = (priority: 'urgent' | 'high' | 'medium' | 'low'): 'red' | 'blue' | 'grey' => {
  switch (priority) {
    case 'urgent':
      return 'red';
    case 'high':
      return 'red';
    case 'medium':
      return 'blue';
    case 'low':
      return 'grey';
    default:
      return 'grey';
  }
};

/**
 * Get priority icon
 */
const getPriorityIcon = (priority: 'urgent' | 'high' | 'medium' | 'low'): string => {
  switch (priority) {
    case 'urgent':
      return 'status-negative';
    case 'high':
      return 'status-warning';
    case 'medium':
      return 'status-info';
    case 'low':
      return 'status-positive';
    default:
      return 'status-info';
  }
};

/**
 * Get action type icon
 */
const getActionTypeIcon = (actionType: 'inspection' | 'maintenance' | 'diagnostic' | 'repair'): string => {
  switch (actionType) {
    case 'inspection':
      return 'search';
    case 'maintenance':
      return 'settings';
    case 'diagnostic':
      return 'status-info';
    case 'repair':
      return 'edit';
    default:
      return 'settings';
  }
};

/**
 * Format due date for display
 */
const formatDueDate = (dueDate: string): string => {
  const date = new Date(dueDate);
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return `Overdue by ${Math.abs(diffDays)} days`;
  } else if (diffDays === 0) {
    return 'Due today';
  } else if (diffDays === 1) {
    return 'Due tomorrow';
  } else if (diffDays <= 7) {
    return `Due in ${diffDays} days`;
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
};

/**
 * Check if action is overdue
 */
const isOverdue = (dueDate?: string): boolean => {
  if (!dueDate) return false;
  const date = new Date(dueDate);
  const now = new Date();
  return date < now;
};

/**
 * Individual Priority Action Item Component
 */
const PriorityActionItem: React.FC<{
  action: PriorityAction;
  index: number;
  onSchedule?: (action: PriorityAction) => void;
  onViewDetails?: (action: PriorityAction) => void;
}> = ({ action, index, onSchedule, onViewDetails }) => {
  const [expanded, setExpanded] = useState(false);
  const overdue = isOverdue(action.dueDate);

  return (
    <Box
      padding="m"
      variant="div"
      margin={{ bottom: 's' }}
      backgroundColor={action.priority === 'urgent' ? 'color-background-status-error' : undefined}
    >
      <SpaceBetween size="m">
        {/* Header Row */}
        <Box>
          <SpaceBetween direction="horizontal" size="s" alignItems="center">
            {/* Priority Number */}
            <Box
              fontSize="heading-l"
              fontWeight="bold"
              color={action.priority === 'urgent' || action.priority === 'high' ? 'text-status-error' : 'text-body-secondary'}
            >
              {index + 1}.
            </Box>

            {/* Priority Badge */}
            <Badge color={getPriorityColor(action.priority)}>
              <SpaceBetween direction="horizontal" size="xxs">
                <Icon name={getPriorityIcon(action.priority)} size="small" />
                <span>{action.priority.toUpperCase()}</span>
              </SpaceBetween>
            </Badge>

            {/* Action Type Badge */}
            <Badge>
              <SpaceBetween direction="horizontal" size="xxs">
                <Icon name={getActionTypeIcon(action.actionType)} size="small" />
                <span>{action.actionType}</span>
              </SpaceBetween>
            </Badge>

            {/* Overdue Indicator */}
            {overdue && (
              <StatusIndicator type="error">
                OVERDUE
              </StatusIndicator>
            )}
          </SpaceBetween>
        </Box>

        {/* Well Name */}
        <Box>
          <Box variant="awsui-key-label">Well</Box>
          <Box variant="p" fontWeight="bold">
            {action.wellName}
          </Box>
        </Box>

        {/* Action Title */}
        <Box variant="h3" fontWeight="bold">
          {action.title}
        </Box>

        {/* Action Description */}
        <Box variant="p" color="text-body-secondary">
          {action.description}
        </Box>

        {/* Metadata Row */}
        <ColumnLayout columns={2} variant="text-grid">
          {/* Estimated Time */}
          {action.estimatedTime && (
            <div>
              <Box variant="awsui-key-label">
                <SpaceBetween direction="horizontal" size="xxs">
                  <Icon name="status-pending" size="small" />
                  <span>Estimated Time</span>
                </SpaceBetween>
              </Box>
              <Box variant="p">{action.estimatedTime}</Box>
            </div>
          )}

          {/* Due Date */}
          {action.dueDate && (
            <div>
              <Box variant="awsui-key-label">
                <SpaceBetween direction="horizontal" size="xxs">
                  <Icon name="calendar" size="small" />
                  <span>Due Date</span>
                </SpaceBetween>
              </Box>
              <Box variant="p" color={overdue ? 'text-status-error' : undefined}>
                {formatDueDate(action.dueDate)}
              </Box>
            </div>
          )}
        </ColumnLayout>

        {/* Action Buttons */}
        <SpaceBetween direction="horizontal" size="s">
          <Button
            variant="primary"
            iconName="calendar"
            onClick={() => onSchedule?.(action)}
          >
            Schedule
          </Button>

          <Button
            variant="normal"
            iconName="external"
            onClick={() => onViewDetails?.(action)}
          >
            View Details
          </Button>

          <Button
            variant="inline-link"
            iconName={expanded ? 'angle-up' : 'angle-down'}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? 'Show less' : 'Show more'}
          </Button>
        </SpaceBetween>

        {/* Expanded Details */}
        {expanded && (
          <Box padding={{ left: 'l', top: 's' }} backgroundColor="color-background-container-content">
            <SpaceBetween size="s">
              <Box>
                <Box variant="awsui-key-label">Action ID</Box>
                <Box variant="small" fontFamily="monospace">{action.id}</Box>
              </Box>

              <Box>
                <Box variant="awsui-key-label">Well ID</Box>
                <Box variant="small" fontFamily="monospace">{action.wellId}</Box>
              </Box>

              <Box>
                <Box variant="awsui-key-label">Full Description</Box>
                <Box variant="p">{action.description}</Box>
              </Box>

              {action.estimatedTime && (
                <Box>
                  <Box variant="awsui-key-label">Time Required</Box>
                  <Box variant="p">{action.estimatedTime}</Box>
                </Box>
              )}

              {action.dueDate && (
                <Box>
                  <Box variant="awsui-key-label">Due Date (ISO)</Box>
                  <Box variant="small" fontFamily="monospace">{action.dueDate}</Box>
                </Box>
              )}

              <Box>
                <Box variant="awsui-key-label">Recommended Actions</Box>
                <Box variant="p">
                  {action.actionType === 'inspection' && 'Conduct thorough visual and sensor inspection. Document findings and compare with baseline measurements.'}
                  {action.actionType === 'maintenance' && 'Perform scheduled maintenance procedures according to manufacturer specifications. Replace worn components as needed.'}
                  {action.actionType === 'diagnostic' && 'Run comprehensive diagnostic tests to identify root cause. Analyze sensor data and system logs for anomalies.'}
                  {action.actionType === 'repair' && 'Execute repair procedures to restore equipment to operational status. Verify functionality after completion.'}
                </Box>
              </Box>
            </SpaceBetween>
          </Box>
        )}
      </SpaceBetween>
    </Box>
  );
};

/**
 * Main Priority Action Items Component
 */
export const PriorityActionItems: React.FC<PriorityActionItemsProps> = ({
  actions,
  onSchedule,
  onViewDetails
}) => {
  console.log('🎯 Rendering Priority Action Items');
  console.log(`   Total Actions: ${actions.length}`);
  console.log(`   Urgent: ${actions.filter(a => a.priority === 'urgent').length}`);
  console.log(`   High: ${actions.filter(a => a.priority === 'high').length}`);
  console.log(`   Medium: ${actions.filter(a => a.priority === 'medium').length}`);
  console.log(`   Low: ${actions.filter(a => a.priority === 'low').length}`);

  // Sort actions by priority (urgent > high > medium > low)
  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
  const sortedActions = [...actions].sort((a, b) => {
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;

    // If same priority, sort by due date (earlier first)
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    return 0;
  });

  // Count actions by priority
  const urgentCount = actions.filter(a => a.priority === 'urgent').length;
  const highCount = actions.filter(a => a.priority === 'high').length;
  const overdueCount = actions.filter(a => isOverdue(a.dueDate)).length;

  return (
    <Container
      header={
        <Header
          variant="h2"
          description="Recommended actions ranked by priority and urgency"
          actions={
            <SpaceBetween direction="horizontal" size="s">
              {urgentCount > 0 && (
                <Badge color="red">
                  {urgentCount} Urgent
                </Badge>
              )}
              {highCount > 0 && (
                <Badge color="red">
                  {highCount} High Priority
                </Badge>
              )}
              {overdueCount > 0 && (
                <Badge color="red">
                  {overdueCount} Overdue
                </Badge>
              )}
            </SpaceBetween>
          }
        >
          <SpaceBetween direction="horizontal" size="xs">
            <Icon name="status-info" />
            <span>Priority Action Items</span>
          </SpaceBetween>
        </Header>
      }
    >
      {actions.length === 0 ? (
        <Box textAlign="center" padding="l">
          <StatusIndicator type="success">
            No priority actions required. All wells are operating within acceptable parameters.
          </StatusIndicator>
        </Box>
      ) : (
        <SpaceBetween size="m">
          {/* Summary Stats */}
          <Box>
            <ColumnLayout columns={4} variant="text-grid">
              <div>
                <Box variant="awsui-key-label">Total Actions</Box>
                <Box fontSize="heading-l" fontWeight="bold">
                  {actions.length}
                </Box>
              </div>

              <div>
                <Box variant="awsui-key-label">Urgent</Box>
                <Box fontSize="heading-l" fontWeight="bold" color="text-status-error">
                  {urgentCount}
                </Box>
              </div>

              <div>
                <Box variant="awsui-key-label">High Priority</Box>
                <Box fontSize="heading-l" fontWeight="bold" color="text-status-warning">
                  {highCount}
                </Box>
              </div>

              <div>
                <Box variant="awsui-key-label">Overdue</Box>
                <Box fontSize="heading-l" fontWeight="bold" color="text-status-error">
                  {overdueCount}
                </Box>
              </div>
            </ColumnLayout>
          </Box>

          {/* Action Items List */}
          <SpaceBetween size="s">
            {sortedActions.map((action, index) => (
              <PriorityActionItem
                key={action.id}
                action={action}
                index={index}
                onSchedule={onSchedule}
                onViewDetails={onViewDetails}
              />
            ))}
          </SpaceBetween>
        </SpaceBetween>
      )}
    </Container>
  );
};

export default PriorityActionItems;
