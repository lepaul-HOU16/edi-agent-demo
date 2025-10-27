# Implementation Plan

- [x] 1. Fix orchestrator to pass through Plotly wind rose data
  - Modify `amplify/functions/renewableOrchestrator/handler.ts` in the `wind_rose_analysis` case
  - Add `plotlyWindRose: result.data.plotlyWindRose` to artifact data
  - Add `visualizationUrl` field for PNG fallback
  - _Requirements: 2.1, 2.2_

- [x] 2. Fix Export button positioning in WindRoseArtifact header
  - Modify `src/components/renewable/WindRoseArtifact.tsx` header section
  - Wrap title in div with max-width calculation to allow for button space
  - Add 20px right padding to title wrapper
  - Ensure actions (badges + button) stay in top right
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 3. Verify visualization priority logic
  - Confirm PlotlyWindRose component renders when `data.plotlyWindRose` is present
  - Confirm fallback to PNG when Plotly data is missing
  - Confirm fallback to SVG when both Plotly and PNG are missing
  - Add console logging to track which visualization path is taken
  - _Requirements: 2.3, 2.4, 2.5_

- [x] 4. Test end-to-end flow
  - Deploy changes to sandbox
  - Test query: "show me a wind rose for 35.067482, -101.395466"
  - Verify Plotly interactive wind rose displays (not matplotlib PNG)
  - Verify Export button is in top right corner
  - Verify title wraps properly with long project names
  - Verify hover interactions work on Plotly chart
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3_

- [ ] 5. Test fallback scenarios
  - Test with Plotly data missing (should show PNG)
  - Test with both Plotly and PNG missing (should show SVG)
  - Test with no data (should show "No data" message)
  - Verify graceful degradation at each level
  - _Requirements: 2.4, 2.5_
