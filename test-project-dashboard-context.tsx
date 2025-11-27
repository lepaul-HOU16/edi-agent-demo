/**
 * Test to verify ProjectDashboardArtifact sets active project correctly
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ProjectDashboardArtifact from './src/components/renewable/ProjectDashboardArtifact';
import { ProjectContextProvider } from './src/contexts/ProjectContext';

describe('ProjectDashboardArtifact - Active Project Setting', () => {
  const mockData = {
    projects: [
      {
        name: 'West Texas Wind Farm',
        location: 'West Texas',
        completionPercentage: 75,
        lastUpdated: new Date().toISOString(),
        isActive: true,
        isDuplicate: false,
        status: 'in-progress'
      },
      {
        name: 'East Coast Wind Farm',
        location: 'East Coast',
        completionPercentage: 50,
        lastUpdated: new Date().toISOString(),
        isActive: false,
        isDuplicate: false,
        status: 'in-progress'
      }
    ],
    totalProjects: 2,
    activeProject: 'West Texas Wind Farm',
    duplicateGroups: []
  };

  it('should set active project when Continue button is clicked', () => {
    const onAction = jest.fn();
    
    render(
      <ProjectContextProvider>
        <ProjectDashboardArtifact data={mockData} onAction={onAction} />
      </ProjectContextProvider>
    );

    // Find and click the Continue button for the first project
    const continueButtons = screen.getAllByLabelText(/Continue working on/);
    fireEvent.click(continueButtons[0]);

    // Verify the project context was updated (check console logs or sessionStorage)
    const storedProject = sessionStorage.getItem('activeProject');
    expect(storedProject).toBeTruthy();
    
    const parsedProject = JSON.parse(storedProject!);
    expect(parsedProject.projectName).toBe('West Texas Wind Farm');
    expect(parsedProject.location).toBe('West Texas');
  });

  it('should set active project when View button is clicked', () => {
    const onAction = jest.fn();
    
    render(
      <ProjectContextProvider>
        <ProjectDashboardArtifact data={mockData} onAction={onAction} />
      </ProjectContextProvider>
    );

    // Find and click the View button for the second project
    const viewButtons = screen.getAllByLabelText(/View.*and set as active project/);
    fireEvent.click(viewButtons[1]);

    // Verify the project context was updated
    const storedProject = sessionStorage.getItem('activeProject');
    expect(storedProject).toBeTruthy();
    
    const parsedProject = JSON.parse(storedProject!);
    expect(parsedProject.projectName).toBe('East Coast Wind Farm');
    expect(parsedProject.location).toBe('East Coast');
  });

  it('should log project context updates', () => {
    const consoleSpy = jest.spyOn(console, 'log');
    const onAction = jest.fn();
    
    render(
      <ProjectContextProvider>
        <ProjectDashboardArtifact data={mockData} onAction={onAction} />
      </ProjectContextProvider>
    );

    // Click Continue button
    const continueButtons = screen.getAllByLabelText(/Continue working on/);
    fireEvent.click(continueButtons[0]);

    // Verify console logging
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('🎯 [ProjectDashboardArtifact] Setting active project for action:')
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('🎯 [ProjectDashboardArtifact] Project info:')
    );

    consoleSpy.mockRestore();
  });
});
