# Implementation Plan

- [x] 1. Implement chunk-based clear algorithm
  - Modify clear_environment_tool.py to divide region into 32x32 chunks
  - Implement chunk clearing with single /fill command per chunk (y=65 to y=255)
  - Add chunk coordinate calculation and iteration logic
  - Add per-chunk timeout handling (30 seconds)
  - Log each chunk's clear status and blocks cleared
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Implement ground restoration
  - Add ground restoration after each chunk clear
  - Use /fill command to place grass_block at y=60 to y=64
  - Handle ground restoration failures gracefully
  - Log ground restoration results per chunk
  - Ensure ground restoration only happens when preserve_terrain=True
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 3. Add timeout and retry logic
  - Implement 30-second timeout per chunk operation
  - Add 3 retry attempts for failed chunks
  - Implement 5-minute total operation timeout
  - Continue with remaining chunks if one fails
  - Add RCON connection retry logic (3 attempts)
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 4. Fix horizon visualization
  - Verify OSDU horizon data fetching in horizon_tools.py
  - Check coordinate parsing and transformation logic
  - Verify RCON commands for horizon block placement
  - Add error handling and logging for each step
  - Test horizon build with actual OSDU data
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 5. Update clear operation response and UI
  - Modify response template to show chunk-based results
  - Include successful/failed chunk counts
  - Show total blocks cleared and ground blocks restored
  - Display execution time and any errors
  - Update landing page panel "Clear" button to use new chunk-based wipe operation
  - Ensure button text and behavior reflect aggressive area wipe
  - _Requirements: 1.4, 2.3, 4.3_

- [x] 6. Test complete clear and restore workflow
  - Build test structures (wellbores, rigs, horizons)
  - Execute chunk-based clear operation
  - Verify all blocks removed in cleared area
  - Verify ground restored to flat surface
  - Verify operation completes within timeout
  - Check for any remaining structures or artifacts
  - _Requirements: All_
