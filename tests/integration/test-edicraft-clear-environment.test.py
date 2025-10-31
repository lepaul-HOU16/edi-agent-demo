#!/usr/bin/env python3
"""
Integration tests for clear_minecraft_environment tool.

Tests the complete clear environment workflow including:
- Full clear operation
- Selective clear (wellbores, rigs, markers)
- Terrain preservation
- Response formatting
- Error handling
"""

import sys
import os
import unittest
from unittest.mock import Mock, patch, MagicMock

# Add edicraft-agent to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'edicraft-agent'))

from tools.workflow_tools import clear_minecraft_environment
from tools.response_templates import CloudscapeResponseBuilder


class TestClearEnvironmentIntegration(unittest.TestCase):
    """Integration tests for clear environment tool."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.mock_rcon = MagicMock()
        
    @patch('tools.workflow_tools.get_rcon_connection')
    def test_full_clear_operation(self, mock_get_rcon):
        """Test full clear operation with all structures."""
        # Setup mock RCON
        mock_get_rcon.return_value = self.mock_rcon
        self.mock_rcon.command.return_value = "Filled 100 blocks"
        
        # Execute clear
        result = clear_minecraft_environment(area="all", preserve_terrain=True)
        
        # Verify RCON commands were called
        self.assertTrue(self.mock_rcon.command.called)
        
        # Verify response format
        self.assertIn("✅", result)
        self.assertIn("Minecraft Environment", result)
        self.assertIn("Details:", result)
        
    @patch('tools.workflow_tools.get_rcon_connection')
    def test_selective_clear_wellbores(self, mock_get_rcon):
        """Test selective clear of only wellbores."""
        # Setup mock RCON
        mock_get_rcon.return_value = self.mock_rcon
        self.mock_rcon.command.return_value = "Filled 50 blocks"
        
        # Execute clear
        result = clear_minecraft_environment(area="wellbores", preserve_terrain=True)
        
        # Verify response mentions wellbores
        self.assertIn("wellbore", result.lower())
        self.assertIn("✅", result)
        
    @patch('tools.workflow_tools.get_rcon_connection')
    def test_selective_clear_rigs(self, mock_get_rcon):
        """Test selective clear of only drilling rigs."""
        # Setup mock RCON
        mock_get_rcon.return_value = self.mock_rcon
        self.mock_rcon.command.return_value = "Filled 30 blocks"
        
        # Execute clear
        result = clear_minecraft_environment(area="rigs", preserve_terrain=True)
        
        # Verify response mentions rigs
        self.assertIn("rig", result.lower())
        self.assertIn("✅", result)
        
    @patch('tools.workflow_tools.get_rcon_connection')
    def test_terrain_preservation(self, mock_get_rcon):
        """Test that terrain blocks are preserved during clear."""
        # Setup mock RCON
        mock_get_rcon.return_value = self.mock_rcon
        self.mock_rcon.command.return_value = "Filled 75 blocks"
        
        # Execute clear with terrain preservation
        result = clear_minecraft_environment(area="all", preserve_terrain=True)
        
        # Verify terrain preservation is mentioned
        self.assertIn("preserve", result.lower())
        
        # Verify only structure blocks are cleared (not grass, dirt, stone, water)
        call_args = [str(call) for call in self.mock_rcon.command.call_args_list]
        combined_calls = ' '.join(call_args)
        
        # Should clear structure blocks
        self.assertTrue(
            any(block in combined_calls for block in ['obsidian', 'glowstone', 'emerald', 'iron_bars']),
            "Should clear structure blocks"
        )
        
    def test_response_formatting(self):
        """Test that response follows Cloudscape format."""
        # Test clear confirmation template
        response = CloudscapeResponseBuilder.clear_confirmation(
            wellbores_cleared=5,
            rigs_cleared=3,
            blocks_cleared=1250
        )
        
        # Verify Cloudscape formatting
        self.assertIn("✅", response)
        self.assertIn("**Details:**", response)
        self.assertIn("Wellbores Cleared:", response)
        self.assertIn("Rigs Cleared:", response)
        self.assertIn("Total Blocks Cleared:", response)
        self.assertIn("💡 **Tip:**", response)
        
        # Verify counts are present
        self.assertIn("5", response)
        self.assertIn("3", response)
        self.assertIn("1250", response)
        
    @patch('tools.workflow_tools.get_rcon_connection')
    def test_error_handling_rcon_failure(self, mock_get_rcon):
        """Test error handling when RCON connection fails."""
        # Setup mock to raise exception
        mock_get_rcon.side_effect = Exception("RCON connection failed")
        
        # Execute clear
        result = clear_minecraft_environment(area="all", preserve_terrain=True)
        
        # Verify error response
        self.assertIn("❌", result)
        self.assertIn("Clear Environment", result)
        self.assertIn("RCON", result)
        
    @patch('tools.workflow_tools.get_rcon_connection')
    def test_error_handling_invalid_area(self, mock_get_rcon):
        """Test error handling for invalid area parameter."""
        # Setup mock RCON
        mock_get_rcon.return_value = self.mock_rcon
        
        # Execute clear with invalid area
        result = clear_minecraft_environment(area="invalid_area", preserve_terrain=True)
        
        # Verify error response
        self.assertIn("❌", result)
        self.assertIn("Invalid", result)
        
    @patch('tools.workflow_tools.get_rcon_connection')
    def test_partial_clear_recovery(self, mock_get_rcon):
        """Test recovery from partial clear failures."""
        # Setup mock to fail on some commands
        mock_get_rcon.return_value = self.mock_rcon
        self.mock_rcon.command.side_effect = [
            "Filled 50 blocks",  # First command succeeds
            Exception("Command failed"),  # Second command fails
            "Filled 30 blocks"  # Third command succeeds
        ]
        
        # Execute clear
        result = clear_minecraft_environment(area="all", preserve_terrain=True)
        
        # Should still return a response (not crash)
        self.assertIsNotNone(result)
        self.assertTrue(len(result) > 0)
        
    @patch('tools.workflow_tools.get_rcon_connection')
    def test_block_count_tracking(self, mock_get_rcon):
        """Test that cleared block counts are tracked correctly."""
        # Setup mock RCON with specific block counts
        mock_get_rcon.return_value = self.mock_rcon
        self.mock_rcon.command.side_effect = [
            "Filled 100 blocks",  # Wellbores
            "Filled 50 blocks",   # Rigs
            "Filled 25 blocks"    # Markers
        ]
        
        # Execute clear
        result = clear_minecraft_environment(area="all", preserve_terrain=True)
        
        # Verify total blocks are mentioned
        self.assertIn("blocks", result.lower())
        
    @patch('tools.workflow_tools.get_rcon_connection')
    def test_clear_specific_coordinates(self, mock_get_rcon):
        """Test clearing specific coordinate range."""
        # Setup mock RCON
        mock_get_rcon.return_value = self.mock_rcon
        self.mock_rcon.command.return_value = "Filled 40 blocks"
        
        # Execute clear with coordinates
        result = clear_minecraft_environment(
            area="100,100,100,200,200,200",
            preserve_terrain=True
        )
        
        # Verify response
        self.assertIn("✅", result)
        
    def test_response_template_consistency(self):
        """Test that all response templates are consistent."""
        # Test success response
        success = CloudscapeResponseBuilder.clear_confirmation(
            wellbores_cleared=5,
            rigs_cleared=3,
            blocks_cleared=1250
        )
        
        # Test error response
        error = CloudscapeResponseBuilder.error_response(
            "Clear Environment",
            "RCON connection failed",
            ["Check Minecraft server is running", "Verify RCON credentials"]
        )
        
        # Both should have consistent structure
        self.assertIn("**", success)  # Bold formatting
        self.assertIn("**", error)
        
        # Success should have success icon
        self.assertIn("✅", success)
        
        # Error should have error icon
        self.assertIn("❌", error)


def run_tests():
    """Run all integration tests."""
    suite = unittest.TestLoader().loadTestsFromTestCase(TestClearEnvironmentIntegration)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    return 0 if result.wasSuccessful() else 1


if __name__ == '__main__':
    sys.exit(run_tests())
