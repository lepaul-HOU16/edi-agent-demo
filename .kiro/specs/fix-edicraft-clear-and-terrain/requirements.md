# Requirements Document

## Introduction

Fix three critical issues with the EDIcraft Minecraft clear environment functionality:
1. One block type (appears to be oak_wall_sign based on screenshot) is not being deleted during clear operations
2. Clear button is appearing in chat messages AND duplicating
3. Terrain needs to be properly filled after clearing structures

## Glossary

- **EDIcraft Agent**: AI agent that builds wellbore visualizations in Minecraft
- **Clear Environment Tool**: Python tool that removes wellbore structures from Minecraft
- **RCON**: Remote Console protocol for sending commands to Minecraft server
- **Block Type**: Specific Minecraft block material (e.g., obsidian, oak_wall_sign)
- **Terrain Fill**: Process of replacing air blocks with appropriate terrain blocks after clearing

## Requirements

### Requirement 1: Complete Block Clearing

**User Story:** As a demo operator, I want all visualization blocks to be cleared when I use the clear environment tool, so that no remnants are left behind.

#### Acceptance Criteria

1. WHEN the clear environment tool is executed, THE System SHALL clear all block types including oak_wall_sign, oak_sign, and wall_sign variants
2. WHEN clearing wellbore blocks, THE System SHALL include all sign block types in the rig_blocks list
3. WHEN clearing is complete, THE System SHALL verify no visualization blocks remain in the clear region
4. WHEN a block type fails to clear, THE System SHALL log the failure and continue with other block types
5. WHEN clearing signs, THE System SHALL handle both standing signs and wall-mounted signs

### Requirement 2: Clear Button UI Fix

**User Story:** As a user, I want the clear button to appear only once in the appropriate location, so that the interface is clean and not confusing.

#### Acceptance Criteria

1. WHEN an EDIcraft response contains clear confirmation, THE System SHALL render the clear button only in the EDIcraftResponseComponent
2. WHEN rendering chat messages, THE System SHALL NOT duplicate clear buttons from the response content
3. WHEN a clear operation completes, THE System SHALL display the button in a consistent location
4. WHEN the user clicks the clear button, THE System SHALL execute the clear operation without creating duplicate buttons
5. WHEN parsing EDIcraft responses, THE System SHALL identify clear confirmation responses and render them with proper formatting

### Requirement 3: Terrain Filling

**User Story:** As a demo operator, I want the terrain to be properly filled after clearing structures, so that the Minecraft world looks natural and ready for new visualizations.

#### Acceptance Criteria

1. WHEN preserve_terrain is True, THE System SHALL fill underground air pockets with stone blocks
2. WHEN filling terrain, THE System SHALL fill surface level (y=61 to y=70) with grass_block
3. WHEN filling terrain, THE System SHALL fill subsurface (y=50 to y=60) with dirt
4. WHEN filling terrain, THE System SHALL fill deep underground (y=0 to y=49) with stone
5. WHEN terrain filling completes, THE System SHALL log the number of blocks filled
6. WHEN terrain filling fails, THE System SHALL log the error but not fail the entire clear operation
7. WHEN filling terrain, THE System SHALL only replace air blocks, not existing terrain blocks
