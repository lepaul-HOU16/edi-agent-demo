'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Header,
  SpaceBetween,
  Box,
  Alert,
  Button,
  Badge,
  Modal,
  ExpandableSection,
  ProgressBar,
  Tabs,
  TabsProps
} from '@cloudscape-design/components';
import {
  WorkflowState,
  ComplexityLevel,
  Achievement,
  FeatureUnlock,
  ComplexityGate
} from '../../types/workflow';
import { ProgressiveDisclosureService } from '../../services/workflow/ProgressiveDisclosureService';

/**
 * Props for ProgressiveDisclosurePanel component
 */
interface ProgressiveDisclosurePanelProps {
  workflowState: WorkflowState;
  disclosureService: ProgressiveDisclosureService;
  onComplexityUpgrade: (newLevel: ComplexityLevel) => void;
  onFeatureUnlock: (featureId: string) => void;
  onAchievementAcknowledge: (achievementId: string) => void;
  visible?: boolean;
  onDismiss?: () => void;
}

/**
 * Panel for managing progressive disclosure, complexity upgrades, and feature unlocks
 */
export const ProgressiveDisclosurePanel: React.FC<ProgressiveDisclosurePanelProps> = ({
  workflowState,
  disclosureService,
  onComplexityUpgrade,
  onFeatureUnlock,
  onAchievementAcknowledge,
  visible = false,
  onDismiss
}) => {
  const [disclosureState, setDisclosureState] = useState({
    newFeatures: [] as string[],
    complexityUpgrade: null as ComplexityLevel | null,
    achievements: [] as Achievement[],
    recommendations: [] as string[]
  });

  const [showComplexityUpgradeModal, setShowComplexityUpgradeModal] = useState(false);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);

  // Evaluate disclosure state when workflow state changes
  useEffect(() => {
    const newState = disclosureService.evaluateDisclosure(workflowState);
    setDisclosureState(newState);

    // Auto-show modals for new achievements or complexity upgrades
    if (newState.achievements.length > 0) {
      setSelectedAchievement(newState.achievements[0]);
      setShowAchievementModal(true);
    } else if (newState.complexityUpgrade) {
      setShowComplexityUpgradeModal(true);
    }
  }, [workflowState, disclosureService]);

  // Handle complexity upgrade
  const handleComplexityUpgrade = () => {
    if (disclosureState.complexityUpgrade) {
      onComplexityUpgrade(disclosureState.complexityUpgrade);
      setShowComplexityUpgradeModal(false);
    }
  };

  // Handle achievement acknowledgment
  const handleAchievementAcknowledge = () => {
    if (selectedAchievement) {
      onAchievementAcknowledge(selectedAchievement.id);
      setSelectedAchievement(null);
      setShowAchievementModal(false);
    }
  };

  // Get available features
  const availableFeatures = disclosureService.getAvailableFeatures(workflowState);
  const nextComplexityRequirements = disclosureService.getNextComplexityRequirements(workflowState);

  // Get complexity level progress
  const getComplexityProgress = () => {
    const levels = Object.values(ComplexityLevel);
    const currentIndex = levels.indexOf(workflowState.userProgress.currentComplexityLevel);
    return Math.round(((currentIndex + 1) / levels.length) * 100);
  };

  // Get complexity level color
  const getComplexityColor = (level: ComplexityLevel) => {
    switch (level) {
      case ComplexityLevel.BASIC:
        return 'green';
      case ComplexityLevel.INTERMEDIATE:
        return 'blue';
      case ComplexityLevel.ADVANCED:
        return 'orange';
      case ComplexityLevel.EXPERT:
        return 'red';
      default:
        return 'grey';
    }
  };

  const tabs: TabsProps.Tab[] = [
    {
      id: 'features',
      label: 'Available Features',
      content: (
        <SpaceBetween direction="vertical" size="m">
          <Header variant="h3">
            Features Available at {workflowState.userProgress.currentComplexityLevel.toUpperCase()} Level
          </Header>
          
          {availableFeatures.length === 0 ? (
            <Alert type="info">
              Complete more steps to unlock additional features.
            </Alert>
          ) : (
            <SpaceBetween direction="vertical" size="s">
              {availableFeatures.map(featureId => {
                const featureInfo = disclosureService.getFeatureUnlockRequirements(featureId);
                return (
                  <Container key={featureId}>
                    <SpaceBetween direction="vertical" size="s">
                      <Header
                        variant="h4"
                        actions={
                          <Badge color="green">UNLOCKED</Badge>
                        }
                      >
                        {featureInfo?.name || featureId.replace(/_/g, ' ').toUpperCase()}
                      </Header>
                      <Box>
                        {featureInfo?.description || 'Advanced feature available for use'}
                      </Box>
                      <Button
                        size="small"
                        onClick={() => onFeatureUnlock(featureId)}
                      >
                        Use Feature
                      </Button>
                    </SpaceBetween>
                  </Container>
                );
              })}
            </SpaceBetween>
          )}

          {/* New Features */}
          {disclosureState.newFeatures.length > 0 && (
            <Alert type="success" header="New Features Unlocked!">
              <SpaceBetween direction="vertical" size="s">
                {disclosureState.newFeatures.map(featureId => (
                  <Box key={featureId}>
                    🎉 {featureId.replace(/_/g, ' ').toUpperCase()}
                  </Box>
                ))}
              </SpaceBetween>
            </Alert>
          )}
        </SpaceBetween>
      )
    },
    {
      id: 'complexity',
      label: 'Complexity Level',
      content: (
        <SpaceBetween direction="vertical" size="m">
          <Header variant="h3">Current Complexity Level</Header>
          
          <Container>
            <SpaceBetween direction="vertical" size="m">
              <Box>
                <SpaceBetween direction="horizontal" size="s" alignItems="center">
                  <Badge color={getComplexityColor(workflowState.userProgress.currentComplexityLevel)} size="large">
                    {workflowState.userProgress.currentComplexityLevel.toUpperCase()}
                  </Badge>
                  <ProgressBar
                    value={getComplexityProgress()}
                    label="Complexity Progress"
                  />
                </SpaceBetween>
              </Box>

              {/* Complexity Upgrade Available */}
              {disclosureState.complexityUpgrade && (
                <Alert 
                  type="success" 
                  header="Ready to Level Up!"
                  action={
                    <Button 
                      variant="primary"
                      onClick={() => setShowComplexityUpgradeModal(true)}
                    >
                      Upgrade to {disclosureState.complexityUpgrade.toUpperCase()}
                    </Button>
                  }
                >
                  You've met the requirements to advance to {disclosureState.complexityUpgrade} level!
                </Alert>
              )}

              {/* Next Level Requirements */}
              {nextComplexityRequirements && !disclosureState.complexityUpgrade && (
                <ExpandableSection header="Next Level Requirements">
                  <SpaceBetween direction="vertical" size="s">
                    <Box>
                      <strong>To unlock {nextComplexityRequirements.requiredLevel.toUpperCase()} level:</strong>
                    </Box>
                    <SpaceBetween direction="vertical" size="xs">
                      {nextComplexityRequirements.unlockCriteria.completedSteps.map(stepId => {
                        const isCompleted = workflowState.completedSteps.includes(stepId);
                        return (
                          <Box key={stepId}>
                            {isCompleted ? '✅' : '⏳'} Complete {stepId.replace(/_/g, ' ')}
                          </Box>
                        );
                      })}
                      <Box>
                        ⏱️ Spend at least {nextComplexityRequirements.unlockCriteria.timeSpentMinutes} minutes 
                        (Current: {Math.round(workflowState.userProgress.timeSpent)} minutes)
                      </Box>
                    </SpaceBetween>
                  </SpaceBetween>
                </ExpandableSection>
              )}
            </SpaceBetween>
          </Container>
        </SpaceBetween>
      )
    },
    {
      id: 'achievements',
      label: 'Achievements',
      content: (
        <SpaceBetween direction="vertical" size="m">
          <Header variant="h3">Your Achievements</Header>
          
          {workflowState.userProgress.achievements.length === 0 ? (
            <Alert type="info">
              Complete workflow steps to earn achievements!
            </Alert>
          ) : (
            <SpaceBetween direction="vertical" size="s">
              {workflowState.userProgress.achievements.map(achievement => (
                <Container key={achievement.id}>
                  <SpaceBetween direction="horizontal" size="s" alignItems="center">
                    <Box fontSize="heading-l">{achievement.icon}</Box>
                    <SpaceBetween direction="vertical" size="xs">
                      <Box fontWeight="bold">{achievement.title}</Box>
                      <Box>{achievement.description}</Box>
                      <Box fontSize="body-s" color="text-status-inactive">
                        Unlocked: {achievement.unlockedAt.toLocaleDateString()}
                      </Box>
                    </SpaceBetween>
                    <Badge color="green">{achievement.category.toUpperCase()}</Badge>
                  </SpaceBetween>
                </Container>
              ))}
            </SpaceBetween>
          )}
        </SpaceBetween>
      )
    },
    {
      id: 'recommendations',
      label: 'Recommendations',
      content: (
        <SpaceBetween direction="vertical" size="m">
          <Header variant="h3">Personalized Recommendations</Header>
          
          {disclosureState.recommendations.length === 0 ? (
            <Alert type="info">
              Continue working through the workflow to receive personalized recommendations.
            </Alert>
          ) : (
            <SpaceBetween direction="vertical" size="s">
              {disclosureState.recommendations.map((recommendation, index) => (
                <Alert key={index} type="info">
                  {recommendation}
                </Alert>
              ))}
            </SpaceBetween>
          )}
        </SpaceBetween>
      )
    }
  ];

  return (
    <>
      {/* Main Panel */}
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        header="Progressive Features & Achievements"
        size="large"
      >
        <Tabs tabs={tabs} />
      </Modal>

      {/* Complexity Upgrade Modal */}
      <Modal
        visible={showComplexityUpgradeModal}
        onDismiss={() => setShowComplexityUpgradeModal(false)}
        header="Complexity Level Upgrade Available!"
        footer={
          <SpaceBetween direction="horizontal" size="s">
            <Button 
              variant="link" 
              onClick={() => setShowComplexityUpgradeModal(false)}
            >
              Maybe Later
            </Button>
            <Button 
              variant="primary" 
              onClick={handleComplexityUpgrade}
            >
              Upgrade Now
            </Button>
          </SpaceBetween>
        }
      >
        {disclosureState.complexityUpgrade && (
          <SpaceBetween direction="vertical" size="m">
            <Alert type="success" header="Congratulations!">
              You've met all the requirements to advance to{' '}
              <strong>{disclosureState.complexityUpgrade.toUpperCase()}</strong> complexity level!
            </Alert>
            
            <Box>
              <strong>New features you'll unlock:</strong>
            </Box>
            
            <SpaceBetween direction="vertical" size="xs">
              {nextComplexityRequirements?.features.map(feature => (
                <Box key={feature}>
                  • {feature.replace(/_/g, ' ').toUpperCase()}
                </Box>
              ))}
            </SpaceBetween>
            
            <Box>
              {nextComplexityRequirements?.description}
            </Box>
          </SpaceBetween>
        )}
      </Modal>

      {/* Achievement Modal */}
      <Modal
        visible={showAchievementModal}
        onDismiss={() => setShowAchievementModal(false)}
        header="Achievement Unlocked!"
        footer={
          <Button 
            variant="primary" 
            onClick={handleAchievementAcknowledge}
          >
            Awesome!
          </Button>
        }
      >
        {selectedAchievement && (
          <SpaceBetween direction="vertical" size="m">
            <Box textAlign="center" fontSize="display-l">
              {selectedAchievement.icon}
            </Box>
            
            <Box textAlign="center">
              <Header variant="h2">{selectedAchievement.title}</Header>
            </Box>
            
            <Box textAlign="center">
              {selectedAchievement.description}
            </Box>
            
            <Box textAlign="center">
              <Badge color="green" size="large">
                {selectedAchievement.category.toUpperCase()}
              </Badge>
            </Box>
          </SpaceBetween>
        )}
      </Modal>
    </>
  );
};

export default ProgressiveDisclosurePanel;