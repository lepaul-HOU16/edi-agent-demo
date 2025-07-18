'use client';

import React, { useState } from 'react';
import SegmentedControl from '@cloudscape-design/components/segmented-control';
import Container from '@cloudscape-design/components/container';
import Box from '@cloudscape-design/components/box';

export default function TestPage() {
  const [selectedId, setSelectedId] = useState("seg-1");

  return (
    <div style={{ padding: '40px' }}>
      <h1>SegmentedControl Test Page</h1>
      <p>This page tests the SegmentedControl component with transparent background.</p>
      
      <div style={{ marginTop: '20px', maxWidth: '500px' }}>
        <SegmentedControl
          selectedId={selectedId}
          onChange={({ detail }) =>
            setSelectedId(detail.selectedId)
          }
          label="Segmented control with only icons"
          options={[
            {
              iconName: "settings",
              iconAlt: "Segment 1",
              id: "seg-1"
            },
            {
              iconName: "status-info",
              iconAlt: "Segment 2",
              id: "seg-2"
            }
          ]}
        />
      </div>

      <div style={{ marginTop: '40px' }}>
        <Container
          header="Selected Segment"
        >
          <Box>
            Currently selected: {selectedId}
          </Box>
        </Container>
      </div>
    </div>
  );
}
