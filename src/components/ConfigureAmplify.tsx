'use client';
import { Amplify } from 'aws-amplify';
import { useEffect, useState } from 'react';

// Enhanced function to safely load outputs with validation
const loadAndValidateOutputs = () => {
  try {
    const outputs = require('@/../amplify_outputs.json');
    
    // Validate required configuration sections
    if (!outputs) {
      throw new Error('Outputs file is empty or invalid');
    }
    
    if (!outputs.auth) {
      throw new Error('Auth configuration missing');
    }
    
    if (!outputs.data) {
      throw new Error('Data configuration missing');
    }
    
    if (!outputs.data.url) {
      throw new Error('GraphQL endpoint URL missing');
    }
    
    console.log('✅ Amplify outputs loaded and validated successfully');
    console.log('🔗 GraphQL endpoint:', outputs.data.url);
    console.log('🌍 AWS region:', outputs.auth.aws_region);
    console.log('👥 User pool:', outputs.auth.user_pool_id);
    
    return outputs;
  } catch (error) {
    console.error('❌ Failed to load amplify_outputs.json:', error);
    return null;
  }
};

// Enhanced configuration function with retry logic
const configureAmplifyWithRetry = (outputs: any, maxRetries = 3) => {
  let attempts = 0;
  
  const attemptConfiguration = () => {
    attempts++;
    
    try {
      console.log(`🔄 Attempting Amplify configuration (attempt ${attempts}/${maxRetries})`);
      
      Amplify.configure(outputs, { 
        ssr: true
      });
      
      console.log('✅ Amplify configured successfully');
      return true;
    } catch (error) {
      console.error(`❌ Amplify configuration attempt ${attempts} failed:`, error);
      
      if (attempts < maxRetries) {
        console.log(`🔄 Retrying in 1 second...`);
        setTimeout(() => attemptConfiguration(), 1000);
      } else {
        console.error('💥 All Amplify configuration attempts failed');
        return false;
      }
    }
  };
  
  return attemptConfiguration();
};

// Configuration status tracking
let isConfigured = false;
let configurationPromise: Promise<boolean> | null = null;

// Initialize configuration immediately
const outputs = loadAndValidateOutputs();
if (outputs) {
  configurationPromise = Promise.resolve(configureAmplifyWithRetry(outputs));
  configurationPromise.then(success => {
    isConfigured = success;
    if (success) {
      console.log('🎉 Amplify initialization complete and ready');
    }
  });
} else {
  console.error('⚠️ Skipping Amplify configuration - outputs file not found or invalid');
  configurationPromise = Promise.resolve(false);
}

// Export configuration status for other components
export const getAmplifyConfigurationStatus = () => ({
  isConfigured,
  configurationPromise
});

// Enhanced ConfigureAmplify component with status monitoring
const ConfigureAmplify = () => {
  const [configStatus, setConfigStatus] = useState<{
    loading: boolean;
    configured: boolean;
    error: string | null;
  }>({
    loading: true,
    configured: false,
    error: null
  });

  useEffect(() => {
    const checkConfiguration = async () => {
      try {
        if (configurationPromise) {
          const success = await configurationPromise;
          setConfigStatus({
            loading: false,
            configured: success,
            error: success ? null : 'Configuration failed'
          });
        } else {
          setConfigStatus({
            loading: false,
            configured: false,
            error: 'No configuration promise available'
          });
        }
      } catch (error) {
        console.error('Configuration check failed:', error);
        setConfigStatus({
          loading: false,
          configured: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    };

    checkConfiguration();
  }, []);

  // Add global error boundary for Amplify operations
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason?.toString().includes('Amplify')) {
        console.error('🚨 Unhandled Amplify error:', event.reason);
        // Attempt to reconfigure if needed
        if (!isConfigured && outputs) {
          console.log('🔄 Attempting to reconfigure Amplify after error...');
          configureAmplifyWithRetry(outputs);
        }
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  }, []);

  // Development mode status display
  if (process.env.NODE_ENV === 'development') {
    return (
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        right: 0, 
        background: configStatus.configured ? '#4CAF50' : configStatus.error ? '#f44336' : '#ff9800',
        color: 'white',
        padding: '4px 8px',
        fontSize: '12px',
        zIndex: 9999,
        borderRadius: '0 0 0 4px'
      }}>
        Amplify: {configStatus.loading ? '⏳' : configStatus.configured ? '✅' : '❌'}
        {configStatus.error && ` (${configStatus.error})`}
      </div>
    );
  }

  return null;
};

export default ConfigureAmplify;
