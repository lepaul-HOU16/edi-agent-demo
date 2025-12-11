/**
 * UNUSED - EDI Platform API Client
 * 
 * This file is commented out because we're using Option B (colleague's serverless API)
 * instead of direct EDI Platform integration with OAuth2.
 * 
 * Kept for reference in case we need to switch to direct integration later.
 */

/*
import { OSDUOAuth2Client } from './oauth2Client';

export interface EDISearchRequest {
  kind: string;
  query?: string;
  limit?: number;
  offset?: number;
  returnedFields?: string[];
  sort?: {
    field: string[];
    order: string[];
  };
  aggregateBy?: string;
}

export interface EDISearchResponse {
  results: any[];
  totalCount: number;
  metadata?: {
    totalFound?: number;
    returned?: number;
    filtered?: number;
    authorized?: number;
  };
}

export class EDIPlatformClient {
  private baseUrl: string;
  private oauth2Client: OSDUOAuth2Client;

  constructor(baseUrl: string, oauth2Client: OSDUOAuth2Client) {
    this.baseUrl = baseUrl;
    this.oauth2Client = oauth2Client;
  }

  /**
   * Execute OSDU search query
   */
  async search(request: EDISearchRequest): Promise<EDISearchResponse> {
    console.log('🔍 EDI Platform search request:', JSON.stringify(request, null, 2));

    // Get OAuth2 access token
    const accessToken = await this.oauth2Client.getAccessToken();

    // Call EDI Platform search API
    const response = await fetch(`${this.baseUrl}/api/search/v2/query/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'data-partition-id': 'osdu' // Required by OSDU
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ EDI Platform API error:', response.status, errorText);
      throw new Error(`EDI Platform API request failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ EDI Platform search successful:', data.results?.length || 0, 'results');

    return {
      results: data.results || [],
      totalCount: data.totalCount || data.results?.length || 0,
      metadata: data.metadata
    };
  }

  /**
   * Transform EDI Platform well record to frontend format
   */
  transformWellRecord(record: any): any {
    const data = record.data || {};
    const spatialLocation = data.SpatialLocation?.Wgs84Coordinates || {};
    const verticalMeasurement = data.VerticalMeasurement?.Depth || {};

    return {
      id: record.id,
      name: data.FacilityName || record.id,
      type: 'osdu:wks:master-data--Well:1.0.0',
      operator: data.operator || 'Unknown',
      location: data.country || 'Unknown',
      basin: data.basin || 'Unknown',
      country: data.country || 'Unknown',
      depth: verticalMeasurement.Value ? `${verticalMeasurement.Value}${verticalMeasurement.UOM || 'm'}` : 'Unknown',
      status: data.status || 'Unknown',
      dataSource: 'OSDU',
      latitude: spatialLocation.Latitude || null,
      longitude: spatialLocation.Longitude || null
    };
  }
}
*/
