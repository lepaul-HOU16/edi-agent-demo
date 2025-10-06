#!/usr/bin/env python3
"""
Quick test to verify S3 access before starting MCP server
"""
import boto3
from botocore.exceptions import ClientError, NoCredentialsError

def test_s3_access():
    """Test S3 access and show available wells"""
    S3_BUCKET = "amplify-d1eeg2gu6ddc3z-ma-workshopstoragebucketd9b-lzf4vwokty7m"
    S3_PREFIX = "global/well-data/"
    
    print("🧪 Testing S3 Access for MCP Server")
    print("=" * 50)
    
    try:
        # Test AWS credentials
        sts = boto3.client('sts')
        identity = sts.get_caller_identity()
        print(f"✅ AWS Identity: {identity.get('Arn', 'Unknown')}")
        
        # Test S3 access
        s3 = boto3.client('s3')
        response = s3.list_objects_v2(
            Bucket=S3_BUCKET,
            Prefix=S3_PREFIX,
            MaxKeys=50
        )
        
        if 'Contents' not in response:
            print(f"❌ No files found in S3 bucket")
            return False
        
        las_files = [obj['Key'] for obj in response['Contents'] if obj['Key'].endswith('.las')]
        print(f"✅ S3 Bucket Access: {S3_BUCKET}")
        print(f"✅ Found {len(las_files)} .las files")
        
        # Show first few wells
        print("\n📊 Available Wells:")
        for i, s3_key in enumerate(las_files[:10]):
            filename = s3_key.split('/')[-1]
            well_name = filename.replace('.las', '')
            size_mb = next(obj['Size'] for obj in response['Contents'] if obj['Key'] == s3_key) / 1024 / 1024
            print(f"   {i+1:2d}. {well_name} ({size_mb:.1f} MB)")
        
        if len(las_files) > 10:
            print(f"   ... and {len(las_files) - 10} more wells")
        
        print(f"\n🎯 Ready to start MCP server with {len(las_files)} wells!")
        return True
        
    except NoCredentialsError:
        print("❌ AWS credentials not found")
        print("   Run: isen assume lepaul+fedev")
        return False
    except ClientError as e:
        print(f"❌ AWS error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

if __name__ == "__main__":
    success = test_s3_access()
    
    print("\n" + "=" * 50)
    if success:
        print("✅ S3 access verified!")
        print("\nNext steps:")
        print("1. Enable 'petrophysical-analysis' MCP server in Kiro")
        print("2. Test with: 'List available wells'")
        print("3. Analyze with: 'Calculate porosity for WELL-001'")
    else:
        print("❌ S3 access failed")
        print("\nTroubleshooting:")
        print("1. Run: isen assume lepaul+fedev")
        print("2. Try this test again")
        print("3. Then enable MCP server in Kiro")