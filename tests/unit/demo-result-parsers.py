#!/usr/bin/env python3
"""
Demo script showing RCON result parsers in action.
"""

import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'edicraft-agent'))

from tools.rcon_executor import RCONExecutor


def demo_parsers():
    """Demonstrate the result parsers with example responses."""
    
    executor = RCONExecutor(
        host='localhost',
        port=25575,
        password='test_password'
    )
    
    print("=" * 70)
    print("RCON Result Parsers Demo")
    print("=" * 70)
    print()
    
    # Demo 1: Fill Response Parsing
    print("1. FILL RESPONSE PARSING")
    print("-" * 70)
    
    fill_responses = [
        "Successfully filled 1234 blocks",
        "Filled 5678 blocks with grass_block",
        "FILLED 999 BLOCKS WITH STONE",
        "Command executed",  # No block count
    ]
    
    for response in fill_responses:
        blocks = executor._parse_fill_response(response)
        print(f"Response: {response}")
        print(f"  → Blocks filled: {blocks}")
        print()
    
    # Demo 2: Gamerule Response Parsing
    print("2. GAMERULE RESPONSE PARSING")
    print("-" * 70)
    
    gamerule_responses = [
        "Gamerule doDaylightCycle is currently set to: false",
        "Gamerule keepInventory is currently set to: true",
        "Gamerule randomTickSpeed is currently set to: 3",
        "Unknown gamerule",  # No value
    ]
    
    for response in gamerule_responses:
        value = executor._parse_gamerule_response(response)
        print(f"Response: {response}")
        print(f"  → Gamerule value: {value}")
        print()
    
    # Demo 3: Success Detection
    print("3. SUCCESS/FAILURE DETECTION")
    print("-" * 70)
    
    test_responses = [
        ("Successfully filled 100 blocks", "Success"),
        ("Teleported player to location", "Success"),
        ("Error: Invalid command", "Error"),
        ("Failed to execute", "Error"),
        ("Unknown block type", "Error"),
        ("Command executed", "Success (ambiguous)"),
        ("", "Error (empty)"),
    ]
    
    for response, expected_type in test_responses:
        is_success = executor._is_success_response(response)
        status = "✅ SUCCESS" if is_success else "❌ FAILURE"
        print(f"Response: {response or '(empty)'}")
        print(f"  → Detected as: {status} ({expected_type})")
        print()
    
    # Demo 4: Real Minecraft Responses
    print("4. REAL MINECRAFT SERVER RESPONSES")
    print("-" * 70)
    
    real_responses = [
        {
            'command': 'fill 0 60 0 10 70 10 stone',
            'response': 'Successfully filled 1331 blocks',
        },
        {
            'command': 'fill 0 0 0 100 100 100 air replace stone',
            'response': 'Filled 1030301 blocks with air',
        },
        {
            'command': 'gamerule doDaylightCycle',
            'response': 'Gamerule doDaylightCycle is currently set to: false',
        },
        {
            'command': 'fill 0 0 0 10 10 10 invalid_block',
            'response': 'Error: Unknown block type: invalid_block',
        },
    ]
    
    for test_case in real_responses:
        command = test_case['command']
        response = test_case['response']
        
        print(f"Command: {command}")
        print(f"Response: {response}")
        
        # Parse response
        is_success = executor._is_success_response(response)
        blocks = executor._parse_fill_response(response)
        gamerule = executor._parse_gamerule_response(response)
        
        print(f"  → Success: {is_success}")
        if blocks > 0:
            print(f"  → Blocks filled: {blocks:,}")
        if gamerule:
            print(f"  → Gamerule value: {gamerule}")
        print()
    
    print("=" * 70)
    print("Demo complete!")
    print("=" * 70)


if __name__ == '__main__':
    demo_parsers()
