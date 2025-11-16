import { createTheme, Theme } from '@mui/material/styles';

// Light theme (default)
const lightTheme = createTheme({
  typography: {
    fontFamily: 'var(--font-roboto)',
  },
  palette: {
    primary: {
      main: '#232F3E', // AWS dark blue/navy
      light: '#31465F',
      dark: '#1A2433',
    },
    secondary: {
      main: '#FF9900', // AWS orange
      light: '#FFAC31',
      dark: '#EC7211',
    },
    background: {
      default: '#F2F3F3', // Light gray background
      paper: '#FFFFFF', // White content areas
    },
    text: {
      primary: '#16191F', // Almost black for primary text
      secondary: '#545B64', // Medium gray for secondary text
    },
    error: {
      main: '#D13212', // AWS red for errors
    },
    info: {
      main: '#0073BB', // AWS blue for info
    },
    success: {
      main: '#1D8102', // AWS green for success
    },
    warning: {
      main: '#FF9900', // AWS orange for warnings
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 2,
          textTransform: 'none',
          fontWeight: 500,
          padding: '6px 16px',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          boxShadow: '0 1px 1px 0 rgba(0, 28, 36, 0.1), 0 1px 3px 1px rgba(0, 28, 36, 0.1)',
          border: '1px solid #eaeded',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#232F3E', // AWS dark blue/navy for header
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: '#F2F3F3',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 700,
          color: '#16191F',
        },
      },
    },
  },
});

// Dark theme
const darkTheme = createTheme({
  typography: {
    fontFamily: 'var(--font-roboto)',
  },
  palette: {
    mode: 'dark',
    primary: {
      main: '#0073BB', // Brighter blue for dark mode
      light: '#4D9ECF',
      dark: '#00508C',
    },
    secondary: {
      main: '#FF9900', // AWS orange
      light: '#FFAC31',
      dark: '#EC7211',
    },
    background: {
      default: '#121212', // Dark background
      paper: '#1E1E1E', // Slightly lighter dark for content areas
    },
    text: {
      primary: '#FFFFFF', // White for primary text
      secondary: '#B1B1B1', // Light gray for secondary text
    },
    error: {
      main: '#FF6B6B', // Brighter red for errors in dark mode
    },
    info: {
      main: '#4D9ECF', // Brighter blue for info in dark mode
    },
    success: {
      main: '#4CAF50', // Brighter green for success in dark mode
    },
    warning: {
      main: '#FFC107', // Brighter yellow for warnings in dark mode
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 2,
          textTransform: 'none',
          fontWeight: 500,
          padding: '6px 16px',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          boxShadow: '0 1px 1px 0 rgba(255, 255, 255, 0.1), 0 1px 3px 1px rgba(255, 255, 255, 0.1)',
          border: '1px solid #333333',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#1A1A1A', // Darker color for header in dark mode
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: '#2D2D2D',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 700,
          color: '#FFFFFF',
        },
      },
    },
  },
});

const themes = {
  light: lightTheme,
  dark: darkTheme
};

export default themes;
