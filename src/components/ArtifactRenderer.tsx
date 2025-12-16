import React from 'react';
import { LogPlotViewerComponent } from './messageComponents/LogPlotViewerComponent';
import { ComprehensiveWellDataDiscoveryComponent } from './messageComponents/ComprehensiveWellDataDiscoveryComponent';
import InteractiveEducationalComponent from './messageComponents/InteractiveEducationalComponent';
import UniversalResponseComponent from './messageComponents/UniversalResponseComponent';
import RenewableEnergyGuidanceComponent from './messageComponents/RenewableEnergyGuidanceComponent';
// New renewable energy artifact components
import { 
  TerrainMapArtifact, 
  LayoutMapArtifact, 
  SimulationChartArtifact, 
  ReportArtifact 
} from './renewable';
import WakeAnalysisArtifact from './renewable/WakeAnalysisArtifact';
// Petrophysics Cloudscape components
import { CloudscapePorosityDisplay } from './cloudscape/CloudscapePorosityDisplay';
import { CloudscapeShaleVolumeDisplay } from './cloudscape/CloudscapeShaleVolumeDisplay';
import { CloudscapeSaturationDisplay } from './cloudscape/CloudscapeSaturationDisplay';
import { CloudscapeDataQualityDisplay } from './cloudscape/CloudscapeDataQualityDisplay';
// Maintenance components
import WellsEquipmentDashboard from './maintenance/WellsEquipmentDashboard';
import { EquipmentHealthArtifact } from './maintenance/EquipmentHealthArtifact';
import { FailurePredictionArtifact } from './maintenance/FailurePredictionArtifact';
import { MaintenanceScheduleArtifact } from './maintenance/MaintenanceScheduleArtifact';
import { InspectionReportArtifact } from './maintenance/InspectionReportArtifact';

interface Artifact {
  type: string;
  messageContentType?: string;
  wellName?: string;
  tracks?: string[];
  logData?: any;
  [key: string]: any;
}

interface ArtifactRendererProps {
  artifacts: Artifact[];
  onFollowUpAction?: (action: string) => void;
}

const ArtifactRenderer: React.FC<ArtifactRendererProps> = ({ artifacts, onFollowUpAction }) => {
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
          case 'log_plot_viewer':
            return (
              <div key={index} style={{ marginBottom: '16px' }}>
                <LogPlotViewerComponent 
                  data={{
                    wellName: artifact.wellName || 'SANDSTONE_RESERVOIR_001',
                    tracks: artifact.tracks || ['gammaRay', 'porosity', 'resistivity', 'calculated'],
                    logData: artifact.logData || null,
                    type: 'logPlotViewer',
                    availableCurves: artifact.availableCurves || [],
                    dataPoints: artifact.dataPoints || 0,
                    title: artifact.title || `Log Analysis - ${artifact.wellName || 'Well'}`
                  }}
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

          case 'wind_farm_terrain_analysis':
            return (
              <div key={index} style={{ marginBottom: '16px' }}>
                <TerrainMapArtifact 
                  data={artifact as any} 
                  onFollowUpAction={onFollowUpAction}
                />
              </div>
            );

          case 'wind_farm_layout':
            return (
              <div key={index} style={{ marginBottom: '16px' }}>
                <LayoutMapArtifact data={artifact as any} />
              </div>
            );

          case 'wind_farm_simulation':
            return (
              <div key={index} style={{ marginBottom: '16px' }}>
                <SimulationChartArtifact 
                  data={artifact as any} 
                  onFollowUpAction={onFollowUpAction}
                />
              </div>
            );

          case 'wake_simulation':
          case 'wake_analysis':
            return (
              <div key={index} style={{ marginBottom: '16px' }}>
                <WakeAnalysisArtifact 
                  data={artifact as any} 
                  onFollowUpAction={onFollowUpAction}
                />
              </div>
            );

          case 'wind_farm_report':
            return (
              <div key={index} style={{ marginBottom: '16px' }}>
                <ReportArtifact data={artifact as any} />
              </div>
            );

          case 'renewable_energy_guidance':
            return (
              <div key={index} style={{ marginBottom: '16px' }}>
                <RenewableEnergyGuidanceComponent data={artifact as any} />
              </div>
            );

          case 'comprehensive_porosity_analysis':
            return (
              <div key={index} style={{ marginBottom: '16px' }}>
                <CloudscapePorosityDisplay data={artifact as any} />
              </div>
            );

          case 'comprehensive_shale_analysis':
            return (
              <div key={index} style={{ marginBottom: '16px' }}>
                <CloudscapeShaleVolumeDisplay data={artifact as any} />
              </div>
            );

          case 'water_saturation_analysis':
            return (
              <div key={index} style={{ marginBottom: '16px' }}>
                <CloudscapeSaturationDisplay data={artifact as any} />
              </div>
            );

          case 'well_data_quality':
            return (
              <div key={index} style={{ marginBottom: '16px' }}>
                <CloudscapeDataQualityDisplay data={artifact as any} />
              </div>
            );

          case 'wells_equipment_dashboard':
          case 'fleet_status':
            return (
              <div key={index} style={{ marginBottom: '16px' }}>
                <WellsEquipmentDashboard artifact={artifact as any} />
              </div>
            );

          case 'equipment_health':
            return (
              <div key={index} style={{ marginBottom: '16px' }}>
                <EquipmentHealthArtifact data={artifact as any} />
              </div>
            );

          case 'failure_prediction':
            return (
              <div key={index} style={{ marginBottom: '16px' }}>
                <FailurePredictionArtifact data={artifact as any} />
              </div>
            );

          case 'maintenance_schedule':
            return (
              <div key={index} style={{ marginBottom: '16px' }}>
                <MaintenanceScheduleArtifact data={artifact as any} />
              </div>
            );

          case 'inspection_report':
            return (
              <div key={index} style={{ marginBottom: '16px' }}>
                <InspectionReportArtifact data={artifact as any} />
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
