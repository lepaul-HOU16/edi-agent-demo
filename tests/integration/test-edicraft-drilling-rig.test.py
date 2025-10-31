#!/usr/bin/env python3
"""
Integration tests for drilling rig builder.

Tests the complete drilling rig building workflow including:
- Rig structure creation (derrick, platform, equipment)
- Signage placement with well names
- Multiple rigs without overlap
- Style variations (standard, compact, detailed)
"""

import sys
import os
import unittest
from unittest.mock import Mock, patch, MagicMock

# Add edicraft-agent to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'edicraft-agent'))

from tools.workflow_tools import build_drilling_rig
from tools.name_utils import simplify_well_name


class TestDrillingRigIntegration(unittest.TestCase):
    """Integration tests for drilling rig builder."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.mock_rcon = MagicMock()
        
    @patch('tools.workflow_tools.get_rcon_connection')
    def test_standard_rig_structure(self, mock_get_rcon):
        """Test building a standard drilling rig structure."""
        # Setup mock RCON
        mock_get_rcon.return_value = self.mock_rcon
        self.mock_rcon.command.return_value = "Block placed"
        
        # Build rig
        result = build_drilling_rig(
            x=100, y=100, z=100,
            well_name="WELL-007",
            rig_style="standard"
        )
        
        # Verify response
        self.assertIn("✅", result)
        self.assertIn("WELL-007", result)
        self.assertIn("standard", result.lower())
        
        # Verify structure components mentioned
        self.assertIn("Platform:", result)
        self.assertIn("Derrick:", result)
        self.assertIn("Equipment:", result)
        
    @patch('tools.workflow_tools.get_rcon_connection')
    def test_compact_rig_structure(self, mock_get_rcon):
        """Test building a compact drilling rig."""
        # Setup mock RCON
        mock_get_rcon.return_value = self.mock_rcon
        self.mock_rcon.command.return_value = "Block placed"
        
        # Build compact rig
        result = build_drilling_rig(
            x=200, y=100, z=200,
            well_name="WELL-011",
            rig_style="compact"
        )
        
        # Verify compact rig characteristics
        self.assertIn("✅", result)
        self.assertIn("compact", result.lower())
        self.assertIn("3x3", result)  # Compact platform size
        
    @patch('tools.workflow_tools.get_rcon_connection')
    def test_detailed_rig_structure(self, mock_get_rcon):
        """Test building a detailed drilling rig."""
        # Setup mock RCON
        mock_get_rcon.return_value = self.mock_rcon
        self.mock_rcon.command.return_value = "Block placed"
        
        # Build detailed rig
        result = build_drilling_rig(
            x=300, y=100, z=300,
            well_name="WELL-024",
            rig_style="detailed"
        )
        
        # Verify detailed rig characteristics
        self.assertIn("✅", result)
        self.assertIn("detailed", result.lower())
        self.assertIn("7x7", result)  # Detailed platform size
        
    @patch('tools.workflow_tools.get_rcon_connection')
    def test_signage_placement(self, mock_get_rcon):
        """Test that signage is placed with well name."""
        # Setup mock RCON
        mock_get_rcon.return_value = self.mock_rcon
        self.mock_rcon.command.return_value = "Sign placed"
        
        # Build rig
        result = build_drilling_rig(
            x=100, y=100, z=100,
            well_name="WELL-TEST",
            rig_style="standard"
        )
        
        # Verify signage mentioned
        self.assertIn("Sign:", result)
        self.assertIn("WELL-TEST", result)
        
        # Verify sign command was called
        calls = [str(call) for call in self.mock_rcon.command.call_args_list]
        combined_calls = ' '.join(calls)
        self.assertTrue(
            "sign" in combined_calls.lower() or "oak_sign" in combined_calls.lower(),
            "Sign placement command should be called"
        )
        
    @patch('tools.workflow_tools.get_rcon_connection')
    def test_multiple_rigs_no_overlap(self, mock_get_rcon):
        """Test building multiple rigs without overlap."""
        # Setup mock RCON
        mock_get_rcon.return_value = self.mock_rcon
        self.mock_rcon.command.return_value = "Block placed"
        
        # Build first rig
        result1 = build_drilling_rig(
            x=100, y=100, z=100,
            well_name="WELL-001",
            rig_style="standard"
        )
        self.assertIn("✅", result1)
        
        # Build second rig at different location
        result2 = build_drilling_rig(
            x=150, y=100, z=150,
            well_name="WELL-002",
            rig_style="standard"
        )
        self.assertIn("✅", result2)
        
        # Both should succeed
        self.assertIn("WELL-001", result1)
        self.assertIn("WELL-002", result2)
        
    @patch('tools.workflow_tools.get_rcon_connection')
    def test_style_variations(self, mock_get_rcon):
        """Test all rig style variations."""
        # Setup mock RCON
        mock_get_rcon.return_value = self.mock_rcon
        self.mock_rcon.command.return_value = "Block placed"
        
        styles = ["standard", "compact", "detailed"]
        
        for style in styles:
            result = build_drilling_rig(
                x=100, y=100, z=100,
                well_name=f"WELL-{style.upper()}",
                rig_style=style
            )
            
            # Each style should succeed
            self.assertIn("✅", result, f"Failed for style={style}")
            self.assertIn(style, result.lower(), f"Style not mentioned for {style}")
            
    @patch('tools.workflow_tools.get_rcon_connection')
    def test_derrick_height(self, mock_get_rcon):
        """Test that derrick has correct height."""
        # Setup mock RCON
        mock_get_rcon.return_value = self.mock_rcon
        self.mock_rcon.command.return_value = "Block placed"
        
        # Build rig
        result = build_drilling_rig(
            x=100, y=100, z=100,
            well_name="WELL-HEIGHT",
            rig_style="standard"
        )
        
        # Verify derrick height mentioned
        self.assertIn("15", result)  # Standard derrick height
        self.assertIn("blocks high", result.lower())
        
    @patch('tools.workflow_tools.get_rcon_connection')
    def test_equipment_placement(self, mock_get_rcon):
        """Test that equipment is placed on platform."""
        # Setup mock RCON
        mock_get_rcon.return_value = self.mock_rcon
        self.mock_rcon.command.return_value = "Block placed"
        
        # Build rig
        result = build_drilling_rig(
            x=100, y=100, z=100,
            well_name="WELL-EQUIP",
            rig_style="standard"
        )
        
        # Verify equipment mentioned
        self.assertIn("Equipment:", result)
        
        # Verify equipment blocks were placed
        calls = [str(call) for call in self.mock_rcon.command.call_args_list]
        combined_calls = ' '.join(calls)
        self.assertTrue(
            any(block in combined_calls for block in ["furnace", "hopper", "chest"]),
            "Equipment blocks should be placed"
        )
        
    @patch('tools.workflow_tools.get_rcon_connection')
    def test_lighting_placement(self, mock_get_rcon):
        """Test that lighting is placed for visibility."""
        # Setup mock RCON
        mock_get_rcon.return_value = self.mock_rcon
        self.mock_rcon.command.return_value = "Block placed"
        
        # Build rig
        result = build_drilling_rig(
            x=100, y=100, z=100,
            well_name="WELL-LIGHT",
            rig_style="standard"
        )
        
        # Verify lighting mentioned
        self.assertIn("Lighting:", result)
        
        # Verify glowstone was placed
        calls = [str(call) for call in self.mock_rcon.command.call_args_list]
        combined_calls = ' '.join(calls)
        self.assertTrue(
            "glowstone" in combined_calls.lower(),
            "Glowstone lighting should be placed"
        )
        
    def test_name_simplification_integration(self):
        """Test that OSDU IDs are simplified for signage."""
        # Test OSDU ID simplification
        osdu_id = "osdu:work-product-component--WellboreTrajectory:WELL-007:abc123"
        simplified = simplify_well_name(osdu_id)
        
        # Should extract WELL-007
        self.assertEqual(simplified, "WELL-007")
        
    @patch('tools.workflow_tools.get_rcon_connection')
    def test_osdu_id_in_rig_building(self, mock_get_rcon):
        """Test that OSDU IDs are simplified when building rigs."""
        # Setup mock RCON
        mock_get_rcon.return_value = self.mock_rcon
        self.mock_rcon.command.return_value = "Block placed"
        
        # Build rig with OSDU ID
        osdu_id = "osdu:work-product-component--WellboreTrajectory:WELL-007:abc123"
        result = build_drilling_rig(
            x=100, y=100, z=100,
            well_name=osdu_id,
            rig_style="standard"
        )
        
        # Verify short name is used
        self.assertIn("WELL-007", result)
        self.assertNotIn(osdu_id, result)
        
    @patch('tools.workflow_tools.get_rcon_connection')
    def test_error_handling_invalid_style(self, mock_get_rcon):
        """Test error handling for invalid rig style."""
        # Setup mock RCON
        mock_get_rcon.return_value = self.mock_rcon
        
        # Build rig with invalid style
        result = build_drilling_rig(
            x=100, y=100, z=100,
            well_name="WELL-ERROR",
            rig_style="invalid_style"
        )
        
        # Verify error response
        self.assertIn("❌", result)
        self.assertIn("Invalid rig style", result)
        
    @patch('tools.workflow_tools.get_rcon_connection')
    def test_error_handling_rcon_failure(self, mock_get_rcon):
        """Test error handling when RCON connection fails."""
        # Setup mock to raise exception
        mock_get_rcon.side_effect = Exception("RCON connection failed")
        
        # Build rig
        result = build_drilling_rig(
            x=100, y=100, z=100,
            well_name="WELL-FAIL",
            rig_style="standard"
        )
        
        # Verify error response
        self.assertIn("❌", result)
        self.assertIn("Drilling Rig", result)
        
    @patch('tools.workflow_tools.get_rcon_connection')
    def test_block_count_tracking(self, mock_get_rcon):
        """Test that placed block counts are tracked."""
        # Setup mock RCON
        mock_get_rcon.return_value = self.mock_rcon
        self.mock_rcon.command.return_value = "Block placed"
        
        # Build rig
        result = build_drilling_rig(
            x=100, y=100, z=100,
            well_name="WELL-COUNT",
            rig_style="standard"
        )
        
        # Verify block count mentioned
        self.assertIn("Blocks Placed:", result)
        
    @patch('tools.workflow_tools.get_rcon_connection')
    def test_command_count_tracking(self, mock_get_rcon):
        """Test that executed command counts are tracked."""
        # Setup mock RCON
        mock_get_rcon.return_value = self.mock_rcon
        self.mock_rcon.command.return_value = "Command executed"
        
        # Build rig
        result = build_drilling_rig(
            x=100, y=100, z=100,
            well_name="WELL-CMD",
            rig_style="standard"
        )
        
        # Verify command count mentioned
        self.assertIn("Commands Executed:", result)


def run_tests():
    """Run all integration tests."""
    suite = unittest.TestLoader().loadTestsFromTestCase(TestDrillingRigIntegration)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    return 0 if result.wasSuccessful() else 1


if __name__ == '__main__':
    sys.exit(run_tests())
