// Configuration for API services
// Updated to work with ServiceConfigManager for enhanced service discovery and health checking

/**
 * Validates that a User Pool ID follows the correct format
 * @param {string} userPoolId - The User Pool ID to validate
 * @returns {boolean} - True if valid format
 */
function validateUserPoolId(userPoolId) {
  const userPoolIdRegex = /^[a-z0-9-]+_[a-zA-Z0-9]+$/;
  return userPoolIdRegex.test(userPoolId);
}

/**
 * Validates that a Client ID follows the correct format
 * @param {string} clientId - The Client ID to validate
 * @returns {boolean} - True if valid format
 */
function validateClientId(clientId) {
  const clientIdRegex = /^[a-z0-9]+$/;
  return clientIdRegex.test(clientId) && clientId.length > 10;
}

/**
 * Validates that a URL is properly formatted
 * @param {string} url - The URL to validate
 * @returns {boolean} - True if valid URL
 */
function validateUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates required Cognito configuration parameters
 * @param {Object} config - Configuration object to validate
 * @returns {Object} - Validation result with isValid boolean and errors array
 */
function validateCognitoConfig(config) {
  const errors = [];
  
  // Validate User Pool ID
  if (!config.NEXT_PUBLIC_USER_POOL_ID) {
    errors.push('NEXT_PUBLIC_USER_POOL_ID is required');
  } else if (!validateUserPoolId(config.NEXT_PUBLIC_USER_POOL_ID)) {
    errors.push('NEXT_PUBLIC_USER_POOL_ID has invalid format. Expected format: region_poolId');
  }
  
  // Validate Client ID
  if (!config.NEXT_PUBLIC_USER_POOL_CLIENT_ID) {
    errors.push('NEXT_PUBLIC_USER_POOL_CLIENT_ID is required');
  } else if (!validateClientId(config.NEXT_PUBLIC_USER_POOL_CLIENT_ID)) {
    errors.push('NEXT_PUBLIC_USER_POOL_CLIENT_ID has invalid format');
  }
  
  // Validate AWS Region
  if (!config.NEXT_PUBLIC_AWS_REGION) {
    errors.push('NEXT_PUBLIC_AWS_REGION is required');
  }
  
  // Validate Cognito Authority URL
  if (!config.NEXT_PUBLIC_COGNITO_AUTHORITY) {
    errors.push('NEXT_PUBLIC_COGNITO_AUTHORITY is required');
  } else if (!validateUrl(config.NEXT_PUBLIC_COGNITO_AUTHORITY)) {
    errors.push('NEXT_PUBLIC_COGNITO_AUTHORITY must be a valid URL');
  }
  
  // Validate Cognito Domain
  if (!config.NEXT_PUBLIC_COGNITO_DOMAIN) {
    errors.push('NEXT_PUBLIC_COGNITO_DOMAIN is required');
  }
  
  // Validate Redirect URI
  if (!config.NEXT_PUBLIC_REDIRECT_URI) {
    errors.push('NEXT_PUBLIC_REDIRECT_URI is required');
  } else if (!validateUrl(config.NEXT_PUBLIC_REDIRECT_URI)) {
    errors.push('NEXT_PUBLIC_REDIRECT_URI must be a valid URL');
  }
  
  // Validate Logout URI
  if (!config.NEXT_PUBLIC_LOGOUT_URI) {
    errors.push('NEXT_PUBLIC_LOGOUT_URI is required');
  } else if (!validateUrl(config.NEXT_PUBLIC_LOGOUT_URI)) {
    errors.push('NEXT_PUBLIC_LOGOUT_URI must be a valid URL');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Import environment variables
const config = {
  // API Endpoints - Core OSDU Services
  NEXT_PUBLIC_SCHEMA_API_URL: process.env.NEXT_PUBLIC_SCHEMA_API_URL || "https://ytlsbswcdffatdnnm3c4jjslam.appsync-api.us-east-1.amazonaws.com/graphql",
  NEXT_PUBLIC_ENTITLEMENTS_API_URL: process.env.NEXT_PUBLIC_ENTITLEMENTS_API_URL || "https://cbvpqprfcne7rnbaq3e4ghakzi.appsync-api.us-east-1.amazonaws.com/graphql",
  NEXT_PUBLIC_LEGAL_API_URL: process.env.NEXT_PUBLIC_LEGAL_API_URL || "https://lpw54db5vvgrbodtvyfi4nytjq.appsync-api.us-east-1.amazonaws.com/graphql",
  NEXT_PUBLIC_SEARCH_API_URL: process.env.NEXT_PUBLIC_SEARCH_API_URL || "https://4m5cfzmhqvaj5les3hkopisoea.appsync-api.us-east-1.amazonaws.com/graphql",
  NEXT_PUBLIC_STORAGE_API_URL: process.env.NEXT_PUBLIC_STORAGE_API_URL || "https://c5ughcqhwzgrvncrwif7c22sjm.appsync-api.us-east-1.amazonaws.com/graphql",
  
  // Optional Extended Services
  NEXT_PUBLIC_AI_API_URL: process.env.NEXT_PUBLIC_AI_API_URL || "https://gskklt2pm5ae7iv2hx5y75ky5i.appsync-api.us-east-1.amazonaws.com/graphql",
  NEXT_PUBLIC_DATA_INGESTION_API_URL: process.env.NEXT_PUBLIC_DATA_INGESTION_API_URL || "https://sscjgohucfbtrd34amrfcliqju.appsync-api.us-east-1.amazonaws.com/graphql",
  NEXT_PUBLIC_SEISMIC_INGESTION_API_URL: process.env.NEXT_PUBLIC_SEISMIC_API_URL || "https://3qfprpuonnaqdd6q6knzt6dytq.appsync-api.us-east-1.amazonaws.com/graphql",
  
  // Service Discovery from Stack Outputs (for automatic endpoint detection)
  NEXT_PUBLIC_SCHEMA_STACK_OUTPUT: process.env.NEXT_PUBLIC_SCHEMA_STACK_OUTPUT,
  NEXT_PUBLIC_ENTITLEMENTS_STACK_OUTPUT: process.env.NEXT_PUBLIC_ENTITLEMENTS_STACK_OUTPUT,
  NEXT_PUBLIC_LEGAL_STACK_OUTPUT: process.env.NEXT_PUBLIC_LEGAL_STACK_OUTPUT,
  NEXT_PUBLIC_SEARCH_STACK_OUTPUT: process.env.NEXT_PUBLIC_SEARCH_STACK_OUTPUT,
  NEXT_PUBLIC_STORAGE_STACK_OUTPUT: process.env.NEXT_PUBLIC_STORAGE_STACK_OUTPUT,
  
  // AWS Configuration
  NEXT_PUBLIC_AWS_REGION: process.env.NEXT_PUBLIC_AWS_REGION || "us-east-1",
  NEXT_PUBLIC_USER_POOL_ID: process.env.NEXT_PUBLIC_USER_POOL_ID || "us-east-1_eVNfQH4nW",
  NEXT_PUBLIC_USER_POOL_CLIENT_ID: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID || "6tfcegqsn1ug591ltbrjefna19",
  NEXT_PUBLIC_IDENTITY_POOL_ID: process.env.NEXT_PUBLIC_IDENTITY_POOL_ID || "us-east-1:272f0ac6-6976-4a2a-bb8c-4d0cf64d246e",
  
  // Cognito Configuration
  NEXT_PUBLIC_COGNITO_AUTHORITY: process.env.NEXT_PUBLIC_COGNITO_AUTHORITY || "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_eVNfQH4nW",
  NEXT_PUBLIC_COGNITO_DOMAIN: process.env.NEXT_PUBLIC_COGNITO_DOMAIN?.replace('https://', '') || "osdu.auth.us-east-1.amazoncognito.com",
  NEXT_PUBLIC_REDIRECT_URI: process.env.NEXT_PUBLIC_REDIRECT_URI || "http://localhost:3000/callback",
  NEXT_PUBLIC_LOGOUT_URI: process.env.NEXT_PUBLIC_LOGOUT_URI || "http://localhost:3000/logout",
  
  // OSDU Configuration
  NEXT_PUBLIC_DEFAULT_DATA_PARTITION: process.env.NEXT_PUBLIC_DEFAULT_DATA_PARTITION || "osdu",
  
  // Development Mode
  NEXT_PUBLIC_NODE_ENV: process.env.NODE_ENV || "development"
};

// Validate configuration on load
const validation = validateCognitoConfig(config);
if (!validation.isValid) {
  console.error('Cognito configuration validation failed:', validation.errors);
  if (process.env.NODE_ENV === 'development') {
    console.warn('Configuration errors detected. Please check your .env.local file.');
  }
}

// Export configuration and validation utilities
export default config;
export { validateCognitoConfig, validateUserPoolId, validateClientId, validateUrl };
