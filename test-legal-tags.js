#!/usr/bin/env node

/**
 * Test script for legal tag operations
 * Run with: node test-legal-tags.js
 */

const { OSDUApiService } = require('./src/services/osduApiService.js');

async function testLegalTagOperations() {
  console.log('🧪 Testing Legal Tag Operations...\n');

  try {
    // Initialize the API service
    const apiService = new OSDUApiService();
    
    // Mock endpoints for testing
    apiService.endpoints = {
      legal: 'https://ytlsbswcdffatdnnm3c4jjslam.appsync-api.us-east-1.amazonaws.com/graphql',
      schema: 'https://ytlsbswcdffatdnnm3c4jjslam.appsync-api.us-east-1.amazonaws.com/graphql'
    };

    console.log('1️⃣ Testing Legal Tags List Query...');
    
    try {
      const legalTags = await apiService.getLegalTags();
      console.log('✅ Legal tags retrieved successfully:', legalTags.length, 'tags');
    } catch (error) {
      console.log('❌ Legal tags list failed:', error.message);
      
      // Check if it's a query selection issue
      if (error.message.includes('Missing field argument id')) {
        console.log('🔍 Issue: Using wrong query (getLegalTag instead of listLegalTags)');
      }
      
      if (error.message.includes('Failed to fetch')) {
        console.log('🔍 Issue: Network connectivity or endpoint not accessible');
      }
    }

    console.log('\n2️⃣ Testing Legal Tag Creation...');
    
    const testLegalTag = {
      name: 'test-legal-tag-' + Date.now(),
      description: 'Test legal tag for validation',
      properties: {
        countryOfOrigin: ['US'],
        dataType: 'Public',
        securityClassification: 'Public',
        personalData: 'No',
        exportClassification: 'EAR99'
      }
    };

    try {
      const createdTag = await apiService.createLegalTag(testLegalTag);
      console.log('✅ Legal tag created successfully:', createdTag.id);
    } catch (error) {
      console.log('❌ Legal tag creation failed:', error.message);
      
      // Check if it's a properties validation issue
      if (error.message.includes('properties') && error.message.includes('invalid value')) {
        console.log('🔍 Issue: Properties field validation - check if AWSJSON expects string or object');
      }
    }

  } catch (error) {
    console.error('💥 Test setup failed:', error.message);
  }
}

// Run the test
testLegalTagOperations().catch(console.error);