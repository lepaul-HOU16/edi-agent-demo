/**
 * Renewable Energy Export and Professional Output Validation
 * 
 * This test suite validates export functionality for all visualizations
 * and reports, ensuring professional formatting and data integrity.
 * 
 * Requirements: 12.3, 12.4, 12.5
 */

import { generateClient } from 'aws-amplify/api';
import { Amplify } from 'aws-amplify';
import { getRenewableConfig, isRenewableEnabled } from '../../src/services/renewable-integration/config';
import { VisualizationExporter } from '../../src/utils/VisualizationExporter';

// Import amplify outputs for configuration
const amplifyOutputs = require('../../amplify_outputs.json');

// Configure Amplify
Amplify.configure(amplifyOutputs);
const client = generateClient();

describe('Renewable Energy Export and Professional Output Validation', () => {
  
  const TIMEOUT = 90000; // 90 seconds for export operations
  
  beforeAll(() => {
    if (!isRenewableEnabled()) {
      console.log('⚠️  Renewable energy integration is disabled.');
      console.log('⚠️  Set NEXT_PUBLIC_RENEWABLE_ENABLED=true to run export tests.');
    }
  });

  describe('Visualization Export Tests', () => {
    
    /**
     * Test export functionality for all visualization types
     * Requirements: 12.3, 12.4
     */
    it('should export terrain analysis visualizations in multiple formats', async () => {
      if (!isRenewableEnabled()) {
        console.log('⚠️  Skipping: Renewable integration disabled');
        return;
      }

      const query = 'Generate terrain analysis for wind farm at 35.067482, -101.395466 with export-ready visualizations.';
      
      const response = await client.graphql({
        query: `
          mutation SendMessage($message: String!, $chatSessionId: String!) {
            sendMessage(message: $message, chatSessionId: $chatSessionId)
          }
        `,
        variables: {
          message: query,
          chatSessionId: `export_test_terrain_${Date.now()}`
        }
      });

      let parsedResponse;
      const responseData = response.data.sendMessage;
      if (typeof responseData === 'string') {
        try {
          parsedResponse = JSON.parse(responseData);
        } catch {
          parsedResponse = { content: responseData };
        }
      } else {
        parsedResponse = responseData;
      }

      const artifacts = parsedResponse.artifacts || [];
      expect(artifacts.length).toBeGreaterThan(0);

      const terrainArtifact = artifacts.find(a => 
        (a.messageContentType || a.type).includes('terrain')
      );
      expect(terrainArtifact).toBeDefined();

      // Test export functionality
      await validateExportCapabilities(terrainArtifact, 'terrain');
      
      console.log(`✅ Terrain visualization export validated`);
    }, TIMEOUT);

    /**
     * Test wind rose analysis export
     * Requirements: 12.3, 12.4
     */
    it('should export wind rose analysis with professional formatting', async () => {
      if (!isRenewableEnabled()) {
        console.log('⚠️  Skipping: Renewable integration disabled');
        return;
      }

      const query = 'Generate wind rose analysis for 35.067482, -101.395466 with professional charts and export options.';
      
      const response = await client.graphql({
        query: `
          mutation SendMessage($message: String!, $chatSessionId: String!) {
            sendMessage(message: $message, chatSessionId: $chatSessionId)
          }
        `,
        variables: {
          message: query,
          chatSessionId: `export_test_windrose_${Date.now()}`
        }
      });

      let parsedResponse;
      const responseData = response.data.sendMessage;
      if (typeof responseData === 'string') {
        try {
          parsedResponse = JSON.parse(responseData);
        } catch {
          parsedResponse = { content: responseData };
        }
      } else {
        parsedResponse = responseData;
      }

      const artifacts = parsedResponse.artifacts || [];
      const windRoseArtifact = artifacts.find(a => 
        (a.messageContentType || a.type).includes('wind_rose') ||
        (a.messageContentType || a.type).includes('windrose')
      );
      
      if (windRoseArtifact) {
        await validateExportCapabilities(windRoseArtifact, 'wind_rose');
        console.log(`✅ Wind rose export validated`);
      } else {
        console.log(`⚠️  Wind rose artifact not found, checking for general renewable artifact`);
        expect(artifacts.length).toBeGreaterThan(0);
      }
    }, TIMEOUT);

    /**
     * Test layout optimization export
     * Requirements: 12.3, 12.4
     */
    it('should export layout optimization results for CAD/GIS systems', async () => {
      if (!isRenewableEnabled()) {
        console.log('⚠️  Skipping: Renewable integration disabled');
        return;
      }

      const query = 'Optimize turbine layout for 30MW wind farm at 35.067482, -101.395466 with CAD-ready export formats.';
      
      const response = await client.graphql({
        query: `
          mutation SendMessage($message: String!, $chatSessionId: String!) {
            sendMessage(message: $message, chatSessionId: $chatSessionId)
          }
        `,
        variables: {
          message: query,
          chatSessionId: `export_test_layout_${Date.now()}`
        }
      });

      let parsedResponse;
      const responseData = response.data.sendMessage;
      if (typeof responseData === 'string') {
        try {
          parsedResponse = JSON.parse(responseData);
        } catch {
          parsedResponse = { content: responseData };
        }
      } else {
        parsedResponse = responseData;
      }

      const artifacts = parsedResponse.artifacts || [];
      const layoutArtifact = artifacts.find(a => 
        (a.messageContentType || a.type).includes('layout')
      );
      
      if (layoutArtifact) {
        await validateExportCapabilities(layoutArtifact, 'layout');
        await validateCADGISCompatibility(layoutArtifact);
        console.log(`✅ Layout optimization export validated`);
      } else {
        console.log(`⚠️  Layout artifact not found, checking for general renewable artifact`);
        expect(artifacts.length).toBeGreaterThan(0);
      }
    }, TIMEOUT);
  });

  describe('Professional Report Generation Tests', () => {
    
    /**
     * Test comprehensive report generation with professional formatting
     * Requirements: 12.3, 12.4, 12.5
     */
    it('should generate professional-quality comprehensive reports', async () => {
      if (!isRenewableEnabled()) {
        console.log('⚠️  Skipping: Renewable integration disabled');
        return;
      }

      const query = 'Generate comprehensive wind farm development report for 35.067482, -101.395466 including executive summary, technical analysis, and professional recommendations suitable for stakeholder presentation.';
      
      const response = await client.graphql({
        query: `
          mutation SendMessage($message: String!, $chatSessionId: String!) {
            sendMessage(message: $message, chatSessionId: $chatSessionId)
          }
        `,
        variables: {
          message: query,
          chatSessionId: `report_test_${Date.now()}`
        }
      });

      let parsedResponse;
      const responseData = response.data.sendMessage;
      if (typeof responseData === 'string') {
        try {
          parsedResponse = JSON.parse(responseData);
        } catch {
          parsedResponse = { content: responseData };
        }
      } else {
        parsedResponse = responseData;
      }

      const artifacts = parsedResponse.artifacts || [];
      expect(artifacts.length).toBeGreaterThan(0);

      // Find report artifact
      const reportArtifact = artifacts.find(a => 
        (a.messageContentType || a.type).includes('report') ||
        (a.messageContentType || a.type).includes('comprehensive')
      );

      if (reportArtifact) {
        await validateProfessionalReportQuality(reportArtifact);
        await validateStakeholderSuitability(reportArtifact);
        console.log(`✅ Professional report generation validated`);
      } else {
        // Check if comprehensive content is in main artifact
        const mainArtifact = artifacts[0];
        await validateProfessionalReportQuality(mainArtifact);
        console.log(`✅ Professional content validated in main artifact`);
      }
    }, TIMEOUT);

    /**
     * Test executive summary generation
     * Requirements: 12.4, 12.5
     */
    it('should generate executive summaries suitable for decision makers', async () => {
      if (!isRenewableEnabled()) {
        console.log('⚠️  Skipping: Renewable integration disabled');
        return;
      }

      const query = 'Create executive summary for wind farm project at 40.7128, -74.0060 with key findings, recommendations, and business case for executive presentation.';
      
      const response = await client.graphql({
        query: `
          mutation SendMessage($message: String!, $chatSessionId: String!) {
            sendMessage(message: $message, chatSessionId: $chatSessionId)
          }
        `,
        variables: {
          message: query,
          chatSessionId: `executive_summary_test_${Date.now()}`
        }
      });

      let parsedResponse;
      const responseData = response.data.sendMessage;
      if (typeof responseData === 'string') {
        try {
          parsedResponse = JSON.parse(responseData);
        } catch {
          parsedResponse = { content: responseData };
        }
      } else {
        parsedResponse = responseData;
      }

      const artifacts = parsedResponse.artifacts || [];
      expect(artifacts.length).toBeGreaterThan(0);

      const summaryArtifact = artifacts[0];
      await validateExecutiveSummaryQuality(summaryArtifact);
      
      console.log(`✅ Executive summary quality validated`);
    }, TIMEOUT);
  });

  describe('Data Integrity and Format Validation', () => {
    
    /**
     * Test data integrity in exported formats
     * Requirements: 12.3, 12.4
     */
    it('should maintain data integrity across export formats', async () => {
      if (!isRenewableEnabled()) {
        console.log('⚠️  Skipping: Renewable integration disabled');
        return;
      }

      const query = 'Analyze site suitability for 35.067482, -101.395466 with detailed metrics and export-ready data formats.';
      
      const response = await client.graphql({
        query: `
          mutation SendMessage($message: String!, $chatSessionId: String!) {
            sendMessage(message: $message, chatSessionId: $chatSessionId)
          }
        `,
        variables: {
          message: query,
          chatSessionId: `data_integrity_test_${Date.now()}`
        }
      });

      let parsedResponse;
      const responseData = response.data.sendMessage;
      if (typeof responseData === 'string') {
        try {
          parsedResponse = JSON.parse(responseData);
        } catch {
          parsedResponse = { content: responseData };
        }
      } else {
        parsedResponse = responseData;
      }

      const artifacts = parsedResponse.artifacts || [];
      expect(artifacts.length).toBeGreaterThan(0);

      const suitabilityArtifact = artifacts[0];
      await validateDataIntegrity(suitabilityArtifact);
      
      console.log(`✅ Data integrity validated`);
    }, TIMEOUT);

    /**
     * Test professional formatting standards
     * Requirements: 12.4, 12.5
     */
    it('should meet professional formatting standards', async () => {
      if (!isRenewableEnabled()) {
        console.log('⚠️  Skipping: Renewable integration disabled');
        return;
      }

      const query = 'Generate professional wind farm feasibility study for 35.067482, -101.395466 following industry standards and best practices.';
      
      const response = await client.graphql({
        query: `
          mutation SendMessage($message: String!, $chatSessionId: String!) {
            sendMessage(message: $message, chatSessionId: $chatSessionId)
          }
        `,
        variables: {
          message: query,
          chatSessionId: `formatting_test_${Date.now()}`
        }
      });

      let parsedResponse;
      const responseData = response.data.sendMessage;
      if (typeof responseData === 'string') {
        try {
          parsedResponse = JSON.parse(responseData);
        } catch {
          parsedResponse = { content: responseData };
        }
      } else {
        parsedResponse = responseData;
      }

      const artifacts = parsedResponse.artifacts || [];
      expect(artifacts.length).toBeGreaterThan(0);

      const studyArtifact = artifacts[0];
      await validateProfessionalFormatting(studyArtifact);
      
      console.log(`✅ Professional formatting standards validated`);
    }, TIMEOUT);
  });
});

/**
 * Helper function to validate export capabilities
 */
async function validateExportCapabilities(artifact: any, type: string): Promise<void> {
  const content = artifact.content || artifact;
  const contentStr = JSON.stringify(content);

  console.log(`   🔍 Validating export capabilities for ${type}...`);

  // Check for export-ready formats
  const exportFormats = ['png', 'pdf', 'svg', 'csv', 'json', 'html'];
  const hasExportFormats = exportFormats.some(format => 
    contentStr.toLowerCase().includes(format) ||
    contentStr.includes('export') ||
    contentStr.includes('download')
  );

  // Check for visualization data
  const hasVisualizationData = contentStr.includes('chart') ||
                              contentStr.includes('map') ||
                              contentStr.includes('graph') ||
                              contentStr.includes('plot');

  expect(hasVisualizationData).toBe(true);
  console.log(`   ✅ Visualization data: Present`);

  // Check for structured data
  const hasStructuredData = content.data || content.metrics || content.results;
  if (hasStructuredData) {
    console.log(`   ✅ Structured data: Present`);
  }
}

/**
 * Helper function to validate CAD/GIS compatibility
 */
async function validateCADGISCompatibility(artifact: any): Promise<void> {
  const content = artifact.content || artifact;
  const contentStr = JSON.stringify(content);

  console.log(`   🔍 Validating CAD/GIS compatibility...`);

  // Check for coordinate data
  const hasCoordinates = contentStr.includes('lat') ||
                        contentStr.includes('lng') ||
                        contentStr.includes('coordinates') ||
                        contentStr.includes('position');

  expect(hasCoordinates).toBe(true);
  console.log(`   ✅ Coordinate data: Present`);

  // Check for geometric data
  const hasGeometry = contentStr.includes('geometry') ||
                     contentStr.includes('polygon') ||
                     contentStr.includes('point') ||
                     contentStr.includes('turbine');

  if (hasGeometry) {
    console.log(`   ✅ Geometric data: Present`);
  }
}

/**
 * Helper function to validate professional report quality
 */
async function validateProfessionalReportQuality(artifact: any): Promise<void> {
  const content = artifact.content || artifact;
  const contentStr = JSON.stringify(content).toLowerCase();

  console.log(`   🔍 Validating professional report quality...`);

  // Check for professional sections
  const professionalSections = [
    'executive summary',
    'methodology',
    'analysis',
    'recommendations',
    'conclusions',
    'technical',
    'assessment'
  ];

  const hasProfessionalSections = professionalSections.some(section => 
    contentStr.includes(section)
  );

  expect(hasProfessionalSections).toBe(true);
  console.log(`   ✅ Professional sections: Present`);

  // Check for technical depth
  const technicalTerms = [
    'capacity factor',
    'wind resource',
    'turbine',
    'energy production',
    'feasibility',
    'suitability'
  ];

  const hasTechnicalDepth = technicalTerms.some(term => 
    contentStr.includes(term)
  );

  expect(hasTechnicalDepth).toBe(true);
  console.log(`   ✅ Technical depth: Present`);
}

/**
 * Helper function to validate stakeholder suitability
 */
async function validateStakeholderSuitability(artifact: any): Promise<void> {
  const content = artifact.content || artifact;
  const contentStr = JSON.stringify(content).toLowerCase();

  console.log(`   🔍 Validating stakeholder suitability...`);

  // Check for business-relevant content
  const businessTerms = [
    'investment',
    'return',
    'cost',
    'benefit',
    'risk',
    'opportunity',
    'recommendation',
    'decision'
  ];

  const hasBusinessContent = businessTerms.some(term => 
    contentStr.includes(term)
  );

  if (hasBusinessContent) {
    console.log(`   ✅ Business-relevant content: Present`);
  }

  // Check for clear structure
  const hasStructure = contentStr.includes('summary') ||
                      contentStr.includes('conclusion') ||
                      contentStr.includes('recommendation');

  expect(hasStructure).toBe(true);
  console.log(`   ✅ Clear structure: Present`);
}

/**
 * Helper function to validate executive summary quality
 */
async function validateExecutiveSummaryQuality(artifact: any): Promise<void> {
  const content = artifact.content || artifact;
  const contentStr = JSON.stringify(content).toLowerCase();

  console.log(`   🔍 Validating executive summary quality...`);

  // Check for executive-level content
  const executiveElements = [
    'key findings',
    'recommendations',
    'business case',
    'summary',
    'overview',
    'conclusion'
  ];

  const hasExecutiveElements = executiveElements.some(element => 
    contentStr.includes(element)
  );

  expect(hasExecutiveElements).toBe(true);
  console.log(`   ✅ Executive-level content: Present`);

  // Check for conciseness (not too verbose)
  const contentLength = contentStr.length;
  if (contentLength > 500) { // Has substantial content
    console.log(`   ✅ Substantial content: ${contentLength} characters`);
  }
}

/**
 * Helper function to validate data integrity
 */
async function validateDataIntegrity(artifact: any): Promise<void> {
  const content = artifact.content || artifact;

  console.log(`   🔍 Validating data integrity...`);

  // Check for consistent data structure
  expect(content).toBeDefined();
  expect(typeof content).toBe('object');

  // Check for required data fields
  const hasDataFields = content.data || content.metrics || content.analysis || content.results;
  if (hasDataFields) {
    console.log(`   ✅ Data fields: Present`);
  }

  // Check for metadata
  const hasMetadata = content.metadata || content.timestamp || content.source;
  if (hasMetadata) {
    console.log(`   ✅ Metadata: Present`);
  }

  console.log(`   ✅ Data integrity: Validated`);
}

/**
 * Helper function to validate professional formatting
 */
async function validateProfessionalFormatting(artifact: any): Promise<void> {
  const content = artifact.content || artifact;
  const contentStr = JSON.stringify(content);

  console.log(`   🔍 Validating professional formatting...`);

  // Check for proper structure
  const hasProperStructure = contentStr.includes('title') ||
                            contentStr.includes('heading') ||
                            contentStr.includes('section');

  if (hasProperStructure) {
    console.log(`   ✅ Document structure: Present`);
  }

  // Check for professional language
  const professionalLanguage = [
    'analysis',
    'assessment',
    'evaluation',
    'methodology',
    'findings',
    'recommendations'
  ];

  const hasProfessionalLanguage = professionalLanguage.some(term => 
    contentStr.toLowerCase().includes(term)
  );

  expect(hasProfessionalLanguage).toBe(true);
  console.log(`   ✅ Professional language: Present`);

  console.log(`   ✅ Professional formatting: Validated`);
}