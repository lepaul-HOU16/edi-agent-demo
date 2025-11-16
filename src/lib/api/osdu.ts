import { apiPost, apiGet } from './client';

export interface OSDUSearchRequest {
  query: string;
  dataPartition?: string;
  maxResults?: number;
}

export interface OSDUSearchResponse {
  answer: string;
  recordCount: number;
  records: Array<any>;
}

export interface OSDUWellResponse {
  id: string;
  [key: string]: any;
}

/**
 * Search OSDU data
 */
export async function searchOSDU(request: OSDUSearchRequest): Promise<OSDUSearchResponse> {
  return apiPost('/api/osdu/search', request);
}

/**
 * Get specific well data from OSDU
 */
export async function getOSDUWell(wellId: string): Promise<OSDUWellResponse> {
  return apiGet(`/api/osdu/wells/${wellId}`);
}
