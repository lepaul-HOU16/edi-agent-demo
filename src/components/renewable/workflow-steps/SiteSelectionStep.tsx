
import React, { useState } from 'react';
import {
  Container,
  Header,
  SpaceBetween,
  Box,
  Button,
  Input,
  FormField,
  Alert,
  Grid
} from '@cloudscape-design/components';
import { WorkflowStepProps } from '../../../types/workflow';

/**
 * Site Selection workflow step component
 * Demonstrates the workflow step interface and progressive disclosure
 */
export const SiteSelectionStep: React.FC<WorkflowStepProps> = ({
  stepId,
  workflowState,
  onStepComplete,
  onAdvanceWorkflow,
  onRequestHelp
}) => {
  const [coordinates, setCoordinates] = useState({
    latitude: workflowState.sessionData.coordinates?.lat?.toString() || '',
    longitude: workflowState.sessionData.coordinates?.lng?.toString() || ''
  });
  const [projectName, setProjectName] = useState(
    workflowState.sessionData.projectName || ''
  );
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Validate coordinates
  const validateCoordinates = (lat: string, lng: string): boolean => {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    
    if (isNaN(latitude) || isNaN(longitude)) {
      setValidationError('Please enter valid numeric coordinates');
      return false;
    }
    
    if (latitude < -90 || latitude > 90) {
      setValidationError('Latitude must be between -90 and 90 degrees');
      return false;
    }
    
    if (longitude < -180 || longitude > 180) {
      setValidationError('Longitude must be between -180 and 180 degrees');
      return false;
    }
    
    setValidationError(null);
    return true;
  };

  // Handle coordinate change
  const handleCoordinateChange = (field: 'latitude' | 'longitude', value: string) => {
    setCoordinates(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error when user starts typing
    if (validationError) {
      setValidationError(null);
    }
  };

  // Handle step completion
  const handleComplete = async () => {
    if (!validateCoordinates(coordinates.latitude, coordinates.longitude)) {
      return;
    }

    if (!projectName.trim()) {
      setValidationError('Please enter a project name');
      return;
    }

    setIsValidating(true);

    try {
      // Simulate validation delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const stepResults = {
        stepId,
        success: true,
        data: {
          coordinates: {
            lat: parseFloat(coordinates.latitude),
            lng: parseFloat(coordinates.longitude)
          },
          projectName: projectName.trim(),
          completedAt: new Date().toISOString()
        },
        nextRecommendedStep: 'terrain_analysis',
        userNotes: `Site selected at ${coordinates.latitude}, ${coordinates.longitude}`
      };

      onStepComplete(stepId, stepResults);
    } catch (error) {
      setValidationError('Failed to validate site selection. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  // Use example coordinates
  const useExampleCoordinates = () => {
    setCoordinates({
      latitude: '40.7128',
      longitude: '-74.0060'
    });
    setProjectName('New York Wind Farm Project');
  };

  const isCompleted = workflowState.completedSteps.includes(stepId);
  const canComplete = coordinates.latitude && coordinates.longitude && projectName.trim();

  return (
    <Container>
      <SpaceBetween direction="vertical" size="l">
        <Header
          variant="h3"
          description="Select the geographic location for your renewable energy analysis"
          actions={
            <Button
              iconName="status-info"
              variant="link"
              onClick={() => onRequestHelp(stepId, { section: 'site_selection' })}
            >
              Need Help?
            </Button>
          }
        >
          Site Selection
        </Header>

        {isCompleted && (
          <Alert type="success" header="Site Selection Completed">
            <SpaceBetween direction="vertical" size="s">
              <Box>
                <strong>Project:</strong> {workflowState.stepResults[stepId]?.data?.projectName}
              </Box>
              <Box>
                <strong>Coordinates:</strong> {workflowState.stepResults[stepId]?.data?.coordinates?.lat}, {workflowState.stepResults[stepId]?.data?.coordinates?.lng}
              </Box>
            </SpaceBetween>
          </Alert>
        )}

        {!isCompleted && (
          <SpaceBetween direction="vertical" size="m">
            {/* Project Name */}
            <FormField
              label="Project Name"
              description="Enter a name for your renewable energy project"
            >
              <Input
                value={projectName}
                onChange={({ detail }) => setProjectName(detail.value)}
                placeholder="e.g., Wind Farm Project 2024"
              />
            </FormField>

            {/* Coordinates */}
            <Grid gridDefinition={[{ colspan: 6 }, { colspan: 6 }]}>
              <FormField
                label="Latitude"
                description="Decimal degrees (e.g., 40.7128)"
              >
                <Input
                  value={coordinates.latitude}
                  onChange={({ detail }) => handleCoordinateChange('latitude', detail.value)}
                  placeholder="40.7128"
                  type="number"
                />
              </FormField>
              
              <FormField
                label="Longitude"
                description="Decimal degrees (e.g., -74.0060)"
              >
                <Input
                  value={coordinates.longitude}
                  onChange={({ detail }) => handleCoordinateChange('longitude', detail.value)}
                  placeholder="-74.0060"
                  type="number"
                />
              </FormField>
            </Grid>

            {/* Example Button */}
            <Box>
              <Button
                variant="link"
                iconName="star"
                onClick={useExampleCoordinates}
              >
                Use Example Coordinates (New York)
              </Button>
            </Box>

            {/* Validation Error */}
            {validationError && (
              <Alert type="error">
                {validationError}
              </Alert>
            )}

            {/* Completion Button */}
            <Box>
              <Button
                variant="primary"
                onClick={handleComplete}
                disabled={!canComplete || isValidating}
                loading={isValidating}
              >
                {isValidating ? 'Validating Site...' : 'Complete Site Selection'}
              </Button>
            </Box>
          </SpaceBetween>
        )}

        {/* Progressive Disclosure - Show next steps preview */}
        {isCompleted && workflowState.userProgress.currentComplexityLevel !== 'basic' && (
          <Alert type="info" header="What's Next?">
            <SpaceBetween direction="vertical" size="s">
              <Box>
                With your site selected, you can now proceed to:
              </Box>
              <SpaceBetween direction="horizontal" size="s">
                <Button
                  size="small"
                  onClick={() => onAdvanceWorkflow('terrain_analysis')}
                >
                  Analyze Terrain
                </Button>
                <Button
                  size="small"
                  onClick={() => onAdvanceWorkflow('wind_resource_assessment')}
                >
                  Assess Wind Resource
                </Button>
              </SpaceBetween>
            </SpaceBetween>
          </Alert>
        )}
      </SpaceBetween>
    </Container>
  );
};

export default SiteSelectionStep;