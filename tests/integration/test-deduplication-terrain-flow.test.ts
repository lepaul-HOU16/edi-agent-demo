/**
 * Integration test for deduplication in terrain analysis flow
 * 
 * Tests Requirements: 1.1, 1.2, 1.3, 1.4
 * 
 * Verifies:
 * - Duplicate detection before terrain analysis
 * - User prompt generation
 * - User choice handling (continue, create new, view details)
 * - Session context updates
 */

import { ProjectStore } from '../../amplify/functions/shared/projectStore';
import { ProjectLifecycleManager } from '../../amplify/functions/shared/projectLifecycleManager';
import { ProjectResolver } from '../../amplify/functions/shared/projectResolver';
import { ProjectNameGenerator } from '../../amplify/functions/shared/projectNameGenerator';
import { SessionContextManager } from '../../amplify/functions/shared/sessionContextManager';

describe('Deduplication in Terrain Analysis Flow', () => {
  let projectStore: ProjectStore;
  let lifecycleManager: ProjectLifecycleManager;
  let sessionContextManager: SessionContextManager;
  const testSessionId = `test-session-${Date.now()}`;
  const testCoordinates = {
    latitude: 35.067482,
    longitude: -101.395466
  };

  beforeAll(() => {
    // Initialize components
    projectStore = new ProjectStore(process.env.RENEWABLE_S3_BUCKET);
    const projectResolver = new ProjectResolver(projectStore);
    const projectNameGenerator = new ProjectNameGenerator(projectStore);
    sessionContextManager = new SessionContextManager(process.env.SESSION_CONTEXT_TABLE);
    
    lifecycleManager = new ProjectLifecycleManager(
      projectStore,
      projectResolver,
      projectNameGenerator,
      sessionContextManager
    );
  });

  describe('Requirement 1.1: Duplicate Detection', () => {
    it('should detect existing projects within 1km radius', async () => {
      // Create a test project at the coordinates
      const testProjectName = `test-terrain-${Date.now()}`;
      await projectStore.save(testProjectName, {
        project_id: `proj-${Date.now()}`,
        project_name: testProjectName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        coordinates: testCoordinates
      });

      // Check for duplicates
      const duplicateCheck = await lifecycleManager.checkForDuplicates(
        testCoordinates,
        1.0
      );

      expect(duplicateCheck.hasDuplicates).toBe(true);
      expect(duplicateCheck.duplicates.length).toBeGreaterThan(0);
      expect(duplicateCheck.duplicates[0].project.project_name).toBe(testProjectName);
      expect(duplicateCheck.duplicates[0].distanceKm).toBeLessThan(0.1); // Very close

      // Cleanup
      await projectStore.delete(testProjectName);
    });

    it('should not detect projects outside 1km radius', async () => {
      // Create a test project far away
      const testProjectName = `test-terrain-far-${Date.now()}`;
      const farCoordinates = {
        latitude: testCoordinates.latitude + 0.1, // ~11km away
        longitude: testCoordinates.longitude + 0.1
      };
      
      await projectStore.save(testProjectName, {
        project_id: `proj-${Date.now()}`,
        project_name: testProjectName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        coordinates: farCoordinates
      });

      // Check for duplicates at original coordinates
      const duplicateCheck = await lifecycleManager.checkForDuplicates(
        testCoordinates,
        1.0
      );

      // Should not find the far project
      const foundFarProject = duplicateCheck.duplicates.some(
        d => d.project.project_name === testProjectName
      );
      expect(foundFarProject).toBe(false);

      // Cleanup
      await projectStore.delete(testProjectName);
    });
  });

  describe('Requirement 1.2: User Prompt Generation', () => {
    it('should generate user prompt with project options', async () => {
      // Create test projects
      const testProject1 = `test-terrain-1-${Date.now()}`;
      const testProject2 = `test-terrain-2-${Date.now()}`;
      
      await projectStore.save(testProject1, {
        project_id: `proj-${Date.now()}`,
        project_name: testProject1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        coordinates: testCoordinates
      });

      await projectStore.save(testProject2, {
        project_id: `proj-${Date.now()}`,
        project_name: testProject2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        coordinates: {
          latitude: testCoordinates.latitude + 0.001, // ~100m away
          longitude: testCoordinates.longitude + 0.001
        }
      });

      // Check for duplicates
      const duplicateCheck = await lifecycleManager.checkForDuplicates(
        testCoordinates,
        1.0
      );

      expect(duplicateCheck.hasDuplicates).toBe(true);
      expect(duplicateCheck.userPrompt).toContain('Found existing project');
      expect(duplicateCheck.userPrompt).toContain('1. Continue with existing project');
      expect(duplicateCheck.userPrompt).toContain('2. Create new project');
      expect(duplicateCheck.userPrompt).toContain('3. View existing project details');
      expect(duplicateCheck.userPrompt).toContain(testProject1);

      // Cleanup
      await projectStore.delete(testProject1);
      await projectStore.delete(testProject2);
    });
  });

  describe('Requirement 1.3: User Choice Handling', () => {
    let testProjectName: string;
    let duplicates: any[];

    beforeEach(async () => {
      // Create a test project
      testProjectName = `test-terrain-choice-${Date.now()}`;
      await projectStore.save(testProjectName, {
        project_id: `proj-${Date.now()}`,
        project_name: testProjectName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        coordinates: testCoordinates,
        terrain_results: { some: 'data' }
      });

      // Get duplicates
      const duplicateCheck = await lifecycleManager.checkForDuplicates(
        testCoordinates,
        1.0
      );
      duplicates = duplicateCheck.duplicates;
    });

    afterEach(async () => {
      // Cleanup
      await projectStore.delete(testProjectName);
    });

    it('should handle choice 1: Continue with existing project', async () => {
      const result = await lifecycleManager.handleDuplicateChoice(
        '1',
        duplicates,
        testSessionId
      );

      expect(result.action).toBe('continue');
      expect(result.projectName).toBe(testProjectName);
      expect(result.message).toContain('Continuing with existing project');
    });

    it('should handle choice 2: Create new project', async () => {
      const result = await lifecycleManager.handleDuplicateChoice(
        '2',
        duplicates,
        testSessionId
      );

      expect(result.action).toBe('create_new');
      expect(result.message).toContain('Creating new project');
    });

    it('should handle choice 3: View project details', async () => {
      const result = await lifecycleManager.handleDuplicateChoice(
        '3',
        duplicates,
        testSessionId
      );

      expect(result.action).toBe('view_details');
      expect(result.message).toContain('Project Details');
      expect(result.message).toContain(testProjectName);
      expect(result.message).toContain('Completion');
    });

    it('should handle invalid choice by defaulting to create new', async () => {
      const result = await lifecycleManager.handleDuplicateChoice(
        '5',
        duplicates,
        testSessionId
      );

      expect(result.action).toBe('create_new');
      expect(result.message).toContain('Invalid choice');
    });
  });

  describe('Requirement 1.4: Session Context Updates', () => {
    let testProjectName: string;
    let duplicates: any[];

    beforeEach(async () => {
      // Create a test project
      testProjectName = `test-terrain-session-${Date.now()}`;
      await projectStore.save(testProjectName, {
        project_id: `proj-${Date.now()}`,
        project_name: testProjectName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        coordinates: testCoordinates
      });

      // Get duplicates
      const duplicateCheck = await lifecycleManager.checkForDuplicates(
        testCoordinates,
        1.0
      );
      duplicates = duplicateCheck.duplicates;
    });

    afterEach(async () => {
      // Cleanup
      await projectStore.delete(testProjectName);
    });

    it('should set active project when user chooses to continue', async () => {
      // Handle choice 1
      await lifecycleManager.handleDuplicateChoice(
        '1',
        duplicates,
        testSessionId
      );

      // Verify session context
      const activeProject = await sessionContextManager.getActiveProject(testSessionId);
      expect(activeProject).toBe(testProjectName);

      // Verify project history
      const context = await sessionContextManager.getContext(testSessionId);
      expect(context.project_history).toContain(testProjectName);
    });

    it('should not set active project when user chooses to create new', async () => {
      // Clear any existing active project
      await sessionContextManager.setActiveProject(testSessionId, '');

      // Handle choice 2
      await lifecycleManager.handleDuplicateChoice(
        '2',
        duplicates,
        testSessionId
      );

      // Verify no active project set
      const activeProject = await sessionContextManager.getActiveProject(testSessionId);
      expect(activeProject).toBe('');
    });
  });

  describe('End-to-End Terrain Analysis Flow', () => {
    it('should complete full deduplication flow', async () => {
      const testProjectName = `test-terrain-e2e-${Date.now()}`;
      
      // Step 1: Create initial project
      await projectStore.save(testProjectName, {
        project_id: `proj-${Date.now()}`,
        project_name: testProjectName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        coordinates: testCoordinates
      });

      // Step 2: Attempt terrain analysis at same coordinates
      const duplicateCheck = await lifecycleManager.checkForDuplicates(
        testCoordinates,
        1.0
      );

      // Step 3: Verify duplicate detected
      expect(duplicateCheck.hasDuplicates).toBe(true);
      expect(duplicateCheck.userPrompt).toBeTruthy();

      // Step 4: User chooses to continue
      const choiceResult = await lifecycleManager.handleDuplicateChoice(
        '1',
        duplicateCheck.duplicates,
        testSessionId
      );

      // Step 5: Verify correct action
      expect(choiceResult.action).toBe('continue');
      expect(choiceResult.projectName).toBe(testProjectName);

      // Step 6: Verify session updated
      const activeProject = await sessionContextManager.getActiveProject(testSessionId);
      expect(activeProject).toBe(testProjectName);

      // Cleanup
      await projectStore.delete(testProjectName);
    });
  });
});
