#!/usr/bin/env python3
"""
Integration tests for enhanced wellbore build tool.

Tests the complete enhanced wellbore workflow including:
- Rig integration after wellbore construction
- Name simplification in markers and signs
- Color coding based on well properties
- Response template usage
"""

import sys
import os
import unittest
from unittest.mock import Mock, patch, MagicMock

# Add edicraft-agent to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'edicraft-agent'))

from tools.workflow_tools import build_wellbore_trajectory_complete
from tools.name_utils import simplify_well_name


class TestEnhancedWellboreIntegration(unittest.TestCase):
    """Integration tests for enhanced wellbore build."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.mock_rcon = MagicMock()
        self.mock_trajectory_data = {
            "coordinates": [
                {"x": 100.0, "y": 100.0, "z": 100.0},
                {"x": 100.5, "y": 95.0, "z": 100.5},
                {"x": 101.0, "y": 90.0, "z": 101.0}
            ]
        }
        
    @patch('tools.workflow_tools.get_rcon_connection')
    @patch('tools.workflow_tools.fetch_trajectory_data')
    def test_rig_integration(self, mock_fetch, mock_get_rcon):
        """Test that rig is built after wellbore construction."""
        # Setup mocks
        mock_fetch.return_value = self.mock_trajectory_data
        mock_get_rcon.return_value = self.mock_rcon
        self.mock_rcon.command.return_value = "Block placed"
        
        # Build wellbore
        result = build_wellbore_trajectory_complete(
            trajectory_id="WELL-007",
            well_name="WELL-007"
        )
        
        # Verify rig was built
        self.assertIn("rig", result.lower())
        self.assertIn("✅", result)
        
    @patch('tools.workflow_tools.get_rcon_connection')
    @patch('tools.workflow_tools.fetch_trajectory_data')
    def test_name_simplification(self, mock_fetch, mock_get_rcon):
        """Test that OSDU IDs are simplified in markers."""
        # Setup mocks
        mock_fetch.return_value = self.mock_trajectory_data
        mock_get_rcon.return_value = self.mock_rcon
        self.mock_rcon.command.return_value = "Block placed"
        
        # Build wellbore with OSDU ID
        osdu_id = "osdu:work-product-component--WellboreTrajectory:WELL-007:abc123"
        result = build_wellbore_trajectory_complete(
            trajectory_id=osdu_id,
            well_name=osdu_id
        )
        
        # Verify short name is used
        self.assertIn("WELL-007", result)
        self.assertNotIn("osdu:work-product-component", result)
        
    @patch('tools.workflow_tools.get_rcon_connection')
    @patch('tools.workflow_tools.fetch_trajectory_data')
    def test_color_coding(self, mock_fetch, mock_get_rcon):
        """Test that color coding is applied based on well properties."""
        # Setup mocks
        mock_fetch.return_value = self.mock_trajectory_data
        mock_get_rcon.return_value = self.mock_rcon
        self.mock_rcon.command.return_value = "Block placed"
        
        # Build wellbore
        result = build_wellbore_trajectory_complete(
            trajectory_id="WELL-007",
            well_name="WELL-007",
            well_type="production"
        )
        
        # Verify color coding mentioned
        calls = [str(call) for call in self.mock_rcon.command.call_args_list]
        combined_calls = ' '.join(calls)
        
        # Should use colored blocks
        self.assertTrue(
            any(block in combined_calls for block in ["obsidian", "glowstone", "emerald", "diamond"]),
            "Should use colored blocks for wellbore"
        )
        
    @patch('tools.workflow_tools.get_rcon_connection')
    @patch('tools.workflow_tools.fetch_trajectory_data')
    def test_depth_markers(self, mock_fetch, mock_get_rcon):
        """Test that depth markers are placed at regular intervals."""
        # Setup mocks with deeper trajectory
        deep_trajectory = {
            "coordinates": [
                {"x": 100.0, "y": 100.0, "z": 100.0},
                {"x": 100.0, "y": 50.0, "z": 100.0},
                {"x": 100.0, "y": 0.0, "z": 100.0}
            ]
        }
        mock_fetch.return_value = deep_trajectory
        mock_get_rcon.return_value = self.mock_rcon
        self.mock_rcon.command.return_value = "Block placed"
        
        # Build wellbore
        result = build_wellbore_trajectory_complete(
            trajectory_id="WELL-DEEP",
            well_name="WELL-DEEP"
        )
        
        # Verify depth markers mentioned
        self.assertIn("marker", result.lower())
        
    @patch('tools.workflow_tools.get_rcon_connection')
    @patch('tools.workflow_tools.fetch_trajectory_data')
    def test_ground_level_markers(self, mock_fetch, mock_get_rcon):
        """Test that ground-level markers are placed."""
        # Setup mocks
        mock_fetch.return_value = self.mock_trajectory_data
        mock_get_rcon.return_value = self.mock_rcon
        self.mock_rcon.command.return_value = "Block placed"
        
        # Build wellbore
        result = build_wellbore_trajectory_complete(
            trajectory_id="WELL-MARKER",
            well_name="WELL-MARKER"
        )
        
        # Verify surface marker mentioned
        self.assertIn("surface", result.lower() or "wellhead" in result.lower())
        
    @patch('tools.workflow_tools.get_rcon_connection')
    @patch('tools.workflow_tools.fetch_trajectory_data')
    def test_response_template_usage(self, mock_fetch, mock_get_rcon):
        """Test that CloudscapeResponseBuilder is used."""
        # Setup mocks
        mock_fetch.return_value = self.mock_trajectory_data
        mock_get_rcon.return_value = self.mock_rcon
        self.mock_rcon.command.return_value = "Block placed"
        
        # Build wellbore
        result = build_wellbore_trajectory_complete(
            trajectory_id="WELL-TEMPLATE",
            well_name="WELL-TEMPLATE"
        )
        
        # Verify Cloudscape formatting
        self.assertIn("✅", result)
        self.assertIn("**Details:**", result)
        self.assertIn("**Minecraft Location:**", result)
        self.assertIn("💡 **Tip:**", result)
        
    @patch('tools.workflow_tools.get_rcon_connection')
    @patch('tools.workflow_tools.fetch_trajectory_data')
    def test_data_points_count(self, mock_fetch, mock_get_rcon):
        """Test that data points count is reported."""
        # Setup mocks
        mock_fetch.return_value = self.mock_trajectory_data
        mock_get_rcon.return_value = self.mock_rcon
        self.mock_rcon.command.return_value = "Block placed"
        
        # Build wellbore
        result = build_wellbore_trajectory_complete(
            trajectory_id="WELL-COUNT",
            well_name="WELL-COUNT"
        )
        
        # Verify data points mentioned
        self.assertIn("Data Points:", result)
        self.assertIn("3", result)  # 3 coordinates in mock data
        
    @patch('tools.workflow_tools.get_rcon_connection')
    @patch('tools.workflow_tools.fetch_trajectory_data')
    def test_blocks_placed_count(self, mock_fetch, mock_get_rcon):
        """Test that blocks placed count is reported."""
        # Setup mocks
        mock_fetch.return_value = self.mock_trajectory_data
        mock_get_rcon.return_value = self.mock_rcon
        self.mock_rcon.command.return_value = "Block placed"
        
        # Build wellbore
        result = build_wellbore_trajectory_complete(
            trajectory_id="WELL-BLOCKS",
            well_name="WELL-BLOCKS"
        )
        
        # Verify blocks placed mentioned
        self.assertIn("Blocks Placed:", result)
        
    @patch('tools.workflow_tools.get_rcon_connection')
    @patch('tools.workflow_tools.fetch_trajectory_data')
    def test_minecraft_coordinates(self, mock_fetch, mock_get_rcon):
        """Test that Minecraft coordinates are reported."""
        # Setup mocks
        mock_fetch.return_value = self.mock_trajectory_data
        mock_get_rcon.return_value = self.mock_rcon
        self.mock_rcon.command.return_value = "Block placed"
        
        # Build wellbore
        result = build_wellbore_trajectory_complete(
            trajectory_id="WELL-COORDS",
            well_name="WELL-COORDS"
        )
        
        # Verify coordinates mentioned
        self.assertIn("Coordinates:", result)
        self.assertIn("(", result)
        self.assertIn(")", result)
        
    @patch('tools.workflow_tools.fetch_trajectory_data')
    def test_error_handling_no_data(self, mock_fetch):
        """Test error handling when trajectory data is not found."""
        # Setup mock to return no data
        mock_fetch.return_value = None
        
        # Build wellbore
        result = build_wellbore_trajectory_complete(
            trajectory_id="WELL-NODATA",
            well_name="WELL-NODATA"
        )
        
        # Verify error response
        self.assertIn("❌", result)
        self.assertIn("trajectory", result.lower())
        
    @patch('tools.workflow_tools.get_rcon_connection')
    @patch('tools.workflow_tools.fetch_trajectory_data')
    def test_error_handling_rcon_failure(self, mock_fetch, mock_get_rcon):
        """Test error handling when RCON connection fails."""
        # Setup mocks
        mock_fetch.return_value = self.mock_trajectory_data
        mock_get_rcon.side_effect = Exception("RCON connection failed")
        
        # Build wellbore
        result = build_wellbore_trajectory_complete(
            trajectory_id="WELL-FAIL",
            well_name="WELL-FAIL"
        )
        
        # Verify error response
        self.assertIn("❌", result)
        self.assertIn("Wellbore", result)


def run_tests():
    """Run all integration tests."""
    suite = unittest.TestLoader().loadTestsFromTestCase(TestEnhancedWellboreIntegration)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    return 0 if result.wasSuccessful() else 1


if __name__ == '__main__':
    sys.exit(run_tests())
