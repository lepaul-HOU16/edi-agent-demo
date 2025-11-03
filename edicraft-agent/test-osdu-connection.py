#!/usr/bin/env python3
"""
Test OSDU Platform Connection
Usage: python test-osdu-connection.py
"""

import os
import sys
import requests
from requests.auth import HTTPBasicAuth

def test_osdu_connection(username, password, client_id, client_secret, platform_url, partition):
    """Test OSDU platform authentication and basic connectivity."""
    
    print("Testing OSDU Platform connection...")
    print(f"Platform URL: {platform_url}")
    print(f"Partition: {partition}")
    print(f"Username: {username}")
    print("")
    
    # Test 1: Platform reachability
    print("Test 1: Checking platform reachability...")
    try:
        response = requests.get(f"{platform_url}/api/os-wellbore/v3/", timeout=10)
        print(f"✅ Platform is reachable (Status: {response.status_code})")
    except requests.exceptions.RequestException as e:
        print(f"❌ Cannot reach platform: {e}")
        return False
    
    # Test 2: Authentication
    print("\nTest 2: Testing authentication...")
    try:
        # Try OAuth token endpoint (common pattern)
        token_url = f"{platform_url}/oauth/token"
        
        auth_data = {
            "grant_type": "password",
            "username": username,
            "password": password,
            "client_id": client_id,
            "client_secret": client_secret
        }
        
        response = requests.post(
            token_url,
            data=auth_data,
            timeout=10
        )
        
        if response.status_code == 200:
            token_data = response.json()
            print("✅ Authentication successful!")
            print(f"   Access token received (length: {len(token_data.get('access_token', ''))})")
            return True
        else:
            print(f"❌ Authentication failed (Status: {response.status_code})")
            print(f"   Response: {response.text[:200]}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Authentication error: {e}")
        return False

def main():
    """Main function to test OSDU credentials."""
    
    print("=" * 60)
    print("OSDU Platform Connection Test")
    print("=" * 60)
    print("")
    
    # Get credentials from environment or prompt
    username = os.getenv("EDI_USERNAME") or input("EDI_USERNAME: ")
    password = os.getenv("EDI_PASSWORD") or input("EDI_PASSWORD: ")
    client_id = os.getenv("EDI_CLIENT_ID") or input("EDI_CLIENT_ID: ")
    client_secret = os.getenv("EDI_CLIENT_SECRET") or input("EDI_CLIENT_SECRET: ")
    partition = os.getenv("EDI_PARTITION") or input("EDI_PARTITION: ")
    platform_url = os.getenv("EDI_PLATFORM_URL") or input("EDI_PLATFORM_URL: ")
    
    # Validate inputs
    if not all([username, password, client_id, client_secret, partition, platform_url]):
        print("❌ Missing required credentials!")
        print("")
        print("Please provide all of:")
        print("  - EDI_USERNAME")
        print("  - EDI_PASSWORD")
        print("  - EDI_CLIENT_ID")
        print("  - EDI_CLIENT_SECRET")
        print("  - EDI_PARTITION")
        print("  - EDI_PLATFORM_URL")
        sys.exit(1)
    
    # Run tests
    success = test_osdu_connection(
        username, password, client_id, client_secret, platform_url, partition
    )
    
    print("")
    print("=" * 60)
    if success:
        print("✅ ALL TESTS PASSED!")
        print("")
        print("Your OSDU credentials are correct. Add them to config.ini:")
        print(f'EDI_USERNAME={username}')
        print(f'EDI_PASSWORD={password}')
        print(f'EDI_CLIENT_ID={client_id}')
        print(f'EDI_CLIENT_SECRET={client_secret}')
        print(f'EDI_PARTITION={partition}')
        print(f'EDI_PLATFORM_URL={platform_url}')
    else:
        print("❌ TESTS FAILED!")
        print("")
        print("Please check:")
        print("1. Credentials are correct")
        print("2. Platform URL is accessible")
        print("3. User has necessary permissions")
        print("4. OAuth endpoint is correct for your platform")
    print("=" * 60)

if __name__ == "__main__":
    main()
