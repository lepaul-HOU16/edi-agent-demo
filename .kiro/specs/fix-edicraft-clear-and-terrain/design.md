# Design Document

## Overview

This design addresses three interconnected issues with the EDIcraft clear environment functionality:
1. Incomplete block clearing (missing sign variants)
2. Duplicate clear button rendering in UI
3. Inadequate terrain filling after structure removal

## Architecture

### Component Interaction

```
User Request → EDIcraft Agent → Clear Environment Tool → RCON Commands → Minecraft Server
                                        ↓
                                Response Template
                                        ↓
                            EDIcraftResponseComponent → UI Rendering
```

## Components and Interfaces

### 1. Clear Environment Tool (Python)

**File:** `edicraft-agent/tools/clear_environment_tool.py`

**Current Issue:** Missing sign block variants in rig_blocks list

**Design Changes:**
- Add all sign variants to rig_blocks list:
  - `oak_sign` (standing sign)
  - `oak_wall_sign` (wall-mounted sign)
  - `wall_sign` (generic wall sign)
  - `spruce_sign`, `birch_sign`, `jungle_sign`, `acacia_sign`, `dark_oak_sign`
  - Corresponding wall variants for each wood type

**Rationale:** Signs are placed by the drilling rig builder and must be cleared. Wall signs are a separate block type from standing signs in Minecraft.

### 2. Terrain Filling Logic

**Current Issue:** Only fills surface level (y=61-70), leaving holes in subsurface

**Design Changes:**
- Implement layered terrain filling:
  - **Surface Layer (y=61-70):** grass_block
  - **Subsurface Layer (y=50-60):** dirt
  - **Deep Layer (y=0-49):** stone
- Use separate fill commands for each layer
- Only replace air blocks, preserve existing terrain

**Rationale:** Natural terrain has distinct layers. Filling only the surface leaves visible holes when players dig or when wellbores penetrate multiple layers.

### 3. EDIcraft Response Component (React)

**File:** `src/components/messageComponents/EDIcraftResponseComponent.tsx`

**Current Issue:** Clear button may be rendering multiple times or in wrong location

**Design Changes:**
- Ensure clear confirmation responses are properly detected
- Render clear button only once in the response component
- Add CSS class to prevent duplication
- Verify isEDIcraftResponse() correctly identifies clear confirmations

**Rationale:** UI duplication suggests either multiple render calls or improper response parsing.

## Data Models

### Clear Operation Result

```typescript
interface ClearResult {
  wellbores_cleared: number;
  rigs_cleared: number;
  blocks_cleared: number;
  entities_cleared: number;
  terrain_filled: {
    surface: number;
    subsurface: number;
    deep: number;
  };
  errors: string[];
}
```

### Block Type Categories

```python
wellbore_blocks = [
  "obsidian", "glowstone", "emerald_block", "diamond_block",
  "gold_block", "iron_block", "lapis_block", "redstone_block",
  "coal_block", "quartz_block", "prismarine", "dark_prismarine"
]

rig_blocks = [
  "iron_bars", "smooth_stone_slab", "furnace", "hopper", "chest",
  # ADD ALL SIGN VARIANTS:
  "oak_sign", "oak_wall_sign", "wall_sign",
  "spruce_sign", "spruce_wall_sign",
  "birch_sign", "birch_wall_sign",
  "jungle_sign", "jungle_wall_sign",
  "acacia_sign", "acacia_wall_sign",
  "dark_oak_sign", "dark_oak_wall_sign",
  "crimson_sign", "crimson_wall_sign",
  "warped_sign", "warped_wall_sign",
  # Other rig blocks:
  "iron_trapdoor", "ladder", "torch", "wall_torch",
  "lantern", "chain", "anvil", "crafting_table",
  "barrel", "smoker", "blast_furnace"
]

marker_blocks = [
  "beacon", "sea_lantern", "end_rod", "redstone_lamp",
  "glowstone", "shroomlight"
]
```

## Error Handling

### Block Clearing Errors

- **Strategy:** Continue clearing other blocks if one type fails
- **Logging:** Log each failed block type with error message
- **User Feedback:** Include failed block types in response summary

### Terrain Filling Errors

- **Strategy:** Non-fatal - log error but don't fail entire operation
- **Logging:** Log layer-by-layer filling results
- **User Feedback:** Include terrain filling status in response

### UI Rendering Errors

- **Strategy:** Fallback to plain text rendering if component fails
- **Logging:** Log parsing errors to console
- **User Feedback:** Display raw response if formatted rendering fails

## Testing Strategy

### Unit Tests

1. **Test Block Type Lists**
   - Verify all sign variants are in rig_blocks
   - Verify no duplicate block types across categories

2. **Test Terrain Filling Logic**
   - Verify correct block types for each layer
   - Verify correct y-coordinate ranges
   - Verify air-only replacement

3. **Test Response Parsing**
   - Verify clear confirmation detection
   - Verify button rendering logic
   - Verify no duplicate buttons

### Integration Tests

1. **Test Complete Clear Operation**
   - Build test structures with all block types
   - Execute clear operation
   - Verify all blocks removed
   - Verify terrain filled correctly

2. **Test UI Rendering**
   - Send clear confirmation response
   - Verify single button renders
   - Verify button in correct location
   - Verify no duplicates in DOM

### Manual Testing

1. **Build and Clear Workflow**
   - Build wellbore with drilling rig
   - Verify signs are placed
   - Execute clear operation
   - Verify all signs removed
   - Verify terrain looks natural

2. **UI Verification**
   - Execute clear operation
   - Check chat for clear button
   - Verify button appears once
   - Verify button is clickable
   - Verify no visual duplicates

## Implementation Notes

### Minecraft Block Types

- Standing signs and wall signs are different block types in Minecraft
- Wall signs attach to blocks, standing signs are placed on top
- Each wood type has its own sign variant (oak, spruce, birch, etc.)
- Must clear both standing and wall variants

### Terrain Filling Performance

- Large fill operations can lag Minecraft server
- Use 30x30x30 chunk size for fill commands (27,000 blocks per command)
- Process layers sequentially to avoid overwhelming server
- Consider adding delay between large fill operations

### UI Rendering

- React may re-render components multiple times
- Use React.memo() or useMemo() to prevent duplicate renders
- Ensure response parsing is idempotent
- Add unique keys to prevent React key conflicts

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
