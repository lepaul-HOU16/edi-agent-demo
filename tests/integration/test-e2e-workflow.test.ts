/**
 * End-to-End Integration Test for Renewable Project Persistence
 * 
 * Tests the complete workflow:
 * - Terrain analysis → Layout optimization → Wake simulation → Report generation
 * - Project name generation from location
 * - Session context persistence across operations
 * - Auto-loading of previous results
 * 
 * This test validates that all components work together correctly
 * and that project data flows through the entire system.
 */

import { ProjectStore, ProjectData } from '../../amplify/functions/shared/projectStore';
import { ProjectNameGenerator } from '../../amplify/functions/shared/projectNameGenerator';
import { SessionContextManager, SessionContext } from '../../amplify/functions/shared/sessionContextManager';
import { ProjectResolver } from '../../amplify/functions/shared/projectResolver';

// Mock AWS SDK clients
jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/lib-dynamodb');
jest.mock('@aws-sdk/client-location');

// Import mocked clients
import { S3Client, GetObjectCommand, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { LocationClient, SearchPlaceIndexForPositionCommand } from '@aws-sdk/client-location';
import { Readable } from 'stream';

describe('End-to-End Workflow Integration Test', () => {
  let projectStore: ProjectStore;
  let nameGenerator: ProjectNameGenerator;
  let sessionManager: SessionContextManager;
  let projectResolver: ProjectResolver;
  
  const testBucketName = 'test-renewable-bucket';
  const testTableName = 'TestSessionContextTable';
  const testPlaceIndex = 'TestPlaceIndex';
  const testSessionId = 'test-session-123';
  const testUserId = 'test-user-456';

  // Mock implementations
  let mockS3Send: jest.Mock;
  let mockDynamoSend: jest.Mock;
  let mockLocationSend: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup S3 mock
    mockS3Send = jest.fn();
    (S3Client as jest.Mock).mockImplementation(() => ({
      send: mockS3Send
    }));

    // Setup DynamoDB mock
    mockDynamoSend = jest.fn();
    (DynamoDBDocumentClient as any).from = jest.fn(() => ({
      send: mockDynamoSend
    }));

    // Setup Location mock
    mockLocationSend = jest.fn();
    (LocationClient as jest.Mock).mockImplementation(() => ({
      send: mockLocationSend
    }));

    // Initialize components
    projectStore = new ProjectStore(testBucketName);
    nameGenerator = new ProjectNameGenerator(projectStore, testPlaceIndex);
    sessionManager = new SessionContextManager(testTableName);
    projectResolver = new ProjectResolver(projectStore);

    // Clear caches
    projectStore.clearCache();
    nameGenerator.clearCache();
    sessionManager.clearCache();
    projectResolver.clearCache();
  });

  describe('Complete Workflow: Terrain → Layout → Simulation → Report', () => {
    it('should complete full workflow with project persistence', async () => {
      const coordinates = { lat: 35.067482, lon: -101.395466 };
      const userQuery = 'analyze terrain in West Texas';

      // ===== STEP 1: Terrain Analysis =====
      console.log('\n===== STEP 1: Terrain Analysis =====');

      // Mock Location Service for name generation
      locationMock.on(SearchPlaceIndexForPositionCommand).resolves({
        Results: [{
          Place: {
            Municipality: 'Amarillo',
            Region: 'TX'
          }
        }]
      });

      // Mock S3 for project list (empty initially)
      s3Mock.on(ListObjectsV2Command).resolves({ Contents: [] });

      // Generate project name
      const projectName = await nameGenerator.generateFromQuery(userQuery, coordinates);
      console.log(`Generated project name: ${projectName}`);
      expect(projectName).toContain('west-texas');

      // Mock DynamoDB for session context (new session)
      dynamoMock.on(GetCommand).resolves({});
      dynamoMock.on(PutCommand).resolves({});
      dynamoMock.on(UpdateCommand).resolves({
        Attributes: {
          session_id: testSessionId,
          user_id: testUserId,
          active_project: projectName,
          project_history: [projectName],
          last_updated: new Date().toISOString()
        }
      });

      // Set active project in session
      await sessionManager.setActiveProject(testSessionId, projectName);
      console.log(`Set active project: ${projectName}`);

      // Mock S3 for project save (terrain results)
      s3Mock.on(GetObjectCommand).rejects({ name: 'NoSuchKey' }); // Project doesn't exist yet
      s3Mock.on(PutObjectCommand).resolves({});

      // Save terrain results
      const terrainResults = {
        features: [
          { type: 'road', geometry: {}, properties: {} },
          { type: 'building', geometry: {}, properties: {} }
        ],
        suitability_score: 85,
        constraints: ['protected_area']
      };

      await projectStore.save(projectName, {
        project_id: `proj-${Date.now()}`,
        project_name: projectName,
        coordinates,
        terrain_results: terrainResults
      });
      console.log('Saved terrain results');

      // Verify terrain results saved
      const projectAfterTerrain = await projectStore.load(projectName);
      expect(projectAfterTerrain).toBeDefined();
      expect(projectAfterTerrain?.terrain_results).toEqual(terrainResults);
      expect(projectAfterTerrain?.coordinates).toEqual(coordinates);
      console.log('✓ Terrain analysis complete');

      // ===== STEP 2: Layout Optimization =====
      console.log('\n===== STEP 2: Layout Optimization =====');

      // User query: "optimize layout" (no project name - should use active project)
      const layoutQuery = 'optimize layout';
      
      // Resolve project (should use active project from session)
      const sessionContext = await sessionManager.getContext(testSessionId);
      const resolvedProject = await projectResolver.resolve(layoutQuery, sessionContext);
      console.log(`Resolved project: ${resolvedProject.projectName} (confidence: ${resolvedProject.confidence})`);
      
      expect(resolvedProject.projectName).toBe(projectName);
      expect(resolvedProject.confidence).toBe('active');

      // Load project data (should have terrain results)
      const projectBeforeLayout = await projectStore.load(projectName);
      expect(projectBeforeLayout?.terrain_results).toBeDefined();
      expect(projectBeforeLayout?.coordinates).toEqual(coordinates);
      console.log('Loaded project with terrain results');

      // Save layout results (merge with existing data)
      const layoutResults = {
        turbines: [
          { id: 1, x: 100, y: 200, capacity_mw: 2.5 },
          { id: 2, x: 300, y: 400, capacity_mw: 2.5 }
        ],
        total_capacity_mw: 5.0,
        turbine_count: 2
      };

      await projectStore.save(projectName, {
        layout_results: layoutResults
      });
      console.log('Saved layout results');

      // Verify layout results merged with terrain results
      const projectAfterLayout = await projectStore.load(projectName);
      expect(projectAfterLayout?.terrain_results).toEqual(terrainResults); // Still there
      expect(projectAfterLayout?.layout_results).toEqual(layoutResults); // Added
      expect(projectAfterLayout?.coordinates).toEqual(coordinates); // Still there
      console.log('✓ Layout optimization complete');

      // ===== STEP 3: Wake Simulation =====
      console.log('\n===== STEP 3: Wake Simulation =====');

      // User query: "run wake simulation" (no project name - should use active project)
      const simulationQuery = 'run wake simulation';
      
      // Resolve project
      const resolvedSimProject = await projectResolver.resolve(simulationQuery, sessionContext);
      console.log(`Resolved project: ${resolvedSimProject.projectName}`);
      expect(resolvedSimProject.projectName).toBe(projectName);

      // Load project data (should have terrain and layout results)
      const projectBeforeSimulation = await projectStore.load(projectName);
      expect(projectBeforeSimulation?.terrain_results).toBeDefined();
      expect(projectBeforeSimulation?.layout_results).toBeDefined();
      expect(projectBeforeSimulation?.coordinates).toEqual(coordinates);
      console.log('Loaded project with terrain and layout results');

      // Save simulation results
      const simulationResults = {
        annual_energy_gwh: 15.5,
        capacity_factor: 0.35,
        wake_loss_percent: 5.2,
        turbine_performance: [
          { turbine_id: 1, aep_gwh: 7.8 },
          { turbine_id: 2, aep_gwh: 7.7 }
        ]
      };

      await projectStore.save(projectName, {
        simulation_results: simulationResults,
        metadata: {
          turbine_count: 2,
          total_capacity_mw: 5.0,
          annual_energy_gwh: 15.5
        }
      });
      console.log('Saved simulation results');

      // Verify simulation results merged with previous data
      const projectAfterSimulation = await projectStore.load(projectName);
      expect(projectAfterSimulation?.terrain_results).toEqual(terrainResults); // Still there
      expect(projectAfterSimulation?.layout_results).toEqual(layoutResults); // Still there
      expect(projectAfterSimulation?.simulation_results).toEqual(simulationResults); // Added
      expect(projectAfterSimulation?.metadata).toBeDefined();
      console.log('✓ Wake simulation complete');

      // ===== STEP 4: Report Generation =====
      console.log('\n===== STEP 4: Report Generation =====');

      // User query: "generate report" (no project name - should use active project)
      const reportQuery = 'generate report';
      
      // Resolve project
      const resolvedReportProject = await projectResolver.resolve(reportQuery, sessionContext);
      console.log(`Resolved project: ${resolvedReportProject.projectName}`);
      expect(resolvedReportProject.projectName).toBe(projectName);

      // Load project data (should have all previous results)
      const projectBeforeReport = await projectStore.load(projectName);
      expect(projectBeforeReport?.terrain_results).toBeDefined();
      expect(projectBeforeReport?.layout_results).toBeDefined();
      expect(projectBeforeReport?.simulation_results).toBeDefined();
      console.log('Loaded project with all analysis results');

      // Save report results
      const reportResults = {
        report_url: `s3://${testBucketName}/renewable/projects/${projectName}/reports/report.pdf`,
        generated_at: new Date().toISOString()
      };

      await projectStore.save(projectName, {
        report_results: reportResults
      });
      console.log('Saved report results');

      // Verify complete project data
      const finalProject = await projectStore.load(projectName);
      expect(finalProject?.terrain_results).toEqual(terrainResults);
      expect(finalProject?.layout_results).toEqual(layoutResults);
      expect(finalProject?.simulation_results).toEqual(simulationResults);
      expect(finalProject?.report_results).toEqual(reportResults);
      expect(finalProject?.coordinates).toEqual(coordinates);
      expect(finalProject?.metadata).toBeDefined();
      console.log('✓ Report generation complete');

      // ===== VERIFICATION =====
      console.log('\n===== VERIFICATION =====');

      // Verify session context
      const finalSessionContext = await sessionManager.getContext(testSessionId);
      expect(finalSessionContext.active_project).toBe(projectName);
      expect(finalSessionContext.project_history).toContain(projectName);
      console.log(`✓ Session context maintained: active project = ${finalSessionContext.active_project}`);

      // Verify project can be listed
      s3Mock.on(ListObjectsV2Command).resolves({
        Contents: [
          { Key: `renewable/projects/${projectName}/project.json` }
        ]
      });

      const allProjects = await projectStore.list();
      expect(allProjects.length).toBeGreaterThan(0);
      expect(allProjects.some(p => p.project_name === projectName)).toBe(true);
      console.log(`✓ Project appears in project list`);

      console.log('\n✅ Complete workflow test passed!');
    });
  });

  describe('Project Name Generation', () => {
    it('should generate unique names for multiple projects', async () => {
      // Mock Location Service
      locationMock.on(SearchPlaceIndexForPositionCommand).resolves({
        Results: [{
          Place: {
            Municipality: 'Amarillo',
            Region: 'TX'
          }
        }]
      });

      // Mock S3 for project list (empty initially)
      s3Mock.on(ListObjectsV2Command).resolves({ Contents: [] });
      s3Mock.on(GetObjectCommand).rejects({ name: 'NoSuchKey' });
      s3Mock.on(PutObjectCommand).resolves({});

      // Generate first project name
      const name1 = await nameGenerator.generateFromQuery('analyze terrain in West Texas');
      console.log(`First project: ${name1}`);
      expect(name1).toContain('west-texas');

      // Save first project
      await projectStore.save(name1, {
        project_id: 'proj-1',
        project_name: name1
      });

      // Mock S3 to return first project
      s3Mock.on(ListObjectsV2Command).resolves({
        Contents: [
          { Key: `renewable/projects/${name1}/project.json` }
        ]
      });

      // Generate second project name (should be unique)
      const name2 = await nameGenerator.generateFromQuery('analyze terrain in West Texas');
      console.log(`Second project: ${name2}`);
      expect(name2).not.toBe(name1);
      expect(name2).toContain('west-texas');
      expect(name2).toMatch(/-2$/); // Should have -2 suffix

      console.log('✓ Unique name generation works');
    });

    it('should generate name from coordinates when no location in query', async () => {
      // Mock Location Service
      locationMock.on(SearchPlaceIndexForPositionCommand).resolves({
        Results: [{
          Place: {
            Municipality: 'Amarillo',
            Region: 'TX'
          }
        }]
      });

      // Mock S3
      s3Mock.on(ListObjectsV2Command).resolves({ Contents: [] });

      const coordinates = { lat: 35.067482, lon: -101.395466 };
      const name = await nameGenerator.generateFromQuery('analyze terrain', coordinates);
      
      console.log(`Generated name from coordinates: ${name}`);
      expect(name).toContain('amarillo');
      expect(name).toContain('tx');

      console.log('✓ Name generation from coordinates works');
    });

    it('should fallback to coordinate-based name on geocoding failure', async () => {
      // Mock Location Service failure
      locationMock.on(SearchPlaceIndexForPositionCommand).rejects(new Error('Geocoding failed'));

      // Mock S3
      s3Mock.on(ListObjectsV2Command).resolves({ Contents: [] });

      const coordinates = { lat: 35.067482, lon: -101.395466 };
      const name = await nameGenerator.generateFromQuery('analyze terrain', coordinates);
      
      console.log(`Fallback name: ${name}`);
      expect(name).toMatch(/site-/);
      expect(name).toMatch(/n35/);
      expect(name).toMatch(/w101/);

      console.log('✓ Fallback name generation works');
    });
  });

  describe('Session Context Persistence', () => {
    it('should maintain session context across multiple operations', async () => {
      const projectName = 'test-project-wind-farm';

      // Mock DynamoDB
      dynamoMock.on(GetCommand).resolves({});
      dynamoMock.on(PutCommand).resolves({});
      dynamoMock.on(UpdateCommand).resolves({
        Attributes: {
          session_id: testSessionId,
          user_id: testUserId,
          active_project: projectName,
          project_history: [projectName],
          last_updated: new Date().toISOString()
        }
      });

      // Set active project
      await sessionManager.setActiveProject(testSessionId, projectName);
      console.log(`Set active project: ${projectName}`);

      // Get context (should have active project)
      const context1 = await sessionManager.getContext(testSessionId);
      expect(context1.active_project).toBe(projectName);
      console.log(`✓ Active project set: ${context1.active_project}`);

      // Add to history
      await sessionManager.addToHistory(testSessionId, projectName);
      console.log(`Added to history: ${projectName}`);

      // Get context again (should still have active project)
      const context2 = await sessionManager.getContext(testSessionId);
      expect(context2.active_project).toBe(projectName);
      expect(context2.project_history).toContain(projectName);
      console.log(`✓ Session context persisted`);

      console.log('✓ Session context persistence works');
    });

    it('should track multiple projects in history', async () => {
      const projects = ['project-1', 'project-2', 'project-3'];

      // Mock DynamoDB
      dynamoMock.on(GetCommand).resolves({
        Item: {
          session_id: testSessionId,
          user_id: testUserId,
          project_history: [],
          last_updated: '2025-01-15T10:00:00Z'
        }
      });

      let currentHistory: string[] = [];
      dynamoMock.on(UpdateCommand).callsFake((input) => {
        const history = input.input.ExpressionAttributeValues[':history'];
        currentHistory = history;
        return Promise.resolve({
          Attributes: {
            session_id: testSessionId,
            user_id: testUserId,
            project_history: history,
            last_updated: new Date().toISOString()
          }
        });
      });

      // Add projects to history
      for (const project of projects) {
        await sessionManager.addToHistory(testSessionId, project);
        console.log(`Added to history: ${project}`);
      }

      // Verify history order (most recent first)
      expect(currentHistory[0]).toBe('project-3');
      expect(currentHistory[1]).toBe('project-2');
      expect(currentHistory[2]).toBe('project-1');
      console.log(`✓ History order: ${currentHistory.join(', ')}`);

      console.log('✓ Project history tracking works');
    });
  });

  describe('Auto-loading of Previous Results', () => {
    it('should auto-load coordinates for layout optimization', async () => {
      const projectName = 'test-project-wind-farm';
      const coordinates = { lat: 35.067482, lon: -101.395466 };

      // Mock S3 with existing project (terrain results saved)
      const existingProject: ProjectData = {
        project_id: 'proj-123',
        project_name: projectName,
        created_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-15T10:00:00Z',
        coordinates,
        terrain_results: { features: [], suitability_score: 85 }
      };

      s3Mock.on(GetObjectCommand).resolves({
        Body: Readable.from([JSON.stringify(existingProject)])
      });

      // Load project
      const project = await projectStore.load(projectName);
      
      // Verify coordinates are available
      expect(project?.coordinates).toEqual(coordinates);
      expect(project?.terrain_results).toBeDefined();
      console.log(`✓ Auto-loaded coordinates: ${JSON.stringify(project?.coordinates)}`);

      console.log('✓ Auto-loading coordinates works');
    });

    it('should auto-load layout for wake simulation', async () => {
      const projectName = 'test-project-wind-farm';
      const layoutResults = {
        turbines: [
          { id: 1, x: 100, y: 200, capacity_mw: 2.5 },
          { id: 2, x: 300, y: 400, capacity_mw: 2.5 }
        ],
        total_capacity_mw: 5.0,
        turbine_count: 2
      };

      // Mock S3 with existing project (layout results saved)
      const existingProject: ProjectData = {
        project_id: 'proj-123',
        project_name: projectName,
        created_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-15T10:00:00Z',
        coordinates: { lat: 35.067482, lon: -101.395466 },
        terrain_results: { features: [], suitability_score: 85 },
        layout_results: layoutResults
      };

      s3Mock.on(GetObjectCommand).resolves({
        Body: Readable.from([JSON.stringify(existingProject)])
      });

      // Load project
      const project = await projectStore.load(projectName);
      
      // Verify layout is available
      expect(project?.layout_results).toEqual(layoutResults);
      expect(project?.terrain_results).toBeDefined();
      expect(project?.coordinates).toBeDefined();
      console.log(`✓ Auto-loaded layout: ${project?.layout_results?.turbine_count} turbines`);

      console.log('✓ Auto-loading layout works');
    });

    it('should auto-load all results for report generation', async () => {
      const projectName = 'test-project-wind-farm';

      // Mock S3 with complete project
      const completeProject: ProjectData = {
        project_id: 'proj-123',
        project_name: projectName,
        created_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-15T10:00:00Z',
        coordinates: { lat: 35.067482, lon: -101.395466 },
        terrain_results: { features: [], suitability_score: 85 },
        layout_results: { turbines: [], total_capacity_mw: 5.0, turbine_count: 2 },
        simulation_results: { annual_energy_gwh: 15.5, capacity_factor: 0.35, wake_loss_percent: 5.2 }
      };

      s3Mock.on(GetObjectCommand).resolves({
        Body: Readable.from([JSON.stringify(completeProject)])
      });

      // Load project
      const project = await projectStore.load(projectName);
      
      // Verify all results are available
      expect(project?.terrain_results).toBeDefined();
      expect(project?.layout_results).toBeDefined();
      expect(project?.simulation_results).toBeDefined();
      expect(project?.coordinates).toBeDefined();
      console.log(`✓ Auto-loaded all results for report generation`);

      console.log('✓ Auto-loading all results works');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle missing project data gracefully', async () => {
      const projectName = 'non-existent-project';

      // Mock S3 (project not found)
      s3Mock.on(GetObjectCommand).rejects({ name: 'NoSuchKey' });

      // Load project
      const project = await projectStore.load(projectName);
      
      expect(project).toBeNull();
      console.log('✓ Handles missing project gracefully');
    });

    it('should handle S3 errors with cache fallback', async () => {
      const projectName = 'test-project-wind-farm';
      const projectData: ProjectData = {
        project_id: 'proj-123',
        project_name: projectName,
        created_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-15T10:00:00Z'
      };

      // First load succeeds
      s3Mock.on(GetObjectCommand).resolves({
        Body: Readable.from([JSON.stringify(projectData)])
      });
      await projectStore.load(projectName);

      // Second load fails, should use cache
      s3Mock.reset();
      s3Mock.on(GetObjectCommand).rejects(new Error('S3 Error'));
      
      const project = await projectStore.load(projectName);
      expect(project).toEqual(projectData);
      console.log('✓ Falls back to cache on S3 error');
    });

    it('should handle DynamoDB errors with session-only context', async () => {
      // Mock DynamoDB error
      dynamoMock.on(GetCommand).rejects(new Error('DynamoDB Error'));

      // Get context (should create session-only context)
      const context = await sessionManager.getContext(testSessionId);
      
      expect(context.session_id).toBe(testSessionId);
      expect(context.project_history).toEqual([]);
      console.log('✓ Creates session-only context on DynamoDB error');
    });

    it('should handle ambiguous project references', async () => {
      // Mock S3 with multiple matching projects
      s3Mock.on(ListObjectsV2Command).resolves({
        Contents: [
          { Key: 'renewable/projects/west-texas-wind-farm/project.json' },
          { Key: 'renewable/projects/east-texas-wind-farm/project.json' }
        ]
      });

      s3Mock.on(GetObjectCommand).callsFake((input) => {
        const key = input.input.Key as string;
        const projectName = key.split('/')[2];
        return Promise.resolve({
          Body: Readable.from([JSON.stringify({
            project_id: `proj-${projectName}`,
            project_name: projectName,
            created_at: '2025-01-15T10:00:00Z',
            updated_at: '2025-01-15T10:00:00Z'
          })])
        });
      });

      // Mock session context
      const sessionContext: SessionContext = {
        session_id: testSessionId,
        user_id: testUserId,
        project_history: [],
        last_updated: '2025-01-15T10:00:00Z'
      };

      // Resolve ambiguous query
      const query = 'run simulation for texas';
      const result = await projectResolver.resolve(query, sessionContext);
      
      expect(result.isAmbiguous).toBe(true);
      expect(result.matches?.length).toBeGreaterThan(1);
      console.log(`✓ Detected ambiguous reference: ${result.matches?.join(', ')}`);
    });
  });

  describe('Performance and Caching', () => {
    it('should use cache to reduce S3 calls', async () => {
      const projectName = 'test-project-wind-farm';
      const projectData: ProjectData = {
        project_id: 'proj-123',
        project_name: projectName,
        created_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-15T10:00:00Z'
      };

      // Mock S3
      s3Mock.on(GetObjectCommand).resolves({
        Body: Readable.from([JSON.stringify(projectData)])
      });

      // First load (from S3)
      await projectStore.load(projectName);
      expect(s3Mock.commandCalls(GetObjectCommand).length).toBe(1);

      // Second load (from cache)
      await projectStore.load(projectName);
      expect(s3Mock.commandCalls(GetObjectCommand).length).toBe(1); // Still 1

      console.log('✓ Cache reduces S3 calls');
    });

    it('should cache geocoding results', async () => {
      // Mock Location Service
      locationMock.on(SearchPlaceIndexForPositionCommand).resolves({
        Results: [{
          Place: {
            Municipality: 'Amarillo',
            Region: 'TX'
          }
        }]
      });

      // Mock S3
      s3Mock.on(ListObjectsV2Command).resolves({ Contents: [] });

      const coordinates = { lat: 35.067482, lon: -101.395466 };

      // First call (geocoding)
      await nameGenerator.generateFromCoordinates(coordinates.lat, coordinates.lon);
      expect(locationMock.commandCalls(SearchPlaceIndexForPositionCommand).length).toBe(1);

      // Second call (cached)
      await nameGenerator.generateFromCoordinates(coordinates.lat, coordinates.lon);
      expect(locationMock.commandCalls(SearchPlaceIndexForPositionCommand).length).toBe(1); // Still 1

      console.log('✓ Geocoding results are cached');
    });

    it('should cache session context', async () => {
      const context: SessionContext = {
        session_id: testSessionId,
        user_id: testUserId,
        project_history: [],
        last_updated: '2025-01-15T10:00:00Z'
      };

      // Mock DynamoDB
      dynamoMock.on(GetCommand).resolves({
        Item: context
      });

      // First call (from DynamoDB)
      await sessionManager.getContext(testSessionId);
      expect(dynamoMock.commandCalls(GetCommand).length).toBe(1);

      // Second call (from cache)
      await sessionManager.getContext(testSessionId);
      expect(dynamoMock.commandCalls(GetCommand).length).toBe(1); // Still 1

      console.log('✓ Session context is cached');
    });
  });
});

// Helper to create Readable stream from string
import { Readable } from 'stream';
import { SearchPlaceIndexForPositionCommand } from '@aws-sdk/client-location';
import { GetObjectCommand, ListObjectsV2Command, PutObjectCommand } from '@aws-sdk/client-s3';
import { GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
