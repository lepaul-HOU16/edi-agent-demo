import React, { useState } from 'react';
import type { GraphNode, RelatedNode, SourceDocument, LineageStep, QualityMetrics } from '../../types/knowledgeGraph';
import './DetailsPanel.css';

interface DetailsPanelProps {
  node: GraphNode | null;
  relatedNodes: RelatedNode[];
  sourceDocs: SourceDocument[];
  lineage: LineageStep[];
  quality: QualityMetrics | null;
  statistics?: GraphStatistics;
  onNodeSelect: (nodeId: string) => void;
  onCreateCanvas: () => void;
}

interface GraphStatistics {
  totalNodes: number;
  totalLinks: number;
  duplicatesFound: number;
  dataSources: string[];
  nodeTypeCounts: Record<string, number>;
  linkTypeCounts: Record<string, number>;
  qualityDistribution: {
    high: number;
    medium: number;
    low: number;
  };
}

export const DetailsPanel: React.FC<DetailsPanelProps> = ({
  node,
  relatedNodes,
  sourceDocs,
  lineage,
  quality,
  statistics,
  onNodeSelect,
  onCreateCanvas
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (!node) {
    return (
      <div className="details-panel">
        <h2 className="details-panel-title">Select a node to view details</h2>
        <p className="details-panel-subtitle">
          Click on any node in the graph to see its properties, relationships, and correlated data.
        </p>
        
        {statistics && (
          <div className="details-stats-section">
            <h3 className="details-section-title">QUICK STATS</h3>
            <div className="details-property">
              <span className="details-property-label">Total Nodes</span>
              <span className="details-property-value">{statistics.totalNodes}</span>
            </div>
            <div className="details-property">
              <span className="details-property-label">Total Relationships</span>
              <span className="details-property-value">{statistics.totalLinks}</span>
            </div>
            <div className="details-property">
              <span className="details-property-label">Duplicates Found</span>
              <span className="details-property-value">{statistics.duplicatesFound}</span>
            </div>
            <div className="details-property">
              <span className="details-property-label">Data Sources</span>
              <span className="details-property-value">{statistics.dataSources.length}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="details-panel">
      <h2 className="details-panel-title">{node.name}</h2>
      <div className="details-node-type">{node.type}</div>
      
      <div className="details-tabs">
        <button
          className={`details-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`details-tab ${activeTab === 'lineage' ? 'active' : ''}`}
          onClick={() => setActiveTab('lineage')}
        >
          Data Lineage
        </button>
        <button
          className={`details-tab ${activeTab === 'sources' ? 'active' : ''}`}
          onClick={() => setActiveTab('sources')}
        >
          Source Docs
        </button>
        <button
          className={`details-tab ${activeTab === 'quality' ? 'active' : ''}`}
          onClick={() => setActiveTab('quality')}
        >
          Data Quality
        </button>
      </div>
      
      {activeTab === 'overview' && (
        <div className="details-tab-content">
          <div className="details-section">
            <h3 className="details-section-title">PROPERTIES</h3>
            {Object.entries(node.data).map(([key, value]) => (
              <div key={key} className="details-property">
                <span className="details-property-label">{key}</span>
                <span className="details-property-value">{String(value)}</span>
              </div>
            ))}
            {node.lat && (
              <>
                <div className="details-property">
                  <span className="details-property-label">Latitude</span>
                  <span className="details-property-value">{node.lat.toFixed(4)}</span>
                </div>
                <div className="details-property">
                  <span className="details-property-label">Longitude</span>
                  <span className="details-property-value">{node.lng?.toFixed(4)}</span>
                </div>
              </>
            )}
          </div>
          
          {relatedNodes.length > 0 && (
            <div className="details-section">
              <h3 className="details-section-title">RELATED ITEMS ({relatedNodes.length})</h3>
              <ul className="details-related-list">
                {relatedNodes.map((r, idx) => (
                  <li
                    key={idx}
                    className="details-related-item"
                    onClick={() => onNodeSelect(r.node.id)}
                  >
                    <div className="details-related-type">{r.relationship} • {r.label}</div>
                    <div className="details-related-name">{r.node.name}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'lineage' && (
        <div className="details-tab-content">
          <div className="details-section">
            <h3 className="details-section-title">DATA TRANSFORMATION PIPELINE</h3>
            {lineage.length > 0 ? (
              lineage.map((step, idx) => (
                <div key={idx} className="details-lineage-step">
                  <div className="details-lineage-title">{step.step}</div>
                  <div className="details-lineage-meta">
                    <div><strong>Source:</strong> {step.source}</div>
                    <div><strong>Time:</strong> {step.timestamp}</div>
                    <div><strong>Transform:</strong> {step.transform}</div>
                    {step.docRef && (
                      <div className="details-lineage-doc">
                        <strong>📄 Source Document:</strong> {step.docRef} ({step.docType})
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="details-empty-message">No lineage data available for this node.</p>
            )}
          </div>
        </div>
      )}
      
      {activeTab === 'sources' && (
        <div className="details-tab-content">
          <div className="details-section">
            <h3 className="details-section-title">ORIGINAL SOURCE DOCUMENTS</h3>
            {sourceDocs.length > 0 ? (
              sourceDocs.map((doc, idx) => (
                <div key={idx} className="details-source-doc">
                  <div className="details-source-title">📄 {doc.title}</div>
                  <div className="details-source-meta">
                    <span>{doc.type}</span>
                    <span>•</span>
                    <span>{doc.date}</span>
                    <span>•</span>
                    <span>{doc.size}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="details-empty-message">No source documents available for this node.</p>
            )}
          </div>
        </div>
      )}
      
      {activeTab === 'quality' && (
        <div className="details-tab-content">
          {quality ? (
            <>
              <div className={`details-quality-score details-quality-${quality.level}`}>
                <div className="details-quality-label">Overall Data Quality Score</div>
                <div className="details-quality-value">{quality.overallScore}/100</div>
              </div>
              
              <div className="details-section">
                <h3 className="details-section-title">QUALITY METRICS</h3>
                {quality.metrics.map((metric, idx) => (
                  <div key={idx} className="details-quality-metric">
                    <div className="details-quality-metric-header">
                      <span className="details-quality-metric-name">{metric.name}</span>
                      <span className={`details-quality-badge details-quality-badge-${metric.status}`}>
                        {metric.status}
                      </span>
                    </div>
                    <div className="details-quality-metric-detail">{metric.detail}</div>
                    <div className="details-quality-bar">
                      <div
                        className={`details-quality-bar-fill details-quality-bar-${metric.status === 'pass' ? 'high' : metric.status === 'warning' ? 'medium' : 'low'}`}
                        style={{ width: `${metric.value}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
              
              {quality.issues.length > 0 && (
                <div className="details-section">
                  <h3 className="details-section-title">DATA QUALITY ISSUES ({quality.issues.length})</h3>
                  {quality.issues.map((issue, idx) => (
                    <div key={idx} className="details-quality-issue">
                      <div className="details-quality-issue-title">⚠️ {issue.title}</div>
                      <div className="details-quality-issue-detail">{issue.detail}</div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="details-section">
                <h3 className="details-section-title">CONFIDENCE ASSESSMENT</h3>
                <p className="details-confidence-text">{quality.confidence}</p>
              </div>
            </>
          ) : (
            <p className="details-empty-message">No quality metrics available for this node.</p>
          )}
        </div>
      )}
    </div>
  );
};
