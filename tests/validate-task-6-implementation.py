#!/usr/bin/env python3
"""
Task 6 Implementation Validation
Validates that all components for the complete workflow test are in place.
"""

import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'edicraft-agent'))


def print_section(title):
    """Print a formatted section header."""
    print(f"\n{'='*80}")
    print(f"  {title}")
    print(f"{'='*80}\n")


def check_file_exists(filepath, description):
    """Check if a file exists and report result."""
    if os.path.exists(filepath):
        print(f"✓ {description}")
        return True
    else:
        print(f"✗ {description} - NOT FOUND")
        return False


def check_import(module_path, class_or_function, description):
    """Check if a module can be imported."""
    try:
        parts = module_path.split('.')
        module = __import__(module_path)
        for part in parts[1:]:
            module = getattr(module, part)
        
        if hasattr(module, class_or_function):
            print(f"✓ {description}")
            return True
        else:
            print(f"✗ {description} - {class_or_function} not found")
            return False
    except ImportError as e:
        print(f"✗ {description} - Import failed: {e}")
        return False
    except Exception as e:
        print(f"✗ {description} - Error: {e}")
        return False


def check_function_signature(module_path, function_name, expected_params):
    """Check if a function has expected parameters."""
    try:
        parts = module_path.split('.')
        module = __import__(module_path)
        for part in parts[1:]:
            module = getattr(module, part)
        
        func = getattr(module, function_name)
        
        import inspect
        sig = inspect.signature(func)
        params = list(sig.parameters.keys())
        
        missing_params = [p for p in expected_params if p not in params]
        
        if not missing_params:
            print(f"✓ {function_name} has all expected parameters")
            return True
        else:
            print(f"✗ {function_name} missing parameters: {missing_params}")
            return False
            
    except Exception as e:
        print(f"✗ Error checking {function_name}: {e}")
        return False


def main():
    """Validate Task 6 implementation."""
    print_section("TASK 6 IMPLEMENTATION VALIDATION")
    
    print("This validation checks that all components for the complete")
    print("clear and restore workflow test are properly implemented.")
    
    all_checks_passed = True
    
    # ========================================================================
    # CHECK 1: Test File Exists
    # ========================================================================
    print_section("CHECK 1: TEST FILE EXISTS")
    
    test_file = "tests/test-complete-clear-workflow.py"
    if not check_file_exists(test_file, "Complete workflow test file"):
        all_checks_passed = False
    
    doc_file = "tests/TASK_6_COMPLETE_WORKFLOW_TEST.md"
    if not check_file_exists(doc_file, "Test documentation file"):
        all_checks_passed = False
    
    # ========================================================================
    # CHECK 2: Core Implementation Files
    # ========================================================================
    print_section("CHECK 2: CORE IMPLEMENTATION FILES")
    
    files_to_check = [
        ("edicraft-agent/tools/clear_environment_tool.py", "Clear environment tool"),
        ("edicraft-agent/tools/rcon_executor.py", "RCON executor"),
        ("edicraft-agent/tools/workflow_tools.py", "Workflow tools"),
        ("edicraft-agent/tools/horizon_tools.py", "Horizon tools"),
        ("edicraft-agent/config.py", "Configuration module"),
    ]
    
    for filepath, description in files_to_check:
        if not check_file_exists(filepath, description):
            all_checks_passed = False
    
    # ========================================================================
    # CHECK 3: Required Classes and Functions
    # ========================================================================
    print_section("CHECK 3: REQUIRED CLASSES AND FUNCTIONS")
    
    imports_to_check = [
        ("tools.clear_environment_tool", "ClearEnvironmentTool", "ClearEnvironmentTool class"),
        ("tools.clear_environment_tool", "ChunkClearResult", "ChunkClearResult dataclass"),
        ("tools.clear_environment_tool", "ClearOperationResult", "ClearOperationResult dataclass"),
        ("tools.rcon_executor", "RCONExecutor", "RCONExecutor class"),
        ("tools.rcon_executor", "RCONResult", "RCONResult dataclass"),
        ("tools.workflow_tools", "build_wellbore_trajectory_complete", "Build wellbore workflow"),
        ("tools.workflow_tools", "build_horizon_surface_complete", "Build horizon workflow"),
        ("tools.workflow_tools", "clear_minecraft_environment", "Clear environment workflow"),
        ("tools.horizon_tools", "search_horizons_live", "Search horizons function"),
        ("tools.horizon_tools", "build_horizon_in_minecraft", "Build horizon function"),
        ("config", "EDIcraftConfig", "EDIcraftConfig class"),
    ]
    
    for module_path, item, description in imports_to_check:
        if not check_import(module_path, item, description):
            all_checks_passed = False
    
    # ========================================================================
    # CHECK 4: ClearEnvironmentTool Methods
    # ========================================================================
    print_section("CHECK 4: CLEARENVIRONMENTTOOL METHODS")
    
    try:
        from tools.clear_environment_tool import ClearEnvironmentTool
        
        methods_to_check = [
            ("clear_minecraft_environment", "Main clear method"),
            ("_calculate_chunks", "Chunk calculation method"),
            ("_clear_chunk", "Single chunk clear method"),
            ("_clear_chunk_with_retry", "Chunk retry logic method"),
            ("_format_clear_response", "Response formatting method"),
            ("_create_rcon_executor", "RCON executor creation method"),
        ]
        
        for method_name, description in methods_to_check:
            if hasattr(ClearEnvironmentTool, method_name):
                print(f"✓ {description} ({method_name})")
            else:
                print(f"✗ {description} ({method_name}) - NOT FOUND")
                all_checks_passed = False
                
    except Exception as e:
        print(f"✗ Error checking ClearEnvironmentTool methods: {e}")
        all_checks_passed = False
    
    # ========================================================================
    # CHECK 5: RCONExecutor Methods
    # ========================================================================
    print_section("CHECK 5: RCONEXECUTOR METHODS")
    
    try:
        from tools.rcon_executor import RCONExecutor
        
        methods_to_check = [
            ("execute_command", "Command execution method", True),
            ("verify_gamerule", "Gamerule verification method", True),
            ("_parse_blocks_affected", "Block count parsing method", False),  # Optional
        ]
        
        for method_name, description, required in methods_to_check:
            if hasattr(RCONExecutor, method_name):
                print(f"✓ {description} ({method_name})")
            else:
                if required:
                    print(f"✗ {description} ({method_name}) - NOT FOUND")
                    all_checks_passed = False
                else:
                    print(f"⚠ {description} ({method_name}) - NOT FOUND (optional)")
                
    except Exception as e:
        print(f"✗ Error checking RCONExecutor methods: {e}")
        all_checks_passed = False
    
    # ========================================================================
    # CHECK 6: Configuration Parameters
    # ========================================================================
    print_section("CHECK 6: CONFIGURATION PARAMETERS")
    
    try:
        from config import EDIcraftConfig
        
        # Create a test config instance
        config = EDIcraftConfig()
        
        params_to_check = [
            ("minecraft_host", "Minecraft host"),
            ("minecraft_rcon_port", "RCON port"),
            ("minecraft_rcon_password", "RCON password"),
        ]
        
        for param_name, description in params_to_check:
            if hasattr(config, param_name):
                value = getattr(config, param_name)
                print(f"✓ {description} ({param_name}): {value}")
            else:
                print(f"✗ {description} ({param_name}) - NOT FOUND")
                all_checks_passed = False
                
    except Exception as e:
        print(f"✗ Error checking configuration: {e}")
        all_checks_passed = False
    
    # ========================================================================
    # CHECK 7: Test File Structure
    # ========================================================================
    print_section("CHECK 7: TEST FILE STRUCTURE")
    
    try:
        with open(test_file, 'r') as f:
            test_content = f.read()
        
        required_sections = [
            ("PHASE 1: BUILD TEST STRUCTURES", "Build test structures phase"),
            ("PHASE 2: VERIFY STRUCTURES EXIST", "Pre-clear verification phase"),
            ("PHASE 3: EXECUTE CHUNK-BASED CLEAR", "Clear operation phase"),
            ("PHASE 4: VERIFY BLOCKS REMOVED", "Post-clear verification phase"),
            ("PHASE 5: VERIFY GROUND RESTORED", "Ground restoration verification phase"),
            ("PHASE 6: VERIFY TIMEOUT COMPLIANCE", "Timeout compliance check phase"),
            ("PHASE 7: CHECK FOR REMAINING ARTIFACTS", "Artifact check phase"),
            ("TEST SUMMARY", "Test summary phase"),
        ]
        
        for section_text, description in required_sections:
            if section_text in test_content:
                print(f"✓ {description}")
            else:
                print(f"✗ {description} - NOT FOUND")
                all_checks_passed = False
                
    except Exception as e:
        print(f"✗ Error checking test file structure: {e}")
        all_checks_passed = False
    
    # ========================================================================
    # CHECK 8: Test Helper Functions
    # ========================================================================
    print_section("CHECK 8: TEST HELPER FUNCTIONS")
    
    try:
        with open(test_file, 'r') as f:
            test_content = f.read()
        
        helper_functions = [
            ("def verify_blocks_exist", "Block existence verification"),
            ("def verify_ground_restored", "Ground restoration verification"),
            ("def print_section", "Section header printing"),
        ]
        
        for func_signature, description in helper_functions:
            if func_signature in test_content:
                print(f"✓ {description}")
            else:
                print(f"✗ {description} - NOT FOUND")
                all_checks_passed = False
                
    except Exception as e:
        print(f"✗ Error checking helper functions: {e}")
        all_checks_passed = False
    
    # ========================================================================
    # FINAL SUMMARY
    # ========================================================================
    print_section("VALIDATION SUMMARY")
    
    if all_checks_passed:
        print("✓✓✓ ALL VALIDATION CHECKS PASSED ✓✓✓")
        print("\nTask 6 implementation is complete and ready for testing!")
        print("\nNext steps:")
        print("1. Start Minecraft server with RCON enabled")
        print("2. Run: python3 tests/test-complete-clear-workflow.py")
        print("3. Verify all test phases pass")
        print("4. Mark Task 6 as complete")
        return True
    else:
        print("✗✗✗ SOME VALIDATION CHECKS FAILED ✗✗✗")
        print("\nPlease fix the issues above before running the test.")
        return False


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
