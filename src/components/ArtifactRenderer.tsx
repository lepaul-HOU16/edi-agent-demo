import React from 'react';
import { LogPlotViewer } from './logVisualization/LogPlotViewer';

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
        switch (artifact.type) {
          case 'logPlotViewer':
            return (
              <div key={index} style={{ marginBottom: '16px' }}>
                <LogPlotViewer 
                  wellName={artifact.wellName || 'SANDSTONE_RESERVOIR_001'}
                  tracks={artifact.tracks || ['gammaRay', 'porosity', 'resistivity', 'calculated']}
                />
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
