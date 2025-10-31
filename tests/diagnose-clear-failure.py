#!/usr/bin/env python3
"""
Diagnose Clear Operation Failure
Tests the clear environment operation and provides detailed error information.
"""

import sys
import os

# Add edicraft-agent to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'edicraft-agent'))

try:
    from tools.rcon_executor import RCONExecutor
    from tools.clear_environment_tool import ClearEnvironmentTool
    from config import EDIcraftConfig
    
    print("=" * 60)
    print("Clear Operation Failure Diagnosis")
    print("=" * 60)
    print()
    
    # Load configuration
    print("1. Loading configuration...")
    try:
        config = EDIcraftConfig()
        print(f"   ✓ Configuration loaded")
        print(f"   - Minecraft Host: {config.minecraft_host}")
        print(f"   - RCON Port: {config.minecraft_rcon_port}")
        print(f"   - Password: {'*' * len(config.minecraft_rcon_password) if config.minecraft_rcon_password else 'NOT SET'}")
    except Exception as e:
        print(f"   ✗ Configuration failed: {str(e)}")
        sys.exit(1)
    
    print()
    
    # Test RCON connection
    print("2. Testing RCON connection...")
    try:
        executor = RCONExecutor(
            host=config.minecraft_host,
            port=config.minecraft_rcon_port,
            password=config.minecraft_rcon_password,
            timeout=10,
            max_retries=3
        )
        
        result = executor.execute_command("list")
        
        if result.success:
            print(f"   ✓ RCON connection successful")
            print(f"   - Response: {result.response}")
        else:
            print(f"   ✗ RCON connection failed")
            print(f"   - Error: {result.error}")
            sys.exit(1)
            
    except Exception as e:
        print(f"   ✗ RCON connection exception: {str(e)}")
        print(f"   - Type: {type(e).__name__}")
        print(f"   - Details: {str(e)}")
        sys.exit(1)
    
    print()
    
    # Test clear environment tool initialization
    print("3. Testing clear environment tool initialization...")
    try:
        clear_tool = ClearEnvironmentTool(config)
        print(f"   ✓ Clear tool initialized")
        print(f"   - Clear region: {clear_tool.clear_region}")
    except Exception as e:
        print(f"   ✗ Clear tool initialization failed: {str(e)}")
        sys.exit(1)
    
    print()
    
    # Test small clear operation
    print("4. Testing small clear operation...")
    try:
        # Test clearing a small area
        test_result = executor.execute_fill(
            0, 65, 0,
            10, 70, 10,
            'air',
            replace='obsidian'
        )
        
        if test_result.success:
            print(f"   ✓ Small clear test successful")
            print(f"   - Blocks affected: {test_result.blocks_affected}")
            print(f"   - Execution time: {test_result.execution_time:.2f}s")
        else:
            print(f"   ✗ Small clear test failed")
            print(f"   - Error: {test_result.error}")
            
    except Exception as e:
        print(f"   ✗ Small clear test exception: {str(e)}")
    
    print()
    
    # Test full clear operation
    print("5. Testing full clear operation...")
    try:
        result = clear_tool.clear_minecraft_environment(
            area="all",
            preserve_terrain=True
        )
        
        print(f"   Result:")
        print(f"   {result}")
        
        if "✅" in result or "success" in result.lower():
            print()
            print("   ✓ Clear operation successful!")
        else:
            print()
            print("   ✗ Clear operation failed")
            
    except Exception as e:
        print(f"   ✗ Clear operation exception: {str(e)}")
        print(f"   - Type: {type(e).__name__}")
        import traceback
        print(f"   - Traceback:")
        traceback.print_exc()
    
    print()
    print("=" * 60)
    print("Diagnosis Complete")
    print("=" * 60)
    
except ImportError as e:
    print(f"Import error: {str(e)}")
    print("Make sure you're running this from the project root directory")
    sys.exit(1)
