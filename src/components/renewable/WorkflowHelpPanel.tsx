
import React, { useState } from 'react';
import {
  Container,
  Header,
  SpaceBetween,
  Box,
  Alert,
  ExpandableSection,
  Link,
  Tabs,
  TabsProps,
  Badge,
  Button
} from '@cloudscape-design/components';
import {
  WorkflowStep,
  WorkflowState,
  ComplexityLevel
} from '../../types/workflow';

/**
 * Props for WorkflowHelpPanel component
 */
interface WorkflowHelpPanelProps {
  currentStep: WorkflowStep | null;
  workflowState: WorkflowState;
  workflowDefinition: WorkflowStep[];
}

/**
 * Contextual help panel that provides guidance without disrupting workflow
 */
export const WorkflowHelpPanel: React.FC<WorkflowHelpPanelProps> = ({
  currentStep,
  workflowState,
  workflowDefinition
}) => {
  const [selectedHelpCategory, setSelectedHelpCategory] = useState('current-step');

  // Get help content for current step
  const getCurrentStepHelp = () => {
    if (!currentStep) {
      return {
        title: 'No Active Step',
        content: 'Select a step from the workflow to get specific guidance.',
        tips: [],
        commonIssues: []
      };
    }

    return {
      title: currentStep.title,
      content: currentStep.metadata?.helpText || currentStep.description,
      tips: [
        `Estimated completion time: ${currentStep.estimatedDuration} minutes`,
        `Complexity level: ${currentStep.complexity}`,
        ...(currentStep.metadata?.successCriteria || [])
      ],
      commonIssues: currentStep.metadata?.commonIssues || []
    };
  };

  // Get next steps guidance
  const getNextStepsGuidance = () => {
    if (!currentStep) return [];

    return currentStep.nextSteps.map(stepId => {
      const step = workflowDefinition.find(s => s.id === stepId);
      if (!step) return null;

      const isAvailable = workflowState.availableSteps.includes(stepId);
      const isCompleted = workflowState.completedSteps.includes(stepId);

      return {
        step,
        isAvailable,
        isCompleted,
        status: isCompleted ? 'completed' : isAvailable ? 'available' : 'locked'
      };
    }).filter(Boolean);
  };

  // Get workflow overview
  const getWorkflowOverview = () => {
    const categories = [...new Set(workflowDefinition.map(step => step.category))];
    
    return categories.map(category => {
      const categorySteps = workflowDefinition.filter(step => step.category === category);
      const completedSteps = categorySteps.filter(step => 
        workflowState.completedSteps.includes(step.id)
      ).length;

      return {
        category,
        steps: categorySteps,
        completedSteps,
        totalSteps: categorySteps.length,
        progress: Math.round((completedSteps / categorySteps.length) * 100)
      };
    });
  };

  // Get complexity level guidance
  const getComplexityGuidance = () => {
    const currentLevel = workflowState.userProgress.currentComplexityLevel;
    const availableLevels = Object.values(ComplexityLevel);
    const currentIndex = availableLevels.indexOf(currentLevel);

    return {
      current: currentLevel,
      description: getComplexityDescription(currentLevel),
      canAdvance: currentIndex < availableLevels.length - 1,
      nextLevel: currentIndex < availableLevels.length - 1 ? availableLevels[currentIndex + 1] : null,
      unlockCriteria: getUnlockCriteria(currentLevel)
    };
  };

  const getComplexityDescription = (level: ComplexityLevel) => {
    switch (level) {
      case ComplexityLevel.BASIC:
        return 'Basic level focuses on fundamental analysis with guided workflows and simplified options.';
      case ComplexityLevel.INTERMEDIATE:
        return 'Intermediate level introduces more analysis options and customization capabilities.';
      case ComplexityLevel.ADVANCED:
        return 'Advanced level provides comprehensive analysis tools and detailed configuration options.';
      case ComplexityLevel.EXPERT:
        return 'Expert level offers full control over all analysis parameters and advanced features.';
      default:
        return 'Unknown complexity level.';
    }
  };

  const getUnlockCriteria = (level: ComplexityLevel) => {
    switch (level) {
      case ComplexityLevel.BASIC:
        return ['Complete 3 basic analysis steps', 'Spend at least 15 minutes in workflow'];
      case ComplexityLevel.INTERMEDIATE:
        return ['Complete 5 analysis steps', 'Successfully generate 2 visualizations'];
      case ComplexityLevel.ADVANCED:
        return ['Complete 8 analysis steps', 'Use advanced features in 3 different categories'];
      default:
        return [];
    }
  };

  const currentStepHelp = getCurrentStepHelp();
  const nextStepsGuidance = getNextStepsGuidance();
  const workflowOverview = getWorkflowOverview();
  const complexityGuidance = getComplexityGuidance();

  const tabs: TabsProps.Tab[] = [
    {
      id: 'current-step',
      label: 'Current Step',
      content: (
        <SpaceBetween direction="vertical" size="m">
          <Header variant="h3">{currentStepHelp.title}</Header>
          
          <Box>{currentStepHelp.content}</Box>

          {currentStepHelp.tips.length > 0 && (
            <Alert type="info" header="Tips for Success">
              <SpaceBetween direction="vertical" size="xs">
                {currentStepHelp.tips.map((tip, index) => (
                  <Box key={index}>• {tip}</Box>
                ))}
              </SpaceBetween>
            </Alert>
          )}

          {currentStepHelp.commonIssues.length > 0 && (
            <ExpandableSection header="Common Issues & Solutions">
              <SpaceBetween direction="vertical" size="xs">
                {currentStepHelp.commonIssues.map((issue, index) => (
                  <Box key={index}>• {issue}</Box>
                ))}
              </SpaceBetween>
            </ExpandableSection>
          )}

          {currentStep?.callToAction.contextualHelp && (
            <Alert type="info" header={currentStep.callToAction.contextualHelp.title}>
              <SpaceBetween direction="vertical" size="s">
                <Box>{currentStep.callToAction.contextualHelp.content}</Box>
                {currentStep.callToAction.contextualHelp.links && (
                  <SpaceBetween direction="horizontal" size="s">
                    {currentStep.callToAction.contextualHelp.links.map((link, index) => (
                      <Link key={index} href={link.url} external={link.external}>
                        {link.label}
                      </Link>
                    ))}
                  </SpaceBetween>
                )}
              </SpaceBetween>
            </Alert>
          )}
        </SpaceBetween>
      )
    },
    {
      id: 'next-steps',
      label: 'Next Steps',
      content: (
        <SpaceBetween direction="vertical" size="m">
          <Header variant="h3">Recommended Next Steps</Header>
          
          {nextStepsGuidance.length === 0 ? (
            <Alert type="info">
              Complete the current step to see available next steps.
            </Alert>
          ) : (
            <SpaceBetween direction="vertical" size="s">
              {nextStepsGuidance.map((guidance, index) => {
                if (!guidance) return null;
                
                return (
                  <Container key={index}>
                    <SpaceBetween direction="vertical" size="s">
                      <Header
                        variant="h4"
                        actions={
                          <Badge 
                            color={
                              guidance.status === 'completed' ? 'green' :
                              guidance.status === 'available' ? 'blue' : 'grey'
                            }
                          >
                            {guidance.status.toUpperCase()}
                          </Badge>
                        }
                      >
                        {guidance.step.title}
                      </Header>
                      <Box>{guidance.step.description}</Box>
                      <Box>
                        <strong>Estimated time:</strong> {guidance.step.estimatedDuration} minutes
                      </Box>
                    </SpaceBetween>
                  </Container>
                );
              })}
            </SpaceBetween>
          )}
        </SpaceBetween>
      )
    },
    {
      id: 'workflow-overview',
      label: 'Workflow Overview',
      content: (
        <SpaceBetween direction="vertical" size="m">
          <Header variant="h3">Complete Workflow Overview</Header>
          
          {workflowOverview.map((categoryInfo, index) => (
            <ExpandableSection
              key={index}
              header={`${categoryInfo.category.replace(/_/g, ' ').toUpperCase()} (${categoryInfo.completedSteps}/${categoryInfo.totalSteps})`}
              defaultExpanded={categoryInfo.completedSteps > 0}
            >
              <SpaceBetween direction="vertical" size="s">
                {categoryInfo.steps.map(step => {
                  const isCompleted = workflowState.completedSteps.includes(step.id);
                  const isCurrent = workflowState.currentStepId === step.id;
                  const isAvailable = workflowState.availableSteps.includes(step.id);

                  return (
                    <Box key={step.id}>
                      <SpaceBetween direction="horizontal" size="s" alignItems="center">
                        <Box>
                          {isCompleted ? '✅' : isCurrent ? '🔄' : isAvailable ? '⏳' : '🔒'}
                        </Box>
                        <Box>
                          <strong>{step.title}</strong>
                          <br />
                          <small>{step.description}</small>
                        </Box>
                        <Badge color={step.complexity === ComplexityLevel.BASIC ? 'green' : 
                                     step.complexity === ComplexityLevel.INTERMEDIATE ? 'blue' :
                                     step.complexity === ComplexityLevel.ADVANCED ? 'orange' : 'red'}>
                          {step.complexity.toUpperCase()}
                        </Badge>
                      </SpaceBetween>
                    </Box>
                  );
                })}
              </SpaceBetween>
            </ExpandableSection>
          ))}
        </SpaceBetween>
      )
    },
    {
      id: 'complexity',
      label: 'Complexity Level',
      content: (
        <SpaceBetween direction="vertical" size="m">
          <Header variant="h3">Current Complexity Level</Header>
          
          <Alert type="info" header={`${complexityGuidance.current.toUpperCase()} Level`}>
            {complexityGuidance.description}
          </Alert>

          {complexityGuidance.canAdvance && (
            <Alert type="success" header="Ready to Advance?">
              <SpaceBetween direction="vertical" size="s">
                <Box>
                  You can unlock <strong>{complexityGuidance.nextLevel?.toUpperCase()}</strong> level by completing:
                </Box>
                <SpaceBetween direction="vertical" size="xs">
                  {complexityGuidance.unlockCriteria.map((criteria, index) => (
                    <Box key={index}>• {criteria}</Box>
                  ))}
                </SpaceBetween>
              </SpaceBetween>
            </Alert>
          )}

          <ExpandableSection header="All Complexity Levels">
            <SpaceBetween direction="vertical" size="s">
              {Object.values(ComplexityLevel).map(level => (
                <Box key={level}>
                  <SpaceBetween direction="horizontal" size="s" alignItems="center">
                    <Badge 
                      color={level === complexityGuidance.current ? 'green' : 'grey'}
                    >
                      {level.toUpperCase()}
                    </Badge>
                    <Box>{getComplexityDescription(level)}</Box>
                  </SpaceBetween>
                </Box>
              ))}
            </SpaceBetween>
          </ExpandableSection>
        </SpaceBetween>
      )
    }
  ];

  return (
    <Container>
      <Tabs 
        tabs={tabs}
        activeTabId={selectedHelpCategory}
        onChange={({ detail }) => setSelectedHelpCategory(detail.activeTabId)}
      />
    </Container>
  );
};

export default WorkflowHelpPanel;