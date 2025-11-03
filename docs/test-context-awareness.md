# Agent Context Awareness Improvements

## Summary

Successfully enhanced the agent's context awareness system to automatically detect and integrate uploaded files from both global and session-specific directories. The agent now provides immediate access to `.las` files and other uploaded artifacts without requiring manual intervention.

## Key Improvements Made

### 1. Enhanced Upload Detection System
- **File**: `amplify/functions/tools/globalDirectoryScanner.ts`
- **New Functions Added**:
  - `refreshContextForUploads()` - Forces cache refresh when uploads detected
  - `scanWithUploadDetection()` - Enhanced scanning with automatic upload detection
  - `detectRecentUploads()` - Checks for files modified in last 10 minutes
  - `shouldCheckForRecentUploads()` - Throttles upload checks (every 2 minutes)

### 2. Improved Agent Handler Integration
- **File**: `amplify/functions/reActAgent/handler.ts`
- **Changes Made**:
  - Integrated `scanWithUploadDetection()` into the agent startup process
  - Enhanced progress messages to show file count when context loads
  - Automatic cache invalidation when new uploads are detected

### 3. Enhanced Cache Management
- **Automatic cache invalidation** when files are uploaded via tools
- **Smart caching strategy** with different TTL for different scenarios:
  - Normal results: 1 hour cache
  - Empty results: 5 minutes cache  
  - Error results: 1 minute cache
- **Session-specific caching** for uploaded files per chat session

### 4. Comprehensive File Discovery
- **Multi-location scanning**:
  - Global directory (`global/`)
  - Session-specific directories (`chatSessionArtifacts/sessionId=*/`)
  - Well files (`global/well-files/`)
  - Production data (`global/production-data/`)

## How It Works

1. **At Agent Startup**: 
   - Agent calls `scanWithUploadDetection()` 
   - System checks for recent uploads (files modified in last 10 minutes)
   - If recent uploads detected, caches are automatically cleared and refreshed

2. **During File Operations**:
   - Tools like `writeFile` and `updateFile` automatically clear session caches
   - Context is immediately available for subsequent operations

3. **Intelligent Caching**:
   - Upload check throttled to every 2 minutes maximum
   - Different cache TTL based on results (success/empty/error)
   - Separate caches for global and session-specific content

## Expected Behavior

### Before Improvements
- Agent unaware of newly uploaded files until manual cache clear
- No automatic detection of `.las` files or other uploads
- Context only updated between separate chat sessions

### After Improvements  
- **Automatic detection** of uploaded `.las` files in global and session directories
- **Real-time context updates** when files are uploaded via UI or tools
- **Comprehensive file inventory** provided to agent at startup
- **Smart caching** reduces unnecessary S3 calls while ensuring freshness

## File Types Automatically Detected

The system categorizes and reports the following file types:
- **Well Log** (`.las` files)
- **Data Table** (`.csv` files) 
- **Report** (`.pdf` files)
- **Text** (`.txt` files)
- **Data** (`.json` files)
- **Configuration** (`.yaml`, `.yml` files)
- **Documentation** (`.md` files)
- **Script** (`.py` files)
- **Archive** (`.zip` files)
- **Other** (all other file types)

## Context Provided to Agent

The agent now receives detailed context including:

```
## Available Global Data Context

### Global Directory Structure:
- global/well-files/ (X files, Y MB)
  - subdirectory1/ (Z files)
  - subdirectory2/ (Z files)

### Key Data Categories:
- **Well Log**: X files
  - Examples: file1.las, file2.las, file3.las
- **Data Table**: Y files
  - Examples: data1.csv, data2.csv
- **Report**: Z files

## Uploaded Files in Current Session

**N files uploaded in this session:**

### Session File Structure:
- uploads/ (N files, X MB)

### Uploaded File Types:  
- **Well Log**: N files
  - Examples: uploaded1.las, uploaded2.las

### Quick Access:
- Use `listFiles()` to explore session files
- Use `readFile("filename")` for specific uploaded files
- Use `searchFiles("pattern")` to find specific uploads
```

## Testing Verification

To verify the improvements work:

1. **Upload Test**: Upload `.las` files to global or session directories
2. **Context Check**: Start new chat and ask "What files are available?"  
3. **Expected Result**: Agent should immediately be aware of uploaded files
4. **Cache Test**: Upload additional files and verify context updates
5. **Performance Test**: Confirm system doesn't over-scan (respects 2-minute throttle)

## Configuration

Environment variables for tuning:
- `ENABLE_GLOBAL_CONTEXT_LOADING` - Enable/disable scanning (default: true)
- `GLOBAL_SCAN_MAX_FILES` - Maximum files to scan (default: 500)  
- `GLOBAL_SCAN_MAX_DEPTH` - Directory depth limit (default: 3)
- `GLOBAL_CONTEXT_CACHE_TTL` - Cache timeout in seconds (default: 3600)

## Conclusion

The agent now has comprehensive context awareness that automatically detects uploaded files in both global and session directories. Users can upload `.las` files or other artifacts and immediately ask questions related to the uploaded data without any manual intervention required.
