/**
 * src/index-direct-signin.jsx
 * Entry point for the direct sign-in test page
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import DirectSignInTest from './DirectSignInTest.jsx';

// Styles
import './index.css';

// Using createRoot API for React 18
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <DirectSignInTest />
  </React.StrictMode>
);
