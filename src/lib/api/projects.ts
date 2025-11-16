/**
 * Projects REST API Client
 * 
 * Provides methods to interact with the CDK-deployed projects API
 */

import { apiGet, apiPost, apiPatch, apiDelete, API_BASE_URL } from './client';

export interface Project {
  id: string;
  name?: string;
  description?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  financial?: {
    cost?: number;
    revenuePresentValue?: number;
    successProbability?: number;
    incrimentalOilRateBOPD?: number;
    incrimentalGasRateMCFD?: number;
  };
  sourceChatSessionId?: string;
  reportS3Path?: string;
  nextAction?: {
    buttonTextBeforeClick?: string;
    buttonTextAfterClick?: string;
  };
}

/**
 * Get all projects for the authenticated user
 */
export async function getProjects(): Promise<Project[]> {
  try {
    const response = await apiGet<{ projects: Project[] }>('/api/projects');
    return response.projects || [];
  } catch (error: any) {
    console.error('Get projects error:', error);
    throw error;
  }
}

/**
 * Update a project
 */
export async function updateProject(projectId: string, updates: Partial<Project>): Promise<Project> {
  try {
    const response = await apiPatch<{ project: Project }>(`/api/projects/${projectId}`, updates);
    return response.project;
  } catch (error: any) {
    console.error('Update project error:', error);
    throw error;
  }
}

/**
 * Delete a renewable energy project
 */
export async function deleteProject(projectId: string): Promise<{ success: boolean; message: string }> {
  try {
    const response = await apiDelete<{ success: boolean; message: string }>(`/api/projects/${projectId}`);
    return response;
  } catch (error: any) {
    console.error('Delete project error:', error);
    return {
      success: false,
      message: error.message || 'Failed to delete project'
    };
  }
}

/**
 * Rename a renewable energy project
 */
export async function renameProject(projectId: string, newName: string): Promise<{ success: boolean; message: string }> {
  try {
    const response = await apiPatch<{ success: boolean; message: string }>(`/api/projects/${projectId}`, { name: newName });
    return response;
  } catch (error: any) {
    console.error('Rename project error:', error);
    return {
      success: false,
      message: error.message || 'Failed to rename project'
    };
  }
}

/**
 * Get project details
 */
export async function getProject(projectId: string): Promise<Project> {
  try {
    const response = await apiGet<{ project: Project }>(`/api/projects/${projectId}`);
    return response.project;
  } catch (error: any) {
    console.error('Get project error:', error);
    throw error;
  }
}
