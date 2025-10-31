#!/usr/bin/env python3
"""
Unit tests for Enhanced RCON Executor.
Tests timeout, retry, verification, and batching logic.
"""

import unittest
import time
import sys
import os
from unittest.mock import Mock, patch, MagicMock

# Add parent directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'edicraft-agent'))

from tools.rcon_executor import RCONExecutor, RCONResult


class TestRCONExecutor(unittest.TestCase):
    """Test cases for RCONExecutor class."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.executor = RCONExecutor(
            host='localhost',
            port=25575,
            password='test_password',
            timeout=2,  # Short timeout for tests
            max_retries=3,
            chunk_size=32
        )
    
    def test_parse_fill_response_success(self):
        """Test parsing successful fill command response."""
        response = "Successfully filled 1234 blocks"
        blocks = self.executor._parse_fill_response(response)
        self.assertEqual(blocks, 1234)
    
    def test_parse_fill_response_alternate_format(self):
        """Test parsing alternate fill response format."""
        response = "Filled 5678 blocks with grass_block"
        blocks = self.executor._parse_fill_response(response)
        self.assertEqual(blocks, 5678)
    
    def test_parse_fill_response_no_match(self):
        """Test parsing response with no block count."""
        response = "Command executed"
        blocks = self.executor._parse_fill_response(response)
        self.assertEqual(blocks, 0)
    
    def test_parse_gamerule_response_success(self):
        """Test parsing gamerule query response."""
        response = "Gamerule doDaylightCycle is currently set to: false"
        value = self.executor._parse_gamerule_response(response)
        self.assertEqual(value, "false")
    
    def test_parse_gamerule_response_true(self):
        """Test parsing gamerule response with true value."""
        response = "Gamerule keepInventory is currently set to: true"
        value = self.executor._parse_gamerule_response(response)
        self.assertEqual(value, "true")
    
    def test_parse_gamerule_response_no_match(self):
        """Test parsing invalid gamerule response."""
        response = "Unknown gamerule"
        value = self.executor._parse_gamerule_response(response)
        self.assertIsNone(value)
    
    def test_is_success_response_with_success_indicator(self):
        """Test success detection with success indicators."""
        self.assertTrue(self.executor._is_success_response("Successfully filled 100 blocks"))
        self.assertTrue(self.executor._is_success_response("Teleported player to location"))
        self.assertTrue(self.executor._is_success_response("Killed 5 entities"))
    
    def test_is_success_response_with_error_indicator(self):
        """Test success detection with error indicators."""
        self.assertFalse(self.executor._is_success_response("Error: Invalid command"))
        self.assertFalse(self.executor._is_success_response("Failed to execute"))
        self.assertFalse(self.executor._is_success_response("Unknown block type"))
    
    def test_is_success_response_empty(self):
        """Test success detection with empty response."""
        self.assertFalse(self.executor._is_success_response(""))
        self.assertFalse(self.executor._is_success_response("   "))
    
    def test_batch_fill_command_small_region(self):
        """Test batching for small region (no batching needed)."""
        chunks = self.executor._batch_fill_command(
            0, 0, 0, 10, 10, 10, "stone"
        )
        # Small region should result in single chunk
        self.assertEqual(len(chunks), 1)
        self.assertEqual(chunks[0]['command'], "fill 0 0 0 10 10 10 stone")
    
    def test_batch_fill_command_large_region(self):
        """Test batching for large region."""
        chunks = self.executor._batch_fill_command(
            0, 0, 0, 100, 100, 100, "air", replace="stone"
        )
        # Large region should be split into multiple chunks
        self.assertGreater(len(chunks), 1)
        
        # Each chunk should have correct format
        for chunk in chunks:
            self.assertIn('command', chunk)
            self.assertIn('replace stone', chunk['command'])
            
            # Verify chunk size constraints
            dx = chunk['x2'] - chunk['x1'] + 1
            dy = chunk['y2'] - chunk['y1'] + 1
            dz = chunk['z2'] - chunk['z1'] + 1
            self.assertLessEqual(dx, 32)
            self.assertLessEqual(dy, 32)
            self.assertLessEqual(dz, 32)
    
    def test_batch_fill_command_coverage(self):
        """Test that batching covers entire region."""
        x1, y1, z1 = 0, 0, 0
        x2, y2, z2 = 65, 65, 65
        
        chunks = self.executor._batch_fill_command(
            x1, y1, z1, x2, y2, z2, "stone"
        )
        
        # Collect all covered coordinates
        covered = set()
        for chunk in chunks:
            for x in range(chunk['x1'], chunk['x2'] + 1):
                for y in range(chunk['y1'], chunk['y2'] + 1):
                    for z in range(chunk['z1'], chunk['z2'] + 1):
                        covered.add((x, y, z))
        
        # Verify all coordinates are covered
        expected = set()
        for x in range(x1, x2 + 1):
            for y in range(y1, y2 + 1):
                for z in range(z1, z2 + 1):
                    expected.add((x, y, z))
        
        self.assertEqual(covered, expected)
    
    @patch('tools.rcon_executor.Client')
    def test_execute_command_success(self, mock_client_class):
        """Test successful command execution."""
        # Mock RCON client
        mock_client = MagicMock()
        mock_client.run.return_value = "Successfully filled 100 blocks"
        mock_client_class.return_value.__enter__.return_value = mock_client
        
        result = self.executor.execute_command("fill 0 0 0 10 10 10 stone")
        
        self.assertTrue(result.success)
        self.assertEqual(result.blocks_affected, 100)
        self.assertEqual(result.retries, 0)
        self.assertIsNone(result.error)
    
    @patch('tools.rcon_executor.Client')
    def test_execute_command_with_retry(self, mock_client_class):
        """Test command execution with retry on failure."""
        # Mock RCON client to fail first, then succeed
        mock_client = MagicMock()
        mock_client.run.side_effect = [
            Exception("Connection failed"),
            "Successfully filled 100 blocks"
        ]
        mock_client_class.return_value.__enter__.return_value = mock_client
        
        result = self.executor.execute_command("fill 0 0 0 10 10 10 stone")
        
        self.assertTrue(result.success)
        self.assertEqual(result.retries, 1)  # One retry
    
    @patch('tools.rcon_executor.Client')
    def test_execute_command_max_retries_exceeded(self, mock_client_class):
        """Test command execution failing after max retries."""
        # Mock RCON client to always fail
        mock_client = MagicMock()
        mock_client.run.side_effect = Exception("Connection failed")
        mock_client_class.return_value.__enter__.return_value = mock_client
        
        result = self.executor.execute_command("fill 0 0 0 10 10 10 stone")
        
        self.assertFalse(result.success)
        self.assertEqual(result.retries, 2)  # max_retries - 1
        self.assertIsNotNone(result.error)
        self.assertIn("retries", result.error)
    
    @patch('tools.rcon_executor.Client')
    def test_execute_command_timeout(self, mock_client_class):
        """Test command execution with timeout."""
        # Mock RCON client to hang
        mock_client = MagicMock()
        mock_client.run.side_effect = lambda cmd: time.sleep(10)  # Longer than timeout
        mock_client_class.return_value.__enter__.return_value = mock_client
        
        result = self.executor.execute_command("fill 0 0 0 10 10 10 stone")
        
        self.assertFalse(result.success)
        self.assertIsNotNone(result.error)
        self.assertIn("timed out", result.error.lower())
    
    @patch('tools.rcon_executor.Client')
    def test_verify_gamerule_success(self, mock_client_class):
        """Test gamerule verification."""
        # Mock RCON client
        mock_client = MagicMock()
        mock_client.run.return_value = "Gamerule doDaylightCycle is currently set to: false"
        mock_client_class.return_value.__enter__.return_value = mock_client
        
        result = self.executor.verify_gamerule("doDaylightCycle", "false")
        
        self.assertTrue(result)
    
    @patch('tools.rcon_executor.Client')
    def test_verify_gamerule_mismatch(self, mock_client_class):
        """Test gamerule verification with value mismatch."""
        # Mock RCON client
        mock_client = MagicMock()
        mock_client.run.return_value = "Gamerule doDaylightCycle is currently set to: true"
        mock_client_class.return_value.__enter__.return_value = mock_client
        
        result = self.executor.verify_gamerule("doDaylightCycle", "false")
        
        self.assertFalse(result)
    
    @patch('tools.rcon_executor.Client')
    def test_verify_gamerule_caching(self, mock_client_class):
        """Test gamerule query caching."""
        # Mock RCON client
        mock_client = MagicMock()
        mock_client.run.return_value = "Gamerule doDaylightCycle is currently set to: false"
        mock_client_class.return_value.__enter__.return_value = mock_client
        
        # First call should query
        result1 = self.executor.verify_gamerule("doDaylightCycle", "false")
        self.assertTrue(result1)
        self.assertEqual(mock_client.run.call_count, 1)
        
        # Second call should use cache
        result2 = self.executor.verify_gamerule("doDaylightCycle", "false")
        self.assertTrue(result2)
        self.assertEqual(mock_client.run.call_count, 1)  # No additional call
    
    @patch('tools.rcon_executor.Client')
    def test_execute_batch_sequential(self, mock_client_class):
        """Test batch execution in sequential mode."""
        # Mock RCON client
        mock_client = MagicMock()
        mock_client.run.return_value = "Successfully filled 10 blocks"
        mock_client_class.return_value.__enter__.return_value = mock_client
        
        commands = [
            "fill 0 0 0 5 5 5 stone",
            "fill 10 10 10 15 15 15 stone",
            "fill 20 20 20 25 25 25 stone"
        ]
        
        results = self.executor.execute_batch(commands, parallel=False)
        
        self.assertEqual(len(results), 3)
        for result in results:
            self.assertTrue(result.success)
            self.assertEqual(result.blocks_affected, 10)
    
    @patch('tools.rcon_executor.Client')
    def test_execute_batch_parallel(self, mock_client_class):
        """Test batch execution in parallel mode."""
        # Mock RCON client
        mock_client = MagicMock()
        mock_client.run.return_value = "Successfully filled 10 blocks"
        mock_client_class.return_value.__enter__.return_value = mock_client
        
        commands = [
            "fill 0 0 0 5 5 5 stone",
            "fill 10 10 10 15 15 15 stone",
            "fill 20 20 20 25 25 25 stone"
        ]
        
        results = self.executor.execute_batch(commands, parallel=True)
        
        self.assertEqual(len(results), 3)
        for result in results:
            self.assertTrue(result.success)
            self.assertEqual(result.blocks_affected, 10)
    
    def test_format_error_response(self):
        """Test error response formatting."""
        response = self.executor.format_error_response(
            "Connection Error",
            "Failed to connect to RCON server",
            [
                "Check Minecraft server is running",
                "Verify RCON is enabled",
                "Check host/port/password"
            ]
        )
        
        self.assertIn("Connection Error", response)
        self.assertIn("Failed to connect", response)
        self.assertIn("1. Check Minecraft server is running", response)
        self.assertIn("2. Verify RCON is enabled", response)
        self.assertIn("3. Check host/port/password", response)
    
    def test_rcon_result_to_dict(self):
        """Test RCONResult conversion to dictionary."""
        result = RCONResult(
            success=True,
            command="fill 0 0 0 10 10 10 stone",
            response="Successfully filled 100 blocks",
            blocks_affected=100,
            execution_time=1.5,
            retries=0
        )
        
        result_dict = result.to_dict()
        
        self.assertEqual(result_dict['success'], True)
        self.assertEqual(result_dict['command'], "fill 0 0 0 10 10 10 stone")
        self.assertEqual(result_dict['blocks_affected'], 100)
        self.assertEqual(result_dict['execution_time'], 1.5)
        self.assertEqual(result_dict['retries'], 0)
        self.assertIsNone(result_dict['error'])
    
    def test_batch_fill_large_region_500x255x500(self):
        """Test batching for very large region (500x255x500)."""
        # This is the specific test case from Task 2 requirements
        x1, y1, z1 = 0, 0, 0
        x2, y2, z2 = 499, 254, 499  # 500x255x500 region
        
        chunks = self.executor._batch_fill_command(
            x1, y1, z1, x2, y2, z2, "air", replace="stone"
        )
        
        # Calculate expected number of chunks
        # X: 500 blocks = 16 chunks of 32 (15 full + 1 partial of 20)
        # Y: 255 blocks = 8 chunks of 32 (7 full + 1 partial of 31)
        # Z: 500 blocks = 16 chunks of 32 (15 full + 1 partial of 20)
        # Total: 16 * 8 * 16 = 2048 chunks
        expected_chunks = 16 * 8 * 16
        self.assertEqual(len(chunks), expected_chunks)
        
        # Verify each chunk respects size constraints
        for chunk in chunks:
            dx = chunk['x2'] - chunk['x1'] + 1
            dy = chunk['y2'] - chunk['y1'] + 1
            dz = chunk['z2'] - chunk['z1'] + 1
            
            self.assertLessEqual(dx, 32, f"Chunk X dimension {dx} exceeds 32")
            self.assertLessEqual(dy, 32, f"Chunk Y dimension {dy} exceeds 32")
            self.assertLessEqual(dz, 32, f"Chunk Z dimension {dz} exceeds 32")
            
            # Verify command format
            self.assertIn('fill', chunk['command'])
            self.assertIn('replace stone', chunk['command'])
        
        # Verify total volume is correct
        total_volume = 500 * 255 * 500
        self.assertEqual(total_volume, 63750000)  # 63.75 million blocks
    
    def test_batch_fill_total_blocks_calculation(self):
        """Test that total blocks filled matches expected count."""
        # Test with a medium-sized region
        x1, y1, z1 = 0, 0, 0
        x2, y2, z2 = 100, 50, 100
        
        chunks = self.executor._batch_fill_command(
            x1, y1, z1, x2, y2, z2, "stone"
        )
        
        # Calculate total blocks from chunks
        total_blocks_from_chunks = 0
        for chunk in chunks:
            dx = chunk['x2'] - chunk['x1'] + 1
            dy = chunk['y2'] - chunk['y1'] + 1
            dz = chunk['z2'] - chunk['z1'] + 1
            total_blocks_from_chunks += dx * dy * dz
        
        # Calculate expected total blocks
        expected_total = (x2 - x1 + 1) * (y2 - y1 + 1) * (z2 - z1 + 1)
        expected_total = 101 * 51 * 101  # 520,251 blocks
        
        # Verify they match
        self.assertEqual(total_blocks_from_chunks, expected_total,
                        f"Total blocks from chunks ({total_blocks_from_chunks}) "
                        f"doesn't match expected ({expected_total})")
    
    def test_batch_fill_no_overlap_no_gaps(self):
        """Test that chunks have no overlaps and no gaps."""
        x1, y1, z1 = 0, 0, 0
        x2, y2, z2 = 70, 70, 70
        
        chunks = self.executor._batch_fill_command(
            x1, y1, z1, x2, y2, z2, "stone"
        )
        
        # Track which blocks are covered
        covered_blocks = set()
        
        for chunk in chunks:
            # Add all blocks in this chunk
            for x in range(chunk['x1'], chunk['x2'] + 1):
                for y in range(chunk['y1'], chunk['y2'] + 1):
                    for z in range(chunk['z1'], chunk['z2'] + 1):
                        coord = (x, y, z)
                        # Check for overlaps
                        self.assertNotIn(coord, covered_blocks,
                                       f"Block {coord} is covered by multiple chunks (overlap)")
                        covered_blocks.add(coord)
        
        # Check for gaps - all blocks in region should be covered
        expected_blocks = set()
        for x in range(x1, x2 + 1):
            for y in range(y1, y2 + 1):
                for z in range(z1, z2 + 1):
                    expected_blocks.add((x, y, z))
        
        missing_blocks = expected_blocks - covered_blocks
        self.assertEqual(len(missing_blocks), 0,
                        f"Found {len(missing_blocks)} blocks not covered by any chunk (gaps)")
        
        extra_blocks = covered_blocks - expected_blocks
        self.assertEqual(len(extra_blocks), 0,
                        f"Found {len(extra_blocks)} blocks outside the region")
    
    @patch('tools.rcon_executor.Client')
    def test_execute_fill_large_region_integration(self, mock_client_class):
        """Test execute_fill with large region requiring batching."""
        # Mock RCON client to return success for each chunk
        mock_client = MagicMock()
        
        def mock_run(command):
            # Parse fill command to calculate blocks
            # Format: fill x1 y1 z1 x2 y2 z2 block [replace block]
            parts = command.split()
            if parts[0] == 'fill':
                x1, y1, z1 = int(parts[1]), int(parts[2]), int(parts[3])
                x2, y2, z2 = int(parts[4]), int(parts[5]), int(parts[6])
                blocks = (x2 - x1 + 1) * (y2 - y1 + 1) * (z2 - z1 + 1)
                return f"Successfully filled {blocks} blocks"
            return "Success"
        
        mock_client.run.side_effect = mock_run
        mock_client_class.return_value.__enter__.return_value = mock_client
        
        # Execute fill on large region
        result = self.executor.execute_fill(
            0, 0, 0, 100, 100, 100, "air", replace="stone"
        )
        
        # Should succeed
        self.assertTrue(result.success)
        
        # Calculate expected total blocks
        expected_blocks = 101 * 101 * 101  # 1,030,301 blocks
        self.assertEqual(result.blocks_affected, expected_blocks)
        
        # Verify command was batched
        self.assertIn("batched", result.command.lower())
        
        # Verify multiple RCON calls were made (one per chunk)
        self.assertGreater(mock_client.run.call_count, 1)
    
    @patch('tools.rcon_executor.Client')
    def test_execute_fill_small_region_no_batching(self, mock_client_class):
        """Test execute_fill with small region not requiring batching."""
        # Mock RCON client
        mock_client = MagicMock()
        mock_client.run.return_value = "Successfully filled 1000 blocks"
        mock_client_class.return_value.__enter__.return_value = mock_client
        
        # Execute fill on small region (10x10x10 = 1000 blocks)
        result = self.executor.execute_fill(
            0, 0, 0, 9, 9, 9, "stone"
        )
        
        # Should succeed
        self.assertTrue(result.success)
        self.assertEqual(result.blocks_affected, 1000)
        
        # Should NOT be batched
        self.assertNotIn("batched", result.command.lower())
        
        # Should only make one RCON call
        self.assertEqual(mock_client.run.call_count, 1)
    
    def test_batch_fill_optimal_chunk_size(self):
        """Test that chunk size is optimal (32x32x32 = 32,768 blocks)."""
        # Test various region sizes
        test_cases = [
            (0, 0, 0, 31, 31, 31),   # Exactly one chunk
            (0, 0, 0, 32, 32, 32),   # Just over one chunk
            (0, 0, 0, 63, 63, 63),   # Multiple chunks
        ]
        
        for x1, y1, z1, x2, y2, z2 in test_cases:
            chunks = self.executor._batch_fill_command(
                x1, y1, z1, x2, y2, z2, "stone"
            )
            
            # Verify each chunk is at most 32x32x32
            for chunk in chunks:
                dx = chunk['x2'] - chunk['x1'] + 1
                dy = chunk['y2'] - chunk['y1'] + 1
                dz = chunk['z2'] - chunk['z1'] + 1
                
                self.assertLessEqual(dx, 32)
                self.assertLessEqual(dy, 32)
                self.assertLessEqual(dz, 32)
                
                # Verify chunk doesn't exceed max blocks
                chunk_blocks = dx * dy * dz
                self.assertLessEqual(chunk_blocks, 32768)


if __name__ == '__main__':
    unittest.main()
