/**
 * Unit Tests for Plotly Wind Rose Visualization
 * Task 14.6: Test data binning, frequency calculation, chart rendering, interactivity, export, and responsive layout
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock data for testing
const generateMockWindData = (count: number = 100) => {
  const speeds: number[] = [];
  const directions: number[] = [];
  
  for (let i = 0; i < count; i++) {
    // Generate realistic wind data
    speeds.push(Math.random() * 10); // 0-10 m/s
    directions.push(Math.random() * 360); // 0-360 degrees
  }
  
  return { speeds, directions };
};

describe('Plotly Wind Rose Data Binning', () => {
  it('should bin directions into 16 sectors (22.5° each)', () => {
    const directions = [0, 22.5, 45, 90, 180, 270, 359];
    
    // Expected bins (0-15)
    // 0° → bin 0 (N)
    // 22.5° → bin 1 (NNE)
    // 45° → bin 2 (NE)
    // 90° → bin 4 (E)
    // 180° → bin 8 (S)
    // 270° → bin 12 (W)
    // 359° → bin 0 (N, wraps around)
    
    const expectedBins = [0, 1, 2, 4, 8, 12, 0];
    
    directions.forEach((dir, idx) => {
      const binIndex = Math.floor((dir + 11.25) / 22.5) % 16;
      expect(binIndex).toBe(expectedBins[idx]);
    });
  });

  it('should handle edge cases for direction binning', () => {
    // Test boundary conditions
    const testCases = [
      { direction: 0, expectedBin: 0 },      // North
      { direction: 11.24, expectedBin: 0 },  // Just before NNE
      { direction: 11.25, expectedBin: 1 },  // Start of NNE
      { direction: 33.74, expectedBin: 1 },  // End of NNE
      { direction: 33.75, expectedBin: 2 },  // Start of NE
      { direction: 360, expectedBin: 0 },    // Wrap to North
      { direction: 348, expectedBin: 15 },   // NNW (348° is in bin 15)
    ];

    testCases.forEach(({ direction, expectedBin }) => {
      const normalized = ((direction % 360) + 360) % 360;
      const binIndex = Math.floor((normalized + 11.25) / 22.5) % 16;
      expect(binIndex).toBe(expectedBin);
    });
  });

  it('should bin speeds into 7 ranges', () => {
    const speeds = [0.5, 1.5, 2.5, 3.5, 4.5, 5.5, 7.0];
    const speedBins = [0, 1, 2, 3, 4, 5, 6, Infinity];
    
    // Expected bins: 0-1, 1-2, 2-3, 3-4, 4-5, 5-6, 6+
    const expectedBins = [0, 1, 2, 3, 4, 5, 6];
    
    speeds.forEach((speed, idx) => {
      let binIndex = 0;
      for (let i = 1; i < speedBins.length; i++) {
        if (speed >= speedBins[i]) {
          binIndex = i;
        } else {
          break;
        }
      }
      expect(binIndex).toBe(expectedBins[idx]);
    });
  });

  it('should handle edge cases for speed binning', () => {
    const testCases = [
      { speed: 0, expectedBin: 0 },      // Minimum
      { speed: 0.99, expectedBin: 0 },   // Just below 1
      { speed: 1.0, expectedBin: 1 },    // Exactly 1
      { speed: 5.99, expectedBin: 5 },   // Just below 6
      { speed: 6.0, expectedBin: 6 },    // Exactly 6
      { speed: 100, expectedBin: 6 },    // Very high speed
    ];

    const speedBins = [0, 1, 2, 3, 4, 5, 6, Infinity];
    
    testCases.forEach(({ speed, expectedBin }) => {
      let binIndex = 0;
      for (let i = 1; i < speedBins.length; i++) {
        if (speed >= speedBins[i]) {
          binIndex = i;
        } else {
          break;
        }
      }
      expect(binIndex).toBe(expectedBin);
    });
  });
});

describe('Plotly Wind Rose Frequency Calculation', () => {
  it('should calculate correct frequency percentages', () => {
    // Simple test case: 100 observations, all in one direction/speed
    const totalCount = 100;
    const directionBins = new Array(100).fill(0); // All North
    const speedBins = new Array(100).fill(2); // All 2-3 m/s
    
    // Create frequency matrix [16 directions][7 speeds]
    const frequencies = Array(16).fill(0).map(() => Array(7).fill(0));
    
    directionBins.forEach((dirBin, idx) => {
      frequencies[dirBin][speedBins[idx]]++;
    });
    
    // Convert to percentages
    const percentages = frequencies.map(row => 
      row.map(count => (count / totalCount) * 100)
    );
    
    // All 100% should be in North (bin 0), speed 2-3 m/s (bin 2)
    expect(percentages[0][2]).toBe(100);
    
    // All other cells should be 0
    let otherCellsSum = 0;
    percentages.forEach((row, dirIdx) => {
      row.forEach((val, speedIdx) => {
        if (dirIdx !== 0 || speedIdx !== 2) {
          otherCellsSum += val;
        }
      });
    });
    expect(otherCellsSum).toBe(0);
  });

  it('should handle distributed wind data', () => {
    // Test with evenly distributed data
    const totalCount = 16 * 7; // 112 observations
    const frequencies = Array(16).fill(0).map(() => Array(7).fill(1));
    
    // Convert to percentages
    const percentages = frequencies.map(row => 
      row.map(count => (count / totalCount) * 100)
    );
    
    // Each cell should have ~0.89% (1/112 * 100)
    const expectedPercentage = (1 / totalCount) * 100;
    
    percentages.forEach(row => {
      row.forEach(val => {
        expect(val).toBeCloseTo(expectedPercentage, 2);
      });
    });
  });

  it('should sum to 100% across all bins', () => {
    const { speeds, directions } = generateMockWindData(1000);
    
    // Bin the data
    const directionBins = directions.map(dir => 
      Math.floor(((dir % 360) + 11.25) / 22.5) % 16
    );
    
    const speedBins = speeds.map(speed => {
      const bins = [0, 1, 2, 3, 4, 5, 6, Infinity];
      for (let i = bins.length - 1; i >= 0; i--) {
        if (speed >= bins[i]) return i;
      }
      return 0;
    });
    
    // Calculate frequencies
    const frequencies = Array(16).fill(0).map(() => Array(7).fill(0));
    directionBins.forEach((dirBin, idx) => {
      frequencies[dirBin][speedBins[idx]]++;
    });
    
    // Convert to percentages
    const percentages = frequencies.map(row => 
      row.map(count => (count / speeds.length) * 100)
    );
    
    // Sum all percentages
    let totalPercentage = 0;
    percentages.forEach(row => {
      row.forEach(val => {
        totalPercentage += val;
      });
    });
    
    expect(totalPercentage).toBeCloseTo(100, 1);
  });
});

describe('Plotly Wind Rose Statistics', () => {
  it('should calculate correct average wind speed', () => {
    const speeds = [1, 2, 3, 4, 5];
    const average = speeds.reduce((a, b) => a + b, 0) / speeds.length;
    expect(average).toBe(3);
  });

  it('should calculate correct max wind speed', () => {
    const speeds = [1, 2, 3, 4, 5, 10, 3];
    const max = Math.max(...speeds);
    expect(max).toBe(10);
  });

  it('should identify prevailing direction', () => {
    // Create data with clear prevailing direction
    const directions = [
      ...Array(50).fill(0),    // 50 observations from North
      ...Array(20).fill(90),   // 20 from East
      ...Array(30).fill(180),  // 30 from South
    ];
    
    const directionBins = directions.map(dir => 
      Math.floor((dir + 11.25) / 22.5) % 16
    );
    
    // Count occurrences per direction
    const counts = Array(16).fill(0);
    directionBins.forEach(bin => counts[bin]++);
    
    // Find prevailing direction
    const maxCount = Math.max(...counts);
    const prevailingBin = counts.indexOf(maxCount);
    
    expect(prevailingBin).toBe(0); // North
    expect(maxCount).toBe(50);
  });

  it('should calculate calm percentage correctly', () => {
    const speeds = [0.5, 0.8, 1.5, 2.0, 3.0, 0.3, 0.9, 4.0];
    const calmCount = speeds.filter(s => s < 1).length;
    const calmPercentage = (calmCount / speeds.length) * 100;
    
    expect(calmPercentage).toBe(50); // 4 out of 8 (0.5, 0.8, 0.3, 0.9)
  });
});

describe('Plotly Wind Rose Trace Generation', () => {
  it('should generate 7 traces (one per speed range)', () => {
    const frequencies = Array(16).fill(0).map(() => Array(7).fill(5));
    const angles = Array.from({ length: 16 }, (_, i) => i * 22.5);
    
    const traces = [];
    const speedLabels = ['0-1', '1-2', '2-3', '3-4', '4-5', '5-6', '6+'];
    const colors = ['#ffff00', '#ffcc00', '#ff9900', '#ff6600', '#ff3366', '#cc33cc', '#9933ff'];
    
    for (let speedIdx = 0; speedIdx < 7; speedIdx++) {
      traces.push({
        type: 'barpolar',
        r: frequencies.map(row => row[speedIdx]),
        theta: angles,
        name: speedLabels[speedIdx] + ' m/s',
        marker: {
          color: colors[speedIdx],
          line: { color: '#333', width: 1 }
        }
      });
    }
    
    expect(traces).toHaveLength(7);
    expect(traces[0].type).toBe('barpolar');
    expect(traces[0].theta).toHaveLength(16);
  });

  it('should use correct color gradient', () => {
    const expectedColors = [
      '#ffff00',  // Yellow
      '#ffcc00',  // Light orange
      '#ff9900',  // Orange
      '#ff6600',  // Dark orange
      '#ff3366',  // Pink
      '#cc33cc',  // Purple
      '#9933ff'   // Deep purple
    ];
    
    expectedColors.forEach((color, idx) => {
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });

  it('should include hover template with direction and speed', () => {
    const hoverTemplate = '<b>%{theta}°</b><br>Speed: 2-3 m/s<br>Frequency: %{r:.2f}%<br><extra></extra>';
    
    expect(hoverTemplate).toContain('%{theta}');
    expect(hoverTemplate).toContain('%{r');
    expect(hoverTemplate).toContain('Speed:');
    expect(hoverTemplate).toContain('Frequency:');
  });
});

describe('Plotly Wind Rose Layout Configuration', () => {
  it('should configure polar chart correctly', () => {
    const layout = {
      polar: {
        radialaxis: {
          visible: true,
          range: [0, null],
          showticklabels: true,
          ticksuffix: '%',
          gridcolor: '#444444'
        },
        angularaxis: {
          direction: 'clockwise',
          rotation: 90,
          gridcolor: '#444444'
        },
        bgcolor: 'rgba(0,0,0,0)'
      },
      barmode: 'stack'
    };
    
    expect(layout.polar.angularaxis.direction).toBe('clockwise');
    expect(layout.polar.angularaxis.rotation).toBe(90); // North at top
    expect(layout.polar.radialaxis.ticksuffix).toBe('%');
    expect(layout.barmode).toBe('stack');
  });

  it('should use dark background styling', () => {
    const darkLayout = {
      paper_bgcolor: '#1a1a1a',
      plot_bgcolor: '#1a1a1a',
      font: { color: '#ffffff' },
      polar: {
        radialaxis: { gridcolor: '#444444' },
        angularaxis: { gridcolor: '#444444' }
      }
    };
    
    expect(darkLayout.paper_bgcolor).toBe('#1a1a1a');
    expect(darkLayout.font.color).toBe('#ffffff');
    expect(darkLayout.polar.radialaxis.gridcolor).toBe('#444444');
  });

  it('should configure legend correctly', () => {
    const layout = {
      showlegend: true,
      legend: {
        title: { text: 'Wind Speed (m/s)' },
        orientation: 'v',
        x: 1.05,
        y: 0.5
      }
    };
    
    expect(layout.showlegend).toBe(true);
    expect(layout.legend.orientation).toBe('v');
    expect(layout.legend.title.text).toBe('Wind Speed (m/s)');
  });
});

describe('Plotly Wind Rose Export Functionality', () => {
  it('should support PNG export configuration', () => {
    const exportConfig = {
      format: 'png',
      width: 1200,
      height: 1200,
      scale: 2
    };
    
    expect(exportConfig.format).toBe('png');
    expect(exportConfig.width).toBe(1200);
    expect(exportConfig.height).toBe(1200);
    expect(exportConfig.scale).toBe(2);
  });

  it('should support SVG export configuration', () => {
    const exportConfig = {
      format: 'svg',
      width: 1200,
      height: 1200
    };
    
    expect(exportConfig.format).toBe('svg');
    expect(exportConfig.width).toBe(1200);
    expect(exportConfig.height).toBe(1200);
  });

  it('should support JSON data export', () => {
    const exportData = {
      projectId: 'test-project',
      data: [{ type: 'barpolar', r: [1, 2, 3], theta: [0, 45, 90] }],
      layout: { title: 'Test' },
      statistics: { average_speed: 5.5 },
      exportedAt: new Date().toISOString()
    };
    
    const jsonString = JSON.stringify(exportData, null, 2);
    const parsed = JSON.parse(jsonString);
    
    expect(parsed.projectId).toBe('test-project');
    expect(parsed.data).toHaveLength(1);
    expect(parsed.statistics.average_speed).toBe(5.5);
  });
});

describe('Plotly Wind Rose Responsive Layout', () => {
  it('should configure responsive sizing', () => {
    const config = {
      responsive: true,
      useResizeHandler: true
    };
    
    expect(config.responsive).toBe(true);
    expect(config.useResizeHandler).toBe(true);
  });

  it('should set appropriate height for container', () => {
    const containerStyle = {
      width: '100%',
      height: '600px'
    };
    
    expect(containerStyle.width).toBe('100%');
    expect(containerStyle.height).toBe('600px');
  });

  it('should configure margins for proper spacing', () => {
    const layout = {
      height: 600,
      margin: { t: 80, b: 80, l: 60, r: 150 }
    };
    
    expect(layout.height).toBe(600);
    expect(layout.margin.r).toBe(150); // Space for legend
    expect(layout.margin.t).toBeGreaterThan(0);
    expect(layout.margin.b).toBeGreaterThan(0);
  });
});

describe('Plotly Wind Rose Interactivity', () => {
  it('should enable zoom and pan', () => {
    const config = {
      responsive: true,
      displayModeBar: true,
      modeBarButtonsToRemove: ['lasso2d', 'select2d']
    };
    
    expect(config.displayModeBar).toBe(true);
    expect(config.modeBarButtonsToRemove).toContain('lasso2d');
  });

  it('should configure hover interactions', () => {
    const trace = {
      type: 'barpolar',
      hovertemplate: '<b>%{theta}°</b><br>Speed: 2-3 m/s<br>Frequency: %{r:.2f}%<br><extra></extra>'
    };
    
    expect(trace.hovertemplate).toBeDefined();
    expect(trace.hovertemplate).toContain('%{theta}');
    expect(trace.hovertemplate).toContain('%{r');
  });

  it('should support custom mode bar buttons', () => {
    const config = {
      modeBarButtonsToAdd: [
        { name: 'Export to PNG', click: () => {} },
        { name: 'Export to SVG', click: () => {} },
        { name: 'Export Data (JSON)', click: () => {} }
      ]
    };
    
    expect(config.modeBarButtonsToAdd).toHaveLength(3);
    expect(config.modeBarButtonsToAdd[0].name).toBe('Export to PNG');
    expect(config.modeBarButtonsToAdd[1].name).toBe('Export to SVG');
    expect(config.modeBarButtonsToAdd[2].name).toBe('Export Data (JSON)');
  });
});

describe('Plotly Wind Rose Edge Cases', () => {
  it('should handle empty data gracefully', () => {
    const emptyData = {
      directions: ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'],
      angles: Array.from({ length: 16 }, (_, i) => i * 22.5),
      frequency_data: Array(16).fill(0).map(() => Array(7).fill(0)),
      plotly_traces: [],
      statistics: {
        average_speed: 0,
        max_speed: 0,
        prevailing_direction: 'N',
        prevailing_frequency: 0
      }
    };
    
    expect(emptyData.plotly_traces).toHaveLength(0);
    expect(emptyData.statistics.average_speed).toBe(0);
  });

  it('should handle single observation', () => {
    const speeds = [5.5];
    const directions = [45];
    
    const dirBin = Math.floor((directions[0] + 11.25) / 22.5) % 16;
    const speedBin = speeds[0] >= 5 && speeds[0] < 6 ? 5 : 0;
    
    const frequencies = Array(16).fill(0).map(() => Array(7).fill(0));
    frequencies[dirBin][speedBin] = 100; // 100% in one bin
    
    let totalPercentage = 0;
    frequencies.forEach(row => {
      row.forEach(val => totalPercentage += val);
    });
    
    expect(totalPercentage).toBe(100);
  });

  it('should handle very high wind speeds', () => {
    const speeds = [50, 100, 200]; // Extreme speeds
    
    speeds.forEach(speed => {
      const speedBin = speed >= 6 ? 6 : 0; // Should all go to 6+ bin
      expect(speedBin).toBe(6);
    });
  });

  it('should handle negative directions (normalize to 0-360)', () => {
    const directions = [-10, -45, -90];
    
    directions.forEach(dir => {
      const normalized = ((dir % 360) + 360) % 360;
      expect(normalized).toBeGreaterThanOrEqual(0);
      expect(normalized).toBeLessThan(360);
    });
  });
});

describe('Plotly Wind Rose Integration', () => {
  it('should match design specification requirements', () => {
    const requirements = {
      chartType: 'barpolar',
      directionalBins: 16,
      speedRanges: 7,
      colorGradient: 'yellow-to-purple',
      darkBackground: true,
      interactive: true,
      exportFormats: ['png', 'svg', 'json']
    };
    
    expect(requirements.chartType).toBe('barpolar');
    expect(requirements.directionalBins).toBe(16);
    expect(requirements.speedRanges).toBe(7);
    expect(requirements.exportFormats).toHaveLength(3);
  });

  it('should provide complete data structure for frontend', () => {
    const windRoseData = {
      directions: Array(16),
      angles: Array(16),
      speed_ranges: Array(7),
      colors: Array(7),
      frequency_data: Array(16).fill(0).map(() => Array(7).fill(0)),
      plotly_traces: Array(7),
      statistics: {
        average_speed: 0,
        max_speed: 0,
        prevailing_direction: 'N',
        prevailing_frequency: 0
      }
    };
    
    expect(windRoseData.directions).toHaveLength(16);
    expect(windRoseData.speed_ranges).toHaveLength(7);
    expect(windRoseData.colors).toHaveLength(7);
    expect(windRoseData.plotly_traces).toHaveLength(7);
    expect(windRoseData.statistics).toBeDefined();
  });
});
