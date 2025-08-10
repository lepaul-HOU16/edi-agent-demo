import { expect } from 'chai';
import { describe, it, before } from 'mocha';
import * as fs from 'fs';
import * as path from 'path';

describe('Config Integration Tests', () => {
  let envContent: string;
  const envPath = path.join(__dirname, '../../.env.local');

  before(() => {
    // Read the actual .env.local file to verify it contains the working credentials
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }
  });

  describe('Environment File Integration', () => {
    it('should have .env.local file with working Cognito credentials', () => {
      expect(fs.existsSync(envPath)).to.be.true;
      expect(envContent).to.include('VITE_USER_POOL_ID=us-east-1_eVNfQH4nW');
      expect(envContent).to.include('VITE_USER_POOL_CLIENT_ID=6tfcegqsn1ug591ltbrjefna19');
      expect(envContent).to.include('VITE_COGNITO_AUTHORITY=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_eVNfQH4nW');
      expect(envContent).to.include('VITE_COGNITO_DOMAIN=https://osdu-dev-83633757.auth.us-east-1.amazoncognito.com');
    });

    it('should have callback and logout URIs configured', () => {
      expect(envContent).to.include('VITE_REDIRECT_URI=http://localhost:3000/callback');
      expect(envContent).to.include('VITE_LOGOUT_URI=http://localhost:3000/logout');
    });

    it('should have API endpoints configured', () => {
      expect(envContent).to.include('VITE_SCHEMA_API_URL=');
      expect(envContent).to.include('VITE_ENTITLEMENTS_API_URL=');
      expect(envContent).to.include('VITE_LEGAL_API_URL=');
    });
  });

  describe('Config Service Integration', () => {
    it('should load configuration without errors', () => {
      // This test verifies that the config service can be imported and loaded
      // without throwing validation errors
      let configLoadError: Error | null = null;
      
      try {
        const config = require('../../src/services/config.js').default;
        expect(config).to.be.an('object');
      } catch (error) {
        configLoadError = error as Error;
      }
      
      expect(configLoadError).to.be.null;
    });

    it('should validate the loaded configuration successfully', () => {
      const config = require('../../src/services/config.js').default;
      const { validateCognitoConfig } = require('../../src/services/config.js');
      
      const validation = validateCognitoConfig(config);
      
      expect(validation.isValid).to.be.true;
      expect(validation.errors).to.be.empty;
    });

    it('should have consistent configuration between defaults and environment', () => {
      const config = require('../../src/services/config.js').default;
      
      // Verify that the config service is using the working credentials
      // either from environment variables or as defaults
      expect(config.VITE_USER_POOL_ID).to.equal('us-east-1_eVNfQH4nW');
      expect(config.VITE_USER_POOL_CLIENT_ID).to.equal('6tfcegqsn1ug591ltbrjefna19');
      expect(config.VITE_COGNITO_AUTHORITY).to.equal('https://cognito-idp.us-east-1.amazonaws.com/us-east-1_eVNfQH4nW');
      expect(config.VITE_COGNITO_DOMAIN).to.equal('osdu-dev-83633757.auth.us-east-1.amazoncognito.com');
    });
  });

  describe('Configuration Format Validation', () => {
    it('should have properly formatted User Pool ID', () => {
      const config = require('../../src/services/config.js').default;
      const { validateUserPoolId } = require('../../src/services/config.js');
      
      expect(validateUserPoolId(config.VITE_USER_POOL_ID)).to.be.true;
    });

    it('should have properly formatted Client ID', () => {
      const config = require('../../src/services/config.js').default;
      const { validateClientId } = require('../../src/services/config.js');
      
      expect(validateClientId(config.VITE_USER_POOL_CLIENT_ID)).to.be.true;
    });

    it('should have properly formatted URLs', () => {
      const config = require('../../src/services/config.js').default;
      const { validateUrl } = require('../../src/services/config.js');
      
      expect(validateUrl(config.VITE_COGNITO_AUTHORITY)).to.be.true;
      expect(validateUrl(config.VITE_REDIRECT_URI)).to.be.true;
      expect(validateUrl(config.VITE_LOGOUT_URI)).to.be.true;
    });
  });

  describe('Requirements Verification', () => {
    it('should meet requirement 2.5: environment variables loaded without code changes', () => {
      // This test verifies that the system uses new environment values
      // without requiring code changes (requirement 2.5)
      const config = require('../../src/services/config.js').default;
      
      // The config should reflect the values from .env.local
      expect(config.VITE_USER_POOL_ID).to.equal('us-east-1_eVNfQH4nW');
      expect(config.VITE_USER_POOL_CLIENT_ID).to.equal('6tfcegqsn1ug591ltbrjefna19');
    });

    it('should meet requirement 2.6: clear error messages for missing variables', () => {
      // This test verifies that the system displays clear error messages
      // when environment variables are missing (requirement 2.6)
      const { validateCognitoConfig } = require('../../src/services/config.js');
      
      const emptyConfig = {
        VITE_USER_POOL_ID: '',
        VITE_USER_POOL_CLIENT_ID: '',
        VITE_AWS_REGION: '',
        VITE_COGNITO_AUTHORITY: '',
        VITE_COGNITO_DOMAIN: '',
        VITE_REDIRECT_URI: '',
        VITE_LOGOUT_URI: ''
      };
      
      const validation = validateCognitoConfig(emptyConfig);
      
      expect(validation.isValid).to.be.false;
      expect(validation.errors).to.be.an('array').that.is.not.empty;
      
      // Verify that error messages are clear and specific
      validation.errors.forEach(error => {
        expect(error).to.be.a('string').that.is.not.empty;
        expect(error).to.match(/^VITE_\w+/); // Should start with the variable name
      });
    });
  });
});