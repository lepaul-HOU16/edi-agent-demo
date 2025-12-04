
import React, { useMemo } from 'react';
import ConsolidatedAnalysisView from './ConsolidatedAnalysisView';

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

const WellsEquipmentDashboard: React.FC<WellsEquipmentDashboardProps> = ({ artifact }) => {
  // State management
  const [error, setError] = React.useState<string | null>(null);

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
      margin: '0 auto'
    }}>
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

      {/* Main content - Always show consolidated view */}
      <div className="dashboard-content">
        <ConsolidatedAnalysisView
          summary={dashboardData.summary}
          noteworthyConditions={dashboardData.noteworthyConditions}
          comparativePerformance={dashboardData.comparativePerformance}
        />
      </div>
    </div>
  );
};

export default WellsEquipmentDashboard;
