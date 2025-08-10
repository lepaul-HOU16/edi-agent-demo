// Utility to test Amplify configuration
import { Amplify } from 'aws-amplify';
import { generateClient } from "aws-amplify/data";
import { getErrorMessage, logError } from './errorHandling';

export const testAmplifyConfiguration = () => {
  try {
    const config = Amplify.getConfig();
    console.log('Current Amplify configuration:', config);
    
    // Check if data configuration exists (new Amplify v6 structure)
    if (config.data?.url) {
      console.log('✅ GraphQL API configuration found');
      return true;
    } else {
      console.error('❌ GraphQL API configuration missing');
      console.log('Available config keys:', Object.keys(config));
      return false;
    }
  } catch (error) {
    logError('❌ Error getting Amplify configuration', error);
    return false;
  }
};

export const testGenerateClient = () => {
  try {
    // Try to actually create a client to test if generateClient works
    const client = generateClient();
    console.log('✅ generateClient() test successful');
    return true;
  } catch (error) {
    console.log('❌ generateClient() test failed:', getErrorMessage(error));
    return false;
  }
};

export const waitForAmplifyConfiguration = (maxWaitTime = 10000) => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const checkConfig = () => {
      // Check global ready flag first
      if (typeof window !== 'undefined' && window.__AMPLIFY_READY__) {
        console.log('✅ Amplify ready flag detected');
        resolve(true);
        return;
      }
      
      // Fallback: check basic config
      if (!testAmplifyConfiguration()) {
        if (Date.now() - startTime > maxWaitTime) {
          reject(new Error('Amplify configuration timeout - basic config missing'));
        } else {
          setTimeout(checkConfig, 100);
        }
        return;
      }
      
      // Then test if generateClient actually works
      if (testGenerateClient()) {
        console.log('✅ Amplify fully ready for generateClient()');
        if (typeof window !== 'undefined') {
          window.__AMPLIFY_READY__ = true;
        }
        resolve(true);
      } else if (Date.now() - startTime > maxWaitTime) {
        reject(new Error('Amplify configuration timeout - generateClient not ready'));
      } else {
        setTimeout(checkConfig, 100);
      }
    };
    
    checkConfig();
  });
};

export const safeGenerateClient = async () => {
  // Wait for Amplify to be ready
  await waitForAmplifyConfiguration();
  
  // Add a small delay to ensure everything is settled
  await new Promise(resolve => setTimeout(resolve, 100));
  
  try {
    const client = generateClient();
    console.log('✅ Safe generateClient successful');
    return client;
  } catch (error) {
    logError('❌ Safe generateClient failed', error);
    throw error;
  }
};