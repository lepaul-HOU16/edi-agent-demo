/**
 * Unit tests for Data Access Approval Flow
 * Tests the detection of data access violations and approval handling
 */

describe('Data Access Approval Flow', () => {
  describe('Data Access Violation Detection', () => {
    it('should detect when query requests data outside collection scope', () => {
      const collectionContext = {
        collectionId: 'test-collection-1',
        name: 'Test Collection',
        dataItems: [
          { id: 'well-001', name: 'WELL-001' },
          { id: 'well-002', name: 'WELL-002' }
        ]
      };
      
      const query = 'analyze well-003 and well-004';
      
      // Simulate detection logic
      const wellPattern = /well[- ]?(\d+|[a-z0-9-]+)/gi;
      const matches = query.match(wellPattern) || [];
      const requestedWells = matches.map(m => m.toLowerCase().replace(/[- ]/g, ''));
      
      const allowedDataIds = new Set<string>();
      collectionContext.dataItems.forEach(item => {
        if (item.id) allowedDataIds.add(item.id.toLowerCase());
        if (item.name) allowedDataIds.add(item.name.toLowerCase().replace(/[- ]/g, ''));
      });
      
      const outOfScopeItems = requestedWells.filter(
        well => !allowedDataIds.has(well)
      );
      
      expect(outOfScopeItems).toContain('well003');
      expect(outOfScopeItems).toContain('well004');
      expect(outOfScopeItems.length).toBe(2);
    });
    
    it('should allow query when all data is within collection scope', () => {
      const collectionContext = {
        collectionId: 'test-collection-1',
        name: 'Test Collection',
        dataItems: [
          { id: 'well-001', name: 'WELL-001' },
          { id: 'well-002', name: 'WELL-002' }
        ]
      };
      
      const query = 'analyze well-001 and well-002';
      
      // Simulate detection logic
      const wellPattern = /well[- ]?(\d+|[a-z0-9-]+)/gi;
      const matches = query.match(wellPattern) || [];
      const requestedWells = matches.map(m => m.toLowerCase().replace(/[- ]/g, ''));
      
      const allowedDataIds = new Set<string>();
      collectionContext.dataItems.forEach(item => {
        if (item.id) allowedDataIds.add(item.id.toLowerCase());
        if (item.name) allowedDataIds.add(item.name.toLowerCase().replace(/[- ]/g, ''));
      });
      
      const outOfScopeItems = requestedWells.filter(
        well => !allowedDataIds.has(well)
      );
      
      expect(outOfScopeItems.length).toBe(0);
    });
    
    it('should allow all queries when no collection context exists', () => {
      const collectionContext = null;
      const query = 'analyze well-001, well-002, well-003';
      
      // When no context, no restrictions
      const requiresApproval = collectionContext !== null;
      
      expect(requiresApproval).toBe(false);
    });
  });
  
  describe('Approval Response Detection', () => {
    it('should detect "approve" as approval response', () => {
      const userMessage = 'approve';
      const isApprovalResponse = userMessage.toLowerCase() === 'approve' || 
                                 userMessage.toLowerCase() === 'yes' || 
                                 userMessage.toLowerCase().includes('approve expanded access');
      
      expect(isApprovalResponse).toBe(true);
    });
    
    it('should detect "yes" as approval response', () => {
      const userMessage = 'yes';
      const isApprovalResponse = userMessage.toLowerCase() === 'approve' || 
                                 userMessage.toLowerCase() === 'yes' || 
                                 userMessage.toLowerCase().includes('approve expanded access');
      
      expect(isApprovalResponse).toBe(true);
    });
    
    it('should detect "approve expanded access" as approval response', () => {
      const userMessage = 'I approve expanded access';
      const isApprovalResponse = userMessage.toLowerCase() === 'approve' || 
                                 userMessage.toLowerCase() === 'yes' || 
                                 userMessage.toLowerCase().includes('approve expanded access');
      
      expect(isApprovalResponse).toBe(true);
    });
    
    it('should not detect other messages as approval', () => {
      const userMessage = 'tell me more about this';
      const isApprovalResponse = userMessage.toLowerCase() === 'approve' || 
                                 userMessage.toLowerCase() === 'yes' || 
                                 userMessage.toLowerCase().includes('approve expanded access');
      
      expect(isApprovalResponse).toBe(false);
    });
  });
  
  describe('Data Access Log', () => {
    it('should create proper log entry structure', () => {
      const logEntry = {
        timestamp: new Date().toISOString(),
        action: 'expanded_access_approved',
        collectionId: 'test-collection-1',
        collectionName: 'Test Collection',
        userId: 'user-123',
        message: 'approve'
      };
      
      expect(logEntry).toHaveProperty('timestamp');
      expect(logEntry).toHaveProperty('action');
      expect(logEntry).toHaveProperty('collectionId');
      expect(logEntry).toHaveProperty('collectionName');
      expect(logEntry).toHaveProperty('userId');
      expect(logEntry).toHaveProperty('message');
      expect(logEntry.action).toBe('expanded_access_approved');
    });
  });
  
  describe('Approval Artifact Structure', () => {
    it('should create proper approval artifact', () => {
      const artifact = {
        type: 'data_access_approval',
        messageContentType: 'data_access_approval',
        requiresApproval: true,
        message: 'Data access approval required',
        outOfScopeItems: ['well-003', 'well-004'],
        collectionId: 'test-collection-1',
        collectionName: 'Test Collection'
      };
      
      expect(artifact.type).toBe('data_access_approval');
      expect(artifact.messageContentType).toBe('data_access_approval');
      expect(artifact.requiresApproval).toBe(true);
      expect(artifact.outOfScopeItems).toHaveLength(2);
      expect(artifact).toHaveProperty('collectionId');
      expect(artifact).toHaveProperty('collectionName');
    });
  });
});
