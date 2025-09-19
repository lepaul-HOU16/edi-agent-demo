import * as path from "path";
import { S3Client, PutObjectCommand, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";

// Helper functions for S3 operations without LangChain dependencies
function getS3Client() {
    return new S3Client();
}

function getBucketName() {
    // First try environment variable (more reliable in Lambda)
    const envBucketName = process.env.STORAGE_BUCKET_NAME;
    if (envBucketName) {
        console.log(`[S3 Key Debug] Using bucket from env: ${envBucketName}`);
        return envBucketName;
    }
    
    // Try to load from amplify_outputs.json as fallback
    try {
        const outputs = require('@/../amplify_outputs.json');
        const bucketName = outputs?.storage?.bucket_name;
        
        if (bucketName) {
            console.log(`[S3 Key Debug] Using bucket from amplify_outputs: ${bucketName}`);
            return bucketName;
        }
    } catch (error) {
        console.error("Error loading bucket name from amplify_outputs.json:", error);
    }
    
    // Final fallback - throw descriptive error
    throw new Error("S3 bucket name not found. Please set STORAGE_BUCKET_NAME environment variable or ensure amplify_outputs.json is accessible with storage.bucket_name");
}

// Get chat session ID from context (simplified version)
function getChatSessionId(): string | null {
    // This is a simplified version - in production this would get from actual context
    return process.env.CHAT_SESSION_ID || null;
}

// Get session prefix for S3 keys
function getChatSessionPrefix(): string {
    const sessionId = getChatSessionId();
    if (!sessionId) {
        throw new Error("Chat session ID not available for S3 key construction");
    }
    return `chatSessionArtifacts/sessionId=${sessionId}/`;
}

// Diagnostic function to normalize and validate S3 keys
function normalizeS3Key(filepath: string, chatSessionId?: string): string {
    console.log(`[S3 Key Debug] Input filepath: ${filepath}`);
    
    // Remove any leading slashes
    let normalizedPath = filepath.replace(/^\/+/, '');
    
    // Handle global files
    if (normalizedPath.startsWith('global/')) {
        console.log(`[S3 Key Debug] Global file detected: ${normalizedPath}`);
        return normalizedPath;
    }
    
    // Handle files that already have the full chatSessionArtifacts prefix
    if (normalizedPath.startsWith('chatSessionArtifacts/')) {
        // Check if it includes sessionId, if not add it
        if (!normalizedPath.includes('/sessionId=')) {
            const sessionId = chatSessionId || getChatSessionId();
            if (!sessionId) {
                throw new Error("Chat session ID not available for S3 key construction");
            }
            // Extract the path after chatSessionArtifacts/
            const pathAfterPrefix = normalizedPath.replace('chatSessionArtifacts/', '');
            normalizedPath = `chatSessionArtifacts/sessionId=${sessionId}/${pathAfterPrefix}`;
        }
        console.log(`[S3 Key Debug] Full path with sessionId: ${normalizedPath}`);
        return normalizedPath;
    }
    
    // For session-specific files, construct the full path
    const sessionId = chatSessionId || getChatSessionId();
    if (!sessionId) {
        throw new Error("Chat session ID not available for S3 key construction");
    }
    
    const fullPath = `chatSessionArtifacts/sessionId=${sessionId}/${normalizedPath}`;
    console.log(`[S3 Key Debug] Constructed session path: ${fullPath}`);
    return fullPath;
}

async function writeS3Object(key: string, content: string) {
    const upload = new Upload({
        client: getS3Client(),
        params: {
            Bucket: getBucketName(),
            Key: key,
            Body: content
        }
    })

    const response = await upload.done()
    console.log(`Response from uploading file to bucket ${getBucketName()} and key ${key}: `, response)
}

function getContentType(filePath: string): string {
    const extension = path.extname(filePath).toLowerCase();

    const contentTypeMap: Record<string, string> = {
        '.txt': 'text/plain',
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.pdf': 'application/pdf',
        '.md': 'text/markdown',
        '.csv': 'text/csv',
        '.xml': 'application/xml',
        '.zip': 'application/zip',
        '.py': 'text/x-python',
        '.ts': 'text/typescript',
        '.tsx': 'text/typescript'
    };

    return contentTypeMap[extension] || 'application/octet-stream';
}

// Helper function to process document links
async function processDocumentLinks(content: string, chatSessionId: string): Promise<string> {
    // Function to process a path and return the full URL
    const getFullUrl = (filePath: string) => {
        // Only process relative paths that don't start with http/https/files
        if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
            return filePath;
        }

        //Sometimes the agent incorrectly responds with ../ before the file path.
        // Remove all leading '../' sequences
        while (filePath.startsWith('../')) {
            filePath = filePath.slice(3);
        }

        // Handle global files differently
        if (filePath.startsWith('global/')) {
            return `/file/${filePath}`;
        }
        
        // If the path starts with preview, assume it's a formated link to the preview page as returned by the textToTable tool.
        if (filePath.startsWith('/preview')){
            return filePath
        }

        // Handle chatSessionArtifacts paths that might be missing the sessionId
        if (filePath.startsWith('chatSessionArtifacts/')) {
            // Check if it already has the sessionId format
            if (filePath.includes('/sessionId=')) {
                return `/file/${filePath}`;
            } else {
                // Add the sessionId to the path
                const pathWithoutPrefix = filePath.replace('chatSessionArtifacts/', '');
                return `/file/chatSessionArtifacts/sessionId=${chatSessionId}/${pathWithoutPrefix}`;
            }
        }

        // Construct the full asset path for session-specific files
        return `/file/chatSessionArtifacts/sessionId=${chatSessionId}/${filePath}`;
    };

    // Regular expression to match href="path/to/file" patterns
    const linkRegex = /href="([^"]+)"/g;
    // Regular expression to match src="path/to/file" patterns in iframes
    const iframeSrcRegex = /<iframe[^>]*\ssrc="([^"]+)"[^>]*>/g;

    // First replace all href matches
    let processedContent = content.replace(linkRegex, (match, filePath) => {
        const fullPath = getFullUrl(filePath);
        return `href="${fullPath}"`;
    });

    // Then replace all iframe src matches
    processedContent = processedContent.replace(iframeSrcRegex, (match, filePath) => {
        const fullPath = getFullUrl(filePath);
        return match.replace(`src="${filePath}"`, `src="${fullPath}"`);
    });

    return processedContent;
}

// Simplified writeFile function without LangChain tool wrapper
export async function writeFile(params: { filename: string; content: string; contentType?: string }) {
    console.log('writeFile utility called with filename:', params.filename);
    try {
        // Normalize the path to prevent path traversal attacks
        const targetPath = path.normalize(params.filename);
        if (targetPath.startsWith("..")) {
            throw new Error("Invalid file path. Cannot write files outside project root directory.");
        }

        // Prevent writing files with global/ prefix
        if (targetPath.startsWith("global/")) {
            throw new Error("Cannot write files to the global directory. Global files are read-only.");
        }

        // Use the S3 key normalization function
        const s3Key = normalizeS3Key(targetPath);

        // Create parent "directory" keys if needed
        const dirPath = path.dirname(targetPath);
        if (dirPath !== '.') {
            const directories = dirPath.split('/').filter(Boolean);
            const sessionPrefix = getChatSessionPrefix();
            let currentPath = sessionPrefix;

            for (const dir of directories) {
                currentPath = path.posix.join(currentPath, dir, '/');
                // Create an empty object with trailing slash to represent directory
                await writeS3Object(currentPath, '');
            }
        }

        // Process HTML embeddings if this is an HTML file
        let finalContent = params.content;
        if (targetPath.toLowerCase().endsWith('.html')) {
            // Define allowed extensions for different types of content
            const allowedImageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'];
            const allowedIframeExtensions = ['.html', '.png', '.jpg', '.jpeg', '.gif', '.svg'];

            // Helper function to validate file extension
            const validateFileExtension = (src: string, allowedExts: string[], elementType: string) => {
                const fileExtension = path.extname(src).toLowerCase();
                if (!allowedExts.includes(fileExtension)) {
                    throw new Error(
                        `Invalid ${elementType} usage: src="${src}". ` +
                        `${elementType} can only be used with the following file types: ${allowedExts.join(', ')}`
                    );
                }
            };

            // Validate iframe sources
            const iframeRegex = /<iframe[^>]*\ssrc="([^"]+)"[^>]*>/g;
            let match;
            while ((match = iframeRegex.exec(params.content)) !== null) {
                validateFileExtension(match[1], allowedIframeExtensions, 'iframe');
            }

            // Validate image sources
            const imgRegex = /<img[^>]*\ssrc="([^"]+)"[^>]*>/g;
            while ((match = imgRegex.exec(params.content)) !== null) {
                validateFileExtension(match[1], allowedImageExtensions, 'img');
            }

            // Process document links
            finalContent = await processDocumentLinks(params.content, getChatSessionId() || '');
        }

        // Check if content is empty or only whitespace
        if (!finalContent || finalContent.trim().length === 0) {
            throw new Error("Cannot write empty content to file. File content must contain at least one non-whitespace character.");
        }

        // Write the file to S3
        await writeS3Object(s3Key, finalContent);

        return {
            success: true,
            message: `File ${params.filename} written successfully to S3`,
            targetPath: targetPath
        };
    } catch (error: any) {
        throw new Error(`Error writing file: ${error.message}`);
    }
}

// Simple readFile function to match the interface expected by plotDataTool
export async function readFile(params: { filename: string; startAtByte?: number }): Promise<string> {
    const { filename, startAtByte = 0 } = params;
    const maxBytes = 0; // Read entire file for plot data
    
    try {
        // Normalize the path to prevent path traversal attacks
        const targetPath = path.normalize(filename);
        if (targetPath.startsWith("..")) {
            return JSON.stringify({ error: "Invalid file path. Cannot access files outside project root directory." });
        }

        // Use the S3 key normalization function
        const s3Key = normalizeS3Key(targetPath);

        // Read from S3
        const s3Client = getS3Client();
        const bucketName = getBucketName();
        
        const getParams = {
            Bucket: bucketName,
            Key: s3Key,
            Range: maxBytes > 0 ? `bytes=${startAtByte}-${startAtByte + maxBytes - 1}` : undefined
        };

        try {
            const command = new GetObjectCommand(getParams);
            const response = await s3Client.send(command);

            if (response.Body) {
                // Convert stream to string
                const chunks: Buffer[] = [];
                for await (const chunk of response.Body as any) {
                    chunks.push(chunk instanceof Buffer ? chunk : Buffer.from(chunk));
                }
                const content = Buffer.concat(chunks).toString('utf8');

                // Check if content was truncated, accounting for startAtByte
                const contentLength = parseInt(response.ContentRange?.split('/')[1] || '0', 10);
                const wasTruncated = maxBytes > 0 && (contentLength - startAtByte) > maxBytes;

                return JSON.stringify({
                    content,
                    wasTruncated,
                    totalBytes: contentLength,
                    bytesRead: content.length
                });
            } else {
                return JSON.stringify({ error: "No content found" });
            }
        } catch (error: any) {
            if (error.name === 'NoSuchKey') {
                return JSON.stringify({ error: `File not found: ${filename}` });
            }
            return JSON.stringify({ error: `Error reading file: ${error.message}` });
        }
    } catch (error: any) {
        return JSON.stringify({ error: `Error reading file: ${error.message}` });
    }
}

// Add invoke method to readFile to match tool interface
(readFile as any).invoke = readFile;

export { writeS3Object, normalizeS3Key, getChatSessionPrefix, processDocumentLinks };
