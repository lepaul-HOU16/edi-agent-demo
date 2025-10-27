/**
 * Verification Script for Archive/Unarchive Functionality
 * 
 * This script verifies that the archive/unarchive functionality is working correctly
 * by testing all requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
 */

import { ProjectLifecycleManager } from '../amplify/functions/shared/projectLifecycleManager';
import { ProjectStore, ProjectData } from '../amplify/functions/shared/projectStore';
import { ProjectResolver } from '../amplify/functions/shared/projectResolver';
import { ProjectNameGenerator } from '../amplify/functions/shared/projectNameGenerator';
import { SessionContextManager } from '../amplify/functions/shared/sessionContextManager';

async function verifyArchiveUnarchive() {
  console.log('='.repeat(80));
  console.log('Archive/Unarchive Functionality Verification');
  console.log('='.repeat(80));
  console.log();

  // Initialize components
  const projectStore = new ProjectStore(''); // In-memory mode for testing
  const projectResolver = new ProjectResolver(projectStore);
  const projectNameGenerator = new ProjectNameGenerator(projectStore);
  const sessionContextManager = new SessionContextManager();

  const lifecycleManager = new ProjectLifecycleManager(
    projectStore,
    projectResolver,
    projectNameGenerator,
    sessionContextManager
  );

  let testsPassed = 0;
  let testsFailed = 0;

  // Helper function to run tests
  async function runTest(
    name: string,
    requirement: string,
    testFn: () => Promise<boolean>
  ): Promise<void> {
    try {
      console.log(`\n📋 Test: ${name}`);
      console.log(`   Requirement: ${requirement}`);
      const passed = await testFn();
      if (passed) {
        console.log('   ✅ PASSED');
        testsPassed++;
      } else {
        console.log('   ❌ FAILED');
        testsFailed++;
      }
    } catch (error) {
      console.log('   ❌ FAILED with error:', error instanceof Error ? error.message : error);
      testsFailed++;
    }
  }

  // Test 1: Archive a project (Requirement 8.1)
  await runTest(
    'Archive a project',
    '8.1',
    async () => {
      const projectData: ProjectData = {
        project_id: 'proj-test-1',
        project_name: 'test-archive-project',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        coordinates: { latitude: 35.0, longitude: -101.0 },
      };

      await projectStore.save('test-archive-project', projectData);

      const result = await lifecycleManager.archiveProject('test-archive-project');

      if (!result.success) {
        console.log('   Error:', result.message);
        return false;
      }

      // Verify project is archived
      const loadedProject = await projectStore.load('test-archive-project');
      if (!loadedProject?.metadata?.archived) {
        console.log('   Error: Project not marked as archived');
        return false;
      }

      if (!loadedProject.metadata.archived_at) {
        console.log('   Error: archived_at timestamp not set');
        return false;
      }

      return true;
    }
  );

  // Test 2: Archived projects filtered from default listings (Requirement 8.2)
  await runTest(
    'Archived projects filtered from default listings',
    '8.2',
    async () => {
      // Create active and archived projects
      const activeProject: ProjectData = {
        project_id: 'proj-active-1',
        project_name: 'active-project',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const toArchiveProject: ProjectData = {
        project_id: 'proj-archive-2',
        project_name: 'to-archive-project',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await projectStore.save('active-project', activeProject);
      await projectStore.save('to-archive-project', toArchiveProject);
      await lifecycleManager.archiveProject('to-archive-project');

      // Get active projects
      const activeProjects = await lifecycleManager.listActiveProjects();

      // Should only contain active project
      if (activeProjects.length !== 1) {
        console.log(`   Error: Expected 1 active project, got ${activeProjects.length}`);
        return false;
      }

      if (activeProjects[0].project_name !== 'active-project') {
        console.log('   Error: Wrong project in active list');
        return false;
      }

      // Verify archived project not in active list
      const hasArchivedInActive = activeProjects.some(
        (p) => p.project_name === 'to-archive-project'
      );
      if (hasArchivedInActive) {
        console.log('   Error: Archived project found in active list');
        return false;
      }

      return true;
    }
  );

  // Test 3: List archived projects (Requirement 8.3)
  await runTest(
    'List archived projects',
    '8.3',
    async () => {
      const archivedProjects = await lifecycleManager.listArchivedProjects();

      // Should contain archived projects
      if (archivedProjects.length === 0) {
        console.log('   Error: No archived projects found');
        return false;
      }

      // All should be archived
      const allArchived = archivedProjects.every((p) => p.metadata?.archived === true);
      if (!allArchived) {
        console.log('   Error: Non-archived project in archived list');
        return false;
      }

      console.log(`   Found ${archivedProjects.length} archived project(s)`);
      return true;
    }
  );

  // Test 4: Unarchive a project (Requirement 8.4)
  await runTest(
    'Unarchive a project',
    '8.4',
    async () => {
      const result = await lifecycleManager.unarchiveProject('test-archive-project');

      if (!result.success) {
        console.log('   Error:', result.message);
        return false;
      }

      // Verify project is no longer archived
      const loadedProject = await projectStore.load('test-archive-project');
      if (loadedProject?.metadata?.archived !== false) {
        console.log('   Error: Project still marked as archived');
        return false;
      }

      // Verify it's in active list
      const activeProjects = await lifecycleManager.listActiveProjects();
      const isInActiveList = activeProjects.some(
        (p) => p.project_name === 'test-archive-project'
      );
      if (!isInActiveList) {
        console.log('   Error: Unarchived project not in active list');
        return false;
      }

      return true;
    }
  );

  // Test 5: Clear active project when archiving (Requirement 8.5)
  await runTest(
    'Clear active project when archiving',
    '8.5',
    async () => {
      const sessionId = 'test-session-123';

      // Create and set active project
      const projectData: ProjectData = {
        project_id: 'proj-active-test',
        project_name: 'active-test-project',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await projectStore.save('active-test-project', projectData);
      await sessionContextManager.setActiveProject(sessionId, 'active-test-project');

      // Verify it's active
      let activeProject = await sessionContextManager.getActiveProject(sessionId);
      if (activeProject !== 'active-test-project') {
        console.log('   Error: Failed to set active project');
        return false;
      }

      // Archive the project
      await lifecycleManager.archiveProject('active-test-project', sessionId);

      // Verify active project was cleared
      activeProject = await sessionContextManager.getActiveProject(sessionId);
      if (activeProject !== '') {
        console.log(`   Error: Active project not cleared, got: ${activeProject}`);
        return false;
      }

      return true;
    }
  );

  // Test 6: Archived projects accessible by explicit name (Requirement 8.6)
  await runTest(
    'Archived projects accessible by explicit name',
    '8.6',
    async () => {
      // Archive a project
      const projectData: ProjectData = {
        project_id: 'proj-explicit-test',
        project_name: 'explicit-access-project',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await projectStore.save('explicit-access-project', projectData);
      await lifecycleManager.archiveProject('explicit-access-project');

      // Verify not in active list
      const activeProjects = await lifecycleManager.listActiveProjects();
      const isInActiveList = activeProjects.some(
        (p) => p.project_name === 'explicit-access-project'
      );
      if (isInActiveList) {
        console.log('   Error: Archived project in active list');
        return false;
      }

      // Verify can still be loaded by name
      const loadedProject = await projectStore.load('explicit-access-project');
      if (!loadedProject) {
        console.log('   Error: Cannot load archived project by name');
        return false;
      }

      if (loadedProject.project_name !== 'explicit-access-project') {
        console.log('   Error: Wrong project loaded');
        return false;
      }

      if (!loadedProject.metadata?.archived) {
        console.log('   Error: Project not marked as archived');
        return false;
      }

      return true;
    }
  );

  // Test 7: Search with archived filter
  await runTest(
    'Search with archived filter',
    '8.2, 8.3',
    async () => {
      // Search for active projects only
      const activeResults = await lifecycleManager.searchProjects({ archived: false });
      const hasArchivedInActive = activeResults.some((p) => p.metadata?.archived === true);
      if (hasArchivedInActive) {
        console.log('   Error: Archived project in active search results');
        return false;
      }

      // Search for archived projects only
      const archivedResults = await lifecycleManager.searchProjects({ archived: true });
      const hasActiveInArchived = archivedResults.some((p) => p.metadata?.archived !== true);
      if (hasActiveInArchived) {
        console.log('   Error: Active project in archived search results');
        return false;
      }

      console.log(`   Active: ${activeResults.length}, Archived: ${archivedResults.length}`);
      return true;
    }
  );

  // Summary
  console.log();
  console.log('='.repeat(80));
  console.log('Verification Summary');
  console.log('='.repeat(80));
  console.log(`✅ Tests Passed: ${testsPassed}`);
  console.log(`❌ Tests Failed: ${testsFailed}`);
  console.log(`📊 Total Tests: ${testsPassed + testsFailed}`);
  console.log();

  if (testsFailed === 0) {
    console.log('🎉 All tests passed! Archive/Unarchive functionality is working correctly.');
    return true;
  } else {
    console.log('⚠️  Some tests failed. Please review the errors above.');
    return false;
  }
}

// Run verification
verifyArchiveUnarchive()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Verification failed with error:', error);
    process.exit(1);
  });
