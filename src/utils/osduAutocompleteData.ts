/**
 * OSDU Autocomplete Data Sources
 * 
 * Provides autocomplete suggestions for common OSDU field values.
 * Data is organized by field type and includes the most common values
 * used in the energy industry.
 * 
 * Requirements: 11.1, 11.2, 11.3, 11.5
 */

export interface AutocompleteDataSource {
  field: string;
  values: string[];
  description?: string;
}

/**
 * Operator Names - Top 10 most common operating companies
 */
export const OPERATOR_AUTOCOMPLETE: string[] = [
  'Shell',
  'BP',
  'Equinor',
  'TotalEnergies',
  'ExxonMobil',
  'Chevron',
  'ConocoPhillips',
  'Eni',
  'Repsol',
  'Petrobras',
  'Saudi Aramco',
  'CNOOC',
  'Petronas',
  'ADNOC'
];

/**
 * Country Names - Top countries for oil & gas operations
 */
export const COUNTRY_AUTOCOMPLETE: string[] = [
  'Norway',
  'United Kingdom',
  'United States',
  'Brazil',
  'Nigeria',
  'Angola',
  'Australia',
  'Canada',
  'Mexico',
  'Netherlands',
  'Denmark',
  'Saudi Arabia',
  'United Arab Emirates',
  'Malaysia'
];

/**
 * Basin Names - Major geological basins worldwide
 */
export const BASIN_AUTOCOMPLETE: string[] = [
  'North Sea',
  'Gulf of Mexico',
  'Campos Basin',
  'Santos Basin',
  'Permian Basin',
  'Barents Sea',
  'Norwegian Sea',
  'West Africa',
  'Browse Basin',
  'Carnarvon Basin',
  'Gippsland Basin',
  'Niger Delta',
  'Kwanza Basin'
];

/**
 * Well Status - Common well status values
 */
export const WELL_STATUS_AUTOCOMPLETE: string[] = [
  'Active',
  'Inactive',
  'Producing',
  'Suspended',
  'Abandoned',
  'Drilling',
  'Completed',
  'Plugged',
  'Shut-in',
  'Testing'
];

/**
 * Well Types - Common well classifications
 */
export const WELL_TYPE_AUTOCOMPLETE: string[] = [
  'Production',
  'Exploration',
  'Injection',
  'Observation',
  'Development',
  'Appraisal',
  'Wildcat',
  'Delineation',
  'Water Injection',
  'Gas Injection'
];

/**
 * Wellbore Types - Common wellbore configurations
 */
export const WELLBORE_TYPE_AUTOCOMPLETE: string[] = [
  'Vertical',
  'Horizontal',
  'Deviated',
  'Multilateral',
  'Extended Reach',
  'Directional',
  'Sidetrack'
];

/**
 * Log Types - Common well log curve types
 */
export const LOG_TYPE_AUTOCOMPLETE: string[] = [
  'GR',
  'RHOB',
  'NPHI',
  'DT',
  'RT',
  'SP',
  'CALI',
  'PEF',
  'MSFL',
  'LLD',
  'LLS',
  'ILD',
  'ILM'
];

/**
 * Seismic Survey Types - Common seismic acquisition types
 */
export const SEISMIC_SURVEY_TYPE_AUTOCOMPLETE: string[] = [
  '2D',
  '3D',
  '4D',
  'VSP',
  'Ocean Bottom',
  'Multi-component',
  'Wide Azimuth',
  'Narrow Azimuth'
];

/**
 * Get autocomplete values for a specific field
 * 
 * @param fieldPath - The OSDU field path (e.g., 'data.operator')
 * @returns Array of autocomplete suggestions, or empty array if no suggestions available
 */
export function getAutocompleteValues(fieldPath: string): string[] {
  const autocompleteMap: Record<string, string[]> = {
    'data.operator': OPERATOR_AUTOCOMPLETE,
    'data.country': COUNTRY_AUTOCOMPLETE,
    'data.basin': BASIN_AUTOCOMPLETE,
    'data.status': WELL_STATUS_AUTOCOMPLETE,
    'data.wellType': WELL_TYPE_AUTOCOMPLETE,
    'data.wellboreType': WELLBORE_TYPE_AUTOCOMPLETE,
    'data.logType': LOG_TYPE_AUTOCOMPLETE,
    'data.surveyType': SEISMIC_SURVEY_TYPE_AUTOCOMPLETE
  };

  return autocompleteMap[fieldPath] || [];
}

/**
 * Filter autocomplete values based on user input
 * Performs case-insensitive substring matching
 * 
 * @param values - Array of autocomplete values
 * @param filterText - User input to filter by
 * @returns Filtered array of values
 */
export function filterAutocompleteValues(
  values: string[],
  filterText: string
): string[] {
  if (!filterText || filterText.trim() === '') {
    return values;
  }

  const lowerFilter = filterText.toLowerCase().trim();
  
  return values.filter(value =>
    value.toLowerCase().includes(lowerFilter)
  );
}

/**
 * Check if a field has autocomplete data available
 * 
 * @param fieldPath - The OSDU field path
 * @returns True if autocomplete data is available
 */
export function hasAutocompleteData(fieldPath: string): boolean {
  const values = getAutocompleteValues(fieldPath);
  return values.length > 0;
}

/**
 * Get all autocomplete data sources
 * Useful for documentation or debugging
 * 
 * @returns Array of all autocomplete data sources
 */
export function getAllAutocompleteSources(): AutocompleteDataSource[] {
  return [
    {
      field: 'data.operator',
      values: OPERATOR_AUTOCOMPLETE,
      description: 'Operating company names'
    },
    {
      field: 'data.country',
      values: COUNTRY_AUTOCOMPLETE,
      description: 'Country names for well locations'
    },
    {
      field: 'data.basin',
      values: BASIN_AUTOCOMPLETE,
      description: 'Geological basin names'
    },
    {
      field: 'data.status',
      values: WELL_STATUS_AUTOCOMPLETE,
      description: 'Well status values'
    },
    {
      field: 'data.wellType',
      values: WELL_TYPE_AUTOCOMPLETE,
      description: 'Well type classifications'
    },
    {
      field: 'data.wellboreType',
      values: WELLBORE_TYPE_AUTOCOMPLETE,
      description: 'Wellbore configuration types'
    },
    {
      field: 'data.logType',
      values: LOG_TYPE_AUTOCOMPLETE,
      description: 'Well log curve types'
    },
    {
      field: 'data.surveyType',
      values: SEISMIC_SURVEY_TYPE_AUTOCOMPLETE,
      description: 'Seismic survey acquisition types'
    }
  ];
}

/**
 * Validate that a value exists in the autocomplete list
 * Useful for validation when users can enter free text
 * 
 * @param fieldPath - The OSDU field path
 * @param value - The value to validate
 * @returns True if value exists in autocomplete list or if no autocomplete data exists
 */
export function isValidAutocompleteValue(
  fieldPath: string,
  value: string
): boolean {
  const autocompleteValues = getAutocompleteValues(fieldPath);
  
  // If no autocomplete data, any value is valid (free text)
  if (autocompleteValues.length === 0) {
    return true;
  }

  // Case-insensitive comparison
  const lowerValue = value.toLowerCase().trim();
  return autocompleteValues.some(
    v => v.toLowerCase() === lowerValue
  );
}

/**
 * Get suggested values based on partial input
 * Returns top N matches sorted by relevance
 * 
 * @param fieldPath - The OSDU field path
 * @param partialInput - Partial user input
 * @param maxResults - Maximum number of results to return (default: 10)
 * @returns Array of suggested values
 */
export function getSuggestedValues(
  fieldPath: string,
  partialInput: string,
  maxResults: number = 10
): string[] {
  const allValues = getAutocompleteValues(fieldPath);
  
  if (!partialInput || partialInput.trim() === '') {
    return allValues.slice(0, maxResults);
  }

  const filtered = filterAutocompleteValues(allValues, partialInput);
  
  // Sort by relevance: exact matches first, then starts-with, then contains
  const lowerInput = partialInput.toLowerCase().trim();
  
  const sorted = filtered.sort((a, b) => {
    const aLower = a.toLowerCase();
    const bLower = b.toLowerCase();
    
    // Exact match
    if (aLower === lowerInput) return -1;
    if (bLower === lowerInput) return 1;
    
    // Starts with
    const aStarts = aLower.startsWith(lowerInput);
    const bStarts = bLower.startsWith(lowerInput);
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;
    
    // Alphabetical for remaining
    return a.localeCompare(b);
  });
  
  return sorted.slice(0, maxResults);
}
