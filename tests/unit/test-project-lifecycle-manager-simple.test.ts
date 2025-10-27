/**
 * Simple validation tests for ProjectLifecycleManager
 * 
 * Validates that the class can be instantiated and has all required methods
 */

import { describe, it, expect } from '@jest/globals';
import { ProjectLifecycleManager, ERROR_MESSAGES, ProjectLifecycleError } from '../../amplify/functions/shared/projectLifecycleManager';
import { ProjectStore } from '../../amplify/functions/shared/projectStore';
import { ProjectResolver } from '../../amplify/functions/shared/projectResolver';
import { ProjectNameGenerator } from '../../amplify/functions/shared/projectNameGenerator';
import { SessionContextManager } from '../../amplify/functions/shared/sessionContextManager';

describe('ProjectLifecycleManager - Structure Validation', () => {
  it('should instantiate with all dependencies', () => {
    const projectStore = new ProjectStore();
    const projectResolver = new ProjectResolver(projectStore);
    const projectNameGenerator = new ProjectNameGenerator(projectStore);
    const sessionContextManager = new SessionContextManager();

    const lifecycleManager = new ProjectLifecycleManager(
      projectStore,
      projectResolver,
      projectNameGenerator,
      sessionContextManager
    );

    expect(lifecycleManager).toBeDefined();
  });

  it('should have all required deduplication methods', () => {
    const projectStore = new ProjectStore();
    const projectResolver = new ProjectResolver(projectStore);
    const projectNameGenerator = new ProjectNameGenerator(projectStore);
    const sessionContextManager = new SessionContextManager();

    const lifecycleManager = new ProjectLifecycleManager(
      projectStore,
      projectResolver,
      projectNameGenerator,
      sessionContextManager
    );

    expect(typeof lifecycleManager.detectDuplicates).toBe('function');
    expect(typeof lifecycleManager.promptForDuplicateResolution).toBe('function');
  });

  it('should have all required deletion methods', () => {
    const projectStore = new ProjectStore();
    const projectResolver = new ProjectResolver(projectStore);
    const projectNameGenerator = new ProjectNameGenerator(projectStore);
    const sessionContextManager = new SessionContextManager();

    const lifecycleManager = new ProjectLifecycleManager(
      projectStore,
      projectResolver,
      projectNameGenerator,
      sessionContextManager
    );

    expect(typeof lifecycleManager.deleteProject).toBe('function');
    expect(typeof lifecycleManager.deleteBulk).toBe('function');
  });

  it('should have all required rename methods', () => {
    const projectStore = new ProjectStore();
    const projectResolver = new ProjectResolver(projectStore);
    const projectNameGenerator = new ProjectNameGenerator(projectStore);
    const sessionContextManager = new SessionContextManager();

    const lifecycleManager = new ProjectLifecycleManager(
      projectStore,
      projectResolver,
      projectNameGenerator,
      sessionContextManager
    );

    expect(typeof lifecycleManager.renameProject).toBe('function');
  });

  it('should have all required merge methods', () => {
    const projectStore = new ProjectStore();
    const projectResolver = new ProjectResolver(projectStore);
    const projectNameGenerator = new ProjectNameGenerator(projectStore);
    const sessionContextManager = new SessionContextManager();

    const lifecycleManager = new ProjectLifecycleManager(
      projectStore,
      projectResolver,
      projectNameGenerator,
      sessionContextManager
    );

    expect(typeof lifecycleManager.mergeProjects).toBe('function');
  });

  it('should have all required archive methods', () => {
    const projectStore = new ProjectStore();
    const projectResolver = new ProjectResolver(projectStore);
    const projectNameGenerator = new ProjectNameGenerator(projectStore);
    const sessionContextManager = new SessionContextManager();

    const lifecycleManager = new ProjectLifecycleManager(
      projectStore,
      projectResolver,
      projectNameGenerator,
      sessionContextManager
    );

    expect(typeof lifecycleManager.archiveProject).toBe('function');
    expect(typeof lifecycleManager.unarchiveProject).toBe('function');
    expect(typeof lifecycleManager.listArchivedProjects).toBe('function');
  });

  it('should have all required search methods', () => {
    const projectStore = new ProjectStore();
    const projectResolver = new ProjectResolver(projectStore);
    const projectNameGenerator = new ProjectNameGenerator(projectStore);
    const sessionContextManager = new SessionContextManager();

    const lifecycleManager = new ProjectLifecycleManager(
      projectStore,
      projectResolver,
      projectNameGenerator,
      sessionContextManager
    );

    expect(typeof lifecycleManager.searchProjects).toBe('function');
    expect(typeof lifecycleManager.findDuplicates).toBe('function');
  });

  it('should have all required export/import methods', () => {
    const projectStore = new ProjectStore();
    const projectResolver = new ProjectResolver(projectStore);
    const projectNameGenerator = new ProjectNameGenerator(projectStore);
    const sessionContextManager = new SessionContextManager();

    const lifecycleManager = new ProjectLifecycleManager(
      projectStore,
      projectResolver,
      projectNameGenerator,
      sessionContextManager
    );

    expect(typeof lifecycleManager.exportProject).toBe('function');
    expect(typeof lifecycleManager.importProject).toBe('function');
  });

  it('should have dashboard generation method', () => {
    const projectStore = new ProjectStore();
    const projectResolver = new ProjectResolver(projectStore);
    const projectNameGenerator = new ProjectNameGenerator(projectStore);
    const sessionContextManager = new SessionContextManager();

    const lifecycleManager = new ProjectLifecycleManager(
      projectStore,
      projectResolver,
      projectNameGenerator,
      sessionContextManager
    );

    expect(typeof lifecycleManager.generateDashboard).toBe('function');
  });

  it('should have all error message templates', () => {
    expect(ERROR_MESSAGES.PROJECT_NOT_FOUND).toBeDefined();
    expect(ERROR_MESSAGES.NAME_ALREADY_EXISTS).toBeDefined();
    expect(ERROR_MESSAGES.PROJECT_IN_PROGRESS).toBeDefined();
    expect(ERROR_MESSAGES.CONFIRMATION_REQUIRED).toBeDefined();
    expect(ERROR_MESSAGES.S3_ERROR).toBeDefined();
    expect(ERROR_MESSAGES.INVALID_COORDINATES).toBeDefined();
    expect(ERROR_MESSAGES.UNSUPPORTED_VERSION).toBeDefined();
    expect(ERROR_MESSAGES.INVALID_PROJECT_NAME).toBeDefined();
    expect(ERROR_MESSAGES.MERGE_CONFLICT).toBeDefined();
    expect(ERROR_MESSAGES.EXPORT_ERROR).toBeDefined();
    expect(ERROR_MESSAGES.IMPORT_ERROR).toBeDefined();
  });

  it('should have all error types', () => {
    expect(ProjectLifecycleError.PROJECT_NOT_FOUND).toBe('PROJECT_NOT_FOUND');
    expect(ProjectLifecycleError.NAME_ALREADY_EXISTS).toBe('NAME_ALREADY_EXISTS');
    expect(ProjectLifecycleError.PROJECT_IN_PROGRESS).toBe('PROJECT_IN_PROGRESS');
    expect(ProjectLifecycleError.CONFIRMATION_REQUIRED).toBe('CONFIRMATION_REQUIRED');
    expect(ProjectLifecycleError.INVALID_COORDINATES).toBe('INVALID_COORDINATES');
    expect(ProjectLifecycleError.S3_ERROR).toBe('S3_ERROR');
    expect(ProjectLifecycleError.UNSUPPORTED_VERSION).toBe('UNSUPPORTED_VERSION');
    expect(ProjectLifecycleError.INVALID_PROJECT_NAME).toBe('INVALID_PROJECT_NAME');
    expect(ProjectLifecycleError.MERGE_CONFLICT).toBe('MERGE_CONFLICT');
    expect(ProjectLifecycleError.EXPORT_ERROR).toBe('EXPORT_ERROR');
    expect(ProjectLifecycleError.IMPORT_ERROR).toBe('IMPORT_ERROR');
  });

  it('should generate correct error messages', () => {
    const projectName = 'test-project';
    
    expect(ERROR_MESSAGES.PROJECT_NOT_FOUND(projectName)).toContain(projectName);
    expect(ERROR_MESSAGES.NAME_ALREADY_EXISTS(projectName)).toContain(projectName);
    expect(ERROR_MESSAGES.PROJECT_IN_PROGRESS(projectName)).toContain(projectName);
    expect(ERROR_MESSAGES.CONFIRMATION_REQUIRED('delete', projectName)).toContain('delete');
    expect(ERROR_MESSAGES.CONFIRMATION_REQUIRED('delete', projectName)).toContain(projectName);
  });
});
