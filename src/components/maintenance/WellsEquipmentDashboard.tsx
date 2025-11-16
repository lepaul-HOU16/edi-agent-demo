
import React, { useState, useMemo } from 'react';
import ViewSelector from './ViewSelector';
import ConsolidatedAnalysisView from './ConsolidatedAnalysisView';
import IndividualWellView from './IndividualWellView';

// Type definitions based on design document
interface WellSummary {
  id: string;
  name: string;
  healthScore: number;
  status: 'operational' | 'degraded' | 'critical' | 'offline';
  alertCount: number;
  criticalAlertCount: number;
  lastMaintenance: string;
  nextMaintenance: string;
  location: string;
  keyMetrics: {
    temperature?: number;
    pressure?: number;
    flowRate?: number;
    production?: number;
  };
}

interface NoteworthyItem {
  wellId: string;
  wellName: string;
  severity: 'critical' | 'high' | 'medium' | 'info';
  title: string;
  description: string;
  recommendation?: string;
  metrics?: Record<string, any>;
}

interface PriorityAction {
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

interface ChartData {
  [key: string]: any;
}

interface DashboardSummary {
  totalWells: number;
  operational: number;
  degraded: number;
  critical: number;
  offline: number;
  fleetHealthScore: number;
  criticalAlerts: number;
  wellsNeedingAttention: number;
  upcomingMaintenance: number;
}

interface WellsDashboardArtifact {
  messageContentType: 'wells_equipment_dashboard';
  title: string;
  subtitle: string;
  dashboard: {
    summary: DashboardSummary;
    noteworthyConditions: {
      criticalIssues: NoteworthyItem[];
      decliningHealth: NoteworthyItem[];
      maintenanceOverdue: NoteworthyItem[];
      topPerformers: NoteworthyItem[];
      unusualPatterns: NoteworthyItem[];
    };
    priorityActions: PriorityAction[];
    wells: WellSummary[];
    charts: {
      healthDistribution: ChartData;
      statusBreakdown: ChartData;
      fleetTrend: ChartData;
      alertHeatmap: ChartData;
    };
    comparativePerformance: {
      topByHealth: WellSummary[];
      bottomByHealth: WellSummary[];
      topByProduction: WellSummary[];
      bottomByProduction: WellSummary[];
    };
    timestamp: string;
  };
}

interface WellsEquipmentDashboardProps {
  artifact: WellsDashboardArtifact;
}

type ViewMode = 'consolidated' | 'individual';

const WellsEquipmentDashboard: React.FC<WellsEquipmentDashboardProps> = ({ artifact }) => {
  // State management
  const [viewMode, setViewMode] = useState<ViewMode>('consolidated');
  const [selectedWellId, setSelectedWellId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Parse artifact data
  const dashboardData = useMemo(() => {
    try {
      if (!artifact || !artifact.dashboard) {
        throw new Error('Invalid artifact structure');
      }
      return artifact.dashboard;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse dashboard data');
      return null;
    }
  }, [artifact]);

  // Get selected well data
  const selectedWell = useMemo(() => {
    if (!selectedWellId || !dashboardData) return null;
    return dashboardData.wells.find(well => well.id === selectedWellId) || null;
  }, [selectedWellId, dashboardData]);

  // Handle view switching
  const handleViewChange = (viewMode: 'consolidated' | 'individual', wellId?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      if (viewMode === 'consolidated') {
        // Switch to consolidated view
        setViewMode('consolidated');
        setSelectedWellId(null);
      } else if (viewMode === 'individual' && wellId) {
        // Switch to individual well view
        const well = dashboardData?.wells.find(w => w.id === wellId);
        if (!well) {
          throw new Error(`Well ${wellId} not found`);
        }
        setViewMode('individual');
        setSelectedWellId(wellId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to switch view');
    } finally {
      setIsLoading(false);
    }
  };

  // Error state
  if (error && !dashboardData) {
    return (
      <div className="wells-dashboard-error" style={{
        padding: '2rem',
        backgroundColor: '#fee',
        border: '1px solid #fcc',
        borderRadius: '8px',
        color: '#c00'
      }}>
        <h3>Error Loading Dashboard</h3>
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          style={{
            marginTop: '1rem',
            padding: '0.5rem 1rem',
            backgroundColor: '#c00',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  // Loading state
  if (!dashboardData) {
    return (
      <div className="wells-dashboard-loading" style={{
        padding: '2rem',
        textAlign: 'center'
      }}>
        <div className="spinner" style={{
          width: '40px',
          height: '40px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #3498db',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 1rem'
        }} />
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div className="wells-equipment-dashboard" style={{
      width: '100%',
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '1rem'
    }}>
      {/* View Selector */}
      <div className="dashboard-header" style={{ marginBottom: '1.5rem' }}>
        <ViewSelector
          wells={dashboardData.wells}
          selectedView={selectedWellId || 'consolidated'}
          onViewChange={handleViewChange}
        />
      </div>

      {/* Error message (non-fatal) */}
      {error && (
        <div className="dashboard-error-banner" style={{
          padding: '1rem',
          backgroundColor: '#fff3cd',
          border: '1px solid #ffc107',
          borderRadius: '4px',
          marginBottom: '1rem',
          color: '#856404'
        }}>
          <strong>Warning:</strong> {error}
        </div>
      )}

      {/* Loading overlay */}
      {isLoading && (
        <div className="dashboard-loading-overlay" style={{
          position: 'relative',
          opacity: 0.6,
          pointerEvents: 'none'
        }}>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1000
          }}>
            <div className="spinner" style={{
              width: '40px',
              height: '40px',
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #3498db',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="dashboard-content">
        {viewMode === 'consolidated' ? (
          <ConsolidatedAnalysisView
            summary={dashboardData.summary}
            noteworthyConditions={dashboardData.noteworthyConditions}
            comparativePerformance={dashboardData.comparativePerformance}
          />
        ) : selectedWell ? (
          <IndividualWellView
            well={selectedWell}
            onBackToConsolidated={() => handleViewChange('consolidated')}
          />
        ) : (
          <div className="no-well-selected" style={{
            padding: '2rem',
            textAlign: 'center',
            color: '#666'
          }}>
            <p>No well selected. Please select a well from the dropdown.</p>
          </div>
        )}
      </div>

      {/* CSS for spinner animation */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default WellsEquipmentDashboard;
