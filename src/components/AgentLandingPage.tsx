import React, { Suspense, lazy, useMemo } from 'react';
import { Box, Spinner } from '@cloudscape-design/components';

// Lazy load individual landing components for code splitting
const AutoAgentLanding = lazy(() => import('./agent-landing-pages/AutoAgentLanding'));
const PetrophysicsAgentLanding = lazy(() => import('./agent-landing-pages/PetrophysicsAgentLanding'));
const MaintenanceAgentLanding = lazy(() => import('./agent-landing-pages/MaintenanceAgentLanding'));
const RenewableAgentLanding = lazy(() => import('./agent-landing-pages/RenewableAgentLanding'));
const EDIcraftAgentLanding = lazy(() => import('./agent-landing-pages/EDIcraftAgentLanding'));

export type AgentType = 'auto' | 'petrophysics' | 'maintenance' | 'renewable' | 'edicraft';

interface AgentLandingPageProps {
  selectedAgent: AgentType;
  onWorkflowSelect?: (prompt: string) => void;
}

/**
 * Loading fallback component displayed while landing pages are being loaded
 */
const LoadingFallback: React.FC = () => (
  <Box textAlign="center" padding={{ vertical: 'xxl' }}>
    <Spinner size="large" />
    <Box variant="p" color="text-body-secondary" padding={{ top: 's' }}>
      Loading agent information...
    </Box>
  </Box>
);

/**
 * AgentLandingPage container component
 * 
 * Renders the appropriate agent landing page based on the selected agent.
 * Uses lazy loading with Suspense for optimal performance and code splitting.
 * 
 * @param selectedAgent - The currently selected agent type
 * @param onWorkflowSelect - Callback function when user selects an example workflow
 */
const AgentLandingPage: React.FC<AgentLandingPageProps> = React.memo(({
  selectedAgent,
  onWorkflowSelect
}) => {
  // Memoize the landing component to prevent unnecessary re-renders
  const landingComponent = useMemo(() => {
    switch (selectedAgent) {
      case 'auto':
        return <AutoAgentLanding onWorkflowSelect={onWorkflowSelect} />;
      
      case 'petrophysics':
        return <PetrophysicsAgentLanding onWorkflowSelect={onWorkflowSelect} />;
      
      case 'maintenance':
        return <MaintenanceAgentLanding onWorkflowSelect={onWorkflowSelect} />;
      
      case 'renewable':
        return <RenewableAgentLanding onWorkflowSelect={onWorkflowSelect} />;
      
      case 'edicraft':
        return <EDIcraftAgentLanding onWorkflowSelect={onWorkflowSelect} />;
      
      default:
        // Fallback to auto agent if unknown agent type
        return <AutoAgentLanding onWorkflowSelect={onWorkflowSelect} />;
    }
  }, [selectedAgent, onWorkflowSelect]);

  return (
    <Suspense fallback={<LoadingFallback />}>
      {landingComponent}
    </Suspense>
  );
});

AgentLandingPage.displayName = 'AgentLandingPage';

export default AgentLandingPage;
