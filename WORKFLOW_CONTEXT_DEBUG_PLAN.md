# Workflow Context Debug Plan

## Problem Statement
"Project ID: for-wind-farm-4" is generating layouts for "Project ID: for-wind-farm" instead.

## Current Understanding

### Frontend Flow
1. User clicks "Generate Turbine Layout" button in WorkflowCTAButtons
2. Button generates query: `"generate turbine layout for {project_id}"`
3. ProjectContext provides `activeProject.projectId` (e.g., "for-wind-farm-4")
4. Query becomes: `"generate turbine layout for for-wind-farm-4"`
5. Query is passed to `handleSendMessage` in ChatPage
6. `sendMessage` utility sends to backend with `agentType: 'renewable'`

### Potential Issues

#### Issue 1: Project ID Format Mismatch
- Frontend might be using "for-wind-farm-4" 
- Backend might be expecting a different format
- Backend might be defaulting to "for-wind-farm" when it can't parse the ID

#### Issue 2: Backend Not Parsing Project ID from Query
- Backend might not be extracting project ID from the natural language query
- Backend might be using a cached/default project ID
- Backend might be looking for project ID in a different field

#### Issue 3: Project Context Not Being Extracted Correctly
- TerrainMapArtifact might not be setting the correct project ID
- Project ID extraction logic might be faulty
- Multiple projects might be overwriting each other

## Debugging Steps

### Step 1: Add Console Logging to Track Query
Add logging in ChatPage.tsx to see exactly what query is being sent:

```typescript
const handleSendMessage = async (message: string) => {
    console.log('🚀 [ChatPage] Sending message:', message);
    console.log('🎯 [ChatPage] Selected agent:', selectedAgent);
    console.log('🎯 [ChatPage] Chat session ID:', activeChatSession.id);
    // ... rest of function
}
```

### Step 2: Check Backend Lambda Logs
Check CloudWatch logs for the renewable orchestrator Lambda to see:
- What query text is received
- How project ID is extracted
- What project ID is used for layout generation

### Step 3: Verify Project ID Extraction in Artifacts
Check that TerrainMapArtifact is correctly extracting and setting project ID:

```typescript
// In TerrainMapArtifact.tsx
useEffect(() => {
    const projectInfo = extractProjectFromArtifact(data);
    console.log('🎨 [TerrainMap] Extracted project info:', projectInfo);
    console.log('🎨 [TerrainMap] Raw data.projectId:', data.projectId);
    console.log('🎨 [TerrainMap] Raw data.project_id:', data.project_id);
    setActiveProject(projectInfo);
}, [data]);
```

### Step 4: Check Backend Intent Classification
The backend might be using intent classification that doesn't properly extract project IDs from queries.

Need to check:
- How does the backend parse "generate turbine layout for for-wind-farm-4"?
- Does it extract "for-wind-farm-4" as the project ID?
- Or does it default to some other project?

## Hypothesis

**Most Likely Issue**: The backend is not extracting the project ID from the natural language query correctly.

When the query "generate turbine layout for for-wind-farm-4" is sent:
1. Backend receives the query
2. Backend classifies intent as "layout_generation"
3. Backend tries to extract project ID from query
4. Backend fails to extract or extracts wrong ID
5. Backend defaults to "for-wind-farm" (maybe the first project in the database?)
6. Layout is generated for wrong project

## Solution Approach

### Option 1: Pass Project ID as Separate Field (RECOMMENDED)
Instead of embedding project ID in the query text, pass it as a separate field:

```typescript
await sendMessage({
    chatSessionId: activeChatSession.id,
    newMessage: {
        role: 'human',
        content: { text: message },
        metadata: {
            projectId: activeProject?.projectId,
            projectName: activeProject?.projectName,
            location: activeProject?.location
        }
    },
    agentType: selectedAgent,
});
```

Then backend can use `metadata.projectId` directly instead of parsing the query.

### Option 2: Improve Backend Query Parsing
Update backend to better extract project IDs from queries:
- Use regex to extract "for-wind-farm-X" pattern
- Look for "for {project_id}" pattern
- Validate extracted project ID exists in database

### Option 3: Use Project Context in Backend Session
Store active project ID in the chat session context on the backend:
- When terrain is analyzed, store project ID in session
- When layout is requested, use project ID from session
- Update session project ID when user switches projects

## Next Steps

1. Add comprehensive logging to frontend
2. Deploy frontend
3. Test with multiple projects
4. Check CloudWatch logs to see what backend receives
5. Identify exact point of failure
6. Implement fix (likely Option 1)
7. Deploy and verify

## Testing Plan

After fix is implemented:

1. Create project "for-wind-farm-1" at location A
2. Analyze terrain → verify project ID is "for-wind-farm-1"
3. Generate layout → verify layout is for "for-wind-farm-1"
4. Create project "for-wind-farm-2" at location B
5. Analyze terrain → verify project ID is "for-wind-farm-2"
6. Generate layout → verify layout is for "for-wind-farm-2"
7. Switch back to "for-wind-farm-1" via dashboard
8. Generate layout → verify layout is for "for-wind-farm-1"
