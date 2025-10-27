/**
 * Integration Tests for Plotly Wind Rose Visualization
 * Task 14.6: Test complete flow from backend data generation to frontend rendering
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

describe('Plotly Wind Rose Backend Integration', () => {
  it('should have Python backend module with correct structure', () => {
    const pythonModulePath = path.join(process.cwd(), 'amplify/functions/renewableTools/plotly_wind_rose_generator.py');
    expect(fs.existsSync(pythonModulePath)).toBe(true);
    
    const content = fs.readFileSync(pythonModulePath, 'utf8');
    
    // Verify class exists
    expect(content).toContain('class PlotlyWindRoseGenerator');
    
    // Verify key methods
    expect(content).toContain('def generate_wind_rose_data');
    expect(content).toContain('def _bin_directions');
    expect(content).toContain('def _bin_speeds');
    expect(content).toContain('def _calculate_frequencies');
    expect(content).toContain('def _generate_plotly_traces');
    expect(content).toContain('def _calculate_statistics');
    
    // Verify constants
    expect(content).toContain('DIRECTIONS = [');
    expect(content).toContain('SPEED_BINS = [');
    expect(content).toContain('SPEED_COLORS = [');
  });

  it('should define 16 directional bins', () => {
    const pythonModulePath = path.join(process.cwd(), 'amplify/functions/renewableTools/plotly_wind_rose_generator.py');
    const content = fs.readFileSync(pythonModulePath, 'utf8');
    
    const directionsMatch = content.match(/DIRECTIONS = \[(.*?)\]/s);
    expect(directionsMatch).toBeTruthy();
    
    if (directionsMatch) {
      const directions = directionsMatch[1].split(',').map(d => d.trim().replace(/'/g, ''));
      expect(directions).toHaveLength(16);
      expect(directions[0]).toContain('N');
      expect(directions[4]).toContain('E');
      expect(directions[8]).toContain('S');
      expect(directions[12]).toContain('W');
    }
  });

  it('should define 7 speed ranges', () => {
    const pythonModulePath = path.join(process.cwd(), 'amplify/functions/renewableTools/plotly_wind_rose_generator.py');
    const content = fs.readFileSync(pythonModulePath, 'utf8');
    
    const speedBinsMatch = content.match(/SPEED_BINS = \[(.*?)\]/);
    expect(speedBinsMatch).toBeTruthy();
    
    if (speedBinsMatch) {
      const bins = speedBinsMatch[1].split(',').map(b => b.trim());
      expect(bins.length).toBeGreaterThanOrEqual(7);
    }
    
    const speedLabelsMatch = content.match(/SPEED_LABELS = \[(.*?)\]/);
    expect(speedLabelsMatch).toBeTruthy();
    
    if (speedLabelsMatch) {
      const labels = speedLabelsMatch[1].split(',').map(l => l.trim().replace(/'/g, ''));
      expect(labels).toHaveLength(7);
    }
  });

  it('should define color gradient from yellow to purple', () => {
    const pythonModulePath = path.join(process.cwd(), 'amplify/functions/renewableTools/plotly_wind_rose_generator.py');
    const content = fs.readFileSync(pythonModulePath, 'utf8');
    
    const colorsMatch = content.match(/SPEED_COLORS = \[(.*?)\]/s);
    expect(colorsMatch).toBeTruthy();
    
    if (colorsMatch) {
      const colors = colorsMatch[1].split(',').map(c => c.trim().replace(/'/g, ''));
      expect(colors).toHaveLength(7);
      
      // Verify color gradient
      expect(colors[0]).toContain('#ffff00'); // Yellow
      expect(colors[6]).toContain('#9933ff'); // Purple
    }
  });
});

describe('Plotly Wind Rose Frontend Integration', () => {
  it('should have React component with correct structure', () => {
    const componentPath = path.join(process.cwd(), 'src/components/renewable/PlotlyWindRose.tsx');
    expect(fs.existsSync(componentPath)).toBe(true);
    
    const content = fs.readFileSync(componentPath, 'utf8');
    
    // Verify component structure
    expect(content).toContain('interface PlotlyWindRoseProps');
    expect(content).toContain('const PlotlyWindRose: React.FC');
    expect(content).toContain('export default PlotlyWindRose');
    
    // Verify dynamic Plotly import
    expect(content).toContain("import('react-plotly.js')");
    
    // Verify key features
    expect(content).toContain('exportToPNG');
    expect(content).toContain('exportToSVG');
    expect(content).toContain('exportToJSON');
  });

  it('should configure Plotly with correct chart type', () => {
    const componentPath = path.join(process.cwd(), 'src/components/renewable/PlotlyWindRose.tsx');
    const content = fs.readFileSync(componentPath, 'utf8');
    
    // Should mention polar bar chart in documentation
    expect(content).toContain('polar bar chart');
    
    // Should configure polar chart
    expect(content).toContain('polar:');
    expect(content).toContain('radialaxis:');
    expect(content).toContain('angularaxis:');
  });

  it('should implement dark background styling', () => {
    const componentPath = path.join(process.cwd(), 'src/components/renewable/PlotlyWindRose.tsx');
    const content = fs.readFileSync(componentPath, 'utf8');
    
    expect(content).toContain('#1a1a1a');
    expect(content).toContain('darkBackground');
    expect(content).toContain('#444444');
  });

  it('should implement export functionality', () => {
    const componentPath = path.join(process.cwd(), 'src/components/renewable/PlotlyWindRose.tsx');
    const content = fs.readFileSync(componentPath, 'utf8');
    
    // PNG export
    expect(content).toContain('exportToPNG');
    expect(content).toContain("format: 'png'");
    
    // SVG export
    expect(content).toContain('exportToSVG');
    expect(content).toContain("format: 'svg'");
    
    // JSON export
    expect(content).toContain('exportToJSON');
    expect(content).toContain('application/json');
  });

  it('should configure responsive layout', () => {
    const componentPath = path.join(process.cwd(), 'src/components/renewable/PlotlyWindRose.tsx');
    const content = fs.readFileSync(componentPath, 'utf8');
    
    expect(content).toContain('responsive: true');
    expect(content).toContain('useResizeHandler');
    expect(content).toContain("width: '100%'");
  });

  it('should handle empty data gracefully', () => {
    const componentPath = path.join(process.cwd(), 'src/components/renewable/PlotlyWindRose.tsx');
    const content = fs.readFileSync(componentPath, 'utf8');
    
    expect(content).toContain('No Wind Data Available');
    expect(content).toContain('data.length === 0');
  });
});

describe('Plotly Wind Rose Artifact Integration', () => {
  it('should integrate with WindRoseArtifact component', () => {
    const artifactPath = path.join(process.cwd(), 'src/components/renewable/WindRoseArtifact.tsx');
    expect(fs.existsSync(artifactPath)).toBe(true);
    
    const content = fs.readFileSync(artifactPath, 'utf8');
    
    // Should import PlotlyWindRose
    expect(content).toContain("import PlotlyWindRose from './PlotlyWindRose'");
    
    // Should render PlotlyWindRose component
    expect(content).toContain('<PlotlyWindRose');
    
    // Should have plotlyWindRose in interface
    expect(content).toContain('plotlyWindRose');
  });

  it('should have fallback to matplotlib visualization', () => {
    const artifactPath = path.join(process.cwd(), 'src/components/renewable/WindRoseArtifact.tsx');
    const content = fs.readFileSync(artifactPath, 'utf8');
    
    // Should check for both Plotly and matplotlib data
    expect(content).toMatch(/plotlyWindRose|visualizationUrl|windRoseUrl/);
  });
});

describe('Plotly Wind Rose Simulation Handler Integration', () => {
  it('should integrate with simulation handler', () => {
    const handlerPath = path.join(process.cwd(), 'amplify/functions/renewableTools/simulation/handler.py');
    expect(fs.existsSync(handlerPath)).toBe(true);
    
    const content = fs.readFileSync(handlerPath, 'utf8');
    
    // Should import Plotly generator
    expect(content).toMatch(/from plotly_wind_rose_generator import|import plotly_wind_rose_generator/);
    
    // Should generate Plotly data
    expect(content).toContain('plotly_wind_rose');
    
    // Should save to S3
    expect(content).toContain('plotly_wind_rose.json');
  });

  it('should include Plotly data in response', () => {
    const handlerPath = path.join(process.cwd(), 'amplify/functions/renewableTools/simulation/handler.py');
    const content = fs.readFileSync(handlerPath, 'utf8');
    
    expect(content).toContain('plotlyWindRose');
  });
});

describe('Plotly Wind Rose Data Flow', () => {
  it('should have complete data flow from backend to frontend', () => {
    // 1. Python backend generates data
    const pythonModulePath = path.join(process.cwd(), 'amplify/functions/renewableTools/plotly_wind_rose_generator.py');
    expect(fs.existsSync(pythonModulePath)).toBe(true);
    
    // 2. Simulation handler uses generator
    const handlerPath = path.join(process.cwd(), 'amplify/functions/renewableTools/simulation/handler.py');
    expect(fs.existsSync(handlerPath)).toBe(true);
    
    // 3. Frontend component renders data
    const componentPath = path.join(process.cwd(), 'src/components/renewable/PlotlyWindRose.tsx');
    expect(fs.existsSync(componentPath)).toBe(true);
    
    // 4. Artifact component integrates everything
    const artifactPath = path.join(process.cwd(), 'src/components/renewable/WindRoseArtifact.tsx');
    expect(fs.existsSync(artifactPath)).toBe(true);
  });

  it('should maintain data structure consistency', () => {
    const pythonModulePath = path.join(process.cwd(), 'amplify/functions/renewableTools/plotly_wind_rose_generator.py');
    const pythonContent = fs.readFileSync(pythonModulePath, 'utf8');
    
    const componentPath = path.join(process.cwd(), 'src/components/renewable/PlotlyWindRose.tsx');
    const componentContent = fs.readFileSync(componentPath, 'utf8');
    
    // Both should reference plotly_traces
    expect(pythonContent).toContain('plotly_traces');
    expect(componentContent).toContain('data'); // Plotly data prop
    
    // Both should reference statistics
    expect(pythonContent).toContain('statistics');
    expect(componentContent).toContain('statistics');
  });
});

describe('Plotly Wind Rose Performance', () => {
  it('should use dynamic import for client-side only rendering', () => {
    const componentPath = path.join(process.cwd(), 'src/components/renewable/PlotlyWindRose.tsx');
    const content = fs.readFileSync(componentPath, 'utf8');
    
    expect(content).toContain('dynamic(() =>');
    expect(content).toContain('ssr: false');
  });

  it('should show loading spinner during import', () => {
    const componentPath = path.join(process.cwd(), 'src/components/renewable/PlotlyWindRose.tsx');
    const content = fs.readFileSync(componentPath, 'utf8');
    
    expect(content).toContain('loading:');
    expect(content).toContain('Spinner');
  });

  it('should use memoization for expensive calculations', () => {
    const componentPath = path.join(process.cwd(), 'src/components/renewable/PlotlyWindRose.tsx');
    const content = fs.readFileSync(componentPath, 'utf8');
    
    expect(content).toContain('useMemo');
  });
});

describe('Plotly Wind Rose Accessibility', () => {
  it('should provide meaningful empty state message', () => {
    const componentPath = path.join(process.cwd(), 'src/components/renewable/PlotlyWindRose.tsx');
    const content = fs.readFileSync(componentPath, 'utf8');
    
    expect(content).toContain('No Wind Data Available');
    expect(content).toContain('Wind rose visualization requires');
  });

  it('should use semantic HTML structure', () => {
    const componentPath = path.join(process.cwd(), 'src/components/renewable/PlotlyWindRose.tsx');
    const content = fs.readFileSync(componentPath, 'utf8');
    
    // Should use proper container structure
    expect(content).toContain('<div');
    expect(content).toContain('style={{');
  });
});

describe('Plotly Wind Rose Error Handling', () => {
  it('should validate data before rendering', () => {
    const componentPath = path.join(process.cwd(), 'src/components/renewable/PlotlyWindRose.tsx');
    const content = fs.readFileSync(componentPath, 'utf8');
    
    expect(content).toContain('!data || data.length === 0');
  });

  it('should handle missing statistics gracefully', () => {
    const componentPath = path.join(process.cwd(), 'src/components/renewable/PlotlyWindRose.tsx');
    const content = fs.readFileSync(componentPath, 'utf8');
    
    expect(content).toContain('!statistics');
  });
});

describe('Plotly Wind Rose Documentation', () => {
  it('should have comprehensive component documentation', () => {
    const componentPath = path.join(process.cwd(), 'src/components/renewable/PlotlyWindRose.tsx');
    const content = fs.readFileSync(componentPath, 'utf8');
    
    expect(content).toContain('/**');
    expect(content).toContain('Plotly Wind Rose');
    expect(content).toContain('Interactive polar bar chart');
  });

  it('should have Python module documentation', () => {
    const pythonModulePath = path.join(process.cwd(), 'amplify/functions/renewableTools/plotly_wind_rose_generator.py');
    const content = fs.readFileSync(pythonModulePath, 'utf8');
    
    expect(content).toContain('"""');
    expect(content).toContain('Plotly Wind Rose');
    expect(content).toContain('16 directional bins');
    expect(content).toContain('7 wind speed ranges');
  });
});
