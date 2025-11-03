# Requirements Document

## Introduction

Implement a simple, aggressive clear operation for EDIcraft that wipes entire 32x32 chunk areas clean, removing ALL blocks down to ground level and optionally restoring terrain. This replaces the complex selective block-type clearing that was timing out and failing.

## Glossary

- **EDIcraft Agent**: AI agent that builds wellbore visualizations in Minecraft
- **Clear Environment Tool**: Python tool that removes structures from Minecraft
- **RCON**: Remote Console protocol for sending commands to Minecraft server
- **Chunk**: 32x32 block horizontal area in Minecraft
- **Ground Level**: Y-coordinate 60-64, the standard terrain surface level
- **Area Wipe**: Complete removal of all blocks in a region, regardless of type

## Requirements

### Requirement 1: Chunk-Based Area Clearing

**User Story:** As a demo operator, I want to clear entire 32x32 chunk areas at a time, so that all structures are completely removed without selective filtering.

#### Acceptance Criteria

1. WHEN the clear environment tool is executed, THE System SHALL divide the clear region into 32x32 horizontal chunks
2. WHEN processing each chunk, THE System SHALL replace ALL blocks from ground level to build height with air
3. WHEN clearing a chunk, THE System SHALL NOT filter by block type
4. WHEN a chunk clear operation completes, THE System SHALL log the chunk coordinates and blocks cleared
5. WHEN a chunk clear operation fails, THE System SHALL log the error and continue with remaining chunks

### Requirement 2: Ground Level Restoration

**User Story:** As a demo operator, I want the ground to be restored to a flat surface after clearing, so that the world is ready for new visualizations.

#### Acceptance Criteria

1. WHEN preserve_terrain is True, THE System SHALL fill ground level (y=60 to y=64) with grass_block or sand
2. WHEN restoring ground, THE System SHALL process each 32x32 chunk independently
3. WHEN ground restoration completes, THE System SHALL log the number of blocks placed
4. WHEN ground restoration fails for a chunk, THE System SHALL log the error and continue with remaining chunks
5. WHEN preserve_terrain is False, THE System SHALL leave the area completely clear with no ground restoration

### Requirement 3: Horizon Visualization Fix

**User Story:** As a demo operator, I want horizon surfaces to build correctly in Minecraft, so that I can visualize geological horizons alongside wellbores.

#### Acceptance Criteria

1. WHEN building a horizon surface, THE System SHALL fetch horizon data from OSDU successfully
2. WHEN parsing horizon data, THE System SHALL extract X, Y, Z coordinates correctly
3. WHEN converting to Minecraft coordinates, THE System SHALL use appropriate scaling for surface visualization
4. WHEN building the surface, THE System SHALL place blocks at correct Minecraft coordinates
5. WHEN horizon build completes, THE System SHALL return success message with block count and coordinates

### Requirement 4: RCON Timeout Handling

**User Story:** As a demo operator, I want the clear operation to complete reliably without timing out, so that I can reset the environment for demos.

#### Acceptance Criteria

1. WHEN executing RCON commands, THE System SHALL use a timeout of 30 seconds per chunk
2. WHEN a chunk clear times out, THE System SHALL log the timeout and continue with remaining chunks
3. WHEN all chunks are processed, THE System SHALL return a summary of successful and failed chunks
4. WHEN the entire operation exceeds 5 minutes, THE System SHALL abort and return partial results
5. WHEN RCON connection fails, THE System SHALL retry up to 3 times before failing
