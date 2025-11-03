# EDIcraft Demo Enhancements - Design

## Overview

This design implements a comprehensive set of enhancements to the EDIcraft Minecraft visualization system, focusing on demo experience, visual polish, collection integration, and professional response formatting using AWS Cloudscape Design System.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Chat Interface with Collection Context Badge        │  │
│  │  - Create New Chat (retains collection context)      │  │
│  │  - Cloudscape Response Templates                     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              EDIcraft Agent (Lambda/Bedrock)                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Enhanced Workflow Tools                             │  │
│  │  - clear_minecraft_environment()                     │  │
│  │  - build_wellbore_with_rig()                         │  │
│  │  - lock_world_time()                                 │  │
│  │  - visualize_collection_wells()                      │  │
│  │  - reset_demo_environment()                          │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Response Template Engine                            │  │
│  │  - Cloudscape component generators                   │  │
│  │  - Structured response builders                      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                ▼                       ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│   Minecraft Server       │  │   Data Sources           │
│   - RCON Commands        │  │   - OSDU Platform        │
│   - World Management     │  │   - S3 Buckets           │
│   - Structure Building   │  │   - Collection Service   │
└──────────────────────────┘  └──────────────────────────┘
```

## Components and Interfaces

### 1. Enhanced Workflow Tools (Python)

**Location:** `edicraft-agent/tools/workflow_tools.py`

#### New Tool: `clear_minecraft_environment()`

```python
@tool
def clear_minecraft_environment(
    area: str = "all",
    preserve_terrain: bool = True
) -> str:
    """
    Clear wellbore visualizations from Minecraft world.
    
    Args:
        area: "all" | "wellbores" | "rigs" | "markers" | specific coordinates
        preserve_terrain: Keep terrain and base structures
    
    Returns:
        Cloudscape-formatted response with clear results
    """
```

**Implementation Details:**
- Use RCON `fill` commands to clear specific block types
- Track cleared blocks by type (obsidian, glowstone, emerald, etc.)
- Preserve terrain blocks (grass, dirt, stone, water)
- Return structured response with counts and confirmation

#### Enhanced Tool: `build_wellbore_trajectory_complete()`

**Modifications:**
- Add drilling rig construction after wellbore build
- Use simplified well names in markers
- Apply color coding based on well properties
- Return Cloudscape-formatted response

#### New Tool: `build_drilling_rig()`

```python
@tool
def build_drilling_rig(
    x: int,
    y: int,
    z: int,
    well_name: str,
    rig_style: str = "standard"
) -> str:
    """
    Build a drilling rig structure at wellhead location.
    
    Args:
        x, y, z: Wellhead coordinates
        well_name: Short well name for signage
        rig_style: "standard" | "compact" | "detailed"
    
    Returns:
        Cloudscape-formatted response with rig details
    """
```

**Rig Structure Design:**
- **Derrick:** Iron bars forming tower (15 blocks high)
- **Platform:** Smooth stone slab base (5x5)
- **Equipment:** Furnaces, hoppers, chests for visual detail
- **Signage:** Oak signs with well name
- **Lighting:** Glowstone for visibility

#### New Tool: `lock_world_time()`

```python
@tool
def lock_world_time(
    time: str = "day",
    enabled: bool = True
) -> str:
    """
    Lock Minecraft world time for consistent visibility.
    
    Args:
        time: "day" | "noon" | "sunset" | "night"
        enabled: True to lock, False to unlock
    
    Returns:
        Cloudscape-formatted response with time lock status
    """
```

**Implementation:**
- Use RCON `time set` command (day = 1000, noon = 6000)
- Use RCON `gamerule doDaylightCycle false` to lock
- Store lock state for status queries

#### New Tool: `visualize_collection_wells()`

```python
@tool
def visualize_collection_wells(
    collection_id: str,
    batch_size: int = 5,
    spacing: int = 50
) -> str:
    """
    Visualize all wellbores from a collection in Minecraft.
    
    Args:
        collection_id: Collection identifier
        batch_size: Wells to process simultaneously
        spacing: Distance between wellheads (blocks)
    
    Returns:
        Cloudscape-formatted response with batch progress
    """
```

**Implementation:**
- Query collection service for well list
- Fetch trajectory data from S3 or OSDU
- Build wellbores in batches with progress updates
- Arrange wellheads in grid pattern with spacing
- Build rigs at each wellhead
- Return summary with success/failure counts

#### New Tool: `reset_demo_environment()`

```python
@tool
def reset_demo_environment(
    confirm: bool = False
) -> str:
    """
    Reset entire demo environment to clean state.
    
    Args:
        confirm: Must be True to execute (safety check)
    
    Returns:
        Cloudscape-formatted response with reset confirmation
    """
```

**Implementation:**
- Clear all wellbores
- Remove all rigs
- Clear all markers
- Lock time to day
- Teleport players to spawn
- Return ready-for-demo confirmation

### 2. Name Simplification Service

**Location:** `edicraft-agent/tools/name_utils.py` (new file)

```python
class WellNameSimplifier:
    """
    Simplify OSDU well identifiers to user-friendly names.
    """
    
    def __init__(self):
        self.name_cache = {}  # Map full ID to short name
        self.id_cache = {}    # Map short name to full ID
    
    def simplify_name(self, osdu_id: str) -> str:
        """
        Convert OSDU ID to short name.
        
        Examples:
        - "osdu:work-product-component--WellboreTrajectory:WELL-007:..." -> "WELL-007"
        - "osdu:master-data--Wellbore:12345..." -> "WELL-12345"
        """
    
    def get_full_id(self, short_name: str) -> str:
        """Get full OSDU ID from short name."""
    
    def register_well(self, osdu_id: str, short_name: str = None):
        """Register well in cache with optional custom short name."""
```

### 3. Response Template Engine

**Location:** `edicraft-agent/tools/response_templates.py` (new file)

```python
class CloudscapeResponseBuilder:
    """
    Build structured responses using Cloudscape component patterns.
    """
    
    @staticmethod
    def wellbore_success(
        well_name: str,
        data_points: int,
        blocks_placed: int,
        coordinates: dict,
        has_rig: bool = False
    ) -> str:
        """
        Generate wellbore build success response.
        
        Returns Cloudscape-formatted markdown with:
        - Status header with ✅
        - Details section with key metrics
        - Location information
        - Next steps or tips
        """
    
    @staticmethod
    def batch_progress(
        current: int,
        total: int,
        well_name: str,
        status: str
    ) -> str:
        """Generate batch operation progress update."""
    
    @staticmethod
    def error_response(
        operation: str,
        error_message: str,
        suggestions: list[str]
    ) -> str:
        """Generate error response with recovery suggestions."""
    
    @staticmethod
    def demo_reset_confirmation() -> str:
        """Generate demo reset confirmation response."""
```

**Template Structure:**

```markdown
✅ **[Operation] Complete**

**Details:**
- **[Key Metric 1]:** [Value]
- **[Key Metric 2]:** [Value]
- **[Key Metric 3]:** [Value]

**[Section Title]:**
- [Detail 1]
- [Detail 2]
- [Detail 3]

💡 **Tip:** [Helpful information or next steps]
```

### 4. Clear Environment UI Component

**Location:** `src/components/EDIcraftControls.tsx` (new file)

```typescript
interface EDIcraftControlsProps {
  chatSessionId: string;
  onClearEnvironment: () => void;
}

export function EDIcraftControls({ chatSessionId, onClearEnvironment }: EDIcraftControlsProps) {
  const [isClearing, setIsClearing] = useState(false);
  
  const handleClear = async () => {
    setIsClearing(true);
    try {
      await onClearEnvironment();
    } finally {
      setIsClearing(false);
    }
  };
  
  return (
    <SpaceBetween direction="horizontal" size="xs">
      <Button
        variant="normal"
        iconName="remove"
        onClick={handleClear}
        loading={isClearing}
      >
        Clear Minecraft Environment
      </Button>
    </SpaceBetween>
  );
}
```

**Location:** `src/app/chat/[chatSessionId]/page.tsx`

**Modifications:**

```typescript
// Add EDIcraft controls when agent is EDIcraft
{currentAgent === 'edicraft' && (
  <EDIcraftControls
    chatSessionId={chatSessionId}
    onClearEnvironment={async () => {
      // Send clear command to EDIcraft agent
      await sendMessage('Clear the Minecraft environment');
    }}
  />
)}

// Update "Create New Chat" button to pass current session
<Button
  onClick={() => {
    router.push(`/create-new-chat?fromSession=${chatSessionId}`);
  }}
>
  Create New Chat
</Button>
```

### 5. Frontend Collection Context Retention

**Location:** `src/app/create-new-chat/page.tsx`

**Modifications:**

```typescript
// Check for collection context in current session
const currentSessionId = searchParams.get('fromSession');
let collectionId = searchParams.get('collectionId');

if (currentSessionId && !collectionId) {
  // Fetch current session to get collection context
  const { data: currentSession } = await amplifyClient.models.ChatSession.get({
    id: currentSessionId
  });
  
  if (currentSession?.linkedCollectionId) {
    collectionId = currentSession.linkedCollectionId;
    console.log('✅ Inherited collection context from current session');
  }
}

// Create new session with inherited collection context
const sessionData: any = {};
if (collectionId) {
  sessionData.linkedCollectionId = collectionId;
  const context = await loadCanvasContext('', collectionId);
  if (context) {
    sessionData.collectionContext = context;
  }
}
```

### 6. Collection Service Integration

**Location:** `amplify/functions/collectionService/handler.ts`

**New Query:** `getCollectionWells`

```typescript
async function getCollectionWells(collectionId: string) {
  // Get collection data
  const collection = await getCollectionById(collectionId);
  
  // Extract well identifiers from data items
  const wells = collection.dataItems
    .filter(item => item.type === 'wellbore' || item.type === 'trajectory')
    .map(item => ({
      id: item.id,
      name: item.name,
      s3Key: item.s3Key,
      osduId: item.osduId
    }));
  
  return {
    success: true,
    wells,
    count: wells.length
  };
}
```

### 7. S3 Data Access Layer

**Location:** `edicraft-agent/tools/s3_data_access.py` (new file)

```python
class S3WellDataAccess:
    """
    Access well trajectory data from S3 buckets.
    """
    
    def __init__(self, bucket_name: str):
        self.bucket_name = bucket_name
        self.s3_client = boto3.client('s3')
    
    def get_trajectory_data(self, s3_key: str) -> dict:
        """
        Fetch trajectory data from S3.
        
        Returns:
            Dictionary with coordinates or survey data
        """
    
    def list_collection_wells(self, collection_prefix: str) -> list:
        """
        List all well files in collection prefix.
        
        Returns:
            List of S3 keys for well trajectory files
        """
    
    def parse_las_file(self, s3_key: str) -> dict:
        """
        Parse LAS file from S3 and extract trajectory data.
        """
```

## Data Models

### Well Name Mapping

```python
{
  "osdu_id": "osdu:work-product-component--WellboreTrajectory:WELL-007:...",
  "short_name": "WELL-007",
  "display_name": "Well 007",
  "collection_id": "collection-123",
  "s3_key": "wells/well-007/trajectory.las"
}
```

### Drilling Rig Structure

```python
{
  "location": {"x": 30, "y": 100, "z": 20},
  "well_name": "WELL-007",
  "style": "standard",
  "components": {
    "derrick": {"height": 15, "material": "iron_bars"},
    "platform": {"size": "5x5", "material": "smooth_stone_slab"},
    "equipment": ["furnace", "hopper", "chest"],
    "signage": {"material": "oak_sign", "text": "WELL-007"}
  }
}
```

### Cloudscape Response Template

```python
{
  "status": "success" | "error" | "progress",
  "icon": "✅" | "❌" | "⏳",
  "title": "Operation Complete",
  "sections": [
    {
      "title": "Details",
      "items": [
        {"label": "Wellbore ID", "value": "WELL-007"},
        {"label": "Data Points", "value": "107"}
      ]
    },
    {
      "title": "Minecraft Location",
      "items": [
        {"label": "Coordinates", "value": "(30, 100, 20)"}
      ]
    }
  ],
  "tip": "The wellbore is now visible in Minecraft!"
}
```

## Error Handling

### Clear Environment Errors

- **No wellbores found:** Return info message, no error
- **RCON connection failed:** Retry with exponential backoff
- **Partial clear:** Report what was cleared, what failed

### Rig Building Errors

- **Insufficient space:** Scale rig or suggest alternative location
- **Block placement failed:** Retry individual blocks, report failures
- **Overlapping rigs:** Adjust spacing automatically

### Collection Visualization Errors

- **Collection not found:** Clear error with collection ID
- **S3 access denied:** Check permissions, suggest IAM policy
- **Invalid trajectory data:** Skip well, continue with others
- **Batch timeout:** Process in smaller batches

### Time Lock Errors

- **RCON command failed:** Retry, fallback to manual instruction
- **Permission denied:** Suggest server configuration change

## Testing Strategy

### Unit Tests

1. **Name Simplification**
   - Test OSDU ID parsing
   - Test short name generation
   - Test duplicate name handling

2. **Response Templates**
   - Test template rendering
   - Test Cloudscape formatting
   - Test error message generation

3. **S3 Data Access**
   - Test trajectory data fetching
   - Test LAS file parsing
   - Test error handling

### Integration Tests

1. **Clear Environment**
   - Test full clear operation
   - Test selective clear
   - Test terrain preservation

2. **Rig Building**
   - Test rig structure creation
   - Test signage placement
   - Test multiple rigs

3. **Collection Visualization**
   - Test batch wellbore building
   - Test progress updates
   - Test error recovery

4. **Collection Context Retention**
   - Test context inheritance
   - Test new canvas creation
   - Test badge display

### End-to-End Tests

1. **Demo Workflow**
   - Create collection with 24 wells
   - Create canvas from collection
   - Visualize all wells
   - Verify rigs and markers
   - Clear environment
   - Reset demo

2. **Multi-Canvas Workflow**
   - Create canvas from collection
   - Create new canvas (inherit context)
   - Verify both have same collection scope
   - Verify badge displays correctly

## Performance Considerations

### Batch Processing

- Process wells in batches of 5 to avoid timeouts
- Use async operations where possible
- Cache S3 data to reduce API calls

### Minecraft Command Optimization

- Batch RCON commands where possible
- Use `fill` commands for large areas
- Minimize individual `setblock` calls

### Response Generation

- Pre-compile response templates
- Cache formatted responses for common operations
- Minimize string concatenation

## Security Considerations

### S3 Access

- Validate collection permissions before S3 access
- Use IAM roles, not access keys
- Implement least-privilege access

### RCON Security

- Validate all RCON commands
- Sanitize user input in well names
- Limit command execution rate

### Collection Context

- Validate collection ownership
- Ensure user has access to collection data
- Prevent cross-collection data leakage

## Deployment Strategy

### Phase 1: Core Tools (Week 1)
- Implement clear environment tool
- Implement time lock tool
- Implement name simplification
- Deploy and test

### Phase 2: Visual Enhancements (Week 2)
- Implement drilling rig builder
- Implement color coding
- Implement response templates
- Deploy and test

### Phase 3: Collection Integration (Week 3)
- Implement collection visualization
- Implement S3 data access
- Implement batch processing
- Deploy and test

### Phase 4: Frontend Integration (Week 4)
- Implement collection context retention
- Update create new chat flow
- Implement response rendering
- Deploy and test

### Phase 5: Polish and Testing (Week 5)
- Implement demo reset
- End-to-end testing
- Performance optimization
- Documentation

