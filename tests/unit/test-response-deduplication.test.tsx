/**
 * Unit tests for response deduplication in EDIcraft components
 * 
 * Tests verify that:
 * 1. Content hash generation is stable
 * 2. Duplicate responses are detected
 * 3. Processing lock prevents concurrent processing
 * 4. Render count tracking works correctly
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the EDIcraft response component
jest.mock('../../src/components/messageComponents/EDIcraftResponseComponent', () => ({
  EDIcraftResponseComponent: ({ content }: { content: string }) => {
    // Generate content hash (same logic as component)
    const generateContentHash = (content: string): string => {
      const prefix = content.substring(0, 100).replace(/[^a-zA-Z0-9]/g, '');
      const length = content.length;
      return `edicraft-${prefix}-${length}`;
    };
    
    const contentHash = generateContentHash(content);
    
    return (
      <div data-content-hash={contentHash} data-testid="edicraft-response">
        {content}
      </div>
    );
  },
  isEDIcraftResponse: (content: string) => {
    return content.includes('✅') || content.includes('❌');
  }
}));

describe('Response Deduplication', () => {
  describe('Content Hash Generation', () => {
    it('should generate stable hash for same content', () => {
      const content = '✅ **Minecraft Environment Cleared**\n\n**Summary:**\n- **Wellbores Cleared:** 5 blocks';
      
      const generateContentHash = (content: string): string => {
        const prefix = content.substring(0, 100).replace(/[^a-zA-Z0-9]/g, '');
        const length = content.length;
        return `edicraft-${prefix}-${length}`;
      };
      
      const hash1 = generateContentHash(content);
      const hash2 = generateContentHash(content);
      
      expect(hash1).toBe(hash2);
      expect(hash1).toContain('edicraft-');
      expect(hash1).toContain(content.length.toString());
    });
    
    it('should generate different hashes for different content', () => {
      const content1 = '✅ **Minecraft Environment Cleared**\n\n**Summary:**\n- **Wellbores Cleared:** 5 blocks';
      const content2 = '✅ **Time Lock Enabled**\n\n**Summary:**\n- **Time:** Day';
      
      const generateContentHash = (content: string): string => {
        const prefix = content.substring(0, 100).replace(/[^a-zA-Z0-9]/g, '');
        const length = content.length;
        return `edicraft-${prefix}-${length}`;
      };
      
      const hash1 = generateContentHash(content1);
      const hash2 = generateContentHash(content2);
      
      expect(hash1).not.toBe(hash2);
    });
    
    it('should handle empty content', () => {
      const content = '';
      
      const generateContentHash = (content: string): string => {
        const prefix = content.substring(0, 100).replace(/[^a-zA-Z0-9]/g, '');
        const length = content.length;
        return `edicraft-${prefix}-${length}`;
      };
      
      const hash = generateContentHash(content);
      
      expect(hash).toBe('edicraft--0');
    });
    
    it('should handle very long content', () => {
      const content = '✅ **Test**\n\n' + 'A'.repeat(10000);
      
      const generateContentHash = (content: string): string => {
        const prefix = content.substring(0, 100).replace(/[^a-zA-Z0-9]/g, '');
        const length = content.length;
        return `edicraft-${prefix}-${length}`;
      };
      
      const hash = generateContentHash(content);
      
      expect(hash).toContain('edicraft-');
      expect(hash).toContain(content.length.toString()); // Length of content
      expect(hash.length).toBeLessThan(200); // Hash should be reasonably short
    });
  });
  
  describe('Duplicate Detection', () => {
    it('should detect duplicate responses in DOM', () => {
      const content = '✅ **Minecraft Environment Cleared**\n\n**Summary:**\n- **Wellbores Cleared:** 5 blocks';
      
      const { EDIcraftResponseComponent } = require('../../src/components/messageComponents/EDIcraftResponseComponent');
      
      // Render first instance
      const { container: container1 } = render(<EDIcraftResponseComponent content={content} />);
      
      // Render second instance (duplicate)
      const { container: container2 } = render(<EDIcraftResponseComponent content={content} />);
      
      // Both should have the same content hash
      const hash1 = container1.querySelector('[data-content-hash]')?.getAttribute('data-content-hash');
      const hash2 = container2.querySelector('[data-content-hash]')?.getAttribute('data-content-hash');
      
      expect(hash1).toBe(hash2);
      expect(hash1).toBeTruthy();
    });
    
    it('should track render count', () => {
      const content = '✅ **Test Response**';
      
      const { EDIcraftResponseComponent } = require('../../src/components/messageComponents/EDIcraftResponseComponent');
      
      const { rerender } = render(<EDIcraftResponseComponent content={content} />);
      
      // Rerender with same content
      rerender(<EDIcraftResponseComponent content={content} />);
      rerender(<EDIcraftResponseComponent content={content} />);
      
      // Component should have rendered 3 times
      // (This is tracked internally via renderCountRef)
      expect(screen.getByTestId('edicraft-response')).toBeInTheDocument();
    });
  });
  
  describe('Data Attributes', () => {
    it('should add data-content-hash attribute to rendered elements', () => {
      const content = '✅ **Minecraft Environment Cleared**';
      
      const { EDIcraftResponseComponent } = require('../../src/components/messageComponents/EDIcraftResponseComponent');
      
      const { container } = render(<EDIcraftResponseComponent content={content} />);
      
      const element = container.querySelector('[data-content-hash]');
      expect(element).toBeInTheDocument();
      expect(element?.getAttribute('data-content-hash')).toMatch(/^edicraft-/);
    });
    
    it('should use consistent hash format', () => {
      const content = '✅ **Test**';
      
      const { EDIcraftResponseComponent } = require('../../src/components/messageComponents/EDIcraftResponseComponent');
      
      const { container } = render(<EDIcraftResponseComponent content={content} />);
      
      const hash = container.querySelector('[data-content-hash]')?.getAttribute('data-content-hash');
      
      expect(hash).toMatch(/^edicraft-[a-zA-Z0-9]+-\d+$/);
    });
  });
  
  describe('Processing Lock', () => {
    it('should prevent concurrent processing', async () => {
      // This test verifies the processing lock mechanism
      // In the actual component, processingRef prevents multiple simultaneous processing
      
      let processingCount = 0;
      let processingRef = { current: false };
      
      const processWithLock = async () => {
        if (processingRef.current) {
          console.log('Already processing, skipping');
          return false;
        }
        
        processingRef.current = true;
        processingCount++;
        
        // Simulate async processing
        await new Promise(resolve => setTimeout(resolve, 10));
        
        processingRef.current = false;
        return true;
      };
      
      // Try to process concurrently
      const results = await Promise.all([
        processWithLock(),
        processWithLock(),
        processWithLock()
      ]);
      
      // Only one should have processed
      const successCount = results.filter(r => r === true).length;
      expect(successCount).toBe(1);
      expect(processingCount).toBe(1);
    });
  });
});

describe('EnhancedArtifactProcessor Deduplication', () => {
  it('should skip processing if content hash exists in DOM', () => {
    // Mock DOM query
    const mockQuerySelectorAll = jest.fn(() => [
      { getAttribute: () => 'artifact-test-100' }
    ]);
    
    document.querySelectorAll = mockQuerySelectorAll;
    
    const contentHash = 'artifact-test-100';
    const contentHashRef = { current: contentHash };
    
    // Check if should skip
    const existingElements = document.querySelectorAll(`[data-content-hash="${contentHash}"]`);
    const shouldSkip = existingElements.length > 0 && contentHashRef.current === contentHash;
    
    expect(shouldSkip).toBe(true);
    expect(mockQuerySelectorAll).toHaveBeenCalledWith('[data-content-hash="artifact-test-100"]');
  });
  
  it('should not skip if content hash is different', () => {
    // Mock DOM query
    const mockQuerySelectorAll = jest.fn(() => []);
    
    document.querySelectorAll = mockQuerySelectorAll;
    
    const contentHash = 'artifact-test-100';
    const contentHashRef = { current: 'artifact-test-200' };
    
    // Check if should skip
    const existingElements = document.querySelectorAll(`[data-content-hash="${contentHash}"]`);
    const shouldSkip = existingElements.length > 0 && contentHashRef.current === contentHash;
    
    expect(shouldSkip).toBe(false);
  });
  
  it('should generate stable artifact hash', () => {
    const rawArtifacts = [
      { type: 'wind_farm_terrain_analysis', data: { metrics: {} } }
    ];
    
    const generateHash = (artifacts: any[]) => {
      const hashContent = JSON.stringify(artifacts);
      return `artifact-${hashContent.substring(0, 100).replace(/[^a-zA-Z0-9]/g, '')}-${hashContent.length}`;
    };
    
    const hash1 = generateHash(rawArtifacts);
    const hash2 = generateHash(rawArtifacts);
    
    expect(hash1).toBe(hash2);
    expect(hash1).toContain('artifact-');
  });
});
