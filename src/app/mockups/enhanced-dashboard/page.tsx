'use client';

import React from 'react';
import EnhancedGeoscientistDashboard from '@/components/mockups/EnhancedGeoscientistDashboard';
import { AppLayout, ContentLayout } from '@cloudscape-design/components';

// Sample well data for demonstration
const sampleWells = [
  { name: 'SAF-1', type: 'WELL#R', depth: '316-1572m', location: 'Safaniya', operator: 'Saudi Aramco', coordinates: [50.1234, 27.5678] as [number, number] },
  { name: '15/9-F', type: 'WELL#R', depth: 'Unknown', location: 'Volve', operator: 'Equinor', coordinates: [1.9234, 58.4321] as [number, number] },
  { name: '15/9-F', type: 'WELL#R', depth: 'Unknown', location: 'Volve', operator: 'Equinor', coordinates: [1.9234, 58.4321] as [number, number] },
  { name: 'LUL-5', type: 'WELL#R', depth: '945-5423m', location: 'Lula', operator: 'Petrobras', coordinates: [-39.8765, -23.1234] as [number, number] },
  { name: 'ALP-1', type: 'Document', depth: 'Unknown', location: 'Alpine', operator: 'ConocoPhillips', coordinates: [-150.7654, 70.3456] as [number, number] },
  { name: 'DEL-5', type: 'WELL#R', depth: '908-3735m', location: 'Delaware Basin', operator: 'Chevron', coordinates: [-103.5432, 31.8765] as [number, number] },
  { name: '15/9-F', type: 'WELL#R', depth: 'Unknown', location: 'Volve', operator: 'Equinor', coordinates: [1.9234, 58.4321] as [number, number] },
  { name: 'WIL-5', type: 'WELL#R', depth: '24-3240m', location: 'Williston Basin', operator: 'Continental Resources', coordinates: [-103.2345, 47.6543] as [number, number] },
  { name: 'BRE-1', type: 'WELL#R', depth: '899-2827m', location: 'Brent', operator: 'Shell', coordinates: [1.5432, 61.2345] as [number, number] },
  { name: 'MAR-3', type: 'WELL#R', depth: '500-3413m', location: 'Mars', operator: 'Shell', coordinates: [-88.3456, 28.7654] as [number, number] },
  { name: 'SAF-2', type: 'WELL#R', depth: '320-1580m', location: 'Safaniya', operator: 'Saudi Aramco', coordinates: [50.1345, 27.5789] as [number, number] },
  { name: 'LUL-6', type: 'WELL#R', depth: '950-5450m', location: 'Lula', operator: 'Petrobras', coordinates: [-39.8876, -23.1345] as [number, number] },
  { name: 'DEL-6', type: 'WELL#R', depth: '910-3740m', location: 'Delaware Basin', operator: 'Chevron', coordinates: [-103.5543, 31.8876] as [number, number] },
  { name: 'BRE-2', type: 'WELL#R', depth: '900-2830m', location: 'Brent', operator: 'Shell', coordinates: [1.5543, 61.2456] as [number, number] },
  { name: 'MAR-4', type: 'WELL#R', depth: '505-3420m', location: 'Mars', operator: 'Shell', coordinates: [-88.3567, 28.7765] as [number, number] }
];

export default function EnhancedDashboardMockupPage() {
  return (
    <AppLayout
      navigationHide
      toolsHide
      content={
        <ContentLayout
          header={
            <div style={{ padding: '20px 0' }}>
              <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px' }}>
                Enhanced Dashboard Mockup
              </h1>
              <p style={{ fontSize: '16px', color: '#666' }}>
                Comprehensive data visualization with donut charts, bar charts, Gantt charts, and detailed analytics
              </p>
            </div>
          }
        >
          <EnhancedGeoscientistDashboard
            wells={sampleWells}
            queryType="catalog"
            searchQuery="offshore Malaysia"
          />
        </ContentLayout>
      }
    />
  );
}
