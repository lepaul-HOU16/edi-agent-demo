import React from 'react';
import './AgentVisualization.css';

export type AgentType = 'auto' | 'petrophysics' | 'maintenance' | 'renewable' | 'edicraft';
export type VisualizationSize = 'small' | 'medium' | 'large';

interface AgentVisualizationProps {
  type: AgentType;
  size?: VisualizationSize;
}

const AgentVisualization: React.FC<AgentVisualizationProps> = React.memo(({ type, size = 'medium' }) => {
  const dimensions = {
    small: { width: 120, height: 120 },
    medium: { width: 200, height: 200 },
    large: { width: 300, height: 300 }
  };

  const { width, height } = dimensions[size];

  const renderAutoVisualization = () => (
    <svg 
      width={width} 
      height={height}
      viewBox="0 0 200 200"
      role="img"
      aria-label="Auto agent visualization showing intelligent routing between specialized agents"
    >
      <title>Auto Agent Routing Diagram</title>
      <desc>Central AI node connected to four specialized agent nodes representing intelligent query routing</desc>
      
      {/* Connection lines */}
      <line x1="100" y1="100" x2="50" y2="50" stroke="#0972D3" strokeWidth="2" opacity="0.6" />
      <line x1="100" y1="100" x2="150" y2="50" stroke="#0972D3" strokeWidth="2" opacity="0.6" />
      <line x1="100" y1="100" x2="50" y2="150" stroke="#0972D3" strokeWidth="2" opacity="0.6" />
      <line x1="100" y1="100" x2="150" y2="150" stroke="#0972D3" strokeWidth="2" opacity="0.6" />
      
      {/* Specialized agent nodes */}
      <circle cx="50" cy="50" r="15" fill="#037F0C" />
      <text x="50" y="55" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">P</text>
      
      <circle cx="150" cy="50" r="15" fill="#5F6B7A" />
      <text x="150" y="55" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">M</text>
      
      <circle cx="50" cy="150" r="15" fill="#8B46FF" />
      <text x="50" y="155" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">R</text>
      
      <circle cx="150" cy="150" r="15" fill="#FF6B00" />
      <text x="150" y="155" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">E</text>
      
      {/* Central AI node */}
      <circle cx="100" cy="100" r="20" fill="#0972D3" />
      <text x="100" y="105" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">AI</text>
    </svg>
  );

  const renderPetrophysicsVisualization = () => (
    <svg 
      width={width} 
      height={height}
      viewBox="0 0 200 200"
      role="img"
      aria-label="Petrophysics agent visualization showing well log curves"
    >
      <title>Petrophysics Well Log Visualization</title>
      <desc>Depth track with gamma ray, resistivity, and porosity log curves</desc>
      
      {/* Depth track */}
      <rect x="20" y="20" width="30" height="160" fill="#F0F0F0" stroke="#5F6B7A" strokeWidth="1" />
      <text x="35" y="15" textAnchor="middle" fontSize="10" fill="#5F6B7A">Depth</text>
      
      {/* Depth markers */}
      <text x="25" y="30" fontSize="8" fill="#5F6B7A">0</text>
      <text x="25" y="100" fontSize="8" fill="#5F6B7A">50</text>
      <text x="25" y="175" fontSize="8" fill="#5F6B7A">100</text>
      
      {/* GR curve (Gamma Ray) */}
      <path 
        d="M 60 20 Q 80 60, 70 100 T 60 180" 
        fill="none" 
        stroke="#037F0C" 
        strokeWidth="2" 
      />
      <text x="60" y="15" fontSize="10" fill="#037F0C" fontWeight="bold">GR</text>
      
      {/* Resistivity curve */}
      <path 
        d="M 100 20 Q 120 80, 110 120 T 100 180" 
        fill="none" 
        stroke="#0972D3" 
        strokeWidth="2" 
      />
      <text x="100" y="15" fontSize="10" fill="#0972D3" fontWeight="bold">RES</text>
      
      {/* Porosity curve */}
      <path 
        d="M 140 20 Q 160 50, 150 90 T 140 180" 
        fill="none" 
        stroke="#8B46FF" 
        strokeWidth="2" 
      />
      <text x="140" y="15" fontSize="10" fill="#8B46FF" fontWeight="bold">PHI</text>
    </svg>
  );

  const renderMaintenanceVisualization = () => (
    <svg 
      width={width} 
      height={height}
      viewBox="0 0 200 200"
      role="img"
      aria-label="Maintenance agent visualization showing equipment health monitoring"
    >
      <title>Maintenance Equipment Health Monitoring</title>
      <desc>Equipment outline with health status indicators and sensor connections</desc>
      
      {/* Equipment outline (pump) */}
      <rect x="70" y="80" width="60" height="40" fill="#5F6B7A" stroke="#000" strokeWidth="2" />
      <circle cx="100" cy="100" r="15" fill="#0972D3" stroke="#000" strokeWidth="2" />
      
      {/* Health indicators */}
      <circle cx="50" cy="50" r="10" fill="#037F0C" stroke="#000" strokeWidth="1" />
      <text x="50" y="55" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">✓</text>
      <text x="50" y="35" textAnchor="middle" fontSize="8" fill="#5F6B7A">Good</text>
      
      <circle cx="100" cy="50" r="10" fill="#FF9900" stroke="#000" strokeWidth="1" />
      <text x="100" y="55" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">!</text>
      <text x="100" y="35" textAnchor="middle" fontSize="8" fill="#5F6B7A">Warning</text>
      
      <circle cx="150" cy="50" r="10" fill="#D91515" stroke="#000" strokeWidth="1" />
      <text x="150" y="55" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">✗</text>
      <text x="150" y="35" textAnchor="middle" fontSize="8" fill="#5F6B7A">Critical</text>
      
      {/* Sensor connection lines */}
      <line x1="50" y1="60" x2="85" y2="85" stroke="#037F0C" strokeWidth="1" strokeDasharray="2,2" />
      <line x1="100" y1="60" x2="100" y2="85" stroke="#FF9900" strokeWidth="1" strokeDasharray="2,2" />
      <line x1="150" y1="60" x2="115" y2="85" stroke="#D91515" strokeWidth="1" strokeDasharray="2,2" />
      
      {/* Equipment label */}
      <text x="100" y="140" textAnchor="middle" fontSize="10" fill="#5F6B7A" fontWeight="bold">PUMP-001</text>
    </svg>
  );

  const renderRenewableVisualization = () => (
    <svg 
      width={width} 
      height={height}
      viewBox="0 0 200 200"
      role="img"
      aria-label="Renewable energy agent visualization showing wind farm with turbines"
    >
      <title>Renewable Energy Wind Farm Visualization</title>
      <desc>Terrain with multiple wind turbines and wind direction indicators</desc>
      
      {/* Sky */}
      <rect x="0" y="0" width="200" height="150" fill="#E3F2FD" />
      
      {/* Terrain */}
      <path 
        d="M 0 150 Q 50 130, 100 140 T 200 150 L 200 200 L 0 200 Z" 
        fill="#E9ECEF" 
      />
      
      {/* Wind turbines */}
      <g>
        {/* Turbine 1 */}
        <line x1="50" y1="120" x2="50" y2="80" stroke="#5F6B7A" strokeWidth="3" />
        <ellipse cx="50" cy="80" rx="15" ry="2" fill="#0972D3" />
        <line x1="50" y1="80" x2="50" y2="65" stroke="#0972D3" strokeWidth="2" />
        <line x1="50" y1="80" x2="35" y2="85" stroke="#0972D3" strokeWidth="2" />
        <line x1="50" y1="80" x2="65" y2="85" stroke="#0972D3" strokeWidth="2" />
      </g>
      
      <g>
        {/* Turbine 2 */}
        <line x1="100" y1="110" x2="100" y2="60" stroke="#5F6B7A" strokeWidth="3" />
        <ellipse cx="100" cy="60" rx="18" ry="2" fill="#0972D3" />
        <line x1="100" y1="60" x2="100" y2="42" stroke="#0972D3" strokeWidth="2" />
        <line x1="100" y1="60" x2="82" y2="67" stroke="#0972D3" strokeWidth="2" />
        <line x1="100" y1="60" x2="118" y2="67" stroke="#0972D3" strokeWidth="2" />
      </g>
      
      <g>
        {/* Turbine 3 */}
        <line x1="150" y1="125" x2="150" y2="80" stroke="#5F6B7A" strokeWidth="3" />
        <ellipse cx="150" cy="80" rx="16" ry="2" fill="#0972D3" />
        <line x1="150" y1="80" x2="150" y2="64" stroke="#0972D3" strokeWidth="2" />
        <line x1="150" y1="80" x2="134" y2="86" stroke="#0972D3" strokeWidth="2" />
        <line x1="150" y1="80" x2="166" y2="86" stroke="#0972D3" strokeWidth="2" />
      </g>
      
      {/* Wind direction arrows */}
      <g>
        <path d="M 20 40 L 40 40 L 35 35 M 40 40 L 35 45" stroke="#0972D3" strokeWidth="2" fill="none" />
        <text x="20" y="30" fontSize="8" fill="#0972D3">Wind</text>
      </g>
    </svg>
  );

  const renderEDIcraftVisualization = () => (
    <svg 
      width={width} 
      height={height}
      viewBox="0 0 200 200"
      role="img"
      aria-label="EDIcraft agent visualization showing Minecraft-style subsurface blocks"
    >
      <title>EDIcraft Minecraft Subsurface Visualization</title>
      <desc>Pixelated Minecraft blocks showing surface terrain and wellbore with depth coordinates</desc>
      
      {/* Coordinate indicator - top */}
      <text x="100" y="30" textAnchor="middle" fontSize="10" fill="#0972D3" fontWeight="bold">Y=100</text>
      
      {/* Surface blocks (grass/dirt) */}
      <rect x="40" y="60" width="20" height="20" fill="#8B7355" stroke="#000" strokeWidth="1" />
      <rect x="60" y="60" width="20" height="20" fill="#7A6A4F" stroke="#000" strokeWidth="1" />
      <rect x="80" y="60" width="20" height="20" fill="#8B7355" stroke="#000" strokeWidth="1" />
      <rect x="100" y="60" width="20" height="20" fill="#7A6A4F" stroke="#000" strokeWidth="1" />
      <rect x="120" y="60" width="20" height="20" fill="#8B7355" stroke="#000" strokeWidth="1" />
      <rect x="140" y="60" width="20" height="20" fill="#7A6A4F" stroke="#000" strokeWidth="1" />
      
      {/* Wellbore blocks (vertical - orange/terracotta) */}
      <rect x="90" y="80" width="20" height="20" fill="#FF6B00" stroke="#000" strokeWidth="1" />
      <rect x="90" y="100" width="20" height="20" fill="#FF8533" stroke="#000" strokeWidth="1" />
      <rect x="90" y="120" width="20" height="20" fill="#FF6B00" stroke="#000" strokeWidth="1" />
      <rect x="90" y="140" width="20" height="20" fill="#FF8533" stroke="#000" strokeWidth="1" />
      
      {/* Subsurface layers (stone) */}
      <rect x="40" y="160" width="120" height="10" fill="#5F6B7A" stroke="#000" strokeWidth="1" />
      <rect x="40" y="170" width="120" height="10" fill="#4A5568" stroke="#000" strokeWidth="1" />
      
      {/* Coordinate indicator - bottom */}
      <text x="100" y="195" textAnchor="middle" fontSize="10" fill="#0972D3" fontWeight="bold">Y=50</text>
      
      {/* Wellbore label */}
      <text x="100" y="50" textAnchor="middle" fontSize="9" fill="#5F6B7A" fontWeight="bold">Wellbore</text>
    </svg>
  );

  const renderVisualization = () => {
    switch (type) {
      case 'auto':
        return renderAutoVisualization();
      case 'petrophysics':
        return renderPetrophysicsVisualization();
      case 'maintenance':
        return renderMaintenanceVisualization();
      case 'renewable':
        return renderRenewableVisualization();
      case 'edicraft':
        return renderEDIcraftVisualization();
      default:
        return null;
    }
  };

  return (
    <div className={`agent-visualization agent-visualization-${type} agent-visualization-${size}`}>
      {renderVisualization()}
    </div>
  );
});

AgentVisualization.displayName = 'AgentVisualization';

export default AgentVisualization;
