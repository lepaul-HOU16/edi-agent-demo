/**
 * src/App.jsx
 * OSDU M25 Compliant Frontend Application
 * Updated to work with OSDU M25 specification and AWS Cognito authentication
 */

// External dependencies
import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Container from "@cloudscape-design/components/container";
import Grid from "@cloudscape-design/components/grid";
import Spinner from "@cloudscape-design/components/spinner";
import Toggle from "@cloudscape-design/components/toggle";
import { applyMode, Mode } from "@cloudscape-design/global-styles";
import maplibregl from 'maplibre-gl';

// Authentication
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import UserProfile from './components/auth/UserProfile';

// Internal components
import AppTopNavigation from './features/navigation/components/TopNavigation';
import Footer from './shared/components/Footer/Footer';
import Button from "./shared/components/Button/Button";
import TestAuth from './TestAuth';
import TestAPI from './TestAPI';
import DebugEnv from './DebugEnv';

// State management
import { useProjectActions } from './state/hooks/useProjects';
import { 
  useProjectsSelector, 
  selectSelectedProject, 
  selectSelectedInsights 
} from './state/selectors/projectSelectors';
import { 
  useUserSelector,
  selectIsAuthenticated 
} from './state/selectors/userSelectors';

// Lazy loaded components
const ResourceBrowser = React.lazy(() => import('./features/dataCatalog/components/ResourceBrowser'));

// Styles
import './App.scss';

/**
 * Main application content component (protected by authentication)
 */
function AppContent() {
  const [useDarkMode, setUseDarkMode] = useState(
    localStorage.getItem('edi-dark-mode') === 'true'
  );

  useEffect(() => {
    localStorage.setItem('edi-dark-mode', useDarkMode ? 'true' : 'false');
  }, [useDarkMode]);

  // Resource selection state (kept local as it's specific to this view)
  const [resourceSelection, setResourceSelection] = useState({
    resource: { uri: "" },
    validationError: undefined
  });
  
  // AI Prompt state (could be moved to context if needed across components)
  const [promptValue, setPromptValue] = useState("");
  
  // Get state and actions from optimized context hooks using selectors
  const projectActions = useProjectActions();
  const isAuthenticated = useUserSelector(selectIsAuthenticated);
  
  // Use selectors for specific parts of state to prevent unnecessary re-renders
  const selectedProject = useProjectsSelector(selectSelectedProject) || 
    { label: "Select a dataset", value: "" };
  
  const selectedInsights = useProjectsSelector(selectSelectedInsights) || 
    { label: "Select an insight canvas", value: "" };
  
  const apiKey = "v1.public.eyJqdGkiOiI3ZmFhNjA5My03YjViLTRkMWUtOTVjYy0zMGNjNTJjOWNhN2UifV-RQ-FEyeWw0B0MMAK0vSOw__xmYBpSzWklLahtq2qJvsfcGcHDzJ4lQC57EpmnJ64iMRqvcvgNlxNQKQ0UyupJTWYU7q6lyUOXjcHp7PxlJbjX-YZOoVoQX2Vh7nZsXD5bDg2-4pE-VrFGSKbOQquyTAcmFDE745j0P5o_5slbN3318JhYcftof3vW4wPy9mkQ9uUZImBW-C234P1NLW5NH5EGY_qHq7DxnC_x35p-S_tBYxrJpnrlkPfoWCBPuJCw3pAYO218j64bA-WY4BWcyU5jrzusfIa-ww6aiziBDKoATyJM09wZwoKq3pT3Xh7aeLQNAvM1sNNAFJiKkCk.ZWU0ZWIzMTktMWRhNi00Mzg0LTllMzYtNzlmMDU3MjRmYTkx";
  const mapName = "EdiTestMap";
  const region = "us-east-1";
  const style = "Standard";
  const colorScheme = useDarkMode ? "Dark" : "Light";
  
  // Fetch projects on component mount
  useEffect(() => {
    projectActions.fetchProjects();
  }, []);

  // Store map instance in a ref so it persists across renders
  const mapRef = React.useRef(null);

  useEffect(() => {
    if (!mapRef.current) {
      mapRef.current = new maplibregl.Map({
        container: "map",
        style: `https://maps.geo.${region}.amazonaws.com/v2/styles/${style}/descriptor?key=${apiKey}&color-scheme=${colorScheme}`,
        center: [3.151419, 56.441028],
        zoom: 4,
      });

      // Add scale control with metric units (kilometers)
      const scale = new maplibregl.ScaleControl({
        maxWidth: 200,
        unit: 'metric'
      });
      mapRef.current.addControl(scale, 'top-right');
      mapRef.current.addControl(new maplibregl.NavigationControl(), "top-left");
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update map style when colorScheme changes
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setStyle(`https://maps.geo.${region}.amazonaws.com/v2/styles/${style}/descriptor?key=${apiKey}&color-scheme=${colorScheme}`);
    }
  }, [colorScheme]);

  // Handle resource change from the ResourceBrowser - memoized to prevent recreation on each render
  const handleResourceChange = useCallback((resource, errorText) => {
    setResourceSelection({ 
      resource, 
      validationError: errorText 
    });
  }, []);
  
  // Handle project change - delegates to context action
  const handleProjectChange = useCallback((project) => {
    projectActions.selectProject(project.value);
  }, [projectActions]);
  
  // Handle Insights change - delegates to context action
  const handleInsightsChange = useCallback((lab) => {
    projectActions.selectInsights(lab.value);
  }, [projectActions]);
  
  // Apply Cloudscape dark/light mode when useDarkMode changes
  useEffect(() => {
    applyMode(useDarkMode ? Mode.Dark : Mode.Light);
  }, [useDarkMode]);

  return (
    <div className="App">
      <AppTopNavigation 
        useDarkMode={useDarkMode}
        setUseDarkMode={setUseDarkMode} 
      />
      
      {/* OSDU M25 Compliance Banner */}
      <div style={{
        backgroundColor: '#1976d2',
        color: 'white',
        padding: '12px 20px',
        textAlign: 'center',
        fontSize: '14px',
        fontWeight: '500',
        borderBottom: '2px solid #1565c0',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <span style={{ marginRight: '10px' }}>🏗️</span>
        <strong>OSDU M25 Compliant Platform</strong>
        <span style={{ marginLeft: '15px', opacity: '0.9' }}>
          • AWS Cognito Authentication • Schema Service ✅ • Entitlements Service ✅ • Legal Tagging Service ⏳
        </span>
      </div>
      
      {/* User Profile in top right */}
      <div style={{ 
        position: 'fixed', 
        top: '20px', 
        right: '20px', 
        zIndex: 1000 
      }}>
        <UserProfile compact={true} />
      </div>
      
      <div className='dark-mode-toggle'>
        <Toggle
          onChange={({ detail }) => setUseDarkMode(detail.checked)}
          checked={useDarkMode}
        />
      </div>
      <div className="content">
        
        {/* OSDU Integration Test Components - Show only in development */}
        {import.meta.env.DEV && (
          <>
            <DebugEnv />
            <TestAuth />
            <TestAPI />
          </>
        )}
        
        <div className="bottom-border">
          <Grid
            gridDefinition={[
              { colspan: 7, push: { xxs: 5 } },
              { colspan: 5, pull: { xxs: 7 } }
            ]}
          >
            <div className="right-col">
              <div className="file-browser">
                <Suspense fallback={<div className="loading-container"><Spinner size="large" /></div>}>
                  <ResourceBrowser onResourceChange={handleResourceChange} />
                </Suspense>
              </div>
              <div className="add-to-project">
                <Button variant="primary" useLibrary="cloudscape">Add to Project</Button>
              </div>
            </div>
            <div className='left-col'>
              <div className="preview-panel">
                <Container>
                  <h1>Data Collections - All Data</h1>
                  <div id="map" />
                </Container>
              </div>
            </div>
          </Grid>
        </div>
        <div className="main-content">
          <Grid
            gridDefinition={[
              { colspan: 7, push: { xxs: 5 } },
              { colspan: 5, pull: { xxs: 7 } }
            ]}
          >
            <div className="right-col">
              <div className="convo">
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus ac placerat lorem. Proin ut semper quam. Donec posuere augue nisl, ultricies feugiat velit faucibus in. Integer congue convallis tellus, eu ultricies lacus sollicitudin sed. Mauris ultricies viverra ex non iaculis. Curabitur vehicula et ligula sed vulputate. Integer pellentesque rhoncus commodo. Pellentesque malesuada, velit vitae varius pharetra, nunc risus feugiat tortor, nec gravida ante elit suscipit libero. Praesent at malesuada augue, id scelerisque mauris. Pellentesque volutpat purus molestie neque efficitur, in auctor ex sollicitudin.</p>

                <p>In mi lacus, egestas non rhoncus eget, rutrum in leo. Donec fermentum sapien tellus, sit amet lobortis enim vehicula ut. Sed vulputate odio sed nibh condimentum placerat. In a neque metus. Donec gravida, justo a ullamcorper pulvinar, felis ipsum varius tortor, quis consectetur sapien est ut massa. Suspendisse placerat lacinia quam ut blandit. Sed varius magna eu ipsum blandit hendrerit. Curabitur commodo augue eget nibh consequat volutpat. Pellentesque dignissim in nibh nec congue. Nulla in diam non mauris condimentum volutpat. Nunc consectetur at eros sed convallis. Etiam sit amet est posuere, vulputate erat eget, eleifend metus. Donec sed dictum turpis. Maecenas placerat in dui vel tempus. Phasellus maximus volutpat ex, vel gravida augue porttitor nec.</p>

                <p>Nulla nulla velit, mattis at tristique vehicula, posuere vel risus. Vivamus nisl ligula, posuere vitae fermentum eu, elementum eget erat. Donec dapibus, augue quis dapibus auctor, augue tellus venenatis purus, ut sollicitudin dui augue nec augue. Praesent a varius magna, vel posuere enim. Proin ac elementum lacus, sed condimentum massa. Duis laoreet libero condimentum metus feugiat, nec consectetur mi aliquam. Phasellus nec ultrices nunc, ac viverra quam. Sed dapibus porta nunc, vel pellentesque mi porttitor vel. Morbi sit amet dolor vel ante mattis sodales. Morbi vehicula lorem leo, vitae placerat erat maximus in. Aenean eget nisi nec eros eleifend venenatis. Ut sed orci id nibh pretium feugiat sed a ex. Etiam at arcu vitae sapien congue tincidunt. Proin diam quam, ullamcorper elementum enim nec, elementum tristique odio. Phasellus in leo maximus, volutpat neque nec, rhoncus sapien.</p>

                <p>Nullam non tellus at tortor pharetra fermentum. In non pharetra nisi. Suspendisse tincidunt hendrerit nibh id faucibus. In at quam ac diam venenatis mattis vitae at urna. Praesent feugiat mi est, non blandit velit scelerisque ac. Fusce porta vitae erat eget convallis. Proin et ligula finibus, sodales lacus non, congue nunc. Nulla mollis rhoncus posuere. Nulla dolor odio, vulputate ac odio ut, egestas pharetra tellus. Nunc id risus nulla. Morbi laoreet in lacus et porta. Fusce ultrices dictum aliquet.</p>

                <p>Aliquam fringilla lacinia orci, in tristique ante consequat vestibulum. In malesuada risus quis lectus rhoncus facilisis. Mauris at lorem mauris. Integer lobortis tincidunt ex, sed ultricies lorem tincidunt vel. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Praesent quis tellus lectus. Sed nec sagittis diam, at sagittis augue. Sed ipsum lacus, vestibulum vel tortor a, faucibus consectetur sapien. Mauris tortor lacus, porttitor et ante porta, aliquet varius dolor. Nunc dignissim velit nisl, at tempor felis sagittis a. Maecenas tincidunt, erat in dapibus fermentum, ligula nibh gravida lacus, a molestie nisi tellus eget nibh. Integer id gravida dui. Donec volutpat tellus vel lacus finibus, et ornare mi aliquet. Vestibulum auctor tristique erat. In turpis sem, mattis eget sapien sed, rhoncus semper ligula.</p>
              </div>
            </div>

            <div className='left-col'>
              
            </div>
          </Grid>
        </div>
      </div>
      <Footer 
        selectedProject={selectedProject}
        onProjectChange={handleProjectChange}
        selectedInsights={selectedInsights}
        onInsightsChange={handleInsightsChange}
        promptValue={promptValue}
        onPromptChange={setPromptValue}
      />
    </div>
  );
}

// Main App component with authentication wrapper
function App() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <AppContent />
      </ProtectedRoute>
    </AuthProvider>
  );
}

export default App;
