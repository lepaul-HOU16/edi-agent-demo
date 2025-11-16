/**
 * Interactive Wind Rose Component
 * Uses Plotly for interactive polar bar chart visualization
 * Matches petro agent patterns with react-plotly.js
 */

import React from 'react';
// Dynamic import removed - use React.lazy if needed;

// Dynamic import for Plotly (matches petro agent pattern)
const Plot = React.lazy(() => import('react-plotly.js')) as any;
