'use client';

import React from 'react';
import { Container, Typography, Box } from '@mui/material';

// Simple test page without authentication to check if routing works
const LegalTagsTestPage: React.FC = () => {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1">
          Legal Tags Test Page
        </Typography>
        <Typography variant="body1" color="text.secondary">
          This is a test page to verify routing is working correctly.
        </Typography>
      </Box>
      
      <Box sx={{ p: 3, border: '1px solid #ccc', borderRadius: 2 }}>
        <Typography variant="h5" gutterBottom>
          ✅ Page Loading Test
        </Typography>
        <Typography variant="body1">
          If you can see this page, then:
        </Typography>
        <ul>
          <li>Next.js routing is working</li>
          <li>React components are rendering</li>
          <li>Material-UI is loading correctly</li>
          <li>TypeScript compilation is successful</li>
        </ul>
        
        <Typography variant="h6" sx={{ mt: 3 }}>
          Next Steps:
        </Typography>
        <Typography variant="body2">
          1. Try accessing the main legal tags page at <code>/legal-tags</code>
        </Typography>
        <Typography variant="body2">
          2. Check if authentication is required and working
        </Typography>
        <Typography variant="body2">
          3. Look for any console errors in the browser
        </Typography>
      </Box>
    </Container>
  );
};

export default LegalTagsTestPage;