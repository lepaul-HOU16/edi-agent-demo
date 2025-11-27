import React from 'react';
import { render, screen } from '@testing-library/react';
import { ProjectContextProvider, useProjectContext } from '@/contexts/ProjectContext';

// Test component that uses the context
function TestComponent() {
  const { activeProject, setActiveProject } = useProjectContext();
  
  return (
    <div>
      <div data-testid="active-project">
        {activeProject ? activeProject.projectName : 'No active project'}
      </div>
      <button
        data-testid="set-project"
        onClick={() => setActiveProject({
          projectId: 'test-project-1',
          projectName: 'Test Project',
          lastUpdated: Date.now()
        })}
      >
        Set Project
      </button>
    </div>
  );
}

describe('ProjectContext Integration in ChatPage', () => {
  it('should provide context to child components', () => {
    render(
      <ProjectContextProvider>
        <TestComponent />
      </ProjectContextProvider>
    );
    
    // Verify the context is accessible
    expect(screen.getByTestId('active-project')).toHaveTextContent('No active project');
  });

  it('should throw error when used outside provider', () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = () => {};
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useProjectContext must be used within ProjectContextProvider');
    
    console.error = originalError;
  });
});
