/**
 * Tests for VisualizationDataParser utility
 */

import { VisualizationDataParser } from '../VisualizationDataParser';

describe('VisualizationDataParser', () => {
  const mockResponseData = {
    visualizations: {
      wind_rose: 'https://s3.amazonaws.com/bucket/wind_rose.png',
      performance_charts: [
        'https://s3.amazonaws.com/bucket/chart1.png',
        'https://s3.amazonaws.com/bucket/chart2.png'
      ],
      wake_analysis: 'https://s3.amazonaws.com/bucket/wake.png',
      elevation_profile: 'https://s3.amazonaws.com/bucket/elevation.png',
      interactive_map: 'https://s3.amazonaws.com/bucket/map.html',
      complete_report: 'https://s3.amazonaws.com/bucket/report.pdf'
    },
    mapHtml: '<html><body>Interactive Map</body></html>',
    chartImages: {
      wakeMap: 'https://s3.amazonaws.com/bucket/legacy_wake.png'
    }
  };

  describe('parseVisualizationData', () => {
    it('should extract all visualization data from response', () => {
      const result = VisualizationDataParser.parseVisualizationData(mockResponseData);
      
      expect(result.wind_rose).toBe('https://s3.amazonaws.com/bucket/wind_rose.png');
      expect(result.performance_charts).toEqual([
        'https://s3.amazonaws.com/bucket/chart1.png',
        'https://s3.amazonaws.com/bucket/chart2.png'
      ]);
      expect(result.wake_analysis).toBe('https://s3.amazonaws.com/bucket/wake.png');
      expect(result.elevation_profile).toBe('https://s3.amazonaws.com/bucket/elevation.png');
      expect(result.interactive_map).toBe('https://s3.amazonaws.com/bucket/map.html');
      expect(result.complete_report).toBe('https://s3.amazonaws.com/bucket/report.pdf');
    });

    it('should handle legacy chartImages format', () => {
      const legacyData = {
        chartImages: {
          wakeMap: 'https://s3.amazonaws.com/bucket/legacy_wake.png',
          performanceChart: 'https://s3.amazonaws.com/bucket/legacy_perf.png'
        }
      };
      
      const result = VisualizationDataParser.parseVisualizationData(legacyData);
      
      expect(result.wake_analysis).toBe('https://s3.amazonaws.com/bucket/legacy_wake.png');
      expect(result.performance_charts).toEqual(['https://s3.amazonaws.com/bucket/legacy_perf.png']);
    });

    it('should handle empty or null data gracefully', () => {
      expect(VisualizationDataParser.parseVisualizationData(null)).toEqual({});
      expect(VisualizationDataParser.parseVisualizationData({})).toEqual({});
      expect(VisualizationDataParser.parseVisualizationData({ visualizations: {} })).toEqual({});
    });
  });

  describe('getAvailableVisualizations', () => {
    it('should return list of available visualization types', () => {
      const data = VisualizationDataParser.parseVisualizationData(mockResponseData);
      const available = VisualizationDataParser.getAvailableVisualizations(data);
      
      expect(available).toContain('wind_rose');
      expect(available).toContain('performance_charts');
      expect(available).toContain('wake_analysis');
      expect(available).toContain('elevation_profile');
      expect(available).toContain('interactive_map');
      expect(available).toContain('complete_report');
    });

    it('should exclude undefined or empty values', () => {
      const data = {
        wind_rose: 'https://example.com/chart.png',
        performance_charts: [],
        wake_analysis: undefined,
        elevation_profile: null,
        interactive_map: ''
      };
      
      const available = VisualizationDataParser.getAvailableVisualizations(data);
      
      expect(available).toEqual(['wind_rose']);
    });
  });

  describe('organizeVisualizationsByCategory', () => {
    it('should organize visualizations into logical categories', () => {
      const data = VisualizationDataParser.parseVisualizationData(mockResponseData);
      const categorized = VisualizationDataParser.organizeVisualizationsByCategory(data);
      
      expect(categorized.wind_analysis.wind_rose).toBe('https://s3.amazonaws.com/bucket/wind_rose.png');
      expect(categorized.performance_analysis.performance_charts).toEqual([
        'https://s3.amazonaws.com/bucket/chart1.png',
        'https://s3.amazonaws.com/bucket/chart2.png'
      ]);
      expect(categorized.wake_analysis.wake_analysis).toBe('https://s3.amazonaws.com/bucket/wake.png');
      expect(categorized.terrain_analysis.elevation_profile).toBe('https://s3.amazonaws.com/bucket/elevation.png');
      expect(categorized.interactive_maps.interactive_map).toBe('https://s3.amazonaws.com/bucket/map.html');
      expect(categorized.reports.complete_report).toBe('https://s3.amazonaws.com/bucket/report.pdf');
    });
  });

  describe('hasVisualizationsInCategory', () => {
    it('should correctly identify categories with visualizations', () => {
      const data = VisualizationDataParser.parseVisualizationData(mockResponseData);
      const categorized = VisualizationDataParser.organizeVisualizationsByCategory(data);
      
      expect(VisualizationDataParser.hasVisualizationsInCategory(categorized, 'wind_analysis')).toBe(true);
      expect(VisualizationDataParser.hasVisualizationsInCategory(categorized, 'performance_analysis')).toBe(true);
      expect(VisualizationDataParser.hasVisualizationsInCategory(categorized, 'wake_analysis')).toBe(true);
      expect(VisualizationDataParser.hasVisualizationsInCategory(categorized, 'terrain_analysis')).toBe(true);
    });

    it('should return false for empty categories', () => {
      const emptyCategorized = {
        wind_analysis: {},
        performance_analysis: {},
        wake_analysis: {},
        terrain_analysis: {},
        interactive_maps: {},
        reports: {}
      };
      
      expect(VisualizationDataParser.hasVisualizationsInCategory(emptyCategorized, 'wind_analysis')).toBe(false);
    });
  });

  describe('getVisualizationCount', () => {
    it('should count total number of visualizations', () => {
      const data = VisualizationDataParser.parseVisualizationData(mockResponseData);
      const count = VisualizationDataParser.getVisualizationCount(data);
      
      // wind_rose(1) + performance_charts(2) + wake_analysis(1) + elevation_profile(1) + interactive_map(1) + complete_report(1) = 7
      expect(count).toBe(7);
    });

    it('should handle empty data', () => {
      const count = VisualizationDataParser.getVisualizationCount({});
      expect(count).toBe(0);
    });
  });

  describe('isValidVisualizationUrl', () => {
    it('should validate S3 URLs with proper extensions', () => {
      expect(VisualizationDataParser.isValidVisualizationUrl('https://s3.amazonaws.com/bucket/chart.png')).toBe(true);
      expect(VisualizationDataParser.isValidVisualizationUrl('https://bucket.s3.us-west-2.amazonaws.com/map.html')).toBe(true);
      expect(VisualizationDataParser.isValidVisualizationUrl('https://localhost:3000/chart.svg')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(VisualizationDataParser.isValidVisualizationUrl('')).toBe(false);
      expect(VisualizationDataParser.isValidVisualizationUrl('not-a-url')).toBe(false);
      expect(VisualizationDataParser.isValidVisualizationUrl('https://example.com/file.txt')).toBe(false);
      expect(VisualizationDataParser.isValidVisualizationUrl('https://malicious.com/chart.png')).toBe(false);
    });
  });
});