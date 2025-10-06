#!/usr/bin/env python3
"""
Test script to verify MCP server can connect to S3 and load .las files
"""
import sys
import os
import boto3
from botocore.exceptions import ClientError, NoCredentialsError

# Test S3 connection
S3_BUCKET = "amplify-digitalassistant--workshopstoragebucketd9b-rcaqefdiubbv"
S3_PREFIX = "global/well-data/"
AWS_REGION = "us-east-1"

def test_s3_connection():
    """Test S3 connection and list .las files"""
    try:
        s3_client = boto3.client('s3', region_name=AWS_REGION)
        
        # Test bucket access
        s3_client.head_bucket(Bucket=S3_BUCKET)
        print(f"✓ Successfully connected to S3 bucket: {S3_BUCKET}")
        
        # List .las files
        response = s3_client.list_objects_v2(
            Bucket=S3_BUCKET,
            Prefix=S3_PREFIX
        )
        
        if 'Contents' not in response:
            print(f"✗ No files found in S3 bucket {S3_BUCKET} with prefix {S3_PREFIX}")
            return False
        
        las_files = [obj['Key'] for obj in response['Contents'] if obj['Key'].endswith('.las')]
        print(f"✓ Found {len(las_files)} .las files in S3:")
        
        for s3_key in las_files:
            filename = os.path.basename(s3_key)
            size = next(obj['Size'] for obj in response['Contents'] if obj['Key'] == s3_key)
            print(f"   - {filename} ({size} bytes)")
        
        # Test downloading one file
        if las_files:
            test_file = las_files[0]
            print(f"\n✓ Testing download of {test_file}...")
            
            response = s3_client.get_object(Bucket=S3_BUCKET, Key=test_file)
            content = response['Body'].read().decode('utf-8')
            
            lines = content.split('\n')[:10]  # First 10 lines
            print(f"✓ Successfully downloaded {len(content)} characters")
            print("✓ First 10 lines:")
            for i, line in enumerate(lines, 1):
                print(f"   {i:2d}: {line[:80]}{'...' if len(line) > 80 else ''}")
        
        return True
        
    except NoCredentialsError:
        print("✗ AWS credentials not found. Please configure AWS credentials.")
        print("   Try: aws configure")
        return False
    except ClientError as e:
        print(f"✗ Error connecting to S3: {e}")
        return False
    except Exception as e:
        print(f"✗ Unexpected error: {e}")
        return False

def test_mcp_server_imports():
    """Test that all MCP server dependencies are available"""
    try:
        from mcp.server import Server
        from mcp.types import Tool, TextContent
        import pandas as pd
        import numpy as np
        from petrophysics_calculators import PorosityCalculator
        from data_quality_assessment import DataQualityAssessment
        print("✓ All MCP server dependencies imported successfully")
        return True
    except ImportError as e:
        print(f"✗ Import error: {e}")
        return False

if __name__ == "__main__":
    print("Testing S3 MCP Server Configuration")
    print("=" * 50)
    
    # Test imports
    print("\n1. Testing imports...")
    imports_ok = test_mcp_server_imports()
    
    # Test S3 connection
    print("\n2. Testing S3 connection...")
    s3_ok = test_s3_connection()
    
    print("\n" + "=" * 50)
    if imports_ok and s3_ok:
        print("✅ All tests passed! MCP server should work with S3.")
        print("\nNext steps:")
        print("1. The MCP server is configured to connect to S3")
        print("2. Restart Kiro to reconnect the MCP server")
        print("3. Test the MCP tools in chat")
    else:
        print("❌ Some tests failed. Please fix the issues above.")
        if not imports_ok:
            print("   - Fix import issues")
        if not s3_ok:
            print("   - Fix S3 connection issues")