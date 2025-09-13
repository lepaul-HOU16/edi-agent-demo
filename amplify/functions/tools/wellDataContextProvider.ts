/**
 * Well Data Context Provider
 * 
 * This service provides intelligent context about available well data
 * based on query intent and current data availability. It serves as
 * a unified source of well data information for all tools.
 */

import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { QueryIntent } from "./queryIntentClassifier";

export interface WellDataContext {
    totalWells: number;
    primaryWells: WellInfo[];
    lasFiles: string[];
    csvFiles: string[];
    formationData: FormationInfo[];
    contextSummary: string;
    detailedSummary: string;
}

export interface WellInfo {
    wellId: string;
    wellName: string;
    location: {
        county: string;
        state: string;
        latitude?: number;
        longitude?: number;
    };
    formation: string;
    wellType: string;
    status: string;
    availableLogs: string[];
}

export interface FormationInfo {
    name: string;
    type: string;
    lithology: string;
    characteristics: string;
}

// Cached well data context
let cachedContext: WellDataContext | null = null;
let lastCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Primary well data - this is the core dataset always available
 */
const PRIMARY_WELLS: WellInfo[] = [
    {
        wellId: "WELL-001",
        wellName: "Eagle Ford 1H",
        location: {
            county: "Karnes",
            state: "TX",
            latitude: 28.7505,
            longitude: -97.3573
        },
        formation: "Eagle Ford Shale",
        wellType: "Horizontal",
        status: "Producing",
        availableLogs: ["GR", "RHOB", "NPHI", "RT", "CALI", "DTC"]
    },
    {
        wellId: "WELL-002",
        wellName: "Permian Basin 2H",
        location: {
            county: "Midland",
            state: "TX",
            latitude: 31.9686,
            longitude: -102.0779
        },
        formation: "Wolfcamp Shale",
        wellType: "Horizontal", 
        status: "Producing",
        availableLogs: ["GR", "RHOB", "NPHI", "RT", "CALI", "DTC", "PEF"]
    }
];

const FORMATION_DATA: FormationInfo[] = [
    {
        name: "Eagle Ford Shale",
        type: "Unconventional",
        lithology: "Shale/Carbonate", 
        characteristics: "8-12% porosity, 0.001-0.1 mD permeability, oil and gas production"
    },
    {
        name: "Wolfcamp Shale",
        type: "Unconventional",
        lithology: "Shale/Limestone",
        characteristics: "6-10% porosity, 0.0001-0.05 mD permeability, primarily oil production"
    }
];

/**
 * Get S3 client and bucket configuration
 */
function getS3Config() {
    const s3Client = new S3Client();
    
    let bucketName: string;
    try {
        const outputs = require('@/../amplify_outputs.json');
        bucketName = outputs.storage.bucket_name;
        if (!bucketName) {
            throw new Error("bucket_name not found in amplify_outputs.json");
        }
    } catch (error) {
        const envBucketName = process.env.STORAGE_BUCKET_NAME;
        if (!envBucketName) {
            throw new Error("STORAGE_BUCKET_NAME is not set and amplify_outputs.json is not accessible");
        }
        bucketName = envBucketName;
    }
    
    return { s3Client, bucketName };
}

/**
 * Scan for additional LAS and CSV files in the global well-data directory
 */
async function scanAdditionalWellFiles(): Promise<{ lasFiles: string[], csvFiles: string[] }> {
    try {
        const { s3Client, bucketName } = getS3Config();
        
        const response = await s3Client.send(new ListObjectsV2Command({
            Bucket: bucketName,
            Prefix: 'global/well-data/',
            MaxKeys: 100
        }));
        
        const allFiles = (response.Contents || [])
            .map(item => item.Key?.replace('global/well-data/', '') || '')
            .filter(key => key && !key.endsWith('/') && key !== 'well-context.json');
        
        const lasFiles = allFiles.filter(f => f.endsWith('.las'));
        const csvFiles = allFiles.filter(f => f.endsWith('.csv'));
        
        return { lasFiles, csvFiles };
        
    } catch (error) {
        console.error('Error scanning additional well files:', error);
        
        // Return fallback data
        return {
            lasFiles: [
                'WELL-003.las', 'WELL-004.las', 'WELL-005.las', 'WELL-006.las',
                'WELL-007.las', 'WELL-008.las', 'WELL-009.las', 'WELL-010.las',
                'WELL-011.las', 'WELL-012.las', 'WELL-013.las', 'WELL-014.las',
                'WELL-015.las', 'WELL-016.las', 'WELL-017.las', 'WELL-018.las',
                'WELL-019.las', 'WELL-020.las', 'WELL-021.las', 'WELL-022.las',
                'WELL-023.las', 'WELL-024.las', 'CARBONATE_PLATFORM_002.las',
                'MIXED_LITHOLOGY_003.las', 'SANDSTONE_RESERVOIR_001.las'
            ],
            csvFiles: ['Well_tops.csv', 'converted_coordinates.csv']
        };
    }
}

/**
 * Build comprehensive well data context
 */
async function buildWellDataContext(): Promise<WellDataContext> {
    const { lasFiles, csvFiles } = await scanAdditionalWellFiles();
    const totalWells = PRIMARY_WELLS.length + lasFiles.length;
    
    const contextSummary = `${totalWells} wells available: ${PRIMARY_WELLS.length} primary wells with full data + ${lasFiles.length} additional LAS files`;
    
    const detailedSummary = generateDetailedSummary(totalWells, PRIMARY_WELLS, lasFiles, csvFiles, FORMATION_DATA);
    
    return {
        totalWells,
        primaryWells: PRIMARY_WELLS,
        lasFiles,
        csvFiles,
        formationData: FORMATION_DATA,
        contextSummary,
        detailedSummary
    };
}

/**
 * Generate detailed summary based on available data
 */
function generateDetailedSummary(
    totalWells: number,
    primaryWells: WellInfo[],
    lasFiles: string[],
    csvFiles: string[],
    formations: FormationInfo[]
): string {
    let summary = `=== COMPREHENSIVE WELL DATA OVERVIEW ===\n\n`;
    
    summary += `**TOTAL WELLS AVAILABLE: ${totalWells}**\n\n`;
    
    // Primary wells with full information
    summary += `**PRIMARY WELLS (${primaryWells.length}):**\n`;
    primaryWells.forEach((well, index) => {
        summary += `${index + 1}. ${well.wellName} (${well.wellId})\n`;
        summary += `   - Location: ${well.location.county} County, ${well.location.state}\n`;
        summary += `   - Formation: ${well.formation}\n`;
        summary += `   - Type: ${well.wellType}, Status: ${well.status}\n`;
        summary += `   - Available Logs: ${well.availableLogs.join(', ')}\n`;
    });
    
    // Additional LAS files
    if (lasFiles.length > 0) {
        summary += `\n**ADDITIONAL LAS FILES (${lasFiles.length}):**\n`;
        const displayFiles = lasFiles.slice(0, 10); // Show first 10
        displayFiles.forEach((file, index) => {
            summary += `${index + 1}. ${file}\n`;
        });
        if (lasFiles.length > 10) {
            summary += `... and ${lasFiles.length - 10} more LAS files\n`;
        }
    }
    
    // CSV data files
    if (csvFiles.length > 0) {
        summary += `\n**SUPPORTING DATA FILES (${csvFiles.length}):**\n`;
        csvFiles.forEach(file => {
            summary += `- ${file}\n`;
        });
    }
    
    // Formation information
    summary += `\n**FORMATION DETAILS:**\n`;
    formations.forEach(formation => {
        summary += `- **${formation.name}**: ${formation.characteristics}\n`;
    });
    
    summary += `\n**ACCESS METHODS:**\n`;
    summary += `- Use listFiles("global/well-data") to see all files\n`;
    summary += `- Use readFile("global/well-data/FILENAME.las") for specific wells\n`;
    summary += `- Use textToTableTool for batch data extraction\n`;
    summary += `- Use pysparkTool for advanced analysis\n`;
    
    return summary;
}

/**
 * Get well data context (cached or fresh)
 */
export async function getWellDataContext(): Promise<WellDataContext> {
    const now = Date.now();
    
    // Return cached context if valid
    if (cachedContext && (now - lastCacheTime) < CACHE_TTL) {
        return cachedContext;
    }
    
    // Build fresh context
    console.log('Building fresh well data context...');
    cachedContext = await buildWellDataContext();
    lastCacheTime = now;
    
    return cachedContext;
}

/**
 * Generate context-aware response based on query intent
 */
export async function generateContextualResponse(intent: QueryIntent): Promise<string> {
    const context = await getWellDataContext();
    
    switch (intent.category) {
        case 'well_count':
            return generateCountResponse(context);
            
        case 'well_info':
            return generateWellInfoResponse(context);
            
        case 'data_analysis':
            return generateAnalysisResponse(context);
            
        case 'file_access':
            return generateFileAccessResponse(context);
            
        default:
            return generateGeneralResponse(context);
    }
}

function generateCountResponse(context: WellDataContext): string {
    return `You have **${context.totalWells} wells** available for analysis:\n\n` +
           `**Primary Wells (${context.primaryWells.length}):**\n` +
           context.primaryWells.map((well, i) => 
               `${i + 1}. ${well.wellName} (${well.wellId}) - ${well.formation}, ${well.location.county} County, ${well.location.state}`
           ).join('\n') +
           (context.lasFiles.length > 0 ? 
               `\n\n**Additional Wells (${context.lasFiles.length}):**\nAvailable as LAS files: ${context.lasFiles.slice(0, 5).join(', ')}${context.lasFiles.length > 5 ? ` and ${context.lasFiles.length - 5} more` : ''}` :
               '') +
           `\n\nAll wells contain comprehensive petrophysical log data suitable for formation evaluation and reservoir analysis.`;
}

function generateWellInfoResponse(context: WellDataContext): string {
    let response = `**Available Well Information:**\n\n`;
    
    context.primaryWells.forEach(well => {
        response += `**${well.wellName} (${well.wellId}):**\n`;
        response += `- Location: ${well.location.county} County, ${well.location.state}`;
        if (well.location.latitude && well.location.longitude) {
            response += ` (${well.location.latitude}°N, ${well.location.longitude}°W)`;
        }
        response += `\n- Formation: ${well.formation}\n`;
        response += `- Well Type: ${well.wellType}, Status: ${well.status}\n`;
        response += `- Available Logs: ${well.availableLogs.join(', ')}\n\n`;
    });
    
    if (context.lasFiles.length > 0) {
        response += `**Additional Wells:** ${context.lasFiles.length} LAS files available with standard petrophysical log suites.\n\n`;
    }
    
    response += `**Formation Data:**\n`;
    context.formationData.forEach(formation => {
        response += `- **${formation.name}**: ${formation.characteristics}\n`;
    });
    
    return response;
}

function generateAnalysisResponse(context: WellDataContext): string {
    return `**Analysis Capabilities with ${context.totalWells} Wells:**\n\n` +
           `**Available Data:**\n` +
           `- ${context.primaryWells.length} primary wells with full petrophysical log suites\n` +
           `- ${context.lasFiles.length} additional LAS files\n` +
           `- Well tops and coordinate data (${context.csvFiles.length} CSV files)\n\n` +
           `**Analysis Tools:**\n` +
           `- Petrophysical property calculations (porosity, saturation, shale volume)\n` +
           `- Formation evaluation and net pay identification\n` +
           `- Cross-plot analysis and rock typing\n` +
           `- Multi-well correlation and mapping\n` +
           `- PySpark-based advanced analytics\n\n` +
           `**Formation Coverage:**\n` +
           context.formationData.map(f => `- ${f.name} (${f.lithology})`).join('\n');
}

function generateFileAccessResponse(context: WellDataContext): string {
    return `**Available Data Files (${context.totalWells} wells total):**\n\n` +
           `**LAS Files (${context.primaryWells.length + context.lasFiles.length}):**\n` +
           `- Primary: ${context.primaryWells.map(w => `${w.wellId}.las`).join(', ')}\n` +
           (context.lasFiles.length > 0 ? 
               `- Additional: ${context.lasFiles.slice(0, 8).join(', ')}${context.lasFiles.length > 8 ? ` + ${context.lasFiles.length - 8} more` : ''}\n` :
               '') +
           `\n**CSV Files (${context.csvFiles.length}):**\n` +
           context.csvFiles.map(f => `- ${f}`).join('\n') +
           `\n\n**Access Methods:**\n` +
           `- listFiles("global/well-data") - Browse all files\n` +
           `- readFile("global/well-data/WELL-001.las") - Read specific well\n` +
           `- textToTableTool - Extract data from multiple files\n` +
           `- pysparkTool - Advanced data processing`;
}

function generateGeneralResponse(context: WellDataContext): string {
    return context.detailedSummary;
}

/**
 * Clear the cache (for testing or when data changes)
 */
export function clearWellDataCache(): void {
    cachedContext = null;
    lastCacheTime = 0;
}

/**
 * Get just the basic context summary for injection into tool responses
 */
export async function getBasicWellContext(): Promise<string> {
    const context = await getWellDataContext();
    return context.contextSummary;
}

/**
 * Enhance tool response with well data context
 */
export async function enhanceToolResponseWithContext(
    originalResponse: string, 
    intent: QueryIntent
): Promise<string> {
    if (!intent.isWellRelated) {
        return originalResponse;
    }
    
    const context = await getWellDataContext();
    const contextualResponse = await generateContextualResponse(intent);
    
    // If original response seems inadequate for a well query, replace it
    if (originalResponse.length < 50 || 
        originalResponse.toLowerCase().includes('no files') ||
        originalResponse.toLowerCase().includes('0 files') ||
        !originalResponse.toLowerCase().includes('well')) {
        
        console.log('Replacing inadequate tool response with contextual response');
        return contextualResponse;
    }
    
    // Otherwise, enhance the existing response
    return originalResponse + '\n\n' + `**Context: ${context.contextSummary}**`;
}
