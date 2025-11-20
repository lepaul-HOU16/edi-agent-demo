/**
 * Artifact Renderer Component
 * 
 * Central component that routes artifacts to specialized rendering components.
 * This is the main entry point for rendering all artifact types.
 */

import React from 'react';
import { Alert } from '@cloudscape-design/components';
import type { Artifact } from '../schemas/artifact-types';

// Import specialized artifact components
import TerrainMapArtifact from './TerrainMapArtifact';
import LayoutMapArtifact from './LayoutMapArtifact';
import WakeAnalysisArtifact from './WakeAnalysisArtifact';
import WindRoseArtifact from './WindRoseArtifact';
import ReportArtifact from './ReportArtifact';
import LogCurveArtifact from './LogCurveArtifact';
import PorosityArtifact from './PorosityArtifact';
import MultiWellCorrelationArtifact from './MultiWellCorrelationArtifact';

interface ArtifactRendererProps {
  artifact: Artifact;
  onFollowUpAction?: (query: string) => void;
}

/**
 * Renders an artifact based on its type.
 * Routes to specialized components for each artifact type.
 */
export const ArtifactRenderer: React.FC<ArtifactRendererProps> = ({ 
  artifact, 
  onFollowUpAction 
}) => {
  try {
    // Route to appropriate component based on artifact type
    switch (artifact.type) {
      // Renewable Energy Artifacts
      case 'wind_farm_terrain_analysis':
        return (
          <TerrainMapArtifact
            data={artifact.data}
            actions={artifact.actions}
            onFollowUpAction={onFollowUpAction}
          />
        );

      case 'wind_farm_layout':
        return (
          <LayoutMapArtifact
            data={artifact.data}
            actions={artifact.actions}
            onFollowUpAction={onFollowUpAction}
          />
        );

      case 'wind_farm_wake_analysis':
        return (
          <WakeAnalysisArtifact
            data={artifact.data}
            actions={artifact.actions}
            onFollowUpAction={onFollowUpAction}
          />
        );

      case 'wind_rose_analysis':
        return (
          <WindRoseArtifact
            data={artifact.data}
            actions={artifact.actions}
            onFollowUpAction={onFollowUpAction}
          />
        );

      case 'wind_farm_report':
        return (
          <ReportArtifact
            data={artifact.data}
            actions={artifact.actions}
            onFollowUpAction={onFollowUpAction}
          />
        );

      // Petrophysical Artifacts
      case 'log_curve_visualization':
        return (
          <LogCurveArtifact
            data={artifact.data}
            onFollowUpAction={onFollowUpAction}
          />
        );

      case 'porosity_analysis':
        return (
          <PorosityArtifact
            data={artifact.data}
            onFollowUpAction={onFollowUpAction}
          />
        );

      case 'multi_well_correlation':
        return (
          <MultiWellCorrelationArtifact
            data={artifact.data}
            onFollowUpAction={onFollowUpAction}
          />
        );

      // Unknown artifact type
      default:
        console.warn(`Unknown artifact type: ${artifact.type}`);
        return (
          <Alert
            type="warning"
            header="Unknown Artifact Type"
          >
            Unable to render artifact of type: {artifact.type}
          </Alert>
        );
    }
  } catch (error) {
    console.error('Error rendering artifact:', error);
    return (
      <Alert
        type="error"
        header="Artifact Rendering Error"
      >
        An error occurred while rendering this artifact. Please try refreshing the page.
      </Alert>
    );
  }
};

/**
 * Error Boundary for Artifact Rendering
 * Catches errors in artifact components and displays fallback UI
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ArtifactErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Artifact rendering error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert
          type="error"
          header="Visualization Error"
        >
          <p>Unable to display this artifact.</p>
          {this.state.error && (
            <p style={{ fontSize: '12px', color: '#545b64', marginTop: '8px' }}>
              Error: {this.state.error.message}
            </p>
          )}
        </Alert>
      );
    }

    return this.props.children;
  }
}

/**
 * Usage Example:
 * 
 * ```tsx
 * import { ArtifactRenderer, ArtifactErrorBoundary } from './ArtifactRenderer';
 * 
 * function ChatMessage({ message }) {
 *   return (
 *     <div>
 *       <p>{message.content.text}</p>
 *       {message.artifacts?.map((artifact, index) => (
 *         <ArtifactErrorBoundary key={index}>
 *           <ArtifactRenderer
 *             artifact={artifact}
 *             onFollowUpAction={(query) => {
 *               // Handle follow-up action
 *               sendMessage(query);
 *             }}
 *           />
 *         </ArtifactErrorBoundary>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */

export default ArtifactRenderer;
