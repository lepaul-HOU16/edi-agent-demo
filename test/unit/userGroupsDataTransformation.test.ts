import { describe, it } from 'mocha';
import { expect } from 'chai';

// Mock the transformation function since it's not exported
// In a real implementation, this would be exported from the component file
function transformUserGroupsData(apiResponse: any): any[] {
  if (!apiResponse || !apiResponse.items || !Array.isArray(apiResponse.items)) {
    console.warn('Invalid API response structure for user groups:', apiResponse);
    return [];
  }

  return apiResponse.items.map((item: any, index: number) => {
    // Defensive checks for required fields
    const transformedItem = {
      name: item.name || `Unknown Group ${index + 1}`,
      description: item.description || '',
      dataPartition: item.dataPartition || 'osdu',
      createdBy: item.createdBy || 'unknown',
      createdAt: item.createdAt || '',
      updatedBy: item.updatedBy || '',
      updatedAt: item.updatedAt || '',
      memberRole: item.memberRole || 'MEMBER',
      memberSince: item.memberSince || item.addedAt || '',
      addedBy: item.addedBy || 'unknown'
    };

    // Log any missing critical fields for debugging
    if (!item.name) {
      console.warn('Missing group name in API response item:', item);
    }
    if (!item.memberRole) {
      console.warn('Missing memberRole in API response item:', item);
    }
    if (!item.memberSince && !item.addedAt) {
      console.warn('Missing memberSince and addedAt in API response item:', item);
    }

    return transformedItem;
  });
}

describe('User Groups Data Transformation', () => {
  it('should transform valid API response correctly', () => {
    const mockApiResponse = {
      items: [
        {
          name: 'service.entitlements.admin@osdu.dataservices.energy',
          description: 'Entitlements service administrators',
          dataPartition: 'osdu',
          createdBy: 'system',
          createdAt: '2025-08-10T14:09:19.401Z',
          updatedBy: 'system',
          updatedAt: '2025-08-10T14:09:19.401Z',
          memberRole: 'OWNER',
          memberSince: '2025-08-10T14:09:19.401Z',
          addedBy: 'system'
        }
      ],
      pagination: {
        nextToken: null,
        hasNextPage: false,
        totalCount: 1
      }
    };

    const result = transformUserGroupsData(mockApiResponse);

    expect(result).to.have.length(1);
    expect(result[0]).to.deep.equal({
      name: 'service.entitlements.admin@osdu.dataservices.energy',
      description: 'Entitlements service administrators',
      dataPartition: 'osdu',
      createdBy: 'system',
      createdAt: '2025-08-10T14:09:19.401Z',
      updatedBy: 'system',
      updatedAt: '2025-08-10T14:09:19.401Z',
      memberRole: 'OWNER',
      memberSince: '2025-08-10T14:09:19.401Z',
      addedBy: 'system'
    });
  });

  it('should handle missing fields with defensive defaults', () => {
    const mockApiResponse = {
      items: [
        {
          // Missing name, memberRole, memberSince, addedBy
          description: 'Test group',
          dataPartition: 'osdu'
        }
      ]
    };

    const result = transformUserGroupsData(mockApiResponse);

    expect(result).to.have.length(1);
    expect(result[0]).to.deep.equal({
      name: 'Unknown Group 1',
      description: 'Test group',
      dataPartition: 'osdu',
      createdBy: 'unknown',
      createdAt: '',
      updatedBy: '',
      updatedAt: '',
      memberRole: 'MEMBER',
      memberSince: '',
      addedBy: 'unknown'
    });
  });

  it('should handle null or undefined API response', () => {
    expect(transformUserGroupsData(null)).to.deep.equal([]);
    expect(transformUserGroupsData(undefined)).to.deep.equal([]);
    expect(transformUserGroupsData({})).to.deep.equal([]);
    expect(transformUserGroupsData({ items: null })).to.deep.equal([]);
  });

  it('should use addedAt as fallback for memberSince', () => {
    const mockApiResponse = {
      items: [
        {
          name: 'test-group',
          // Missing memberSince but has addedAt
          addedAt: '2025-08-10T14:09:19.401Z',
          memberRole: 'MEMBER',
          addedBy: 'admin'
        }
      ]
    };

    const result = transformUserGroupsData(mockApiResponse);

    expect(result[0].memberSince).to.equal('2025-08-10T14:09:19.401Z');
  });

  it('should handle empty items array', () => {
    const mockApiResponse = {
      items: [],
      pagination: {
        nextToken: null,
        hasNextPage: false,
        totalCount: 0
      }
    };

    const result = transformUserGroupsData(mockApiResponse);

    expect(result).to.deep.equal([]);
  });
});