#!/usr/bin/env python3
"""
Test script for direct tool call handler in Python agent.

This script tests the handle_direct_tool_call function to ensure it correctly
parses DIRECT_TOOL_CALL messages and routes to appropriate tools.

Requirements: 3.1, 3.2, 3.3
"""

import sys
import os

# Add edicraft-agent to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'edicraft-agent'))

# Mock the tools to avoid actual execution
class MockTool:
    def __init__(self, name):
        self.name = name
    
    def __call__(self, *args, **kwargs):
        return f"[MOCK] {self.name} called with args={args}, kwargs={kwargs}"

# Import and patch
import tools.workflow_tools as workflow_tools
workflow_tools.build_wellbore_trajectory_complete = MockTool("build_wellbore_trajectory_complete")
workflow_tools.build_horizon_surface_complete = MockTool("build_horizon_surface_complete")
workflow_tools.get_system_status = MockTool("get_system_status")

# Now import the agent module
from agent import handle_direct_tool_call

def test_wellbore_trajectory():
    """Test wellbore trajectory direct tool call"""
    print("\n=== Test 1: Wellbore Trajectory ===")
    message = 'DIRECT_TOOL_CALL: build_wellbore_trajectory_complete("WELL-011")'
    result = handle_direct_tool_call(message)
    
    assert "response" in result, f"Expected 'response' key, got: {result}"
    assert "WELL-011" in str(result["response"]), f"Expected WELL-011 in response, got: {result}"
    print(f"✅ PASS: {result}")

def test_horizon_surface_with_name():
    """Test horizon surface with horizon name"""
    print("\n=== Test 2: Horizon Surface with Name ===")
    message = 'DIRECT_TOOL_CALL: build_horizon_surface_complete("Top_Reservoir")'
    result = handle_direct_tool_call(message)
    
    assert "response" in result, f"Expected 'response' key, got: {result}"
    print(f"✅ PASS: {result}")

def test_horizon_surface_without_name():
    """Test horizon surface without horizon name"""
    print("\n=== Test 3: Horizon Surface without Name ===")
    message = 'DIRECT_TOOL_CALL: build_horizon_surface_complete(None)'
    result = handle_direct_tool_call(message)
    
    assert "response" in result, f"Expected 'response' key, got: {result}"
    print(f"✅ PASS: {result}")

def test_list_players():
    """Test list players direct tool call"""
    print("\n=== Test 4: List Players ===")
    message = 'DIRECT_TOOL_CALL: list_players()'
    result = handle_direct_tool_call(message)
    
    assert "response" in result, f"Expected 'response' key, got: {result}"
    print(f"✅ PASS: {result}")

def test_get_player_positions():
    """Test get player positions direct tool call"""
    print("\n=== Test 5: Get Player Positions ===")
    message = 'DIRECT_TOOL_CALL: get_player_positions()'
    result = handle_direct_tool_call(message)
    
    assert "response" in result, f"Expected 'response' key, got: {result}"
    print(f"✅ PASS: {result}")

def test_get_system_status():
    """Test get system status direct tool call"""
    print("\n=== Test 6: Get System Status ===")
    message = 'DIRECT_TOOL_CALL: get_system_status()'
    result = handle_direct_tool_call(message)
    
    assert "response" in result, f"Expected 'response' key, got: {result}"
    print(f"✅ PASS: {result}")

def test_invalid_format():
    """Test invalid DIRECT_TOOL_CALL format"""
    print("\n=== Test 7: Invalid Format ===")
    message = 'INVALID_FORMAT: some_function()'
    result = handle_direct_tool_call(message)
    
    assert "error" in result, f"Expected 'error' key, got: {result}"
    assert "Invalid DIRECT_TOOL_CALL format" in result["error"], f"Expected format error, got: {result}"
    print(f"✅ PASS: {result}")

def test_unknown_function():
    """Test unknown function name"""
    print("\n=== Test 8: Unknown Function ===")
    message = 'DIRECT_TOOL_CALL: unknown_function()'
    result = handle_direct_tool_call(message)
    
    assert "error" in result, f"Expected 'error' key, got: {result}"
    assert "Unknown function" in result["error"], f"Expected unknown function error, got: {result}"
    print(f"✅ PASS: {result}")

def test_invalid_parameters():
    """Test invalid parameters for wellbore trajectory"""
    print("\n=== Test 9: Invalid Parameters ===")
    message = 'DIRECT_TOOL_CALL: build_wellbore_trajectory_complete(invalid)'
    result = handle_direct_tool_call(message)
    
    assert "error" in result, f"Expected 'error' key, got: {result}"
    assert "Invalid parameters" in result["error"], f"Expected parameter error, got: {result}"
    print(f"✅ PASS: {result}")

if __name__ == "__main__":
    print("Testing Direct Tool Call Handler")
    print("=" * 50)
    
    try:
        test_wellbore_trajectory()
        test_horizon_surface_with_name()
        test_horizon_surface_without_name()
        test_list_players()
        test_get_player_positions()
        test_get_system_status()
        test_invalid_format()
        test_unknown_function()
        test_invalid_parameters()
        
        print("\n" + "=" * 50)
        print("✅ ALL TESTS PASSED")
        print("=" * 50)
        sys.exit(0)
    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
