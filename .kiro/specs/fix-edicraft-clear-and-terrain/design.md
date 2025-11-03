# Design Document

## Overview

This design implements a simple, aggressive chunk-based clearing system that:
1. Wipes entire 32x32 chunk areas clean (ALL blocks, no filtering)
2. Restores ground level with appropriate terrain blocks
3. Handles timeouts and failures gracefully

## Architecture

### Component Interaction

```
User Request → EDIcraft Agent → Clear Environment Tool
                                        ↓
                                Chunk-Based Clearing
                                        ↓
                                RCON Commands (32x32 chunks)
                                        ↓
                                Minecraft Server
                                        ↓
                                Ground Restoration
                                        ↓
                                Response Template
```

## Components and Interfaces

### 1. Chunk-Based Clear Algorithm

**File:** `edicraft-agent/tools/clear_environment_tool.py`

**New Approach:**
- Divide clear region into 32x32 horizontal chunks
- For each chunk:
  1. Clear ALL blocks from ground level (y=60) to build height (y=255) with single `/fill` command
  2. Restore ground level (y=60-64) with grass_block or sand
- No block-type filtering - wipe everything

**Algorithm:**
```python
def clear_chunk(x_start, z_start, chunk_size=32):
    # Step 1: Wipe everything above ground
    /fill x_start 65 z_start (x_start+31) 255 (z_start+31) air
    
    # Step 2: Restore ground level
    /fill x_start 60 z_start (x_start+31) 64 (z_start+31) grass_block
```

**Rationale:** 
- Single fill command per chunk is much faster than selective block clearing
- 32x32 chunks are small enough to avoid RCON timeouts
- Ground restoration ensures clean, flat surface for new builds

### 2. Ground Level Detection and Restoration

**File:** `edicraft-agent/tools/clear_environment_tool.py`

**Design:**
- Default ground level: y=60-64 (standard Minecraft terrain)
- Ground block type: grass_block (or sand for desert biomes)
- Restoration happens immediately after clearing each chunk
- If ground restoration fails, log error but continue

**Rationale:** 
- Restoring ground immediately after clearing prevents "floating" structures
- Using grass_block provides natural-looking terrain
- Per-chunk restoration allows partial success if some chunks fail

### 3. Timeout and Retry Logic

**File:** `edicraft-agent/tools/rcon_executor.py`

**Design:**
- 30-second timeout per chunk clear operation
- 3 retry attempts per chunk on failure
- 5-minute total operation timeout
- Continue processing remaining chunks if one fails

**Rationale:**
- Large fill operations can timeout on slow servers
- Retries handle transient network issues
- Per-chunk failures don't abort entire operation

### 4. Horizon Visualization Fix

**File:** `edicraft-agent/tools/horizon_tools.py` and `edicraft-agent/tools/surface_tools.py`

**Current Issue:** Horizon surfaces not building correctly in Minecraft

**Design Changes:**
- Verify OSDU data fetching and parsing
- Fix coordinate transformation for surface visualization
- Ensure RCON commands execute correctly for horizon blocks
- Add error handling and logging for each step

**Rationale:**
- Horizon visualization is a key demo feature
- Must work reliably alongside wellbore trajectories
- Proper error handling helps diagnose issues

## Data Models

### Clear Operation Result

```python
@dataclass
class ChunkClearResult:
    x_start: int
    z_start: int
    cleared: bool
    ground_restored: bool
    blocks_cleared: int
    blocks_restored: int
    execution_time: float
    error: Optional[str] = None

@dataclass
class ClearOperationResult:
    total_chunks: int
    successful_chunks: int
    failed_chunks: int
    total_blocks_cleared: int
    total_blocks_restored: int
    execution_time: float
    chunk_results: List[ChunkClearResult]
    errors: List[str]
```

### Clear Region Configuration

```python
clear_config = {
    "region": {
        "x_min": -500,
        "x_max": 500,
        "z_min": -500,
        "z_max": 500,
        "y_clear_start": 65,    # Start clearing above ground
        "y_clear_end": 255,     # Clear to build height
        "y_ground_start": 60,   # Ground level start
        "y_ground_end": 64      # Ground level end
    },
    "chunk_size": 32,
    "ground_block": "grass_block",
    "timeout_per_chunk": 30,
    "max_retries": 3,
    "total_timeout": 300  # 5 minutes
}
```

## Error Handling

### Chunk Clearing Errors

- **Strategy:** Continue with remaining chunks if one fails
- **Logging:** Log chunk coordinates, error message, and retry attempts
- **User Feedback:** Include successful/failed chunk counts in response

### Ground Restoration Errors

- **Strategy:** Non-fatal - log error but continue with remaining chunks
- **Logging:** Log ground restoration results per chunk
- **User Feedback:** Include ground restoration status in response

### Horizon Build Errors

- **Strategy:** Return detailed error at each step (fetch, parse, convert, build)
- **Logging:** Log OSDU API calls, coordinate transformations, RCON commands
- **User Feedback:** Provide specific error message and recovery suggestions

### RCON Timeout Errors

- **Strategy:** Retry up to 3 times, then skip chunk and continue
- **Logging:** Log timeout duration and retry attempts
- **User Feedback:** Include timeout information in response summary

## Testing Strategy

### Unit Tests

1. **Test Chunk Division Logic**
   - Verify clear region divides into correct number of 32x32 chunks
   - Verify chunk coordinates are calculated correctly
   - Verify edge chunks handle region boundaries

2. **Test Ground Restoration Logic**
   - Verify ground level coordinates (y=60-64)
   - Verify grass_block placement
   - Verify restoration happens after clearing

3. **Test Horizon Coordinate Transformation**
   - Verify OSDU data parsing extracts X, Y, Z correctly
   - Verify coordinate transformation to Minecraft space
   - Verify surface scaling is appropriate

### Integration Tests

1. **Test Complete Clear Operation**
   - Build test structures (wellbores, rigs, horizons)
   - Execute chunk-based clear operation
   - Verify all blocks removed in cleared chunks
   - Verify ground restored correctly
   - Verify operation completes within timeout

2. **Test Horizon Build Workflow**
   - Fetch horizon data from OSDU
   - Parse and convert coordinates
   - Build surface in Minecraft
   - Verify blocks placed at correct locations
   - Verify surface is visible and correct

### Manual Testing

1. **Clear and Restore Workflow**
   - Build multiple wellbores and rigs
   - Execute clear operation
   - Verify entire area is wiped clean
   - Verify ground is flat and restored
   - Verify no structures remain

2. **Horizon Visualization**
   - Request horizon build
   - Verify horizon surface appears in Minecraft
   - Verify surface follows geological data
   - Verify horizon can be cleared with clear operation

## Implementation Notes

### Minecraft Fill Commands

- `/fill x1 y1 z1 x2 y2 z2 air` - Wipes all blocks in region
- `/fill x1 y1 z1 x2 y2 z2 grass_block` - Restores ground
- 32x32 horizontal chunks = 1,024 blocks per layer
- Clearing y=65 to y=255 = 191 layers × 1,024 blocks = ~195,000 blocks per chunk
- Ground restoration y=60 to y=64 = 5 layers × 1,024 blocks = 5,120 blocks per chunk

### Performance Considerations

- 32x32 chunks are small enough to avoid RCON timeouts
- Process chunks sequentially to avoid overwhelming server
- 30-second timeout per chunk should be sufficient
- Total clear time for 1000×1000 area = ~31 chunks × 30s = ~15 minutes max

### Horizon Visualization

- Horizon surfaces use sandstone blocks for visibility
- Glowstone markers every 50 points for reference
- Surface scaling must preserve geological structure
- Horizon blocks will be cleared by chunk-based clear operation

## Deployment Considerations

### Python Changes

- Update clear_environment_tool.py with expanded block lists
- Update terrain filling logic with layered approach
- Test with actual Minecraft server before deployment

### Frontend Changes

- Update EDIcraftResponseComponent.tsx if needed
- Test response parsing with various clear responses
- Verify no regressions in other EDIcraft responses

### Testing Requirements

- Test in sandbox environment first
- Verify with multiple wellbore builds
- Test with different rig styles
- Verify terrain looks natural after clearing

## Success Criteria

1. **Complete Clearing:** All visualization blocks removed, including all sign variants
2. **Natural Terrain:** Terrain filled with appropriate blocks at each layer
3. **Clean UI:** Clear button appears exactly once in correct location
4. **No Regressions:** Other EDIcraft features continue to work correctly
5. **Performance:** Clear operation completes within 30 seconds for typical demo environment
