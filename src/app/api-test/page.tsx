'use client';

import React from 'react';
import Box from '@cloudscape-design/components/box';
import Container from '@cloudscape-design/components/container';
import TestAPIComponent from '../../components/TestAPIComponent';

export default function ApiTestPage() {
  // No longer need to use ConfigureAmplify since we're using OIDC in the layout
  return (
    <div style={{ padding: '40px' }}>
      <h1>API Test Page</h1>
      <Container header="OSDU API Testing">
        <Box>
          {/* TestAPIComponent will be wrapped by AuthProvider in the layout */}
          <TestAPIComponent />
        </Box>
      </Container>
    </div>
  );
}
