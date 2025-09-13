import { NextRequest, NextResponse } from 'next/server';

// Import the global directory scanner functions
// Note: These are server-side functions from the Amplify functions
// We'll need to recreate the S3 scanning logic here for the client-side API

import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import * as path from "path";

// Configuration
const CONFIG = {
    ENABLED: process.env.ENABLE_GLOBAL_CONTEXT_LOADING !== 'false',
    MAX_FILES: parseInt(process.env.GLOBAL_SCAN_MAX_FILES || '500'),
    MAX_DEPTH: parseInt(process.env.GLOBAL_SCAN_MAX_DEPTH || '3'),
    CACHE_TTL: parseInt(process.env.GLOBAL_CONTEXT_CACHE_TTL || '3600') * 1000
};

// Type definitions
interface FileInfo {
    name: string;
    key: string;
    size?: number;
    lastModified?: string;
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

// Cache for API responses
let apiCache: {
    data: GlobalDirectoryIndex | null;
    timestamp: number;
    ttl: number;
} = {
    data: null,
    timestamp: 0,
    ttl: CONFIG.CACHE_TTL
};

function getS3Client() {
    return new S3Client({
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
        }
    });
}

function getBucketName() {
    try {
        const outputs = require('@/../amplify_outputs.json');
        return outputs.storage.bucket_name;
    } catch (error) {
        return process.env.STORAGE_BUCKET_NAME;
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
        let scannedFiles = 0;
        
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
                    if (scannedFiles >= CONFIG.MAX_FILES) break;
                    
                    const key = item.Key as string;
                    if (key === prefix || key.endsWith('/')) continue;
                    
                    const fileName = key.replace(prefix, '');
                    if (fileName && !fileName.includes('/')) {
                        const fileInfo: FileInfo = {
                            name: fileName,
                            key: key,
                            size: item.Size,
                            lastModified: item.LastModified?.toISOString(),
                            type: getFileType(fileName)
                        };
                        
                        dirInfo.files.push(fileInfo);
                        dirInfo.fileCount++;
                        dirInfo.totalSize += item.Size || 0;
                        scannedFiles++;
                    }
                }
            }

            // Process subdirectories (CommonPrefixes)
            if (response.CommonPrefixes && currentDepth < maxDepth - 1) {
                for (const prefixObj of response.CommonPrefixes) {
                    if (scannedFiles >= CONFIG.MAX_FILES) break;
                    
                    const subdirPrefix = prefixObj.Prefix as string;
                    const subdirInfo = await scanS3Directory(subdirPrefix, maxDepth, currentDepth + 1);
                    
                    if (subdirInfo.fileCount > 0 || subdirInfo.subdirectories.length > 0) {
                        dirInfo.subdirectories.push(subdirInfo);
                        dirInfo.fileCount += subdirInfo.fileCount;
                        dirInfo.totalSize += subdirInfo.totalSize;
                    }
                    
                    scannedFiles += subdirInfo.fileCount;
                }
            }

            continuationToken = response.NextContinuationToken;
        } while (continuationToken && scannedFiles < CONFIG.MAX_FILES);

    } catch (error) {
        console.error(`Error scanning directory ${prefix}:`, error);
    }

    return dirInfo;
}

function categorizeFilesByType(rootDirectories: DirectoryInfo[]): Record<string, FileInfo[]> {
    const filesByType: Record<string, FileInfo[]> = {};
    
    function collectFiles(dir: DirectoryInfo) {
        for (const file of dir.files) {
            if (!filesByType[file.type]) {
                filesByType[file.type] = [];
            }
            filesByType[file.type].push(file);
        }
        
        for (const subdir of dir.subdirectories) {
            collectFiles(subdir);
        }
    }
    
    for (const rootDir of rootDirectories) {
        collectFiles(rootDir);
    }
    
    return filesByType;
}

function countSubdirectories(dir: DirectoryInfo): number {
    let count = dir.subdirectories.length;
    for (const subdir of dir.subdirectories) {
        count += countSubdirectories(subdir);
    }
    return count;
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
        return summary;
    }
    
    // Directory structure overview
    summary += "### Global Directory Structure:\n";
    for (const rootDir of index.rootDirectories) {
        summary += `- ${rootDir.path} (${rootDir.fileCount} files, ${formatFileSize(rootDir.totalSize)})\n`;
        
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
        .sort(([,a], [,b]) => b.length - a.length)
        .slice(0, 10);
        
    for (const [type, files] of sortedTypes) {
        summary += `- **${type}**: ${files.length} files\n`;
        
        if (['Well Log', 'Data Table', 'Report'].includes(type) && files.length > 0) {
            const examples = files.slice(0, 3).map(f => f.name).join(', ');
            summary += `  - Examples: ${examples}\n`;
            if (files.length > 3) {
                summary += `  - ... and ${files.length - 3} more\n`;
            }
        }
    }
    
    summary += `\n*Global scan completed at ${index.scanTimestamp.toISOString()}, `;
    summary += `found ${index.totalFiles} files across ${index.totalDirectories} directories.*\n\n`;
    
    return summary;
}

async function scanAllDirectories(forceRefresh: boolean = false): Promise<GlobalDirectoryIndex | null> {
    if (!CONFIG.ENABLED) {
        console.log('Global context loading is disabled');
        return null;
    }
    
    // Check cache first unless force refresh
    const now = Date.now();
    if (!forceRefresh && apiCache.data && (now - apiCache.timestamp) < apiCache.ttl) {
        console.log('Using cached directory data');
        return apiCache.data;
    }
    
    try {
        console.log('Scanning all directories in bucket...');
        const startTime = Date.now();
        
        // Scan multiple directory prefixes to find .las files anywhere
        const prefixesToScan = [
            'global/',
            'well-data/',
            'chatSessionArtifacts/',
            // Also scan root level
            ''
        ];
        
        const allDirectories: DirectoryInfo[] = [];
        let totalFiles = 0;
        let totalDirectories = 0;
        
        for (const prefix of prefixesToScan) {
            console.log(`Scanning prefix: ${prefix || 'root'}`);
            const rootDirectory = await scanS3Directory(prefix, CONFIG.MAX_DEPTH);
            
            if (rootDirectory.fileCount > 0 || rootDirectory.subdirectories.length > 0) {
                if (prefix === '') {
                    // For root level, collect subdirectories separately
                    allDirectories.push(...rootDirectory.subdirectories);
                    // Add root files if any
                    if (rootDirectory.files.length > 0) {
                        allDirectories.push({
                            name: 'root',
                            path: '',
                            fileCount: rootDirectory.fileCount,
                            totalSize: rootDirectory.totalSize,
                            files: rootDirectory.files,
                            subdirectories: []
                        });
                    }
                } else {
                    allDirectories.push(rootDirectory);
                }
                totalFiles += rootDirectory.fileCount;
                totalDirectories += 1 + countSubdirectories(rootDirectory);
            }
        }
        
        // Create index
        const index: GlobalDirectoryIndex = {
            scanTimestamp: new Date(),
            totalFiles: totalFiles,
            totalDirectories: totalDirectories,
            rootDirectories: allDirectories,
            filesByType: categorizeFilesByType(allDirectories),
            summary: ''
        };
        
        // Generate human-readable summary
        index.summary = generateDataSummary(index);
        
        // Cache the result
        apiCache = {
            data: index,
            timestamp: now,
            ttl: CONFIG.CACHE_TTL
        };
        
        const scanDuration = Date.now() - startTime;
        console.log(`Full directory scan completed in ${scanDuration}ms, found ${index.totalFiles} files across all directories`);
        
        return index;
        
    } catch (error) {
        console.error('Error scanning directories:', error);
        throw error;
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { chatSessionId, forceRefresh } = body;

        console.log('API: Starting directory scan across all locations', { chatSessionId, forceRefresh });

        const result = await scanAllDirectories(forceRefresh || false);
        
        if (!result) {
            return NextResponse.json(
                { error: 'Directory scanning is disabled' },
                { status: 503 }
            );
        }

        // Log important findings
        const wellLogs = result.filesByType['Well Log'] || [];
        console.log(`API: Found ${wellLogs.length} LAS files out of ${result.totalFiles} total files across all directories`);

        return NextResponse.json(result);

    } catch (error: any) {
        console.error('API Error in directory scan:', error);
        return NextResponse.json(
            { 
                error: 'Failed to scan directories',
                details: error.message 
            },
            { status: 500 }
        );
    }
}

export async function GET() {
    return NextResponse.json({ 
        message: 'Use POST method to scan global directory',
        usage: 'POST /api/global-directory-scan with { "chatSessionId": "optional", "forceRefresh": false }'
    });
}
