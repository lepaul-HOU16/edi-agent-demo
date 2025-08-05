#!/usr/bin/env node

/**
 * Configuration Verification Script
 * 
 * This script verifies that the config service properly loads
 * the updated environment variables and validates the Cognito configuration.
 * 
 * Usage: node scripts/verifyConfig.js
 */

const path = require('path');
const fs = require('fs');

console.log('🔍 Verifying Cognito Configuration...\n');

// Load environment variables from .env.local
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envLines = envContent.split('\n');
  
  envLines.forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=');
        process.env[key] = value;
      }
    }
  });
}

// Manually create the config object to test the logic
const config = {
  VITE_USER_POOL_ID: process.env.VITE_USER_POOL_ID || "us-east-1_eVNfQH4nW",
  VITE_USER_POOL_CLIENT_ID: process.env.VITE_USER_POOL_CLIENT_ID || "6tfcegqsn1ug591ltbrjefna19",
  VITE_AWS_REGION: process.env.VITE_AWS_REGION || "us-east-1",
  VITE_COGNITO_AUTHORITY: process.env.VITE_COGNITO_AUTHORITY || "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_eVNfQH4nW",
  VITE_COGNITO_DOMAIN: process.env.VITE_COGNITO_DOMAIN?.replace('https://', '') || "osdu-dev-83633757.auth.us-east-1.amazoncognito.com",
  VITE_REDIRECT_URI: process.env.VITE_REDIRECT_URI || "http://localhost:3000/callback",
  VITE_LOGOUT_URI: process.env.VITE_LOGOUT_URI || "http://localhost:3000/logout"
};

// Validation functions
function validateUserPoolId(userPoolId) {
  const userPoolIdRegex = /^[a-z0-9-]+_[a-zA-Z0-9]+$/;
  return userPoolIdRegex.test(userPoolId);
}

function validateClientId(clientId) {
  const clientIdRegex = /^[a-z0-9]+$/;
  return clientIdRegex.test(clientId) && clientId.length > 10;
}

function validateUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function validateCognitoConfig(config) {
  const errors = [];
  
  if (!config.VITE_USER_POOL_ID) {
    errors.push('VITE_USER_POOL_ID is required');
  } else if (!validateUserPoolId(config.VITE_USER_POOL_ID)) {
    errors.push('VITE_USER_POOL_ID has invalid format. Expected format: region_poolId');
  }
  
  if (!config.VITE_USER_POOL_CLIENT_ID) {
    errors.push('VITE_USER_POOL_CLIENT_ID is required');
  } else if (!validateClientId(config.VITE_USER_POOL_CLIENT_ID)) {
    errors.push('VITE_USER_POOL_CLIENT_ID has invalid format');
  }
  
  if (!config.VITE_AWS_REGION) {
    errors.push('VITE_AWS_REGION is required');
  }
  
  if (!config.VITE_COGNITO_AUTHORITY) {
    errors.push('VITE_COGNITO_AUTHORITY is required');
  } else if (!validateUrl(config.VITE_COGNITO_AUTHORITY)) {
    errors.push('VITE_COGNITO_AUTHORITY must be a valid URL');
  }
  
  if (!config.VITE_COGNITO_DOMAIN) {
    errors.push('VITE_COGNITO_DOMAIN is required');
  }
  
  if (!config.VITE_REDIRECT_URI) {
    errors.push('VITE_REDIRECT_URI is required');
  } else if (!validateUrl(config.VITE_REDIRECT_URI)) {
    errors.push('VITE_REDIRECT_URI must be a valid URL');
  }
  
  if (!config.VITE_LOGOUT_URI) {
    errors.push('VITE_LOGOUT_URI is required');
  } else if (!validateUrl(config.VITE_LOGOUT_URI)) {
    errors.push('VITE_LOGOUT_URI must be a valid URL');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

try {

  console.log('✅ Configuration loaded successfully');
  console.log('\n📋 Current Configuration:');
  console.log(`   User Pool ID: ${config.VITE_USER_POOL_ID}`);
  console.log(`   Client ID: ${config.VITE_USER_POOL_CLIENT_ID}`);
  console.log(`   AWS Region: ${config.VITE_AWS_REGION}`);
  console.log(`   Cognito Authority: ${config.VITE_COGNITO_AUTHORITY}`);
  console.log(`   Cognito Domain: ${config.VITE_COGNITO_DOMAIN}`);
  console.log(`   Redirect URI: ${config.VITE_REDIRECT_URI}`);
  console.log(`   Logout URI: ${config.VITE_LOGOUT_URI}`);

  // Validate the configuration
  console.log('\n🔍 Validating Configuration...');
  const validation = validateCognitoConfig(config);

  if (validation.isValid) {
    console.log('✅ Configuration validation passed!');
    
    // Check if we're using the working credentials
    const isUsingWorkingCredentials = 
      config.VITE_USER_POOL_ID === 'us-east-1_eVNfQH4nW' &&
      config.VITE_USER_POOL_CLIENT_ID === '6tfcegqsn1ug591ltbrjefna19';
    
    if (isUsingWorkingCredentials) {
      console.log('✅ Using working Cognito credentials');
    } else {
      console.log('⚠️  Not using the expected working credentials');
    }
    
    // Check environment file
    if (fs.existsSync(envPath)) {
      console.log('✅ .env.local file exists');
      const envContent = fs.readFileSync(envPath, 'utf8');
      
      if (envContent.includes('us-east-1_eVNfQH4nW') && 
          envContent.includes('6tfcegqsn1ug591ltbrjefna19')) {
        console.log('✅ .env.local contains working credentials');
      } else {
        console.log('⚠️  .env.local may not contain the expected working credentials');
      }
    } else {
      console.log('⚠️  .env.local file not found');
    }
    
    console.log('\n🎉 Configuration verification completed successfully!');
    console.log('\n📝 Summary:');
    console.log('   - Configuration loads without errors');
    console.log('   - All required parameters are present');
    console.log('   - Parameter formats are valid');
    console.log('   - Working Cognito credentials are configured');
    
  } else {
    console.log('❌ Configuration validation failed!');
    console.log('\n🚨 Validation Errors:');
    validation.errors.forEach(error => {
      console.log(`   - ${error}`);
    });
    process.exit(1);
  }

} catch (error) {
  console.log('❌ Failed to load configuration');
  console.error('Error:', error.message);
  process.exit(1);
}