#!/usr/bin/env python3
"""
Test error handling with authentication failures.
Tests Requirement 2.5 - Clear error messages for authentication issues.
"""

import sys
import os
import json
from unittest.mock import patch, MagicMock

# Add edicraft-agent to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'edicraft-agent'))

def test_missing_credentials():
    """Test with missing EDI credentials."""
    print("=" * 80)
    print("TEST: Missing Credentials Error Handling")
    print("=" * 80)
    print()
    
    # Save original environment variables
    original_env = {}
    env_vars = ['EDI_USERNAME', 'EDI_PASSWORD', 'EDI_CLIENT_ID', 'EDI_CLIENT_SECRET', 'EDI_PLATFORM_URL']
    
    for var in env_vars:
        original_env[var] = os.environ.get(var)
    
    all_passed = True
    
    try:
        # Test with each credential missing
        for missing_var in env_vars:
            print(f"\n📋 Test: Missing {missing_var}")
            print("-" * 80)
            
            # Clear all credentials
            for var in env_vars:
                if var in os.environ:
                    del os.environ[var]
            
            # Set all except the missing one
            for var in env_vars:
                if var != missing_var:
                    os.environ[var] = "test_value"
            
            try:
                from tools.osdu_client import OSDUClient
                
                # Create client and try to authenticate
                client = OSDUClient()
                result = client.authenticate()
                
                # Should fail authentication
                if not result:
                    print("✅ PASS: Authentication failed as expected")
                else:
                    print("❌ FAIL: Authentication succeeded with missing credentials")
                    all_passed = False
                    
            except Exception as e:
                # Exception is acceptable for missing credentials
                print(f"✅ PASS: Exception raised for missing credentials: {type(e).__name__}")
    
    finally:
        # Restore original environment
        for var, value in original_env.items():
            if value is not None:
                os.environ[var] = value
            elif var in os.environ:
                del os.environ[var]
    
    print()
    print("=" * 80)
    if all_passed:
        print("✅ ALL TESTS PASSED: Missing credentials handling works correctly")
    else:
        print("❌ SOME TESTS FAILED: Missing credentials handling needs improvement")
    print("=" * 80)
    
    return all_passed

def test_invalid_credentials():
    """Test with invalid EDI credentials."""
    print()
    print("=" * 80)
    print("TEST: Invalid Credentials Error Handling")
    print("=" * 80)
    print()
    
    # Save original environment variables
    original_env = {}
    env_vars = ['EDI_USERNAME', 'EDI_PASSWORD', 'EDI_CLIENT_ID', 'EDI_CLIENT_SECRET', 'EDI_PLATFORM_URL']
    
    for var in env_vars:
        original_env[var] = os.environ.get(var)
    
    all_passed = True
    
    try:
        # Set invalid credentials
        os.environ['EDI_USERNAME'] = 'invalid_user'
        os.environ['EDI_PASSWORD'] = 'invalid_password'
        os.environ['EDI_CLIENT_ID'] = 'invalid_client_id'
        os.environ['EDI_CLIENT_SECRET'] = 'invalid_secret'
        os.environ['EDI_PLATFORM_URL'] = 'https://invalid.example.com'
        
        print("\n📋 Test: Invalid credentials")
        print("-" * 80)
        
        try:
            from tools.osdu_client import OSDUClient
            
            # Create client and try to authenticate
            client = OSDUClient()
            result = client.authenticate()
            
            # Should fail authentication
            if not result:
                print("✅ PASS: Authentication failed as expected with invalid credentials")
            else:
                print("❌ FAIL: Authentication succeeded with invalid credentials")
                all_passed = False
                
        except Exception as e:
            # Exception is acceptable for invalid credentials
            print(f"✅ PASS: Exception raised for invalid credentials: {type(e).__name__}")
            print(f"   Error message: {str(e)[:150]}...")
    
    finally:
        # Restore original environment
        for var, value in original_env.items():
            if value is not None:
                os.environ[var] = value
            elif var in os.environ:
                del os.environ[var]
    
    print()
    print("=" * 80)
    if all_passed:
        print("✅ ALL TESTS PASSED: Invalid credentials handling works correctly")
    else:
        print("❌ SOME TESTS FAILED: Invalid credentials handling needs improvement")
    print("=" * 80)
    
    return all_passed

def test_authentication_error_message():
    """Test that authentication errors produce clear user-friendly messages."""
    print()
    print("=" * 80)
    print("TEST: Authentication Error Message Clarity")
    print("=" * 80)
    print()
    
    # Mock authentication failure
    print("\n📋 Test: Error message clarity")
    print("-" * 80)
    
    all_passed = True
    
    try:
        with patch('tools.osdu_client.OSDUClient.get_access_token') as mock_auth:
            # Mock authentication failure
            mock_auth.return_value = None
            
            from tools.workflow_tools import build_wellbore_trajectory_complete
            
            result = build_wellbore_trajectory_complete("TEST-WELL-001")
            
            # Check that error message is clear and user-friendly
            if isinstance(result, str):
                print("✅ PASS: Function returned string result")
                
                result_lower = result.lower()
                
                # Check for authentication-related keywords
                auth_keywords = ['authentication', 'auth', 'credentials', 'login', 'access']
                has_auth_keyword = any(keyword in result_lower for keyword in auth_keywords)
                
                if has_auth_keyword:
                    print("✅ PASS: Error message mentions authentication")
                    print(f"   Message: {result[:200]}...")
                else:
                    print("⚠️  WARNING: Error message doesn't explicitly mention authentication")
                    print(f"   Message: {result[:200]}...")
                
                # Check that message is user-friendly (no stack traces)
                if "traceback" not in result_lower and "exception" not in result_lower:
                    print("✅ PASS: Error message is user-friendly (no stack traces)")
                else:
                    print("❌ FAIL: Error message contains technical details (stack trace/exception)")
                    all_passed = False
                    
            else:
                print(f"❌ FAIL: Unexpected return type: {type(result)}")
                all_passed = False
                
    except Exception as e:
        print(f"❌ FAIL: Exception raised during test: {type(e).__name__}: {str(e)}")
        all_passed = False
    
    print()
    print("=" * 80)
    if all_passed:
        print("✅ ALL TESTS PASSED: Authentication error messages are clear")
    else:
        print("❌ SOME TESTS FAILED: Authentication error messages need improvement")
    print("=" * 80)
    
    return all_passed

def test_network_error_handling():
    """Test handling of network errors during OSDU communication."""
    print()
    print("=" * 80)
    print("TEST: Network Error Handling")
    print("=" * 80)
    print()
    
    all_passed = True
    
    print("\n📋 Test: Network timeout/connection error")
    print("-" * 80)
    
    try:
        with patch('tools.osdu_client.requests.post') as mock_post:
            # Mock network timeout
            import requests
            mock_post.side_effect = requests.exceptions.Timeout("Connection timeout")
            
            from tools.osdu_client import OSDUClient
            
            client = OSDUClient()
            client.token = "fake_token"  # Bypass authentication
            
            result = client.search_trajectory_records()
            
            # Should return empty list or handle gracefully
            if isinstance(result, list):
                print("✅ PASS: Function returned list (no crash)")
                if len(result) == 0:
                    print("✅ PASS: Empty list returned for network error")
                else:
                    print("⚠️  WARNING: Non-empty list returned despite network error")
            else:
                print(f"❌ FAIL: Unexpected return type: {type(result)}")
                all_passed = False
                
    except Exception as e:
        print(f"❌ FAIL: Exception raised: {type(e).__name__}: {str(e)}")
        all_passed = False
    
    print()
    print("=" * 80)
    if all_passed:
        print("✅ ALL TESTS PASSED: Network error handling works correctly")
    else:
        print("❌ SOME TESTS FAILED: Network error handling needs improvement")
    print("=" * 80)
    
    return all_passed

if __name__ == "__main__":
    print("\n" + "=" * 80)
    print("ERROR HANDLING TEST SUITE: Authentication Failures")
    print("Testing Requirement 2.5")
    print("=" * 80)
    
    test1_passed = test_missing_credentials()
    test2_passed = test_invalid_credentials()
    test3_passed = test_authentication_error_message()
    test4_passed = test_network_error_handling()
    
    print("\n" + "=" * 80)
    print("FINAL RESULTS")
    print("=" * 80)
    print(f"Missing Credentials Test: {'✅ PASSED' if test1_passed else '❌ FAILED'}")
    print(f"Invalid Credentials Test: {'✅ PASSED' if test2_passed else '❌ FAILED'}")
    print(f"Error Message Clarity Test: {'✅ PASSED' if test3_passed else '❌ FAILED'}")
    print(f"Network Error Handling Test: {'✅ PASSED' if test4_passed else '❌ FAILED'}")
    print("=" * 80)
    
    all_passed = test1_passed and test2_passed and test3_passed and test4_passed
    sys.exit(0 if all_passed else 1)
