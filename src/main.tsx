import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import './globals.css';
import './index.css';
import App from './App';
import themes from './theme';
import { applyMode, Mode } from '@cloudscape-design/global-styles';

// Theme-aware wrapper component
function ThemedApp() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Load saved mode on mount
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode !== null) {
      setDarkMode(savedMode === 'true');
    }

    // Listen for theme changes from AppLayout
    const handleThemeChange = () => {
      const savedMode = localStorage.getItem('darkMode');
      if (savedMode !== null) {
        setDarkMode(savedMode === 'true');
      }
    };

    window.addEventListener('themechange', handleThemeChange);
    return () => window.removeEventListener('themechange', handleThemeChange);
  }, []);

  useEffect(() => {
    // Apply Cloudscape mode
    applyMode(darkMode ? Mode.Dark : Mode.Light);
    
    // Ensure Cloudscape styles are applied to body
    document.body.classList.add('awsui');
    document.body.setAttribute('data-awsui-mode', darkMode ? 'dark' : 'light');
    document.body.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  return (
    <ThemeProvider theme={darkMode ? themes.dark : themes.light}>
      <CssBaseline />
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemedApp />
  </React.StrictMode>
);
