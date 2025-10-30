#!/usr/bin/env python3
"""
Unit test for direct tool call parsing logic.

Tests the regex parsing and parameter extraction without requiring full agent dependencies.

Requirements: 3.1, 3.2, 3.3
"""

import re

def parse_direct_tool_call(message: str) -> dict:
    """Parse DIRECT_TOOL_CALL message format.
    
    Returns dict with 'function_name' and 'parameters_str' keys,
    or 'error' key if parsing fails.
    """
    pattern = r'DIRECT_TOOL_CALL:\s*(\w+)\((.*?)\)'
    match = re.match(pattern, message.strip())
    
    if not match:
        return {"error": f"Invalid format: {message}"}
    
    return {
        "function_name": match.group(1),
        "parameters_str": match.group(2).strip()
    }

def extract_well_id(parameters_str: str) -> str:
    """Extract well ID from parameters string."""
    well_id_match = re.search(r'"([^"]+)"', parameters_str)
    if not well_id_match:
        raise ValueError(f"No well ID found in: {parameters_str}")
    return well_id_match.group(1)

def extract_horizon_name(parameters_str: str) -> str:
    """Extract horizon name from parameters string (optional)."""
    if not parameters_str or parameters_str == "None":
        return None
    horizon_name_match = re.search(r'"([^"]+)"', parameters_str)
    if horizon_name_match:
        return horizon_name_match.group(1)
    return None

# Test cases
def test_wellbore_trajectory():
    print("\n=== Test 1: Wellbore Trajectory Parsing ===")
    message = 'DIRECT_TOOL_CALL: build_wellbore_trajectory_complete("WELL-011")'
    result = parse_direct_tool_call(message)
    
    assert "function_name" in result, f"Expected function_name, got: {result}"
    assert result["function_name"] == "build_wellbore_trajectory_complete"
    assert result["parameters_str"] == '"WELL-011"'
    
    well_id = extract_well_id(result["parameters_str"])
    assert well_id == "WELL-011", f"Expected WELL-011, got: {well_id}"
    print(f"✅ PASS: Parsed function={result['function_name']}, well_id={well_id}")

def test_horizon_with_name():
    print("\n=== Test 2: Horizon Surface with Name ===")
    message = 'DIRECT_TOOL_CALL: build_horizon_surface_complete("Top_Reservoir")'
    result = parse_direct_tool_call(message)
    
    assert result["function_name"] == "build_horizon_surface_complete"
    horizon_name = extract_horizon_name(result["parameters_str"])
    assert horizon_name == "Top_Reservoir", f"Expected Top_Reservoir, got: {horizon_name}"
    print(f"✅ PASS: Parsed function={result['function_name']}, horizon_name={horizon_name}")

def test_horizon_without_name():
    print("\n=== Test 3: Horizon Surface without Name ===")
    message = 'DIRECT_TOOL_CALL: build_horizon_surface_complete(None)'
    result = parse_direct_tool_call(message)
    
    assert result["function_name"] == "build_horizon_surface_complete"
    horizon_name = extract_horizon_name(result["parameters_str"])
    assert horizon_name is None, f"Expected None, got: {horizon_name}"
    print(f"✅ PASS: Parsed function={result['function_name']}, horizon_name={horizon_name}")

def test_no_parameters():
    print("\n=== Test 4: Function with No Parameters ===")
    message = 'DIRECT_TOOL_CALL: list_players()'
    result = parse_direct_tool_call(message)
    
    assert result["function_name"] == "list_players"
    assert result["parameters_str"] == ""
    print(f"✅ PASS: Parsed function={result['function_name']}, parameters={result['parameters_str']}")

def test_invalid_format():
    print("\n=== Test 5: Invalid Format ===")
    message = 'INVALID_FORMAT: some_function()'
    result = parse_direct_tool_call(message)
    
    assert "error" in result, f"Expected error, got: {result}"
    print(f"✅ PASS: Correctly detected invalid format")

def test_missing_parentheses():
    print("\n=== Test 6: Missing Parentheses ===")
    message = 'DIRECT_TOOL_CALL: some_function'
    result = parse_direct_tool_call(message)
    
    assert "error" in result, f"Expected error, got: {result}"
    print(f"✅ PASS: Correctly detected missing parentheses")

def test_wellbore_variations():
    print("\n=== Test 7: Wellbore ID Variations ===")
    test_cases = [
        ('DIRECT_TOOL_CALL: build_wellbore_trajectory_complete("WELL-011")', "WELL-011"),
        ('DIRECT_TOOL_CALL: build_wellbore_trajectory_complete("WELL-005")', "WELL-005"),
        ('DIRECT_TOOL_CALL: build_wellbore_trajectory_complete("WELL-123")', "WELL-123"),
    ]
    
    for message, expected_well_id in test_cases:
        result = parse_direct_tool_call(message)
        well_id = extract_well_id(result["parameters_str"])
        assert well_id == expected_well_id, f"Expected {expected_well_id}, got: {well_id}"
        print(f"  ✅ {expected_well_id}: Parsed correctly")
    
    print(f"✅ PASS: All wellbore variations parsed correctly")

def test_function_name_extraction():
    print("\n=== Test 8: All Function Names ===")
    functions = [
        "build_wellbore_trajectory_complete",
        "build_horizon_surface_complete",
        "list_players",
        "get_player_positions",
        "get_system_status"
    ]
    
    for func_name in functions:
        message = f'DIRECT_TOOL_CALL: {func_name}()'
        result = parse_direct_tool_call(message)
        assert result["function_name"] == func_name, f"Expected {func_name}, got: {result['function_name']}"
        print(f"  ✅ {func_name}: Parsed correctly")
    
    print(f"✅ PASS: All function names parsed correctly")

if __name__ == "__main__":
    print("Testing Direct Tool Call Parsing Logic")
    print("=" * 60)
    
    try:
        test_wellbore_trajectory()
        test_horizon_with_name()
        test_horizon_without_name()
        test_no_parameters()
        test_invalid_format()
        test_missing_parentheses()
        test_wellbore_variations()
        test_function_name_extraction()
        
        print("\n" + "=" * 60)
        print("✅ ALL PARSING TESTS PASSED")
        print("=" * 60)
        print("\nThe direct tool call handler parsing logic is working correctly.")
        print("It can parse all supported function calls and extract parameters.")
    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {e}")
        exit(1)
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        exit(1)
