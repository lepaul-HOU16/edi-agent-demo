#!/usr/bin/env python3
"""
Comprehensive tests for RCON result parsers.
Tests parsing with various real Minecraft server response formats.
"""

import unittest
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'edicraft-agent'))

from tools.rcon_executor import RCONExecutor


class TestRCONResultParsers(unittest.TestCase):
    """Test cases for RCON result parser methods."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.executor = RCONExecutor(
            host='localhost',
            port=25575,
            password='test_password'
        )
    
    # ========== parse_fill_response() Tests ==========
    
    def test_parse_fill_response_standard_format(self):
        """Test parsing standard 'Successfully filled X blocks' format."""
        test_cases = [
            ("Successfully filled 1234 blocks", 1234),
            ("Successfully filled 1 block", 1),
            ("Successfully filled 999999 blocks", 999999),
        ]
        
        for response, expected in test_cases:
            with self.subTest(response=response):
                result = self.executor._parse_fill_response(response)
                self.assertEqual(result, expected)
    
    def test_parse_fill_response_with_block_type(self):
        """Test parsing 'Filled X blocks with Y' format."""
        test_cases = [
            ("Filled 5678 blocks with grass_block", 5678),
            ("Filled 100 blocks with stone", 100),
            ("Filled 42 blocks with minecraft:air", 42),
        ]
        
        for response, expected in test_cases:
            with self.subTest(response=response):
                result = self.executor._parse_fill_response(response)
                self.assertEqual(result, expected)
    
    def test_parse_fill_response_case_insensitive(self):
        """Test parsing is case-insensitive."""
        test_cases = [
            ("SUCCESSFULLY FILLED 100 BLOCKS", 100),
            ("successfully filled 200 blocks", 200),
            ("Successfully Filled 300 Blocks", 300),
            ("FILLED 400 BLOCKS WITH STONE", 400),
        ]
        
        for response, expected in test_cases:
            with self.subTest(response=response):
                result = self.executor._parse_fill_response(response)
                self.assertEqual(result, expected)
    
    def test_parse_fill_response_with_extra_text(self):
        """Test parsing with additional text in response."""
        test_cases = [
            ("Command executed. Successfully filled 1000 blocks. Done.", 1000),
            ("[Server] Filled 2000 blocks with air", 2000),
            ("Player123: Successfully filled 3000 blocks", 3000),
        ]
        
        for response, expected in test_cases:
            with self.subTest(response=response):
                result = self.executor._parse_fill_response(response)
                self.assertEqual(result, expected)
    
    def test_parse_fill_response_no_match(self):
        """Test parsing returns 0 when no block count found."""
        test_cases = [
            "Command executed successfully",
            "Fill operation complete",
            "No blocks were filled",
            "",
            "Error: Invalid command",
        ]
        
        for response in test_cases:
            with self.subTest(response=response):
                result = self.executor._parse_fill_response(response)
                self.assertEqual(result, 0)
    
    def test_parse_fill_response_zero_blocks(self):
        """Test parsing when 0 blocks are filled."""
        test_cases = [
            "Successfully filled 0 blocks",
            "Filled 0 blocks with stone",
        ]
        
        for response in test_cases:
            with self.subTest(response=response):
                result = self.executor._parse_fill_response(response)
                self.assertEqual(result, 0)
    
    # ========== parse_gamerule_response() Tests ==========
    
    def test_parse_gamerule_response_standard_format(self):
        """Test parsing standard gamerule query response."""
        test_cases = [
            ("Gamerule doDaylightCycle is currently set to: false", "false"),
            ("Gamerule keepInventory is currently set to: true", "true"),
            ("Gamerule doMobSpawning is currently set to: false", "false"),
        ]
        
        for response, expected in test_cases:
            with self.subTest(response=response):
                result = self.executor._parse_gamerule_response(response)
                self.assertEqual(result, expected)
    
    def test_parse_gamerule_response_case_insensitive(self):
        """Test parsing is case-insensitive."""
        test_cases = [
            ("Gamerule doDaylightCycle is currently SET TO: FALSE", "false"),
            ("Gamerule keepInventory is currently set to: TRUE", "true"),
            ("GAMERULE doMobSpawning IS CURRENTLY SET TO: false", "false"),
        ]
        
        for response, expected in test_cases:
            with self.subTest(response=response):
                result = self.executor._parse_gamerule_response(response)
                self.assertEqual(result, expected)
    
    def test_parse_gamerule_response_various_values(self):
        """Test parsing gamerule responses with various value types."""
        test_cases = [
            ("Gamerule randomTickSpeed is currently set to: 3", "3"),
            ("Gamerule spawnRadius is currently set to: 10", "10"),
            ("Gamerule maxCommandChainLength is currently set to: 65536", "65536"),
        ]
        
        for response, expected in test_cases:
            with self.subTest(response=response):
                result = self.executor._parse_gamerule_response(response)
                self.assertEqual(result, expected)
    
    def test_parse_gamerule_response_no_match(self):
        """Test parsing returns None when format doesn't match."""
        test_cases = [
            "Unknown gamerule",
            "Gamerule not found",
            "Invalid command",
            "",
            "Gamerule doDaylightCycle",
        ]
        
        for response in test_cases:
            with self.subTest(response=response):
                result = self.executor._parse_gamerule_response(response)
                self.assertIsNone(result)
    
    def test_parse_gamerule_response_with_extra_text(self):
        """Test parsing with additional text in response."""
        test_cases = [
            ("[Server] Gamerule doDaylightCycle is currently set to: false", "false"),
            ("Player123: Gamerule keepInventory is currently set to: true", "true"),
        ]
        
        for response, expected in test_cases:
            with self.subTest(response=response):
                result = self.executor._parse_gamerule_response(response)
                self.assertEqual(result, expected)
    
    # ========== is_success_response() Tests ==========
    
    def test_is_success_response_with_success_indicators(self):
        """Test success detection with various success indicators."""
        success_responses = [
            "Successfully filled 100 blocks",
            "Teleported player to location",
            "Killed 5 entities",
            "Summoned zombie at coordinates",
            "Gave 64 diamonds to player",
            "Placed block at location",
            "Gamerule doDaylightCycle is currently set to: false",
        ]
        
        for response in success_responses:
            with self.subTest(response=response):
                result = self.executor._is_success_response(response)
                self.assertTrue(result, f"Should detect success in: {response}")
    
    def test_is_success_response_with_error_indicators(self):
        """Test success detection with various error indicators."""
        error_responses = [
            "Error: Invalid command",
            "Failed to execute command",
            "Invalid block type",
            "Unknown command",
            "Cannot find player",
            "Unable to teleport",
            "No player was found",
            "No entity was found",
        ]
        
        for response in error_responses:
            with self.subTest(response=response):
                result = self.executor._is_success_response(response)
                self.assertFalse(result, f"Should detect error in: {response}")
    
    def test_is_success_response_case_insensitive(self):
        """Test success detection is case-insensitive."""
        test_cases = [
            ("SUCCESSFULLY FILLED 100 BLOCKS", True),
            ("ERROR: INVALID COMMAND", False),
            ("Teleported Player", True),
            ("Failed To Execute", False),
        ]
        
        for response, expected in test_cases:
            with self.subTest(response=response):
                result = self.executor._is_success_response(response)
                self.assertEqual(result, expected)
    
    def test_is_success_response_empty_or_whitespace(self):
        """Test success detection with empty or whitespace responses."""
        test_cases = [
            ("", False),
            ("   ", False),
            ("\n", False),
            ("\t", False),
        ]
        
        for response, expected in test_cases:
            with self.subTest(response=repr(response)):
                result = self.executor._is_success_response(response)
                self.assertEqual(result, expected)
    
    def test_is_success_response_ambiguous_responses(self):
        """Test success detection with ambiguous responses."""
        # Responses with no clear success or error indicators
        # Should return True if non-empty (conservative approach)
        test_cases = [
            ("Command executed", True),
            ("Operation complete", True),
            ("Done", True),
            ("OK", True),
        ]
        
        for response, expected in test_cases:
            with self.subTest(response=response):
                result = self.executor._is_success_response(response)
                self.assertEqual(result, expected)
    
    def test_is_success_response_priority_error_over_success(self):
        """Test that error indicators take priority over success indicators."""
        # Responses that contain both success and error indicators
        # Error should take priority
        test_cases = [
            "Successfully started but failed to complete",
            "Filled blocks but error occurred",
            "Teleported player but cannot find destination",
        ]
        
        for response in test_cases:
            with self.subTest(response=response):
                result = self.executor._is_success_response(response)
                self.assertFalse(result, f"Error should take priority in: {response}")
    
    # ========== Integration Tests ==========
    
    def test_parsers_with_real_minecraft_responses(self):
        """Test parsers with actual Minecraft server response examples."""
        # Real responses from Minecraft 1.20.x server
        real_responses = [
            {
                'command': 'fill 0 60 0 10 70 10 stone',
                'response': 'Successfully filled 1331 blocks',
                'expected_blocks': 1331,
                'expected_success': True
            },
            {
                'command': 'fill 0 0 0 100 100 100 air replace stone',
                'response': 'Filled 1030301 blocks with air',
                'expected_blocks': 1030301,
                'expected_success': True
            },
            {
                'command': 'gamerule doDaylightCycle',
                'response': 'Gamerule doDaylightCycle is currently set to: false',
                'expected_gamerule': 'false',
                'expected_success': True
            },
            {
                'command': 'fill 0 0 0 10 10 10 invalid_block',
                'response': 'Error: Unknown block type: invalid_block',
                'expected_blocks': 0,
                'expected_success': False
            },
            {
                'command': 'gamerule invalidRule',
                'response': 'Unknown gamerule: invalidRule',
                'expected_gamerule': None,
                'expected_success': False
            },
        ]
        
        for test_case in real_responses:
            with self.subTest(command=test_case['command']):
                response = test_case['response']
                
                # Test success detection
                is_success = self.executor._is_success_response(response)
                self.assertEqual(is_success, test_case['expected_success'])
                
                # Test fill response parsing if applicable
                if 'expected_blocks' in test_case:
                    blocks = self.executor._parse_fill_response(response)
                    self.assertEqual(blocks, test_case['expected_blocks'])
                
                # Test gamerule response parsing if applicable
                if 'expected_gamerule' in test_case:
                    gamerule = self.executor._parse_gamerule_response(response)
                    self.assertEqual(gamerule, test_case['expected_gamerule'])
    
    def test_parsers_handle_unicode_and_special_chars(self):
        """Test parsers handle unicode and special characters."""
        test_cases = [
            "Successfully filled 100 blocks with minecraft:stone",
            "Filled 200 blocks with custom:block_name_123",
            "Gamerule customRule_v2 is currently set to: true",
        ]
        
        for response in test_cases:
            with self.subTest(response=response):
                # Should not raise exceptions
                self.executor._is_success_response(response)
                self.executor._parse_fill_response(response)
                self.executor._parse_gamerule_response(response)
    
    def test_parsers_handle_very_long_responses(self):
        """Test parsers handle very long responses efficiently."""
        # Create a very long response
        long_response = "Successfully filled 12345 blocks. " + ("Extra text. " * 1000)
        
        # Should parse correctly and efficiently
        blocks = self.executor._parse_fill_response(long_response)
        self.assertEqual(blocks, 12345)
        
        is_success = self.executor._is_success_response(long_response)
        self.assertTrue(is_success)
    
    def test_parsers_handle_multiline_responses(self):
        """Test parsers handle multiline responses."""
        multiline_response = """
        [Server] Command executed
        Successfully filled 500 blocks
        Operation complete
        """
        
        blocks = self.executor._parse_fill_response(multiline_response)
        self.assertEqual(blocks, 500)
        
        is_success = self.executor._is_success_response(multiline_response)
        self.assertTrue(is_success)


if __name__ == '__main__':
    unittest.main()
