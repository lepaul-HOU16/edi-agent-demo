'use client';

import React from 'react';
import EnhancedDataDashboardResponsive from '@/components/mockups/EnhancedDataDashboardResponsive';

// Sample well data for testing
const sampleWells = [
  {
    name: 'WELL-001',
    type: 'Production',
    depth: '3500m',
    location: 'Block A',
    operator: 'Operator A',
    coordinates: [106.9, 10.2] as [number, number]
  },
  {
    name: 'WELL-002',
    type: 'Production',
    depth: '3200m',
    location: 'Block A',
    operator: 'Operator A',
    coordinates: [106.95, 10.25] as [number, number]
  },
  {
    name: 'WELL-003',
    type: 'Exploration',
    depth: '4100m',
    location: 'Block B',
    operator: 'Operator B',
    coordinates: [107.1, 10.3] as [number, number]
  },
  {
    name: 'WELL-004',
    type: 'Production',
    depth: '3800m',
    location: 'Block A',
    operator: 'Operator A',
    coordinates: [106.85, 10.15] as [number, number]
  },
  {
    name: 'WELL-005',
    type: 'Production',
    depth: '3600m',
    location: 'Block C',
    operator: 'Operator C',
    coordinates: [107.2, 10.4] as [number, number]
  },
  {
    name: 'WELL-006',
    type: 'Exploration',
    depth: '4500m',
    location: 'Block B',
    operator: 'Operator B',
    coordinates: [107.15, 10.35] as [number, number]
  },
  {
    name: 'WELL-007',
    type: 'Production',
    depth: '3300m',
    location: 'Block A',
    operator: 'Operator A',
    coordinates: [106.92, 10.22] as [number, number]
  },
  {
    name: 'WELL-008',
    type: 'Production',
    depth: '3700m',
    location: 'Block C',
    operator: 'Operator C',
    coordinates: [107.25, 10.45] as [number, number]
  },
  {
    name: 'WELL-009',
    type: 'Exploration',
    depth: '4200m',
    location: 'Block B',
    operator: 'Operator B',
    coordinates: [107.05, 10.28] as [number, number]
  },
  {
    name: 'WELL-010',
    type: 'Production',
    depth: '3400m',
    location: 'Block A',
    operator: 'Operator A',
    coordinates: [106.88, 10.18] as [number, number]
  },
  {
    name: 'WELL-011',
    type: 'Production',
    depth: '3900m',
    location: 'Block C',
    operator: 'Operator C',
    coordinates: [107.3, 10.5] as [number, number]
  },
  {
    name: 'WELL-012',
    type: 'Exploration',
    depth: '4300m',
    location: 'Block B',
    operator: 'Operator B',
    coordinates: [107.12, 10.32] as [number, number]
  }
];

export default function ResponsiveDataDashboardMockup() {
  return (
    <div style={{ 
      display: 'flex',
      height: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      
      {/* Left side: Simulated map panel */}
      <div style={{
        flex: 1,
        backgroundColor: '#e0e0e0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#666',
        fontSize: '24px',
        fontWeight: 'bold'
      }}>
        MAP PANEL
        <br/>
        <span style={{ fontSize: '14px', fontWeight: 'normal' }}>
          (Simulated)
        </span>
      </div>

      {/* Right side: Narrow panel with responsive dashboard */}
      <div style={{
        width: '400px',
        backgroundColor: 'white',
        borderLeft: '1px solid #ccc',
        overflowY: 'auto',
        padding: '16px'
      }}>
        <div style={{
          marginBottom: '16px',
          padding: '12px',
          backgroundColor: '#e3f2fd',
          borderRadius: '8px',
          border: '1px solid #1976d2'
        }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#1976d2', marginBottom: '4px' }}>
            📐 MOCKUP: Narrow Panel View
          </div>
          <div style={{ fontSize: '10px', color: '#666' }}>
            This simulates the narrow analysis panel in the catalog page.
            Width: 400px (typical narrow panel width)
          </div>
        </div>

        <EnhancedDataDashboardResponsive
          wells={sampleWells}
          queryType="osdu-search"
          searchQuery="wells in Block A"
        />
      </div>

    </div>
  );
}
