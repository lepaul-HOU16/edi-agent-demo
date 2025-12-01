import React, { useState } from 'react';
import { 
  Container, 
  Header, 
  Box, 
  SpaceBetween, 
  Badge, 
  ColumnLayout,
  Table,
  Modal,
  Button
} from '@cloudscape-design/components';

interface MaintenanceTask {
  id: string;
  equipmentId: string;
  equipmentName: string;
  type: 'preventive' | 'corrective' | 'predictive' | 'inspection';
  priority: 'low' | 'medium' | 'high' | 'critical';
  scheduledDate: string;
  estimatedDuration: number; // hours
  estimatedCost: number;
  requiredParts: string[];
  requiredSkills: string[];
  dependencies: string[]; // task IDs
  description: string;
  procedures?: string[];
}

interface MaintenanceScheduleData {
  id: string;
  startDate: string;
  endDate: string;
  tasks: MaintenanceTask[];
  totalCost: number;
  totalDuration: number; // hours
  optimizationCriteria: 'cost' | 'downtime' | 'risk';
}

interface MaintenanceScheduleArtifactProps {
  data: {
    messageContentType: 'maintenance_schedule';
    title?: string;
    subtitle?: string;
    schedule: MaintenanceScheduleData;
  };
}

export const MaintenanceScheduleArtifact: React.FC<MaintenanceScheduleArtifactProps> = ({ data }) => {
  const [selectedTask, setSelectedTask] = useState<MaintenanceTask | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const schedule = data?.schedule;

  // Early return if schedule data is missing
  if (!schedule) {
    return (
      <Container>
        <Box textAlign="center" padding="l">
          <Box variant="h2" color="text-status-error">Unable to display maintenance schedule</Box>
          <Box variant="p" color="text-body-secondary">Schedule data is missing or invalid.</Box>
        </Box>
      </Container>
    );
  }

  // Priority and type styling
  const getPriorityBadge = (priority: string) => {
    const priorityMap: Record<string, { color: any; label: string }> = {
      low: { color: 'grey', label: 'Low' },
      medium: { color: 'blue', label: 'Medium' },
      high: { color: 'red', label: 'High' },
      critical: { color: 'red', label: 'Critical' }
    };
    return priorityMap[priority] || priorityMap.low;
  };

  const getTypeBadge = (type: string) => {
    const typeMap: Record<string, { color: any; label: string }> = {
      preventive: { color: 'green', label: 'Preventive' },
      corrective: { color: 'blue', label: 'Corrective' },
      predictive: { color: 'blue', label: 'Predictive' },
      inspection: { color: 'grey', label: 'Inspection' }
    };
    return typeMap[type] || typeMap.inspection;
  };

  // Render Gantt chart
  const renderGanttChart = () => {
    if (!schedule?.tasks || schedule.tasks.length === 0) return null;

    const startDate = new Date(schedule.startDate);
    const endDate = new Date(schedule.endDate);
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const chartWidth = 800;
    const rowHeight = 40;
    const chartHeight = schedule.tasks.length * rowHeight + 60;
    const leftMargin = 200;
    const timelineWidth = chartWidth - leftMargin - 40;

    return (
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <svg width={chartWidth} height={chartHeight}>
          {/* Timeline header */}
          <rect x={leftMargin} y={0} width={timelineWidth} height={40} fill="#f0f0f0" />
          {[...Array(Math.min(totalDays + 1, 15))].map((_, i) => {
            const x = leftMargin + (i / totalDays) * timelineWidth;
            const date = new Date(startDate);
            date.setDate(date.getDate() + Math.floor((i / 14) * totalDays));
            return (
              <g key={i}>
                <line x1={x} y1={40} x2={x} y2={chartHeight} stroke="#e9ebed" strokeWidth="1" />
                {i % 2 === 0 && (
                  <text x={x + 5} y={25} fontSize="11" fill="#5f6b7a">
                    {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </text>
                )}
              </g>
            );
          })}

          {/* Tasks */}
          {schedule.tasks.map((task, index) => {
            const taskDate = new Date(task.scheduledDate);
            const dayOffset = Math.ceil((taskDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
            const taskDays = Math.max(task.estimatedDuration / 24, 0.5);
            
            const x = leftMargin + (dayOffset / totalDays) * timelineWidth;
            const width = Math.max((taskDays / totalDays) * timelineWidth, 20);
            const y = 40 + index * rowHeight + 10;

            const priorityColor = 
              task.priority === 'critical' ? '#d91515' :
              task.priority === 'high' ? '#df7c00' :
              task.priority === 'medium' ? '#0972d3' : '#5f6b7a';

            return (
              <g key={task.id}>
                {/* Task name */}
                <text x={10} y={y + 15} fontSize="12" fill="#000">
                  {task.equipmentName.substring(0, 25)}
                </text>
                
                {/* Task bar */}
                <rect
                  x={x}
                  y={y}
                  width={width}
                  height={20}
                  fill={priorityColor}
                  opacity="0.7"
                  rx="4"
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    setSelectedTask(task);
                    setModalVisible(true);
                  }}
                />
                
                {/* Duration label */}
                {width > 40 && (
                  <text 
                    x={x + width / 2} 
                    y={y + 14} 
                    fontSize="10" 
                    fill="#fff" 
                    textAnchor="middle"
                    fontWeight="bold"
                  >
                    {task.estimatedDuration}h
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  const handleTaskClick = (task: MaintenanceTask) => {
    setSelectedTask(task);
    setModalVisible(true);
  };

  return (
    <>
      <Container
        header={
          <Header
            variant="h2"
            description={data.subtitle || `Optimized maintenance schedule${schedule.optimizationCriteria ? ` (${schedule.optimizationCriteria})` : ''}`}
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                <Badge color="blue">{schedule.tasks?.length || 0} tasks</Badge>
                <Badge color="grey">${(schedule.totalCost || 0).toLocaleString()}</Badge>
              </SpaceBetween>
            }
          >
            {data.title || 'Maintenance Schedule'}
          </Header>
        }
      >
        <SpaceBetween size="l">
          {/* Summary Metrics */}
          <ColumnLayout columns={4} variant="text-grid">
            <div>
              <Box variant="awsui-key-label">Total Tasks</Box>
              <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px' }}>
                {schedule.tasks?.length || 0}
              </div>
            </div>
            <div>
              <Box variant="awsui-key-label">Total Duration</Box>
              <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px' }}>
                {schedule.totalDuration || 0} hours
              </div>
            </div>
            <div>
              <Box variant="awsui-key-label">Total Cost</Box>
              <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px' }}>
                ${(schedule.totalCost || 0).toLocaleString()}
              </div>
            </div>
            <div>
              <Box variant="awsui-key-label">Schedule Period</Box>
              <div style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '4px' }}>
                {schedule.startDate && schedule.endDate 
                  ? `${new Date(schedule.startDate).toLocaleDateString()} - ${new Date(schedule.endDate).toLocaleDateString()}`
                  : 'Not specified'}
              </div>
            </div>
          </ColumnLayout>

          {/* Gantt Chart */}
          <Box>
            <Box variant="awsui-key-label" margin={{ bottom: 's' }}>
              Timeline View
            </Box>
            <div style={{ 
              padding: '16px', 
              backgroundColor: '#fff', 
              borderRadius: '8px',
              border: '1px solid #e9ebed'
            }}>
              {renderGanttChart()}
            </div>
          </Box>

          {/* Task List */}
          <Box>
            <Box variant="awsui-key-label" margin={{ bottom: 's' }}>
              Task Details
            </Box>
            <Table
              columnDefinitions={[
                {
                  id: 'equipment',
                  header: 'Equipment',
                  cell: (task: MaintenanceTask) => (
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{task.equipmentName}</div>
                      <div style={{ fontSize: '12px', color: '#5f6b7a' }}>{task.equipmentId}</div>
                    </div>
                  ),
                  minWidth: 150
                },
                {
                  id: 'type',
                  header: 'Type',
                  cell: (task: MaintenanceTask) => {
                    const typeBadge = getTypeBadge(task.type);
                    return <Badge color={typeBadge.color}>{typeBadge.label}</Badge>;
                  },
                  minWidth: 100
                },
                {
                  id: 'priority',
                  header: 'Priority',
                  cell: (task: MaintenanceTask) => {
                    const priorityBadge = getPriorityBadge(task.priority);
                    return <Badge color={priorityBadge.color}>{priorityBadge.label}</Badge>;
                  },
                  minWidth: 100
                },
                {
                  id: 'date',
                  header: 'Scheduled Date',
                  cell: (task: MaintenanceTask) => new Date(task.scheduledDate).toLocaleDateString(),
                  minWidth: 120
                },
                {
                  id: 'duration',
                  header: 'Duration',
                  cell: (task: MaintenanceTask) => `${task.estimatedDuration}h`,
                  minWidth: 80
                },
                {
                  id: 'cost',
                  header: 'Cost',
                  cell: (task: MaintenanceTask) => `$${task.estimatedCost.toLocaleString()}`,
                  minWidth: 100
                },
                {
                  id: 'actions',
                  header: 'Actions',
                  cell: (task: MaintenanceTask) => (
                    <Button variant="inline-link" onClick={() => handleTaskClick(task)}>
                      View Details
                    </Button>
                  ),
                  minWidth: 100
                }
              ]}
              items={schedule.tasks || []}
              loadingText="Loading tasks"
              empty={<Box textAlign="center" color="inherit"><b>No tasks scheduled</b></Box>}
              contentDensity="comfortable"
            />
          </Box>

          <Box variant="small" color="text-body-secondary">
            {schedule.id && `Schedule ID: ${schedule.id}`}
            {schedule.id && schedule.optimizationCriteria && ' • '}
            {schedule.optimizationCriteria && `Optimized for: ${schedule.optimizationCriteria}`}
          </Box>
        </SpaceBetween>
      </Container>

      {/* Task Details Modal */}
      <Modal
        visible={modalVisible}
        onDismiss={() => setModalVisible(false)}
        header={selectedTask?.equipmentName || 'Task Details'}
        size="large"
      >
        {selectedTask && (
          <SpaceBetween size="m">
            <ColumnLayout columns={2} variant="text-grid">
              <div>
                <Box variant="awsui-key-label">Equipment ID</Box>
                <div>{selectedTask.equipmentId}</div>
              </div>
              <div>
                <Box variant="awsui-key-label">Task Type</Box>
                <div>{getTypeBadge(selectedTask.type).label}</div>
              </div>
              <div>
                <Box variant="awsui-key-label">Priority</Box>
                <div>{getPriorityBadge(selectedTask.priority).label}</div>
              </div>
              <div>
                <Box variant="awsui-key-label">Scheduled Date</Box>
                <div>{new Date(selectedTask.scheduledDate).toLocaleString()}</div>
              </div>
              <div>
                <Box variant="awsui-key-label">Duration</Box>
                <div>{selectedTask.estimatedDuration} hours</div>
              </div>
              <div>
                <Box variant="awsui-key-label">Cost</Box>
                <div>${selectedTask.estimatedCost.toLocaleString()}</div>
              </div>
            </ColumnLayout>

            <div>
              <Box variant="awsui-key-label">Description</Box>
              <Box>{selectedTask.description}</Box>
            </div>

            {selectedTask.requiredParts.length > 0 && (
              <div>
                <Box variant="awsui-key-label">Required Parts</Box>
                <SpaceBetween size="xs" direction="horizontal">
                  {selectedTask.requiredParts.map((part, index) => (
                    <Badge key={index} color="blue">{part}</Badge>
                  ))}
                </SpaceBetween>
              </div>
            )}

            {selectedTask.requiredSkills.length > 0 && (
              <div>
                <Box variant="awsui-key-label">Required Skills</Box>
                <SpaceBetween size="xs" direction="horizontal">
                  {selectedTask.requiredSkills.map((skill, index) => (
                    <Badge key={index} color="green">{skill}</Badge>
                  ))}
                </SpaceBetween>
              </div>
            )}

            {selectedTask.procedures && selectedTask.procedures.length > 0 && (
              <div>
                <Box variant="awsui-key-label">Procedures</Box>
                <ol style={{ marginLeft: '20px' }}>
                  {selectedTask.procedures.map((proc, index) => (
                    <li key={index} style={{ marginBottom: '4px' }}>{proc}</li>
                  ))}
                </ol>
              </div>
            )}

            {selectedTask.dependencies.length > 0 && (
              <div>
                <Box variant="awsui-key-label">Dependencies</Box>
                <Box color="text-body-secondary">
                  This task depends on: {selectedTask.dependencies.join(', ')}
                </Box>
              </div>
            )}
          </SpaceBetween>
        )}
      </Modal>
    </>
  );
};
