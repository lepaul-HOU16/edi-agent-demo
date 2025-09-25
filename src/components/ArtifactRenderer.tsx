import React from 'react';
import { LogPlotViewer } from './logVisualization/LogPlotViewer';
import { ComprehensiveWellDataDiscoveryComponent } from './messageComponents/ComprehensiveWellDataDiscoveryComponent';
import InteractiveEducationalComponent from './messageComponents/InteractiveEducationalComponent';
import UniversalResponseComponent from './messageComponents/UniversalResponseComponent';

interface Artifact {
  type: string;
  wellName?: string;
  tracks?: string[];
  [key: string]: any;
}

interface ArtifactRendererProps {
  artifacts: Artifact[];
}

const ArtifactRenderer: React.FC<ArtifactRendererProps> = ({ artifacts }) => {
  if (!artifacts || artifacts.length === 0) {
    return null;
  }

  return (
    <div style={{ marginTop: '16px' }}>
      {artifacts.map((artifact, index) => {
        // Check both 'type' and 'messageContentType' for backwards compatibility
        const artifactType = artifact.type || artifact.messageContentType;
        
        switch (artifactType) {
          case 'logPlotViewer':
            return (
              <div key={index} style={{ marginBottom: '16px' }}>
                <LogPlotViewer 
                  wellName={artifact.wellName || 'SANDSTONE_RESERVOIR_001'}
                  tracks={artifact.tracks || ['gammaRay', 'porosity', 'resistivity', 'calculated']}
                />
              </div>
            );
            
          case 'comprehensive_well_data_discovery':
            return (
              <div key={index} style={{ marginBottom: '16px' }}>
                <ComprehensiveWellDataDiscoveryComponent data={artifact} />
              </div>
            );

          case 'interactive_educational':
          case 'educational_overview':
            return (
              <div key={index} style={{ marginBottom: '16px' }}>
                <InteractiveEducationalComponent data={artifact as any} />
              </div>
            );

          case 'concept_definition':
          case 'general_knowledge':
          case 'quick_answer':
          case 'error_response':
          case 'guidance_response':
            return (
              <div key={index} style={{ marginBottom: '16px' }}>
                <UniversalResponseComponent data={artifact as any} />
              </div>
            );
            
          default:
            return null;
        }
      })}
    </div>
  );
};

export default ArtifactRenderer;
