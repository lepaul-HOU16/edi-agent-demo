import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import * as path from "path";

// Cache for global directory data
interface GlobalDataCache {
    data: GlobalDirectoryIndex | null;
    timestamp: number;
    ttl: number;
}

// Type definitions
interface FileInfo {
    name: string;
    key: string;
    size?: number;
    lastModified?: Date;
    type: string;
}

interface DirectoryInfo {
    name: string;
    path: string;
    fileCount: number;
    totalSize: number;
    files: FileInfo[];
    subdirectories: DirectoryInfo[];
}

interface GlobalDirectoryIndex {
    scanTimestamp: Date;
    totalFiles: number;
    totalDirectories: number;
    rootDirectories: DirectoryInfo[];
    filesByType: Record<string, FileInfo[]>;
    summary: string;
}

// Cache instance - Force fresh scan after fix
let globalDataCache: GlobalDataCache = {
    data: null,
    timestamp: 0,
    ttl: parseInt(process.env.GLOBAL_CONTEXT_CACHE_TTL || '300') * 1000 // Default 5 minutes for faster refresh
};

// Session-specific cache
interface SessionDataCache {
    [chatSessionId: string]: {
        data: string | null;
        timestamp: number;
        ttl: number;
    };
}

let sessionDataCache: SessionDataCache = {};

// Configuration from environment variables
const CONFIG = {
    ENABLED: process.env.ENABLE_GLOBAL_CONTEXT_LOADING !== 'false', // Default enabled
    MAX_FILES: parseInt(process.env.GLOBAL_SCAN_MAX_FILES || '500'),
    MAX_DEPTH: parseInt(process.env.GLOBAL_SCAN_MAX_DEPTH || '3'),
    CACHE_TTL: parseInt(process.env.GLOBAL_CONTEXT_CACHE_TTL || '3600') * 1000
};

// Helper functions
function getS3Client() {
    return new S3Client();
}

function getBucketName() {
    try {
        const outputs = require('@/../amplify_outputs.json');
        const bucketName = outputs.storage.bucket_name;
        if (!bucketName) {
            throw new Error("bucket_name not found in amplify_outputs.json");
        }
        return bucketName;
    } catch (error) {
        const envBucketName = process.env.STORAGE_BUCKET_NAME;
        if (!envBucketName) {
            throw new Error("STORAGE_BUCKET_NAME is not set and amplify_outputs.json is not accessible");
        }
        return envBucketName;
    }
}

function getFileType(filename: string): string {
    const extension = path.extname(filename).toLowerCase();
    
    const typeMap: Record<string, string> = {
        '.las': 'Well Log',
        '.csv': 'Data Table',
        '.pdf': 'Report',
        '.txt': 'Text',
        '.json': 'Data',
        '.yaml': 'Configuration',
        '.yml': 'Configuration',
        '.md': 'Documentation',
        '.py': 'Script',
        '.zip': 'Archive'
    };
    
    return typeMap[extension] || 'Other';
}

function formatFileSize(bytes?: number): string {
    if (!bytes) return 'Unknown';
    
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }
    
    return `${Math.round(size * 100) / 100} ${units[unitIndex]}`;
}

async function scanS3Directory(prefix: string, maxDepth: number, currentDepth: number = 0): Promise<DirectoryInfo> {
    const s3Client = getS3Client();
    const bucketName = getBucketName();
    
    const dirInfo: DirectoryInfo = {
        name: path.basename(prefix) || 'global',
        path: prefix,
        fileCount: 0,
        totalSize: 0,
        files: [],
        subdirectories: []
    };

    if (currentDepth >= maxDepth) {
        return dirInfo;
    }

    try {
        let continuationToken: string | undefined;
        let individualFileCount = 0; // Counter for files in this directory only
        let totalScannedGlobally = 0; // Counter for global MAX_FILES limit
        
        do {
            const listParams = {
                Bucket: bucketName,
                Prefix: prefix,
                MaxKeys: 1000,
                ContinuationToken: continuationToken,
                Delimiter: '/'
            };

            const command = new ListObjectsV2Command(listParams);
            const response = await s3Client.send(command);

            // Process files (Contents)
            if (response.Contents) {
                for (const item of response.Contents) {
                    if (totalScannedGlobally >= CONFIG.MAX_FILES) break;
                    
                    const key = item.Key as string;
                    if (key === prefix || key.endsWith('/')) continue; // Skip directory markers
                    
                    const fileName = key.replace(prefix, '');
                    if (fileName && !fileName.includes('/')) { // Only direct children
                        const fileInfo: FileInfo = {
                            name: fileName,
                            key: key,
                            size: item.Size,
                            lastModified: item.LastModified,
                            type: getFileType(fileName)
                        };
                        
                        dirInfo.files.push(fileInfo);
                        dirInfo.fileCount++;
                        dirInfo.totalSize += item.Size || 0;
                        individualFileCount++;
                        totalScannedGlobally++;
                    }
                }
            }

            // Process subdirectories (CommonPrefixes)
            if (response.CommonPrefixes && currentDepth < maxDepth - 1) {
                for (const prefixObj of response.CommonPrefixes) {
                    if (totalScannedGlobally >= CONFIG.MAX_FILES) break;
                    
                    const subdirPrefix = prefixObj.Prefix as string;
                    const subdirInfo = await scanS3Directory(subdirPrefix, maxDepth, currentDepth + 1);
                    
                    if (subdirInfo.fileCount > 0 || subdirInfo.subdirectories.length > 0) {
                        dirInfo.subdirectories.push(subdirInfo);
                        dirInfo.fileCount += subdirInfo.fileCount;
                        dirInfo.totalSize += subdirInfo.totalSize;
                    }
                    
                    // Only add to global counter, not double-counting for local directory logic
                    totalScannedGlobally += subdirInfo.fileCount;
                }
            }

            continuationToken = response.NextContinuationToken;
        } while (continuationToken && individualFileCount < CONFIG.MAX_FILES);

    } catch (error) {
        console.error(`Error scanning directory ${prefix}:`, error);
    }

    return dirInfo;
}

function categorizeFilesByType(rootDirectories: DirectoryInfo[]): Record<string, FileInfo[]> {
    const filesByType: Record<string, FileInfo[]> = {};
    
    function collectFiles(dir: DirectoryInfo) {
        // Collect files from current directory
        for (const file of dir.files) {
            if (!filesByType[file.type]) {
                filesByType[file.type] = [];
            }
            filesByType[file.type].push(file);
        }
        
        // Recursively collect from subdirectories
        for (const subdir of dir.subdirectories) {
            collectFiles(subdir);
        }
    }
    
    for (const rootDir of rootDirectories) {
        collectFiles(rootDir);
    }
    
    return filesByType;
}

function generateDataSummary(index: GlobalDirectoryIndex): string {
    let summary = "## Available Global Data Context\n\n";
    
    if (index.totalFiles === 0) {
        summary += "**No data files currently available in the global directory.**\n\n";
        summary += "### Data Upload Instructions:\n";
        summary += "To perform petrophysical analysis, you can guide users to upload:\n";
        summary += "- **Well Log Files**: LAS format files containing wireline log data\n";
        summary += "- **Production Data**: CSV files with well production history\n";
        summary += "- **Well Completion Reports**: PDF or text files with well completion details\n";
        summary += "- **Core Data**: CSV/Excel files with core analysis results\n\n";
        summary += "Use the file management tools to help users upload and organize their data.\n\n";
        return summary;
    }
    
    // Directory structure overview
    summary += "### Global Directory Structure:\n";
    for (const rootDir of index.rootDirectories) {
        summary += `- ${rootDir.path} (${rootDir.fileCount} files, ${formatFileSize(rootDir.totalSize)})\n`;
        
        // Show key subdirectories
        for (const subdir of rootDir.subdirectories.slice(0, 5)) {
            summary += `  - ${subdir.name}/ (${subdir.fileCount} files)\n`;
        }
        if (rootDir.subdirectories.length > 5) {
            summary += `  - ... and ${rootDir.subdirectories.length - 5} more subdirectories\n`;
        }
    }
    
    // File type summary
    summary += "\n### Key Data Categories:\n";
    const sortedTypes = Object.entries(index.filesByType)
        .sort(([,a], [,b]) => b.length - a.length) // Sort by count descending
        .slice(0, 10); // Top 10 types
        
    for (const [type, files] of sortedTypes) {
        summary += `- **${type}**: ${files.length} files\n`;
        
        // Show examples for important types
        if (['Well Log', 'Data Table', 'Report'].includes(type) && files.length > 0) {
            const examples = files.slice(0, 3).map(f => f.name).join(', ');
            summary += `  - Examples: ${examples}\n`;
            if (files.length > 3) {
                summary += `  - ... and ${files.length - 3} more\n`;
            }
        }
    }
    
    // Quick access patterns
    summary += "\n### Quick Access Patterns:\n";
    summary += "- Use `listFiles(\"global/subdirectory\")` to explore specific areas\n";
    summary += "- Use `readFile(\"global/path/to/file.ext\")` for specific files\n";
    summary += "- Use `searchFiles(\"pattern\")` to find files matching patterns\n";
    summary += "- Use `textToTableTool` to extract structured data from multiple files\n";
    
    // Performance note
    summary += `\n*Global scan completed at ${index.scanTimestamp.toISOString()}, `;
    summary += `found ${index.totalFiles} files across ${index.totalDirectories} directories.*\n\n`;
    
    return summary;
}

/**
 * Main function to scan the global directory and generate an index
 */
export async function scanGlobalDirectory(): Promise<GlobalDirectoryIndex | null> {
    if (!CONFIG.ENABLED) {
        console.log('Global context loading is disabled');
        return null;
    }
    
    // Check cache first
    const now = Date.now();
    if (globalDataCache.data && (now - globalDataCache.timestamp) < globalDataCache.ttl) {
        console.log('Using cached global directory data');
        return globalDataCache.data;
    }
    
    try {
        console.log('Scanning global directory structure...');
        const startTime = Date.now();
        
        // Scan the global directory
        const rootDirectory = await scanS3Directory('global/', CONFIG.MAX_DEPTH);
        
        // Create index
        const index: GlobalDirectoryIndex = {
            scanTimestamp: new Date(),
            totalFiles: rootDirectory.fileCount,
            totalDirectories: 1 + countSubdirectories(rootDirectory),
            rootDirectories: rootDirectory.subdirectories.length > 0 ? rootDirectory.subdirectories : [rootDirectory],
            filesByType: categorizeFilesByType(rootDirectory.subdirectories.length > 0 ? rootDirectory.subdirectories : [rootDirectory]),
            summary: ''
        };
        
        // Generate human-readable summary
        index.summary = generateDataSummary(index);
        
        // Cache the result
        globalDataCache = {
            data: index,
            timestamp: now,
            ttl: CONFIG.CACHE_TTL
        };
        
        const scanDuration = Date.now() - startTime;
        console.log(`Global directory scan completed in ${scanDuration}ms, found ${index.totalFiles} files`);
        
        return index;
        
    } catch (error) {
        console.error('Error scanning global directory:', error);
        return null;
    }
}

function countSubdirectories(dir: DirectoryInfo): number {
    let count = dir.subdirectories.length;
    for (const subdir of dir.subdirectories) {
        count += countSubdirectories(subdir);
    }
    return count;
}

/**
 * Get global directory summary for system message
 */
export async function getGlobalDirectoryContext(chatSessionId?: string): Promise<string> {
    const index = await scanGlobalDirectory();
    let contextSummary = "";
    
    if (index) {
        contextSummary += index.summary;
    }
    
    // Also scan session-specific uploaded files if chatSessionId is provided
    if (chatSessionId) {
        try {
            const sessionContext = await scanSessionDirectory(chatSessionId);
            if (sessionContext) {
                contextSummary += "\n\n" + sessionContext;
            }
        } catch (error) {
            console.error('Error scanning session directory:', error);
            // Don't fail completely if session scanning fails
        }
    }
    
    return contextSummary || "";
}

/**
 * Scan session-specific directory for uploaded files
 */
async function scanSessionDirectory(chatSessionId: string): Promise<string | null> {
    if (!CONFIG.ENABLED) {
        return null;
    }
    
    // Check session cache first
    const now = Date.now();
    const sessionCache = sessionDataCache[chatSessionId];
    if (sessionCache && (now - sessionCache.timestamp) < sessionCache.ttl) {
        console.log(`Using cached session directory data for chatSessionId: ${chatSessionId}`);
        return sessionCache.data;
    }
    
    try {
        console.log(`Scanning session directory for chatSessionId: ${chatSessionId}`);
        
        // Scan the session-specific directory
        const sessionPrefix = `chatSessionArtifacts/sessionId=${chatSessionId}/`;
        const sessionDirectory = await scanS3Directory(sessionPrefix, CONFIG.MAX_DEPTH);
        
        if (sessionDirectory.fileCount === 0) {
            // Cache the null result with shorter TTL
            sessionDataCache[chatSessionId] = {
                data: null,
                timestamp: now,
                ttl: 300000 // 5 minutes for null results
            };
            return null;
        }
        
        // Create a mini-index for session files
        const sessionIndex: GlobalDirectoryIndex = {
            scanTimestamp: new Date(),
            totalFiles: sessionDirectory.fileCount,
            totalDirectories: 1 + countSubdirectories(sessionDirectory),
            rootDirectories: sessionDirectory.subdirectories.length > 0 ? sessionDirectory.subdirectories : [sessionDirectory],
            filesByType: categorizeFilesByType(sessionDirectory.subdirectories.length > 0 ? sessionDirectory.subdirectories : [sessionDirectory]),
            summary: ''
        };
        
        // Generate session-specific summary
        let sessionSummary = "## Uploaded Files in Current Session\n\n";
        
        if (sessionIndex.totalFiles > 0) {
            sessionSummary += `**${sessionIndex.totalFiles} files uploaded in this session:**\n\n`;
            
            // Directory structure overview
            sessionSummary += "### Session File Structure:\n";
            for (const rootDir of sessionIndex.rootDirectories) {
                const displayPath = rootDir.path.replace(sessionPrefix, '');
                sessionSummary += `- ${displayPath || 'root'} (${rootDir.fileCount} files, ${formatFileSize(rootDir.totalSize)})\n`;
                
                // Show key subdirectories
                for (const subdir of rootDir.subdirectories.slice(0, 3)) {
                    sessionSummary += `  - ${subdir.name}/ (${subdir.fileCount} files)\n`;
                }
                if (rootDir.subdirectories.length > 3) {
                    sessionSummary += `  - ... and ${rootDir.subdirectories.length - 3} more subdirectories\n`;
                }
            }
            
            // File type summary
            sessionSummary += "\n### Uploaded File Types:\n";
            const sortedTypes = Object.entries(sessionIndex.filesByType)
                .sort(([,a], [,b]) => b.length - a.length) // Sort by count descending
                .slice(0, 5); // Top 5 types
                
            for (const [type, files] of sortedTypes) {
                sessionSummary += `- **${type}**: ${files.length} files\n`;
                
                // Show examples for important types
                if (['Well Log', 'Data Table', 'Report'].includes(type) && files.length > 0) {
                    const examples = files.slice(0, 2).map(f => f.name).join(', ');
                    sessionSummary += `  - Examples: ${examples}\n`;
                    if (files.length > 2) {
                        sessionSummary += `  - ... and ${files.length - 2} more\n`;
                    }
                }
            }
            
            sessionSummary += "\n### Quick Access:\n";
            sessionSummary += "- Use `listFiles()` to explore session files\n";
            sessionSummary += "- Use `readFile(\"filename\")` for specific uploaded files\n";
            sessionSummary += "- Use `searchFiles(\"pattern\")` to find specific uploads\n";
            
            sessionSummary += `\n*Session files scanned at ${sessionIndex.scanTimestamp.toISOString()}*\n`;
        }
        
        // Cache the result
        sessionDataCache[chatSessionId] = {
            data: sessionSummary,
            timestamp: now,
            ttl: CONFIG.CACHE_TTL
        };
        
        console.log(`Session directory scan completed, found ${sessionIndex.totalFiles} files`);
        return sessionSummary;
        
    } catch (error) {
        console.error('Error scanning session directory:', error);
        
        // Cache null result with shorter TTL for errors
        sessionDataCache[chatSessionId] = {
            data: null,
            timestamp: now,
            ttl: 60000 // 1 minute for errors
        };
        
        return null;
    }
}

/**
 * Clear the cache (useful for testing or manual refresh)
 */
export function clearGlobalDirectoryCache(): void {
    globalDataCache = {
        data: null,
        timestamp: 0,
        ttl: CONFIG.CACHE_TTL
    };
    console.log('Global directory cache cleared - next scan will be fresh');
}

/**
 * Clear session-specific cache (call when files are uploaded)
 */
export function clearSessionDirectoryCache(chatSessionId: string): void {
    if (sessionDataCache[chatSessionId]) {
        delete sessionDataCache[chatSessionId];
        console.log(`Cleared session cache for chatSessionId: ${chatSessionId}`);
    }
}

/**
 * Force refresh of global and session context (call when uploads are detected)
 */
export async function refreshContextForUploads(chatSessionId?: string): Promise<void> {
    console.log('Forcing context refresh due to detected uploads...');
    
    // Clear global cache to pick up new global files
    clearGlobalDirectoryCache();
    
    // Clear session cache if chatSessionId provided
    if (chatSessionId) {
        clearSessionDirectoryCache(chatSessionId);
    } else {
        // Clear all session caches if no specific session
        clearAllSessionCaches();
    }
    
    // Force a new scan to populate caches
    try {
        const globalContext = await scanGlobalDirectory();
        if (globalContext) {
            console.log(`Refreshed global context: found ${globalContext.totalFiles} files`);
        }
        
        if (chatSessionId) {
            const sessionContext = await getGlobalDirectoryContext(chatSessionId);
            console.log(`Refreshed session context for ${chatSessionId}`);
        }
    } catch (error) {
        console.error('Error during context refresh:', error);
    }
}

/**
 * Enhanced scan that detects recent uploads and auto-refreshes context
 */
export async function scanWithUploadDetection(chatSessionId?: string, forceRefresh: boolean = false): Promise<GlobalDirectoryIndex | null> {
    // If force refresh requested, clear caches first
    if (forceRefresh) {
        await refreshContextForUploads(chatSessionId);
    }
    
    // Check if we need to scan for recent uploads
    const shouldCheckUploads = await shouldCheckForRecentUploads();
    if (shouldCheckUploads) {
        console.log('Checking for recent uploads...');
        const hasNewUploads = await detectRecentUploads(chatSessionId);
        if (hasNewUploads) {
            console.log('Recent uploads detected, refreshing context...');
            await refreshContextForUploads(chatSessionId);
        }
    }
    
    // Perform normal scan
    return await scanGlobalDirectory();
}

/**
 * Check if we should scan for recent uploads (every 2 minutes max)
 */
let lastUploadCheckTime = 0;
const UPLOAD_CHECK_INTERVAL = 2 * 60 * 1000; // 2 minutes

async function shouldCheckForRecentUploads(): Promise<boolean> {
    const now = Date.now();
    if (now - lastUploadCheckTime > UPLOAD_CHECK_INTERVAL) {
        lastUploadCheckTime = now;
        return true;
    }
    return false;
}

/**
 * Detect recent uploads by checking for files modified in the last 10 minutes
 */
async function detectRecentUploads(chatSessionId?: string): Promise<boolean> {
    try {
        const s3Client = getS3Client();
        const bucketName = getBucketName();
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
        
        // Check global directory for recent uploads
        const globalCheck = new ListObjectsV2Command({
            Bucket: bucketName,
            Prefix: 'global/',
            MaxKeys: 100
        });
        
        const globalResponse = await s3Client.send(globalCheck);
        const hasRecentGlobalUploads = (globalResponse.Contents || []).some(item => 
            item.LastModified && item.LastModified > tenMinutesAgo
        );
        
        if (hasRecentGlobalUploads) {
            console.log('Recent global uploads detected');
            return true;
        }
        
        // Check session directory if chatSessionId provided
        if (chatSessionId) {
            const sessionCheck = new ListObjectsV2Command({
                Bucket: bucketName,
                Prefix: `chatSessionArtifacts/sessionId=${chatSessionId}/`,
                MaxKeys: 100
            });
            
            const sessionResponse = await s3Client.send(sessionCheck);
            const hasRecentSessionUploads = (sessionResponse.Contents || []).some(item =>
                item.LastModified && item.LastModified > tenMinutesAgo
            );
            
            if (hasRecentSessionUploads) {
                console.log(`Recent session uploads detected for ${chatSessionId}`);
                return true;
            }
        }
        
        return false;
    } catch (error) {
        console.error('Error detecting recent uploads:', error);
        return false; // Fail gracefully
    }
}

/**
 * Clear all session caches
 */
export function clearAllSessionCaches(): void {
    sessionDataCache = {};
    console.log('Cleared all session caches');
}
